import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';

const API_KEY = import.meta.env.VITE_WEATHER_API_KEY;
const BASE = 'https://api.openweathermap.org/data/2.5';

const SL_CITIES = ['Colombo', 'Kandy', 'Galle', 'Jaffna', 'Negombo', 'Trincomalee', 'Nuwara Eliya', 'Anuradhapura'];
const sceneIcon = id => {
    if (!id) return '⛅';
    if (id >= 200 && id <= 232) return '⛈️';
    if (id >= 300 && id <= 531) return '🌧️';
    if (id === 800) return '☀️';
    return '⛅';
};

export default function MultiCityCompare({ open, onClose }) {
    const [cities, setCities] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!open) return;
        setLoading(true);
        Promise.all(
            SL_CITIES.map(city =>
                axios.get(`${BASE}/weather?q=${city},LK&appid=${API_KEY}&units=metric`)
                    .then(r => ({
                        name: r.data.name,
                        temp: Math.round(r.data.main.temp),
                        feels: Math.round(r.data.main.feels_like),
                        humidity: r.data.main.humidity,
                        wind: Math.round(r.data.wind.speed * 3.6),
                        desc: r.data.weather[0].description,
                        id: r.data.weather[0].id,
                    }))
                    .catch(() => null)
            )
        ).then(results => {
            setCities(results.filter(Boolean));
            setLoading(false);
        });
    }, [open]);

    if (!open) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                style={{
                    position: 'fixed', inset: 0, zIndex: 9000,
                    background: 'rgba(0,0,0,0.75)',
                    backdropFilter: 'blur(8px)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    padding: 24,
                }}
                onClick={onClose}
            >
                <motion.div
                    initial={{ scale: 0.95, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.95, opacity: 0, y: 20 }}
                    transition={{ duration: 0.25 }}
                    onClick={e => e.stopPropagation()}
                    style={{
                        background: 'rgba(8,14,24,0.97)',
                        backdropFilter: 'blur(28px)',
                        borderRadius: 24,
                        border: '1px solid rgba(255,255,255,0.12)',
                        padding: '28px 28px',
                        width: '100%', maxWidth: 900,
                        maxHeight: '85vh', overflowY: 'auto',
                        color: '#fff',
                    }}
                >
                    {/* Header */}
                    <div style={{
                        display: 'flex', alignItems: 'center',
                        justifyContent: 'space-between', marginBottom: 24,
                    }}>
                        <div>
                            <div style={{ fontSize: 18, fontWeight: 700 }}>🏙️ Sri Lanka Cities Weather</div>
                            <div style={{ fontSize: 12, opacity: 0.45, marginTop: 3 }}>
                                Live comparison across {SL_CITIES.length} cities
                            </div>
                        </div>
                        <div
                            onClick={onClose}
                            style={{
                                width: 36, height: 36, borderRadius: '50%',
                                background: 'rgba(255,255,255,0.08)',
                                border: '1px solid rgba(255,255,255,0.12)',
                                display: 'flex', alignItems: 'center',
                                justifyContent: 'center', cursor: 'pointer',
                                fontSize: 18, color: 'rgba(255,255,255,0.6)',
                            }}
                        >×</div>
                    </div>

                    {loading ? (
                        <div style={{
                            display: 'flex', flexDirection: 'column',
                            alignItems: 'center', gap: 14, padding: '40px 0',
                        }}>
                            <div style={{
                                width: 40, height: 40,
                                border: '3px solid rgba(255,255,255,0.1)',
                                borderTopColor: 'rgba(255,255,255,0.8)',
                                borderRadius: '50%',
                                animation: 'spin 0.7s linear infinite',
                            }} />
                            <div style={{ fontSize: 13, opacity: 0.5 }}>
                                Fetching all cities...
                            </div>
                            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                        </div>
                    ) : (
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
                            gap: 12,
                        }}>
                            {cities.map((c, i) => (
                                <motion.div
                                    key={c.name}
                                    initial={{ opacity: 0, y: 16 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.06 }}
                                    style={{
                                        background: 'rgba(255,255,255,0.05)',
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        borderRadius: 18, padding: '18px 16px',
                                        textAlign: 'center',
                                        transition: 'all 0.2s',
                                        cursor: 'default',
                                    }}
                                    whileHover={{
                                        background: 'rgba(59,130,246,0.15)',
                                        borderColor: 'rgba(96,165,250,0.3)',
                                        y: -3,
                                    }}
                                >
                                    <div style={{ fontSize: 32, marginBottom: 8 }}>
                                        {sceneIcon(c.id)}
                                    </div>
                                    <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>{c.name}</div>
                                    <div style={{ fontSize: 32, fontWeight: 100, letterSpacing: '-2px', lineHeight: 1 }}>
                                        {c.temp}°
                                    </div>
                                    <div style={{ fontSize: 11, opacity: 0.5, marginTop: 4, textTransform: 'capitalize' }}>
                                        {c.desc}
                                    </div>
                                    <div style={{
                                        display: 'flex', justifyContent: 'center',
                                        gap: 10, marginTop: 10,
                                        fontSize: 11, opacity: 0.6,
                                    }}>
                                        <span>💧{c.humidity}%</span>
                                        <span>💨{c.wind}km/h</span>
                                    </div>
                                    {/* Temp bar */}
                                    <div style={{
                                        height: 3, borderRadius: 3, marginTop: 12,
                                        background: 'rgba(255,255,255,0.08)',
                                        overflow: 'hidden',
                                    }}>
                                        <div style={{
                                            height: '100%',
                                            width: `${Math.min(100, ((c.temp - 15) / 25) * 100)}%`,
                                            background: c.temp > 32 ? '#f97316'
                                                : c.temp > 28 ? '#eab308'
                                                    : '#60a5fa',
                                            borderRadius: 3,
                                            transition: 'width 0.8s ease',
                                        }} />
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}