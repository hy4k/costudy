import React from 'react';

/** Shared page header chrome used by student-facing pages. */
export const STUDENT_PAGE_BG = 'min-h-full bg-slate-50 dark:bg-[#0b0f19]';

interface StudentPageChromeProps {
  eyebrow?: string;
  title: string;
  description?: string;
  icon?: React.ReactNode;
  actions?: React.ReactNode;
}

export const StudentPageChrome: React.FC<StudentPageChromeProps> = ({ eyebrow, title, description, icon, actions }) => (
  <header className="mx-auto w-full max-w-4xl px-4 pt-10 pb-6 sm:px-6">
    <div className="flex items-start justify-between gap-6">
      <div className="flex items-start gap-4">
        {icon && (
          <div className="shrink-0 rounded-2xl bg-brand/10 p-3 text-brand">{icon}</div>
        )}
        <div>
          {eyebrow && (
            <div className="text-[10px] font-black uppercase tracking-[0.3em] text-brand mb-2">{eyebrow}</div>
          )}
          <h1 className="text-3xl md:text-4xl font-black tracking-tight text-slate-900 dark:text-white">{title}</h1>
          {description && (
            <p className="mt-2 text-sm md:text-base text-slate-500 dark:text-slate-400 max-w-2xl leading-relaxed">{description}</p>
          )}
        </div>
      </div>
      {actions && <div className="shrink-0">{actions}</div>}
    </div>
  </header>
);
