import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import api from '../utils/api'

export default function LoginPage() {
  const [form, setForm] = useState({ username: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async () => {
    setError(''); setLoading(true)
    try {
      const { data } = await api.post('/auth/login', form)
      login({
        id: data.user_id, username: data.username,
        level: data.level, ai_connected: data.ai_connected,
        onboarding_complete: data.onboarding_complete
      }, data.token)
      navigate(data.onboarding_complete ? '/dashboard' : '/onboarding')
    } catch (e) {
      setError(e.response?.data?.detail || 'Login failed')
    } finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-forge-bg noise-bg relative overflow-hidden">
      {/* Ambient glow */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-forge-accent/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-forge-purple/5 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md px-4 animate-slide-up">
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 mb-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-forge-accent to-forge-blue flex items-center justify-center">
              <span className="text-forge-bg font-mono font-bold text-lg">⚡</span>
            </div>
            <span className="text-2xl font-display font-bold gradient-text">DSAForge</span>
          </div>
          <p className="text-forge-muted text-sm font-mono">Forge your problem-solving skills</p>
        </div>

        <div className="glass rounded-2xl p-8">
          <h2 className="text-xl font-display font-semibold text-forge-text mb-6">Sign in</h2>

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-mono">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-mono text-forge-muted mb-2 uppercase tracking-wider">Username</label>
              <input
                type="text"
                value={form.username}
                onChange={e => setForm({ ...form, username: e.target.value })}
                onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                className="w-full bg-forge-bg border border-forge-border rounded-xl px-4 py-3 text-forge-text font-mono text-sm focus:outline-none focus:border-forge-accent transition-colors"
                placeholder="your_username"
              />
            </div>
            <div>
              <label className="block text-xs font-mono text-forge-muted mb-2 uppercase tracking-wider">Password</label>
              <input
                type="password"
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
                onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                className="w-full bg-forge-bg border border-forge-border rounded-xl px-4 py-3 text-forge-text font-mono text-sm focus:outline-none focus:border-forge-accent transition-colors"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="mt-6 w-full py-3 rounded-xl bg-forge-accent text-forge-bg font-display font-semibold text-sm transition-all hover:opacity-90 active:scale-95 disabled:opacity-50"
          >
            {loading ? 'Signing in...' : 'Sign in →'}
          </button>

          <p className="mt-6 text-center text-forge-muted text-sm font-mono">
            No account?{' '}
            <Link to="/register" className="text-forge-accent hover:underline">Create one</Link>
          </p>
        </div>

        {/* Validation Link */}
        <div className="mt-8 text-center animate-pulse">
          <Link
            to="/validate"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass border border-forge-accent/30 text-xs font-mono text-forge-accent"
          >
            🚀 Exclusive Life-Time Offer → Validate Our Idea
          </Link>
        </div>
      </div>
    </div>
  )
}
