import { TourStep } from './ProductTour';

export const dashboardTourSteps: TourStep[] = [
  {
    id: 'welcome',
    target: '.dashboard-header',
    title: 'Welcome to Stellarbill!',
    content: 'Let\'s take a quick tour to help you get started with managing your subscriptions. You can skip this anytime and come back later.',
    placement: 'bottom',
    spotlightPadding: 12,
  },
  {
    id: 'kpi-cards',
    target: '.dashboard-kpi-grid',
    title: 'Key Metrics at a Glance',
    content: 'Monitor your subscription performance with these key metrics: active subscriptions, monthly recurring revenue, failed charges, and upcoming renewals.',
    placement: 'bottom',
    spotlightPadding: 16,
  },
  {
    id: 'revenue-chart',
    target: '.dashboard-panel--chart',
    title: 'Track Revenue Growth',
    content: 'Visualize your revenue trends over time. Click "View Detailed Report" to explore more insights.',
    placement: 'top',
    spotlightPadding: 12,
  },
  {
    id: 'activity-feed',
    target: '.dashboard-activity-column',
    title: 'Stay Updated',
    content: 'Keep track of recent activities like payments, new subscriptions, and renewal reminders.',
    placement: 'left',
    spotlightPadding: 12,
  },
  {
    id: 'create-plan',
    target: '.dashboard-action--primary',
    title: 'Create Your First Plan',
    content: 'Ready to start? Click here to create your first subscription plan.',
    placement: 'bottom',
    spotlightPadding: 8,
  },
];

export const plansTourSteps: TourStep[] = [
  {
    id: 'plans-overview',
    target: '.plans-header',
    title: 'Manage Your Plans',
    content: 'This is where you create and manage all your subscription plans.',
    placement: 'bottom',
    spotlightPadding: 12,
  },
  {
    id: 'create-plan-button',
    target: '.plans-create-button',
    title: 'Create a New Plan',
    content: 'Click here to create a new subscription plan with custom pricing and billing intervals.',
    placement: 'left',
    spotlightPadding: 8,
  },
];

export const settingsTourSteps: TourStep[] = [
  {
    id: 'settings-overview',
    target: '.settings-header',
    title: 'Customize Your Settings',
    content: 'Configure your account preferences, payment methods, and notification settings here.',
    placement: 'bottom',
    spotlightPadding: 12,
  },
  {
    id: 'account-section',
    target: '.settings-account',
    title: 'Account Information',
    content: 'Update your business details, contact information, and branding.',
    placement: 'right',
    spotlightPadding: 12,
  },
];

export const navigationTourSteps: TourStep[] = [
  {
    id: 'sidebar',
    target: '.sb-sidebar',
    title: 'Quick Navigation',
    content: 'Use this sidebar to quickly navigate between Dashboard, Subscriptions, Plans, and Settings.',
    placement: 'right',
    spotlightPadding: 16,
  },
  {
    id: 'command-palette',
    target: '.cmdk-trigger',
    title: 'Command Palette',
    content: 'Press ⌘K (or Ctrl+K) to open the command palette for quick access to any page or action.',
    placement: 'right',
    spotlightPadding: 8,
  },
  {
    id: 'help',
    target: '.sb-sidebar__link:has(.sb-sidebar__link-label:contains("Help"))',
    title: 'Need Help?',
    content: 'Access help documentation, keyboard shortcuts, and support resources anytime.',
    placement: 'right',
    spotlightPadding: 8,
  },
];
