import React from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftAddon?: React.ReactNode;
  rightAddon?: React.ReactNode;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  helperText,
  leftAddon,
  rightAddon,
  className = '',
  id,
  required,
  ...props
}) => {
  const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;

  const baseInputStyles = 'w-full bg-[#1a1a1a] border rounded-lg px-3 py-2 text-sm text-[#e2e8f0] outline-hidden transition-all duration-200';
  const stateStyles = error 
    ? 'border-red-500/50 focus:border-red-500 focus:ring-1 focus:ring-red-500/20' 
    : 'border-[#2a2a2a] focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20';
  
  const combinedInputClassName = `${baseInputStyles} ${stateStyles} ${leftAddon ? 'pl-10' : ''} ${rightAddon ? 'pr-10' : ''} ${className}`.trim();

  return (
    <div className="flex flex-col gap-1.5 w-full">
      {label && (
        <label htmlFor={inputId} className="text-sm font-medium text-[#e2e8f0]">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      <div className="relative flex items-center">
        {leftAddon && (
          <div className="absolute left-3 text-slate-500 pointer-events-none">
            {leftAddon}
          </div>
        )}
        
        <input
          id={inputId}
          className={combinedInputClassName}
          {...props}
        />

        {rightAddon && (
          <div className="absolute right-3 text-slate-500 pointer-events-none">
            {rightAddon}
          </div>
        )}
      </div>

      {(error || helperText) && (
        <span className={`text-xs ${error ? 'text-red-400' : 'text-slate-500'}`}>
          {error || helperText}
        </span>
      )}
    </div>
  );
};

export default Input;
