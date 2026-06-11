import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getSavedLocations, saveLocation, removeLocation } from '../utils/savedLocations';

export default function SavedLocations({ currentCity, currentCoords, onSelect }) {
    const [saved, setSaved] = useState([]);
    const [open, setOpen] = useState(false);
    const [saving, setSaving] = useState(false);

    useEffect(() => { setSaved(getSavedLocations()); }, []);

    function handleSave() {
        if (!currentCity) return;
        setSaving(true);
        const loc = {
            label: currentCity,
            coords: currentCoords,
            saved: new Date().toLocaleDateString('en-LK'),
        };
        const updated = saveLocation(loc);
        setSaved(updated);
        setTimeout(() => setSaving(false), 1000);
    }

    function handleRemove(label) {
        setSaved(removeLocation(label));
    }

    function handleSelect(loc) {
        onSelect(loc.coords || loc.label, loc.label);
        setOpen(false);
    }

    const isSaved = saved.some(s => s.label === currentCity);

    return (
        <div style={{ position: 'relative' }}>

            {/* Trigger button */}
            <div
                onClick={() => setOpen(!open)}
                style={{
                    display: 'flex', alignItems: 'center', gap: 7,
                    padding: '6px 14px',
                    background: open ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.08)',
                    border: '1px solid rgba(255,255,255,0.14)',
                    borderRadius: 50,
                    cursor: 'pointer',
                    color: 'rgba(255,255,255,0.8)',
                    fontSize: 13, fontWeight: 500,
                    transition: 'all 0.2s',
                }}
            >
                <span>⭐</span>
                <span>Saved</span>
                {saved.length > 0 && (
                    <span style={{
                        background: '#3b82f6', color: '#fff',
                        borderRadius: '50%', width: 18, height: 18,
                        display: 'flex', alignItems: 'center',
                        justifyContent: 'center', fontSize: 10, fontWeight: 700,
                    }}>
                        {saved.length}
                    </span>
                )}
            </div>

            {/* Dropdown */}
            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ opacity: 0, y: -8, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -8, scale: 0.97 }}
                        transition={{ duration: 0.18 }}
                        style={{
                            position: 'absolute', top: 'calc(100% + 8px)', right: 0,
                            width: 280, zIndex: 1000,
                            background: 'rgba(8,14,24,0.96)',
                            backdropFilter: 'blur(28px)',
                            WebkitBackdropFilter: 'blur(28px)',
                            borderRadius: 18,
                            border: '1px solid rgba(255,255,255,0.12)',
                            boxShadow: '0 24px 60px rgba(0,0,0,0.7)',
                            overflow: 'hidden',
                        }}
                    >
                        {/* Save current */}
                        <div style={{
                            padding: '12px 16px',
                            borderBottom: '1px solid rgba(255,255,255,0.07)',
                        }}>
                            <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1.2px', opacity: 0.4, marginBottom: 8 }}>
                                Current Location
                            </div>
                            <div style={{
                                display: 'flex', alignItems: 'center',
                                justifyContent: 'space-between',
                            }}>
                                <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)', fontWeight: 500 }}>
                                    📍 {currentCity || 'No location'}
                                </div>
                                <button
                                    onClick={handleSave}
                                    disabled={isSaved || !currentCity}
                                    style={{
                                        padding: '4px 12px',
                                        background: isSaved ? 'rgba(251,191,36,0.2)' : 'rgba(59,130,246,0.25)',
                                        border: `1px solid ${isSaved ? 'rgba(251,191,36,0.4)' : 'rgba(96,165,250,0.4)'}`,
                                        borderRadius: 50,
                                        color: isSaved ? '#fbbf24' : '#93c5fd',
                                        fontSize: 11, fontWeight: 600,
                                        cursor: isSaved ? 'default' : 'pointer',
                                    }}
                                >
                                    {saving ? '✓ Saved!' : isSaved ? '⭐ Saved' : '+ Save'}
                                </button>
                            </div>
                        </div>

                        {/* Saved list */}
                        <div style={{ maxHeight: 280, overflowY: 'auto' }}>
                            {saved.length === 0 ? (
                                <div style={{
                                    padding: '20px 16px', textAlign: 'center',
                                    fontSize: 12, opacity: 0.35,
                                }}>
                                    No saved locations yet.<br />Save your favourite cities!
                                </div>
                            ) : (
                                <>
                                    <div style={{
                                        padding: '10px 16px 4px',
                                        fontSize: 10, fontWeight: 700,
                                        textTransform: 'uppercase', letterSpacing: '1.2px', opacity: 0.4,
                                    }}>
                                        Saved Cities ({saved.length})
                                    </div>
                                    {saved.map((loc, i) => (
                                        <div
                                            key={i}
                                            style={{
                                                display: 'flex', alignItems: 'center',
                                                padding: '9px 16px', gap: 10,
                                                borderBottom: '1px solid rgba(255,255,255,0.05)',
                                                transition: 'background 0.15s', cursor: 'pointer',
                                            }}
                                            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}
                                            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                        >
                                            <span style={{ fontSize: 18, flexShrink: 0 }}>📍</span>
                                            <div style={{ flex: 1 }} onClick={() => handleSelect(loc)}>
                                                <div style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>
                                                    {loc.label}
                                                </div>
                                                <div style={{ fontSize: 10, opacity: 0.38 }}>
                                                    Saved {loc.saved}
                                                </div>
                                            </div>
                                            <div
                                                onClick={() => handleRemove(loc.label)}
                                                style={{
                                                    width: 24, height: 24, borderRadius: '50%',
                                                    background: 'rgba(239,68,68,0.15)',
                                                    border: '1px solid rgba(239,68,68,0.25)',
                                                    display: 'flex', alignItems: 'center',
                                                    justifyContent: 'center', cursor: 'pointer',
                                                    fontSize: 13, color: '#f87171', flexShrink: 0,
                                                }}
                                            >×</div>
                                        </div>
                                    ))}
                                </>
                            )}
                        </div>

                        <div style={{
                            padding: '8px 16px',
                            fontSize: 10, opacity: 0.25,
                            borderTop: '1px solid rgba(255,255,255,0.06)',
                            textAlign: 'center',
                        }}>
                            Up to 8 locations saved locally
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}