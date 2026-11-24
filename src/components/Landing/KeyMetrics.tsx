import { Trans, useTranslation } from 'react-i18next';
import styles from './KeyMetrics.module.css';

const metrics = [
  { id: 'uptime', gradientClass: styles.gradientUptime },
  { id: 'settlement', gradientClass: styles.gradientSettlement },
  { id: 'fee', gradientClass: styles.gradientFee },
];

const partners = ['StellarX', 'AnchorUSD', 'Vibrant', 'Lobstr'];

export default function KeyMetrics() {
  const { t } = useTranslation();
  return (
    <section className={styles.section} aria-label={t('landing.metrics.label')}>
      <div className={styles.headlineContainer}>
        <h2 className={styles.headlineText}>
          <Trans t={t} i18nKey="landing.metrics.headline" components={[
            <span className={styles.highlightWrapper} />,
          ]} />
        </h2>
      </div>

      <div className={styles.metricsGrid}>

        {metrics.map((metric, index) => (
          <div key={index} className={styles.card}>
            <p className={`${styles.metricValue} ${metric.gradientClass}`}>{t(`landing.metrics.${metric.id}.value`)}</p>
            <p className={styles.metricLabel}>{t(`landing.metrics.${metric.id}.label`)}</p>
          </div>
        ))}
      </div>


      <div className={styles.trustedSection}>
        <h3 className={styles.trustedHeading}>{t('landing.metrics.trusted')}</h3>
        <div className={styles.partnerGrid}>
          {partners.map((partner) => (
            <span key={partner} className={styles.partnerName}>
              {partner}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
