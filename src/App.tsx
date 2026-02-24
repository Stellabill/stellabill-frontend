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
import CreatePlan from "./pages/CreatePlan";
import Pricing from "./pages/Pricing";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/about-prepaid-balances" element={<AboutPrepaidBalances />} />
      <Route path="/onboarding-success" element={<OnboardingSuccess />} />

      <Route path="/dashboard" element={<Layout><Dashboard /></Layout>} />
      <Route path="/plans" element={<Layout><Plans /></Layout>} />
      <Route path="/plans/create" element={<Layout><CreatePlan /></Layout>} />
      <Route path="/subscriptions" element={<Layout><Subscriptions /></Layout>} />
      <Route path="/subscriptions/:id" element={<Layout><SubscriptionDetail /></Layout>} />
      <Route path="/subscriptions/:id/usage" element={<Layout><UsageBilling /></Layout>} />

      <Route path="/plans" element={<Layout><Plans /></Layout>} />
      <Route path="/plans/new" element={<CreatePlan />} />

      <Route path="/ui-kit" element={<Layout><UIMockups /></Layout>} />
      <Route path="/pricing" element={<Pricing />} />

      <Route path="/onboarding/payout" element={<OnboardingPayout />} />
      <Route path="/onboarding/review" element={<OnboardingReviewPage />} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;