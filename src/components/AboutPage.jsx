import { useEffect, useRef, useState } from 'react';
import { motion, useInView } from 'framer-motion';

// ── animated counter ──────────────────────────────────────
function Counter({ to, suffix = '', duration = 2 }) {
    const [val, setVal] = useState(0);
    const ref = useRef(null);
    const inView = useInView(ref, { once: true });

    useEffect(() => {
        if (!inView) return;
        let start = null;
        const step = (ts) => {
            if (!start) start = ts;
            const progress = Math.min((ts - start) / (duration * 1000), 1);
            const ease = 1 - Math.pow(1 - progress, 3);
            setVal(Math.round(ease * to));
            if (progress < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
    }, [inView, to, duration]);

    return <span ref={ref}>{val.toLocaleString()}{suffix}</span>;
}

// ── fade-in-up wrapper ────────────────────────────────────
function FadeUp({ children, delay = 0, style = {} }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.55, delay, ease: 'easeOut' }}
            style={style}
        >
            {children}
        </motion.div>
    );
}

// ── glass card ────────────────────────────────────────────
function GCard({ children, style = {}, hover = true }) {
    return (
        <motion.div
            whileHover={hover ? { y: -4, borderColor: 'rgba(255,255,255,0.22)' } : {}}
            style={{
                background: 'rgba(0,0,0,0.28)',
                backdropFilter: 'blur(22px)',
                WebkitBackdropFilter: 'blur(22px)',
                border: '1px solid rgba(255,255,255,0.10)',
                borderRadius: 20,
                padding: '24px 26px',
                color: '#fff',
                transition: 'border-color 0.2s',
                ...style,
            }}
        >
            {children}
        </motion.div>
    );
}

// ── team member ───────────────────────────────────────────
const TEAM = [
    {
        name: 'Gihan Benaragama',
        role: 'Founder & Lead Developer',
        emoji: '👨‍💻',
        desc: 'Full-stack developer passionate about bringing weather data to life through cinematic UI experiences.',
        skills: ['React', 'Canvas API', 'OpenWeather', 'Framer Motion'],
        color: '#3b82f6',
    },
    {
        name: 'Sri Lanka Met Dept',
        role: 'Data Partner',
        emoji: '🌦️',
        desc: 'Official meteorological data partner providing hyper-local Sri Lanka weather observations.',
        skills: ['Meteorology', 'Climate Data', 'Alerts'],
        color: '#10b981',
    },
    {
        name: 'OpenWeatherMap',
        role: 'Global API Partner',
        emoji: '🌍',
        desc: 'Powering real-time weather, hourly forecasts and air quality data for 200,000+ cities worldwide.',
        skills: ['REST API', 'Forecasting', 'Air Quality'],
        color: '#f59e0b',
    },
];

// ── timeline ──────────────────────────────────────────────
const TIMELINE = [
    { year: '2024', icon: '💡', title: 'Idea Born', desc: 'Frustrated with bland weather apps, Gihan started sketching SkyCast — a weather app that feels like cinema.' },
    { year: '2024', icon: '🔨', title: 'First Build', desc: 'The cinematic canvas background engine was born. Rain, storm, and lightning animations wrote from scratch.' },
    { year: '2025', icon: '📍', title: 'Location Intelligence', desc: 'GPS auto-detect, city search with autocomplete, and saved locations added. Sri Lanka cities prioritised.' },
    { year: '2025', icon: '📅', title: 'Date Explorer', desc: 'The full calendar date picker launched — browse weather for any past or future date with matching sky backgrounds.' },
    { year: '2026', icon: '🚀', title: 'SkyCast v1.0', desc: 'Forecast page, air quality index, hourly charts, and multi-city comparison make SkyCast a complete weather platform.' },
];

// ── features ──────────────────────────────────────────────
const FEATURES = [
    { icon: '🎬', title: 'Cinematic Backgrounds', desc: 'Real-time canvas animations — rain physics, lightning flicker engine, volumetric clouds, and depth-layered fog.', color: '#7c3aed' },
    { icon: '📅', title: 'Date Explorer', desc: 'Browse past, present and future weather on any date. Background automatically matches the day\'s conditions.', color: '#3b82f6' },
    { icon: '📡', title: 'Live API Data', desc: 'OpenWeatherMap feeds current conditions, 5-day forecast, hourly data and air quality in real time.', color: '#10b981' },
    { icon: '📍', title: 'Smart Location', desc: 'GPS auto-detect on launch, global city search with autocomplete, and saved favourite locations.', color: '#f59e0b' },
    { icon: '🏙️', title: 'Multi-City Compare', desc: 'Side-by-side weather comparison across all major Sri Lanka cities at a glance.', color: '#ef4444' },
    { icon: '🌬️', title: 'Air Quality Index', desc: 'PM2.5, PM10, O₃ and NO₂ pollutant tracking with a real-time AQI ring and health guidance.', color: '#06b6d4' },
];

// ── main ──────────────────────────────────────────────────
export default function AboutPage() {
    const heroRef = useRef(null);
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

    useEffect(() => {
        const handler = (e) => setMousePos({ x: e.clientX, y: e.clientY });
        window.addEventListener('mousemove', handler);
        return () => window.removeEventListener('mousemove', handler);
    }, []);

    return (
        <div style={{ color: '#fff', overflowX: 'hidden' }}>
            <style>{`
        .about-scrollbar::-webkit-scrollbar { display: none; }
        .skill-pill {
          padding: 3px 10px;
          border-radius: 50px;
          font-size: 10px;
          font-weight: 600;
          background: rgba(255,255,255,0.07);
          border: 1px solid rgba(255,255,255,0.12);
          color: rgba(255,255,255,0.65);
        }
      `}</style>

            {/* ══ HERO ══════════════════════════════════════════ */}
            <div
                ref={heroRef}
                style={{
                    position: 'relative',
                    padding: '60px 48px 50px',
                    overflow: 'hidden',
                }}
            >
                {/* Parallax orb */}
                <div style={{
                    position: 'absolute',
                    width: 600, height: 600,
                    borderRadius: '50%',
                    background: 'radial-gradient(circle, rgba(59,130,246,0.12) 0%, rgba(59,130,246,0) 70%)',
                    left: mousePos.x * 0.03 - 200,
                    top: mousePos.y * 0.03 - 200,
                    pointerEvents: 'none',
                    transition: 'left 0.8s ease, top 0.8s ease',
                }} />

                <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: 60,
                    alignItems: 'center',
                    position: 'relative', zIndex: 1,
                }}>
                    {/* Left */}
                    <div>
                        <motion.div
                            initial={{ opacity: 0, y: -12 }}
                            animate={{ opacity: 1, y: 0 }}
                            style={{
                                display: 'inline-flex', alignItems: 'center', gap: 8,
                                background: 'rgba(59,130,246,0.15)',
                                border: '1px solid rgba(96,165,250,0.3)',
                                borderRadius: 50, padding: '5px 16px',
                                fontSize: 11, fontWeight: 700, color: '#93c5fd',
                                letterSpacing: '1.2px', textTransform: 'uppercase',
                                marginBottom: 20,
                            }}
                        >
                            <span>⛅</span> About SkyCast
                        </motion.div>

                        <motion.h1
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            style={{
                                fontSize: 48, fontWeight: 900,
                                lineHeight: 1.05, letterSpacing: '-2px',
                                marginBottom: 18,
                            }}
                        >
                            Weather that{' '}
                            <span style={{
                                background: 'linear-gradient(135deg,#60a5fa,#818cf8)',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                            }}>
                                feels alive.
                            </span>
                        </motion.h1>

                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.18 }}
                            style={{
                                fontSize: 15, color: 'rgba(255,255,255,0.55)',
                                lineHeight: 1.75, maxWidth: 460, marginBottom: 32,
                            }}
                        >
                            SkyCast was built with one idea: weather information should be
                            as immersive as the weather itself. We combine real-time API
                            data with cinematic canvas animations so you don't just{' '}
                            <em>read</em> the forecast — you <em>feel</em> it.
                        </motion.p>

                        {/* Mission pills */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.26 }}
                            style={{ display: 'flex', flexDirection: 'column', gap: 12 }}
                        >
                            {[
                                { icon: '🎯', title: 'Our Mission', text: 'Deliver hyper-accurate Sri Lanka weather through a genuinely beautiful interface.' },
                                { icon: '🔬', title: 'Our Approach', text: 'Every animation is physics-inspired. Every data point is pulled live from trusted APIs.' },
                            ].map(({ icon, title, text }) => (
                                <div key={title} style={{
                                    display: 'flex', alignItems: 'flex-start', gap: 14,
                                    padding: '14px 18px',
                                    background: 'rgba(255,255,255,0.05)',
                                    border: '1px solid rgba(255,255,255,0.09)',
                                    borderRadius: 16,
                                }}>
                                    <div style={{
                                        width: 38, height: 38, borderRadius: '50%',
                                        background: 'rgba(59,130,246,0.15)',
                                        border: '1px solid rgba(96,165,250,0.25)',
                                        display: 'flex', alignItems: 'center',
                                        justifyContent: 'center', fontSize: 18, flexShrink: 0,
                                    }}>{icon}</div>
                                    <div>
                                        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 3 }}>{title}</div>
                                        <div style={{ fontSize: 12, opacity: 0.5, lineHeight: 1.6 }}>{text}</div>
                                    </div>
                                </div>
                            ))}
                        </motion.div>
                    </div>

                    {/* Right — mock phone */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.92, y: 30 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        transition={{ delay: 0.2, duration: 0.7, ease: 'easeOut' }}
                        style={{ display: 'flex', justifyContent: 'center' }}
                    >
                        <div style={{ position: 'relative' }}>
                            {/* Glow behind phone */}
                            <div style={{
                                position: 'absolute', inset: -40,
                                background: 'radial-gradient(circle, rgba(59,130,246,0.20) 0%, transparent 70%)',
                                pointerEvents: 'none',
                            }} />

                            {/* Phone frame */}
                            <motion.div
                                animate={{ y: [0, -10, 0] }}
                                transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                                style={{
                                    width: 260,
                                    background: '#080e1a',
                                    border: '2px solid rgba(255,255,255,0.14)',
                                    borderRadius: 36,
                                    overflow: 'hidden',
                                    boxShadow: '0 40px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.05)',
                                    position: 'relative', zIndex: 1,
                                }}
                            >
                                {/* Notch */}
                                <div style={{
                                    height: 28,
                                    background: '#040810',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                }}>
                                    <div style={{
                                        width: 70, height: 12,
                                        background: '#020406',
                                        borderRadius: 8,
                                    }} />
                                </div>

                                {/* Screen content */}
                                <div style={{
                                    padding: '14px 16px 20px',
                                    background: 'linear-gradient(180deg,#0a1628 0%,#0d1f38 100%)',
                                }}>
                                    <div style={{ fontSize: 10, opacity: 0.4, marginBottom: 8, letterSpacing: '1px' }}>
                                        SKYCAST
                                    </div>
                                    <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 2 }}>
                                        Colombo, Sri Lanka 🇱🇰
                                    </div>
                                    <div style={{ fontSize: 10, opacity: 0.4, marginBottom: 14 }}>
                                        Friday · Live Data
                                    </div>

                                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                                        <motion.div
                                            animate={{ rotate: [0, 5, -5, 0] }}
                                            transition={{ duration: 3, repeat: Infinity }}
                                            style={{ fontSize: 44 }}
                                        >⛅</motion.div>
                                        <div>
                                            <div style={{ fontSize: 42, fontWeight: 100, letterSpacing: -3, lineHeight: 1 }}>
                                                29<sup style={{ fontSize: 18, opacity: 0.7 }}>°C</sup>
                                            </div>
                                            <div style={{ fontSize: 11, opacity: 0.55, marginTop: 2 }}>Feels like 34°C</div>
                                        </div>
                                    </div>

                                    <div style={{
                                        fontSize: 12, opacity: 0.6,
                                        marginBottom: 14, textTransform: 'capitalize',
                                    }}>
                                        Scattered Clouds · SW Monsoon
                                    </div>

                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                        {[
                                            { l: '💧 Humidity', v: '82%' },
                                            { l: '💨 Wind', v: '18 km/h SW' },
                                            { l: '☔ Rain', v: '60%' },
                                            { l: '☀️ UV', v: '7 High' },
                                        ].map(({ l, v }) => (
                                            <div key={l} style={{
                                                display: 'flex', justifyContent: 'space-between',
                                                fontSize: 10, padding: '4px 8px',
                                                background: 'rgba(255,255,255,0.05)',
                                                borderRadius: 8,
                                            }}>
                                                <span style={{ opacity: 0.5 }}>{l}</span>
                                                <span style={{ fontWeight: 600 }}>{v}</span>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Mini hour strip */}
                                    <div style={{
                                        display: 'flex', gap: 4, marginTop: 14,
                                        justifyContent: 'space-between',
                                    }}>
                                        {['NOW', '3PM', '6PM', '9PM', '12AM'].map((t, i) => (
                                            <div key={t} style={{
                                                flex: 1, textAlign: 'center', fontSize: 9,
                                                padding: '5px 2px',
                                                background: i === 0
                                                    ? 'rgba(59,130,246,0.25)'
                                                    : 'rgba(255,255,255,0.04)',
                                                borderRadius: 8,
                                            }}>
                                                <div style={{ opacity: 0.4, marginBottom: 2 }}>{t}</div>
                                                <div>{['⛅', '🌧️', '⛈️', '🌙', '🌙'][i]}</div>
                                                <div style={{ fontWeight: 600, fontSize: 10 }}>
                                                    {[29, 27, 25, 24, 23][i]}°
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Home bar */}
                                <div style={{
                                    height: 28,
                                    background: '#040810',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                }}>
                                    <div style={{
                                        width: 80, height: 3,
                                        background: 'rgba(255,255,255,0.2)',
                                        borderRadius: 2,
                                    }} />
                                </div>
                            </motion.div>
                        </div>
                    </motion.div>
                </div>
            </div>

            {/* ══ STATS BAR ══════════════════════════════════════ */}
            <FadeUp delay={0.05}>
                <div style={{
                    margin: '0 48px 28px',
                    background: 'linear-gradient(135deg, rgba(59,130,246,0.18) 0%, rgba(99,102,241,0.12) 100%)',
                    border: '1px solid rgba(96,165,250,0.25)',
                    borderRadius: 20,
                    display: 'grid', gridTemplateColumns: 'repeat(4,1fr)',
                    overflow: 'hidden',
                }}>
                    {[
                        { icon: '🌍', num: 200000, suf: '+', label: 'Cities Covered' },
                        { icon: '📡', num: 99, suf: '.9%', label: 'Data Accuracy' },
                        { icon: '⚡', num: 5, suf: 'min', label: 'Update Frequency' },
                        { icon: '🕐', num: 24, suf: '/7', label: 'Live Monitoring' },
                    ].map(({ icon, num, suf, label }, i) => (
                        <div key={label} style={{
                            padding: '28px 20px',
                            textAlign: 'center',
                            borderRight: i < 3 ? '1px solid rgba(255,255,255,0.08)' : 'none',
                        }}>
                            <div style={{ fontSize: 24, marginBottom: 8 }}>{icon}</div>
                            <div style={{
                                fontSize: 36, fontWeight: 200,
                                letterSpacing: '-1px', lineHeight: 1,
                                color: '#60a5fa',
                            }}>
                                <Counter to={num} suffix={suf} />
                            </div>
                            <div style={{ fontSize: 12, opacity: 0.45, marginTop: 6 }}>{label}</div>
                        </div>
                    ))}
                </div>
            </FadeUp>

            {/* ══ FEATURES ═══════════════════════════════════════ */}
            <div style={{ padding: '0 48px', marginBottom: 28 }}>
                <FadeUp>
                    <div style={{ marginBottom: 22 }}>
                        <div style={{
                            fontSize: 11, fontWeight: 700, textTransform: 'uppercase',
                            letterSpacing: '2px', color: '#60a5fa', marginBottom: 8,
                        }}>
                            What We Built
                        </div>
                        <h2 style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-1px' }}>
                            Every feature crafted with care
                        </h2>
                    </div>
                </FadeUp>

                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3,1fr)',
                    gap: 14,
                }}>
                    {FEATURES.map((f, i) => (
                        <FadeUp key={f.title} delay={i * 0.07}>
                            <GCard>
                                <div style={{
                                    width: 44, height: 44, borderRadius: 14,
                                    background: `${f.color}20`,
                                    border: `1px solid ${f.color}40`,
                                    display: 'flex', alignItems: 'center',
                                    justifyContent: 'center', fontSize: 22, marginBottom: 14,
                                }}>
                                    {f.icon}
                                </div>
                                <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 8 }}>
                                    {f.title}
                                </div>
                                <div style={{ fontSize: 12, opacity: 0.5, lineHeight: 1.7 }}>
                                    {f.desc}
                                </div>
                                {/* Accent line */}
                                <div style={{
                                    height: 2, borderRadius: 2, marginTop: 16,
                                    background: `linear-gradient(90deg, ${f.color}60, transparent)`,
                                }} />
                            </GCard>
                        </FadeUp>
                    ))}
                </div>
            </div>

            {/* ══ TIMELINE ═══════════════════════════════════════ */}
            <div style={{ padding: '0 48px', marginBottom: 28 }}>
                <FadeUp>
                    <div style={{ marginBottom: 22 }}>
                        <div style={{
                            fontSize: 11, fontWeight: 700, textTransform: 'uppercase',
                            letterSpacing: '2px', color: '#a78bfa', marginBottom: 8,
                        }}>
                            Our Journey
                        </div>
                        <h2 style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-1px' }}>
                            How SkyCast came to life
                        </h2>
                    </div>
                </FadeUp>

                <div style={{ position: 'relative' }}>
                    {/* Vertical line */}
                    <div style={{
                        position: 'absolute',
                        left: 28, top: 0, bottom: 0,
                        width: 2,
                        background: 'linear-gradient(180deg,#3b82f6,#7c3aed,rgba(255,255,255,0))',
                        borderRadius: 2,
                    }} />

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                        {TIMELINE.map((t, i) => (
                            <FadeUp key={t.title} delay={i * 0.08}>
                                <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>
                                    {/* Dot */}
                                    <div style={{
                                        width: 56, height: 56, borderRadius: '50%',
                                        background: 'rgba(59,130,246,0.15)',
                                        border: '2px solid rgba(96,165,250,0.35)',
                                        display: 'flex', alignItems: 'center',
                                        justifyContent: 'center', fontSize: 22, flexShrink: 0,
                                        position: 'relative', zIndex: 1,
                                    }}>
                                        {t.icon}
                                    </div>
                                    <GCard style={{ flex: 1 }} hover={false}>
                                        <div style={{
                                            display: 'flex', alignItems: 'center',
                                            gap: 10, marginBottom: 8,
                                        }}>
                                            <span style={{
                                                fontSize: 10, fontWeight: 700,
                                                background: 'rgba(96,165,250,0.15)',
                                                border: '1px solid rgba(96,165,250,0.25)',
                                                color: '#93c5fd', padding: '2px 10px',
                                                borderRadius: 50, letterSpacing: '0.5px',
                                            }}>{t.year}</span>
                                            <div style={{ fontSize: 14, fontWeight: 700 }}>{t.title}</div>
                                        </div>
                                        <div style={{ fontSize: 12, opacity: 0.5, lineHeight: 1.7 }}>
                                            {t.desc}
                                        </div>
                                    </GCard>
                                </div>
                            </FadeUp>
                        ))}
                    </div>
                </div>
            </div>

            {/* ══ TEAM ═══════════════════════════════════════════ */}
            <div style={{ padding: '0 48px', marginBottom: 28 }}>
                <FadeUp>
                    <div style={{ marginBottom: 22 }}>
                        <div style={{
                            fontSize: 11, fontWeight: 700, textTransform: 'uppercase',
                            letterSpacing: '2px', color: '#34d399', marginBottom: 8,
                        }}>
                            Behind SkyCast
                        </div>
                        <h2 style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-1px' }}>
                            Built by developers, powered by data
                        </h2>
                    </div>
                </FadeUp>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14 }}>
                    {TEAM.map((m, i) => (
                        <FadeUp key={m.name} delay={i * 0.1}>
                            <GCard>
                                {/* Avatar */}
                                <div style={{
                                    width: 64, height: 64, borderRadius: '50%',
                                    background: `${m.color}20`,
                                    border: `2px solid ${m.color}45`,
                                    display: 'flex', alignItems: 'center',
                                    justifyContent: 'center', fontSize: 30,
                                    marginBottom: 16,
                                }}>
                                    {m.emoji}
                                </div>

                                <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 3 }}>
                                    {m.name}
                                </div>
                                <div style={{
                                    fontSize: 11, fontWeight: 600,
                                    color: m.color, marginBottom: 10,
                                    textTransform: 'uppercase', letterSpacing: '0.8px',
                                }}>
                                    {m.role}
                                </div>
                                <div style={{ fontSize: 12, opacity: 0.5, lineHeight: 1.7, marginBottom: 14 }}>
                                    {m.desc}
                                </div>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                                    {m.skills.map(s => (
                                        <span key={s} className="skill-pill">{s}</span>
                                    ))}
                                </div>
                            </GCard>
                        </FadeUp>
                    ))}
                </div>
            </div>

            {/* ══ CTA BANNER ═════════════════════════════════════ */}
            <FadeUp>
                <div style={{
                    margin: '0 48px 48px',
                    background: 'linear-gradient(135deg,rgba(59,130,246,0.22) 0%,rgba(124,58,237,0.18) 100%)',
                    border: '1px solid rgba(96,165,250,0.25)',
                    borderRadius: 24, padding: '36px 40px',
                    display: 'flex', alignItems: 'center',
                    justifyContent: 'space-between', gap: 24,
                    position: 'relative', overflow: 'hidden',
                }}>
                    {/* BG decoration */}
                    <div style={{
                        position: 'absolute', right: -60, top: -60,
                        width: 300, height: 300, borderRadius: '50%',
                        background: 'radial-gradient(circle,rgba(124,58,237,0.15),transparent 70%)',
                        pointerEvents: 'none',
                    }} />

                    <div style={{ position: 'relative', zIndex: 1 }}>
                        <div style={{
                            fontSize: 11, fontWeight: 700,
                            textTransform: 'uppercase', letterSpacing: '1.5px',
                            color: '#93c5fd', marginBottom: 10,
                        }}>
                            Open Source · Made in Sri Lanka 🇱🇰
                        </div>
                        <h3 style={{
                            fontSize: 26, fontWeight: 800,
                            letterSpacing: '-0.8px', marginBottom: 10,
                        }}>
                            SkyCast is free, forever.
                        </h3>
                        <p style={{ fontSize: 13, opacity: 0.55, maxWidth: 440, lineHeight: 1.7 }}>
                            No subscriptions. No ads. No paywalls. Built as a portfolio project
                            and shared with the Sri Lanka developer community. Fork it, learn from it,
                            build on it.
                        </p>
                    </div>

                    <div style={{
                        display: 'flex', flexDirection: 'column',
                        gap: 10, flexShrink: 0, position: 'relative', zIndex: 1,
                    }}>
                        <motion.a
                            href="https://github.com/Gihan-Benaragama"
                            target="_blank"
                            rel="noreferrer"
                            whileHover={{ scale: 1.03 }}
                            whileTap={{ scale: 0.97 }}
                            style={{
                                display: 'flex', alignItems: 'center', gap: 8,
                                padding: '12px 24px',
                                background: 'linear-gradient(135deg,#3b82f6,#1d4ed8)',
                                border: 'none', borderRadius: 50,
                                color: '#fff', fontSize: 13, fontWeight: 700,
                                cursor: 'pointer', textDecoration: 'none',
                                boxShadow: '0 8px 24px rgba(59,130,246,0.35)',
                            }}
                        >
                            💻 View on GitHub
                        </motion.a>
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.97 }}
                            style={{
                                padding: '11px 24px',
                                background: 'rgba(255,255,255,0.08)',
                                border: '1px solid rgba(255,255,255,0.15)',
                                borderRadius: 50, color: 'rgba(255,255,255,0.75)',
                                fontSize: 13, fontWeight: 500, cursor: 'pointer',
                            }}
                        >
                            📧 Contact Developer
                        </motion.button>
                    </div>
                </div>
            </FadeUp>
        </div>
    );
}
