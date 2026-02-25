import { Icon } from "./icon";
import styles from "./past-periods.module.css";

export function PastPeriods() {
  return (
    <section className={styles.container} aria-labelledby="past-periods-title">
      <div className={styles.wrapper_title}>
        <h2 className={styles.title}>Past Periods</h2>
        <button
          type="button"
          className={styles.button}
          aria-label="Export past periods"
        >
          <Icon aria-hidden="true" /> Export
        </button>
      </div>

      <div className={styles.container_scroll_overflow}>
        <table
          className={styles.table}
          role="table"
          aria-describedby="past-periods-caption"
        >
          <thead className={styles.table_title}>
            <tr style={{ borderBottom: "2px solid #3498db" }}>
              <th
                className={`${styles.padding_content} ${styles.border_bottom}`}
              >
                Period
              </th>
              <th
                className={`${styles.padding_content} ${styles.border_bottom}`}
              >
                Usage
              </th>
              <th
                className={`${styles.padding_content} ${styles.border_bottom}`}
              >
                Amount
              </th>
              <th
                className={`${styles.padding_content} ${styles.border_bottom}`}
              >
                Status
              </th>
            </tr>
          </thead>
          <tbody className={styles.table_content}>
            {data.map((item, index) => (
              <tr key={index}>
                <td className={styles.padding_content}>{item.period}</td>
                <td className={styles.padding_content}>
                  {item.usage}
                  <span className={styles.subContent}> API calls</span>
                </td>
                <td className={styles.padding_content}>{item.amount}</td>
                <td className={styles.padding_content}>
                  <Badge>{item.status}</Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <button
        type="button"
        className={`${styles.button} ${styles.space_top}`}
        aria-label="Back to subscription"
      >
        Back to subscription
      </button>
    </section>
  );
}

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <div
      className={styles.badge}
      role="status"
      aria-live="polite"
      aria-atomic="true"
    >
      {children}
    </div>
  );
}

const data = [
  {
    period: "Feb 1 - Feb 28, 2026",
    usage: "45,230",
    amount: "22.62 USDC",
    status: "Charged",
  },
  {
    period: "Oct 1 - Dec 28, 2025",
    usage: "25,230",
    amount: "22.62 USDC",
    status: "Charged",
  },
  {
    period: "Feb 1 - Feb 28, 2026",
    usage: "45,230",
    amount: "38.62 USDC",
    status: "Charged",
  },
  {
    period: "Jan 1 - Jan 28, 2025",
    usage: "45,230",
    amount: "10.62 USDC",
    status: "Charged",
  },
  {
    period: "Feb 1 - Feb 28, 2026",
    usage: "41,230",
    amount: "20.62 USDC",
    status: "Charged",
  },
  {
    period: "Oct 1 - Dec 28, 2025",
    usage: "39,230",
    amount: "19.62 USDC",
    status: "Charged",
  },
];
