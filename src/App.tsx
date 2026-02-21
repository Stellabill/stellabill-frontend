import { Routes, Route, Navigate } from 'react-router-dom'
import Index from './pages/Index'
import BrowserPlan from './pages/BrowserPlan'
import Plans from './pages/Plans'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Index />} />
      <Route path="/browser-plan" element={<BrowserPlan />} />
      <Route path="/plans" element={<Plans />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
