/**
 * InvoicePrintRoot
 * ─────────────────────────────────────────────────────────────────────────
 * Wrapper that applies the correct @page named-page class and provides an
 * accessible "Print invoice" button.  In print mode the trigger is hidden
 * and the wrapper ensures `.ibc-body` children are always expanded (CSS
 * forces `display: block` on `.ibc-body` inside @media print).
 *
 * Usage:
 *   <InvoicePrintRoot paper="a4">
 *     <InvoiceList invoices={invoices} />
 *   </InvoicePrintRoot>
 */
import { useCallback, useEffect, useRef } from "react";
import React from "react";
import { Printer } from "lucide-react";
import "./InvoicePrintRoot.css";

export type PaperSize = "a4" | "letter";

export interface InvoicePrintRootProps {
  children: React.ReactNode;
  /** Paper size for the @page rule. Defaults to "a4". */
  paper?: PaperSize;
  /** Optional extra className for the wrapper div. */
  className?: string;
  /**
   * When true, show the "Print invoice" trigger button.
   * Defaults to true.
   */
  showTrigger?: boolean;
  /**
   * Callback fired after window.print() is called.
   * Useful for analytics or to restore state post-print.
   */
  onAfterPrint?: () => void;
}

export default function InvoicePrintRoot({
  children,
  paper = "a4",
  className,
  showTrigger = true,
  onAfterPrint,
}: InvoicePrintRootProps) {
  const rootRef = useRef<HTMLDivElement>(null);

  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  // Register afterprint listener to fire optional callback
  useEffect(() => {
    if (!onAfterPrint) return;
    window.addEventListener("afterprint", onAfterPrint);
    return () => window.removeEventListener("afterprint", onAfterPrint);
  }, [onAfterPrint]);

  const isRtl =
    typeof document !== "undefined" &&
    document.documentElement.getAttribute("dir") === "rtl";

  const wrapperClass = [
    "invoice-print-root",
    paper === "letter" ? "invoice-print-letter" : "",
    isRtl ? "invoice-print-rtl" : "",
    className ?? "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div ref={rootRef} className={wrapperClass}>
      {showTrigger && (
        <div className="invoice-print-trigger" aria-hidden="true">
          <button
            type="button"
            className="invoice-print-trigger__btn"
            onClick={handlePrint}
            aria-label="Print invoice"
          >
            <Printer size={15} aria-hidden="true" />
            Print invoice
          </button>
        </div>
      )}
      {children}
    </div>
  );
}
