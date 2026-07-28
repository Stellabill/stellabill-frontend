import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';
import { Button } from '../components/common/Button';
import { IconButton } from '../components/common/IconButton';
import Tag from '../components/Tag';
import { Bell, Settings, Home, Search, Sparkles } from 'lucide-react';
import '../styles/tokens.css';
import '../styles/theme.css';
import '../styles/sidebar.css';

const meta: Meta = {
  title: 'System/FocusRingMatrix',
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Dark-mode focus ring contrast matrix demonstrating WCAG 2.1 AA compliant 3:1 non-text contrast focus indicators with elevated saturation and outer halo effect across base, card, modal, and toast surfaces.',
      },
    },
  },
};

export default meta;

export const ContrastMatrix: StoryObj = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem', padding: '1.5rem' }}>
      <div>
        <h2 style={{ fontSize: '1.75rem', fontWeight: 'bold', marginBottom: '0.5rem', color: 'var(--color-text-primary)' }}>
          Focus Ring Contrast Matrix (Dark & Light Mode)
        </h2>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.95rem' }}>
          Validates --focus-ring (#22d3ee), --focus-ring-elevated (#38bdf8), --focus-ring-inverse (#00060f / #ffffff), and --focus-ring-halo across card, modal, toast, and base surfaces.
        </p>
      </div>

      {/* Dark Theme Matrix */}
      <section data-theme="dark" style={{ background: '#00060f', padding: '1.5rem', borderRadius: '1rem', border: '1px solid rgba(255,255,255,0.1)' }}>
        <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#f8fafc', marginBottom: '1rem' }}>
          Dark Mode Surfaces (Elevated Saturation & Subtle Outer Halo)
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
          {/* Base Surface */}
          <div style={{ background: '#00060f', padding: '1.25rem', borderRadius: '0.75rem', border: '1px solid rgba(148,163,184,0.2)' }}>
            <h4 style={{ fontSize: '0.9rem', color: '#94a3b8', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              1. Base Surface (#00060f)
            </h4>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center' }}>
              <Button variant="primary">Button</Button>
              <IconButton icon={<Bell size={18} />} aria-label="Notifications" variant="secondary" />
              <Tag label="Active" color="blue" removable />
              <a href="#test" className="sb-sidebar__link" style={{ padding: '0.5rem 0.75rem' }}>
                <Home className="sb-sidebar__icon" />
                <span>NavItem</span>
              </a>
            </div>
          </div>

          {/* Card Surface */}
          <div style={{ background: '#0a0f16', padding: '1.25rem', borderRadius: '0.75rem', border: '1px solid rgba(148,163,184,0.2)' }}>
            <h4 style={{ fontSize: '0.9rem', color: '#94a3b8', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              2. Card Surface (#0a0f16)
            </h4>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center' }}>
              <Button variant="outline">Card Action</Button>
              <IconButton icon={<Settings size={18} />} aria-label="Settings" variant="elevated" />
              <Tag label="Pending" color="yellow" removable />
              <a href="#test2" className="sb-sidebar__link" style={{ padding: '0.5rem 0.75rem' }}>
                <Search className="sb-sidebar__icon" />
                <span>NavItem</span>
              </a>
            </div>
          </div>

          {/* Modal Surface */}
          <div style={{ background: '#0f172a', padding: '1.25rem', borderRadius: '0.75rem', border: '1px solid rgba(148,163,184,0.3)' }}>
            <h4 style={{ fontSize: '0.9rem', color: '#94a3b8', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              3. Modal Surface (#0f172a)
            </h4>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center' }}>
              <Button variant="ghost">Modal Cancel</Button>
              <IconButton icon={<Sparkles size={18} />} aria-label="Features" variant="primary" />
              <Tag label="Critical" color="red" removable />
              <a href="#test3" className="sb-sidebar__link" style={{ padding: '0.5rem 0.75rem' }}>
                <Home className="sb-sidebar__icon" />
                <span>NavItem</span>
              </a>
            </div>
          </div>

          {/* Toast Surface */}
          <div style={{ background: '#111827', padding: '1.25rem', borderRadius: '0.75rem', border: '1px solid rgba(56,189,248,0.3)', boxShadow: '0 8px 24px rgba(0,0,0,0.4)' }}>
            <h4 style={{ fontSize: '0.9rem', color: '#94a3b8', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              4. Toast Surface (#111827)
            </h4>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center' }}>
              <Button variant="secondary">Toast Action</Button>
              <IconButton icon={<Bell size={18} />} aria-label="Alerts" variant="inverse" />
              <Tag label="Success" color="green" removable />
            </div>
          </div>
        </div>
      </section>

      {/* Light Theme Matrix */}
      <section data-theme="light" style={{ background: '#f8fafc', padding: '1.5rem', borderRadius: '1rem', border: '1px solid #cbd5e1', color: '#0f172a' }}>
        <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#0f172a', marginBottom: '1rem' }}>
          Light Mode Surfaces
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
          <div style={{ background: '#ffffff', padding: '1.25rem', borderRadius: '0.75rem', border: '1px solid #e2e8f0' }}>
            <h4 style={{ fontSize: '0.9rem', color: '#64748b', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Card & Base Surface
            </h4>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center' }}>
              <Button variant="primary">Light Button</Button>
              <IconButton icon={<Bell size={18} />} aria-label="Notifications" variant="secondary" />
              <Tag label="Tag" color="purple" removable />
            </div>
          </div>
        </div>
      </section>
    </div>
  ),
};
