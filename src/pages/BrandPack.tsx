import React from 'react';
import Logo from '../components/Branding/Logo';
import Icon from '../components/Branding/Icon';
import { EmptyDashboard, NoTransactions } from '../components/Branding/Illustrations';

const BrandPack: React.FC = () => {
  const colors = [
    { name: 'Cyan (Primary)', hex: '#22d3ee', bg: 'bg-cyan-400' },
    { name: 'Emerald (Primary)', hex: '#14b8a6', bg: 'bg-teal-500' },
    { name: 'Slate (Background)', hex: '#020617', bg: 'bg-slate-950' },
    { name: 'Slate (Secondary)', hex: '#0a0f16', bg: 'bg-[#0a0f16]' },
  ];

  const icons = ['Users', 'TrendingUp', 'Activity', 'Shield', 'Settings', 'Zap'] as const;

  return (
    <div className="min-h-screen bg-[#020617] text-slate-100 p-8 md:p-12 font-sans">
      <div className="max-w-5xl mx-auto space-y-16">
        {/* Header */}
        <section className="space-y-4">
          <h1 className="text-4xl font-bold text-white tracking-tight">Stellabill Brand Pack</h1>
          <p className="text-slate-400 text-lg max-w-2xl">
            A comprehensive set of visual guidelines and reusable components to ensure consistency across the Stellabill ecosystem.
          </p>
        </section>

        {/* Logo Section */}
        <section className="space-y-8">
          <h2 className="text-2xl font-semibold border-b border-slate-800 pb-2">Logo Usage</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div className="space-y-6 bg-slate-900/40 p-8 rounded-2xl border border-slate-800">
              <h3 className="text-sm font-medium text-slate-400 uppercase tracking-widest">Standard Variants</h3>
              <div className="space-y-8">
                <div className="flex items-center gap-12">
                  <Logo size="md" />
                  <span className="text-xs text-slate-500 font-mono">Medium (Default)</span>
                </div>
                <div className="flex items-center gap-12">
                  <Logo size="lg" />
                  <span className="text-xs text-slate-500 font-mono">Large (Hero Sections)</span>
                </div>
                <div className="flex items-center gap-12">
                  <Logo size="sm" />
                  <span className="text-xs text-slate-500 font-mono">Small (Footers/Mobile)</span>
                </div>
              </div>
            </div>
            <div className="space-y-6 bg-slate-900/40 p-8 rounded-2xl border border-slate-800">
              <h3 className="text-sm font-medium text-slate-400 uppercase tracking-widest">Icon-only Variant</h3>
              <div className="flex flex-wrap items-center gap-8">
                <Logo size="xl" variant="icon" />
                <Logo size="lg" variant="icon" />
                <Logo size="md" variant="icon" />
                <Logo size="sm" variant="icon" />
              </div>
            </div>
          </div>
        </section>

        {/* Color Palette */}
        <section className="space-y-8">
          <h2 className="text-2xl font-semibold border-b border-slate-800 pb-2">Primary Colors</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {colors.map((color) => (
              <div key={color.name} className="space-y-3">
                <div className={`h-24 w-full rounded-2xl ${color.bg} border border-white/5 shadow-xl shadow-black/20`}></div>
                <div>
                  <p className="text-sm font-medium">{color.name}</p>
                  <p className="text-xs text-slate-500 font-mono">{color.hex}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Iconography */}
        <section className="space-y-8">
          <h2 className="text-2xl font-semibold border-b border-slate-800 pb-2">Iconography</h2>
          <div className="flex flex-wrap gap-8 bg-slate-900/40 p-10 rounded-2xl border border-slate-800">
            {icons.map((icon) => (
              <div key={icon} className="flex flex-col items-center gap-3">
                <div className="p-4 bg-slate-950 rounded-xl text-cyan-400 border border-slate-800 hover:border-cyan-500/50 transition-all cursor-pointer">
                  <Icon name={icon} size={28} />
                </div>
                <span className="text-xs text-slate-500 font-mono">{icon}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Illustrations */}
        <section className="space-y-8">
          <h2 className="text-2xl font-semibold border-b border-slate-800 pb-2">Illustration Style</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div className="flex flex-col items-center gap-6 bg-slate-950 p-12 rounded-2xl border border-slate-800 shadow-2xl">
              <EmptyDashboard size={240} />
              <div className="text-center">
                <h4 className="font-semibold text-slate-200">Empty Dashboard Pattern</h4>
                <p className="text-xs text-slate-500 mt-1">Orbital and diamond geometric forms</p>
              </div>
            </div>
            <div className="flex flex-col items-center gap-6 bg-slate-950 p-12 rounded-2xl border border-slate-800 shadow-2xl">
              <NoTransactions size={240} />
              <div className="text-center">
                <h4 className="font-semibold text-slate-200">No Transactions Pattern</h4>
                <p className="text-xs text-slate-500 mt-1">Schematic and technical UI elements</p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default BrandPack;
