// Open-Meteo access: US city geocoding + current/forecast weather.
// Keyless, called straight from the browser (see research.md, "Weather provider").
// Exposes window.WeatherApi. No UI here; screens call these and handle WeatherApiError.

(function () {
  const GEOCODE_URL = "https://geocoding-api.open-meteo.com/v1/search";
  const FORECAST_URL = "https://api.open-meteo.com/v1/forecast";
  const FORECAST_DAYS = 15; // today + 14 days ahead (spec requirement 2)

  // code maps to the Error/Loading screen states in spec requirement 17:
  //   "network" / "service" -> "Error. Reload the page."
  //   "missing"             -> "Missing data, try again in a moment."
  //   "not_found"           -> no matching US city (shown inline by the location picker)
  //   "permission_denied"   -> "Denied location permission." (device location only)
  class WeatherApiError extends Error {
    constructor(code, message) {
      super(message);
      this.name = "WeatherApiError";
      this.code = code;
    }
  }

  async function fetchJson(url) {
    let response;
    try {
      response = await fetch(url);
    } catch (err) {
      throw new WeatherApiError("network", "Could not reach Open-Meteo");
    }
    if (!response.ok) {
      throw new WeatherApiError("service", "Open-Meteo returned HTTP " + response.status);
    }
    try {
      return await response.json();
    } catch (err) {
      throw new WeatherApiError("service", "Open-Meteo returned unreadable data");
    }
  }

  // The geocoder returns full state names ("Texas"), but people type "TX".
  const STATE_NAMES = {
    AL: "Alabama", AK: "Alaska", AZ: "Arizona", AR: "Arkansas", CA: "California", CO: "Colorado",
    CT: "Connecticut", DE: "Delaware", DC: "District of Columbia", FL: "Florida", GA: "Georgia",
    HI: "Hawaii", ID: "Idaho", IL: "Illinois", IN: "Indiana", IA: "Iowa", KS: "Kansas",
    KY: "Kentucky", LA: "Louisiana", ME: "Maine", MD: "Maryland", MA: "Massachusetts",
    MI: "Michigan", MN: "Minnesota", MS: "Mississippi", MO: "Missouri", MT: "Montana",
    NE: "Nebraska", NV: "Nevada", NH: "New Hampshire", NJ: "New Jersey", NM: "New Mexico",
    NY: "New York", NC: "North Carolina", ND: "North Dakota", OH: "Ohio", OK: "Oklahoma",
    OR: "Oregon", PA: "Pennsylvania", RI: "Rhode Island", SC: "South Carolina", SD: "South Dakota",
    TN: "Tennessee", TX: "Texas", UT: "Utah", VT: "Vermont", VA: "Virginia", WA: "Washington",
    WV: "West Virginia", WI: "Wisconsin", WY: "Wyoming",
  };

  // Typed US city (e.g. "Austin" or "Austin, TX") -> list of matches with coordinates.
  async function geocodeCity(query) {
    const text = String(query || "").trim();
    if (!text) throw new WeatherApiError("not_found", "Empty city name");

    // The geocoder matches on the name only, so "Austin, MN" is split into name + state hint.
    const [name, stateHint] = text.split(",").map((part) => part.trim());
    const params = new URLSearchParams({
      name: name,
      count: "10",
      language: "en",
      format: "json",
      country_code: "US",
    });
    const data = await fetchJson(GEOCODE_URL + "?" + params);

    let results = (data.results || []).filter((r) => r.country_code === "US");
    if (stateHint) {
      const hint = (STATE_NAMES[stateHint.toUpperCase()] || stateHint).toLowerCase();
      const narrowed = results.filter((r) => String(r.admin1 || "").toLowerCase().startsWith(hint));
      if (narrowed.length) results = narrowed;
    }
    if (!results.length) throw new WeatherApiError("not_found", 'No US city found for "' + text + '"');

    return results.map((r) => ({
      name: r.name,
      state: r.admin1 || "",
      latitude: r.latitude,
      longitude: r.longitude,
      timezone: r.timezone,
    }));
  }

  // Device location, requested once per explicit user action (never watchPosition; see spec "Out of scope").
  // Open-Meteo has no reverse geocoder, so the place is labelled "Current location" rather than guessed.
  function getDeviceLocation() {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new WeatherApiError("service", "This browser has no geolocation support"));
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (position) =>
          resolve({
            name: "Current location",
            state: "",
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          }),
        (error) => {
          // 1 = PERMISSION_DENIED -> the "Denied location permission." screen (spec requirement 17)
          if (error.code === 1) reject(new WeatherApiError("permission_denied", "Location permission denied"));
          else reject(new WeatherApiError("service", "Could not determine device location"));
        },
        { timeout: 10000 }
      );
    });
  }

  // Coordinates -> normalized weather for today and the next 14 days.
  // days[0] is today. For today, temperature is the live current reading; for later days it is
  // the forecast daily high (the outfit is for being out during the day).
  async function fetchWeather(latitude, longitude) {
    const params = new URLSearchParams({
      latitude: String(latitude),
      longitude: String(longitude),
      current: "temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code",
      daily: [
        "weather_code",
        "temperature_2m_max",
        "temperature_2m_min",
        "precipitation_probability_max",
        "uv_index_max",
        "wind_speed_10m_max",
        "relative_humidity_2m_mean",
      ].join(","),
      temperature_unit: "fahrenheit",
      wind_speed_unit: "mph",
      timezone: "auto",
      forecast_days: String(FORECAST_DAYS),
    });
    const data = await fetchJson(FORECAST_URL + "?" + params);
    return normalizeForecast(data);
  }

  // Exported separately so tests can feed it canned and deliberately broken responses.
  function normalizeForecast(data) {
    const daily = data && data.daily;
    const current = data && data.current;
    if (!daily || !Array.isArray(daily.time) || !daily.time.length || !current) {
      throw new WeatherApiError("missing", "Forecast response had no daily or current data");
    }

    const days = daily.time.map((date, i) => ({
      date: date, // "YYYY-MM-DD" in the location's own timezone
      isToday: i === 0,
      temperatureF: i === 0 ? current.temperature_2m : daily.temperature_2m_max[i],
      highF: daily.temperature_2m_max[i],
      lowF: daily.temperature_2m_min[i],
      precipProbability: daily.precipitation_probability_max[i],
      uvIndex: daily.uv_index_max[i],
      windMph: i === 0 ? current.wind_speed_10m : daily.wind_speed_10m_max[i],
      humidity: i === 0 ? current.relative_humidity_2m : daily.relative_humidity_2m_mean[i],
      weatherCode: i === 0 ? current.weather_code : daily.weather_code[i],
    }));

    // Any null in a field the recommendation needs counts as missing data, not a guess.
    const required = ["temperatureF", "precipProbability", "uvIndex", "windMph", "humidity", "weatherCode"];
    days.forEach((day) => {
      required.forEach((field) => {
        if (day[field] === null || day[field] === undefined) {
          throw new WeatherApiError("missing", day.date + " is missing " + field);
        }
      });
    });

    return { timezone: data.timezone, days: days };
  }

  window.WeatherApi = { geocodeCity, getDeviceLocation, fetchWeather, normalizeForecast, WeatherApiError, FORECAST_DAYS };
})();
