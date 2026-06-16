# 🌦️ SkyCast — Cinematic Weather Dashboard

A real-time cinematic weather dashboard built for Sri Lanka. 
Features dynamic animated backgrounds (rain, storm, lightning, clouds) 
rendered on HTML5 Canvas that react to live weather conditions.

🌐 **Live Demo:** https://weather-sky-cast.vercel.app/
📂 **GitHub Repo:** https://github.com/Gihan-Benaragama/WeatherSkyCast

---

## 📸 Screenshots

<img width="1814" height="798" alt="Screenshot (216)" src="https://github.com/user-attachments/assets/80028040-aae1-4625-9a34-ffed37363e3c" />

<img width="1900" height="904" alt="Screenshot (227)" src="https://github.com/user-attachments/assets/54770061-d5ff-48ca-9208-03ece82bbca4" />

<img width="1916" height="894" alt="Screenshot (226)" src="https://github.com/user-attachments/assets/64e0524b-f037-4d31-a9b9-f1e8a0daeafe" />

---

## ✨ Features

- 🌍 **GPS & City Search** — Auto-detects user location or search globally
- 🏠 **Home Dashboard** — Live temperature, humidity, wind, UV, AQI, and 24-hour forecast
- 📅 **7-Day Forecast** — Extended outlook with hourly charts, AQI ring, sun arc, and precipitation charts
- 🗺️ **Interactive Weather Map** — Leaflet-powered Sri Lanka map with animated overlays and live city pins
- 🏙️ **Multi-City Comparison** — Side-by-side live weather for 8 major Sri Lanka cities
- 🎨 **Cinematic Backgrounds** — Canvas-animated rain, storm, lightning, wind reacting to real weather
- 📱 **Fully Responsive** — Dedicated mobile layouts with optimized component ordering

---

## 🛠️ Tech Stack


> SkyCast is a **100% frontend-only** application — no backend, no database.  
> API calls go directly from the browser to OpenWeatherMap via Axios.


| Category | Technology | Purpose |
|---|---|---|
| UI Framework | React 19 | Component-based SPA architecture |
| Build Tool | Vite 8 | Fast dev server, HMR, production bundling |
| Styling | Vanilla CSS | Glassmorphism, global styles, media queries |
| Animations | Framer Motion | Page transitions, micro-animations, spring physics |
| Charts | Recharts | AreaChart & BarChart for hourly/precipitation data |
| Mapping | Leaflet + React-Leaflet | Interactive map, city pins, weather overlays |
| HTTP Client | Axios | API requests for weather data |
| Weather API | OpenWeatherMap API | Live weather, forecast, air quality, GPS data |
| Canvas | HTML5 Canvas (native) | Real-time animated weather backgrounds |
| Responsive | CSS Media Queries | Mobile-first layout overrides |
| State | React Hooks | useState, useEffect, useRef — no Redux needed |
| Version Control | Git + GitHub | Source control |

---

## 🏗️ Architecture
---

Browser (React SPA)

↕ Axios HTTP requests

OpenWeatherMap API

(Live weather, forecast, AQI, GPS-based data)
---
- **No backend** — pure frontend SPA
- **Routing** handled via `activePage` state flag — no external router
- **State** managed entirely with React Hooks

---

## 📍 How GPS Location Works
---

User opens app

↓

Permission modal appears

↓

User clicks "Allow GPS"

↓

[1] App checks browser GPS support (navigator.geolocation)

↓

[2] Browser shows native permission popup → Allow / Block

↓

[3] If ALLOWED → navigator.geolocation.getCurrentPosition()

→ Returns { latitude, longitude }

↓

[4] Coordinates saved → setLocationTarget({ lat, lon })

↓

[5] useEffect triggers → OpenWeatherMap API called with coordinates

↓

[6] Live weather renders on screen
If BLOCKED → "Permission denied. Please search manually."

If SKIPPED  → Defaults to Colombo, Sri Lanka
---

**Key Web API used (no library needed):**
```js
navigator.geolocation.getCurrentPosition(
  successCallback,
  errorCallback,
  { timeout: 10000, maximumAge: 60000 }
)
```

---

## 📁 Project Structure├── src/

---


│   ├── components/

│   │   ├── Home/              # Dashboard, hourly forecast, weather card

│   │   ├── Forecast/          # 7-day forecast, AQI ring, sun arc, charts

│   │   ├── Map/               # Leaflet map, weather overlays, city pins

│   │   ├── Comparison/        # Multi-city side-by-side comparison

│   │   └── Canvas/            # Animated rain, storm, lightning, wind backgrounds

│   ├── App.jsx                # Root component, GPS logic, page routing

│   ├── App.css                # Global styles, glassmorphism, media queries

│   └── main.jsx               # React entry point
---

---

## 🚀 Getting Started

### Prerequisites
- Node.js v18+
- Free API key from [OpenWeatherMap](https://openweathermap.org/api)

### 1. Clone the repository
```bash
git clone https://github.com/your-username/skycast.git
cd skycast
```

### 2. Install dependencies
```bash
npm install
```

### 3. Set up environment variables

Create a `.env` file in the root folder:

VITE_OPENWEATHER_API_KEY=your_openweathermap_api_key

### 4. Run the dev server
```bash
npm run dev
```

App runs at `http://localhost:5173`

### 5. Build for production
```bash
npm run build
```

---

## 🌍 Deployment

| Layer | Platform |
|---|---|
| Frontend | Vercel / Netlify |
| API | OpenWeatherMap (external) |

---

## 🎨 Design Principles

- **Glassmorphism** — Translucent frosted-glass cards with `backdrop-filter: blur()`
- **Dark Mode First** — Deep navy palette with vibrant blue accents
- **Physics-Inspired Animations** — Canvas rain particles, lightning flicker, wind streams
- **Mobile-First Responsive** — Separate mobile layout ordering without breaking desktop UI

---

## 📦 Key Packages

`react` `vite` `framer-motion` `recharts` `leaflet` `react-leaflet` `axios`

---

## 🔮 Planned Features

- [ ] Push notifications for severe weather alerts
- [ ] Dark / Light theme toggle
- [ ] More countries beyond Sri Lanka
- [ ] PWA support (installable on mobile)

---

## 👤 Author

**Syntecxhub**  
🔗 [GitHub](your-github-link-here)

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
