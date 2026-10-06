import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, within, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactElement } from 'react';
import ProductTour, { type TourStep } from './ProductTour';
import { Default, SingleStep, WithAction, CompletionCelebration } from './ProductTour.stories';

type StoryRender = (() => ReactElement) | undefined;

const renderStory = (story: { render: StoryRender }) => {
  if (!story.render) throw new Error('Story has no render function');
  const storyRender = story.render;
  const StoryView = () => storyRender();
  return render(<StoryView />);
};

const makeStep = (overrides: Partial<TourStep> = {}): TourStep => ({
  id: 'step',
  target: '.tour-target',
  title: 'Step title',
  content: 'Step content',
  placement: 'bottom',
  ...overrides,
});

const makeThreeSteps = (): TourStep[] => [
  makeStep({
    id: 'step-1',
    target: '.test-element-1',
    title: 'First Step',
    content: 'This is the first step content',
    placement: 'bottom',
  }),
  makeStep({
    id: 'step-2',
    target: '.test-element-2',
    title: 'Second Step',
    content: 'This is the second step content',
    placement: 'top',
  }),
  makeStep({
    id: 'step-3',
    target: '.test-element-3',
    title: 'Third Step',
    content: 'This is the third step content',
    placement: 'right',
  }),
];

const createCallbacks = () => ({
  onClose: vi.fn(),
  onComplete: vi.fn(),
  onDismiss: vi.fn(),
});

type TourCallbacks = ReturnType<typeof createCallbacks>;

const renderTour = (steps: TourStep[], isOpen: boolean, callbacks: TourCallbacks = createCallbacks()) =>
  render(
    <ProductTour
      steps={steps}
      isOpen={isOpen}
      onClose={callbacks.onClose}
      onComplete={callbacks.onComplete}
      onDismiss={callbacks.onDismiss}
    />,
  );

describe('ProductTour', () => {
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement('div');
    container.innerHTML = [
      '<div class="tour-target">Target</div>',
      '<div class="test-element-1">Element 1</div>',
      '<div class="test-element-2">Element 2</div>',
      '<div class="test-element-3">Element 3</div>',
    ].join('');
    document.body.appendChild(container);
    vi.stubGlobal('alert', vi.fn());
  });

  afterEach(() => {
    container.remove();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  describe('Default story regression', () => {
    it('renders the demo page with no tour dialog on mount', () => {
      renderStory(Default);

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Start Tour' })).toBeInTheDocument();
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
    });

    it('opens the Default tour on the first demo step from the start button', async () => {
      const user = userEvent.setup();
      renderStory(Default);

      await user.click(screen.getByRole('button', { name: 'Start Tour' }));

      const dialog = screen.getByRole('dialog');
      expect(within(dialog).getByText('Welcome to Stellarbill! 👋')).toBeInTheDocument();
      expect(within(dialog).getByText('1 of 5')).toBeInTheDocument();
      expect(within(dialog).getByRole('button', { name: 'Show me later' })).toBeInTheDocument();
      expect(within(dialog).getByRole('button', { name: /previous step/i })).toBeDisabled();
      expect(within(dialog).getByRole('button', { name: /next step/i })).toBeEnabled();
    });

    it('advances the Default tour through all five demo steps', async () => {
      const user = userEvent.setup();
      renderStory(Default);
      await user.click(screen.getByRole('button', { name: 'Start Tour' }));

      const dialog = screen.getByRole('dialog');
      const titles = [
        'Key Metrics at a Glance',
        'Track Revenue Growth',
        'Stay Updated',
        'Ready to Get Started?',
      ];

      for (let i = 0; i < titles.length; i++) {
        await user.click(within(dialog).getByRole('button', { name: /next step/i }));
        expect(within(dialog).getByText(titles[i])).toBeInTheDocument();
        expect(within(dialog).getByText(i + 2 + ' of 5')).toBeInTheDocument();
      }

      expect(within(dialog).getByRole('button', { name: /complete tour/i })).toHaveTextContent('Done');
    });

    it('reports the demo step action on the last step without advancing the tour', async () => {
      const user = userEvent.setup();
      renderStory(Default);
      await user.click(screen.getByRole('button', { name: 'Start Tour' }));

      const dialog = screen.getByRole('dialog');
      for (let i = 0; i < 4; i++) {
        await user.click(within(dialog).getByRole('button', { name: /next step/i }));
      }

      await user.click(within(dialog).getByRole('button', { name: 'Create Plan' }));

      expect(window.alert).toHaveBeenCalledWith('Navigating to plan creation...');
      expect(within(dialog).getByText('5 of 5')).toBeInTheDocument();
    });

    it('completes the Default tour and shows the completion dialog', async () => {
      const user = userEvent.setup();
      renderStory(Default);
      await user.click(screen.getByRole('button', { name: 'Start Tour' }));

      const dialog = screen.getByRole('dialog');
      for (let i = 0; i < 4; i++) {
        await user.click(within(dialog).getByRole('button', { name: /next step/i }));
      }
      await user.click(within(dialog).getByRole('button', { name: /complete tour/i }));

      const completion = screen.getByRole('dialog');
      expect(within(completion).getByText("You're all set!")).toBeInTheDocument();
      expect(within(completion).getByRole('button', { name: 'Get started' })).toBeInTheDocument();
      expect(screen.queryByText('Ready to Get Started?')).not.toBeInTheDocument();

      await user.click(within(completion).getByRole('button', { name: 'Get started' }));

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('dismisses the Default tour from the skip button without the completion dialog', async () => {
      const user = userEvent.setup();
      renderStory(Default);
      await user.click(screen.getByRole('button', { name: 'Start Tour' }));

      await user.click(screen.getByRole('button', { name: 'Show me later' }));

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      expect(screen.queryByText("You're all set!")).not.toBeInTheDocument();
    });
  });

  describe('SingleStep story', () => {
    it('shows Done immediately for a one step tour', async () => {
      const user = userEvent.setup();
      renderStory(SingleStep);
      await user.click(screen.getByRole('button', { name: 'Start Tour' }));

      const dialog = screen.getByRole('dialog');
      expect(within(dialog).getByText('1 of 1')).toBeInTheDocument();
      expect(within(dialog).getByRole('button', { name: /previous step/i })).toBeDisabled();
      expect(within(dialog).getByRole('button', { name: /complete tour/i })).toHaveTextContent('Done');
    });

    it('completes a one step tour and shows the completion dialog', async () => {
      const user = userEvent.setup();
      renderStory(SingleStep);
      await user.click(screen.getByRole('button', { name: 'Start Tour' }));

      await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: /complete tour/i }));

      expect(within(screen.getByRole('dialog')).getByText("You're all set!")).toBeInTheDocument();
    });
  });

  describe('WithAction story', () => {
    it('invokes the custom action without advancing or closing the tour', async () => {
      const user = userEvent.setup();
      renderStory(WithAction);
      await user.click(screen.getByRole('button', { name: 'Start Tour' }));

      await user.click(screen.getByRole('button', { name: 'Try It' }));

      expect(window.alert).toHaveBeenCalledWith('Custom action clicked!');
      expect(screen.getByText('1 of 1')).toBeInTheDocument();
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
  });

  describe('CompletionCelebration story', () => {
    it('shows the celebration dialog with custom copy and closes from the action button', async () => {
      const user = userEvent.setup();
      renderStory(CompletionCelebration);

      const dialog = screen.getByRole('dialog', { name: /Tour Complete/i });
      expect(
        within(dialog).getByText(
          "You've successfully completed the product tour. You're now ready to use all features.",
        ),
      ).toBeInTheDocument();

      await user.click(within(dialog).getByRole('button', { name: "Let's go!" }));

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('closes the celebration dialog on Escape', () => {
      renderStory(CompletionCelebration);

      fireEvent.keyDown(document, { key: 'Escape' });

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });

  describe('Visibility', () => {
    it('renders nothing while closed', () => {
      const callbacks = createCallbacks();
      renderTour(makeThreeSteps(), false, callbacks);

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      expect(callbacks.onClose).not.toHaveBeenCalled();
    });

    it('keeps the current step when closed and reopened without unmounting', async () => {
      const user = userEvent.setup();
      const callbacks = createCallbacks();
      const steps = makeThreeSteps();
      const { rerender } = renderTour(steps, true, callbacks);
      await user.click(screen.getByRole('button', { name: /next step/i }));
      expect(screen.getByText('2 of 3')).toBeInTheDocument();

      rerender(
        <ProductTour
          steps={steps}
          isOpen={false}
          onClose={callbacks.onClose}
          onComplete={callbacks.onComplete}
          onDismiss={callbacks.onDismiss}
        />,
      );
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

      rerender(
        <ProductTour
          steps={steps}
          isOpen={true}
          onClose={callbacks.onClose}
          onComplete={callbacks.onComplete}
          onDismiss={callbacks.onDismiss}
        />,
      );
      expect(screen.getByText('Second Step')).toBeInTheDocument();
      expect(screen.getByText('2 of 3')).toBeInTheDocument();
    });
  });

  describe('Navigation', () => {
    it('starts on the first step with the back button disabled', () => {
      renderTour(makeThreeSteps(), true);

      expect(screen.getByText('First Step')).toBeInTheDocument();
      expect(screen.getByText('1 of 3')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /previous step/i })).toBeDisabled();
    });

    it('moves forward to the next step', async () => {
      const user = userEvent.setup();
      renderTour(makeThreeSteps(), true);

      await user.click(screen.getByRole('button', { name: /next step/i }));

      expect(screen.getByText('Second Step')).toBeInTheDocument();
      expect(screen.getByText('2 of 3')).toBeInTheDocument();
    });

    it('moves back to the previous step', async () => {
      const user = userEvent.setup();
      renderTour(makeThreeSteps(), true);
      await user.click(screen.getByRole('button', { name: /next step/i }));

      await user.click(screen.getByRole('button', { name: /previous step/i }));

      expect(screen.getByText('First Step')).toBeInTheDocument();
      expect(screen.getByText('1 of 3')).toBeInTheDocument();
    });

    it('walks from the first step to the last step and back', async () => {
      const user = userEvent.setup();
      renderTour(makeThreeSteps(), true);

      await user.click(screen.getByRole('button', { name: /next step/i }));
      await user.click(screen.getByRole('button', { name: /next step/i }));
      expect(screen.getByText('Third Step')).toBeInTheDocument();
      expect(screen.getByText('3 of 3')).toBeInTheDocument();

      await user.click(screen.getByRole('button', { name: /previous step/i }));
      await user.click(screen.getByRole('button', { name: /previous step/i }));
      expect(screen.getByText('First Step')).toBeInTheDocument();
      expect(screen.getByText('1 of 3')).toBeInTheDocument();
    });

    it('does not move back past the first step when back is clicked repeatedly', async () => {
      const user = userEvent.setup();
      renderTour(makeThreeSteps(), true);

      await user.click(screen.getByRole('button', { name: /previous step/i }));
      await user.click(screen.getByRole('button', { name: /previous step/i }));

      expect(screen.getByText('1 of 3')).toBeInTheDocument();
    });

    it('labels the primary button Next until the last step and Done on it', async () => {
      const user = userEvent.setup();
      renderTour(makeThreeSteps(), true);

      expect(screen.getByRole('button', { name: /next step/i })).toHaveTextContent('Next');
      await user.click(screen.getByRole('button', { name: /next step/i }));
      await user.click(screen.getByRole('button', { name: /next step/i }));
      expect(screen.getByRole('button', { name: /complete tour/i })).toHaveTextContent('Done');
    });
  });

  describe('Completion and dismissal callbacks', () => {
    it('calls onComplete and onClose once when Done is clicked on the last step', async () => {
      const user = userEvent.setup();
      const callbacks = createCallbacks();
      renderTour(makeThreeSteps(), true, callbacks);
      await user.click(screen.getByRole('button', { name: /next step/i }));
      await user.click(screen.getByRole('button', { name: /next step/i }));

      await user.click(screen.getByRole('button', { name: /complete tour/i }));

      expect(callbacks.onComplete).toHaveBeenCalledTimes(1);
      expect(callbacks.onClose).toHaveBeenCalledTimes(1);
      expect(callbacks.onDismiss).not.toHaveBeenCalled();
    });

    it('does not call onComplete when Done is not on the last step', async () => {
      const user = userEvent.setup();
      const callbacks = createCallbacks();
      renderTour(makeThreeSteps(), true, callbacks);

      await user.click(screen.getByRole('button', { name: /next step/i }));

      expect(callbacks.onComplete).not.toHaveBeenCalled();
      expect(callbacks.onClose).not.toHaveBeenCalled();
    });

    it('calls onDismiss and onClose from the skip button', async () => {
      const user = userEvent.setup();
      const callbacks = createCallbacks();
      renderTour(makeThreeSteps(), true, callbacks);

      await user.click(screen.getByRole('button', { name: 'Show me later' }));

      expect(callbacks.onDismiss).toHaveBeenCalledTimes(1);
      expect(callbacks.onClose).toHaveBeenCalledTimes(1);
      expect(callbacks.onComplete).not.toHaveBeenCalled();
    });

    it('calls only onClose from the close button', async () => {
      const user = userEvent.setup();
      const callbacks = createCallbacks();
      renderTour(makeThreeSteps(), true, callbacks);

      await user.click(screen.getByRole('button', { name: /close tour/i }));

      expect(callbacks.onClose).toHaveBeenCalledTimes(1);
      expect(callbacks.onComplete).not.toHaveBeenCalled();
      expect(callbacks.onDismiss).not.toHaveBeenCalled();
    });

    it('calls only onClose when Escape is pressed', async () => {
      const user = userEvent.setup();
      const callbacks = createCallbacks();
      renderTour(makeThreeSteps(), true, callbacks);

      await user.keyboard('{Escape}');

      expect(callbacks.onClose).toHaveBeenCalledTimes(1);
      expect(callbacks.onComplete).not.toHaveBeenCalled();
      expect(callbacks.onDismiss).not.toHaveBeenCalled();
    });
  });

  describe('Step action', () => {
    it('invokes the step action once per click without closing the tour', async () => {
      const user = userEvent.setup();
      const callbacks = createCallbacks();
      const actionSpy = vi.fn();
      renderTour([makeStep({ action: { label: 'Act now', onClick: actionSpy } })], true, callbacks);

      await user.click(screen.getByRole('button', { name: 'Act now' }));
      await user.click(screen.getByRole('button', { name: 'Act now' }));

      expect(actionSpy).toHaveBeenCalledTimes(2);
      expect(callbacks.onClose).not.toHaveBeenCalled();
      expect(callbacks.onComplete).not.toHaveBeenCalled();
    });
  });

  describe('Progress indicator', () => {
    it('shows the step count and one dot per step', () => {
      renderTour(makeThreeSteps(), true);

      expect(screen.getByText('1 of 3')).toBeInTheDocument();
      expect(document.querySelectorAll('.product-tour__dot')).toHaveLength(3);
    });

    it('marks the active dot with the active class and aria-current', async () => {
      const user = userEvent.setup();
      renderTour(makeThreeSteps(), true);

      let dots = document.querySelectorAll('.product-tour__dot');
      expect(dots[0]).toHaveClass('product-tour__dot--active');
      expect(dots[0]).toHaveAttribute('aria-current', 'step');

      await user.click(screen.getByRole('button', { name: /next step/i }));

      dots = document.querySelectorAll('.product-tour__dot');
      expect(dots[0]).not.toHaveClass('product-tour__dot--active');
      expect(dots[1]).toHaveClass('product-tour__dot--active');
      expect(dots[1]).toHaveAttribute('aria-current', 'step');
    });
  });

  describe('Accessibility', () => {
    it('exposes dialog semantics on the tour container', () => {
      renderTour(makeThreeSteps(), true);

      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-modal', 'true');
      expect(dialog).toHaveAttribute('aria-labelledby', 'tour-title');
      expect(dialog).toHaveAttribute('aria-describedby', 'tour-content');
    });

    it('announces the step count through a polite live region', () => {
      renderTour(makeThreeSteps(), true);

      const progressRegion = screen.getByRole('group', { name: /tour progress/i });
      const stepLabel = within(progressRegion).getByText('1 of 3');
      expect(stepLabel).toHaveAttribute('aria-live', 'polite');
    });

    it('moves initial focus into the tooltip', async () => {
      renderTour(makeThreeSteps(), true);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /close tour/i })).toHaveFocus();
      });
    });

    it('traps Tab focus within the tooltip buttons', async () => {
      renderTour(makeThreeSteps(), true);

      const dialog = screen.getByRole('dialog');
      const buttons = within(dialog).getAllByRole('button');
      await waitFor(() => {
        expect(buttons[0]).toHaveFocus();
      });

      fireEvent.keyDown(buttons[buttons.length - 1], { key: 'Tab' });
      expect(buttons[0]).toHaveFocus();

      fireEvent.keyDown(buttons[0], { key: 'Tab', shiftKey: true });
      expect(buttons[buttons.length - 1]).toHaveFocus();
    });

    it('restores focus to the previously focused element when closed', async () => {
      const user = userEvent.setup();
      const callbacks = createCallbacks();
      const triggerButton = document.createElement('button');
      triggerButton.textContent = 'Trigger';
      document.body.appendChild(triggerButton);
      triggerButton.focus();

      const steps = makeThreeSteps();
      const { rerender } = renderTour(steps, true, callbacks);
      await user.click(screen.getByRole('button', { name: /close tour/i }));

      rerender(
        <ProductTour
          steps={steps}
          isOpen={false}
          onClose={callbacks.onClose}
          onComplete={callbacks.onComplete}
          onDismiss={callbacks.onDismiss}
        />,
      );

      await waitFor(() => {
        expect(triggerButton).toHaveFocus();
      });

      triggerButton.remove();
    });
  });

  describe('Failure and boundary inputs', () => {
    it('renders nothing when closed even with zero steps', () => {
      renderTour([], false);

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('throws when opened with zero steps', () => {
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      expect(() => renderTour([], true)).toThrow(TypeError);

      errorSpy.mockRestore();
    });

    it('renders the tooltip without a spotlight and warns when the target matches nothing', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      renderTour([makeStep({ target: '.non-existent-element' })], true);

      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText('Step title')).toBeInTheDocument();
      expect(document.querySelector('.product-tour__spotlight-svg')).toBeNull();
      expect(document.querySelector('.product-tour__spotlight-ring')).toBeNull();
      expect(warnSpy).toHaveBeenCalledWith('Tour target not found: .non-existent-element');
    });

    it('renders empty title and content strings without crashing', () => {
      renderTour([makeStep({ title: '', content: '' })], true);

      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(document.getElementById('tour-title')?.textContent).toBe('');
      expect(document.getElementById('tour-content')?.textContent).toBe('');
    });

    it('clamps tooltip position for an unrecognized placement passed by cast', () => {
      const steps = [makeStep({ placement: 'diagonal' as TourStep['placement'] })];

      renderTour(steps, true);

      const tooltip = document.querySelector('.product-tour__tooltip') as HTMLElement;
      expect(tooltip).not.toBeNull();
      expect(tooltip).toHaveStyle({ top: '16px', left: '16px' });
    });

    it('falls back to the default spotlight padding for a null spotlightPadding cast', () => {
      const steps = [makeStep({ spotlightPadding: null as unknown as number })];

      renderTour(steps, true);

      const ring = document.querySelector('.product-tour__spotlight-ring') as HTMLElement;
      expect(ring).not.toBeNull();
      expect(ring).toHaveStyle({ left: '-8px', top: '-8px', width: '16px', height: '16px' });
    });

    it('renders a two hundred step tour with one dot per step', () => {
      const steps = Array.from({ length: 200 }, (_, index) =>
        makeStep({ id: 'step-' + index, title: 'Step ' + (index + 1) }),
      );

      renderTour(steps, true);

      expect(screen.getByText('1 of 200')).toBeInTheDocument();
      expect(document.querySelectorAll('.product-tour__dot')).toHaveLength(200);
    });
  });

  describe('Reduced motion', () => {
    it('renders the tour when prefers reduced motion is set', () => {
      vi.spyOn(window, 'matchMedia').mockImplementation((query: string) =>
        ({
          matches: query === '(prefers-reduced-motion: reduce)',
          media: query,
          onchange: null,
          addListener: vi.fn(),
          removeListener: vi.fn(),
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          dispatchEvent: vi.fn(),
        }) as MediaQueryList,
      );

      renderTour(makeThreeSteps(), true);

      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText('First Step')).toBeInTheDocument();
    });
  });

  // ---------------------------------------------------------------------------
  // Regression — TourStep failure path: `if (!isOpen) return null` (line 188)
  //
  // These tests pin the exact contract: when isOpen transitions to false the
  // component must return null (no DOM output), and when it is true the full
  // tooltip is rendered.  They guard against accidental removal or weakening
  // of the early-return guard.
  // ---------------------------------------------------------------------------

  describe('TourStep failure path — if (!isOpen) return null regression', () => {
    it('returns null (renders nothing) when isOpen is false — explicit null-return branch', () => {
      render(
        <ProductTour
          steps={mockSteps}
          isOpen={false}
          onClose={vi.fn()}
          onComplete={vi.fn()}
          onDismiss={vi.fn()}
        />,
      );

      // The early-return guard must prevent any tour DOM from appearing.
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      expect(screen.queryByText('First Step')).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /next step/i })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /close tour/i })).not.toBeInTheDocument();
    });

    it('renders the full tooltip when isOpen is true — neighboring normal path', () => {
      render(
        <ProductTour
          steps={mockSteps}
          isOpen={true}
          onClose={vi.fn()}
          onComplete={vi.fn()}
          onDismiss={vi.fn()}
        />,
      );

      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText('First Step')).toBeInTheDocument();
      expect(screen.getByText('This is the first step content')).toBeInTheDocument();
    });

    it('unmounts all tour nodes when isOpen transitions from true → false', () => {
      const { rerender } = render(
        <ProductTour
          steps={mockSteps}
          isOpen={true}
          onClose={vi.fn()}
          onComplete={vi.fn()}
          onDismiss={vi.fn()}
        />,
      );

      // Confirm it was mounted
      expect(screen.getByRole('dialog')).toBeInTheDocument();

      // Transition to closed
      rerender(
        <ProductTour
          steps={mockSteps}
          isOpen={false}
          onClose={vi.fn()}
          onComplete={vi.fn()}
          onDismiss={vi.fn()}
        />,
      );

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('mounts tour nodes when isOpen transitions from false → true', () => {
      const { rerender } = render(
        <ProductTour
          steps={mockSteps}
          isOpen={false}
          onClose={vi.fn()}
          onComplete={vi.fn()}
          onDismiss={vi.fn()}
        />,
      );

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

      rerender(
        <ProductTour
          steps={mockSteps}
          isOpen={true}
          onClose={vi.fn()}
          onComplete={vi.fn()}
          onDismiss={vi.fn()}
        />,
      );

      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('does not render when isOpen is false even with a single step', () => {
      const singleStep: TourStep[] = [
        {
          id: 'only',
          target: '.test-element-1',
          title: 'Only Step',
          content: 'Single step content',
          placement: 'center',
        },
      ];

      render(
        <ProductTour
          steps={singleStep}
          isOpen={false}
          onClose={vi.fn()}
          onComplete={vi.fn()}
          onDismiss={vi.fn()}
        />,
      );

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      expect(screen.queryByText('Only Step')).not.toBeInTheDocument();
    });

    it('does not render when isOpen is false with an empty steps array', () => {
      render(
        <ProductTour
          steps={[]}
          isOpen={false}
          onClose={vi.fn()}
          onComplete={vi.fn()}
          onDismiss={vi.fn()}
        />,
      );

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('renders step title and content via the normal path for every placement value', () => {
      const placements = ['top', 'bottom', 'left', 'right', 'center'] as const;

      placements.forEach((placement) => {
        const step: TourStep[] = [
          {
            id: `placement-${placement}`,
            target: '.test-element-1',
            title: `${placement} step`,
            content: `Content for ${placement}`,
            placement,
          },
        ];

        const { unmount } = render(
          <ProductTour
            steps={step}
            isOpen={true}
            onClose={vi.fn()}
            onComplete={vi.fn()}
            onDismiss={vi.fn()}
          />,
        );

        expect(screen.getByText(`${placement} step`)).toBeInTheDocument();
        expect(screen.getByText(`Content for ${placement}`)).toBeInTheDocument();

        unmount();
      });
    });
  });
});
