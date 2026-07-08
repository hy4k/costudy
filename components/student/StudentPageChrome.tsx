import React from 'react';
import { PageHeader } from '../ui/PageHeader';

/** Full-page study-OS background for student routes. */
export const STUDENT_PAGE_BG = 'min-h-full bg-transparent';

export interface StudentPageChromeProps {
  title: string;
  eyebrow?: string;
  description?: string;
  icon?: React.ReactNode;
  /** Tighter header for tool pages (e.g. AI Deck below a full-width toolbar). */
  compact?: boolean;
  maxWidthClassName?: string;
  badge?: string;
  actions?: React.ReactNode;
}

/**
 * Shared header for student app pages — dark mission / study OS.
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
  const py = compact ? 'py-4 sm:py-5' : 'py-5 sm:py-7';

  return (
    <header className="w-full shrink-0 border-b border-white/[0.06] bg-[rgba(11,16,32,0.55)] backdrop-blur-xl">
      <div className={`mx-auto px-4 sm:px-6 ${py} ${maxWidthClassName}`}>
        {icon ? (
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[var(--clay-bg,linear-gradient(135deg,#ff4d4d,#890b0b))] text-white shadow-[0_0_30px_-8px_rgba(255,59,59,0.55)] ring-1 ring-white/10">
              {icon}
            </div>
            <div className="min-w-0 flex-1">
              <PageHeader
                kicker={eyebrow}
                title={title}
                subtitle={description}
                badge={badge}
                actions={actions}
              />
            </div>
          </div>
        ) : (
          <PageHeader
            kicker={eyebrow}
            title={title}
            subtitle={description}
            badge={badge}
            actions={actions}
          />
        )}
      </div>
    </header>
  );
};
