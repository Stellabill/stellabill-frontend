import React from 'react';
import { ChevronLeft } from 'lucide-react';
import { HelpArticle, helpArticles } from './helpData';
import { CATEGORY_ICONS, getRelatedArticles } from './helpSidebarUtils';

export interface HelpArticleDetailProps {
  panelId: string;
  article: HelpArticle;
  onGoHome: () => void;
  onOpenArticle: (article: HelpArticle) => void;
}

/**
 * Article detail view with back navigation and related articles for HelpSidebar.
 */
export const HelpArticleDetail: React.FC<HelpArticleDetailProps> = ({
  panelId,
  article,
  onGoHome,
  onOpenArticle,
}) => {
  const CatIcon = CATEGORY_ICONS[article.category];
  const similar = getRelatedArticles(helpArticles, article);

  return (
    <>
      <div className="help-sidebar__detail-header">
        <button
          type="button"
          className="help-sidebar__back-button"
          onClick={onGoHome}
        >
          <ChevronLeft size={16} aria-hidden="true" />
          Back to help
        </button>
      </div>
      <article className="help-sidebar__detail" aria-labelledby={`${panelId}-article-title`}>
        <span className="help-sidebar__detail-category">
          <CatIcon size={12} aria-hidden="true" />
          {article.category}
        </span>
        <h2 id={`${panelId}-article-title`}>{article.title}</h2>
        <p>{article.content}</p>

        {similar.length > 0 && (
          <div className="help-sidebar__detail-actions">
            <span className="help-sidebar__detail-actions-label">
              Related articles
            </span>
            {similar.map((s) => {
              const SimilarIcon = CATEGORY_ICONS[s.category];
              return (
                <button
                  key={s.id}
                  type="button"
                  className="help-sidebar__article-button"
                  onClick={() => onOpenArticle(s)}
                >
                  <div className="help-sidebar__article-meta">
                    <SimilarIcon size={12} aria-hidden="true" />
                    <span>{s.category}</span>
                  </div>
                  <h3 className="help-sidebar__article-title">{s.title}</h3>
                </button>
              );
            })}
          </div>
        )}
      </article>
    </>
  );
};
