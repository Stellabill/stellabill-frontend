import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import Alert from './Alert';

describe('Alert', () => {
  it('renders title and children', () => {
    render(<Alert title="Heads up">Something happened.</Alert>);
    expect(screen.getByText('Heads up')).toBeInTheDocument();
    expect(screen.getByText('Something happened.')).toBeInTheDocument();
  });

  it('renders without a title', () => {
    render(<Alert>Just a message.</Alert>);
    expect(screen.queryByRole('heading')).not.toBeInTheDocument();
    expect(screen.getByText('Just a message.')).toBeInTheDocument();
  });

  it('defaults to the info variant with a polite status role', () => {
    render(<Alert>Info message</Alert>);
    const alert = screen.getByRole('status');
    expect(alert).toHaveAttribute('aria-live', 'polite');
  });

  it('uses a polite status role for the success variant', () => {
    render(<Alert variant="success">Saved</Alert>);
    const alert = screen.getByRole('status');
    expect(alert).toHaveAttribute('aria-live', 'polite');
  });

  it('uses an assertive alert role for the warning variant', () => {
    render(<Alert variant="warning">Careful</Alert>);
    const alert = screen.getByRole('alert');
    expect(alert).toHaveAttribute('aria-live', 'assertive');
  });

  it('uses an assertive alert role for the danger variant', () => {
    render(<Alert variant="danger">Failed</Alert>);
    const alert = screen.getByRole('alert');
    expect(alert).toHaveAttribute('aria-live', 'assertive');
  });

  it('binds each variant to its own token-driven background/border/text classes', () => {
    const { rerender, container } = render(<Alert variant="info">msg</Alert>);
    expect(container.firstChild).toHaveClass('bg-[var(--color-info-bg)]');

    rerender(<Alert variant="success">msg</Alert>);
    expect(container.firstChild).toHaveClass('bg-[var(--color-success-bg)]');

    rerender(<Alert variant="warning">msg</Alert>);
    expect(container.firstChild).toHaveClass('bg-[var(--color-warning-bg)]');

    rerender(<Alert variant="danger">msg</Alert>);
    expect(container.firstChild).toHaveClass('bg-[var(--color-danger-bg)]');
  });

  it('renders a decorative, screen-reader-hidden icon', () => {
    const { container } = render(<Alert>msg</Alert>);
    const icon = container.querySelector('svg[aria-hidden="true"]');
    expect(icon).toBeInTheDocument();
  });

  it('does not render a dismiss button by default', () => {
    render(<Alert>msg</Alert>);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('renders an accessible dismiss button and calls onDismiss when clicked', () => {
    const onDismiss = vi.fn();
    render(<Alert onDismiss={onDismiss}>msg</Alert>);
    const button = screen.getByRole('button', { name: 'Dismiss alert' });
    fireEvent.click(button);
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it('supports a custom dismiss label', () => {
    render(<Alert onDismiss={() => {}} dismissLabel="Close this notice">msg</Alert>);
    expect(screen.getByRole('button', { name: 'Close this notice' })).toBeInTheDocument();
  });

  it('applies a custom className alongside the variant styles', () => {
    const { container } = render(<Alert className="custom-alert">msg</Alert>);
    expect(container.firstChild).toHaveClass('custom-alert');
  });

  it('forwards native div props such as data-testid', () => {
    render(<Alert data-testid="my-alert">msg</Alert>);
    expect(screen.getByTestId('my-alert')).toBeInTheDocument();
  });
});
