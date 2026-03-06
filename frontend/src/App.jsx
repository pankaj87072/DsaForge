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
  const hostname = window.location.hostname;

  // LOGIC: If the URL is a validation subdomain (e.g., validate.yourdomain.com 
  // or contains 'validate' in the railway subdomain), show ONLY the validation page.
  // Otherwise, show the full application.
  const isValidationSubdomain = hostname.includes('validate') && !hostname.includes('localhost');

  if (isValidationSubdomain) {
    return (
      <BrowserRouter>
        <Routes>
          <Route path="*" element={<IdeaValidationPage />} />
        </Routes>
      </BrowserRouter>
    )
  }

  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/validate" element={<IdeaValidationPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/onboarding" element={<OnboardingRoute><OnboardingPage /></OnboardingRoute>} />
          <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
          <Route path="/practice/:level" element={<ProtectedRoute><PracticePage /></ProtectedRoute>} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
