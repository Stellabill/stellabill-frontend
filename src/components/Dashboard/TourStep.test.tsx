import { render } from '@testing-library/react';
import type { ComponentProps } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { TourStep } from './TourStep';
import type { TourStepInfo } from './ProductTourProvider';

/**
 * Focused regression coverage for `TourStep`.
 *
 * The component is a "render nothing, register a step" side effect:
 * `src/components/Dashboard/TourStep.tsx` returns `null` and its only
 * observable behavior is the `registerStep` call it makes inside an effect.
 * That empty-result path is exactly what these tests pin down, together with
 * the payload contract (`id`, `title`, `content`, `targetId`, `path`) and the
 * boundary inputs the component forwards without validation.
 *
 * The context hook is mocked so the payload can be asserted verbatim, which
 * also keeps the suite independent of `ProductTourProvider` internals.
 */

const tour = vi.hoisted(() => ({
  registerStep: vi.fn(),
  value: null as unknown as { registerStep: (step: TourStepInfo) => void },
}));

vi.mock('./ProductTourProvider', () => ({
  useProductTour: () => tour.value,
}));

const START_PATH = '/dashboard';

function setPath(path: string): void {
  window.history.pushState({}, '', path);
}

function renderStep(props: Partial<ComponentProps<typeof TourStep>> = {}) {
  return render(
    <TourStep id="step-1" title="Welcome" content="Hello" targetId="hero" {...props} />,
  );
}

beforeEach(() => {
  tour.registerStep = vi.fn();
  tour.value = { registerStep: tour.registerStep };
  setPath(START_PATH);
});

afterEach(() => {
  setPath('/');
  vi.clearAllMocks();
});

describe('TourStep - registration contract', () => {
  it('renders nothing', () => {
    const { container } = renderStep();

    // The component's whole contribution is the registration side effect.
    expect(container.innerHTML).toBe('');
  });

  it('does not add any element to the document', () => {
    const before = document.body.childElementCount;
    renderStep();

    // RTL mounts into its own container, so the body gains exactly one node
    // (the container) and the component itself contributes none.
    expect(document.body.childElementCount).toBe(before + 1);
    expect(document.body.lastElementChild?.childElementCount).toBe(0);
  });

  it('registers the step once on mount with the full payload', () => {
    const content = <span>Tour body</span>;
    renderStep({ id: 'welcome', title: 'Welcome aboard', content, targetId: 'hero' });

    expect(tour.registerStep).toHaveBeenCalledTimes(1);
    expect(tour.registerStep).toHaveBeenCalledWith({
      id: 'welcome',
      title: 'Welcome aboard',
      content,
      targetId: 'hero',
      path: START_PATH,
    });
  });

  it('passes the content node through by reference, not as a fresh element', () => {
    const content = <span>Tour body</span>;
    renderStep({ content });

    const [step] = tour.registerStep.mock.calls[0] as [TourStepInfo];
    expect(step.content).toBe(content);
  });

  it('reads the path from window.location at registration time', () => {
    setPath('/invoices/detail');
    renderStep();

    const [step] = tour.registerStep.mock.calls[0] as [TourStepInfo];
    expect(step.path).toBe('/invoices/detail');
  });

  it('does not register again when a re-render changes no props', () => {
    const { rerender } = renderStep();
    rerender(<TourStep id="step-1" title="Welcome" content="Hello" targetId="hero" />);

    expect(tour.registerStep).toHaveBeenCalledTimes(1);
  });

  it('re-registers when the step id changes', () => {
    const { rerender } = renderStep();
    rerender(<TourStep id="step-2" title="Welcome" content="Hello" targetId="hero" />);

    expect(tour.registerStep).toHaveBeenCalledTimes(2);
    expect(tour.registerStep.mock.calls[1][0]).toMatchObject({ id: 'step-2' });
  });

  it('re-registers when only the targetId changes', () => {
    const { rerender } = renderStep();
    rerender(<TourStep id="step-1" title="Welcome" content="Hello" targetId="footer" />);

    expect(tour.registerStep).toHaveBeenCalledTimes(2);
    expect(tour.registerStep.mock.calls[1][0]).toMatchObject({ targetId: 'footer' });
  });

  it('re-registers with the new path when the route changes and props do not', () => {
    const { rerender } = renderStep();

    setPath('/settings');
    rerender(<TourStep id="step-1" title="Welcome" content="Hello" targetId="hero" />);

    // `path` is part of the effect dependencies, so a same-props re-render
    // after navigation still refreshes the registration.
    expect(tour.registerStep).toHaveBeenCalledTimes(2);
    expect(tour.registerStep.mock.calls[1][0]).toMatchObject({ path: '/settings' });
  });

  it('re-registers when the provider hands out a new registerStep identity', () => {
    const { rerender } = renderStep();

    const replacement = vi.fn();
    tour.value = { registerStep: replacement };
    rerender(<TourStep id="step-1" title="Welcome" content="Hello" targetId="hero" />);

    expect(replacement).toHaveBeenCalledTimes(1);
    expect(tour.registerStep).toHaveBeenCalledTimes(1);
  });

  it('leaves the registration in place when unmounted', () => {
    const { unmount } = renderStep();
    unmount();

    // There is no unregister/release path: the provider keeps the step so a
    // navigation away and back does not silently drop the tour.
    expect(tour.registerStep).toHaveBeenCalledTimes(1);
  });
});

describe('TourStep - boundary inputs', () => {
  it('forwards an empty targetId rather than skipping registration', () => {
    renderStep({ targetId: '' });

    expect(tour.registerStep).toHaveBeenCalledTimes(1);
    expect(tour.registerStep.mock.calls[0][0]).toMatchObject({ targetId: '' });
  });

  it('forwards an empty title and a null content node unchanged', () => {
    renderStep({ title: '', content: null });

    expect(tour.registerStep).toHaveBeenCalledWith({
      id: 'step-1',
      title: '',
      content: null,
      targetId: 'hero',
      path: START_PATH,
    });
  });

  it('registers one payload per mounted step, keeping sibling ids distinct', () => {
    render(
      <>
        <TourStep id="a" title="A" content="a" targetId="a-target" />
        <TourStep id="b" title="B" content="b" targetId="b-target" />
      </>,
    );

    expect(tour.registerStep).toHaveBeenCalledTimes(2);
    expect(tour.registerStep.mock.calls.map(([step]) => step.id)).toEqual(['a', 'b']);
  });

  it('does not pre-validate the path beyond reading it verbatim', () => {
    setPath('/deeply/nested/route?ignored=query#hash');
    renderStep();

    // `window.location.pathname` excludes the query string and hash.
    expect((tour.registerStep.mock.calls[0][0] as TourStepInfo).path).toBe('/deeply/nested/route');
  });
});
