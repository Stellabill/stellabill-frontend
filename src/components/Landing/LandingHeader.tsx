import React from 'react';
import styles from './LandingHeader.module.css';
import WalletPill from '../WalletPill';
import ConnectButton from '../ConnectButton';
import { useWallet } from '../../wallet/WalletContext';

const LandingHeader: React.FC = () => {
    const { status, address, disconnect } = useWallet();

    return (
        <header className={styles.header}>
            <div className={styles.left}>
                <a href="/" className={styles.logoContainer}>
                    <div className={styles.logoIcon}>S</div>
                    <span className={styles.logoText}>Stellabill</span>
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
                {status === 'connected' ? (
                    <WalletPill 
                        address={address ?? ''}
                        onDisconnect={disconnect}
                    />
                ) : (
                    <ConnectButton />
                )}
            </div>
        </header>
    );
};

export default LandingHeader;
