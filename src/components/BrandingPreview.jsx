import React, { useState } from 'react';

export default function BrandingPreview() {
  const [tab, setTab] = useState('invoice');
  const brand = { name: 'Acme Co', logo: '🏦', color: '#2563EB' };
  const tabs = ['Invoice', 'Payment', 'Email', 'Receipt'];
  return (
    <div className="max-w-2xl mx-auto p-4">
      <h2 className="text-xl font-bold mb-4">Branding Preview</h2>
      <div className="bg-white border rounded-xl overflow-hidden">
        <div className="flex border-b">{tabs.map(t => (
          <button key={t} onClick={() => setTab(t.toLowerCase())} className={`px-4 py-3 text-sm font-medium border-b-2 ${tab === t.toLowerCase() ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500'}`}>{t}</button>
        ))}</div>
        <div className="p-6">
          {tab === 'invoice' && (
            <div className="border rounded-lg p-6">
              <div className="flex items-center justify-between mb-4"><span className="text-3xl">{brand.logo}</span><h3 className="font-bold">{brand.name}</h3></div>
              <div className="border-t pt-4"><div className="flex justify-between text-sm mb-2"><span>Subscription</span><span>USD 29.99</span></div>
              <div className="flex justify-between text-sm mb-2"><span>Tax</span><span>USD 3.00</span></div>
              <div className="flex justify-between font-bold border-t pt-2"><span>Total</span><span style={{color: brand.color}}>USD 32.99</span></div></div>
            </div>
          )}
          {tab === 'payment' && (
            <div className="border rounded-lg p-6 max-w-sm mx-auto">
              <div className="text-center mb-4"><span className="text-3xl">{brand.logo}</span><h3 className="font-bold" style={{color: brand.color}}>{brand.name}</h3></div>
              <input placeholder="Card number" className="w-full p-3 border rounded-lg mb-2" />
              <div className="flex gap-2 mb-4"><input placeholder="MM/YY" className="flex-1 p-3 border rounded-lg" /><input placeholder="CVC" className="w-20 p-3 border rounded-lg" /></div>
              <button className="w-full py-3 text-white font-medium rounded-lg" style={{backgroundColor: brand.color}}>Pay USD 32.99</button>
            </div>
          )}
          {tab === 'email' && (
            <div className="border rounded-lg overflow-hidden max-w-sm">
              <div className="p-4" style={{backgroundColor: brand.color}}><div className="flex items-center gap-2"><span>{brand.logo}</span><span className="text-white font-bold">{brand.name}</span></div></div>
              <div className="p-4"><h3 className="font-bold">Your invoice is ready</h3><p className="text-gray-500 text-sm mb-3">Invoice #INV-001 for USD 32.99</p>
              <button className="px-4 py-2 text-white rounded-lg text-sm" style={{backgroundColor: brand.color}}>View Invoice</button></div>
            </div>
          )}
          {tab === 'receipt' && (
            <div className="border rounded-lg p-5 max-w-xs mx-auto text-center"><span className="text-3xl">✅</span>
            <h3 className="font-bold text-green-700 mt-2">Payment Successful</h3>
            <div className="mt-4 space-y-1 text-sm"><div className="flex justify-between"><span className="text-gray-500">Amount</span><span>USD 32.99</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Date</span><span>Jan 15, 2024</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Receipt</span><span>RCP-001</span></div></div></div>
          )}
        </div>
      </div>
    </div>
  );
}