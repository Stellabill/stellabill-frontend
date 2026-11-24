import { describe, expect, it } from 'vitest'
import {
  formatRaw,
  getDecimalSeparator,
  getGroupSeparator,
  toNumericString,
} from './amountInputUtils'

describe('getDecimalSeparator', () => {
  it('returns the decimal separator for a locale', () => {
    expect(getDecimalSeparator('en-US')).toBe('.')
    expect(getDecimalSeparator('de-DE')).toBe(',')
  })

  it('falls back to a period for an invalid locale', () => {
    expect(getDecimalSeparator('not-a-locale')).toBe('.')
  })
})

describe('getGroupSeparator', () => {
  it('returns the grouping separator for a locale', () => {
    expect(getGroupSeparator('en-US')).toBe(',')
    expect(getGroupSeparator('de-DE')).toBe('.')
  })

  it('falls back to a comma for an invalid locale', () => {
    expect(getGroupSeparator('not-a-locale')).toBe(',')
  })
})

describe('formatRaw', () => {
  it('groups the integer and uses the locale decimal separator', () => {
    expect(formatRaw('1234567.89', 'en-US', 2)).toBe('1,234,567.89')
    expect(formatRaw('1234.5', 'de-DE', 2)).toBe('1.234,5')
  })

  it('preserves a trailing decimal separator and truncates excess digits', () => {
    expect(formatRaw('1234.', 'en-US', 2)).toBe('1,234.')
    expect(formatRaw('12.345', 'en-US', 2)).toBe('12.34')
  })

  it('omits decimal parts for zero-decimal currencies', () => {
    expect(formatRaw('1234.56', 'en-US', 0)).toBe('1,234')
  })

  it('keeps empty and negative-only input unchanged', () => {
    expect(formatRaw('', 'en-US', 2)).toBe('')
    expect(formatRaw('-', 'en-US', 2)).toBe('-')
  })
})

describe('toNumericString', () => {
  it('removes locale grouping and normalizes the decimal separator', () => {
    expect(toNumericString('1,234.50', 'en-US')).toBe('1234.50')
    expect(toNumericString('1.234,50', 'de-DE')).toBe('1234.50')
  })

  it('escapes regular-expression characters in separators', () => {
    expect(toNumericString('1.234.567,50', 'de-DE')).toBe('1234567.50')
  })
})
