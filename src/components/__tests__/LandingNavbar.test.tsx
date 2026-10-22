import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import '@testing-library/jest-dom';
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

const renderNavbar = () =>
  render(
    <BrowserRouter>
      <LandingNavbar />
    </BrowserRouter>
  );

describe('LandingNavbar', () => {
  test('renders logo and navigation links', () => {
    renderNavbar();
    // Logo link should be in the document (accessible name is the brand name)
    const logos = screen.getAllByRole('link', { name: /stellabill/i });
    expect(logos.length).toBeGreaterThan(0);
    // Navigation links should be present (Product, Pricing, Docs, Contact)
    const navLinks = ['Product', 'Pricing', 'Docs', 'Contact'];
    navLinks.forEach((label) => {
      expect(screen.getAllByText(label).length).toBeGreaterThan(0);
    });
  });

  test('mobile menu toggles open and close', async () => {
    renderNavbar();
    const toggleButton = screen.getByRole('button', { name: /main menu/i });
    // Initially drawer should be inert (closed)
    const drawer = screen.getByRole('dialog', { hidden: true });
    expect(drawer).toHaveAttribute('inert');

    // Open menu
    fireEvent.click(toggleButton);
    await waitFor(() => {
      expect(drawer).not.toHaveAttribute('inert');
    });

    // Close menu by clicking toggle again
    fireEvent.click(screen.getByRole('button', { name: /main menu/i }));
    await waitFor(() => {
      expect(drawer).toHaveAttribute('inert');
    });
  });

  test('shows connect wallet button when not connected', () => {
    renderNavbar();
    const connectBtn = screen.getByRole('button', { name: /connect wallet/i });
    expect(connectBtn).toBeInTheDocument();
  });

  // A11y: closed drawer is inert — keyboard users cannot reach its contents
  test('a11y: closed drawer has inert attribute so it is removed from tab order', () => {
    renderNavbar();
    const drawer = screen.getByRole('dialog', { hidden: true });
    expect(drawer).toHaveAttribute('inert');
    expect(drawer).toHaveAttribute('aria-hidden', 'true');
  });

  // A11y: open drawer has dialog role and aria-modal
  test('a11y: open drawer has role="dialog" and aria-modal="true"', async () => {
    renderNavbar();
    const toggleButton = screen.getByRole('button', { name: /main menu/i });
    fireEvent.click(toggleButton);

    await waitFor(() => {
      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-modal', 'true');
      expect(dialog).toHaveAttribute('aria-label', 'Main menu');
    });
  });

  // A11y: Escape key closes the drawer
  test('a11y: pressing Escape closes the open drawer', async () => {
    renderNavbar();
    const toggleButton = screen.getByRole('button', { name: /main menu/i });
    fireEvent.click(toggleButton);

    await waitFor(() => {
      expect(screen.getByRole('dialog')).not.toHaveAttribute('inert');
    });

    fireEvent.keyDown(document, { key: 'Escape' });

    await waitFor(() => {
      const drawer = screen.getByRole('dialog', { hidden: true });
      expect(drawer).toHaveAttribute('inert');
    });
  });

  // A11y: close button has an accessible name
  test('a11y: drawer close button has accessible aria-label', async () => {
    renderNavbar();
    const toggleButton = screen.getByRole('button', { name: /main menu/i });
    fireEvent.click(toggleButton);

    await waitFor(() => {
      const dialog = screen.getByRole('dialog');
      const closeBtn = within(dialog).getByRole('button', { name: /close menu/i });
      expect(closeBtn).toBeInTheDocument();
    });
  });

  // A11y: toggle has aria-controls pointing to drawer id
  test('a11y: mobile toggle has aria-controls referencing the drawer', () => {
    renderNavbar();
    const toggleButton = screen.getByRole('button', { name: /main menu/i });
    const controlsId = toggleButton.getAttribute('aria-controls');
    expect(controlsId).toBeTruthy();
    const drawer = document.getElementById(controlsId!);
    expect(drawer).not.toBeNull();
    expect(drawer).toHaveAttribute('role', 'dialog');
  });
});
