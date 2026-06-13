import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    AreaChart, Area, XAxis, YAxis, Tooltip,
    ResponsiveContainer, CartesianGrid, BarChart, Bar, Cell,
} from 'recharts';

// ── helpers ──────────────────────────────────────────────
const API_KEY = import.meta.env.VITE_WEATHER_API_KEY;
const BASE = 'https://api.openweathermap.org/data/2.5';

function getScene(id) {
    if (!id) return 'cloudy';
    if (id >= 200 && id <= 232) return 'storm';
    if (id >= 300 && id <= 531) return 'rain';
    if (id === 800) return 'sunny';
    return 'cloudy';
}

function sceneIcon(scene) {
    return { sunny: '☀️', cloudy: '⛅', rain: '🌧️', storm: '⛈️' }[scene] || '⛅';
}

function condIcon(id) { return sceneIcon(getScene(id)); }

function windDir(deg) {
    const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    return dirs[Math.round(deg / 45) % 8];
}

function toSLTime(unix) {
    return new Date(unix * 1000).toLocaleTimeString('en-LK', {
        hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'Asia/Colombo',
    });
}

function uviColor(uv) {
    if (uv <= 2) return '#22c55e';
    if (uv <= 5) return '#eab308';
    if (uv <= 7) return '#f97316';
    if (uv <= 10) return '#ef4444';
    return '#7c3aed';
}

function aqiLabel(aqi) {
    return ['', 'Good', 'Fair', 'Moderate', 'Poor', 'Very Poor'][aqi] || '--';
}
function aqiColor(aqi) {
    return ['', '#22c55e', '#84cc16', '#eab308', '#f97316', '#ef4444'][aqi] || '#888';
}

const TABS = ['Temperature', 'Precipitation', 'Wind'];

// ── custom tooltip ────────────────────────────────────────
function HourTooltip({ active, payload, label, tab }) {
    if (!active || !payload?.length) return null;
    const d = payload[0].payload;
    return (
        <div style={{
            background: 'rgba(6,12,22,0.97)',
            border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: 12, padding: '10px 14px', color: '#fff',
            backdropFilter: 'blur(20px)', fontSize: 12,
        }}>
            <div style={{ opacity: 0.5, marginBottom: 4 }}>{label}</div>
            {tab === 'Temperature' && <>
                <div style={{ fontSize: 20, fontWeight: 300 }}>{d.temp}°C</div>
                <div style={{ opacity: 0.5, marginTop: 2 }}>Feels like {d.feels}°C</div>
            </>}
            {tab === 'Precipitation' && <>
                <div style={{ fontSize: 20, fontWeight: 300 }}>{d.rain}%</div>
                <div style={{ opacity: 0.5, marginTop: 2 }}>Chance of rain</div>
            </>}
            {tab === 'Wind' && <>
                <div style={{ fontSize: 20, fontWeight: 300 }}>{d.wind} km/h</div>
                <div style={{ opacity: 0.5, marginTop: 2 }}>Wind speed</div>
            </>}
        </div>
    );
}

// ── sunrise arc ───────────────────────────────────────────
function SunArc({ sunrise, sunset }) {
    const now = Date.now() / 1000;
    const total = sunset - sunrise;
    const prog = Math.max(0, Math.min(1, (now - sunrise) / total));
    const r = 70, cx = 90, cy = 80;
    const startAngle = Math.PI;
    const endAngle = 0;
    const angle = startAngle + (endAngle - startAngle) * prog; // goes right
    const sx = cx + r * Math.cos(Math.PI);
    const sy = cy + r * Math.sin(Math.PI);
    const ex = cx + r * Math.cos(0);
    const ey = cy + r * Math.sin(0);
    const sunX = cx + r * Math.cos(Math.PI - prog * Math.PI);
    const sunY = cy - Math.abs(Math.sin(prog * Math.PI)) * r;

    return (
        <svg width={180} height={95} style={{ overflow: 'visible' }}>
            {/* Track */}
            <path
                d={`M ${cx - r},${cy} A ${r},${r} 0 0,1 ${cx + r},${cy}`}
                fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth={2}
                strokeDasharray="4 4"
            />
            {/* Filled arc */}
            <path
                d={`M ${cx - r},${cy} A ${r},${r} 0 0,1 ${sunX},${sunY}`}
                fill="none" stroke="rgba(251,191,36,0.5)" strokeWidth={2}
            />
            {/* Sun */}
            <circle cx={sunX} cy={sunY} r={7} fill="#fbbf24" />
            <circle cx={sunX} cy={sunY} r={12} fill="rgba(251,191,36,0.2)" />
            {/* Labels */}
            <text x={cx - r - 2} y={cy + 14} fill="rgba(255,255,255,0.5)" fontSize={10} textAnchor="middle">
                {toSLTime(sunrise)}
            </text>
            <text x={cx + r + 2} y={cy + 14} fill="rgba(255,255,255,0.5)" fontSize={10} textAnchor="middle">
                {toSLTime(sunset)}
            </text>
            <text x={cx} y={cy + 14} fill="rgba(255,255,255,0.35)" fontSize={9} textAnchor="middle">
                {Math.round(prog * 100)}% of day
            </text>
        </svg>
    );
}

// ── AQI ring ──────────────────────────────────────────────
function AQIRing({ aqi, components }) {
    const pct = (aqi / 5) * 100;
    const r = 42, circ = 2 * Math.PI * r;
    const col = aqiColor(aqi);
    return (
        <div className="aqi-ring-container" style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
            <div style={{ position: 'relative', width: 100, height: 100, flexShrink: 0 }}>
                <svg width={100} height={100}>
                    <circle cx={50} cy={50} r={r} fill="none"
                        stroke="rgba(255,255,255,0.07)" strokeWidth={8} />
                    <motion.circle
                        cx={50} cy={50} r={r} fill="none"
                        stroke={col} strokeWidth={8}
                        strokeLinecap="round"
                        strokeDasharray={circ}
                        initial={{ strokeDashoffset: circ }}
                        animate={{ strokeDashoffset: circ * (1 - pct / 100) }}
                        transition={{ duration: 1.4, ease: 'easeOut' }}
                        style={{ transformOrigin: '50% 50%', transform: 'rotate(-90deg)' }}
                    />
                </svg>
                <div style={{
                    position: 'absolute', inset: 0,
                    display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center',
                    color: '#fff',
                }}>
                    <div style={{ fontSize: 22, fontWeight: 300, lineHeight: 1 }}>{aqi ? aqi * 20 : '--'}</div>
                    <div style={{ fontSize: 9, opacity: 0.5, marginTop: 2 }}>AQI</div>
                </div>
            </div>
            <div style={{ flex: 1 }}>
                <div style={{
                    fontSize: 15, fontWeight: 600, color: col, marginBottom: 4,
                }}>{aqi ? aqiLabel(aqi) : '--'}</div>
                <div style={{ fontSize: 11, opacity: 0.5, lineHeight: 1.6 }}>
                    {aqi <= 2 ? 'Air quality is satisfactory.' :
                        aqi === 3 ? 'Acceptable. Some pollutants.' :
                            'Unhealthy for sensitive groups.'}
                </div>
                {components && (
                    <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
                        {[
                            { k: 'pm2_5', label: 'PM2.5' },
                            { k: 'pm10', label: 'PM10' },
                            { k: 'o3', label: 'O₃' },
                            { k: 'no2', label: 'NO₂' },
                        ].map(({ k, label }) => (
                            <div key={k} style={{
                                fontSize: 10, color: 'rgba(255,255,255,0.55)',
                                background: 'rgba(255,255,255,0.06)',
                                border: '1px solid rgba(255,255,255,0.09)',
                                padding: '2px 8px', borderRadius: 20,
                            }}>
                                {label} {components[k]?.toFixed(1) ?? '--'}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

// ── UV meter ─────────────────────────────────────────────
function UVBar({ uv }) {
    const pct = Math.min(100, (uv / 11) * 100);
    const col = uviColor(uv);
    const label = uv <= 2 ? 'Low' : uv <= 5 ? 'Moderate' : uv <= 7 ? 'High' : uv <= 10 ? 'Very High' : 'Extreme';
    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: 13, opacity: 0.6 }}>UV Index</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: col }}>{uv} — {label}</span>
            </div>
            <div style={{
                height: 6, borderRadius: 3,
                background: 'linear-gradient(90deg,#22c55e,#eab308,#f97316,#ef4444,#7c3aed)',
                position: 'relative', overflow: 'hidden',
            }}>
                <motion.div
                    style={{
                        position: 'absolute', top: 0, left: 0, bottom: 0,
                        background: 'rgba(0,0,0,0.55)',
                        borderRadius: 3,
                    }}
                    initial={{ right: '100%' }}
                    animate={{ right: `${100 - pct}%` }}
                    transition={{ duration: 1, ease: 'easeOut' }}
                />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4, fontSize: 9, opacity: 0.35 }}>
                <span>0</span><span>3</span><span>6</span><span>9</span><span>11+</span>
            </div>
        </div>
    );
}

// ── main component ────────────────────────────────────────
export default function ForecastPage({ locationTarget, displayCity, unit = 'C' }) {
    const [forecast, setForecast] = useState(null);
    const [current, setCurrent] = useState(null);
    const [airData, setAirData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState('Temperature');
    const [selDay, setSelDay] = useState(0);

    function toDisp(c) {
        if (typeof c !== 'number') return '--';
        return unit === 'F' ? Math.round(c * 9 / 5 + 32) : Math.round(c);
    }

    useEffect(() => {
        if (!locationTarget) return;
        const fetchAll = async () => {
            try {
                setLoading(true);
                setError(null);
                let q = typeof locationTarget === 'object'
                    ? `lat=${locationTarget.lat}&lon=${locationTarget.lon}`
                    : `q=${locationTarget}`;

                const [wRes, fRes] = await Promise.all([
                    fetch(`${BASE}/weather?${q}&appid=${API_KEY}&units=metric`),
                    fetch(`${BASE}/forecast?${q}&appid=${API_KEY}&units=metric`),
                ]);
                const wData = await wRes.json();
                const fData = await fRes.json();

                setCurrent(wData);
                setForecast(fData);

                // Air quality (requires lat/lon)
                const lat = wData.coord?.lat, lon = wData.coord?.lon;
                if (lat && lon) {
                    const aqRes = await fetch(
                        `${BASE}/air_pollution?lat=${lat}&lon=${lon}&appid=${API_KEY}`
                    );
                    const aqData = await aqRes.json();
                    setAirData(aqData.list?.[0]);
                }
            } catch (e) {
                setError('Could not load forecast data.');
            } finally {
                setLoading(false);
            }
        };
        fetchAll();
    }, [JSON.stringify(locationTarget)]);

    // ── build 7-day ───────────────────────────────────────
    const sevenDays = (() => {
        if (!forecast?.list) return [];
        const map = {};
        forecast.list.forEach(item => {
            const d = item.dt_txt.split(' ')[0];
            if (!map[d]) map[d] = [];
            map[d].push(item);
        });
        return Object.entries(map).slice(0, 7).map(([date, items]) => {
            const mid = items.find(i => i.dt_txt.includes('12:00')) || items[Math.floor(items.length / 2)];
            const temps = items.map(i => i.main.temp);
            const rains = items.map(i => (i.pop || 0) * 100);
            const d = new Date(date);
            return {
                date, items,
                day: d.toLocaleDateString('en-LK', { weekday: 'short' }),
                dateStr: d.toLocaleDateString('en-LK', { month: 'short', day: 'numeric' }),
                tempMax: Math.round(Math.max(...temps)),
                tempMin: Math.round(Math.min(...temps)),
                tempAvg: Math.round(temps.reduce((a, b) => a + b, 0) / temps.length),
                rainMax: Math.round(Math.max(...rains)),
                rainAvg: Math.round(rains.reduce((a, b) => a + b, 0) / rains.length),
                wind: Math.round(mid.wind.speed * 3.6),
                id: mid.weather[0].id,
                desc: mid.weather[0].description,
                scene: getScene(mid.weather[0].id),
                pressure: mid.main.pressure,
                humidity: mid.main.humidity,
            };
        });
    })();

    // ── hourly for selected day ────────────────────────────
    const hourlyData = (() => {
        if (!sevenDays[selDay]) return [];
        return sevenDays[selDay].items.map(item => ({
            time: new Date(item.dt * 1000).toLocaleTimeString('en-LK', {
                hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'Asia/Colombo',
            }),
            temp: Math.round(item.main.temp),
            feels: Math.round(item.main.feels_like),
            rain: Math.round((item.pop || 0) * 100),
            wind: Math.round(item.wind.speed * 3.6),
            id: item.weather[0].id,
            scene: getScene(item.weather[0].id),
        }));
    })();

    // ── precipitation 7-day ───────────────────────────────
    const precipData = sevenDays.map(d => ({
        day: d.day, rain: d.rainAvg, max: d.rainMax,
    }));

    if (loading) return (
        <div style={{
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            minHeight: '60vh', color: '#fff', gap: 14,
        }}>
            <div style={{
                width: 40, height: 40,
                border: '3px solid rgba(255,255,255,0.12)',
                borderTopColor: 'rgba(255,255,255,0.85)',
                borderRadius: '50%',
                animation: 'spin 0.7s linear infinite',
            }} />
            <p style={{ opacity: 0.5, fontSize: 14 }}>Loading forecast...</p>
            <style>{`@keyframes spin{to{transform:rotate(360deg);}}`}</style>
        </div>
    );

    if (error) return (
        <div style={{ textAlign: 'center', padding: 48, color: '#ff9999' }}>⚠️ {error}</div>
    );

    if (!forecast) return null;

    const today = current;
    const aqi = airData?.main?.aqi;
    const aqiComp = airData?.components;

    return (
        <div className="forecast-page-container" style={{
            padding: '0 48px 48px',
            color: '#fff',
            maxWidth: 1400,
            margin: '0 auto',
        }}>
            <style>{`
        @keyframes spin { to { transform:rotate(360deg); } }
        .fc-scrollbar::-webkit-scrollbar { display:none; }
        .day-card:hover { transform:translateY(-4px) !important; border-color:rgba(255,255,255,0.25) !important; }
      `}</style>

            {/* ── PAGE HEADER ─────────────────────────── */}
            <motion.div
                initial={{ opacity: 0, y: -12 }}
                animate={{ opacity: 1, y: 0 }}
                style={{ marginBottom: 28, paddingTop: 20 }}
            >
                <div style={{
                    fontSize: 11, fontWeight: 700, textTransform: 'uppercase',
                    letterSpacing: '2px', color: '#60a5fa', marginBottom: 6
                }}>
                    📅 Extended Forecast
                </div>
                <div className="forecast-header-row" style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
                    <div>
                        <h1 style={{ fontSize: 32, fontWeight: 800, letterSpacing: '-1px', lineHeight: 1.1 }}>
                            {displayCity || 'Weather Forecast'}
                        </h1>
                        <p style={{ fontSize: 13, opacity: 0.45, marginTop: 4 }}>
                            7-day outlook · Hourly breakdown · Air quality
                        </p>
                    </div>
                    {today && (
                        <div style={{
                            display: 'flex', alignItems: 'center', gap: 10,
                            background: 'rgba(255,255,255,0.07)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: 50, padding: '8px 18px',
                            fontSize: 13,
                        }}>
                            <span style={{ fontSize: 20 }}>{condIcon(today.weather?.[0]?.id)}</span>
                            <span style={{ fontWeight: 700 }}>{toDisp(today.main?.temp)}°{unit}</span>
                            <span style={{ opacity: 0.5, textTransform: 'capitalize' }}>
                                {today.weather?.[0]?.description}
                            </span>
                        </div>
                    )}
                </div>
            </motion.div>

            {/* ── TOP ROW: Current details + Sun arc ──── */}
            {today && (
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14, marginBottom: 20 }}
                    className="forecast-stats-row"
                >
                    {/* Current stats */}
                    <div style={{
                        background: 'rgba(0,0,0,0.28)',
                        backdropFilter: 'blur(22px)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: 20, padding: '20px 22px',
                    }}>
                        <div style={{
                            fontSize: 11, fontWeight: 700, textTransform: 'uppercase',
                            letterSpacing: '1.5px', opacity: 0.45, marginBottom: 14
                        }}>
                            Current Conditions
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                            {[
                                { icon: '💧', label: 'Humidity', val: `${today.main?.humidity}%` },
                                { icon: '💨', label: 'Wind', val: `${Math.round((today.wind?.speed || 0) * 3.6)} km/h ${windDir(today.wind?.deg || 0)}` },
                                { icon: '🌡️', label: 'Pressure', val: `${today.main?.pressure} hPa` },
                                { icon: '👁️', label: 'Visibility', val: `${((today.visibility || 0) / 1000).toFixed(1)} km` },
                                { icon: '💦', label: 'Dew Point', val: `${Math.round((today.main?.temp || 0) - ((100 - (today.main?.humidity || 0)) / 5))}°C` },
                                { icon: '☁️', label: 'Cloud Cover', val: `${today.clouds?.all}%` },
                            ].map(({ icon, label, val }) => (
                                <div key={label} style={{
                                    background: 'rgba(255,255,255,0.04)',
                                    border: '1px solid rgba(255,255,255,0.07)',
                                    borderRadius: 12, padding: '10px 12px',
                                }}>
                                    <div style={{ fontSize: 16, marginBottom: 4 }}>{icon}</div>
                                    <div style={{ fontSize: 10, opacity: 0.45, marginBottom: 2 }}>{label}</div>
                                    <div style={{ fontSize: 14, fontWeight: 600 }}>{val}</div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Sunrise / Sunset + UV */}
                    <div style={{
                        background: 'rgba(0,0,0,0.28)',
                        backdropFilter: 'blur(22px)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: 20, padding: '20px 22px',
                        display: 'flex', flexDirection: 'column', gap: 20,
                    }}>
                        <div>
                            <div style={{
                                fontSize: 11, fontWeight: 700, textTransform: 'uppercase',
                                letterSpacing: '1.5px', opacity: 0.45, marginBottom: 12
                            }}>
                                Sun Position
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'center' }}>
                                <SunArc
                                    sunrise={today.sys?.sunrise || 0}
                                    sunset={today.sys?.sunset || 0}
                                />
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
                                <div style={{ textAlign: 'center' }}>
                                    <div style={{ fontSize: 9, opacity: 0.4 }}>SUNRISE</div>
                                    <div style={{ fontSize: 15, fontWeight: 600, color: '#fbbf24' }}>
                                        {toSLTime(today.sys?.sunrise || 0)}
                                    </div>
                                </div>
                                <div style={{ textAlign: 'center' }}>
                                    <div style={{ fontSize: 9, opacity: 0.4 }}>SUNSET</div>
                                    <div style={{ fontSize: 15, fontWeight: 600, color: '#f97316' }}>
                                        {toSLTime(today.sys?.sunset || 0)}
                                    </div>
                                </div>
                            </div>
                        </div>
                        <UVBar uv={7} />
                    </div>

                    {/* Air Quality */}
                    <div style={{
                        background: 'rgba(0,0,0,0.28)',
                        backdropFilter: 'blur(22px)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: 20, padding: '20px 22px',
                    }}>
                        <div style={{
                            fontSize: 11, fontWeight: 700, textTransform: 'uppercase',
                            letterSpacing: '1.5px', opacity: 0.45, marginBottom: 16
                        }}>
                            Air Quality Index
                        </div>
                        <AQIRing aqi={aqi} components={aqiComp} />
                        <div style={{
                            marginTop: 16, padding: '10px 14px',
                            background: `${aqiColor(aqi)}18`,
                            border: `1px solid ${aqiColor(aqi)}35`,
                            borderRadius: 12, fontSize: 12,
                            color: 'rgba(255,255,255,0.7)', lineHeight: 1.6,
                        }}>
                            {aqi <= 2
                                ? '✅ Good air quality. Safe for outdoor activities.'
                                : aqi === 3
                                    ? '⚠️ Acceptable. Sensitive individuals take care.'
                                    : '🚫 Unhealthy. Limit prolonged outdoor exertion.'}
                        </div>
                    </div>
                </motion.div>
            )}

            {/* ── 7-DAY CARDS ─────────────────────────── */}
            <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                style={{
                    background: 'rgba(0,0,0,0.28)',
                    backdropFilter: 'blur(22px)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 20, padding: '20px 22px',
                    marginBottom: 20,
                }}
            >
                <div style={{
                    display: 'flex', alignItems: 'center',
                    justifyContent: 'space-between', marginBottom: 16,
                }}>
                    <div style={{ fontSize: 14, fontWeight: 700 }}>📅 7-Day Forecast</div>
                    <div style={{ fontSize: 11, opacity: 0.38 }}>Click a day for hourly detail</div>
                </div>

                <div className="forecast-7day-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 10 }}>
                    {sevenDays.map((day, i) => (
                        <motion.div
                            key={day.date}
                            className="day-card"
                            onClick={() => setSelDay(i)}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.05 * i }}
                            whileHover={{ y: -4 }}
                            whileTap={{ scale: 0.97 }}
                            style={{
                                background: selDay === i
                                    ? 'rgba(59,130,246,0.22)'
                                    : 'rgba(255,255,255,0.05)',
                                border: `1px solid ${selDay === i
                                    ? 'rgba(96,165,250,0.45)'
                                    : 'rgba(255,255,255,0.08)'}`,
                                borderRadius: 16, padding: '14px 8px',
                                textAlign: 'center', cursor: 'pointer',
                                transition: 'all 0.2s',
                            }}
                        >
                            <div style={{
                                fontSize: 11, fontWeight: 700, opacity: selDay === i ? 1 : 0.55,
                                textTransform: 'uppercase', letterSpacing: '0.5px'
                            }}>
                                {i === 0 ? 'TODAY' : day.day}
                            </div>
                            <div style={{ fontSize: 10, opacity: 0.38, marginTop: 2 }}>{day.dateStr}</div>
                            <motion.div
                                style={{
                                    fontSize: 30, margin: '10px 0',
                                    filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.4))'
                                }}
                                animate={{ y: [0, -3, 0] }}
                                transition={{ duration: 2 + i * 0.3, repeat: Infinity, ease: 'easeInOut' }}
                            >
                                {condIcon(day.id)}
                            </motion.div>
                            <div style={{ fontSize: 18, fontWeight: 600 }}>{toDisp(day.tempMax)}°</div>
                            <div style={{ fontSize: 12, opacity: 0.4, marginTop: 2 }}>{toDisp(day.tempMin)}°</div>
                            {/* Rain bar */}
                            <div style={{
                                height: 3, borderRadius: 2,
                                background: 'rgba(255,255,255,0.08)',
                                margin: '8px 4px 0', overflow: 'hidden',
                            }}>
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${day.rainAvg}%` }}
                                    transition={{ delay: 0.3 + i * 0.05, duration: 0.8 }}
                                    style={{
                                        height: '100%', borderRadius: 2,
                                        background: day.rainAvg > 60
                                            ? '#60a5fa'
                                            : day.rainAvg > 30 ? '#93c5fd' : 'rgba(96,165,250,0.3)',
                                    }}
                                />
                            </div>
                            <div style={{ fontSize: 9, opacity: 0.35, marginTop: 4 }}>
                                {day.rainAvg > 0 ? `☔ ${day.rainAvg}%` : ''}
                            </div>
                        </motion.div>
                    ))}
                </div>
            </motion.div>

            {/* ── HOURLY CHART ─────────────────────────── */}
            <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                style={{
                    background: 'rgba(0,0,0,0.28)',
                    backdropFilter: 'blur(22px)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 20, padding: '20px 22px',
                    marginBottom: 20,
                }}
            >
                <div style={{
                    display: 'flex', alignItems: 'center',
                    justifyContent: 'space-between', marginBottom: 16,
                    flexWrap: 'wrap', gap: 10,
                }}>
                    <div>
                        <div style={{ fontSize: 14, fontWeight: 700 }}>⏱️ Hourly Breakdown</div>
                        <div style={{ fontSize: 11, opacity: 0.38, marginTop: 2 }}>
                            {sevenDays[selDay]?.day} {sevenDays[selDay]?.dateStr} · 3-hour intervals
                        </div>
                    </div>
                    {/* Tab switcher */}
                    <div style={{
                        display: 'flex', gap: 4,
                        background: 'rgba(255,255,255,0.06)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: 50, padding: 3,
                    }}>
                        {TABS.map(tab => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                style={{
                                    padding: '5px 14px', borderRadius: 50,
                                    border: 'none', cursor: 'pointer',
                                    fontSize: 12, fontWeight: 600,
                                    background: activeTab === tab
                                        ? 'rgba(59,130,246,0.35)' : 'transparent',
                                    color: activeTab === tab
                                        ? '#fff' : 'rgba(255,255,255,0.45)',
                                    transition: 'all 0.2s',
                                }}
                            >{tab}</button>
                        ))}
                    </div>
                </div>

                {/* Hour pills */}
                <div className="fc-scrollbar" style={{
                    display: 'flex', gap: 8, overflowX: 'auto',
                    paddingBottom: 12, marginBottom: 16,
                }}>
                    {hourlyData.map((h, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: i * 0.04 }}
                            style={{
                                flexShrink: 0, display: 'flex', flexDirection: 'column',
                                alignItems: 'center', gap: 4,
                                padding: '10px 14px',
                                background: i === 0
                                    ? 'rgba(59,130,246,0.25)'
                                    : 'rgba(255,255,255,0.05)',
                                border: `1px solid ${i === 0
                                    ? 'rgba(96,165,250,0.4)'
                                    : 'rgba(255,255,255,0.07)'}`,
                                borderRadius: 14, minWidth: 72,
                            }}
                        >
                            <div style={{ fontSize: 10, opacity: 0.5, fontWeight: 600 }}>
                                {i === 0 ? 'NOW' : h.time}
                            </div>
                            <div style={{ fontSize: 20 }}>{condIcon(h.id)}</div>
                            {activeTab === 'Temperature' && (
                                <div style={{ fontSize: 15, fontWeight: 600 }}>{toDisp(h.temp)}°</div>
                            )}
                            {activeTab === 'Precipitation' && (
                                <div style={{ fontSize: 15, fontWeight: 600, color: '#60a5fa' }}>{h.rain}%</div>
                            )}
                            {activeTab === 'Wind' && (
                                <div style={{ fontSize: 13, fontWeight: 600 }}>{h.wind}</div>
                            )}
                            <div style={{ fontSize: 9, opacity: 0.4 }}>
                                {activeTab === 'Temperature' && `Feels ${toDisp(h.feels)}°`}
                                {activeTab === 'Precipitation' && 'rain'}
                                {activeTab === 'Wind' && 'km/h'}
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* Chart */}
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeTab + selDay}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.25 }}
                        style={{ height: 160, minWidth: 0, width: '100%', overflow: 'hidden' }}
                    >
                        <ResponsiveContainer width="99%" height="100%">
                            {activeTab === 'Precipitation' ? (
                                <BarChart data={hourlyData} margin={{ top: 8, right: 8, left: -28, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                                    <XAxis dataKey="time" tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }} axisLine={false} tickLine={false} />
                                    <YAxis tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }} axisLine={false} tickLine={false} domain={[0, 100]} />
                                    <Tooltip content={<HourTooltip tab={activeTab} />} />
                                    <Bar dataKey="rain" radius={[4, 4, 0, 0]}>
                                        {hourlyData.map((h, i) => (
                                            <Cell key={i} fill={h.rain > 60 ? '#3b82f6' : h.rain > 30 ? '#60a5fa' : 'rgba(96,165,250,0.35)'} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            ) : (
                                <AreaChart data={hourlyData} margin={{ top: 8, right: 8, left: -28, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor={activeTab === 'Wind' ? '#34d399' : '#60a5fa'} stopOpacity={0.35} />
                                            <stop offset="95%" stopColor={activeTab === 'Wind' ? '#34d399' : '#60a5fa'} stopOpacity={0.02} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                                    <XAxis dataKey="time" tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }} axisLine={false} tickLine={false} />
                                    <YAxis tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }} axisLine={false} tickLine={false} domain={['dataMin-2', 'dataMax+2']} />
                                    <Tooltip content={<HourTooltip tab={activeTab} />} />
                                    <Area
                                        type="monotone"
                                        dataKey={activeTab === 'Wind' ? 'wind' : 'temp'}
                                        stroke={activeTab === 'Wind' ? '#34d399' : '#60a5fa'}
                                        strokeWidth={2}
                                        fill="url(#chartGrad)"
                                        dot={{ fill: activeTab === 'Wind' ? '#34d399' : '#60a5fa', r: 3, strokeWidth: 0 }}
                                        activeDot={{ r: 5 }}
                                    />
                                </AreaChart>
                            )}
                        </ResponsiveContainer>
                    </motion.div>
                </AnimatePresence>
            </motion.div>

            {/* ── BOTTOM ROW: Precip forecast + Highlights ─ */}
            <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
                style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}
                className="forecast-bottom-row"
            >
                {/* Precipitation 7-day */}
                <div style={{
                    background: 'rgba(0,0,0,0.28)',
                    backdropFilter: 'blur(22px)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 20, padding: '20px 22px',
                }}>
                    <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>
                        🌧️ Precipitation Forecast
                    </div>
                    <div style={{ fontSize: 11, opacity: 0.38, marginBottom: 16 }}>
                        7-day rain probability
                    </div>
                    <div style={{ height: 140, minWidth: 0, width: '100%', overflow: 'hidden' }}>
                        <ResponsiveContainer width="99%" height="100%">
                            <BarChart data={precipData} margin={{ top: 4, right: 4, left: -32, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                                <XAxis dataKey="day" tick={{ fill: 'rgba(255,255,255,0.35)', fontSize: 10 }} axisLine={false} tickLine={false} />
                                <YAxis tick={{ fill: 'rgba(255,255,255,0.35)', fontSize: 10 }} axisLine={false} tickLine={false} domain={[0, 100]} />
                                <Tooltip
                                    formatter={(v) => [`${v}%`, 'Rain probability']}
                                    contentStyle={{
                                        background: 'rgba(6,12,22,0.97)',
                                        border: '1px solid rgba(255,255,255,0.12)',
                                        borderRadius: 10, color: '#fff', fontSize: 12,
                                    }}
                                />
                                <Bar dataKey="rain" radius={[4, 4, 0, 0]}>
                                    {precipData.map((d, i) => (
                                        <Cell key={i} fill={d.rain > 60 ? '#3b82f6' : d.rain > 30 ? 'rgba(96,165,250,0.7)' : 'rgba(96,165,250,0.3)'} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                    {/* Summary row */}
                    <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
                        {[
                            { label: 'Wettest day', val: (() => { const m = sevenDays.reduce((a, b) => b.rainAvg > a.rainAvg ? b : a, sevenDays[0] || {}); return m.day || '--'; })() },
                            { label: 'Driest day', val: (() => { const m = sevenDays.reduce((a, b) => b.rainAvg < a.rainAvg ? b : a, sevenDays[0] || {}); return m.day || '--'; })() },
                            { label: 'Avg rain', val: `${Math.round(sevenDays.reduce((a, b) => a + b.rainAvg, 0) / (sevenDays.length || 1))}%` },
                        ].map(({ label, val }) => (
                            <div key={label} style={{
                                flex: 1, background: 'rgba(255,255,255,0.05)',
                                border: '1px solid rgba(255,255,255,0.08)',
                                borderRadius: 10, padding: '8px 10px', textAlign: 'center',
                            }}>
                                <div style={{ fontSize: 9, opacity: 0.4, marginBottom: 3 }}>{label}</div>
                                <div style={{ fontSize: 14, fontWeight: 600 }}>{val}</div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Weather highlights */}
                <div style={{
                    background: 'rgba(0,0,0,0.28)',
                    backdropFilter: 'blur(22px)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 20, padding: '20px 22px',
                }}>
                    <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>
                        ⭐ Upcoming Highlights
                    </div>
                    <div style={{ fontSize: 11, opacity: 0.38, marginBottom: 16 }}>
                        Notable weather events ahead
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {sevenDays.slice(0, 5).map((day, i) => {
                            const isRainy = day.rainAvg > 60;
                            const isSunny = day.scene === 'sunny' && day.rainAvg < 20;
                            const isStormy = day.scene === 'storm';
                            const isHot = day.tempMax > 33;
                            if (!isRainy && !isSunny && !isStormy && !isHot) return null;
                            const icon = isStormy ? '⛈️' : isRainy ? '🌧️' : isSunny ? '☀️' : '🌡️';
                            const title = isStormy ? `Storm expected ${day.day}`
                                : isRainy ? `Heavy rain on ${day.day}`
                                    : isSunny ? `Clear skies on ${day.day}`
                                        : `High of ${toDisp(day.tempMax)}° on ${day.day}`;
                            const desc = isStormy ? 'Lightning and strong winds possible.'
                                : isRainy ? `${day.rainAvg}% chance of rain. Carry an umbrella.`
                                    : isSunny ? 'Excellent conditions for outdoor activities.'
                                        : 'Stay hydrated. Use SPF protection.';
                            const col = isStormy ? '#7c3aed' : isRainy ? '#3b82f6'
                                : isSunny ? '#f59e0b' : '#ef4444';
                            return (
                                <motion.div
                                    key={day.date}
                                    initial={{ opacity: 0, x: -12 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.1 * i }}
                                    style={{
                                        display: 'flex', alignItems: 'flex-start', gap: 12,
                                        padding: '12px 14px', borderRadius: 14,
                                        background: `${col}14`,
                                        border: `1px solid ${col}30`,
                                    }}
                                >
                                    <div style={{
                                        width: 36, height: 36, borderRadius: '50%',
                                        background: `${col}25`,
                                        border: `1px solid ${col}40`,
                                        display: 'flex', alignItems: 'center',
                                        justifyContent: 'center', fontSize: 18, flexShrink: 0,
                                    }}>{icon}</div>
                                    <div>
                                        <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 2 }}>{title}</div>
                                        <div style={{ fontSize: 11, opacity: 0.55, lineHeight: 1.5 }}>{desc}</div>
                                    </div>
                                </motion.div>
                            );
                        }).filter(Boolean)}

                        {/* Notification CTA */}
                        <div className="highlights-cta-banner" style={{
                            marginTop: 6,
                            display: 'flex', alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '12px 16px', borderRadius: 14,
                            background: 'rgba(59,130,246,0.12)',
                            border: '1px solid rgba(96,165,250,0.25)',
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <span style={{ fontSize: 20 }}>🔔</span>
                                <div>
                                    <div style={{ fontSize: 12, fontWeight: 600 }}>Enable weather alerts</div>
                                    <div style={{ fontSize: 10, opacity: 0.45 }}>Get notified before severe weather</div>
                                </div>
                            </div>
                            <button style={{
                                padding: '6px 14px',
                                background: 'rgba(59,130,246,0.35)',
                                border: '1px solid rgba(96,165,250,0.4)',
                                borderRadius: 50, color: '#93c5fd',
                                fontSize: 11, fontWeight: 700, cursor: 'pointer',
                            }}>Enable</button>
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
