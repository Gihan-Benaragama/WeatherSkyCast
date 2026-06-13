import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const API_KEY = import.meta.env.VITE_WEATHER_API_KEY;
const OWM_BASE = 'https://api.openweathermap.org/data/2.5';

const SL_CITIES = [
    { name: 'Colombo', lat: 6.9271, lon: 79.8612, capital: true },
    { name: 'Kandy', lat: 7.2906, lon: 80.6337 },
    { name: 'Galle', lat: 6.0535, lon: 80.2210 },
    { name: 'Jaffna', lat: 9.6615, lon: 80.0255 },
    { name: 'Negombo', lat: 7.2081, lon: 79.8358 },
    { name: 'Trincomalee', lat: 8.5874, lon: 81.2152 },
    { name: 'Anuradhapura', lat: 8.3114, lon: 80.4037 },
    { name: 'Nuwara Eliya', lat: 6.9497, lon: 80.7891 },
    { name: 'Matara', lat: 5.9549, lon: 80.5550 },
    { name: 'Batticaloa', lat: 7.7310, lon: 81.6747 },
];

const LAYERS = [
    {
        id: 'precipitation', label: 'Precipitation', icon: '🌧️', color: '#3b82f6',
        legend: ['#c0e8ff', '#4db3ff', '#0080ff', '#0040ff', '#8000ff'],
        legendLabels: ['Light', 'Moderate', 'Heavy', 'Intense', 'Extreme']
    },
    {
        id: 'temperature', label: 'Temperature', icon: '🌡️', color: '#f97316',
        legend: ['#4488ff', '#44ffff', '#44ff44', '#ffff44', '#ff4444'],
        legendLabels: ['Cold', 'Cool', 'Mild', 'Warm', 'Hot']
    },
    {
        id: 'wind', label: 'Wind', icon: '💨', color: '#10b981',
        legend: ['#c8ffc8', '#88ff88', '#44cc44', '#cc8800', '#ff4400'],
        legendLabels: ['Calm', 'Breeze', 'Moderate', 'Strong', 'Storm']
    },
    {
        id: 'clouds', label: 'Clouds', icon: '☁️', color: '#94a3b8',
        legend: ['#ffffff20', '#ffffff50', '#cccccc', '#888888', '#444444'],
        legendLabels: ['Clear', 'Few', 'Scattered', 'Broken', 'Overcast']
    },
    {
        id: 'pressure', label: 'Pressure', icon: '🔵', color: '#a78bfa',
        legend: ['#ff8800', '#ffcc00', '#88ff88', '#44aaff', '#8844ff'],
        legendLabels: ['Low', 'Below avg', 'Normal', 'Above avg', 'High']
    },
];

function getScene(id) {
    if (!id) return 'cloudy';
    if (id >= 200 && id <= 232) return 'storm';
    if (id >= 300 && id <= 531) return 'rain';
    if (id === 800) return 'sunny';
    return 'cloudy';
}
function sceneIcon(id) {
    const s = getScene(id);
    return { sunny: '☀️', cloudy: '⛅', rain: '🌧️', storm: '⛈️' }[s] || '⛅';
}

export default function MapPage({ locationTarget, displayCity, unit = 'C' }) {
    const canvasRef = useRef(null);
    const animRef = useRef(null);
    const mapRef = useRef(null);
    const mapInstance = useRef(null);
    const [mapReady, setMapReady] = useState(false);
    const [, setTick] = useState(0);

    const [activeLayer, setActiveLayer] = useState('precipitation');
    const [cityWeather, setCityWeather] = useState({});
    const [selectedCity, setSelectedCity] = useState(null);
    const [loadingCities, setLoadingCities] = useState(true);
    const [playing, setPlaying] = useState(false);
    const [timeOffset, setTimeOffset] = useState(0);

    function toDisp(c) {
        if (typeof c !== 'number') return '--';
        return unit === 'F' ? Math.round(c * 9 / 5 + 32) : Math.round(c);
    }

    useEffect(() => {
        if (mapRef.current && !mapInstance.current) {
            const map = L.map(mapRef.current, {
                center: [7.8731, 80.7718], // Center of Sri Lanka
                zoom: 8,
                zoomControl: false,
                attributionControl: false,
                minZoom: 7,
                maxZoom: 10,
            });

            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                maxZoom: 19
            }).addTo(map);

            mapInstance.current = map;
            setMapReady(true);

            const handleMove = () => setTick(t => t + 1);
            map.on('zoom move viewreset', handleMove);

            return () => {
                map.off('zoom move viewreset', handleMove);
                map.remove();
                mapInstance.current = null;
            };
        }
    }, []);

    const getXY = (lat, lon) => {
        if (!mapInstance.current) return { x: 0, y: 0 };
        return mapInstance.current.latLngToContainerPoint([lat, lon]);
    };

    const handleZoomIn = () => {
        if (mapInstance.current) mapInstance.current.zoomIn();
    };
    const handleZoomOut = () => {
        if (mapInstance.current) mapInstance.current.zoomOut();
    };
    const handleZoomReset = () => {
        if (mapInstance.current) mapInstance.current.setView([7.8731, 80.7718], 8);
    };

    useEffect(() => {
        const fetchAll = async () => {
            setLoadingCities(true);
            const results = await Promise.all(
                SL_CITIES.map(city =>
                    fetch(`${OWM_BASE}/weather?lat=${city.lat}&lon=${city.lon}&appid=${API_KEY}&units=metric`)
                        .then(r => r.json())
                        .then(d => ({ ...city, weather: d }))
                        .catch(() => city)
                )
            );
            const map = {};
            results.forEach(c => { map[c.name] = c; });
            setCityWeather(map);
            setSelectedCity(map['Colombo'] || results[0]);
            setLoadingCities(false);
        };
        fetchAll();
    }, []);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        let animId;

        function resize() {
            canvas.width = canvas.offsetWidth;
            canvas.height = canvas.offsetHeight;
            if (mapInstance.current) {
                mapInstance.current.invalidateSize();
            }
        }
        resize();
        window.addEventListener('resize', resize);

        const W = () => canvas.width;
        const H = () => canvas.height;

        function latLonToXY(lat, lon) {
            return getXY(lat, lon);
        }

        const cells = Array.from({ length: 22 }, () => ({
            lat: 5.9 + Math.random() * 3.9,
            lon: 79.6 + Math.random() * 2.0,
            r: 18 + Math.random() * 45,
            alpha: 0.07 + Math.random() * 0.20,
            phase: Math.random() * Math.PI * 2,
            speed: 0.003 + Math.random() * 0.007,
            type: Math.random() > 0.6 ? 'storm' : 'rain',
            dlat: (Math.random() - 0.5) * 0.001,
        }));

        const wind = Array.from({ length: 90 }, () => ({
            lat: 5.9 + Math.random() * 3.9,
            lon: 79.4 + Math.random() * 2.8,
            speed: 0.004 + Math.random() * 0.007,
            alpha: 0.10 + Math.random() * 0.18,
            len: 0.06 + Math.random() * 0.12,
            wave: Math.random() * Math.PI * 2,
        }));

        let t = 0;

        function draw() {
            t += 0.016;
            ctx.clearRect(0, 0, W(), H());

            cells.forEach(cell => {
                cell.lon += cell.speed * 0.12;
                cell.lat += cell.dlat;
                cell.phase += 0.018;
                if (cell.lon > 82.2) cell.lon = 79.4;
                if (cell.lat > 9.9 || cell.lat < 5.7) cell.dlat *= -1;

                const { x, y } = latLonToXY(cell.lat, cell.lon);
                const currentZoom = mapInstance.current ? mapInstance.current.getZoom() : 8;
                const zoomScale = Math.pow(2, currentZoom - 8);
                const pulse = (0.75 + 0.25 * Math.sin(cell.phase)) * zoomScale;
                const grad = ctx.createRadialGradient(x, y, 0, x, y, cell.r * pulse);

                if (activeLayer === 'precipitation') {
                    if (cell.type === 'storm') {
                        grad.addColorStop(0, `rgba(255,80,0,${cell.alpha * pulse * 1.6})`);
                        grad.addColorStop(0.35, `rgba(255,180,0,${cell.alpha * pulse * 1.1})`);
                        grad.addColorStop(0.7, `rgba(0,180,100,${cell.alpha * pulse * 0.6})`);
                        grad.addColorStop(1, 'rgba(0,180,100,0)');
                    } else {
                        grad.addColorStop(0, `rgba(0,100,255,${cell.alpha * pulse * 1.3})`);
                        grad.addColorStop(0.5, `rgba(0,180,255,${cell.alpha * pulse * 0.8})`);
                        grad.addColorStop(1, 'rgba(0,180,255,0)');
                    }
                } else if (activeLayer === 'temperature') {
                    const warm = cell.lat < 7.5;
                    grad.addColorStop(0, warm ? `rgba(255,60,0,${cell.alpha * pulse})` : `rgba(0,120,255,${cell.alpha * pulse})`);
                    grad.addColorStop(0.5, warm ? `rgba(255,160,0,${cell.alpha * pulse * 0.5})` : `rgba(0,200,255,${cell.alpha * pulse * 0.5})`);
                    grad.addColorStop(1, 'rgba(0,0,0,0)');
                } else if (activeLayer === 'wind') {
                    grad.addColorStop(0, `rgba(0,255,140,${cell.alpha * pulse})`);
                    grad.addColorStop(0.6, `rgba(0,200,100,${cell.alpha * pulse * 0.5})`);
                    grad.addColorStop(1, 'rgba(0,200,100,0)');
                } else if (activeLayer === 'clouds') {
                    grad.addColorStop(0, `rgba(180,200,255,${cell.alpha * pulse * 0.7})`);
                    grad.addColorStop(0.6, `rgba(160,180,220,${cell.alpha * pulse * 0.35})`);
                    grad.addColorStop(1, 'rgba(160,180,220,0)');
                } else {
                    grad.addColorStop(0, `rgba(140,80,255,${cell.alpha * pulse})`);
                    grad.addColorStop(0.5, `rgba(100,60,200,${cell.alpha * pulse * 0.5})`);
                    grad.addColorStop(1, 'rgba(100,60,200,0)');
                }

                ctx.fillStyle = grad;
                ctx.beginPath();
                ctx.arc(x, y, cell.r * pulse, 0, Math.PI * 2);
                ctx.fill();
            });

            if (activeLayer === 'wind') {
                wind.forEach(p => {
                    p.lon += p.speed;
                    p.wave += 0.04;
                    if (p.lon > 82.2) p.lon = 79.4;
                    const { x, y } = latLonToXY(p.lat, p.lon);
                    const waveY = y + Math.sin(p.wave) * 4;
                    const currentZoom = mapInstance.current ? mapInstance.current.getZoom() : 8;
                    const zoomScale = Math.pow(2, currentZoom - 8);
                    const ex = x + p.len * W() * 0.3 * zoomScale;
                    const gr = ctx.createLinearGradient(x, waveY, ex, waveY);
                    gr.addColorStop(0, `rgba(80,255,160,0)`);
                    gr.addColorStop(0.4, `rgba(80,255,160,${p.alpha})`);
                    gr.addColorStop(1, `rgba(80,255,160,0)`);
                    ctx.strokeStyle = gr;
                    ctx.lineWidth = 1.2;
                    ctx.lineCap = 'round';
                    ctx.beginPath();
                    ctx.moveTo(x, waveY);
                    ctx.quadraticCurveTo(x + p.len * W() * 0.15 * zoomScale, waveY - 5, ex, waveY - 2);
                    ctx.stroke();
                });
            }

            animId = requestAnimationFrame(draw);
        }

        draw();
        animRef.current = animId;

        return () => {
            cancelAnimationFrame(animId);
            window.removeEventListener('resize', resize);
        };
    }, [activeLayer, mapReady]);

    useEffect(() => {
        if (!playing) return;
        const id = setInterval(() => {
            setTimeOffset(prev => {
                if (prev >= 0) { setPlaying(false); return 0; }
                return +(prev + 0.5).toFixed(1);
            });
        }, 800);
        return () => clearInterval(id);
    }, [playing]);

    const currentLayer = LAYERS.find(l => l.id === activeLayer) || LAYERS[0];

    function timeLabel(offset = timeOffset) {
        const d = new Date();
        d.setHours(d.getHours() + offset);
        return d.toLocaleTimeString('en-LK', {
            hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'Asia/Colombo',
        });
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 64px)', color: '#fff', overflow: 'hidden' }}>
            <style>{`
        .mp-scroll::-webkit-scrollbar { display:none; }
        .city-chip:hover { transform:translateY(-2px) !important; }
      `}</style>

            {/* ── TOP BAR ──────────────────────────── */}
            <div className="map-topbar" style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '8px 18px',
                background: 'rgba(0,0,0,0.38)',
                backdropFilter: 'blur(20px)',
                borderBottom: '1px solid rgba(255,255,255,0.07)',
                flexShrink: 0, flexWrap: 'wrap',
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700, fontSize: 14, marginRight: 4 }}>
                    <span>🗺️</span> Weather Map
                    <span style={{
                        fontSize: 9, padding: '2px 8px',
                        background: 'rgba(59,130,246,0.2)',
                        border: '1px solid rgba(96,165,250,0.3)',
                        color: '#93c5fd', borderRadius: 20, fontWeight: 700,
                    }}>LIVE</span>
                </div>

                <div style={{
                    display: 'flex', gap: 3, flex: 1,
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: 50, padding: 3, overflow: 'auto',
                    scrollbarWidth: 'none',
                }}>
                    {LAYERS.map(l => (
                        <button key={l.id} onClick={() => setActiveLayer(l.id)} style={{
                            display: 'flex', alignItems: 'center', gap: 5,
                            padding: '5px 14px', borderRadius: 50, border: 'none',
                            cursor: 'pointer', fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap',
                            background: activeLayer === l.id ? `${l.color}35` : 'transparent',
                            color: activeLayer === l.id ? '#fff' : 'rgba(255,255,255,0.45)',
                            transition: 'all 0.2s',
                            boxShadow: activeLayer === l.id ? `0 0 0 1px ${l.color}55` : 'none',
                        }}>
                            {l.icon} {l.label}
                        </button>
                    ))}
                </div>

                <div style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    background: 'rgba(255,255,255,0.07)',
                    border: '1px solid rgba(255,255,255,0.11)',
                    borderRadius: 50, padding: '5px 14px',
                    fontSize: 11, whiteSpace: 'nowrap',
                }}>
                    🕐 <b>{timeLabel()}</b>
                    {timeOffset < 0 && (
                        <span style={{
                            fontSize: 9, padding: '1px 6px',
                            background: 'rgba(167,139,250,0.2)',
                            border: '1px solid rgba(167,139,250,0.3)',
                            color: '#c4b5fd', borderRadius: 20,
                        }}>{timeOffset}h</span>
                    )}
                </div>
            </div>

            {/* ── MAIN ROW ─────────────────────────── */}
            <div className="map-main-row" style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

                {/* SIDEBAR */}
                <motion.div
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    className="map-sidebar"
                    style={{
                        width: 235, flexShrink: 0,
                        background: 'rgba(0,0,0,0.42)',
                        backdropFilter: 'blur(24px)',
                        borderRight: '1px solid rgba(255,255,255,0.07)',
                        display: 'flex', flexDirection: 'column',
                        overflow: 'hidden',
                    }}
                >
                    {/* Selected city card */}
                    <div style={{ padding: '14px', flexShrink: 0 }}>
                        <AnimatePresence mode="wait">
                            {selectedCity?.weather?.main ? (
                                <motion.div
                                    key={selectedCity.name}
                                    initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.22 }}
                                >
                                    <div style={{
                                        background: 'linear-gradient(135deg,rgba(59,130,246,0.22),rgba(99,102,241,0.14))',
                                        border: '1px solid rgba(96,165,250,0.22)',
                                        borderRadius: 16, padding: '13px 15px', marginBottom: 10,
                                    }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                                            <span style={{ fontSize: 11 }}>📍</span>
                                            <span style={{ fontSize: 13, fontWeight: 700 }}>{selectedCity.name}</span>
                                            {selectedCity.capital && (
                                                <span style={{
                                                    fontSize: 8, padding: '1px 6px',
                                                    background: 'rgba(251,191,36,0.18)',
                                                    border: '1px solid rgba(251,191,36,0.3)',
                                                    color: '#fbbf24', borderRadius: 20,
                                                }}>Capital</span>
                                            )}
                                        </div>
                                        <div style={{ fontSize: 9, opacity: 0.4, marginBottom: 10 }}>
                                            {selectedCity.lat?.toFixed(2)}°N · {selectedCity.lon?.toFixed(2)}°E
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                            <motion.span
                                                animate={{ rotate: [0, 6, -6, 0] }}
                                                transition={{ duration: 3, repeat: Infinity }}
                                                style={{ fontSize: 30 }}
                                            >
                                                {sceneIcon(selectedCity.weather.weather?.[0]?.id)}
                                            </motion.span>
                                            <div>
                                                <div style={{ fontSize: 30, fontWeight: 100, letterSpacing: -2, lineHeight: 1 }}>
                                                    {toDisp(selectedCity.weather.main.temp)}
                                                    <sup style={{ fontSize: 13, opacity: 0.7 }}>°{unit}</sup>
                                                </div>
                                                <div style={{ fontSize: 10, opacity: 0.5, textTransform: 'capitalize', marginTop: 1 }}>
                                                    {selectedCity.weather.weather?.[0]?.description}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                                        {[
                                            { icon: '💧', label: 'Humidity', val: `${selectedCity.weather.main.humidity}%` },
                                            { icon: '💨', label: 'Wind', val: `${Math.round((selectedCity.weather.wind?.speed || 0) * 3.6)} km/h` },
                                            { icon: '🌡️', label: 'Pressure', val: `${selectedCity.weather.main.pressure} hPa` },
                                            { icon: '👁️', label: 'Visibility', val: `${((selectedCity.weather.visibility || 0) / 1000).toFixed(1)} km` },
                                            { icon: '🌡️', label: 'Feels like', val: `${toDisp(selectedCity.weather.main.feels_like)}°${unit}` },
                                        ].map(({ icon, label, val }) => (
                                            <div key={label} style={{
                                                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                                padding: '5px 9px',
                                                background: 'rgba(255,255,255,0.04)',
                                                border: '1px solid rgba(255,255,255,0.05)',
                                                borderRadius: 9, fontSize: 10,
                                            }}>
                                                <span style={{ opacity: 0.48 }}>{icon} {label}</span>
                                                <span style={{ fontWeight: 600 }}>{val}</span>
                                            </div>
                                        ))}
                                    </div>
                                </motion.div>
                            ) : (
                                <div style={{ padding: '16px 0', textAlign: 'center', opacity: 0.35, fontSize: 11 }}>
                                    {loadingCities ? '⏳ Loading cities...' : 'Click a city pin'}
                                </div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Legend */}
                    <div style={{
                        padding: '10px 14px',
                        borderTop: '1px solid rgba(255,255,255,0.06)',
                        flexShrink: 0,
                    }}>
                        <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', opacity: 0.4, marginBottom: 8 }}>
                            {currentLayer.icon} {currentLayer.label} scale
                        </div>
                        <div style={{ height: 7, borderRadius: 4, background: `linear-gradient(90deg,${currentLayer.legend.join(',')})`, marginBottom: 5 }} />
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 8, opacity: 0.4 }}>
                            {currentLayer.legendLabels.map(l => <span key={l}>{l}</span>)}
                        </div>
                    </div>

                    {/* City list */}
                    <div className="mp-scroll" style={{ flex: 1, overflowY: 'auto', padding: '6px 8px 10px' }}>
                        <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', opacity: 0.35, padding: '3px 8px 7px' }}>
                            🇱🇰 All Cities
                        </div>
                        {SL_CITIES.map((city, i) => {
                            const cw = cityWeather[city.name];
                            const sel = selectedCity?.name === city.name;
                            return (
                                <motion.div
                                    key={city.name}
                                    onClick={() => cw && setSelectedCity(cw)}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: i * 0.04 }}
                                    whileHover={{ x: 3 }}
                                    style={{
                                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                        padding: '7px 9px', borderRadius: 11, cursor: 'pointer', marginBottom: 3,
                                        background: sel ? 'rgba(59,130,246,0.18)' : 'rgba(255,255,255,0.03)',
                                        border: `1px solid ${sel ? 'rgba(96,165,250,0.32)' : 'rgba(255,255,255,0.05)'}`,
                                        transition: 'all 0.15s',
                                    }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                                        <span style={{ fontSize: 14 }}>
                                            {cw?.weather ? sceneIcon(cw.weather.weather?.[0]?.id) : '⏳'}
                                        </span>
                                        <div>
                                            <div style={{ fontSize: 11, fontWeight: sel ? 700 : 500 }}>{city.name}</div>
                                            <div style={{ fontSize: 9, opacity: 0.38, textTransform: 'capitalize' }}>
                                                {cw?.weather?.weather?.[0]?.description || '...'}
                                            </div>
                                        </div>
                                    </div>
                                    <div style={{ fontSize: 13, fontWeight: 300 }}>
                                        {cw?.weather?.main ? `${toDisp(cw.weather.main.temp)}°` : '...'}
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                </motion.div>

                {/* MAP CANVAS AREA */}
                <div style={{ flex: 1, position: 'relative', overflow: 'hidden', background: '#0c111d' }}>

                    {/* Leaflet base map */}
                    <div
                        ref={mapRef}
                        style={{
                            position: 'absolute', inset: 0, width: '100%', height: '100%',
                            background: '#0c111d', opacity: 0.9,
                            filter: 'saturate(0.8) brightness(0.65) contrast(1.3) hue-rotate(200deg)',
                        }}
                    />

                    {/* Weather overlay */}
                    <canvas ref={canvasRef} style={{
                        position: 'absolute', inset: 0, width: '100%', height: '100%',
                        pointerEvents: 'none', mixBlendMode: 'screen',
                    }} />

                    {/* Vignette */}
                    <div style={{
                        position: 'absolute', inset: 0,
                        background: 'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.55) 100%)',
                        pointerEvents: 'none',
                    }} />

                    {/* City pins */}
                    {mapReady && SL_CITIES.map((city, i) => {
                        const cw = cityWeather[city.name];
                        const sel = selectedCity?.name === city.name;
                        const pos = getXY(city.lat, city.lon);

                        return (
                            <motion.div
                                key={city.name}
                                onClick={() => cw && setSelectedCity(cw)}
                                initial={{ scale: 0, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ delay: 0.15 + i * 0.05, type: 'spring', stiffness: 260 }}
                                style={{
                                    position: 'absolute',
                                    left: `${pos.x}px`, top: `${pos.y}px`,
                                    transform: 'translate(-50%,-100%)',
                                    cursor: 'pointer', zIndex: sel ? 20 : 10,
                                }}
                            >
                                {/* Pulse ring */}
                                {sel && (
                                    <motion.div
                                        animate={{ scale: [1, 2.2, 1], opacity: [0.7, 0, 0.7] }}
                                        transition={{ duration: 2, repeat: Infinity }}
                                        style={{
                                            position: 'absolute', inset: -10,
                                            borderRadius: '50%',
                                            border: '2px solid #60a5fa',
                                            pointerEvents: 'none',
                                        }}
                                    />
                                )}

                                <motion.div
                                    whileHover={{ scale: 1.12, y: -2 }}
                                    style={{
                                        background: sel ? 'rgba(37,99,235,0.92)' : 'rgba(6,12,22,0.88)',
                                        backdropFilter: 'blur(14px)',
                                        border: `1.5px solid ${sel ? '#60a5fa' : 'rgba(255,255,255,0.18)'}`,
                                        borderRadius: 12, padding: sel ? '6px 11px' : '4px 8px',
                                        display: 'flex', alignItems: 'center', gap: 5,
                                        boxShadow: sel
                                            ? '0 6px 24px rgba(59,130,246,0.55)'
                                            : '0 3px 14px rgba(0,0,0,0.6)',
                                        whiteSpace: 'nowrap',
                                    }}
                                >
                                    <span style={{ fontSize: sel ? 17 : 13 }}>
                                        {cw?.weather ? sceneIcon(cw.weather.weather?.[0]?.id) : '📍'}
                                    </span>
                                    <div>
                                        <div style={{ fontSize: sel ? 11 : 9, fontWeight: 700 }}>{city.name}</div>
                                        {cw?.weather?.main && (
                                            <div style={{ fontSize: sel ? 13 : 9, fontWeight: 300 }}>
                                                {toDisp(cw.weather.main.temp)}°{unit}
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                                {/* Pin tip */}
                                <div style={{
                                    width: 0, height: 0, margin: '0 auto',
                                    borderLeft: '5px solid transparent',
                                    borderRight: '5px solid transparent',
                                    borderTop: `8px solid ${sel ? 'rgba(37,99,235,0.92)' : 'rgba(6,12,22,0.88)'}`,
                                }} />
                            </motion.div>
                        );
                    })}

                    {/* Zoom buttons */}
                    <div style={{ position: 'absolute', right: 14, top: 14, display: 'flex', flexDirection: 'column', gap: 6, zIndex: 30 }}>
                        <motion.button
                            whileHover={{ scale: 1.08 }}
                            whileTap={{ scale: 0.92 }}
                            onClick={handleZoomIn}
                            style={{
                                width: 34, height: 34, borderRadius: 10,
                                background: 'rgba(6,12,22,0.88)',
                                backdropFilter: 'blur(14px)',
                                border: '1px solid rgba(255,255,255,0.13)',
                                color: '#fff', fontSize: 17, cursor: 'pointer',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}
                        >+</motion.button>
                        <motion.button
                            whileHover={{ scale: 1.08 }}
                            whileTap={{ scale: 0.92 }}
                            onClick={handleZoomOut}
                            style={{
                                width: 34, height: 34, borderRadius: 10,
                                background: 'rgba(6,12,22,0.88)',
                                backdropFilter: 'blur(14px)',
                                border: '1px solid rgba(255,255,255,0.13)',
                                color: '#fff', fontSize: 17, cursor: 'pointer',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}
                        >−</motion.button>
                        <motion.button
                            whileHover={{ scale: 1.08 }}
                            whileTap={{ scale: 0.92 }}
                            onClick={handleZoomReset}
                            style={{
                                width: 34, height: 34, borderRadius: 10,
                                background: 'rgba(6,12,22,0.88)',
                                backdropFilter: 'blur(14px)',
                                border: '1px solid rgba(255,255,255,0.13)',
                                color: '#fff', fontSize: 17, cursor: 'pointer',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}
                        >⊕</motion.button>
                    </div>

                    {/* Legend card */}
                    <motion.div
                        key={activeLayer}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="map-legend-card"
                        style={{
                            position: 'absolute', right: 14, bottom: 74,
                            background: 'rgba(6,12,22,0.90)',
                            backdropFilter: 'blur(16px)',
                            border: '1px solid rgba(255,255,255,0.11)',
                            borderRadius: 13, padding: '11px 15px',
                            minWidth: 190, zIndex: 25,
                        }}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 7 }}>
                            <span style={{ fontSize: 11, fontWeight: 700 }}>{currentLayer.icon} {currentLayer.label}</span>
                            <span style={{ fontSize: 9, opacity: 0.38 }}>{timeLabel()}</span>
                        </div>
                        <div style={{ height: 7, borderRadius: 3, background: `linear-gradient(90deg,${currentLayer.legend.join(',')})`, marginBottom: 5 }} />
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 8, opacity: 0.4 }}>
                            {currentLayer.legendLabels.map(l => <span key={l}>{l}</span>)}
                        </div>
                    </motion.div>

                    {/* Time scrubber */}
                    <motion.div
                        initial={{ opacity: 0, y: 14 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="map-scrubber"
                        style={{
                            position: 'absolute', bottom: 14, left: '50%',
                            transform: 'translateX(-50%)',
                            background: 'rgba(6,12,22,0.92)',
                            backdropFilter: 'blur(20px)',
                            border: '1px solid rgba(255,255,255,0.11)',
                            borderRadius: 16, padding: '10px 18px',
                            minWidth: 460, zIndex: 25,
                            display: 'flex', alignItems: 'center', gap: 12,
                        }}
                    >
                        <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.92 }}
                            onClick={() => { if (timeOffset >= 0) setTimeOffset(-3); setPlaying(p => !p); }}
                            style={{
                                width: 32, height: 32, borderRadius: '50%',
                                background: 'rgba(59,130,246,0.22)',
                                border: '1px solid rgba(96,165,250,0.38)',
                                color: '#93c5fd', fontSize: 14, cursor: 'pointer',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                            }}
                        >{playing ? '⏸' : '▶'}</motion.button>

                        <div style={{ flex: 1, position: 'relative' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, opacity: 0.4, marginBottom: 5 }}>
                                {[-3, -2, -1, 0].map(h => <span key={h}>{timeLabel(h)}</span>)}
                            </div>
                            <div style={{ height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.09)', position: 'relative' }}>
                                <div style={{
                                    position: 'absolute', left: 0, top: 0, bottom: 0, borderRadius: 2,
                                    background: 'linear-gradient(90deg,#3b82f6,#818cf8)',
                                    width: `${((timeOffset + 3) / 3) * 100}%`,
                                    transition: 'width 0.2s',
                                }} />
                                <input
                                    type="range" min={-3} max={0} step={0.5}
                                    value={timeOffset}
                                    onChange={e => { setTimeOffset(parseFloat(e.target.value)); setPlaying(false); }}
                                    style={{ position: 'absolute', inset: '-8px 0', width: '100%', opacity: 0, cursor: 'pointer' }}
                                />
                                <div style={{
                                    position: 'absolute', top: '50%',
                                    left: `${((timeOffset + 3) / 3) * 100}%`,
                                    transform: 'translate(-50%,-50%)',
                                    width: 13, height: 13, borderRadius: '50%',
                                    background: '#60a5fa', border: '2px solid #fff',
                                    boxShadow: '0 2px 8px rgba(59,130,246,0.6)',
                                    pointerEvents: 'none', transition: 'left 0.2s',
                                }} />
                            </div>
                        </div>

                        <span style={{ fontSize: 10, fontWeight: 700, color: '#93c5fd', minWidth: 55, textAlign: 'right' }}>
                            {timeOffset === 0 ? '🔴 LIVE' : `${timeOffset}h ago`}
                        </span>
                    </motion.div>

                    {/* Attribution */}
                    <div style={{
                        position: 'absolute', top: 14, left: 14,
                        background: 'rgba(6,12,22,0.72)',
                        border: '1px solid rgba(255,255,255,0.07)',
                        borderRadius: 7, padding: '4px 9px',
                        fontSize: 8, opacity: 0.4, zIndex: 25,
                    }}>
                        © OpenStreetMap contributors · OpenWeatherMap
                    </div>
                </div>
            </div>

            {/* BOTTOM STRIP */}
            <div className="map-bottom-strip" style={{
                background: 'rgba(0,0,0,0.42)',
                backdropFilter: 'blur(20px)',
                borderTop: '1px solid rgba(255,255,255,0.07)',
                padding: '8px 18px',
                flexShrink: 0,
            }}>
                <div className="mp-scroll" style={{ display: 'flex', alignItems: 'center', gap: 8, overflowX: 'auto' }}>
                    <div style={{ fontSize: 9, fontWeight: 700, opacity: 0.35, textTransform: 'uppercase', letterSpacing: '1px', flexShrink: 0 }}>
                        🇱🇰 LIVE CONDITIONS
                    </div>
                    {SL_CITIES.map((city, i) => {
                        const cw = cityWeather[city.name];
                        const sel = selectedCity?.name === city.name;
                        return (
                            <motion.div
                                key={city.name}
                                className="city-chip"
                                onClick={() => cw && setSelectedCity(cw)}
                                initial={{ opacity: 0, y: 6 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.04 }}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: 7,
                                    padding: '6px 13px', borderRadius: 50, cursor: 'pointer', flexShrink: 0,
                                    background: sel ? 'rgba(59,130,246,0.22)' : 'rgba(255,255,255,0.05)',
                                    border: `1px solid ${sel ? 'rgba(96,165,250,0.38)' : 'rgba(255,255,255,0.07)'}`,
                                    transition: 'all 0.18s',
                                }}
                            >
                                <span style={{ fontSize: 15 }}>
                                    {cw?.weather ? sceneIcon(cw.weather.weather?.[0]?.id) : '⏳'}
                                </span>
                                <div>
                                    <div style={{ fontSize: 10, fontWeight: sel ? 700 : 500, color: sel ? '#60a5fa' : '#fff' }}>
                                        {city.name}
                                    </div>
                                    <div style={{ fontSize: 9, opacity: 0.42 }}>
                                        {cw?.weather?.main ? `${toDisp(cw.weather.main.temp)}°${unit}` : '...'}
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
