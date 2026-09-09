"use client";

// ── En-tête des pages internes (cohérence visuelle) ──────────
export function PageHero({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  children?: React.ReactNode;
}) {
  return (
    <section className="relative overflow-hidden border-b bg-secondary/40">
      <div className="gspp-hero-glow absolute inset-0" aria-hidden="true" />
      <div className="relative mx-auto max-w-7xl px-4 py-14 text-center sm:px-6 sm:py-16 lg:px-8">
        {eyebrow && (
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.14em] text-emerald-600 dark:text-emerald-400">
            {eyebrow}
          </p>
        )}
        <h1 className="mx-auto max-w-3xl text-3xl font-extrabold tracking-tight sm:text-4xl lg:text-[2.75rem]">
          {title}
        </h1>
        {description && (
          <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
            {description}
          </p>
        )}
        {children && <div className="mt-7">{children}</div>}
      </div>
    </section>
  );
}
