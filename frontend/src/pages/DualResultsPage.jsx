import { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import Confetti from 'react-confetti'
import { useWindowSize } from 'react-use'
import './DualResultsPage.css'
import DotGrid from '../components/DotGrid'
import ShinyText from '../components/ShinyText'

export default function DualResultsPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const { width, height } = useWindowSize()
  const [winnerRevealed, setWinnerRevealed] = useState(false)
  
  // Results object expected from backend:
  // {
  //   user1_review: { score: 85, strengths: [...], weaknesses: [...] },
  //   user2_review: { score: 90, strengths: [...], weaknesses: [...] },
  //   comparison: [ { dimension: 'Logic', user1: '...', user2: '...' }, ... ],
  //   winner: "Player 2",
  //   overall_feedback: "..."
  // }
  const { results, topic, transcript, user1Name, user2Name } = location.state || {}

  if (!results) {
    return (
      <div className="dual-results-page" style={{ padding: '80px', textAlign: 'center' }}>
        <h2>No results found</h2>
        <button className="btn btn-primary" onClick={() => navigate('/')}>Return Home</button>
      </div>
    )
  }

  const { user1_review, user2_review, comparison, winner, overall_feedback } = results
  const actualWinnerName = winner === 'user1' ? user1Name : (winner === 'user2' ? user2Name : "It's a Tie!")

  const handleReveal = () => {
    setWinnerRevealed(true)
    
    // Announce the winner!
    if ('speechSynthesis' in window) {
      // Cancel any ongoing speech
      window.speechSynthesis.cancel()
      
      const utterance = new SpeechSynthesisUtterance(
        `The results are in! ${overall_feedback} And the winner is... ${actualWinnerName}! Congratulations!`
      )
      
      // Try to find a good energetic English voice
      const voices = window.speechSynthesis.getVoices()
      const engVoice = voices.find(v => v.lang.startsWith('en') && (v.name.includes('Google') || v.name.includes('Natural'))) || voices[0]
      if (engVoice) utterance.voice = engVoice
      
      utterance.rate = 1.1 // Slightly faster/more energetic
      utterance.pitch = 1.2
      
      window.speechSynthesis.speak(utterance)
    }
  }

  // Cleanup speech on unmount
  useEffect(() => {
    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel()
      }
    }
  }, [])

  return (
    <div className="dual-results-page page-enter">
      {winnerRevealed && <Confetti width={width} height={height} recycle={false} numberOfPieces={800} gravity={0.15} />}
      
      <div className="dual-results-bg">
        <DotGrid
          dotSize={4} gap={20} baseColor="#1a1a2e" activeColor="#6366f1"
          proximity={100} shockRadius={150} shockStrength={3}
        />
      </div>

      <div className="dual-results-content">
        <header className="dual-results-header">
          <ShinyText
            text="Debate Analysis Results"
            speed={3} color="#a5b4fc" shineColor="#ffffff" direction="right"
          />
          <h1 className="dual-results-title">Face-to-Face Faceoff</h1>
          <p className="dual-results-topic">Topic: {topic}</p>
        </header>

        {overall_feedback && (
          <div className="dual-results-overall glass-card animate-fade-in-up">
            <h3>Overall Verdict</h3>
            
            {!winnerRevealed ? (
              <div className="reveal-container">
                <p className="reveal-mystery">Who won this epic showdown?</p>
                <button className="btn btn-primary btn-lg reveal-btn" onClick={handleReveal}>
                  🎉 Reveal Winner
                </button>
              </div>
            ) : (
              <div className="verdict-revealed animate-scale-in">
                <p className="verdict-text">{overall_feedback}</p>
                {winner && (
                  <div className="dual-results-winner">
                    Winner: <strong>{actualWinnerName}</strong> 🏆
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        <div className={`dual-results-columns animate-fade-in-up ${!winnerRevealed ? 'blur-results' : ''}`} style={{ animationDelay: '200ms' }}>
          {/* User 1 Review */}
          <div className="dual-results-col dual-results-col--u1 glass-card">
            <h2>{user1Name} <span className="score-badge">{user1_review?.score || 0}/100</span></h2>
            
            <div className="review-section">
              <h4 className="text-success">Strengths</h4>
              <ul>
                {user1_review?.strengths?.map((s, i) => <li key={i}>{s}</li>) || <li>No strengths listed.</li>}
              </ul>
            </div>

            <div className="review-section">
              <h4 className="text-warning">Weaknesses</h4>
              <ul>
                {user1_review?.weaknesses?.map((w, i) => <li key={i}>{w}</li>) || <li>No weaknesses listed.</li>}
              </ul>
            </div>
          </div>

          {/* User 2 Review */}
          <div className="dual-results-col dual-results-col--u2 glass-card">
            <h2>{user2Name} <span className="score-badge">{user2_review?.score || 0}/100</span></h2>
            
            <div className="review-section">
              <h4 className="text-success">Strengths</h4>
              <ul>
                {user2_review?.strengths?.map((s, i) => <li key={i}>{s}</li>) || <li>No strengths listed.</li>}
              </ul>
            </div>

            <div className="review-section">
              <h4 className="text-warning">Weaknesses</h4>
              <ul>
                {user2_review?.weaknesses?.map((w, i) => <li key={i}>{w}</li>) || <li>No weaknesses listed.</li>}
              </ul>
            </div>
          </div>
        </div>

        {/* Comparison Table */}
        {comparison && comparison.length > 0 && (
          <div className={`dual-results-table-container glass-card animate-fade-in-up ${!winnerRevealed ? 'blur-results' : ''}`} style={{ animationDelay: '400ms' }}>
            <h3 className="section-title">Head-to-Head Comparison</h3>
            <div className="table-wrapper">
              <table className="dual-results-table">
                <thead>
                  <tr>
                    <th>Dimension</th>
                    <th>{user1Name}</th>
                    <th>{user2Name}</th>
                  </tr>
                </thead>
                <tbody>
                  {comparison.map((row, idx) => (
                    <tr key={idx}>
                      <td className="dimension-col">{row.dimension}</td>
                      <td>{row.user1}</td>
                      <td>{row.user2}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="dual-results-actions animate-fade-in-up" style={{ animationDelay: '600ms' }}>
          <button className="btn btn-primary btn-lg" onClick={() => navigate('/')}>
            Back to Home
          </button>
        </div>
      </div>
    </div>
  )
}
