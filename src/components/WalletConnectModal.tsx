import { useEffect, useRef, useState } from "react";
import "./WalletConnectModal.css";

interface WalletConnectModalProps {
	isOpen: boolean;
	onClose: () => void;
	onConnected?: () => void;
	// This helps testing different states for the UI mockup
	initialState?: "list" | "connecting" | "failed";
}

const WALLETS = [
	{
		id: "metamask",
		name: "MetaMask",
		icon: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT3ymr3UNKopfI0NmUY95Dr-0589vG-91KuAA&s",
	},
	{
		id: "walletconnect",
		name: "WalletConnect",
		icon: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQFVFwIyuEzH7TqY2iAgVvWn3bAC3RVMsLNnw&s",
	},
	{
		id: "coinbase",
		name: "Coinbase Wallet",
		icon: "https://www.cryptocompare.com/media/37747630/coinbase.png",
	},
	{
		id: "phantom",
		name: "Phantom",
		icon: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRj0y5ZuqGsyKKhKvp7js0ZjiV6gt4Br_AzUA&s",
	},
];

export default function WalletConnectModal({
	isOpen,
	onClose,
	initialState = "list",
}: WalletConnectModalProps) {
	const [viewState, setViewState] = useState<"list" | "connecting" | "failed">(
		initialState,
	);
	const [selectedWallet, setSelectedWallet] = useState<
		(typeof WALLETS)[0] | null
	>(null);
	const modalRef = useRef<HTMLDivElement>(null);
	const previousFocusRef = useRef<HTMLElement | null>(null);

	// Reset state when opened and manage focus return
	useEffect(() => {
		if (isOpen) {
			setViewState(initialState);
			setSelectedWallet(null);
			previousFocusRef.current = document.activeElement as HTMLElement;
		} else if (previousFocusRef.current) {
			// Return focus to the element that triggered the modal
			previousFocusRef.current.focus();
			previousFocusRef.current = null;
		}
	}, [isOpen, initialState]);

	// Focus trap logic
	useEffect(() => {
		if (!isOpen) return;

		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.key === "Escape") {
				onClose();
				return;
			}

			if (e.key === "Tab") {
				const focusableElements = modalRef.current?.querySelectorAll(
					'a[href], button, input, select, textarea, [tabindex]:not([tabindex="-1"])',
				);
				if (!focusableElements?.length) return;

				const firstElement = focusableElements[0] as HTMLElement;
				const lastElement = focusableElements[
					focusableElements.length - 1
				] as HTMLElement;

				if (e.shiftKey && document.activeElement === firstElement) {
					lastElement.focus();
					e.preventDefault();
				} else if (!e.shiftKey && document.activeElement === lastElement) {
					firstElement.focus();
					e.preventDefault();
				}
			}
		};

		document.addEventListener("keydown", handleKeyDown);
		// Focus first element slightly after mount to ensure DOM is ready
		setTimeout(() => {
			const firstFocusable = modalRef.current?.querySelector("button");
			firstFocusable?.focus();
		}, 50);

		return () => document.removeEventListener("keydown", handleKeyDown);
	}, [isOpen, onClose]);

	if (!isOpen) return null;

	const handleWalletClick = (wallet: (typeof WALLETS)[0]) => {
		setSelectedWallet(wallet);
		setViewState("connecting");

		// Simulate connection process for the mockup
		// In a real app this would be integrated with web3 libraries
		setTimeout(() => {
			// Randomly fail 50% of the time for demonstration purposes
			if (Math.random() > 0.5) {
				setViewState("failed");
			} else {
				// Assume success, close modal
				onClose();
				// Here you would trigger external success callback or toast
			}
		}, 2000);
	};

	return (
		<div
			className="wallet-modal-overlay"
			onClick={(e) => e.target === e.currentTarget && onClose()}
			role="dialog"
			aria-modal="true"
			aria-labelledby="modal-title">
			<div className="wallet-modal-content" ref={modalRef}>
				<div className="wallet-modal-header">
					<h2 id="modal-title" className="wallet-modal-title">
						{viewState === "list" && "Connect Wallet"}
						{viewState === "connecting" && "Connecting..."}
						{viewState === "failed" && "Connection Failed"}
					</h2>
					<button
						className="wallet-close-btn"
						onClick={onClose}
						aria-label="Close modal">
						<svg
							width="24"
							height="24"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							strokeWidth="2"
							strokeLinecap="round"
							strokeLinejoin="round">
							<line x1="18" y1="6" x2="6" y2="18"></line>
							<line x1="6" y1="6" x2="18" y2="18"></line>
						</svg>
					</button>
				</div>

				{viewState === "list" && (
					<>
						<div className="wallet-list" role="list">
							{WALLETS.map((wallet) => (
								<button
									key={wallet.id}
									className="wallet-item"
									onClick={() => handleWalletClick(wallet)}
									role="listitem">
									<div className="wallet-info">
										<div className="wallet-icon" aria-hidden="true">
											<img
												src={wallet.icon}
												alt={wallet.name}
												style={{
													width: "100%",
													height: "100%",
													objectFit: "contain",
													borderRadius: "4px",
												}}
											/>
										</div>
										<span className="wallet-name">{wallet.name}</span>
									</div>
									<span className="wallet-status">Connect</span>
								</button>
							))}
						</div>
						<div className="wallet-footer">
							<p style={{ margin: 0 }}>
								New to Ethereum?{" "}
								<a href="#" className="wallet-link">
									What is a wallet?
								</a>
							</p>
						</div>
					</>
				)}

				{viewState === "connecting" && (
					<div className="wallet-connecting">
						<div className="spinner"></div>
						<h3 className="wallet-state-title">
							Confirm in {selectedWallet?.name}
						</h3>
						<p className="wallet-state-desc">
							Accept the signature request in your wallet to confirm connection.
						</p>
					</div>
				)}

				{viewState === "failed" && (
					<div className="wallet-failed">
						<div className="wallet-failed-icon">
							<svg
								width="24"
								height="24"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								strokeWidth="2"
								strokeLinecap="round"
								strokeLinejoin="round">
								<circle cx="12" cy="12" r="10"></circle>
								<line x1="15" y1="9" x2="9" y2="15"></line>
								<line x1="9" y1="9" x2="15" y2="15"></line>
							</svg>
						</div>
						<h3 className="wallet-state-title" style={{ textAlign: "center" }}>
							Connection Rejected
						</h3>
						<p className="wallet-state-desc" style={{ textAlign: "center" }}>
							The connection request was rejected or failed. Please try again.
						</p>
						<button className="retry-btn" onClick={() => setViewState("list")}>
							Try Again
						</button>
						<button className="cancel-btn" onClick={onClose}>
							Cancel
						</button>
					</div>
				)}
			</div>
		</div>
	);
}
