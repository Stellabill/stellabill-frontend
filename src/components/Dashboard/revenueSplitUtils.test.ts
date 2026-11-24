import { describe, expect, it } from 'vitest'
import {
  buildScreenReaderSummary,
  computePlanShares,
  revenueDeltaPercent,
} from './revenueSplitUtils'

describe('revenue split utilities', () => {
  it('returns zero for two empty periods', () => {
    expect(revenueDeltaPercent(0, 0)).toBe(0)
  })

  it('returns null when revenue is new in the current period', () => {
    expect(revenueDeltaPercent(25, 0)).toBeNull()
  })

  it('computes the normal percentage change', () => {
    expect(revenueDeltaPercent(125, 100)).toBe(25)
  })

  it('clamps negative revenue and ranks plans by current revenue', () => {
    expect(
      computePlanShares([
        { planId: 'low', planName: 'Low', revenue: -10, previousRevenue: -5 },
        { planId: 'high', planName: 'High', revenue: 100, previousRevenue: 50 },
      ]),
    ).toEqual([
      expect.objectContaining({
        planId: 'high',
        revenue: 100,
        previousRevenue: 50,
        sharePercent: 100,
        currency: 'USDC',
      }),
      expect.objectContaining({
        planId: 'low',
        revenue: 0,
        previousRevenue: 0,
        sharePercent: 0,
        revenueDeltaPercent: 0,
      }),
    ])
  })

  it('handles an empty plan collection without a summary', () => {
    expect(buildScreenReaderSummary([], 0, 'this month')).toBe(
      'No plan revenue for this month.',
    )
  })

  it('announces a newly active plan deterministically', () => {
    const [share] = computePlanShares([
      { planId: 'new', planName: 'New', revenue: 40, previousRevenue: 0, currency: 'EUR' },
    ])

    expect(buildScreenReaderSummary([share], 40, 'this month')).toContain(
      'New 100 percent (new this period)',
    )
  })
})
