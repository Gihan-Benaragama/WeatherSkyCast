import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

const sceneIcon = c => ({ Thunderstorm: '⛈️', Drizzle: '🌦️', Rain: '🌧️', Clear: '☀️', Clouds: '⛅', Snow: '❄️' }[c] || '⛅');

function CustomTooltip({ active, payload, label }) {
    if (!active || !payload?.length) return null;
    const d = payload[0].payload;
    return (
        <div style={{
            background: 'rgba(8,14,24,0.95)',
            border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: 12, padding: '10px 14px',
            backdropFilter: 'blur(20px)',
        }}>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginBottom: 4 }}>{label}</div>
            <div style={{ fontSize: 20, fontWeight: 300, color: '#fff' }}>{d.temp}°C</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginTop: 2 }}>
                ☔ {d.rain}% · 💨 {d.wind} km/h
            </div>
        </div>
    );
}

export default function HourlyForecast({ hourly }) {
    if (!hourly?.length) return null;

    return (
        <div style={{ padding: '0 48px 0' }}>
            <div style={{
                background: 'rgba(0,0,0,0.28)',
                backdropFilter: 'blur(24px)',
                WebkitBackdropFilter: 'blur(24px)',
                borderRadius: 20,
                border: '1px solid rgba(255,255,255,0.1)',
                padding: '20px 24px',
                color: '#fff',
            }}>
                {/* Header */}
                <div style={{
                    display: 'flex', alignItems: 'center',
                    justifyContent: 'space-between', marginBottom: 16,
                }}>
                    <div style={{ fontSize: 14, fontWeight: 700 }}>⏱️ Next 24 Hours</div>
                    <div style={{ fontSize: 11, opacity: 0.4 }}>3-hour intervals</div>
                </div>

                {/* Scrollable hour pills */}
                <div style={{
                    display: 'flex', gap: 8, overflowX: 'auto',
                    paddingBottom: 12, marginBottom: 16,
                    scrollbarWidth: 'none',
                }}>
                    {hourly.map((h, i) => (
                        <div key={i} style={{
                            flexShrink: 0,
                            display: 'flex', flexDirection: 'column',
                            alignItems: 'center', gap: 4,
                            padding: '10px 14px',
                            background: i === 0
                                ? 'rgba(59,130,246,0.25)'
                                : 'rgba(255,255,255,0.05)',
                            border: `1px solid ${i === 0 ? 'rgba(96,165,250,0.4)' : 'rgba(255,255,255,0.08)'}`,
                            borderRadius: 14,
                            minWidth: 68,
                        }}>
                            <div style={{ fontSize: 10, opacity: 0.55, fontWeight: 600, letterSpacing: '0.3px' }}>
                                {i === 0 ? 'NOW' : h.time}
                            </div>
                            <div style={{ fontSize: 20 }}>{sceneIcon(h.icon)}</div>
                            <div style={{ fontSize: 15, fontWeight: 600 }}>{h.temp}°</div>
                            <div style={{ fontSize: 10, color: '#60a5fa', opacity: 0.8 }}>
                                ☔{h.rain}%
                            </div>
                        </div>
                    ))}
                </div>

                {/* Temperature area chart */}
                <div style={{ height: 140 }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={hourly} margin={{ top: 8, right: 8, left: -28, bottom: 0 }}>
                            <defs>
                                <linearGradient id="tempGrad" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#60a5fa" stopOpacity={0.35} />
                                    <stop offset="95%" stopColor="#60a5fa" stopOpacity={0.02} />
                                </linearGradient>
                                <linearGradient id="rainGrad" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#818cf8" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#818cf8" stopOpacity={0.02} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                            <XAxis
                                dataKey="time"
                                tick={{ fill: 'rgba(255,255,255,0.35)', fontSize: 10 }}
                                axisLine={false} tickLine={false}
                            />
                            <YAxis
                                tick={{ fill: 'rgba(255,255,255,0.35)', fontSize: 10 }}
                                axisLine={false} tickLine={false}
                                domain={['dataMin - 2', 'dataMax + 2']}
                            />
                            <Tooltip content={<CustomTooltip />} />
                            <Area
                                type="monotone" dataKey="temp"
                                stroke="#60a5fa" strokeWidth={2}
                                fill="url(#tempGrad)"
                                dot={{ fill: '#60a5fa', r: 3, strokeWidth: 0 }}
                                activeDot={{ r: 5, fill: '#93c5fd' }}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>

                {/* Rain probability bar chart */}
                <div style={{ marginTop: 12 }}>
                    <div style={{ fontSize: 11, opacity: 0.4, marginBottom: 8, fontWeight: 600 }}>
                        ☔ RAIN PROBABILITY
                    </div>
                    <div style={{ display: 'flex', gap: 4, alignItems: 'flex-end', height: 44 }}>
                        {hourly.map((h, i) => (
                            <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
                                <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)' }}>
                                    {h.rain > 0 ? `${h.rain}%` : ''}
                                </div>
                                <div style={{
                                    width: '100%',
                                    height: Math.max(4, (h.rain / 100) * 28),
                                    background: h.rain > 60
                                        ? 'rgba(96,165,250,0.8)'
                                        : h.rain > 30
                                            ? 'rgba(96,165,250,0.5)'
                                            : 'rgba(96,165,250,0.2)',
                                    borderRadius: '3px 3px 0 0',
                                    transition: 'height 0.3s',
                                }} />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}