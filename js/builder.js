// Character builder screen (reference/sketch-character-builder.jpg, phone layout): a gallery button,
// a large preview, a scrollable strip of trait tabs, and a grid of option tiles. Every choice is
// saved straight away through AppStore, so leaving and returning loses nothing.
// Exposes window.Builder. App wires the nav tabs to show() and hide().

(function () {
  const state = {
    root: null,
    active: false,
    selectedId: null, // the character being edited
    tab: 0, // index into Traits.TRAITS
    sheet: false, // gallery open
    confirmRemove: false, // the Remove button has been tapped once
    announce: "", // text for the screen-reader status line
    renderedTab: -1,
  };

  const esc = (text) => String(text).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  const FOCUSABLE = 'button:not([disabled]), input, a[href], [tabindex]:not([tabindex="-1"])';

  const characters = () => AppStore.getCharacters();
  const selected = () => {
    const list = characters();
    return list.find((c) => c.id === state.selectedId) || list[0];
  };

  // The builder always shows the character in a plain tee and shorts (no hat) so hair is visible.
  function figure(character, view, decorative, alt) {
    return Art.characterSvg({ character: character, category: "mild", outfitId: "preview", tag: null, view: view, decorative: decorative, alt: alt });
  }

  // --- Icons for the tab strip (original, simple) ---------------------------------------------
  const TAB_ICONS = {
    bodyType: '<circle cx="12" cy="5" r="3"/><path d="M12 8v7M7 11l5 2 5-2M9 22l3-7 3 7"/>',
    genderPresentation: '<circle cx="8" cy="15" r="4"/><path d="M8 19v3M6 21h4"/><circle cx="17" cy="7" r="3.5"/><path d="M19.5 4.5L22 2M19 2h3v3"/>',
    skinTone: '<path d="M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11z"/>',
    hair: '<path d="M5 15c0-6 3-10 7-10s7 4 7 10v1c-2-3-5-4-7-4s-5 1-7 4z"/>',
    facialHair: '<path d="M5 8c0 9 3 13 7 13s7-4 7-13c-2 3-4 4-7 4s-5-1-7-4z"/><path d="M9 15q3 2 6 0"/>',
    eyes: '<path d="M2 12s4-6 10-6 10 6 10 6-4 6-10 6S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
    nose: '<path d="M12 4v11"/><path d="M8 18a3 3 0 0 0 4 1 3 3 0 0 0 4-1"/>',
    mouth: '<path d="M3 12q4-4 9-1q5-3 9 1q-4 7-9 7t-9-7z"/>',
    ear: '<path d="M7 12c0-5 3-8 6-8s5 2.5 5 6c0 4-4 4-4 8a3 3 0 0 1-5.5 1.5"/><path d="M12 9c1-1 3 0 2.5 2"/>',
    personality: '<circle cx="12" cy="12" r="9"/><path d="M8.5 14q3.5 4 7 0M9 9.5v.01M15 9.5v.01"/>',
  };
  const icon = (key) =>
    '<svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">' + TAB_ICONS[key] + "</svg>";
  const GRID_ICON =
    '<svg viewBox="0 0 24 24" width="26" height="26" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><rect x="3" y="3" width="7.5" height="7.5" rx="1.5"/><rect x="13.5" y="3" width="7.5" height="7.5" rx="1.5"/><rect x="3" y="13.5" width="7.5" height="7.5" rx="1.5"/><rect x="13.5" y="13.5" width="7.5" height="7.5" rx="1.5"/></svg>';

  // --- Markup ---------------------------------------------------------------------------------
  function tabsHtml() {
    return (
      '<div class="b-tabs" role="tablist" aria-label="Character traits">' +
      Traits.TRAITS.map(
        (trait, i) =>
          '<button type="button" role="tab" class="b-tab" id="tab-' + trait.key + '" data-tab="' + i + '" aria-selected="' + (i === state.tab) +
          '" aria-controls="b-panel" tabindex="' + (i === state.tab ? 0 : -1) + '">' + icon(trait.key) + "<span>" + esc(trait.tab) + "</span></button>"
      ).join("") +
      "</div>"
    );
  }

  // Each tile previews the choice applied to the character being edited, so what you tap is what you get.
  function panelHtml(character, trait) {
    const tiles = trait.options
      .map((option) => {
        const isOn = character[trait.key] === option.id;
        const variant = Object.assign({}, character, { [trait.key]: option.id });
        return (
          '<button type="button" class="opt" data-option="' + esc(option.id) + '" aria-pressed="' + isOn + '">' +
          '<span class="opt-art">' + figure(variant, trait.view, true) + "</span>" +
          '<span class="opt-label">' + esc(option.label) + "</span>" +
          (isOn ? '<span class="opt-check" aria-hidden="true">✓</span>' : "") +
          "</button>"
        );
      })
      .join("");
    // Body and gender differ in the whole figure's shape, so those tiles get a taller picture.
    const tall = trait.key === "bodyType" || trait.key === "genderPresentation";
    return (
      '<div class="b-panel" role="tabpanel" id="b-panel" aria-labelledby="tab-' + trait.key + '">' +
      '<div class="options' + (tall ? " options-tall" : "") + '" role="group" aria-label="' + esc(trait.label) + '">' + tiles + "</div></div>"
    );
  }

  function galleryHtml() {
    const list = characters();
    const mainId = AppStore.getMainCharacterId();
    const current = selected();
    const number = list.findIndex((c) => c.id === current.id) + 1;
    const tiles = list.map((c, i) => {
      const isMain = c.id === mainId;
      return (
        '<li><button type="button" class="gal-item" data-select="' + esc(c.id) + '" aria-pressed="' + (c.id === current.id) +
        '" aria-label="Character ' + (i + 1) + (isMain ? ", main character" : "") + '">' +
        '<span class="gal-art">' + figure(c, "head", true) + "</span>" +
        '<span class="gal-label">Character ' + (i + 1) + (isMain ? " ★" : "") + "</span></button></li>"
      );
    });
    if (list.length < AppStore.MAX_CHARACTERS) {
      tiles.push('<li><button type="button" class="gal-item gal-add" data-action="add-character"><span class="gal-plus" aria-hidden="true">+</span><span class="gal-label">Add character</span></button></li>');
    }
    const onlyOne = list.length === 1;
    return (
      '<div class="overlay-layer"><div class="backdrop" data-action="close-gallery"></div>' +
      '<div class="sheet" role="dialog" aria-modal="true" aria-labelledby="gal-title">' +
      '<div class="sheet-head"><h2 id="gal-title">Characters</h2><button type="button" class="sheet-close" data-action="close-gallery" aria-label="Close">&times;</button></div>' +
      '<p class="sheet-note">' + list.length + " of " + AppStore.MAX_CHARACTERS + ". Tap one to edit it. The main character (★) stands in the middle of the home scene.</p>" +
      '<ul class="gallery">' + tiles.join("") + "</ul>" +
      '<button type="button" class="btn btn-danger btn-wide" data-action="remove-character"' + (onlyOne ? " disabled" : "") + ">" +
      (state.confirmRemove ? "Tap again to remove Character " + number : "Remove Character " + number) + "</button>" +
      (onlyOne ? '<p class="sheet-note">You need at least one character.</p>' : "") +
      "</div></div>"
    );
  }

  function html() {
    const list = characters();
    const current = selected();
    const index = list.findIndex((c) => c.id === current.id);
    const isMain = current.id === AppStore.getMainCharacterId();
    const trait = Traits.TRAITS[state.tab];
    return (
      '<div class="screen builder">' +
      '<header class="b-top">' +
      '<button type="button" class="gal-btn" data-action="open-gallery" aria-haspopup="dialog" aria-label="Character gallery, ' + list.length + " of " + AppStore.MAX_CHARACTERS + ' characters">' +
      GRID_ICON + "<span>" + list.length + "/" + AppStore.MAX_CHARACTERS + "</span></button>" +
      '<h1 class="b-title">Character ' + (index + 1) + "</h1>" +
      (isMain
        ? '<span class="main-badge">★ Main character</span>'
        : '<button type="button" class="main-btn" data-action="make-main">☆ Make main</button>') +
      "</header>" +
      '<div class="b-preview">' + figure(current, trait.view, false, "Preview of Character " + (index + 1)) + "</div>" +
      tabsHtml() + panelHtml(current, trait) +
      '<p class="visually-hidden" role="status" id="b-status">' + esc(state.announce) + "</p>" +
      App.navHtml("character") +
      (state.sheet ? galleryHtml() : "") +
      "</div>"
    );
  }

  // --- Rendering ------------------------------------------------------------------------------
  // Redraws the whole screen, then puts back the scroll positions and keyboard focus.
  function render(focusSelector) {
    const root = state.root;
    const tabs = root.querySelector(".b-tabs");
    const panel = root.querySelector(".b-panel");
    const tabsLeft = tabs ? tabs.scrollLeft : 0;
    const panelTop = panel && state.renderedTab === state.tab ? panel.scrollTop : 0;
    root.innerHTML = html();
    state.renderedTab = state.tab;
    root.querySelector(".b-tabs").scrollLeft = tabsLeft;
    root.querySelector(".b-panel").scrollTop = panelTop;
    state.announce = "";
    if (focusSelector) {
      const el = root.querySelector(focusSelector);
      if (el) el.focus();
    }
  }

  const say = (text) => {
    state.announce = text;
  };

  // --- Actions --------------------------------------------------------------------------------
  function saveSelectedChange(change) {
    const list = characters().map((c) => (c.id === state.selectedId ? Object.assign({}, c, change) : c));
    AppStore.saveCharacters(list);
  }

  function chooseOption(optionId) {
    const trait = Traits.TRAITS[state.tab];
    saveSelectedChange({ [trait.key]: optionId });
    state.confirmRemove = false;
    render('[data-option="' + optionId + '"]');
  }

  function selectTab(index, keepFocusOnTab) {
    state.tab = (index + Traits.TRAITS.length) % Traits.TRAITS.length;
    render("#tab-" + Traits.TRAITS[state.tab].key);
    const tab = state.root.querySelector("#tab-" + Traits.TRAITS[state.tab].key);
    if (tab && tab.scrollIntoView) tab.scrollIntoView({ block: "nearest", inline: "nearest" });
  }

  function openGallery() {
    state.sheet = true;
    state.confirmRemove = false;
    render('.gal-item[aria-pressed="true"]');
  }

  function closeGallery() {
    state.sheet = false;
    state.confirmRemove = false;
    render('[data-action="open-gallery"]');
  }

  function selectCharacter(id) {
    state.selectedId = id;
    state.confirmRemove = false;
    render('.gal-item[data-select="' + id + '"]');
  }

  function addCharacter() {
    const list = characters();
    if (list.length >= AppStore.MAX_CHARACTERS) return;
    const created = Traits.defaultCharacter(Traits.nextCharacterId(list));
    AppStore.saveCharacters(list.concat(created));
    state.selectedId = created.id;
    state.sheet = false;
    say("Added Character " + (list.length + 1) + ". Now editing it.");
    render('[data-action="open-gallery"]');
  }

  function removeCharacter() {
    const list = characters();
    if (list.length <= 1) return;
    if (!state.confirmRemove) {
      state.confirmRemove = true;
      return render('[data-action="remove-character"]');
    }
    const remaining = list.filter((c) => c.id !== state.selectedId);
    AppStore.saveCharacters(remaining);
    state.selectedId = AppStore.getMainCharacterId();
    state.confirmRemove = false;
    say("Character removed.");
    render('.gal-item[aria-pressed="true"]');
  }

  function makeMain() {
    AppStore.setMainCharacterId(state.selectedId);
    const number = characters().findIndex((c) => c.id === state.selectedId) + 1;
    say("Character " + number + " is now the main character.");
    render('[data-action="open-gallery"]');
  }

  // --- Events ---------------------------------------------------------------------------------
  function onClick(event) {
    if (!state.active) return;
    const target = event.target.closest("[data-action], [data-tab], [data-option], [data-select]");
    if (!target || !state.root.contains(target)) return;
    if (target.dataset.tab !== undefined) return selectTab(Number(target.dataset.tab));
    if (target.dataset.option !== undefined) return chooseOption(target.dataset.option);
    if (target.dataset.select !== undefined) return selectCharacter(target.dataset.select);
    switch (target.dataset.action) {
      case "open-gallery": return openGallery();
      case "close-gallery": return closeGallery();
      case "add-character": return addCharacter();
      case "remove-character": return removeCharacter();
      case "make-main": return makeMain();
    }
  }

  function onKeydown(event) {
    if (!state.active) return;
    if (state.sheet) {
      if (event.key === "Escape") return closeGallery();
      if (event.key !== "Tab") return;
      // Keep Tab inside the open gallery dialog.
      const items = Array.from(state.root.querySelectorAll(".overlay-layer " + FOCUSABLE.split(", ").join(", .overlay-layer ")));
      const first = items[0];
      const last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
      return;
    }
    // Arrow keys move between tabs (the tab strip is one Tab stop, as in standard tab widgets).
    if (event.target.matches && event.target.matches('[role="tab"]')) {
      const moves = { ArrowRight: state.tab + 1, ArrowLeft: state.tab - 1, Home: 0, End: Traits.TRAITS.length - 1 };
      if (event.key in moves) {
        event.preventDefault();
        selectTab(moves[event.key]);
      }
    }
  }

  // --- Public ---------------------------------------------------------------------------------
  function attach(root) {
    if (state.root === root) return;
    state.root = root;
    root.addEventListener("click", onClick);
    root.addEventListener("keydown", onKeydown);
  }

  function show() {
    state.active = true;
    state.selectedId = AppStore.getMainCharacterId();
    state.sheet = false;
    state.confirmRemove = false;
    state.renderedTab = -1;
    render();
  }

  const hide = () => {
    state.active = false;
    state.sheet = false;
  };

  window.Builder = { attach, show, hide, isActive: () => state.active };
})();
