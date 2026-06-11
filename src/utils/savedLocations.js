const KEY = 'skycast_saved_locations';

export function getSavedLocations() {
    try {
        return JSON.parse(localStorage.getItem(KEY)) || [];
    } catch { return []; }
}

export function saveLocation(loc) {
    const existing = getSavedLocations();
    const already = existing.find(l => l.label === loc.label);
    if (already) return existing;
    const updated = [loc, ...existing].slice(0, 8);
    localStorage.setItem(KEY, JSON.stringify(updated));
    return updated;
}

export function removeLocation(label) {
    const updated = getSavedLocations().filter(l => l.label !== label);
    localStorage.setItem(KEY, JSON.stringify(updated));
    return updated;
}