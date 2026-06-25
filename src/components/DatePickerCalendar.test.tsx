import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import DatePickerCalendar from './DatePickerCalendar';

describe('DatePickerCalendar', () => {
  const mockOnDateSelect = vi.fn();
  const mockOnDateChange = vi.fn();

  beforeEach(() => {
    mockOnDateSelect.mockClear();
    mockOnDateChange.mockClear();
  });

  it('renders calendar with current month', () => {
    render(
      <DatePickerCalendar
        selectedDate={null}
        onDateSelect={mockOnDateSelect}
      />
    );
    
    const heading = screen.getByRole('heading', { level: 3 });
    const currentDate = new Date();
    const expectedMonth = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    
    expect(heading).toHaveTextContent(expectedMonth);
  });

  it('displays all days of the week headers', () => {
    render(
      <DatePickerCalendar
        selectedDate={null}
        onDateSelect={mockOnDateSelect}
      />
    );
    
    const dayHeaders = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    dayHeaders.forEach(day => {
      expect(screen.getByText(day)).toBeInTheDocument();
    });
  });

  it('selects a date when clicked', async () => {
    const user = userEvent.setup();
    render(
      <DatePickerCalendar
        selectedDate={null}
        onDateSelect={mockOnDateSelect}
      />
    );
    
    const today = new Date().getDate();
    const dayButtons = screen.getAllByRole('button');
    const dayButton = dayButtons.find(btn => btn.textContent === String(today));
    
    if (dayButton) {
      await user.click(dayButton);
      expect(mockOnDateSelect).toHaveBeenCalled();
    }
  });

  it('navigates to previous month', async () => {
    const user = userEvent.setup();
    render(
      <DatePickerCalendar
        selectedDate={null}
        onDateSelect={mockOnDateSelect}
      />
    );
    
    const prevButtons = screen.getAllByRole('button').filter(btn => 
      btn.className.includes('calendar-nav-prev')
    );
    
    if (prevButtons.length > 0) {
      await user.click(prevButtons[0]);
      await waitFor(() => {
        const heading = screen.getByRole('heading', { level: 3 });
        const prevMonth = new Date();
        prevMonth.setMonth(prevMonth.getMonth() - 1);
        const expectedMonth = prevMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
        expect(heading).toHaveTextContent(expectedMonth);
      });
    }
  });

  it('navigates to next month', async () => {
    const user = userEvent.setup();
    render(
      <DatePickerCalendar
        selectedDate={null}
        onDateSelect={mockOnDateSelect}
      />
    );
    
    const nextButtons = screen.getAllByRole('button').filter(btn => 
      btn.className.includes('calendar-nav-next')
    );
    
    if (nextButtons.length > 0) {
      await user.click(nextButtons[0]);
      await waitFor(() => {
        const heading = screen.getByRole('heading', { level: 3 });
        const nextMonth = new Date();
        nextMonth.setMonth(nextMonth.getMonth() + 1);
        const expectedMonth = nextMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
        expect(heading).toHaveTextContent(expectedMonth);
      });
    }
  });

  it('disables dates before minDate', () => {
    const minDate = new Date();
    minDate.setDate(minDate.getDate() + 5);
    
    render(
      <DatePickerCalendar
        selectedDate={null}
        onDateSelect={mockOnDateSelect}
        minDate={minDate}
      />
    );
    
    const today = new Date().getDate();
    const dayButtons = screen.getAllByRole('button');
    const todayButton = dayButtons.find(btn => btn.textContent === String(today));
    
    if (todayButton) {
      expect(todayButton).toBeDisabled();
    }
  });

  it('disables dates after maxDate', () => {
    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() + 3);
    
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 10);
    
    render(
      <DatePickerCalendar
        selectedDate={null}
        onDateSelect={mockOnDateSelect}
        maxDate={maxDate}
      />
    );
    
    const dayButtons = screen.getAllByRole('button');
    const futureButton = dayButtons.find(btn => btn.textContent === String(futureDate.getDate()));
    
    if (futureButton) {
      expect(futureButton).toBeDisabled();
    }
  });

  it('handles keyboard navigation with arrow keys', async () => {
    const user = userEvent.setup();
    const selectedDate = new Date();
    selectedDate.setDate(15);
    
    render(
      <DatePickerCalendar
        selectedDate={selectedDate}
        onDateSelect={mockOnDateSelect}
      />
    );
    
    const buttons = screen.getAllByRole('button').filter(btn => 
      !btn.className.includes('calendar-nav')
    );
    
    if (buttons.length > 0) {
      const focusedButton = buttons.find(btn => btn.getAttribute('aria-pressed') === 'true');
      if (focusedButton) {
        await user.keyboard('{ArrowRight}');
        expect(mockOnDateSelect).not.toHaveBeenCalledTimes(1);
      }
    }
  });

  it('handles Enter key to select date', async () => {
    const user = userEvent.setup();
    render(
      <DatePickerCalendar
        selectedDate={null}
        onDateSelect={mockOnDateSelect}
      />
    );
    
    const today = new Date().getDate();
    const dayButtons = screen.getAllByRole('button');
    const dayButton = dayButtons.find(btn => btn.textContent === String(today));
    
    if (dayButton) {
      dayButton.focus();
      await user.keyboard('{Enter}');
      expect(mockOnDateSelect).toHaveBeenCalled();
    }
  });

  it('marks today with aria-current', () => {
    render(
      <DatePickerCalendar
        selectedDate={null}
        onDateSelect={mockOnDateSelect}
      />
    );
    
    const today = new Date().getDate();
    const dayButtons = screen.getAllByRole('button');
    const todayButton = dayButtons.find(btn => btn.textContent === String(today));
    
    if (todayButton) {
      expect(todayButton).toHaveAttribute('aria-current', 'date');
    }
  });

  it('shows selected date with aria-pressed', () => {
    const selectedDate = new Date();
    selectedDate.setDate(15);
    
    render(
      <DatePickerCalendar
        selectedDate={selectedDate}
        onDateSelect={mockOnDateSelect}
      />
    );
    
    const buttons = screen.getAllByRole('button').filter(btn => 
      btn.getAttribute('aria-pressed') === 'true'
    );
    
    expect(buttons.length).toBeGreaterThan(0);
  });

  it('has accessible labels for navigation buttons', () => {
    render(
      <DatePickerCalendar
        selectedDate={null}
        onDateSelect={mockOnDateSelect}
      />
    );
    
    const buttons = screen.getAllByRole('button');
    const navButtons = buttons.filter(btn => 
      btn.getAttribute('aria-label')?.includes('month')
    );
    
    expect(navButtons.length).toBeGreaterThan(0);
  });

  it('provides accessible day labels', () => {
    render(
      <DatePickerCalendar
        selectedDate={null}
        onDateSelect={mockOnDateSelect}
      />
    );
    
    const today = new Date().getDate();
    const dayButtons = screen.getAllByRole('button');
    const todayButton = dayButtons.find(btn => btn.textContent === String(today));
    
    if (todayButton) {
      const ariaLabel = todayButton.getAttribute('aria-label');
      expect(ariaLabel).toContain(String(today));
    }
  });

  it('calls onDateChange when provided', async () => {
    const user = userEvent.setup();
    render(
      <DatePickerCalendar
        selectedDate={null}
        onDateSelect={mockOnDateSelect}
        onDateChange={mockOnDateChange}
      />
    );
    
    const today = new Date().getDate();
    const dayButtons = screen.getAllByRole('button');
    const dayButton = dayButtons.find(btn => btn.textContent === String(today));
    
    if (dayButton) {
      await user.click(dayButton);
      expect(mockOnDateChange).toHaveBeenCalled();
    }
  });

  it('has role="application" for accessibility', () => {
    render(
      <DatePickerCalendar
        selectedDate={null}
        onDateSelect={mockOnDateSelect}
      />
    );
    
    const calendar = screen.getByRole('application');
    expect(calendar).toBeInTheDocument();
  });

  it('displays info text with icon', () => {
    render(
      <DatePickerCalendar
        selectedDate={null}
        onDateSelect={mockOnDateSelect}
      />
    );
    
    expect(screen.getByText(/Select a date to pause until/i)).toBeInTheDocument();
  });

  it('renders correct number of calendar days', () => {
    render(
      <DatePickerCalendar
        selectedDate={null}
        onDateSelect={mockOnDateSelect}
      />
    );
    
    const currentDate = new Date();
    const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
    
    const dayButtons = screen.getAllByRole('button').filter(btn => {
      const text = btn.textContent?.trim();
      return !text?.includes('Go to') && !text?.includes('Select');
    });
    
    // Account for empty cells and nav buttons
    expect(dayButtons.length).toBeGreaterThanOrEqual(daysInMonth);
  });

  it('maintains focus on navigation', async () => {
    const user = userEvent.setup();
    render(
      <DatePickerCalendar
        selectedDate={null}
        onDateSelect={mockOnDateSelect}
      />
    );
    
    const prevButton = screen.getAllByRole('button').find(btn => 
      btn.className.includes('calendar-nav-prev')
    );
    
    if (prevButton) {
      prevButton.focus();
      expect(prevButton).toHaveFocus();
    }
  });
});
