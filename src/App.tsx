import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Subscriptions from './pages/Subscriptions'
import SubscriptionDetail from './pages/SubscriptionDetail'
import Plans from './pages/Plans'
import UIMockups from './pages/UIMockups'
import Landing from './pages/Landing'
import UIMockups from './pages/UIMockups'
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
      <Route path="/subscriptions" element={<Layout><Subscriptions /></Layout>} />
      <Route path="/subscriptions/:id/usage" element={<Layout><UsageBilling /></Layout>} />
      <Route path="/plans" element={<Layout><Plans /></Layout>} />
      <Route path="/ui-kit" element={<Layout><UIMockups /></Layout>} />
      <Route path="/subscriptions/:id" element={<Layout><SubscriptionDetail /></Layout>} />
      <Route path="/plans" element={<Layout><Plans /></Layout>} />
      <Route path="/ui-kit" element={<UIMockups />} />
      <Route path="/plans/new" element={<CreatePlan />} />
      <Route path="/pricing" element={<Pricing />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
