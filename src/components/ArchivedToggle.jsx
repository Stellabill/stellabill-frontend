import React, { useState } from 'react';

const items = [
  { id: 1, name: 'Basic Plan', price: 9.99, status: 'active' },
  { id: 2, name: 'Pro Plan', price: 29.99, status: 'active' },
  { id: 3, name: 'Enterprise 2023', price: 99.99, status: 'archived' },
  { id: 4, name: 'Starter Legacy', price: 4.99, status: 'archived' },
];

export default function ArchivedToggle() {
  const [showArchived, setShowArchived] = useState(false);
  const filtered = showArchived ? items : items.filter(i => i.status === 'active');
  const archivedCount = items.filter(i => i.status === 'archived').length;
  return (
    <div className="p-4">
      <div className="flex justify-between mb-4">
        <h2 className="text-xl font-bold">Plans</h2>
        <button onClick={() => setShowArchived(!showArchived)} className={`px-4 py-2 rounded-lg text-sm font-medium ${showArchived ? 'bg-gray-100' : 'bg-blue-50 text-blue-700'}`}>
          {showArchived ? 'Hide Archived' : `Show Archived (${archivedCount})`}
        </button>
      </div>
      <div className="border rounded-lg overflow-hidden">
        <table className="w-full"><thead className="bg-gray-50"><tr>
          <th className="p-3 text-left text-xs uppercase">Plan</th><th className="p-3 text-left text-xs uppercase">Price</th><th className="p-3 text-left text-xs uppercase">Status</th>
        </tr></thead><tbody>
          {filtered.map(i => (
            <tr key={i.id} className={`border-t ${i.status === 'archived' ? 'opacity-50 bg-gray-50' : ''}`}>
              <td className="p-3 text-sm font-medium">{i.name}</td>
              <td className="p-3 text-sm">USD {i.price.toFixed(2)}</td>
              <td className="p-3"><span className={`px-2 py-1 rounded-full text-xs ${i.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100'}`}>{i.status}</span></td>
            </tr>
          ))}
        </tbody></table>
      </div>
    </div>
  );
}