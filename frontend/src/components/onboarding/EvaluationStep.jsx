import { useState, useEffect } from 'react'
import api from '../../utils/api'

export default function EvaluationStep({ hasAI, onComplete }) {
  const [mode, setMode] = useState(null) // 'quiz' or 'self'
  const [quiz, setQuiz] = useState([])
  const [answers, setAnswers] = useState({})
  const [currentQ, setCurrentQ] = useState(0)
  const [selfLevel, setSelfLevel] = useState('beginner')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)

  useEffect(() => {
    if (hasAI) {
      api.get('/evaluation/quiz').then(r => setQuiz(r.data)).catch(() => {})
    }
  }, [hasAI])

  const submitQuiz = async () => {
    setLoading(true)
    const formatted = Object.entries(answers).map(([question_id, selected_option]) => ({ question_id, selected_option }))
    try {
      const { data } = await api.post('/evaluation/submit-quiz', { answers: formatted, self_description: description })
      setResult(data)
      setTimeout(() => onComplete(data.level), 2000)
    } catch (e) {
      onComplete('beginner')
    } finally { setLoading(false) }
  }

  const submitSelf = async () => {
    setLoading(true)
    try {
      await api.post('/evaluation/self-report', { level: selfLevel, self_description: description })
      onComplete(selfLevel)
    } catch (e) {
      onComplete(selfLevel)
    } finally { setLoading(false) }
  }

  if (result) {
    return (
      <div className="text-center space-y-4 animate-fade-in">
        <div className="text-5xl">🎯</div>
        <h3 className="text-xl font-display font-bold text-forge-text">Evaluation Complete!</h3>
        <div className="inline-block px-6 py-3 rounded-xl bg-forge-accent/20 border border-forge-accent/30">
          <span className="text-forge-accent font-mono font-bold text-lg capitalize">{result.level}</span>
          <span className="text-forge-muted font-mono text-sm ml-2">level assigned</span>
        </div>
        {result.feedback && (
          <p className="text-forge-muted text-sm font-mono max-w-sm mx-auto">{result.feedback}</p>
        )}
      </div>
    )
  }

  if (!mode) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div>
          <h2 className="text-2xl font-display font-bold text-forge-text mb-2">Assess Your Level</h2>
          <p className="text-forge-muted text-sm font-mono">We need to know where you stand to personalize your journey.</p>
        </div>

        <div className="grid gap-4">
          {hasAI && (
            <button
              onClick={() => setMode('quiz')}
              className="p-5 rounded-xl border border-forge-border hover:border-forge-accent hover:bg-forge-accent/5 text-left transition-all group"
            >
              <div className="flex items-start gap-4">
                <div className="text-3xl">🧠</div>
                <div>
                  <div className="font-display font-semibold text-forge-text group-hover:text-forge-accent transition-colors">Take AI-Powered Quiz</div>
                  <div className="text-xs font-mono text-forge-muted mt-1">10 questions · ~5 min · AI evaluates your answers for precise placement</div>
                </div>
              </div>
            </button>
          )}
          <button
            onClick={() => setMode('self')}
            className="p-5 rounded-xl border border-forge-border hover:border-forge-purple hover:bg-forge-purple/5 text-left transition-all group"
          >
            <div className="flex items-start gap-4">
              <div className="text-3xl">✍️</div>
              <div>
                <div className="font-display font-semibold text-forge-text group-hover:text-forge-purple transition-colors">Self-Assess</div>
                <div className="text-xs font-mono text-forge-muted mt-1">Tell us your level and describe what you know</div>
              </div>
            </div>
          </button>
        </div>
      </div>
    )
  }

  if (mode === 'self') {
    return (
      <div className="space-y-6 animate-fade-in">
        <button onClick={() => setMode(null)} className="text-xs font-mono text-forge-muted hover:text-forge-text">← Back</button>
        <h2 className="text-xl font-display font-bold text-forge-text">Tell us about yourself</h2>

        <div>
          <label className="block text-xs font-mono text-forge-muted mb-3 uppercase tracking-wider">Your Current Level</label>
          <div className="grid grid-cols-3 gap-3">
            {['beginner','intermediate','advanced'].map(l => (
              <button
                key={l}
                onClick={() => setSelfLevel(l)}
                className={`py-3 rounded-xl border font-mono text-sm capitalize transition-all ${
                  selfLevel === l ? 'border-forge-accent bg-forge-accent/10 text-forge-accent' : 'border-forge-border text-forge-muted hover:border-forge-muted'
                }`}
              >
                {l}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs font-mono text-forge-muted mb-2 uppercase tracking-wider">Describe what you know</label>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            rows={4}
            className="w-full bg-forge-bg border border-forge-border rounded-xl px-4 py-3 text-forge-text font-mono text-sm focus:outline-none focus:border-forge-accent transition-colors resize-none"
            placeholder="e.g., I know arrays and basic sorting. Struggle with trees and DP..."
          />
          <p className="mt-1 text-xs font-mono text-forge-muted">This helps us customize your question set in the future.</p>
        </div>

        <button
          onClick={submitSelf}
          disabled={loading}
          className="w-full py-3 rounded-xl bg-forge-accent text-forge-bg font-display font-semibold text-sm transition-all hover:opacity-90 disabled:opacity-50"
        >
          {loading ? 'Saving...' : 'Continue →'}
        </button>
      </div>
    )
  }

  // Quiz mode
  const q = quiz[currentQ]
  if (!q) return null

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <button onClick={() => setMode(null)} className="text-xs font-mono text-forge-muted hover:text-forge-text">← Back</button>
        <span className="text-xs font-mono text-forge-muted">{currentQ + 1} / {quiz.length}</span>
      </div>

      <div className="w-full h-1 bg-forge-border rounded-full overflow-hidden">
        <div className="h-full bg-forge-accent transition-all duration-300" style={{ width: `${((currentQ + 1) / quiz.length) * 100}%` }} />
      </div>

      <div>
        <div className="text-xs font-mono text-forge-muted mb-2 uppercase">{q.topic}</div>
        <h3 className="text-lg font-display font-semibold text-forge-text">{q.question}</h3>
      </div>

      <div className="space-y-3">
        {q.options.map((opt, i) => (
          <button
            key={i}
            onClick={() => setAnswers({ ...answers, [q.id]: i })}
            className={`w-full p-4 rounded-xl border text-left font-mono text-sm transition-all ${
              answers[q.id] === i
                ? 'border-forge-accent bg-forge-accent/10 text-forge-accent'
                : 'border-forge-border text-forge-text hover:border-forge-muted'
            }`}
          >
            <span className="text-forge-muted mr-3">{String.fromCharCode(65 + i)}.</span>
            {opt}
          </button>
        ))}
      </div>

      <div className="flex gap-3">
        {currentQ < quiz.length - 1 ? (
          <button
            onClick={() => setCurrentQ(c => c + 1)}
            disabled={answers[q.id] === undefined}
            className="flex-1 py-3 rounded-xl bg-forge-accent text-forge-bg font-display font-semibold text-sm transition-all hover:opacity-90 disabled:opacity-40"
          >
            Next →
          </button>
        ) : (
          <button
            onClick={submitQuiz}
            disabled={loading}
            className="flex-1 py-3 rounded-xl bg-gradient-to-r from-forge-accent to-forge-blue text-forge-bg font-display font-semibold text-sm transition-all hover:opacity-90 disabled:opacity-50"
          >
            {loading ? 'Evaluating...' : 'Submit Quiz ✓'}
          </button>
        )}
      </div>

      <div>
        <label className="block text-xs font-mono text-forge-muted mb-2 uppercase tracking-wider">Optional: Describe your experience (helps AI evaluate better)</label>
        <textarea
          value={description}
          onChange={e => setDescription(e.target.value)}
          rows={2}
          className="w-full bg-forge-bg border border-forge-border rounded-xl px-4 py-3 text-forge-text font-mono text-xs focus:outline-none focus:border-forge-accent transition-colors resize-none"
          placeholder="Brief note about your DSA background..."
        />
      </div>
    </div>
  )
}
