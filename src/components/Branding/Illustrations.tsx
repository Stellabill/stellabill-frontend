import React from 'react';

interface IllustrationProps {
  size?: number | string;
  className?: string;
}

export const EmptyDashboard: React.FC<IllustrationProps> = ({ size = 200, className = '' }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 200 200" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    aria-hidden="true"
  >
    <circle cx="100" cy="100" r="80" stroke="url(#paint0_linear)" strokeWidth="1" strokeDasharray="4 4" />
    <circle cx="100" cy="100" r="50" stroke="url(#paint1_linear)" strokeWidth="2" />
    <path d="M70 100L100 70L130 100L100 130L70 100Z" fill="url(#paint2_linear)" fillOpacity="0.1" stroke="url(#paint2_linear)" strokeWidth="2" />
    <circle cx="100" cy="70" r="4" fill="#22d3ee" />
    <circle cx="130" cy="100" r="4" fill="#14b8a6" />
    <circle cx="100" cy="130" r="4" fill="#0ea5e9" />
    <circle cx="70" cy="100" r="4" fill="#0891b2" />
    <defs>
      <linearGradient id="paint0_linear" x1="20" y1="20" x2="180" y2="180" gradientUnits="userSpaceOnUse">
        <stop stopColor="#22d3ee" stopOpacity="0.2" />
        <stop offset="1" stopColor="#14b8a6" stopOpacity="0" />
      </linearGradient>
      <linearGradient id="paint1_linear" x1="50" y1="50" x2="150" y2="150" gradientUnits="userSpaceOnUse">
        <stop stopColor="#22d3ee" />
        <stop offset="1" stopColor="#14b8a6" />
      </linearGradient>
      <linearGradient id="paint2_linear" x1="70" y1="70" x2="130" y2="130" gradientUnits="userSpaceOnUse">
        <stop stopColor="#22d3ee" />
        <stop offset="1" stopColor="#14b8a6" />
      </linearGradient>
    </defs>
  </svg>
);

export const NoTransactions: React.FC<IllustrationProps> = ({ size = 200, className = '' }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 200 200" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    aria-hidden="true"
  >
    <rect x="40" y="60" width="120" height="80" rx="12" stroke="url(#paint3_linear)" strokeWidth="2" />
    <line x1="60" y1="90" x2="140" y2="90" stroke="#1e293b" strokeWidth="2" />
    <line x1="60" y1="110" x2="100" y2="110" stroke="#1e293b" strokeWidth="2" />
    <circle cx="140" cy="110" r="10" stroke="url(#paint4_linear)" strokeWidth="2" />
    <path d="M136 110H144" stroke="#22d3ee" strokeWidth="2" strokeLinecap="round" />
    <path d="M140 106V114" stroke="#22d3ee" strokeWidth="2" strokeLinecap="round" />
    <defs>
      <linearGradient id="paint3_linear" x1="40" y1="60" x2="160" y2="140" gradientUnits="userSpaceOnUse">
        <stop stopColor="#22d3ee" stopOpacity="0.4" />
        <stop offset="1" stopColor="#14b8a6" stopOpacity="0.1" />
      </linearGradient>
      <linearGradient id="paint4_linear" x1="130" y1="100" x2="150" y2="120" gradientUnits="userSpaceOnUse">
        <stop stopColor="#22d3ee" />
        <stop offset="1" stopColor="#14b8a6" />
      </linearGradient>
    </defs>
  </svg>
);
