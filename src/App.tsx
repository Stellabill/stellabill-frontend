import { lazy, Suspense, useEffect } from "react";
import { Navigate, Routes, Route, useLocation, Outlet } from "react-router-dom";
import NotFound from "./pages/NotFound";
import Layout from "./components/Layout";
import TransitionLayout from "./components/TransitionLayout";
import RouteErrorBoundary from "./components/RouteErrorBoundary";
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Subscriptions = lazy(() => import("./pages/Subscriptions"));
const SubscriptionDetail = lazy(() => import("./pages/SubscriptionDetail"));
const Plans = lazy(() => import("./pages/Plans"));
const CreatePlan = lazy(() => import("./pages/CreatePlan"));
const Landing = lazy(() => import("./pages/Landing"));
const BrowsePlans = lazy(() => import("./pages/BrowsePlans"));
const OnboardingBusiness = lazy(() => import("./pages/OnboardingBusiness"));
const OnboardingPayout = lazy(() => import("./pages/OnboardingPayout"));
const OnboardingReviewPage = lazy(() => import("./components/OnboardingReview"));
const UsageBilling = lazy(() => import("./pages/UsageBilling"));
const OnboardingSuccess = lazy(() => import("./pages/OnboardingSuccess"));
const GiftRedeemSuccess = lazy(() => import("./pages/GiftRedeemSuccess"));
const RedeemGift = lazy(() => import("./pages/RedeemGift"));
const AboutPrepaidBalances = lazy(() => import("./components/AboutPrepaidBalances"));
const Pricing = lazy(() => import("./pages/Pricing"));
const BrandPack = lazy(() => import("./pages/BrandPack"));
const Settings = lazy(() => import("./pages/Settings"));
const DesignTokens = lazy(() => import("./pages/DesignTokens"));
const WalletDetailView = lazy(() => import("./pages/WalletDetailView"));

const ONBOARDING_BUSINESS_KEY = "onboardingBusiness";
const ONBOARDING_PAYOUT_KEY = "onboardingPayout";

function hasStoredBusiness(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const raw = sessionStorage.getItem(ONBOARDING_BUSINESS_KEY);
    if (!raw) return false;
    const parsed = JSON.parse(raw);
    return Boolean(parsed && typeof parsed === "object");
  } catch {
    return false;
  }
}

function OnboardingPayoutGuard() {
  if (!hasStoredBusiness()) {
    return <Navigate to="/onboarding/business" replace />;
  }
  return <OnboardingPayout />;
}

function ScrollToHash() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (hash) {
      const el = document.getElementById(hash.slice(1));
      if (el) {
        el.scrollIntoView({ behavior: "smooth" });
        return;
      }
    }
    window.scrollTo(0, 0);
  }, [pathname, hash]);
  return null;
}

function App() {
  const location = useLocation();
  return (
    <>
    <ScrollToHash />
    <Suspense fallback={<div style={{ minHeight: '100vh' }} role="status" aria-label="Loading" />}>
    <Routes>
      {/* 1. Public Routes (No Layout) */}
      <Route
        element={
          <RouteErrorBoundary pathname={location.pathname}>
            <Outlet />
          </RouteErrorBoundary>
        }
      >
      <Route path="/" element={<Landing />} />
      <Route path="/landing" element={<Navigate to="/" replace />} />
      <Route path="/pricing" element={<Pricing />} />
      <Route
        path="/about-prepaid-balances"
        element={<AboutPrepaidBalances />}
      />
      <Route
        path="/onboarding"
        element={<Navigate to="/onboarding/business" replace />}
      />
      <Route path="/onboarding/business" element={<OnboardingBusiness />} />
      <Route path="/onboarding/payout" element={<OnboardingPayoutGuard />} />
      <Route path="/onboarding/review" element={<OnboardingReviewPage />} />
      <Route path="/onboarding-success" element={<OnboardingSuccess />} />
      <Route path="/redeem-gift" element={<RedeemGift />} />
      <Route path="/gift-redeem-success" element={<GiftRedeemSuccess />} />
      </Route>

      {/* 2. Authenticated Routes (Wrapped in Layout) */}
      <Route element={<Layout />}>
        <Route element={<TransitionLayout />}>
          {/* Redirect base dashboard path to specific dashboard component if needed */}
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/browse-plans" element={<BrowsePlans />} />
          {/* Plans Management */}
          <Route path="/plans" element={<Plans />} />
          <Route path="/plans/create" element={<CreatePlan />} />
          <Route path="/plans/new" element={<CreatePlan />} />{" "}
          {/* Alias for flexibility */}
          {/* Subscriptions Management */}
          <Route path="/subscriptions" element={<Subscriptions />} />
          <Route path="/subscriptions/:id" element={<SubscriptionDetail />} />
          <Route path="/subscriptions/:id/usage" element={<UsageBilling />} />
          <Route path="/wallet" element={<WalletDetailView />} />
          <Route path="/settings" element={<Settings />} />
          {/* Development/UI Kit */}
          <Route path="/brand" element={<BrandPack />} />
          <Route path="/design-tokens" element={<DesignTokens />} />
        </Route>
      </Route>

      {/* 3. Catch-all redirect - Sends users back to the dashboard for safety */}
      <Route
        path="*"
        element={
          <RouteErrorBoundary pathname={location.pathname}>
            <NotFound />
          </RouteErrorBoundary>
        }
      />
    </Routes>
    </Suspense>
    </>
  );
}

export default App;
