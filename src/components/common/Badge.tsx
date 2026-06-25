import React from 'react';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'active' | 'draft' | 'recommended' | 'default';
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  className = '',
  ...props
}) => {
  const baseStyles = 'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider transition-all duration-300';
  
  const variants = {
    default: 'bg-slate-800 text-slate-300 border border-slate-700',
    active: 'bg-green-500/10 text-green-400 border border-green-500/30',
    draft: 'bg-slate-700 text-slate-400 border border-slate-600',
    recommended: 'cta-badge-recommended' // Uses global class from index.css
  };

  // Special handling for recommended to include the dot if needed, 
  // but recommended in index.css is quite specific.
  if (variant === 'recommended') {
    return (
      <span className={`cta-badge-recommended ${className}`} {...props}>
        <span className="cta-badge-dot" />
        {children}
      </span>
    );
  }

  const combinedClassName = `${baseStyles} ${variants[variant]} ${className}`.trim();

  return (
    <span className={combinedClassName} {...props}>
      {variant === 'active' && <span className="w-1.5 h-1.5 rounded-full bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.5)]" />}
      {children}
    </span>
  );
};

export default Badge;
