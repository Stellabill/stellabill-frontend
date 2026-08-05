import React, { useState } from 'react';

const widgets = [
  { id: 1, title: 'Revenue', color: 'bg-blue-50', size: 'col-span-2' },
  { id: 2, title: 'Transactions', color: 'bg-green-50', size: '' },
  { id: 3, title: 'Customers', color: 'bg-purple-50', size: '' },
  { id: 4, title: 'Alerts', color: 'bg-orange-50', size: '' },
];

export default function WidgetGrid() {
  const [items, setItems] = useState(widgets);
  const [edit, setEdit] = useState(false);
  return (
    <div className="p-4">
      <div className="flex justify-between mb-4">
        <h2 className="text-xl font-bold">Dashboard</h2>
        <button onClick={() => setEdit(!edit)} className={`px-4 py-2 rounded-lg ${edit ? 'bg-green-600 text-white' : 'bg-gray-100'}`}>
          {edit ? '✓ Done' : '✎ Rearrange'}
        </button>
      </div>
      <div className="grid grid-cols-4 gap-4 auto-rows-[100px]">
        {items.map(w => (
          <div key={w.id} className={`${w.size} ${w.color} rounded-xl border p-4 ${edit ? 'cursor-grab ring-2 ring-blue-400' : ''}`}>
            <h3 className="font-semibold text-sm">{w.title}</h3>
            {edit && <button onClick={() => setItems(items.filter(x => x.id !== w.id))} className="absolute top-1 right-1 text-red-500">✕</button>}
          </div>
        ))}
      </div>
    </div>
  );
}