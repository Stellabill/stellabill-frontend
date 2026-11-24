import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { beforeEach, describe, expect, it } from 'vitest';
import MerchantPlans from './MerchantPlans';

const mockDraft = {
  id: 'draft_1',
  savedAt: '2024-02-01T00:00:00Z',
  version: 1,
  data: {
    usageEnabled: false,
    trialDays: '',
    pricing: { price: '12', interval: 'Monthly', priceType: 'currency' },
  },
};

function CreatePlanRoute() {
  const location = useLocation();

  return (
    <>
      <p data-testid="create-plan-location">{location.pathname + location.search}</p>
      <div>Create Plan Builder</div>
    </>
  );
}

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/plans']}>
      <Routes>
        <Route path="/plans" element={<MerchantPlans />} />
        <Route path="/plans/create" element={<CreatePlanRoute />} />
      </Routes>
    </MemoryRouter>
  );
}

beforeEach(() => {
  localStorage.clear();
});

describe('MerchantPlans page', () => {
  it('navigates to the plan builder from the empty state', async () => {
    const user = userEvent.setup();
    renderPage();

    expect(screen.getByText(/no plans yet/i)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /create plan/i }));

    expect(screen.getByText('Create Plan Builder')).toBeInTheDocument();
    expect(screen.getByTestId('create-plan-location')).toHaveTextContent('/plans/create');
  });

  it('shows saved drafts and resumes the selected draft', async () => {
    localStorage.setItem('plan-drafts', JSON.stringify([mockDraft]));

    const user = userEvent.setup();
    renderPage();

    expect(screen.getByText(/flat-rate · \$12\/monthly/i)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Continue' }));

    expect(screen.getByTestId('create-plan-location')).toHaveTextContent(
      '/plans/create?draftId=draft_1',
    );
  });

  it('deletes a saved draft from the list', async () => {
    localStorage.setItem('plan-drafts', JSON.stringify([mockDraft]));

    const user = userEvent.setup();
    renderPage();

    expect(screen.getByText(/flat-rate · \$12\/monthly/i)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Delete Draft' }));

    expect(screen.queryByText(/flat-rate · \$12\/monthly/i)).not.toBeInTheDocument();
    expect(JSON.parse(localStorage.getItem('plan-drafts') ?? '[]')).toEqual([]);
  });
});
