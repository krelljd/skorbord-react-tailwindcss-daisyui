import { createContext, useContext, useEffect, useState } from 'react'
import { useAuth0 } from '@auth0/auth0-react'

const AuthContext = createContext()

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const { 
    user, 
    isAuthenticated, 
    isLoading, 
    loginWithRedirect, 
    logout, 
    getAccessTokenSilently 
  } = useAuth0()
  
  const [accessToken, setAccessToken] = useState(null)

  // Get access token for API calls and WebSocket auth
  useEffect(() => {
    const getToken = async () => {
      if (isAuthenticated) {
        try {
          const token = await getAccessTokenSilently()
          setAccessToken(token)
        } catch (error) {
          console.error('Failed to get access token:', error)
        }
      }
    }
    
    getToken()
  }, [isAuthenticated, getAccessTokenSilently])

  const login = () => {
    loginWithRedirect({
      appState: { returnTo: window.location.pathname }
    })
  }

  const handleLogout = () => {
    logout({ 
      logoutParams: { 
        returnTo: window.location.origin 
      } 
    })
  }

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated,
      isLoading,
      accessToken,
      login,
      logout: handleLogout
    }}>
      {children}
    </AuthContext.Provider>
  )
}
