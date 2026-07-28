import { useEffect, useId, useMemo, useRef, useState, type ChangeEvent, type FocusEvent, type KeyboardEvent, type MouseEvent } from 'react'

export interface TimezoneOption {
  timeZone: string
  label: string
  region: string
  keywords: string
}

const TIMEZONE_OPTIONS: TimezoneOption[] = [
  { timeZone: 'UTC', label: 'Coordinated Universal Time', region: 'UTC & Others', keywords: 'utc zulu' },
  { timeZone: 'Europe/London', label: 'London', region: 'Europe', keywords: 'london bst gmt' },
  { timeZone: 'Europe/Berlin', label: 'Berlin', region: 'Europe', keywords: 'berlin cest cet' },
  { timeZone: 'Europe/Paris', label: 'Paris', region: 'Europe', keywords: 'paris cest cet' },
  { timeZone: 'Europe/Moscow', label: 'Moscow', region: 'Europe', keywords: 'moscow msks' },
  { timeZone: 'Europe/Istanbul', label: 'Istanbul', region: 'Europe', keywords: 'istanbul trt' },
  { timeZone: 'America/New_York', label: 'New York', region: 'Americas', keywords: 'new york nyc est edt' },
  { timeZone: 'America/Chicago', label: 'Chicago', region: 'Americas', keywords: 'chicago cst cdt' },
  { timeZone: 'America/Denver', label: 'Denver', region: 'Americas', keywords: 'denver mst mdt' },
  { timeZone: 'America/Los_Angeles', label: 'Los Angeles', region: 'Americas', keywords: 'los angeles la pst pdt' },
  { timeZone: 'America/Sao_Paulo', label: 'São Paulo', region: 'Americas', keywords: 'sao paulo brt' },
  { timeZone: 'America/St_Johns', label: 'St. John’s', region: 'Americas', keywords: 'st johns ndt nst' },
  { timeZone: 'Asia/Tokyo', label: 'Tokyo', region: 'Asia Pacific', keywords: 'tokyo jst' },
  { timeZone: 'Asia/Shanghai', label: 'Shanghai', region: 'Asia Pacific', keywords: 'shanghai cst' },
  { timeZone: 'Asia/Kolkata', label: 'Kolkata', region: 'Asia Pacific', keywords: 'kolkata ist' },
  { timeZone: 'Asia/Bangkok', label: 'Bangkok', region: 'Asia Pacific', keywords: 'bangkok ict' },
  { timeZone: 'Asia/Dubai', label: 'Dubai', region: 'Asia Pacific', keywords: 'dubai gst' },
  { timeZone: 'Asia/Kathmandu', label: 'Kathmandu', region: 'Asia Pacific', keywords: 'kathmandu npt +545' },
  { timeZone: 'Australia/Sydney', label: 'Sydney', region: 'Australia', keywords: 'sydney aest aedt' },
  { timeZone: 'Australia/Adelaide', label: 'Adelaide', region: 'Australia', keywords: 'adelaide acst acdt' },
  { timeZone: 'Australia/Perth', label: 'Perth', region: 'Australia', keywords: 'perth awst' },
  { timeZone: 'Pacific/Auckland', label: 'Auckland', region: 'Australia', keywords: 'auckland nzst nzdt' },
  { timeZone: 'Pacific/Chatham', label: 'Chatham Islands', region: 'Australia', keywords: 'chatham chast chadt +1245' },
  { timeZone: 'Pacific/Kiritimati', label: 'Kiritimati', region: 'Australia', keywords: 'kiritimati lint +14' },
  { timeZone: 'Africa/Johannesburg', label: 'Johannesburg', region: 'Africa', keywords: 'johannesburg sast' },
  { timeZone: 'Africa/Cairo', label: 'Cairo', region: 'Africa', keywords: 'cairo eet' },
  { timeZone: 'Africa/Nairobi', label: 'Nairobi', region: 'Africa', keywords: 'nairobi eat' },
  { timeZone: 'Pacific/Honolulu', label: 'Honolulu', region: 'Americas', keywords: 'honolulu hst hawaii' },
  { timeZone: 'America/Anchorage', label: 'Anchorage', region: 'Americas', keywords: 'anchorage akst akdt' },
  { timeZone: 'America/Phoenix', label: 'Phoenix', region: 'Americas', keywords: 'phoenix mst' },
  { timeZone: 'Europe/Dublin', label: 'Dublin', region: 'Europe', keywords: 'dublin gmt' },
]

const REGION_ORDER = [
  'UTC & Others',
  'Americas',
  'Europe',
  'Asia Pacific',
  'Australia',
  'Africa',
] as const

const optionId = (timeZone: string) => `timezone-option-${timeZone.replace(/[^a-zA-Z0-9_-]/g, '-')}`

function getTimeParts(timeZone: string, date = new Date()) {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  })
  const parts = formatter.formatToParts(date)
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value])) as Record<string, string>

  return {
    year: Number(values.year ?? date.getUTCFullYear()),
    month: Number(values.month ?? date.getUTCMonth() + 1),
    day: Number(values.day ?? date.getUTCDate()),
    hour: Number(values.hour ?? date.getUTCHours()),
    minute: Number(values.minute ?? date.getUTCMinutes()),
    second: Number(values.second ?? date.getUTCSeconds()),
  }
}

function getOffsetMinutes(timeZone: string, date = new Date()) {
  try {
    const utcMilliseconds = date.getTime()
    const { year, month, day, hour, minute, second } = getTimeParts(timeZone, date)
    const localUtcMilliseconds = Date.UTC(year, month - 1, day, hour, minute, second)
    return Math.round((localUtcMilliseconds - utcMilliseconds) / 60000)
  } catch {
    return 0
  }
}

function formatUtcOffset(offsetMinutes: number) {
  if (offsetMinutes === 0) return 'UTC±00:00'
  const sign = offsetMinutes >= 0 ? '+' : '-'
  const absMinutes = Math.abs(offsetMinutes)
  const hours = Math.floor(absMinutes / 60)
  const minutes = absMinutes % 60
  return `UTC${sign}${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
}

function getTimeZoneName(timeZone: string, date = new Date()) {
  try {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone,
      timeZoneName: 'short',
    })
    const parts = formatter.formatToParts(date)
    return parts.find((part) => part.type === 'timeZoneName')?.value ?? ''
  } catch {
    return ''
  }
}

function getDaylightSavingInfo(timeZone: string, date = new Date()) {
  const currentOffset = getOffsetMinutes(timeZone, date)
  const januaryOffset = getOffsetMinutes(timeZone, new Date(date.getFullYear(), 0, 1))
  const julyOffset = getOffsetMinutes(timeZone, new Date(date.getFullYear(), 6, 1))
  const usesDst = januaryOffset !== julyOffset
  const dstOffset = Math.max(januaryOffset, julyOffset)
  const isDst = usesDst && currentOffset === dstOffset
  return { usesDst, isDst }
}

interface TimezonePickerProps {
  value: string
  onChange: (timeZone: string) => void
  disabled?: boolean
  label?: string
  helperText?: string
  placeholder?: string
}

export function TimezonePicker({
  value,
  onChange,
  disabled = false,
  label = 'Timezone',
  helperText = 'Search by city, abbreviation, or IANA name',
  placeholder = 'Search time zones…',
}: TimezonePickerProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [query, setQuery] = useState('')
  const [activeIndex, setActiveIndex] = useState(0)
  const inputId = useId()
  const listboxId = `${inputId}-listbox`
  const helperTextId = `${inputId}-helper`
  const previewNoteId = `${inputId}-preview-note`
  const wrapperRef = useRef<HTMLDivElement>(null)

  const selectedOption = useMemo(
    () => TIMEZONE_OPTIONS.find((option) => option.timeZone === value) ?? TIMEZONE_OPTIONS[0],
    [value]
  )

  const normalizedQuery = query.trim().toLowerCase()

  const visibleOptions = useMemo(() => {
    return TIMEZONE_OPTIONS.filter((option) => {
      if (!normalizedQuery) return true
      const haystack = `${option.label} ${option.timeZone} ${option.keywords}`.toLowerCase()
      return haystack.includes(normalizedQuery)
    })
  }, [normalizedQuery])

  const groupedOptions = useMemo(() => {
    return REGION_ORDER.map((region) => ({
      region,
      options: visibleOptions.filter((option) => option.region === region),
    })).filter((group) => group.options.length > 0)
  }, [visibleOptions])

  useEffect(() => {
    if (visibleOptions.length === 0) {
      setActiveIndex(0)
      return
    }

    setActiveIndex((current) => Math.min(current, visibleOptions.length - 1))
  }, [visibleOptions.length])

  const activeOption = visibleOptions[activeIndex]
  const previewOption = activeOption ?? selectedOption
  const previewOffset = formatUtcOffset(getOffsetMinutes(previewOption.timeZone))
  const previewAbbreviation = getTimeZoneName(previewOption.timeZone)
  const { usesDst, isDst } = getDaylightSavingInfo(previewOption.timeZone)

  const resultCountText = visibleOptions.length > 0
    ? `${visibleOptions.length} ${visibleOptions.length === 1 ? 'timezone' : 'timezones'} available.`
    : 'No matching time zones found.'

  const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    setQuery(event.target.value)
    if (!isExpanded) setIsExpanded(true)
  }

  const handleSelect = (option: TimezoneOption) => {
    onChange(option.timeZone)
    setIsExpanded(false)
    setQuery('')
  }

  const handleInputKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (!isExpanded || visibleOptions.length === 0) return
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault()
        setActiveIndex((index) => (index + 1) % visibleOptions.length)
        break
      case 'ArrowUp':
        event.preventDefault()
        setActiveIndex((index) => (index - 1 + visibleOptions.length) % visibleOptions.length)
        break
      case 'Home':
        event.preventDefault()
        setActiveIndex(0)
        break
      case 'End':
        event.preventDefault()
        setActiveIndex(visibleOptions.length - 1)
        break
      case 'Enter':
        event.preventDefault()
        if (activeOption) handleSelect(activeOption)
        break
      case 'Escape':
        event.preventDefault()
        setIsExpanded(false)
        setQuery('')
        break
    }
  }

  const handleWrapperFocus = () => {
    if (!disabled) {
      setIsExpanded(true)
    }
  }

  const handleWrapperBlur = (event: FocusEvent<HTMLDivElement>) => {
    if (disabled) return
    const nextTarget = event.relatedTarget as Node | null
    if (!nextTarget || (wrapperRef.current && !wrapperRef.current.contains(nextTarget))) {
      setIsExpanded(false)
      setQuery('')
    }
  }

  const displayValue = isExpanded ? query : selectedOption ? `${selectedOption.label} (${selectedOption.timeZone})` : ''

  return (
    <div className="flex flex-col gap-2" ref={wrapperRef} onFocus={handleWrapperFocus} onBlur={handleWrapperBlur}>
      <label htmlFor={inputId} className="text-sm font-medium text-[#e2e8f0]">
        {label}
      </label>

      <div className="rounded-2xl border border-[#2a2a2a] bg-[#0f1117] shadow-sm focus-within:border-cyan-500/60 focus-within:ring-1 focus-within:ring-cyan-500/20 transition-colors duration-200">
        <div className="flex items-center gap-2 px-3 py-2">
          <div className="text-slate-500">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5" aria-hidden="true">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 6v6l3 3" />
            </svg>
          </div>
          <input
            id={inputId}
            type="text"
            className="w-full bg-transparent text-sm text-[#e2e8f0] placeholder:text-[#64748b] outline-none"
            placeholder={placeholder}
            aria-autocomplete="list"
            aria-controls={listboxId}
            aria-expanded={isExpanded && visibleOptions.length > 0}
            aria-activedescendant={activeOption ? optionId(activeOption.timeZone) : undefined}
            aria-describedby={`${helperTextId} ${previewNoteId}`}
            role="combobox"
            value={displayValue}
            onChange={handleInputChange}
            onKeyDown={handleInputKeyDown}
            disabled={disabled}
            spellCheck={false}
            autoComplete="off"
          />
          <button
            type="button"
            className="text-slate-500 transition hover:text-[#e2e8f0]"
            onClick={() => {
              if (disabled) return
              setIsExpanded((value) => !value)
            }}
            aria-label={isExpanded ? 'Close timezone list' : 'Open timezone list'}
            disabled={disabled}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5" aria-hidden="true">
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>
        </div>

        {isExpanded && (
          <div className="border-t border-[#2a2a2a] bg-[#0a0c12] p-3">
            <p id={helperTextId} className="text-xs text-slate-500 mb-3">
              {helperText}
            </p>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-wrap gap-2">
                <span className="inline-flex items-center rounded-full border border-slate-700 bg-slate-950 px-3 py-1 text-xs font-semibold text-slate-200">
                  {previewOffset}
                </span>
                {previewAbbreviation && (
                  <span className="inline-flex items-center rounded-full border border-slate-700 bg-slate-950 px-3 py-1 text-xs font-semibold text-slate-200">
                    {previewAbbreviation}
                  </span>
                )}
              </div>
              <p id={previewNoteId} className="text-xs leading-5 text-slate-500 max-w-xl">
                {usesDst
                  ? isDst
                    ? 'Currently observing daylight saving time. Offset may change by season.'
                    : 'Not currently observing daylight saving time. Offset may still vary during the year.'
                  : 'This timezone does not observe daylight saving time.'}
              </p>
            </div>
            <div className="sr-only" role="status" aria-live="polite">
              {resultCountText}
            </div>

            {visibleOptions.length > 0 ? (
              <ul id={listboxId} role="listbox" aria-label="Timezone results" className="mt-3 max-h-72 space-y-2 overflow-y-auto">
                {groupedOptions.map((group) => (
                  <li key={group.region} role="group" aria-labelledby={`${inputId}-${group.region.replace(/\s+/g, '-')}-label`}>
                    <p id={`${inputId}-${group.region.replace(/\s+/g, '-')}-label`} className="text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-slate-500 mb-2">
                      {group.region}
                    </p>
                    <ul className="space-y-1">
                      {group.options.map((option) => {
                        const absoluteIndex = visibleOptions.indexOf(option)
                        const isActive = absoluteIndex === activeIndex
                        return (
                          <li
                            key={option.timeZone}
                            id={optionId(option.timeZone)}
                            role="option"
                            aria-selected={isActive}
                            className={`rounded-xl px-3 py-2 transition ${isActive ? 'bg-cyan-500/10 text-[#e2e8f0]' : 'text-slate-300 hover:bg-slate-800 hover:text-[#e2e8f0]'}`}
                            onMouseMove={() => setActiveIndex(absoluteIndex)}
                            onMouseDown={(event: MouseEvent<HTMLLIElement>) => {
                              event.preventDefault()
                              handleSelect(option)
                            }}
                          >
                            <div className="flex flex-col gap-0.5 text-sm">
                              <span className="font-semibold">{option.label}</span>
                              <span className="text-xs text-slate-500">{option.timeZone}</span>
                            </div>
                          </li>
                        )
                      })}
                    </ul>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="mt-3 rounded-xl border border-slate-800 bg-slate-950 p-4 text-sm text-slate-400">
                No matching time zones found. Try a different city, abbreviation, or IANA name.
              </div>
            )}
            <div className="mt-3 text-[0.75rem] text-slate-500">
              Tip: search by city name, common abbreviation, or the full IANA timezone label.
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default TimezonePicker
