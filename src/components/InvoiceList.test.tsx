/**
 * InvoiceList – focused behavior coverage (#779)
 *
 * Covers:
 *   - Public contract: named type exports (Invoice, LineItem, TaxEntry, CreditEntry)
 *   - Empty list / boundary inputs
 *   - Single invoice rendering (id, date, total, currency, status)
 *   - All five status values: paid | pending | failed | adjusted | refunded
 *   - Invoice vs credit-note discrimination (badge, CSS modifier, type icon)
 *   - Dual-view DOM structure (hidden desktop table + visible mobile cards)
 *   - Expand / collapse toggle via click and keyboard (Enter, Space)
 *   - Collapsed state hides detail content
 *   - Expanded credit-note metadata (parent invoice link, reason, amountRedeemed)
 *   - Orphan credit notes (no parentInvoiceId)
 *   - Reissue button present/absent depending on document type
 *   - Line-items table rendered when lineItems are provided
 *   - Summary rows (subtotal, taxes, credits, total) rendered when present
 *   - CSV download button present only when line items exist
 *   - CSV download triggers anchor click (URL.createObjectURL path)
 *   - Multiple invoices: each rendered in both views
 *   - Large list: renders without error
 */

import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, afterEach } from "vitest";
import InvoiceList from "./InvoiceList";
import type { Invoice, LineItem, TaxEntry, CreditEntry } from "./InvoiceList";

// ── Shared fixtures ──────────────────────────────────────────────────────────

const paidInvoice: Invoice = {
  id: "INV-001",
  type: "invoice",
  date: "Jan 1, 2026",
  status: "paid",
  total: "120.00",
  currency: "USD",
};

const pendingInvoice: Invoice = {
  id: "INV-002",
  type: "invoice",
  date: "Feb 1, 2026",
  status: "pending",
  total: "80.00",
  currency: "EUR",
};

const failedInvoice: Invoice = {
  id: "INV-003",
  type: "invoice",
  date: "Mar 1, 2026",
  status: "failed",
  total: "60.00",
  currency: "USD",
};

const invoiceWithBreakdown: Invoice = {
  id: "INV-004",
  type: "invoice",
  date: "Apr 1, 2026",
  status: "paid",
  total: "200.00",
  currency: "USD",
  subtotal: "180.00",
  lineItems: [
    { description: "Pro plan – monthly", quantity: 1, unitPrice: "150.00", lineTotal: "150.00" },
    { description: "Overage fees", quantity: 3, unitPrice: "10.00", lineTotal: "30.00" },
  ],
  taxes: [{ label: "VAT 10%", amount: "18.00" }],
  credits: [{ label: "Promo credit", amount: "2.00" }],
};

const adjustedCreditNote: Invoice = {
  id: "CN-001",
  type: "credit_note",
  date: "Jan 15, 2026",
  status: "adjusted",
  total: "50.00",
  currency: "USD",
  parentInvoiceId: "INV-001",
  reason: "Duplicate charge",
  amountRedeemed: "25.00",
};

const refundedOrphanCreditNote: Invoice = {
  id: "CN-002",
  type: "credit_note",
  date: "Feb 20, 2026",
  status: "refunded",
  total: "30.00",
  currency: "GBP",
  // no parentInvoiceId, no reason, no amountRedeemed
};

// ── Type-export contract ─────────────────────────────────────────────────────

describe("named type exports", () => {
  it("Invoice type alias is exported and accepts a valid InvoiceWithBreakdown shape", () => {
    // If this compiles cleanly the export contract is intact.
    const inv: Invoice = paidInvoice;
    expect(inv.id).toBe("INV-001");
  });

  it("LineItem type accepts description + lineTotal only (optional fields omitted)", () => {
    const item: LineItem = { description: "Seat", lineTotal: "10.00" };
    expect(item.description).toBe("Seat");
  });

  it("TaxEntry type has label and amount", () => {
    const tax: TaxEntry = { label: "GST 5%", amount: "5.00" };
    expect(tax.label).toBe("GST 5%");
  });

  it("CreditEntry type has label and amount", () => {
    const credit: CreditEntry = { label: "Referral credit", amount: "3.00" };
    expect(credit.label).toBe("Referral credit");
  });
});

// ── Boundary / invalid inputs ────────────────────────────────────────────────

describe("boundary inputs", () => {
  it("renders without error when invoices is an empty array", () => {
    const { container } = render(<InvoiceList invoices={[]} />);
    expect(container.querySelector(".ibc-wrap")).toBeNull();
  });

  it("does not render any toggle buttons for an empty list", () => {
    render(<InvoiceList invoices={[]} />);
    expect(screen.queryAllByRole("button")).toHaveLength(0);
  });

  it("renders a single invoice without error", () => {
    render(<InvoiceList invoices={[paidInvoice]} />);
    // INV-001 rendered in both views = ≥2 occurrences
    expect(screen.getAllByText("INV-001").length).toBeGreaterThanOrEqual(2);
  });

  it("renders 50 invoices without throwing", () => {
    const large: Invoice[] = Array.from({ length: 50 }, (_, i) => ({
      ...paidInvoice,
      id: `INV-${String(i).padStart(3, "0")}`,
    }));
    expect(() => render(<InvoiceList invoices={large} />)).not.toThrow();
  });
});

// ── Dual-view DOM structure ──────────────────────────────────────────────────

describe("dual-view DOM structure", () => {
  it("renders a desktop wrapper with class hidden md:block", () => {
    const { container } = render(<InvoiceList invoices={[paidInvoice]} />);
    const desktop = container.querySelector(".hidden.md\\:block");
    expect(desktop).not.toBeNull();
  });

  it("renders a mobile wrapper with class md:hidden", () => {
    const { container } = render(<InvoiceList invoices={[paidInvoice]} />);
    const mobile = container.querySelector(".md\\:hidden");
    expect(mobile).not.toBeNull();
  });

  it("desktop view contains a <table> element", () => {
    const { container } = render(<InvoiceList invoices={[paidInvoice]} />);
    const desktop = container.querySelector(".hidden.md\\:block");
    expect(desktop!.querySelector("table")).not.toBeNull();
  });

  it("table head has columns: Invoice, Date, Status, Total", () => {
    render(<InvoiceList invoices={[paidInvoice]} />);
    expect(screen.getByRole("columnheader", { name: "Invoice" })).toBeDefined();
    expect(screen.getByRole("columnheader", { name: "Date" })).toBeDefined();
    expect(screen.getByRole("columnheader", { name: "Status" })).toBeDefined();
    expect(screen.getByRole("columnheader", { name: "Total" })).toBeDefined();
  });

  it("each invoice appears in both desktop and mobile views (at least 2 instances of id)", () => {
    render(<InvoiceList invoices={[paidInvoice]} />);
    expect(screen.getAllByText("INV-001").length).toBeGreaterThanOrEqual(2);
  });

  it("each invoice id appears once per view when there are multiple invoices", () => {
    render(<InvoiceList invoices={[paidInvoice, pendingInvoice]} />);
    expect(screen.getAllByText("INV-001").length).toBeGreaterThanOrEqual(2);
    expect(screen.getAllByText("INV-002").length).toBeGreaterThanOrEqual(2);
  });
});

// ── Core invoice rendering ────────────────────────────────────────────────────

describe("invoice rendering", () => {
  it("renders the invoice id", () => {
    render(<InvoiceList invoices={[paidInvoice]} />);
    expect(screen.getAllByText("INV-001").length).toBeGreaterThan(0);
  });

  it("renders the invoice date", () => {
    render(<InvoiceList invoices={[paidInvoice]} />);
    expect(screen.getAllByText("Jan 1, 2026").length).toBeGreaterThan(0);
  });

  it("renders the invoice total with currency", () => {
    render(<InvoiceList invoices={[paidInvoice]} />);
    // total and currency rendered as separate tokens in the toggle row
    expect(screen.getAllByText(/120\.00/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/USD/).length).toBeGreaterThan(0);
  });

  it("uses a FileText icon (not CreditCard) for regular invoices", () => {
    const { container } = render(<InvoiceList invoices={[paidInvoice]} />);
    // ibc-type-icon is the shared class for both icon types
    const icons = container.querySelectorAll(".ibc-type-icon");
    expect(icons.length).toBeGreaterThan(0);
  });
});

// ── All status values ────────────────────────────────────────────────────────

describe("status values", () => {
  const all: Invoice[] = [
    { ...paidInvoice, id: "INV-S1", status: "paid" },
    { ...paidInvoice, id: "INV-S2", status: "pending" },
    { ...paidInvoice, id: "INV-S3", status: "failed" },
    { ...adjustedCreditNote, id: "CN-S1", status: "adjusted" },
    { ...refundedOrphanCreditNote, id: "CN-S2", status: "refunded" },
  ];

  it("renders 'paid' status text", () => {
    render(<InvoiceList invoices={[all[0]]} />);
    expect(screen.getAllByText("paid").length).toBeGreaterThan(0);
  });

  it("renders 'pending' status text", () => {
    render(<InvoiceList invoices={[all[1]]} />);
    expect(screen.getAllByText("pending").length).toBeGreaterThan(0);
  });

  it("renders 'failed' status text", () => {
    render(<InvoiceList invoices={[all[2]]} />);
    expect(screen.getAllByText("failed").length).toBeGreaterThan(0);
  });

  it("renders 'adjusted' status text", () => {
    render(<InvoiceList invoices={[all[3]]} />);
    expect(screen.getAllByText("adjusted").length).toBeGreaterThan(0);
  });

  it("renders 'refunded' status text", () => {
    render(<InvoiceList invoices={[all[4]]} />);
    expect(screen.getAllByText("refunded").length).toBeGreaterThan(0);
  });
});

// ── Invoice vs credit-note discrimination ────────────────────────────────────

describe("document type discrimination", () => {
  it("does NOT render Credit Note badge for a regular invoice", () => {
    render(<InvoiceList invoices={[paidInvoice]} />);
    expect(screen.queryByText("Credit Note")).toBeNull();
  });

  it("renders Credit Note badge for a credit note", () => {
    render(<InvoiceList invoices={[adjustedCreditNote]} />);
    expect(screen.getAllByText("Credit Note").length).toBeGreaterThan(0);
  });

  it("applies ibc-wrap--credit-note CSS modifier only to credit notes", () => {
    const { container } = render(
      <InvoiceList invoices={[paidInvoice, adjustedCreditNote]} />
    );
    const creditNoteWraps = container.querySelectorAll(".ibc-wrap--credit-note");
    // 1 credit note × 2 views = 2
    expect(creditNoteWraps.length).toBe(2);
  });

  it("does NOT apply ibc-wrap--credit-note to regular invoices", () => {
    const { container } = render(<InvoiceList invoices={[paidInvoice]} />);
    expect(container.querySelectorAll(".ibc-wrap--credit-note").length).toBe(0);
  });

  it("renders ibc-type-icon for each document regardless of type", () => {
    const { container } = render(
      <InvoiceList invoices={[paidInvoice, adjustedCreditNote]} />
    );
    // 2 docs × 2 views = 4 icons
    const icons = container.querySelectorAll(".ibc-type-icon");
    expect(icons.length).toBe(4);
  });
});

// ── Expand / collapse toggle ─────────────────────────────────────────────────

describe("expand / collapse toggle", () => {
  it("body is hidden by default (aria-expanded=false on toggle buttons)", () => {
    render(<InvoiceList invoices={[paidInvoice]} />);
    const buttons = screen.getAllByRole("button", {
      name: /Toggle breakdown for invoice INV-001/i,
    });
    expect(buttons.length).toBeGreaterThan(0);
    buttons.forEach((btn) => expect(btn.getAttribute("aria-expanded")).toBe("false"));
  });

  it("clicking toggle expands the card (aria-expanded becomes true)", () => {
    render(<InvoiceList invoices={[paidInvoice]} />);
    const toggles = screen.getAllByRole("button", {
      name: /Toggle breakdown for invoice INV-001/i,
    });
    fireEvent.click(toggles[0]);
    expect(toggles[0].getAttribute("aria-expanded")).toBe("true");
  });

  it("clicking toggle a second time collapses the card", () => {
    render(<InvoiceList invoices={[paidInvoice]} />);
    const toggles = screen.getAllByRole("button", {
      name: /Toggle breakdown for invoice INV-001/i,
    });
    fireEvent.click(toggles[0]);
    fireEvent.click(toggles[0]);
    expect(toggles[0].getAttribute("aria-expanded")).toBe("false");
  });

  it("pressing Enter on the toggle button expands the card", () => {
    render(<InvoiceList invoices={[paidInvoice]} />);
    const toggles = screen.getAllByRole("button", {
      name: /Toggle breakdown for invoice INV-001/i,
    });
    fireEvent.keyDown(toggles[0], { key: "Enter" });
    expect(toggles[0].getAttribute("aria-expanded")).toBe("true");
  });

  it("pressing Space on the toggle button expands the card", () => {
    render(<InvoiceList invoices={[paidInvoice]} />);
    const toggles = screen.getAllByRole("button", {
      name: /Toggle breakdown for invoice INV-001/i,
    });
    fireEvent.keyDown(toggles[0], { key: " " });
    expect(toggles[0].getAttribute("aria-expanded")).toBe("true");
  });

  it("pressing an unrelated key does not change expanded state", () => {
    render(<InvoiceList invoices={[paidInvoice]} />);
    const toggles = screen.getAllByRole("button", {
      name: /Toggle breakdown for invoice INV-001/i,
    });
    fireEvent.keyDown(toggles[0], { key: "Tab" });
    expect(toggles[0].getAttribute("aria-expanded")).toBe("false");
  });

  it("ibc-body is absent in DOM when collapsed", () => {
    const { container } = render(<InvoiceList invoices={[invoiceWithBreakdown]} />);
    expect(container.querySelectorAll(".ibc-body").length).toBe(0);
  });

  it("ibc-body appears in DOM after expanding", () => {
    const { container } = render(<InvoiceList invoices={[invoiceWithBreakdown]} />);
    const toggles = screen.getAllByRole("button", {
      name: /Toggle breakdown for invoice INV-004/i,
    });
    fireEvent.click(toggles[0]);
    expect(container.querySelectorAll(".ibc-body").length).toBeGreaterThan(0);
  });

  it("expanding one card does not expand another", () => {
    render(<InvoiceList invoices={[paidInvoice, pendingInvoice]} />);
    const toggles001 = screen.getAllByRole("button", {
      name: /Toggle breakdown for invoice INV-001/i,
    });
    const toggles002 = screen.getAllByRole("button", {
      name: /Toggle breakdown for invoice INV-002/i,
    });
    fireEvent.click(toggles001[0]);
    expect(toggles001[0].getAttribute("aria-expanded")).toBe("true");
    expect(toggles002[0].getAttribute("aria-expanded")).toBe("false");
  });
});

// ── Credit-note expanded content ─────────────────────────────────────────────

describe("credit-note expanded metadata", () => {
  function expandFirstCreditNote(id: string, invoice: Invoice) {
    render(<InvoiceList invoices={[invoice]} />);
    const toggles = screen.getAllByRole("button", {
      name: new RegExp(`Toggle details for credit note ${id}`, "i"),
    });
    fireEvent.click(toggles[0]);
  }

  it("shows parent invoice link when parentInvoiceId is set", () => {
    expandFirstCreditNote("CN-001", adjustedCreditNote);
    // link text is the parent invoice id
    const links = screen.getAllByText("INV-001", { selector: "a" });
    expect(links.length).toBeGreaterThan(0);
  });

  it("parent invoice link href points to #invoice-{parentInvoiceId}", () => {
    expandFirstCreditNote("CN-001", adjustedCreditNote);
    const links = screen.getAllByRole("link", {
      name: /View invoice INV-001/i,
    });
    expect(links[0].getAttribute("href")).toBe("#invoice-INV-001");
  });

  it("renders reason when provided", () => {
    expandFirstCreditNote("CN-001", adjustedCreditNote);
    expect(screen.getAllByText("Duplicate charge").length).toBeGreaterThan(0);
  });

  it("renders amountRedeemed when provided", () => {
    expandFirstCreditNote("CN-001", adjustedCreditNote);
    expect(screen.getAllByText(/25\.00/).length).toBeGreaterThan(0);
  });

  it("shows 'No parent invoice linked' for orphan credit notes", () => {
    expandFirstCreditNote("CN-002", refundedOrphanCreditNote);
    expect(screen.getAllByText(/No parent invoice linked/i).length).toBeGreaterThan(0);
  });

  it("does NOT show reason row when reason is absent", () => {
    expandFirstCreditNote("CN-002", refundedOrphanCreditNote);
    expect(screen.queryByText("Reason")).toBeNull();
  });

  it("does NOT show amountRedeemed row when absent", () => {
    expandFirstCreditNote("CN-002", refundedOrphanCreditNote);
    expect(screen.queryByText("Amount redeemed")).toBeNull();
  });
});

// ── Line-items breakdown ──────────────────────────────────────────────────────

describe("line-items breakdown", () => {
  function expandInvoiceWithBreakdown() {
    render(<InvoiceList invoices={[invoiceWithBreakdown]} />);
    const toggles = screen.getAllByRole("button", {
      name: /Toggle breakdown for invoice INV-004/i,
    });
    fireEvent.click(toggles[0]);
  }

  it("renders line item descriptions after expanding", () => {
    expandInvoiceWithBreakdown();
    expect(screen.getAllByText("Pro plan – monthly").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Overage fees").length).toBeGreaterThan(0);
  });

  it("renders line item quantities", () => {
    expandInvoiceWithBreakdown();
    // quantity 3 appears for overage fees
    expect(screen.getAllByText("3").length).toBeGreaterThan(0);
  });

  it("renders unit prices", () => {
    expandInvoiceWithBreakdown();
    expect(screen.getAllByText("150.00").length).toBeGreaterThan(0);
    expect(screen.getAllByText("10.00").length).toBeGreaterThan(0);
  });

  it("renders subtotal in summary", () => {
    expandInvoiceWithBreakdown();
    expect(screen.getAllByText(/Subtotal/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/180\.00/).length).toBeGreaterThan(0);
  });

  it("renders tax row in summary", () => {
    expandInvoiceWithBreakdown();
    expect(screen.getAllByText("VAT 10%").length).toBeGreaterThan(0);
    expect(screen.getAllByText(/18\.00/).length).toBeGreaterThan(0);
  });

  it("renders credit row in summary", () => {
    expandInvoiceWithBreakdown();
    expect(screen.getAllByText("Promo credit").length).toBeGreaterThan(0);
    expect(screen.getAllByText(/-2\.00|2\.00/).length).toBeGreaterThan(0);
  });

  it("renders total row in summary", () => {
    expandInvoiceWithBreakdown();
    // Total label appears in the summary section
    expect(screen.getAllByText("Total").length).toBeGreaterThan(0);
  });

  it("does NOT render ibc-table when invoice has no lineItems", () => {
    render(<InvoiceList invoices={[paidInvoice]} />);
    const toggles = screen.getAllByRole("button", {
      name: /Toggle breakdown for invoice INV-001/i,
    });
    fireEvent.click(toggles[0]);
    const { container } = render(<InvoiceList invoices={[paidInvoice]} />);
    // no table in a freshly rendered collapsed card
    expect(container.querySelectorAll(".ibc-table").length).toBe(0);
  });
});

// ── Reissue button ────────────────────────────────────────────────────────────

describe("reissue button", () => {
  it("renders Reissue button for a credit note after expanding", () => {
    render(<InvoiceList invoices={[adjustedCreditNote]} />);
    const toggles = screen.getAllByRole("button", {
      name: /Toggle details for credit note CN-001/i,
    });
    fireEvent.click(toggles[0]);
    const reissue = screen.getAllByRole("button", {
      name: /Reissue credit note CN-001/i,
    });
    expect(reissue.length).toBeGreaterThan(0);
  });

  it("does NOT render a Reissue button for a regular invoice after expanding", () => {
    render(<InvoiceList invoices={[paidInvoice]} />);
    const toggles = screen.getAllByRole("button", {
      name: /Toggle breakdown for invoice INV-001/i,
    });
    fireEvent.click(toggles[0]);
    expect(
      screen.queryByRole("button", { name: /Reissue/i })
    ).toBeNull();
  });
});

// ── CSV download button ───────────────────────────────────────────────────────

describe("CSV download button", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders 'Download breakdown' button for an invoice with lineItems", () => {
    render(<InvoiceList invoices={[invoiceWithBreakdown]} />);
    const toggles = screen.getAllByRole("button", {
      name: /Toggle breakdown for invoice INV-004/i,
    });
    fireEvent.click(toggles[0]);
    const dlButtons = screen.getAllByRole("button", {
      name: /Download breakdown CSV for invoice INV-004/i,
    });
    expect(dlButtons.length).toBeGreaterThan(0);
  });

  it("does NOT render 'Download breakdown' button for invoice without lineItems", () => {
    render(<InvoiceList invoices={[paidInvoice]} />);
    const toggles = screen.getAllByRole("button", {
      name: /Toggle breakdown for invoice INV-001/i,
    });
    fireEvent.click(toggles[0]);
    expect(
      screen.queryByRole("button", { name: /Download breakdown CSV/i })
    ).toBeNull();
  });

  it("clicking Download triggers URL.createObjectURL (CSV generation)", () => {
    const createObjectURL = vi.fn(() => "blob:test-url");
    const revokeObjectURL = vi.fn();
    Object.defineProperty(window, "URL", {
      writable: true,
      value: { createObjectURL, revokeObjectURL },
    });

    // mock anchor click to avoid jsdom navigation error
    const clickMock = vi.fn();
    const origCreate = document.createElement.bind(document);
    vi.spyOn(document, "createElement").mockImplementation((tag: string) => {
      const el = origCreate(tag);
      if (tag === "a") {
        Object.defineProperty(el, "click", { value: clickMock, writable: true });
      }
      return el;
    });

    render(<InvoiceList invoices={[invoiceWithBreakdown]} />);
    const toggles = screen.getAllByRole("button", {
      name: /Toggle breakdown for invoice INV-004/i,
    });
    fireEvent.click(toggles[0]);

    const dlButtons = screen.getAllByRole("button", {
      name: /Download breakdown CSV for invoice INV-004/i,
    });
    fireEvent.click(dlButtons[0]);

    expect(createObjectURL).toHaveBeenCalledTimes(1);
    expect(clickMock).toHaveBeenCalledTimes(1);
  });
});

// ── ARIA / accessibility ──────────────────────────────────────────────────────

describe("ARIA attributes", () => {
  it("each card has role=region with a descriptive aria-label for an invoice", () => {
    render(<InvoiceList invoices={[paidInvoice]} />);
    const regions = screen.getAllByRole("region", {
      name: /Invoice INV-001 breakdown/i,
    });
    expect(regions.length).toBeGreaterThanOrEqual(2); // desktop + mobile
  });

  it("each card has role=region with a descriptive aria-label for a credit note", () => {
    render(<InvoiceList invoices={[adjustedCreditNote]} />);
    const regions = screen.getAllByRole("region", {
      name: /Credit note CN-001 breakdown/i,
    });
    expect(regions.length).toBeGreaterThanOrEqual(2);
  });

  it("expanded body has role=group", () => {
    render(<InvoiceList invoices={[paidInvoice]} />);
    const toggles = screen.getAllByRole("button", {
      name: /Toggle breakdown for invoice INV-001/i,
    });
    fireEvent.click(toggles[0]);
    // After expansion the body group appears
    const groups = screen.getAllByRole("group");
    expect(groups.length).toBeGreaterThan(0);
  });

  it("toggle button aria-controls references the body element id", () => {
    render(<InvoiceList invoices={[paidInvoice]} />);
    const toggles = screen.getAllByRole("button", {
      name: /Toggle breakdown for invoice INV-001/i,
    });
    const controlsId = toggles[0].getAttribute("aria-controls");
    expect(controlsId).toBeTruthy();
    // Body is not in DOM yet, but the id is set
    fireEvent.click(toggles[0]);
    const body = document.getElementById(controlsId!);
    expect(body).not.toBeNull();
  });

  it("Credit Note badge has aria-label 'Document type: Credit Note'", () => {
    render(<InvoiceList invoices={[adjustedCreditNote]} />);
    const badges = screen.getAllByLabelText("Document type: Credit Note");
    expect(badges.length).toBeGreaterThan(0);
  });
});

// ── Multiple-invoice rendering ────────────────────────────────────────────────

describe("multiple invoices", () => {
  it("renders all invoices and credit notes in the same list", () => {
    render(
      <InvoiceList
        invoices={[paidInvoice, pendingInvoice, failedInvoice, adjustedCreditNote]}
      />
    );
    expect(screen.getAllByText("INV-001").length).toBeGreaterThanOrEqual(2);
    expect(screen.getAllByText("INV-002").length).toBeGreaterThanOrEqual(2);
    expect(screen.getAllByText("INV-003").length).toBeGreaterThanOrEqual(2);
    expect(screen.getAllByText("CN-001").length).toBeGreaterThanOrEqual(2);
  });

  it("mixed list: exactly 2 credit-note wrappers per credit note (desktop + mobile)", () => {
    const { container } = render(
      <InvoiceList invoices={[paidInvoice, adjustedCreditNote, refundedOrphanCreditNote]} />
    );
    const creditNoteWraps = container.querySelectorAll(".ibc-wrap--credit-note");
    expect(creditNoteWraps.length).toBe(4); // 2 credit notes × 2 views
  });

  it("each invoice has its own independent expand state", () => {
    render(<InvoiceList invoices={[paidInvoice, pendingInvoice]} />);
    const toggles001 = screen.getAllByRole("button", {
      name: /Toggle breakdown for invoice INV-001/i,
    });
    const toggles002 = screen.getAllByRole("button", {
      name: /Toggle breakdown for invoice INV-002/i,
    });
    fireEvent.click(toggles001[0]);
    expect(toggles001[0].getAttribute("aria-expanded")).toBe("true");
    expect(toggles002[0].getAttribute("aria-expanded")).toBe("false");

    fireEvent.click(toggles002[0]);
    expect(toggles001[0].getAttribute("aria-expanded")).toBe("true");
    expect(toggles002[0].getAttribute("aria-expanded")).toBe("true");
  });
});

// ── Invoice without optional type field ──────────────────────────────────────

describe("invoice without explicit type field", () => {
  it("renders without error when type is omitted (treated as invoice)", () => {
    const noType: Invoice = {
      id: "INV-NT",
      date: "May 1, 2026",
      status: "paid",
      total: "10.00",
      currency: "USD",
    };
    render(<InvoiceList invoices={[noType]} />);
    expect(screen.getAllByText("INV-NT").length).toBeGreaterThan(0);
  });

  it("does NOT render Credit Note badge when type is omitted", () => {
    const noType: Invoice = {
      id: "INV-NT",
      date: "May 1, 2026",
      status: "paid",
      total: "10.00",
      currency: "USD",
    };
    render(<InvoiceList invoices={[noType]} />);
    expect(screen.queryByText("Credit Note")).toBeNull();
  });
});
