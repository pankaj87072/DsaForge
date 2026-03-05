import { useState, useEffect } from 'react'
import api from '../../utils/api'

const PROVIDER_INFO = {
  claude: { icon: '🤖', color: '#6EE7B7', hint: 'Get from console.anthropic.com' },
  openai: { icon: '🟢', color: '#10A37F', hint: 'Get from platform.openai.com/api-keys' },
  gemini: { icon: '💎', color: '#4285F4', hint: 'Get from aistudio.google.com/app/apikey' },
}

export default function AIConnectionStep({ onComplete, onSkip }) {
  const [providers, setProviders] = useState([])
  const [selected, setSelected] = useState('')
  const [token, setToken] = useState('')
  const [status, setStatus] = useState('idle') // idle, connecting, success, error
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    api.get('/ai/providers').then(r => setProviders(r.data)).catch(() => {})
  }, [])

  const handleConnect = async () => {
    if (!selected || !token.trim()) return
    setStatus('connecting'); setErrorMsg('')
    try {
      const { data } = await api.post('/ai/connect', { provider: selected, token: token.trim() })
      if (data.success) {
        setStatus('success')
        setTimeout(() => onComplete({ provider: selected, preview: data.preview }), 1500)
      } else {
        setStatus('error'); setErrorMsg(data.error || 'Connection failed')
      }
    } catch (e) {
      setStatus('error'); setErrorMsg('Network error')
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-2xl font-display font-bold text-forge-text mb-2">Connect AI Assistant</h2>
        <p className="text-forge-muted text-sm font-mono">
          Connect your AI API key for smarter evaluation and personalized feedback.
          <span className="text-forge-accent ml-1">Optional — you can skip this.</span>
        </p>
      </div>

      {/* Provider selection */}
      <div>
        <label className="block text-xs font-mono text-forge-muted mb-3 uppercase tracking-wider">Choose Provider</label>
        <div className="grid grid-cols-3 gap-3">
          {providers.map(p => {
            const info = PROVIDER_INFO[p.id] || { icon: '🤖', color: '#6EE7B7', hint: '' }
            return (
              <button
                key={p.id}
                onClick={() => setSelected(p.id)}
                className={`p-4 rounded-xl border text-center transition-all ${
                  selected === p.id
                    ? 'border-forge-accent bg-forge-accent/10'
                    : 'border-forge-border hover:border-forge-muted'
                }`}
              >
                <div className="text-2xl mb-1">{info.icon}</div>
                <div className="text-xs font-mono text-forge-text font-semibold">{p.name.split(' ')[0]}</div>
              </button>
            )
          })}
        </div>
        {selected && (
          <p className="mt-2 text-xs font-mono text-forge-muted">
            💡 {PROVIDER_INFO[selected]?.hint}
          </p>
        )}
      </div>

      {/* Token input */}
      <div>
        <label className="block text-xs font-mono text-forge-muted mb-2 uppercase tracking-wider">API Token</label>
        <input
          type="password"
          value={token}
          onChange={e => setToken(e.target.value)}
          className="w-full bg-forge-bg border border-forge-border rounded-xl px-4 py-3 text-forge-text font-mono text-sm focus:outline-none focus:border-forge-accent transition-colors"
          placeholder="sk-... or your API key"
        />
        <p className="mt-1 text-xs font-mono text-forge-muted">Your key is hashed before storage and never shared.</p>
      </div>

      {/* Status display */}
      {status === 'connecting' && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-forge-blue/10 border border-forge-blue/20">
          <div className="w-5 h-5 border-2 border-forge-blue border-t-transparent rounded-full animate-spin" />
          <span className="text-forge-blue font-mono text-sm">Verifying connection...</span>
        </div>
      )}
      {status === 'success' && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-forge-accent/10 border border-forge-accent/20">
          <span className="text-2xl">✅</span>
          <span className="text-forge-accent font-mono text-sm">Connection successful! Redirecting...</span>
        </div>
      )}
      {status === 'error' && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20">
          <span className="text-2xl">❌</span>
          <span className="text-red-400 font-mono text-sm">{errorMsg}</span>
        </div>
      )}

      <div className="flex gap-3">
        <button
          onClick={handleConnect}
          disabled={!selected || !token.trim() || status === 'connecting' || status === 'success'}
          className="flex-1 py-3 rounded-xl bg-forge-accent text-forge-bg font-display font-semibold text-sm transition-all hover:opacity-90 active:scale-95 disabled:opacity-40"
        >
          Connect
        </button>
        <button
          onClick={onSkip}
          className="px-6 py-3 rounded-xl border border-forge-border text-forge-muted font-mono text-sm hover:border-forge-muted transition-colors"
        >
          Skip
        </button>
      </div>
    </div>
  )
}
