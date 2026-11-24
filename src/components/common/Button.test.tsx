import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { Button } from './Button';

// ─── Variants ────────────────────────────────────────────────────────────────

describe('Button variants', () => {
  it('defaults to the primary variant', () => {
    const { container } = render(<Button>Click</Button>);
    const btn = container.firstChild as HTMLElement;
    expect(btn).toHaveClass('from-cyan-400', 'to-teal-500');
  });

  it('applies primary variant classes', () => {
    const { container } = render(<Button variant="primary">Click</Button>);
    const btn = container.firstChild as HTMLElement;
    expect(btn).toHaveClass('from-cyan-400', 'to-teal-500', 'text-black');
  });

  it('applies secondary variant classes', () => {
    const { container } = render(<Button variant="secondary">Click</Button>);
    const btn = container.firstChild as HTMLElement;
    expect(btn).toHaveClass('bg-white/5', 'text-white', 'border', 'border-white/10');
  });

  it('applies error variant classes', () => {
    const { container } = render(<Button variant="error">Click</Button>);
    const btn = container.firstChild as HTMLElement;
    expect(btn).toHaveClass('bg-red-500/10', 'text-red-400', 'border-red-500/30');
  });

  it('applies ghost variant classes', () => {
    const { container } = render(<Button variant="ghost">Click</Button>);
    const btn = container.firstChild as HTMLElement;
    expect(btn).toHaveClass('bg-transparent', 'text-slate-400');
  });

  it('applies outline variant classes', () => {
    const { container } = render(<Button variant="outline">Click</Button>);
    const btn = container.firstChild as HTMLElement;
    expect(btn).toHaveClass('border', 'text-[#e2e8f0]');
  });

  it('merges a custom className alongside the variant classes', () => {
    const { container } = render(<Button className="custom-btn">Click</Button>);
    expect(container.firstChild).toHaveClass('custom-btn', 'from-cyan-400');
  });
});

// ─── isLoading ────────────────────────────────────────────────────────────────

describe('Button isLoading', () => {
  it('sets aria-busy="true" when loading', () => {
    render(<Button isLoading>Save</Button>);
    expect(screen.getByRole('button')).toHaveAttribute('aria-busy', 'true');
  });

  it('renders a spinner (Loader2 svg) when loading', () => {
    const { container } = render(<Button isLoading>Save</Button>);
    const spinner = container.querySelector('svg');
    expect(spinner).toBeInTheDocument();
    expect(spinner).toHaveClass('animate-spin');
  });

  it('the spinner svg is aria-hidden so screen readers ignore it', () => {
    const { container } = render(<Button isLoading>Save</Button>);
    expect(container.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
  });

  it('disables the button element while loading', () => {
    render(<Button isLoading>Save</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('blocks onClick when loading', async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();
    render(
      <Button isLoading onClick={handleClick}>
        Save
      </Button>,
    );
    await user.click(screen.getByRole('button'));
    expect(handleClick).not.toHaveBeenCalled();
  });

  it('applies loading cursor styles', () => {
    const { container } = render(<Button isLoading>Save</Button>);
    expect(container.firstChild).toHaveClass('cursor-not-allowed', 'opacity-90');
  });

  it('hides leftIcon and rightIcon while loading', () => {
    render(
      <Button
        isLoading
        leftIcon={<span data-testid="left-icon" />}
        rightIcon={<span data-testid="right-icon" />}
      >
        Save
      </Button>,
    );
    expect(screen.queryByTestId('left-icon')).not.toBeInTheDocument();
    expect(screen.queryByTestId('right-icon')).not.toBeInTheDocument();
  });
});

// ─── disabled ────────────────────────────────────────────────────────────────

describe('Button disabled', () => {
  it('disables the button element', () => {
    render(<Button disabled>Submit</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('applies disabled styles', () => {
    const { container } = render(<Button disabled>Submit</Button>);
    expect(container.firstChild).toHaveClass('opacity-50', 'cursor-not-allowed', 'grayscale');
  });

  it('blocks onClick when disabled', async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();
    render(
      <Button disabled onClick={handleClick}>
        Submit
      </Button>,
    );
    await user.click(screen.getByRole('button'));
    expect(handleClick).not.toHaveBeenCalled();
  });
});

// ─── leftIcon / rightIcon ─────────────────────────────────────────────────────

describe('Button icons', () => {
  it('renders leftIcon before the children', () => {
    render(
      <Button leftIcon={<span data-testid="left-icon" />}>Label</Button>,
    );
    const btn = screen.getByRole('button');
    const left = screen.getByTestId('left-icon');
    const label = screen.getByText('Label');

    // leftIcon should precede the text node in DOM order
    expect(btn.compareDocumentPosition(left) & Node.DOCUMENT_POSITION_CONTAINED_BY).toBeTruthy();
    expect(
      left.compareDocumentPosition(label) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });

  it('renders rightIcon after the children', () => {
    render(
      <Button rightIcon={<span data-testid="right-icon" />}>Label</Button>,
    );
    const btn = screen.getByRole('button');
    const right = screen.getByTestId('right-icon');
    const label = screen.getByText('Label');

    expect(btn.compareDocumentPosition(right) & Node.DOCUMENT_POSITION_CONTAINED_BY).toBeTruthy();
    expect(
      label.compareDocumentPosition(right) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });

  it('renders both leftIcon and rightIcon with children between them', () => {
    render(
      <Button
        leftIcon={<span data-testid="left-icon" />}
        rightIcon={<span data-testid="right-icon" />}
      >
        Label
      </Button>,
    );
    const left = screen.getByTestId('left-icon');
    const right = screen.getByTestId('right-icon');
    const label = screen.getByText('Label');

    expect(
      left.compareDocumentPosition(label) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(
      label.compareDocumentPosition(right) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });

  it('renders children inside a span wrapper', () => {
    render(<Button>Label</Button>);
    const span = screen.getByText('Label');
    expect(span.tagName).toBe('SPAN');
  });
});

// ─── General behaviour ────────────────────────────────────────────────────────

describe('Button general behaviour', () => {
  it('calls onClick when clicked', async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click me</Button>);
    await user.click(screen.getByRole('button', { name: 'Click me' }));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('aria-busy is falsy when not loading', () => {
    render(<Button>Click</Button>);
    // The attribute is set to `false` (boolean) which renders as the string "false"
    const btn = screen.getByRole('button');
    expect(btn.getAttribute('aria-busy')).not.toBe('true');
  });

  it('forwards extra native button attributes', () => {
    render(
      <Button type="submit" data-testid="submit-btn">
        Submit
      </Button>,
    );
    const btn = screen.getByTestId('submit-btn');
    expect(btn).toHaveAttribute('type', 'submit');
  });
});
