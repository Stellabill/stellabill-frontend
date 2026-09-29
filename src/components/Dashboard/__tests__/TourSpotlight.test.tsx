import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import TourSpotlight from '../TourSpotlight';

// Mock the ProductTourProvider hook
jest.mock('../ProductTourProvider', () => {
  return {
    useProductTour: () => ({
      nextStep: jest.fn(),
      prevStep: jest.fn(),
      endTour: jest.fn(),
      currentStep: 0,
      totalSteps: 2,
    }),
  };
});

// Mock IntersectionObserver and ResizeObserver to immediately invoke callbacks
class MockObserver {
  constructor(callback: IntersectionObserverCallback) {
    this.callback = callback;
  }
  observe = jest.fn();
  disconnect = jest.fn();
  callback: IntersectionObserverCallback;
  // Simulate an intersecting entry
  triggerIntersecting(entry: Partial<IntersectionObserverEntry> = { isIntersecting: true }) {
    this.callback([entry as IntersectionObserverEntry] as any, this as any);
  }
}
global.IntersectionObserver = MockObserver as any;
global.ResizeObserver = class {
  observe = jest.fn();
  disconnect = jest.fn();
} as any;

// Helper to create a mock DOM element with getBoundingClientRect
function createMockTarget() {
  const element = document.createElement('div');
  element.setAttribute('data-tour-id', 'test-target');
  element.getBoundingClientRect = jest.fn(() => ({
    x: 10,
    y: 10,
    width: 100,
    height: 50,
    top: 10,
    bottom: 60,
    left: 10,
    right: 110,
  } as DOMRect));
  document.body.appendChild(element);
  return element;
}

describe('TourSpotlight', () => {
  beforeEach(() => {
    // Clean up DOM between tests
    document.body.innerHTML = '';
  });

  test('renders title and content', () => {
    createMockTarget();
    const step = { targetId: 'test-target', title: 'Step Title', content: <div>Step Content</div> } as any;
    render(<TourSpotlight step={step} />);
    expect(screen.getByText('Step Title')).toBeInTheDocument();
    expect(screen.getByText('Step Content')).toBeInTheDocument();
  });

  test('next button triggers nextStep', () => {
    const mockNext = jest.fn();
    // Override mock to capture nextStep call
    jest.mocked(require('../ProductTourProvider').useProductTour).mockReturnValue({
      nextStep: mockNext,
      prevStep: jest.fn(),
      endTour: jest.fn(),
      currentStep: 0,
      totalSteps: 2,
    });
    createMockTarget();
    const step = { targetId: 'test-target', title: 'Title', content: <div>Content</div> } as any;
    render(<TourSpotlight step={step} />);
    const nextBtn = screen.getByRole('button', { name: /next/i });
    fireEvent.click(nextBtn);
    expect(mockNext).toHaveBeenCalled();
  });

  test('handles missing target element gracefully', () => {
    const step = { targetId: 'non-existent', title: 'Title', content: <div>Content</div> } as any;
    render(<TourSpotlight step={step} />);
    // Should still render without throwing and tooltip should be present
    expect(screen.getByText('Title')).toBeInTheDocument();
  });
});
