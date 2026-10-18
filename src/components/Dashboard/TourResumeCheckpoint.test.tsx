import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { describe, it, expect, vi, beforeEach, Mock } from 'vitest';
import TourResumeCheckpoint from './TourResumeCheckpoint';
import * as ProductTourProvider from './ProductTourProvider';

// Mock the useProductTour hook
vi.mock('./ProductTourProvider', () => ({
  useProductTour: vi.fn(),
}));

describe('TourResumeCheckpoint', () => {
  const mockResumeTour = vi.fn();
  const mockClearCheckpoint = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const setupMock = (overrides = {}) => {
    (ProductTourProvider.useProductTour as Mock).mockReturnValue({
      checkpoint: { stepIndex: 0, title: 'Welcome', stepId: 'step-1', version: 1 },
      resumeTour: mockResumeTour,
      clearCheckpoint: mockClearCheckpoint,
      isTourActive: false,
      ...overrides,
    });
  };

  it('renders null when there is no checkpoint', () => {
    setupMock({ checkpoint: null });
    const { container } = render(<TourResumeCheckpoint />);
    expect(container.firstChild).toBeNull();
  });

  it('renders null when the tour is active', () => {
    setupMock({ isTourActive: true });
    const { container } = render(<TourResumeCheckpoint />);
    expect(container.firstChild).toBeNull();
  });

  it('renders null when both checkpoint is null and tour is active', () => {
    setupMock({ checkpoint: null, isTourActive: true });
    const { container } = render(<TourResumeCheckpoint />);
    expect(container.firstChild).toBeNull();
  });

  it('renders the checkpoint chip when there is a checkpoint and tour is not active', () => {
    setupMock();
    render(<TourResumeCheckpoint />);
    
    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.getByText('Tour paused at step 1: Welcome')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Resume product tour' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Dismiss tour checkpoint' })).toBeInTheDocument();
  });

  it('calls resumeTour when Continue button is clicked', () => {
    setupMock();
    render(<TourResumeCheckpoint />);
    
    fireEvent.click(screen.getByRole('button', { name: 'Resume product tour' }));
    expect(mockResumeTour).toHaveBeenCalledTimes(1);
  });

  it('calls clearCheckpoint when Dismiss button is clicked', () => {
    setupMock();
    render(<TourResumeCheckpoint />);
    
    fireEvent.click(screen.getByRole('button', { name: 'Dismiss tour checkpoint' }));
    expect(mockClearCheckpoint).toHaveBeenCalledTimes(1);
  });
});
