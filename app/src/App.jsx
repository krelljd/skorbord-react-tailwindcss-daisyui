
import { Routes, Route, Navigate, useParams } from 'react-router-dom'
import { useAuth0 } from '@auth0/auth0-react'
import CardApp from './components/CardApp.jsx'
import LoginScreen from './components/LoginScreen.jsx'
import LoadingSpinner from './components/LoadingSpinner.jsx'
import { ConnectionProvider } from './contexts/ConnectionContext.jsx'
import { AuthProvider } from './contexts/AuthContext.jsx'
import ConnectionStatus from './components/ConnectionStatus.jsx'

// Protected wrapper that requires authentication
function ProtectedCardApp() {
  const { sqid } = useParams()
  const { isAuthenticated, isLoading } = useAuth0()

  if (isLoading) {
    return <LoadingSpinner />
  }

  if (!isAuthenticated) {
    return <LoginScreen />
  }

  return (
    <ConnectionProvider sqid={sqid}>
      <ConnectionStatus />
      <CardApp />
    </ConnectionProvider>
  )
}

function App() {
  return (
    <AuthProvider>
      <div className="min-h-screen bg-base-100">
        <Routes>
          {/* Main card scoring route with authentication */}
          <Route path="/cards/:sqid" element={<ProtectedCardApp />} />

          {/* Redirect root to demo with auth check */}
          <Route path="/" element={<Navigate to="/cards/demo" replace />} />

          {/* Catch-all redirect */}
          <Route path="*" element={<Navigate to="/cards/demo" replace />} />
        </Routes>
      </div>
    </AuthProvider>
  )
}

export default App
