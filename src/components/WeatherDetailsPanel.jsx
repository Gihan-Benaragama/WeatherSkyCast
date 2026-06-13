import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar
} from 'recharts';
import axios from 'axios';

const API_KEY = import.meta.env.VITE_WEATHER_API_KEY;
const BASE = 'https://api.openweathermap.org/data/2.5';

function calculateDewPoint(temp, humidity) {
  if (temp == null || humidity == null) return '--';
  const a = 17.27;
  const b = 237.7;
  const alpha = ((a * temp) / (b + temp)) + Math.log(humidity / 100);
  const dewPoint = (b * alpha) / (a - alpha);
  return Math.round(dewPoint);
}

function getWindDirection(deg) {
  if (deg == null) return '--';
  const dirs = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  return dirs[Math.round(deg / 22.5) % 16];
}

function getMoonPhase(dateStr) {
  const date = new Date(dateStr);
  const knownNewMoon = new Date('2000-01-06');
  const diffTime = Math.abs(date - knownNewMoon);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  const cycle = 29.53059;
  const age = diffDays % cycle;
  if (age < 1.84578) return { label: 'New Moon', emoji: '🌑' };
  if (age < 5.53737) return { label: 'Waxing Crescent', emoji: '🌒' };
  if (age < 9.22896) return { label: 'First Quarter', emoji: '🌓' };
  if (age < 12.92055) return { label: 'Waxing Gibbous', emoji: '🌔' };
  if (age < 16.61214) return { label: 'Full Moon', emoji: '🌕' };
  if (age < 20.30373) return { label: 'Waning Gibbous', emoji: '🌖' };
  if (age < 23.99532) return { label: 'Last Quarter', emoji: '🌗' };
  if (age < 27.68691) return { label: 'Waning Crescent', emoji: '🌘' };
  return { label: 'New Moon', emoji: '🌑' };
}

function getMonsoonStatus(dateStr) {
  const month = new Date(dateStr).getMonth();
  if (month >= 4 && month <= 8) {
    return { status: 'Active', monsoon: 'Southwest Monsoon', desc: 'Heavy rain & rough seas on West/South coasts.' };
  } else if (month === 11 || month <= 1) {
    return { status: 'Active', monsoon: 'Northeast Monsoon', desc: 'Showers on East/North coasts; cooler weather.' };
  } else if (month >= 2 && month <= 3) {
    return { status: 'Transitional', monsoon: 'First Intermonsoon', desc: 'Warm conditions with evening thunderstorms.' };
  } else {
    return { status: 'Transitional', monsoon: 'Second Intermonsoon', desc: 'Widespread evening thunder showers.' };
  }
}

function getSeaCondition(windSpeed, monsoonActive) {
  if (windSpeed > 35) return { label: 'Rough / Dangerous', color: '#ef4444', advice: 'Advisory Active. Fishermen stay ashore.' };
  if (windSpeed > 20 || monsoonActive) return { label: 'Moderate / Slight Swell', color: '#f97316', advice: 'Caution advised on active coastlines.' };
  return { label: 'Calm / Safe', color: '#22c55e', advice: 'Safe for sea bathing and swimming.' };
}

function getBestOutdoorTime(hourlyData, tempMax) {
  if (!hourlyData || hourlyData.length === 0) {
    return tempMax > 32 
      ? '6:30 AM - 8:30 AM or 5:30 PM - 7:00 PM'
      : '2:00 PM - 5:00 PM';
  }
  const filtered = hourlyData.filter(h => h.rain < 30 && h.temp < 30 && h.time !== 'NOW');
  if (filtered.length > 0) {
    return `${filtered[0].time} - ${filtered[Math.min(filtered.length - 1, 2)].time}`;
  }
  return '6:00 AM - 8:30 AM (Sunrise window)';
}

function toSLTime(unix) {
  if (!unix) return '--:--';
  return new Date(unix * 1000).toLocaleTimeString('en-LK', {
    hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'Asia/Colombo',
  });
}

function aqiLabel(aqi) {
  return ['', 'Good', 'Fair', 'Moderate', 'Poor', 'Very Poor'][aqi] || 'Moderate';
}

function aqiColor(aqi) {
  return ['', '#22c55e', '#84cc16', '#eab308', '#f97316', '#ef4444'][aqi] || '#eab308';
}

function aqiRecommendation(aqi) {
  if (aqi <= 2) return 'Air quality is great! Perfect for outdoor workouts and travel.';
  if (aqi === 3) return 'Acceptable air quality. Sensitive individuals should consider limiting heavy outdoor exertion.';
  return 'Poor air quality. Avoid prolonged outdoor exposure, consider wearing masks if sensitive.';
}

export default function WeatherDetailsPanel({ open, onClose, weatherData, hourly, selectedDate, unit = 'C' }) {
  const [airData, setAirData] = useState(null);
  const [airLoading, setAirLoading] = useState(false);
  const [activeChartTab, setActiveChartTab] = useState('temp'); // 'temp' or 'rain'

  useEffect(() => {
    if (!open || !weatherData?.coord) return;
    const { lat, lon } = weatherData.coord;
    
    setAirLoading(true);
    axios.get(`${BASE}/air_pollution?lat=${lat}&lon=${lon}&appid=${API_KEY}`)
      .then(res => {
        setAirData(res.data.list?.[0] || null);
      })
      .catch(err => {
        console.error('Error fetching air quality in panel:', err);
      })
      .finally(() => {
        setAirLoading(false);
      });
  }, [open, weatherData?.coord]);

  if (!open) return null;

  // Values & computations
  const temp = weatherData?.temp ?? 0;
  const tempMin = weatherData?.tempMin ?? temp - 3;
  const tempMax = weatherData?.tempMax ?? temp + 3;
  const tempAvg = Math.round((tempMin + tempMax) / 2);
  const feelsLike = weatherData?.feelsLike ?? temp;
  const humidity = weatherData?.humidity ?? 70;
  const pressure = weatherData?.pressure ?? 1010;
  const wind = weatherData?.wind ?? 15;
  const windDir = weatherData?.windDir ?? 0;
  const clouds = weatherData?.clouds ?? 50;
  const visibility = weatherData?.visibility ?? '10.0';

  const dewPoint = calculateDewPoint(temp, humidity);
  const compassDir = getWindDirection(windDir);
  const windGust = Math.round(wind * 1.25);
  
  // Sea level & Ground level estimate
  const seaLevelPress = pressure;
  const groundLevelPress = pressure - 3;

  // Sunrise / Sunset
  const sunriseStr = toSLTime(weatherData?.sunrise);
  const sunsetStr = toSLTime(weatherData?.sunset);
  
  // Daylight duration
  let daylightStr = '12h 15m';
  if (weatherData?.sunrise && weatherData?.sunset) {
    const diffSec = weatherData.sunset - weatherData.sunrise;
    const hrs = Math.floor(diffSec / 3600);
    const mins = Math.floor((diffSec % 3600) / 60);
    daylightStr = `${hrs}h ${mins}m`;
  }

  // Moon phase
  const moon = getMoonPhase(selectedDate);

  // Sri Lanka specifics
  const monsoon = getMonsoonStatus(selectedDate);
  const sea = getSeaCondition(wind, monsoon.status === 'Active');
  const bestTime = getBestOutdoorTime(hourly, tempMax);

  // AQI data fallback if API fails
  const aqi = airData?.main?.aqi ?? 2; // default to 2 (Fair)
  const aqiComp = airData?.components ?? { pm2_5: 12.5, pm10: 22.4, no2: 5.2, o3: 35.1 };

  // Prepare chart data safely
  const chartData = hourly && hourly.length > 0 
    ? hourly.map(h => ({
        time: h.time,
        temp: unit === 'F' ? Math.round(h.temp * 9 / 5 + 32) : h.temp,
        rain: h.rain
      }))
    : [];

  return (
    <AnimatePresence>
      {/* Backdrop Dimmer */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.4)',
          backdropFilter: 'blur(4px)',
          zIndex: 8000,
        }}
      />

      {/* Side Slide-in Panel */}
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 26, stiffness: 220 }}
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          bottom: 0,
          width: '100%',
          maxWidth: '480px',
          background: 'rgba(8, 14, 24, 0.82)',
          backdropFilter: 'blur(30px) saturate(180%)',
          borderLeft: '1px solid rgba(255, 255, 255, 0.08)',
          boxShadow: '-8px 0 32px rgba(0, 0, 0, 0.6)',
          zIndex: 8500,
          display: 'flex',
          flexDirection: 'column',
          color: '#fff',
        }}
      >
        {/* Header */}
        <div style={{
          padding: '24px 24px 16px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <div>
            <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.5, color: '#3b82f6', textTransform: 'uppercase' }}>
              📊 Detailed Weather
            </span>
            <h2 style={{ fontSize: 22, fontWeight: 800, margin: '4px 0 0', letterSpacing: '-0.5px' }}>
              {weatherData?.cityName || 'Colombo, Sri Lanka'}
            </h2>
            <p style={{ fontSize: 12, opacity: 0.5, margin: '2px 0 0' }}>
              {new Date(selectedDate).toLocaleDateString('en-LK', { weekday: 'long', month: 'long', day: 'numeric' })}
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              width: 36,
              height: 36,
              borderRadius: '50%',
              background: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              color: '#fff',
              fontSize: 20,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => { e.target.style.background = 'rgba(255, 255, 255, 0.12)'; }}
            onMouseLeave={(e) => { e.target.style.background = 'rgba(255, 255, 255, 0.06)'; }}
          >
            ×
          </button>
        </div>

        {/* Scrollable Container */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '20px 24px 32px',
          display: 'flex',
          flexDirection: 'column',
          gap: 24,
        }} className="fc-scrollbar">

          {/* TEMPERATURE RANGE & FEELS LIKE */}
          <div style={sectionStyle}>
            <div style={sectionTitleStyle}>🌡️ Temperature Range</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, textAlign: 'center', marginBottom: 16 }}>
              <div style={rangeCardStyle}>
                <div style={{ fontSize: 10, opacity: 0.5 }}>Min Temp</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: '#60a5fa' }}>{tempMin}°{unit}</div>
              </div>
              <div style={rangeCardStyle}>
                <div style={{ fontSize: 10, opacity: 0.5 }}>Average</div>
                <div style={{ fontSize: 18, fontWeight: 700 }}>{tempAvg}°{unit}</div>
              </div>
              <div style={rangeCardStyle}>
                <div style={{ fontSize: 10, opacity: 0.5 }}>Max Temp</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: '#f87171' }}>{tempMax}°{unit}</div>
              </div>
            </div>

            {/* Feels Like gauge */}
            <div style={{ background: 'rgba(255,255,255,0.03)', padding: 12, borderRadius: 12, border: '1px solid rgba(255,255,255,0.04)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 6 }}>
                <span style={{ opacity: 0.6 }}>Real-feel temperature:</span>
                <span style={{ fontWeight: 700, color: '#f59e0b' }}>{feelsLike}°{unit}</span>
              </div>
              <div style={{ height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.1)', position: 'relative' }}>
                <div style={{
                  position: 'absolute',
                  left: 0,
                  top: 0,
                  bottom: 0,
                  width: `${Math.max(10, Math.min(100, ((feelsLike - (unit === 'C' ? 10 : 50)) / (unit === 'C' ? 35 : 60)) * 100))}%`,
                  background: 'linear-gradient(90deg, #3b82f6, #f59e0b)',
                  borderRadius: 3,
                }} />
              </div>
            </div>
          </div>

          {/* HOURLY BREAKDOWN CHARTS */}
          {chartData.length > 0 && (
            <div style={sectionStyle}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <div style={sectionTitleStyle}>⏱️ Hourly Breakdown</div>
                <div style={{ display: 'flex', background: 'rgba(255,255,255,0.08)', borderRadius: 20, padding: 2 }}>
                  <button
                    onClick={() => setActiveChartTab('temp')}
                    style={chartTabStyle(activeChartTab === 'temp')}
                  >Temp</button>
                  <button
                    onClick={() => setActiveChartTab('rain')}
                    style={chartTabStyle(activeChartTab === 'rain')}
                  >Rain %</button>
                </div>
              </div>

              <div style={{ height: 160, width: '100%' }}>
                <ResponsiveContainer width="100%" height="100%">
                  {activeChartTab === 'temp' ? (
                    <AreaChart data={chartData} margin={{ top: 10, right: 5, left: -25, bottom: 0 }}>
                      <defs>
                        <linearGradient id="panelTempGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4}/>
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="time" stroke="rgba(255,255,255,0.4)" fontSize={9} tickLine={false} />
                      <YAxis stroke="rgba(255,255,255,0.4)" fontSize={9} tickLine={false} />
                      <Tooltip contentStyle={tooltipStyle} />
                      <Area type="monotone" dataKey="temp" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#panelTempGrad)" />
                    </AreaChart>
                  ) : (
                    <BarChart data={chartData} margin={{ top: 10, right: 5, left: -25, bottom: 0 }}>
                      <XAxis dataKey="time" stroke="rgba(255,255,255,0.4)" fontSize={9} tickLine={false} />
                      <YAxis stroke="rgba(255,255,255,0.4)" fontSize={9} tickLine={false} domain={[0, 100]} />
                      <Tooltip contentStyle={tooltipStyle} />
                      <Bar dataKey="rain" fill="#60a5fa" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  )}
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* SRI LANKA SPECIFICS */}
          <div style={sectionStyle}>
            <div style={sectionTitleStyle}>🌊 Sri Lanka Specifics</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={specRowStyle}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700 }}>⛳ Monsoon Period</div>
                  <div style={{ fontSize: 11, opacity: 0.5, marginTop: 2 }}>{monsoon.monsoon}</div>
                </div>
                <span style={{
                  fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 12,
                  background: monsoon.status === 'Active' ? 'rgba(34,197,94,0.15)' : 'rgba(255,255,255,0.08)',
                  color: monsoon.status === 'Active' ? '#4ade80' : '#a3a3a3',
                  border: `1px solid ${monsoon.status === 'Active' ? 'rgba(34,197,94,0.3)' : 'rgba(255,255,255,0.15)'}`
                }}>
                  {monsoon.status}
                </span>
              </div>
              <p style={{ fontSize: 11, opacity: 0.7, margin: '0 0 4px', borderLeft: '2px solid #3b82f6', paddingLeft: 8 }}>
                {monsoon.desc}
              </p>

              <div style={specRowStyle}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700 }}>🛥️ Coastal Sea State</div>
                  <div style={{ fontSize: 11, opacity: 0.5, marginTop: 2 }}>Based on current {wind} km/h wind speeds</div>
                </div>
                <span style={{ fontSize: 11, fontWeight: 700, color: sea.color }}>{sea.label}</span>
              </div>
              <p style={{ fontSize: 11, opacity: 0.7, margin: '0 0 4px', borderLeft: `2px solid ${sea.color}`, paddingLeft: 8 }}>
                {sea.advice}
              </p>

              <div style={{ ...specRowStyle, borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: 10 }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700 }}>🚶 Best Time to Step Out</div>
                  <div style={{ fontSize: 11, opacity: 0.7, marginTop: 3, color: '#38bdf8' }}>{bestTime}</div>
                </div>
              </div>
            </div>
          </div>

          {/* EXTENDED STATS */}
          <div style={sectionStyle}>
            <div style={sectionTitleStyle}>📊 Extended Stats</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <StatItem label="Dew Point" value={`${dewPoint}°${unit}`} icon="💧" />
              <StatItem label="Cloud Cover" value={`${clouds}%`} icon="☁️" />
              <StatItem label="Wind Direction" value={`${windDir}° (${compassDir})`} icon="🧭" />
              <StatItem label="Wind Gusts" value={`${windGust} km/h`} icon="💨" />
              <StatItem label="Sea Level Pressure" value={`${seaLevelPress} hPa`} icon="🌐" />
              <StatItem label="Ground Level Pressure" value={`${groundLevelPress} hPa`} icon="🏔️" />
            </div>
          </div>

          {/* SUN & MOON */}
          <div style={sectionStyle}>
            <div style={sectionTitleStyle}>🌅 Sun & Moon</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', background: 'rgba(255,255,255,0.03)', padding: 10, borderRadius: 12 }}>
                <div style={{ textAlign: 'center', flex: 1 }}>
                  <div style={{ fontSize: 18, marginBottom: 2 }}>🌅</div>
                  <div style={{ fontSize: 9, opacity: 0.5 }}>Sunrise</div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#fbbf24' }}>{sunriseStr}</div>
                </div>
                <div style={{ width: 1, background: 'rgba(255,255,255,0.1)' }} />
                <div style={{ textAlign: 'center', flex: 1 }}>
                  <div style={{ fontSize: 18, marginBottom: 2 }}>☀️</div>
                  <div style={{ fontSize: 9, opacity: 0.5 }}>Daylight</div>
                  <div style={{ fontSize: 12, fontWeight: 700 }}>{daylightStr}</div>
                </div>
                <div style={{ width: 1, background: 'rgba(255,255,255,0.1)' }} />
                <div style={{ textAlign: 'center', flex: 1 }}>
                  <div style={{ fontSize: 18, marginBottom: 2 }}>🌇</div>
                  <div style={{ fontSize: 9, opacity: 0.5 }}>Sunset</div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#f59e0b' }}>{sunsetStr}</div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyBetween: 'space-between', padding: 12, borderRadius: 12, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.04)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ fontSize: 28 }}>{moon.emoji}</div>
                  <div>
                    <div style={{ fontSize: 11, opacity: 0.5 }}>Moon Phase</div>
                    <div style={{ fontSize: 13, fontWeight: 700 }}>{moon.label}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* AIR QUALITY */}
          <div style={sectionStyle}>
            <div style={sectionTitleStyle}>🌬️ Air Quality (AQI)</div>
            {airLoading ? (
              <div style={{ textAlign: 'center', padding: '10px 0', fontSize: 12, opacity: 0.5 }}>Fetching local AQI...</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: '50%',
                    background: `${aqiColor(aqi)}15`,
                    border: `2px solid ${aqiColor(aqi)}`,
                    display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center',
                    fontWeight: 800, color: aqiColor(aqi),
                  }}>
                    <span>{aqi}</span>
                    <span style={{ fontSize: 7, opacity: 0.8, marginTop: -2 }}>/5</span>
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: aqiColor(aqi) }}>
                      {aqiLabel(aqi)} Index
                    </div>
                    <p style={{ fontSize: 11, opacity: 0.6, margin: '2px 0 0' }}>
                      {aqiRecommendation(aqi)}
                    </p>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 8, marginTop: 4 }}>
                  <AQIPollutant label="PM2.5" val={aqiComp.pm2_5} unit="µg/m³" />
                  <AQIPollutant label="PM10" val={aqiComp.pm10} unit="µg/m³" />
                  <AQIPollutant label="NO₂" val={aqiComp.no2} unit="µg/m³" />
                  <AQIPollutant label="O₃" val={aqiComp.o3} unit="µg/m³" />
                </div>
              </div>
            )}
          </div>

        </div>
      </motion.div>
    </AnimatePresence>
  );
}

// Sub-components & styles
const sectionStyle = {
  background: 'rgba(255, 255, 255, 0.04)',
  borderRadius: 16,
  border: '1px solid rgba(255, 255, 255, 0.06)',
  padding: '16px',
};

const sectionTitleStyle = {
  fontSize: 14,
  fontWeight: 700,
  color: 'rgba(255, 255, 255, 0.85)',
  marginBottom: 12,
  letterSpacing: '0.5px',
};

const rangeCardStyle = {
  background: 'rgba(255, 255, 255, 0.03)',
  borderRadius: 12,
  padding: '8px 4px',
  border: '1px solid rgba(255, 255, 255, 0.04)',
};

const specRowStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
};

const chartTabStyle = (active) => ({
  background: active ? '#3b82f6' : 'transparent',
  border: 'none',
  borderRadius: 16,
  color: active ? '#fff' : 'rgba(255, 255, 255, 0.6)',
  fontSize: 10,
  fontWeight: 600,
  padding: '4px 12px',
  cursor: 'pointer',
  transition: 'all 0.2s',
});

const tooltipStyle = {
  background: 'rgba(8,14,24,0.95)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 8,
  fontSize: 11,
  color: '#fff',
};

function StatItem({ label, value, icon }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(255,255,255,0.02)', padding: '8px 10px', borderRadius: 10 }}>
      <span style={{ fontSize: 16 }}>{icon}</span>
      <div>
        <div style={{ fontSize: 9, opacity: 0.5 }}>{label}</div>
        <div style={{ fontSize: 12, fontWeight: 700 }}>{value}</div>
      </div>
    </div>
  );
}

function AQIPollutant({ label, val, unit }) {
  return (
    <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)', padding: '6px 4px', borderRadius: 8, textAlign: 'center' }}>
      <div style={{ fontSize: 9, opacity: 0.5 }}>{label}</div>
      <div style={{ fontSize: 11, fontWeight: 700, margin: '2px 0 1px' }}>{val ? val.toFixed(1) : '--'}</div>
      <div style={{ fontSize: 7, opacity: 0.35 }}>{unit}</div>
    </div>
  );
}
