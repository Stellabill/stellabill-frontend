import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import WalletConnectModal from '../../components/WalletConnectModal';
import { ConnectionState } from '../../components/ConnectButton';

describe('WalletConnectModal', () => {
  const onClose = vi.fn();
  const onConnectFreighter = vi.fn();
  const onRetry = vi.fn();

  beforeEach(() => {
    onClose.mockClear();
    onConnectFreighter.mockClear();
    onRetry.mockClear();
    document.body.innerHTML = '';
  });

  describe('Accessibility', () => {
    it('traps focus when open', async () => {
      render(
        <WalletConnectModal 
          isOpen={true} 
          onClose={onClose} 
          connectionState="disconnected"
        />
      );

      const modal = screen.getByRole('dialog');
      expect(modal).toBeInTheDocument();

      // Wait for initial focus
      await waitFor(() => {
        const closeBtn = screen.getByLabelText(/close modal/i);
        expect(document.activeElement).toBe(closeBtn);
      });

      const focusableElements = screen.getAllByRole('button').filter(el => !(el as HTMLButtonElement).disabled);
      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      // Shift+Tab on first element should go to last element
      firstElement.focus();
      fireEvent.keyDown(firstElement, { key: 'Tab', shiftKey: true });
      expect(document.activeElement).toBe(lastElement);

      // Tab on last element should go to first element
      lastElement.focus();
      fireEvent.keyDown(lastElement, { key: 'Tab' });
      expect(document.activeElement).toBe(firstElement);
    });

    it('closes on Escape key', () => {
      render(
        <WalletConnectModal 
          isOpen={true} 
          onClose={onClose} 
          connectionState="disconnected"
        />
      );

      fireEvent.keyDown(document, { key: 'Escape' });
      expect(onClose).toHaveBeenCalled();
    });

    it('restores focus to previous element on close', async () => {
      const trigger = document.createElement('button');
      trigger.innerText = 'Open Modal';
      document.body.appendChild(trigger);
      trigger.focus();
      const previousFocus = document.activeElement;

      const { rerender } = render(
        <WalletConnectModal 
          isOpen={true} 
          onClose={onClose} 
          connectionState="disconnected"
        />
      );

      // Close the modal
      rerender(
        <WalletConnectModal 
          isOpen={false} 
          onClose={onClose} 
          connectionState="disconnected"
        />
      );

      expect(document.activeElement).toBe(previousFocus);
    });

    it('has proper ARIA attributes in disconnected state', () => {
      render(
        <WalletConnectModal 
          isOpen={true} 
          onClose={onClose} 
          connectionState="disconnected"
        />
      );

      const modal = screen.getByRole('dialog');
      expect(modal).toHaveAttribute('aria-modal', 'true');
      expect(modal).toHaveAttribute('aria-labelledby', 'modal-title');
      expect(modal).toHaveAttribute('aria-describedby', 'modal-description');
      expect(modal).not.toHaveAttribute('aria-busy');
      
      expect(screen.getByRole('heading', { name: /connect your/i })).toHaveAttribute('id', 'modal-title');
      expect(screen.getByText(/sign in with your wallet/i)).toHaveAttribute('id', 'modal-description');
    });

    it('has proper ARIA attributes in connecting state', () => {
      render(
        <WalletConnectModal 
          isOpen={true} 
          onClose={onClose} 
          connectionState="connecting"
        />
      );

      const modal = screen.getByRole('dialog');
      expect(modal).toHaveAttribute('aria-modal', 'true');
      expect(modal).toHaveAttribute('aria-labelledby', 'modal-title');
      expect(modal).not.toHaveAttribute('aria-describedby');
      expect(modal).toHaveAttribute('aria-busy', 'true');
    });

    it('has proper ARIA attributes in error state', () => {
      render(
        <WalletConnectModal 
          isOpen={true} 
          onClose={onClose} 
          connectionState="error"
          errorMessage="Connection failed"
        />
      );

      const modal = screen.getByRole('dialog');
      expect(modal).toHaveAttribute('aria-modal', 'true');
      expect(modal).toHaveAttribute('aria-labelledby', 'modal-title');
      expect(modal).not.toHaveAttribute('aria-describedby');
      expect(modal).not.toHaveAttribute('aria-busy');
    });
  });

  describe('Connection States', () => {
    it('displays wallet options in disconnected state', () => {
      render(
        <WalletConnectModal 
          isOpen={true} 
          onClose={onClose} 
          connectionState="disconnected"
        />
      );

      expect(screen.getByRole('heading', { name: /connect your/i })).toBeInTheDocument();
      expect(screen.getByText(/sign in with your wallet/i)).toBeInTheDocument();
      expect(screen.getByText(/freighter/i)).toBeInTheDocument();
      expect(screen.getByText(/lobstr/i)).toBeInTheDocument();
      expect(screen.getAllByText('Connect').some((btn) => !(btn as HTMLButtonElement).disabled)).toBe(true);
    });

    it('displays connecting state with spinner', () => {
      render(
        <WalletConnectModal 
          isOpen={true} 
          onClose={onClose} 
          connectionState="connecting"
        />
      );

      expect(screen.getByText('Connecting...')).toBeInTheDocument();
      expect(screen.getByText(/confirm in freighter/i)).toBeInTheDocument();
      expect(screen.getByText(/accept the signature request/i)).toBeInTheDocument();
      expect(document.querySelector('.spinner')).toBeInTheDocument();
    });

    it('displays error state with retry options', () => {
      render(
        <WalletConnectModal 
          isOpen={true} 
          onClose={onClose} 
          connectionState="error"
          errorMessage="Connection rejected by user"
          onRetry={onRetry}
        />
      );

      expect(screen.getByText('Connection Failed')).toBeInTheDocument();
      expect(screen.getByText('Connection rejected by user')).toBeInTheDocument();
      expect(screen.getByText('Try Again')).toBeInTheDocument();
      expect(screen.getByText('Get Help')).toBeInTheDocument();
      expect(screen.getByText('Cancel')).toBeInTheDocument();
    });

    it('displays default error message when none provided', () => {
      render(
        <WalletConnectModal 
          isOpen={true} 
          onClose={onClose} 
          connectionState="error"
          onRetry={onRetry}
        />
      );

      expect(screen.getByText(/the connection request was rejected or failed/i)).toBeInTheDocument();
    });
  });

  describe('Interactions', () => {
    it('calls onConnectFreighter when connect button is clicked', () => {
      render(
        <WalletConnectModal 
          isOpen={true} 
          onClose={onClose} 
          connectionState="disconnected"
          onConnectFreighter={onConnectFreighter}
        />
      );

      const connectButton = screen.getAllByText('Connect').find(
        (button) => !(button as HTMLButtonElement).disabled
      ) as HTMLButtonElement;
      fireEvent.click(connectButton);
      
      expect(onConnectFreighter).toHaveBeenCalled();
    });

    it('calls onRetry when retry button is clicked', () => {
      render(
        <WalletConnectModal 
          isOpen={true} 
          onClose={onClose} 
          connectionState="error"
          onRetry={onRetry}
        />
      );

      const retryButton = screen.getByText('Try Again');
      fireEvent.click(retryButton);
      
      expect(onRetry).toHaveBeenCalled();
    });

    it('opens help documentation when help button is clicked', () => {
      const mockOpen = vi.spyOn(window, 'open').mockImplementation();
      
      render(
        <WalletConnectModal 
          isOpen={true} 
          onClose={onClose} 
          connectionState="error"
        />
      );

      const helpButton = screen.getByText('Get Help');
      fireEvent.click(helpButton);
      
      expect(mockOpen).toHaveBeenCalledWith('https://docs.stellar.org/wallets', '_blank');
      
      mockOpen.mockRestore();
    });

    it('calls onClose when cancel button is clicked in error state', () => {
      render(
        <WalletConnectModal 
          isOpen={true} 
          onClose={onClose} 
          connectionState="error"
        />
      );

      const cancelButton = screen.getByText('Cancel');
      fireEvent.click(cancelButton);
      
      expect(onClose).toHaveBeenCalled();
    });

    it('prevents overlay click during connecting state', () => {
      render(
        <WalletConnectModal 
          isOpen={true} 
          onClose={onClose} 
          connectionState="connecting"
        />
      );

      const overlay = screen.getByRole('dialog');
      fireEvent.click(overlay);
      
      expect(onClose).not.toHaveBeenCalled();
    });

    it('allows overlay click in disconnected state', () => {
      render(
        <WalletConnectModal 
          isOpen={true} 
          onClose={onClose} 
          connectionState="disconnected"
        />
      );

      const overlay = screen.getByRole('dialog');
      fireEvent.click(overlay);
      
      expect(onClose).toHaveBeenCalled();
    });

    it('allows overlay click in error state', () => {
      render(
        <WalletConnectModal 
          isOpen={true} 
          onClose={onClose} 
          connectionState="error"
        />
      );

      const overlay = screen.getByRole('dialog');
      fireEvent.click(overlay);
      
      expect(onClose).toHaveBeenCalled();
    });
  });

  describe('Edge Cases', () => {
    it('does not render when isOpen is false', () => {
      render(
        <WalletConnectModal 
          isOpen={false} 
          onClose={onClose} 
          connectionState="disconnected"
        />
      );

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('handles missing onConnectFreighted gracefully', () => {
      render(
        <WalletConnectModal 
          isOpen={true} 
          onClose={onClose} 
          connectionState="disconnected"
        />
      );

      const connectButton = screen.getAllByText('Connect').find(
        (button) => !(button as HTMLButtonElement).disabled
      ) as HTMLButtonElement;
      expect(() => fireEvent.click(connectButton)).not.toThrow();
    });

    it('handles missing onRetry gracefully', () => {
      render(
        <WalletConnectModal 
          isOpen={true} 
          onClose={onClose} 
          connectionState="error"
        />
      );

      const retryButton = screen.getByText('Try Again');
      expect(() => fireEvent.click(retryButton)).not.toThrow();
    });
  });
});
