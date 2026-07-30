import { useId, useCallback, useState } from "react";
import { ChevronDown, Download, FileText, CreditCard } from "lucide-react";
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

/**
 * Unified invoice / credit-note shape used by InvoiceList.
 *
 * `type` discriminates between a regular invoice and a credit note.
 * Credit-note–only fields (`parentInvoiceId`, `reason`, `amountRedeemed`)
 * are optional and ignored for regular invoices.
 *
 * `lineItems` / `subtotal` are optional so that a credit-note header-only
 * record (no breakdown yet) can still be rendered.
 */
export type InvoiceWithBreakdown = {
  id: string;
  /** Discriminator: regular invoice vs. credit note */
  type?: "invoice" | "credit_note";
  date: string;
  status: "paid" | "pending" | "failed" | "adjusted" | "refunded";
  total: string;
  currency: string;
  /** Required for full breakdown; omit for summary-only credit notes */
  lineItems?: LineItem[];
  subtotal?: string;
  taxes?: TaxEntry[];
  credits?: CreditEntry[];
  /** Credit-note–only: ID of the invoice this note adjusts */
  parentInvoiceId?: string;
  /** Credit-note–only: human-readable reason for the credit */
  reason?: string;
  /** Credit-note–only: amount applied to the customer balance */
  amountRedeemed?: string;
};

type Props = {
  invoice: InvoiceWithBreakdown;
};

function downloadCsv(invoice: InvoiceWithBreakdown) {
  const header = "Description,Quantity,Unit Price,Line Total";
  const rows = (invoice.lineItems ?? []).map(
    (item) =>
      `${item.description},${item.quantity ?? ""},${item.unitPrice ?? ""},${item.lineTotal}`
  );

  const summaryRows: string[] = [];
  if (invoice.subtotal) summaryRows.push(`Subtotal,,,${invoice.subtotal}`);
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

/* ── Status colour map ──────────────────────────────────────────────────── */
const statusColorMap: Record<string, string> = {
  paid:     "var(--color-success, #047857)",
  pending:  "var(--color-warning, #b45309)",
  failed:   "var(--color-danger, #b91c1c)",
  adjusted: "var(--color-warning, #b45309)",
  refunded: "var(--color-brand-primary, #067d99)",
};

/* ── Helpers ─────────────────────────────────────────────────────────────── */
function isCreditNote(inv: InvoiceWithBreakdown): boolean {
  return inv.type === "credit_note";
}

/* ── Component ──────────────────────────────────────────────────────────── */
export default function InvoiceBreakdownCard({ invoice }: Props) {
  const [expanded, setExpanded] = useState(false);
  const toggleId = useId();
  const bodyId   = useId();

  const onToggle = useCallback(() => setExpanded((prev) => !prev), []);

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

  const creditNote = isCreditNote(invoice);
  const hasLineItems = Array.isArray(invoice.lineItems) && invoice.lineItems.length > 0;

  return (
    <div
      className={`ibc-wrap${creditNote ? " ibc-wrap--credit-note" : ""}`}
      role="region"
      aria-label={
        creditNote
          ? `Credit note ${invoice.id} breakdown`
          : `Invoice ${invoice.id} breakdown`
      }
    >
      {/* ── Toggle row ────────────────────────────────────────────────── */}
      <button
        id={toggleId}
        className="ibc-toggle"
        onClick={onToggle}
        onKeyDown={onKeyDown}
        aria-expanded={expanded}
        aria-controls={bodyId}
        aria-label={
          creditNote
            ? `Toggle details for credit note ${invoice.id}`
            : `Toggle breakdown for invoice ${invoice.id}`
        }
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
            <span className="ibc-toggle__id">
              {creditNote && (
                <CreditCard
                  size={12}
                  className="ibc-type-icon"
                  aria-hidden="true"
                />
              )}
              {!creditNote && (
                <FileText
                  size={12}
                  className="ibc-type-icon"
                  aria-hidden="true"
                />
              )}
              {invoice.id}
            </span>
            {creditNote && (
              <span className="ibc-credit-note-badge" aria-label="Document type: Credit Note">
                Credit Note
              </span>
            )}
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

      {/* ── Expanded body ─────────────────────────────────────────────── */}
      {expanded && (
        <div
          id={bodyId}
          className="ibc-body"
          role="group"
          aria-label={
            creditNote ? "Credit note details" : "Line items breakdown"
          }
        >
          {/* Credit-note metadata ---------------------------------------- */}
          {creditNote && (
            <div className="ibc-cn-meta" data-print-no-href>
              <div className="ibc-cn-meta__row">
                <span className="ibc-cn-meta__label">Parent invoice</span>
                <span className="ibc-cn-meta__value">
                  {invoice.parentInvoiceId ? (
                    <a
                      href={`#invoice-${invoice.parentInvoiceId}`}
                      className="ibc-cn-meta__link"
                      aria-label={`View invoice ${invoice.parentInvoiceId}`}
                    >
                      {invoice.parentInvoiceId}
                    </a>
                  ) : (
                    <span className="ibc-cn-meta__none">
                      No parent invoice linked
                    </span>
                  )}
                </span>
              </div>
              {invoice.reason && (
                <div className="ibc-cn-meta__row">
                  <span className="ibc-cn-meta__label">Reason</span>
                  <span className="ibc-cn-meta__value">{invoice.reason}</span>
                </div>
              )}
              {invoice.amountRedeemed && (
                <div className="ibc-cn-meta__row">
                  <span className="ibc-cn-meta__label">Amount redeemed</span>
                  <span className="ibc-cn-meta__value ibc-cn-meta__value--credit">
                    {invoice.amountRedeemed} {invoice.currency}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Line-items table -------------------------------------------- */}
          {hasLineItems && (
            <table className="ibc-table">
              <caption className="sr-only">
                {creditNote
                  ? `Adjusted line items for credit note ${invoice.id}`
                  : `Line items for ${invoice.id}`}
              </caption>
              <thead>
                <tr>
                  <th scope="col">Description</th>
                  <th scope="col">Qty</th>
                  <th scope="col">Price</th>
                  <th scope="col">Total</th>
                </tr>
              </thead>
              <tbody>
                {invoice.lineItems!.map((item, idx) => (
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
          )}

          {/* Summary rows ------------------------------------------------ */}
          {(invoice.subtotal || invoice.taxes?.length || invoice.credits?.length) && (
            <div className="ibc-summary">
              {invoice.subtotal && (
                <div className="ibc-summary-row">
                  <span className="ibc-summary-row__label">Subtotal</span>
                  <span className="ibc-summary-row__value">
                    {invoice.subtotal} {invoice.currency}
                  </span>
                </div>
              )}
              {invoice.taxes?.map((tax, idx) => (
                <div className="ibc-summary-row" key={idx}>
                  <span className="ibc-summary-row__label">
                    <span
                      className="ibc-summary-row__label-dot"
                      style={{ background: statusColorMap.paid }}
                    />
                    {tax.label}
                  </span>
                  <span className="ibc-summary-row__value">
                    {tax.amount} {invoice.currency}
                  </span>
                </div>
              ))}
              {invoice.credits?.map((credit, idx) => (
                <div className="ibc-summary-row ibc-summary-row--credit" key={idx}>
                  <span className="ibc-summary-row__label">
                    <Download size={12} className="ibc-credit-icon" aria-hidden="true" />
                    {credit.label}
                  </span>
                  <span className="ibc-summary-row__value">
                    -{credit.amount} {invoice.currency}
                  </span>
                </div>
              ))}
              <div className="ibc-summary-row ibc-summary-row--total">
                <span className="ibc-summary-row__label">Total</span>
                <span className="ibc-summary-row__value">
                  {invoice.total} {invoice.currency}
                </span>
              </div>
            </div>
          )}

          {/* Action bar -------------------------------------------------- */}
          <div className="ibc-actions" data-print="hide">
            {creditNote && (
              <button
                type="button"
                className="ibc-reissue-btn"
                aria-label={`Reissue credit note ${invoice.id}`}
              >
                Reissue
              </button>
            )}
            {hasLineItems && (
              <button
                type="button"
                className="ibc-download-btn"
                onClick={onDownloadClick}
                aria-label={`Download breakdown CSV for invoice ${invoice.id}`}
              >
                <Download size={14} aria-hidden="true" />
                Download breakdown
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export type { InvoiceWithBreakdown, LineItem, TaxEntry, CreditEntry };
