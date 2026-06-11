import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const alertIcons = {
    storm: '⛈️', rain: '🌧️', heat: '🌡️', wind: '💨',
};

export default function AlertBanner({ alerts }) {
    const [dismissed, setDismissed] = useState([]);
    const visible = alerts.filter(a => !dismissed.includes(a.type));
    if (!visible.length) return null;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: '0 48px' }}>
            <AnimatePresence>
                {visible.map(alert => (
                    <motion.div
                        key={alert.type}
                        initial={{ opacity: 0, y: -12, height: 0 }}
                        animate={{ opacity: 1, y: 0, height: 'auto' }}
                        exit={{ opacity: 0, y: -12, height: 0 }}
                        transition={{ duration: 0.25 }}
                        style={{
                            display: 'flex', alignItems: 'center', gap: 12,
                            padding: '10px 16px',
                            background: `${alert.color}22`,
                            border: `1px solid ${alert.color}55`,
                            borderRadius: 12,
                            backdropFilter: 'blur(16px)',
                            WebkitBackdropFilter: 'blur(16px)',
                        }}
                    >
                        {/* Pulsing dot */}
                        <div style={{ position: 'relative', flexShrink: 0 }}>
                            <div style={{
                                width: 8, height: 8, borderRadius: '50%',
                                background: alert.color,
                                boxShadow: `0 0 0 0 ${alert.color}`,
                                animation: 'alertPulse 1.5s infinite',
                            }} />
                            <style>{`
                @keyframes alertPulse {
                  0%   { box-shadow: 0 0 0 0 ${alert.color}88; }
                  70%  { box-shadow: 0 0 0 7px ${alert.color}00; }
                  100% { box-shadow: 0 0 0 0 ${alert.color}00; }
                }
              `}</style>
                        </div>

                        <span style={{ fontSize: 18 }}>{alertIcons[alert.type]}</span>

                        <div style={{ flex: 1 }}>
                            <span style={{
                                fontSize: 12, fontWeight: 700, color: '#fff',
                                marginRight: 8,
                            }}>
                                {alert.msg}
                            </span>
                            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)' }}>
                                {alert.detail}
                            </span>
                        </div>

                        <div
                            onClick={() => setDismissed(d => [...d, alert.type])}
                            style={{
                                width: 22, height: 22, borderRadius: '50%',
                                background: 'rgba(255,255,255,0.1)',
                                display: 'flex', alignItems: 'center',
                                justifyContent: 'center', cursor: 'pointer',
                                fontSize: 13, color: 'rgba(255,255,255,0.6)',
                                flexShrink: 0,
                            }}
                        >×</div>
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    );
}