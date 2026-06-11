import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';

// ── Time of day detection ──────────────────────────────
function getTimeOfDay() {
    const h = new Date().getHours();
    if (h >= 5 && h < 7) return 'dawn';
    if (h >= 7 && h < 12) return 'morning';
    if (h >= 12 && h < 17) return 'afternoon';
    if (h >= 17 && h < 19) return 'dusk';
    if (h >= 19 && h < 21) return 'evening';
    return 'night';
}

const timeConfig = {
    dawn: {
        skyTop: '#1a0a2e', skyMid: '#6b21a8', skyBot: '#f97316',
        groundCol: '#1a0f05', label: 'Good Dawn',
        sunY: 0.82, sunColor: '#fb923c', sunGlow: '#fed7aa',
        stars: true, starAlpha: 0.4,
    },
    morning: {
        skyTop: '#0c1445', skyMid: '#1e40af', skyBot: '#fed7aa',
        groundCol: '#14290a', label: 'Good Morning',
        sunY: 0.55, sunColor: '#fde68a', sunGlow: '#fef3c7',
        stars: false, starAlpha: 0,
    },
    afternoon: {
        skyTop: '#0a1628', skyMid: '#1d4ed8', skyBot: '#7dd3fc',
        groundCol: '#0f2d06', label: 'Good Afternoon',
        sunY: 0.18, sunColor: '#fef08a', sunGlow: '#fefce8',
        stars: false, starAlpha: 0,
    },
    dusk: {
        skyTop: '#0f0a1a', skyMid: '#7c2d12', skyBot: '#f97316',
        groundCol: '#0a0804', label: 'Good Evening',
        sunY: 0.88, sunColor: '#fb923c', sunGlow: '#fed7aa',
        stars: true, starAlpha: 0.2,
    },
    evening: {
        skyTop: '#020408', skyMid: '#0f172a', skyBot: '#1e3a5f',
        groundCol: '#050302', label: 'Good Evening',
        sunY: 1.1, sunColor: '#f97316', sunGlow: '#fed7aa',
        stars: true, starAlpha: 0.7,
    },
    night: {
        skyTop: '#010204', skyMid: '#020b18', skyBot: '#0a1628',
        groundCol: '#020202', label: 'Good Night',
        sunY: 1.5, sunColor: '#f97316', sunGlow: '#fed7aa',
        stars: true, starAlpha: 1.0,
    },
};

export default function LocationPermission({ onAllow, onSkip, loading, error }) {
    const bgRef = useRef(null);
    const animRef = useRef(null);
    const timeOfDay = getTimeOfDay();
    const cfg = timeConfig[timeOfDay];

    // ── World map + city skyline canvas ───────────────────
    useEffect(() => {
        const canvas = bgRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        let W = canvas.width = window.innerWidth;
        let H = canvas.height = window.innerHeight;
        let tick = 0;

        const timeOfDay = getTimeOfDay();
        const cfg = timeConfig[timeOfDay];

        // ── STARS ──────────────────────────────────────────
        const stars = [];
        for (let i = 0; i < 320; i++) {
            const depth = Math.random();
            stars.push({
                x: Math.random() * W,
                y: Math.random() * H * 0.72,
                r: depth * 1.6 + 0.2,
                alpha: depth * 0.9 + 0.05,
                twinkle: Math.random() * Math.PI * 2,
                speed: Math.random() * 0.025 + 0.008,
                color: Math.random() > 0.85 ? '#ffeedd'
                    : Math.random() > 0.7 ? '#ddeeff'
                        : '#ffffff',
            });
        }

        // ── WIND STREAMS ───────────────────────────────────
        const windStreams = [];
        for (let i = 0; i < 220; i++) {
            windStreams.push({
                x: Math.random() * W,
                y: Math.random() * H * 0.78,
                len: Math.random() * 80 + 20,
                speed: Math.random() * 1.4 + 0.3,
                alpha: Math.random() * 0.12 + 0.02,
                width: Math.random() * 1.5 + 0.2,
                waveAmp: Math.random() * 18 + 4,
                waveFreq: Math.random() * 0.012 + 0.004,
                phaseOff: Math.random() * Math.PI * 2,
                hue: 195 + Math.random() * 30,
                sat: 60 + Math.random() * 20,
            });
        }

        // ── CLOUDS ─────────────────────────────────────────
        const cloudLayers = [];
        const cloudCounts = [3, 5, 4];
        const cloudDepths = [0.15, 0.45, 0.75];
        cloudCounts.forEach((count, layer) => {
            for (let i = 0; i < count; i++) {
                const depth = cloudDepths[layer] + Math.random() * 0.1;
                const blobs = [];
                const n = Math.floor(Math.random() * 6 + 4);
                const scale = depth * 1.8 + 0.5;
                for (let b = 0; b < n; b++) {
                    blobs.push({
                        ox: (b / n - 0.5) * 280 * scale,
                        oy: (Math.random() - 0.5) * 50 * scale,
                        rx: (Math.random() * 80 + 50) * scale,
                        ry: (Math.random() * 40 + 20) * scale,
                    });
                }
                const isNight = timeOfDay === 'night' || timeOfDay === 'evening';
                cloudLayers.push({
                    x: Math.random() * (W + 400) - 200,
                    y: Math.random() * H * 0.40 + 10,
                    blobs, depth,
                    speed: (depth * 0.3 + 0.04) * (i % 2 === 0 ? 1 : -0.3),
                    lightness: isNight
                        ? 12 + depth * 12
                        : timeOfDay === 'afternoon' ? 75 + depth * 20
                            : timeOfDay === 'dusk' || timeOfDay === 'dawn' ? 35 + depth * 25
                                : 55 + depth * 30,
                    alpha: depth * 0.5 + 0.15,
                });
            }
        });

        // ── BUILDINGS ──────────────────────────────────────
        const buildingDefs = [
            // Far layer (small, many)
            ...[...Array(18)].map((_, i) => ({
                layer: 0, x: i / 18 + (Math.random() * 0.02 - 0.01),
                w: 0.032 + Math.random() * 0.022,
                h: 0.08 + Math.random() * 0.10,
                floors: Math.floor(Math.random() * 8 + 3),
                style: Math.floor(Math.random() * 3),
            })),
            // Mid layer
            ...[...Array(14)].map((_, i) => ({
                layer: 1, x: i / 14 + (Math.random() * 0.03 - 0.015),
                w: 0.042 + Math.random() * 0.028,
                h: 0.12 + Math.random() * 0.14,
                floors: Math.floor(Math.random() * 10 + 5),
                style: Math.floor(Math.random() * 3),
            })),
            // Near layer (large, few)
            ...[...Array(9)].map((_, i) => ({
                layer: 2, x: i / 9 + (Math.random() * 0.04 - 0.02),
                w: 0.065 + Math.random() * 0.04,
                h: 0.18 + Math.random() * 0.18,
                floors: Math.floor(Math.random() * 14 + 8),
                style: Math.floor(Math.random() * 3),
            })),
        ];

        // Pre-generate window states per building
        const winStates = buildingDefs.map(b => {
            const cols = Math.max(2, Math.floor(b.w * W / 9));
            const rows = b.floors;
            const isNight = timeOfDay === 'night' || timeOfDay === 'evening';
            return Array(rows).fill(null).map(() =>
                Array(cols).fill(null).map(() => ({
                    on: Math.random() < (isNight ? 0.62 : 0.08),
                    warm: Math.random() > 0.3,
                    blink: Math.random() < 0.04,
                    timer: Math.floor(Math.random() * 500 + 80),
                }))
            );
        });

        // ── LIGHT BOKEH (atmospheric depth circles) ────────
        const bokeh = [];
        for (let i = 0; i < 28; i++) {
            bokeh.push({
                x: Math.random() * W,
                y: H * 0.5 + Math.random() * H * 0.5,
                r: Math.random() * 22 + 8,
                alpha: Math.random() * 0.08 + 0.015,
                hue: Math.random() > 0.5 ? 45 : 200,
                dx: (Math.random() - 0.5) * 0.15,
                dy: (Math.random() - 0.5) * 0.06,
            });
        }

        // ── HELPERS ────────────────────────────────────────
        function hex2rgb(hex) {
            const r = parseInt(hex.slice(1, 3), 16);
            const g = parseInt(hex.slice(3, 5), 16);
            const b = parseInt(hex.slice(5, 7), 16);
            return `${r},${g},${b}`;
        }

        // ── DRAW SKY ───────────────────────────────────────
        function drawSky() {
            const g = ctx.createLinearGradient(0, 0, 0, H * 0.75);

            if (timeOfDay === 'night') {
                g.addColorStop(0, '#000204');
                g.addColorStop(0.3, '#010510');
                g.addColorStop(0.7, '#020b1e');
                g.addColorStop(1, '#041428');
            } else if (timeOfDay === 'evening') {
                g.addColorStop(0, '#010306');
                g.addColorStop(0.4, '#050d1e');
                g.addColorStop(0.8, '#0a1e3a');
                g.addColorStop(1, '#102844');
            } else if (timeOfDay === 'dawn') {
                g.addColorStop(0, '#0d0318');
                g.addColorStop(0.35, '#4a0e6b');
                g.addColorStop(0.65, '#c2410c');
                g.addColorStop(0.85, '#f97316');
                g.addColorStop(1, '#fbbf24');
            } else if (timeOfDay === 'dusk') {
                g.addColorStop(0, '#08020f');
                g.addColorStop(0.3, '#5b1a8a');
                g.addColorStop(0.6, '#c2410c');
                g.addColorStop(0.82, '#ea580c');
                g.addColorStop(1, '#fcd34d');
            } else if (timeOfDay === 'morning') {
                g.addColorStop(0, '#040c22');
                g.addColorStop(0.3, '#0f2d6b');
                g.addColorStop(0.65, '#1d5fad');
                g.addColorStop(0.85, '#f0c060');
                g.addColorStop(1, '#fde9a2');
            } else { // afternoon
                g.addColorStop(0, '#020b20');
                g.addColorStop(0.25, '#0a2356');
                g.addColorStop(0.6, '#1a4fa8');
                g.addColorStop(0.85, '#2e7dd6');
                g.addColorStop(1, '#7ec8f0');
            }

            ctx.fillStyle = g;
            ctx.fillRect(0, 0, W, H);

            // Subtle horizontal light scatter
            if (timeOfDay !== 'night') {
                const scatterY = timeOfDay === 'afternoon' ? H * 0.6 : H * 0.68;
                const sg = ctx.createRadialGradient(W * 0.72, scatterY, 0, W * 0.72, scatterY, W * 0.55);
                sg.addColorStop(0, timeOfDay === 'afternoon'
                    ? 'rgba(255,240,180,0.10)'
                    : 'rgba(255,160,60,0.18)');
                sg.addColorStop(1, 'rgba(0,0,0,0)');
                ctx.fillStyle = sg;
                ctx.fillRect(0, 0, W, H);
            }
        }

        // ── DRAW STARS ─────────────────────────────────────
        function drawStars() {
            const isVisible = timeOfDay === 'night' || timeOfDay === 'evening' || timeOfDay === 'dawn' || timeOfDay === 'dusk';
            if (!isVisible) return;
            const fadeAlpha = timeOfDay === 'dusk' || timeOfDay === 'dawn' ? 0.35 : 1.0;
            stars.forEach(s => {
                s.twinkle += s.speed;
                const pulse = 0.55 + 0.45 * Math.sin(s.twinkle);
                ctx.save();
                ctx.globalAlpha = s.alpha * pulse * fadeAlpha;
                // Diffraction spike for bright stars
                if (s.r > 1.2 && s.alpha > 0.7) {
                    ctx.strokeStyle = s.color;
                    ctx.lineWidth = 0.5;
                    ctx.globalAlpha *= 0.4;
                    for (let sp = 0; sp < 4; sp++) {
                        const ang = sp * Math.PI / 4;
                        ctx.beginPath();
                        ctx.moveTo(s.x + Math.cos(ang) * s.r * 1.5, s.y + Math.sin(ang) * s.r * 1.5);
                        ctx.lineTo(s.x + Math.cos(ang) * s.r * 5, s.y + Math.sin(ang) * s.r * 5);
                        ctx.stroke();
                    }
                    ctx.globalAlpha = s.alpha * pulse * fadeAlpha;
                }
                ctx.shadowColor = s.color;
                ctx.shadowBlur = s.r * 3;
                ctx.fillStyle = s.color;
                ctx.beginPath();
                ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            });
        }

        // ── DRAW MOON ──────────────────────────────────────
        function drawMoon() {
            if (timeOfDay === 'morning' || timeOfDay === 'afternoon') return;
            const alpha = timeOfDay === 'night' ? 1 : timeOfDay === 'evening' ? 0.9 : 0.5;
            const mx = W * 0.82, my = H * 0.13;

            // Far atmospheric glow
            ctx.save();
            ctx.globalAlpha = alpha * 0.15;
            const fg = ctx.createRadialGradient(mx, my, 0, mx, my, H * 0.3);
            fg.addColorStop(0, 'rgba(200,215,255,0.8)');
            fg.addColorStop(1, 'rgba(100,140,220,0)');
            ctx.fillStyle = fg; ctx.beginPath();
            ctx.arc(mx, my, H * 0.3, 0, Math.PI * 2); ctx.fill();
            ctx.restore();

            // Corona halo ring
            ctx.save();
            ctx.globalAlpha = alpha * 0.08;
            ctx.strokeStyle = 'rgba(180,200,255,1)';
            ctx.lineWidth = 18;
            ctx.shadowColor = '#8ab0ff';
            ctx.shadowBlur = 30;
            ctx.beginPath(); ctx.arc(mx, my, 55, 0, Math.PI * 2); ctx.stroke();
            ctx.restore();

            // Moon surface gradient
            ctx.save();
            ctx.globalAlpha = alpha;
            const mg = ctx.createRadialGradient(mx - 10, my - 10, 0, mx, my, 34);
            mg.addColorStop(0, '#f8f8ff');
            mg.addColorStop(0.35, '#dde4f8');
            mg.addColorStop(0.7, '#b8c8ee');
            mg.addColorStop(1, '#8090cc');
            ctx.fillStyle = mg;
            ctx.shadowColor = '#8ab0ff';
            ctx.shadowBlur = 22;
            ctx.beginPath(); ctx.arc(mx, my, 34, 0, Math.PI * 2); ctx.fill();

            // Mare (dark patches)
            const craters = [
                { x: mx + 8, y: my + 6, r: 10, a: 0.10 },
                { x: mx - 10, y: my - 4, r: 7, a: 0.08 },
                { x: mx + 2, y: my - 12, r: 5, a: 0.07 },
                { x: mx - 5, y: my + 14, r: 6, a: 0.09 },
                { x: mx + 14, y: my - 8, r: 4, a: 0.07 },
            ];
            craters.forEach(c => {
                ctx.globalAlpha = alpha * c.a;
                ctx.fillStyle = '#3a4878';
                ctx.beginPath(); ctx.arc(c.x, c.y, c.r, 0, Math.PI * 2); ctx.fill();
            });
            ctx.restore();
        }

        // ── DRAW SUN ───────────────────────────────────────
        function drawSun() {
            const sunY = cfg.sunY;
            if (sunY > 1.02) return;

            const sx = W * 0.74;
            const sy = H * sunY;
            const isLow = sunY > 0.70;

            // Atmospheric diffusion (big soft glow)
            ctx.save();
            const diffR = isLow ? H * 0.55 : H * 0.35;
            const diff = ctx.createRadialGradient(sx, sy, 0, sx, sy, diffR);
            if (isLow) {
                diff.addColorStop(0, 'rgba(255,200,80,0.18)');
                diff.addColorStop(0.3, 'rgba(255,140,30,0.10)');
                diff.addColorStop(0.7, 'rgba(255,80,10,0.04)');
                diff.addColorStop(1, 'rgba(0,0,0,0)');
            } else {
                diff.addColorStop(0, 'rgba(255,250,200,0.14)');
                diff.addColorStop(0.4, 'rgba(255,220,100,0.05)');
                diff.addColorStop(1, 'rgba(0,0,0,0)');
            }
            ctx.fillStyle = diff; ctx.beginPath();
            ctx.arc(sx, sy, diffR, 0, Math.PI * 2); ctx.fill();
            ctx.restore();

            // Lens flare streak (horizontal light scatter)
            if (!isLow) {
                ctx.save();
                ctx.globalAlpha = 0.06;
                const lf = ctx.createLinearGradient(0, sy, W, sy);
                lf.addColorStop(0, 'rgba(255,250,200,0)');
                lf.addColorStop(0.5, 'rgba(255,250,200,1)');
                lf.addColorStop(1, 'rgba(255,250,200,0)');
                ctx.fillStyle = lf;
                ctx.fillRect(0, sy - 2, W, 4);
                ctx.restore();
            }

            // God rays (animated)
            for (let i = 0; i < 14; i++) {
                const angle = (i / 14) * Math.PI * 2 + tick * 0.003;
                const rayLen = (Math.random() * 0.3 + 0.15) * H;
                const x1 = sx + Math.cos(angle) * 52;
                const y1 = sy + Math.sin(angle) * 52;
                const x2 = sx + Math.cos(angle) * (52 + rayLen);
                const y2 = sy + Math.sin(angle) * (52 + rayLen);
                const rg = ctx.createLinearGradient(x1, y1, x2, y2);
                const rayAlpha = isLow ? 0.09 : 0.04;
                rg.addColorStop(0, `rgba(255,230,120,${rayAlpha * 2})`);
                rg.addColorStop(1, 'rgba(255,180,40,0)');
                ctx.save();
                ctx.lineWidth = (Math.random() * 24 + 8) * (isLow ? 1.4 : 0.8);
                ctx.lineCap = 'round';
                ctx.strokeStyle = rg;
                ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2);
                ctx.stroke(); ctx.restore();
            }

            // Corona
            ctx.save();
            const cor = ctx.createRadialGradient(sx, sy, 0, sx, sy, 72);
            cor.addColorStop(0, 'rgba(255,255,220,0.9)');
            cor.addColorStop(0.45, 'rgba(255,230,100,0.5)');
            cor.addColorStop(1, 'rgba(255,160,0,0)');
            ctx.fillStyle = cor; ctx.shadowColor = cfg.sunGlow;
            ctx.shadowBlur = 40; ctx.beginPath();
            ctx.arc(sx, sy, 72, 0, Math.PI * 2); ctx.fill();

            // Core disk
            const core = ctx.createRadialGradient(sx - 10, sy - 10, 0, sx, sy, isLow ? 42 : 36);
            core.addColorStop(0, '#ffffff');
            core.addColorStop(0.4, cfg.sunColor);
            core.addColorStop(1, isLow ? '#c2410c' : '#f59e0b');
            ctx.fillStyle = core; ctx.shadowBlur = 28;
            ctx.beginPath(); ctx.arc(sx, sy, isLow ? 42 : 36, 0, Math.PI * 2); ctx.fill();
            ctx.restore();
        }

        // ── DRAW CLOUDS (volumetric) ────────────────────────
        function drawClouds() {
            cloudLayers.sort((a, b) => a.depth - b.depth);
            cloudLayers.forEach(c => {
                c.x += c.speed;
                if (c.speed > 0 && c.x > W + 400) c.x = -400;
                if (c.speed < 0 && c.x < -400) c.x = W + 400;

                c.blobs.forEach(b => {
                    const bx = c.x + b.ox;
                    const by = c.y + b.oy;
                    const L = c.lightness;
                    const sat = timeOfDay === 'night' ? 6 : timeOfDay === 'dusk' || timeOfDay === 'dawn' ? 18 : 12;

                    const cg = ctx.createRadialGradient(
                        bx - b.rx * 0.28, by - b.ry * 0.35, 0,
                        bx, by, Math.max(b.rx, b.ry) * 1.15
                    );
                    cg.addColorStop(0, `hsla(210,${sat}%,${Math.min(L + 22, 98)}%,${c.alpha})`);
                    cg.addColorStop(0.42, `hsla(214,${sat + 5}%,${L}%,${c.alpha * 0.85})`);
                    cg.addColorStop(0.75, `hsla(218,${sat + 10}%,${Math.max(L - 18, 3)}%,${c.alpha * 0.55})`);
                    cg.addColorStop(1, `hsla(220,${sat + 10}%,${Math.max(L - 28, 2)}%,0)`);

                    ctx.save();
                    ctx.shadowColor = timeOfDay === 'night'
                        ? 'rgba(0,0,0,0.9)' : 'rgba(0,0,30,0.5)';
                    ctx.shadowBlur = 22;
                    ctx.shadowOffsetY = 14 * c.depth;
                    ctx.fillStyle = cg;
                    ctx.beginPath();
                    ctx.ellipse(bx, by, b.rx, b.ry, 0, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.restore();
                });
            });
        }

        // ── DRAW WORLD MAP ─────────────────────────────────
        function drawWorldMap() {
            const isNight = timeOfDay === 'night' || timeOfDay === 'evening';
            const baseA = isNight ? 0.055 : 0.072;

            // Grid
            ctx.save();
            ctx.strokeStyle = `rgba(80,160,220,${baseA * 0.5})`;
            ctx.lineWidth = 0.5;
            ctx.setLineDash([3, 9]);
            for (let i = 0; i <= 10; i++) {
                ctx.beginPath();
                ctx.moveTo(0, i * H * 0.072); ctx.lineTo(W, i * H * 0.072); ctx.stroke();
                ctx.beginPath();
                ctx.moveTo(i * W * 0.1, 0); ctx.lineTo(i * W * 0.1, H * 0.72); ctx.stroke();
            }
            ctx.setLineDash([]);
            ctx.restore();

            // Continent fills
            const continents = [
                [[0.05, 0.12], [0.10, 0.08], [0.18, 0.09], [0.23, 0.14], [0.21, 0.24], [0.16, 0.30], [0.09, 0.28], [0.06, 0.20]],
                [[0.14, 0.34], [0.20, 0.31], [0.24, 0.37], [0.22, 0.50], [0.17, 0.56], [0.13, 0.50], [0.11, 0.40]],
                [[0.41, 0.09], [0.48, 0.07], [0.53, 0.12], [0.51, 0.20], [0.44, 0.22], [0.39, 0.17]],
                [[0.43, 0.23], [0.52, 0.20], [0.56, 0.26], [0.53, 0.40], [0.48, 0.47], [0.43, 0.40], [0.41, 0.30]],
                [[0.52, 0.07], [0.63, 0.05], [0.74, 0.09], [0.80, 0.16], [0.77, 0.26], [0.68, 0.29], [0.57, 0.25], [0.52, 0.17]],
                [[0.72, 0.42], [0.81, 0.40], [0.86, 0.46], [0.82, 0.53], [0.74, 0.51]],
            ];
            continents.forEach(pts => {
                ctx.save();
                ctx.globalAlpha = baseA * 0.6;
                ctx.fillStyle = `rgba(60,180,255,1)`;
                ctx.strokeStyle = `rgba(100,220,255,1)`;
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(pts[0][0] * W, pts[0][1] * H);
                pts.slice(1).forEach(p => ctx.lineTo(p[0] * W, p[1] * H));
                ctx.closePath(); ctx.fill(); ctx.stroke();
                ctx.restore();
            });
        }

        // ── DRAW WIND ──────────────────────────────────────
        function drawWind() {
            windStreams.forEach(p => {
                p.x += p.speed;
                const waveY = p.y + Math.sin(tick * p.waveFreq + p.phaseOff) * p.waveAmp;
                if (p.x > W + p.len) { p.x = -p.len; p.y = Math.random() * H * 0.78; }

                const g = ctx.createLinearGradient(p.x, waveY, p.x + p.len, waveY);
                g.addColorStop(0, `hsla(${p.hue},${p.sat}%,75%,0)`);
                g.addColorStop(0.25, `hsla(${p.hue},${p.sat}%,80%,${p.alpha})`);
                g.addColorStop(0.75, `hsla(${p.hue},${p.sat}%,82%,${p.alpha * 0.7})`);
                g.addColorStop(1, `hsla(${p.hue},${p.sat}%,75%,0)`);

                ctx.save();
                ctx.strokeStyle = g;
                ctx.lineWidth = p.width;
                ctx.lineCap = 'round';
                ctx.beginPath();
                ctx.moveTo(p.x, waveY);
                ctx.quadraticCurveTo(
                    p.x + p.len * 0.5,
                    waveY + Math.sin(tick * 0.018 + p.x * 0.003) * p.waveAmp * 0.6,
                    p.x + p.len, waveY
                );
                ctx.stroke();
                ctx.restore();
            });
        }

        // ── DRAW SKYLINE ───────────────────────────────────
        function drawSkyline() {
            const groundY = H * 0.725;
            const isNight = timeOfDay === 'night' || timeOfDay === 'evening';
            const isDusk = timeOfDay === 'dusk' || timeOfDay === 'dawn';

            // Ground plane
            const gg = ctx.createLinearGradient(0, groundY, 0, H);
            gg.addColorStop(0, isNight ? '#030810' : isDusk ? '#0a0402' : '#06100e');
            gg.addColorStop(0.3, isNight ? '#020508' : '#050303');
            gg.addColorStop(1, '#000000');
            ctx.fillStyle = gg;
            ctx.fillRect(0, groundY, W, H - groundY);

            // Water shimmer strip
            const waterY = groundY + 2;
            const wg = ctx.createLinearGradient(0, waterY, 0, waterY + 50);
            wg.addColorStop(0, isNight
                ? 'rgba(15,40,100,0.55)'
                : isDusk ? 'rgba(120,50,10,0.35)'
                    : 'rgba(30,80,150,0.3)');
            wg.addColorStop(1, 'rgba(0,0,0,0)');
            ctx.fillStyle = wg;
            ctx.fillRect(0, waterY, W, 55);

            // Animated water ripples
            for (let r = 0; r < 5; r++) {
                const ry = waterY + 8 + r * 8;
                const rx = (tick * 0.4 + r * W * 0.22) % W;
                ctx.save();
                ctx.globalAlpha = 0.07;
                ctx.strokeStyle = isNight ? '#4080ff' : '#80c0ff';
                ctx.lineWidth = 0.8;
                ctx.beginPath();
                ctx.moveTo(rx, ry);
                ctx.lineTo(rx + 30 + r * 10, ry);
                ctx.stroke();
                ctx.restore();
            }

            // Sort buildings back to front
            const sorted = [...buildingDefs].sort((a, b) => a.layer - b.layer);

            sorted.forEach((b, bi) => {
                const bx = b.x * W;
                const bw = Math.max(8, b.w * W);
                const bh = b.h * H;
                const by = groundY - bh;
                const L = b.layer; // 0=far,1=mid,2=near

                // ── Building body with realistic material ──────
                // Each layer has different darkness (atmospheric perspective)
                const layerDark = L === 0 ? [0.08, 0.12, 0.06]
                    : L === 1 ? [0.10, 0.16, 0.08]
                        : [0.13, 0.20, 0.10];

                // Left face (lit)
                const bf = ctx.createLinearGradient(bx, by, bx + bw, by);
                if (isNight) {
                    bf.addColorStop(0, `rgba(${18 + L * 4},${28 + L * 6},${50 + L * 8},1)`);
                    bf.addColorStop(0.4, `rgba(${22 + L * 4},${34 + L * 6},${60 + L * 8},1)`);
                    bf.addColorStop(0.7, `rgba(${16 + L * 3},${24 + L * 5},${44 + L * 7},1)`);
                    bf.addColorStop(1, `rgba(${12 + L * 3},${18 + L * 4},${36 + L * 6},1)`);
                } else if (isDusk) {
                    bf.addColorStop(0, `rgba(${20 + L * 5},${12 + L * 3},${6 + L * 2},1)`);
                    bf.addColorStop(0.5, `rgba(${30 + L * 6},${18 + L * 4},${8 + L * 2},1)`);
                    bf.addColorStop(1, `rgba(${15 + L * 4},${9 + L * 2}, ${4 + L * 1},1)`);
                } else {
                    bf.addColorStop(0, `rgba(${10 + L * 4},${18 + L * 5},${28 + L * 6},1)`);
                    bf.addColorStop(0.5, `rgba(${14 + L * 5},${24 + L * 6},${38 + L * 7},1)`);
                    bf.addColorStop(1, `rgba(${8 + L * 3}, ${14 + L * 4},${22 + L * 5},1)`);
                }
                ctx.fillStyle = bf;

                // Rounded top for modern buildings
                if (b.style === 2 && bw > 20) {
                    ctx.beginPath();
                    ctx.roundRect(bx, by, bw, bh, [4, 4, 0, 0]);
                    ctx.fill();
                } else {
                    ctx.fillRect(bx, by, bw, bh);
                }

                // ── Setback / stepped facade ────────────────
                if (L >= 1 && b.floors > 10 && bw > 30) {
                    const step = bw * 0.18;
                    const stepH = bh * 0.15;
                    ctx.fillStyle = isNight
                        ? `rgba(${14 + L * 4},${22 + L * 5},${40 + L * 7},0.8)`
                        : `rgba(${8 + L * 3},${14 + L * 4},${24 + L * 5},0.8)`;
                    ctx.fillRect(bx + step, by - stepH, bw - step * 2, stepH);
                }

                // ── Antenna with blinking light ──────────────
                if (b.floors > 9 && bw > 18) {
                    const antX = bx + bw * 0.5;
                    const antY = by - bh * 0.06;
                    ctx.strokeStyle = isNight ? `rgba(20,35,65,0.9)` : `rgba(10,20,40,0.7)`;
                    ctx.lineWidth = L === 2 ? 2 : 1.2;
                    ctx.beginPath();
                    ctx.moveTo(antX, by); ctx.lineTo(antX, antY); ctx.stroke();

                    // Blink light
                    if (Math.floor(tick / 25) % 2 === 0) {
                        ctx.save();
                        ctx.globalAlpha = 0.95;
                        ctx.fillStyle = '#ff3333';
                        ctx.shadowColor = '#ff0000';
                        ctx.shadowBlur = 12;
                        ctx.beginPath();
                        ctx.arc(antX, antY, L === 2 ? 3 : 2, 0, Math.PI * 2);
                        ctx.fill();
                        ctx.restore();
                    }
                }

                // ── Rooftop details ──────────────────────────
                if (L === 2 && bw > 35) {
                    // AC units / water tanks
                    for (let ac = 0; ac < 3; ac++) {
                        const acX = bx + (ac + 1) * (bw / 4);
                        const acH = 4 + L * 2;
                        const acW = 8 + L * 3;
                        ctx.fillStyle = isNight ? 'rgba(14,24,44,0.9)' : 'rgba(10,18,32,0.8)';
                        ctx.fillRect(acX - acW / 2, by - acH, acW, acH);
                    }
                }

                // ── WINDOWS ──────────────────────────────────
                const cols = Math.max(2, Math.floor(bw / (L === 2 ? 11 : 9)));
                const rows = b.floors;
                const wW = (bw - 4) / cols;
                const wH = (bh - 4) / rows;

                for (let row = 0; row < rows; row++) {
                    for (let col = 0; col < cols; col++) {
                        const ws = winStates[bi]?.[row]?.[col];
                        if (!ws) continue;

                        ws.timer--;
                        if (ws.timer <= 0) {
                            ws.timer = Math.floor(Math.random() * 600 + 150);
                            if (ws.blink || Math.random() < 0.015) ws.on = !ws.on;
                        }

                        if (!ws.on) continue;

                        const wx = bx + 2 + col * wW;
                        const wy = by + 2 + row * wH;
                        const wWi = Math.max(1, wW - 1.5);
                        const wHi = Math.max(1, wH - 1.5);

                        // Window colour: warm yellow or cool blue-white
                        const winA = isNight
                            ? 0.82 - L * 0.05
                            : 0.15 - L * 0.02;

                        const winColor = ws.warm
                            ? `rgba(255,${200 + Math.floor(Math.random() * 30)},80,${winA})`
                            : `rgba(180,210,255,${winA * 0.85})`;

                        ctx.save();
                        ctx.fillStyle = winColor;
                        ctx.shadowColor = ws.warm ? '#ffcc44' : '#88aaff';
                        ctx.shadowBlur = isNight ? (L === 2 ? 8 : 4) : 1;
                        ctx.globalAlpha = 1;
                        ctx.fillRect(wx, wy, wWi, wHi);

                        // Window frame reflection
                        if (isNight && L === 2) {
                            ctx.globalAlpha = 0.12;
                            ctx.fillStyle = '#ffffff';
                            ctx.fillRect(wx, wy, wWi * 0.35, wHi);
                        }
                        ctx.restore();
                    }
                }

                // ── Building edge highlight (light rim) ──────
                if (L >= 1) {
                    ctx.save();
                    ctx.globalAlpha = isNight ? 0.12 : 0.06;
                    ctx.strokeStyle = isDusk
                        ? 'rgba(255,140,40,1)'
                        : isNight ? 'rgba(80,140,255,1)' : 'rgba(120,180,255,1)';
                    ctx.lineWidth = L === 2 ? 1.2 : 0.6;
                    ctx.strokeRect(bx, by, bw, bh);
                    ctx.restore();
                }

                // ── Water reflection per building ─────────────
                ctx.save();
                ctx.globalAlpha = isNight ? 0.10 : 0.04;
                const reflGrad = ctx.createLinearGradient(0, groundY, 0, groundY + bh * 0.35);
                reflGrad.addColorStop(0, isNight ? '#102040' : '#203050');
                reflGrad.addColorStop(1, 'rgba(0,0,0,0)');
                ctx.fillStyle = reflGrad;
                ctx.transform(1, 0, 0, -1, 0, groundY * 2);
                ctx.fillRect(bx, by, bw, bh * 0.35);
                ctx.restore();
            });

            // Bokeh light points in foreground
            bokeh.forEach(bk => {
                bk.x += bk.dx; bk.y += bk.dy;
                if (bk.x < -50) bk.x = W + 50; if (bk.x > W + 50) bk.x = -50;
                if (bk.y < groundY * 0.8) bk.dy = Math.abs(bk.dy);
                if (bk.y > H) bk.dy = -Math.abs(bk.dy);
                const bg = ctx.createRadialGradient(bk.x, bk.y, 0, bk.x, bk.y, bk.r);
                bg.addColorStop(0, `hsla(${bk.hue},80%,80%,${bk.alpha * 1.8})`);
                bg.addColorStop(0.4, `hsla(${bk.hue},70%,70%,${bk.alpha * 0.8})`);
                bg.addColorStop(1, 'rgba(0,0,0,0)');
                ctx.fillStyle = bg;
                ctx.beginPath(); ctx.arc(bk.x, bk.y, bk.r, 0, Math.PI * 2); ctx.fill();
            });

            // City label
            ctx.save();
            ctx.globalAlpha = 0.28;
            ctx.fillStyle = '#ffffff';
            ctx.font = `500 10px 'Segoe UI',sans-serif`;
            ctx.letterSpacing = '4px';
            ctx.textAlign = 'center';
            ctx.fillText('COLOMBO  ·  SRI LANKA', W * 0.5, groundY - 10);
            ctx.restore();
        }

        // ── CINEMATIC GRADE ────────────────────────────────
        function drawGrade() {
            // Vignette
            const vg = ctx.createRadialGradient(W * 0.5, H * 0.48, H * 0.12, W * 0.5, H * 0.48, H * 0.82);
            const vigStr = timeOfDay === 'night' ? 0.82
                : timeOfDay === 'evening' ? 0.70 : 0.55;
            vg.addColorStop(0, 'rgba(0,0,0,0)');
            vg.addColorStop(1, `rgba(0,0,0,${vigStr})`);
            ctx.fillStyle = vg; ctx.fillRect(0, 0, W, H);

            // Top darkening
            const tg = ctx.createLinearGradient(0, 0, 0, H * 0.2);
            tg.addColorStop(0, `rgba(0,0,0,${timeOfDay === 'night' ? 0.55 : 0.32})`);
            tg.addColorStop(1, 'rgba(0,0,0,0)');
            ctx.fillStyle = tg; ctx.fillRect(0, 0, W, H * 0.2);

            // Bottom ground crush
            const bg = ctx.createLinearGradient(0, H * 0.78, 0, H);
            bg.addColorStop(0, 'rgba(0,0,0,0)');
            bg.addColorStop(1, 'rgba(0,0,0,0.88)');
            ctx.fillStyle = bg; ctx.fillRect(0, H * 0.78, W, H * 0.22);

            // Subtle film grain
            ctx.save();
            ctx.globalAlpha = 0.016;
            for (let i = 0; i < 700; i++) {
                ctx.fillStyle = `rgba(255,255,255,${Math.random()})`;
                ctx.fillRect(Math.random() * W, Math.random() * H, Math.random() * 1.5, Math.random() * 1.5);
            }
            ctx.restore();
        }

        // ── MAIN LOOP ───────────────────────────────────────
        function animate() {
            tick++;
            ctx.clearRect(0, 0, W, H);
            drawSky();
            drawStars();
            drawMoon();
            drawSun();
            drawWorldMap();
            drawClouds();
            drawWind();
            drawSkyline();
            drawGrade();
            animRef.current = requestAnimationFrame(animate);
        }

        function handleResize() {
            W = canvas.width = window.innerWidth;
            H = canvas.height = window.innerHeight;
        }

        window.addEventListener('resize', handleResize);
        animate();

        return () => {
            cancelAnimationFrame(animRef.current);
            window.removeEventListener('resize', handleResize);
        };
    }, []);
    return (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999 }}>

            {/* Animated background canvas */}
            <canvas
                ref={bgRef}
                style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
            />

            {/* Centered card */}
            <div style={{
                position: 'absolute', inset: 0,
                display: 'flex', alignItems: 'center',
                justifyContent: 'center', padding: 24,
            }}>
                <motion.div
                    initial={{ opacity: 0, y: 32, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.6, ease: 'easeOut' }}
                    style={{
                        position: 'relative', zIndex: 10,
                        textAlign: 'center', width: '100%', maxWidth: 420,
                        background: 'rgba(6,10,18,0.82)',
                        backdropFilter: 'blur(32px)',
                        WebkitBackdropFilter: 'blur(32px)',
                        borderRadius: 28,
                        border: '1px solid rgba(255,255,255,0.1)',
                        padding: '40px 36px 36px',
                        boxShadow: '0 40px 100px rgba(0,0,0,0.8)',
                        overflow: 'hidden',
                    }}
                >
                    {/* Card top shimmer */}
                    <div style={{
                        position: 'absolute', top: 0, left: '20%', right: '20%', height: 1,
                        background: 'linear-gradient(90deg,transparent,rgba(255,255,255,0.2),transparent)',
                    }} />

                    {/* Time of day badge */}
                    <div style={{
                        display: 'inline-flex', alignItems: 'center', gap: 8,
                        background: 'rgba(255,255,255,0.06)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: 50, padding: '5px 16px',
                        fontSize: 12, color: 'rgba(255,255,255,0.6)',
                        marginBottom: 20,
                    }}>
                        <span style={{ fontSize: 16 }}>
                            {timeOfDay === 'morning' ? '🌅'
                                : timeOfDay === 'afternoon' ? '☀️'
                                    : timeOfDay === 'dusk' ? '🌇'
                                        : timeOfDay === 'evening' ? '🌆'
                                            : timeOfDay === 'dawn' ? '🌄'
                                                : '🌙'}
                        </span>
                        {cfg.label}
                        <span style={{ opacity: 0.4 }}>·</span>
                        <span style={{ color: '#60a5fa' }}>Colombo</span>
                    </div>

                    {/* Icon */}
                    <motion.div
                        animate={{ y: [0, -8, 0] }}
                        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                        style={{
                            width: 72, height: 72, borderRadius: '50%',
                            background: 'rgba(59,130,246,0.15)',
                            border: '1px solid rgba(96,165,250,0.25)',
                            display: 'flex', alignItems: 'center',
                            justifyContent: 'center', fontSize: 34,
                            margin: '0 auto 20px',
                        }}
                    >
                        📍
                    </motion.div>

                    {/* App name */}
                    <div style={{
                        fontSize: 13, fontWeight: 700, textTransform: 'uppercase',
                        letterSpacing: '2px', color: '#60a5fa', marginBottom: 8,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                    }}>
                        <span>⛅</span> SKYCAST
                    </div>

                    <h2 style={{
                        fontSize: 26, fontWeight: 800, color: '#fff',
                        marginBottom: 10, letterSpacing: '-0.5px', lineHeight: 1.2,
                    }}>
                        Know Your Weather
                    </h2>

                    <p style={{
                        fontSize: 13, color: 'rgba(255,255,255,0.5)',
                        lineHeight: 1.7, marginBottom: 24,
                    }}>
                        Allow SkyCast to access your location for real-time
                        weather conditions, animated skies, and accurate
                        forecasts wherever you are.
                    </p>

                    {/* Features */}
                    {[
                        { icon: '⚡', text: 'Real-time weather updates' },
                        { icon: '🎬', text: 'Cinematic animated backgrounds' },
                        { icon: '📅', text: 'Past & future date weather' },
                    ].map((f, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, x: -16 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.2 + i * 0.1 }}
                            style={{
                                display: 'flex', alignItems: 'center', gap: 12,
                                padding: '9px 16px', borderRadius: 12, marginBottom: 8,
                                background: 'rgba(255,255,255,0.04)',
                                border: '1px solid rgba(255,255,255,0.07)',
                                textAlign: 'left',
                            }}
                        >
                            <span style={{ fontSize: 18 }}>{f.icon}</span>
                            <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)' }}>
                                {f.text}
                            </span>
                        </motion.div>
                    ))}

                    {/* Error */}
                    {error && (
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                            style={{
                                marginTop: 12, padding: '10px 14px',
                                background: 'rgba(239,68,68,0.12)',
                                border: '1px solid rgba(239,68,68,0.25)',
                                borderRadius: 12, fontSize: 12,
                                color: '#fca5a5', textAlign: 'left',
                            }}
                        >
                            ⚠️ {error}
                        </motion.div>
                    )}

                    {/* Buttons */}
                    <div style={{ marginTop: 22, display: 'flex', flexDirection: 'column', gap: 10 }}>
                        <motion.button
                            whileHover={{ scale: 1.02, boxShadow: '0 12px 32px rgba(59,130,246,0.45)' }}
                            whileTap={{ scale: 0.98 }}
                            onClick={onAllow}
                            disabled={loading}
                            style={{
                                width: '100%', padding: '14px',
                                background: loading
                                    ? 'rgba(59,130,246,0.5)'
                                    : 'linear-gradient(135deg,#3b82f6 0%,#1d4ed8 100%)',
                                border: 'none', borderRadius: 50,
                                color: '#fff', fontSize: 14, fontWeight: 700,
                                cursor: loading ? 'not-allowed' : 'pointer',
                                display: 'flex', alignItems: 'center',
                                justifyContent: 'center', gap: 8,
                                boxShadow: '0 8px 24px rgba(59,130,246,0.3)',
                                transition: 'all 0.2s',
                            }}
                        >
                            {loading ? (
                                <>
                                    <div style={{
                                        width: 16, height: 16,
                                        border: '2px solid rgba(255,255,255,0.3)',
                                        borderTopColor: '#fff', borderRadius: '50%',
                                        animation: 'spin 0.7s linear infinite',
                                    }} />
                                    Detecting location...
                                </>
                            ) : <>📍 Allow Location Access</>}
                        </motion.button>

                        <motion.button
                            whileHover={{ scale: 1.01 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={onSkip}
                            style={{
                                width: '100%', padding: '12px',
                                background: 'rgba(255,255,255,0.06)',
                                border: '1px solid rgba(255,255,255,0.1)',
                                borderRadius: 50, color: 'rgba(255,255,255,0.65)',
                                fontSize: 13, fontWeight: 500, cursor: 'pointer',
                                transition: 'all 0.2s',
                            }}
                        >
                            🔍 Search location manually
                        </motion.button>
                    </div>

                    <p style={{ marginTop: 14, fontSize: 10, opacity: 0.22 }}>
                        Location data is used only for weather. Never stored or shared.
                    </p>

                    <style>{`@keyframes spin { to { transform:rotate(360deg); } }`}</style>
                </motion.div>
            </div>
        </div>
    );
}