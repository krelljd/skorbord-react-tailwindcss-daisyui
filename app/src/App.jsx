import { Routes, Route, Navigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import CardApp from './components/CardApp.jsx'
import { ConnectionProvider } from './contexts/ConnectionContext.jsx'
import ConnectionStatus from './components/ConnectionStatus.jsx'

function App() {
  // Check if we're on a valid route pattern
  const isValidRoute = window.location.pathname.startsWith('/cards/')
  
  return (
    <div className="min-h-screen bg-base-100">
      <ConnectionProvider>
        <ConnectionStatus />
        <Routes>
          {/* Main card scoring route with Sqid parameter */}
          <Route path="/cards/:sqid" element={<CardApp />} />
          
          {/* Redirect root to a default Sqid for demo purposes */}
          <Route path="/" element={<Navigate to="/cards/demo" replace />} />
          
          {/* Catch-all redirect to demo */}
          <Route path="*" element={<Navigate to="/cards/demo" replace />} />
        </Routes>
      </ConnectionProvider>
    </div>
  )
}

export default App
