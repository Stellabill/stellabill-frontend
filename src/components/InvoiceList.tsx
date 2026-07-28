import React, { useState } from 'react';
import InvoicePreviewModal from './InvoicePreviewModal';

type Invoice = {
  id: string;
  date: string;
  status: "paid" | "pending" | "failed";
  total: string;
  currency: string;
};

type Props = {
  invoices: Invoice[];
};

export default function InvoiceList({ invoices }: Props) {
  const [previewId, setPreviewId] = useState<string | null>(null);

  return (
    <div>
      {/* ================= DESKTOP TABLE ================= */}
      <div className="hidden md:block">
        <table className="w-full border border-gray-300 rounded-lg overflow-hidden">
          <thead className="bg-gray-100 text-left">
            <tr>
              <th className="p-3">Invoice</th>
              <th className="p-3">Date</th>
              <th className="p-3">Status</th>
              <th className="p-3">Total</th>
              <th className="p-3"></th>
            </tr>
          </thead>

          <tbody>
            {invoices.map((inv) => (
              <tr key={inv.id} className="border-t">
                <td className="p-3 font-medium">{inv.id}</td>
                <td className="p-3">{inv.date}</td>

                <td className="p-3">
                  <span
                    className={`px-2 py-1 rounded text-sm ${
                      inv.status === "paid"
                        ? "bg-green-100 text-green-700"
                        : inv.status === "pending"
                        ? "bg-yellow-100 text-yellow-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {inv.status}
                  </span>
                </td>

                <td className="p-3">
                  {inv.total} {inv.currency}
                </td>

                <td className="p-3">
                  <button
                    className="text-blue-600 hover:underline mr-4"
                    aria-label={`Preview invoice ${inv.id}`}
                    onClick={() => setPreviewId(inv.id)}
                  >
                    Preview
                  </button>
                  <button
                    className="text-blue-600 hover:underline"
                    aria-label={`Download invoice ${inv.id}`}
                  >
                    Download
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ================= MOBILE CARDS ================= */}
      <div className="md:hidden space-y-3">
        {invoices.map((inv) => (
          <div
            key={inv.id}
            className="border p-4 rounded-lg shadow-sm bg-white"
          >
            <div className="flex justify-between items-center">
              <span className="font-semibold">{inv.id}</span>
              <span
                className={`px-2 py-1 text-xs rounded ${
                  inv.status === "paid"
                    ? "bg-green-100 text-green-700"
                    : inv.status === "pending"
                    ? "bg-yellow-100 text-yellow-700"
                    : "bg-red-100 text-red-700"
                }`}
              >
                {inv.status}
              </span>
            </div>

            <div className="mt-2 text-sm text-gray-600">
              Date: {inv.date}
            </div>

            <div className="mt-1 font-medium">
              {inv.total} {inv.currency}
            </div>

            <div className="mt-3 flex gap-2">
              <button
                className="flex-1 bg-white border border-gray-300 text-gray-700 py-2 rounded hover:bg-gray-50"
                aria-label={`Preview invoice ${inv.id}`}
                onClick={() => setPreviewId(inv.id)}
              >
                Preview
              </button>
              <button
                className="flex-1 bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
                aria-label={`Download invoice ${inv.id}`}
              >
                Download
              </button>
            </div>
          </div>
        ))}
      </div>

      <InvoicePreviewModal 
        isOpen={!!previewId} 
        onClose={() => setPreviewId(null)} 
        invoiceId={previewId} 
      />
    </div>
  );
}