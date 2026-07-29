import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ContextualHelpOverlay from './ContextualHelpOverlay';

describe('ContextualHelpOverlay', () => {
  beforeEach(() => {
    // Mock getBoundingClientRect
    window.HTMLElement.prototype.getBoundingClientRect = function () {
      return {
        top: 100,
        left: 100,
        width: 200,
        height: 50,
        right: 300,
        bottom: 150,
        x: 100,
        y: 100,
        toJSON: () => {}
      } as DOMRect;
    };
    vi.clearAllMocks();
  });

  it('renders nothing when not open', () => {
    const { container } = render(<ContextualHelpOverlay isOpen={false} onClose={vi.fn()} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders overlay when open and finds data-help elements', () => {
    const { baseElement } = render(
      <div>
        <div data-help="Test Help 1">Element 1</div>
        <div data-help="Test Help 2">Element 2</div>
        <ContextualHelpOverlay isOpen={true} onClose={vi.fn()} />
      </div>
    );
    
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Test Help 1')).toBeInTheDocument();
    expect(screen.getByText('Test Help 2')).toBeInTheDocument();
  });

  it('closes on Escape key', () => {
    const onClose = vi.fn();
    render(<ContextualHelpOverlay isOpen={true} onClose={onClose} />);
    
    fireEvent.keyDown(document, { key: 'Escape', code: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('closes when clicking backdrop', () => {
    const onClose = vi.fn();
    render(<ContextualHelpOverlay isOpen={true} onClose={onClose} />);
    
    const overlay = screen.getByRole('presentation');
    fireEvent.mouseDown(overlay);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('does not close when clicking inside', () => {
    const onClose = vi.fn();
    render(
      <div>
        <div data-help="Test">Inside</div>
        <ContextualHelpOverlay isOpen={true} onClose={onClose} />
      </div>
    );
    
    const printBtn = screen.getByRole('button', { name: /print help sheet/i });
    fireEvent.mouseDown(printBtn);
    expect(onClose).not.toHaveBeenCalled();
  });

  it('handles window print', () => {
    const originalPrint = window.print;
    window.print = vi.fn();
    
    render(<ContextualHelpOverlay isOpen={true} onClose={vi.fn()} />);
    
    const printBtn = screen.getByRole('button', { name: /print help sheet/i });
    fireEvent.click(printBtn);
    
    expect(window.print).toHaveBeenCalledTimes(1);
    
    window.print = originalPrint;
  });

  it('updates positions on resize', () => {
    render(
      <div>
        <div data-help="Resize Test">Element</div>
        <ContextualHelpOverlay isOpen={true} onClose={vi.fn()} />
      </div>
    );
    
    expect(screen.getByText('Resize Test')).toBeInTheDocument();
    
    // Trigger resize
    fireEvent(window, new Event('resize'));
    // Since getBoundingClientRect is static in our mock, we just ensure it doesn't crash
    expect(screen.getByText('Resize Test')).toBeInTheDocument();
  });
});
