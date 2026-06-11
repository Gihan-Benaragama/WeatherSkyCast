import { useEffect, useRef } from 'react';

export default function WeatherBackground({ scene }) {
    const canvasRef = useRef(null);
    const animRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        let W, H, tick = 0;

        // ═══════════════════════════════
        // STATE
        // ═══════════════════════════════
        let rainDrops = [];
        let cloudLayers = [];
        let lightningBolts = [];
        let godRays = [];
        let emberParticles = [];
        let fogBands = [];

        // Lightning flicker engine state
        let flickerState = {
            active: false,
            phase: 'off',       // 'off' | 'flash' | 'flicker' | 'fade'
            alpha: 0,
            timer: 0,
            cooldown: 0,
            flickerCount: 0,
            flickerMax: 0,
            bolts: [],
            ambientGlow: 0,
            rumble: 0,
        };

        // ═══════════════════════════════
        // RESIZE
        // ═══════════════════════════════
        function resize() {
            W = canvas.width = window.innerWidth;
            H = canvas.height = window.innerHeight;
            buildScene();
        }

        // ═══════════════════════════════
        // BUILD SCENE
        // ═══════════════════════════════
        function buildScene() {
            rainDrops = [];
            cloudLayers = [];
            lightningBolts = [];
            godRays = [];
            emberParticles = [];
            fogBands = [];

            buildClouds();
            buildFog();
            if (scene === 'rain' || scene === 'storm') buildRain();
            if (scene === 'sunny' || scene === 'cloudy') buildGodRays();
            if (scene === 'storm') buildEmbers();
            if (scene === 'storm') {
                flickerState.cooldown = 80;
                flickerState.phase = 'off';
            }
        }

        // ─────────────────────────────
        // CLOUDS — 4 parallax layers
        // ─────────────────────────────
        function buildClouds() {
            const configs = {
                sunny: [
                    { count: 2, y: 0.05, depth: 0.2, alpha: 0.55, lightness: 95 },
                    { count: 3, y: 0.15, depth: 0.5, alpha: 0.45, lightness: 92 },
                ],
                cloudy: [
                    { count: 3, y: 0.02, depth: 0.15, alpha: 0.60, lightness: 68 },
                    { count: 4, y: 0.12, depth: 0.40, alpha: 0.70, lightness: 58 },
                    { count: 3, y: 0.22, depth: 0.70, alpha: 0.55, lightness: 48 },
                ],
                rain: [
                    { count: 4, y: 0.00, depth: 0.10, alpha: 0.70, lightness: 35 },
                    { count: 5, y: 0.08, depth: 0.35, alpha: 0.80, lightness: 28 },
                    { count: 4, y: 0.18, depth: 0.60, alpha: 0.65, lightness: 22 },
                    { count: 3, y: 0.28, depth: 0.85, alpha: 0.50, lightness: 18 },
                ],
                storm: [
                    { count: 5, y: 0.00, depth: 0.08, alpha: 0.85, lightness: 18 },
                    { count: 6, y: 0.06, depth: 0.25, alpha: 0.90, lightness: 14 },
                    { count: 5, y: 0.14, depth: 0.50, alpha: 0.80, lightness: 10 },
                    { count: 4, y: 0.22, depth: 0.75, alpha: 0.70, lightness: 8 },
                    { count: 3, y: 0.30, depth: 0.95, alpha: 0.60, lightness: 6 },
                ],
            };

            (configs[scene] || configs.cloudy).forEach(cfg => {
                for (let i = 0; i < cfg.count; i++) {
                    cloudLayers.push(makeCloud(cfg, i));
                }
            });
        }

        function makeCloud(cfg, idx) {
            const x = Math.random() * (W + 600) - 300;
            const y = H * cfg.y + Math.random() * H * 0.12;
            const scale = cfg.depth * 2.2 + 0.8;
            const blobs = [];
            const n = Math.floor(Math.random() * 5 + 5);

            for (let b = 0; b < n; b++) {
                blobs.push({
                    ox: (b / n - 0.5) * 320 * scale,
                    oy: (Math.random() - 0.5) * 60 * scale,
                    rx: (Math.random() * 90 + 60) * scale,
                    ry: (Math.random() * 50 + 30) * scale,
                    z: Math.random(), // sub-depth within cloud
                });
            }

            return {
                x, y, blobs,
                speed: (cfg.depth * 0.5 + 0.05) * (idx % 3 === 0 ? -0.5 : 1),
                alpha: cfg.alpha,
                lightness: cfg.lightness,
                depth: cfg.depth,
                // subtle vertical bob
                bobAmp: Math.random() * 6 + 2,
                bobSpeed: Math.random() * 0.008 + 0.003,
                bobOff: Math.random() * Math.PI * 2,
            };
        }

        // ─────────────────────────────
        // RAIN — 4 depth layers
        // ─────────────────────────────
        function buildRain() {
            const total = scene === 'storm' ? 900 : 480;
            for (let i = 0; i < total; i++) {
                const d = Math.random();
                const windFactor = scene === 'storm' ? 6.5 : 1.8;
                rainDrops.push({
                    x: Math.random() * W,
                    y: Math.random() * H,
                    depth: d,
                    len: d * 26 + 6,
                    speed: d * 22 + 7,
                    wind: d * windFactor + 0.5,
                    thick: d * 2.0 + 0.25,
                    alpha: d * 0.55 + 0.06,
                    // slight colour variation
                    hue: 200 + Math.random() * 20,
                    sat: 60 + Math.random() * 30,
                });
            }
        }

        // ─────────────────────────────
        // GOD RAYS
        // ─────────────────────────────
        function buildGodRays() {
            for (let i = 0; i < 8; i++) {
                godRays.push({
                    angle: (i / 8) * Math.PI * 2 + Math.random() * 0.4,
                    len: Math.random() * 200 + 120,
                    width: Math.random() * 40 + 14,
                    alpha: Math.random() * 0.07 + 0.02,
                    speed: (Math.random() * 0.4 + 0.1) * (Math.random() > 0.5 ? 1 : -1) * 0.003,
                });
            }
        }

        // ─────────────────────────────
        // EMBERS (storm debris)
        // ─────────────────────────────
        function buildEmbers() {
            for (let i = 0; i < 60; i++) {
                emberParticles.push({
                    x: Math.random() * W,
                    y: Math.random() * H,
                    r: Math.random() * 1.8 + 0.4,
                    dx: (Math.random() - 0.5) * 2.5,
                    dy: -Math.random() * 1.5 - 0.5,
                    alpha: Math.random() * 0.5 + 0.1,
                    life: Math.random(),
                });
            }
        }

        // ─────────────────────────────
        // FOG BANDS
        // ─────────────────────────────
        function buildFog() {
            const count = scene === 'storm' ? 7 : scene === 'rain' ? 5 : 3;
            for (let i = 0; i < count; i++) {
                fogBands.push({
                    y: H * (0.35 + i * 0.12),
                    speed: (Math.random() - 0.5) * 0.25,
                    alpha: Math.random() * 0.06 + 0.015,
                    height: Math.random() * 60 + 30,
                    offset: Math.random() * W,
                });
            }
        }

        // ═══════════════════════════════
        // DRAW SKY
        // ═══════════════════════════════
        function drawSky() {
            let g;
            if (scene === 'sunny') {
                g = ctx.createLinearGradient(0, 0, 0, H);
                g.addColorStop(0, '#03082e');
                g.addColorStop(0.25, '#0c2a6e');
                g.addColorStop(0.6, '#1a6db5');
                g.addColorStop(0.85, '#3a9fd4');
                g.addColorStop(1, '#7ed6f0');
            } else if (scene === 'cloudy') {
                g = ctx.createLinearGradient(0, 0, 0, H);
                g.addColorStop(0, '#080e18');
                g.addColorStop(0.3, '#111e2e');
                g.addColorStop(0.65, '#1e3248');
                g.addColorStop(1, '#2a4560');
            } else if (scene === 'rain') {
                g = ctx.createLinearGradient(0, 0, 0, H);
                g.addColorStop(0, '#05080e');
                g.addColorStop(0.4, '#0a1018');
                g.addColorStop(0.8, '#111a24');
                g.addColorStop(1, '#141e2a');
            } else { // storm
                g = ctx.createLinearGradient(0, 0, 0, H);
                g.addColorStop(0, '#020305');
                g.addColorStop(0.3, '#04060a');
                g.addColorStop(0.7, '#060a10');
                g.addColorStop(1, '#080c14');
            }
            ctx.fillStyle = g;
            ctx.fillRect(0, 0, W, H);
        }

        // ═══════════════════════════════
        // DRAW SUN + GOD RAYS
        // ═══════════════════════════════
        function drawSun() {
            const sx = W * 0.80, sy = H * 0.13;

            // Animated god rays
            godRays.forEach(r => {
                r.angle += r.speed;
                const x1 = sx + Math.cos(r.angle) * 58;
                const y1 = sy + Math.sin(r.angle) * 58;
                const x2 = sx + Math.cos(r.angle) * (58 + r.len);
                const y2 = sy + Math.sin(r.angle) * (58 + r.len);
                const rg = ctx.createLinearGradient(x1, y1, x2, y2);
                rg.addColorStop(0, `rgba(255,230,100,${r.alpha * 2.5})`);
                rg.addColorStop(1, `rgba(255,180,40,0)`);
                ctx.save();
                ctx.lineWidth = r.width;
                ctx.lineCap = 'round';
                ctx.strokeStyle = rg;
                ctx.beginPath();
                ctx.moveTo(x1, y1);
                ctx.lineTo(x2, y2);
                ctx.stroke();
                ctx.restore();
            });

            // Far glow
            let sg = ctx.createRadialGradient(sx, sy, 0, sx, sy, H * 0.55);
            sg.addColorStop(0, 'rgba(255,240,140,0.14)');
            sg.addColorStop(0.35, 'rgba(255,200,60,0.05)');
            sg.addColorStop(1, 'rgba(255,130,0,0)');
            ctx.fillStyle = sg; ctx.beginPath();
            ctx.arc(sx, sy, H * 0.55, 0, Math.PI * 2); ctx.fill();

            // Mid corona
            sg = ctx.createRadialGradient(sx, sy, 0, sx, sy, 90);
            sg.addColorStop(0, 'rgba(255,255,210,0.9)');
            sg.addColorStop(0.5, 'rgba(255,230,80,0.5)');
            sg.addColorStop(1, 'rgba(255,160,0,0)');
            ctx.fillStyle = sg; ctx.beginPath();
            ctx.arc(sx, sy, 90, 0, Math.PI * 2); ctx.fill();

            // Core disk
            sg = ctx.createRadialGradient(sx - 12, sy - 12, 0, sx, sy, 52);
            sg.addColorStop(0, '#fffef0');
            sg.addColorStop(0.5, '#ffe566');
            sg.addColorStop(1, '#ffb300');
            ctx.fillStyle = sg; ctx.beginPath();
            ctx.arc(sx, sy, 52, 0, Math.PI * 2); ctx.fill();
        }

        // ═══════════════════════════════
        // DRAW CLOUDS
        // ═══════════════════════════════
        function drawClouds() {
            cloudLayers.forEach(c => {
                c.x += c.speed;
                if (c.speed > 0 && c.x > W + 400) c.x = -400;
                if (c.speed < 0 && c.x < -400) c.x = W + 400;
                const bobY = Math.sin(tick * c.bobSpeed + c.bobOff) * c.bobAmp;

                c.blobs.sort((a, b) => a.z - b.z);
                c.blobs.forEach(b => {
                    const bx = c.x + b.ox;
                    const by = c.y + b.oy + bobY;
                    const L = c.lightness;

                    // Cinematic 3-stop: bright highlight → mid tone → dark base shadow
                    const cg = ctx.createRadialGradient(
                        bx - b.rx * 0.3, by - b.ry * 0.35, 0,
                        bx, by, Math.max(b.rx, b.ry) * 1.1
                    );
                    const sat = scene === 'storm' ? 6 : scene === 'rain' ? 10 : 16;
                    cg.addColorStop(0, `hsla(210,${sat}%,${Math.min(L + 22, 98)}%,${c.alpha})`);
                    cg.addColorStop(0.45, `hsla(215,${sat + 4}%,${L}%,${c.alpha * 0.88})`);
                    cg.addColorStop(0.80, `hsla(220,${sat + 8}%,${Math.max(L - 20, 4)}%,${c.alpha * 0.60})`);
                    cg.addColorStop(1, `hsla(220,${sat + 8}%,${Math.max(L - 28, 2)}%,0)`);

                    ctx.save();
                    if (c.depth > 0.4) {
                        ctx.shadowColor = scene === 'storm' ? 'rgba(0,0,0,0.8)' : 'rgba(0,0,20,0.4)';
                        ctx.shadowBlur = 28;
                        ctx.shadowOffsetY = 16 * c.depth;
                    }
                    ctx.fillStyle = cg;
                    ctx.beginPath();
                    ctx.ellipse(bx, by, b.rx, b.ry, 0, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.restore();
                });
            });
        }

        // ═══════════════════════════════
        // DRAW RAIN
        // ═══════════════════════════════
        function drawRain() {
            ctx.save();
            rainDrops.forEach(d => {
                d.y += d.speed;
                d.x += d.wind;
                if (d.y > H + d.len) { d.y = -d.len - Math.random() * 20; d.x = Math.random() * W; }
                if (d.x > W + 30) { d.x = -30; }

                const rg = ctx.createLinearGradient(d.x, d.y, d.x + d.wind * 2, d.y + d.len);
                rg.addColorStop(0, `hsla(${d.hue},${d.sat}%,85%,0)`);
                rg.addColorStop(0.25, `hsla(${d.hue},${d.sat}%,88%,${d.alpha * 0.6})`);
                rg.addColorStop(0.7, `hsla(${d.hue},${d.sat}%,92%,${d.alpha})`);
                rg.addColorStop(1, `hsla(${d.hue},${d.sat}%,95%,${d.alpha * 0.4})`);

                ctx.lineWidth = d.thick;
                ctx.strokeStyle = rg;
                ctx.lineCap = 'round';
                ctx.beginPath();
                ctx.moveTo(d.x, d.y);
                ctx.lineTo(d.x + d.wind * 2.2, d.y + d.len);
                ctx.stroke();
            });
            ctx.restore();
        }

        // ═══════════════════════════════
        // LIGHTNING FLICKER ENGINE
        // ═══════════════════════════════
        function updateLightning() {
            const f = flickerState;

            f.cooldown--;

            if (f.phase === 'off') {
                if (f.cooldown <= 0) {
                    // Start a new lightning event
                    f.phase = 'flash';
                    f.alpha = 0.0;
                    f.ambientGlow = 0;
                    f.flickerCount = 0;
                    f.flickerMax = Math.floor(Math.random() * 5 + 3); // 3–7 flickers
                    f.bolts = [makeBolt(), makeBolt()];
                    if (Math.random() > 0.5) f.bolts.push(makeBolt());
                    f.timer = 0;
                }
                return;
            }

            f.timer++;

            if (f.phase === 'flash') {
                // Sharp initial strike
                f.alpha = 0.75 + Math.random() * 0.25;
                f.ambientGlow = 0.5 + Math.random() * 0.3;
                f.phase = 'flicker';
                f.timer = 0;
                return;
            }

            if (f.phase === 'flicker') {
                f.flickerCount++;

                // Rapid random flicker — ON/OFF multiple times
                const flickerSpeed = Math.floor(Math.random() * 3 + 1); // 1–3 frames per flicker
                if (f.timer % flickerSpeed === 0) {
                    if (f.alpha > 0.05) {
                        // Flicker off
                        f.alpha *= 0.3 + Math.random() * 0.3;
                        f.ambientGlow *= 0.4;
                    } else {
                        // Flicker back on
                        f.alpha = 0.3 + Math.random() * 0.5;
                        f.ambientGlow = 0.2 + Math.random() * 0.3;
                        // Re-spawn bolts for new strike look
                        if (Math.random() > 0.4) {
                            f.bolts = [makeBolt()];
                            if (Math.random() > 0.5) f.bolts.push(makeBolt());
                        }
                    }
                }

                if (f.flickerCount >= f.flickerMax * 2) {
                    f.phase = 'fade';
                    f.timer = 0;
                }
                return;
            }

            if (f.phase === 'fade') {
                f.alpha *= 0.88;
                f.ambientGlow *= 0.85;
                if (f.alpha < 0.005) {
                    f.phase = 'off';
                    f.alpha = 0;
                    f.ambientGlow = 0;
                    f.cooldown = Math.floor(Math.random() * 200 + 90);
                }
            }
        }

        function makeBolt() {
            const startX = W * 0.1 + Math.random() * W * 0.8;
            return buildBoltPoints(startX, -10, startX + (Math.random() - 0.5) * 160, H * 0.55 + Math.random() * H * 0.2, 0);
        }

        function buildBoltPoints(x1, y1, x2, y2, depth) {
            const pts = [{ x: x1, y: y1 }];
            const steps = 18 - depth * 4;
            for (let i = 1; i <= steps; i++) {
                const t = i / steps;
                const mx = x1 + (x2 - x1) * t;
                const my = y1 + (y2 - y1) * t;
                const jag = (1 - t) * (90 - depth * 28) * (Math.random() * 0.8 + 0.6);
                pts.push({ x: mx + (Math.random() - 0.5) * jag, y: my + (Math.random() - 0.5) * jag * 0.25 });
            }
            pts.push({ x: x2, y: y2 });

            const branches = [];
            if (depth < 2) {
                const n = depth === 0 ? Math.floor(Math.random() * 3 + 1) : Math.floor(Math.random() * 2);
                for (let b = 0; b < n; b++) {
                    const si = Math.floor(Math.random() * (pts.length - 4) + 2);
                    const sp = pts[si];
                    branches.push(buildBoltPoints(
                        sp.x, sp.y,
                        sp.x + (Math.random() - 0.5) * 140,
                        sp.y + Math.random() * 120 + 50,
                        depth + 1
                    ));
                }
            }
            return { pts, branches, depth };
        }

        function renderLightning() {
            const f = flickerState;
            if (f.alpha < 0.005) return;

            // ── Ambient sky glow ──────────────────
            if (f.ambientGlow > 0.01) {
                const ag = ctx.createRadialGradient(W * 0.5, 0, 0, W * 0.5, 0, H * 0.9);
                ag.addColorStop(0, `rgba(160,190,255,${f.ambientGlow * 0.45})`);
                ag.addColorStop(0.4, `rgba(100,140,220,${f.ambientGlow * 0.18})`);
                ag.addColorStop(1, `rgba(40,60,140,0)`);
                ctx.fillStyle = ag;
                ctx.fillRect(0, 0, W, H);

                // Ground bounce light
                const bg = ctx.createLinearGradient(0, H * 0.7, 0, H);
                bg.addColorStop(0, `rgba(140,170,255,0)`);
                bg.addColorStop(1, `rgba(120,150,240,${f.ambientGlow * 0.12})`);
                ctx.fillStyle = bg;
                ctx.fillRect(0, H * 0.7, W, H * 0.3);
            }

            // ── Draw each bolt ────────────────────
            f.bolts.forEach(bolt => renderBolt(bolt, f.alpha));

            // ── Full-screen flash ─────────────────
            if (f.alpha > 0.3) {
                ctx.save();
                ctx.globalAlpha = f.alpha * 0.18;
                ctx.fillStyle = 'rgba(200,220,255,1)';
                ctx.fillRect(0, 0, W, H);
                ctx.restore();
            }
        }

        function renderBolt(bolt, parentAlpha) {
            if (!bolt || bolt.pts.length < 2) return;
            const depth = bolt.depth;
            const lw = depth === 0 ? 3.5 : depth === 1 ? 1.8 : 0.9;

            ctx.save();
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';

            // Pass 1 — wide blue outer glow
            ctx.globalAlpha = parentAlpha * (depth === 0 ? 0.18 : 0.10);
            ctx.strokeStyle = '#8ab4ff';
            ctx.lineWidth = lw * 9;
            ctx.shadowColor = '#6688ff';
            ctx.shadowBlur = 40;
            traceBolt(bolt.pts);
            ctx.stroke();

            // Pass 2 — mid purple glow
            ctx.globalAlpha = parentAlpha * (depth === 0 ? 0.35 : 0.20);
            ctx.strokeStyle = '#c4b4ff';
            ctx.lineWidth = lw * 4;
            ctx.shadowBlur = 20;
            traceBolt(bolt.pts);
            ctx.stroke();

            // Pass 3 — bright white core
            ctx.globalAlpha = parentAlpha * (depth === 0 ? 0.95 : 0.65);
            ctx.strokeStyle = depth === 0 ? '#ffffff' : '#ddeeff';
            ctx.lineWidth = lw;
            ctx.shadowColor = '#aaccff';
            ctx.shadowBlur = 8;
            traceBolt(bolt.pts);
            ctx.stroke();

            ctx.restore();

            // Branches
            bolt.branches.forEach(b => renderBolt(b, parentAlpha * 0.75));
        }

        function traceBolt(pts) {
            ctx.beginPath();
            ctx.moveTo(pts[0].x, pts[0].y);
            for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
        }

        // ═══════════════════════════════
        // EMBERS
        // ═══════════════════════════════
        function drawEmbers() {
            emberParticles.forEach(e => {
                e.x += e.dx + flickerState.ambientGlow * 1.5;
                e.y += e.dy;
                e.life -= 0.004;
                if (e.life <= 0) {
                    e.x = Math.random() * W;
                    e.y = H * 0.6 + Math.random() * H * 0.4;
                    e.life = Math.random() * 0.7 + 0.3;
                    e.dy = -Math.random() * 1.5 - 0.5;
                }
                ctx.save();
                ctx.globalAlpha = e.alpha * e.life;
                ctx.fillStyle = `hsl(${200 + flickerState.ambientGlow * 40},80%,${70 + flickerState.ambientGlow * 20}%)`;
                ctx.shadowColor = '#aaccff';
                ctx.shadowBlur = 6;
                ctx.beginPath();
                ctx.arc(e.x, e.y, e.r * e.life, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            });
        }

        // ═══════════════════════════════
        // FOG
        // ═══════════════════════════════
        function drawFog() {
            fogBands.forEach(f => {
                f.offset += f.speed;
                const y = f.y + Math.sin(tick * 0.005 + f.offset * 0.01) * 20;
                const fg = ctx.createLinearGradient(0, y, W, y + f.height);
                const base = scene === 'storm' ? '60,80,120' : scene === 'rain' ? '80,100,140' : '180,200,220';
                fg.addColorStop(0, `rgba(${base},0)`);
                fg.addColorStop(0.3, `rgba(${base},${f.alpha})`);
                fg.addColorStop(0.7, `rgba(${base},${f.alpha * 1.3})`);
                fg.addColorStop(1, `rgba(${base},0)`);
                ctx.fillStyle = fg;
                ctx.fillRect(0, y, W, f.height + 30);
            });
        }

        // ═══════════════════════════════
        // CINEMATIC VIGNETTE + GRADE
        // ═══════════════════════════════
        function drawCinematicGrade() {
            // Vignette
            const vg = ctx.createRadialGradient(W * 0.5, H * 0.5, H * 0.2, W * 0.5, H * 0.5, H * 0.85);
            const vigStr = scene === 'storm' ? 0.75
                : scene === 'rain' ? 0.55
                    : scene === 'cloudy' ? 0.40
                        : 0.30;
            vg.addColorStop(0, 'rgba(0,0,0,0)');
            vg.addColorStop(1, `rgba(0,0,0,${vigStr})`);
            ctx.fillStyle = vg;
            ctx.fillRect(0, 0, W, H);

            // Top darkness
            const tg = ctx.createLinearGradient(0, 0, 0, H * 0.25);
            tg.addColorStop(0, `rgba(0,0,0,${scene === 'storm' ? 0.55 : 0.3})`);
            tg.addColorStop(1, 'rgba(0,0,0,0)');
            ctx.fillStyle = tg;
            ctx.fillRect(0, 0, W, H * 0.25);

            // Bottom ground haze
            const bg = ctx.createLinearGradient(0, H * 0.75, 0, H);
            const hazCol = scene === 'storm' ? '10,15,30' : scene === 'rain' ? '15,25,40' : '20,35,60';
            bg.addColorStop(0, `rgba(${hazCol},0)`);
            bg.addColorStop(1, `rgba(${hazCol},0.55)`);
            ctx.fillStyle = bg;
            ctx.fillRect(0, H * 0.75, W, H * 0.25);

            // Film grain (subtle)
            ctx.save();
            ctx.globalAlpha = 0.018;
            for (let i = 0; i < 800; i++) {
                const gx = Math.random() * W;
                const gy = Math.random() * H;
                const gs = Math.random() * 1.5;
                ctx.fillStyle = `rgba(255,255,255,${Math.random()})`;
                ctx.fillRect(gx, gy, gs, gs);
            }
            ctx.restore();
        }

        // ═══════════════════════════════
        // MAIN LOOP
        // ═══════════════════════════════
        function animate() {
            tick++;
            ctx.clearRect(0, 0, W, H);

            drawSky();

            // Clouds behind sun
            if (scene === 'sunny' || scene === 'cloudy') drawSun();
            drawClouds();

            if (scene === 'rain' || scene === 'storm') drawRain();

            if (scene === 'storm') {
                updateLightning();
                renderLightning();
                drawEmbers();
            }

            drawFog();
            drawCinematicGrade();

            animRef.current = requestAnimationFrame(animate);
        }

        window.addEventListener('resize', resize);
        resize();
        animate();

        return () => {
            cancelAnimationFrame(animRef.current);
            window.removeEventListener('resize', resize);
        };
    }, [scene]);

    return (
        <canvas
            ref={canvasRef}
            style={{
                position: 'fixed',
                top: 0, left: 0,
                width: '100%',
                height: '100%',
                zIndex: 0,
            }}
        />
    );
}