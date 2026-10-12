// On-device persistence (localStorage): most recent location, saved characters, and the cached
// recommendation state per (location, date, character). Nothing here leaves the browser.
// Exposes window.AppStore (not "Storage": that name is the browser's built-in interface).
//
// Privacy rule (spec requirement 5): only the most recent location is kept. The recommendation
// cache is stored as ONE bucket belonging to the current location, so switching location drops
// the old bucket and no earlier place can linger anywhere in storage.

(function () {
  const KEY_LOCATION = "weatherfit.v1.location";
  const KEY_CHARACTERS = "weatherfit.v1.characters";
  const KEY_MAIN = "weatherfit.v1.main";
  const KEY_CACHE = "weatherfit.v1.cache";
  const MAX_CHARACTERS = 5;

  // localStorage can throw or be absent (private windows, blocked site data). Every access is
  // guarded, and the app keeps working from this in-memory copy, just without surviving a reload.
  const memory = {};

  function readRaw(key) {
    try {
      const value = window.localStorage.getItem(key);
      return value === null ? (memory[key] === undefined ? null : memory[key]) : value;
    } catch (err) {
      return memory[key] === undefined ? null : memory[key];
    }
  }

  function writeRaw(key, value) {
    memory[key] = value;
    try {
      window.localStorage.setItem(key, value);
    } catch (err) {
      // memory copy above is the fallback
    }
  }

  function removeRaw(key) {
    delete memory[key];
    try {
      window.localStorage.removeItem(key);
    } catch (err) {
      // nothing to do
    }
  }

  // Corrupt or hand-edited JSON is treated as "nothing saved", never as a crash.
  function readJson(key) {
    const raw = readRaw(key);
    if (raw === null) return null;
    try {
      return JSON.parse(raw);
    } catch (err) {
      return null;
    }
  }

  // Same 2-decimal rounding as Variation.seedKeyFor, so a place is "the same place" in both.
  function locationKey(location) {
    return location.latitude.toFixed(2) + "," + location.longitude.toFixed(2);
  }

  // --- Location -----------------------------------------------------------------------------
  function getLocation() {
    const saved = readJson(KEY_LOCATION);
    const valid = saved && typeof saved.latitude === "number" && typeof saved.longitude === "number";
    return valid ? saved : null;
  }

  // Replaces the saved location. If it is a different place, the old place's cache is dropped.
  function setLocation(location) {
    const previous = getLocation();
    writeRaw(
      KEY_LOCATION,
      JSON.stringify({
        name: location.name,
        state: location.state || "",
        latitude: location.latitude,
        longitude: location.longitude,
      })
    );
    if (!previous || locationKey(previous) !== locationKey(location)) removeRaw(KEY_CACHE);
  }

  // --- Characters ---------------------------------------------------------------------------
  // First run has one neutral character so the main screen always has someone to show.
  // Trait fields (body type, hair, ...) are added by the character builder.
  function defaultCharacters() {
    return [{ id: "char-1", personality: "neutral" }];
  }

  function getCharacters() {
    const saved = readJson(KEY_CHARACTERS);
    const valid = Array.isArray(saved) && saved.length >= 1 && saved.length <= MAX_CHARACTERS;
    return valid ? saved : defaultCharacters();
  }

  function saveCharacters(characters) {
    if (!Array.isArray(characters) || characters.length < 1 || characters.length > MAX_CHARACTERS) {
      throw new Error("Between 1 and " + MAX_CHARACTERS + " characters are required");
    }
    writeRaw(KEY_CHARACTERS, JSON.stringify(characters));
  }

  // The "main" character stands in the middle of the scene and its wording is the one the
  // reminders show. If none is chosen (or the chosen one was removed), the first character is main.
  function getMainCharacterId() {
    const characters = getCharacters();
    const saved = readRaw(KEY_MAIN);
    return characters.some((c) => c.id === saved) ? saved : characters[0].id;
  }

  function setMainCharacterId(id) {
    if (!getCharacters().some((c) => c.id === id)) throw new Error("No saved character with id " + id);
    writeRaw(KEY_MAIN, id);
  }

  // --- Recommendation cache -----------------------------------------------------------------
  // Shape: { locationKey, entries: { "<date>|<characterId>": { fingerprint, state } } }
  function readCache(location) {
    const cache = readJson(KEY_CACHE);
    const usable = cache && cache.locationKey === locationKey(location) && cache.entries && typeof cache.entries === "object";
    return usable ? cache : { locationKey: locationKey(location), entries: {} };
  }

  // What makes a cached state stale: anything that would change what the character shows.
  // That is the rule outcome (category, icon, active reminders, forecast flag) plus the personality
  // (it weights the outfit). Raw readings are left out on purpose: today's live temperature moves
  // every few minutes and would otherwise discard a still-correct state each time.
  function fingerprintFor(evaluation, personality) {
    return JSON.stringify([
      evaluation.outfitCategory,
      evaluation.weatherConditionIcon,
      evaluation.activeReminders,
      evaluation.isForecast,
      personality,
    ]);
  }

  function getCachedState(location, date, characterId, fingerprint) {
    const entry = readCache(location).entries[date + "|" + characterId];
    return entry && entry.fingerprint === fingerprint ? entry.state : null;
  }

  function setCachedState(location, date, characterId, fingerprint, state) {
    const cache = readCache(location);
    cache.entries[date + "|" + characterId] = { fingerprint: fingerprint, state: state };
    writeRaw(KEY_CACHE, JSON.stringify(cache));
  }

  // Drops entries for dates before `today` ("YYYY-MM-DD"; ISO dates compare correctly as text),
  // keeping the cache to at most 5 characters x 15 days.
  function pruneCache(location, today) {
    const cache = readCache(location);
    Object.keys(cache.entries).forEach((entryKey) => {
      if (entryKey.split("|")[0] < today) delete cache.entries[entryKey];
    });
    writeRaw(KEY_CACHE, JSON.stringify(cache));
  }

  // The one call screens use: reuse the cached state when still valid, otherwise resolve and cache.
  // Needs window.Variation (variation.js) loaded first.
  function resolveWithCache(evaluation, location, date, character) {
    const fingerprint = fingerprintFor(evaluation, character.personality);
    const cached = getCachedState(location, date, character.id, fingerprint);
    if (cached) return cached;
    const state = window.Variation.resolve(evaluation, location, date, character);
    setCachedState(location, date, character.id, fingerprint, state);
    return state;
  }

  // Settings "reset": forget everything this app saved.
  function clearAll() {
    [KEY_LOCATION, KEY_CHARACTERS, KEY_MAIN, KEY_CACHE].forEach(removeRaw);
  }

  window.AppStore = {
    MAX_CHARACTERS,
    locationKey,
    getLocation,
    setLocation,
    getCharacters,
    saveCharacters,
    getMainCharacterId,
    setMainCharacterId,
    fingerprintFor,
    getCachedState,
    setCachedState,
    pruneCache,
    resolveWithCache,
    clearAll,
  };
})();
