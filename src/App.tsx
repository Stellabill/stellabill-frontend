import { Navigate, Route, Routes } from "react-router-dom";
import AboutPrepaidBalances from "./components/AboutPrepaidBalances";
import Layout from "./components/Layout";
import OnboardingReviewPage from "./components/OnboardingReview";
import BrowsePlans from "./pages/BrowsePlans";
import CreatePlan from "./pages/CreatePlan";
import Dashboard from "./pages/Dashboard";
import Landing from "./pages/Landing";
import OnboardingPayout from "./pages/OnboardingPayout";
import OnboardingSuccess from "./pages/OnboardingSuccess";
import Plans from "./pages/Plans";
import Pricing from "./pages/Pricing";
import SubscriptionDetail from "./pages/SubscriptionDetail"; // Fixed: Added missing import
import Subscriptions from "./pages/Subscriptions";
import UIMockups from "./pages/UIMockups";
import UsageBilling from "./pages/UsageBilling";

function App() {
  return (
    <Routes>
      {/* 1. Public Routes (No Layout) */}
      <Route path="/" element={<Landing />} />
      <Route path="/pricing" element={<Pricing />} />
      <Route
        path="/about-prepaid-balances"
        element={<AboutPrepaidBalances />}
      />
      <Route path="/onboarding-success" element={<OnboardingSuccess />} />
      <Route path="/onboarding/payout" element={<OnboardingPayout />} />
      <Route path="/onboarding/review" element={<OnboardingReviewPage />} />

      {/* 2. Authenticated Routes (Wrapped in Layout) */}
      <Route element={<Layout />}>
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
        {/* Development/UI Kit */}
        <Route path="/ui-kit" element={<UIMockups />} />
        {/* Settings */}
        <Route path="/settings" element={<Settings />} />
      </Route>

      {/* 3. Catch-all redirect - Sends users back to Landing for safety */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
