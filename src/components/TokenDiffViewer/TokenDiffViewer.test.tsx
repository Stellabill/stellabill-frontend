import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import TokenDiffViewer from './TokenDiffViewer';
import { TOKEN_VERSIONS } from './tokenVersions';

/* ────────────────────────────────────────────
   Helpers
   ──────────────────────────────────────────── */

/** Minimal wrapper — component uses no router or context. */
function renderViewer() {
  return render(<TokenDiffViewer />);
}

const firstVersion = TOKEN_VERSIONS[0];
const lastVersion = TOKEN_VERSIONS[TOKEN_VERSIONS.length - 1];

/* ────────────────────────────────────────────
   1. Rendering
   ──────────────────────────────────────────── */

describe('TokenDiffViewer — rendering', () => {
  it('renders the title "Token Diff Viewer"', () => {
    renderViewer();
    expect(
      screen.getByRole('heading', { name: /token diff viewer/i }),
    ).toBeInTheDocument();
  });

  it('renders the subtitle text', () => {
    renderViewer();
    expect(
      screen.getByText(
        /compare design tokens across releases/i,
      ),
    ).toBeInTheDocument();
  });

  it('renders two version select dropdowns with labels "From" and "To"', () => {
    renderViewer();
    expect(screen.getByLabelText(/from/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/to/i)).toBeInTheDocument();

    // Both should be <select> elements
    const fromSelect = screen.getByLabelText('Baseline version') as HTMLSelectElement;
    const toSelect = screen.getByLabelText('Target version') as HTMLSelectElement;
    expect(fromSelect.tagName).toBe('SELECT');
    expect(toSelect.tagName).toBe('SELECT');
  });

  it('renders swap button with aria-label "Swap versions"', () => {
    renderViewer();
    expect(
      screen.getByRole('button', { name: /swap versions/i }),
    ).toBeInTheDocument();
  });
});

/* ────────────────────────────────────────────
   2. Version selection
   ──────────────────────────────────────────── */

describe('TokenDiffViewer — version selection', () => {
  it('default selections show first and last versions', () => {
    renderViewer();
    const fromSelect = screen.getByLabelText('Baseline version') as HTMLSelectElement;
    const toSelect = screen.getByLabelText('Target version') as HTMLSelectElement;
    expect(fromSelect.value).toBe(firstVersion.id);
    expect(toSelect.value).toBe(lastVersion.id);
  });

  it('changing "From" dropdown updates the diff', async () => {
    const user = userEvent.setup();
    renderViewer();
    const fromSelect = screen.getByLabelText('Baseline version');

    // Switch From to v0.0.2
    await user.selectOptions(fromSelect, 'v0.0.2');
    expect((fromSelect as HTMLSelectElement).value).toBe('v0.0.2');

    // Summary stats should be present (diff between v0.0.2 and v0.0.3)
    const statsGroup = screen.getByRole('group', { name: /change summary/i });
    expect(statsGroup).toBeInTheDocument();
  });

  it('changing "To" dropdown updates the diff', async () => {
    const user = userEvent.setup();
    renderViewer();
    const toSelect = screen.getByLabelText('Target version');

    // Switch To to v0.0.2
    await user.selectOptions(toSelect, 'v0.0.2');
    expect((toSelect as HTMLSelectElement).value).toBe('v0.0.2');

    // Summary stats should still be present (diff between v0.0.1 and v0.0.2)
    const statsGroup = screen.getByRole('group', { name: /change summary/i });
    expect(statsGroup).toBeInTheDocument();
  });

  it('selecting same version shows "Same Version Selected" message', async () => {
    const user = userEvent.setup();
    renderViewer();
    const toSelect = screen.getByLabelText('Target version');

    // Set To = same as From (first version)
    await user.selectOptions(toSelect, firstVersion.id);

    expect(
      screen.getByText(/same version selected/i),
    ).toBeInTheDocument();
  });

  it('clearing a version shows "Select Two Versions" message', async () => {
    const user = userEvent.setup();
    renderViewer();
    const fromSelect = screen.getByLabelText('Baseline version');

    // Clear From by selecting the empty option
    await user.selectOptions(fromSelect, '');

    expect(
      screen.getByText(/select two versions/i),
    ).toBeInTheDocument();
  });
});

/* ────────────────────────────────────────────
   3. Swap button
   ──────────────────────────────────────────── */

describe('TokenDiffViewer — swap button', () => {
  it('clicking swap reverses from and to values', async () => {
    const user = userEvent.setup();
    renderViewer();
    const fromSelect = screen.getByLabelText('Baseline version') as HTMLSelectElement;
    const toSelect = screen.getByLabelText('Target version') as HTMLSelectElement;

    const originalFrom = fromSelect.value;
    const originalTo = toSelect.value;

    await user.click(screen.getByRole('button', { name: /swap versions/i }));

    expect(fromSelect.value).toBe(originalTo);
    expect(toSelect.value).toBe(originalFrom);
  });
});

/* ────────────────────────────────────────────
   4. Summary stats
   ──────────────────────────────────────────── */

describe('TokenDiffViewer — summary stats', () => {
  it('shows count pills for added, removed, changed, unchanged', () => {
    renderViewer();
    const statsGroup = screen.getByRole('group', { name: /change summary/i });

    expect(within(statsGroup).getByText(/added/i)).toBeInTheDocument();
    expect(within(statsGroup).getByText(/removed/i)).toBeInTheDocument();
    expect(within(statsGroup).getByText(/changed/i)).toBeInTheDocument();
    expect(within(statsGroup).getByText(/unchanged/i)).toBeInTheDocument();
  });

  it('counts update when version selection changes', async () => {
    const user = userEvent.setup();
    renderViewer();

    // Capture initial "added" pill text
    const statsGroup = () => screen.getByRole('group', { name: /change summary/i });
    const getAddedPill = () => within(statsGroup()).getByText(/added/i);
    const initialText = getAddedPill().textContent;

    // Change From to v0.0.2 (fewer diffs compared to v0.0.3)
    await user.selectOptions(
      screen.getByLabelText('Baseline version'),
      'v0.0.2',
    );

    // The added count should change (v0.0.1→v0.0.3 has different adds than v0.0.2→v0.0.3)
    const updatedText = getAddedPill().textContent;
    expect(updatedText).not.toBe(initialText);
  });
});

/* ────────────────────────────────────────────
   5. Filter tabs
   ──────────────────────────────────────────── */

describe('TokenDiffViewer — filter tabs', () => {
  it('shows All, Added, Removed, Changed filter buttons', () => {
    renderViewer();
    const tablist = screen.getByRole('tablist', { name: /filter tokens/i });
    expect(within(tablist).getByRole('tab', { name: /all/i })).toBeInTheDocument();
    expect(within(tablist).getByRole('tab', { name: /added/i })).toBeInTheDocument();
    expect(within(tablist).getByRole('tab', { name: /removed/i })).toBeInTheDocument();
    expect(within(tablist).getByRole('tab', { name: /changed/i })).toBeInTheDocument();
  });

  it('"All" tab is active by default', () => {
    renderViewer();
    const allTab = screen.getByRole('tab', { name: /all/i });
    expect(allTab).toHaveAttribute('aria-selected', 'true');
  });

  it('clicking "Added" shows only added entries', async () => {
    const user = userEvent.setup();
    renderViewer();
    await user.click(screen.getByRole('tab', { name: /added/i }));

    const addedTab = screen.getByRole('tab', { name: /added/i });
    expect(addedTab).toHaveAttribute('aria-selected', 'true');

    // All visible rows should be "Added" type
    const rows = screen.getAllByRole('row');
    rows.forEach((row) => {
      expect(row).toHaveAttribute(
        'aria-label',
        expect.stringContaining('Added'),
      );
    });
  });

  it('clicking "Removed" shows only removed entries', async () => {
    const user = userEvent.setup();
    renderViewer();
    await user.click(screen.getByRole('tab', { name: /removed/i }));

    const removedTab = screen.getByRole('tab', { name: /removed/i });
    expect(removedTab).toHaveAttribute('aria-selected', 'true');

    const rows = screen.getAllByRole('row');
    rows.forEach((row) => {
      expect(row).toHaveAttribute(
        'aria-label',
        expect.stringContaining('Removed'),
      );
    });
  });

  it('clicking "Changed" shows only changed entries', async () => {
    const user = userEvent.setup();
    renderViewer();
    await user.click(screen.getByRole('tab', { name: /changed/i }));

    const changedTab = screen.getByRole('tab', { name: /changed/i });
    expect(changedTab).toHaveAttribute('aria-selected', 'true');

    const rows = screen.getAllByRole('row');
    rows.forEach((row) => {
      expect(row).toHaveAttribute(
        'aria-label',
        expect.stringContaining('Changed'),
      );
    });
  });

  it('filter buttons show count badges', () => {
    renderViewer();
    const tablist = screen.getByRole('tablist', { name: /filter tokens/i });
    const badges = within(tablist).getAllByLabelText(/\d+ tokens/);
    expect(badges.length).toBe(4); // all, added, removed, changed
    badges.forEach((badge) => {
      expect(badge.textContent).toMatch(/^\d+$/);
    });
  });
});

/* ────────────────────────────────────────────
   6. Search
   ──────────────────────────────────────────── */

describe('TokenDiffViewer — search', () => {
  it('search input exists with placeholder "Search tokens…"', () => {
    renderViewer();
    const input = screen.getByPlaceholderText('Search tokens…');
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute('type', 'search');
  });

  it('typing in search filters tokens by name', async () => {
    const user = userEvent.setup();
    renderViewer();

    const input = screen.getByPlaceholderText('Search tokens…');
    // Type a token name fragment that exists
    await user.type(input, 'brand-glow');

    // Only matching rows should appear
    const rows = screen.getAllByRole('row');
    rows.forEach((row) => {
      expect(row.getAttribute('aria-label')).toMatch(/brand-glow/i);
    });
  });

  it('no results shows "No Matching Tokens" message', async () => {
    const user = userEvent.setup();
    renderViewer();

    const input = screen.getByPlaceholderText('Search tokens…');
    await user.type(input, 'zzz-nonexistent-token-name-xyz');

    expect(
      screen.getByText(/no matching tokens/i),
    ).toBeInTheDocument();
  });
});

/* ────────────────────────────────────────────
   7. Copy changelog
   ──────────────────────────────────────────── */

describe('TokenDiffViewer — copy changelog', () => {
  beforeEach(() => {
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
    });
  });

  it('copy button exists with text "Copy Changelog"', () => {
    renderViewer();
    expect(
      screen.getByRole('button', { name: /copy changelog to clipboard/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /copy changelog to clipboard/i }),
    ).toHaveTextContent(/copy changelog/i);
  });

  it('clicking copy calls clipboard API', async () => {
    const user = userEvent.setup();
    renderViewer();

    await user.click(
      screen.getByRole('button', { name: /copy changelog to clipboard/i }),
    );

    expect(navigator.clipboard.writeText).toHaveBeenCalledTimes(1);
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
      expect.stringContaining('Token Changelog'),
    );
  });

  it('button text changes to "✓ Copied" after click', async () => {
    const user = userEvent.setup();
    renderViewer();

    const btn = screen.getByRole('button', {
      name: /copy changelog to clipboard/i,
    });
    await user.click(btn);

    expect(btn).toHaveTextContent(/✓ Copied/);
  });
});

/* ────────────────────────────────────────────
   8. Diff rows
   ──────────────────────────────────────────── */

describe('TokenDiffViewer — diff rows', () => {
  it('added tokens show + icon', async () => {
    const user = userEvent.setup();
    renderViewer();
    await user.click(screen.getByRole('tab', { name: /added/i }));

    const rows = screen.getAllByRole('row');
    expect(rows.length).toBeGreaterThan(0);

    // Each added row should contain a status icon with label "Added"
    rows.forEach((row) => {
      const icon = within(row).getByRole('img', { name: 'Added' });
      expect(icon).toHaveTextContent('+');
    });
  });

  it('removed tokens show − icon', async () => {
    const user = userEvent.setup();
    renderViewer();
    await user.click(screen.getByRole('tab', { name: /removed/i }));

    const rows = screen.getAllByRole('row');
    expect(rows.length).toBeGreaterThan(0);

    rows.forEach((row) => {
      const icon = within(row).getByRole('img', { name: 'Removed' });
      expect(icon).toHaveTextContent('−');
    });
  });

  it('changed tokens show ↔ icon', async () => {
    const user = userEvent.setup();
    renderViewer();
    await user.click(screen.getByRole('tab', { name: /changed/i }));

    const rows = screen.getAllByRole('row');
    expect(rows.length).toBeGreaterThan(0);

    rows.forEach((row) => {
      const icon = within(row).getByRole('img', { name: 'Changed' });
      expect(icon).toHaveTextContent('↔');
    });
  });

  it('token names are rendered in rows', () => {
    renderViewer();
    const table = screen.getByRole('table', { name: /token differences/i });
    // Should contain at least one recognisable token name
    expect(table.textContent).toMatch(/--color-|--shadow-|--space-|--radius-|--status-/);
  });

  it('swatches display for color tokens', async () => {
    const user = userEvent.setup();
    renderViewer();
    await user.click(screen.getByRole('tab', { name: /added/i }));

    // Color tokens produce swatch <span role="img"> elements
    const swatches = screen.getAllByRole('img', { name: /value/i });
    expect(swatches.length).toBeGreaterThan(0);
  });

  it('impact scope badges are rendered', () => {
    renderViewer();
    const table = screen.getByRole('table', { name: /token differences/i });
    // Impact scope text from diffEngine.getImpactScope should appear
    const scopePatterns = [
      /surfaces & cards/i,
      /typography & readability/i,
      /borders & outlines/i,
      /brand identity/i,
      /feedback states/i,
      /elevation & depth/i,
      /layout & spacing/i,
      /corner rounding/i,
      /status indicators/i,
    ];
    const matchedSome = scopePatterns.some((p) => p.test(table.textContent ?? ''));
    expect(matchedSome).toBe(true);
  });

  it('changed rows show old and new values', async () => {
    const user = userEvent.setup();
    renderViewer();
    await user.click(screen.getByRole('tab', { name: /changed/i }));

    const rows = screen.getAllByRole('row');
    expect(rows.length).toBeGreaterThan(0);

    // Each changed row should show both old and new value swatches
    const firstRow = rows[0];
    const oldLabel = within(firstRow).getByRole('img', { name: /old value/i });
    const newLabel = within(firstRow).getByRole('img', { name: /new value/i });
    expect(oldLabel).toBeInTheDocument();
    expect(newLabel).toBeInTheDocument();
  });
});

/* ────────────────────────────────────────────
   9. Empty states
   ──────────────────────────────────────────── */

describe('TokenDiffViewer — empty states', () => {
  it('same version → "Same Version Selected"', async () => {
    const user = userEvent.setup();
    renderViewer();

    // Set both selectors to the same version
    await user.selectOptions(
      screen.getByLabelText('Baseline version'),
      firstVersion.id,
    );
    await user.selectOptions(
      screen.getByLabelText('Target version'),
      firstVersion.id,
    );

    expect(
      screen.getByRole('heading', { name: /same version selected/i }),
    ).toBeInTheDocument();

    // Should NOT show diff table or filter tabs
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
    expect(screen.queryByRole('tablist')).not.toBeInTheDocument();
  });

  it('no versions → "Select Two Versions"', async () => {
    const user = userEvent.setup();
    renderViewer();

    // Clear both selectors
    await user.selectOptions(screen.getByLabelText('Baseline version'), '');

    expect(
      screen.getByRole('heading', { name: /select two versions/i }),
    ).toBeInTheDocument();

    expect(screen.queryByRole('table')).not.toBeInTheDocument();
    expect(screen.queryByRole('tablist')).not.toBeInTheDocument();
  });
});

/* ────────────────────────────────────────────
   10. Accessibility
   ──────────────────────────────────────────── */

describe('TokenDiffViewer — accessibility', () => {
  it('section has aria-label "Token Diff Viewer"', () => {
    renderViewer();
    const section = screen.getByRole('region', { name: /token diff viewer/i });
    expect(section).toBeInTheDocument();
    expect(section.tagName).toBe('SECTION');
  });

  it('version group has aria-label', () => {
    renderViewer();
    const group = screen.getByRole('group', { name: /version selection/i });
    expect(group).toBeInTheDocument();
  });

  it('filter tabs have role="tablist"', () => {
    renderViewer();
    const tablist = screen.getByRole('tablist', { name: /filter tokens/i });
    expect(tablist).toBeInTheDocument();
  });

  it('each tab has role="tab" and aria-selected', () => {
    renderViewer();
    const tabs = screen.getAllByRole('tab');
    expect(tabs.length).toBe(4);
    tabs.forEach((tab) => {
      expect(tab).toHaveAttribute('aria-selected');
    });
  });

  it('search input has aria-label', () => {
    renderViewer();
    const input = screen.getByRole('searchbox', { name: /search tokens by name/i });
    expect(input).toBeInTheDocument();
  });

  it('copy button has aria-label', () => {
    renderViewer();
    const btn = screen.getByRole('button', {
      name: /copy changelog to clipboard/i,
    });
    expect(btn).toBeInTheDocument();
  });

  it('diff list has role="table"', () => {
    renderViewer();
    const table = screen.getByRole('table', { name: /token differences/i });
    expect(table).toBeInTheDocument();
  });

  it('diff rows have role="row" with descriptive aria-label', () => {
    renderViewer();
    const rows = screen.getAllByRole('row');
    expect(rows.length).toBeGreaterThan(0);
    rows.forEach((row) => {
      expect(row).toHaveAttribute('aria-label');
      // Should follow "{Type} token: {name}" pattern
      expect(row.getAttribute('aria-label')).toMatch(
        /^(Added|Removed|Changed|Unchanged) token: --/,
      );
    });
  });

  it('empty state containers have role="status"', async () => {
    const user = userEvent.setup();
    renderViewer();

    // Trigger same-version state
    await user.selectOptions(
      screen.getByLabelText('Target version'),
      firstVersion.id,
    );

    const statusEl = screen.getByRole('status');
    expect(statusEl).toBeInTheDocument();
  });
});
