import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, test, vi } from 'vitest';
import SwipeableRow from './SwipeableRow';

// Mock framer-motion to simplify testing
vi.mock('framer-motion', () => ({
	motion: {
		div: ({ children, onDragEnd, drag, ...props }: any) => (
			<div 
				data-testid="motion-div" 
				{...props} 
				onPointerUp={(e) => {
					if (onDragEnd) {
						// simulate swipe right
						onDragEnd(e, { velocity: { x: 500 } });
					}
				}}
			>
				{children}
			</div>
		)
	},
	useMotionValue: () => ({ get: () => 100, set: vi.fn() }),
	useTransform: () => ({}),
	animate: vi.fn(),
	useReducedMotion: () => false,
}));

test('renders children correctly', () => {
	render(
		<SwipeableRow>
			<div data-testid="child">Test Content</div>
		</SwipeableRow>
	);
	expect(screen.getByTestId('child')).toBeInTheDocument();
});

test('opens keyboard menu on Enter key', async () => {
	const user = userEvent.setup();
	const mockManage = vi.fn();
	
	render(
		<SwipeableRow
			leadingActions={[
				{ id: 'manage', label: 'Manage', onClick: mockManage }
			]}
		>
			<div data-testid="child">Content</div>
		</SwipeableRow>
	);

	const container = screen.getByRole('button', { name: /row with actions/i });
	await user.type(container, '{Enter}');
	
	const menuItems = screen.getAllByRole('menuitem');
	expect(menuItems).toHaveLength(1);
	expect(menuItems[0]).toHaveTextContent('Manage');
	
	await user.click(menuItems[0]);
	expect(mockManage).toHaveBeenCalled();
});

test('renders actions when swiped (simulated)', async () => {
	const mockPause = vi.fn();
	render(
		<SwipeableRow
			trailingActions={[
				{ id: 'pause', label: 'Pause', onClick: mockPause }
			]}
		>
			<div>Content</div>
		</SwipeableRow>
	);

	const actionsContainer = document.querySelector('.swipeable-actions-trailing');
	expect(actionsContainer).toBeInTheDocument();
	
	const btn = screen.getByRole('button', { name: /Pause/i });
	fireEvent.click(btn);
	expect(mockPause).toHaveBeenCalled();
});
