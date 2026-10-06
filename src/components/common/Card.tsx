import React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'primary' | 'secondary' | 'glass';
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export const Card: React.FC<CardProps> = ({
  children,
  variant = 'default',
  padding = 'md',
  className = '',
  ...props
}) => {
  const baseStyles = 'rounded-[var(--radius-2xl)] border transition-all duration-300 overflow-hidden';

  const variants = {
    default: 'bg-[var(--color-surface-card)] border-white/5 hover:border-white/10 shadow-sm',
    primary: 'bg-linear-to-br from-[#00b8db1a] to-[#00bba71a] border-[#2a2a2a] hover:border-cyan-500/30',
    secondary: 'bg-white/2 border-white/5 hover:bg-white/4',
    glass: 'bg-white/5 backdrop-blur-md border-white/10'
  };

  const paddings = {
    none: 'p-0',
    sm: 'p-[var(--space-4)]',
    md: 'p-[var(--space-6)]',
    lg: 'p-[var(--space-8)]'
  };

  const selectedVariant = variants[variant as keyof typeof variants] ?? variants.default;
  const selectedPadding = paddings[padding as keyof typeof paddings] ?? paddings.md;

  const combinedClassName = [baseStyles, selectedVariant, selectedPadding, className]
    .filter(Boolean)
    .join(' ')
    .trim();

  return (
    <div className={combinedClassName} {...props}>
      {children}
    </div>
  );
};

export default Card;
