import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AddTagPopover, { TagOption } from './AddTagPopover';

describe('AddTagPopover', () => {
  const mockTags: TagOption[] = [
    { id: '1', label: 'Priority', color: 'red' },
    { id: '2', label: 'Team', color: 'blue' },
    { id: '3', label: 'Trial', color: 'yellow' },
  ];

  const mockAddTag = jest.fn();
  const mockCreateTag = jest.fn();

  beforeEach(() => {
    mockAddTag.mockClear();
    mockCreateTag.mockClear();
  });

  describe('Duplicate Detection with Normalized Labels', () => {
    it('should prevent creating "priority" when "Priority" already exists', async () => {
      render(
        <AddTagPopover
          availableTags={mockTags}
          selectedTags={[]}
          onAddTag={mockAddTag}
          onCreateTag={mockCreateTag}
        />
      );

      const addTagBtn = screen.getByRole('button', { name: /add tag/i });
      fireEvent.click(addTagBtn);

      const input = screen.getByPlaceholderText('Search or create tag...');
      await userEvent.type(input, 'priority');

      // Create button should not appear because exact match exists
      expect(screen.queryByText(/Create "priority"/)).not.toBeInTheDocument();
    });

    it('should prevent creating " Priority " when "Priority" already exists', async () => {
      render(
        <AddTagPopover
          availableTags={mockTags}
          selectedTags={[]}
          onAddTag={mockAddTag}
          onCreateTag={mockCreateTag}
        />
      );

      const addTagBtn = screen.getByRole('button', { name: /add tag/i });
      fireEvent.click(addTagBtn);

      const input = screen.getByPlaceholderText('Search or create tag...');
      await userEvent.type(input, '  Priority  ');

      // Create button should not appear due to normalized matching
      expect(screen.queryByText(/Create "  Priority  "/)).not.toBeInTheDocument();
    });

    it('should prevent creating "priority" with different case', async () => {
      render(
        <AddTagPopover
          availableTags={mockTags}
          selectedTags={[]}
          onAddTag={mockAddTag}
          onCreateTag={mockCreateTag}
        />
      );

      const addTagBtn = screen.getByRole('button', { name: /add tag/i });
      fireEvent.click(addTagBtn);

      const input = screen.getByPlaceholderText('Search or create tag...');
      await userEvent.type(input, 'PRIORITY');

      // Create button should not appear
      expect(screen.queryByText(/Create "PRIORITY"/)).not.toBeInTheDocument();
    });

    it('should prevent creating "PRIORITY" with mixed whitespace and case', async () => {
      const tagsWithPriority: TagOption[] = [
        { id: '1', label: 'Priority', color: 'red' },
      ];

      render(
        <AddTagPopover
          availableTags={tagsWithPriority}
          selectedTags={[]}
          onAddTag={mockAddTag}
          onCreateTag={mockCreateTag}
        />
      );

      const addTagBtn = screen.getByRole('button', { name: /add tag/i });
      fireEvent.click(addTagBtn);

      const input = screen.getByPlaceholderText('Search or create tag...');
      await userEvent.type(input, '  PRIORITY   TAG  ');

      // Should not show create button since it matches "Priority"
      expect(screen.queryByText(/Create "  PRIORITY/)).not.toBeInTheDocument();
    });

    it('should allow creating "Urgent" when "Priority" exists', async () => {
      render(
        <AddTagPopover
          availableTags={mockTags}
          selectedTags={[]}
          onAddTag={mockAddTag}
          onCreateTag={mockCreateTag}
        />
      );

      const addTagBtn = screen.getByRole('button', { name: /add tag/i });
      fireEvent.click(addTagBtn);

      const input = screen.getByPlaceholderText('Search or create tag...');
      await userEvent.type(input, 'Urgent');

      // Create button should appear since it's different from all existing tags
      expect(screen.getByText(/Create "Urgent"/)).toBeInTheDocument();
    });

    it('should check against ALL available tags, not just unselected', async () => {
      const selectedPriorityTag: TagOption = mockTags[0];

      render(
        <AddTagPopover
          availableTags={mockTags}
          selectedTags={[selectedPriorityTag]}
          onAddTag={mockAddTag}
          onCreateTag={mockCreateTag}
        />
      );

      const addTagBtn = screen.getByRole('button', { name: /add tag/i });
      fireEvent.click(addTagBtn);

      const input = screen.getByPlaceholderText('Search or create tag...');
      await userEvent.type(input, 'priority');

      // Even though Priority is selected, it should still prevent creating it
      expect(screen.queryByText(/Create "priority"/)).not.toBeInTheDocument();
    });
  });

  describe('Create Tag Functionality', () => {
    it('should show create button for new unique tag', async () => {
      render(
        <AddTagPopover
          availableTags={mockTags}
          selectedTags={[]}
          onAddTag={mockAddTag}
          onCreateTag={mockCreateTag}
        />
      );

      const addTagBtn = screen.getByRole('button', { name: /add tag/i });
      fireEvent.click(addTagBtn);

      const input = screen.getByPlaceholderText('Search or create tag...');
      await userEvent.type(input, 'NewTag');

      expect(screen.getByText(/Create/)).toBeInTheDocument();
    });

    it('should call onCreateTag with trimmed label', async () => {
      render(
        <AddTagPopover
          availableTags={mockTags}
          selectedTags={[]}
          onAddTag={mockAddTag}
          onCreateTag={mockCreateTag}
        />
      );

      const addTagBtn = screen.getByRole('button', { name: /add tag/i });
      fireEvent.click(addTagBtn);

      const input = screen.getByPlaceholderText('Search or create tag...');
      await userEvent.type(input, '  NewTag  ');

      // Click on the "Create" button to open the form
      const createBtnLink = screen.getByText(/Create/);
      fireEvent.click(createBtnLink);

      // Wait for the form to appear and click the confirm button
      await waitFor(() => {
        expect(screen.getByText('Create tag')).toBeInTheDocument();
      });

      const confirmBtn = screen.getByText('Create tag');
      fireEvent.click(confirmBtn);

      // Should be called with trimmed label
      expect(mockCreateTag).toHaveBeenCalledWith('NewTag', 'blue');
    });

    it('should allow selecting color before creating tag', async () => {
      render(
        <AddTagPopover
          availableTags={mockTags}
          selectedTags={[]}
          onAddTag={mockAddTag}
          onCreateTag={mockCreateTag}
        />
      );

      const addTagBtn = screen.getByRole('button', { name: /add tag/i });
      fireEvent.click(addTagBtn);

      const input = screen.getByPlaceholderText('Search or create tag...');
      await userEvent.type(input, 'NewTag');

      const createBtnInitial = screen.getByText(/Create/);
      fireEvent.click(createBtnInitial);

      // Click on a color button (e.g., green)
      const greenColorBtn = screen.getByRole('button', { name: /select green color/i });
      fireEvent.click(greenColorBtn);

      // Click create
      const confirmBtn = screen.getByText('Create tag');
      fireEvent.click(confirmBtn);

      expect(mockCreateTag).toHaveBeenCalledWith('NewTag', 'green');
    });
  });

  describe('Add Existing Tag Functionality', () => {
    it('should show existing tags when searching', async () => {
      render(
        <AddTagPopover
          availableTags={mockTags}
          selectedTags={[]}
          onAddTag={mockAddTag}
          onCreateTag={mockCreateTag}
        />
      );

      const addTagBtn = screen.getByRole('button', { name: /add tag/i });
      fireEvent.click(addTagBtn);

      const input = screen.getByPlaceholderText('Search or create tag...');
      await userEvent.type(input, 'team');

      // Should show the Team tag without a create button
      const teamTag = screen.getByRole('button', { name: /add team tag/i });
      expect(teamTag).toBeInTheDocument();
      expect(screen.queryByText(/Create "team"/)).not.toBeInTheDocument();
    });

    it('should call onAddTag when selecting existing tag', async () => {
      render(
        <AddTagPopover
          availableTags={mockTags}
          selectedTags={[]}
          onAddTag={mockAddTag}
          onCreateTag={mockCreateTag}
        />
      );

      const addTagBtn = screen.getByRole('button', { name: /add tag/i });
      fireEvent.click(addTagBtn);

      const input = screen.getByPlaceholderText('Search or create tag...');
      await userEvent.type(input, 'team');

      const teamTag = screen.getByRole('button', { name: /add team tag/i });
      fireEvent.click(teamTag);

      expect(mockAddTag).toHaveBeenCalledWith(mockTags[1]);
    });
  });

  describe('Max Tags Limit', () => {
    it('should disable add button when max tags reached', () => {
      const selectedTags = [mockTags[0], mockTags[1]];

      render(
        <AddTagPopover
          availableTags={mockTags}
          selectedTags={selectedTags}
          onAddTag={mockAddTag}
          onCreateTag={mockCreateTag}
          maxTags={2}
        />
      );

      const addTagBtn = screen.getByRole('button', { name: /maximum 2 tags reached/i });
      expect(addTagBtn).toBeDisabled();
    });

    it('should enable add button when below max tags', () => {
      const selectedTags = [mockTags[0]];

      render(
        <AddTagPopover
          availableTags={mockTags}
          selectedTags={selectedTags}
          onAddTag={mockAddTag}
          onCreateTag={mockCreateTag}
          maxTags={3}
        />
      );

      const addTagBtn = screen.getByRole('button', { name: /add tag/i });
      expect(addTagBtn).not.toBeDisabled();
    });
  });

  describe('Regression Tests', () => {
    it('should not create duplicate when searching with variations', async () => {
      render(
        <AddTagPopover
          availableTags={mockTags}
          selectedTags={[]}
          onAddTag={mockAddTag}
          onCreateTag={mockCreateTag}
        />
      );

      const addTagBtn = screen.getByRole('button', { name: /add tag/i });
      fireEvent.click(addTagBtn);

      const input = screen.getByPlaceholderText('Search or create tag...');

      // Try various forms
      const variations = ['priority', ' priority', 'priority ', ' priority ', 'PRIORITY', 'Priority '];

      for (const variation of variations) {
        await userEvent.clear(input);
        await userEvent.type(input, variation);

        expect(screen.queryByText(new RegExp(`Create.*${variation}`))).not.toBeInTheDocument();
      }
    });
  });
});
