import './TopicCard.css'

export default function TopicCard({ topic, isSelected, onClick }) {
  return (
    <button
      className={`topic-card glass-card ${isSelected ? 'topic-card--selected' : ''}`}
      onClick={() => onClick(topic)}
      id={`topic-${topic.replace(/\s+/g, '-').toLowerCase().slice(0, 30)}`}
    >
      <span className="topic-card__icon">💬</span>
      <span className="topic-card__text">{topic}</span>
      {isSelected && <span className="topic-card__check">✓</span>}
    </button>
  )
}
