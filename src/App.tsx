import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Subscriptions from './pages/Subscriptions'
import SubscriptionDetail from './pages/SubscriptionDetail'
import Plans from './pages/Plans'
import UIMockups from './pages/UIMockups'
import Landing from './pages/Landing'
import UsageBilling from './pages/UsageBilling'
import OnboardingSuccess from './pages/OnboardingSuccess'
import AboutPrepaidBalances from './components/AboutPrepaidBalances'
import CreatePlan from "./pages/CreatePlan"
import Pricing from "./pages/Pricing"

function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/about-prepaid-balances" element={<AboutPrepaidBalances />} />
      <Route path="/onboarding-success" element={<OnboardingSuccess />} />
      <Route path="/ui-kit" element={<UIMockups />} />
      <Route path="/plans/new" element={<CreatePlan />} />
      <Route path="/pricing" element={<Pricing />} />
      <Route element={<Layout />}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/subscriptions" element={<Subscriptions />} />
        <Route path="/subscriptions/:id/usage" element={<UsageBilling />} />
        <Route path="/subscriptions/:id" element={<SubscriptionDetail />} />
        <Route path="/plans" element={<Plans />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
