import type {
  ClipboardEventHandler,
  FocusEventHandler,
  KeyboardEventHandler,
  ChangeEventHandler,
  RefObject,
} from 'react'
import type { AmountInputStatus } from './AmountInput'

interface AmountInputFieldProps {
  symbol: string
  inputRef: RefObject<HTMLInputElement>
  id: string
  display: string
  placeholder: string
  disabled: boolean
  required: boolean
  hasError: boolean
  messageText?: string
  status: AmountInputStatus
  onChange: ChangeEventHandler<HTMLInputElement>
  onPaste: ClipboardEventHandler<HTMLInputElement>
  onBlur: FocusEventHandler<HTMLInputElement>
  onFocus: FocusEventHandler<HTMLInputElement>
  onKeyDown: KeyboardEventHandler<HTMLInputElement>
}

export default function AmountInputField({
  symbol,
  inputRef,
  id,
  display,
  placeholder,
  disabled,
  required,
  hasError,
  messageText,
  status,
  onChange,
  onPaste,
  onBlur,
  onFocus,
  onKeyDown,
}: AmountInputFieldProps) {
  return (
    <>
      {symbol && symbol !== '*' && (
        <span className="amt-symbol" aria-hidden="true">
          {symbol}
        </span>
      )}

      <input
        ref={inputRef}
        id={id}
        type="text"
        inputMode="decimal"
        autoComplete="off"
        autoCorrect="off"
        spellCheck={false}
        value={display}
        placeholder={placeholder}
        disabled={disabled}
        required={required}
        aria-required={required}
        aria-invalid={hasError}
        aria-describedby={messageText || status !== 'idle' ? `${id}-msg` : undefined}
        className="amt-input-field"
        onChange={onChange}
        onPaste={onPaste}
        onBlur={onBlur}
        onFocus={onFocus}
        onKeyDown={onKeyDown}
        dir="ltr"
      />

      {status === 'pending' && (
        <span className="amt-status-icon amt-status-icon--pending" aria-hidden="true">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" opacity="0.25" />
            <path d="M12 2a10 10 0 0 1 10 10" />
          </svg>
        </span>
      )}
      {status === 'success' && (
        <span className="amt-status-icon amt-status-icon--success" aria-hidden="true">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </span>
      )}
      {hasError && (
        <span className="amt-status-icon amt-status-icon--error" aria-hidden="true">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        </span>
      )}
    </>
  )
}
