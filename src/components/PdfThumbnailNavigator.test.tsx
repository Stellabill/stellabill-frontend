import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import PdfThumbnailNavigator from './PdfThumbnailNavigator';

describe('PdfThumbnailNavigator', () => {
  it('renders correct number of pages', () => {
    render(<PdfThumbnailNavigator numPages={5} currentPage={1} onPageChange={vi.fn()} />);
    const buttons = screen.getAllByRole('tab');
    expect(buttons).toHaveLength(5);
  });

  it('calls onPageChange when a thumbnail is clicked', () => {
    const handlePageChange = vi.fn();
    render(<PdfThumbnailNavigator numPages={5} currentPage={1} onPageChange={handlePageChange} />);
    const buttons = screen.getAllByRole('tab');
    fireEvent.click(buttons[2]);
    expect(handlePageChange).toHaveBeenCalledWith(3);
  });

  it('handles keyboard navigation correctly', () => {
    const handlePageChange = vi.fn();
    render(<PdfThumbnailNavigator numPages={10} currentPage={5} onPageChange={handlePageChange} />);
    const container = screen.getByRole('tablist');
    
    // ArrowUp -> page 4
    fireEvent.keyDown(container, { key: 'ArrowUp' });
    expect(handlePageChange).toHaveBeenLastCalledWith(4);
    
    // ArrowDown -> page 6
    fireEvent.keyDown(container, { key: 'ArrowDown' });
    expect(handlePageChange).toHaveBeenLastCalledWith(6);
    
    // PageUp -> page 2
    fireEvent.keyDown(container, { key: 'PageUp' });
    expect(handlePageChange).toHaveBeenLastCalledWith(2);
    
    // PageDown -> page 8
    fireEvent.keyDown(container, { key: 'PageDown' });
    expect(handlePageChange).toHaveBeenLastCalledWith(8);
    
    // Home -> page 1
    fireEvent.keyDown(container, { key: 'Home' });
    expect(handlePageChange).toHaveBeenLastCalledWith(1);
    
    // End -> page 10
    fireEvent.keyDown(container, { key: 'End' });
    expect(handlePageChange).toHaveBeenLastCalledWith(10);
  });
  
  it('maintains accessibility attributes', () => {
    render(<PdfThumbnailNavigator numPages={3} currentPage={2} onPageChange={vi.fn()} />);
    
    const tabs = screen.getAllByRole('tab');
    expect(tabs[1]).toHaveAttribute('aria-current', 'true');
    expect(tabs[1]).toHaveAttribute('aria-selected', 'true');
    
    expect(tabs[0]).not.toHaveAttribute('aria-current');
    
    const chip = screen.getByRole('status');
    expect(chip).toHaveTextContent('Page 2 of 3');
  });
});
