import React from 'react';
import { Badge } from './Badge';

interface PageHeaderProps {
  kicker?: string;
  title: string;
  subtitle?: string;
  badge?: string;
  actions?: React.ReactNode;
}

/** Shared dark study-OS page header for student/mentor views */
export const PageHeader: React.FC<PageHeaderProps> = ({
  kicker,
  title,
  subtitle,
  badge,
  actions,
}) => {
  return (
    <header className="mb-6 sm:mb-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          {(kicker || badge) && (
            <div className="mb-2 flex flex-wrap items-center gap-2">
              {kicker && <p className="os-kicker">{kicker}</p>}
              {badge && <Badge>{badge}</Badge>}
            </div>
          )}
          <h1 className="os-title text-2xl sm:text-3xl">{title}</h1>
          {subtitle && (
            <p className="mt-1.5 max-w-2xl text-sm sm:text-base text-[var(--muted,#8b97ad)]">
              {subtitle}
            </p>
          )}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </div>
      <div className="os-hud-line mt-5" />
    </header>
  );
};

export default PageHeader;
