import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import DatePickerCalendar from './DatePickerCalendar';

describe('DatePickerCalendar', () => {
  const mockOnDateSelect = vi.fn();
  const mockOnDateChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the current month when no selected date is provided', () => {
    const today = new Date();
    render(
      <DatePickerCalendar 
        selectedDate={null} 
        onDateSelect={mockOnDateSelect} 
      />
    );
    
    const monthYearString = today.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    expect(screen.getByText(monthYearString)).toBeInTheDocument();
  });

  it('renders the month of the selected date', () => {
    const selectedDate = new Date(2023, 5, 15); // June 15, 2023
    render(
      <DatePickerCalendar 
        selectedDate={selectedDate} 
        onDateSelect={mockOnDateSelect} 
      />
    );
    
    expect(screen.getByText('June 2023')).toBeInTheDocument();
  });

  it('navigates to previous and next months', () => {
    const selectedDate = new Date(2023, 5, 15); // June 15, 2023
    render(
      <DatePickerCalendar 
        selectedDate={selectedDate} 
        onDateSelect={mockOnDateSelect} 
      />
    );
    
    const prevButton = screen.getByRole('button', { name: /Go to previous month/i });
    const nextButton = screen.getByRole('button', { name: /Go to next month/i });

    // Navigate to previous month
    fireEvent.click(prevButton);
    expect(screen.getByText('May 2023')).toBeInTheDocument();

    // Navigate to next month (twice to go from May to July)
    fireEvent.click(nextButton);
    fireEvent.click(nextButton);
    expect(screen.getByText('July 2023')).toBeInTheDocument();
  });

  it('calls onDateSelect and onDateChange when a valid date is clicked', () => {
    const selectedDate = new Date(2023, 5, 15); // June 15, 2023
    // Set minDate to beginning of the month so we can freely click dates
    const minDate = new Date(2023, 5, 1); 
    
    render(
      <DatePickerCalendar 
        selectedDate={selectedDate} 
        minDate={minDate}
        onDateSelect={mockOnDateSelect} 
        onDateChange={mockOnDateChange}
      />
    );
    
    const day20Button = screen.getByText('20');
    fireEvent.click(day20Button);

    expect(mockOnDateSelect).toHaveBeenCalledTimes(1);
    expect(mockOnDateSelect).toHaveBeenCalledWith(new Date(2023, 5, 20));
    
    expect(mockOnDateChange).toHaveBeenCalledTimes(1);
    expect(mockOnDateChange).toHaveBeenCalledWith(new Date(2023, 5, 20));
  });

  it('disables dates outside of minDate and maxDate', () => {
    const selectedDate = new Date(2023, 5, 15); // June 15, 2023
    const minDate = new Date(2023, 5, 10);
    const maxDate = new Date(2023, 5, 20);
    
    render(
      <DatePickerCalendar 
        selectedDate={selectedDate} 
        minDate={minDate}
        maxDate={maxDate}
        onDateSelect={mockOnDateSelect} 
      />
    );
    
    // Day 9 should be disabled
    const day9Button = screen.getByText('9');
    expect(day9Button).toBeDisabled();
    expect(day9Button).toHaveClass('disabled');

    // Day 15 should be enabled
    const day15Button = screen.getByText('15');
    expect(day15Button).not.toBeDisabled();

    // Day 21 should be disabled
    const day21Button = screen.getByText('21');
    expect(day21Button).toBeDisabled();
    expect(day21Button).toHaveClass('disabled');
  });

  it('does not call selection handlers when a disabled date is clicked', () => {
    const selectedDate = new Date(2023, 5, 15); // June 15, 2023
    const minDate = new Date(2023, 5, 10);
    
    render(
      <DatePickerCalendar 
        selectedDate={selectedDate} 
        minDate={minDate}
        onDateSelect={mockOnDateSelect} 
        onDateChange={mockOnDateChange}
      />
    );
    
    const day5Button = screen.getByText('5');
    fireEvent.click(day5Button);

    expect(mockOnDateSelect).not.toHaveBeenCalled();
    expect(mockOnDateChange).not.toHaveBeenCalled();
  });
  
  it('handles keyboard navigation (Arrow keys)', () => {
    const selectedDate = new Date(2023, 5, 15); // June 15, 2023
    const minDate = new Date(2023, 5, 1);
    
    render(
      <DatePickerCalendar 
        selectedDate={selectedDate} 
        minDate={minDate}
        onDateSelect={mockOnDateSelect} 
      />
    );
    
    const day15Button = screen.getByText('15');
    day15Button.focus();
    
    // Right arrow to move to 16
    fireEvent.keyDown(day15Button, { key: 'ArrowRight' });
    const day16Button = screen.getByText('16');
    expect(day16Button).toHaveClass('focused');
    
    // Left arrow to move to 15
    fireEvent.keyDown(day16Button, { key: 'ArrowLeft' });
    expect(day15Button).toHaveClass('focused');
    
    // Down arrow to move to 22
    fireEvent.keyDown(day15Button, { key: 'ArrowDown' });
    const day22Button = screen.getByText('22');
    expect(day22Button).toHaveClass('focused');
    
    // Up arrow to move to 15
    fireEvent.keyDown(day22Button, { key: 'ArrowUp' });
    expect(day15Button).toHaveClass('focused');
  });

  it('selects date on Enter key', () => {
    const selectedDate = new Date(2023, 5, 15); // June 15, 2023
    const minDate = new Date(2023, 5, 1);
    
    render(
      <DatePickerCalendar 
        selectedDate={selectedDate} 
        minDate={minDate}
        onDateSelect={mockOnDateSelect} 
      />
    );
    
    const day20Button = screen.getByText('20');
    fireEvent.keyDown(day20Button, { key: 'Enter' });

    expect(mockOnDateSelect).toHaveBeenCalledTimes(1);
    expect(mockOnDateSelect).toHaveBeenCalledWith(new Date(2023, 5, 20));
  });
});
