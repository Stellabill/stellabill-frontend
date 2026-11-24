import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { SaveOfferStep } from './SaveOfferStep';

function renderSaveOfferStep(
    props: Partial<React.ComponentProps<typeof SaveOfferStep>> = {},
) {
    const defaultProps: React.ComponentProps<typeof SaveOfferStep> = {
        onSkip: () => undefined,
        onOfferSelected: () => undefined,
    };
    return render(<SaveOfferStep {...defaultProps} {...props} />);
}

describe('SaveOfferStep', () => {
    it('renders the heading and the three offer titles', () => {
        renderSaveOfferStep();

        expect(
            screen.getByRole('heading', { name: 'Before you go...' }),
        ).toBeInTheDocument();
        expect(
            screen.getByRole('heading', { name: 'Pause subscription' }),
        ).toBeInTheDocument();
        expect(
            screen.getByRole('heading', { name: 'Downgrade plan' }),
        ).toBeInTheDocument();
        expect(
            screen.getByRole('heading', { name: 'Get 20% off' }),
        ).toBeInTheDocument();
    });

    it('calls onOfferSelected with "pause", "downgrade", and "discount" when clicking each offer action button', async () => {
        const user = userEvent.setup();
        const onOfferSelected = vi.fn();
        renderSaveOfferStep({ onOfferSelected });

        await user.click(
            screen.getByRole('button', { name: 'Pause instead: Pause subscription' }),
        );
        expect(onOfferSelected).toHaveBeenLastCalledWith('pause');

        await user.click(
            screen.getByRole('button', { name: 'See plans: Downgrade plan' }),
        );
        expect(onOfferSelected).toHaveBeenLastCalledWith('downgrade');

        await user.click(
            screen.getByRole('button', { name: 'Apply discount: Get 20% off' }),
        );
        expect(onOfferSelected).toHaveBeenLastCalledWith('discount');

        expect(onOfferSelected).toHaveBeenCalledTimes(3);
    });

    it('calls onSkip once when clicking the skip button', async () => {
        const user = userEvent.setup();
        const onSkip = vi.fn();
        renderSaveOfferStep({ onSkip });

        await user.click(
            screen.getByRole('button', { name: 'Continue to cancel' }),
        );

        expect(onSkip).toHaveBeenCalledTimes(1);
    });

    it('attaches initialFocusRef to the first offer action button so it receives focus', () => {
        const initialFocusRef = React.createRef<HTMLButtonElement>();
        renderSaveOfferStep({ initialFocusRef });

        const firstOfferButton = screen.getByRole('button', {
            name: 'Pause instead: Pause subscription',
        });

        expect(initialFocusRef.current).toBe(firstOfferButton);

        initialFocusRef.current?.focus();
        expect(firstOfferButton).toHaveFocus();
    });
});
