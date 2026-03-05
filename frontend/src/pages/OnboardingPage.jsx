import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import AIConnectionStep from '../components/onboarding/AIConnectionStep'
import EvaluationStep from '../components/onboarding/EvaluationStep'
import api from '../utils/api'

const STEPS = ['connect', 'evaluate']
const STEP_LABELS = ['AI Connection', 'Skill Assessment']

export default function OnboardingPage() {
  const { user, updateUser } = useAuth()
  const navigate = useNavigate()
  const [step, setStep] = useState(0) // 0 = AI connect, 1 = evaluate
  const [aiConnected, setAiConnected] = useState(false)

  const handleAIConnected = ({ provider, preview }) => {
    setAiConnected(true)
    updateUser({ ai_connected: true })
    setStep(1)
  }

  const handleAISkipped = () => {
    setStep(1)
  }

  const handleEvalComplete = async (level) => {
    updateUser({ level, onboarding_complete: true })
    navigate('/dashboard')
  }

  return (
    <div className="min-h-screen bg-forge-bg flex items-center justify-center noise-bg relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-forge-accent via-forge-blue to-forge-purple" />
      <div className="absolute top-1/4 right-1/4 w-80 h-80 bg-forge-accent/3 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-lg px-4 py-10">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-forge-accent to-forge-blue flex items-center justify-center">
              <span className="text-forge-bg text-sm">⚡</span>
            </div>
            <span className="text-xl font-display font-bold gradient-text">DSAForge</span>
          </div>
          <p className="text-forge-muted text-xs font-mono">Setting up your forge, {user?.username}</p>
        </div>

        {/* Step indicators */}
        <div className="flex items-center justify-center gap-3 mb-8">
          {STEPS.map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div className={`w-7 h-7 rounded-full border flex items-center justify-center text-xs font-mono transition-all ${
                i < step ? 'bg-forge-accent border-forge-accent text-forge-bg' :
                i === step ? 'border-forge-accent text-forge-accent' :
                'border-forge-border text-forge-muted'
              }`}>
                {i < step ? '✓' : i + 1}
              </div>
              <span className={`text-xs font-mono ${i === step ? 'text-forge-text' : 'text-forge-muted'}`}>
                {STEP_LABELS[i]}
              </span>
              {i < STEPS.length - 1 && (
                <div className={`w-8 h-px mx-1 ${i < step ? 'bg-forge-accent' : 'bg-forge-border'}`} />
              )}
            </div>
          ))}
        </div>

        {/* Step content */}
        <div className="glass rounded-2xl p-8">
          {step === 0 && (
            <AIConnectionStep onComplete={handleAIConnected} onSkip={handleAISkipped} />
          )}
          {step === 1 && (
            <EvaluationStep hasAI={aiConnected} onComplete={handleEvalComplete} />
          )}
        </div>
      </div>
    </div>
  )
}
