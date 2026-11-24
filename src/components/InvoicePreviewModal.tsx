import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Download, Printer } from 'lucide-react';
import { Modal } from './common/Modal';
import { PdfThumbnailNavigator } from './PdfThumbnailNavigator';
import InvoicePrintRoot, { type PaperSize } from './InvoicePrintRoot';
import InvoiceBreakdownCard, {
  type InvoiceWithBreakdown,
  type LineItem,
} from './InvoiceBreakdownCard';
import { buildInvoiceCsv, downloadCsvFile } from '../utils/statement';

export const DEFAULT_ITEMS_PER_PAGE = 8;

export function paginateLineItems(
  lineItems: LineItem[] = [],
  itemsPerPage: number = DEFAULT_ITEMS_PER_PAGE,
): LineItem[][] {
  const safeSize = Math.max(1, Math.floor(itemsPerPage));
  if (lineItems.length === 0) return [[]];

  const pages: LineItem[][] = [];
  for (let i = 0; i < lineItems.length; i += safeSize) {
    pages.push(lineItems.slice(i, i + safeSize));
  }
  return pages;
}

export interface InvoicePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoiceId: string | null;
  invoice?: InvoiceWithBreakdown | null;
  itemsPerPage?: number;
  paper?: PaperSize;
  numPages?: number;
}

export const InvoicePreviewModal: React.FC<InvoicePreviewModalProps> = ({
  isOpen,
  onClose,
  invoiceId,
  invoice,
  itemsPerPage = DEFAULT_ITEMS_PER_PAGE,
  paper: initialPaper = 'a4',
  numPages: numPagesProp,
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [paper, setPaper] = useState<PaperSize>(initialPaper);

  useEffect(() => {
    setPaper(initialPaper);
  }, [initialPaper]);

  const resolvedInvoice = useMemo<InvoiceWithBreakdown | null>(() => {
    if (!invoiceId) return null;
    if (invoice) return invoice;
    return {
      id: invoiceId,
      date: new Date().toISOString().slice(0, 10),
      status: 'paid',
      total: '0.00',
      currency: 'USDC',
      lineItems: [],
    };
  }, [invoiceId, invoice]);

  const pages = useMemo(
    () => paginateLineItems(resolvedInvoice?.lineItems ?? [], itemsPerPage),
    [resolvedInvoice, itemsPerPage],
  );
  const numPages = Math.max(
    1,
    numPagesProp ?? pages.length,
  );
  const safePage = Math.min(Math.max(1, currentPage), numPages);

  useEffect(() => {
    setCurrentPage(1);
  }, [invoiceId, invoice?.id]);

  const handlePrintPdf = useCallback(() => {
    if (!resolvedInvoice) return;
    const prevTitle = document.title;
    document.title = `invoice-${resolvedInvoice.id}`;
    try {
      window.print();
    } finally {
      document.title = prevTitle;
    }
  }, [resolvedInvoice]);

  const handleDownloadCsv = useCallback(() => {
    if (!resolvedInvoice) return;
    const csv = buildInvoiceCsv(resolvedInvoice);
    downloadCsvFile(`invoice-${resolvedInvoice.id}.csv`, csv);
  }, [resolvedInvoice]);

  if (!isOpen || !invoiceId || !resolvedInvoice) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Preview Invoice ${resolvedInvoice.id}`}
      maxWidth="xl"
    >
      <div
        className="no-print flex flex-wrap items-center justify-between gap-3 mb-3 pb-3 border-b border-gray-200"
        data-print="hide"
      >
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <label htmlFor="invoice-paper-size" className="font-medium">
            Paper:
          </label>
          <select
            id="invoice-paper-size"
            value={paper}
            onChange={(e) => setPaper(e.target.value as PaperSize)}
            className="border border-gray-300 rounded px-2 py-1 text-sm bg-white text-gray-900"
          >
            <option value="a4">A4</option>
            <option value="letter">Letter</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleDownloadCsv}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium border border-gray-300 bg-white text-gray-800 hover:bg-gray-50 cursor-pointer"
          >
            <Download size={15} aria-hidden="true" />
            Download CSV
          </button>
          <button
            type="button"
            onClick={handlePrintPdf}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium bg-cyan-600 text-white hover:bg-cyan-700 cursor-pointer"
          >
            <Printer size={15} aria-hidden="true" />
            Download PDF / Print
          </button>
        </div>
      </div>

      <div className="flex h-[60vh] min-h-[400px] border border-gray-200 rounded-lg overflow-hidden bg-gray-50 relative">
        <PdfThumbnailNavigator
          numPages={numPages}
          currentPage={safePage}
          onPageChange={setCurrentPage}
          className="flex-shrink-0 no-print"
        />

        <div className="flex-1 overflow-y-auto bg-gray-100 p-6">
          <InvoicePrintRoot paper={paper} showTrigger={false}>
            {pages.map((pageItems, idx) => {
              const pageNumber = idx + 1;
              const isLastPage = pageNumber === numPages;
              const isVisibleOnScreen = pageNumber === safePage;

              const pageInvoice: InvoiceWithBreakdown = {
                ...resolvedInvoice,
                lineItems: pageItems,
                subtotal: isLastPage ? resolvedInvoice.subtotal : undefined,
                taxes: isLastPage ? resolvedInvoice.taxes : undefined,
                credits: isLastPage ? resolvedInvoice.credits : undefined,
              };

              return (
                <div
                  key={pageNumber}
                  data-testid={`invoice-preview-page-${pageNumber}`}
                  className={[
                    'invoice-preview-page w-full max-w-[680px] mx-auto bg-white shadow-lg p-6 border border-gray-200 text-gray-900',
                    idx > 0 ? 'page-break-before' : '',
                    !isVisibleOnScreen ? 'hidden invoice-preview-page--hidden' : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                >
                  <div className="flex items-baseline justify-between mb-4 pb-3 border-b border-gray-200">
                    <h2 className="text-xl font-bold text-gray-900">
                      Invoice {resolvedInvoice.id}
                    </h2>
                    <div className="text-sm text-gray-500">
                      Page {pageNumber} of {numPages}
                    </div>
                  </div>

                  <InvoiceBreakdownCard invoice={pageInvoice} defaultExpanded />
                </div>
              );
            })}
          </InvoicePrintRoot>
        </div>
      </div>
    </Modal>
  );
};

export default InvoicePreviewModal;
