import React from 'react';
import { Layers, List, Receipt, BellOff, SearchX, PackageOpen } from 'lucide-react';
import styles from './EmptyState.module.css';

export type EmptyStateType = 
  | 'subscriptions' 
  | 'plans' 
  | 'invoices' 
  | 'notifications' 
  | 'search' 
  | 'generic';

export interface EmptyStateProps {
  type: EmptyStateType;
  title: string;
  description: string;
}

const SubscriptionsIllustration = () => (
  <svg className={styles.largeIllustration} width="120" height="120" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <circle cx="60" cy="60" r="50" fill="var(--illustration-background)" />
    <rect x="35" y="30" width="50" height="60" rx="4" stroke="var(--illustration-secondary)" strokeWidth="4" fill="none" />
    <rect x="30" y="40" width="60" height="50" rx="4" stroke="var(--illustration-primary)" strokeWidth="4" fill="none" />
    <path d="M40 55H80" stroke="var(--illustration-primary)" strokeWidth="4" strokeLinecap="round" />
    <path d="M40 70H65" stroke="var(--illustration-secondary)" strokeWidth="4" strokeLinecap="round" />
  </svg>
);

const PlansIllustration = () => (
  <svg className={styles.largeIllustration} width="120" height="120" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <circle cx="60" cy="60" r="50" fill="var(--illustration-background)" />
    <rect x="25" y="55" width="20" height="35" rx="2" stroke="var(--illustration-secondary)" strokeWidth="4" />
    <rect x="50" y="40" width="20" height="50" rx="2" stroke="var(--illustration-primary)" strokeWidth="4" />
    <rect x="75" y="60" width="20" height="30" rx="2" stroke="var(--illustration-secondary)" strokeWidth="4" />
    <circle cx="60" cy="30" r="6" fill="var(--illustration-primary)" />
  </svg>
);

const InvoicesIllustration = () => (
  <svg className={styles.largeIllustration} width="120" height="120" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <circle cx="60" cy="60" r="50" fill="var(--illustration-background)" />
    <path d="M35 30C35 27.7909 36.7909 26 39 26H81C83.2091 26 85 27.7909 85 30V90L75 85L65 90L55 85L45 90L35 85V30Z" stroke="var(--illustration-secondary)" strokeWidth="4" strokeLinejoin="round" fill="none" />
    <path d="M47 40H73" stroke="var(--illustration-primary)" strokeWidth="4" strokeLinecap="round" />
    <path d="M47 52H73" stroke="var(--illustration-primary)" strokeWidth="4" strokeLinecap="round" />
    <path d="M47 64H60" stroke="var(--illustration-secondary)" strokeWidth="4" strokeLinecap="round" />
    <circle cx="70" cy="72" r="4" fill="var(--illustration-secondary)" />
  </svg>
);

const NotificationsIllustration = () => (
  <svg className={styles.largeIllustration} width="120" height="120" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <circle cx="60" cy="60" r="50" fill="var(--illustration-background)" />
    <path d="M45 45C45 36.7157 51.7157 30 60 30C68.2843 30 75 36.7157 75 45V65H85V75H35V65H45V45Z" stroke="var(--illustration-primary)" strokeWidth="4" strokeLinejoin="round" fill="none" />
    <path d="M52 75V78C52 82.4183 55.5817 86 60 86C64.4183 86 68 82.4183 68 78V75" stroke="var(--illustration-secondary)" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    <path d="M80 35H90L80 45H90" stroke="var(--illustration-secondary)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M30 45H40L30 55H40" stroke="var(--illustration-secondary)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const SearchIllustration = () => (
  <svg className={styles.largeIllustration} width="120" height="120" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <circle cx="60" cy="60" r="50" fill="var(--illustration-background)" />
    <circle cx="50" cy="50" r="20" stroke="var(--illustration-primary)" strokeWidth="4" fill="none" />
    <path d="M65 65L85 85" stroke="var(--illustration-primary)" strokeWidth="4" strokeLinecap="round" />
    <path d="M45 45L55 55M55 45L45 55" stroke="var(--illustration-secondary)" strokeWidth="3" strokeLinecap="round" />
  </svg>
);

const GenericIllustration = () => (
  <svg className={styles.largeIllustration} width="120" height="120" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <circle cx="60" cy="60" r="50" fill="var(--illustration-background)" />
    <path d="M30 50L60 65L90 50L60 35L30 50Z" stroke="var(--illustration-secondary)" strokeWidth="4" strokeLinejoin="round" fill="none" />
    <path d="M30 50V75L60 90L90 75V50" stroke="var(--illustration-primary)" strokeWidth="4" strokeLinejoin="round" fill="none" />
    <path d="M60 65V90" stroke="var(--illustration-primary)" strokeWidth="4" strokeLinejoin="round" />
    <path d="M30 50L45 40" stroke="var(--illustration-secondary)" strokeWidth="4" strokeLinecap="round" />
    <path d="M90 50L75 40" stroke="var(--illustration-secondary)" strokeWidth="4" strokeLinecap="round" />
  </svg>
);

const illustrationMap = {
  subscriptions: { Large: SubscriptionsIllustration, Small: Layers },
  plans: { Large: PlansIllustration, Small: List },
  invoices: { Large: InvoicesIllustration, Small: Receipt },
  notifications: { Large: NotificationsIllustration, Small: BellOff },
  search: { Large: SearchIllustration, Small: SearchX },
  generic: { Large: GenericIllustration, Small: PackageOpen },
};

export const EmptyState: React.FC<EmptyStateProps> = ({ type, title, description }) => {
  const { Large, Small } = illustrationMap[type] || illustrationMap.generic;

  return (
    <div className={styles.container}>
      <div className={styles.illustrationWrapper}>
        <Large />
        <Small className={styles.smallIcon} aria-hidden="true" />
      </div>
      <h3 className={styles.title}>{title}</h3>
      <p className={styles.description}>{description}</p>
    </div>
  );
};
