export interface HelpArticle {
  id: string;
  title: string;
  content: string;
  keywords: string[];
  category: 'Getting Started' | 'Billing' | 'Subscriptions' | 'Plans' | 'Settings' | 'Troubleshooting';
}

export interface RouteHelpContext {
  routePattern: string;
  pageTitle: string;
  topAnswerIds: string[];
}

export const helpArticles: HelpArticle[] = [
  {
    id: 'gs-welcome',
    title: 'Welcome to Stellarbill',
    content:
      'Stellarbill is a crypto-native billing platform. Connect your wallet to get started, create plans, and subscribe customers using USDC on Stellar.',
    keywords: ['welcome', 'intro', 'getting started', 'overview', 'about'],
    category: 'Getting Started',
  },
  {
    id: 'gs-connect-wallet',
    title: 'Connecting your wallet',
    content:
      'Click "Connect wallet" in the top-right corner and choose Freighter. Approve the connection in the extension popup. You only need to connect once per browser session.',
    keywords: ['wallet', 'connect', 'freighter', 'login', 'sign in', 'setup'],
    category: 'Getting Started',
  },
  {
    id: 'gs-onboarding',
    title: 'Completing the onboarding flow',
    content:
      'After connecting your wallet, provide your business details (name, website, industry) and configure a payout method. Once both steps are approved you can begin creating plans.',
    keywords: ['onboarding', 'business', 'payout', 'setup', 'register', 'signup'],
    category: 'Getting Started',
  },

  {
    id: 'billing-prepaid',
    title: 'Understanding prepaid balances',
    content:
      'Prepaid balances are credited in advance for each subscription. Usage is drawn from the balance during the billing period. Top up from the wallet dropdown or subscription detail view.',
    keywords: ['prepaid', 'balance', 'credit', 'top up', 'usage', 'drawdown'],
    category: 'Billing',
  },
  {
    id: 'billing-usage',
    title: 'How usage-based billing works',
    content:
      'Metered usage is aggregated per billing period and charged against the prepaid balance at period end. You can review line-item usage under "Usage this period" on the subscription detail page.',
    keywords: ['usage', 'metered', 'billing', 'period', 'line item'],
    category: 'Billing',
  },
  {
    id: 'billing-invoices',
    title: 'Downloading invoices and receipts',
    content:
      'Receipts are available in the "Past periods" section of each subscription. Click the preview icon to view or print a receipt as a PDF.',
    keywords: ['invoice', 'receipt', 'download', 'pdf', 'past period', 'tax'],
    category: 'Billing',
  },
  {
    id: 'billing-failed-charge',
    title: 'Fixing a failed charge',
    content:
      'When a charge fails we alert you via the Notifications Center. Navigate to the subscription, update your payment method or top up your prepaid balance, then click "Retry payment".',
    keywords: ['failed', 'charge', 'declined', 'retry', 'payment', 'dunning'],
    category: 'Billing',
  },

  {
    id: 'sub-create',
    title: 'Creating a subscription',
    content:
      'Customers subscribe through the public "Browse Plans" page. Share the direct plan link or embed the checkout into your site using the embedded flow.',
    keywords: ['subscription', 'create', 'customer', 'checkout', 'embed'],
    category: 'Subscriptions',
  },
  {
    id: 'sub-pause',
    title: 'Pausing and resuming subscriptions',
    content:
      'Open a subscription, click "Pause", and select a resume date (or indefinite). Pausing stops the next scheduled charge but keeps the subscription active. Click "Resume" to reactivate billing.',
    keywords: ['pause', 'resume', 'suspend', 'hold', 'freeze', 'stop billing'],
    category: 'Subscriptions',
  },
  {
    id: 'sub-cancel',
    title: 'Canceling a subscription',
    content:
      'From the subscription detail page, scroll to the "Danger zone" and click "Cancel subscription". You must confirm the action. Cancellations take effect at the end of the current billing period.',
    keywords: ['cancel', 'terminate', 'end', 'danger zone', 'churn'],
    category: 'Subscriptions',
  },
  {
    id: 'sub-upgrade',
    title: 'Upgrading or downgrading a plan',
    content:
      'Click "Change plan" on the subscription detail. The upgrade wizard shows feature comparisons and a proration preview so you know exactly what will change before you confirm.',
    keywords: ['upgrade', 'downgrade', 'change plan', 'proration', 'switch'],
    category: 'Subscriptions',
  },

  {
    id: 'plan-create',
    title: 'Creating a billing plan',
    content:
      'Go to Plans → Create plan. Choose a billing type (flat or usage-based), set the price and billing cadence, add features, and publish. Plans are immediately visible in Browse Plans once published.',
    keywords: ['plan', 'create', 'pricing', 'billing type', 'publish'],
    category: 'Plans',
  },
  {
    id: 'plan-types',
    title: 'Flat-rate vs usage-based plans',
    content:
      'Flat-rate plans charge a fixed amount per cycle. Usage-based plans combine a base seat price with metered units reported via the API. Combine both for hybrid pricing models.',
    keywords: ['flat rate', 'usage based', 'metered', 'hybrid', 'seat price'],
    category: 'Plans',
  },
  {
    id: 'plan-browse',
    title: 'Browsing and sharing plan catalogs',
    content:
      'The Browse Plans page is a public-facing catalog. Copy the URL from the address bar and share it with prospects, or link directly from your marketing site.',
    keywords: ['browse', 'catalog', 'share', 'public', 'prospect'],
    category: 'Plans',
  },

  {
    id: 'settings-org',
    title: 'Updating organization settings',
    content:
      'Open Settings → Organization to edit your display name, website, support email, and tax identifiers. Changes apply to all invoices and receipts generated after the update.',
    keywords: ['settings', 'organization', 'profile', 'tax', 'support email'],
    category: 'Settings',
  },
  {
    id: 'settings-api-keys',
    title: 'Managing API keys',
    content:
      'Create and revoke publishable and secret keys under Settings → API Keys. Rotate secret keys quarterly and never expose them in client-side code.',
    keywords: ['api', 'keys', 'secret', 'publishable', 'rotate', 'credentials'],
    category: 'Settings',
  },
  {
    id: 'settings-billing',
    title: 'Configuring billing and payout settings',
    content:
      'Settings → Billing lets you configure default dunning retry schedules, tax behaviour, and the Stellar payout address. Payouts are settled automatically on your chosen cadence.',
    keywords: ['billing settings', 'payout', 'dunning', 'retry', 'tax', 'stellar'],
    category: 'Settings',
  },
  {
    id: 'settings-tags',
    title: 'Using tags and custom metadata',
    content:
      'Apply tags to subscriptions to organize reporting. Tag colors sync across dashboards, subscriptions, and exports. Use the "Manage tags" dialog in Settings to rename or archive tags.',
    keywords: ['tags', 'metadata', 'labels', 'organize', 'reporting'],
    category: 'Settings',
  },

  {
    id: 'tr-accessibility',
    title: 'Keyboard shortcuts and accessibility',
    content:
      'Press ? anywhere to view all shortcuts. Highlights: Cmd/Ctrl+K opens the command palette, Esc closes overlays, and Tab/Shift+Tab follow the focus ring in compliance with WCAG 2.1 AA.',
    keywords: ['keyboard', 'shortcut', 'accessibility', 'a11y', 'wcag', 'focus'],
    category: 'Troubleshooting',
  },
  {
    id: 'tr-errors',
    title: 'Common error messages explained',
    content:
      '"Insufficient balance" means top up your prepaid wallet. "Wallet rejected" means Freighter denied the signature — reopen and approve. "Plan archived" means the plan is no longer purchasable; create a new version.',
    keywords: ['error', 'troubleshoot', 'insufficient', 'rejected', 'archived'],
    category: 'Troubleshooting',
  },
  {
    id: 'tr-support',
    title: 'When to contact support',
    content:
      'Reach out if you see a red error banner that persists after refresh, a charge that double-processed, or an accessibility blocker that prevents you from completing a task.',
    keywords: ['support', 'help', 'contact', 'bug', 'error'],
    category: 'Troubleshooting',
  },
];

export const routeHelpContexts: RouteHelpContext[] = [
  {
    routePattern: '/dashboard',
    pageTitle: 'Dashboard',
    topAnswerIds: ['gs-welcome', 'billing-prepaid', 'gs-connect-wallet'],
  },
  {
    routePattern: '/subscriptions',
    pageTitle: 'Subscriptions list',
    topAnswerIds: ['sub-create', 'sub-pause', 'sub-cancel'],
  },
  {
    routePattern: '/subscriptions/:id',
    pageTitle: 'Subscription detail',
    topAnswerIds: ['sub-pause', 'sub-cancel', 'sub-upgrade', 'billing-usage', 'billing-invoices'],
  },
  {
    routePattern: '/subscriptions/:id/usage',
    pageTitle: 'Usage billing',
    topAnswerIds: ['billing-usage', 'billing-prepaid', 'billing-invoices'],
  },
  {
    routePattern: '/plans',
    pageTitle: 'Plans',
    topAnswerIds: ['plan-create', 'plan-types', 'plan-browse'],
  },
  {
    routePattern: '/plans/create',
    pageTitle: 'Create a plan',
    topAnswerIds: ['plan-create', 'plan-types'],
  },
  {
    routePattern: '/plans/new',
    pageTitle: 'Create a plan',
    topAnswerIds: ['plan-create', 'plan-types'],
  },
  {
    routePattern: '/browse-plans',
    pageTitle: 'Browse plans',
    topAnswerIds: ['plan-browse', 'plan-types', 'sub-create'],
  },
  {
    routePattern: '/settings',
    pageTitle: 'Settings',
    topAnswerIds: ['settings-org', 'settings-api-keys', 'settings-billing', 'settings-tags'],
  },
  {
    routePattern: '/ui-kit',
    pageTitle: 'UI kit',
    topAnswerIds: ['tr-accessibility', 'gs-welcome'],
  },
  {
    routePattern: '/brand',
    pageTitle: 'Brand pack',
    topAnswerIds: ['gs-welcome', 'tr-accessibility'],
  },
];

export const SUPPORT_EMAIL = 'support@stellarbill.example';
export const SUPPORT_HOURS = 'Monday–Friday, 9:00–18:00 UTC';

export function findRouteContext(pathname: string): RouteHelpContext | undefined {
  for (const ctx of routeHelpContexts) {
    if (ctx.routePattern === pathname) return ctx;
    const patternSegments = ctx.routePattern.split('/');
    const pathSegments = pathname.split('/');
    if (patternSegments.length !== pathSegments.length) continue;
    const match = patternSegments.every((seg, i) =>
      seg.startsWith(':') ? true : seg === pathSegments[i]
    );
    if (match) return ctx;
  }
  return undefined;
}

export function getTopArticles(pathname: string): HelpArticle[] {
  const ctx = findRouteContext(pathname);
  if (!ctx) return [];
  return ctx.topAnswerIds
    .map((id) => helpArticles.find((a) => a.id === id))
    .filter((a): a is HelpArticle => Boolean(a));
}

export function searchArticles(query: string): HelpArticle[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return helpArticles.filter((article) => {
    const haystack = [
      article.title,
      article.content,
      article.category,
      ...article.keywords,
    ]
      .join(' ')
      .toLowerCase();
    return haystack.includes(q);
  });
}
