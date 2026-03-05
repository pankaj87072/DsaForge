import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import api from '../utils/api'

const LEVEL_CONFIG = {
  beginner:     { icon: '🌱', color: '#6EE7B7', label: 'Beginner',     total: 30 },
  intermediate: { icon: '⚡', color: '#F97316', label: 'Intermediate', total: 30 },
  advanced:     { icon: '🔥', color: '#A855F7', label: 'Advanced',     total: 30 },
}

const TIER_LABELS = {
  tier1_faang:  { label: 'FAANG',        color: '#6EE7B7' },
  tier1_other:  { label: 'Top Tech',     color: '#3B82F6' },
  tier2:        { label: 'Global Tier 2', color: '#F97316' },
  tier3_india:  { label: 'India',        color: '#A855F7' },
}

export default function DashboardPage() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [summary, setSummary]               = useState(null)
  const [smartCompanies, setSmartCompanies] = useState(null)  // {clearable, all_companies}
  const [allCompanies, setAllCompanies]     = useState([])
  const [showAllCompanies, setShowAllCompanies] = useState(false)
  const [selectedCompany, setSelectedCompany]   = useState(null)
  const [loading, setLoading] = useState(true)
  const [adaptiveReport, setAdaptiveReport] = useState(null)
  const [showAdaptive, setShowAdaptive]     = useState(false)

  useEffect(() => {
    Promise.all([
      api.get('/progress/summary'),
      api.get('/progress/smart-companies'),
    ]).then(([s, c]) => {
      setSummary(s.data)
      setSmartCompanies(c.data)
      setAllCompanies(c.data.all_companies || [])
    }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const loadAdaptive = async () => {
    try {
      const { data } = await api.get('/progress/adaptive-report')
      setAdaptiveReport(data)
      setShowAdaptive(true)
    } catch (e) {}
  }

  const totalSolved = summary?.total_solved || 0
  const clearableList = smartCompanies?.clearable || []
  const lp = summary?.level_progress || {
    beginner:     { solved: 0, unlocked: true },
    intermediate: { solved: 0, unlocked: false },
    advanced:     { solved: 0, unlocked: false },
  }

  // Group all companies by tier for the "all companies" modal
  const companiesByTier = allCompanies.reduce((acc, c) => {
    const t = c.tier || 'tier2'
    if (!acc[t]) acc[t] = []
    acc[t].push(c)
    return acc
  }, {})

  return (
    <div className="min-h-screen bg-forge-bg noise-bg">

      {/* Adaptive report modal */}
      {showAdaptive && adaptiveReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 overflow-y-auto py-6">
          <div className="glass rounded-2xl p-6 max-w-2xl w-full animate-slide-up">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-display font-bold text-forge-text">🧮 Your Preparation Analysis</h3>
              <button onClick={() => setShowAdaptive(false)} className="text-forge-muted hover:text-forge-text text-sm font-mono">✕</button>
            </div>

            <div className="flex items-center gap-4 p-4 rounded-xl bg-forge-bg/50 mb-5">
              <div className="relative w-16 h-16 flex-shrink-0">
                <svg className="w-16 h-16 -rotate-90" viewBox="0 0 64 64">
                  <circle cx="32" cy="32" r="28" fill="none" stroke="#1E1E2E" strokeWidth="6" />
                  <circle cx="32" cy="32" r="28" fill="none" stroke="#6EE7B7" strokeWidth="6"
                    strokeDasharray={`${(adaptiveReport.overall_score / 100) * 175.9} 175.9`} strokeLinecap="round" />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-sm font-display font-bold text-forge-text">{adaptiveReport.overall_score}</span>
                </div>
              </div>
              <div>
                <div className="text-lg font-display font-semibold text-forge-text">{adaptiveReport.readiness_label}</div>
                <div className="text-xs font-mono text-forge-muted">Level progression: {adaptiveReport.level_progression_pct}% toward next unlock</div>
              </div>
            </div>

            {adaptiveReport.topic_mastery?.length > 0 && (
              <div className="mb-5">
                <div className="text-xs font-mono text-forge-muted mb-3 uppercase tracking-wider">Topic Mastery</div>
                <div className="space-y-2">
                  {[...adaptiveReport.topic_mastery].sort((a,b) => a.mastery_score - b.mastery_score).map(m => (
                    <div key={m.topic} className="p-3 rounded-lg bg-forge-bg/50 border border-forge-border">
                      <div className="flex justify-between items-center mb-1.5">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-mono text-forge-text">{m.topic}</span>
                          <span className={`text-xs px-1.5 py-0.5 rounded font-mono ${
                            m.label === 'Strong' ? 'bg-green-500/20 text-green-400' :
                            m.label === 'Learning' ? 'bg-yellow-500/20 text-yellow-400' :
                            m.label === 'Weak' ? 'bg-red-500/20 text-red-400' : 'bg-forge-border text-forge-muted'
                          }`}>{m.label}</span>
                        </div>
                        <span className="text-sm font-mono font-bold" style={{
                          color: m.mastery_score >= 75 ? '#6EE7B7' : m.mastery_score >= 50 ? '#F97316' : '#F87171'
                        }}>{m.mastery_score}/100</span>
                      </div>
                      <div className="h-1 bg-forge-border rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{
                          width: `${m.mastery_score}%`,
                          backgroundColor: m.mastery_score >= 75 ? '#6EE7B7' : m.mastery_score >= 50 ? '#F97316' : '#F87171'
                        }} />
                      </div>
                      <div className="mt-1 flex gap-3 text-xs font-mono text-forge-muted">
                        <span>Solve rate: {m.solve_rate}%</span>
                        <span>Coverage: {m.coverage}%</span>
                        <span>Speed: {m.speed_score}%</span>
                        <span>Consistency: {m.consistency_score}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {adaptiveReport.improvement_tips && Object.keys(adaptiveReport.improvement_tips).length > 0 && (
              <div>
                <div className="text-xs font-mono text-forge-muted mb-3 uppercase tracking-wider">Targeted Tips (No AI needed)</div>
                <div className="space-y-2">
                  {Object.entries(adaptiveReport.improvement_tips).map(([topic, tip]) => (
                    <div key={topic} className="p-3 rounded-lg border border-red-500/20 bg-red-500/5">
                      <div className="text-xs font-mono text-red-400 mb-1">📍 {topic}</div>
                      <p className="text-forge-text font-mono text-xs leading-relaxed">{tip}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {adaptiveReport.topic_mastery?.length === 0 && (
              <p className="text-forge-muted font-mono text-sm text-center py-4">
                Solve some questions first to see your analysis!
              </p>
            )}
          </div>
        </div>
      )}

      {/* Company detail modal */}
      {selectedCompany && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
          <div className="glass rounded-2xl p-6 max-w-sm w-full animate-slide-up">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 rounded-full" style={{ backgroundColor: selectedCompany.logo_color || '#6EE7B7' }} />
                <h3 className="text-lg font-display font-bold text-forge-text">{selectedCompany.name}</h3>
              </div>
              <button onClick={() => setSelectedCompany(null)} className="text-forge-muted hover:text-forge-text text-sm">✕</button>
            </div>

            <div className="space-y-3">
              <div>
                <div className="text-xs font-mono text-forge-muted mb-2 uppercase">Minimum Level Required</div>
                <span className="px-3 py-1 rounded-full border text-xs font-mono capitalize"
                  style={{ color: LEVEL_CONFIG[selectedCompany.min_level]?.color, borderColor: `${LEVEL_CONFIG[selectedCompany.min_level]?.color}40` }}>
                  {selectedCompany.min_level}
                </span>
              </div>

              <div>
                <div className="text-xs font-mono text-forge-muted mb-2 uppercase">Most Asked Topics</div>
                <div className="flex flex-wrap gap-2">
                  {selectedCompany.strong_topics?.map(t => {
                    const mastery = smartCompanies?.topic_mastery_map?.[t] || 0
                    return (
                      <div key={t} className="flex items-center gap-1.5 px-2 py-1 rounded-lg border border-forge-border bg-forge-bg/50">
                        <span className="text-xs font-mono text-forge-text">{t}</span>
                        {mastery > 0 && (
                          <span className="text-xs font-mono" style={{
                            color: mastery >= 65 ? '#6EE7B7' : mastery >= 40 ? '#F97316' : '#F87171'
                          }}>{mastery}/100</span>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>

              {selectedCompany.match_score !== undefined && (
                <div>
                  <div className="text-xs font-mono text-forge-muted mb-1 uppercase">Your Match Score</div>
                  <div className="text-2xl font-display font-bold text-forge-accent">{selectedCompany.match_score}/100</div>
                  <div className="text-xs font-mono text-forge-muted">based on your topic mastery</div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* All companies modal */}
      {showAllCompanies && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 overflow-y-auto py-6">
          <div className="glass rounded-2xl p-6 max-w-3xl w-full animate-slide-up">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-display font-bold text-forge-text">🏢 All Companies & DSA Topics</h3>
              <button onClick={() => setShowAllCompanies(false)} className="text-forge-muted hover:text-forge-text text-sm font-mono">✕ Close</button>
            </div>

            {Object.entries(companiesByTier).map(([tier, companies]) => (
              <div key={tier} className="mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: TIER_LABELS[tier]?.color }} />
                  <span className="text-xs font-mono text-forge-muted uppercase tracking-wider">{TIER_LABELS[tier]?.label}</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {companies.map(c => {
                    const isClearable = clearableList.some(cl => cl.name === c.name)
                    return (
                      <button
                        key={c.name}
                        onClick={() => { setSelectedCompany(clearableList.find(cl => cl.name === c.name) || c); setShowAllCompanies(false) }}
                        className={`p-3 rounded-xl border text-left transition-all hover:scale-[1.01] ${
                          isClearable ? 'border-forge-accent/30 bg-forge-accent/5' : 'border-forge-border'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: c.logo_color }} />
                            <span className="text-sm font-mono text-forge-text font-semibold">{c.name}</span>
                          </div>
                          {isClearable && <span className="text-xs text-forge-accent font-mono">✓ Clearable</span>}
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {c.strong_topics?.slice(0, 3).map(t => (
                            <span key={t} className="text-xs font-mono text-forge-muted border border-forge-border/50 px-1.5 py-0.5 rounded">{t}</span>
                          ))}
                          {c.strong_topics?.length > 3 && (
                            <span className="text-xs font-mono text-forge-muted">+{c.strong_topics.length - 3}</span>
                          )}
                        </div>
                        <div className="mt-1">
                          <span className="text-xs font-mono capitalize" style={{ color: LEVEL_CONFIG[c.min_level]?.color || '#64748B' }}>
                            {c.min_level} level required
                          </span>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Top bar */}
      <div className="border-b border-forge-border glass sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-forge-accent to-forge-blue flex items-center justify-center">
              <span className="text-forge-bg text-xs">⚡</span>
            </div>
            <span className="font-display font-bold text-forge-text">DSAForge</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs font-mono text-forge-muted hidden sm:block">👤 {user?.username}</span>
            <span className={`px-3 py-1 rounded-full text-xs font-mono border ${
              user?.ai_connected
                ? 'text-forge-accent border-forge-accent/30 bg-forge-accent/10'
                : 'text-forge-muted border-forge-border'
            }`}>
              {user?.ai_connected ? '🤖 AI Connected' : '🔗 No AI'}
            </span>
            <button onClick={logout} className="text-xs font-mono text-forge-muted hover:text-red-400 transition-colors">
              Logout
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8 space-y-8">

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Total Solved', value: totalSolved, icon: '✅', color: 'text-forge-accent' },
            { label: 'Current Level', value: user?.level || 'beginner', icon: '🎯', color: 'text-forge-orange', cap: true },
            { label: 'Companies Clearable', value: clearableList.length, icon: '🏢', color: 'text-forge-blue' },
            { label: 'Total Companies', value: allCompanies.length, icon: '🌍', color: 'text-forge-purple' },
          ].map(stat => (
            <div key={stat.label} className="glass rounded-xl p-4">
              <div className="text-2xl mb-1">{stat.icon}</div>
              <div className={`text-xl font-display font-bold ${stat.color} ${stat.cap ? 'capitalize' : ''}`}>
                {stat.value}
              </div>
              <div className="text-xs font-mono text-forge-muted mt-0.5">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Level cards */}
        <div>
          <h2 className="text-lg font-display font-semibold text-forge-text mb-4">Practice Levels</h2>
          <div className="grid sm:grid-cols-3 gap-4">
            {Object.entries(LEVEL_CONFIG).map(([level, cfg]) => {
              const progress = lp[level] || { solved: 0, unlocked: level === 'beginner' }
              const pct = Math.round((progress.solved / cfg.total) * 100)
              const isLocked = !progress.unlocked
              const isCurrent = user?.level === level

              return (
                <div
                  key={level}
                  onClick={() => !isLocked && navigate(`/practice/${level}`)}
                  className={`glass rounded-xl p-5 transition-all border border-forge-border ${
                    isLocked ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:scale-[1.02]'
                  } ${isCurrent ? 'ring-1' : ''}`}
                  style={isCurrent ? { ringColor: cfg.color } : {}}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="text-2xl mb-1">{cfg.icon}</div>
                      <div className="font-display font-semibold text-forge-text">{cfg.label}</div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      {isLocked && <span>🔒</span>}
                      {isCurrent && (
                        <span className="text-xs font-mono px-2 py-0.5 rounded-full border" style={{ color: cfg.color, borderColor: `${cfg.color}40` }}>
                          current
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs font-mono text-forge-muted">
                      <span>{progress.solved} solved</span>
                      <span>{cfg.total} total</span>
                    </div>
                    <div className="h-1.5 bg-forge-border rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${pct}%`, backgroundColor: cfg.color }} />
                    </div>
                    <div className="text-xs font-mono text-forge-muted">{pct}% complete</div>
                  </div>
                  {isLocked && (
                    <div className="mt-3 text-xs font-mono text-forge-muted">
                      {level === 'intermediate' ? 'Need: 20 beginner + 60% rate' : 'Need: 20 intermediate + 65% rate'}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Companies section */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-display font-semibold text-forge-text">
                🏢 Companies You Can Clear Now
                <span className="ml-2 text-forge-accent font-mono text-base">({clearableList.length})</span>
              </h2>
              <p className="text-xs font-mono text-forge-muted mt-0.5">
                {clearableList.length === 0
                  ? 'Solve questions to unlock companies — based on your actual topic mastery'
                  : 'Based on your topic mastery scores · click any company to see required topics'}
              </p>
            </div>
            <button
              onClick={() => setShowAllCompanies(true)}
              className="px-3 py-1.5 rounded-lg border border-forge-border text-forge-muted text-xs font-mono hover:border-forge-accent hover:text-forge-accent transition-colors flex-shrink-0"
            >
              View All {allCompanies.length} →
            </button>
          </div>

          {clearableList.length === 0 ? (
            <div className="glass rounded-xl p-6 text-center border border-dashed border-forge-border">
              <div className="text-4xl mb-3">🎯</div>
              <p className="text-forge-muted font-mono text-sm">No companies unlocked yet.</p>
              <p className="text-forge-muted font-mono text-xs mt-1">
                Solve questions and build mastery in key topics like Arrays, Trees, and Graphs.
              </p>
              <button
                onClick={() => navigate(`/practice/${user?.level || 'beginner'}`)}
                className="mt-4 px-4 py-2 rounded-xl bg-forge-accent text-forge-bg font-mono text-xs"
              >
                Start Practicing →
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {clearableList.map(c => (
                <button
                  key={c.name}
                  onClick={() => setSelectedCompany(c)}
                  className="glass rounded-xl p-3 text-left transition-all hover:scale-[1.02] border border-forge-accent/20 bg-forge-accent/5"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: c.logo_color || '#6EE7B7' }} />
                    <span className="text-xs font-mono text-forge-text font-semibold truncate">{c.name}</span>
                  </div>
                  <div className="flex flex-wrap gap-1 mb-2">
                    {c.strong_topics?.slice(0, 2).map(t => (
                      <span key={t} className="text-xs font-mono text-forge-muted border border-forge-border/50 px-1.5 py-0.5 rounded truncate max-w-full"
                        style={{ fontSize: '10px' }}>{t}</span>
                    ))}
                  </div>
                  {c.match_score !== undefined && (
                    <div className="text-xs font-mono text-forge-accent">{c.match_score}/100 match</div>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Adaptive analysis card */}
        <div className="glass rounded-xl p-5 border border-forge-border">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-display font-semibold text-forge-text">🧮 Your Preparation Analysis</h3>
              <p className="text-xs font-mono text-forge-muted mt-0.5">
                Internal algorithm • No AI needed • Solve rate, coverage, speed, consistency
              </p>
            </div>
            <button
              onClick={loadAdaptive}
              className="px-4 py-2 rounded-xl border border-forge-accent/30 text-forge-accent text-xs font-mono hover:bg-forge-accent/10 transition-colors flex-shrink-0"
            >
              Analyze →
            </button>
          </div>
        </div>

        {/* Topic breakdown */}
        {summary?.topics && Object.keys(summary.topics).length > 0 && (
          <div>
            <h2 className="text-lg font-display font-semibold text-forge-text mb-4">Topic Breakdown</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {Object.entries(summary.topics).map(([topic, stats]) => {
                const total = stats.solved + stats.attempted + (stats.skipped || 0)
                const rate = total > 0 ? Math.round((stats.solved / total) * 100) : 0
                return (
                  <div key={topic} className="glass rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-sm font-mono text-forge-text">{topic}</span>
                      <span className="text-xs font-mono" style={{
                        color: rate >= 70 ? '#6EE7B7' : rate >= 40 ? '#F97316' : '#F87171'
                      }}>{rate}%</span>
                    </div>
                    <div className="h-1 bg-forge-border rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{
                        width: `${rate}%`,
                        backgroundColor: rate >= 70 ? '#6EE7B7' : rate >= 40 ? '#F97316' : '#F87171'
                      }} />
                    </div>
                    <div className="mt-1 text-xs font-mono text-forge-muted">
                      {stats.solved} solved · {stats.attempted} attempted
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
