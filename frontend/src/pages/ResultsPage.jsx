import { useLocation, useNavigate } from 'react-router-dom'
import ScoreGauge from '../components/ScoreGauge'
import MessageBubble from '../components/MessageBubble'
import MagicBento from '../components/MagicBento'
import GooeyNav from '../components/GooeyNav'
import { useState, useCallback } from 'react'
import './ResultsPage.css'

export default function ResultsPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const results = location.state?.results
  const [showTranscript, setShowTranscript] = useState(false)

  if (!results) {
    navigate('/')
    return null
  }

  const { score, topic, transcript } = results

  const getGradeColor = (grade) => {
    if (grade.startsWith('A')) return '#10b981'
    if (grade.startsWith('B')) return '#6c5ce7'
    if (grade.startsWith('C')) return '#f59e0b'
    return '#ef4444'
  }

  const navItems = [
    { label: 'Home', icon: '🏠' },
    { label: 'Change Mode', icon: '🔄' },
    { label: 'Debate Again', icon: '🥊' },
  ]

  const handleNavClick = useCallback((item, index) => {
    if (index === 0) {
      sessionStorage.removeItem('debateCoachName')
      navigate('/')
    } else if (index === 1) {
      navigate('/?mode=select')
    } else if (index === 2) {
      navigate('/') // goes to topic select since mode is not 'select'
    }
  }, [navigate])

  return (
    <div className="results-page page-enter">
      <div className="container">
        {/* Header */}
        <header className="results-header">
          <div className="results-header__badge animate-scale-in">🏆</div>
          <h1 className="results-header__title animate-fade-in">Debate Complete</h1>
          <p className="results-header__topic animate-fade-in">"{topic}"</p>
        </header>

        {/* Overall Score */}
        <div className="results-overall glass-card animate-fade-in-up">
          <div
            className="results-overall__grade"
            style={{ color: getGradeColor(score.grade) }}
          >
            {score.grade}
          </div>
          <div className="results-overall__score">
            <span className="results-overall__number">{score.overall_score.toFixed(1)}</span>
            <span className="results-overall__max">/ 10</span>
          </div>
          <p className="results-overall__summary">{score.summary}</p>
        </div>

        {/* Score Gauges */}
        <div className="results-gauges animate-fade-in-up" style={{ animationDelay: '200ms' }}>
          <ScoreGauge score={score.logic.score} label="Logic" delay={300} />
          <ScoreGauge score={score.evidence.score} label="Evidence" delay={500} />
          <ScoreGauge score={score.persuasiveness.score} label="Persuasiveness" delay={700} />
        </div>

        {/* Magic Bento Feedback Grid */}
        <div className="results-feedback-bento animate-fade-in-up" style={{ animationDelay: '400ms' }}>
          <MagicBento
            cards={[
              {
                color: '#0a0a0a',
                title: 'Logic & Reasoning',
                description: score.logic.feedback,
                label: 'Analysis',
                className: 'span-2',
                headerRight: <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{score.logic.score}/10</div>
              },
              {
                color: '#0a0a0a',
                title: 'Evidence Quality',
                description: score.evidence.feedback,
                label: 'Sourcing',
                className: 'span-2',
                headerRight: <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{score.evidence.score}/10</div>
              },
              {
                color: '#0a0a0a',
                title: 'Persuasiveness',
                description: score.persuasiveness.feedback,
                label: 'Delivery',
                className: 'span-2',
                headerRight: <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{score.persuasiveness.score}/10</div>
              },
              {
                color: 'rgba(16, 185, 129, 0.1)',
                title: 'Core Strengths',
                description: (
                  <ul style={{ paddingLeft: '20px', margin: 0 }}>
                    {score.strengths.map((s, i) => <li key={i} style={{ marginBottom: '8px' }}>{s}</li>)}
                  </ul>
                ),
                label: 'Highlights',
                className: 'span-3',
                style: { borderColor: 'rgba(16, 185, 129, 0.3)' }
              },
              {
                color: 'rgba(239, 68, 68, 0.1)',
                title: 'Areas to Improve',
                description: (
                  <ul style={{ paddingLeft: '20px', margin: 0 }}>
                    {score.improvements.map((s, i) => <li key={i} style={{ marginBottom: '8px' }}>{s}</li>)}
                  </ul>
                ),
                label: 'Next Steps',
                className: 'span-3',
                style: { borderColor: 'rgba(239, 68, 68, 0.3)' }
              }
            ]}
            textAutoHide={false}
            enableStars={true}
            enableSpotlight={true}
            enableBorderGlow={true}
            enableTilt={true}
            enableMagnetism={true}
            clickEffect={true}
            spotlightRadius={400}
            particleCount={15}
            glowColor="132, 0, 255"
          />
        </div>

        {/* Transcript */}
        <div className="results-transcript animate-fade-in-up" style={{ animationDelay: '800ms' }}>
          <button
            className="btn btn-secondary"
            onClick={() => setShowTranscript(!showTranscript)}
            id="toggle-transcript-btn"
          >
            {showTranscript ? '▼ Hide Transcript' : '▶ View Debate Transcript'}
          </button>

          {showTranscript && (
            <div className="results-transcript__messages">
              {transcript.map((msg, i) => (
                <MessageBubble key={i} message={msg} animDelay={i * 30} />
              ))}
            </div>
          )}
        </div>

        {/* Debate Again / Navigation */}
        <div className="results-actions animate-fade-in-up" style={{ animationDelay: '1000ms', display: 'flex', justifyContent: 'center', padding: '20px 0 40px' }}>
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
