import { useState, useEffect, useRef, useCallback } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { api } from '../api'
import MessageBubble from '../components/MessageBubble'
import VoiceRecorder from '../components/VoiceRecorder'
import './DebateArena.css'

export default function DebateArena() {
  const location = useLocation()
  const navigate = useNavigate()
  const session = location.state?.session

  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [isRecording, setIsRecording] = useState(false)
  const [isTranscribing, setIsTranscribing] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isEnding, setIsEnding] = useState(false)
  const [currentRound, setCurrentRound] = useState(1)
  const [maxRounds, setMaxRounds] = useState(5)
  const [sessionId, setSessionId] = useState('')
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    if (!session) {
      navigate('/')
      return
    }
    setSessionId(session.session_id)
    setMaxRounds(session.max_rounds)
    setMessages([{
      role: 'ai',
      content: session.ai_opening,
      weaknesses: null
    }])
  }, [session, navigate])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async () => {
    if (!input.trim() || isLoading) return

    const userMessage = input.trim()
    setInput('')
    setMessages(prev => [...prev, { role: 'user', content: userMessage, weaknesses: null }])
    setIsLoading(true)

    try {
      const response = await api.sendMessage(sessionId, userMessage)
      setMessages(prev => [...prev, {
        role: 'ai',
        content: response.ai_response,
        weaknesses: response.weaknesses
      }])
      setCurrentRound(response.round_number + 1)
    } catch (err) {
      setMessages(prev => [...prev, {
        role: 'ai',
        content: 'I had trouble processing that. Please try again.',
        weaknesses: null
      }])
    } finally {
      setIsLoading(false)
      inputRef.current?.focus()
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleVoiceTranscription = (text) => {
    setInput(text)
  }

  const handleVoiceStateChange = useCallback(({ isRecording, isTranscribing }) => {
    setIsRecording(isRecording)
    setIsTranscribing(isTranscribing)
  }, [])

  const handleEndDebate = async () => {
    setIsEnding(true)
    try {
      const results = await api.endDebate(sessionId)
      navigate('/results', { state: { results } })
    } catch (err) {
      console.error('Failed to end debate:', err)
      setIsEnding(false)
    }
  }

  const roundsRemaining = maxRounds - currentRound + 1
  const progress = ((currentRound - 1) / maxRounds) * 100

  if (!session) return null

  return (
    <div className="debate-arena page-enter">
      {/* Header */}
      <header className="arena-header glass-card">
        <div className="arena-header__left">
          <button className="btn btn-secondary btn-sm" onClick={() => navigate('/')} id="back-home-btn">
            ← Back
          </button>
          <div className="arena-header__info">
            <h2 className="arena-header__topic">{session.topic}</h2>
            <div className="arena-header__meta">
              <span className="chip chip-info">You: {session.user_stance}</span>
              <span className="chip chip-warning">AI: {session.ai_stance}</span>
            </div>
          </div>
        </div>
        <div className="arena-header__right">
          <div className="arena-round-tracker">
            <span className="arena-round-tracker__label">Round {Math.min(currentRound, maxRounds)}/{maxRounds}</span>
            <div className="arena-round-tracker__bar">
              <div className="arena-round-tracker__fill" style={{ width: `${progress}%` }}></div>
            </div>
          </div>
          <button
            className="btn btn-danger btn-sm"
            onClick={handleEndDebate}
            disabled={isEnding || messages.length < 2}
            id="end-debate-btn"
          >
            {isEnding ? (
              <><div className="spinner" style={{ width: 14, height: 14 }} /> Scoring...</>
            ) : (
              '🏁 End Debate'
            )}
          </button>
        </div>
      </header>

      {/* Messages */}
      <div className="arena-messages">
        <div className="arena-messages__inner container">
          {messages.map((msg, i) => (
            <MessageBubble key={i} message={msg} animDelay={i * 50} />
          ))}

          {isRecording && (
            <div className="arena-typing user-listening animate-fade-in">
              <div className="arena-typing__indicator glass-card" style={{ marginLeft: 'auto', background: 'var(--bg-secondary)', border: '1px solid var(--accent-primary)', opacity: 0.8 }}>
                <div className="loading-dots">
                  <span></span><span></span><span></span>
                </div>
                <span className="arena-typing__text">Listening to your argument...</span>
              </div>
            </div>
          )}

          {isTranscribing && (
            <div className="arena-typing user-transcribing animate-fade-in">
              <div className="arena-typing__indicator glass-card" style={{ marginLeft: 'auto', background: 'var(--bg-secondary)', opacity: 0.8 }}>
                <div className="spinner" style={{ width: 14, height: 14, marginRight: 8 }} />
                <span className="arena-typing__text">Transcribing audio...</span>
              </div>
            </div>
          )}

          {isLoading && (
            <div className="arena-typing ai-computing animate-fade-in">
              <div className="ai-fancy-avatar">
                <div className="ai-orb"></div>
                <div className="ai-orb-glow"></div>
                <span style={{ position: 'relative', zIndex: 10 }}>🤖</span>
              </div>
              <div className="arena-typing__indicator glass-card ai-typing-panel">
                <div className="ai-scanning-line"></div>
                <div className="loading-dots">
                  <span></span><span></span><span></span>
                </div>
                <span className="arena-typing__text">AI is formulating counter-argument...</span>
              </div>
            </div>
          )}

          {roundsRemaining <= 0 && !isLoading && (
            <div className="arena-end-notice glass-card animate-fade-in">
              <p>🏁 All rounds completed! Click <strong>End Debate</strong> to see your score.</p>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Bar */}
      <div className="arena-input-bar glass-card">
        <div className="arena-input-bar__inner container">
          <VoiceRecorder 
            onTranscription={handleVoiceTranscription} 
            disabled={isLoading || roundsRemaining <= 0} 
            onStateChange={handleVoiceStateChange}
          />
          <div className="arena-input-bar__field">
            <textarea
              ref={inputRef}
              className="input arena-input-bar__textarea"
              placeholder={roundsRemaining > 0 ? "Present your argument..." : "Debate ended. Click End Debate for results."}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isLoading || roundsRemaining <= 0}
              rows={1}
              id="debate-input"
            />
          </div>
          <button
            className="btn btn-primary arena-input-bar__send"
            onClick={handleSend}
            disabled={!input.trim() || isLoading || roundsRemaining <= 0}
            id="send-argument-btn"
          >
            {isLoading ? <div className="spinner" style={{ width: 18, height: 18 }} /> : '→'}
          </button>
        </div>
      </div>
    </div>
  )
}
