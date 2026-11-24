import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import {
  HelpArticle,
  findRouteContext,
  getTopArticles,
  helpArticles,
  searchArticles,
} from './helpData';
import { ViewMode, getArticlesByCategory } from './helpSidebarUtils';

export interface UseHelpSidebarOptions {
  controlledIsOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}

/**
 * Custom hook managing HelpSidebar open state, navigation view, search query,
 * keyboard/pointer dismissal, focus trapping, and screen-reader announcements.
 */
export function useHelpSidebar({
  controlledIsOpen,
  onOpenChange,
}: UseHelpSidebarOptions) {
  const location = useLocation();
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
  const categoryArticles = useMemo(
    () => getArticlesByCategory(helpArticles, activeCategory),
    [activeCategory]
  );

  useEffect(() => {
    if (query.trim() && view === 'home') {
      setView('search');
    } else if (!query.trim() && view === 'search') {
      setView('home');
    }
  }, [query, view]);

  const closePanel = () => {
    setIsOpen(false);
    setSrAnnouncement('Help center closed.');
    triggerRef.current?.focus();
  };

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

  return {
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
  };
}
