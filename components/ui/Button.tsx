import React from 'react';

type Variant = 'primary' | 'ghost' | 'soft';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  fullWidth?: boolean;
}

const sizeClass: Record<Size, string> = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-4 py-2.5 text-sm',
  lg: 'px-5 py-3 text-base',
};

const variantClass: Record<Variant, string> = {
  primary: 'os-btn-primary',
  ghost: 'os-btn-ghost',
  soft: 'bg-[var(--accent-soft)] text-[var(--accent-deep)] border border-[var(--accent-line)]',
};

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  fullWidth,
  className = '',
  children,
  ...rest
}) => {
  return (
    <button
      type="button"
      className={`os-btn ${variantClass[variant]} ${sizeClass[size]} ${fullWidth ? 'w-full' : ''} ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
};

export default Button;
