import type { Meta } from '@storybook/react';
import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { EmptyState } from '../components/assets/EmptyState';

const meta: Meta = {
  title: 'System/Tokens',
  tags: ['autodocs'],
};

export default meta;

export const Colors = () => (
  <div className="flex flex-col gap-6">
    <h2 className="text-2xl font-bold text-white">Colors</h2>

    <section className="flex flex-col gap-4">
      <h3 className="text-lg font-semibold text-slate-300">Brand</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card variant="glass">
          <div className="flex flex-col gap-3">
            <div className="h-16 w-full rounded-lg bg-gradient-to-r from-cyan-400 to-teal-500" />
            <div className="text-sm">
              <p className="font-medium text-white">Primary Gradient</p>
              <p className="text-slate-400">Cyan-400 → Teal-500</p>
            </div>
          </div>
        </Card>
        <Card variant="glass">
          <div className="flex flex-col gap-3">
            <div className="h-16 w-full rounded-lg bg-red-500/10 border border-red-500/30 flex items-center justify-center">
              <Badge variant="error">Error</Badge>
            </div>
            <div className="text-sm">
              <p className="font-medium text-white">Danger / Error</p>
              <p className="text-slate-400">Red scale</p>
            </div>
          </div>
        </Card>
        <Card variant="glass">
          <div className="flex flex-col gap-3">
            <div className="h-16 w-full rounded-lg bg-green-500/10 border border-green-500/30 flex items-center justify-center">
              <Badge variant="active">Active</Badge>
            </div>
            <div className="text-sm">
              <p className="font-medium text-white">Success / Active</p>
              <p className="text-slate-400">Green scale</p>
            </div>
          </div>
        </Card>
      </div>
    </section>

    <section className="flex flex-col gap-4">
      <h3 className="text-lg font-semibold text-slate-300">Backgrounds</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card variant="glass">
          <div className="flex flex-col gap-3">
            <div className="h-16 w-full rounded-lg bg-[#00060f] border border-white/10" />
            <div className="text-sm">
              <p className="font-medium text-white">Background</p>
              <p className="text-slate-400">#00060f</p>
            </div>
          </div>
        </Card>
        <Card variant="glass">
          <div className="flex flex-col gap-3">
            <div className="h-16 w-full rounded-lg bg-[#1a1a1a] border border-white/10" />
            <div className="text-sm">
              <p className="font-medium text-white">Card Surface</p>
              <p className="text-slate-400">#1a1a1a</p>
            </div>
          </div>
        </Card>
        <Card variant="glass">
          <div className="flex flex-col gap-3">
            <div className="h-16 w-full rounded-lg bg-[#1a1a2e] border border-white/10" />
            <div className="text-sm">
              <p className="font-medium text-white">Sidebar</p>
              <p className="text-slate-400">#1a1a2e</p>
            </div>
          </div>
        </Card>
      </div>
    </section>
  </div>
);

export const Typography = () => (
  <div className="flex flex-col gap-6">
    <h2 className="text-2xl font-bold text-white">Typography</h2>
    <Card variant="glass">
      <div className="flex flex-col gap-4">
        <p className="text-sm font-semibold text-slate-300">Font Families</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-lg font-bold text-white">Display / Heading</p>
            <p className="text-sm text-slate-400">Sora, DM Sans, sans-serif</p>
          </div>
          <div>
            <p className="text-lg font-bold text-white">Body / Content</p>
            <p className="text-sm text-slate-400">DM Sans, Sora, sans-serif</p>
          </div>
        </div>
        <hr className="border-white/10" />
        <p className="text-sm font-semibold text-slate-300">Type Scale</p>
        <div className="flex flex-col gap-3">
          <p className="text-5xl font-bold text-white">Display 5xl</p>
          <p className="text-4xl font-bold text-white">Heading 4xl</p>
          <p className="text-3xl font-bold text-white">Heading 3xl</p>
          <p className="text-2xl font-semibold text-white">Heading 2xl</p>
          <p className="text-xl font-medium text-white">Heading xl</p>
          <p className="text-lg font-medium text-white">Body lg</p>
          <p className="text-base text-slate-200">Body base</p>
          <p className="text-sm text-slate-300">Body sm</p>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Label xs</p>
        </div>
      </div>
    </Card>
  </div>
);

export const Spacing = () => (
  <div className="flex flex-col gap-6">
    <h2 className="text-2xl font-bold text-white">Spacing (8-pt scale)</h2>
    <Card variant="glass">
      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { name: 'space-1', value: '4px', size: 4 },
            { name: 'space-2', value: '8px', size: 8 },
            { name: 'space-4', value: '16px', size: 16 },
            { name: 'space-6', value: '24px', size: 24 },
          ].map(({ name, value, size }) => (
            <div key={name} className="flex flex-col gap-2">
              <div 
                className="bg-cyan-500/20 rounded"
                style={{ width: size * 2, height: size }}
              />
              <p className="text-sm font-medium text-white">{name}</p>
              <p className="text-xs text-slate-400">{value}</p>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
          {[
            { name: 'space-8', value: '32px', size: 32 },
            { name: 'space-12', value: '48px', size: 48 },
            { name: 'space-16', value: '64px', size: 64 },
            { name: 'space-20', value: '80px', size: 80 },
          ].map(({ name, value, size }) => (
            <div key={name} className="flex flex-col gap-2">
              <div 
                className="bg-cyan-500/20 rounded"
                style={{ width: size * 2, height: size }}
              />
              <p className="text-sm font-medium text-white">{name}</p>
              <p className="text-xs text-slate-400">{value}</p>
            </div>
          ))}
        </div>
      </div>
    </Card>
  </div>
);

export const BorderRadius = () => (
  <div className="flex flex-col gap-6">
    <h2 className="text-2xl font-bold text-white">Border Radius</h2>
    <Card variant="glass">
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {[
          { name: 'radius-sm', value: '4px', radius: 4 },
          { name: 'radius-md', value: '8px', radius: 8 },
          { name: 'radius-lg', value: '12px', radius: 12 },
          { name: 'radius-xl', value: '16px', radius: 16 },
          { name: 'radius-full', value: '9999px', radius: 9999 },
        ].map(({ name, value, radius }) => (
          <div key={name} className="flex flex-col gap-3 items-center">
            <div 
              className="h-16 w-16 bg-white/10 border border-white/20 flex items-center justify-center"
              style={{ borderRadius: radius }}
            >
              <span className="text-xs text-slate-400">{radius}px</span>
            </div>
            <p className="text-sm font-medium text-white">{name}</p>
          </div>
        ))}
      </div>
    </Card>
  </div>
);

export const Illustrations = () => (
  <div className="flex flex-col gap-6">
    <h2 className="text-2xl font-bold text-white">Illustration Tokens</h2>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Card variant="glass">
        <div className="flex flex-col gap-4 p-4 rounded bg-[#f1f5f9]" data-theme="light">
          <p className="text-sm font-semibold text-slate-800">Light Theme</p>
          <div className="flex items-center justify-center p-4">
            <EmptyState type="subscriptions" title="No Subscriptions" description="You have no active subscriptions." />
          </div>
        </div>
      </Card>
      <Card variant="glass">
        <div className="flex flex-col gap-4 p-4 rounded bg-[#020617]" data-theme="dark">
          <p className="text-sm font-semibold text-white">Dark Theme</p>
          <div className="flex items-center justify-center p-4">
            <EmptyState type="subscriptions" title="No Subscriptions" description="You have no active subscriptions." />
          </div>
        </div>
      </Card>
    </div>
  </div>
);
