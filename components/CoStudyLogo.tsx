import React from 'react';

interface CoStudyLogoProps {
  /** Size variant: 'sm' | 'md' | 'lg' | 'xl' */
  size?: 'sm' | 'md' | 'lg' | 'xl';
  /** Light / dark wordmark. `nav` = top bar: soft clay capsule. */
  variant?: 'light' | 'dark' | 'nav';
  /** Kept for API compatibility — the 10A lockup is wordmark-only. */
  showIcon?: boolean;
  /** Optional custom className for the wrapper */
  className?: string;
  /** Soft clay capsule (e.g. top nav). Prefer variant="nav" for Layout. */
  elevated?: boolean;
}

/** Font size (px) per size variant */
const sizeMap: Record<NonNullable<CoStudyLogoProps['size']>, number> = {
  sm: 22,
  md: 28,
  lg: 44,
  xl: 60,
};

/**
 * CoStudy brand lockup — Logo 10A "The Highlight + the dot".
 * Lowercase Bricolage Grotesque wordmark, a hand-drawn marker swipe
 * over "co", and the sentence ends on the coral full stop:
 * highlight what matters, then state it, period.
 *
 * Styles live in styles/wall-desktop.css (.co-wordmark) with
 * app-wide fallbacks in styles/wall-app.css.
 */
export const CoStudyLogo: React.FC<CoStudyLogoProps> = ({
  size = 'md',
  variant = 'light',
  showIcon: _showIcon = true,
  className = '',
  elevated = false,
}) => {
  const isDark = variant === 'dark';
  const useCapsule = elevated || variant === 'nav';

  const wordmark = (
    <span
      className={`co-wordmark ${isDark ? 'co-dark' : ''}`}
      style={{ fontSize: sizeMap[size], color: 'var(--ink)' }}
    >
      <span className="co-hl">
        <svg className="co-swipe" viewBox="0 0 120 30" preserveAspectRatio="none" aria-hidden="true">
          <path
            d="M6.5 16.5 C 5.6 10.2, 11 5.9, 18 5.4 C 43 3.5, 72 4.1, 99.5 6 C 108 6.6, 115.5 9.4, 114.8 14.6 C 114.1 19.9, 107.5 23.5, 98.5 24.3 C 69 26.9, 39 27.8, 17.5 25.8 C 10.5 25.1, 7.2 21.6, 6.5 16.5 Z"
            fill="#f78c54"
            opacity="0.52"
          />
          <path
            d="M9.5 13.2 C 10.6 9.3, 15.5 7.5, 21.5 7.2 C 39 6.3, 53 6.6, 63 7.5 C 55.5 9.1, 31 9.3, 15.5 11.6 C 12.6 12, 10.4 12.5, 9.5 13.2 Z"
            fill="#ef6a44"
            opacity="0.3"
          />
        </svg>
        <span>co</span>
      </span>
      <span>study</span>
      <span className="co-dot">.</span>
    </span>
  );

  if (useCapsule) {
    return <span className={`co-capsule ${className}`}>{wordmark}</span>;
  }

  return <span className={`inline-flex items-center ${className}`}>{wordmark}</span>;
};
