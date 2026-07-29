import React, { useEffect, useId, useRef, useState } from 'react'
import { Info } from 'lucide-react'
import { useModalFocus } from '../../hooks/useModalFocus'
import './FieldHelpPopover.css'

type PopoverAlign = 'center' | 'start' | 'end'

export interface FieldHelpPopoverProps {
  title: string
  children: React.ReactNode
  ariaLabel?: string
  align?: PopoverAlign
}

export function FieldHelpPopover({
  title,
  children,
  ariaLabel,
  align = 'center',
}: FieldHelpPopoverProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [resolvedAlign, setResolvedAlign] = useState<PopoverAlign>(align)
  const id = useId()
  const popoverId = id + '-popover'
  const titleId = id + '-title'
  const rootRef = useRef<HTMLSpanElement>(null)
  const popoverRef = useRef<HTMLDivElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)

  useModalFocus(popoverRef, {
    isOpen,
    onClose: () => setIsOpen(false),
    initialFocusRef: closeRef,
  })

  useEffect(() => {
    if (!isOpen) return

    const handlePointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('pointerdown', handlePointerDown)
    return () => document.removeEventListener('pointerdown', handlePointerDown)
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) return

    const frame = window.requestAnimationFrame(() => {
      const popover = popoverRef.current
      if (!popover) return

      const rect = popover.getBoundingClientRect()
      const padding = 16
      if (rect.left < padding) {
        setResolvedAlign(document.dir === 'rtl' ? 'end' : 'start')
      } else if (rect.right > window.innerWidth - padding) {
        setResolvedAlign(document.dir === 'rtl' ? 'start' : 'end')
      } else {
        setResolvedAlign(align)
      }
    })

    return () => window.cancelAnimationFrame(frame)
  }, [align, isOpen])

  const close = () => {
    setIsOpen(false)
    window.requestAnimationFrame(() => triggerRef.current?.focus())
  }

  return (
    <span className="field-help" ref={rootRef}>
      <button
        ref={triggerRef}
        type="button"
        className="field-help__trigger"
        aria-label={ariaLabel ?? 'Help for ' + title}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        aria-controls={isOpen ? popoverId : undefined}
        onClick={() => setIsOpen((current) => !current)}
      >
        <Info size={15} strokeWidth={2.2} aria-hidden="true" />
      </button>

      {isOpen && (
        <div
          ref={popoverRef}
          id={popoverId}
          className="field-help__popover"
          data-align={resolvedAlign}
          role="dialog"
          aria-modal="false"
          aria-labelledby={titleId}
        >
          <h4 id={titleId} className="field-help__title">
            {title}
          </h4>
          <div className="field-help__content">
            {children}
            <button ref={closeRef} type="button" className="field-help__close" onClick={close}>
              Got it
            </button>
          </div>
        </div>
      )}
    </span>
  )
}

export interface FieldLabelWithHelpProps {
  htmlFor?: string
  children: React.ReactNode
  helpTitle: string
  help: React.ReactNode
  required?: boolean
  optional?: boolean
  style?: React.CSSProperties
}

export function FieldLabelWithHelp({
  htmlFor,
  children,
  helpTitle,
  help,
  required,
  optional,
  style,
}: FieldLabelWithHelpProps) {
  return (
    <span className="field-label-with-help" style={style}>
      <label htmlFor={htmlFor}>
        {children}
        {required && <span style={{ color: '#f87171', marginLeft: '0.25rem' }}>*</span>}
        {optional && <span style={{ color: '#64748b', fontWeight: 400, marginLeft: '0.25rem' }}>(optional)</span>}
      </label>
      <FieldHelpPopover title={helpTitle}>{help}</FieldHelpPopover>
    </span>
  )
}
