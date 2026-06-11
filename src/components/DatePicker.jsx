import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function DatePicker({ selectedDate, onSelect }) {
    const [open, setOpen] = useState(false);
    const [viewMonth, setViewMonth] = useState(new Date().getMonth());
    const [viewYear, setViewYear] = useState(new Date().getFullYear());

    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    // Min = 1 year back, Max = 5 days forward
    const minDate = new Date(today);
    minDate.setFullYear(minDate.getFullYear() - 1);
    const maxDate = new Date(today);
    maxDate.setDate(maxDate.getDate() + 5);

    function formatDisplay(dateStr) {
        if (!dateStr) return 'Select Date';
        const d = new Date(dateStr);
        const diff = Math.round((d - today) / (1000 * 60 * 60 * 24));
        if (diff === 0) return 'Today';
        if (diff === 1) return 'Tomorrow';
        if (diff === -1) return 'Yesterday';
        if (diff > 1) return `In ${diff} days`;
        if (diff < -1) return `${Math.abs(diff)} days ago`;
        return d.toLocaleDateString('en-LK', { month: 'short', day: 'numeric', year: 'numeric' });
    }

    function getDayLabel(dateStr) {
        const d = new Date(dateStr);
        const diff = Math.round((d - today) / (1000 * 60 * 60 * 24));
        if (diff === 0) return { label: 'Today', color: '#60a5fa' };
        if (diff === 1) return { label: 'Tomorrow', color: '#34d399' };
        if (diff === -1) return { label: 'Yesterday', color: '#a78bfa' };
        if (diff > 1) return { label: `+${diff}d`, color: '#34d399' };
        return { label: `${Math.abs(diff)}d ago`, color: '#a78bfa' };
    }

    function getDaysInMonth(month, year) {
        return new Date(year, month + 1, 0).getDate();
    }

    function getFirstDayOfMonth(month, year) {
        return new Date(year, month, 1).getDay();
    }

    function isDisabled(y, m, d) {
        const dateStr = `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        const date = new Date(dateStr);
        return date < minDate || date > maxDate;
    }

    function isSelected(y, m, d) {
        const dateStr = `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        return dateStr === selectedDate;
    }

    function isToday(y, m, d) {
        const dateStr = `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        return dateStr === todayStr;
    }

    function isFuture(y, m, d) {
        const dateStr = `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        return new Date(dateStr) > today;
    }

    function handleDayClick(y, m, d) {
        if (isDisabled(y, m, d)) return;
        const dateStr = `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        onSelect(dateStr);
        setOpen(false);
    }

    function prevMonth() {
        if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
        else setViewMonth(m => m - 1);
    }

    function nextMonth() {
        if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
        else setViewMonth(m => m + 1);
    }

    // Quick picks
    function quickSelect(diff) {
        const d = new Date(today);
        d.setDate(d.getDate() + diff);
        const str = d.toISOString().split('T')[0];
        onSelect(str);
        setOpen(false);
    }

    const days = getDaysInMonth(viewMonth, viewYear);
    const firstDay = getFirstDayOfMonth(viewMonth, viewYear);
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const dayNames = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

    const { label: selLabel, color: selColor } = selectedDate
        ? getDayLabel(selectedDate) : { label: '', color: '#fff' };

    return (
        <div style={{ position: 'relative' }}>

            {/* Trigger */}
            <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setOpen(!open)}
                style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '10px 18px',
                    background: open ? 'rgba(59,130,246,0.2)' : 'rgba(0,0,0,0.3)',
                    backdropFilter: 'blur(20px)',
                    WebkitBackdropFilter: 'blur(20px)',
                    border: `1px solid ${open ? 'rgba(96,165,250,0.45)' : 'rgba(255,255,255,0.14)'}`,
                    borderRadius: 50, cursor: 'pointer', color: '#fff',
                    transition: 'all 0.2s',
                    userSelect: 'none',
                }}
            >
                <span style={{ fontSize: 16 }}>📅</span>
                <div>
                    <div style={{ fontSize: 13, fontWeight: 700 }}>
                        {selectedDate
                            ? new Date(selectedDate).toLocaleDateString('en-LK', { month: 'short', day: 'numeric', year: 'numeric' })
                            : 'Select Date'}
                    </div>
                    {selectedDate && (
                        <div style={{ fontSize: 10, color: selColor, fontWeight: 600, marginTop: 1 }}>
                            {selLabel}
                        </div>
                    )}
                </div>
                <span style={{
                    fontSize: 10, opacity: 0.5, marginLeft: 2,
                    transform: open ? 'rotate(180deg)' : 'rotate(0)',
                    transition: 'transform 0.2s', display: 'block',
                }}>▼</span>
            </motion.div>

            {/* Calendar dropdown */}
            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ opacity: 0, y: -10, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.96 }}
                        transition={{ duration: 0.18 }}
                        style={{
                            position: 'absolute', top: 'calc(100% + 10px)',
                            left: '50%', transform: 'translateX(-50%)',
                            width: 300, zIndex: 2000,
                            background: 'rgba(6,10,18,0.97)',
                            backdropFilter: 'blur(30px)',
                            WebkitBackdropFilter: 'blur(30px)',
                            borderRadius: 20,
                            border: '1px solid rgba(255,255,255,0.12)',
                            boxShadow: '0 32px 80px rgba(0,0,0,0.8)',
                            overflow: 'hidden',
                        }}
                    >
                        {/* Quick picks */}
                        <div style={{
                            padding: '12px 14px 8px',
                            borderBottom: '1px solid rgba(255,255,255,0.07)',
                        }}>
                            <div style={{
                                fontSize: 9, fontWeight: 700, textTransform: 'uppercase',
                                letterSpacing: '1.3px', opacity: 0.38, marginBottom: 8,
                            }}>Quick Select</div>
                            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                                {[
                                    { label: 'Yesterday', diff: -1, color: '#a78bfa' },
                                    { label: 'Today', diff: 0, color: '#60a5fa' },
                                    { label: 'Tomorrow', diff: 1, color: '#34d399' },
                                    { label: '+3 Days', diff: 3, color: '#34d399' },
                                    { label: '+5 Days', diff: 5, color: '#34d399' },
                                    { label: '7 Days ago', diff: -7, color: '#a78bfa' },
                                    { label: '1 Month ago', diff: -30, color: '#a78bfa' },
                                ].map(q => (
                                    <div
                                        key={q.label}
                                        onClick={() => quickSelect(q.diff)}
                                        style={{
                                            padding: '4px 10px', borderRadius: 50,
                                            fontSize: 11, fontWeight: 600,
                                            background: `${q.color}20`,
                                            border: `1px solid ${q.color}40`,
                                            color: q.color, cursor: 'pointer',
                                            transition: 'all 0.15s',
                                        }}
                                        onMouseEnter={e => e.currentTarget.style.background = `${q.color}35`}
                                        onMouseLeave={e => e.currentTarget.style.background = `${q.color}20`}
                                    >
                                        {q.label}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Month navigation */}
                        <div style={{
                            display: 'flex', alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '12px 16px 8px',
                        }}>
                            <button
                                onClick={prevMonth}
                                style={{
                                    background: 'rgba(255,255,255,0.08)',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    borderRadius: '50%', width: 28, height: 28,
                                    color: '#fff', cursor: 'pointer',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: 14,
                                }}
                            >‹</button>
                            <div style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>
                                {monthNames[viewMonth]} {viewYear}
                            </div>
                            <button
                                onClick={nextMonth}
                                style={{
                                    background: 'rgba(255,255,255,0.08)',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    borderRadius: '50%', width: 28, height: 28,
                                    color: '#fff', cursor: 'pointer',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: 14,
                                }}
                            >›</button>
                        </div>

                        {/* Day headers */}
                        <div style={{
                            display: 'grid', gridTemplateColumns: 'repeat(7,1fr)',
                            padding: '0 12px', gap: 2,
                        }}>
                            {dayNames.map(d => (
                                <div key={d} style={{
                                    textAlign: 'center', fontSize: 10,
                                    fontWeight: 700, opacity: 0.35,
                                    padding: '4px 0',
                                    color: d === 'Su' || d === 'Sa' ? '#f87171' : '#fff',
                                }}>{d}</div>
                            ))}
                        </div>

                        {/* Calendar grid */}
                        <div style={{
                            display: 'grid', gridTemplateColumns: 'repeat(7,1fr)',
                            padding: '0 12px 12px', gap: 2,
                        }}>
                            {/* Empty cells for first day offset */}
                            {Array(firstDay).fill(null).map((_, i) => (
                                <div key={`e${i}`} />
                            ))}

                            {/* Day cells */}
                            {Array(days).fill(null).map((_, i) => {
                                const day = i + 1;
                                const disabled = isDisabled(viewYear, viewMonth, day);
                                const selected = isSelected(viewYear, viewMonth, day);
                                const todayCell = isToday(viewYear, viewMonth, day);
                                const future = isFuture(viewYear, viewMonth, day);

                                return (
                                    <motion.div
                                        key={day}
                                        whileHover={!disabled ? { scale: 1.15 } : {}}
                                        whileTap={!disabled ? { scale: 0.92 } : {}}
                                        onClick={() => handleDayClick(viewYear, viewMonth, day)}
                                        style={{
                                            aspectRatio: '1',
                                            display: 'flex', alignItems: 'center',
                                            justifyContent: 'center',
                                            borderRadius: '50%', fontSize: 12, fontWeight: 600,
                                            cursor: disabled ? 'not-allowed' : 'pointer',
                                            opacity: disabled ? 0.2 : 1,
                                            background: selected
                                                ? (future ? '#059669' : todayCell ? '#3b82f6' : '#7c3aed')
                                                : todayCell ? 'rgba(59,130,246,0.2)' : 'transparent',
                                            border: selected
                                                ? 'none'
                                                : todayCell ? '1px solid rgba(96,165,250,0.5)' : 'none',
                                            color: selected ? '#fff'
                                                : future ? '#34d399'
                                                    : todayCell ? '#60a5fa'
                                                        : 'rgba(255,255,255,0.75)',
                                            transition: 'all 0.15s',
                                        }}
                                    >
                                        {day}
                                    </motion.div>
                                );
                            })}
                        </div>

                        {/* Legend */}
                        <div style={{
                            display: 'flex', gap: 14, justifyContent: 'center',
                            padding: '8px 16px 12px',
                            borderTop: '1px solid rgba(255,255,255,0.06)',
                            fontSize: 10, opacity: 0.5,
                        }}>
                            <span style={{ color: '#60a5fa' }}>● Today</span>
                            <span style={{ color: '#34d399' }}>● Future</span>
                            <span style={{ color: '#a78bfa' }}>● Past</span>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}