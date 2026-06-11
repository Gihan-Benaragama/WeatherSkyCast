import { toSLTime } from '../utils/weatherHelpers';

export default function WeatherCard({ weather, forecast, selectedDay }) {
    if (!weather) return null;

    const isToday = selectedDay === 'today';
    const isTomorrow = selectedDay === 'tomorrow';

    const temp = isToday
        ? Math.round(weather.main.temp)
        : isTomorrow && forecast
            ? Math.round(forecast.main.temp)
            : 27;

    const condition = isToday
        ? weather.weather[0].main.toUpperCase()
        : isTomorrow && forecast
            ? forecast.weather[0].main.toUpperCase()
            : 'RAINY';

    const desc = isToday
        ? weather.weather[0].description
        : isTomorrow && forecast
            ? forecast.weather[0].description
            : 'rainy day — southwest monsoon';

    const humidity = isToday
        ? weather.main.humidity
        : isTomorrow && forecast
            ? forecast.main.humidity
            : 88;

    const wind = isToday
        ? Math.round(weather.wind.speed * 3.6)
        : isTomorrow && forecast
            ? Math.round(forecast.wind.speed * 3.6)
            : 22;

    const feelsLike = isToday
        ? Math.round(weather.main.feels_like)
        : isTomorrow && forecast
            ? Math.round(forecast.main.feels_like)
            : 31;

    const pressure = isToday
        ? weather.main.pressure
        : isTomorrow && forecast
            ? forecast.main.pressure
            : 1005;

    const sunrise = weather.sys?.sunrise ? toSLTime(weather.sys.sunrise) : '--';
    const sunset = weather.sys?.sunset ? toSLTime(weather.sys.sunset) : '--';

    return (
        <>
            {/* Main big weather card */}
            <div className="main-card">
                <div className="weather-condition">{condition}</div>

                <div className="temp-row">
                    <span className="temp-display">{temp}</span>
                    <span className="temp-unit">°C</span>
                </div>

                <div className="weather-desc">{desc}</div>
                <div className="feels-like">Feels like {feelsLike}°C · Sri Lanka</div>

                <div className="stat-row">
                    <div className="stat-pill">💧 {humidity}%</div>
                    <div className="stat-pill">💨 {wind} km/h</div>
                    <div className="stat-pill">📍 {weather.name}</div>
                </div>
            </div>

            {/* Bottom info cards */}
            <div className="bottom-grid">
                <div className="mini-card">
                    <div className="mc-label">🌅 Sunrise</div>
                    <div className="mc-value">{sunrise}</div>
                    <div className="mc-sub">Sri Lanka time</div>
                </div>
                <div className="mini-card">
                    <div className="mc-label">🌇 Sunset</div>
                    <div className="mc-value">{sunset}</div>
                    <div className="mc-sub">Sri Lanka time</div>
                </div>
                <div className="mini-card">
                    <div className="mc-label">💧 Humidity</div>
                    <div className="mc-value">{humidity}%</div>
                    <div className="mc-sub">
                        {humidity > 80 ? 'Very humid' : humidity > 60 ? 'Humid' : 'Comfortable'}
                    </div>
                </div>
                <div className="mini-card">
                    <div className="mc-label">🌡️ Pressure</div>
                    <div className="mc-value">{pressure} hPa</div>
                    <div className="mc-sub">Atmospheric</div>
                </div>
            </div>
        </>
    );
}