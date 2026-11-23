import React from 'react';
import { BookOpen, LifeBuoy, Mail, MessageCircle } from 'lucide-react';
import { SUPPORT_HOURS, SUPPORT_URL } from './helpData';

export interface HelpContactFooterProps {
  panelId: string;
}

/**
 * Support contact footer section for HelpSidebar.
 */
export const HelpContactFooter: React.FC<HelpContactFooterProps> = ({ panelId }) => {
  return (
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
          href={SUPPORT_URL}
        >
          <Mail size={16} aria-hidden="true" />
          Report an issue
        </a>
        <a
          className="help-sidebar__contact-link help-sidebar__contact-link--secondary"
          href="https://github.com/Stellabill/stellabill-frontend/tree/main/docs"
          target="_blank"
          rel="noopener noreferrer"
        >
          <BookOpen size={16} aria-hidden="true" />
          Open full docs site
        </a>
      </div>
    </aside>
  );
};
