// Main screen. render() draws one view from data; start() loads the real data and calls it.
// Every figure, icon and sentence on the screen is read from the per-character recommendation
// state (AppStore.resolveWithCache -> Variation.resolve), so nothing can contradict anything else.
// Exposes window.App.

(function () {
  function esc(text) {
    return String(text).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  }

  // "2026-10-12" (the place's own calendar date) -> "Mon, Oct 12". Built from parts, not parsed as
  // UTC, so the weekday can't slip a day in other time zones.
  function formatDate(isoDate) {
    const [y, m, d] = isoDate.split("-").map(Number);
    return new Date(y, m - 1, d).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
  }

  function stateAbbreviation(stateName) {
    const entry = Object.entries(WeatherApi.STATE_NAMES).find(([, name]) => name === stateName);
    return entry ? entry[0] : stateName;
  }

  const placeName = (location) => (location.state ? location.name + ", " + stateAbbreviation(location.state) : location.name);

  function findVariation(id) {
    for (const list of Object.values(Variation.OUTFIT_VARIATIONS)) {
      const found = list.find((v) => v.id === id);
      if (found) return found;
    }
    return null;
  }

  // One character: its state drives the drawing, the caption and the accessible description.
  function characterHtml(character, state, index) {
    const variation = findVariation(state.outfitVariation);
    const alt = "Character " + (index + 1) + ", " + character.personality + ", wearing " + variation.name.toLowerCase();
    const art = Art.characterSvg({
      category: state.outfitCategory,
      outfitId: state.outfitVariation,
      tag: variation.tag,
      personality: character.personality,
      skin: character.skinColor,
      alt: alt,
    });
    return (
      '<figure class="character" data-personality="' + esc(character.personality) + '" data-outfit="' + esc(state.outfitVariation) + '">' +
      art +
      "<figcaption>" + esc(variation.name) + "</figcaption></figure>"
    );
  }

  // Reminders sit next to the condition text and only exist when triggered. Wording comes from the
  // first character's state: the weather decides WHICH reminders show, the seed decides the phrasing.
  function remindersHtml(state) {
    if (!state.activeReminders.length) return "";
    const items = state.activeReminders
      .map((reminder) => {
        const wordingNumber = Number(reminder.wordingVariation.split("-").pop());
        const text = Variation.REMINDER_WORDINGS[reminder.type][wordingNumber - 1];
        return '<li data-reminder="' + reminder.type + '">' + Art.reminderIcon(reminder.type, { decorative: true, size: 20 }) + "<span>" + esc(text) + "</span></li>";
      })
      .join("");
    return '<ul class="reminders" aria-label="Reminders">' + items + "</ul>";
  }

  // Character and Settings arrive in later checkpoints, so they are present but inactive for now.
  const navHtml =
    '<nav class="tabbar" aria-label="Main">' +
    '<button type="button" class="tab" aria-current="page"><svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><path d="M4 11l8-7 8 7v9H4z"/></svg><span>Home</span></button>' +
    '<button type="button" class="tab" disabled><svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></svg><span>Character</span></button>' +
    '<button type="button" class="tab" disabled><svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1L7 17M17 7l2.1-2.1"/></svg><span>Settings</span></button>' +
    "</nav>";

  const sourceHtml =
    '<p class="source">Weather data by <a href="https://open-meteo.com/" target="_blank" rel="noopener">Open-Meteo</a> (CC BY 4.0)</p>';

  // view = { location, days, dayIndex, characters }
  function render(root, view) {
    const day = view.days[view.dayIndex];
    const evaluation = Recommend.evaluate(day);
    const states = view.characters.map((character) => AppStore.resolveWithCache(evaluation, view.location, day.date, character));
    const first = states[0];
    const icon = first.weatherConditionIcon;
    const temp = Math.round(day.temperatureF);

    root.innerHTML =
      '<div class="screen">' +
      '<div class="scene">' + Art.sceneSvg() +
      '<div class="sky-icon" data-icon="' + icon + '">' + Art.weatherIcon(icon, { decorative: true, size: 120 }) + "</div></div>" +
      '<header class="top">' +
      '<button type="button" class="ctl" data-action="date" disabled><span>Date</span></button>' +
      '<div class="summary">' +
      '<p class="date">' + esc(formatDate(day.date)) + (first.isForecast ? ' <span class="badge">Forecast</span>' : "") + "</p>" +
      '<p class="weather">' + Art.weatherIcon(icon, { decorative: true, size: 30 }) +
      '<span class="temp">' + (first.isForecast ? '<span class="temp-label">High</span> ' : "") + temp + "°F</span>" +
      '<span class="cond">' + esc(Art.WEATHER_ICONS[icon].label) + "</span></p>" +
      '<p class="place">' + esc(placeName(view.location)) + "</p>" +
      remindersHtml(first) +
      "</div>" +
      '<button type="button" class="ctl" data-action="location" disabled><span>Location</span></button>' +
      "</header>" +
      '<main class="stage">' + view.characters.map((c, i) => characterHtml(c, states[i], i)).join("") + "</main>" +
      sourceHtml + navHtml +
      "</div>";
  }

  // First run: no saved location yet. The location picker arrives in the next checkpoint.
  function renderNoLocation(root) {
    root.innerHTML =
      '<div class="screen"><div class="scene">' + Art.sceneSvg() + "</div>" +
      '<header class="top"><span></span><div class="summary"><p class="place">Choose a location to see today\'s outfit</p></div>' +
      '<button type="button" class="ctl" data-action="location" disabled><span>Location</span></button></header>' +
      '<main class="stage"></main>' + sourceHtml + navHtml + "</div>";
  }

  // Plain-text placeholders with the final wording; the icon and back-button layouts come with the
  // Error/Loading checkpoint.
  function renderMessage(root, text) {
    root.innerHTML = '<div class="screen message"><p role="status">' + esc(text) + "</p></div>";
  }

  const ERROR_TEXT = {
    network: "Error. Reload the page.",
    service: "Error. Reload the page.",
    missing: "Missing data, try again in a moment.",
  };

  async function start(root) {
    const location = AppStore.getLocation();
    if (!location) return renderNoLocation(root);

    renderMessage(root, "Loading");
    try {
      const weather = await WeatherApi.fetchWeather(location.latitude, location.longitude);
      render(root, { location: location, days: weather.days, dayIndex: 0, characters: AppStore.getCharacters() });
    } catch (err) {
      renderMessage(root, ERROR_TEXT[err.code] || ERROR_TEXT.service);
    }
  }

  window.App = { render, renderNoLocation, renderMessage, start, formatDate };
})();
