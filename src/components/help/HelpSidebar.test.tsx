import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import HelpSidebar from './HelpSidebar';

describe('HelpSidebar', () => {
  it('opens, searches, views article detail, and returns home', () => {
    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <HelpSidebar />
      </MemoryRouter>
    );

    // Open help center
    fireEvent.click(screen.getByRole('button', { name: /open help center/i }));
    expect(screen.getByRole('dialog')).toHaveAttribute('data-open', 'true');
    expect(screen.getByText(/still stuck\?/i)).toBeInTheDocument();

    // Search for an article
    const searchInput = screen.getByRole('searchbox', { name: /search help articles/i });
    fireEvent.change(searchInput, { target: { value: 'prepaid' } });
    expect(screen.getByText(/search results/i)).toBeInTheDocument();

    // Open article detail
    const articleBtn = screen.getByRole('button', { name: /understanding prepaid balances/i });
    fireEvent.click(articleBtn);
    expect(screen.getByRole('button', { name: /back to help/i })).toBeInTheDocument();

    // Return home
    fireEvent.click(screen.getByRole('button', { name: /back to help/i }));
    expect(screen.getByText(/browse by category/i)).toBeInTheDocument();
  });
});
