import { useState } from 'react'
import styles from './FAQ.module.css'

interface FAQItem {
  question: string
  answer: string
}

const faqData: FAQItem[] = [
  {
    question: 'What is prepaid balance?',
    answer:
      'Prepaid balance is a credit you load into your Stellabill account in USDC on the Stellar network. Subscription charges are automatically deducted from this balance each billing cycle, so you never miss a payment.',
  },
  {
    question: 'How does cancellation work?',
    answer:
      'You can cancel any subscription at any time from your dashboard. Once cancelled, you will retain access until the end of your current billing period. Any remaining prepaid balance can be withdrawn back to your wallet.',
  },
  {
    question: 'Which wallets are supported?',
    answer:
      'Stellabill works with any Stellar-compatible wallet including Freighter, Lobstr, and Albedo. Users need USDC on Stellar and a small XLM reserve for transaction fees.',
  },
]

export default function FAQ() {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(2)

  const toggle = (index: number) => {
    setExpandedIndex((prev) => (prev === index ? null : index))
  }

  return (
    <section className={styles.faqSection} id="faq">
      <h2 className={styles.faqHeading}>Frequently asked questions</h2>
      <div className={styles.accordionList} role="list">
        {faqData.map((item, index) => {
          const isExpanded = expandedIndex === index
          const panelId = `faq-panel-${index}`
          const buttonId = `faq-button-${index}`

          return (
            <div
              key={index}
              className={styles.accordionItem}
              role="listitem"
            >
              <button
                id={buttonId}
                className={styles.accordionButton}
                onClick={() => toggle(index)}
                aria-expanded={isExpanded}
                aria-controls={panelId}
              >
                <span>{item.question}</span>
                <svg
                  className={`${styles.chevron} ${isExpanded ? styles.chevronExpanded : ''}`}
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>
              <div
                id={panelId}
                role="region"
                aria-labelledby={buttonId}
                className={`${styles.answerWrapper} ${isExpanded ? styles.answerWrapperExpanded : ''}`}
              >
                <p className={styles.answer}>{item.answer}</p>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
