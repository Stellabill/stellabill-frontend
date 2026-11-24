import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { IconButton, type IconButtonProps } from './IconButton';

const TestIcon = () => <svg data-testid="test-icon" aria-hidden="true" />;

describe('IconButton', () => {
  it('sets the button accessible name from the aria-label prop and renders the icon', () => {
    render(<IconButton icon={<TestIcon />} aria-label="Delete item" />);

    const button = screen.getByRole('button', { name: 'Delete item' });
    expect(button).toBeInTheDocument();
    expect(button).toHaveAttribute('aria-label', 'Delete item');
    expect(button).toHaveAttribute('aria-busy', 'false');
    expect(button).toBeEnabled();
    expect(screen.getByTestId('test-icon')).toBeInTheDocument();
  });

  it('applies default variant (secondary) and size (md) classes', () => {
    render(<IconButton icon={<TestIcon />} aria-label="Settings" />);

    const button = screen.getByRole('button', { name: 'Settings' });
    expect(button).toHaveClass('icon-button', 'icon-button--secondary', 'icon-button--md');
  });

  it.each<[NonNullable<IconButtonProps['variant']>, string]>([
    ['primary', 'icon-button--primary'],
    ['secondary', 'icon-button--secondary'],
    ['ghost', 'icon-button--ghost'],
    ['outline', 'icon-button--outline'],
    ['elevated', 'icon-button--elevated'],
    ['inverse', 'icon-button--inverse'],
  ])('applies the %s variant class', (variant, expectedClass) => {
    render(<IconButton icon={<TestIcon />} aria-label="Variant action" variant={variant} />);

    const button = screen.getByRole('button', { name: 'Variant action' });
    expect(button).toHaveClass('icon-button', expectedClass);
  });

  it.each<[NonNullable<IconButtonProps['size']>, string]>([
    ['sm', 'icon-button--sm'],
    ['md', 'icon-button--md'],
    ['lg', 'icon-button--lg'],
  ])('applies the %s size class', (size, expectedClass) => {
    render(<IconButton icon={<TestIcon />} aria-label="Size action" size={size} />);

    const button = screen.getByRole('button', { name: 'Size action' });
    expect(button).toHaveClass('icon-button', expectedClass);
  });

  it('swaps the icon for the spinner, sets aria-busy, and disables the button when isLoading is true', () => {
    render(<IconButton icon={<TestIcon />} aria-label="Saving" isLoading />);

    const button = screen.getByRole('button', { name: 'Saving' });
    expect(button).toHaveAttribute('aria-busy', 'true');
    expect(button).toBeDisabled();
    expect(screen.queryByTestId('test-icon')).not.toBeInTheDocument();

    const spinner = button.querySelector('svg.animate-spin');
    expect(spinner).toBeInTheDocument();
    expect(spinner).toHaveAttribute('aria-hidden', 'true');
  });

  it('fires onClick once when clicked', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();

    render(<IconButton icon={<TestIcon />} aria-label="Refresh" onClick={onClick} />);

    await user.click(screen.getByRole('button', { name: 'Refresh' }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('blocks onClick when disabled', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();

    render(<IconButton icon={<TestIcon />} aria-label="Refresh" onClick={onClick} disabled />);

    const button = screen.getByRole('button', { name: 'Refresh' });
    expect(button).toBeDisabled();
    await user.click(button);
    expect(onClick).not.toHaveBeenCalled();
  });

  it('blocks onClick when isLoading is true', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();

    render(<IconButton icon={<TestIcon />} aria-label="Refresh" onClick={onClick} isLoading />);

    const button = screen.getByRole('button', { name: 'Refresh' });
    expect(button).toBeDisabled();
    await user.click(button);
    expect(onClick).not.toHaveBeenCalled();
  });

  it('merges custom className and forwards native button props', () => {
    render(
      <IconButton
        icon={<TestIcon />}
        aria-label="Submit"
        className="custom-icon-btn"
        type="submit"
        data-testid="submit-icon-btn"
      />
    );

    const button = screen.getByTestId('submit-icon-btn');
    expect(button).toHaveClass('icon-button', 'custom-icon-btn');
    expect(button).toHaveAttribute('type', 'submit');
  });
});
