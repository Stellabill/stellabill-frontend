import { renderHook } from '@testing-library/react'
import { describe, it, expect, afterEach } from 'vitest'
import { usePageTitle } from './usePageTitle'

describe('usePageTitle', () => {
  const originalTitle = document.title

  afterEach(() => {
    document.title = originalTitle
  })

  it('sets document.title to "<title> | Stellabill"', () => {
    renderHook(() => usePageTitle('Checkout'))
    expect(document.title).toBe('Checkout | Stellabill')
  })

  it('updates document.title when the title prop changes', () => {
    const { rerender } = renderHook(({ title }) => usePageTitle(title), {
      initialProps: { title: 'Checkout' },
    })

    expect(document.title).toBe('Checkout | Stellabill')

    rerender({ title: 'Dashboard' })

    expect(document.title).toBe('Dashboard | Stellabill')
  })

  it('does not restore the original title on unmount', () => {
    document.title = 'Before'

    const { unmount } = renderHook(() => usePageTitle('Checkout'))
    expect(document.title).toBe('Checkout | Stellabill')

    unmount()

    expect(document.title).toBe('Checkout | Stellabill')
  })
})
