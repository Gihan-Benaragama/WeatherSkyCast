import { useState, useEffect } from 'react';
import axios from 'axios';

const API_KEY = import.meta.env.VITE_WEATHER_API_KEY;
const BASE    = 'https://api.openweathermap.org/data/2.5';
const GEO     = 'https://api.openweathermap.org/geo/1.0';

// Convert date string YYYY-MM-DD to Unix timestamp
function dateToUnix(dateStr) {
  return Math.floor(new Date(dateStr).getTime() / 1000);
}

// Check if date is today
function isToday(dateStr) {
  return dateStr === new Date().toISOString().split('T')[0];
}

// Check if date is within next 5 days (forecast range)
function isFuture(dateStr) {
  const today    = new Date(); today.setHours(0,0,0,0);
  const selected = new Date(dateStr); selected.setHours(0,0,0,0);
  return selected > today;
}

// Check if date is past (before today)
function isPast(dateStr) {
  const today    = new Date(); today.setHours(0,0,0,0);
  const selected = new Date(dateStr); selected.setHours(0,0,0,0);
  return selected < today;
}

// Days difference from today
function daysDiff(dateStr) {
  const today    = new Date(); today.setHours(0,0,0,0);
  const selected = new Date(dateStr); selected.setHours(0,0,0,0);
  return Math.round((selected - today) / (1000 * 60 * 60 * 24));
}

export function useWeatherForDate(locationTarget, selectedDate) {
  const [weatherData, setWeatherData] = useState(null);
  const [hourly,      setHourly]      = useState([]);
  const [alerts,      setAlerts]      = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState(null);
  const [cityName,    setCityName]    = useState('');
  const [dateType,    setDateType]    = useState('today'); // 'past'|'today'|'future'

  useEffect(() => {
    if (!locationTarget || !selectedDate) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Build base query
        let locQuery = '';
        let latLon   = null;
        let resolvedName = '';

        if (typeof locationTarget === 'object') {
          latLon   = locationTarget;
          locQuery = `lat=${latLon.lat}&lon=${latLon.lon}`;
          try {
            const geoRes = await axios.get(
              `${GEO}/reverse?lat=${latLon.lat}&lon=${latLon.lon}&limit=1&appid=${API_KEY}`
            );
            if (geoRes.data && geoRes.data.length > 0) {
              const geoItem = geoRes.data[0];
              resolvedName = `${geoItem.name}${geoItem.state ? ', ' + geoItem.state : ''}, ${geoItem.country}`;
            }
          } catch (geoErr) {
            console.error('Error fetching reverse geocoding data:', geoErr);
          }
        } else {
          locQuery = `q=${locationTarget}`;
        }

        const diff = daysDiff(selectedDate);
        setDateType(diff === 0 ? 'today' : diff > 0 ? 'future' : 'past');

        let result = null;

        if (diff === 0) {
          // ── TODAY — current weather + forecast ──────────
          const [wRes, fRes] = await Promise.all([
            axios.get(`${BASE}/weather?${locQuery}&appid=${API_KEY}&units=metric`),
            axios.get(`${BASE}/forecast?${locQuery}&appid=${API_KEY}&units=metric`),
          ]);

          setCityName(resolvedName || `${wRes.data.name}, ${wRes.data.sys.country}`);

          const timezoneOffset = fRes.data.city.timezone;
          const formatLocalTime = (dt) => {
            const localDate = new Date((dt + timezoneOffset) * 1000);
            return localDate.toLocaleTimeString('en-LK', {
              hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'UTC',
            });
          };

          result = {
            temp:      Math.round(wRes.data.main.temp),
            tempMin:   Math.round(wRes.data.main.temp_min),
            tempMax:   Math.round(wRes.data.main.temp_max),
            feelsLike: Math.round(wRes.data.main.feels_like),
            humidity:  wRes.data.main.humidity,
            pressure:  wRes.data.main.pressure,
            wind:      Math.round(wRes.data.wind.speed * 3.6),
            windDir:   wRes.data.wind.deg,
            visibility: wRes.data.visibility !== undefined ? (wRes.data.visibility / 1000).toFixed(1) : '--',
            desc:      wRes.data.weather[0].description,
            condId:    wRes.data.weather[0].id,
            condMain:  wRes.data.weather[0].main,
            clouds:    wRes.data.clouds.all,
            sunrise:   wRes.data.sys?.sunrise || null,
            sunset:    wRes.data.sys?.sunset || null,
            cityName:  resolvedName || `${wRes.data.name}, ${wRes.data.sys?.country || ''}`,
            rain:      Math.round((wRes.data.clouds?.all || 0) * 0.8),
            uv:        7,
            source:    'live',
            coord:     wRes.data.coord,
          };

          // Prepend current weather to the hourly list as 'NOW'
          const currentHourItem = {
            time: 'NOW',
            temp: Math.round(wRes.data.main.temp),
            rain: fRes.data.list[0] ? Math.round((fRes.data.list[0].pop || 0) * 100) : 0,
            wind: Math.round(wRes.data.wind.speed * 3.6),
            icon: wRes.data.weather[0].main,
            desc: wRes.data.weather[0].description,
          };

          const forecastItems = fRes.data.list.slice(0, 7).map(item => ({
            time:  formatLocalTime(item.dt),
            temp:  Math.round(item.main.temp),
            rain:  Math.round((item.pop || 0) * 100),
            wind:  Math.round(item.wind.speed * 3.6),
            icon:  item.weather[0].main,
            desc:  item.weather[0].description,
          }));

          setHourly([currentHourItem, ...forecastItems]);

        } else if (diff > 0 && diff <= 5) {
          // ── FUTURE (1–5 days) — from forecast API ───────
          const fRes = await axios.get(
            `${BASE}/forecast?${locQuery}&appid=${API_KEY}&units=metric`
          );

          setCityName(resolvedName || `${fRes.data.city.name}, ${fRes.data.city.country}`);

          const timezoneOffset = fRes.data.city.timezone;
          
          const getLocalDateString = (dt) => {
            const localDate = new Date((dt + timezoneOffset) * 1000);
            return localDate.toISOString().split('T')[0];
          };

          const formatLocalTime = (dt) => {
            const localDate = new Date((dt + timezoneOffset) * 1000);
            return localDate.toLocaleTimeString('en-LK', {
              hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'UTC',
            });
          };

          // Filter items matching selected date in local timezone
          const dayItems = fRes.data.list.filter(item =>
            getLocalDateString(item.dt) === selectedDate
          );

          if (dayItems.length === 0) {
            setError('No forecast data available for this date');
            setLoading(false);
            return;
          }

          // Use midday item or first available in local time
          const formatLocalHour = (dt) => {
            const localDate = new Date((dt + timezoneOffset) * 1000);
            return localDate.getUTCHours();
          };
          const main = dayItems.find(i => {
            const localHour = formatLocalHour(i.dt);
            return localHour >= 11 && localHour <= 13;
          }) || dayItems[Math.floor(dayItems.length / 2)];

          const temps = dayItems.map(i => i.main.temp);
          result = {
            temp:      Math.round(main.main.temp),
            tempMin:   Math.round(Math.min(...temps)),
            tempMax:   Math.round(Math.max(...temps)),
            feelsLike: Math.round(main.main.feels_like),
            humidity:  main.main.humidity,
            pressure:  main.main.pressure,
            wind:      Math.round(main.wind.speed * 3.6),
            visibility:'--',
            desc:      main.weather[0].description,
            condId:    main.weather[0].id,
            condMain:  main.weather[0].main,
            clouds:    main.clouds.all,
            rain:      Math.round((main.pop || 0) * 100),
            uv:        '--',
            source:    'forecast',
            cityName:  resolvedName || `${fRes.data.city.name}, ${fRes.data.city.country}`,
            coord:     fRes.data.city.coord,
          };

          // Hourly for that future day in local time
          const hourlyData = dayItems.map(item => ({
            time:  formatLocalTime(item.dt),
            temp:  Math.round(item.main.temp),
            rain:  Math.round((item.pop || 0) * 100),
            wind:  Math.round(item.wind.speed * 3.6),
            icon:  item.weather[0].main,
            desc:  item.weather[0].description,
          }));
          setHourly(hourlyData);

        } else if (diff > 5) {
          // ── FAR FUTURE (beyond 5 days) ───────────────────
          // Free API doesn't support this — show informative message
          setError('FUTURE_LIMIT');
          setLoading(false);
          return;

        } else {
          // ── PAST — historical simulation ─────────────────
          // Free OpenWeather doesn't support historical on free plan
          // We simulate based on climatology + seasonal patterns for Sri Lanka
          const pastResult = generateHistoricalData(selectedDate, diff);
          result = { ...pastResult, source: 'historical' };

          // Get city name from current weather
          const wRes = await axios.get(
            `${BASE}/weather?${locQuery}&appid=${API_KEY}&units=metric`
          );
          setCityName(resolvedName || `${wRes.data.name}, ${wRes.data.sys?.country || ''}`);
          result.cityName = resolvedName || `${wRes.data.name}, ${wRes.data.sys?.country || ''}`;
          result.coord = wRes.data.coord;


          setHourly([]);
        }

        setWeatherData(result);

        // Alerts
        if (result) {
          const id = result.condId;
          const newAlerts = [];
          if (id >= 200 && id <= 232)
            newAlerts.push({ type:'storm', msg:'Thunderstorm Warning', detail:'Lightning and heavy rain expected.', color:'#7c3aed' });
          if (id >= 500 && id <= 531 && result.rain > 70)
            newAlerts.push({ type:'rain', msg:'Heavy Rain Alert', detail:'Flooding possible in low-lying areas.', color:'#1d4ed8' });
          if (result.temp > 36)
            newAlerts.push({ type:'heat', msg:'Extreme Heat Warning', detail:`Temperature ${result.temp}°C. Stay hydrated.`, color:'#b45309' });
          if (result.wind > 50)
            newAlerts.push({ type:'wind', msg:'Strong Wind Advisory', detail:`Winds at ${result.wind} km/h.`, color:'#0f766e' });
          setAlerts(newAlerts);
        }

      } catch (err) {
        setError(err.response?.data?.message || 'Could not load weather data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [JSON.stringify(locationTarget), selectedDate]);

  return { weatherData, hourly, alerts, loading, error, cityName, dateType };
}

// ── Sri Lanka historical climate simulation ──────────────
function generateHistoricalData(dateStr, daysDiff) {
  const month = new Date(dateStr).getMonth(); // 0–11

  // Sri Lanka monthly climate patterns
  const climate = [
    { temp:27, rain:70, humidity:80, desc:'Light rain showers',   condId:520, condMain:'Rain'   }, // Jan
    { temp:28, rain:55, humidity:76, desc:'Partly cloudy',         condId:802, condMain:'Clouds' }, // Feb
    { temp:30, rain:60, humidity:74, desc:'Scattered showers',     condId:521, condMain:'Rain'   }, // Mar
    { temp:31, rain:65, humidity:76, desc:'Thundery showers',      condId:211, condMain:'Thunderstorm' }, // Apr
    { temp:30, rain:80, humidity:82, desc:'Heavy monsoon rain',    condId:502, condMain:'Rain'   }, // May
    { temp:29, rain:85, humidity:85, desc:'Southwest monsoon',     condId:501, condMain:'Rain'   }, // Jun
    { temp:28, rain:88, humidity:86, desc:'Heavy rain',            condId:502, condMain:'Rain'   }, // Jul
    { temp:28, rain:86, humidity:85, desc:'Heavy rain showers',    condId:502, condMain:'Rain'   }, // Aug
    { temp:28, rain:82, humidity:84, desc:'Occasional showers',    condId:521, condMain:'Rain'   }, // Sep
    { temp:27, rain:85, humidity:85, desc:'Northeast monsoon',     condId:501, condMain:'Rain'   }, // Oct
    { temp:27, rain:88, humidity:84, desc:'Heavy northeast rain',  condId:502, condMain:'Rain'   }, // Nov
    { temp:27, rain:75, humidity:82, desc:'Intermittent showers',  condId:520, condMain:'Rain'   }, // Dec
  ];

  const base     = climate[month];
  const variance = Math.sin(Math.abs(daysDiff) * 0.3) * 2;

  return {
    temp:      Math.round(base.temp + variance),
    tempMin:   Math.round(base.temp - 3 + variance),
    tempMax:   Math.round(base.temp + 3 + variance),
    feelsLike: Math.round(base.temp + 4 + variance),
    humidity:  base.humidity + Math.floor(Math.random() * 6 - 3),
    pressure:  1008 + Math.floor(Math.random() * 8 - 4),
    wind:      18 + Math.floor(Math.random() * 12),
    visibility:'6.0',
    desc:      base.desc,
    condId:    base.condId,
    condMain:  base.condMain,
    clouds:    base.rain,
    rain:      base.rain,
    uv:        month >= 4 && month <= 8 ? 2 : 6,
    sunrise:   null,
    sunset:    null,
  };
}

export async function searchCities(query) {
  if (!query || query.length < 2) return [];
  try {
    const res = await axios.get(
      `${GEO}/direct?q=${encodeURIComponent(query)}&limit=6&appid=${API_KEY}`
    );
    return res.data.map(c => ({
      name:    c.name,
      country: c.country,
      state:   c.state || '',
      lat:     c.lat,
      lon:     c.lon,
      label:   `${c.name}${c.state?', '+c.state:''}, ${c.country}`,
    }));
  } catch { return []; }
}