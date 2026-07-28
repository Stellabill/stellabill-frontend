import { useEffect, useId, useMemo, useRef, useState, type ChangeEvent, type FocusEvent, type KeyboardEvent, type MouseEvent } from 'react'
import { COUNTRY_OPTIONS, type CountryOption } from '../../data/countries'

export interface CountryRegionPickerProps {
  value: string
  onChange: (countryCode: string) => void
  label?: string
  helperText?: string
  placeholder?: string
  disabled?: boolean
  recentStorageKey?: string
  errorMessage?: string
}

const RECENT_COUNTRIES_MAX = 5
const COUNTRY_GROUP_ORDER = ['Americas', 'Europe', 'Asia', 'Africa', 'Oceania', 'Antarctica']

function createDisplayNames(locale?: string | string[]) {
  try {
    return new Intl.DisplayNames(locale, { type: 'region' })
  } catch {
    return undefined
  }
}

function getCountryLabel(displayNames: Intl.DisplayNames | undefined, code: string) {
  return displayNames?.of(code) ?? code
}

function normalizeText(value: string) {
  return value.trim().toLowerCase()
}

function safeParseRecentCodes(value: string | null) {
  if (!value) return []
  try {
    const parsed = JSON.parse(value)
    return Array.isArray(parsed) ? parsed.filter((code) => typeof code === 'string') : []
  } catch {
    return []
  }
}

export function CountryRegionPicker({
  value,
  onChange,
  label = 'Country',
  helperText = 'Search countries by name, ISO code, or region.',
  placeholder = 'Start typing a country name…',
  disabled = false,
  recentStorageKey = 'country-region-picker-recent',
  errorMessage,
}: CountryRegionPickerProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [query, setQuery] = useState('')
  const [activeIndex, setActiveIndex] = useState(0)
  const [recentCodes, setRecentCodes] = useState<string[]>([])
  const wrapperRef = useRef<HTMLDivElement>(null)
  const inputId = useId()
  const listboxId = `${inputId}-listbox`
  const helperTextId = `${inputId}-helper`
  const statusId = `${inputId}-status`
  const displayNames = useMemo(() => createDisplayNames(undefined), [])

  const options = useMemo(() => {
    return COUNTRY_OPTIONS.map((option) => {
      const label = getCountryLabel(displayNames, option.code)
      const searchText = [label, option.code, option.region, option.subregion].join(' ').toLowerCase()
      return { ...option, label, searchText }
    })
  }, [displayNames])

  const selectedOption = useMemo(
    () => options.find((option) => option.code === value),
    [options, value]
  )

  const normalizedQuery = normalizeText(query)

  const visibleOptions = useMemo(() => {
    if (!normalizedQuery) return options
    return options.filter((option) => option.searchText.includes(normalizedQuery))
  }, [normalizedQuery, options])

  const recentOptions = useMemo(
    () =>
      recentCodes
        .map((code) => options.find((option) => option.code === code))
        .filter(Boolean) as (CountryOption & { label: string; searchText: string })[],
    [options, recentCodes]
  )

  const optionGroups = useMemo(() => {
    const groups: Array<{ region: string; options: typeof options }> = []

    if (!normalizedQuery && recentOptions.length > 0) {
      groups.push({ region: 'Recent', options: recentOptions })
    }

    COUNTRY_GROUP_ORDER.forEach((region) => {
      const regionOptions = visibleOptions.filter((option) => option.region === region)
      if (regionOptions.length) {
        groups.push({ region, options: regionOptions })
      }
    })

    const otherOptions = visibleOptions.filter((option) => !COUNTRY_GROUP_ORDER.includes(option.region))
    if (otherOptions.length) {
      groups.push({ region: 'Other', options: otherOptions })
    }

    return groups
  }, [normalizedQuery, recentOptions, visibleOptions])

  useEffect(() => {
    const stored = typeof window !== 'undefined' ? window.localStorage.getItem(recentStorageKey) : null
    setRecentCodes(safeParseRecentCodes(stored).slice(0, RECENT_COUNTRIES_MAX))
  }, [recentStorageKey])

  useEffect(() => {
    if (visibleOptions.length === 0) {
      setActiveIndex(0)
      return
    }

    setActiveIndex((current) => Math.min(current, visibleOptions.length - 1))
  }, [visibleOptions.length])

  const activeOption = visibleOptions[activeIndex]

  const resultCountText = useMemo(() => {
    if (!isExpanded) return ''
    if (visibleOptions.length === 0) {
      return 'No matching countries found.'
    }
    return `${visibleOptions.length} ${visibleOptions.length === 1 ? 'country' : 'countries'} available.`
  }, [isExpanded, visibleOptions.length])

  const updateRecentCodes = (countryCode: string) => {
    if (disabled) return
    const next = [countryCode, ...recentCodes.filter((code) => code !== countryCode)].slice(0, RECENT_COUNTRIES_MAX)
    setRecentCodes(next)
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(recentStorageKey, JSON.stringify(next))
    }
  }

  const handleSelect = (option: typeof options[number]) => {
    onChange(option.code)
    updateRecentCodes(option.code)
    setIsExpanded(false)
    setQuery('')
  }

  const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    setQuery(event.target.value)
    if (!isExpanded) setIsExpanded(true)
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
        if (activeOption) {
          handleSelect(activeOption)
        }
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

  const displayValue = isExpanded ? query : selectedOption?.label ?? ''
  const errorMessageId = `${inputId}-error`

  return (
    <div className="flex flex-col gap-2" ref={wrapperRef} onFocus={handleWrapperFocus} onBlur={handleWrapperBlur}>
      <label htmlFor={inputId} className="text-sm font-semibold text-[#e2e8f0]">
        {label}
      </label>

      <div className="rounded-3xl border border-[#2a2a2a] bg-[#0c1220] shadow-sm focus-within:border-cyan-500/50 focus-within:ring-1 focus-within:ring-cyan-500/20 transition-colors duration-200">
        <div className="flex items-center gap-2 px-3 py-2">
          <input
            id={inputId}
            type="text"
            className="w-full bg-transparent text-sm text-[#e2e8f0] placeholder:text-slate-500 outline-none"
            placeholder={placeholder}
            role="combobox"
            aria-autocomplete="list"
            aria-controls={listboxId}
            aria-expanded={isExpanded}
            aria-activedescendant={activeOption ? `${listboxId}-option-${activeOption.code}` : undefined}
            aria-describedby={`${helperTextId} ${statusId}${errorMessage ? ` ${errorMessageId}` : ''}`}
            aria-invalid={!!errorMessage}
            value={displayValue}
            onChange={handleInputChange}
            onKeyDown={handleInputKeyDown}
            disabled={disabled}
            autoComplete="off"
            spellCheck="false"
          />
          <button
            type="button"
            className="rounded-full p-2 text-slate-400 transition hover:text-[#e2e8f0] focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-500"
            aria-label={isExpanded ? 'Hide country list' : 'Show country list'}
            onClick={() => {
              if (disabled) return
              setIsExpanded((value) => !value)
            }}
            disabled={disabled}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5" aria-hidden="true">
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>
        </div>

        {isExpanded && (
          <div className="border-t border-[#1f2937] bg-[#070b14] p-3">
            <p id={helperTextId} className="text-xs text-slate-500 mb-3">
              {helperText}
            </p>
            <div className="sr-only" role="status" aria-live="polite" id={statusId}>
              {resultCountText}
            </div>
            {visibleOptions.length > 0 ? (
              <ul id={listboxId} role="listbox" aria-label="Country results" className="max-h-72 space-y-3 overflow-y-auto pr-1">
                {optionGroups.map((group) => (
                  <li key={group.region} role="group" aria-labelledby={`${inputId}-${group.region.replace(/\s+/g, '-')}-label`}>
                    <div className="sticky top-0 z-10 border-b border-slate-800 bg-[#070b14] px-2 py-2 text-[0.65rem] font-semibold uppercase tracking-[0.26em] text-slate-500">
                      {group.region}
                    </div>
                    <ul className="space-y-1">
                      {group.options.map((option) => {
                        const absoluteIndex = visibleOptions.indexOf(option)
                        const isActive = absoluteIndex === activeIndex
                        return (
                          <li
                            key={option.code}
                            id={`${listboxId}-option-${option.code}`}
                            role="option"
                            aria-selected={isActive}
                            className={`rounded-2xl px-3 py-2 transition ${isActive ? 'bg-cyan-500/10 text-[#e2e8f0]' : 'text-slate-300 hover:bg-slate-800 hover:text-[#e2e8f0]'}`}
                            onMouseMove={() => setActiveIndex(absoluteIndex)}
                            onMouseDown={(event: MouseEvent<HTMLLIElement>) => {
                              event.preventDefault()
                              handleSelect(option)
                            }}
                          >
                            <div className="flex flex-col gap-0.5 text-sm">
                              <span className="font-semibold">{option.label}</span>
                              <span className="text-xs text-slate-500">
                                {option.code} • {option.subregion || option.region}
                              </span>
                            </div>
                          </li>
                        )
                      })}
                    </ul>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="rounded-3xl border border-slate-800 bg-[#08101e] p-4 text-sm text-slate-400">
                No matching countries found. Try another name, ISO code, or region.
              </div>
            )}
          </div>
        )}
      </div>
      {errorMessage ? (
        <p id={errorMessageId} className="text-sm text-rose-400" role="alert">
          {errorMessage}
        </p>
      ) : null}
    </div>
  )
}

export default CountryRegionPicker
