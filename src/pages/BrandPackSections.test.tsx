import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import ColorSection from './ColorSection';
import LogoUsageSection from './LogoUsageSection';
import TypographySection from './TypographySection';

describe('BrandPack sections', () => {
  beforeEach(() => {
    vi.stubGlobal('URL', { createObjectURL: vi.fn(() => 'blob:theme-preview'), revokeObjectURL: vi.fn() });
  });

  it('renders the logo usage variants', () => {
    render(<LogoUsageSection />);

    expect(screen.getByText('Logo Usage')).toBeInTheDocument();
    expect(screen.getByText('Medium (Default)')).toBeInTheDocument();
    expect(screen.getByText('Icon-only Variant')).toBeInTheDocument();
  });

  it('renders the primary colour palette', () => {
    render(<ColorSection />);

    expect(screen.getByText('Primary Colors')).toBeInTheDocument();
    expect(screen.getByText('#22d3ee')).toBeInTheDocument();
    expect(screen.getByText('#14b8a6')).toBeInTheDocument();
  });

  it('renders the live theme preview', () => {
    render(<TypographySection />);

    expect(screen.getByText('Live Theme Preview')).toBeInTheDocument();
    expect(screen.getByText(/edit theme tokens on the left/i)).toBeInTheDocument();
  });
});
