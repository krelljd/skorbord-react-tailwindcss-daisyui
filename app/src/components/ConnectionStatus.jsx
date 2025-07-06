import { useConnection } from '../contexts/ConnectionContext.jsx'

const ConnectionStatus = () => {
  const { isConnected, connectionError, isReconnecting } = useConnection()

  if (isConnected && !connectionError) {
    return (
      <div className="connection-indicator connection-connected">
        ✓ Connected
      </div>
    )
  }

  if (isReconnecting) {
    return (
      <div className="connection-indicator badge-warning">
        🔄 Reconnecting...
      </div>
    )
  }

  if (connectionError) {
    return (
      <div className="connection-indicator connection-disconnected">
        ⚠ Connection Error
      </div>
    )
  }

  return (
    <div className="connection-indicator connection-disconnected">
      ❌ Disconnected
    </div>
  )
}

export default ConnectionStatus
