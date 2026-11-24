import React from 'react';
import * as LucideIcons from 'lucide-react';
import mirrorRegistry from '../assets/icon-mirror.json';
import './Icon.css';

export type IconName = keyof typeof LucideIcons;

export type LucideIconProps = {
  name: IconName;
  src?: never;
  size?: number | string;
  color?: string;
  strokeWidth?: number;
  label?: string;
  className?: string;
} & Omit<React.SVGProps<SVGSVGElement>, 'name' | 'color' | 'strokeWidth'>;

export type ImageIconProps = {
  src: string;
  name?: never;
  size?: number | string;
  label?: string;
  className?: string;
} & Omit<React.ImgHTMLAttributes<HTMLImageElement>, 'src'>;

export type IconProps = LucideIconProps | ImageIconProps;

export const Icon: React.FC<IconProps> = (props) => {
  if ('src' in props && props.src !== undefined) {
    const {
      src,
      size,
      label,
      alt,
      className = '',
      width,
      height,
      'aria-label': ariaLabel,
      'aria-hidden': ariaHidden,
      ...imgProps
    } = props;

    const filename = src.split('/').pop()?.split('?')[0] || '';

    let mirrorState: 'always' | 'never' | 'context' = 'never';
    if (mirrorRegistry.always.includes(filename)) {
      mirrorState = 'always';
    } else if (mirrorRegistry.context.includes(filename as never)) {
      mirrorState = 'context';
    }

    const effectiveLabel = label || ariaLabel || alt || undefined;
    const isDecorative = !effectiveLabel;
    const combinedClassName = ['stellabill-icon', className].filter(Boolean).join(' ');

    return (
      <img
        src={src}
        alt={alt ?? label ?? ariaLabel ?? ''}
        aria-label={label ?? ariaLabel}
        aria-hidden={ariaHidden ?? (isDecorative ? true : undefined)}
        width={width ?? size}
        height={height ?? size}
        data-mirror={mirrorState}
        className={combinedClassName}
        {...imgProps}
      />
    );
  }

  const {
    name,
    size = 20,
    color = 'currentColor',
    strokeWidth = 2,
    label,
    className = '',
    'aria-label': ariaLabel,
    'aria-hidden': ariaHidden,
    role,
    ...svgProps
  } = props as LucideIconProps;

  const LucideIcon = LucideIcons[name] as React.ElementType | undefined;

  if (!LucideIcon) {
    console.warn(`Icon "${name}" not found in lucide-react`);
    return null;
  }

  const effectiveLabel = label || ariaLabel || undefined;
  const isDecorative = !effectiveLabel;
  const combinedClassName = ['stellabill-icon', className].filter(Boolean).join(' ');

  return (
    <LucideIcon
      size={size}
      color={color}
      strokeWidth={strokeWidth}
      className={combinedClassName}
      role={role ?? (effectiveLabel ? 'img' : undefined)}
      aria-label={effectiveLabel}
      aria-hidden={ariaHidden ?? (isDecorative ? true : undefined)}
      {...svgProps}
    />
  );
};

export default Icon;
