export function getScene(weatherCode) {
    if (!weatherCode) return 'cloudy';
    if (weatherCode >= 200 && weatherCode <= 232) return 'storm';
    if (weatherCode >= 300 && weatherCode <= 321) return 'rain';
    if (weatherCode >= 500 && weatherCode <= 531) return 'rain';
    if (weatherCode >= 600 && weatherCode <= 622) return 'cloudy';
    if (weatherCode >= 700 && weatherCode <= 781) return 'cloudy';
    if (weatherCode === 800) return 'sunny';
    if (weatherCode >= 801 && weatherCode <= 804) return 'cloudy';
    return 'cloudy';
}

export function getSkyColors(scene) {
    const colors = {
        sunny: { top: '#1a6bb5', bottom: '#87ceeb' },
        cloudy: { top: '#4a5f7a', bottom: '#2c3e52' },
        rain: { top: '#1a2a3a', bottom: '#0d1a25' },
        storm: { top: '#0f1520', bottom: '#060a0f' },
    };
    return colors[scene] || colors.cloudy;
}

export function getSceneIcon(scene) {
    const icons = {
        sunny: '☀️',
        cloudy: '⛅',
        rain: '🌧️',
        storm: '⛈️',
    };
    return icons[scene] || '⛅';
}

export function toSLTime(unixTimestamp) {
    return new Date(unixTimestamp * 1000).toLocaleTimeString('en-LK', {
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'Asia/Colombo',
    });
}

export function getTomorrowForecast(forecastList) {
    if (!forecastList) return null;
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowDate = tomorrow.toISOString().split('T')[0];
    return forecastList.find(item => item.dt_txt.startsWith(tomorrowDate));
}