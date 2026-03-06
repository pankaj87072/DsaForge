import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './hooks/useAuth'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import OnboardingPage from './pages/OnboardingPage'
import DashboardPage from './pages/DashboardPage'
import PracticePage from './pages/PracticePage'
import IdeaValidationPage from './pages/IdeaValidationPage'

function ProtectedRoute({ children }) {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  if (!user.onboarding_complete) return <Navigate to="/onboarding" replace />
  return children
}

function OnboardingRoute({ children }) {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  if (user.onboarding_complete) return <Navigate to="/dashboard" replace />
  return children
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="*" element={<IdeaValidationPage />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
