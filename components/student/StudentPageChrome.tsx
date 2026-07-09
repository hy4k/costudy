import React from 'react';

/** Full-page warm background used with student routes (matches Study Wall / Layout clay-red system). */
export const STUDENT_PAGE_BG =
  'min-h-full bg-gradient-to-b from-[#faf7f5] via-white to-[#f9f5f3]';

export interface StudentPageChromeProps {
  title: string;
  eyebrow?: string;
  description?: string;
  icon?: React.ReactNode;
  /** Tighter header for tool pages (e.g. AI Deck below a full-width toolbar). */
  compact?: boolean;
  maxWidthClassName?: string;
}

/**
 * Shared header strip for student app pages: burgundy/white premium chrome aligned with Layout nav.
 * Wrap the page in a container using {@link STUDENT_PAGE_BG}; place main content below this header.
 */
export const StudentPageChrome: React.FC<StudentPageChromeProps> = ({
  title,
  eyebrow,
  description,
  icon,
  compact,
  maxWidthClassName = 'max-w-7xl',
}) => {
  const py = compact ? 'py-5 sm:py-6' : 'py-6 sm:py-8';

  return (
    <header className="w-full shrink-0 border-b border-[#e8d4d4]/70 bg-gradient-to-b from-[#fffefc] via-[#fff8f6] to-[#fff4f0]">
      <div className={`mx-auto px-4 sm:px-6 ${py} ${maxWidthClassName}`}>
        {icon ? (
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-brand via-[#e01010] to-brand-900 text-white shadow-clay-red-raised ring-2 ring-white/90">
              {icon}
            </div>
            <div className="min-w-0">
              {eyebrow && (
                <p className="font-display text-[11px] font-semibold uppercase tracking-[0.22em] text-brand-900/75">
                  {eyebrow}
                </p>
              )}
              <h1 className="font-display text-2xl font-semibold tracking-tight text-[#1a0a0a] sm:text-[2.15rem]">
                {title}
              </h1>
              {description && (
                <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-600 sm:text-base">
                  {description}
                </p>
              )}
            </div>
          </div>
        ) : (
          <div>
            {eyebrow && (
              <p className="font-display text-[11px] font-semibold uppercase tracking-[0.22em] text-brand-900/75">
                {eyebrow}
              </p>
            )}
            <h1 className="font-display text-2xl font-semibold tracking-tight text-[#1a0a0a] sm:text-[2.15rem]">
              {title}
            </h1>
            {description && (
              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-600 sm:text-base">
                {description}
              </p>
            )}
          </div>
        )}
      </div>
    </header>
  );
};
