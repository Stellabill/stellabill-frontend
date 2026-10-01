import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import OnboardingChecklistWidget from './OnboardingChecklistWidget';

describe('OnboardingChecklistWidget', () => {
  const renderWithRouter = (ui: React.ReactElement) => {
    return render(<BrowserRouter>{ui}</BrowserRouter>);
  };

  it('renders the checklist normally with default items', () => {
    renderWithRouter(<OnboardingChecklistWidget />);
    expect(screen.getByText('Getting Started')).toBeInTheDocument();
    expect(screen.getByText('Set up payout method')).toBeInTheDocument();
    expect(screen.queryByLabelText('Dismiss checklist')).not.toBeInTheDocument();
  });

  it('renders the checklist with custom items', () => {
    const items = [
      { id: '1', label: 'Custom Item 1', completed: false, link: '/custom1' },
    ];
    renderWithRouter(<OnboardingChecklistWidget items={items} />);
    expect(screen.getByText('Custom Item 1')).toBeInTheDocument();
  });

  it('displays the dismiss button when all items are completed', () => {
    const items = [
      { id: '1', label: 'Custom Item 1', completed: true, link: '/custom1' },
    ];
    renderWithRouter(<OnboardingChecklistWidget items={items} />);
    expect(screen.getByLabelText('Dismiss checklist')).toBeInTheDocument();
  });

  it('returns null and hides the widget when dismissed', () => {
    const items = [
      { id: '1', label: 'Custom Item 1', completed: true, link: '/custom1' },
    ];
    const { container } = renderWithRouter(<OnboardingChecklistWidget items={items} />);
    
    // Initially present
    expect(screen.getByText('Getting Started')).toBeInTheDocument();
    
    const dismissButton = screen.getByLabelText('Dismiss checklist');
    fireEvent.click(dismissButton);

    // After dismiss, the component should render nothing (null)
    expect(container.firstChild).toBeNull();
    expect(screen.queryByText('Getting Started')).not.toBeInTheDocument();
  });

  it('handles boundary case of empty items array', () => {
    renderWithRouter(<OnboardingChecklistWidget items={[]} />);
    expect(screen.getByText('Getting Started')).toBeInTheDocument();
    // When items are empty, allComplete is true (0/0)
    expect(screen.getByLabelText('Dismiss checklist')).toBeInTheDocument();
  });
});
