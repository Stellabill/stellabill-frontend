import React, { useState } from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

export interface ModalA11yContractOptions {
  /** Human-readable name for the describe block */
  name: string;
  /** Expected ARIA role on the dialog element. Defaults to `'dialog'`. */
  role?: 'dialog' | 'alertdialog';
  /**
   * Renders the modal controlled by `isOpen` and `onClose`.
   * The helper wraps it with a trigger button so focus restoration can be verified.
   */
  renderModal: (props: { isOpen: boolean; onClose: () => void }) => React.ReactElement;
}

/**
 * Shared test helper verifying the core modal accessibility contract from
 * `docs/DOCS_MODAL_ACCESSIBILITY.md`:
 * - `role="dialog"` (or `"alertdialog"`) and `aria-modal="true"`
 * - `aria-labelledby` points to a rendered element in the document
 * - Pressing `Escape` triggers `onClose`
 * - Closing the modal restores focus to the trigger element that opened it
 */
export function describeModalAccessibility({
  name,
  role = 'dialog',
  renderModal,
}: ModalA11yContractOptions) {
  function Harness({ onCloseSpy }: { onCloseSpy: () => void }) {
    const [open, setOpen] = useState(false);

    const handleClose = () => {
      onCloseSpy();
      setOpen(false);
    };

    return (
      <div>
        <button type="button" onClick={() => setOpen(true)}>
          Open {name}
        </button>
        {renderModal({ isOpen: open, onClose: handleClose })}
      </div>
    );
  }

  describe(`${name} accessibility contract`, () => {
    it(`exposes role="${role}", aria-modal="true", and a valid aria-labelledby`, () => {
      const onClose = vi.fn();
      render(<Harness onCloseSpy={onClose} />);

      fireEvent.click(screen.getByRole('button', { name: `Open ${name}` }));

      const dialog = screen.getByRole(role);
      expect(dialog).toHaveAttribute('aria-modal', 'true');

      const labelledBy = dialog.getAttribute('aria-labelledby');
      expect(labelledBy).toBeTruthy();
      expect(document.getElementById(labelledBy!)).toBeInTheDocument();
    });

    it('closes when Escape is pressed and restores focus to the trigger button', async () => {
      const onClose = vi.fn();
      render(<Harness onCloseSpy={onClose} />);

      const trigger = screen.getByRole('button', { name: `Open ${name}` });
      trigger.focus();
      expect(document.activeElement).toBe(trigger);

      fireEvent.click(trigger);
      expect(screen.getByRole(role)).toBeInTheDocument();

      fireEvent.keyDown(document, { key: 'Escape' });

      expect(onClose).toHaveBeenCalledTimes(1);
      expect(screen.queryByRole(role)).not.toBeInTheDocument();

      await waitFor(() => {
        expect(document.activeElement).toBe(trigger);
      });
    });
  });
}
