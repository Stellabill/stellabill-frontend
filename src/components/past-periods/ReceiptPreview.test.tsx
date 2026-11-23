import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import ReceiptPreview, { safeCurrencyParse } from "./ReceiptPreview";
import type { ReceiptData } from "./ReceiptPreview";

const BASE_RECEIPT: ReceiptData = {
  receiptId: "RCPT-001234567",
  issueDate: "Mar 31, 2026",
  merchantName: "Stellabill",
  merchantBrand: "Stellabill Billing",
  merchantAddress: "123 Nebula Avenue, Suite 100",
  merchantEmail: "billing@stellabill.example",
  merchantTaxId: "TAX-EXAMPLE-001",
  clientName: "Developer Pro",
  clientAddress: "Client billing address",
  clientEmail: "client@company.example",
  clientTaxId: "CLIENT-TAX-EXAMPLE",
  currency: "USDC",
  lineItems: [
    {
      id: "li-1",
      description: "API usage for Mar 1 – Mar 31, 2026",
      quantity: 32450,
      unitPrice: { amount: 0.0005, currency: "USDC" },
      lineTotal: { amount: 15.2, currency: "USDC" },
    },
    {
      id: "li-2",
      description: "Usage adjustment / rounding",
      quantity: 1,
      unitPrice: { amount: 1.03, currency: "USDC" },
      lineTotal: { amount: 1.03, currency: "USDC" },
    },
  ],
  subtotal: { amount: 16.23, currency: "USDC" },
  taxes: [{ label: "Network / protocol fee", amount: { amount: 0, currency: "USDC" } }],
  total: { amount: 16.23, currency: "USDC" },
  paymentMethod: "Prepaid balance",
  transactionKey: "TX-8F2A9C0D3E",
  reference: "Billing period Mar 1 – Mar 31, 2026",
  terms: "Non-refundable services rendered in full.",
};

describe("ReceiptPreview", () => {
  beforeEach(() => {
    vi.useRealTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it("renders the empty billing receipt state for missing data", () => {
    render(<ReceiptPreview receipt={null} />);

    expect(screen.getByRole("status")).toHaveTextContent("No billing receipts found");
    expect(screen.getByText(/Select a historic billing period/i)).toBeInTheDocument();
  });

  it("renders the receipt document and totals for a valid billing period", () => {
    render(<ReceiptPreview receipt={BASE_RECEIPT} />);

    expect(screen.getByRole("heading", { name: "Billing Receipt Preview" })).toBeInTheDocument();
    expect(screen.getByText("Stellabill Billing — Stellabill")).toBeInTheDocument();
    expect(screen.getByText("Developer Pro")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Download PDF/i })).toBeInTheDocument();
    expect(screen.getByText("Subtotal")).toBeInTheDocument();
    expect(screen.getByText("Total")).toBeInTheDocument();
    const totalCells = screen.getAllByText("16.23 USDC");
    expect(totalCells.length).toBeGreaterThanOrEqual(2);
  });

  it("validates currency parsing and rejects malformed values safely", () => {
    expect(safeCurrencyParse("12.34 USDC")).toEqual({ amount: 12.34, currency: "USDC" });
    expect(safeCurrencyParse("USDC 12,34")).toEqual({ amount: 12.34, currency: "USDC" });
    expect(safeCurrencyParse("invalid")).toBeNull();
    expect(safeCurrencyParse("   ")).toBeNull();
  });

  it("invokes window.print() via the print root when Download PDF is clicked and resets on afterprint", async () => {
    const user = userEvent.setup();
    const printSpy = vi.spyOn(window, "print").mockImplementation(() => undefined);

    const { container } = render(<ReceiptPreview receipt={BASE_RECEIPT} />);
    expect(container.querySelector(".invoice-print-root")).toBeInTheDocument();

    const button = screen.getByRole("button", { name: /Download PDF/i });
    await user.click(button);

    expect(printSpy).toHaveBeenCalledTimes(1);
    expect(screen.getByText("Download started.")).toBeInTheDocument();

    window.dispatchEvent(new Event("afterprint"));

    await waitFor(() => {
      expect(screen.queryByText("Download started.")).not.toBeInTheDocument();
    });
    expect(screen.getByRole("button", { name: /Download PDF/i })).not.toBeDisabled();
  });

  it("shows an error alert if window.print() throws", async () => {
    const user = userEvent.setup();
    vi.spyOn(window, "print").mockImplementation(() => {
      throw new Error("Print unavailable");
    });

    render(<ReceiptPreview receipt={BASE_RECEIPT} />);
    await user.click(screen.getByRole("button", { name: /Download PDF/i }));

    expect(screen.getByRole("alert")).toHaveTextContent("Unable to open print dialog.");
  });
});
