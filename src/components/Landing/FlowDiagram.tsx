import React from 'react';
import styles from './FlowDiagram.module.css';

const FlowDiagram: React.FC = () => {
    return (
        <section className={styles.diagramSection}>
            <div className={styles.diagramContainer}>
                {/* Large background SVG rings spanning entire container */}
                <svg
                    className={styles.ringsSvg}
                    viewBox="0 0 800 400"
                    preserveAspectRatio="xMidYMid slice"
                    aria-hidden="true"
                >
                    {/* Concentric rings around vault */}
                    <circle cx="400" cy="200" r="350" fill="none" stroke="rgba(13, 235, 213, 0.05)" strokeWidth="1" />
                    <circle cx="400" cy="200" r="250" fill="none" stroke="rgba(13, 235, 213, 0.08)" strokeWidth="1" />
                    <circle cx="400" cy="200" r="150" fill="none" stroke="rgba(13, 235, 213, 0.12)" strokeWidth="1" />
                    <circle cx="400" cy="200" r="80" fill="none" stroke="rgba(13, 235, 213, 0.15)" strokeWidth="1.5" />

                    {/* Glowing flow indicator dots */}
                    {/* Left to center flow */}
                    <circle cx="150" cy="195" r="2.5" fill="#0debd5" opacity="0.8" />
                    <circle cx="220" cy="190" r="2" fill="#0debd5" opacity="0.6" />
                    <circle cx="290" cy="200" r="1.5" fill="#0debd5" opacity="0.4" />

                    {/* Center to right flow */}
                    <circle cx="510" cy="205" r="1.5" fill="#0debd5" opacity="0.4" />
                    <circle cx="580" cy="210" r="2" fill="#0debd5" opacity="0.6" />
                    <circle cx="650" cy="200" r="2.5" fill="#0debd5" opacity="0.8" />

                    {/* Ambient scattered dots around diagram */}
                    <circle cx="100" cy="120" r="1.5" fill="#0debd5" opacity="0.5" />
                    <circle cx="700" cy="130" r="1.5" fill="#0debd5" opacity="0.5" />
                    <circle cx="750" cy="280" r="1.2" fill="#0debd5" opacity="0.4" />
                    <circle cx="50" cy="300" r="1.2" fill="#0debd5" opacity="0.4" />
                    <circle cx="720" cy="160" r="1" fill="#0debd5" opacity="0.6" />
                    <circle cx="80" cy="160" r="1" fill="#0debd5" opacity="0.6" />
                </svg>

                {/* Card/Node: User Wallet */}
                <div className={styles.node}>
                    <div className={styles.nodeBox}>
                        <div className={styles.nodeLabel}>USER</div>
                        <div className={styles.nodeTitle}>Wallet</div>
                    </div>
                </div>

                {/* Card/Node: Smart Contract Vault (Center) */}
                <div className={`${styles.node} ${styles.nodeVault}`}>
                    <div className={styles.nodeBox}>
                        <div className={styles.nodeLabel} style={{ color: '#0debd5', fontSize: '0.5rem' }}>SMART CONTRACT</div>
                        <div className={styles.nodeTitle}>Vault</div>
                    </div>
                </div>

                {/* Card/Node: Receives Merchant */}
                <div className={styles.node}>
                    <div className={styles.nodeBox}>
                        <div className={styles.nodeLabel}>RECEIVES</div>
                        <div className={styles.nodeTitle}>Merchant</div>
                    </div>
                </div>
            </div>

        
        </section>
    );
};

export default FlowDiagram;
