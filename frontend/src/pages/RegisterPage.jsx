import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import api from '../utils/api'

export default function RegisterPage() {
  const [form, setForm] = useState({ username: '', password: '', confirm: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async () => {
    setError('')
    if (form.password !== form.confirm) { setError('Passwords do not match'); return }
    if (form.password.length < 6) { setError('Password must be at least 6 characters'); return }
    setLoading(true)
    try {
      const { data } = await api.post('/auth/register', { username: form.username, password: form.password })
      login({ id: data.user_id, username: data.username, level: 'beginner', ai_connected: false, onboarding_complete: false }, data.token)
      navigate('/onboarding')
    } catch (e) {
      setError(e.response?.data?.detail || 'Registration failed')
    } finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-forge-bg noise-bg relative overflow-hidden">
      <div className="absolute top-1/3 right-1/4 w-80 h-80 bg-forge-purple/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/3 left-1/4 w-80 h-80 bg-forge-orange/5 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md px-4 animate-slide-up">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 mb-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-forge-accent to-forge-blue flex items-center justify-center">
              <span className="text-forge-bg font-mono font-bold text-lg">⚡</span>
            </div>
            <span className="text-2xl font-display font-bold gradient-text">DSAForge</span>
          </div>
          <p className="text-forge-muted text-sm font-mono">Start your journey today</p>
        </div>

        <div className="glass rounded-2xl p-8">
          <h2 className="text-xl font-display font-semibold text-forge-text mb-6">Create account</h2>

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-mono">
              {error}
            </div>
          )}

          <div className="space-y-4">
            {[
              { key: 'username', label: 'Username', type: 'text', placeholder: 'choose_a_username' },
              { key: 'password', label: 'Password', type: 'password', placeholder: '••••••••' },
              { key: 'confirm', label: 'Confirm Password', type: 'password', placeholder: '••••••••' },
            ].map(field => (
              <div key={field.key}>
                <label className="block text-xs font-mono text-forge-muted mb-2 uppercase tracking-wider">{field.label}</label>
                <input
                  type={field.type}
                  value={form[field.key]}
                  onChange={e => setForm({ ...form, [field.key]: e.target.value })}
                  onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                  className="w-full bg-forge-bg border border-forge-border rounded-xl px-4 py-3 text-forge-text font-mono text-sm focus:outline-none focus:border-forge-accent transition-colors"
                  placeholder={field.placeholder}
                />
              </div>
            ))}
          </div>

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="mt-6 w-full py-3 rounded-xl bg-gradient-to-r from-forge-accent to-forge-blue text-forge-bg font-display font-semibold text-sm transition-all hover:opacity-90 active:scale-95 disabled:opacity-50"
          >
            {loading ? 'Creating account...' : 'Create account →'}
          </button>

          <p className="mt-6 text-center text-forge-muted text-sm font-mono">
            Already have an account?{' '}
            <Link to="/login" className="text-forge-accent hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
