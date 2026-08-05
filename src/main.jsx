import { StrictMode, Component } from 'react'
import { createRoot } from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register'
import './index.css'
import App from './App.jsx'

registerSW({
  immediate: true,
  onNeedRefresh() {
    window.location.reload()
  },
})

class RootBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error) {
    return { error }
  }

  render() {
    if (this.state.error) {
      return (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 14,
            padding: 24,
            textAlign: 'center',
            fontFamily: 'Inter, system-ui, sans-serif',
            background: '#090A0F',
            color: '#fff',
          }}
        >
          <div
            style={{
              fontSize: 42,
              fontWeight: 800,
              lineHeight: 1,
              background: 'linear-gradient(100deg,#38BDF8,#6366F1)',
              WebkitBackgroundClip: 'text',
              backgroundClip: 'text',
              color: 'transparent',
            }}
          >
            RUSH
          </div>
          <p style={{ margin: 0, fontSize: 14, color: 'rgba(255,255,255,0.65)' }}>
            Something crashed on this screen. Tap reload to reinitialize.
          </p>
          <p style={{ margin: 0, fontSize: 11, color: 'rgba(56,189,248,0.7)', maxWidth: 360, wordBreak: 'break-word' }}>
            {String(this.state.error && this.state.error.message)}
          </p>
          <button
            onClick={() => this.setState({ error: null })}
            style={{
              marginTop: 6,
              padding: '12px 26px',
              borderRadius: 14,
              border: 'none',
              fontWeight: 800,
              fontSize: 14,
              cursor: 'pointer',
              color: '#061018',
              background: '#38BDF8',
            }}
          >
            Reload App
          </button>
        </div>
      )
    }
    return this.props.children
  }
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <RootBoundary>
      <App />
    </RootBoundary>
  </StrictMode>,
)
