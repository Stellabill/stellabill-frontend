import React from 'react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'full' | 'icon';
  theme?: 'dark' | 'light';
  className?: string;
}

const Logo: React.FC<LogoProps> = ({ 
  size = 'md', 
  variant = 'full', 
  theme = 'dark',
  className = '' 
}) => {
  const sizeMap = {
    sm: { box: '32px', font: '1.2rem', text: '1rem', gap: '0.5rem' },
    md: { box: '40px', font: '1.5rem', text: '1.25rem', gap: '0.75rem' },
    lg: { box: '56px', font: '2rem', text: '1.75rem', gap: '1rem' },
    xl: { box: '80px', font: '2.8rem', text: '2.5rem', gap: '1.5rem' },
  };

  const currentSize = sizeMap[size];
  const textColor = theme === 'dark' ? '#ffffff' : '#0f172a';

  const LogoIcon = (
    <div
      style={{
        width: currentSize.box,
        height: currentSize.box,
        background: 'linear-gradient(135deg, #22d3ee 0%, #14b8a6 100%)',
        borderRadius: '8px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: theme === 'dark' 
          ? '0 0 20px rgba(34, 211, 238, 0.4), 0 0 40px rgba(34, 211, 238, 0.2)'
          : '0 4px 12px rgba(20, 184, 166, 0.2)',
        position: 'relative',
        flexShrink: 0,
      }}
      aria-hidden="true"
    >
      <span
        style={{
          color: '#ffffff',
          fontSize: currentSize.font,
          fontWeight: 700,
          letterSpacing: '0.02em',
        }}
      >
        S
      </span>
    </div>
  );

  if (variant === 'icon') return LogoIcon;

  return (
    <div 
      className={`flex items-center gap-[${currentSize.gap}] ${className}`}
      style={{ display: 'flex', alignItems: 'center', gap: currentSize.gap }}
    >
      {LogoIcon}
      <span
        style={{
          color: textColor,
          fontSize: currentSize.text,
          fontWeight: 700,
          letterSpacing: '-0.01em',
          whiteSpace: 'nowrap',
        }}
      >
        Stellabill
      </span>
    </div>
  );
};

export default Logo;
