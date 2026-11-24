import { useState } from 'react';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import HelpSidebar, { type HelpSidebarProps } from './HelpSidebar';
import { getTopArticles, helpArticles, searchArticles } from './helpData';

function renderHelpSidebar(
  props: HelpSidebarProps = {},
  initialRoute = '/dashboard'
) {
  return render(
    <MemoryRouter initialEntries={[initialRoute]}>
      <HelpSidebar {...props} />
    </MemoryRouter>
  );
}

describe('HelpSidebar', () => {
  describe('uncontrolled and controlled open/close', () => {
    it('opens and closes in uncontrolled mode and returns focus to opener on Escape', async () => {
      const user = userEvent.setup();
      const onOpenChange = vi.fn();
      renderHelpSidebar({ onOpenChange });

      const trigger = screen.getByRole('button', { name: /open help center/i });
      const dialog = screen.getByRole('dialog', { hidden: true });

      expect(trigger).toHaveAttribute('aria-expanded', 'false');
      expect(dialog).toHaveAttribute('data-open', 'false');
      expect(dialog).toHaveAttribute('aria-hidden', 'true');

      await user.click(trigger);

      expect(trigger).toHaveAttribute('aria-expanded', 'true');
      expect(dialog).toHaveAttribute('data-open', 'true');
      expect(dialog).toHaveAttribute('aria-hidden', 'false');
      expect(onOpenChange).toHaveBeenCalledWith(true);

      await waitFor(() => {
        expect(screen.getByRole('searchbox', { name: /search help articles/i })).toHaveFocus();
      });

      await user.keyboard('{Escape}');

      expect(trigger).toHaveAttribute('aria-expanded', 'false');
      expect(dialog).toHaveAttribute('data-open', 'false');
      expect(dialog).toHaveAttribute('aria-hidden', 'true');
      expect(onOpenChange).toHaveBeenCalledWith(false);
      expect(trigger).toHaveFocus();
    });

    it('closes when clicking the close button in uncontrolled mode', async () => {
      const user = userEvent.setup();
      renderHelpSidebar();

      const trigger = screen.getByRole('button', { name: /open help center/i });
      await user.click(trigger);

      const closeBtn = screen.getByRole('button', { name: /close help center/i });
      await user.click(closeBtn);

      expect(screen.getByRole('dialog', { hidden: true })).toHaveAttribute('data-open', 'false');
      expect(trigger).toHaveFocus();
    });

    it('supports controlled isOpen and onOpenChange', async () => {
      const user = userEvent.setup();
      const onOpenChange = vi.fn();

      function ControlledWrapper() {
        const [open, setOpen] = useState(true);
        return (
          <MemoryRouter initialEntries={['/dashboard']}>
            <HelpSidebar
              isOpen={open}
              onOpenChange={(next) => {
                onOpenChange(next);
                setOpen(next);
              }}
            />
          </MemoryRouter>
        );
      }

      render(<ControlledWrapper />);

      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('data-open', 'true');

      await waitFor(() => {
        expect(screen.getByRole('searchbox', { name: /search help articles/i })).toHaveFocus();
      });

      await user.keyboard('{Escape}');

      expect(onOpenChange).toHaveBeenCalledWith(false);
      expect(screen.getByRole('dialog', { hidden: true })).toHaveAttribute('data-open', 'false');
      expect(screen.getByRole('button', { name: /open help center/i })).toHaveFocus();
    });

    it('hides the trigger button when showTrigger is false', () => {
      renderHelpSidebar({ isOpen: true, showTrigger: false });

      expect(screen.queryByRole('button', { name: /open help center/i })).not.toBeInTheDocument();
      expect(screen.getByRole('dialog')).toHaveAttribute('data-open', 'true');
    });
  });

  describe('outside pointer-down close', () => {
    it('closes the panel on pointerdown outside and ignores pointerdown inside', async () => {
      const user = userEvent.setup();
      render(
        <MemoryRouter initialEntries={['/dashboard']}>
          <div>
            <button type="button">Outside target</button>
            <HelpSidebar />
          </div>
        </MemoryRouter>
      );

      const trigger = screen.getByRole('button', { name: /open help center/i });
      await user.click(trigger);

      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('data-open', 'true');

      // Pointer down inside the panel should keep it open
      fireEvent.pointerDown(dialog);
      expect(dialog).toHaveAttribute('data-open', 'true');

      // Pointer down outside should close it
      fireEvent.pointerDown(screen.getByRole('button', { name: /outside target/i }));
      expect(screen.getByRole('dialog', { hidden: true })).toHaveAttribute('data-open', 'false');
    });
  });

  describe('route context and top articles', () => {
    it('renders top articles from getTopArticles(pathname) for a matched parameterized route', async () => {
      const user = userEvent.setup();
      const pathname = '/subscriptions/sub_123';
      const expectedTop = getTopArticles(pathname);

      renderHelpSidebar({}, pathname);
      await user.click(screen.getByRole('button', { name: /open help center/i }));

      expect(
        screen.getByText(/you're on the subscription detail page/i)
      ).toBeInTheDocument();

      const topList = screen.getByRole('list', {
        name: /top answers for subscription detail/i,
      });
      const items = within(topList).getAllByRole('button');
      expect(items).toHaveLength(expectedTop.length);

      for (const article of expectedTop) {
        expect(within(topList).getByText(article.title)).toBeInTheDocument();
      }
    });

    it('falls back to generic subtitle and hides top answers on unmatched routes', async () => {
      const user = userEvent.setup();
      renderHelpSidebar({}, '/unmatched-route');

      await user.click(screen.getByRole('button', { name: /open help center/i }));

      expect(
        screen.getByText('Search help articles or browse categories.')
      ).toBeInTheDocument();
      expect(screen.queryByText(/top answers/i)).not.toBeInTheDocument();
    });
  });

  describe('search view and clearing query', () => {
    it('switches to search view via searchArticles, shows empty state, and returns home when cleared', async () => {
      const user = userEvent.setup();
      renderHelpSidebar();

      await user.click(screen.getByRole('button', { name: /open help center/i }));
      const searchInput = screen.getByRole('searchbox', { name: /search help articles/i });

      const query = 'prepaid';
      const expectedResults = searchArticles(query);
      expect(expectedResults.length).toBeGreaterThan(0);

      await user.type(searchInput, query);

      expect(screen.getByText(`· ${expectedResults.length} found`)).toBeInTheDocument();
      const resultsList = screen.getByRole('list', { name: 'Search results' });
      for (const article of expectedResults) {
        expect(within(resultsList).getByText(article.title)).toBeInTheDocument();
      }

      // Empty search result
      await user.clear(searchInput);
      await user.type(searchInput, 'zzzz');

      expect(screen.getByText('No matching articles')).toBeInTheDocument();
      expect(
        screen.getByText(/try different keywords, browse a category, or contact support below/i)
      ).toBeInTheDocument();

      // Clear search button returns to home view
      await user.click(screen.getByRole('button', { name: /clear search/i }));

      expect(searchInput).toHaveValue('');
      expect(screen.getByText('Browse by category')).toBeInTheDocument();
      expect(screen.queryByText('No matching articles')).not.toBeInTheDocument();
    });
  });

  describe('article detail, categories, and Back navigation', () => {
    it('opens an article showing its content and returns to home on Back', async () => {
      const user = userEvent.setup();
      const pathname = '/dashboard';
      const firstTopArticle = getTopArticles(pathname)[0];

      renderHelpSidebar({}, pathname);
      await user.click(screen.getByRole('button', { name: /open help center/i }));

      await user.click(screen.getByRole('button', { name: new RegExp(firstTopArticle.title, 'i') }));

      const articleEl = screen.getByRole('article');
      expect(within(articleEl).getByRole('heading', { name: firstTopArticle.title })).toBeInTheDocument();
      expect(within(articleEl).getByText(firstTopArticle.content)).toBeInTheDocument();

      // Header and search are hidden in article view
      expect(screen.queryByRole('searchbox', { name: /search help articles/i })).not.toBeInTheDocument();

      // Click Back to help
      await user.click(screen.getByRole('button', { name: /back to help/i }));

      expect(screen.queryByRole('article')).not.toBeInTheDocument();
      expect(screen.getByText('Browse by category')).toBeInTheDocument();
      expect(screen.getByRole('searchbox', { name: /search help articles/i })).toBeInTheDocument();
    });

    it('opens a category view with all articles in that category', async () => {
      const user = userEvent.setup();
      const billingArticles = helpArticles.filter((a) => a.category === 'Billing');

      renderHelpSidebar();
      await user.click(screen.getByRole('button', { name: /open help center/i }));

      await user.click(
        screen.getByRole('listitem', { name: /browse billing category/i })
      );

      const categoryList = screen.getByRole('list', { name: 'Billing articles' });
      expect(within(categoryList).getAllByRole('button')).toHaveLength(billingArticles.length);
      for (const article of billingArticles) {
        expect(within(categoryList).getByText(article.title)).toBeInTheDocument();
      }
    });
  });

  describe('Tab focus trap', () => {
    it('wraps Tab from last to first focusable element and Shift+Tab from first to last', async () => {
      const user = userEvent.setup();
      renderHelpSidebar();

      await user.click(screen.getByRole('button', { name: /open help center/i }));
      await waitFor(() => {
        expect(screen.getByRole('searchbox', { name: /search help articles/i })).toHaveFocus();
      });

      const dialog = screen.getByRole('dialog');
      const focusables = Array.from(
        dialog.querySelectorAll<HTMLElement>(
          'button:not([disabled]), input:not([disabled]), [href], [tabindex]:not([tabindex="-1"])'
        )
      );
      expect(focusables.length).toBeGreaterThan(2);

      const first = focusables[0];
      const last = focusables[focusables.length - 1];

      // Tab from last wraps to first
      last.focus();
      expect(last).toHaveFocus();
      await user.keyboard('{Tab}');
      expect(first).toHaveFocus();

      // Shift+Tab from first wraps to last
      await user.keyboard('{Shift>}{Tab}{/Shift}');
      expect(last).toHaveFocus();
    });
  });

  describe('screen reader announcements (srAnnouncement)', () => {
    it('updates the polite status live region on open, category, article, back, and close', async () => {
      const user = userEvent.setup();
      const pathname = '/dashboard';
      const firstTopArticle = getTopArticles(pathname)[0];

      renderHelpSidebar({}, pathname);

      const dialog = screen.getByRole('dialog', { hidden: true });
      const liveRegion = dialog.querySelector('[aria-live="polite"]') as HTMLElement;
      expect(liveRegion).toBeInTheDocument();
      expect(liveRegion).toHaveTextContent('');

      await user.click(screen.getByRole('button', { name: /open help center/i }));
      expect(liveRegion).toHaveTextContent('Help center opened.');

      await user.click(screen.getByRole('listitem', { name: /browse billing category/i }));
      expect(liveRegion).toHaveTextContent('Browsing category: Billing.');

      const billingArticle = helpArticles.find((a) => a.category === 'Billing')!;
      await user.click(screen.getByRole('button', { name: new RegExp(billingArticle.title, 'i') }));
      expect(liveRegion).toHaveTextContent(`Opened article: ${billingArticle.title}.`);

      await user.click(screen.getByRole('button', { name: /back to help/i }));
      expect(liveRegion).toHaveTextContent('Returned to help home.');

      await user.click(screen.getByRole('button', { name: new RegExp(firstTopArticle.title, 'i') }));
      expect(liveRegion).toHaveTextContent(`Opened article: ${firstTopArticle.title}.`);

      await user.keyboard('{Escape}');
      expect(liveRegion).toHaveTextContent('Help center closed.');
    });
  });
});
