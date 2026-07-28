import React from 'react';
import mirrorRegistry from '../assets/icon-mirror.json';
import './Icon.css';

export interface IconProps extends React.ImgHTMLAttributes<HTMLImageElement> {
    src: string;
}

export const Icon: React.FC<IconProps> = ({ src, className = '', ...props }) => {
    // Extract filename from src path
    const filename = src.split('/').pop()?.split('?')[0] || '';
    
    let mirrorState: 'always' | 'never' | 'context' = 'never';
    if (mirrorRegistry.always.includes(filename)) {
        mirrorState = 'always';
    } else if (mirrorRegistry.context.includes(filename as never)) {
        mirrorState = 'context';
    }

    return (
        <img
            src={src}
            data-mirror={mirrorState}
            className={`stellabill-icon ${className}`}
            {...props}
        />
    );
};
