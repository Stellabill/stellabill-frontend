import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import Logo from './Logo';

describe('Logo Component', () => {
  it('renders the icon-only variant correctly', () => {
    const { getByText } = render(<Logo variant="icon" />);
    expect(getByText('S')).toBeInTheDocument();
  });

  it('renders the full logo with text', () => {
    const { getByText } = render(<Logo variant="full" />);
    expect(getByText('S')).toBeInTheDocument();
    expect(getByText('Stellabill')).toBeInTheDocument();
  });

  it('applies the correct theme colors', () => {
    const { getByText } = render(<Logo theme="light" />);
    const textElement = getByText('Stellabill');
    expect(textElement.style.color).toBe('rgb(15, 23, 42)'); // #0f172a
  });

  it('scales correctly with size prop', () => {
    const { container } = render(<Logo size="xl" variant="icon" />);
    const iconBox = container.firstChild as HTMLElement;
    expect(iconBox.style.width).toBe('80px');
  });
});

/* eslint-disable @typescript-eslint/no-explicit-any */
describe('Logo behavior coverage (issue #746)', () => {
  it('applies the correct box and font dimensions for every supported size (icon variant)', () => {
    const expected = [
      { size: 'sm', box: '32px', font: '1.2rem' },
      { size: 'md', box: '40px', font: '1.5rem' },
      { size: 'lg', box: '56px', font: '2rem' },
      { size: 'xl', box: '80px', font: '2.8rem' },
    ] as const;

    for (const { size, box, font } of expected) {
      const { unmount, container } = render(<Logo size={size} variant="icon" />);
      const iconBox = container.firstChild as HTMLElement;
      expect(iconBox.style.width).toBe(box);
      expect(iconBox.style.height).toBe(box);
      const glyph = screen.getByText('S');
      expect(glyph.style.fontSize).toBe(font);
      expect(glyph.style.fontWeight).toBe('700');
      unmount();
    }
  });

  it('applies the correct text dimensions and gap for every supported size (full variant)', () => {
    const expected = [
      { size: 'sm', text: '1rem', gap: '0.5rem' },
      { size: 'md', text: '1.25rem', gap: '0.75rem' },
      { size: 'lg', text: '1.75rem', gap: '1rem' },
      { size: 'xl', text: '2.5rem', gap: '1.5rem' },
    ] as const;

    for (const { size, text, gap } of expected) {
      const { unmount, container } = render(<Logo size={size} />);
      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper.style.gap).toBe(gap);
      const wordmark = screen.getByText('Stellabill');
      expect(wordmark.style.fontSize).toBe(text);
      expect(wordmark.style.whiteSpace).toBe('nowrap');
      unmount();
    }
  });

  it('uses the dark theme by default and renders white text with a glow shadow', () => {
    const { container } = render(<Logo />);
    const wordmark = screen.getByText('Stellabill');
    expect(wordmark.style.color).toBe('rgb(255, 255, 255)'); // #ffffff
    const iconBox = container.firstChild?.firstChild as HTMLElement;
    expect(iconBox.style.boxShadow).toContain('rgba(34, 211, 238, 0.4)');
  });

  it('uses the light theme shadow variant for the icon', () => {
    const { container } = render(<Logo theme="light" variant="icon" />);
    const iconBox = container.firstChild as HTMLElement;
    expect(iconBox.style.boxShadow).toBe('0 4px 12px rgba(20, 184, 166, 0.2)');
    expect(iconBox.style.flexShrink).toBe('0');
  });

  it('marks the icon box as decorative with aria-hidden', () => {
    const { container } = render(<Logo variant="icon" />);
    const iconBox = container.firstChild as HTMLElement;
    expect(iconBox).toHaveAttribute('aria-hidden', 'true');
  });

  it('merges custom className with the layout classes in the full variant', () => {
    const { container } = render(<Logo className="my-custom-class" />);
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper.className).toContain('my-custom-class');
    expect(wrapper.className).toContain('flex');
    expect(wrapper.className).toContain('items-center');
  });

  it('does not apply className in the icon variant (icon returns the bare box)', () => {
    const { container } = render(<Logo variant="icon" className="ignored-class" />);
    const iconBox = container.firstChild as HTMLElement;
    expect(iconBox.className).not.toContain('ignored-class');
  });

  it('renders the icon-only variant without the Stellabill wordmark', () => {
    render(<Logo variant="icon" />);
    expect(screen.getByText('S')).toBeInTheDocument();
    expect(screen.queryByText('Stellabill')).not.toBeInTheDocument();
  });

  it('throws deterministically for an invalid size prop (boundary)', () => {
    // sizeMap has no fallback guard: an unknown key leaves currentSize undefined
    // and the icon box dereferences currentSize.box during render.
    expect(() => render(<Logo size={'bogus' as any} />)).toThrow(TypeError);
  });

  it('treats an invalid theme prop as non-dark (boundary)', () => {
    const { container } = render(<Logo theme={'bogus' as any} />);
    const wordmark = screen.getByText('Stellabill');
    // Only the exact string 'dark' matches, so any other value gets the light text color and light shadow.
    expect(wordmark.style.color).toBe('rgb(15, 23, 42)');
    const iconBox = container.firstChild?.firstChild as HTMLElement;
    expect(iconBox.style.boxShadow).toBe('0 4px 12px rgba(20, 184, 166, 0.2)');
  });

  it('renders consistently across repeated mounts (determinism)', () => {
    const renderOne = () => {
      const { container, unmount } = render(<Logo size="lg" variant="full" theme="light" />);
      const html = (container.firstChild as HTMLElement).outerHTML;
      unmount();
      return html;
    };
    const first = renderOne();
    const second = renderOne();
    expect(first).toBe(second);
  });
});
