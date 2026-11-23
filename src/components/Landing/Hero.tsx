import { Trans, useTranslation } from 'react-i18next';
import React, { useEffect, useState } from 'react';
import styles from './Hero.module.css';

const PARTICLE_COUNT = 20;

const generateParticles = () =>
    Array.from({ length: PARTICLE_COUNT }).map((_, i) => ({
        id: i,
        size: Math.random() * 4 + 2,
        left: `${Math.random() * 100}%`,
        top: `${Math.random() * 100}%`,
        delay: `${Math.random() * 15}s`,
        duration: `${10 + Math.random() * 10}s`,
    }));

const usePrefersReducedMotion = () => {
    const [prefers, setPrefers] = useState(false);

    useEffect(() => {
        if (typeof window === 'undefined' || !window.matchMedia) return;
        const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
        const update = () => setPrefers(mq.matches);
        update();
        mq.addEventListener?.('change', update);
        return () => mq.removeEventListener?.('change', update);
    }, []);

    return prefers;
};

export interface HeroProps {
    primaryHref?: string;
    secondaryHref?: string;
    onPrimaryClick?: () => void;
    onSecondaryClick?: () => void;
}

const Hero: React.FC<HeroProps> = ({
    primaryHref = '/dashboard',
    secondaryHref = '#pricing',
    onPrimaryClick,
    onSecondaryClick,
}) => {
    const { t } = useTranslation();
    const reducedMotion = usePrefersReducedMotion();
    const particles = reducedMotion ? [] : generateParticles();

    return (
        <section className={styles.heroSection} aria-labelledby="hero-headline">
            <div className={styles.glowBackground} aria-hidden="true" />
            <div className={styles.textGlow} aria-hidden="true" />
            {!reducedMotion && (
                <div className={styles.particles} aria-hidden="true">
                    {particles.map((p) => (
                        <div
                            key={p.id}
                            className={styles.particle}
                            style={{
                                width: p.size,
                                height: p.size,
                                left: p.left,
                                top: p.top,
                                animationDelay: p.delay,
                                animationDuration: p.duration,
                            }}
                        />
                    ))}
                </div>
            )}

            <div className={styles.content}>
                <div className={styles.tag}>
                    <svg
                        className={styles.tagIcon}
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                    >
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                    </svg>
                    <span>{t('landing.hero.tag')}</span>
                </div>

                <h1 id="hero-headline" className={styles.headline}>
                    <Trans t={t} i18nKey="landing.hero.headline" components={[
                        <span className={styles.headlineLine1} />,
                        <span className={styles.headlineAccent} />,
                    ]} />
                </h1>

                <p className={styles.subtitle}>
                    {t('landing.hero.subtitle')}
                </p>

                <div className={styles.ctaContainer} role="group" aria-label={t('landing.hero.actionsLabel')}>
                    <a
                        className={styles.primaryCta}
                        href={primaryHref}
                        onClick={onPrimaryClick}
                        data-testid="hero-primary-cta"
                    >
                        <span>{t('landing.hero.primaryAction')}</span>
                        <svg
                            width="20"
                            height="20"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            aria-hidden="true"
                            focusable="false"
                        >
                            <line x1="5" y1="12" x2="19" y2="12"></line>
                            <polyline points="12 5 19 12 12 19"></polyline>
                        </svg>
                    </a>
                    <a
                        className={styles.secondaryCta}
                        href={secondaryHref}
                        onClick={onSecondaryClick}
                        data-testid="hero-secondary-cta"
                    >
                        {t('landing.hero.secondaryAction')}
                    </a>
                </div>
            </div>
        </section>
    );
};

export default Hero;
