import { useState } from 'react';
import { Trash2, Edit2, Check, X, Tags } from 'lucide-react';
import Tag, { TagProps } from '../Tag';
import ColorPicker from './ColorPicker';
import type { TagColor } from './ColorSwatch';
import './ManageTagsSettings.css';

export interface TagData {
  id: string;
  label: string;
  color: TagProps['color'];
  usageCount: number;
}

interface ManageTagsSettingsProps {
  tags: TagData[];
  onRenameTag: (id: string, newLabel: string) => void;
  onDeleteTag: (id: string) => void;
  onChangeColor: (id: string, newColor: TagProps['color']) => void;
}

export default function ManageTagsSettings({
  tags,
  onRenameTag,
  onDeleteTag,
  onChangeColor,
}: ManageTagsSettingsProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editLabel, setEditLabel] = useState('');
  const [editColor, setEditColor] = useState<TagColor>('blue');

  const handleStartEdit = (tag: TagData) => {
    setEditingId(tag.id);
    setEditLabel(tag.label);
    setEditColor(tag.color || 'blue');
  };

  const handleSaveEdit = () => {
    if (editingId && editLabel.trim()) {
      onRenameTag(editingId, editLabel.trim());
      if (editColor) {
        onChangeColor(editingId, editColor);
      }
      setEditingId(null);
      setEditLabel('');
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditLabel('');
  };

  return (
    <div className="manage-tags">
      <div className="manage-tags-header">
        <div className="manage-tags-title-row">
          <Tags size={20} className="manage-tags-icon" />
          <h2>Manage Tags</h2>
        </div>
        <p className="manage-tags-description">
          Create and organize tags to categorize your plans and subscriptions. Tag names must be unique.
        </p>
      </div>

      {tags.length === 0 ? (
        <div className="manage-tags-empty" role="status">
          <Tags size={36} className="manage-tags-empty-icon" aria-hidden="true" />
          <h3>No tags yet</h3>
          <p>Tags you create will appear here. Add tags to plans and subscriptions to organize them.</p>
        </div>
      ) : (
        <div className="manage-tags-table-wrapper">
          <table className="manage-tags-table" role="table" aria-label="Manage tags">
            <thead>
              <tr>
                <th scope="col">Tag</th>
                <th scope="col">Label</th>
                <th scope="col">Usage Count</th>
                <th scope="col">
                  <span className="visually-hidden">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {tags.map((tag) => (
                <tr key={tag.id}>
                  <td>
                    {editingId === tag.id ? (
                      <ColorPicker
                        value={editColor}
                        previewLabel={editLabel || tag.label}
                        onChange={(color) => setEditColor(color)}
                        labelId={`color-label-${tag.id}`}
                      />
                    ) : (
                      <Tag label={tag.label} color={tag.color} size="small" />
                    )}
                  </td>
                  <td>
                    {editingId === tag.id ? (
                      <input
                        type="text"
                        value={editLabel}
                        onChange={(e) => setEditLabel(e.target.value)}
                        className="manage-tags-edit-input"
                        aria-label="Edit tag label"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSaveEdit();
                          if (e.key === 'Escape') handleCancelEdit();
                        }}
                      />
                    ) : (
                      <span className="manage-tags-label">{tag.label}</span>
                    )}
                  </td>
                  <td>
                    <span className="manage-tags-usage">
                      {tag.usageCount} {tag.usageCount === 1 ? 'item' : 'items'}
                    </span>
                  </td>
                  <td>
                    <div className="manage-tags-actions">
                      {editingId === tag.id ? (
                        <>
                          <button
                            type="button"
                            className="manage-tags-action-btn manage-tags-action-btn--save"
                            onClick={handleSaveEdit}
                            aria-label="Save changes"
                            disabled={!editLabel.trim()}
                          >
                            <Check size={16} />
                          </button>
                          <button
                            type="button"
                            className="manage-tags-action-btn manage-tags-action-btn--cancel"
                            onClick={handleCancelEdit}
                            aria-label="Cancel editing"
                          >
                            <X size={16} />
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            type="button"
                            className="manage-tags-action-btn manage-tags-action-btn--edit"
                            onClick={() => handleStartEdit(tag)}
                            aria-label={`Edit ${tag.label} tag`}
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            type="button"
                            className="manage-tags-action-btn manage-tags-action-btn--delete"
                            onClick={() => {
                              if (tag.usageCount > 0) {
                                const confirmed = window.confirm(
                                  `This tag is used by ${tag.usageCount} item(s). Deleting it will remove it from all items. Continue?`
                                );
                                if (confirmed) onDeleteTag(tag.id);
                              } else {
                                onDeleteTag(tag.id);
                              }
                            }}
                            aria-label={`Delete ${tag.label} tag`}
                          >
                            <Trash2 size={16} />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
