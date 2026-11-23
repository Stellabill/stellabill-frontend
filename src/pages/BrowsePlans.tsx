import WalletConnectModal from "../components/WalletConnectModal";
import GiftPurchaseModal from "../components/GiftPurchaseModal";
import { FreighterConnectionError } from "../wallet/freighter";
import { usePageTitle } from "../hooks/usePageTitle";
import { useBrowsePlansPage } from "../hooks/useBrowsePlansPage";
import BrowsePlansFilterBar from "./browsePlans/BrowsePlansFilterBar";
import BrowsePlansGrid from "./browsePlans/BrowsePlansGrid";

export default function BrowsePlans() {
	usePageTitle("Browse Plans");
	const state = useBrowsePlansPage();

	return (
		<div style={{ padding: "2rem", background: "#0a0a0a", minHeight: "100vh" }}>
			<div style={{ maxWidth: 1280, margin: "0 auto" }}>
				<div style={{ marginBottom: "2rem" }}>
					<h1
						style={{
							color: "#ffffff",
							fontSize: "2rem",
							fontWeight: 700,
							margin: "0 0 0.5rem",
						}}>
						Browse Plans
					</h1>
					<p style={{ color: "#94a3b8", margin: 0, fontSize: "1rem" }}>
						Discover subscription plans from verified merchants on Stellar
					</p>
				</div>

				<BrowsePlansFilterBar
					searchQuery={state.searchQuery}
					onSearchChange={state.setSearchQuery}
					intervalFilter={state.intervalFilter}
					onIntervalChange={state.setIntervalFilter}
					sortField={state.sortField}
					sortDirection={state.sortDirection}
					onSortChange={state.handleSortChange}
					onClearFilters={state.clearFilters}
				/>

				<div style={{ marginBottom: "1.5rem" }}>
					<span style={{ color: "#64748b", fontSize: "0.875rem" }}>
						{state.filteredPlans.length}{" "}
						{state.filteredPlans.length === 1 ? "plan" : "plans"} found
					</span>
				</div>

				<BrowsePlansGrid
					plans={state.filteredPlans}
					loading={state.loading}
					error={state.error}
					onRetry={state.fetchPlans}
					onSubscribe={state.handleSubscribe}
					onSendGift={state.handleSendGift}
					onClearFilters={state.clearFilters}
				/>

				<WalletConnectModal
					isOpen={state.walletModalOpen}
					onClose={() => {
						state.cancelConnect();
						state.setWalletModalOpen(false);
					}}
					onConnectFreighter={state.handleWalletConnect}
					connectionState={state.status}
					errorMessage={state.walletError?.message}
					errorType={
						state.walletError instanceof FreighterConnectionError
							? state.walletError.type
							: undefined
					}
					onRetry={state.clearError}
				/>

				<GiftPurchaseModal
					isOpen={state.giftModalOpen}
					onClose={() => state.setGiftModalOpen(false)}
					plan={state.selectedPlanForGift}
					onPurchaseComplete={state.handleGiftPurchaseComplete}
				/>
			</div>
		</div>
	);
}
