import React, { useState } from "react";
import Tag from "../components/Tag";
import AddTagPopover, { TagOption } from "../components/AddTagPopover";

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
    <div>
      <h1>Plans</h1>
      <p>Manage your subscription plans and pricing</p>

      <button onClick={onCreatePlan} aria-label="Create new plan">
        + Create Plan
      </button>

      {/* SEARCH */}
      <div>
        <input
          placeholder="Search by plan name..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            onSearch(e.target.value);
          }}
        />
        {search && (
          <button
            aria-label="Clear search"
            onClick={() => {
              setSearch("");
              onSearch(""); // 🔥 required
            }}
          >
            ✕
          </button>
        )}
      </div>

      {/* STATUS FILTER */}
      {["All", "Active", "Draft", "Inactive"].map((s) => (
        <button
          key={s}
          aria-pressed={s === "All"}
          onClick={() => onFilterStatus(s.toLowerCase())}
        >
          {s}
        </button>
      ))}

      {/* TYPE FILTER */}
      {["All", "Fixed", "Usage-based", "Tiered"].map((t) => (
        <button
          key={t}
          aria-pressed={t === "All"}
          onClick={() => onFilterType(t.toLowerCase())}
        >
          {t}
        </button>
      ))}

      {/* SORT */}
      <select onChange={(e) => onSort(e.target.value)}>
        <option>Newest</option>
        <option>Name (A-Z)</option>
        <option>Price (Low-High)</option>
      </select>

      {/* TABLE */}
      {plans.length > 0 ? (
        <table role="table">
          <thead>
            <tr>
              <th scope="col">Checkbox</th>
              <th scope="col">Name</th>
              <th scope="col">Type</th>
              <th scope="col">Price</th>
              <th scope="col">Status</th>
              <th scope="col">Tags</th>
              <th scope="col">Actions</th>
            </tr>
          </thead>

          <tbody>
            {plans.map((p, i) => (
              <tr key={p.id}>
                <td>
                  <input
                    type="checkbox"
                    aria-label={`Select ${p.name}`}
                  />
                </td>

                <td>{p.name}</td>
                <td>{p.type}</td>

                <td>
                  ${(p.price / 100).toFixed(2)}/{p.currency}
                </td>

                {/* 🔥 FIX duplicate "active" */}
                <td className={`badge-${p.status}`}>
                  <span>{p.status}</span>
                </td>

                <td>
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
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
                  <button onClick={() => onEditPlan(p.id)}>Edit</button>
                  <button onClick={() => onDuplicatePlan(p.id)}>
                    Duplicate
                  </button>
                  <button onClick={() => onDeletePlan(p.id)}>
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        // 🔥 FIX ARIA
        <div role="status" aria-live="polite">
          No plans found
        </div>
      )}
    </div>
  );
}