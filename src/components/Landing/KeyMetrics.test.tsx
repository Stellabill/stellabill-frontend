import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import KeyMetrics from './KeyMetrics';

describe('KeyMetrics', () => {
  it('renders the labelled section and headline', () => {
    render(<KeyMetrics />);

    expect(screen.getByRole('region', { name: 'Key performance metrics' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Infrastructure-grade billing for Web3 SaaS');
    expect(screen.getByRole('heading', { level: 3 })).toHaveTextContent('TRUSTED BY BUILDERS IN THE STELLAR ECOSYSTEM');
  });

  it('renders each metric with its corresponding value', () => {
    render(<KeyMetrics />);

    const metrics = [
      ['99.9%', 'UPTIME'],
      ['<2s', 'SETTLEMENT'],
      ['$0.01', 'AVG FEE'],
    ];

    expect(metrics).toHaveLength(3);
    expect(screen.getByRole('region', { name: 'Key performance metrics' }).querySelectorAll('p')).toHaveLength(metrics.length * 2);
    for (const [value, label] of metrics) {
      expect(screen.getByText(label).previousElementSibling).toHaveTextContent(value);
    }
  });

  it('renders the complete trusted partner list', () => {
    render(<KeyMetrics />);

    const partners = ['StellarX', 'AnchorUSD', 'Vibrant', 'Lobstr'];
    const trustedHeading = screen.getByRole('heading', { level: 3 });

    expect(partners).toHaveLength(4);
    expect(trustedHeading.parentElement?.querySelectorAll('span')).toHaveLength(partners.length);
    for (const partner of partners) {
      expect(screen.getByText(partner)).toBeInTheDocument();
    }
  });

  it('keeps the rendered output stable when rerendered', () => {
    const { rerender } = render(<KeyMetrics />);
    const region = screen.getByRole('region', { name: 'Key performance metrics' });
    const initialMarkup = region.innerHTML;

    rerender(<KeyMetrics />);

    expect(screen.getByRole('region', { name: 'Key performance metrics' }).innerHTML).toBe(initialMarkup);
  });
});
