import { RotateCcw, Save, X } from 'lucide-react';
import type { DashboardFilters } from '../../hooks/useDashboardWidgets';
import type { ActiveFilter } from './dashboardFilters';

interface DashboardFiltersBarProps {
  activeFilters: ActiveFilter[];
  onRemove: (id: keyof DashboardFilters) => void;
  onReset: () => void;
  onSave: () => void;
}

/** Active filter chips with reset and save-view actions. */
export default function DashboardFiltersBar({
  activeFilters,
  onRemove,
  onReset,
  onSave,
}: DashboardFiltersBarProps) {
  if (activeFilters.length === 0) return null;

  return (
    <div className="dashboard-filter-bar" aria-label="Active filters">
      <div className="dashboard-filter-chips">
        <span className="dashboard-filter-label" id="active-filters-label">
          Active Filters:
        </span>
        <ul
          className="dashboard-filter-list"
          aria-labelledby="active-filters-label"
        >
          {activeFilters.map((filter) => (
            <li key={filter.id} className="dashboard-filter-chip">
              <span>{filter.label}</span>
              <button
                type="button"
                onClick={() => onRemove(filter.id)}
                aria-label={`Remove filter ${filter.label}`}
              >
                <X size={14} aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      </div>
      <div className="dashboard-filter-actions">
        <button
          type="button"
          className="dashboard-filter-action dashboard-filter-action--reset"
          onClick={onReset}
        >
          <RotateCcw size={14} aria-hidden="true" />
          Reset
        </button>
        <button
          type="button"
          className="dashboard-filter-action dashboard-filter-action--save"
          onClick={onSave}
        >
          <Save size={14} aria-hidden="true" />
          Save View
        </button>
      </div>
    </div>
  );
}
