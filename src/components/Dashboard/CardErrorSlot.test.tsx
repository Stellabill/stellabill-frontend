import { render, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import CardErrorSlot from './CardErrorSlot';

describe('CardErrorSlot', () => {
  it('renders default error message', () => {
    const { getByText, getByRole } = render(<CardErrorSlot widgetLabel="Test Widget" />);
    expect(getByText('Failed to load data')).toBeInTheDocument();
    
    const wrapper = getByRole('status');
    expect(wrapper).toHaveAttribute('aria-label', 'Test Widget: Failed to load data. ');
  });

  it('renders offline message when isOffline is true', () => {
    const { getByText, getByRole } = render(<CardErrorSlot widgetLabel="Test Widget" isOffline={true} />);
    expect(getByText('No internet connection')).toBeInTheDocument();

    const wrapper = getByRole('status');
    expect(wrapper).toHaveAttribute('aria-label', 'Test Widget: No internet connection. ');
  });

  it('renders custom message if provided', () => {
    const { getByText } = render(<CardErrorSlot widgetLabel="Test Widget" message="Custom error happened" />);
    expect(getByText('Custom error happened')).toBeInTheDocument();
  });

  it('does not render retry button if onRetry is not provided', () => {
    const { queryByRole } = render(<CardErrorSlot widgetLabel="Test Widget" />);
    expect(queryByRole('button')).not.toBeInTheDocument();
  });

  it('renders retry button and calls onRetry when clicked', () => {
    const onRetryMock = vi.fn();
    const { getByRole } = render(<CardErrorSlot widgetLabel="Test Widget" onRetry={onRetryMock} />);
    
    const retryButton = getByRole('button', { name: 'Retry Test Widget' });
    expect(retryButton).toBeInTheDocument();
    expect(retryButton).not.toBeDisabled();
    
    fireEvent.click(retryButton);
    expect(onRetryMock).toHaveBeenCalledTimes(1);

    const wrapper = getByRole('status');
    expect(wrapper).toHaveAttribute('aria-label', 'Test Widget: Failed to load data. Retry available.');
  });

  it('disables retry button and shows loading state when retrying is true', () => {
    const onRetryMock = vi.fn();
    const { getByRole, getByText } = render(
      <CardErrorSlot widgetLabel="Test Widget" onRetry={onRetryMock} retrying={true} />
    );
    
    const retryButton = getByRole('button');
    expect(retryButton).toBeDisabled();
    expect(retryButton).toHaveAttribute('aria-busy', 'true');
    expect(retryButton).toHaveAttribute('aria-label', 'Retrying Test Widget…');
    expect(getByText('Retrying…')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { getByRole } = render(<CardErrorSlot widgetLabel="Test Widget" className="custom-class" />);
    const wrapper = getByRole('status');
    expect(wrapper).toHaveClass('card-error-slot');
    expect(wrapper).toHaveClass('custom-class');
  });
});
