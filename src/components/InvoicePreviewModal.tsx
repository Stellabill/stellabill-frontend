import React, { useState } from 'react';
import { Modal } from './common/Modal';
import { PdfThumbnailNavigator } from './PdfThumbnailNavigator';

export interface InvoicePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoiceId: string | null;
}

export const InvoicePreviewModal: React.FC<InvoicePreviewModalProps> = ({
  isOpen,
  onClose,
  invoiceId,
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const numPages = 5; // Mock 5 pages for the preview

  if (!isOpen || !invoiceId) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Preview Invoice ${invoiceId}`}
      maxWidth="xl"
    >
      <div className="flex h-[60vh] min-h-[400px] border border-gray-200 rounded-lg overflow-hidden bg-gray-50 relative">
        <PdfThumbnailNavigator
          numPages={numPages}
          currentPage={currentPage}
          onPageChange={setCurrentPage}
          className="flex-shrink-0"
        />
        
        <div className="flex-1 flex flex-col items-center justify-center p-8 overflow-y-auto bg-gray-100 relative">
          {/* Mock PDF Page Content */}
          <div className="w-full max-w-[400px] bg-white shadow-lg h-full max-h-[800px] p-8 border border-gray-200 text-center flex flex-col justify-between">
            <div>
              <h2 className="text-2xl font-bold mb-4">Invoice {invoiceId}</h2>
              <div className="text-gray-500 mb-8">Page {currentPage} of {numPages}</div>
              
              <div className="space-y-4">
                <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto"></div>
                <div className="h-4 bg-gray-200 rounded w-full mx-auto"></div>
                <div className="h-4 bg-gray-200 rounded w-5/6 mx-auto"></div>
              </div>
            </div>
            
            <div className="text-sm text-gray-400">
              Generated for display purposes only
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default InvoicePreviewModal;
