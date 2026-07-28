import React from 'react';
import { Loader2 } from 'lucide-react';
import './IconButton.css';

export interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon: React.ReactNode;
  'aria-label': string;
  variant?: 'primary' | 'secondary' | 'ghost' | 'outline' | 'elevated' | 'inverse';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

export const IconButton: React.FC<IconButtonProps> = ({
  icon,
  'aria-label': ariaLabel,
  variant = 'secondary',
  size = 'md',
  isLoading = false,
  className = '',
  disabled,
  ...props
}) => {
  const classes = [
    'icon-button',
    `icon-button--${variant}`,
    `icon-button--${size}`,
    className,
  ].filter(Boolean).join(' ');

  return (
    <button
      className={classes}
      aria-label={ariaLabel}
      disabled={disabled || isLoading}
      aria-busy={isLoading}
      {...props}
    >
      {isLoading ? <Loader2 className="animate-spin w-4 h-4" aria-hidden="true" /> : icon}
    </button>
  );
};

export default IconButton;
