import { useState, useEffect } from 'react'
import './App.css'

function App() {
  const [health, setHealth] = useState<{ status: string; service?: string } | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const checkHealth = async () => {
      try {
        const response = await fetch('/api/v1/health')
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        const data = await response.json()
        setHealth(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to connect to backend')
      } finally {
        setLoading(false)
      }
    }

    checkHealth()
  }, [])

  return (
    <div className="App">
      <header className="App-header">
        <h1>Retail Platform - Consumer Web</h1>
        <div className="status-card">
          <h2>Backend Status</h2>
          {loading && <p>Checking connection...</p>}
          {error && <p className="error">⚠️ {error}</p>}
          {health && (
            <div className="health-info">
              <p>✅ Status: {health.status}</p>
              <p>Service: {health.service || 'Unknown'}</p>
            </div>
          )}
        </div>
        <p className="description">
          A modern, scalable multi-tenant retail platform built with reactive architecture.
        </p>
      </header>
    </div>
  )
}

export default App
