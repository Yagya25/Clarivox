import './MessageBubble.css'

export default function MessageBubble({ message, animDelay = 0 }) {
  const isAI = message.role === 'ai'

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
