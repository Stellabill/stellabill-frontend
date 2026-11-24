import {
  CircleHelp,
  CreditCard,
  FileText,
  LifeBuoy,
  Settings as SettingsIcon,
  SlidersHorizontal,
  Sparkles,
} from 'lucide-react';
import { HelpArticle, RouteHelpContext } from './helpData';

export type ViewMode = 'home' | 'search' | 'category' | 'article';

export const CATEGORY_ICONS: Record<HelpArticle['category'], typeof CircleHelp> = {
  'Getting Started': Sparkles,
  Billing: CreditCard,
  Subscriptions: FileText,
  Plans: SlidersHorizontal,
  Settings: SettingsIcon,
  Troubleshooting: LifeBuoy,
};

export const CATEGORY_ORDER: HelpArticle['category'][] = [
  'Getting Started',
  'Billing',
  'Subscriptions',
  'Plans',
  'Settings',
  'Troubleshooting',
];

export const SHORTCUT_HINT =
  typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform)
    ? '?'
    : '?';

/**
 * Return articles belonging to the given category, or an empty array when null.
 */
export function getArticlesByCategory(
  articles: HelpArticle[],
  category: HelpArticle['category'] | null
): HelpArticle[] {
  if (!category) return [];
  return articles.filter((a) => a.category === category);
}

/**
 * Count how many articles belong to a specific category.
 */
export function countArticlesInCategory(
  articles: HelpArticle[],
  category: HelpArticle['category']
): number {
  return articles.filter((a) => a.category === category).length;
}

/**
 * Return up to `limit` related articles in the same category, excluding the active article.
 */
export function getRelatedArticles(
  articles: HelpArticle[],
  activeArticle: HelpArticle,
  limit = 3
): HelpArticle[] {
  return articles
    .filter((a) => a.category === activeArticle.category && a.id !== activeArticle.id)
    .slice(0, limit);
}

/**
 * Build the subtitle string for the help sidebar header based on route context.
 */
export function getHelpSubtitle(routeContext?: RouteHelpContext | null): string {
  return routeContext
    ? `You're on the ${routeContext.pageTitle} page — answers tailored for you.`
    : 'Search help articles or browse categories.';
}
