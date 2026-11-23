import { useTranslation } from 'react-i18next'
import { useState } from 'react'
import styles from './FAQ.module.css'

const faqItems = ['prepaid', 'cancellation', 'wallets'] as const

export default function FAQ() {
  const { t } = useTranslation()
  const [expandedIndex, setExpandedIndex] = useState<number | null>(2)

  const toggle = (index: number) => {
    setExpandedIndex((prev) => (prev === index ? null : index))
  }

  return (
    <section className={styles.faqSection} id="faq">
      <h2 className={styles.faqHeading}>{t('landing.faq.title')}</h2>
      <div className={styles.accordionList} role="list">
        {faqItems.map((item, index) => {
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
                <span>{t(`landing.faq.${item}.question`)}</span>
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
                <p className={styles.answer}>{t(`landing.faq.${item}.answer`)}</p>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
