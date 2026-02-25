import styles from './KeyMetrics.module.css';

const metrics = [
  { value: '99.9%', label: 'UPTIME', gradientClass: styles.gradientUptime },
  { value: '<2s', label: 'SETTLEMENT', gradientClass: styles.gradientSettlement },
  { value: '$0.01', label: 'AVG FEE', gradientClass: styles.gradientFee },
];

const partners = ['StellarX', 'AnchorUSD', 'Vibrant', 'Lobstr'];

export default function KeyMetrics() {
  return (
    <section className={styles.section} aria-label="Key performance metrics">
      <div className={styles.headlineContainer}>
        <h2 className={styles.headlineText}>
          "Infrastructure-grade <span className={styles.highlightWrapper}>billing<span className={styles.underline}></span></span> for Web3 SaaS"
        </h2>
      </div>

      <div className={styles.metricsGrid}>

        {metrics.map((metric, index) => (
          <div key={index} className={styles.card}>
            <p className={`${styles.metricValue} ${metric.gradientClass}`}>{metric.value}</p>
            <p className={styles.metricLabel}>{metric.label}</p>
          </div>
        ))}
      </div>


      <div className={styles.trustedSection}>
        <h3 className={styles.trustedHeading}>TRUSTED BY BUILDERS IN THE STELLAR ECOSYSTEM</h3>
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
