import React from 'react';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'error' | 'ghost' | 'outline';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  isLoading = false,
  leftIcon,
  rightIcon,
  className = '',
  disabled,
  ...props
}) => {
  const baseStyles = 'flex items-center justify-center gap-2.5 px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 active:scale-95';
  
  const variants = {
    primary: 'bg-linear-to-r from-cyan-400 to-teal-500 hover:from-cyan-300 hover:to-teal-400 text-black shadow-[0_0_20px_rgba(34,211,238,0.3)] hover:scale-105',
    secondary: 'bg-white/5 hover:bg-white/10 text-white border border-white/10',
    error: 'bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30',
    ghost: 'bg-transparent hover:bg-white/5 text-slate-400 hover:text-white',
    outline: 'bg-none border border-[#3a3a3a] text-[#e2e8f0] hover:border-[#555]'
  };

  const disabledStyles = 'opacity-50 cursor-not-allowed grayscale active:scale-100 hover:scale-100';
  const loadingStyles = 'opacity-90 cursor-not-allowed';

  const combinedClassName = `
    ${baseStyles} 
    ${variants[variant]} 
    ${disabled || isLoading ? (isLoading ? loadingStyles : disabledStyles) : 'cursor-pointer'}
    ${className}
  `.trim();

  return (
    <button
      className={combinedClassName}
      disabled={disabled || isLoading}
      aria-busy={isLoading}
      {...props}
    >
      {isLoading && <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />}
      {!isLoading && leftIcon}
      <span>{children}</span>
      {!isLoading && rightIcon}
    </button>
  );
};

export default Button;
