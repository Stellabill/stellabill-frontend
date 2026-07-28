import InvoiceBreakdownCard from "./InvoiceBreakdownCard";
import type { InvoiceWithBreakdown } from "./InvoiceBreakdownCard";

type LineItem = {
  description: string;
  quantity?: number;
  unitPrice?: string;
  lineTotal: string;
};

type TaxEntry = {
  label: string;
  amount: string;
};

type CreditEntry = {
  label: string;
  amount: string;
};

type Invoice = InvoiceWithBreakdown;

type Props = {
  invoices: Invoice[];
};

export default function InvoiceList({ invoices }: Props) {
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
              <tr key={inv.id}>
                <td colSpan={5} className="p-0">
                  <InvoiceBreakdownCard invoice={inv} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ================= MOBILE CARDS ================= */}
      <div className="md:hidden space-y-3">
        {invoices.map((inv) => (
          <InvoiceBreakdownCard key={inv.id} invoice={inv} />
        ))}
      </div>
    </div>
  );
}

export type { Invoice, LineItem, TaxEntry, CreditEntry };