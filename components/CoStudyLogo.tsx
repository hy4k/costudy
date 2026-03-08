import React from 'react';
import { Icons } from './Icons';

interface CoStudyLogoProps {
  /** Size variant: 'sm' | 'md' | 'lg' | 'xl' */
  size?: 'sm' | 'md' | 'lg' | 'xl';
  /** Light background (e.g. Landing nav) - uses dark text. Dark background (Login/SignUp) - uses light text. */
  variant?: 'light' | 'dark';
  /** Show icon + text. Set false for text-only in hero. */
  showIcon?: boolean;
  /** Optional custom className for the wrapper */
  className?: string;
}

const sizeMap = {
  sm: { icon: 'w-8 h-8 sm:w-10 sm:h-10', text: 'text-xl sm:text-2xl' },
  md: { icon: 'w-12 h-12', text: 'text-2xl sm:text-3xl' },
  lg: { icon: 'w-16 h-16', text: 'text-4xl sm:text-5xl' },
  xl: { icon: 'w-20 h-20', text: 'text-3xl sm:text-6xl md:text-7xl' }
};

/**
 * Premium COSTUDY header: red hexagonal icon + CO/STUDY split (red + black) for elegant, vibrant branding.
 * Matches the attached design: combination of red and black, premium and elegant feel.
 */
export const CoStudyLogo: React.FC<CoStudyLogoProps> = ({
  size = 'md',
  variant = 'light',
  showIcon = true,
  className = ''
}) => {
  const { icon: iconClass, text: textClass } = sizeMap[size];
  const isDark = variant === 'dark';

  return (
    <div className={`flex items-center gap-3 sm:gap-4 ${className}`}>
      {showIcon && (
        <div className="shrink-0">
          <Icons.Logo className={iconClass} />
        </div>
      )}
      <span className={`font-black tracking-tighter uppercase ${textClass}`}>
        <span className={isDark ? 'text-red-500' : 'text-red-600'}>CO</span>
        <span className={isDark ? 'text-white' : 'text-slate-900'}>STUDY</span>
      </span>
    </div>
  );
};
