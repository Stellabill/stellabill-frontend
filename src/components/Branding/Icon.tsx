import React from 'react';
import * as LucideIcons from 'lucide-react';

export type IconName = keyof typeof LucideIcons;

interface IconProps {
  name: IconName;
  size?: number | string;
  color?: string;
  strokeWidth?: number;
  className?: string;
}

const Icon: React.FC<IconProps> = ({ 
  name, 
  size = 20, 
  color = 'currentColor', 
  strokeWidth = 2,
  className = ''
}) => {
  const LucideIcon = LucideIcons[name] as React.ElementType;

  if (!LucideIcon) {
    console.warn(`Icon "${name}" not found in lucide-react`);
    return null;
  }

  return (
    <LucideIcon 
      size={size} 
      color={color} 
      strokeWidth={strokeWidth} 
      className={className} 
    />
  );
};

export default Icon;
