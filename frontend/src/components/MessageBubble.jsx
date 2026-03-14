import { useState, useEffect } from 'react'
import './MessageBubble.css'

export default function MessageBubble({ message, animDelay = 0 }) {
  const isAI = message.role === 'ai'
  const [isPlaying, setIsPlaying] = useState(false)
  const [isPaused, setIsPaused] = useState(false)

  useEffect(() => {
    return () => {
      if (isPlaying) {
        window.speechSynthesis.cancel()
      }
    }
  }, [isPlaying])

  const toggleSpeech = () => {
    if (!('speechSynthesis' in window)) {
      alert("Text-to-Speech is not supported in this browser.")
      return
    }

    if (isPlaying) {
      if (isPaused) {
        window.speechSynthesis.resume()
        setIsPaused(false)
      } else {
        window.speechSynthesis.pause()
        setIsPaused(true)
      }
    } else {
      window.speechSynthesis.cancel() // clear any existing speech
      const utterance = new SpeechSynthesisUtterance(message.content)
      utterance.onend = () => {
        setIsPlaying(false)
        setIsPaused(false)
      }
      utterance.onerror = () => {
        setIsPlaying(false)
        setIsPaused(false)
      }
      window.speechSynthesis.speak(utterance)
      setIsPlaying(true)
      setIsPaused(false)
    }
  }

  const stopSpeech = () => {
    window.speechSynthesis.cancel()
    setIsPlaying(false)
    setIsPaused(false)
  }

  return (
    <div
      className={`message-bubble ${isAI ? 'message-bubble--ai' : 'message-bubble--user'}`}
      style={{ animationDelay: `${animDelay}ms` }}
    >
      <div className="message-bubble__avatar">
        {isAI ? '🤖' : '🧑'}
      </div>
      <div className="message-bubble__content">
        <div className="message-bubble__header">
          <span className="message-bubble__name">{isAI ? 'AI Opponent' : 'You'}</span>
          {isAI && (
            <div className="message-bubble__tts-controls">
              <button 
                className="tts-btn" 
                onClick={toggleSpeech} 
                title={isPlaying ? (isPaused ? "Resume" : "Pause") : "Read out loud"}
              >
                {isPlaying ? (isPaused ? '▶️' : '⏸️') : '🔊'}
              </button>
              {isPlaying && (
                <button className="tts-btn" onClick={stopSpeech} title="Stop">
                  ⏹️
                </button>
              )}
            </div>
          )}
        </div>
        <div className="message-bubble__text">{message.content}</div>

        {message.weaknesses && message.weaknesses.length > 0 && (
          <div className="message-bubble__weaknesses">
            <div className="message-bubble__weaknesses-title">⚠️ Weaknesses Identified</div>
            {message.weaknesses.map((w, i) => (
              <div key={i} className="chip chip-warning message-bubble__weakness-chip">
                {w}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
