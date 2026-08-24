import React from 'react';
const suggestions = [
  { name: 'Dashboard', path: '/dashboard', icon: '📊' },
  { name: 'Payments', path: '/payments', icon: '💳' },
  { name: 'Settings', path: '/settings', icon: '⚙️' },
  { name: 'Help', path: '/help', icon: '❓' },
];
export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="text-center max-w-md">
        <div className="text-6xl mb-4">🔍</div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Page Not Found</h1>
        <p className="text-gray-500 mb-6">The page you are looking for does not exist or has been moved.</p>
        <input placeholder="Search..." className="w-full p-3 border rounded-lg mb-6 focus:ring-2 focus:ring-blue-500 outline-none" />
        <div className="grid grid-cols-2 gap-3 mb-6">
          {suggestions.map(s => (
            <a key={s.path} href={s.path} className="p-3 bg-white border rounded-lg hover:bg-gray-50 text-left flex items-center gap-2">
              <span>{s.icon}</span><span className="text-sm font-medium text-gray-700">{s.name}</span>
            </a>
          ))}
        </div>
        <a href="/" className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium">Back to Home</a>
      </div>
    </div>
  );
}