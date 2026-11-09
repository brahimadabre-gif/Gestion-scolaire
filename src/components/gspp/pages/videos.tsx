"use client";

// ── Portail « Vidéos de démo » ───────────────────────────────
// Tutoriels YouTube : vidéo « Commencer ici », recherche, filtres par thème,
// lecture dans une fenêtre (youtube-nocookie), liens vers la documentation.
import { useMemo, useState } from "react";
import { Link } from "../router";
import { trackVisit } from "../visit-tracker";
import {
  PUBLISHED_VIDEOS, TUTORIAL_VIDEOS, VIDEO_PLAYLISTS, YOUTUBE_CHANNEL, averageMinutes, videoThumb,
  type TutorialVideo, type VideoPlaylist,
} from "@/lib/videos";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { BookOpen, Clock3, Play, Search, Youtube } from "lucide-react";

function normalize(s: string) {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

function PlayBadge({ big = false }: { big?: boolean }) {
  return (
    <span className="absolute inset-0 grid place-items-center" aria-hidden="true">
      <span className={`grid place-items-center rounded-full bg-white/95 shadow-xl transition-transform group-hover:scale-110 ${big ? "h-20 w-20" : "h-12 w-12"}`}>
        <Play className={`fill-orange-600 text-orange-600 ${big ? "ml-1 h-8 w-8" : "ml-0.5 h-5 w-5"}`} />
      </span>
    </span>
  );
}

function VideoCard({ video, onPlay }: { video: TutorialVideo; onPlay: (v: TutorialVideo) => void }) {
  const soon = !video.youtubeId;
  return (
    <button
      type="button"
      disabled={soon}
      onClick={() => onPlay(video)}
      className="group flex min-w-0 flex-col text-left disabled:cursor-default"
      aria-label={soon ? `${video.title} (bientôt disponible)` : `Regarder : ${video.title}`}
    >
      <span className="relative block aspect-video overflow-hidden rounded-xl bg-muted shadow-sm ring-1 ring-border">
        <img src={videoThumb(video)} alt="" loading="lazy" className={`h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03] ${soon ? "opacity-60 grayscale" : ""}`} />
        {soon ? (
          <span className="absolute inset-0 grid place-items-center"><span className="rounded-full bg-black/75 px-3 py-1 text-xs font-bold text-white">Bientôt</span></span>
        ) : (
          <PlayBadge />
        )}
        <span className="absolute bottom-2 right-2 rounded bg-black/80 px-1.5 py-0.5 text-[11px] font-bold tabular-nums text-white">{video.duration}</span>
      </span>
      <span className="mt-2.5 text-[14.5px] font-bold leading-snug group-hover:text-orange-700 dark:group-hover:text-orange-400">{video.title}</span>
      <span className="mt-0.5 text-xs text-muted-foreground">N°{video.number} · {video.playlist}</span>
    </button>
  );
}

export function VideosPage() {
  const [query, setQuery] = useState("");
  const [playlist, setPlaylist] = useState<VideoPlaylist | "Toutes">("Toutes");
  const [playing, setPlaying] = useState<TutorialVideo | null>(null);
  const featured = TUTORIAL_VIDEOS[0];

  const counts = useMemo(() => {
    const c = new Map<string, number>();
    for (const v of TUTORIAL_VIDEOS) c.set(v.playlist, (c.get(v.playlist) ?? 0) + 1);
    return c;
  }, []);

  const list = useMemo(() => {
    const q = normalize(query.trim());
    return TUTORIAL_VIDEOS.filter((v) =>
      (playlist === "Toutes" || v.playlist === playlist) &&
      (!q || normalize(`${v.title} ${v.summary} ${v.playlist}`).includes(q))
    );
  }, [query, playlist]);

  const play = (v: TutorialVideo) => {
    if (!v.youtubeId) return;
    setPlaying(v);
    trackVisit({ path: "/videos", video: v.slug });
  };

  return (
    <main id="contenu">
      {/* En-tête du portail */}
      <section className="bg-[#14201c] text-white">
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-12 sm:px-6 sm:py-16 lg:grid-cols-[1.1fr_1fr] lg:px-8">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-orange-300">Portail vidéo</p>
            <h1 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl lg:text-[2.75rem]">Voyez le logiciel en action</h1>
            <p className="mt-4 max-w-xl text-base leading-relaxed text-white/75 sm:text-lg">
              Chaque fonction expliquée en {averageMinutes()} minutes, pas à pas, avec des sous-titres en français.
              Idéal pour former un enseignant ou découvrir le logiciel avant de l&apos;installer.
            </p>
            <dl className="mt-6 flex gap-8">
              <div><dt className="sr-only">Vidéos</dt><dd className="text-3xl font-extrabold text-orange-300 tabular-nums">{PUBLISHED_VIDEOS.length}</dd><p className="text-xs text-white/70">vidéos</p></div>
              <div><dt className="sr-only">Durée</dt><dd className="text-3xl font-extrabold text-orange-300">{averageMinutes()} min</dd><p className="text-xs text-white/70">en moyenne</p></div>
              <div><dt className="sr-only">Prix</dt><dd className="text-3xl font-extrabold text-orange-300">100 %</dd><p className="text-xs text-white/70">gratuit</p></div>
            </dl>
            <label className="mt-7 flex max-w-lg items-center gap-2 rounded-full bg-white p-1.5 pl-4 text-foreground shadow-lg">
              <Search className="h-4.5 w-4.5 shrink-0 text-muted-foreground" aria-hidden="true" />
              <span className="sr-only">Rechercher une vidéo</span>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Rechercher : bulletins, appel, caisse…"
                className="min-w-0 flex-1 bg-transparent py-2 text-[15px] text-zinc-900 outline-none placeholder:text-zinc-500"
              />
              <Button type="button" size="sm" className="rounded-full" onClick={() => document.getElementById("liste-videos")?.scrollIntoView({ behavior: "smooth" })}>Chercher</Button>
            </label>
          </div>
          <button type="button" onClick={() => play(featured)} className="group relative block overflow-hidden rounded-2xl border-[5px] border-white/10 text-left shadow-2xl" aria-label={`Commencer ici : ${featured.title}`}>
            <img src={videoThumb(featured)} alt="" className="aspect-video w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]" />
            <PlayBadge big />
            <span className="absolute bottom-3 right-3 rounded-md bg-black/80 px-2.5 py-1 text-xs font-bold text-white">Commencer ici · {featured.duration}</span>
          </button>
        </div>
      </section>

      {/* Filtres par thème */}
      <div id="liste-videos" className="mx-auto max-w-7xl scroll-mt-20 px-4 pt-8 sm:px-6 lg:px-8">
        <div className="flex flex-wrap gap-2" role="group" aria-label="Filtrer par thème">
          {(["Toutes", ...VIDEO_PLAYLISTS] as const).map((p) => {
            const on = playlist === p;
            const n = p === "Toutes" ? TUTORIAL_VIDEOS.length : counts.get(p) ?? 0;
            return (
              <button key={p} type="button" aria-pressed={on} onClick={() => setPlaylist(p)}
                className={`rounded-full border px-3.5 py-1.5 text-[13px] font-semibold transition-colors ${on ? "border-zinc-900 bg-zinc-900 text-white dark:border-white dark:bg-white dark:text-zinc-900" : "bg-card hover:bg-secondary"}`}>
                {p} <span className={`ml-1 font-normal tabular-nums ${on ? "opacity-75" : "text-muted-foreground"}`}>{n}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Grille des vidéos */}
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {list.length ? (
          <div className="grid gap-x-5 gap-y-7 sm:grid-cols-2 lg:grid-cols-4">
            {list.map((v) => <VideoCard key={v.slug} video={v} onPlay={play} />)}
          </div>
        ) : (
          <p className="py-12 text-center text-muted-foreground">Aucune vidéo ne correspond à « {query} ».</p>
        )}
      </div>

      {/* Documentation + chaîne YouTube */}
      <div className="mx-auto grid max-w-7xl gap-4 px-4 pb-16 sm:px-6 md:grid-cols-2 lg:px-8">
        <div className="flex flex-wrap items-center gap-4 rounded-2xl bg-orange-50 p-5 dark:bg-orange-950/30">
          <BookOpen className="h-8 w-8 shrink-0 text-orange-600 dark:text-orange-400" aria-hidden="true" />
          <div className="min-w-0 flex-1">
            <p className="font-bold">Vous préférez lire ?</p>
            <p className="text-sm text-muted-foreground">Notice complète, tutoriel illustré et documents du logiciel.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link to="/tutoriel" className="rounded-full bg-orange-600 px-4 py-2 text-sm font-bold text-white hover:bg-orange-700">Tutoriel illustré</Link>
            <Link to="/notice" className="rounded-full border bg-card px-4 py-2 text-sm font-bold hover:bg-secondary">Notice</Link>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-4 rounded-2xl border bg-card p-5">
          <Youtube className="h-8 w-8 shrink-0 text-red-600" aria-hidden="true" />
          <div className="min-w-0 flex-1">
            <p className="font-bold">Chaîne YouTube {YOUTUBE_CHANNEL.handle}</p>
            <p className="text-sm text-muted-foreground">Abonnez-vous pour recevoir les nouveaux tutoriels.</p>
          </div>
          <a href={YOUTUBE_CHANNEL.subscribeUrl} target="_blank" rel="noopener noreferrer" className="rounded-full border px-4 py-2 text-sm font-bold hover:bg-secondary">S&apos;abonner</a>
        </div>
      </div>

      {/* Lecteur */}
      <Dialog open={!!playing} onOpenChange={(o) => !o && setPlaying(null)}>
        <DialogContent className="max-w-4xl gap-3 p-3 sm:max-w-4xl sm:p-4">
          {playing && (
            <>
              <DialogTitle className="pr-8 text-base">N°{playing.number} · {playing.title}</DialogTitle>
              <DialogDescription className="sr-only">{playing.summary}</DialogDescription>
              <div className="aspect-video overflow-hidden rounded-lg bg-black">
                <iframe
                  src={`https://www.youtube-nocookie.com/embed/${playing.youtubeId}?autoplay=1&rel=0&cc_load_policy=1&hl=fr&cc_lang_pref=fr`}
                  title={playing.title}
                  allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
                  allowFullScreen
                  className="h-full w-full"
                />
              </div>
              <p className="flex items-center gap-1.5 text-xs text-muted-foreground"><Clock3 className="h-3.5 w-3.5" aria-hidden="true" />{playing.duration} · {playing.summary}</p>
            </>
          )}
        </DialogContent>
      </Dialog>
    </main>
  );
}
