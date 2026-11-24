import { useId } from 'react';
import { CircleHelp, Search, Sparkles, X } from 'lucide-react';
import { helpArticles } from './helpData';
import {
  CATEGORY_ICONS,
  CATEGORY_ORDER,
  SHORTCUT_HINT,
  countArticlesInCategory,
  getHelpSubtitle,
} from './helpSidebarUtils';
import { useHelpSidebar } from './useHelpSidebar';
import { HelpSearchInput } from './HelpSearchInput';
import { HelpArticleList } from './HelpArticleList';
import { HelpArticleDetail } from './HelpArticleDetail';
import { HelpContactFooter } from './HelpContactFooter';
import './HelpSidebar.css';

interface HelpSidebarProps {
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  showTrigger?: boolean;
}

export default function HelpSidebar({
  isOpen: controlledIsOpen,
  onOpenChange,
  showTrigger = true,
}: HelpSidebarProps) {
  const panelId = useId();
  const titleId = useId();
  const searchId = useId();
  const srStatusId = useId();

  const {
    triggerRef,
    panelRef,
    searchInputRef,
    firstInteractiveRef,
    isOpen,
    query,
    setQuery,
    view,
    activeCategory,
    activeArticle,
    srAnnouncement,
    routeContext,
    topArticles,
    searchResults,
    categoryArticles,
    openPanel,
    closePanel,
    openArticle,
    goHome,
    openCategory,
    clearSearch,
  } = useHelpSidebar({ controlledIsOpen, onOpenChange });

  const renderHome = () => (
    <>
      {topArticles.length > 0 && (
        <section className="help-sidebar__section" aria-labelledby={`${panelId}-context-title`}>
          <div className="help-sidebar__section-header">
            <h3
              id={`${panelId}-context-title`}
              className="help-sidebar__section-title"
            >
              Top answers
              {routeContext && <span>· {routeContext.pageTitle}</span>}
            </h3>
            <span className="help-sidebar__context-badge" aria-hidden="true">
              <Sparkles size={12} />
              Contextual
            </span>
          </div>
          <HelpArticleList
            articles={topArticles}
            listAriaLabel={`Top answers for ${routeContext?.pageTitle ?? 'current page'}`}
            onOpenArticle={openArticle}
          />
        </section>
      )}

      <section className="help-sidebar__section" aria-labelledby={`${panelId}-categories-title`}>
        <div className="help-sidebar__section-header">
          <h3
            id={`${panelId}-categories-title`}
            className="help-sidebar__section-title"
          >
            Browse by category
          </h3>
        </div>
        <div className="help-sidebar__category-list" role="list">
          {CATEGORY_ORDER.map((cat) => {
            const Icon = CATEGORY_ICONS[cat];
            const count = countArticlesInCategory(helpArticles, cat);
            return (
              <button
                key={cat}
                type="button"
                role="listitem"
                className="help-sidebar__category-button"
                onClick={() => openCategory(cat)}
                aria-label={`Browse ${cat} category, ${count} articles`}
              >
                <Icon size={18} className="help-sidebar__category-icon" aria-hidden="true" />
                <span className="help-sidebar__category-label">{cat}</span>
                <span className="help-sidebar__result-count">{count} articles</span>
              </button>
            );
          })}
        </div>
      </section>
    </>
  );

  const renderSearchResults = () => {
    if (searchResults.length === 0) {
      return (
        <div className="help-sidebar__empty" role="status">
          <Search size={40} className="help-sidebar__empty-icon" aria-hidden="true" />
          <h3>No matching articles</h3>
          <p>
            Try different keywords, browse a category, or contact support below.
          </p>
        </div>
      );
    }

    return (
      <section className="help-sidebar__section" aria-labelledby={`${panelId}-results-title`}>
        <div className="help-sidebar__section-header">
          <h3 id={`${panelId}-results-title`} className="help-sidebar__section-title">
            Search results
            <span>· {searchResults.length} found</span>
          </h3>
        </div>
        <HelpArticleList
          articles={searchResults}
          listAriaLabel="Search results"
          onOpenArticle={openArticle}
        />
      </section>
    );
  };

  const renderCategory = () => (
    <section className="help-sidebar__section" aria-labelledby={`${panelId}-cat-title`}>
      <div className="help-sidebar__section-header">
        <h3 id={`${panelId}-cat-title`} className="help-sidebar__section-title">
          {activeCategory}
          <span>· {categoryArticles.length} articles</span>
        </h3>
      </div>
      <HelpArticleList
        articles={categoryArticles}
        listAriaLabel={`${activeCategory} articles`}
        onOpenArticle={openArticle}
      />
    </section>
  );

  const body = view === 'search'
    ? renderSearchResults()
    : view === 'category'
      ? renderCategory()
      : view === 'article' && activeArticle
        ? (
          <HelpArticleDetail
            panelId={panelId}
            article={activeArticle}
            onGoHome={goHome}
            onOpenArticle={openArticle}
          />
        )
        : renderHome();

  return (
    <div className="help-sidebar">
      {showTrigger && (
        <button
          ref={triggerRef}
          type="button"
          className="help-sidebar__trigger"
          aria-label="Open help center"
          aria-haspopup="dialog"
          aria-expanded={isOpen}
          aria-controls={panelId}
          aria-keyshortcuts="?"
          onClick={openPanel}
        >
          <CircleHelp size={20} aria-hidden="true" />
        </button>
      )}
      <div
        className="help-sidebar__backdrop"
        data-open={isOpen}
        aria-hidden="true"
        onClick={closePanel}
      />

      <div
        ref={panelRef}
        id={panelId}
        className="help-sidebar__panel"
        data-open={isOpen}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-hidden={!isOpen}
        tabIndex={-1}
      >
        <div id={srStatusId} className="help-sidebar__sr-only" role="status" aria-live="polite">
          {srAnnouncement}
        </div>

        {view !== 'article' && (
          <div className="help-sidebar__panel-header">
            <div>
              <p className="help-sidebar__kicker">Help Center</p>
              <h2 id={titleId} className="help-sidebar__title">
                How can we help?
              </h2>
              <p className="help-sidebar__subtitle">
                {getHelpSubtitle(routeContext)}
              </p>
            </div>
            <button
              ref={firstInteractiveRef as React.RefObject<HTMLButtonElement>}
              type="button"
              className="help-sidebar__icon-button"
              aria-label="Close help center"
              onClick={closePanel}
            >
              <X size={18} aria-hidden="true" />
            </button>
          </div>
        )}
        {view !== 'article' && (
          <HelpSearchInput
            searchId={searchId}
            srStatusId={srStatusId}
            searchInputRef={searchInputRef}
            query={query}
            onQueryChange={setQuery}
            onClearSearch={clearSearch}
          />
        )}

        <div className="help-sidebar__body">
          {body}
        </div>

        {view !== 'article' && <HelpContactFooter panelId={panelId} />}
      </div>

      <span
        className="help-sidebar__sr-only"
        role="note"
        aria-hidden={isOpen}
      >
        Press {SHORTCUT_HINT} to open help.
      </span>
    </div>
  );
}

export type { HelpSidebarProps };
