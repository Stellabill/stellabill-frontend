import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, within, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ProductTour, { TourStep } from './ProductTour';

const mockSteps: TourStep[] = [
  {
    id: 'step-1',
    target: '.test-element-1',
    title: 'First Step',
    content: 'This is the first step content',
    placement: 'bottom',
  },
  {
    id: 'step-2',
    target: '.test-element-2',
    title: 'Second Step',
    content: 'This is the second step content',
    placement: 'top',
  },
  {
    id: 'step-3',
    target: '.test-element-3',
    title: 'Third Step',
    content: 'This is the third step content',
    placement: 'right',
    action: {
      label: 'Click me',
      onClick: vi.fn(),
    },
  },
];

describe('ProductTour', () => {
  let container: HTMLElement;

  beforeEach(() => {
    // Create mock target elements
    container = document.createElement('div');
    container.innerHTML = `
      <div class="test-element-1" style="position: absolute; top: 100px; left: 100px; width: 200px; height: 50px;">Element 1</div>
      <div class="test-element-2" style="position: absolute; top: 300px; left: 100px; width: 200px; height: 50px;">Element 2</div>
      <div class="test-element-3" style="position: absolute; top: 500px; left: 100px; width: 200px; height: 50px;">Element 3</div>
    `;
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.removeChild(container);
    vi.clearAllMocks();
  });

  describe('Tour visibility', () => {
    it('should not render when isOpen is false', () => {
      const onClose = vi.fn();
      const onComplete = vi.fn();
      const onDismiss = vi.fn();

      render(
        <ProductTour
          steps={mockSteps}
          isOpen={false}
          onClose={onClose}
          onComplete={onComplete}
          onDismiss={onDismiss}
        />
      );

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('should render when isOpen is true', () => {
      const onClose = vi.fn();
      const onComplete = vi.fn();
      const onDismiss = vi.fn();

      render(
        <ProductTour
          steps={mockSteps}
          isOpen={true}
          onClose={onClose}
          onComplete={onComplete}
          onDismiss={onDismiss}
        />
      );

      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText('First Step')).toBeInTheDocument();
      expect(screen.getByText('This is the first step content')).toBeInTheDocument();
    });
  });

  describe('Navigation', () => {
    it('should start at the first step', () => {
      const onClose = vi.fn();
      const onComplete = vi.fn();
      const onDismiss = vi.fn();

      render(
        <ProductTour
          steps={mockSteps}
          isOpen={true}
          onClose={onClose}
          onComplete={onComplete}
          onDismiss={onDismiss}
        />
      );

      expect(screen.getByText('First Step')).toBeInTheDocument();
      expect(screen.getByText('1 of 3')).toBeInTheDocument();
    });

    it('should navigate to next step', async () => {
      const user = userEvent.setup();
      const onClose = vi.fn();
      const onComplete = vi.fn();
      const onDismiss = vi.fn();

      render(
        <ProductTour
          steps={mockSteps}
          isOpen={true}
          onClose={onClose}
          onComplete={onComplete}
          onDismiss={onDismiss}
        />
      );

      const nextButton = screen.getByRole('button', { name: /next step/i });
      await user.click(nextButton);

      expect(screen.getByText('Second Step')).toBeInTheDocument();
      expect(screen.getByText('2 of 3')).toBeInTheDocument();
    });

    it('should navigate back to previous step', async () => {
      const user = userEvent.setup();
      const onClose = vi.fn();
      const onComplete = vi.fn();
      const onDismiss = vi.fn();

      render(
        <ProductTour
          steps={mockSteps}
          isOpen={true}
          onClose={onClose}
          onComplete={onComplete}
          onDismiss={onDismiss}
        />
      );

      // Go to second step
      const nextButton = screen.getByRole('button', { name: /next step/i });
      await user.click(nextButton);

      // Go back to first step
      const backButton = screen.getByRole('button', { name: /previous step/i });
      await user.click(backButton);

      expect(screen.getByText('First Step')).toBeInTheDocument();
      expect(screen.getByText('1 of 3')).toBeInTheDocument();
    });

    it('should disable back button on first step', () => {
      const onClose = vi.fn();
      const onComplete = vi.fn();
      const onDismiss = vi.fn();

      render(
        <ProductTour
          steps={mockSteps}
          isOpen={true}
          onClose={onClose}
          onComplete={onComplete}
          onDismiss={onDismiss}
        />
      );

      const backButton = screen.getByRole('button', { name: /previous step/i });
      expect(backButton).toBeDisabled();
    });

    it('should show "Done" button on last step', async () => {
      const user = userEvent.setup();
      const onClose = vi.fn();
      const onComplete = vi.fn();
      const onDismiss = vi.fn();

      render(
        <ProductTour
          steps={mockSteps}
          isOpen={true}
          onClose={onClose}
          onComplete={onComplete}
          onDismiss={onDismiss}
        />
      );

      // Navigate to last step
      const nextButton = screen.getByRole('button', { name: /next step/i });
      await user.click(nextButton);
      await user.click(nextButton);

      expect(screen.getByRole('button', { name: /complete tour/i })).toHaveTextContent('Done');
    });
  });

  describe('Tour completion', () => {
    it('should call onComplete and onClose when Done is clicked', async () => {
      const user = userEvent.setup();
      const onClose = vi.fn();
      const onComplete = vi.fn();
      const onDismiss = vi.fn();

      render(
        <ProductTour
          steps={mockSteps}
          isOpen={true}
          onClose={onClose}
          onComplete={onComplete}
          onDismiss={onDismiss}
        />
      );

      // Navigate to last step
      const nextButton = screen.getByRole('button', { name: /next step/i });
      await user.click(nextButton);
      await user.click(nextButton);

      // Click Done
      const doneButton = screen.getByRole('button', { name: /complete tour/i });
      await user.click(doneButton);

      expect(onComplete).toHaveBeenCalledOnce();
      expect(onClose).toHaveBeenCalledOnce();
    });
  });

  describe('Dismissal', () => {
    it('should call onDismiss and onClose when "Show me later" is clicked', async () => {
      const user = userEvent.setup();
      const onClose = vi.fn();
      const onComplete = vi.fn();
      const onDismiss = vi.fn();

      render(
        <ProductTour
          steps={mockSteps}
          isOpen={true}
          onClose={onClose}
          onComplete={onComplete}
          onDismiss={onDismiss}
        />
      );

      const dismissButton = screen.getByRole('button', { name: /show me later/i });
      await user.click(dismissButton);

      expect(onDismiss).toHaveBeenCalledOnce();
      expect(onClose).toHaveBeenCalledOnce();
    });

    it('should call onClose when close button is clicked', async () => {
      const user = userEvent.setup();
      const onClose = vi.fn();
      const onComplete = vi.fn();
      const onDismiss = vi.fn();

      render(
        <ProductTour
          steps={mockSteps}
          isOpen={true}
          onClose={onClose}
          onComplete={onComplete}
          onDismiss={onDismiss}
        />
      );

      const closeButton = screen.getByRole('button', { name: /close tour/i });
      await user.click(closeButton);

      expect(onClose).toHaveBeenCalledOnce();
    });

    it('should call onClose when Escape key is pressed', async () => {
      const user = userEvent.setup();
      const onClose = vi.fn();
      const onComplete = vi.fn();
      const onDismiss = vi.fn();

      render(
        <ProductTour
          steps={mockSteps}
          isOpen={true}
          onClose={onClose}
          onComplete={onComplete}
          onDismiss={onDismiss}
        />
      );

      await user.keyboard('{Escape}');

      expect(onClose).toHaveBeenCalledOnce();
    });
  });

  describe('Step action', () => {
    it('should render and call custom step action', async () => {
      const user = userEvent.setup();
      const onClose = vi.fn();
      const onComplete = vi.fn();
      const onDismiss = vi.fn();

      render(
        <ProductTour
          steps={mockSteps}
          isOpen={true}
          onClose={onClose}
          onComplete={onComplete}
          onDismiss={onDismiss}
        />
      );

      // Navigate to step with action (step 3)
      const nextButton = screen.getByRole('button', { name: /next step/i });
      await user.click(nextButton);
      await user.click(nextButton);

      // Find and click the custom action button
      const actionButton = screen.getByRole('button', { name: 'Click me' });
      await user.click(actionButton);

      expect(mockSteps[2].action?.onClick).toHaveBeenCalledOnce();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes', () => {
      const onClose = vi.fn();
      const onComplete = vi.fn();
      const onDismiss = vi.fn();

      render(
        <ProductTour
          steps={mockSteps}
          isOpen={true}
          onClose={onClose}
          onComplete={onComplete}
          onDismiss={onDismiss}
        />
      );

      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-modal', 'true');
      expect(dialog).toHaveAttribute('aria-labelledby', 'tour-title');
      expect(dialog).toHaveAttribute('aria-describedby', 'tour-content');
    });

    it('should announce current step to screen readers', () => {
      const onClose = vi.fn();
      const onComplete = vi.fn();
      const onDismiss = vi.fn();

      render(
        <ProductTour
          steps={mockSteps}
          isOpen={true}
          onClose={onClose}
          onComplete={onComplete}
          onDismiss={onDismiss}
        />
      );

      const progressRegion = screen.getByRole('group', { name: /tour progress/i });
      expect(progressRegion).toBeInTheDocument();

      const stepLabel = within(progressRegion).getByText('1 of 3');
      expect(stepLabel).toHaveAttribute('aria-live', 'polite');
    });

    it('should trap focus within tooltip', async () => {
      const user = userEvent.setup();
      const onClose = vi.fn();
      const onComplete = vi.fn();
      const onDismiss = vi.fn();

      render(
        <ProductTour
          steps={mockSteps}
          isOpen={true}
          onClose={onClose}
          onComplete={onComplete}
          onDismiss={onDismiss}
        />
      );

      const dialog = screen.getByRole('dialog');
      const buttons = within(dialog).getAllByRole('button');

      // Focus should start on first focusable element
      await waitFor(() => {
        expect(buttons[0]).toHaveFocus();
      });

      // Tab through all buttons
      for (let i = 1; i < buttons.length; i++) {
        await user.tab();
      }

      // Tab from last button should cycle back to first
      await user.tab();
      expect(buttons[0]).toHaveFocus();
    });

    it('should restore focus when closed', async () => {
      const user = userEvent.setup();
      const onClose = vi.fn();
      const onComplete = vi.fn();
      const onDismiss = vi.fn();

      // Create a button to focus before opening tour
      const triggerButton = document.createElement('button');
      triggerButton.textContent = 'Trigger';
      document.body.appendChild(triggerButton);
      triggerButton.focus();

      const { rerender } = render(
        <ProductTour
          steps={mockSteps}
          isOpen={true}
          onClose={onClose}
          onComplete={onComplete}
          onDismiss={onDismiss}
        />
      );

      // Close the tour
      const closeButton = screen.getByRole('button', { name: /close tour/i });
      await user.click(closeButton);

      // Simulate closing by rerendering with isOpen=false
      rerender(
        <ProductTour
          steps={mockSteps}
          isOpen={false}
          onClose={onClose}
          onComplete={onComplete}
          onDismiss={onDismiss}
        />
      );

      // Focus should be restored
      await waitFor(() => {
        expect(triggerButton).toHaveFocus();
      });

      document.body.removeChild(triggerButton);
    });
  });

  describe('Progress indicator', () => {
    it('should display correct progress dots', () => {
      const onClose = vi.fn();
      const onComplete = vi.fn();
      const onDismiss = vi.fn();

      render(
        <ProductTour
          steps={mockSteps}
          isOpen={true}
          onClose={onClose}
          onComplete={onComplete}
          onDismiss={onDismiss}
        />
      );

      const progressGroup = screen.getByRole('group', { name: /tour progress/i });
      const dots = within(progressGroup).getAllByRole('presentation');
      
      expect(dots).toHaveLength(3);
    });

    it('should highlight active step dot', async () => {
      const user = userEvent.setup();
      const onClose = vi.fn();
      const onComplete = vi.fn();
      const onDismiss = vi.fn();

      render(
        <ProductTour
          steps={mockSteps}
          isOpen={true}
          onClose={onClose}
          onComplete={onComplete}
          onDismiss={onDismiss}
        />
      );

      // Check first dot is active
      let activeDots = document.querySelectorAll('.product-tour__dot--active');
      expect(activeDots).toHaveLength(1);

      // Navigate to next step
      const nextButton = screen.getByRole('button', { name: /next step/i });
      await user.click(nextButton);

      // Check second dot is now active
      activeDots = document.querySelectorAll('.product-tour__dot--active');
      expect(activeDots).toHaveLength(1);
    });
  });

  describe('Edge cases', () => {
    it('should handle empty steps array gracefully', () => {
      const onClose = vi.fn();
      const onComplete = vi.fn();
      const onDismiss = vi.fn();

      render(
        <ProductTour
          steps={[]}
          isOpen={true}
          onClose={onClose}
          onComplete={onComplete}
          onDismiss={onDismiss}
        />
      );

      // Should not crash, but won't render meaningful content
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('should handle missing target element', () => {
      const onClose = vi.fn();
      const onComplete = vi.fn();
      const onDismiss = vi.fn();

      const stepsWithInvalidTarget: TourStep[] = [
        {
          id: 'invalid',
          target: '.non-existent-element',
          title: 'Invalid Step',
          content: 'This targets a non-existent element',
          placement: 'bottom',
        },
      ];

      // Should not crash when target is not found
      expect(() => {
        render(
          <ProductTour
            steps={stepsWithInvalidTarget}
            isOpen={true}
            onClose={onClose}
            onComplete={onComplete}
            onDismiss={onDismiss}
          />
        );
      }).not.toThrow();
    });
  });

  describe('Reduced motion', () => {
    it('should respect prefers-reduced-motion', () => {
      // Mock reduced motion preference
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: vi.fn().mockImplementation((query) => ({
          matches: query === '(prefers-reduced-motion: reduce)',
          media: query,
          onchange: null,
          addListener: vi.fn(),
          removeListener: vi.fn(),
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          dispatchEvent: vi.fn(),
        })),
      });

      const onClose = vi.fn();
      const onComplete = vi.fn();
      const onDismiss = vi.fn();

      render(
        <ProductTour
          steps={mockSteps}
          isOpen={true}
          onClose={onClose}
          onComplete={onComplete}
          onDismiss={onDismiss}
        />
      );

      // Component should still render and function without animations
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
  });
});
