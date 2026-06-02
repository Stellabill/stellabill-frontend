import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Subscriptions from './pages/Subscriptions'
import SubscriptionDetail from './pages/SubscriptionDetail' // Fixed: Added missing import
import Plans from './pages/Plans'
import CreatePlan from './pages/CreatePlan'
import UIMockups from './pages/UIMockups'
import Landing from './pages/Landing'
import BrowsePlans from './pages/BrowsePlans'
import OnboardingPayout from './pages/OnboardingPayout'
import OnboardingReviewPage from './components/OnboardingReview'
import UsageBilling from './pages/UsageBilling'
import OnboardingSuccess from './pages/OnboardingSuccess'
import AboutPrepaidBalances from './components/AboutPrepaidBalances'
import Pricing from "./pages/Pricing"
import BrandPack from "./pages/BrandPack"
import NotFound from "./pages/NotFound"

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
        <Route path="/brand" element={<BrandPack />} />
      </Route>

      {/* 3. Catch-all — renders the 404 / not-found screen */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default App;
