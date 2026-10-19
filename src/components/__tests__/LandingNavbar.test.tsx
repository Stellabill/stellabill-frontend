import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import LandingNavbar from '../LandingNavbar';
import { BrowserRouter } from 'react-router-dom';
import { WalletProvider } from '../../wallet/WalletContext';

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
  beforeEach(() => {
    localStorage.clear();
  });

  test('renders logo and navigation links', () => {
    render(
      <BrowserRouter>
        <WalletProvider><LandingNavbar /></WalletProvider>
      </BrowserRouter>
    );
    const logos = screen.getAllByRole('link', { name: /stellabill/i });
    expect(logos.length).toBeGreaterThan(0);
    const navLinks = ['Product', 'Pricing', 'Docs', 'Contact'];
    navLinks.forEach((label) => {
      expect(screen.getAllByText(label).length).toBeGreaterThan(0);
    });
  });

  test('mobile menu toggles open and close', async () => {
    const { container } = render(
      <BrowserRouter>
        <WalletProvider><LandingNavbar /></WalletProvider>
      </BrowserRouter>
    );
    const toggleButton = screen.getByRole('button', { name: /main menu/i });
    const drawer = container.querySelector('.site-navbar__mobile-drawer');
    expect(drawer).toHaveClass('translate-x-full');
    fireEvent.click(toggleButton);
    await waitFor(() => {
      expect(drawer).toHaveClass('translate-x-0');
    });
    fireEvent.click(toggleButton);
    await waitFor(() => {
      expect(drawer).toHaveClass('translate-x-full');
    });
  });

  test('shows connect wallet button when not connected', () => {
    render(
      <BrowserRouter>
        <WalletProvider><LandingNavbar /></WalletProvider>
      </BrowserRouter>
    );
    const connectButtons = screen.getAllByRole('button', { name: /connect wallet/i });
    expect(connectButtons.length).toBeGreaterThan(0);
  });
});
