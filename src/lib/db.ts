import { PrismaClient } from '@prisma/client'
import { PrismaNeon } from '@prisma/adapter-neon'
import { getCloudflareContext } from '@opennextjs/cloudflare'

// ── Accès à la base de données ───────────────────────────────
// Netlify / Node : un seul client Prisma, comme avant.
// Cloudflare Workers : la base Neon est jointe par WebSocket et une connexion
// ne peut pas servir à deux requêtes différentes. On crée donc un client par
// requête (mis en cache le temps de la requête).

const surCloudflare =
  typeof navigator !== 'undefined' && navigator.userAgent === 'Cloudflare-Workers'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function clientNode(): PrismaClient {
  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = new PrismaClient({
      log: process.env.NODE_ENV === 'production' ? ['error'] : ['query'],
    })
  }
  return globalForPrisma.prisma
}

const parRequete = new WeakMap<object, PrismaClient>()

function clientCloudflare(): PrismaClient {
  const { ctx } = getCloudflareContext()
  let client = parRequete.get(ctx)
  if (!client) {
    const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL })
    client = new PrismaClient({ adapter, log: ['error'] })
    // Pas de fermeture explicite : Cloudflare libère la connexion à la fin de la requête.
    parRequete.set(ctx, client)
  }
  return client
}

const resoudre = (): PrismaClient => (surCloudflare ? clientCloudflare() : clientNode())

const lier = (objet: object, prop: PropertyKey) => {
  const valeur = Reflect.get(objet, prop, objet)
  return typeof valeur === 'function' ? valeur.bind(objet) : valeur
}

// Client créé à la première utilisation seulement : rien n'est ouvert pendant la
// construction ni au chargement d'un module. Les modèles (db.user, db.payment…)
// peuvent être mémorisés au chargement : ils ne choisissent le client qu'à l'appel.
export const db: PrismaClient = new Proxy({} as PrismaClient, {
  get(_cible, prop) {
    if (typeof prop === 'string' && !prop.startsWith('$') && !prop.startsWith('_') && prop !== 'then') {
      return new Proxy({}, {
        get(_d, methode) {
          const client = resoudre()
          return lier(Reflect.get(client, prop, client) as object, methode)
        },
      })
    }
    return lier(resoudre(), prop)
  },
})
