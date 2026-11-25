import { describe, it, expect } from 'vitest'
import {
  coerceAmount,
  decimalToMinorUnits,
  formatAmount,
  formatMinorUnits,
  roundAmount,
} from './amount'

describe('decimal minor-unit helpers', () => {
  it('parses decimal values in exponent notation without floating-point scaling', () => {
    expect(decimalToMinorUnits(1e-7, 7)).toBe(1n)
    expect(decimalToMinorUnits('1.23e2', 7)).toBe(1_230_000_000n)
  })

  it('formats integer units with a minimum fraction width', () => {
    expect(formatMinorUnits(1_200_000n, 7, 2)).toBe('0.12')
    expect(formatMinorUnits(1n, 7, 2)).toBe('0.0000001')
  })
})

describe('coerceAmount', () => {
  it('returns null for null / undefined / empty', () => {
    expect(coerceAmount(null)).toBeNull()
    expect(coerceAmount(undefined)).toBeNull()
    expect(coerceAmount('')).toBeNull()
    expect(coerceAmount('   ')).toBeNull()
  })

  it('returns null for NaN / Infinity', () => {
    expect(coerceAmount(NaN)).toBeNull()
    expect(coerceAmount(Infinity)).toBeNull()
    expect(coerceAmount(-Infinity)).toBeNull()
  })

  it('returns null for non-numeric strings', () => {
    expect(coerceAmount('abc')).toBeNull()
    expect(coerceAmount('1.2.3')).toBeNull()
    expect(coerceAmount('--5')).toBeNull()
  })

  it('returns null for non-string non-number inputs', () => {
    // @ts-expect-error testing runtime guard
    expect(coerceAmount({} as unknown)).toBeNull()
    // @ts-expect-error testing runtime guard
    expect(coerceAmount([] as unknown)).toBeNull()
  })

  it('parses plain numbers', () => {
    expect(coerceAmount(0)).toBe(0)
    expect(coerceAmount(10)).toBe(10)
    expect(coerceAmount(-3.5)).toBe(-3.5)
  })

  it('parses numeric strings', () => {
    expect(coerceAmount('0')).toBe(0)
    expect(coerceAmount('1234.56')).toBe(1234.56)
    expect(coerceAmount('-7')).toBe(-7)
  })

  it('strips a trailing currency code from a string', () => {
    expect(coerceAmount('10 USDC')).toBe(10)
    expect(coerceAmount('1.5 USD')).toBe(1.5)
    expect(coerceAmount('100  USDC')).toBe(100)
  })
})

describe('roundAmount', () => {
  it('rejects fractional / negative precision', () => {
    expect(() => roundAmount(1, -1, 'half-up')).toThrow(RangeError)
    expect(() => roundAmount(1, 1.5, 'half-up')).toThrow(RangeError)
  })

  it('passes through non-finite values', () => {
    expect(roundAmount(Infinity, 2, 'half-up')).toBe(Infinity)
    expect(roundAmount(-Infinity, 2, 'half-up')).toBe(-Infinity)
    expect(Number.isNaN(roundAmount(NaN, 2, 'half-up'))).toBe(true)
  })

  describe('half-up (away from zero)', () => {
    it('rounds 0.005 to 0.01 at precision=2 (the classic float-drift case)', () => {
      expect(roundAmount(0.005, 2, 'half-up')).toBe(0.01)
    })

    it('rounds 1.005 to 1.01 at precision=2', () => {
      expect(roundAmount(1.005, 2, 'half-up')).toBe(1.01)
    })

    it('rounds negatives away from zero', () => {
      expect(roundAmount(-0.5, 0, 'half-up')).toBe(-1)
      expect(roundAmount(-2.5, 0, 'half-up')).toBe(-3)
    })

    it('handles precision=0', () => {
      expect(roundAmount(2.4, 0, 'half-up')).toBe(2)
      expect(roundAmount(2.5, 0, 'half-up')).toBe(3)
      expect(roundAmount(2.6, 0, 'half-up')).toBe(3)
    })

    it('handles high precision (USDC on-chain decimals)', () => {
      expect(roundAmount(0.0000005, 6, 'half-up')).toBe(0.000001)
      expect(roundAmount(0.0000001, 6, 'half-up')).toBe(0)
    })
  })

  describe('half-even (banker’s)', () => {
    it('rounds 2.5 → 2 (even)', () => {
      expect(roundAmount(2.5, 0, 'half-even')).toBe(2)
    })

    it('rounds 3.5 → 4 (even)', () => {
      expect(roundAmount(3.5, 0, 'half-even')).toBe(4)
    })

    it('rounds 0.125 → 0.12 at precision=2 (even)', () => {
      expect(roundAmount(0.125, 2, 'half-even')).toBe(0.12)
    })

    it('rounds 0.135 → 0.14 at precision=2 (even)', () => {
      expect(roundAmount(0.135, 2, 'half-even')).toBe(0.14)
    })

    it('falls back to standard rounding when not exactly half', () => {
      expect(roundAmount(0.124, 2, 'half-even')).toBe(0.12)
      expect(roundAmount(0.126, 2, 'half-even')).toBe(0.13)
    })
  })

  describe('down (truncate toward zero)', () => {
    it('truncates positives', () => {
      expect(roundAmount(1.999, 2, 'down')).toBe(1.99)
      expect(roundAmount(0.005, 2, 'down')).toBe(0)
    })

    it('truncates negatives toward zero', () => {
      expect(roundAmount(-1.999, 2, 'down')).toBe(-1.99)
    })
  })

  describe('up (away from zero)', () => {
    it('rounds positives up', () => {
      expect(roundAmount(1.001, 2, 'up')).toBe(1.01)
      expect(roundAmount(0.0001, 2, 'up')).toBe(0.01)
    })

    it('rounds negatives away from zero', () => {
      expect(roundAmount(-1.001, 2, 'up')).toBe(-1.01)
    })
  })
})

describe('formatAmount — basics', () => {
  it('formats a plain number with default precision and currency', () => {
    const f = formatAmount(1234.5)
    expect(f.number).toBe('1,234.50')
    expect(f.currency).toBe('USDC')
    expect(f.display).toBe('1,234.50 USDC')
    expect(f.sign).toBe('')
    expect(f.isNegative).toBe(false)
    expect(f.isZero).toBe(false)
    expect(f.isMissing).toBe(false)
    expect(f.ariaLabel).toBe('1,234.50 USDC')
  })

  it('formats zero with full precision', () => {
    const f = formatAmount(0)
    expect(f.number).toBe('0.00')
    expect(f.isZero).toBe(true)
    expect(f.isNegative).toBe(false)
  })

  it('drops trailing zeros when minPrecision < precision', () => {
    expect(formatAmount(10, { minPrecision: 0 }).number).toBe('10')
    expect(formatAmount(10.5, { minPrecision: 0 }).number).toBe('10.5')
    expect(formatAmount(10.5, { minPrecision: 0, precision: 4 }).number).toBe('10.5')
  })

  it('rounds half-up at the boundary', () => {
    expect(formatAmount(0.005).number).toBe('0.01')
    expect(formatAmount(1.005).number).toBe('1.01')
  })

  it('respects half-even rounding when requested', () => {
    expect(formatAmount(0.125, { rounding: 'half-even' }).number).toBe('0.12')
    expect(formatAmount(0.135, { rounding: 'half-even' }).number).toBe('0.14')
  })

  it('respects down (truncate) rounding', () => {
    expect(formatAmount(0.999, { rounding: 'down' }).number).toBe('0.99')
  })

  it('respects up rounding', () => {
    expect(formatAmount(0.001, { rounding: 'up' }).number).toBe('0.01')
  })
})

describe('formatAmount — sign handling', () => {
  it('renders a leading minus for negatives by default', () => {
    const f = formatAmount(-12.5)
    expect(f.number).toBe('-12.50')
    expect(f.sign).toBe('-')
    expect(f.isNegative).toBe(true)
    expect(f.ariaLabel).toBe('Negative 12.50 USDC')
  })

  it('forces a + with signDisplay="always"', () => {
    const f = formatAmount(10, { signDisplay: 'always' })
    expect(f.number.startsWith('+')).toBe(true)
    expect(f.sign).toBe('+')
    expect(f.ariaLabel).toBe('Plus 10.00 USDC')
  })

  it('hides the sign with signDisplay="never"', () => {
    expect(formatAmount(-10, { signDisplay: 'never' }).number).toBe('10.00')
  })

  it('shows + only for non-zero with signDisplay="except-zero"', () => {
    expect(formatAmount(10, { signDisplay: 'except-zero' }).sign).toBe('+')
    expect(formatAmount(0, { signDisplay: 'except-zero' }).sign).toBe('')
    expect(formatAmount(-10, { signDisplay: 'except-zero' }).sign).toBe('-')
  })
})

describe('formatAmount — locale / compact / currency', () => {
  it('uses locale grouping (en-US default)', () => {
    expect(formatAmount(1000000).number).toBe('1,000,000.00')
  })

  it('honors a custom locale', () => {
    const f = formatAmount(1000.5, { locale: 'de-DE' })
    // de-DE uses '.' as group sep, ',' as decimal
    expect(f.number).toBe('1.000,50')
  })

  it('falls back to en-US when given a structurally invalid locale', () => {
    // BCP-47 forbids `@`/`#`/`!` etc. in language tags, so this throws.
    const f = formatAmount(1000.5, { locale: '@invalid@@' })
    expect(f.number).toBe('1,000.50')
  })

  it('formats large values compactly when compact=true', () => {
    const f = formatAmount(1500000, { compact: true, precision: 1, minPrecision: 0 })
    expect(f.number).toMatch(/1\.5M/)
  })

  it('honors a custom currency code', () => {
    const f = formatAmount(10, { currency: 'XLM' })
    expect(f.currency).toBe('XLM')
    expect(f.display).toBe('10.00 XLM')
    expect(f.ariaLabel).toBe('10.00 XLM')
  })
})

describe('formatAmount — missing / invalid inputs', () => {
  it.each([null, undefined, '', '   ', 'abc', NaN, Infinity, -Infinity])(
    'flags %p as missing',
    (input) => {
      const f = formatAmount(input as number | string | null | undefined)
      expect(f.isMissing).toBe(true)
      expect(f.number).toBe('')
      expect(f.display).toBe('')
      expect(f.ariaLabel).toBe('No USDC amount')
    }
  )

  it('uses the configured currency in the missing label', () => {
    const f = formatAmount(null, { currency: 'XLM' })
    expect(f.ariaLabel).toBe('No XLM amount')
  })

  it('parses values that arrive as strings ("10 USDC")', () => {
    const f = formatAmount('10 USDC')
    expect(f.isMissing).toBe(false)
    expect(f.number).toBe('10.00')
  })
})

describe('formatAmount — input validation', () => {
  it('rejects a negative precision', () => {
    expect(() => formatAmount(1, { precision: -1 })).toThrow(RangeError)
  })

  it('rejects a non-integer precision', () => {
    expect(() => formatAmount(1, { precision: 1.5 })).toThrow(RangeError)
  })

  it('rejects a minPrecision greater than precision', () => {
    expect(() => formatAmount(1, { precision: 2, minPrecision: 3 })).toThrow(RangeError)
  })

  it('rejects a non-integer minPrecision', () => {
    expect(() => formatAmount(1, { precision: 2, minPrecision: 1.5 })).toThrow(RangeError)
  })
})

describe('formatAmount — large values and high precision', () => {
  it('handles very large values', () => {
    expect(formatAmount(1_234_567_890.12).number).toBe('1,234,567,890.12')
  })

  it('handles USDC on-chain precision (6 decimals)', () => {
    const f = formatAmount(0.123456789, { precision: 6 })
    expect(f.number).toBe('0.123457')
  })

  it('keeps a sub-cent positive value visible at precision=6', () => {
    const f = formatAmount(0.0000005, { precision: 6, minPrecision: 6 })
    expect(f.number).toBe('0.000001')
    expect(f.isZero).toBe(false)
  })
})
