import React from 'react';
import styles from './Hero.module.css';

const Hero: React.FC = () => {
    // Generate some random particles
    const particles = Array.from({ length: 20 }).map((_, i) => ({
        id: i,
        size: Math.random() * 4 + 2,
        left: `${Math.random() * 100}%`,
        top: `${Math.random() * 100}%`,
        delay: `${Math.random() * 15}s`,
        duration: `${10 + Math.random() * 10}s`,
    }));

    return (
        <section className={styles.heroSection}>
            <div className={styles.glowBackground} />
            <div className={styles.textGlow} />
            <div className={styles.particles}>
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
                    >
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                    </svg>
                    <span>Built on Soroban Smart Contracts</span>
                </div>

                <h1 className={styles.headline}>
                    <span className={styles.headlineLine1}>Recurring USDC  Billing for the</span>
                    <span className={styles.headlineAccent}>Stellar Ecosystem</span>
                </h1>

                <p className={styles.subtitle}>
                    Infrastructure-grade subscription billing powered by prepaid vaults. 
                    Users deposit USDC, smart contracts release funds on intervals—no 
                    forced debits, just low-fee, fast settlement.
                </p>

                <div className={styles.ctaContainer}>
                    <button className={styles.primaryCta}>
                        Start accepting subscriptions
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="5" y1="12" x2="19" y2="12"></line>
                            <polyline points="12 5 19 12 12 19"></polyline>
                        </svg>
                    </button>
                    <button className={styles.secondaryCta}>
                        View pricing
                    </button>
                </div>
            </div>
        </section>
    );
};

export default Hero;
