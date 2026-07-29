import { useId, useCallback, useState } from "react";
import { ChevronDown, Download } from "lucide-react";
import "./InvoiceBreakdownCard.css";

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

type InvoiceWithBreakdown = {
  id: string;
  date: string;
  status: "paid" | "pending" | "failed";
  total: string;
  currency: string;
  lineItems: LineItem[];
  subtotal: string;
  taxes?: TaxEntry[];
  credits?: CreditEntry[];
};

type Props = {
  invoice: InvoiceWithBreakdown;
};

function downloadCsv(invoice: InvoiceWithBreakdown) {
  const header = "Description,Quantity,Unit Price,Line Total";
  const rows = invoice.lineItems.map(
    (item) =>
      `${item.description},${item.quantity ?? ""},${item.unitPrice ?? ""},${item.lineTotal}`
  );

  const summaryRows: string[] = [];
  summaryRows.push(`Subtotal,,,${invoice.subtotal}`);
  if (invoice.taxes) {
    for (const tax of invoice.taxes) {
      summaryRows.push(`${tax.label},,,${tax.amount}`);
    }
  }
  if (invoice.credits) {
    for (const credit of invoice.credits) {
      summaryRows.push(`${credit.label},,,${credit.amount}`);
    }
  }
  summaryRows.push(`Total,,,${invoice.total}`);

  const csv = header + "\n" + rows.join("\n") + "\n\n" + summaryRows.join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `invoice-breakdown-${invoice.id}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

const statusColorMap: Record<string, string> = {
  paid: "var(--color-success, #047857)",
  pending: "var(--color-warning, #b45309)",
  failed: "var(--color-danger, #b91c1c)",
};

export default function InvoiceBreakdownCard({ invoice }: Props) {
  const [expanded, setExpanded] = useState(false);
  const toggleId = useId();
  const bodyId = useId();

  const onToggle = useCallback(() => {
    setExpanded((prev) => !prev);
  }, []);

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        onToggle();
      }
    },
    [onToggle]
  );

  const onDownloadClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      downloadCsv(invoice);
    },
    [invoice]
  );

  return (
    <div className="ibc-wrap" role="region" aria-label={`Invoice ${invoice.id} breakdown`}>
      <button
        id={toggleId}
        className="ibc-toggle"
        onClick={onToggle}
        onKeyDown={onKeyDown}
        aria-expanded={expanded}
        aria-controls={bodyId}
        aria-label={`Toggle breakdown for invoice ${invoice.id}`}
        type="button"
      >
        <span className="ibc-toggle__left">
          <span
            className={`ibc-toggle__chevron ${expanded ? "ibc-toggle__chevron--open" : ""}`}
            aria-hidden="true"
          >
            <ChevronDown size={16} />
          </span>
          <span className="ibc-toggle__info">
            <span className="ibc-toggle__id">{invoice.id}</span>
            <span className="ibc-toggle__date">{invoice.date}</span>
          </span>
        </span>
        <span className="ibc-toggle__right">
          <span className="ibc-toggle__total">
            {invoice.total} {invoice.currency}
          </span>
          <span
            className="ibc-toggle__status"
            style={{ color: statusColorMap[invoice.status] ?? "inherit" }}
          >
            {invoice.status}
          </span>
        </span>
      </button>

      {expanded && (
        <div id={bodyId} className="ibc-body" role="group" aria-label="Line items breakdown">
          <table className="ibc-table">
            <caption className="sr-only">Line items for {invoice.id}</caption>
            <thead>
              <tr>
                <th scope="col">Description</th>
                <th scope="col">Qty</th>
                <th scope="col">Price</th>
                <th scope="col">Total</th>
              </tr>
            </thead>
            <tbody>
              {invoice.lineItems.map((item, idx) => (
                <tr key={idx}>
                  <td className="ibc-desc" title={item.description}>
                    {item.description}
                  </td>
                  <td className="ibc-num">{item.quantity ?? "—"}</td>
                  <td className="ibc-num">{item.unitPrice ?? "—"}</td>
                  <td className="ibc-num">{item.lineTotal}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="ibc-summary">
            <div className="ibc-summary-row">
              <span className="ibc-summary-row__label">Subtotal</span>
              <span className="ibc-summary-row__value">{invoice.subtotal} {invoice.currency}</span>
            </div>
            {invoice.taxes?.map((tax, idx) => (
              <div className="ibc-summary-row" key={idx}>
                <span className="ibc-summary-row__label">
                  <span
                    className="ibc-summary-row__label-dot"
                    style={{ background: statusColorMap.paid }}
                  />
                  {tax.label}
                </span>
                <span className="ibc-summary-row__value">{tax.amount} {invoice.currency}</span>
              </div>
            ))}
            {invoice.credits?.map((credit, idx) => (
              <div className="ibc-summary-row ibc-summary-row--credit" key={idx}>
                <span className="ibc-summary-row__label">
                  <Download size={12} className="ibc-credit-icon" aria-hidden="true" />
                  {credit.label}
                </span>
                <span className="ibc-summary-row__value">-{credit.amount} {invoice.currency}</span>
              </div>
            ))}
            <div className="ibc-summary-row ibc-summary-row--total">
              <span className="ibc-summary-row__label">Total</span>
              <span className="ibc-summary-row__value">{invoice.total} {invoice.currency}</span>
            </div>
          </div>

          <div className="ibc-actions">
            <button
              type="button"
              className="ibc-download-btn"
              onClick={onDownloadClick}
              aria-label={`Download breakdown CSV for invoice ${invoice.id}`}
            >
              <Download size={14} aria-hidden="true" />
              Download breakdown
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export type { InvoiceWithBreakdown, LineItem, TaxEntry, CreditEntry };
