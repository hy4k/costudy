import React from 'react';

/** Full-page warm clay background for student routes. */
export const STUDENT_PAGE_BG =
  'min-h-full bg-gradient-to-b from-[#faf6f3] via-[#fffaf7] to-[#f4ebe4]';

export interface StudentPageChromeProps {
  title: string;
  eyebrow?: string;
  description?: string;
  icon?: React.ReactNode;
  compact?: boolean;
  maxWidthClassName?: string;
  badge?: string;
  actions?: React.ReactNode;
}

/**
 * Shared header for student pages — warm clay aesthetic (soft, readable).
 */
export const StudentPageChrome: React.FC<StudentPageChromeProps> = ({
  title,
  eyebrow,
  description,
  icon,
  compact,
  maxWidthClassName = 'max-w-7xl',
  badge,
  actions,
}) => {
  const py = compact ? 'py-5 sm:py-6' : 'py-6 sm:py-8';

  return (
    <header className="w-full shrink-0 border-b border-[#ead9cf]/80 bg-gradient-to-b from-[#fffefc] via-[#fff9f6] to-[#faf2ed]">
      <div className={`mx-auto px-4 sm:px-6 ${py} ${maxWidthClassName}`}>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex min-w-0 items-start gap-4">
            {icon && (
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#db7a6d] via-[#d45a4c] to-[#a13c32] text-white shadow-[0_10px_24px_-12px_rgba(161,60,50,0.45)] ring-2 ring-white/90">
                {icon}
              </div>
            )}
            <div className="min-w-0">
              {(eyebrow || badge) && (
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  {eyebrow && (
                    <p className="font-display text-[11px] font-semibold uppercase tracking-[0.2em] text-[#a13c32]/80">
                      {eyebrow}
                    </p>
                  )}
                  {badge && (
                    <span className="rounded-full border border-[#ebc4bc] bg-[#f7e0db] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#a13c32]">
                      {badge}
                    </span>
                  )}
                </div>
              )}
              <h1 className="font-display text-2xl font-semibold tracking-tight text-[#3d2a24] sm:text-[2.05rem]">
                {title}
              </h1>
              {description && (
                <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[#8b7268] sm:text-base">
                  {description}
                </p>
              )}
            </div>
          </div>
          {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
        </div>
      </div>
    </header>
  );
};
