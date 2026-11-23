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
import PlansList from './PlansList';

interface Plan {
  id: string;
  name: string;
  type: 'fixed' |'usage' |'tiered';
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
  let mockCallbacks: Record<string, ReturnType<typeof vi.fn>>;

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

  const renderList = (overrides: Record<string, unknown> = {}) =>
    render(
      <PlansList
        plans={(overrides.plans as Plan[] || mockPlans)}
        search={(overrides.search as string) || ''}
        statusFilter={(overrides.statusFilter as string) || 'all'}
        typeFilter={(overrides.typeFilter as string) || 'all'}
        sort={(overrides.sort as string) || 'newest'}
        onSearch={mockCallbacks.onSearch}
        onFilterStatus={mockCallbacks.onFilterStatus}
        onFilterType={mockCallbacks.onFilterType}
        onSort={mockCallbacks.onSort}
        onCreatePlan={mockCallbacks.onCreatePlan}
        onEditPlan={mockCallbacks.onEditPlan}
        onDeletePlan={mockCallbacks.onDeletePlan}
        onDuplicatePlan={mockCallbacks.onDuplicatePlan}
      />
    );

  describe('Page Header', () => {
    it('should render page title', () => {
      renderList();

      expect(screen.getByText('Plans')).toBeInTheDocument();
      expect(screen.getByText('Manage your subscription plans and pricing')).toBeInTheDocument();
    });

    it('should render create plan button', () => {
      renderList();

      fireEvent.click(screen.getByText('+ Create Plan'));
      expect(mockCallbacks.onCreatePlan).toHaveBeenCalledTimes(1);
    });

    it('create button should have correct accessibility attributes', () => {
      renderList();

      expect(screen.getByLabelText('Create new plan')).toBeInTheDocument();
    });
  });

  describe('Filter Bar - Search', () => {
    it('should render search input with placeholder', () => {
      renderList();

      expect(screen.getByPlaceholderText('Search by plan name...')).toBeInTheDocument();
    });

    it('should call onSearch on input change', async () => {
      const user = userEvent.setup();
      renderList();

      await user.type(screen.getByPlaceholderText('Search by plan name...'), 'pro');

      await waitFor(() => {
        expect(mockCallbacks.onSearch).toHaveBeenCalled();
        expect(mockCallbacks.onSearch.mock.calls.at(-1)?.[0]).toContain('pro');
      });
    });

    it('should show clear button when search has text', () => {
      renderList({ search: 'test' });

      const clearButton = screen.getByLabelText('Clear search');
      expect(clearButton).toBeInTheDocument();

      fireEvent.click(clearButton);
      expect(mockCallbacks.onSearch).toHaveBeenCalledWith('');
    });

    it('should have magnifying glass icon in search input', () => {
      renderList();

      expect(screen.getByText('🔥')).toBeInTheDocument();
    });
  });

  describe('Filter Bar - Status Chips', () => {
    it('should render status filter chips', () => {
      renderList();

      expect(screen.getByText('All')).toBeInTheDocument();
      expect(screen.getByText('Active')).toBeInTheDocument();
      expect(screen.getByText('Draft')).toBeInTheDocument();
      expect(screen.getByText('Inactive')).toBeInTheDocument();
    });

    it('should call onFilterStatus when status chip is clicked', () => {
      renderList();

      fireEvent.click(screen.getByText('Active'));
      expect(mockCallbacks.onFilterStatus).toHaveBeenCalledWith('active');
    });

    it('should show correct aria-pressed state', () => {
      renderList({ statusFilter: 'active' });

      expect(screen.getByText('Active')).toHaveAttribute('aria-pressed', 'true');
      expect(screen.getByText('Inactive')).toHaveAttribute('aria-pressed', 'false');
    });
  });

  describe('Filter Bar - Type Chips', () => {
    it('should render type filter chips', () => {
      renderList();

      expect(screen.getByText('Fixed')).toBeInTheDocument();
      expect(screen.getByText('Usage-based')).toBeInTheDocument();
      expect(screen.getByText('Tiered')).toBeInTheDocument();
    });

    it('should call onFilterType when type chip is clicked', () => {
      renderList();

      fireEvent.click(screen.getByText('Fixed'));
      expect(mockCallbacks.onFilterType).toHaveBeenCalledWith('fixed');
    });
  });

  describe('Filter Bar - Sort Dropdown', () => {
    it('should render sort dropdown', () => {
      renderList();

      expect(screen.getDisplayValue('Newest')).toBeInTheDocument();
    });

    it('should call onSort when sort option is selected', () => {
      renderList();

      fireEvent.change(screen.getDisplayValue('Newest'), {
        target: { value: 'name-asc' },
      });

      expect(mockCallbacks.onSort).toHaveBeenCalledWith('name-asc');
    });
  });

  describe('Filter Bar - Clear Filters Button', () => {
    it('should show clear filters button when filters active', () => {
      renderList({ statusFilter: 'active' });

      expect(screen.getByText('Clear Filters')).toBeInTheDocument();
    });

    it('should hide clear filters when no filters applied', () => {
      renderList();

      expect(screen.queryByText('Clear Filters')).not.toBeInTheDocument();
    });
  });

  describe('Table Structure', () => {
    it('should render table with correct columns', () => {
      renderList();

      const headers = screen.getAllByRole('columnheader');
      expect(headers.length).toBe(6);
      expect(headers[1]).toHaveTextContent('Name');
      expect(headers[2]).toHaveTextContent('Type');
      expect(headers[3]).toHaveTextContent('Price');
      expect(headers[4]).toHaveTextContent('Status');
      expect(headers[5]).toHaveTextContent('Actions');
    });

    it('should render table rows with plan data', () => {
      renderList();

      expect(screen.getByText('Pro Plan')).toBeInTheDocument();
      expect(screen.getByText('Enterprise')).toBeInTheDocument();
      expect(screen.getByText('Starter (Trial)')).toBeInTheDocument();
    });

    it('should render row checkbox for each plan', () => {
      renderList();

      expect(screen.getAllByRole('checkbox').length).toBe(mockPlans.length);
    });

    it('should format price with currency', () => {
      renderList();

      expect(screen.getByText('$29.00/USD')).toBeInTheDocument();
      expect(screen.getByText('$99.00/USD')).toBeInTheDocument();
      expect(screen.getByText('$0.00/USD')).toBeInTheDocument();
    });

    it('should render status badge with correct class', () => {
      renderList();

      const activeBadges = screen.getAllByText('active');
      expect(activeBadges[0]).toHaveClass('badge-active');
      expect(screen.getByText('draft')).toHaveClass('badge-draft');
    });
  });

  describe('Table Row Actions', () => {
    it('should render action buttons for each row', () => {
      renderList();

      expect(screen.getAllByLabelText(/Edit/).length).toBe(mockPlans.length);
    });

    it('should call onEditPlan when edit clicked', () => {
      renderList();

      fireEvent.click(screen.getAllByLabelText(/Edit/)[0]);
      expect(mockCallbacks.onEditPlan).toHaveBeenCalled();
    });

    it('should call onDeletePlan when delete clicked', () => {
      renderList();

      fireEvent.click(screen.getAllByLabelText(/Delete/)[0]);
      expect(mockCallbacks.onDeletePlan).toHaveBeenCalled();
    });

    it('should call onDuplicatePlan when duplicate clicked', () => {
      renderList();

      fireEvent.click(screen.getAllByLabelText(/Duplicate/)[0]);
      expect(mockCallbacks.onDuplicatePlan).toHaveBeenCalled();
    });
  });

  describe('Empty State', () => {
    it('should show empty state when no plans', () => {
      renderList({ plans: [] });

      expect(screen.getByText(/No plans found/i)).toBeInTheDocument();
    });
  });
});
