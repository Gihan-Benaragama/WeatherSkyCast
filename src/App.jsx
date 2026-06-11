import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Toaster, toast } from 'react-hot-toast';
import { useWeatherForDate } from './hooks/useWeather';
import { getScene, getTomorrowForecast } from './utils/weatherHelpers';
import WeatherBackground from './components/WeatherBackground';
import LocationSearch from './components/LocationSearch';
import LocationPermission from './components/LocationPermission';
import AlertBanner from './components/AlertBanner';
import HourlyForecast from './components/HourlyForecast';
import SavedLocations from './components/SavedLocations';
import MultiCityCompare from './components/MultiCityCompare';
import DatePicker from './components/DatePicker';
import './App.css';

function weatherIcon(scene) {
  return { sunny: '☀️', cloudy: '⛅', rain: '🌧️', storm: '⛈️' }[scene] || '⛅';
}

function Stat({ icon, label, value }) {
  return (
    <div className="whc-stat">
      <div className="whc-stat-label"><span>{icon}</span>{label}</div>
      <div className="whc-stat-value">{value}</div>
    </div>
  );
}

function SourceBadge({ source, dateType }) {
  const config = {
    live: { label: '🔴 Live Data', color: '#22c55e', bg: 'rgba(34,197,94,0.15)' },
    forecast: { label: '📡 Forecast Data', color: '#60a5fa', bg: 'rgba(96,165,250,0.15)' },
    historical: { label: '📚 Climate Estimate', color: '#a78bfa', bg: 'rgba(167,139,250,0.15)' },
  };
  const c = config[source] || config.live;
  return (
    <span style={{
      fontSize: 10, fontWeight: 700, padding: '3px 10px',
      borderRadius: 20, background: c.bg,
      border: `1px solid ${c.color}40`, color: c.color,
      letterSpacing: '0.3px',
    }}>
      {c.label}
    </span>
  );
}

export default function App() {
  const todayStr = new Date().toISOString().split('T')[0];

  const [locationTarget, setLocationTarget] = useState(null);
  const [displayCity, setDisplayCity] = useState('');
  const [showPermission, setShowPermission] = useState(true);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsError, setGpsError] = useState('');
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [time, setTime] = useState('');
  const [date, setDate] = useState('');
  const [showCompare, setShowCompare] = useState(false);
  const [unit, setUnit] = useState('C');

  const { weatherData, hourly, alerts, loading, error, cityName, dateType } =
    useWeatherForDate(locationTarget, selectedDate);

  useEffect(() => { if (cityName) setDisplayCity(cityName); }, [cityName]);

  // Alert toasts
  useEffect(() => {
    if (alerts?.length > 0) {
      alerts.forEach(a => toast(a.msg, {
        icon: a.type === 'storm' ? '⛈️' : a.type === 'rain' ? '🌧️' : a.type === 'heat' ? '🌡️' : '💨',
        style: {
          background: 'rgba(8,14,24,0.97)', color: '#fff',
          border: `1px solid ${a.color}55`, borderRadius: 12, fontSize: 13,
        }, duration: 5000,
      }));
    }
  }, [alerts]);

  // Live clock
  useEffect(() => {
    const update = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString('en-LK', {
        hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'Asia/Colombo',
      }));
      setDate(now.toLocaleDateString('en-LK', {
        weekday: 'long', month: 'long', day: 'numeric', timeZone: 'Asia/Colombo',
      }));
    };
    update();
    const t = setInterval(update, 30000);
    return () => clearInterval(t);
  }, []);

  function toDisplayTemp(c) {
    if (typeof c !== 'number') return '--';
    return unit === 'F' ? Math.round(c * 9 / 5 + 32) : Math.round(c);
  }

  // Get scene from current weather data
  const currentScene = weatherData ? getScene(weatherData.condId) : 'cloudy';

  // Selected date label
  function getDateLabel() {
    if (!selectedDate) return '';
    const diff = Math.round(
      (new Date(selectedDate) - new Date(todayStr)) / (1000 * 60 * 60 * 24)
    );
    if (diff === 0) return 'Today';
    if (diff === 1) return 'Tomorrow';
    if (diff === -1) return 'Yesterday';
    if (diff > 1) return `${diff} days from now`;
    return `${Math.abs(diff)} days ago`;
  }

  // Build 7-day from forecast if available
  const buildForecastDays = () => {
    if (!weatherData || weatherData.source === 'historical') return [];
    return [];
  };

  function handleAllowGPS() {
    if (!navigator.geolocation) {
      setGpsError('GPS not available. Please search manually.'); return;
    }
    setGpsLoading(true); setGpsError('');
    navigator.geolocation.getCurrentPosition(
      pos => {
        setLocationTarget({ lat: pos.coords.latitude, lon: pos.coords.longitude });
        setDisplayCity('Current Location');
        setShowPermission(false); setGpsLoading(false);
      },
      err => {
        setGpsError(err.code === 1
          ? 'Permission denied. Please search manually.'
          : 'Could not get GPS location.');
        setGpsLoading(false);
      },
      { timeout: 10000, maximumAge: 60000 }
    );
  }

  function handleSkipGPS() {
    setLocationTarget('Colombo');
    setDisplayCity('Colombo, LK');
    setShowPermission(false);
  }

  function handleLocationSelect(coords, label) {
    setLocationTarget(coords.lat === 0
      ? label.replace(', LK', '').replace(', Sri Lanka', '') : coords);
    setDisplayCity(label);
    toast.success(`Switched to ${label}`, {
      style: {
        background: 'rgba(8,14,24,0.97)', color: '#fff',
        border: '1px solid rgba(255,255,255,0.12)', borderRadius: 12, fontSize: 13,
      }
    });
  }

  function handleDateSelect(dateStr) {
    setSelectedDate(dateStr);
    const label = getDateLabel();
    const d = new Date(dateStr);
    toast(`Loading weather for ${d.toLocaleDateString('en-LK', { month: 'short', day: 'numeric', year: 'numeric' })}`, {
      icon: '📅',
      style: {
        background: 'rgba(8,14,24,0.97)', color: '#fff',
        border: '1px solid rgba(255,255,255,0.12)', borderRadius: 12, fontSize: 13,
      }
    });
  }

  if (showPermission) return (
    <LocationPermission
      onAllow={handleAllowGPS} onSkip={handleSkipGPS}
      loading={gpsLoading} error={gpsError}
    />
  );

  if (loading) return (
    <div className="loading-screen">
      <div className="spinner" />
      <p>Loading weather data...</p>
      <p style={{ fontSize: 13, opacity: 0.5 }}>
        {displayCity} · {selectedDate}
      </p>
    </div>
  );

  // Future limit screen
  if (error === 'FUTURE_LIMIT') return (
    <div className="app">
      <WeatherBackground scene="cloudy" />
      <div className="ui-layer">
        <nav className="navbar">
          <div className="nav-logo"><span>⛅</span> SkyCast</div>
          <div className="nav-right" style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <DatePicker selectedDate={selectedDate} onSelect={handleDateSelect} />
          </div>
        </nav>
        <div style={{
          flex: 1, display: 'flex', alignItems: 'center',
          justifyContent: 'center', flexDirection: 'column',
          gap: 16, color: '#fff', textAlign: 'center', padding: 24,
        }}>
          <div style={{ fontSize: 64 }}>🔮</div>
          <div style={{ fontSize: 22, fontWeight: 700 }}>Beyond Forecast Range</div>
          <div style={{ fontSize: 14, opacity: 0.55, maxWidth: 360, lineHeight: 1.7 }}>
            Free weather API supports forecasts up to 5 days ahead.
            Please select a date within the next 5 days or in the past.
          </div>
          <button
            onClick={() => handleDateSelect(todayStr)}
            style={{
              padding: '11px 28px', background: '#3b82f6',
              border: 'none', borderRadius: 50, color: '#fff',
              fontSize: 13, fontWeight: 700, cursor: 'pointer',
            }}
          >Go to Today</button>
        </div>
      </div>
    </div>
  );

  if (error) return (
    <div className="error-screen">
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>⚠️</div>
        <p style={{ fontSize: 18, marginBottom: 8 }}>Could not load weather</p>
        <p style={{ fontSize: 13, opacity: 0.7 }}>{error}</p>
        <button onClick={() => setShowPermission(true)} style={{
          marginTop: 20, padding: '10px 24px', background: '#3b82f6',
          border: 'none', borderRadius: 50, color: '#fff', fontSize: 13, cursor: 'pointer',
        }}>Try Again</button>
      </div>
    </div>
  );

  return (
    <div className="app">
      <Toaster position="top-right" />
      <WeatherBackground scene={currentScene} />
      <MultiCityCompare open={showCompare} onClose={() => setShowCompare(false)} />

      <div className="ui-layer">

        {/* NAVBAR */}
        <nav className="navbar">
          <div className="nav-logo"><span>⛅</span> SkyCast</div>

          <div className="nav-links">
            {['Home', 'Forecast', 'Maps', 'Alerts', 'About'].map(l => (
              <a key={l} className={`nav-link ${l === 'Home' ? 'active' : ''}`}>{l}</a>
            ))}
          </div>

          <div className="nav-right">
            {/* °C / °F */}
            <div onClick={() => setUnit(u => u === 'C' ? 'F' : 'C')} style={{
              display: 'flex', alignItems: 'center',
              background: 'rgba(255,255,255,0.08)',
              border: '1px solid rgba(255,255,255,0.14)',
              borderRadius: 50, overflow: 'hidden',
              fontSize: 12, fontWeight: 700, cursor: 'pointer',
            }}>
              {['C', 'F'].map(u => (
                <div key={u} style={{
                  padding: '5px 12px',
                  background: unit === u ? 'rgba(59,130,246,0.35)' : 'transparent',
                  color: unit === u ? '#fff' : 'rgba(255,255,255,0.45)',
                  transition: 'all 0.2s',
                }}>°{u}</div>
              ))}
            </div>

            <div onClick={() => setShowCompare(true)} className="nav-link" style={{ cursor: 'pointer' }}>
              🏙️ Compare
            </div>

            <SavedLocations
              currentCity={displayCity}
              currentCoords={locationTarget}
              onSelect={handleLocationSelect}
            />

            <LocationSearch
              onSelect={handleLocationSelect}
              currentCity={displayCity}
            />

            <div
              className="nav-location-btn"
              onClick={handleAllowGPS}
              title="Use GPS"
            >
              {gpsLoading ? '⏳' : '📍'}
            </div>
          </div>
        </nav>

        {/* ALERTS */}
        {alerts?.length > 0 && <AlertBanner alerts={alerts} />}

        {/* HERO */}
        <div className="hero">
          <div className="hero-left">
            <div className="hero-tag">🌏 {displayCity || 'Weather App'}</div>
            <h1 className="hero-title">
              Accurate Weather.<br />
              <span>Anytime, Anywhere.</span>
            </h1>
            <p className="hero-subtitle">
              Check past, present and future weather
              with cinematic animated skies.
            </p>

            {/* DATE PICKER — prominent placement */}
            <div style={{ marginBottom: 20 }}>
              <div style={{
                fontSize: 10, fontWeight: 700, textTransform: 'uppercase',
                letterSpacing: '1.3px', opacity: 0.45,
                color: '#fff', marginBottom: 8,
              }}>
                📅 Select Any Date
              </div>
              <DatePicker
                selectedDate={selectedDate}
                onSelect={handleDateSelect}
              />
              {selectedDate && (
                <div style={{
                  marginTop: 8, fontSize: 12,
                  color: 'rgba(255,255,255,0.45)',
                }}>
                  Showing: <span style={{
                    color: dateType === 'today' ? '#60a5fa'
                      : dateType === 'future' ? '#34d399' : '#a78bfa',
                    fontWeight: 600,
                  }}>
                    {getDateLabel()}
                  </span>
                  {' '}·{' '}
                  {weatherData && <SourceBadge source={weatherData.source} />}
                </div>
              )}
            </div>

            <div className="hero-actions">
              <button className="btn-primary">📊 View Details</button>
              <button className="btn-secondary" onClick={() => setShowCompare(true)}>
                🏙️ Compare Cities
              </button>
            </div>
          </div>

          {/* WEATHER CARD */}
          <div className="hero-right">
            <AnimatePresence mode="wait">
              <motion.div
                key={selectedDate + unit}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="weather-hero-card"
              >
                <div className="whc-top">
                  <div>
                    <div className="whc-location">{displayCity}</div>
                    <div className="whc-date">
                      {new Date(selectedDate).toLocaleDateString('en-LK', {
                        weekday: 'long', month: 'long', day: 'numeric',
                      })}
                    </div>
                    <div style={{ marginTop: 4 }}>
                      {weatherData && <SourceBadge source={weatherData.source} />}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div className="whc-condition-badge">
                      {weatherData?.desc?.toUpperCase() || '---'}
                    </div>
                    <div style={{
                      fontSize: 28, marginTop: 8,
                      filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.4))',
                    }}>
                      {weatherIcon(currentScene)}
                    </div>
                  </div>
                </div>

                <div className="whc-main">
                  <div>
                    <div className="whc-temp">
                      {toDisplayTemp(weatherData?.temp)}
                      <sup>°{unit}</sup>
                    </div>
                    <div style={{
                      display: 'flex', gap: 8, marginTop: 4,
                      fontSize: 12, opacity: 0.55,
                    }}>
                      <span>↓{toDisplayTemp(weatherData?.tempMin)}°</span>
                      <span>↑{toDisplayTemp(weatherData?.tempMax)}°</span>
                    </div>
                  </div>
                  <div className="whc-desc-block" style={{ marginLeft: 16 }}>
                    <div className="whc-desc" style={{ textTransform: 'capitalize' }}>
                      {weatherData?.desc || '--'}
                    </div>
                    <div className="whc-feels">
                      Feels like {toDisplayTemp(weatherData?.feelsLike)}°{unit}
                    </div>
                  </div>
                </div>

                <div className="whc-divider" />

                <div className="whc-stats">
                  <Stat icon="💧" label="Humidity" value={`${weatherData?.humidity ?? '--'}%`} />
                  <Stat icon="💨" label="Wind" value={`${weatherData?.wind ?? '--'} km/h`} />
                  <Stat icon="☔" label="Rain" value={`${weatherData?.rain ?? '--'}%`} />
                  <Stat icon="🌡️" label="Pressure" value={`${weatherData?.pressure ?? '--'} hPa`} />
                  {weatherData?.visibility !== '--' && weatherData?.visibility && (
                    <Stat icon="👁️" label="Visibility" value={`${weatherData.visibility} km`} />
                  )}
                  {weatherData?.uv !== '--' && (
                    <Stat icon="☀️" label="UV Index" value={`${weatherData?.uv} ${weatherData?.uv > 5 ? 'High' : 'Low'}`} />
                  )}
                </div>

                {/* Historical notice */}
                {weatherData?.source === 'historical' && (
                  <div style={{
                    marginTop: 14, padding: '8px 12px',
                    background: 'rgba(167,139,250,0.1)',
                    border: '1px solid rgba(167,139,250,0.2)',
                    borderRadius: 10, fontSize: 11,
                    color: 'rgba(255,255,255,0.5)', lineHeight: 1.5,
                  }}>
                    📚 Historical data based on Sri Lanka climate patterns.
                    Free API plan does not support exact historical records.
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* HOURLY — only for today and near future */}
        {hourly?.length > 0 && (
          <div style={{ marginTop: 64 }}>
            <HourlyForecast hourly={hourly} />
          </div>
        )}

        {/* BOTTOM SPACER */}
        <div style={{ height: 24 }} />

      </div>
    </div>
  );
}