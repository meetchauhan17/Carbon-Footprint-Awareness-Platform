import React from 'react'
import { AlertCircle } from 'lucide-react'

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#030304] flex items-center justify-center p-4">
          <div className="glass-card p-8 max-w-lg w-full text-center space-y-4 rounded-3xl border-red-500/20">
            <div className="w-16 h-16 bg-red-500/10 rounded-full mx-auto flex items-center justify-center mb-6">
              <AlertCircle className="w-8 h-8 text-red-500" />
            </div>
            <h2 className="text-2xl font-bold text-white font-display">Something went wrong</h2>
            <p className="text-sm text-clay-muted font-sans">
              We encountered an unexpected error. Please refresh the page or try again later.
            </p>
            {this.state.error && (
              <div className="text-left mt-6 bg-[#0D0F13] p-4 rounded-xl border border-white/5 overflow-x-auto">
                <code className="text-xs text-red-400 font-mono whitespace-pre-wrap">
                  {this.state.error.toString()}
                </code>
              </div>
            )}
            <button
              onClick={() => window.location.reload()}
              className="mt-6 px-6 py-2.5 btn-premium text-white rounded-full font-bold shadow-lg transition-all active:scale-95"
            >
              Refresh Page
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
