import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import ProductTour from './ProductTour';
import TourCompletion from './TourCompletion';
import type { TourStep } from './ProductTour';

const meta: Meta<typeof ProductTour> = {
  title: 'Components/ProductTour',
  component: ProductTour,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'A non-blocking product tour component that guides users through key features with spotlight focus and step-by-step tooltips.',
      },
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof ProductTour>;

// Mock page elements for the tour
const MockPage = () => (
  <div style={{ padding: '2rem', minHeight: '100vh', background: '#f8fafc' }}>
    <div className="tour-demo-header" style={{ marginBottom: '2rem', padding: '1.5rem', background: 'white', borderRadius: '1rem', border: '1px solid #e2e8f0' }}>
      <h1 style={{ margin: '0 0 0.5rem', fontSize: '1.5rem', fontWeight: '700' }}>Dashboard</h1>
      <p style={{ margin: 0, color: '#64748b' }}>Welcome to your subscription management dashboard</p>
    </div>

    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
      <div className="tour-demo-kpi-1" style={{ padding: '1.5rem', background: 'white', borderRadius: '1rem', border: '1px solid #e2e8f0' }}>
        <h3 style={{ margin: '0 0 0.5rem', fontSize: '0.875rem', color: '#64748b' }}>Active Subscriptions</h3>
        <p style={{ margin: 0, fontSize: '2rem', fontWeight: '700' }}>1,284</p>
      </div>
      <div className="tour-demo-kpi-2" style={{ padding: '1.5rem', background: 'white', borderRadius: '1rem', border: '1px solid #e2e8f0' }}>
        <h3 style={{ margin: '0 0 0.5rem', fontSize: '0.875rem', color: '#64748b' }}>MRR</h3>
        <p style={{ margin: 0, fontSize: '2rem', fontWeight: '700' }}>$42,500</p>
      </div>
      <div className="tour-demo-kpi-3" style={{ padding: '1.5rem', background: 'white', borderRadius: '1rem', border: '1px solid #e2e8f0' }}>
        <h3 style={{ margin: '0 0 0.5rem', fontSize: '0.875rem', color: '#64748b' }}>Failed Charges</h3>
        <p style={{ margin: 0, fontSize: '2rem', fontWeight: '700' }}>12</p>
      </div>
    </div>

    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem' }}>
      <div className="tour-demo-chart" style={{ padding: '1.5rem', background: 'white', borderRadius: '1rem', border: '1px solid #e2e8f0', minHeight: '300px' }}>
        <h3 style={{ margin: '0 0 1rem', fontSize: '1rem', fontWeight: '600' }}>Revenue Growth</h3>
        <div style={{ height: '200px', background: '#f1f5f9', borderRadius: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
          Chart Placeholder
        </div>
      </div>
      <div className="tour-demo-activity" style={{ padding: '1.5rem', background: 'white', borderRadius: '1rem', border: '1px solid #e2e8f0' }}>
        <h3 style={{ margin: '0 0 1rem', fontSize: '1rem', fontWeight: '600' }}>Recent Activity</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div style={{ padding: '0.75rem', background: '#f8fafc', borderRadius: '0.5rem' }}>Payment received</div>
          <div style={{ padding: '0.75rem', background: '#f8fafc', borderRadius: '0.5rem' }}>New subscription</div>
          <div style={{ padding: '0.75rem', background: '#f8fafc', borderRadius: '0.5rem' }}>Plan updated</div>
        </div>
      </div>
    </div>

    <button
      className="tour-demo-cta"
      style={{
        marginTop: '2rem',
        padding: '0.75rem 2rem',
        background: 'linear-gradient(90deg, #067d99 0%, #0f766e 100%)',
        color: 'white',
        border: 'none',
        borderRadius: '0.75rem',
        fontWeight: '600',
        cursor: 'pointer',
      }}
    >
      Create Your First Plan
    </button>
  </div>
);

// Demo steps
const demoSteps: TourStep[] = [
  {
    id: 'welcome',
    target: '.tour-demo-header',
    title: 'Welcome to Stellarbill! 👋',
    content: 'Let\'s take a quick tour to help you get started with managing your subscriptions. You can skip this anytime and come back later.',
    placement: 'bottom',
    spotlightPadding: 12,
  },
  {
    id: 'kpis',
    target: '.tour-demo-kpi-1',
    title: 'Key Metrics at a Glance',
    content: 'Monitor your most important metrics here: active subscriptions, monthly recurring revenue, and failed charges.',
    placement: 'bottom',
    spotlightPadding: 8,
  },
  {
    id: 'chart',
    target: '.tour-demo-chart',
    title: 'Track Revenue Growth',
    content: 'Visualize your revenue trends over time. This helps you understand business performance and make data-driven decisions.',
    placement: 'top',
    spotlightPadding: 12,
  },
  {
    id: 'activity',
    target: '.tour-demo-activity',
    title: 'Stay Updated',
    content: 'Keep track of recent activities like payments, new subscriptions, and plan changes—all in one place.',
    placement: 'left',
    spotlightPadding: 12,
  },
  {
    id: 'cta',
    target: '.tour-demo-cta',
    title: 'Ready to Get Started?',
    content: 'Click here to create your first subscription plan and start accepting payments.',
    placement: 'top',
    spotlightPadding: 8,
    action: {
      label: 'Create Plan',
      onClick: () => alert('Navigating to plan creation...'),
    },
  },
];

// Interactive wrapper component
const TourWrapper = ({ steps }: { steps: TourStep[] }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showCompletion, setShowCompletion] = useState(false);

  return (
    <>
      <MockPage />
      <button
        onClick={() => setIsOpen(true)}
        style={{
          position: 'fixed',
          bottom: '2rem',
          right: '2rem',
          padding: '1rem 2rem',
          background: '#067d99',
          color: 'white',
          border: 'none',
          borderRadius: '0.75rem',
          fontWeight: '600',
          cursor: 'pointer',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        }}
      >
        Start Tour
      </button>

      <ProductTour
        steps={steps}
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onComplete={() => {
          setIsOpen(false);
          setShowCompletion(true);
        }}
        onDismiss={() => {
          setIsOpen(false);
          console.log('Tour dismissed');
        }}
      />

      <TourCompletion
        isOpen={showCompletion}
        onClose={() => setShowCompletion(false)}
      />
    </>
  );
};

export const Default: Story = {
  render: () => <TourWrapper steps={demoSteps} />,
};

export const SingleStep: Story = {
  render: () => (
    <TourWrapper
      steps={[
        {
          id: 'single',
          target: '.tour-demo-header',
          title: 'Welcome!',
          content: 'This is a single-step tour.',
          placement: 'bottom',
        },
      ]}
    />
  ),
};

export const WithAction: Story = {
  render: () => (
    <TourWrapper
      steps={[
        {
          id: 'action',
          target: '.tour-demo-cta',
          title: 'Custom Action',
          content: 'This step includes a custom action button.',
          placement: 'top',
          action: {
            label: 'Try It',
            onClick: () => alert('Custom action clicked!'),
          },
        },
      ]}
    />
  ),
};

export const DifferentPlacements: Story = {
  render: () => (
    <TourWrapper
      steps={[
        {
          id: 'top',
          target: '.tour-demo-cta',
          title: 'Top Placement',
          content: 'Tooltip positioned above the target.',
          placement: 'top',
        },
        {
          id: 'bottom',
          target: '.tour-demo-header',
          title: 'Bottom Placement',
          content: 'Tooltip positioned below the target.',
          placement: 'bottom',
        },
        {
          id: 'left',
          target: '.tour-demo-activity',
          title: 'Left Placement',
          content: 'Tooltip positioned to the left.',
          placement: 'left',
        },
        {
          id: 'right',
          target: '.tour-demo-kpi-1',
          title: 'Right Placement',
          content: 'Tooltip positioned to the right.',
          placement: 'right',
        },
      ]}
    />
  ),
};

export const CompletionCelebration: Story = {
  render: () => {
    const [isOpen, setIsOpen] = useState(true);
    return (
      <div style={{ padding: '2rem' }}>
        <button
          onClick={() => setIsOpen(true)}
          style={{
            padding: '1rem 2rem',
            background: '#067d99',
            color: 'white',
            border: 'none',
            borderRadius: '0.75rem',
            fontWeight: '600',
            cursor: 'pointer',
          }}
        >
          Show Completion
        </button>
        <TourCompletion
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          title="Tour Complete! 🎉"
          message="You've successfully completed the product tour. You're now ready to use all features."
          actionLabel="Let's go!"
        />
      </div>
    );
  },
};

export const Accessibility: Story = {
  render: () => <TourWrapper steps={demoSteps} />,
  parameters: {
    docs: {
      description: {
        story: `
### Accessibility Features

This component is fully WCAG 2.1 AA compliant:

- ✅ Keyboard navigation (Tab, Shift+Tab, Escape, Enter)
- ✅ Screen reader announcements
- ✅ Focus trap within tooltip
- ✅ Focus restoration on close
- ✅ Proper ARIA labels and roles
- ✅ High contrast spotlight ring
- ✅ Reduced motion support
- ✅ Minimum touch target sizes (44×44px)

**Try it:**
- Press Tab to navigate between buttons
- Press Escape to close the tour
- Use arrow keys are supported within button groups
        `,
      },
    },
  },
};

export const ResponsiveDemo: Story = {
  render: () => <TourWrapper steps={demoSteps} />,
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
    docs: {
      description: {
        story: 'The tour adapts to different screen sizes. Try resizing the viewport to see how the tooltip and spotlight adjust.',
      },
    },
  },
};
