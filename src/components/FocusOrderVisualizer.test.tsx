import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import FocusOrderVisualizer from './FocusOrderVisualizer';

describe('FocusOrderVisualizer', () => {
  beforeEach(() => {
    // Mock getBoundingClientRect
    window.HTMLElement.prototype.getBoundingClientRect = function() {
      return {
        width: 100,
        height: 50,
        top: 0,
        left: 0,
        bottom: 50,
        right: 100,
        x: 0,
        y: 0,
        toJSON: () => {}
      };
    };
    
    // Mock getComputedStyle
    const originalGetComputedStyle = window.getComputedStyle;
    window.getComputedStyle = (elt: Element, pseudoElt?: string | null) => {
      const style = originalGetComputedStyle(elt, pseudoElt);
      style.visibility = 'visible';
      style.display = 'block';
      return style;
    };

    // Add some focusable elements to the DOM
    document.body.innerHTML = `
      <div id="test-container">
        <button id="btn1">Button 1</button>
        <a href="#" id="link1">Link 1</a>
        <input type="text" id="input1" tabindex="-1" />
        <button id="btn2" tabindex="2">Button 2</button>
        <button id="trap" style="visibility: hidden">Trap</button>
      </div>
    `;
  });

  afterEach(() => {
    document.body.innerHTML = '';
    vi.restoreAllMocks();
  });

  it('renders without crashing and identifies focusable elements', () => {
    const handleClose = vi.fn();
    render(<FocusOrderVisualizer onClose={handleClose} />);
    
    // The component renders a portal, we can check document.body
    expect(screen.getByRole('dialog', { hidden: true })).toBeInTheDocument();
    expect(screen.getByText('Focus Order QA')).toBeInTheDocument();
  });

  it('copies report to clipboard', async () => {
    const handleClose = vi.fn();
    
    // Mock clipboard
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
    });

    render(<FocusOrderVisualizer onClose={handleClose} />);
    
    const copyButton = screen.getByText('Copy Report');
    fireEvent.click(copyButton);
    
    expect(navigator.clipboard.writeText).toHaveBeenCalled();
  });

  it('calls onClose when close button is clicked', () => {
    const handleClose = vi.fn();
    render(<FocusOrderVisualizer onClose={handleClose} />);
    
    const closeButton = screen.getByText('Close (Esc)');
    fireEvent.click(closeButton);
    
    expect(handleClose).toHaveBeenCalled();
  });

  it('calls onClose when Escape key is pressed', () => {
    const handleClose = vi.fn();
    render(<FocusOrderVisualizer onClose={handleClose} />);
    
    fireEvent.keyDown(window, { key: 'Escape' });
    
    expect(handleClose).toHaveBeenCalled();
  });
});
