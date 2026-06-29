import React, { useEffect, useId, useMemo, useState } from "react";
import "./ReceiptPrint.css";

type Money = {
  amount: number;
  currency: string;
};

type LineItem = {
  id?: string;
  description: string;
  quantity?: number;
  unitPrice?: Money;
  lineTotal?: Money;
};

type TaxBreakdown = {
  label: string;
  amount: Money;
};

type ReceiptData = {
  receiptId: string;
  issueDate: string;

  // Merchant/Company
  merchantName: string;
  merchantBrand?: string;
  merchantAddress?: string;
  merchantEmail?: string;
  merchantPhone?: string;
  merchantTaxId?: string;

  // Client
  clientName: string;
  clientAddress?: string;
  clientEmail?: string;
  clientTaxId?: string;

  // Items
  currency: string;
  lineItems: LineItem[];

  // Summary
  subtotal?: Money;
  taxes?: TaxBreakdown[];
  total?: Money;

  // Footer / Payment
  paymentMethod: string;
  transactionKey: string;
  reference: string;
  terms?: string;
};

function safeCurrencyParse(value: string | undefined | null): { amount: number; currency: string } | null {
  if (!value) return null;
  const normalized = value.trim();
  if (!normalized) return null;

  // Try: "12.34 USDC" or "12.34 USDC" variants
  const m1 = normalized.match(/^(-?\d+(?:[\.,]\d+)?)\s*([A-Za-z]{3,})$/);
  if (m1) {
    const amt = Number(m1[1].replace(",", "."));
    return { amount: Number.isFinite(amt) ? amt : 0, currency: m1[2].toUpperCase() };
  }

  // Try: "USDC 12.34"
  const m2 = normalized.match(/^([A-Za-z]{3,})\s*(-?\d+(?:[\.,]\d+)?)$/);
  if (m2) {
    const amt = Number(m2[2].replace(",", "."));
    return { amount: Number.isFinite(amt) ? amt : 0, currency: m2[1].toUpperCase() };
  }

  return null;
}

function formatMoney(m: Money | undefined | null): string {
  if (!m) return "—";
  try {
    return `${m.amount.toLocaleString(undefined, { maximumFractionDigits: 8 })} ${m.currency}`;
  } catch {
    return `${m.amount} ${m.currency}`;
  }
}

function clampTextForReceipt(text: string, maxChars: number): string {
  // Defensive: ensure long names do not break layout.
  // We rely on CSS ellipsis too; this is just to avoid extreme overflows.
  const t = text ?? "";
  if (t.length <= maxChars) return t;
  return t.slice(0, Math.max(0, maxChars - 1)) + "…";
}

function Spinner({ label }: { label: string }) {
  return (
    <span className="rp-spinner" aria-hidden="true">
      <span className="rp-spinner__dot" />
      <span className="rp-spinner__sr">{label}</span>
    </span>
  );
}

export default function ReceiptPreview({ receipt }: { receipt: ReceiptData | null }) {
  const [downloadState, setDownloadState] = useState<"idle" | "compiling" | "ready">("idle");
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const downloadButtonId = useId();

  const hasHistory = !!receipt && receipt.lineItems && receipt.lineItems.length > 0;

  useEffect(() => {
    if (downloadState !== "idle") return;
    setDownloadError(null);
  }, [downloadState]);

  const computed = useMemo(() => {
    if (!receipt) return null;

    const currency = receipt.currency;
    const subtotal = receipt.subtotal ?? null;
    const taxes = receipt.taxes ?? [];
    const total = receipt.total ?? null;

    // If missing totals, defensively compute based on items.
    const derivedSubtotalAmount = receipt.lineItems.reduce((acc, it) => {
      const lt = it.lineTotal;
      if (lt && lt.currency === currency) return acc + (Number.isFinite(lt.amount) ? lt.amount : 0);
      if (it.unitPrice && it.quantity != null) {
        const q = Number(it.quantity);
        const up = it.unitPrice;
        if (up && up.currency === currency) return acc + q * (Number.isFinite(up.amount) ? up.amount : 0);
      }
      return acc;
    }, 0);

    const derivedSubtotal: Money = subtotal ?? { amount: derivedSubtotalAmount, currency };

    const derivedTaxesAmount = taxes.reduce((acc, t) => {
      if (t.amount?.currency !== currency) return acc;
      return acc + (Number.isFinite(t.amount.amount) ? t.amount.amount : 0);
    }, 0);

    const derivedTotal: Money =
      total ??
      ({ amount: derivedSubtotal.amount + derivedTaxesAmount, currency } satisfies Money);

    return { subtotal: derivedSubtotal, taxes, total: derivedTotal };
  }, [receipt]);

  function onDownloadPdf() {
    if (!receipt) return;
    if (downloadState === "compiling") return;

    setDownloadError(null);
    setDownloadState("compiling");

    // Simulate compilation time.
    const ms = 1200;
    window.setTimeout(() => {
      setDownloadState("ready");

      // Simulate a download action without external dependencies.
      try {
        const blob = new Blob(["PDF compilation simulated"], { type: "application/pdf" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `receipt-${receipt.receiptId}.pdf`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
      } catch (e) {
        setDownloadError("Unable to start download.");
        setDownloadState("idle");
      }

      window.setTimeout(() => setDownloadState("idle"), 1200);
    }, ms);
  }

  if (!receipt || !hasHistory) {
    return (
      <section className="rp-empty" aria-label="Receipt preview">
        <div className="rp-empty__inner" role="status" aria-live="polite">
          <h2 className="rp-empty__title">No billing receipts found</h2>
          <p className="rp-empty__text">
            Select a historic billing period to preview and download the corresponding receipt.
          </p>
        </div>
      </section>
    );
  }

  const merchantName = receipt.merchantBrand ? `${receipt.merchantBrand} — ${receipt.merchantName}` : receipt.merchantName;

  const subtotal = computed?.subtotal ?? null;
  const taxes = computed?.taxes ?? [];
  const total = computed?.total ?? null;

  const previewTitleId = `${downloadButtonId}-title`;
  const receiptMetaId = `${downloadButtonId}-meta`;

  return (
    <section className="rp-wrap" aria-labelledby={previewTitleId}>
      <header className="rp-top" aria-label="Receipt preview header">
        <div className="rp-top__left">
          <h2 id={previewTitleId} className="rp-title">
            Billing Receipt Preview
          </h2>
          <p className="rp-subtitle" id={receiptMetaId}>
            Receipt <span className="rp-mono">{receipt.receiptId}</span> · Issued {receipt.issueDate}
          </p>
        </div>

        <div className="rp-top__right rp-actions" aria-label="Receipt actions">
          <button
            type="button"
            id={downloadButtonId}
            className="rp-download"
            onClick={onDownloadPdf}
            aria-label={
              downloadState === "compiling" ? "Compiling PDF" : "Download PDF"
            }
            aria-disabled={downloadState === "compiling" ? "true" : "false"}
            disabled={downloadState === "compiling"}
          >
            {downloadState === "compiling" ? (
              <>
                <Spinner label="Compiling PDF" />
                <span>Compiling…</span>
              </>
            ) : (
              <>
                <span className="rp-download__icon" aria-hidden="true">⬇</span>
                <span>Download PDF</span>
              </>
            )}
          </button>
          <div className="rp-live" aria-live="polite" aria-atomic="true">
            {downloadError ? (
              <span className="rp-error" role="alert">{downloadError}</span>
            ) : downloadState === "ready" ? (
              <span>Download started.</span>
            ) : (
              <span className="rp-sr">{downloadState === "idle" ? "" : ""}</span>
            )}
          </div>
        </div>
      </header>

      <div className="rp-preview" aria-label="Receipt preview container">
        <div className="rp-paper" role="region" aria-label="Receipt document" tabIndex={0}>
          {/* Header area */}
          <div className="rp-doc-header">
            <div className="rp-doc-brand">
              <div className="rp-doc-brand__block">
                <div className="rp-doc-brand__name">{clampTextForReceipt(merchantName, 64)}</div>
                {receipt.merchantAddress ? (
                  <div className="rp-doc-brand__meta">{clampTextForReceipt(receipt.merchantAddress, 80)}</div>
                ) : null}
                <table className="rp-mini-table" aria-label="Merchant contact details">
                  <tbody>
                    {receipt.merchantEmail ? (
                      <tr>
                        <th scope="row">Email</th>
                        <td>{receipt.merchantEmail}</td>
                      </tr>
                    ) : null}
                    {receipt.merchantPhone ? (
                      <tr>
                        <th scope="row">Phone</th>
                        <td>{receipt.merchantPhone}</td>
                      </tr>
                    ) : null}
                    {receipt.merchantTaxId ? (
                      <tr>
                        <th scope="row">Tax ID</th>
                        <td className="rp-mono">{receipt.merchantTaxId}</td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="rp-doc-client">
              <div className="rp-doc-client__block">
                <div className="rp-doc-client__label">Bill To</div>
                <div className="rp-doc-client__name">{clampTextForReceipt(receipt.clientName, 64)}</div>
                {receipt.clientAddress ? (
                  <div className="rp-doc-client__meta">{clampTextForReceipt(receipt.clientAddress, 80)}</div>
                ) : null}
                <table className="rp-mini-table" aria-label="Client details">
                  <tbody>
                    {receipt.clientEmail ? (
                      <tr>
                        <th scope="row">Email</th>
                        <td>{receipt.clientEmail}</td>
                      </tr>
                    ) : null}
                    {receipt.clientTaxId ? (
                      <tr>
                        <th scope="row">Tax ID</th>
                        <td className="rp-mono">{receipt.clientTaxId}</td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>
              </div>

              <div className="rp-doc-client__receiptmeta">
                <table className="rp-meta-table" aria-label="Receipt metadata">
                  <tbody>
                    <tr>
                      <th scope="row">Receipt ID</th>
                      <td className="rp-mono">{receipt.receiptId}</td>
                    </tr>
                    <tr>
                      <th scope="row">Issue Date</th>
                      <td>{receipt.issueDate}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Line items */}
          <div className="rp-section" aria-label="Line items section">
            <h3 className="rp-section__title">Line Items</h3>
            <table className="rp-items" aria-label="Receipt line items" role="table">
              <caption className="rp-sr">Items table</caption>
              <thead>
                <tr>
                  <th scope="col">Description</th>
                  <th scope="col">Qty</th>
                  <th scope="col">Unit Price</th>
                  <th scope="col">Line Total</th>
                </tr>
              </thead>
              <tbody>
                {receipt.lineItems.map((it, idx) => {
                  const qty = it.quantity;
                  const unitPrice = it.unitPrice;
                  const lineTotal = it.lineTotal;

                  return (
                    <tr key={it.id ?? idx}>
                      <td className="rp-cell-desc" title={it.description}>
                        <span className="rp-cell-desc__text">{clampTextForReceipt(it.description, 60)}</span>
                      </td>
                      <td className="rp-cell-num rp-mono">{qty != null ? String(qty) : "—"}</td>
                      <td className="rp-cell-num rp-mono">{unitPrice ? formatMoney(unitPrice) : "—"}</td>
                      <td className="rp-cell-num rp-mono">{lineTotal ? formatMoney(lineTotal) : "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Summary */}
          <div className="rp-section rp-summary" aria-label="Summary section">
            <div className="rp-summary-grid">
              <div>
                <h3 className="rp-section__title">Summary</h3>
                <table className="rp-totals" aria-label="Receipt totals">
                  <tbody>
                    <tr>
                      <th scope="row">Subtotal</th>
                      <td className="rp-mono">{formatMoney(subtotal)}</td>
                    </tr>
                    {taxes.length > 0 ? (
                      taxes.map((t, i) => (
                        <tr key={i}>
                          <th scope="row">
                            {clampTextForReceipt(t.label, 44)}
                          </th>
                          <td className="rp-mono">{formatMoney(t.amount)}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <th scope="row">Taxes</th>
                        <td className="rp-mono">—</td>
                      </tr>
                    )}
                    <tr className="rp-totals__grand">
                      <th scope="row">Total</th>
                      <td className="rp-mono rp-totals__grand-val">{formatMoney(total)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="rp-summary-note" aria-label="Tax disclosure">
                <p>
                  Amounts are shown in {receipt.currency}. Receipt totals are calculated from the selected billing period.
                </p>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="rp-footer" aria-label="Receipt footer">
            <div className="rp-footer__row">
              <div className="rp-footer__block">
                <div className="rp-footer__label">Payment</div>
                <div className="rp-footer__value">{receipt.paymentMethod}</div>
              </div>
              <div className="rp-footer__block">
                <div className="rp-footer__label">Transaction Key</div>
                <div className="rp-footer__value rp-mono">{receipt.transactionKey}</div>
              </div>
            </div>

            <div className="rp-footer__row">
              <div className="rp-footer__block">
                <div className="rp-footer__label">Reference</div>
                <div className="rp-footer__value">{clampTextForReceipt(receipt.reference, 64)}</div>
              </div>
              <div className="rp-footer__block">
                <div className="rp-footer__label">Terms</div>
                <div className="rp-footer__value">{receipt.terms ? clampTextForReceipt(receipt.terms, 90) : "Standard billing terms apply."}</div>
              </div>
            </div>

            <div className="rp-footer__fineprint" aria-label="Receipt fine print">
              This preview is designed for print-ready output. Download generates a PDF for archival purposes.
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export type { ReceiptData, LineItem, TaxBreakdown, Money };

// Defensive helper exported for reuse if needed elsewhere.
export { safeCurrencyParse };

