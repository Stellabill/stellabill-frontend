import { useCallback, useRef, useState } from 'react'
import { RotateCcw } from 'lucide-react'
import { useDensity, type Density } from '../../hooks/useDensity'
import './DensityPreview.css'

const DENSITY_OPTIONS: { value: Density; label: string }[] = [
  { value: 'compact', label: 'Compact' },
  { value: 'comfortable', label: 'Comfortable' },
  { value: 'spacious', label: 'Spacious' },
]

export default function DensityPreview() {
  const { density, setDensity, resetDensity, isDefault } = useDensity()
  const [previewDensity, setPreviewDensity] = useState<Density | null>(null)
  const liveRegionRef = useRef<HTMLDivElement>(null)

  const activeDensity = previewDensity ?? density

  const announce = useCallback((text: string) => {
    if (liveRegionRef.current) {
      liveRegionRef.current.textContent = text
    }
  }, [])

  const handleHoverEnter = useCallback(
    (value: Density) => {
      setPreviewDensity(value)
      announce(`Previewing ${value} density`)
    },
    [announce],
  )

  const handleHoverLeave = useCallback(() => {
    setPreviewDensity(null)
    announce(`Restored ${density} density`)
  }, [density, announce])

  const handleSelect = useCallback(
    (value: Density) => {
      setDensity(value)
      setPreviewDensity(null)
      announce(`${value} density applied`)
    },
    [setDensity, announce],
  )

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent, currentIndex: number) => {
      let nextIndex = currentIndex
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault()
        nextIndex = (currentIndex + 1) % DENSITY_OPTIONS.length
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault()
        nextIndex = (currentIndex - 1 + DENSITY_OPTIONS.length) % DENSITY_OPTIONS.length
      } else if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault()
        handleSelect(DENSITY_OPTIONS[currentIndex].value)
        return
      } else {
        return
      }
      const nextValue = DENSITY_OPTIONS[nextIndex].value
      setPreviewDensity(nextValue)
      announce(`Previewing ${nextValue} density`)
      ;(e.currentTarget.parentElement?.children[nextIndex] as HTMLElement)?.focus()
    },
    [handleSelect, announce],
  )

  return (
    <section className="density-preview" aria-labelledby="density-preview-heading">
      <div className="density-preview__header">
        <h2 id="density-preview-heading" className="density-preview__title">
          Interface Density
        </h2>
        <p className="density-preview__description">
          Choose how compact or spacious the interface feels. Hover to preview, click to commit.
        </p>
      </div>

      <div
        className="density-preview__stage"
        data-density={activeDensity}
      >
        <div
          className="density-segment"
          role="radiogroup"
          aria-label="Density mode"
        >
          {DENSITY_OPTIONS.map((option, index) => (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={density === option.value}
              className={`density-segment__btn${density === option.value ? ' is-active' : ''}`}
              onMouseEnter={() => handleHoverEnter(option.value)}
              onMouseLeave={handleHoverLeave}
              onFocus={() => handleHoverEnter(option.value)}
              onBlur={handleHoverLeave}
              onClick={() => handleSelect(option.value)}
              onKeyDown={(e) => handleKeyDown(e, index)}
              tabIndex={density === option.value ? 0 : -1}
            >
              {option.label}
            </button>
          ))}
        </div>

        <div className="density-preview__samples">
          <div className="density-preview__sample">
            <span className="density-preview__sample-label">Table</span>
            <div className="density-preview__table" role="table" aria-label="Density table preview">
              <div className="density-preview__table-row density-preview__table-row--header" role="row">
                <span role="columnheader">Name</span>
                <span role="columnheader">Status</span>
                <span role="columnheader">Amount</span>
              </div>
              <div className="density-preview__table-row" role="row">
                <span role="cell">Invoice #1024</span>
                <span role="cell"><span className="density-preview__badge density-preview__badge--active">Active</span></span>
                <span role="cell">$1,250.00</span>
              </div>
              <div className="density-preview__table-row" role="row">
                <span role="cell">Invoice #1025</span>
                <span role="cell"><span className="density-preview__badge density-preview__badge--draft">Draft</span></span>
                <span role="cell">$890.50</span>
              </div>
              <div className="density-preview__table-row" role="row">
                <span role="cell">Invoice #1026</span>
                <span role="cell"><span className="density-preview__badge density-preview__badge--active">Active</span></span>
                <span role="cell">$2,100.00</span>
              </div>
            </div>
          </div>

          <div className="density-preview__sample">
            <span className="density-preview__sample-label">Form</span>
            <div className="density-preview__form">
              <div className="density-preview__field">
                <label className="density-preview__field-label" htmlFor="preview-name">Business name</label>
                <input
                  id="preview-name"
                  className="density-preview__input"
                  type="text"
                  defaultValue="Acme Corp"
                  readOnly
                  tabIndex={-1}
                />
              </div>
              <div className="density-preview__field">
                <label className="density-preview__field-label" htmlFor="preview-email">Contact email</label>
                <input
                  id="preview-email"
                  className="density-preview__input"
                  type="email"
                  defaultValue="admin@acme.com"
                  readOnly
                  tabIndex={-1}
                />
              </div>
              <button
                type="button"
                className="density-preview__btn"
                tabIndex={-1}
              >
                Save changes
              </button>
            </div>
          </div>

          <div className="density-preview__sample">
            <span className="density-preview__sample-label">Card</span>
            <div className="density-preview__cards">
              <div className="density-preview__card">
                <div className="density-preview__card-title">Monthly Revenue</div>
                <div className="density-preview__card-value">$12,450</div>
                <div className="density-preview__card-meta">+8.2% from last month</div>
              </div>
              <div className="density-preview__card">
                <div className="density-preview__card-title">Active Subscriptions</div>
                <div className="density-preview__card-value">342</div>
                <div className="density-preview__card-meta">+12 this week</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="density-preview__footer">
        <div
          ref={liveRegionRef}
          className="density-preview__live"
          aria-live="polite"
          aria-atomic="true"
        />
        {!isDefault && (
          <button
            type="button"
            className="density-preview__reset"
            onClick={resetDensity}
          >
            <RotateCcw size={14} aria-hidden="true" />
            Reset to default
          </button>
        )}
      </div>
    </section>
  )
}
