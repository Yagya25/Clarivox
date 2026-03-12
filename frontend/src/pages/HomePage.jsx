import { useState, useEffect, useRef, useMemo } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { api } from '../api'
import TopicCard from '../components/TopicCard'
import DotGrid from '../components/DotGrid'
import DarkVeil from '../components/DarkVeil'
import ShinyText from '../components/ShinyText'
import ScrollFloat from '../components/ScrollFloat'
import Crosshair from '../components/Crosshair'
import Hyperspeed from '../components/Hyperspeed'
import DecryptedText from '../components/DecryptedText'
import VariableProximity from '../components/VariableProximity'
import '../pages/MUNPage.css'
import './HomePage.css'

export default function HomePage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [userName, setUserName] = useState(() => sessionStorage.getItem('debateCoachName') || '')
  const [nameInput, setNameInput] = useState('')
  // If ?mode=select show welcome (mode selection) instead of main
  const [showWelcome, setShowWelcome] = useState(() => searchParams.get('mode') === 'select' && !!sessionStorage.getItem('debateCoachName'))
  const [showTransition, setShowTransition] = useState(false)
  const [showMain, setShowMain] = useState(() => !!sessionStorage.getItem('debateCoachName') && searchParams.get('mode') !== 'select')
  const nameInputRef = useRef(null)
  const scrollRevealRef = useRef(null)
  const proximityContainerRef = useRef(null)

  const [topics, setTopics] = useState([])
  const [selectedTopic, setSelectedTopic] = useState('')
  const [customTopic, setCustomTopic] = useState('')
  const [userStance, setUserStance] = useState('for')
  const [rounds, setRounds] = useState(5)
  const [isLoading, setIsLoading] = useState(false)
  const [isCustom, setIsCustom] = useState(false)
  const [error, setError] = useState('')
  const [loadingTimeLeft, setLoadingTimeLeft] = useState(0)

  useEffect(() => {
    api.getTopics().then(data => setTopics(data.topics)).catch(() => {
      setTopics([
        "Social media does more harm than good to society",
        "AI will replace more jobs than it creates",
        "College education is no longer worth the cost",
        "Space exploration funding should be redirected to Earth's problems",
        "Remote work is better than office work",
      ])
    })
  }, [])

  useEffect(() => {
    if (!showMain && !showWelcome && !showTransition && nameInputRef.current) {
      nameInputRef.current.focus()
    }
  }, [showMain, showWelcome, showTransition])

  const handleNameSubmit = (e) => {
    e.preventDefault()
    if (!nameInput.trim()) return
    const name = nameInput.trim()
    setUserName(name)
    sessionStorage.setItem('debateCoachName', name)
    setShowWelcome(true)
    setShowMain(false)
  }

  const handleTopicSelect = (topic) => {
    setSelectedTopic(topic)
    setIsCustom(false)
    setCustomTopic('')
  }

  const handleCustomToggle = () => {
    setIsCustom(!isCustom)
    setSelectedTopic('')
  }

  const activeTopic = isCustom ? customTopic : selectedTopic

  const handleStart = async () => {
    if (!activeTopic.trim()) return
    setError('')
    setIsLoading(true)
    setLoadingTimeLeft(4) // 4 seconds loading simulation for the AI

    // Countdown interval
    const timer = setInterval(() => {
      setLoadingTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    try {
      const session = await api.startDebate(activeTopic, userStance, rounds)
      clearInterval(timer)
      
      // Give a tiny buffer if API was faster than the timer so UI can catch up
      setTimeout(() => {
        navigate('/debate', { state: { session, userName } })
      }, 500)
    } catch (err) {
      clearInterval(timer)
      console.error('Failed to start debate:', err)
      setError(err.message || 'Failed to connect to backend. Make sure the server is running on port 8000.')
      setIsLoading(false)
    }
  }

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
      leftCars: [0xd856bf, 0x6750a2, 0xc247ac],
      rightCars: [0x03b3c3, 0x0e5ea5, 0x324555],
      sticks: 0x03b3c3
    }
  }), [])

  const handleContinueToMain = () => {
    setShowWelcome(false)
    setShowTransition(true)
    // Auto-transition to main after 4 seconds
    setTimeout(() => {
      setShowTransition(false)
      setShowMain(true)
    }, 4000)
  }

  const handleModeSelect = (mode) => {
    if (mode === 'mun') {
      // Navigate to MUN page (it has its own transition)
      navigate('/mun')
    } else {
      // Debate: play hyperspeed then show main
      handleContinueToMain()
    }
  }

  // ---- HYPERSPEED TRANSITION ----
  if (showTransition) {
    return (
      <div className="home-page transition-screen">
        <div className="transition-screen__bg">
          <Hyperspeed effectOptions={hyperspeedOptions} />
        </div>
        <div className="transition-screen__overlay">
          <div className="transition-screen__content animate-scale-in">
            <DecryptedText
              text={`Initializing Clarivox Arena for ${userName}...`}
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
              text="Preparing your arena • Loading argument analysis engine"
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

  // ---- NAME ENTRY SCREEN ----
  if (!showMain && !showWelcome) {
    return (
      <div className="home-page page-enter">
        <div className="home-dotgrid-bg">
          <DotGrid
            dotSize={5} gap={15} baseColor="#271E37" activeColor="#5227FF"
            proximity={120} shockRadius={250} shockStrength={5} resistance={750} returnDuration={1.5}
          />
        </div>
        <div className="name-screen">
          <div className="home-hero__header animate-scale-in" ref={proximityContainerRef}>
            <div className="clarivox-logo-container">
              <img src="/logo.png" alt="Clarivox Logo" className="clarivox-brand-logo" />
            </div>
            <div style={{ position: 'relative' }}>
              <VariableProximity
                label="Clarivox"
                className="variable-proximity-demo name-screen__title text-gradient"
                fromFontVariationSettings="'wght' 400, 'opsz' 9"
                toFontVariationSettings="'wght' 1000, 'opsz' 40"
                containerRef={proximityContainerRef}
                radius={100}
                falloff="linear"
              />
            </div>
          </div>
          <form onSubmit={handleNameSubmit} className="name-screen__form animate-fade-in-up">
            <input
              ref={nameInputRef}
              type="text"
              className="input name-screen__input"
              placeholder="Enter your name..."
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              maxLength={30}
              autoFocus
              id="name-input"
            />
            <p className="name-screen__hint">Press Enter to continue</p>
          </form>
        </div>
      </div>
    )
  }

  // ---- WELCOME + SCROLL REVEAL ----
  if (showWelcome) {
    return (
      <div className="home-page">
        <div className="home-dotgrid-bg">
          <DotGrid
            dotSize={5} gap={15} baseColor="#271E37" activeColor="#5227FF"
            proximity={120} shockRadius={250} shockStrength={5} resistance={750} returnDuration={1.5}
          />
        </div>

        {/* Welcome Section - Full viewport height */}
        <div className="welcome-section">
          <div className="welcome-section__content animate-scale-in">
            <ShinyText
              text={`✨ Welcome, ${userName}!`}
              speed={2}
              delay={0}
              color="#c084fc"
              shineColor="#ffffff"
              spread={120}
              direction="left"
              yoyo={false}
              className="welcome-section__shiny"
            />
          </div>
          <div className="welcome-section__scroll-hint animate-fade-in">
            <span>Scroll down</span>
            <div className="welcome-section__arrow">↓</div>
          </div>
        </div>

        {/* Mode Selection Section */}
        <div className="scroll-reveal-section" ref={scrollRevealRef}>
          <Crosshair containerRef={scrollRevealRef} color="#ffffff" />
          <div className="mode-select-section">
            <p className="mode-select-title">What would you like to practice today?</p>
            <div className="mode-cards">
              {/* Debate Card */}
              <div
                className="mode-card mode-card--debate"
                onClick={() => handleModeSelect('debate')}
                id="mode-debate-btn"
                role="button"
                tabIndex={0}
                onKeyDown={e => e.key === 'Enter' && handleModeSelect('debate')}
              >
                <span className="mode-card__icon">🎯</span>
                <h3 className="mode-card__title">Debate</h3>
                <p className="mode-card__desc">
                  Go head-to-head with AI on any topic. Defend your stance, sharpen your logic, and get scored on evidence and persuasiveness.
                </p>
                <span className="mode-card__badge">AI Opponent</span>
              </div>

              {/* MUN Card */}
              <div
                className="mode-card mode-card--mun"
                onClick={() => handleModeSelect('mun')}
                id="mode-mun-btn"
                role="button"
                tabIndex={0}
                onKeyDown={e => e.key === 'Enter' && handleModeSelect('mun')}
              >
                <span className="mode-card__icon">🌐</span>
                <h3 className="mode-card__title">MUN</h3>
                <p className="mode-card__desc">
                  Represent a country in Model United Nations. Get a country brief, deliver speeches, and answer the committee's tough questions.
                </p>
                <span className="mode-card__badge">Diplomatic Simulation</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ---- MAIN CONTENT ----
  return (
    <div className="home-page page-enter">
      {/* Hero */}
      <header className="home-hero">
        <div className="home-hero__badge animate-fade-in">⚡ Clarivox AI</div>
        <p className="home-hero__subtitle animate-fade-in">
          Ready to sharpen your arguments, <strong>{userName}</strong>? Pick a topic and defend your stance.
          Clarivox will challenge every weak point, then score you on <strong>logic</strong>, <strong>evidence</strong>, and <strong>persuasiveness</strong>.
        </p>
      </header>

      <div className="container" style={{ position: 'relative', zIndex: 2 }}>
        <div className="home-content">
          {/* Topic Selection */}
          <section className="home-section animate-fade-in-up">
            <div className="home-section__header">
              <h2 className="home-section__title">Choose Your Battleground</h2>
              <button
                className={`btn btn-sm ${isCustom ? 'btn-primary' : 'btn-secondary'}`}
                onClick={handleCustomToggle}
                id="custom-topic-toggle"
              >
                {isCustom ? '← Pick from list' : '✏️ Custom topic'}
              </button>
            </div>

            {isCustom ? (
              <div className="home-custom-topic">
                <textarea
                  className="input"
                  placeholder="Enter your custom debate topic..."
                  value={customTopic}
                  onChange={(e) => setCustomTopic(e.target.value)}
                  rows={3}
                  id="custom-topic-input"
                />
              </div>
            ) : (
              <div className="home-topics">
                {topics.map((topic, i) => (
                  <TopicCard
                    key={i}
                    topic={topic}
                    isSelected={selectedTopic === topic}
                    onClick={handleTopicSelect}
                  />
                ))}
              </div>
            )}
          </section>

          {/* Stance & Settings */}
          <section className="home-settings glass-card animate-fade-in-up" style={{ animationDelay: '200ms' }}>
            <div className="home-stance">
              <h3 className="home-settings__label">Your Stance</h3>
              <div className="home-stance__btns">
                <button
                  className={`btn btn-sm ${userStance === 'for' ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setUserStance('for')}
                  id="stance-for"
                >
                  👍 For
                </button>
                <button
                  className={`btn btn-sm ${userStance === 'against' ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setUserStance('against')}
                  id="stance-against"
                >
                  👎 Against
                </button>
              </div>
            </div>

            <div className="home-rounds">
              <h3 className="home-settings__label">Rounds</h3>
              <div className="home-rounds__selector">
                {[3, 5, 7].map(r => (
                  <button
                    key={r}
                    className={`btn btn-sm ${rounds === r ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => setRounds(r)}
                    id={`rounds-${r}`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>
          </section>

          {/* Start Button */}
          <div className="home-start animate-fade-in-up" style={{ animationDelay: '400ms' }}>
            <button
              className={`btn btn-primary btn-lg home-start__btn ${isLoading ? 'btn-loading' : ''}`}
              onClick={handleStart}
              disabled={!activeTopic.trim() || isLoading}
              id="start-debate-btn"
            >
              {isLoading ? (
                <>
                  <div className="spinner" style={{ marginRight: '8px' }} /> 
                  Waking up AI... {loadingTimeLeft > 0 ? `(${loadingTimeLeft}s)` : 'Almost ready'}
                </>
              ) : (
                <>🎯 Enter the Arena</>
              )}
            </button>
            {error && (
              <p style={{ color: '#ef4444', marginTop: '12px', fontSize: '0.9rem' }}>❌ {error}</p>
            )}
            {activeTopic && (
              <p className="home-start__preview">
                You'll debate <strong>{userStance === 'for' ? 'for' : 'against'}</strong>: "{activeTopic}"
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Interactive Neural Pattern Background */}
      <div className="home-darkveil-bg">
        <DarkVeil
          hueShift={0}
          noiseIntensity={0}
          scanlineIntensity={0}
          speed={0.5}
          scanlineFrequency={0}
          warpAmount={0}
        />
      </div>
    </div>
  )
}
