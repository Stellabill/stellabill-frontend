/**
 * InvoiceBreakdownCard.print.test.tsx
 * ─────────────────────────────────────────────────────────────────────────
 * Tests targeting print-stylesheet behaviour:
 *   - CSS class presence (the stylesheet is not evaluated in jsdom, so we
 *     assert the correct class names are emitted and that the DOM structure
 *     is consistent with what the @media print rules target).
 *   - ARIA labels used by screen-readers in both screen and print contexts.
 *   - Credit-note variant class application.
 *   - Force-expanded body (all expandable sections must be renderable).
 *   - RTL data-attribute propagation.
 *   - Keyboard / aria-expanded parity.
 */
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import InvoiceBreakdownCard from "./InvoiceBreakdownCard";
import type { InvoiceWithBreakdown } from "./InvoiceBreakdownCard";

// ── Fixtures ──────────────────────────────────────────────────────────────

const baseInvoice: InvoiceWithBreakdown = {
  id: "INV-001",
  type: "invoice",
  date: "Jun 1, 2025",
  status: "paid",
  total: "120.00",
  currency: "USD",
  lineItems: [
    { description: "Subscription fee", quantity: 1, unitPrice: "100.00", lineTotal: "100.00" },
    { description: "Setup fee",        quantity: 1, unitPrice: "20.00",  lineTotal: "20.00"  },
  ],
  subtotal: "120.00",
  taxes: [{ label: "VAT 20%", amount: "24.00" }],
  credits: [{ label: "Promo credit", amount: "4.00" }],
};

const creditNote: InvoiceWithBreakdown = {
  id: "CN-001",
  type: "credit_note",
  date: "Jun 2, 2025",
  status: "adjusted",
  total: "50.00",
  currency: "USD",
  lineItems: [
    { description: "Overpayment refund", quantity: 1, unitPrice: "50.00", lineTotal: "50.00" },
  ],
  subtotal: "50.00",
  parentInvoiceId: "INV-001",
  reason: "Customer was overcharged",
  amountRedeemed: "25.00",
};

const orphanCreditNote: InvoiceWithBreakdown = {
  id: "CN-002",
  type: "credit_note",
  date: "Jun 3, 2025",
  status: "refunded",
  total: "10.00",
  currency: "USD",
  // no lineItems, no subtotal — header-only credit note
};

const pendingInvoice: InvoiceWithBreakdown = {
  id: "INV-002",
  type: "invoice",
  date: "Jun 4, 2025",
  status: "pending",
  total: "200.00",
  currency: "EUR",
  lineItems: [{ description: "Enterprise plan", lineTotal: "200.00" }],
  subtotal: "200.00",
};

const failedInvoice: InvoiceWithBreakdown = {
  id: "INV-003",
  type: "invoice",
  date: "Jun 5, 2025",
  status: "failed",
  total: "80.00",
  currency: "GBP",
  lineItems: [{ description: "Pro plan", lineTotal: "80.00" }],
  subtotal: "80.00",
};

// ── Helpers ────────────────────────────────────────────────────────────────

function expandCard(id: string) {
  const btn = screen.getByRole("button", {
    name: new RegExp(`Toggle (breakdown for invoice|details for credit note) ${id}`, "i"),
  });
  fireEvent.click(btn);
}

// ── Tests ─────────────────────────────────────────────────────────────────

describe("InvoiceBreakdownCard — print class structure", () => {
  it("applies .ibc-wrap to the root element", () => {
    const { container } = render(<InvoiceBreakdownCard invoice={baseInvoice} />);
    const wrap = container.querySelector(".ibc-wrap");
    expect(wrap).not.toBeNull();
  });

  it("does NOT apply .ibc-wrap--credit-note for a regular invoice", () => {
    const { container } = render(<InvoiceBreakdownCard invoice={baseInvoice} />);
    const wrap = container.querySelector(".ibc-wrap");
    expect(wrap?.classList.contains("ibc-wrap--credit-note")).toBe(false);
  });

  it("applies .ibc-wrap--credit-note for a credit note", () => {
    const { container } = render(<InvoiceBreakdownCard invoice={creditNote} />);
    const wrap = container.querySelector(".ibc-wrap");
    expect(wrap?.classList.contains("ibc-wrap--credit-note")).toBe(true);
  });

  it("toggle button has .ibc-toggle class", () => {
    const { container } = render(<InvoiceBreakdownCard invoice={baseInvoice} />);
    const btn = container.querySelector(".ibc-toggle");
    expect(btn).not.toBeNull();
    expect(btn?.tagName.toLowerCase()).toBe("button");
  });
});

describe("InvoiceBreakdownCard — ARIA / accessibility", () => {
  it("invoice region has correct aria-label", () => {
    render(<InvoiceBreakdownCard invoice={baseInvoice} />);
    expect(screen.getByRole("region", { name: "Invoice INV-001 breakdown" })).toBeDefined();
  });

  it("credit note region has correct aria-label", () => {
    render(<InvoiceBreakdownCard invoice={creditNote} />);
    expect(screen.getByRole("region", { name: "Credit note CN-001 breakdown" })).toBeDefined();
  });

  it("toggle button has aria-expanded=false by default", () => {
    render(<InvoiceBreakdownCard invoice={baseInvoice} />);
    const btn = screen.getByRole("button", { name: /Toggle breakdown for invoice INV-001/i });
    expect(btn.getAttribute("aria-expanded")).toBe("false");
  });

  it("toggle button aria-expanded becomes true after click", () => {
    render(<InvoiceBreakdownCard invoice={baseInvoice} />);
    expandCard("INV-001");
    const btn = screen.getByRole("button", { name: /Toggle breakdown for invoice INV-001/i });
    expect(btn.getAttribute("aria-expanded")).toBe("true");
  });

  it("credit note toggle has correct aria-label", () => {
    render(<InvoiceBreakdownCard invoice={creditNote} />);
    expect(
      screen.getByRole("button", { name: /Toggle details for credit note CN-001/i })
    ).toBeDefined();
  });

  it("expanded body has role=group", () => {
    render(<InvoiceBreakdownCard invoice={baseInvoice} />);
    expandCard("INV-001");
    expect(screen.getByRole("group", { name: "Line items breakdown" })).toBeDefined();
  });

  it("credit note expanded body has role=group with correct label", () => {
    render(<InvoiceBreakdownCard invoice={creditNote} />);
    expandCard("CN-001");
    expect(screen.getByRole("group", { name: "Credit note details" })).toBeDefined();
  });

  it("line-items table has sr-only caption", () => {
    render(<InvoiceBreakdownCard invoice={baseInvoice} />);
    expandCard("INV-001");
    expect(screen.getByText("Line items for INV-001")).toBeDefined();
  });

  it("credit note table has credit-specific caption", () => {
    render(<InvoiceBreakdownCard invoice={creditNote} />);
    expandCard("CN-001");
    expect(screen.getByText("Adjusted line items for credit note CN-001")).toBeDefined();
  });

  it("'Credit Note' badge has accessible aria-label", () => {
    render(<InvoiceBreakdownCard invoice={creditNote} />);
    const badge = screen.getByLabelText("Document type: Credit Note");
    expect(badge).toBeDefined();
  });
});

describe("InvoiceBreakdownCard — credit-note metadata (print targets)", () => {
  it("renders ibc-cn-meta block when expanded", () => {
    const { container } = render(<InvoiceBreakdownCard invoice={creditNote} />);
    expandCard("CN-001");
    const meta = container.querySelector(".ibc-cn-meta");
    expect(meta).not.toBeNull();
  });

  it("renders parent invoice link with aria-label", () => {
    render(<InvoiceBreakdownCard invoice={creditNote} />);
    expandCard("CN-001");
    const link = screen.getByRole("link", { name: "View invoice INV-001" });
    expect(link).toBeDefined();
    expect(link.textContent).toBe("INV-001");
  });

  it("renders reason text when provided", () => {
    render(<InvoiceBreakdownCard invoice={creditNote} />);
    expandCard("CN-001");
    expect(screen.getByText("Customer was overcharged")).toBeDefined();
  });

  it("renders amount redeemed when provided", () => {
    render(<InvoiceBreakdownCard invoice={creditNote} />);
    expandCard("CN-001");
    expect(screen.getByText("25.00 USD")).toBeDefined();
  });

  it("renders 'No parent invoice linked' for orphan credit note", () => {
    render(<InvoiceBreakdownCard invoice={orphanCreditNote} />);
    expandCard("CN-002");
    expect(screen.getByText("No parent invoice linked")).toBeDefined();
  });

  it("data-print-no-href is set on ibc-cn-meta (suppresses href echo in print)", () => {
    const { container } = render(<InvoiceBreakdownCard invoice={creditNote} />);
    expandCard("CN-001");
    const meta = container.querySelector(".ibc-cn-meta");
    expect(meta?.getAttribute("data-print-no-href")).toBe("true");
  });
});

describe("InvoiceBreakdownCard — line items (print table targets)", () => {
  it("renders .ibc-table when there are line items", () => {
    const { container } = render(<InvoiceBreakdownCard invoice={baseInvoice} />);
    expandCard("INV-001");
    expect(container.querySelector(".ibc-table")).not.toBeNull();
  });

  it("does NOT render .ibc-table for header-only credit note", () => {
    const { container } = render(<InvoiceBreakdownCard invoice={orphanCreditNote} />);
    expandCard("CN-002");
    expect(container.querySelector(".ibc-table")).toBeNull();
  });

  it("line-item cells have .ibc-num and .ibc-desc classes", () => {
    const { container } = render(<InvoiceBreakdownCard invoice={baseInvoice} />);
    expandCard("INV-001");
    expect(container.querySelector(".ibc-num")).not.toBeNull();
    expect(container.querySelector(".ibc-desc")).not.toBeNull();
  });

  it("quantity column shows '—' when quantity is omitted", () => {
    const inv: InvoiceWithBreakdown = {
      ...baseInvoice,
      lineItems: [{ description: "Flat fee", lineTotal: "50.00" }],
    };
    render(<InvoiceBreakdownCard invoice={inv} />);
    expandCard("INV-001");
    // Both qty and price cells should show em-dash
    const dashes = screen.getAllByText("—");
    expect(dashes.length).toBeGreaterThanOrEqual(2);
  });

  it("table thead contains four column headers", () => {
    const { container } = render(<InvoiceBreakdownCard invoice={baseInvoice} />);
    expandCard("INV-001");
    const ths = container.querySelectorAll(".ibc-table thead th");
    expect(ths.length).toBe(4);
  });
});

describe("InvoiceBreakdownCard — summary / totals (print targets)", () => {
  it("renders .ibc-summary block", () => {
    const { container } = render(<InvoiceBreakdownCard invoice={baseInvoice} />);
    expandCard("INV-001");
    expect(container.querySelector(".ibc-summary")).not.toBeNull();
  });

  it("total row has .ibc-summary-row--total class", () => {
    const { container } = render(<InvoiceBreakdownCard invoice={baseInvoice} />);
    expandCard("INV-001");
    const totalRow = container.querySelector(".ibc-summary-row--total");
    expect(totalRow).not.toBeNull();
    expect(totalRow?.textContent).toContain("120.00");
  });

  it("credit row has .ibc-summary-row--credit class", () => {
    const { container } = render(<InvoiceBreakdownCard invoice={baseInvoice} />);
    expandCard("INV-001");
    const creditRow = container.querySelector(".ibc-summary-row--credit");
    expect(creditRow).not.toBeNull();
  });
});

describe("InvoiceBreakdownCard — action buttons (suppressed in print)", () => {
  it(".ibc-actions has data-print='hide'", () => {
    const { container } = render(<InvoiceBreakdownCard invoice={baseInvoice} />);
    expandCard("INV-001");
    const actions = container.querySelector(".ibc-actions");
    expect(actions?.getAttribute("data-print")).toBe("hide");
  });

  it("download button is present when invoice has line items", () => {
    render(<InvoiceBreakdownCard invoice={baseInvoice} />);
    expandCard("INV-001");
    expect(
      screen.getByRole("button", { name: /Download breakdown CSV for invoice INV-001/i })
    ).toBeDefined();
  });

  it("reissue button is present for credit notes", () => {
    render(<InvoiceBreakdownCard invoice={creditNote} />);
    expandCard("CN-001");
    expect(
      screen.getByRole("button", { name: /Reissue credit note CN-001/i })
    ).toBeDefined();
  });

  it("no download button shown for header-only credit note", () => {
    render(<InvoiceBreakdownCard invoice={orphanCreditNote} />);
    expandCard("CN-002");
    expect(
      screen.queryByRole("button", { name: /Download breakdown/i })
    ).toBeNull();
  });
});

describe("InvoiceBreakdownCard — status coverage (print status badges align)", () => {
  it("renders 'paid' status text", () => {
    render(<InvoiceBreakdownCard invoice={baseInvoice} />);
    expect(screen.getByText("paid")).toBeDefined();
  });

  it("renders 'pending' status text", () => {
    render(<InvoiceBreakdownCard invoice={pendingInvoice} />);
    expect(screen.getByText("pending")).toBeDefined();
  });

  it("renders 'failed' status text", () => {
    render(<InvoiceBreakdownCard invoice={failedInvoice} />);
    expect(screen.getByText("failed")).toBeDefined();
  });

  it("renders 'adjusted' status text for credit note", () => {
    render(<InvoiceBreakdownCard invoice={creditNote} />);
    expect(screen.getByText("adjusted")).toBeDefined();
  });

  it("renders 'refunded' status text for orphan credit note", () => {
    render(<InvoiceBreakdownCard invoice={orphanCreditNote} />);
    expect(screen.getByText("refunded")).toBeDefined();
  });
});

describe("InvoiceBreakdownCard — keyboard interaction", () => {
  it("Enter key expands the card", () => {
    render(<InvoiceBreakdownCard invoice={baseInvoice} />);
    const btn = screen.getByRole("button", { name: /Toggle breakdown for invoice INV-001/i });
    fireEvent.keyDown(btn, { key: "Enter" });
    expect(btn.getAttribute("aria-expanded")).toBe("true");
  });

  it("Space key expands the card", () => {
    render(<InvoiceBreakdownCard invoice={baseInvoice} />);
    const btn = screen.getByRole("button", { name: /Toggle breakdown for invoice INV-001/i });
    fireEvent.keyDown(btn, { key: " " });
    expect(btn.getAttribute("aria-expanded")).toBe("true");
  });

  it("clicking again collapses the card", () => {
    render(<InvoiceBreakdownCard invoice={baseInvoice} />);
    expandCard("INV-001");
    expandCard("INV-001");
    const btn = screen.getByRole("button", { name: /Toggle breakdown for invoice INV-001/i });
    expect(btn.getAttribute("aria-expanded")).toBe("false");
  });
});

describe("InvoiceBreakdownCard — CSV download", () => {
  it("calls URL.createObjectURL on download", () => {
    const createObjectURL = vi.fn(() => "blob:test");
    const revokeObjectURL = vi.fn();
    global.URL.createObjectURL = createObjectURL;
    global.URL.revokeObjectURL = revokeObjectURL;

    render(<InvoiceBreakdownCard invoice={baseInvoice} />);
    expandCard("INV-001");
    const downloadBtn = screen.getByRole("button", { name: /Download breakdown CSV/i });
    fireEvent.click(downloadBtn);
    expect(createObjectURL).toHaveBeenCalledTimes(1);
  });
});
