import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { searchCities } from '../hooks/useWeather';

export default function LocationSearch({ onSelect, currentCity }) {
  const [query,       setQuery]       = useState('');
  const [results,     setResults]     = useState([]);
  const [searching,   setSearching]   = useState(false);
  const [open,        setOpen]        = useState(false);
  const [gpsLoading,  setGpsLoading]  = useState(false);
  const [gpsError,    setGpsError]    = useState('');
  const inputRef  = useRef(null);
  const wrapRef   = useRef(null);
  const debounce  = useRef(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setOpen(false);
        setQuery('');
        setResults([]);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Debounced search
  useEffect(() => {
    if (!query.trim()) { setResults([]); setSearching(false); return; }
    setSearching(true);
    clearTimeout(debounce.current);
    debounce.current = setTimeout(async () => {
      const r = await searchCities(query);
      setResults(r);
      setSearching(false);
    }, 350);
  }, [query]);

  function handleSelect(city) {
    onSelect({ lat: city.lat, lon: city.lon }, city.label);
    setOpen(false);
    setQuery('');
    setResults([]);
  }

  async function handleGPS() {
    if (!navigator.geolocation) {
      setGpsError('GPS not supported on this device');
      return;
    }
    setGpsLoading(true);
    setGpsError('');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        onSelect(
          { lat: pos.coords.latitude, lon: pos.coords.longitude },
          'Current Location'
        );
        setGpsLoading(false);
        setOpen(false);
      },
      (err) => {
        setGpsError(
          err.code === 1
            ? 'Location permission denied. Please allow access.'
            : 'Could not get your location. Try searching manually.'
        );
        setGpsLoading(false);
      },
      { timeout: 10000, maximumAge: 60000 }
    );
  }

  return (
    <div ref={wrapRef} style={{ position: 'relative' }}>

      {/* Real search input styled as .nav-search */}
      <div
        className="nav-search"
        onClick={() => {
          setOpen(true);
          inputRef.current?.focus();
        }}
        style={{ cursor: 'text' }}
      >
        <span>🔍</span>
        <input
          ref={inputRef}
          value={open ? query : (currentCity || '')}
          onChange={e => {
            setQuery(e.target.value);
            if (!open) setOpen(true);
          }}
          onFocus={() => {
            setOpen(true);
            setQuery(''); // Start fresh search on focus
          }}
          placeholder="Search location..."
          style={{
            background: 'none',
            border: 'none',
            outline: 'none',
            color: '#fff',
            fontSize: 13,
            width: '100%',
            fontFamily: 'inherit',
          }}
        />
        {open && query && (
          <span
            onClick={(e) => {
              e.stopPropagation();
              setQuery('');
              setResults([]);
            }}
            style={{ cursor: 'pointer', opacity: 0.6, fontSize: 16, lineHeight: 1 }}
          >
            ×
          </span>
        )}
      </div>

      {/* Dropdown panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0,  scale: 1 }}
            exit={{    opacity: 0, y: -8, scale: 0.97 }}
            transition={{ duration: 0.18 }}
            style={{
              position:   'absolute',
              top:        'calc(100% + 8px)',
              right:      0,
              width:      320,
              background: 'rgba(8,14,24,0.96)',
              backdropFilter: 'blur(28px)',
              WebkitBackdropFilter: 'blur(28px)',
              borderRadius: 18,
              border:     '1px solid rgba(255,255,255,0.12)',
              boxShadow:  '0 24px 60px rgba(0,0,0,0.7)',
              overflow:   'hidden',
              zIndex:     1000,
            }}
          >

            {/* GPS button */}
            <div
              onClick={handleGPS}
              style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '12px 16px',
                borderBottom: '1px solid rgba(255,255,255,0.06)',
                cursor: 'pointer',
                transition: 'background 0.15s',
              }}
              onMouseEnter={e => e.currentTarget.style.background='rgba(255,255,255,0.06)'}
              onMouseLeave={e => e.currentTarget.style.background='transparent'}
            >
              <div style={{
                width: 32, height: 32, borderRadius: '50%',
                background: 'rgba(59,130,246,0.2)',
                border: '1px solid rgba(96,165,250,0.3)',
                display: 'flex', alignItems: 'center',
                justifyContent: 'center', fontSize: 16,
              }}>
                {gpsLoading ? '⏳' : '📍'}
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#93c5fd' }}>
                  {gpsLoading ? 'Detecting location...' : 'Use my current location'}
                </div>
                <div style={{ fontSize: 11, opacity: 0.45, marginTop: 1 }}>
                  Via device GPS
                </div>
              </div>
            </div>

            {/* GPS error */}
            {gpsError && (
              <div style={{
                padding: '8px 16px',
                fontSize: 12, color: '#fca5a5',
                background: 'rgba(239,68,68,0.1)',
                borderBottom: '1px solid rgba(255,255,255,0.06)',
              }}>
                ⚠️ {gpsError}
              </div>
            )}

            {/* Sri Lanka quick picks */}
            {!query && (
              <div style={{ padding: '10px 16px 12px' }}>
                <div style={{
                  fontSize: 9, fontWeight: 700, textTransform: 'uppercase',
                  letterSpacing: '1.3px', opacity: 0.38, marginBottom: 8,
                }}>
                  🇱🇰 Sri Lanka Cities
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {[
                    'Colombo','Kandy','Galle','Jaffna',
                    'Negombo','Trincomalee','Anuradhapura','Nuwara Eliya',
                  ].map(city => (
                    <div
                      key={city}
                      onClick={() => handleSelect({
                        lat: 0, lon: 0,
                        label: `${city}, LK`,
                        name: city,
                        country: 'LK',
                      })}
                      style={{
                        padding: '5px 11px',
                        borderRadius: 50, fontSize: 12,
                        background: 'rgba(255,255,255,0.07)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        color: 'rgba(255,255,255,0.75)',
                        cursor: 'pointer',
                        transition: 'all 0.15s',
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.background='rgba(59,130,246,0.25)';
                        e.currentTarget.style.borderColor='rgba(96,165,250,0.4)';
                        e.currentTarget.style.color='#fff';
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.background='rgba(255,255,255,0.07)';
                        e.currentTarget.style.borderColor='rgba(255,255,255,0.1)';
                        e.currentTarget.style.color='rgba(255,255,255,0.75)';
                      }}
                    >
                      {city}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Search results */}
            {query && (
              <div style={{ maxHeight: 240, overflowY: 'auto' }}>
                {searching ? (
                  <div style={{
                    padding: '16px', textAlign: 'center',
                    fontSize: 13, opacity: 0.45,
                  }}>
                    Searching...
                  </div>
                ) : results.length === 0 ? (
                  <div style={{
                    padding: '16px', textAlign: 'center',
                    fontSize: 13, opacity: 0.38,
                  }}>
                    No cities found for "{query}"
                  </div>
                ) : results.map((city, i) => (
                  <div
                    key={i}
                    onClick={() => handleSelect(city)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 12,
                      padding: '10px 16px', cursor: 'pointer',
                      borderBottom: '1px solid rgba(255,255,255,0.05)',
                      transition: 'background 0.15s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.background='rgba(255,255,255,0.07)'}
                    onMouseLeave={e => e.currentTarget.style.background='transparent'}
                  >
                    <span style={{ fontSize: 18 }}>📍</span>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>
                        {city.name}
                        {city.state ? `, ${city.state}` : ''}
                      </div>
                      <div style={{ fontSize: 11, opacity: 0.45 }}>
                        {city.country}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Footer */}
            <div style={{
              padding: '8px 16px',
              fontSize: 10, opacity: 0.28,
              borderTop: '1px solid rgba(255,255,255,0.06)',
              textAlign: 'center',
            }}>
              Powered by OpenWeatherMap Geocoding API
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}