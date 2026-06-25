import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { EmptyState, EmptyStateType } from './EmptyState';
import styles from './EmptyState.module.css';

describe('EmptyState Component', () => {
  const types: EmptyStateType[] = [
    'subscriptions',
    'plans',
    'invoices',
    'notifications',
    'search',
    'generic',
  ];

  it.each(types)('renders correctly for type: %s', (type) => {
    const { container } = render(
      <EmptyState type={type} title={`Title ${type}`} description={`Description ${type}`} />
    );

    // Verify Title and description
    expect(screen.getByText(`Title ${type}`)).toBeInTheDocument();
    expect(screen.getByText(`Description ${type}`)).toBeInTheDocument();

    // Verify SVG and fallback icon are rendered
    const svgs = container.querySelectorAll('svg');
    expect(svgs.length).toBeGreaterThanOrEqual(2); // One for Large illustration, one for Small icon

    // Verify aria-hidden='true' is present on all SVGs
    svgs.forEach((svg) => {
      expect(svg).toHaveAttribute('aria-hidden', 'true');
    });
  });

  it('renders generic fallback for unknown types gracefully', () => {
    // @ts-expect-error testing invalid type fallback
    const { container } = render(
      <EmptyState type="invalid_type_123" title="Unknown" description="Test fallback" />
    );
    expect(screen.getByText('Unknown')).toBeInTheDocument();
    expect(screen.getByText('Test fallback')).toBeInTheDocument();
    const svgs = container.querySelectorAll('svg');
    expect(svgs.length).toBeGreaterThanOrEqual(2);
  });

  it('includes CSS classes to toggle large illustration and fallback icon on viewports', () => {
    const { container } = render(
      <EmptyState type="generic" title="Responsive Test" description="Test" />
    );
    
    const svgs = container.querySelectorAll('svg');
    
    // First SVG should be the large illustration and have the largeIllustration class
    expect(svgs[0]).toHaveClass(styles.largeIllustration);
    
    // Second SVG should be the small fallback icon and have the smallIcon class
    expect(svgs[1]).toHaveClass(styles.smallIcon);
  });

  describe('Theme and Motion CSS Hooks', () => {
    // While `@media (prefers-color-scheme: dark)` and `@media (prefers-reduced-motion)`
    // are evaluated by the browser's CSS engine rather than JSDOM, we can verify that
    // the structural elements required for these CSS features are rendered correctly.
    it('applies the appropriate wrapper class for CSS custom property theming', () => {
      const { container } = render(
        <EmptyState type="generic" title="Theme Test" description="Test" />
      );

      // Verify the container has the correct CSS module class
      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).toHaveClass(styles.container);

      // Verify the illustration wrapper has the correct class used for --illustration-* tokens
      const illustrationWrapper = wrapper.firstChild as HTMLElement;
      expect(illustrationWrapper).toHaveClass(styles.illustrationWrapper);
    });
  });
});
