import { motion } from 'framer-motion';

export default function DayTabs({ selectedDay, onSelect, dayData }) {
    const days = ['yesterday', 'today', 'tomorrow'];

    const getDate = (day) => {
        const d = new Date();
        if (day === 'yesterday') d.setDate(d.getDate() - 1);
        if (day === 'tomorrow') d.setDate(d.getDate() + 1);
        return d.toLocaleDateString('en-LK', { month: 'short', day: 'numeric' });
    };

    const icons = {
        yesterday: dayData?.yesterday?.scene,
        today: dayData?.today?.scene,
        tomorrow: dayData?.tomorrow?.scene,
    };

    return (
        <div className="day-tabs">
            {days.map(day => (
                <motion.div
                    key={day}
                    className={`day-tab ${selectedDay === day ? 'active' : ''}`}
                    onClick={() => onSelect(day)}
                    whileHover={{ y: -3 }}
                    whileTap={{ scale: 0.96 }}
                >
                    <div className="tab-label">{day}</div>
                    <div className="tab-date">{getDate(day)}</div>
                </motion.div>
            ))}
        </div>
    );
}