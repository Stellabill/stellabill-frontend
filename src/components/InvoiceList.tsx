import React, { useState } from 'react';
import { Undo2, ArrowRight, ChevronDown, ChevronUp, FileText } from 'lucide-react';

export type InvoiceType = "invoice" | "credit_note";

export type Invoice = {
  id: string;
  type?: InvoiceType;
  date: string;
  status: "paid" | "pending" | "failed" | "refunded" | "adjusted";
  total: string;
  currency: string;
  parentInvoiceId?: string;
  reason?: string;
  amountRedeemed?: string;
};

type Props = {
  invoices: Invoice[];
};

export default function InvoiceList({ invoices }: Props) {
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  const toggleExpand = (id: string) => {
    setExpandedRow((prev) => (prev === id ? null : id));
  };

  // Helper for RTL numerals
  const formatAmount = (amount: string, currency: string) => {
    // If it's a number string, format it
    const num = parseFloat(amount);
    if (!isNaN(num)) {
      return new Intl.NumberFormat(undefined, {
        style: 'currency',
        currency: currency,
      }).format(num);
    }
    return `${amount} ${currency}`; // fallback
  };

  return (
    <div>
      {/* ================= DESKTOP TABLE ================= */}
      <div className="hidden md:block">
        <table className="w-full border border-gray-300 rounded-lg overflow-hidden text-sm">
          <thead className="bg-gray-100 text-left">
            <tr>
              <th className="p-3 w-10"></th>
              <th className="p-3">ID / Type</th>
              <th className="p-3">Date</th>
              <th className="p-3">Status</th>
              <th className="p-3 text-right">Total</th>
              <th className="p-3 text-right">Actions</th>
            </tr>
          </thead>

          <tbody>
            {invoices.map((inv) => {
              const isCreditNote = inv.type === "credit_note";
              const isExpanded = expandedRow === inv.id;
              return (
                <React.Fragment key={inv.id}>
                  <tr
                    className={`border-t transition-colors ${
                      isCreditNote ? "bg-blue-50/30 hover:bg-blue-50/50" : "hover:bg-gray-50"
                    }`}
                  >
                    <td className="p-3 text-center">
                      {isCreditNote && (
                        <button
                          onClick={() => toggleExpand(inv.id)}
                          aria-expanded={isExpanded}
                          aria-controls={`details-${inv.id}`}
                          aria-label={`Toggle details for credit note ${inv.id}`}
                          className="text-gray-500 hover:text-gray-700 p-1 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </button>
                      )}
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        {isCreditNote ? (
                          <Undo2 size={16} className="text-blue-600" aria-hidden="true" />
                        ) : (
                          <FileText size={16} className="text-gray-500" aria-hidden="true" />
                        )}
                        <span className="font-medium">{inv.id}</span>
                        {isCreditNote && (
                          <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
                            Credit Note
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-3">{inv.date}</td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          inv.status === "paid" || inv.status === "refunded" || inv.status === "adjusted"
                            ? "bg-green-100 text-green-700"
                            : inv.status === "pending"
                            ? "bg-yellow-100 text-yellow-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {inv.status}
                      </span>
                    </td>
                    <td className="p-3 text-right font-medium" dir="auto">
                      {formatAmount(inv.total, inv.currency)}
                    </td>
                    <td className="p-3 text-right">
                      {isCreditNote ? (
                        <button
                          className="text-blue-600 hover:underline font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-1"
                          aria-label={`Reissue credit note ${inv.id}`}
                        >
                          Reissue
                        </button>
                      ) : (
                        <button
                          className="text-gray-600 hover:underline font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-1"
                          aria-label={`Download invoice ${inv.id}`}
                        >
                          Download
                        </button>
                      )}
                    </td>
                  </tr>
                  
                  {isCreditNote && isExpanded && (
                    <tr id={`details-${inv.id}`} className="bg-blue-50/20 border-t border-blue-100">
                      <td></td>
                      <td colSpan={5} className="p-4">
                        <div className="grid grid-cols-3 gap-4 text-sm text-gray-700">
                          <div>
                            <span className="block font-semibold text-gray-900 mb-1">Parent Invoice</span>
                            {inv.parentInvoiceId ? (
                              <a href={`#${inv.parentInvoiceId}`} className="text-blue-600 hover:underline flex items-center gap-1">
                                {inv.parentInvoiceId}
                                <ArrowRight size={14} />
                              </a>
                            ) : (
                              <span className="text-gray-500 italic">No parent invoice linked (Orphan)</span>
                            )}
                          </div>
                          <div>
                            <span className="block font-semibold text-gray-900 mb-1">Reason</span>
                            <span>{inv.reason || 'N/A'}</span>
                          </div>
                          <div>
                            <span className="block font-semibold text-gray-900 mb-1">Redemption Status</span>
                            {inv.amountRedeemed ? (
                              <span dir="auto">Redeemed: {formatAmount(inv.amountRedeemed, inv.currency)} of {formatAmount(inv.total, inv.currency)}</span>
                            ) : (
                              <span>Fully Available</span>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ================= MOBILE CARDS ================= */}
      <div className="md:hidden space-y-3">
        {invoices.map((inv) => {
          const isCreditNote = inv.type === "credit_note";
          const isExpanded = expandedRow === inv.id;

          return (
            <div
              key={inv.id}
              className={`border p-4 rounded-lg shadow-sm transition-colors ${
                isCreditNote ? "bg-blue-50 border-blue-200" : "bg-white"
              }`}
            >
              <div className="flex justify-between items-start mb-2">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    {isCreditNote ? (
                      <Undo2 size={16} className="text-blue-600" aria-hidden="true" />
                    ) : (
                      <FileText size={16} className="text-gray-500" aria-hidden="true" />
                    )}
                    <span className="font-semibold text-gray-900">{inv.id}</span>
                  </div>
                  {isCreditNote && (
                    <span className="inline-block px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-700 mb-2">
                      Credit Note
                    </span>
                  )}
                </div>
                <span
                  className={`px-2 py-1 text-xs font-medium rounded ${
                    inv.status === "paid" || inv.status === "refunded" || inv.status === "adjusted"
                      ? "bg-green-100 text-green-700"
                      : inv.status === "pending"
                      ? "bg-yellow-100 text-yellow-700"
                      : "bg-red-100 text-red-700"
                  }`}
                >
                  {inv.status}
                </span>
              </div>

              <div className="text-sm text-gray-600 mb-1">Date: {inv.date}</div>
              <div className="font-medium text-gray-900 mb-3" dir="auto">
                {formatAmount(inv.total, inv.currency)}
              </div>

              {isCreditNote && (
                <div className="mt-2 mb-3">
                  <button
                    onClick={() => toggleExpand(inv.id)}
                    aria-expanded={isExpanded}
                    aria-controls={`mobile-details-${inv.id}`}
                    className="flex items-center gap-1 text-sm text-blue-600 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-1 -ml-1"
                  >
                    {isExpanded ? 'Hide Details' : 'View Details'}
                    {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </button>
                  
                  {isExpanded && (
                    <div id={`mobile-details-${inv.id}`} className="mt-3 p-3 bg-white/60 rounded border border-blue-100 space-y-2 text-sm">
                      <div>
                        <span className="font-semibold text-gray-900 block">Parent Invoice</span>
                        {inv.parentInvoiceId ? (
                          <a href={`#${inv.parentInvoiceId}`} className="text-blue-600 hover:underline flex items-center gap-1">
                            {inv.parentInvoiceId}
                            <ArrowRight size={14} />
                          </a>
                        ) : (
                          <span className="text-gray-500 italic">No parent invoice linked (Orphan)</span>
                        )}
                      </div>
                      <div>
                        <span className="font-semibold text-gray-900 block">Reason</span>
                        <span>{inv.reason || 'N/A'}</span>
                      </div>
                      <div>
                        <span className="font-semibold text-gray-900 block">Redemption</span>
                        {inv.amountRedeemed ? (
                          <span dir="auto">Redeemed: {formatAmount(inv.amountRedeemed, inv.currency)} of {formatAmount(inv.total, inv.currency)}</span>
                        ) : (
                          <span>Fully Available</span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              <button
                className={`w-full py-2 rounded font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                  isCreditNote
                    ? "bg-white text-blue-600 border border-blue-200 hover:bg-blue-50 focus:ring-blue-500"
                    : "bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500"
                }`}
                aria-label={isCreditNote ? `Reissue credit note ${inv.id}` : `Download invoice ${inv.id}`}
              >
                {isCreditNote ? 'Reissue' : 'Download'}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}