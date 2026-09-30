import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { SaveOfferStep } from './SaveOfferStep';

vi.mock('./OfferCard', () => ({ OfferCard: ({ title, onAction }: { title: string; onAction: () => void }) => <button onClick={onAction}>{title}</button> }));

describe('SaveOfferStep', () => {
  it('renders the normal offer path and dispatches selection and skip actions', () => {
    const onSkip = vi.fn();
    const onOfferSelected = vi.fn();
    render(<SaveOfferStep onSkip={onSkip} onOfferSelected={onOfferSelected} />);
    expect(screen.getByText('Before you go...')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Pause subscription' }));
    fireEvent.click(screen.getByRole('button', { name: 'Continue to cancel' }));
    expect(onOfferSelected).toHaveBeenCalledWith('pause');
    expect(onSkip).toHaveBeenCalledOnce();
  });
});
