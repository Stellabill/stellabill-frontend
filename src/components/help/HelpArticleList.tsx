import React from 'react';
import { HelpArticle } from './helpData';
import { CATEGORY_ICONS } from './helpSidebarUtils';

export interface HelpArticleListProps {
  articles: HelpArticle[];
  listAriaLabel: string;
  withPreview?: boolean;
  onOpenArticle: (article: HelpArticle) => void;
}

/**
 * Reusable list of help articles for HelpSidebar home, search, and category views.
 */
export const HelpArticleList: React.FC<HelpArticleListProps> = ({
  articles,
  listAriaLabel,
  withPreview = true,
  onOpenArticle,
}) => {
  return (
    <ul className="help-sidebar__list" aria-label={listAriaLabel}>
      {articles.map((article) => {
        const CategoryIcon = CATEGORY_ICONS[article.category];
        return (
          <li key={article.id}>
            <button
              type="button"
              className="help-sidebar__article-button"
              onClick={() => onOpenArticle(article)}
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
};
