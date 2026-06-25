import { useState, useRef, useEffect } from 'react';
import './DatePickerCalendar.css';

interface DatePickerCalendarProps {
  selectedDate: Date | null;
  onDateSelect: (date: Date) => void;
  minDate?: Date;
  maxDate?: Date;
  onDateChange?: (date: Date) => void;
}

export default function DatePickerCalendar({
  selectedDate,
  onDateSelect,
  minDate = new Date(),
  maxDate,
  onDateChange
}: DatePickerCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState<Date>(selectedDate || new Date());
  const [focusedDate, setFocusedDate] = useState<Date | null>(selectedDate);
  const calendarRef = useRef<HTMLDivElement>(null);
  const announcementRef = useRef<HTMLDivElement>(null);

  // Generate array of days for the current month
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    return { daysInMonth, startingDayOfWeek, year, month };
  };

  const { daysInMonth, startingDayOfWeek, year, month } = getDaysInMonth(currentMonth);

  // Format date for announcements
  const formatDateForAnnouncement = (date: Date): string => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Check if date is disabled
  const isDateDisabled = (day: number): boolean => {
    const date = new Date(year, month, day);
    if (minDate && date < minDate) return true;
    if (maxDate && date > maxDate) return true;
    return false;
  };

  // Check if date is today
  const isToday = (day: number): boolean => {
    const today = new Date();
    return (
      day === today.getDate() &&
      month === today.getMonth() &&
      year === today.getFullYear()
    );
  };

  // Check if date is selected
  const isSelected = (day: number): boolean => {
    if (!selectedDate) return false;
    return (
      day === selectedDate.getDate() &&
      month === selectedDate.getMonth() &&
      year === selectedDate.getFullYear()
    );
  };

  // Handle date selection
  const handleDateClick = (day: number) => {
    if (isDateDisabled(day)) return;
    const selected = new Date(year, month, day);
    setFocusedDate(selected);
    onDateSelect(selected);
    if (onDateChange) {
      onDateChange(selected);
    }
    // Announce selection
    if (announcementRef.current) {
      announcementRef.current.textContent = `${formatDateForAnnouncement(selected)} selected`;
    }
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent, day: number) => {
    if (isDateDisabled(day)) return;

    const currentDate = new Date(year, month, day);
    let newDate: Date | null = null;

    switch (e.key) {
      case 'ArrowRight':
        e.preventDefault();
        newDate = new Date(year, month, day + 1);
        break;
      case 'ArrowLeft':
        e.preventDefault();
        newDate = new Date(year, month, day - 1);
        break;
      case 'ArrowDown':
        e.preventDefault();
        newDate = new Date(year, month, day + 7);
        break;
      case 'ArrowUp':
        e.preventDefault();
        newDate = new Date(year, month, day - 7);
        break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        handleDateClick(day);
        return;
      default:
        return;
    }

    if (newDate && !isDateDisabled(newDate)) {
      // Handle month changes
      if (newDate.getMonth() !== month) {
        setCurrentMonth(newDate);
      }
      setFocusedDate(newDate);
      if (announcementRef.current) {
        announcementRef.current.textContent = formatDateForAnnouncement(newDate);
      }
    }
  };

  // Handle month navigation
  const goToPreviousMonth = () => {
    const prev = new Date(currentMonth);
    prev.setMonth(prev.getMonth() - 1);
    setCurrentMonth(prev);
    if (announcementRef.current) {
      announcementRef.current.textContent = `${prev.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })} displayed`;
    }
  };

  const goToNextMonth = () => {
    const next = new Date(currentMonth);
    next.setMonth(next.getMonth() + 1);
    setCurrentMonth(next);
    if (announcementRef.current) {
      announcementRef.current.textContent = `${next.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })} displayed`;
    }
  };

  // Days of week headers
  const dayHeaders = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Create grid of days
  const days = [];
  // Add empty cells for days before month starts
  for (let i = 0; i < startingDayOfWeek; i++) {
    days.push(null);
  }
  // Add days of the month
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(i);
  }

  return (
    <div className="date-picker-calendar" ref={calendarRef} role="application" aria-label="Date picker calendar">
      {/* Screen reader announcements */}
      <div ref={announcementRef} className="sr-only" role="status" aria-live="polite" />

      {/* Header with month/year and navigation */}
      <div className="calendar-header">
        <button
          className="calendar-nav-btn calendar-nav-prev"
          onClick={goToPreviousMonth}
          aria-label={`Go to previous month (${new Date(year, month - 1, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })})`}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="15 18 9 12 15 6"></polyline>
          </svg>
        </button>

        <h3 className="calendar-month-year" id="calendar-heading">
          {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
        </h3>

        <button
          className="calendar-nav-btn calendar-nav-next"
          onClick={goToNextMonth}
          aria-label={`Go to next month (${new Date(year, month + 1, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })})`}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="9 18 15 12 9 6"></polyline>
          </svg>
        </button>
      </div>

      {/* Day headers */}
      <div className="calendar-day-headers" role="row">
        {dayHeaders.map((day) => (
          <div key={day} className="calendar-day-header" role="columnheader">
            <span className="day-header-short">{day}</span>
            <span className="day-header-full sr-only">{['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][dayHeaders.indexOf(day)]}</span>
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="calendar-grid">
        {days.map((day, index) => {
          if (day === null) {
            return <div key={`empty-${index}`} className="calendar-day calendar-day-empty" />;
          }

          const disabled = isDateDisabled(day);
          const isCurrentToday = isToday(day);
          const isCurrentSelected = isSelected(day);
          const isFocused = focusedDate && focusedDate.getDate() === day && focusedDate.getMonth() === month && focusedDate.getFullYear() === year;

          return (
            <button
              key={day}
              className={`calendar-day ${disabled ? 'disabled' : ''} ${isCurrentToday ? 'today' : ''} ${isCurrentSelected ? 'selected' : ''} ${isFocused ? 'focused' : ''}`}
              onClick={() => handleDateClick(day)}
              onKeyDown={(e) => handleKeyDown(e, day)}
              disabled={disabled}
              aria-label={formatDateForAnnouncement(new Date(year, month, day))}
              aria-pressed={isCurrentSelected}
              aria-current={isCurrentToday ? 'date' : undefined}
              tabIndex={isFocused || isCurrentSelected ? 0 : -1}
            >
              {day}
            </button>
          );
        })}
      </div>

      {/* Info text */}
      <div className="calendar-info">
        <p className="calendar-info-text">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <circle cx="12" cy="12" r="10"></circle>
            <polyline points="12 6 12 12 16 14"></polyline>
          </svg>
          <span>Select a date to pause until</span>
        </p>
      </div>
    </div>
  );
}
