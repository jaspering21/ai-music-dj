import { useState, useEffect } from 'react'
import useContextStore from '../stores/contextStore'

function AIDJOverlay({ message, duration = 3000, onClose }) {
  const [visible, setVisible] = useState(false)
  const [text, setText] = useState('')
  const { weather, datetime, currentMood, currentEnergy } = useContextStore()

  useEffect(() => {
    if (message) {
      setText(message)
      setVisible(true)

      const timer = setTimeout(() => {
        setVisible(false)
        if (onClose) onClose()
      }, duration)

      return () => clearTimeout(timer)
    }
  }, [message, duration, onClose])

  if (!visible) return null

  return (
    <div className="aidj-overlay">
      <div className="aidj-content">
        <div className="aidj-avatar">🎧</div>
        <div className="aidj-text">
          <p>{text}</p>
          <div className="aidj-context">
            {weather && (
              <span className="context-tag">
                {weather.conditionDesc} · {weather.temp}°C
              </span>
            )}
            {datetime && (
              <span className="context-tag">
                {datetime.timePeriod}
              </span>
            )}
            <span className="context-tag mood-{currentMood}">
              {currentMood}
            </span>
          </div>
        </div>
      </div>

      <style>{`
        .aidj-overlay {
          position: fixed;
          bottom: 100px;
          left: 50%;
          transform: translateX(-50%);
          z-index: 1000;
          animation: slideUp 0.3s ease;
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateX(-50%) translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
          }
        }

        .aidj-content {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          padding: 16px 20px;
          background: linear-gradient(135deg, #16213e 0%, #1a1a2e 100%);
          border: 1px solid rgba(233, 69, 96, 0.3);
          border-radius: 16px;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
          max-width: 400px;
        }

        .aidj-avatar {
          font-size: 32px;
          line-height: 1;
        }

        .aidj-text p {
          margin: 0 0 8px;
          font-size: 14px;
          line-height: 1.5;
          color: #fff;
        }

        .aidj-context {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
        }

        .context-tag {
          padding: 2px 8px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 10px;
          font-size: 11px;
          color: rgba(255, 255, 255, 0.7);
        }

        .context-tag.mood-happy { color: #4CAF50; }
        .context-tag.mood-calm { color: #66BB6A; }
        .context-tag.mood-relax { color: #42A5F5; }
        .context-tag.mood-focus { color: #FF9800; }
        .context-tag.mood-melancholy { color: #5C6BC0; }
      `}</style>
    </div>
  )
}

export default AIDJOverlay
