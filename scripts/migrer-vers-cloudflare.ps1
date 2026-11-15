# ===============================================================
#  Migration de la base Netlify vers Neon + secrets Cloudflare
#  A lancer par le proprietaire du site, dans le dossier du site :
#    powershell -ExecutionPolicy Bypass -File scripts\migrer-vers-cloudflare.ps1
#  Recopie complete (en decembre, juste avant la bascule) :
#    powershell -ExecutionPolicy Bypass -File scripts\migrer-vers-cloudflare.ps1 --remplacer
#
#  Aucune adresse ni aucun mot de passe n'est affiche a l'ecran.
#  La base Netlify est seulement LUE.
# ===============================================================
$ErrorActionPreference = 'Continue'   # les avertissements npm sur stderr ne doivent pas arreter le script
Set-Location (Split-Path $PSScriptRoot -Parent)

function Lire-Cache([string]$invite) {
  $s = Read-Host $invite -AsSecureString
  $p = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($s)
  try { return [Runtime.InteropServices.Marshal]::PtrToStringBSTR($p).Trim() }
  finally { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($p) }
}

function Trouver-UrlPostgres($o) {
  if ($null -eq $o) { return $null }
  if ($o -is [string]) { if ($o -match '^postgres(ql)?://') { return $o } else { return $null } }
  if ($o -is [System.Collections.IEnumerable]) { foreach ($x in $o) { $r = Trouver-UrlPostgres $x; if ($r) { return $r } }; return $null }
  foreach ($p in $o.PSObject.Properties) { $r = Trouver-UrlPostgres $p.Value; if ($r) { return $r } }
  return $null
}

# Outil Netlify installe une seule fois (npx le reinstallait a chaque appel).
$netlifyExe = Join-Path (Split-Path (Get-Location) -Parent) 'outils-netlify\node_modules\.bin\netlify.cmd'
if (-not (Test-Path $netlifyExe)) { throw "Outil Netlify introuvable : $netlifyExe" }
function Netlify { & $netlifyExe @args }

Write-Host ""
Write-Host "=== 1/4  Netlify : connexion et adresse de la base ===" -ForegroundColor Cyan
$etat = (Netlify status 2>&1 | Out-String)
if ($LASTEXITCODE -ne 0 -or $etat -match 'Not logged in') {
  Write-Host "Une page Netlify va s'ouvrir dans votre navigateur : cliquez sur 'Authorize'." -ForegroundColor Yellow
  Netlify login
}
Netlify link --name gestionscolaireproplus *> $null

$source = $null
try {
  $brut = (Netlify database status --branch production --show-credentials --json 2>$null | Out-String)
  $debut = $brut.IndexOf('{'); $fin = $brut.LastIndexOf('}')
  if ($debut -ge 0 -and $fin -gt $debut) { $source = Trouver-UrlPostgres ($brut.Substring($debut, $fin - $debut + 1) | ConvertFrom-Json) }
} catch { $source = $null }
if (-not $source) {
  Write-Host "L'adresse de la base Netlify n'a pas pu etre lue automatiquement." -ForegroundColor Yellow
  $source = Lire-Cache "Collez l'adresse de la base Netlify (postgresql://...)"
}
Write-Host "Adresse Netlify obtenue (non affichee)." -ForegroundColor Green

Write-Host ""
Write-Host "=== 2/4  Neon : adresse de la nouvelle base ===" -ForegroundColor Cyan
$neon = $null
for ($essai = 1; $essai -le 3 -and -not $neon; $essai++) {
  $saisie = Lire-Cache "Collez l'adresse de connexion Neon (postgresql://...) puis Entree"
  # Accepte aussi un extrait du type DATABASE_URL='postgresql://...' ou psql '...'
  if ($saisie -match "(postgres(ql)?://[^\s'`"]+)") { $neon = $Matches[1] }
  else { Write-Host "Ce n'est pas une adresse postgresql:// ($($saisie.Length) caracteres recus). Recommencez." -ForegroundColor Yellow }
}
if (-not $neon) { throw "Adresse Neon non recue : rien n'a ete copie." }
Write-Host "Adresse Neon recue (non affichee)." -ForegroundColor Green
# Connexion directe pour la copie, connexion 'pooler' pour Cloudflare (recommandee par Neon).
$direct = $neon -replace '-pooler\.', '.'
$pool = $direct -replace '@(ep-[^.]+)\.', '@$1-pooler.'

Write-Host ""
Write-Host "=== 3/4  Copie des donnees Netlify -> Neon ===" -ForegroundColor Cyan
$env:SOURCE_DATABASE_URL = $source
$env:CIBLE_DATABASE_URL = $direct
try {
  node scripts/copier-base.mjs @args
  if ($LASTEXITCODE -ne 0) { throw "La copie a echoue : rien n'a ete envoye a Cloudflare." }
} finally {
  Remove-Item Env:SOURCE_DATABASE_URL, Env:CIBLE_DATABASE_URL -ErrorAction SilentlyContinue
}

$source = $null; $neon = $null; $direct = $null; $pool = $null
Write-Host ""
Write-Host "Copie terminee. Les secrets Cloudflare s'envoient avec scripts\secrets-cloudflare.ps1" -ForegroundColor Green
Write-Host "(Netlify ne laisse pas relire ses cles secretes ; a faire une seule fois)." -ForegroundColor Green
