// Main screen and its pickers. render() draws one view from data; start() owns the screen's
// state: it loads the saved place, handles the date and location pickers, and re-renders.
// Every figure, icon and sentence on the screen is read from the per-character recommendation
// state (AppStore.resolveWithCache -> Variation.resolve), so nothing can contradict anything else.
// Exposes window.App.

(function () {
  function esc(text) {
    return String(text).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  }

  // "2026-10-12" (the place's own calendar date) -> "Mon, Oct 12". Built from parts, not parsed as
  // UTC, so the weekday can't slip a day in other time zones.
  function localDate(isoDate) {
    const [y, m, d] = isoDate.split("-").map(Number);
    return new Date(y, m - 1, d);
  }

  function formatDate(isoDate) {
    return localDate(isoDate).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
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

  // The main character stands in the middle of the row; the others fill in around it, in order.
  // 1 character: [main]   2: [other, main]   3: [a, main, b]   5: [a, b, main, c, d]
  function orderForStage(characters, mainId) {
    const main = characters.find((c) => c.id === mainId) || characters[0];
    const ordered = characters.filter((c) => c !== main);
    ordered.splice(Math.floor(characters.length / 2), 0, main);
    return ordered;
  }

  const ICON_ARROW_LEFT = '<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M15 5l-7 7 7 7"/></svg>';
  const ICON_ARROW_RIGHT = '<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M9 5l7 7-7 7"/></svg>';
  const ICON_PIN = '<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M12 21s7-6.2 7-11.5a7 7 0 0 0-14 0C5 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/></svg>';

  // One character: its state drives the drawing, the caption and the accessible description.
  function characterHtml(character, state, number, isMain, total) {
    const variation = findVariation(state.outfitVariation);
    const alt =
      "Character " + number + (isMain && total > 1 ? " (main)" : "") + ", " + character.personality + ", wearing " + variation.name.toLowerCase();
    const art = Art.characterSvg({
      character: character,
      category: state.outfitCategory,
      outfitId: state.outfitVariation,
      tag: variation.tag,
      alt: alt,
    });
    return (
      '<figure class="character' + (isMain ? " main" : "") + '" data-personality="' + esc(character.personality) + '" data-outfit="' + esc(state.outfitVariation) +
      '" data-character="' + esc(character.id) + '"' + (isMain ? ' data-main="true"' : "") + ">" +
      art +
      "<figcaption>" + esc(variation.name) + "</figcaption></figure>"
    );
  }

  // Reminders sit next to the condition text and only exist when triggered. The weather decides
  // WHICH reminders show; the wording is the main character's.
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

  // Bottom navigation, shared by every screen. `current` is "home" or "character"; Settings arrives
  // in a later checkpoint, so it is present but inactive for now.
  function navHtml(current) {
    const tab = (name, action, label, icon, disabled) =>
      '<button type="button" class="tab"' + (action ? ' data-action="' + action + '"' : "") + (disabled ? " disabled" : "") +
      (current === name ? ' aria-current="page"' : "") + ">" + icon + "<span>" + label + "</span></button>";
    const svg = (body, extra) =>
      '<svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" ' + (extra || "") + ">" + body + "</svg>";
    return (
      '<nav class="tabbar" aria-label="Main">' +
      tab("home", "nav-home", "Home", svg('<path d="M4 11l8-7 8 7v9H4z"/>', 'stroke-linejoin="round"')) +
      tab("character", "nav-character", "Character", svg('<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>')) +
      tab("settings", null, "Settings", svg('<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1L7 17M17 7l2.1-2.1"/>', 'stroke-linecap="round"'), true) +
      "</nav>"
    );
  }

  const sourceHtml =
    '<p class="source">Weather data by <a href="https://open-meteo.com/" target="_blank" rel="noopener">Open-Meteo</a> (CC BY 4.0)</p>';

  // Date and location controls sit just above the nav bar, in thumb reach (a decision made after
  // the first build: the sketch's top-corner buttons were hard to reach one-handed).
  function controlsHtml(view) {
    const dateBar = view.days
      ? '<div class="datebar" role="group" aria-label="Date">' +
        '<button type="button" class="ctl ctl-step" data-action="prev-day" aria-label="Previous day"' + (view.dayIndex === 0 ? " disabled" : "") + ">" + ICON_ARROW_LEFT + "</button>" +
        '<button type="button" class="ctl ctl-main" data-action="open-date" aria-haspopup="dialog"><span>' + esc(formatDate(view.days[view.dayIndex].date)) + "</span></button>" +
        '<button type="button" class="ctl ctl-step" data-action="next-day" aria-label="Next day"' + (view.dayIndex === view.days.length - 1 ? " disabled" : "") + ">" + ICON_ARROW_RIGHT + "</button>" +
        "</div>"
      : "";
    const label = view.location ? placeName(view.location) : "Choose location";
    return (
      '<div class="controls' + (view.days ? "" : " controls-single") + '">' + dateBar +
      '<button type="button" class="ctl ctl-place" data-action="open-location" aria-haspopup="dialog" aria-label="Location: ' + esc(label) + '. Change location">' +
      ICON_PIN + "<span>" + esc(label) + "</span></button></div>"
    );
  }

  // view = { location, days, dayIndex, characters, mainId }
  function render(root, view) {
    const day = view.days[view.dayIndex];
    const evaluation = Recommend.evaluate(day);
    const mainId = view.mainId || view.characters[0].id;
    const stateOf = (character) => AppStore.resolveWithCache(evaluation, view.location, day.date, character);
    const mainCharacter = view.characters.find((c) => c.id === mainId) || view.characters[0];
    const mainState = stateOf(mainCharacter);
    const icon = mainState.weatherConditionIcon;
    const temp = Math.round(day.temperatureF);
    const figures = orderForStage(view.characters, mainCharacter.id)
      .map((c) => characterHtml(c, stateOf(c), view.characters.indexOf(c) + 1, c === mainCharacter, view.characters.length))
      .join("");

    root.innerHTML =
      '<div class="screen">' +
      '<div class="scene">' + Art.sceneSvg() +
      '<div class="sky-icon" data-icon="' + icon + '">' + Art.weatherIcon(icon, { decorative: true, size: 120 }) + "</div></div>" +
      '<header class="top"><div class="summary">' +
      '<p class="date">' + esc(formatDate(day.date)) + (mainState.isForecast ? ' <span class="badge">Forecast</span>' : "") + "</p>" +
      '<p class="weather">' + Art.weatherIcon(icon, { decorative: true, size: 30 }) +
      '<span class="temp">' + (mainState.isForecast ? '<span class="temp-label">High</span> ' : "") + temp + "°F</span>" +
      '<span class="cond">' + esc(Art.WEATHER_ICONS[icon].label) + "</span></p>" +
      '<p class="place">' + esc(placeName(view.location)) + "</p>" +
      remindersHtml(mainState) +
      "</div></header>" +
      '<main class="stage">' + figures + "</main>" +
      controlsHtml(view) + sourceHtml + navHtml("home") +
      "</div>";
  }

  // First run: no saved location yet.
  function renderNoLocation(root) {
    root.innerHTML =
      '<div class="screen"><div class="scene">' + Art.sceneSvg() + "</div>" +
      '<header class="top"><div class="summary"><p class="place">Choose a location to see today\'s outfit</p></div></header>' +
      '<main class="stage"></main>' + controlsHtml({}) + sourceHtml + navHtml("home") + "</div>";
  }

  // Plain-text placeholders with the final wording; the icon layouts come with the Error/Loading
  // checkpoint. `back` adds the Back button (spec requirement 17) for flows started from a picker.
  function renderMessage(root, text, back) {
    root.innerHTML =
      '<div class="screen message"><p role="status">' + esc(text) + "</p>" +
      (back ? '<button type="button" class="btn" data-action="back">Back</button>' : "") + "</div>";
  }

  const ERROR_TEXT = {
    network: "Error. Reload the page.",
    service: "Error. Reload the page.",
    missing: "Missing data, try again in a moment.",
    permission_denied: "Denied location permission.",
  };
  const errorText = (err) => ERROR_TEXT[err && err.code] || ERROR_TEXT.service;

  // --- Pickers (bottom sheets) ---------------------------------------------------------------
  const WEEKDAY_LETTERS = ["S", "M", "T", "W", "T", "F", "S"];

  // Calendar of exactly today..today+14 (the forecast range). Days outside the range are not
  // buttons at all, so there is nothing to pick beyond it (spec requirement 2).
  function dateSheetHtml(days, dayIndex) {
    const offset = localDate(days[0].date).getDay(); // blank cells so each day sits under its weekday
    const cells = Array.from({ length: offset }, () => '<span class="cal-blank"></span>');
    days.forEach((day, i) => {
      const date = localDate(day.date);
      const showMonth = i === 0 || date.getDate() === 1;
      const label = formatDate(day.date) + (i === 0 ? " (today)" : "");
      cells.push(
        '<button type="button" class="cal-day" data-day="' + i + '" aria-label="' + esc(label) + '" aria-pressed="' + (i === dayIndex) + '">' +
        (showMonth ? '<span class="cal-month">' + date.toLocaleDateString("en-US", { month: "short" }) + "</span>" : "") +
        "<span>" + date.getDate() + "</span></button>"
      );
    });
    return (
      '<div class="sheet-head"><h2 id="sheet-title">Choose a date</h2><button type="button" class="sheet-close" data-action="close-sheet" aria-label="Close">&times;</button></div>' +
      '<p class="sheet-note">Today through ' + esc(formatDate(days[days.length - 1].date)) + "</p>" +
      '<div class="cal-head" aria-hidden="true">' + WEEKDAY_LETTERS.map((l) => "<span>" + l + "</span>").join("") + "</div>" +
      '<div class="cal" role="group" aria-label="Dates">' + cells.join("") + "</div>"
    );
  }

  function locationSheetHtml() {
    return (
      '<div class="sheet-head"><h2 id="sheet-title">Choose a location</h2><button type="button" class="sheet-close" data-action="close-sheet" aria-label="Close">&times;</button></div>' +
      '<button type="button" class="btn btn-wide" data-action="use-device">Use my location</button>' +
      '<p class="sheet-note">or type a US city</p>' +
      '<form class="search" data-form="search">' +
      '<label for="city-input" class="visually-hidden">US city</label>' +
      '<input id="city-input" name="city" type="text" autocomplete="off" autocapitalize="words" enterkeyhint="search" placeholder="Austin, TX">' +
      '<button type="submit" class="btn">Search</button></form>' +
      '<p class="sheet-status" role="status" aria-live="polite"></p>' +
      '<ul class="results" aria-label="Matching cities"></ul>'
    );
  }

  const FOCUSABLE = 'button:not([disabled]), input, a[href], [tabindex]:not([tabindex="-1"])';

  // --- Screen controller -----------------------------------------------------------------------
  // Owns one screen's state (place, loaded weather, selected day) and wires clicks to it.
  // Resolves once the first load has finished, so callers (and tests) can await it.
  async function start(root) {
    const state = {
      location: null,
      weather: null,
      dayIndex: 0,
      loadId: 0, // a newer request makes older, slower ones stale so they can't overwrite it
      searchId: 0,
      places: [],
      opener: null,
    };
    let rendered = false; // is there a previous screen for Back to return to?

    const sheetLayer = () => root.querySelector(".sheet-layer");
    const setStatus = (text) => {
      const el = root.querySelector(".sheet-status");
      if (el) el.textContent = text;
    };
    const focusAction = (action) => {
      const el = root.querySelector('[data-action="' + action + '"]');
      if (el && !el.disabled) el.focus();
    };

    function showMain() {
      render(root, {
        location: state.location,
        days: state.weather.days,
        dayIndex: state.dayIndex,
        characters: AppStore.getCharacters(),
        mainId: AppStore.getMainCharacterId(),
      });
      rendered = true;
    }

    function showNoLocation() {
      renderNoLocation(root);
      rendered = true;
    }

    // Back returns to whatever was on screen before the picker flow began.
    function goBack() {
      if (state.weather) showMain();
      else showNoLocation();
    }

    // Home tab (from the character builder): characters may have changed, so redraw from storage.
    function goHome() {
      window.Builder.hide();
      if (state.weather) showMain();
      else showNoLocation();
    }

    function openSheet(kind) {
      closeSheet(false);
      state.searchId++; // anything still pending from an earlier sheet is now stale
      state.opener = document.activeElement;
      const layer = document.createElement("div");
      layer.className = "sheet-layer";
      layer.innerHTML =
        '<div class="backdrop" data-action="close-sheet"></div>' +
        '<div class="sheet" role="dialog" aria-modal="true" aria-labelledby="sheet-title">' +
        (kind === "date" ? dateSheetHtml(state.weather.days, state.dayIndex) : locationSheetHtml()) + "</div>";
      root.querySelector(".screen").appendChild(layer);
      const first = kind === "date" ? layer.querySelector('[aria-pressed="true"]') : layer.querySelector("#city-input");
      (first || layer.querySelector(FOCUSABLE)).focus();
    }

    function closeSheet(restoreFocus) {
      const layer = sheetLayer();
      if (!layer) return;
      layer.remove();
      if (restoreFocus !== false && state.opener && root.contains(state.opener)) state.opener.focus();
    }

    function selectDay(index) {
      state.dayIndex = index;
      showMain();
    }

    // Fetches weather for a place and shows it. The place is saved only once its weather has
    // loaded, so a failed lookup never replaces the previous location.
    async function loadPlace(place) {
      const id = ++state.loadId;
      closeSheet(false);
      renderMessage(root, "Loading", false);
      try {
        const weather = await WeatherApi.fetchWeather(place.latitude, place.longitude);
        if (id !== state.loadId) return;
        AppStore.setLocation(place);
        AppStore.pruneCache(place, weather.days[0].date);
        state.location = place;
        state.weather = weather;
        state.dayIndex = 0;
        showMain();
      } catch (err) {
        if (id !== state.loadId) return;
        renderMessage(root, errorText(err), rendered);
      }
    }

    // A search or location request is dropped if a newer one started or the sheet was closed
    // (closing the sheet is how the user cancels).
    const isStale = (id) => id !== state.searchId || !sheetLayer();

    async function search(query) {
      const text = query.trim();
      const id = ++state.searchId;
      root.querySelector(".results").innerHTML = "";
      if (!text) return setStatus("Type a US city, like Austin, TX.");
      setStatus("Searching…");
      let places;
      try {
        places = await WeatherApi.geocodeCity(text);
      } catch (err) {
        if (isStale(id)) return;
        if (err.code === "not_found") return setStatus('No US city found for "' + text + '".');
        closeSheet(false);
        return renderMessage(root, errorText(err), rendered);
      }
      if (isStale(id)) return;
      if (places.length === 1) return loadPlace(places[0]);
      state.places = places;
      root.querySelector(".results").innerHTML = places
        .map((p, i) => '<li><button type="button" class="result" data-place="' + i + '">' + esc(placeName(p)) + "</button></li>")
        .join("");
      setStatus(places.length + " matches. Choose one.");
    }

    async function useDeviceLocation() {
      const id = ++state.searchId;
      setStatus("Finding your location…");
      let place;
      try {
        place = await WeatherApi.getDeviceLocation();
      } catch (err) {
        if (isStale(id)) return;
        closeSheet(false);
        return renderMessage(root, errorText(err), rendered);
      }
      if (isStale(id)) return;
      loadPlace(place);
    }

    root.addEventListener("click", (event) => {
      const target = event.target.closest("[data-action], [data-day], [data-place]");
      if (!target || !root.contains(target)) return;
      if (target.dataset.day !== undefined) {
        closeSheet(false);
        selectDay(Number(target.dataset.day));
        return focusAction("open-date");
      }
      if (target.dataset.place !== undefined) return loadPlace(state.places[Number(target.dataset.place)]);
      switch (target.dataset.action) {
        case "open-date": return openSheet("date");
        case "open-location": return openSheet("location");
        case "close-sheet": return closeSheet();
        case "prev-day":
          selectDay(Math.max(0, state.dayIndex - 1));
          return focusAction(state.dayIndex === 0 ? "open-date" : "prev-day");
        case "next-day":
          selectDay(Math.min(state.weather.days.length - 1, state.dayIndex + 1));
          return focusAction(state.dayIndex === state.weather.days.length - 1 ? "open-date" : "next-day");
        case "use-device": return useDeviceLocation();
        case "back": return goBack();
        case "nav-character":
          closeSheet(false);
          state.searchId++; // anything pending from a picker is now stale
          return window.Builder.show();
        case "nav-home": return window.Builder && window.Builder.isActive() ? goHome() : undefined;
      }
    });

    root.addEventListener("submit", (event) => {
      if (event.target.dataset.form !== "search") return;
      event.preventDefault();
      search(event.target.elements.city.value);
    });

    root.addEventListener("keydown", (event) => {
      const layer = sheetLayer();
      if (!layer) return;
      if (event.key === "Escape") return closeSheet();
      if (event.key !== "Tab") return;
      // Keep Tab inside the open dialog.
      const items = Array.from(layer.querySelectorAll(FOCUSABLE));
      const first = items[0];
      const last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    });

    if (window.Builder) window.Builder.attach(root); // the Character tab; it has its own handlers

    // First screen: the saved place if there is one, otherwise the location picker straight away.
    const saved = AppStore.getLocation();
    if (!saved) {
      showNoLocation();
      openSheet("location");
      return;
    }
    await loadPlace(saved);
  }

  window.App = { render, renderNoLocation, renderMessage, start, formatDate, orderForStage, navHtml };
})();
