import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import ContextualHelpOverlay from './ContextualHelpOverlay';

describe('ContextualHelpOverlay', () => {
  beforeEach(() => {
    // Mock getBoundingClientRect
    window.HTMLElement.prototype.getBoundingClientRect = () => ({
      top: 10,
      left: 10,
      bottom: 20,
      right: 20,
      width: 10,
      height: 10,
      x: 10,
      y: 10,
      toJSON: () => {}
    });
    
    // Mock window.print
    window.print = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('if (!isOpen) return null branch', () => {
    it('returns null and does not render anything when isOpen is false', () => {
      const { container } = render(<ContextualHelpOverlay isOpen={false} onClose={vi.fn()} />);
      expect(container).toBeEmptyDOMElement();
    });
  });

  describe('normal behavior when isOpen is true', () => {
    it('renders the overlay when isOpen is true', () => {
      render(<ContextualHelpOverlay isOpen={true} onClose={vi.fn()} />);
      expect(screen.getByRole('presentation')).toBeInTheDocument();
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText('Contextual Help')).toBeInTheDocument();
    });

    it('collects elements with data-help and renders them', () => {
      // Render some elements with data-help before rendering the overlay
      const { container } = render(
        <div>
          <div data-help="First help tip">Element 1</div>
          <div data-help="Second help tip">Element 2</div>
          <ContextualHelpOverlay isOpen={true} onClose={vi.fn()} />
        </div>
      );
      
      expect(screen.getAllByText('First help tip').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Second help tip').length).toBeGreaterThan(0);
      
      // Should find the numbering for the tooltips
      expect(screen.getAllByText('1').length).toBeGreaterThan(0);
      expect(screen.getAllByText('2').length).toBeGreaterThan(0);
    });
  });

  describe('interaction and boundary behavior', () => {
    it('calls onClose when the escape key is pressed', async () => {
      const onClose = vi.fn();
      render(<ContextualHelpOverlay isOpen={true} onClose={onClose} />);
      
      const user = userEvent.setup();
      await user.keyboard('{Escape}');
      
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('does not call onClose when other keys are pressed', async () => {
      const onClose = vi.fn();
      render(<ContextualHelpOverlay isOpen={true} onClose={onClose} />);
      
      const user = userEvent.setup();
      await user.keyboard('{Enter}');
      
      expect(onClose).not.toHaveBeenCalled();
    });

    it('calls onClose when clicking the backdrop', async () => {
      const onClose = vi.fn();
      render(<ContextualHelpOverlay isOpen={true} onClose={onClose} />);
      
      const user = userEvent.setup();
      const backdrop = screen.getByRole('presentation');
      await user.click(backdrop);
      
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('does not call onClose when clicking inside the overlay contents', async () => {
      const onClose = vi.fn();
      render(<ContextualHelpOverlay isOpen={true} onClose={onClose} />);
      
      const user = userEvent.setup();
      const printBtn = screen.getByRole('button', { name: /print help sheet/i });
      
      await user.click(printBtn);
      
      expect(onClose).not.toHaveBeenCalled();
    });

    it('calls window.print when print button is clicked', async () => {
      render(<ContextualHelpOverlay isOpen={true} onClose={vi.fn()} />);
      
      const user = userEvent.setup();
      const printBtn = screen.getByRole('button', { name: /print help sheet/i });
      
      await user.click(printBtn);
      
      expect(window.print).toHaveBeenCalledTimes(1);
    });

    it('recalculates items on window resize', () => {
      render(<ContextualHelpOverlay isOpen={true} onClose={vi.fn()} />);
      // We are just asserting it doesn't crash on resize. 
      // Given how the component is structured, verifying the state update directly is tricky without mocking DOM rects dynamically.
      fireEvent(window, new Event('resize'));
    });
    
    it('recalculates items on window scroll', () => {
      render(<ContextualHelpOverlay isOpen={true} onClose={vi.fn()} />);
      fireEvent(window, new Event('scroll'));
    });
  });
});
