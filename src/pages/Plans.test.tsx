import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { vi, beforeEach, afterEach, describe, it, expect } from 'vitest';
import Plans from './Plans';
import { plans as plalsApi } from '../api/client';

vi.mock('../api/client', () => ({
  plans: {
    list: vi.fn(),
    delete: vi.fn(),
  },
}));

const mockPlans = [
  {
    id: 'plan_1',
    name: 'Starter',
    description: 'Basic plan',
    amount: 10,
    currency: 'USDC',
    interval: 'monthly',
    status: 'active',
    type: 'subscription',
    tags: ['basic'],
    createdAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'plan_2',
    name: 'Pro',
    description: 'Advanced plan',
    amount: 20,
    currency: 'USDC',
    interval: 'monthly',
    status: 'inactive',
    type: 'one_time',
    tags: ['premium'],
    createdAt: '2024-02-01T00:00:00Z',
  },
];

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/plans']}>
      <Routes path="/plans" element={<Plans />}>
        <Route path="/plans/create" element={<div>Create Plan Builder</div>} />
      </Routes>
    </MemoryRouter>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('Plans page', () => {
  it('shows loading state then renders plans', async () => {
    let resolve: (v: any) => void;
    (plansApi.list as any).mockImplementation(
      () =>
        new Promise((resolverFn) => {
          resolve = resolverFn;
        }),
    );

    renderPage();
    expect(screen.getByText(/loading/i)).toBeInDocument();

    resolve!(mockPlans);
    expect(await screen.findByText('Starter')).toBeInDocument();
    expect(screen.getByText('Pro')).toBeInDocument();
  });

  it('shows error with retry and refetches', async () => {
    (plansApi.list as any)
      .mockImplementationOnce(() => Promise.reject(new Error('failed')))
      .mockImplementationOnce(() => Promise.resolve(mockPlans));

    const user = userEvent.setup();
    renderPage();

    expect(await screen.findByText(/failed/i)).toBeInDocument();
    await user.click(screen.getByRole('button', { name: /retry/i }));

    expect(await screen.findByText('Starter')).toBeInDocument();
    expect(plansApi.list).toHaveBeenCalledTimes(2);
  });

  it('shows empty state when no plans', async () => {
    (plansApi.list as any).mockImplementation(() => Promise.resolve([]));

    renderPage();

    expect(await screen.findByText(/no plans/i)).toBeInDocument();
  });

  it('filters plans by search', async () => {
    (plansApi.list as any).mockImplementation(() => Promise.resolve(mockPlans));

    const user = userEvent.setup();
    renderPage();

    expect(await screen.findByText('Starter')).toBeInDocument();
    const search = screen.getByPlaceholderText(/search/i);
    await user.type(search, 'Pro');

    expect(screen.queryByText('Starter')).not.toBeInDocument();
    expect(screen.getByText('Pro')).toBeInDocument();
  });

  it('confirms before deleting a plan', async () => {
    (plansApi.list as any).mockImplementation(() => Promise.resolve(mockPlans));
    (plansApi.delete as any).mockImplementation(() => Promise.resolve(undefined));

    const user = userEvent.setup();
    renderPage();

    expect(await screen.findByText('Starter')).toBeInDocument();
    const row = screen.getByTestId('plan-row-plan_1');
    await user.click(within(row).getByRole('button', { name: /delete/i }));

    expect(await screen.findByRole('dialog')).toBeInDocument();
    expect(plansApi.delete).not.toHaveBeenCalled();

    await user.click(screen.getByRole('button', { name: /confirm/i }));

    await waitFor(() => expect(plansApi.delete).toHaveBeenCalledTimes(1));
    expect(plansApi.delete).toHaveBeenCalledWith('plan_1');
  });
});
