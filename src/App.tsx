import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Subscriptions from './pages/Subscriptions'
import SubscriptionDetail from './pages/SubscriptionDetail'
import Plans from './pages/Plans'
import CreatePlan from './pages/CreatePlan'
import UIMockups from './pages/UIMockups'
import Landing from './pages/Landing'
import OnboardingPayout from './pages/OnboardingPayout'
import OnboardingReviewPage from './components/OnboardingReview'
import UsageBilling from './pages/UsageBilling'
import OnboardingSuccess from './pages/OnboardingSuccess'
import AboutPrepaidBalances from './components/AboutPrepaidBalances'
import Pricing from "./pages/Pricing";

function App() {
  return (
    <Routes>
      {/* Public routes without Layout */}
      <Route path="/" element={<Landing />} />
      <Route path="/about-prepaid-balances" element={<AboutPrepaidBalances />} />
      <Route path="/onboarding-success" element={<OnboardingSuccess />} />
      <Route path="/pricing" element={<Pricing />} />
      <Route path="/onboarding/payout" element={<OnboardingPayout />} />
      <Route path="/onboarding/review" element={<OnboardingReviewPage />} />
      
      {/* Routes with Layout wrapper using nested routes */}
      <Route element={<Layout />}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/plans" element={<Plans />} />
        <Route path="/plans/create" element={<CreatePlan />} />
        <Route path="/subscriptions" element={<Subscriptions />} />
        <Route path="/subscriptions/:id" element={<SubscriptionDetail />} />
        <Route path="/subscriptions/:id/usage" element={<UsageBilling />} />
        <Route path="/ui-kit" element={<UIMockups />} />
      </Route>

      {/* Catch-all redirect */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
