import { useState, useRef, useEffect } from 'react';
import { Plus, Search } from 'lucide-react';
import Tag from './Tag';
import './AddTagPopover.css';

export interface TagOption {
  id: string;
  label: string;
  color: 'blue' | 'green' | 'yellow' | 'red' | 'purple' | 'pink' | 'orange' | 'gray';
}

interface AddTagPopoverProps {
  availableTags: TagOption[];
  selectedTags: TagOption[];
  onAddTag: (tag: TagOption) => void;
  onCreateTag: (label: string, color: TagOption['color']) => void;
  maxTags?: number;
}

export default function AddTagPopover({
  availableTags,
  selectedTags,
  onAddTag,
  onCreateTag,
  maxTags = 10,
}: AddTagPopoverProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [newTagColor, setNewTagColor] = useState<TagOption['color']>('blue');
  const popoverRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const selectedIds = selectedTags.map((t) => t.id);
  const unselectedTags = availableTags.filter((t) => !selectedIds.includes(t.id));
  
  const filteredTags = unselectedTags.filter((t) =>
    t.label.toLowerCase().includes(search.toLowerCase())
  );

  const canAddMore = selectedTags.length < maxTags;
  const exactMatch = filteredTags.some((t) => t.label.toLowerCase() === search.toLowerCase());

  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setIsCreating(false);
        setSearch('');
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleCreate = () => {
    if (search.trim() && !exactMatch) {
      onCreateTag(search.trim(), newTagColor);
      setSearch('');
      setIsCreating(false);
      setNewTagColor('blue');
    }
  };

  return (
    <div className="add-tag-popover" ref={popoverRef}>
      <button
        className="add-tag-trigger"
        onClick={() => setIsOpen(!isOpen)}
        disabled={!canAddMore}
        aria-label={canAddMore ? 'Add tag' : `Maximum ${maxTags} tags reached`}
        aria-expanded={isOpen}
        aria-haspopup="dialog"
      >
        <Plus size={14} />
        Add tag
      </button>

      {isOpen && (
        <div
          className="add-tag-dropdown"
          role="dialog"
          aria-label="Add tags"
        >
          <div className="add-tag-search">
            <Search size={16} className="add-tag-search-icon" aria-hidden="true" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search or create tag..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="add-tag-search-input"
              aria-label="Search tags"
            />
          </div>

          <div className="add-tag-list">
            {filteredTags.length > 0 ? (
              filteredTags.map((tag) => (
                <button
                  key={tag.id}
                  className="add-tag-item"
                  onClick={() => {
                    onAddTag(tag);
                    setSearch('');
                  }}
                  aria-label={`Add ${tag.label} tag`}
                >
                  <Tag label={tag.label} color={tag.color} size="small" />
                </button>
              ))
            ) : search && !isCreating ? (
              <div className="add-tag-empty">
                <p>No tags found</p>
                {!exactMatch && (
                  <button
                    className="add-tag-create-btn"
                    onClick={() => setIsCreating(true)}
                  >
                    <Plus size={14} />
                    Create "{search}"
                  </button>
                )}
              </div>
            ) : null}

            {isCreating && (
              <div className="add-tag-create-form">
                <div className="add-tag-create-preview">
                  <Tag label={search} color={newTagColor} size="small" />
                </div>
                
                <div className="add-tag-color-picker">
                  <label className="add-tag-color-label">Color:</label>
                  <div className="add-tag-color-grid">
                    {(['blue', 'green', 'yellow', 'red', 'purple', 'pink', 'orange', 'gray'] as const).map((color) => (
                      <button
                        key={color}
                        type="button"
                        className={`add-tag-color-option add-tag-color-option--${color} ${newTagColor === color ? 'active' : ''}`}
                        onClick={() => setNewTagColor(color)}
                        aria-label={`Select ${color} color`}
                        aria-pressed={newTagColor === color}
                      />
                    ))}
                  </div>
                </div>

                <div className="add-tag-create-actions">
                  <button
                    type="button"
                    className="add-tag-create-cancel"
                    onClick={() => {
                      setIsCreating(false);
                      setNewTagColor('blue');
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="add-tag-create-confirm"
                    onClick={handleCreate}
                  >
                    Create tag
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
