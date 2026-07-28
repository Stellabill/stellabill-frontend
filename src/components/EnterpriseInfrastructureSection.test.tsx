import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import EnterpriseInfrastructureSection from './EnterpriseInfrastructureSection';

describe('EnterpriseInfrastructureSection', () => {
  it('renders an accessible architecture diagram with summary and data table', () => {
    render(<EnterpriseInfrastructureSection />);

    expect(screen.getByRole('img', { name: /enterprise infrastructure architecture/i })).toBeInTheDocument();
    expect(screen.getByRole('table', { name: /enterprise infrastructure architecture components/i })).toBeInTheDocument();
    expect(screen.getByText(/reduced motion/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /view details for prepaid vault/i })).toBeInTheDocument();
  });
});
