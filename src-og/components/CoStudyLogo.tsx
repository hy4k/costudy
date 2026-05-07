import React from 'react';
import { Icons } from './Icons';

interface CoStudyLogoProps {
  /** Size variant: 'sm' | 'md' | 'lg' | 'xl' */
  size?: 'sm' | 'md' | 'lg' | 'xl';
  /** Light / dark wordmark. `nav` = student top bar: clay capsule + red shadow (same as elevated). */
  variant?: 'light' | 'dark' | 'nav';
  /** Show icon + text. Set false for text-only in hero. */
  showIcon?: boolean;
  /** Optional custom className for the wrapper */
  className?: string;
  /** Soft clay capsule + red-tinted shadow (e.g. top nav). Prefer variant="nav" for Layout. */
  elevated?: boolean;
}

const sizeMap = {
  sm: { icon: 'w-8 h-8 sm:w-10 sm:h-10', text: 'text-xl sm:text-2xl' },
  md: { icon: 'w-12 h-12', text: 'text-2xl sm:text-3xl' },
  lg: { icon: 'w-16 h-16', text: 'text-4xl sm:text-5xl' },
  xl: { icon: 'w-20 h-20', text: 'text-3xl sm:text-6xl md:text-7xl' }
};

/**
 * Premium COSTUDY header: red hexagonal icon + CO/STUDY split (red + black) for elegant, vibrant branding.
 */
export const CoStudyLogo: React.FC<CoStudyLogoProps> = ({
  size = 'md',
  variant = 'light',
  showIcon = true,
  className = '',
  elevated = false,
}) => {
  const { icon: iconClass, text: textClass } = sizeMap[size];
  const isDark = variant === 'dark';
  const useElevated = elevated || variant === 'nav';
  const tracking = useElevated ? 'tracking-[-0.055em]' : 'tracking-[-0.04em]';

  const inner = (
    <>
      {showIcon && (
        <div className="shrink-0">
          <Icons.Logo className={iconClass} />
        </div>
      )}
      <span className={`font-black uppercase ${tracking} ${textClass}`}>
        <span className={isDark ? 'text-red-500' : 'text-red-600'}>CO</span>
        <span className={isDark ? 'text-white' : 'text-slate-900'}>STUDY</span>
      </span>
    </>
  );

  if (useElevated) {
    return (
      <div
        className={`inline-flex rounded-2xl border border-white/90 bg-gradient-to-b from-white to-brand-50/40 px-2.5 py-1.5 shadow-clay-red-logo sm:px-3 sm:py-2 ${className}`}
      >
        <div className="flex items-center gap-2.5 sm:gap-3.5">{inner}</div>
      </div>
    );
  }

  return <div className={`flex items-center gap-3 sm:gap-4 ${className}`}>{inner}</div>;
};
