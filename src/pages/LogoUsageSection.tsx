import Logo from '../components/Branding/Logo';

export default function LogoUsageSection() {
  return (
<section className="space-y-8">
      <h2 className="border-b border-slate-800 pb-2 text-2xl font-semibold">Logo Usage</h2>
      <div className="grid grid-cols-1 gap-12 md:grid-cols-2">
        <div className="space-y-6 rounded-2xl border border-slate-800 bg-slate-900/40 p-8">
          <h3 className="text-sm font-medium uppercase tracking-widest text-slate-400">Standard Variants</h3>
          <div className="space-y-8">
            <div className="flex items-center gap-12">
              <Logo size="md" />
              <span className="text-xs font-mono text-slate-500">Medium (Default)</span>
            </div>
            <div className="flex items-center gap-12">
              <Logo size="lg" />
              <span className="text-xs font-mono text-slate-500">Large (Hero Sections)</span>
            </div>
            <div className="flex items-center gap-12">
              <Logo size="sm" />
              <span className="text-xs font-mono text-slate-500">Small (Footers/Mobile)</span>
            </div>
          </div>
        </div>
        <div className="space-y-6 rounded-2xl border border-slate-800 bg-slate-900/40 p-8">
          <h3 className="text-sm font-medium uppercase tracking-widest text-slate-400">Icon-only Variant</h3>
          <div className="flex flex-wrap items-center gap-8">
            <Logo size="xl" variant="icon" />
            <Logo size="lg" variant="icon" />
            <Logo size="md" variant="icon" />
            <Logo size="sm" variant="icon" />
          </div>
        </div>
      </div>
    </section>
  );
}
