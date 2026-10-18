import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import FAQ from './FAQ'

const QUESTIONS = [
  'What is prepaid balance?',
  'How does cancellation work?',
  'Which wallets are supported?',
]

const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

const questionButton = (question: string) =>
  screen.getByRole('button', { name: new RegExp(escapeRegExp(question), 'i') })

describe('FAQ', () => {
  it('renders the section heading and one accordion row per question', () => {
    render(<FAQ />)

    expect(
      screen.getByRole('heading', { level: 2, name: /frequently asked questions/i })
    ).toBeInTheDocument()

    const list = screen.getByRole('list')
    expect(list.querySelectorAll('[role="listitem"]')).toHaveLength(QUESTIONS.length)

    for (const question of QUESTIONS) {
      expect(questionButton(question)).toBeInTheDocument()
    }
  })

  it('starts with the third question expanded and the others collapsed', () => {
    render(<FAQ />)

    const buttons = QUESTIONS.map(questionButton)
    expect(buttons.map((b) => b.getAttribute('aria-expanded'))).toEqual([
      'false',
      'false',
      'true',
    ])
  })

  it('wires each trigger to its panel through aria-controls / aria-labelledby', () => {
    render(<FAQ />)

    QUESTIONS.forEach((_, index) => {
      const button = questionButton(QUESTIONS[index])
      const panel = document.getElementById(`faq-panel-${index}`)

      expect(button).toHaveAttribute('id', `faq-button-${index}`)
      expect(button).toHaveAttribute('aria-controls', `faq-panel-${index}`)
      expect(panel).not.toBeNull()
      expect(panel).toHaveAttribute('role', 'region')
      expect(panel).toHaveAttribute('aria-labelledby', `faq-button-${index}`)
    })
  })

  it('expands a collapsed row when its trigger is clicked', () => {
    render(<FAQ />)
    const first = questionButton(QUESTIONS[0])

    expect(first).toHaveAttribute('aria-expanded', 'false')
    fireEvent.click(first)
    expect(first).toHaveAttribute('aria-expanded', 'true')
  })

  it('collapses an expanded row when its trigger is clicked again', () => {
    render(<FAQ />)
    const third = questionButton(QUESTIONS[2])

    expect(third).toHaveAttribute('aria-expanded', 'true')
    fireEvent.click(third)
    expect(third).toHaveAttribute('aria-expanded', 'false')
    fireEvent.click(third)
    expect(third).toHaveAttribute('aria-expanded', 'true')
  })

  it('keeps at most one row expanded at a time when switching rows', () => {
    render(<FAQ />)

    fireEvent.click(questionButton(QUESTIONS[0]))

    const expanded = screen
      .getAllByRole('button')
      .filter((b) => b.getAttribute('aria-expanded') === 'true')
    expect(expanded).toHaveLength(1)
    expect(expanded[0]).toHaveAccessibleName(new RegExp(escapeRegExp(QUESTIONS[0]), 'i'))
    expect(questionButton(QUESTIONS[2])).toHaveAttribute('aria-expanded', 'false')
  })

  it('marks each chevron as decorative and reflects the expanded state', () => {
    const { container } = render(<FAQ />)
    const chevrons = container.querySelectorAll('svg[aria-hidden="true"]')
    expect(chevrons).toHaveLength(QUESTIONS.length)

    const classLists = Array.from(chevrons).map((svg) => svg.getAttribute('class') ?? '')
    expect(classLists[2]).not.toBe(classLists[0])
    expect(classLists[0]).toBe(classLists[1])
  })

  it('renders the answer copy for every question in the DOM', () => {
    render(<FAQ />)
    expect(screen.getByText(/credit you load into your stellabill account/i)).toBeInTheDocument()
    expect(screen.getByText(/cancel any subscription at any time/i)).toBeInTheDocument()
    expect(screen.getByText(/freighter, lobstr, and albedo/i)).toBeInTheDocument()
  })

  it('is idempotent across unmount/remount cycles', () => {
    const first = render(<FAQ />)
    expect(questionButton(QUESTIONS[2])).toHaveAttribute('aria-expanded', 'true')
    first.unmount()

    render(<FAQ />)
    expect(questionButton(QUESTIONS[2])).toHaveAttribute('aria-expanded', 'true')
    expect(questionButton(QUESTIONS[0])).toHaveAttribute('aria-expanded', 'false')
  })
})
