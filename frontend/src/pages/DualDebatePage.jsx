import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import VoiceRecorder from '../components/VoiceRecorder'
import { api } from '../api'
import './DualDebatePage.css'
import DotGrid from '../components/DotGrid'
import Hyperspeed from '../components/Hyperspeed'
import DecryptedText from '../components/DecryptedText'

export default function DualDebatePage() {
  const navigate = useNavigate()
  
  // Hyperspeed config
  const hyperspeedOptions = {
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
  }
  
  // Setup phase
  const [topic, setTopic] = useState('')
  const [user1Name, setUser1Name] = useState('Player 1')
  const [user2Name, setUser2Name] = useState('Player 2')
  const [isSetup, setIsSetup] = useState(true)
  const [showTransition, setShowTransition] = useState(false)

  // Debate phase
  const [transcriptText, setTranscriptText] = useState('')
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  
  // Active states
  const [isRecording, setIsRecording] = useState(false)
  const [isTranscribing, setIsTranscribing] = useState(false)

  const messagesEndRef = useRef(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    if (!isSetup && !showTransition) {
      scrollToBottom()
    }
  }, [transcriptText, isSetup, showTransition])

  const handleStart = (e) => {
    e.preventDefault()
    if (!topic.trim() || !user1Name.trim() || !user2Name.trim()) return
    setIsSetup(false)
    setShowTransition(true)
    setTimeout(() => setShowTransition(false), 4000)
  }

  const handleNewTranscription = (text) => {
    if (!text.trim()) return
    setTranscriptText(prev => prev ? prev + ' ' + text : text)
  }

  const handleEndDebate = async () => {
    if (!transcriptText.trim()) return
    setIsAnalyzing(true)
    try {
      const results = await api.analyzeDualDebate({ 
        topic, 
        user1Name,
        user2Name,
        transcriptText 
      })
      navigate('/dual-results', { state: { results, topic, transcriptText, user1Name, user2Name } })
    } catch (err) {
      console.error(err)
      alert("Failed to analyze dual debate.")
      setIsAnalyzing(false)
    }
  }

  if (showTransition) {
    return (
      <div className="dual-page transition-screen">
        <div className="transition-screen__bg">
          <Hyperspeed effectOptions={hyperspeedOptions} />
        </div>
        <div className="transition-screen__overlay">
          <div className="transition-screen__content animate-scale-in">
            <DecryptedText
              text={`Initializing Face-to-Face Arena...`}
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
              text={`${user1Name} vs ${user2Name} • Preparing microphones`}
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

  if (isSetup) {
    return (
      <div className="dual-page page-enter">
        <DotGrid
          dotSize={4} gap={20} baseColor="#1a1a2e" activeColor="#10b981"
          proximity={100} shockRadius={150} shockStrength={3}
        />
        <div className="dual-setup__container">
          <div className="dual-setup__header">
            <h1 className="dual-setup__title">Face-to-Face Setup</h1>
            <p className="dual-setup__subtitle">Enter your names and what you'll debate about.</p>
          </div>
          
          <form className="dual-setup__form glass-card" onSubmit={handleStart}>
            <div className="form-group">
              <label>Debate Topic</label>
              <textarea
                className="input"
                placeholder="e.g. Remote work is better than office work..."
                value={topic}
                onChange={e => setTopic(e.target.value)}
                rows={3}
                required
              />
            </div>
            
            <div className="dual-setup__names">
              <div className="form-group">
                <label>Player 1 (Left)</label>
                <input
                  type="text"
                  className="input"
                  value={user1Name}
                  onChange={e => setUser1Name(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label>Player 2 (Right)</label>
                <input
                  type="text"
                  className="input"
                  value={user2Name}
                  onChange={e => setUser2Name(e.target.value)}
                  required
                />
              </div>
            </div>
            
            <button type="submit" className="btn btn-primary dual-setup__btn" disabled={!topic.trim()}>
              Start Debate
            </button>
          </form>
        </div>
      </div>
    )
  }

  // Main Debate UI
  return (
    <div className="dual-page page-enter">
      <div className="dual-header">
        <div className="dual-header__content">
          <button className="btn btn-sm btn-secondary" onClick={() => setIsSetup(true)}>
            ← Setup
          </button>
          <div className="dual-header__topic">
            <span className="label">Topic:</span> {topic}
          </div>
          <button 
            className="btn btn-sm btn-primary" 
            onClick={handleEndDebate} 
            disabled={!transcriptText.trim() || isAnalyzing || isRecording || isTranscribing}
          >
            {isAnalyzing ? "Analyzing..." : "End & Analyze"}
          </button>
        </div>
      </div>

      <div className="dual-arena single-mic-arena">
        <div className="dual-participants">
          <div className="participant-card participant-card--u1">
            <h2>{user1Name}</h2>
          </div>
          <div className="participant-vs">VS</div>
          <div className="participant-card participant-card--u2">
            <h2>{user2Name}</h2>
          </div>
        </div>

        {/* Central Transcript */}
        <div className="dual-transcript-container glass-card">
          <div className="dual-transcript">
            {!transcriptText.trim() ? (
              <div className="dual-empty">
                <p>No recording yet.</p>
                <span>Click the microphone below and debate freely in one continuous take. Our AI will automatically identify who is talking!</span>
              </div>
            ) : (
              <div className="dual-msg-wrapper align-center">
                <div className="dual-msg dual-msg--neutral animate-scale-in">
                  <div className="dual-msg__text">{transcriptText}</div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Central Single Recorder */}
        <div className="single-recorder-container">
          <div className="single-recorder-wrapper">
            <VoiceRecorder 
              onTranscription={handleNewTranscription}
              onStateChange={state => {
                setIsRecording(state.isRecording)
                setIsTranscribing(state.isTranscribing)
              }}
              disabled={isAnalyzing}
            />
          </div>
          <p className="recorder-hint">Single continuous recording. Speak freely!</p>
        </div>
      </div>
    </div>
  )
}
