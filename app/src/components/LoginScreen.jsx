import { useAuth } from '../contexts/AuthContext.jsx'

const LoginScreen = () => {
  const { login } = useAuth()

  return (
    <div className="min-h-screen flex items-center justify-center bg-base-100 p-4">
      <div className="card w-full max-w-md bg-base-200 shadow-xl">
        <div className="card-body items-center text-center">
          <h1 className="card-title text-3xl mb-4">🎯 Skorbord</h1>
          <p className="text-base-content/70 mb-8 text-4vw">
            Real-time card game scoring
          </p>
          
          <button 
            className="btn btn-primary w-full text-4vw"
            onClick={login}
          >
            Sign In to Continue
          </button>
          
          <p className="text-xs text-base-content/50 mt-4">
            Secure authentication powered by Auth0
          </p>
        </div>
      </div>
    </div>
  )
}

export default LoginScreen
