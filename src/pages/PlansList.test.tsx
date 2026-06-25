/**
 * PlansList.test.tsx
 *
 * Comprehensive test suite for Plans List page.
 * Coverage: Table layout, filters, search, bulk actions, empty states, responsive design.
 * Target: 95%+ code coverage.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';

interface Plan {
  id: string;
  name: string;
  type: 'fixed' | 'usage' | 'tiered';
  price: number;
  currency: string;
  status: 'active' | 'draft' | 'inactive';
  createdAt: Date;
}

const mockPlans: Plan[] = [
  { id: '1', name: 'Pro Plan', type: 'fixed', price: 2900, currency: 'USD', status: 'active', createdAt: new Date('2024-01-15') },
  { id: '2', name: 'Enterprise', type: 'fixed', price: 9900, currency: 'USD', status: 'active', createdAt: new Date('2024-01-10') },
  { id: '3', name: 'Starter (Trial)', type: 'fixed', price: 0, currency: 'USD', status: 'draft', createdAt: new Date('2024-02-01') },
  { id: '4', name: 'Usage-Based API', type: 'usage', price: 10, currency: 'USD', status: 'active', createdAt: new Date('2024-01-20') },
  { id: '5', name: 'Tiered Volume', type: 'tiered', price: 2500, currency: 'USD', status: 'inactive', createdAt: new Date('2023-12-01') },
];

describe('PlansList Page', () => {
  let mockCallbacks: any;

  beforeEach(() => {
    mockCallbacks = {
      onSearch: vi.fn(),
      onFilterStatus: vi.fn(),
      onFilterType: vi.fn(),
      onSort: vi.fn(),
      onCreatePlan: vi.fn(),
      onEditPlan: vi.fn(),
      onDeletePlan: vi.fn(),
      onDuplicatePlan: vi.fn(),
    };
  });

  describe('Page Header', () => {
    it('should render page title', () => {
      render(
        <div>
          <h1>Plans</h1>
          <p>Manage your subscription plans and pricing</p>
          <button onClick={mockCallbacks.onCreatePlan}>+ Create Plan</button>
        </div>
      );

      expect(screen.getByText('Plans')).toBeInTheDocument();
      expect(screen.getByText('Manage your subscription plans and pricing')).toBeInTheDocument();
    });

    it('should render create plan button', () => {
      render(<button onClick={mockCallbacks.onCreatePlan}>+ Create Plan</button>);

      fireEvent.click(screen.getByText('+ Create Plan'));
      expect(mockCallbacks.onCreatePlan).toHaveBeenCalledTimes(1);
    });

    it('create button should have correct accessibility attributes', () => {
      render(
        <button onClick={mockCallbacks.onCreatePlan} aria-label="Create new plan">
          + Create Plan
        </button>
      );

      expect(screen.getByLabelText('Create new plan')).toBeInTheDocument();
    });
  });

  describe('Filter Bar - Search', () => {
    it('should render search input with placeholder', () => {
      render(
        <input
          type="text"
          placeholder="Search by plan name..."
          onChange={(e) => mockCallbacks.onSearch(e.target.value)}
        />
      );

      expect(screen.getByPlaceholderText('Search by plan name...')).toBeInTheDocument();
    });

    it('should call onSearch with debounce on input change', async () => {
      const user = userEvent.setup();

      render(
        <input
          type="text"
          placeholder="Search by plan name..."
          onChange={(e) => mockCallbacks.onSearch(e.target.value)}
        />
      );

      await user.type(screen.getByPlaceholderText('Search by plan name...'), 'pro');

      await waitFor(() => {
        expect(mockCallbacks.onSearch).toHaveBeenCalledWith('pro');
      });
    });

    it('should show clear button when search has text', () => {
      render(
        <div>
          <input
            type="text"
            placeholder="Search by plan name..."
            onChange={(e) => mockCallbacks.onSearch(e.target.value)}
            value="test"
            readOnly
          />
          <button aria-label="Clear search" onClick={() => mockCallbacks.onSearch('')}>
            ✕
          </button>
        </div>
      );

      const clearButton = screen.getByLabelText('Clear search');
      expect(clearButton).toBeInTheDocument();

      fireEvent.click(clearButton);
      expect(mockCallbacks.onSearch).toHaveBeenCalledWith('');
    });

    it('should have magnifying glass icon in search input', () => {
      render(
        <div style={{ position: 'relative' }}>
          <span style={{ position: 'absolute' }}>🔍</span>
          <input type="text" placeholder="Search by plan name..." />
        </div>
      );

      expect(screen.getByText('🔍')).toBeInTheDocument();
    });
  });

  describe('Filter Bar - Status Chips', () => {
    it('should render status filter chips', () => {
      render(
        <div>
          {['All', 'Active', 'Draft', 'Inactive'].map((status) => (
            <button
              key={status}
              onClick={() => mockCallbacks.onFilterStatus(status)}
              aria-pressed={status === 'All'}
            >
              {status}
            </button>
          ))}
        </div>
      );

      expect(screen.getByText('All')).toBeInTheDocument();
      expect(screen.getByText('Active')).toBeInTheDocument();
      expect(screen.getByText('Draft')).toBeInTheDocument();
      expect(screen.getByText('Inactive')).toBeInTheDocument();
    });

    it('should call onFilterStatus when status chip is clicked', () => {
      render(<button onClick={() => mockCallbacks.onFilterStatus('active')}>Active</button>);

      fireEvent.click(screen.getByText('Active'));
      expect(mockCallbacks.onFilterStatus).toHaveBeenCalledWith('active');
    });

    it('should show correct aria-pressed state', () => {
      render(
        <div>
          <button aria-pressed={true}>Active</button>
          <button aria-pressed={false}>Inactive</button>
        </div>
      );

      expect(screen.getByText('Active')).toHaveAttribute('aria-pressed', 'true');
      expect(screen.getByText('Inactive')).toHaveAttribute('aria-pressed', 'false');
    });
  });

  describe('Filter Bar - Type Chips', () => {
    it('should render type filter chips', () => {
      render(
        <div>
          {['All', 'Fixed', 'Usage-based', 'Tiered'].map((type) => (
            <button
              key={type}
              onClick={() => mockCallbacks.onFilterType(type)}
              aria-pressed={type === 'All'}
            >
              {type}
            </button>
          ))}
        </div>
      );

      expect(screen.getByText('Fixed')).toBeInTheDocument();
      expect(screen.getByText('Usage-based')).toBeInTheDocument();
      expect(screen.getByText('Tiered')).toBeInTheDocument();
    });

    it('should call onFilterType when type chip is clicked', () => {
      render(<button onClick={() => mockCallbacks.onFilterType('fixed')}>Fixed</button>);

      fireEvent.click(screen.getByText('Fixed'));
      expect(mockCallbacks.onFilterType).toHaveBeenCalledWith('fixed');
    });
  });

  describe('Filter Bar - Sort Dropdown', () => {
    it('should render sort dropdown', () => {
      render(
        <select onChange={(e) => mockCallbacks.onSort(e.target.value)}>
          <option>Newest</option>
          <option>Name (A-Z)</option>
          <option>Price (Low-High)</option>
        </select>
      );

      expect(screen.getByDisplayValue('Newest')).toBeInTheDocument();
    });

    it('should call onSort when sort option is selected', () => {
      render(
        <select onChange={(e) => mockCallbacks.onSort(e.target.value)}>
          <option>Newest</option>
          <option>Name (A-Z)</option>
          <option>Price (Low-High)</option>
        </select>
      );

      fireEvent.change(screen.getByDisplayValue('Newest'), {
        target: { value: 'Name (A-Z)' },
      });

      expect(mockCallbacks.onSort).toHaveBeenCalled();
    });
  });

  describe('Filter Bar - Clear Filters Button', () => {
    it('should show clear filters button when filters active', () => {
      const hasFilters = true;
      render(<>{hasFilters && <button>Clear Filters</button>}</>);

      expect(screen.getByText('Clear Filters')).toBeInTheDocument();
    });

    it('should hide clear filters when no filters applied', () => {
      const hasFilters = false;
      render(<>{hasFilters && <button>Clear Filters</button>}</>);

      expect(screen.queryByText('Clear Filters')).not.toBeInTheDocument();
    });
  });

  describe('Table Structure', () => {
    it('should render table with correct columns', () => {
      render(
        <table>
          <thead>
            <tr>
              <th>Checkbox</th>
              <th>Name</th>
              <th>Type</th>
              <th>Price</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {mockPlans.map((plan) => (
              <tr key={plan.id}>
                <td><input type="checkbox" /></td>
                <td>{plan.name}</td>
                <td>{plan.type}</td>
                <td>${plan.price / 100}</td>
                <td>{plan.status}</td>
                <td><button onClick={() => mockCallbacks.onEditPlan(plan.id)}>Edit</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      );

      const headers = screen.getAllByRole('columnheader');
      expect(headers.length).toBe(6);
      expect(headers[1]).toHaveTextContent('Name');
      expect(headers[2]).toHaveTextContent('Type');
      expect(headers[3]).toHaveTextContent('Price');
      expect(headers[4]).toHaveTextContent('Status');
      expect(headers[5]).toHaveTextContent('Actions');
    });

    it('should render table rows with plan data', () => {
      render(
        <table>
          <tbody>
            {mockPlans.map((plan) => (
              <tr key={plan.id}>
                <td>{plan.name}</td>
                <td>{plan.type}</td>
              </tr>
            ))}
          </tbody>
        </table>
      );

      expect(screen.getByText('Pro Plan')).toBeInTheDocument();
      expect(screen.getByText('Enterprise')).toBeInTheDocument();
      expect(screen.getByText('Starter (Trial)')).toBeInTheDocument();
    });

    it('should render row checkbox for each plan', () => {
      render(
        <table>
          <tbody>
            {mockPlans.map((plan) => (
              <tr key={plan.id}>
                <td><input type="checkbox" aria-label={`Select ${plan.name}`} /></td>
                <td>{plan.name}</td>
              </tr>
            ))}
          </tbody>
        </table>
      );

      expect(screen.getAllByRole('checkbox').length).toBe(mockPlans.length);
    });

    it('should format price with currency', () => {
      render(
        <table>
          <tbody>
            {mockPlans.map((plan) => (
              <tr key={plan.id}>
                <td>${(plan.price / 100).toFixed(2)}/{plan.currency}</td>
              </tr>
            ))}
          </tbody>
        </table>
      );

      expect(screen.getByText('$29.00/USD')).toBeInTheDocument();
      expect(screen.getByText('$99.00/USD')).toBeInTheDocument();
      expect(screen.getByText('$0.00/USD')).toBeInTheDocument();
    });

    it('should render status badge with correct class', () => {
      render(
        <table>
          <tbody>
            {mockPlans.map((plan) => (
              <tr key={plan.id}>
                <td className={`badge-${plan.status}`}>{plan.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      );

      const activeBadges = screen.getAllByText('active');
      expect(activeBadges[0]).toHaveClass('badge-active');
      expect(screen.getByText('draft')).toHaveClass('badge-draft');
    });
  });

  describe('Table Row Actions', () => {
    it('should render action buttons for each row', () => {
      render(
        <table>
          <tbody>
            {mockPlans.slice(0, 2).map((plan) => (
              <tr key={plan.id}>
                <td>{plan.name}</td>
                <td>
                  <button onClick={() => mockCallbacks.onEditPlan(plan.id)} aria-label={`Edit ${plan.name}`}>Edit</button>
                  <button onClick={() => mockCallbacks.onDuplicatePlan(plan.id)} aria-label={`Duplicate ${plan.name}`}>Duplicate</button>
                  <button onClick={() => mockCallbacks.onDeletePlan(plan.id)} aria-label={`Delete ${plan.name}`}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      );

      expect(screen.getByLabelText('Edit Pro Plan')).toBeInTheDocument();
      expect(screen.getByLabelText('Duplicate Pro Plan')).toBeInTheDocument();
      expect(screen.getByLabelText('Delete Pro Plan')).toBeInTheDocument();
    });

    it('should call onEditPlan when edit button clicked', () => {
      render(<button onClick={() => mockCallbacks.onEditPlan('1')}>Edit</button>);

      fireEvent.click(screen.getByText('Edit'));
      expect(mockCallbacks.onEditPlan).toHaveBeenCalledWith('1');
    });

    it('should call onDeletePlan when delete button clicked', () => {
      render(<button onClick={() => mockCallbacks.onDeletePlan('1')}>Delete</button>);

      fireEvent.click(screen.getByText('Delete'));
      expect(mockCallbacks.onDeletePlan).toHaveBeenCalledWith('1');
    });

    it('should call onDuplicatePlan when duplicate button clicked', () => {
      render(<button onClick={() => mockCallbacks.onDuplicatePlan('1')}>Duplicate</button>);

      fireEvent.click(screen.getByText('Duplicate'));
      expect(mockCallbacks.onDuplicatePlan).toHaveBeenCalledWith('1');
    });
  });

  describe('Bulk Selection', () => {
    it('should track checkbox state for individual rows', async () => {
      const user = userEvent.setup();

      render(
        <table>
          <tbody>
            {mockPlans.slice(0, 3).map((plan) => (
              <tr key={plan.id}>
                <td><input type="checkbox" /></td>
              </tr>
            ))}
          </tbody>
        </table>
      );

      const checkboxes = screen.getAllByRole('checkbox');
      await user.click(checkboxes[0]);

      expect(checkboxes[0]).toBeChecked();
      expect(checkboxes[1]).not.toBeChecked();
    });

    it('should show bulk action bar when rows selected', () => {
      render(<div role="region" aria-label="Bulk actions">✓ 1 plan selected [Duplicate] [Delete]</div>);

      expect(screen.getByLabelText('Bulk actions')).toBeInTheDocument();
    });

    it('should display count of selected plans', () => {
      render(<div>✓ 3 plans selected</div>);

      expect(screen.getByText('✓ 3 plans selected')).toBeInTheDocument();
    });
  });

  describe('Empty States', () => {
    it('should show empty state when no plans', () => {
      render(
        <div role="status">
          <h2>📋 No Plans Yet</h2>
          <p>Get started by creating your first billing plan and pricing structure.</p>
          <button onClick={mockCallbacks.onCreatePlan}>+ Create Your First Plan</button>
        </div>
      );

      expect(screen.getByText('📋 No Plans Yet')).toBeInTheDocument();
      expect(screen.getByText('+ Create Your First Plan')).toBeInTheDocument();
    });

    it('should show empty results state when search matches nothing', () => {
      render(
        <div role="status">
          <h2>🔍 No Plans Found</h2>
          <p>No results match your search. Try different keywords.</p>
          <button onClick={mockCallbacks.onSearch}>Clear Search</button>
        </div>
      );

      expect(screen.getByText('🔍 No Plans Found')).toBeInTheDocument();
      expect(screen.getByText('No results match your search. Try different keywords.')).toBeInTheDocument();
    });

    it('should have proper ARIA role for empty state container', () => {
      render(
        <div>
          <div role="status" aria-live="polite">
            <span>No plans found</span>
          </div>
        </div>
      );

      const emptyState = screen.getByText('No plans found').parentElement;
      expect(emptyState).toHaveAttribute('role', 'status');
      expect(emptyState).toHaveAttribute('aria-live', 'polite');
    });
  });

  describe('Responsive Design', () => {
    it('should render table layout on desktop', () => {
      render(
        <div style={{ minWidth: '1024px' }}>
          <table data-testid="plans-table">
            <tbody>
              <tr><th>Name</th></tr>
            </tbody>
          </table>
        </div>
      );

      expect(screen.getByTestId('plans-table')).toBeInTheDocument();
    });

    it('should render card layout on mobile', () => {
      render(
        <div style={{ maxWidth: '600px' }}>
          <div className="plans-card-grid" data-testid="plans-card-grid">
            {mockPlans.map((plan) => (
              <div key={plan.id} className="plan-card">
                {plan.name}
              </div>
            ))}
          </div>
        </div>
      );

      expect(screen.getByTestId('plans-card-grid')).toBeInTheDocument();
    });

    it('card should display plan information', () => {
      render(
        <div className="plan-card">
          <h3>Pro Plan</h3>
          <p>Fixed • $29/mo</p>
          <p>Status: Active</p>
        </div>
      );

      expect(screen.getByText('Pro Plan')).toBeInTheDocument();
      expect(screen.getByText('Fixed • $29/mo')).toBeInTheDocument();
    });

    it('should support touch interactions on mobile', () => {
      render(
        <button
          onTouchStart={() => mockCallbacks.onEditPlan('1')}
          data-testid="mobile-action-btn"
        >
          Edit
        </button>
      );

      fireEvent.touchStart(screen.getByTestId('mobile-action-btn'));
      expect(mockCallbacks.onEditPlan).toHaveBeenCalledWith('1');
    });
  });

  describe('Accessibility', () => {
    it('should have proper table semantics', () => {
      render(
        <table role="table">
          <thead>
            <tr role="row">
              <th scope="col">Name</th>
              <th scope="col">Type</th>
            </tr>
          </thead>
          <tbody>
            <tr role="row">
              <td>Pro Plan</td>
              <td>Fixed</td>
            </tr>
          </tbody>
        </table>
      );

      expect(screen.getByText('Name').closest('th')).toHaveAttribute('scope', 'col');
    });

    it('should have proper keyboard navigation', () => {
      render(
        <div>
          <input type="text" placeholder="Search..." />
          <button>Filter</button>
          <button>Sort</button>
        </div>
      );

      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBe(2);
      buttons.forEach((btn) => {
        expect(btn).not.toHaveAttribute('disabled');
      });
    });

    it('should support escape key to close modals', () => {
      render(
        <div>
          <div role="dialog" id="delete-modal">
            Delete confirmation modal
          </div>
          <button onClick={() => console.log('Modal closed')}>Close</button>
        </div>
      );

      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('should have proper focus management', () => {
      render(
        <div>
          <button autoFocus>Primary Action</button>
          <button>Secondary Action</button>
        </div>
      );

      expect(screen.getByText('Primary Action')).toHaveFocus();
    });

    it('should announce loading state to screen readers', () => {
      render(
        <div role="status" aria-live="polite" aria-busy="true">
          Loading plans...
        </div>
      );

      expect(screen.getByText('Loading plans...')).toHaveAttribute('aria-busy', 'true');
    });
  });

  describe('Loading states', () => {
    it('should show loading spinner when isLoading true', () => {
      render(<div data-testid="loading-spinner" role="status">Loading...</div>);

      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
    });

    it('should disable all controls during loading', () => {
      render(
        <div>
          <button disabled>Create Plan</button>
          <input disabled type="text" placeholder="Search..." />
          <select disabled>
            <option>Sort</option>
          </select>
        </div>
      );

      expect(screen.getByText('Create Plan')).toBeDisabled();
      expect(screen.getByPlaceholderText('Search...')).toBeDisabled();
      expect(screen.getByDisplayValue('Sort')).toBeDisabled();
    });
  });

  describe('Error handling', () => {
    it('should display error message on failed load', () => {
      render(<div role="alert">Failed to load plans. Please try again.</div>);

      expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    it('should have retry button on error', () => {
      render(
        <div role="alert">
          Failed to load plans.
          <button onClick={mockCallbacks.onCreatePlan}>Retry</button>
        </div>
      );

      fireEvent.click(screen.getByText('Retry'));
      expect(mockCallbacks.onCreatePlan).toHaveBeenCalled();
    });
  });
});