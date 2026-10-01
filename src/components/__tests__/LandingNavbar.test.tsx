import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';
import LandingNavbar from '../LandingNavbar';
import { BrowserRouter } from 'react-router-dom';

// Mock useLocation to simulate non-dashboard path
jest.mock('react-router-dom', () => {
  const original = jest.requireActual('react-router-dom');
  return {
    ...original,
    useLocation: () => ({ pathname: '/' }),
    Link: original.Link,
  };
});

describe('LandingNavbar', () => {
  test('renders logo and navigation links', () => {
    render(
      <BrowserRouter>
        <LandingNavbar />
      </BrowserRouter>
    );
    // Logo should be in the document
    const logo = screen.getByRole('link', { name: /logo/i });
    expect(logo).toBeInTheDocument();
    // Navigation links should be present (Product, Pricing, Docs, Contact)
    const navLinks = ['Product', 'Pricing', 'Docs', 'Contact'];
    navLinks.forEach((label) => {
      expect(screen.getByText(label)).toBeInTheDocument();
    });
  });

  test('mobile menu toggles open and close', async () => {
    render(
      <BrowserRouter>
        <LandingNavbar />
      </BrowserRouter>
    );
    const toggleButton = screen.getByRole('button', { name: /main menu/i });
    // Initially drawer should be hidden
    expect(screen.queryByText('Navigation')).not.toBeInTheDocument();
    // Open menu
    fireEvent.click(toggleButton);
    await waitFor(() => {
      expect(screen.getByText('Navigation')).toBeInTheDocument();
    });
    // Close menu by clicking backdrop (simplified by clicking toggle again)
    fireEvent.click(toggleButton);
    await waitFor(() => {
      expect(screen.queryByText('Navigation')).not.toBeInTheDocument();
    });
  });

  test('shows connect wallet button when not connected', () => {
    render(
      <BrowserRouter>
        <LandingNavbar />
      </BrowserRouter>
    );
    const connectBtn = screen.getByRole('button', { name: /connect wallet/i });
    expect(connectBtn).toBeInTheDocument();
  });
});
