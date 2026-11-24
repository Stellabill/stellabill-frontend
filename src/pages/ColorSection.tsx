

const colors = [
  { name: 'Cyan (Primary)', hex: '#22d3ee', bg: 'bg-cyan-400' },
  { name: 'Emerald (Primary)', hex: '#14b8a6', bg: 'bg-teal-500' },
  { name: 'Slate (Background)', hex: '#020617', bg: 'bg-slate-950' },
  { name: 'Slate (Secondary)', hex: '#0a0f16', bg: 'bg-[#0a0f16]' },
];

export default function ColorSection() {
  return (
<section className="space-y-8">
      <h2 className="border-b border-slate-800 pb-2 text-2xl font-semibold">Primary Colors</h2>
      <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
        {colors.map((color) => (
          <div key={color.name} className="space-y-3">
            <div className={`h-24 w-full rounded-2xl ${color.bg} border border-white/5 shadow-xl shadow-black/20`}></div>
            <div>
              <p className="text-sm font-medium">{color.name}</p>
              <p className="text-xs font-mono text-slate-500">{color.hex}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
