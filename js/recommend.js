// Recommendation rules: temperature category, weather icon, and active reminders.
// Pure functions of one normalized day from WeatherApi (see weather.js). No DOM, no randomness.
// Bands and thresholds come from research.md ("Apparel guidance and reminder thresholds").
// Variation picking (seeded random) is a separate step layered on top of this result.

(function () {
  // Upper bound (inclusive, on the whole-degree temperature) for each band, lowest first.
  const TEMPERATURE_BANDS = [
    { category: "freezing", maxF: 31 },
    { category: "cold", maxF: 45 },
    { category: "cool", maxF: 60 },
    { category: "mild", maxF: 74 },
    { category: "warm", maxF: 80 },
    { category: "hot", maxF: 89 },
    { category: "extreme_heat", maxF: Infinity },
  ];

  const SUNSCREEN_UV_MIN = 3; // EPA UV Index "Moderate" and up
  const UMBRELLA_PRECIP_MIN = 40; // percent chance of precipitation
  const HEAT_INDEX_MIN_F = 90; // NWS Heat Index "Hot" classification and up
  const WIND_CHILL_MAX_TEMP_F = 50; // NWS wind chill applies at or below 50 F...
  const WIND_CHILL_MIN_WIND_MPH = 3; // ...with wind of at least 3 mph
  // "Meaningfully below the actual temperature" is not defined by the NWS source, so this is
  // a project choice: flag the cold caution when wind chill is at least this many degrees lower.
  const WIND_CHILL_MIN_DROP_F = 5;

  // The bands in research.md have no gaps only for whole degrees (45 is Cold, 46 is Cool), and
  // forecasts arrive as decimals (45.4, 45.6). Rounding first keeps the band consistent with the
  // whole-degree temperature shown on screen.
  function categoryFor(temperatureF) {
    const rounded = Math.round(temperatureF);
    return TEMPERATURE_BANDS.find((band) => rounded <= band.maxF).category;
  }

  // NWS heat index (Rothfusz regression with the NWS adjustments), in F.
  // Equation as published at https://www.wpc.ncep.noaa.gov/html/heatindex_equation.shtml
  function heatIndexF(temperatureF, humidityPercent) {
    const t = temperatureF;
    const rh = humidityPercent;
    // Simple Steadman-style formula first; if its average with the temperature is under 80 F
    // the regression isn't appropriate and the simple result stands.
    const simple = 0.5 * (t + 61.0 + (t - 68.0) * 1.2 + rh * 0.094);
    if ((simple + t) / 2 < 80) return simple;

    let hi =
      -42.379 +
      2.04901523 * t +
      10.14333127 * rh -
      0.22475541 * t * rh -
      0.00683783 * t * t -
      0.05481717 * rh * rh +
      0.00122874 * t * t * rh +
      0.00085282 * t * rh * rh -
      0.00000199 * t * t * rh * rh;
    if (rh < 13 && t >= 80 && t <= 112) hi -= ((13 - rh) / 4) * Math.sqrt((17 - Math.abs(t - 95)) / 17);
    if (rh > 85 && t >= 80 && t <= 87) hi += ((rh - 85) / 10) * ((87 - t) / 5);
    return hi;
  }

  // NWS wind chill in F, or null when the formula doesn't apply (too warm or too little wind).
  // Equation: https://www.weather.gov/media/ajk/brochures/Wind_Chill_Temperature_Index.pdf
  function windChillF(temperatureF, windMph) {
    if (temperatureF > WIND_CHILL_MAX_TEMP_F || windMph < WIND_CHILL_MIN_WIND_MPH) return null;
    const gust = Math.pow(windMph, 0.16);
    return 35.74 + 0.6215 * temperatureF - 35.75 * gust + 0.4275 * temperatureF * gust;
  }

  // Each reminder is evaluated on its own; any combination (including none) can be active.
  function activeReminders(day) {
    const reminders = [];
    if (day.uvIndex >= SUNSCREEN_UV_MIN) reminders.push("sunscreen");
    if (day.precipProbability >= UMBRELLA_PRECIP_MIN) reminders.push("umbrella");
    if (heatIndexF(day.temperatureF, day.humidity) >= HEAT_INDEX_MIN_F) reminders.push("hydration");
    const chill = windChillF(day.temperatureF, day.windMph);
    if (chill !== null && day.temperatureF - chill >= WIND_CHILL_MIN_DROP_F) reminders.push("cold_caution");
    return reminders;
  }

  // WMO weather code (what Open-Meteo returns) -> one of the 7 icon keys in spec.md's asset list.
  // "windy_fog" covers fog codes only; wind itself isn't part of the code, and the spec gives
  // no wind-speed rule for the icon.
  function iconFor(weatherCode) {
    const code = weatherCode;
    if (code === 0 || code === 1) return "clear";
    if (code === 2) return "partly_cloudy";
    if (code === 3) return "cloudy";
    if (code === 45 || code === 48) return "windy_fog";
    if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) return "rain";
    if ((code >= 71 && code <= 77) || code === 85 || code === 86) return "snow";
    if (code >= 95 && code <= 99) return "thunderstorm";
    return "cloudy"; // unknown code: neutral fallback rather than a wrong-looking icon
  }

  // Everything the rules decide for one day, before any random variation is applied.
  function evaluate(day) {
    return {
      outfitCategory: categoryFor(day.temperatureF),
      weatherConditionIcon: iconFor(day.weatherCode),
      activeReminders: activeReminders(day),
      isForecast: !day.isToday,
    };
  }

  window.Recommend = { categoryFor, heatIndexF, windChillF, activeReminders, iconFor, evaluate };
})();
