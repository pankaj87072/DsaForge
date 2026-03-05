import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import api from '../utils/api'

const LEVEL_COLORS = {
  beginner: '#6EE7B7',
  intermediate: '#F97316',
  advanced: '#A855F7',
}

const DIFFICULTY_COLORS = { Easy: 'text-green-400', Medium: 'text-yellow-400', Hard: 'text-red-400' }

const LEVEL_PREFIX = { beginner: 'b', intermediate: 'i', advanced: 'a' }

export default function PracticePage() {
  const { level } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()

  const [questions, setQuestions] = useState([])
  // questionStatus: {qid: 'solved' | 'attempted' | 'skipped'}
  const [questionStatus, setQuestionStatus] = useState({})
  const [loading, setLoading] = useState(true)
  const [locked, setLocked] = useState(false)
  const [batchFeedback, setBatchFeedback] = useState(null)
  const [unlockMsg, setUnlockMsg] = useState(null)
  const [filter, setFilter] = useState('all')
  const [selectedTopic, setSelectedTopic] = useState('All')
  const [showFeedback, setShowFeedback] = useState(false)
  const [adaptiveReport, setAdaptiveReport] = useState(null)
  const [showAdaptive, setShowAdaptive] = useState(false)

  const timerRef = useRef({})
  const [timers, setTimers] = useState({})

  // Load questions + restore solved state from server
  useEffect(() => {
    setLoading(true)
    Promise.all([
      api.get(`/questions/level/${level}`),
      api.get(`/progress/my-questions/${level}`)
    ]).then(([qRes, statusRes]) => {
      setQuestions(qRes.data.questions)
      setLocked(qRes.data.locked)
      setQuestionStatus(statusRes.data || {})
    }).catch(() => {}).finally(() => setLoading(false))
  }, [level])

  const startTimer = (qid) => {
    if (timerRef.current[qid]) return
    timerRef.current[qid] = {
      start: Date.now(),
      interval: setInterval(() => {
        setTimers(t => ({ ...t, [qid]: Math.floor((Date.now() - timerRef.current[qid].start) / 1000) }))
      }, 1000)
    }
  }

  const stopTimer = (qid) => {
    if (!timerRef.current[qid]) return 0
    clearInterval(timerRef.current[qid].interval)
    const elapsed = Math.floor((Date.now() - timerRef.current[qid].start) / 1000)
    delete timerRef.current[qid]
    setTimers(t => { const n = { ...t }; delete n[qid]; return n })
    return elapsed
  }

  const markQuestion = async (q, status) => {
    const timeTaken = stopTimer(q.id)
    const qLevel = LEVEL_PREFIX[level] === q.id[0] ? level : level

    // Optimistic update immediately
    setQuestionStatus(prev => ({ ...prev, [q.id]: status }))

    try {
      const { data } = await api.post('/progress/submit', {
        question_id: q.id,
        level: level,
        topic: q.topic,
        status,
        time_taken_seconds: timeTaken || null
      })

      if (data.batch_feedback) {
        setBatchFeedback(data.batch_feedback)
        setShowFeedback(true)
      }
      if (data.unlock_info?.unlocked) {
        setUnlockMsg(`🎉 ${data.unlock_info.unlocked} level unlocked!`)
        setTimeout(() => setUnlockMsg(null), 5000)
      }
    } catch (e) {
      // Revert on failure
      setQuestionStatus(prev => {
        const n = { ...prev }
        delete n[q.id]
        return n
      })
    }
  }

  const loadAdaptiveReport = async () => {
    try {
      const { data } = await api.get('/progress/adaptive-report')
      setAdaptiveReport(data)
      setShowAdaptive(true)
    } catch (e) {}
  }

  const topics = ['All', ...new Set(questions.map(q => q.topic))]

  // Sort: prioritized (weak) topics first if adaptive report available
  const priorityQids = new Set(adaptiveReport?.questions_to_prioritize || [])
  const weakTopics = new Set(adaptiveReport?.weak_topics || [])

  const filteredQuestions = questions
    .filter(q => {
      if (selectedTopic !== 'All' && q.topic !== selectedTopic) return false
      const status = questionStatus[q.id]
      if (filter === 'solved') return status === 'solved'
      if (filter === 'unsolved') return status !== 'solved'
      return true
    })
    .sort((a, b) => {
      // Prioritize: weak topic questions first, then unsolved
      const aWeak = weakTopics.has(a.topic) ? 0 : 1
      const bWeak = weakTopics.has(b.topic) ? 0 : 1
      const aSolved = questionStatus[a.id] === 'solved' ? 1 : 0
      const bSolved = questionStatus[b.id] === 'solved' ? 1 : 0
      if (aWeak !== bWeak) return aWeak - bWeak
      return aSolved - bSolved
    })

  const solvedCount = Object.values(questionStatus).filter(s => s === 'solved').length
  const accentColor = LEVEL_COLORS[level] || '#6EE7B7'

  if (loading) {
    return (
      <div className="min-h-screen bg-forge-bg flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-2 border-t-transparent rounded-full animate-spin mx-auto" style={{ borderColor: accentColor }} />
          <p className="text-forge-muted font-mono text-sm">Loading questions...</p>
        </div>
      </div>
    )
  }

  if (locked) {
    return (
      <div className="min-h-screen bg-forge-bg flex items-center justify-center">
        <div className="text-center space-y-4 max-w-sm px-6">
          <div className="text-6xl">🔒</div>
          <h2 className="text-2xl font-display font-bold text-forge-text capitalize">{level} Level Locked</h2>
          <p className="text-forge-muted font-mono text-sm">
            {level === 'intermediate'
              ? 'Solve 20 beginner problems with 60%+ success rate to unlock.'
              : 'Solve 20 intermediate problems with 65%+ success rate to unlock.'}
          </p>
          <button onClick={() => navigate('/dashboard')} className="px-6 py-3 rounded-xl bg-forge-accent text-forge-bg font-display font-semibold text-sm">
            ← Back to Dashboard
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-forge-bg noise-bg">

      {/* Unlock notification */}
      {unlockMsg && (
        <div className="fixed top-4 right-4 z-50 p-4 rounded-xl border font-mono text-sm animate-slide-up"
          style={{ backgroundColor: 'rgba(110,231,183,0.15)', borderColor: 'rgba(110,231,183,0.4)', color: '#6EE7B7' }}>
          {unlockMsg}
        </div>
      )}

      {/* Batch Feedback Modal */}
      {showFeedback && batchFeedback && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
          <div className="glass rounded-2xl p-6 max-w-lg w-full animate-slide-up">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-display font-bold text-forge-text">📊 Batch Analysis</h3>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-forge-muted">
                  {batchFeedback.source === 'ai_enhanced' ? '🤖 AI Enhanced' : '🧮 Internal Algorithm'}
                </span>
              </div>
            </div>

            {/* Score */}
            <div className="flex items-center gap-4 mb-4 p-3 rounded-xl bg-forge-bg/50">
              <div className="text-center">
                <div className="text-3xl font-display font-bold text-forge-accent">{batchFeedback.overall_score}</div>
                <div className="text-xs font-mono text-forge-muted">/ 100</div>
              </div>
              <div>
                <div className="text-sm font-display font-semibold text-forge-text">{batchFeedback.readiness_label}</div>
                <div className="text-xs font-mono text-forge-muted">overall readiness score</div>
              </div>
            </div>

            {/* Weak topics */}
            {batchFeedback.weaknesses?.length > 0 && (
              <div className="mb-4">
                <div className="text-xs font-mono text-forge-muted mb-2 uppercase tracking-wider">Weak Areas</div>
                <div className="flex flex-wrap gap-2">
                  {batchFeedback.weaknesses.map(w => (
                    <span key={w} className="px-2 py-1 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-mono">{w}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Tips per weak topic */}
            {batchFeedback.tips && Object.entries(batchFeedback.tips).map(([topic, tip]) => (
              tip && (
                <div key={topic} className="mb-3 p-3 rounded-lg bg-forge-border/30 border border-forge-border">
                  <div className="text-xs font-mono text-forge-orange mb-1">{topic}</div>
                  <p className="text-forge-text font-mono text-xs leading-relaxed">{tip}</p>
                </div>
              )
            ))}

            {/* Main advice */}
            {batchFeedback.advice && !batchFeedback.tips && (
              <p className="text-forge-text font-mono text-sm leading-relaxed mb-4">{batchFeedback.advice}</p>
            )}

            <button onClick={() => setShowFeedback(false)}
              className="mt-2 w-full py-2.5 rounded-xl text-forge-bg font-display font-semibold text-sm"
              style={{ backgroundColor: accentColor }}>
              Continue Practicing →
            </button>
          </div>
        </div>
      )}

      {/* Adaptive Report Modal */}
      {showAdaptive && adaptiveReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 overflow-y-auto py-4">
          <div className="glass rounded-2xl p-6 max-w-2xl w-full animate-slide-up">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-display font-bold text-forge-text">🧮 Adaptive Analysis</h3>
              <button onClick={() => setShowAdaptive(false)} className="text-forge-muted hover:text-forge-text text-sm font-mono">✕ Close</button>
            </div>

            {/* Overall score */}
            <div className="flex items-center gap-4 mb-6 p-4 rounded-xl bg-forge-bg/50">
              <div className="relative w-16 h-16">
                <svg className="w-16 h-16 -rotate-90" viewBox="0 0 64 64">
                  <circle cx="32" cy="32" r="28" fill="none" stroke="#1E1E2E" strokeWidth="6" />
                  <circle cx="32" cy="32" r="28" fill="none" stroke={accentColor} strokeWidth="6"
                    strokeDasharray={`${(adaptiveReport.overall_score / 100) * 175.9} 175.9`}
                    strokeLinecap="round" />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-sm font-display font-bold text-forge-text">{adaptiveReport.overall_score}</span>
                </div>
              </div>
              <div>
                <div className="text-lg font-display font-semibold text-forge-text">{adaptiveReport.readiness_label}</div>
                <div className="text-xs font-mono text-forge-muted">out of 100 • internal algorithm score</div>
                <div className="text-xs font-mono text-forge-muted mt-1">
                  Level progression: {adaptiveReport.level_progression_pct}% toward next unlock
                </div>
              </div>
            </div>

            {/* Topic mastery */}
            {adaptiveReport.topic_mastery.length > 0 && (
              <div className="mb-6">
                <div className="text-xs font-mono text-forge-muted mb-3 uppercase tracking-wider">Topic Mastery Breakdown</div>
                <div className="space-y-2">
                  {[...adaptiveReport.topic_mastery].sort((a,b) => a.mastery_score - b.mastery_score).map(m => (
                    <div key={m.topic} className="p-3 rounded-lg bg-forge-bg/40 border border-forge-border">
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-mono text-forge-text">{m.topic}</span>
                          <span className={`text-xs font-mono px-1.5 py-0.5 rounded ${
                            m.label === 'Strong' ? 'bg-green-500/20 text-green-400' :
                            m.label === 'Learning' ? 'bg-yellow-500/20 text-yellow-400' :
                            m.label === 'Weak' ? 'bg-red-500/20 text-red-400' :
                            'bg-forge-border text-forge-muted'
                          }`}>{m.label}</span>
                        </div>
                        <span className="text-sm font-mono font-bold" style={{
                          color: m.mastery_score >= 75 ? '#6EE7B7' : m.mastery_score >= 50 ? '#F97316' : '#F87171'
                        }}>{m.mastery_score}/100</span>
                      </div>
                      <div className="h-1.5 bg-forge-border rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all" style={{
                          width: `${m.mastery_score}%`,
                          backgroundColor: m.mastery_score >= 75 ? '#6EE7B7' : m.mastery_score >= 50 ? '#F97316' : '#F87171'
                        }} />
                      </div>
                      <div className="flex gap-3 mt-1">
                        <span className="text-xs font-mono text-forge-muted">Solve rate: {m.solve_rate}%</span>
                        <span className="text-xs font-mono text-forge-muted">Coverage: {m.coverage}%</span>
                        <span className="text-xs font-mono text-forge-muted">Speed: {m.speed_score}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Improvement tips */}
            {adaptiveReport.improvement_tips && Object.keys(adaptiveReport.improvement_tips).length > 0 && (
              <div>
                <div className="text-xs font-mono text-forge-muted mb-3 uppercase tracking-wider">Targeted Tips</div>
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
          </div>
        </div>
      )}

      {/* Header */}
      <div className="border-b border-forge-border glass sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/dashboard')} className="text-forge-muted hover:text-forge-text transition-colors text-sm font-mono">
              ← Dashboard
            </button>
            <span className="font-display font-semibold capitalize" style={{ color: accentColor }}>{level}</span>
            <span className="text-forge-muted font-mono text-xs">{solvedCount}/{questions.length} solved</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={loadAdaptiveReport}
              className="px-3 py-1.5 rounded-lg border border-forge-border text-forge-muted text-xs font-mono hover:border-forge-accent hover:text-forge-accent transition-colors"
            >
              🧮 Analysis
            </button>
            <div className="flex gap-1">
              {['all', 'solved', 'unsolved'].map(f => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-3 py-1 rounded-lg text-xs font-mono transition-all capitalize ${
                    filter === f
                      ? 'border text-forge-accent bg-forge-accent/10'
                      : 'text-forge-muted hover:text-forge-text'
                  }`}
                  style={filter === f ? { borderColor: 'rgba(110,231,183,0.3)' } : {}}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-6 space-y-5">

        {/* Progress bar */}
        <div>
          <div className="flex justify-between text-xs font-mono text-forge-muted mb-2">
            <span>Progress</span>
            <span>{Math.round((solvedCount / Math.max(questions.length, 1)) * 100)}% • {solvedCount}/{questions.length}</span>
          </div>
          <div className="h-2 bg-forge-border rounded-full overflow-hidden">
            <div className="h-full rounded-full transition-all duration-500"
              style={{ width: `${(solvedCount / Math.max(questions.length, 1)) * 100}%`, backgroundColor: accentColor }} />
          </div>
        </div>

        {/* Weak topic banner */}
        {adaptiveReport?.weak_topics?.length > 0 && (
          <div className="p-3 rounded-xl border border-red-500/20 bg-red-500/5 flex items-center gap-3">
            <span className="text-lg">⚠️</span>
            <div>
              <span className="text-xs font-mono text-red-400">Weak areas detected: </span>
              <span className="text-xs font-mono text-forge-text">{adaptiveReport.weak_topics.join(', ')}</span>
              <span className="text-xs font-mono text-forge-muted ml-2">— questions from these topics are sorted to top</span>
            </div>
          </div>
        )}

        {/* Topic filters */}
        <div className="flex flex-wrap gap-2">
          {topics.map(t => (
            <button
              key={t}
              onClick={() => setSelectedTopic(t)}
              className={`px-3 py-1 rounded-full text-xs font-mono transition-all border ${
                selectedTopic === t
                  ? 'text-forge-text'
                  : 'border-forge-border text-forge-muted hover:border-forge-muted'
              } ${weakTopics.has(t) ? 'border-red-500/30' : ''}`}
              style={selectedTopic === t ? { borderColor: accentColor, backgroundColor: `${accentColor}15`, color: accentColor } : {}}
            >
              {t}
              {weakTopics.has(t) && t !== 'All' && <span className="ml-1 text-red-400">●</span>}
            </button>
          ))}
        </div>

        {/* Questions */}
        <div className="space-y-2">
          {filteredQuestions.map((q, idx) => {
            const status = questionStatus[q.id]
            const isSolved = status === 'solved'
            const isAttempted = status === 'attempted'
            const isWeak = weakTopics.has(q.topic)
            const isPriority = priorityQids.has(q.id)
            const timer = timers[q.id]

            return (
              <div
                key={q.id}
                className={`rounded-xl p-4 transition-all border ${
                  isSolved
                    ? 'bg-forge-accent/5 border-forge-accent/20'
                    : isAttempted
                    ? 'bg-forge-orange/5 border-forge-orange/20'
                    : isWeak
                    ? 'bg-red-500/3 border-red-500/15'
                    : 'glass border-forge-border'
                }`}
              >
                <div className="flex items-start gap-3">
                  {/* Status circle */}
                  <div className={`w-6 h-6 rounded-full border flex-shrink-0 mt-0.5 flex items-center justify-center text-xs font-mono ${
                    isSolved ? 'bg-forge-accent border-forge-accent text-forge-bg font-bold' :
                    isAttempted ? 'border-forge-orange text-forge-orange' :
                    'border-forge-border text-forge-muted'
                  }`}>
                    {isSolved ? '✓' : isAttempted ? '~' : idx + 1}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      {isPriority && !isSolved && (
                        <span className="text-xs font-mono px-1.5 py-0.5 rounded bg-red-500/15 text-red-400 border border-red-500/20">priority</span>
                      )}
                      <a
                        href={`https://leetcode.com/problems/${q.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')}/`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-display font-semibold text-forge-text hover:text-forge-accent transition-colors"
                        onClick={() => !isSolved && startTimer(q.id)}
                      >
                        {q.title}
                      </a>
                      <span className={`text-xs font-mono ${DIFFICULTY_COLORS[q.difficulty]}`}>{q.difficulty}</span>
                      <span className={`text-xs font-mono px-2 py-0.5 rounded border ${
                        isWeak ? 'text-red-400 border-red-500/30 bg-red-500/10' : 'text-forge-muted border-forge-border/50'
                      }`}>{q.topic}</span>
                      {q.leetcode_id && (
                        <span className="text-xs font-mono text-forge-muted">#{q.leetcode_id}</span>
                      )}
                    </div>

                    {/* Companies */}
                    <div className="mt-1.5 flex flex-wrap gap-1">
                      {q.company_tags?.slice(0, 5).map(c => (
                        <span key={c} className="text-xs font-mono text-forge-muted/60 border border-forge-border/40 px-1.5 py-0.5 rounded">{c}</span>
                      ))}
                      {q.company_tags?.length > 5 && (
                        <span className="text-xs font-mono text-forge-muted">+{q.company_tags.length - 5}</span>
                      )}
                    </div>

                    {/* Timer */}
                    {timer !== undefined && !isSolved && (
                      <div className="mt-1 text-xs font-mono text-forge-blue">
                        ⏱ {Math.floor(timer / 60)}:{String(timer % 60).padStart(2, '0')}
                      </div>
                    )}
                  </div>

                  {/* Action buttons */}
                  <div className="flex-shrink-0">
                    {!isSolved ? (
                      <div className="flex gap-2">
                        <button
                          onClick={() => markQuestion(q, 'attempted')}
                          className="px-3 py-1.5 rounded-lg border border-forge-orange/30 text-forge-orange text-xs font-mono hover:bg-forge-orange/10 transition-colors"
                        >
                          Tried
                        </button>
                        <button
                          onClick={() => markQuestion(q, 'solved')}
                          className="px-3 py-1.5 rounded-lg text-forge-bg text-xs font-mono hover:opacity-90 transition-colors"
                          style={{ backgroundColor: accentColor }}
                        >
                          Solved ✓
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className="text-forge-accent text-sm">✅</span>
                        <button
                          onClick={() => markQuestion(q, 'attempted')}
                          className="text-xs font-mono text-forge-muted hover:text-forge-orange transition-colors"
                        >
                          Undo
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {filteredQuestions.length === 0 && (
          <div className="text-center py-12 text-forge-muted font-mono text-sm">
            {filter === 'solved' && solvedCount === 0
              ? "No solved questions yet. Start practicing!"
              : "No questions match the current filter."}
          </div>
        )}
      </div>
    </div>
  )
}
