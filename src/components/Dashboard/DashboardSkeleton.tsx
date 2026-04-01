export default function DashboardSkeleton() {
  return (
    <div className="p-8 space-y-8 animate-pulse bg-[#020617] min-h-screen">
      <div className="flex justify-between items-center mb-8">
        <div className="space-y-3">
          <div className="h-8 w-64 bg-slate-800 rounded-lg"></div>
          <div className="h-4 w-48 bg-slate-800/60 rounded"></div>
        </div>
        <div className="flex gap-3">
          <div className="h-10 w-32 bg-slate-800/80 rounded-xl"></div>
          <div className="h-10 w-32 bg-slate-800 rounded-xl"></div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-32 bg-[#0a0f16] border border-slate-800/50 rounded-2xl"></div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="h-8 w-40 bg-slate-800 rounded-lg"></div>
          <div className="h-[360px] bg-[#0a0f16] border border-slate-800/50 rounded-2xl"></div>
        </div>
        <div className="space-y-6">
          <div className="h-8 w-40 bg-slate-800 rounded-lg"></div>
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-20 bg-[#0a0f16] border border-slate-800/50 rounded-2xl"></div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
