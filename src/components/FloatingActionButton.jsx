import React, { useState } from 'react';

const actions = [{ label: 'New', icon: '➕' }, { label: 'Scan', icon: '📷' }, { label: 'Share', icon: '📤' }];

export default function FloatingActionButton() {
  const [open, setOpen] = useState(false);
  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2">
      {open && actions.map(a => (
        <button key={a.label} onClick={() => setOpen(false)} className="flex items-center gap-2 px-4 py-3 bg-white shadow-lg rounded-xl hover:bg-gray-50 text-sm font-medium">
          <span>{a.icon}</span><span>{a.label}</span>
        </button>
      ))}
      <button onClick={() => setOpen(!open)} className="w-14 h-14 bg-blue-600 text-white rounded-2xl shadow-lg hover:bg-blue-700 text-2xl flex items-center justify-center">
        {open ? '✕' : '+'}
      </button>
    </div>
  );
}