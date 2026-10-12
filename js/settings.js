// Settings screen (reference/sketch-settings.jpg, phone layout): a list of rows, each opening a page.
// Rows: Saved data, Privacy, Help, About. The sketch's Profile, Account and Log out are not built: this app has no
// accounts or logins (spec "Out of scope"). The About page holds the five topics the brief requires
// (creator, weather data source, recommendation methods and sources, privacy, art credits); the methodology
// is generated from the same constants the recommendation rules use, so the text cannot drift from the rules.
// Exposes window.Settings. App wires the nav tabs to show() and hide().

(function () {
  // Edit these to change what the About page says about the creator.
  const CREATOR = "inkinvader";
  const PROJECT = "Weather Fit, a non-commercial class project (AI Explorations)";

  const state = { root: null, active: false, view: "list", confirm: null, announce: "" };

  const esc = (text) => String(text).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  const link = (href, label) => '<a href="' + href + '" target="_blank" rel="noopener">' + esc(label) + "</a>";

  const ROWS = [
    { view: "data", label: "Saved data", hint: "Your location and characters on this device" },
    { view: "privacy", label: "Privacy", hint: "How your location is handled" },
    { view: "help", label: "Help", hint: "How the app works" },
    { view: "about", label: "About", hint: "Creator, data source, methods, art credits" },
  ];
  const TITLES = { list: "Settings", data: "Saved data", privacy: "Privacy", help: "Help", about: "About" };

  // --- Pages ---------------------------------------------------------------------------------
  function bandsTable() {
    const names = { freezing: "Freezing", cold: "Cold", cool: "Cool", mild: "Mild", warm: "Warm", hot: "Hot", extreme_heat: "Extreme heat" };
    let low = null;
    const rows = Recommend.TEMPERATURE_BANDS.map((band) => {
      const range = low === null ? "Below " + (band.maxF + 1) + "°F" : band.maxF === Infinity ? low + "°F and up" : low + " to " + band.maxF + "°F";
      low = band.maxF + 1;
      return "<tr><th scope=\"row\">" + names[band.category] + "</th><td>" + range + "</td></tr>";
    }).join("");
    return '<table class="doc-table"><caption>Outfit categories by temperature</caption><thead><tr><th scope="col">Category</th><th scope="col">Temperature</th></tr></thead><tbody>' + rows + "</tbody></table>";
  }

  function aboutHtml() {
    const T = Recommend.THRESHOLDS;
    return (
      '<section aria-labelledby="about-creator"><h2 id="about-creator">Creator</h2>' +
      "<p>" + esc(PROJECT) + ", made by " + esc(CREATOR) + ".</p></section>" +

      '<section aria-labelledby="about-data"><h2 id="about-data">Weather data</h2>' +
      "<p>Current conditions, forecasts and city search come from " + link("https://open-meteo.com/", "Open-Meteo") + ". Weather data is licensed " +
      link("https://creativecommons.org/licenses/by/4.0/", "CC BY 4.0") + " and requested directly from your browser; this app has no server of its own.</p></section>" +

      '<section aria-labelledby="about-methods"><h2 id="about-methods">How recommendations work</h2>' +
      "<p>Each day's outfit category comes from the temperature (rounded to the nearest degree). Forecast days use the day's high.</p>" + bandsTable() +
      "<p>Each reminder is checked on its own, so any combination can appear:</p><ul>" +
      "<li><strong>Sunscreen</strong> when the UV Index is " + T.sunscreenUvMin + " or higher (the EPA's \"Moderate\" level and up). Source: " +
      link("https://19january2021snapshot.epa.gov/sunsafety/uv-index-scale-0_.html", "EPA UV Index Scale") + ".</li>" +
      "<li><strong>Umbrella</strong> when the chance of precipitation is " + T.umbrellaPrecipMin + "% or higher (a field Open-Meteo provides).</li>" +
      "<li><strong>Extra water</strong> when the NWS heat index is " + T.heatIndexMinF + "°F or higher (the \"Hot\" level and up), calculated from temperature and humidity. Source: " +
      link("https://www.noaa.gov/sites/default/files/2022-05/heatindex_chart_rh.pdf", "NOAA Heat Index chart") + ".</li>" +
      "<li><strong>Cold caution</strong> when it is " + T.windChillMaxTempF + "°F or colder, the wind is at least " + T.windChillMinWindMph + " mph, and the NWS wind chill is at least " +
      T.windChillMinDropF + "°F below the actual temperature. The size of the drop is this app's own choice. Source: " +
      link("https://www.weather.gov/media/ajk/brochures/Wind_Chill_Temperature_Index.pdf", "NWS Wind Chill Temperature Index") + ".</li></ul>" +
      "<p>Which outfit style and which wording you see is picked at random, but with a seed made from the place, the date and the character, so coming back to a day shows the same thing. " +
      "A character's personality nudges which style is more likely; it never chooses the outfit.</p></section>" +

      '<section aria-labelledby="about-privacy"><h2 id="about-privacy">Privacy</h2>' + privacyBody() + "</section>" +

      '<section aria-labelledby="about-art"><h2 id="about-art">Art credits</h2>' +
      "<p>All artwork (the characters, outfits, scenery, weather and reminder icons) is original vector artwork drawn in code for this project. " +
      "Its style is inspired by Wii-era avatars; that is stylistic inspiration only, not an official license, and this non-commercial class project is not distributed beyond its class. " +
      "No third-party images, icons or fonts are used.</p></section>"
    );
  }

  function privacyBody() {
    return (
      "<p>Your location (your device's position, or a city you type) is used only to ask Open-Meteo for the weather at that spot. " +
      "It is saved only on this device, in your browser's local storage, and only the most recent place is kept. " +
      "It is never sent to anyone except that Open-Meteo request, and never used for tracking.</p>" +
      "<ul><li>Your device location is requested only when you tap \"Use my location\", once per tap. Nothing watches your position in the background.</li>" +
      "<li>There are no accounts, no logins, no ads and no analytics.</li>" +
      "<li>Your characters and settings also stay on this device.</li>" +
      "<li>You can erase all of it under Saved data.</li></ul>"
    );
  }

  function helpHtml() {
    return (
      "<h2>Using the app</h2><ul>" +
      "<li><strong>Home</strong> shows your characters in a scene for the weather, with an outfit that fits it. Reminders appear only when needed.</li>" +
      "<li>Use the arrows by the date to move one day at a time, or tap the date to pick any day up to 14 days ahead. Days after today are marked Forecast.</li>" +
      "<li>Tap the place name to type a US city or use your location.</li>" +
      "<li><strong>Character</strong> is where you build up to five characters. The main character (★) stands in the middle and its wording is the one the reminders use.</li>" +
      "<li>If something goes wrong, the screen says what happened and offers a way back.</li></ul>"
    );
  }

  function dataHtml() {
    const location = AppStore.getLocation();
    const count = AppStore.getCharacters().length;
    const where = location ? location.name + (location.state ? ", " + location.state : "") : null;
    const confirm = state.confirm;
    return (
      '<p class="doc-status" id="data-location">Saved location: <strong>' + (where ? esc(where) : "none") + "</strong></p>" +
      '<button type="button" class="btn btn-danger btn-wide" data-action="forget-location"' + (where ? "" : " disabled") + ">" +
      (confirm === "location" ? "Tap again to forget my location" : "Forget my location") + "</button>" +
      '<p class="doc-status" id="data-characters">Saved characters: <strong>' + count + "</strong></p>" +
      '<button type="button" class="btn btn-danger btn-wide" data-action="reset-characters">' +
      (confirm === "characters" ? "Tap again to reset my characters" : "Reset my characters") + "</button>" +
      '<p class="doc-note">Resetting characters leaves you with one default character. Everything here is stored only on this device.</p>'
    );
  }

  // --- Screen ----------------------------------------------------------------------------------
  function bodyHtml() {
    if (state.view === "list") {
      return (
        '<ul class="rows">' +
        ROWS.map((row) => '<li><button type="button" class="row" data-view="' + row.view + '"><span class="row-main"><span class="row-label">' + esc(row.label) +
          '</span><span class="row-hint">' + esc(row.hint) + '</span></span><span class="row-chev" aria-hidden="true">›</span></button></li>').join("") + "</ul>"
      );
    }
    const page = { data: dataHtml, privacy: () => "<h2>How your location is handled</h2>" + privacyBody(), help: helpHtml, about: aboutHtml }[state.view]();
    return '<div class="doc">' + page + "</div>";
  }

  function html() {
    const back = state.view === "list" ? "" : '<button type="button" class="back-btn" data-action="settings-back" aria-label="Back to Settings">‹ Settings</button>';
    return (
      '<div class="screen settings">' +
      '<header class="s-top">' + back + '<h1 class="s-title" id="settings-title" tabindex="-1">' + esc(TITLES[state.view]) + "</h1></header>" +
      '<main class="s-body">' + bodyHtml() + "</main>" +
      '<p class="visually-hidden" role="status" id="s-status">' + esc(state.announce) + "</p>" +
      App.navHtml("settings") +
      "</div>"
    );
  }

  function render(focus) {
    const body = state.root.querySelector(".s-body");
    const keepScroll = body && !focus ? body.scrollTop : 0;
    state.root.innerHTML = html();
    state.root.querySelector(".s-body").scrollTop = keepScroll;
    state.announce = "";
    if (focus === "title") state.root.querySelector("#settings-title").focus();
    else if (focus) {
      const el = state.root.querySelector(focus);
      if (el) el.focus();
    }
  }

  function openView(view) {
    state.view = view;
    state.confirm = null;
    render("title"); // a new page: move focus to its heading so screen readers announce it
    state.root.querySelector(".s-body").scrollTop = 0;
  }

  function onClick(event) {
    if (!state.active) return;
    const target = event.target.closest("[data-view], [data-action]");
    if (!target || !state.root.contains(target)) return;
    if (target.dataset.view) return openView(target.dataset.view);
    switch (target.dataset.action) {
      case "settings-back": {
        const from = state.view;
        state.view = "list";
        state.confirm = null;
        return render('[data-view="' + from + '"]');
      }
      case "forget-location":
        if (state.confirm !== "location") {
          state.confirm = "location";
          return render('[data-action="forget-location"]');
        }
        AppStore.forgetLocation();
        state.confirm = null;
        state.announce = "Saved location forgotten.";
        return render('[data-action="forget-location"]');
      case "reset-characters":
        if (state.confirm !== "characters") {
          state.confirm = "characters";
          return render('[data-action="reset-characters"]');
        }
        AppStore.resetCharacters();
        state.confirm = null;
        state.announce = "Characters reset to one default character.";
        return render('[data-action="reset-characters"]');
    }
  }

  function attach(root) {
    if (state.root === root) return;
    state.root = root;
    root.addEventListener("click", onClick);
  }

  function show() {
    if (window.Builder) window.Builder.hide();
    state.active = true;
    state.view = "list";
    state.confirm = null;
    render();
  }

  const hide = () => {
    state.active = false;
  };

  window.Settings = { attach, show, hide, isActive: () => state.active, CREATOR };
})();
