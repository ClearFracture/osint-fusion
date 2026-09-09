import type { ReactNode } from 'react';

export function Panel({
  title,
  children,
  className = '',
}: {
  title?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`rounded-lg border border-tactical-border bg-tactical-panel/60 p-5 shadow-lg ${className}`}
    >
      {title && (
        <h2 className="mb-4 font-display text-lg font-semibold uppercase tracking-wide text-tactical-gold">
          {title}
        </h2>
      )}
      {children}
    </section>
  );
}
