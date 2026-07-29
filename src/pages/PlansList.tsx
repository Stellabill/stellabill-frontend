import { useState } from "react";
import Tag from "../components/Tag";
import type { TagOption } from "../components/AddTagPopover";
import AddTagPopover from "../components/AddTagPopover";
import "./PlansList.css";

interface Plan {
  id: string;
  name: string;
  type: "fixed" | "usage" | "tiered";
  price: number;
  currency: string;
  status: "active" | "draft" | "inactive";
  createdAt: Date;
  tags?: TagOption[];
}

interface Props {
  plans: Plan[];
  onSearch: (q: string) => void;
  onFilterStatus: (s: string) => void;
  onFilterType: (t: string) => void;
  onSort: (f: string) => void;
  onCreatePlan: () => void;
  onEditPlan: (id: string) => void;
  onDeletePlan: (id: string) => void;
  onDuplicatePlan: (id: string) => void;
  availableTags?: TagOption[];
  onAddTagToPlan?: (planId: string, tag: TagOption) => void;
  onRemoveTagFromPlan?: (planId: string, tagId: string) => void;
  onCreateTag?: (label: string, color: TagOption['color']) => void;
}

export default function PlansList({
  plans,
  onSearch,
  onFilterStatus,
  onFilterType,
  onSort,
  onCreatePlan,
  onEditPlan,
  onDeletePlan,
  onDuplicatePlan,
  availableTags = [],
  onAddTagToPlan,
  onRemoveTagFromPlan,
  onCreateTag,
}: Props) {
  const [search, setSearch] = useState("");

  const handleAddTag = (planId: string, tag: TagOption) => {
    onAddTagToPlan?.(planId, tag);
  };

  const handleRemoveTag = (planId: string, tagId: string) => {
    onRemoveTagFromPlan?.(planId, tagId);
  };

  const handleCreateTag = (label: string, color: TagOption['color']) => {
    onCreateTag?.(label, color);
  };

  return (
    <div className="plans-list">
      {/* ── Page header ─────────────────────────────────────────── */}
      <div className="plans-list__header">
        <div>
          <h1 className="plans-list__title">Plans</h1>
          <p className="plans-list__description">Manage your subscription plans and pricing</p>
        </div>
        <button
          className="plans-list__create-btn"
          onClick={onCreatePlan}
          aria-label="Create new plan">
          + Create Plan
        </button>
      </div>

      {/* ── Toolbar ─────────────────────────────────────────────── */}
      <div className="plans-list__toolbar">
        {/* Search */}
        <div className="plans-list__search-wrapper">
          <input
            className="plans-list__search"
            placeholder="Search by plan name..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              onSearch(e.target.value);
            }}
            aria-label="Search plans"
          />
          {search && (
            <button
              className="plans-list__search-clear"
              aria-label="Clear search"
              onClick={() => {
                setSearch("");
                onSearch("");
              }}
            >
              ✕
            </button>
          )}
        </div>

        {/* Status filters */}
        <div className="plans-list__filter-group" role="group" aria-label="Filter by status">
          {["All", "Active", "Draft", "Inactive"].map((s) => (
            <button
              key={s}
              className="plans-list__filter-btn"
              aria-pressed={s === "All"}
              onClick={() => onFilterStatus(s.toLowerCase())}
            >
              {s}
            </button>
          ))}
        </div>

        {/* Type filters */}
        <div className="plans-list__filter-group" role="group" aria-label="Filter by type">
          {["All", "Fixed", "Usage-based", "Tiered"].map((t) => (
            <button
              key={t}
              className="plans-list__filter-btn"
              aria-pressed={t === "All"}
              onClick={() => onFilterType(t.toLowerCase())}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Sort */}
        <select
          className="plans-list__sort"
          onChange={(e) => onSort(e.target.value)}
          aria-label="Sort plans">
          <option>Newest</option>
          <option>Name (A-Z)</option>
          <option>Price (Low-High)</option>
        </select>
      </div>

      {plans.length > 0 ? (
        <>
          {/* ── Desktop table ─────────────────────────────────────── */}
          <div
            className="plans-table-wrapper"
            role="region"
            aria-label="Plans list">
            <table
              className="plans-table"
              role="table"
              aria-label="Billing plans"
              data-testid="plans-table">
              <thead>
                <tr>
                  <th scope="col">
                    <span className="visually-hidden">Select</span>
                  </th>
                  <th scope="col">Name</th>
                  <th scope="col">Type</th>
                  <th scope="col" className="dt__col--numeric">Price</th>
                  <th scope="col">Status</th>
                  <th scope="col">Tags</th>
                  <th scope="col">
                    <span className="visually-hidden">Actions</span>
                  </th>
                </tr>
              </thead>

              <tbody>
                {plans.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <input
                        type="checkbox"
                        aria-label={`Select ${p.name}`}
                      />
                    </td>

                    <td>
                      <div className="plans-table__name-cell">
                        <span className="plans-table__name">{p.name}</span>
                        <span className="plans-table__id">#{p.id}</span>
                      </div>
                    </td>

                    <td>
                      <span className="plans-table__type-badge">{p.type}</span>
                    </td>

                    <td className="dt__col--numeric">
                      <span className="plans-table__price">
                        ${(p.price / 100).toFixed(2)}{" "}
                        <span style={{ color: "var(--color-text-subtle)", fontSize: "var(--text-xs)" }}>
                          {p.currency}
                        </span>
                      </span>
                    </td>

                    <td>
                      <span className={`dt-badge dt-badge--${p.status}`}>
                        <span className="dt-badge__dot" aria-hidden="true" />
                        {p.status}
                      </span>
                    </td>

                    <td>
                      <div style={{ display: "flex", gap: "var(--space-2)", flexWrap: "wrap", alignItems: "center" }}>
                        {p.tags?.map((tag) => (
                          <Tag
                            key={tag.id}
                            label={tag.label}
                            color={tag.color}
                            size="small"
                            removable
                            onRemove={() => handleRemoveTag(p.id, tag.id)}
                          />
                        ))}
                        {onAddTagToPlan && onCreateTag && (
                          <AddTagPopover
                            availableTags={availableTags}
                            selectedTags={p.tags || []}
                            onAddTag={(tag) => handleAddTag(p.id, tag)}
                            onCreateTag={handleCreateTag}
                          />
                        )}
                      </div>
                    </td>

                    <td>
                      <div className="plans-table__actions">
                        <button
                          className="dt-btn"
                          onClick={() => onEditPlan(p.id)}
                          aria-label={`Edit ${p.name}`}>
                          Edit
                        </button>
                        <button
                          className="dt-btn"
                          onClick={() => onDuplicatePlan(p.id)}
                          aria-label={`Duplicate ${p.name}`}>
                          Duplicate
                        </button>
                        <button
                          className="dt-btn dt-btn--danger"
                          onClick={() => onDeletePlan(p.id)}
                          aria-label={`Delete ${p.name}`}>
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* ── Mobile cards ──────────────────────────────────────── */}
          <div
            className="plans-cards"
            aria-label="Plans"
            data-testid="plans-cards">
            {plans.map((p) => (
              <article key={p.id} className="plans-card">
                <div className="plans-card__header">
                  <div className="plans-table__name-cell">
                    <span className="plans-table__name">{p.name}</span>
                    <span className="plans-table__id">#{p.id}</span>
                  </div>
                  <span className={`dt-badge dt-badge--${p.status}`}>
                    <span className="dt-badge__dot" aria-hidden="true" />
                    {p.status}
                  </span>
                </div>

                <div className="plans-card__body">
                  <div className="plans-card__field">
                    <span className="plans-card__label">Type</span>
                    <span className="plans-card__value">{p.type}</span>
                  </div>
                  <div className="plans-card__field">
                    <span className="plans-card__label">Price</span>
                    <span className="plans-card__value">
                      ${(p.price / 100).toFixed(2)} {p.currency}
                    </span>
                  </div>
                </div>

                <div className="plans-card__footer">
                  <button
                    className="dt-btn"
                    onClick={() => onEditPlan(p.id)}
                    aria-label={`Edit ${p.name}`}>
                    Edit
                  </button>
                  <button
                    className="dt-btn dt-btn--danger"
                    onClick={() => onDeletePlan(p.id)}
                    aria-label={`Delete ${p.name}`}>
                    Delete
                  </button>
                </div>
              </article>
            ))}
          </div>
        </>
      ) : (
        <div className="plans-empty" role="status" aria-live="polite">
          <p className="plans-empty__title">No plans found</p>
          <p className="plans-empty__body">
            Create your first billing plan to get started.
          </p>
          <button
            className="plans-list__create-btn"
            onClick={onCreatePlan}
            aria-label="Create new plan">
            + Create Plan
          </button>
        </div>
      )}
    </div>
  );
}