import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Subscriptions from './pages/Subscriptions'
import SubscriptionDetail from './pages/SubscriptionDetail'
import Plans from './pages/Plans'
import UIMockups from './pages/UIMockups'
import Landing from './pages/Landing'
import OnboardingSuccess from './pages/OnboardingSuccess'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/onboarding-success" element={<OnboardingSuccess />} />
      <Route path="/dashboard" element={<Layout><Dashboard /></Layout>} />
      <Route path="/subscriptions" element={<Layout><Subscriptions /></Layout>} />
      <Route path="/subscriptions/:id" element={<Layout><SubscriptionDetail /></Layout>} />
      <Route path="/plans" element={<Layout><Plans /></Layout>} />
      <Route path="/ui-kit" element={<UIMockups />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
