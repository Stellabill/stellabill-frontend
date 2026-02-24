import React, { useState } from 'react';
import styles from './LandingHeader.module.css';
import WalletPill from '../WalletPill';
import ConnectButton from '../ConnectButton';

const LandingHeader: React.FC = () => {
    const [isConnected, setIsConnected] = useState(false);
    const [address] = useState("GABCDEFGHIJK1234567890ABCDEFGHIJK1234567890ABCDEXYZ9");

    return (
        <header className={styles.header}>
            <div className={styles.left}>
                <a href="/" className={styles.logoContainer}>
                    <div className={styles.logoIcon}>S</div>
                    <span className={styles.logoText}>Stellarbill</span>
                </a>
                
                <nav className={styles.nav}>
                    <a href="#product" className={styles.navLink}>Product</a>
                    <a href="#pricing" className={styles.navLink}>Pricing</a>
                    <a href="#subscriptions" className={styles.navLink}>My Subscriptions</a>
                    <a href="#docs" className={styles.navLink}>Docs</a>
                    <a href="#contact" className={styles.navLink}>Contact</a>
                </nav>
            </div>

            <div className={styles.right}>
                <span className={styles.subscribeText}>Subscribe with USDC</span>
                {isConnected ? (
                    <WalletPill 
                        address={address} 
                        onDisconnect={() => setIsConnected(false)} 
                    />
                ) : (
                    <ConnectButton onClick={() => setIsConnected(true)} />
                )}
            </div>
        </header>
    );
};

export default LandingHeader;
