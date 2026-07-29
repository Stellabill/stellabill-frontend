import { useEffect, useId, useMemo, useRef, useState } from 'react';
import {
  BookOpen,
  ChevronLeft,
  CircleHelp,
  CreditCard,
  FileText,
  LifeBuoy,
  Mail,
  MessageCircle,
  Search,
  Settings as SettingsIcon,
  SlidersHorizontal,
  Sparkles,
  X,
} from 'lucide-react';
import {
  HelpArticle,
  SUPPORT_EMAIL,
  SUPPORT_HOURS,
  findRouteContext,
  getTopArticles,
  helpArticles,
  searchArticles,
} from './helpData';
import './HelpSidebar.css';
import { useLocation } from 'react-router-dom';

interface HelpSidebarProps {
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  showTrigger?: boolean;
}

type ViewMode = 'home' | 'search' | 'category' | 'article';

const CATEGORY_ICONS: Record<HelpArticle['category'], typeof CircleHelp> = {
  'Getting Started': Sparkles,
  Billing: CreditCard,
  Subscriptions: FileText,
  Plans: SlidersHorizontal,
  Settings: SettingsIcon,
  Troubleshooting: LifeBuoy,
};

const CATEGORY_ORDER: HelpArticle['category'][] = [
  'Getting Started',
  'Billing',
  'Subscriptions',
  'Plans',
  'Settings',
  'Troubleshooting',
];

const SHORTCUT_HINT =
  typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform)
    ? '?'
    : '?';

export default function HelpSidebar({
  isOpen: controlledIsOpen,
  onOpenChange,
  showTrigger = true,
}: HelpSidebarProps) {
  const location = useLocation();
  const panelId = useId();
  const titleId = useId();
  const searchId = useId();
  const srStatusId = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const firstInteractiveRef = useRef<HTMLButtonElement | HTMLInputElement | null>(null);

  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const isOpen = controlledIsOpen ?? internalIsOpen;
  const setIsOpen = (next: boolean) => {
    if (controlledIsOpen === undefined) {
      setInternalIsOpen(next);
    }
    onOpenChange?.(next);
  };
  const [query, setQuery] = useState('');
  const [view, setView] = useState<ViewMode>('home');
  const [activeCategory, setActiveCategory] = useState<HelpArticle['category'] | null>(null);
  const [activeArticle, setActiveArticle] = useState<HelpArticle | null>(null);
  const [srAnnouncement, setSrAnnouncement] = useState('');

  const routeContext = useMemo(
    () => findRouteContext(location.pathname),
    [location.pathname]
  );
  const topArticles = useMemo(
    () => getTopArticles(location.pathname),
    [location.pathname]
  );

  const searchResults = useMemo(() => searchArticles(query), [query]);

  const categoryArticles = useMemo(() => {
    if (!activeCategory) return [];
    return helpArticles.filter((a) => a.category === activeCategory);
  }, [activeCategory]);

  useEffect(() => {
    if (query.trim() && view === 'home') {
      setView('search');
    } else if (!query.trim() && view === 'search') {
      setView('home');
    }
  }, [query, view]);

  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (
        panelRef.current?.contains(target) ||
        triggerRef.current?.contains(target)
      ) {
        return;
      }
      closePanel();
    };

    const handleKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        closePanel();
      }
    };

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const focusable = panelRef.current?.querySelectorAll<
      HTMLButtonElement | HTMLInputElement | HTMLAnchorElement
    >(
      'button:not([disabled]), input:not([disabled]), [href], [tabindex]:not([tabindex="-1"])'
    );
    if (!focusable || focusable.length === 0) return;

    const handleTab = (event: globalThis.KeyboardEvent) => {
      if (event.key !== 'Tab') return;
      const items = Array.from(focusable);
      const first = items[0];
      const last = items[items.length - 1];
      const active = document.activeElement;

      if (event.shiftKey && active === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleTab);
    return () => document.removeEventListener('keydown', handleTab);
  }, [isOpen, view, activeCategory, activeArticle, query]);

  useEffect(() => {
    if (isOpen) {
      requestAnimationFrame(() => {
        searchInputRef.current?.focus();
      });
    }
  }, [isOpen]);

  const openPanel = () => {
    setIsOpen(true);
    setView('home');
    setActiveArticle(null);
    setActiveCategory(null);
    setQuery('');
    setSrAnnouncement('Help center opened.');
  };

  const closePanel = () => {
    setIsOpen(false);
    setSrAnnouncement('Help center closed.');
    triggerRef.current?.focus();
  };

  const openArticle = (article: HelpArticle) => {
    setActiveArticle(article);
    setView('article');
    setSrAnnouncement(`Opened article: ${article.title}.`);
  };

  const goHome = () => {
    setView('home');
    setActiveArticle(null);
    setActiveCategory(null);
    setQuery('');
    setSrAnnouncement('Returned to help home.');
    requestAnimationFrame(() => searchInputRef.current?.focus());
  };

  const openCategory = (category: HelpArticle['category']) => {
    setActiveCategory(category);
    setView('category');
    setSrAnnouncement(`Browsing category: ${category}.`);
  };

  const clearSearch = () => {
    setQuery('');
    setView('home');
    searchInputRef.current?.focus();
  };

  const renderTrigger = () => (
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
  );

  const renderBackdrop = () => (
    <div
      className="help-sidebar__backdrop"
      data-open={isOpen}
      aria-hidden="true"
      onClick={closePanel}
    />
  );

  const renderPanelHeader = () => (
    <div className="help-sidebar__panel-header">
      <div>
        <p className="help-sidebar__kicker">Help Center</p>
        <h2 id={titleId} className="help-sidebar__title">
          How can we help?
        </h2>
        <p className="help-sidebar__subtitle">
          {routeContext
            ? `You're on the ${routeContext.pageTitle} page — answers tailored for you.`
            : 'Search help articles or browse categories.'}
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
  );

  const renderSearch = () => (
    <div className="help-sidebar__search-wrap">
      <span className="help-sidebar__search-icon" aria-hidden="true">
        <Search size={16} />
      </span>
      <label htmlFor={searchId} className="help-sidebar__sr-only">
        Search help articles
      </label>
      <input
        ref={searchInputRef}
        id={searchId}
        type="search"
        className="help-sidebar__search-input"
        placeholder="Search billing, subscriptions, settings…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        aria-describedby={srStatusId}
        autoComplete="off"
        spellCheck={false}
      />
      {query.trim() && (
        <button
          type="button"
          className="help-sidebar__clear-button"
          aria-label="Clear search"
          onClick={clearSearch}
        >
          <X size={14} aria-hidden="true" />
        </button>
      )}
    </div>
  );

  const renderArticleList = (
    articles: HelpArticle[],
    listAriaLabel: string,
    withPreview = true
  ) => (
    <ul className="help-sidebar__list" aria-label={listAriaLabel}>
      {articles.map((article) => {
        const CategoryIcon = CATEGORY_ICONS[article.category];
        return (
          <li key={article.id}>
            <button
              type="button"
              className="help-sidebar__article-button"
              onClick={() => openArticle(article)}
            >
              <div className="help-sidebar__article-meta">
                <CategoryIcon size={12} aria-hidden="true" />
                <span>{article.category}</span>
              </div>
              <h3 className="help-sidebar__article-title">{article.title}</h3>
              {withPreview && (
                <p className="help-sidebar__article-preview">{article.content}</p>
              )}
            </button>
          </li>
        );
      })}
    </ul>
  );

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
          {renderArticleList(topArticles, `Top answers for ${routeContext?.pageTitle ?? 'current page'}`)}
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
            const count = helpArticles.filter((a) => a.category === cat).length;
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
        {renderArticleList(searchResults, 'Search results')}
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
      {renderArticleList(categoryArticles, `${activeCategory} articles`)}
    </section>
  );

  const renderArticleDetail = () => {
    if (!activeArticle) return null;
    const CatIcon = CATEGORY_ICONS[activeArticle.category];
    const similar = helpArticles
      .filter(
        (a) => a.category === activeArticle.category && a.id !== activeArticle.id
      )
      .slice(0, 3);

    return (
      <>
        <div className="help-sidebar__detail-header">
          <button
            type="button"
            className="help-sidebar__back-button"
            onClick={goHome}
          >
            <ChevronLeft size={16} aria-hidden="true" />
            Back to help
          </button>
        </div>
        <article className="help-sidebar__detail" aria-labelledby={`${panelId}-article-title`}>
          <span className="help-sidebar__detail-category">
            <CatIcon size={12} aria-hidden="true" />
            {activeArticle.category}
          </span>
          <h2 id={`${panelId}-article-title`}>{activeArticle.title}</h2>
          <p>{activeArticle.content}</p>

          {similar.length > 0 && (
            <div className="help-sidebar__detail-actions">
              <span className="help-sidebar__detail-actions-label">
                Related articles
              </span>
              {similar.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  className="help-sidebar__article-button"
                  onClick={() => openArticle(s)}
                >
                  <div className="help-sidebar__article-meta">
                    <CATEGORY_ICONS[s.category] size={12} aria-hidden="true" />
                    <span>{s.category}</span>
                  </div>
                  <h3 className="help-sidebar__article-title">{s.title}</h3>
                </button>
              ))}
            </div>
          )}
        </article>
      </>
    );
  };

  const renderContact = () => (
    <aside className="help-sidebar__contact" aria-labelledby={`${panelId}-contact-title`}>
      <div className="help-sidebar__contact-header">
        <span className="help-sidebar__contact-icon" aria-hidden="true">
          <LifeBuoy size={20} />
        </span>
        <div>
          <h3
            id={`${panelId}-contact-title`}
            className="help-sidebar__contact-title"
          >
            Still stuck?
          </h3>
          <p className="help-sidebar__contact-desc">
            Can't find what you need? Our billing support team is happy to help.
          </p>
        </div>
      </div>
      <p className="help-sidebar__contact-hours">
        <MessageCircle size={14} aria-hidden="true" />
        {SUPPORT_HOURS}
      </p>
      <div className="help-sidebar__contact-links">
        <a
          className="help-sidebar__contact-link help-sidebar__contact-link--primary"
          href={`mailto:${SUPPORT_EMAIL}?subject=Stellarbill%20Help%20Request`}
        >
          <Mail size={16} aria-hidden="true" />
          Email support
        </a>
        <a
          className="help-sidebar__contact-link help-sidebar__contact-link--secondary"
          href="https://docs.stellarbill.example"
          target="_blank"
          rel="noopener noreferrer"
        >
          <BookOpen size={16} aria-hidden="true" />
          Open full docs site
        </a>
      </div>
    </aside>
  );

  const body = view === 'search'
    ? renderSearchResults()
    : view === 'category'
      ? renderCategory()
      : view === 'article'
        ? renderArticleDetail()
        : renderHome();

  return (
    <div className="help-sidebar">
      {showTrigger && renderTrigger()}
      {renderBackdrop()}

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

        {view !== 'article' && renderPanelHeader()}
        {view !== 'article' && renderSearch()}

        <div className="help-sidebar__body">
          {body}
        </div>

        {view !== 'article' && renderContact()}
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
