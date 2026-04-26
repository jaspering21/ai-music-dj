import { useState, useEffect } from 'react'
import useContextStore from '../stores/contextStore'

const WEATHER_ICONS = {
  clear: '☀️',
  clouds: '☁️',
  rain: '🌧️',
  thunderstorm: '⛈️',
  snow: '❄️',
  mist: '🌫️',
  fog: '🌫️',
  drizzle: '🌦️'
}

const MOOD_EMOJIS = {
  happy: '😊',
  neutral: '😐',
  melancholy: '😔',
  peaceful: '😌',
  focus: '🎯',
  relax: '😎',
  calm: '🧘',
  dreamy: '💭',
  intense: '🔥',
  casual: '🙂'
}

function WeatherWidget() {
  const { weather, datetime, currentMood, currentEnergy, musicRecommendation } = useContextStore()
  const [isExpanded, setIsExpanded] = useState(false)

  if (!weather && !datetime) {
    return null
  }

  const weatherIcon = weather ? WEATHER_ICONS[weather.condition] || '🌤️' : '🌤️'
  const moodEmoji = MOOD_EMOJIS[currentMood] || '🎵'

  return (
    <div className={`weather-widget ${isExpanded ? 'expanded' : ''}`}>
      <div className="weather-header" onClick={() => setIsExpanded(!isExpanded)}>
        <div className="weather-main">
          <span className="weather-icon">{weatherIcon}</span>
          {weather && <span className="weather-temp">{weather.temp}°C</span>}
          {weather && <span className="weather-city">{weather.city}</span>}
        </div>
        <div className="mood-indicator">
          <span className="mood-emoji">{moodEmoji}</span>
          <span className="energy-badge energy-{currentEnergy}">{currentEnergy}</span>
        </div>
      </div>

      {isExpanded && (
        <div className="weather-details">
          {weather && (
            <div className="detail-section">
              <div className="detail-row">
                <span>天气</span>
                <span>{weather.conditionDesc}</span>
              </div>
              <div className="detail-row">
                <span>体感</span>
                <span>{weather.feelsLike}°C</span>
              </div>
              <div className="detail-row">
                <span>湿度</span>
                <span>{weather.humidity}%</span>
              </div>
            </div>
          )}

          {datetime && (
            <div className="detail-section">
              <div className="detail-row">
                <span>时间</span>
                <span>{datetime.dayLabel} {datetime.timePeriod}</span>
              </div>
              <div className="detail-row">
                <span>季节</span>
                <span>{datetime.season}</span>
              </div>
              {datetime.holiday && (
                <div className="detail-row highlight">
                  <span>节日</span>
                  <span>{datetime.holiday}</span>
                </div>
              )}
            </div>
          )}

          <div className="recommendation-preview">
            <span className="label">推荐</span>
            <p>{musicRecommendation || '根据当前环境加载中...'}</p>
          </div>
        </div>
      )}

      <style>{`
        .weather-widget {
          background: linear-gradient(135deg, #16213e 0%, #1a1a2e 100%);
          border-radius: 12px;
          padding: 12px 16px;
          color: #fff;
          font-size: 14px;
          cursor: pointer;
          transition: all 0.3s ease;
          border: 1px solid rgba(233, 69, 96, 0.2);
        }

        .weather-widget:hover {
          border-color: rgba(233, 69, 96, 0.5);
          transform: translateY(-2px);
        }

        .weather-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .weather-main {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .weather-icon {
          font-size: 24px;
        }

        .weather-temp {
          font-size: 20px;
          font-weight: 600;
        }

        .weather-city {
          color: rgba(255, 255, 255, 0.7);
          font-size: 12px;
        }

        .mood-indicator {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .mood-emoji {
          font-size: 20px;
        }

        .energy-badge {
          padding: 2px 8px;
          border-radius: 10px;
          font-size: 11px;
          text-transform: capitalize;
        }

        .energy-high {
          background: rgba(76, 175, 80, 0.3);
          color: #4CAF50;
        }

        .energy-moderate {
          background: rgba(255, 193, 7, 0.3);
          color: #FFC107;
        }

        .energy-low {
          background: rgba(33, 150, 243, 0.3);
          color: #2196F3;
        }

        .energy-moderate-high {
          background: rgba(255, 152, 0, 0.3);
          color: #FF9800;
        }

        .weather-details {
          margin-top: 12px;
          padding-top: 12px;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
        }

        .detail-section {
          margin-bottom: 10px;
        }

        .detail-row {
          display: flex;
          justify-content: space-between;
          padding: 4px 0;
          font-size: 13px;
        }

        .detail-row span:first-child {
          color: rgba(255, 255, 255, 0.6);
        }

        .detail-row.highlight span:last-child {
          color: #e94560;
          font-weight: 500;
        }

        .recommendation-preview {
          margin-top: 10px;
          padding: 8px;
          background: rgba(233, 69, 96, 0.1);
          border-radius: 8px;
        }

        .recommendation-preview .label {
          font-size: 11px;
          color: #e94560;
          text-transform: uppercase;
        }

        .recommendation-preview p {
          margin: 4px 0 0;
          font-size: 13px;
          line-height: 1.4;
        }
      `}</style>
    </div>
  )
}

export default WeatherWidget
