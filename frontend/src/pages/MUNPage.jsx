import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import Prism from '../components/Prism'
import Hyperspeed from '../components/Hyperspeed'
import DecryptedText from '../components/DecryptedText'
import MessageBubble from '../components/MessageBubble'
import GooeyNav from '../components/GooeyNav'
import './MUNPage.css'

const COUNTRIES = [
  "United States", "China", "Russia", "United Kingdom", "France",
  "Germany", "India", "Brazil", "Japan", "South Africa",
  "Canada", "Australia", "Saudi Arabia", "Iran", "Israel",
  "Turkey", "Pakistan", "Nigeria", "Egypt", "Mexico",
  "Argentina", "Indonesia", "South Korea", "Italy", "Spain",
  "Ukraine", "Poland", "Netherlands", "Sweden", "Norway",
  "Afghanistan", "Iraq", "Syria", "Libya", "Venezuela",
  "Cuba", "North Korea", "Ethiopia", "Kenya", "Ghana"
].sort()

const COMMITTEES = [
  "General Assembly (GA)",
  "Security Council (SC)",
  "Human Rights Council (HRC)",
  "Economic and Social Council (ECOSOC)",
  "International Court of Justice (ICJ)",
  "UNICEF",
  "UNESCO",
  "WHO",
  "UNHCR",
  "Environmental Committee"
]

export default function MUNPage() {
  const navigate = useNavigate()
  const userName = sessionStorage.getItem('debateCoachName') || 'Delegate'

  // Phases: 'init' | 'select' | 'transition' | 'brief' | 'session' | 'ended'
  const [phase, setPhase] = useState('init')
  const [countrySearch, setCountrySearch] = useState('')
  const [selectedCountry, setSelectedCountry] = useState('')
  const [selectedCommittee, setSelectedCommittee] = useState(COMMITTEES[0])
  const [munTopic, setMunTopic] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const [sessionId, setSessionId] = useState('')
  const [countryBrief, setCountryBrief] = useState('')
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [isEnding, setIsEnding] = useState(false)
  const [finalFeedback, setFinalFeedback] = useState(null)

  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)

  const filteredCountries = COUNTRIES.filter(c =>
    c.toLowerCase().includes(countrySearch.toLowerCase())
  )

  useEffect(() => {
    if (phase === 'init') {
      const timer = setTimeout(() => {
        setPhase('select')
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [phase])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const hyperspeedOptions = useMemo(() => ({
    distortion: 'turbulentDistortion',
    length: 400,
    roadWidth: 10,
    islandWidth: 2,
    lanesPerRoad: 3,
    fov: 90,
    fovSpeedUp: 150,
    speedUp: 2,
    carLightsFade: 0.4,
    totalSideLightSticks: 20,
    lightPairsPerRoadWay: 40,
    shoulderLinesWidthPercentage: 0.05,
    brokenLinesWidthPercentage: 0.1,
    brokenLinesLengthPercentage: 0.5,
    lightStickWidth: [0.12, 0.5],
    lightStickHeight: [1.3, 1.7],
    movingAwaySpeed: [60, 80],
    movingCloserSpeed: [-120, -160],
    carLightsLength: [12, 80],
    carLightsRadius: [0.05, 0.14],
    carWidthPercentage: [0.3, 0.5],
    carShiftX: [-0.8, 0.8],
    carFloorSeparation: [0, 5],
    colors: {
      roadColor: 0x080808,
      islandColor: 0x0a0a0a,
      background: 0x000000,
      shoulderLines: 0x131318,
      brokenLines: 0x131318,
      leftCars: [0x4f46e5, 0x7c3aed, 0x2563eb],
      rightCars: [0x06b6d4, 0x0891b2, 0x0e7490],
      sticks: 0x6366f1
    }
  }), [])

  const handleStartMUN = async () => {
    if (!selectedCountry) return
    setError('')
    setIsLoading(true)
    setPhase('transition')

    try {
      const response = await fetch('/api/mun/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          country: selectedCountry,
          committee: selectedCommittee,
          topic: munTopic,
          user_name: userName
        })
      })
      const data = await response.json()
      setSessionId(data.session_id)
      setCountryBrief(data.country_brief)
      setMessages([{ role: 'ai', content: data.ai_opening }])

      // After 4s transition, show brief
      setTimeout(() => {
        setPhase('brief')
        setIsLoading(false)
      }, 4000)
    } catch (err) {
      setError('Failed to start MUN session. Is the backend running?')
      setPhase('select')
      setIsLoading(false)
    }
  }

  const handleSend = async () => {
    if (!input.trim() || isSending) return
    const msg = input.trim()
    setInput('')
    setMessages(prev => [...prev, { role: 'user', content: msg }])
    setIsSending(true)

    try {
      const response = await fetch(`/api/mun/message/${sessionId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: msg })
      })
      const data = await response.json()
      setMessages(prev => [...prev, { role: 'ai', content: data.ai_response }])
    } catch {
      setMessages(prev => [...prev, { role: 'ai', content: 'The committee chair is unavailable. Please try again.' }])
    } finally {
      setIsSending(false)
      inputRef.current?.focus()
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleEndSession = async () => {
    setIsEnding(true)
    try {
      const response = await fetch(`/api/mun/end/${sessionId}`, { method: 'POST' })
      const data = await response.json()
      setFinalFeedback(data)
      setPhase('ended')
    } catch {
      setPhase('ended')
      setFinalFeedback({
        feedback: 'Session ended. Great work representing your country!',
        strengths: ['Participated actively', 'Represented country position'],
        improvements: ['Study MUN procedures more'],
        overall_impression: 'Good effort!'
      })
    } finally {
      setIsEnding(false)
    }
  }

  const navItems = [
    { label: 'Home', icon: '🏠' },
    { label: 'Change Mode', icon: '🔄' },
    { label: 'New Country', icon: '🌍' },
  ]

  const handleNavClick = useCallback((item, index) => {
    if (index === 0) {
      sessionStorage.removeItem('debateCoachName')
      navigate('/')
    } else if (index === 1) {
      navigate('/?mode=select')
    } else if (index === 2) {
      setPhase('select')
      setSelectedCountry('')
      setMessages([])
      setFinalFeedback(null)
      setInput('')
    }
  }, [navigate])

  // ---- TRANSITION/INIT SCREEN ----
  if (phase === 'init' || phase === 'transition') {
    const isInit = phase === 'init'
    return (
      <div className="mun-page transition-screen">
        <div className="transition-screen__bg">
          <Hyperspeed effectOptions={hyperspeedOptions} />
        </div>
        <div className="transition-screen__overlay">
          <div className="transition-screen__content animate-scale-in">
            <DecryptedText
              text={isInit ? "Initializing MUN Mode..." : `Establishing Connection for ${selectedCountry}...`}
              animateOn="view"
              revealDirection="start"
              sequential
              speed={40}
              maxIterations={20}
              className="transition-revealed"
              encryptedClassName="transition-encrypted"
              parentClassName="transition-text"
            />
          </div>
          <div className="transition-screen__subtext animate-fade-in" style={{ animationDelay: '1s' }}>
            <DecryptedText
              text={isInit ? "Loading diplomatic protocols • International law modules" : `Preparing your brief for ${selectedCountry} • Loading committee data`}
              animateOn="view"
              revealDirection="center"
              sequential
              speed={30}
              className="transition-sub-revealed"
              encryptedClassName="transition-sub-encrypted"
              parentClassName="transition-subtext"
            />
          </div>
        </div>
      </div>
    )
  }

  // ---- COUNTRY SELECTION ----
  if (phase === 'select') {
    return (
      <div className="mun-page mun-select-page">
        {/* Prism background */}
        <div className="mun-prism-bg">
          <Prism
            animationType="rotate"
            timeScale={0.5}
            height={3.5}
            baseWidth={5.5}
            scale={3.6}
            hueShift={0}
            colorFrequency={1}
            noise={0}
            glow={1}
          />
        </div>

        <div className="mun-select-content">
          <div className="mun-select-header animate-scale-in">
            <div className="mun-select-badge">🌐 MUN Mode</div>
            <h1 className="mun-select-title">
              <span className="text-gradient-mun">Model United Nations</span>
            </h1>
            <p className="mun-select-subtitle">Select your country and represent it on the world stage</p>
          </div>

          <div className="mun-select-form glass-card animate-fade-in-up">
            {/* Country Search */}
            <div className="mun-form-group">
              <label className="mun-form-label">🏳️ Your Country</label>
              <input
                className="input mun-search-input"
                placeholder="Search country..."
                value={countrySearch}
                onChange={e => setCountrySearch(e.target.value)}
                id="country-search"
              />
              <div className="mun-country-grid">
                {filteredCountries.slice(0, 20).map(country => (
                  <button
                    key={country}
                    className={`mun-country-btn ${selectedCountry === country ? 'mun-country-btn--active' : ''}`}
                    onClick={() => setSelectedCountry(country)}
                    id={`country-${country.replace(/\s+/g, '-').toLowerCase()}`}
                  >
                    {country}
                  </button>
                ))}
              </div>
              {selectedCountry && (
                <div className="mun-selected-country animate-fade-in">
                  ✅ Selected: <strong>{selectedCountry}</strong>
                </div>
              )}
            </div>

            {/* Committee */}
            <div className="mun-form-group">
              <label className="mun-form-label">🏛️ Committee</label>
              <select
                className="input mun-select-dropdown"
                value={selectedCommittee}
                onChange={e => setSelectedCommittee(e.target.value)}
                id="committee-select"
              >
                {COMMITTEES.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            {/* Optional Topic */}
            <div className="mun-form-group">
              <label className="mun-form-label">📋 Topic (optional)</label>
              <input
                className="input"
                placeholder="e.g., Climate Change, Nuclear Disarmament..."
                value={munTopic}
                onChange={e => setMunTopic(e.target.value)}
                id="mun-topic-input"
              />
            </div>

            {error && <p className="mun-error">❌ {error}</p>}

            <button
              className="btn btn-primary btn-lg mun-start-btn"
              onClick={handleStartMUN}
              disabled={!selectedCountry || isLoading}
              id="start-mun-btn"
            >
              {isLoading ? (
                <><div className="spinner" style={{ marginRight: 8 }} /> Preparing your brief...</>
              ) : (
                <>🌐 Enter the Chamber</>
              )}
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ---- COUNTRY BRIEF ----
  if (phase === 'brief') {
    return (
      <div className="mun-page mun-brief-page page-enter">
        <div className="mun-prism-bg mun-prism-bg--dim">
          <Prism
            animationType="rotate"
            timeScale={0.3}
            height={3.5}
            baseWidth={5.5}
            scale={4}
            hueShift={0.5}
            colorFrequency={0.8}
            noise={0}
            glow={0.7}
          />
        </div>

        <div className="mun-brief-content">
          <div className="mun-brief-header glass-card animate-scale-in">
            <div className="mun-brief-flag-area">
              <div className="mun-brief-country-badge">🌐</div>
              <div>
                <h1 className="mun-brief-country-title">{selectedCountry}</h1>
                <p className="mun-brief-committee">{selectedCommittee}</p>
                {munTopic && <p className="mun-brief-topic">Topic: {munTopic}</p>}
              </div>
            </div>
            <div className="mun-brief-ready-badge animate-pulse-soft">Ready for MUN 🏛️</div>
          </div>

          <div className="mun-brief-body glass-card animate-fade-in-up">
            <h2 className="mun-brief-section-title">📋 Country Brief</h2>
            <div className="mun-brief-text">
              {countryBrief.split('\n').map((line, i) => (
                line.trim() ? <p key={i}>{line}</p> : <br key={i} />
              ))}
            </div>
          </div>

          <div className="mun-brief-actions animate-fade-in-up">
            <button
              className="btn btn-primary btn-lg"
              onClick={() => setPhase('session')}
              id="enter-chamber-btn"
            >
              🎤 Enter the Chamber
            </button>
            <button
              className="btn btn-secondary"
              onClick={() => setPhase('select')}
              id="change-country-btn"
            >
              ← Change Country
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ---- MUN SESSION ----
  if (phase === 'session') {
    return (
      <div className="mun-page mun-session-page page-enter">
        {/* Header */}
        <header className="mun-session-header glass-card">
          <div className="mun-session-header__left">
            <button className="btn btn-secondary btn-sm" onClick={() => setPhase('brief')} id="back-brief-btn">
              ← Brief
            </button>
            <div className="mun-session-header__info">
              <h2 className="mun-session-header__country">🌐 {selectedCountry}</h2>
              <div className="mun-session-header__meta">
                <span className="chip chip-info">{selectedCommittee}</span>
                {munTopic && <span className="chip chip-warning">{munTopic}</span>}
              </div>
            </div>
          </div>
          <button
            className="btn btn-danger btn-sm"
            onClick={handleEndSession}
            disabled={isEnding || messages.length < 2}
            id="end-mun-btn"
          >
            {isEnding ? (
              <><div className="spinner" style={{ width: 14, height: 14 }} /> Closing...</>
            ) : '🏁 End Session'}
          </button>
        </header>

        {/* Messages */}
        <div className="mun-session-messages">
          <div className="mun-session-messages__inner container">
            {messages.map((msg, i) => (
              <MessageBubble key={i} message={msg} animDelay={i * 50} />
            ))}
            {isSending && (
              <div className="arena-typing ai-computing animate-fade-in">
                <div className="ai-fancy-avatar">
                  <div className="ai-orb"></div>
                  <div className="ai-orb-glow"></div>
                  <span style={{ position: 'relative', zIndex: 10 }}>🏛️</span>
                </div>
                <div className="arena-typing__indicator glass-card ai-typing-panel">
                  <div className="ai-scanning-line"></div>
                  <div className="loading-dots"><span></span><span></span><span></span></div>
                  <span className="arena-typing__text">Committee is deliberating...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input */}
        <div className="arena-input-bar glass-card">
          <div className="arena-input-bar__inner container">
            <div className="arena-input-bar__field">
              <textarea
                ref={inputRef}
                className="input arena-input-bar__textarea"
                placeholder="Deliver your speech or respond to the committee..."
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isSending}
                rows={1}
                id="mun-speech-input"
              />
            </div>
            <button
              className="btn btn-primary arena-input-bar__send"
              onClick={handleSend}
              disabled={!input.trim() || isSending}
              id="send-speech-btn"
            >
              {isSending ? <div className="spinner" style={{ width: 18, height: 18 }} /> : '→'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ---- SESSION ENDED / FEEDBACK ----
  if (phase === 'ended' && finalFeedback) {
    return (
      <div className="mun-page mun-ended-page page-enter">
        <div className="mun-prism-bg mun-prism-bg--dim">
          <Prism
            animationType="rotate"
            timeScale={0.2}
            height={3.5}
            baseWidth={5.5}
            scale={4.5}
            hueShift={1}
            colorFrequency={0.6}
            noise={0}
            glow={0.5}
          />
        </div>

        <div className="mun-ended-content">
          <div className="mun-ended-header animate-scale-in">
            <div className="mun-ended-badge">🏆</div>
            <h1 className="mun-ended-title">Session Complete</h1>
            <p className="mun-ended-subtitle">{selectedCountry} · {selectedCommittee}</p>
          </div>

          <div className="mun-ended-impression glass-card animate-fade-in-up">
            <p className="mun-ended-impression-text">"{finalFeedback.overall_impression}"</p>
          </div>

          <div className="mun-ended-feedback glass-card animate-fade-in-up">
            <h2 className="mun-feedback-title">📊 Committee Feedback</h2>
            <p className="mun-feedback-body">{finalFeedback.feedback}</p>
          </div>

          <div className="mun-ended-grid animate-fade-in-up">
            <div className="mun-ended-card mun-ended-card--green glass-card">
              <h3>✅ Strengths</h3>
              <ul>
                {finalFeedback.strengths.map((s, i) => <li key={i}>{s}</li>)}
              </ul>
            </div>
            <div className="mun-ended-card mun-ended-card--orange glass-card">
              <h3>📈 Improvements</h3>
              <ul>
                {finalFeedback.improvements.map((s, i) => <li key={i}>{s}</li>)}
              </ul>
            </div>
          </div>

          {/* GooeyNav navigation */}
          <div className="mun-ended-nav animate-fade-in-up">
            <GooeyNav
              items={navItems}
              particleCount={15}
              particleDistances={[90, 10]}
              particleR={100}
              initialActiveIndex={2}
              animationTime={600}
              timeVariance={300}
              colors={[1, 2, 3, 1, 2, 3, 1, 4]}
              onItemClick={handleNavClick}
            />
          </div>
        </div>
      </div>
    )
  }

  return null
}
