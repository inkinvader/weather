// Placeholder artwork as inline SVG, so every logic path can be seen before the real AI-generated
// art exists (plan: "Build the main screen with placeholder art"). Each real asset later replaces
// one function here. Exposes window.Art.
//
// Everything on screen is chosen from the recommendation state: the weather icon from
// weatherConditionIcon, the outfit drawing from outfitCategory + the chosen variation's style tag,
// the face from the character's personality.

(function () {
  // --- Weather and reminder icons (24x24, stroke-based, original simple shapes) ---------------
  const CLOUD = "M6.5 18.5a4 4 0 0 1-.4-7.98 6 6 0 0 1 11.6-.9 4.5 4.5 0 0 1-.2 8.88z";

  const WEATHER_ICONS = {
    clear: {
      label: "Sunny",
      shapes: '<circle cx="12" cy="12" r="4.5"/><path d="M12 2.5v2.5M12 19v2.5M2.5 12H5M19 12h2.5M5.3 5.3l1.8 1.8M16.9 16.9l1.8 1.8M5.3 18.7l1.8-1.8M16.9 7.1l1.8-1.8"/>',
    },
    partly_cloudy: {
      label: "Partly cloudy",
      shapes: '<circle cx="8" cy="8" r="3"/><path d="M8 2v1.5M2 8h1.5M3.8 3.8l1 1M12.2 3.8l-1 1"/><path d="M9.5 20a3.4 3.4 0 0 1-.3-6.8 5 5 0 0 1 9.7-.7 3.8 3.8 0 0 1-.2 7.5z"/>',
    },
    cloudy: { label: "Cloudy", shapes: '<path d="' + CLOUD + '"/>' },
    rain: {
      label: "Rain",
      shapes: '<path d="M6.5 15a4 4 0 0 1-.4-7.98 6 6 0 0 1 11.6-.9A4.5 4.5 0 0 1 17.5 15z"/><path d="M8 18l-1 3M12 18l-1 3M16 18l-1 3"/>',
    },
    thunderstorm: {
      label: "Thunderstorms",
      shapes: '<path d="M6.5 14a4 4 0 0 1-.4-7.98 6 6 0 0 1 11.6-.9A4.5 4.5 0 0 1 17.5 14z"/><path d="M12.5 14l-2.5 4h3l-2 4"/>',
    },
    snow: {
      label: "Snow",
      shapes: '<path d="M6.5 14a4 4 0 0 1-.4-7.98 6 6 0 0 1 11.6-.9A4.5 4.5 0 0 1 17.5 14z"/><path d="M8 17.5v.01M12 18.5v.01M16 17.5v.01M10 21v.01M14 21v.01"/>',
    },
    windy_fog: {
      label: "Foggy",
      shapes: '<path d="M3 8h13a2.5 2.5 0 1 0-2.5-2.5M3 12h17a2.5 2.5 0 1 1-2.5 2.5M3 16h10M3 20h8"/>',
    },
  };

  const REMINDER_ICONS = {
    sunscreen: {
      label: "Sunscreen",
      shapes: '<rect x="8" y="9" width="8" height="12" rx="2"/><path d="M10 9V6h4v3M12 2v1.5M7 4l1 1M17 4l-1 1"/>',
    },
    umbrella: {
      label: "Umbrella",
      shapes: '<path d="M3 12a9 9 0 0 1 18 0zM12 12v6.5a2 2 0 0 1-4 0"/>',
    },
    hydration: {
      label: "Hydration",
      shapes: '<path d="M12 3s6 6.2 6 10.5a6 6 0 0 1-12 0C6 9.2 12 3 12 3z"/>',
    },
    cold_caution: {
      label: "Cold caution",
      shapes: '<path d="M12 2v20M3.3 7l17.4 10M3.3 17L20.7 7M9 3.5l3 2.5 3-2.5M9 20.5l3-2.5 3 2.5"/>',
    },
  };

  // Decorative icons (next to visible text) are hidden from screen readers; standalone ones get a label.
  function iconSvg(set, key, options) {
    const icon = set[key];
    const opts = options || {};
    const size = opts.size || 24;
    const a11y = opts.decorative ? 'aria-hidden="true"' : 'role="img" aria-label="' + icon.label + '"';
    return (
      '<svg class="icon ' + (opts.className || "") + '" viewBox="0 0 24 24" width="' + size + '" height="' + size + '" ' + a11y +
      ' fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">' + icon.shapes + "</svg>"
    );
  }

  const weatherIcon = (key, options) => iconSvg(WEATHER_ICONS, key, options);
  const reminderIcon = (key, options) => iconSvg(REMINDER_ICONS, key, options);

  // --- Scene ---------------------------------------------------------------------------------
  // Generic city skyline + ground. (Location/time-of-day variants are a later art decision.)
  function sceneSvg() {
    return (
      '<svg class="scene-art" viewBox="0 0 400 600" preserveAspectRatio="xMidYMax slice" aria-hidden="true">' +
      '<rect width="400" height="600" fill="#cfe6fa"/>' +
      '<rect y="330" width="400" height="140" fill="#dcebf7"/>' +
      '<g fill="#9fb4c6"><rect x="10" y="280" width="62" height="190"/><rect x="84" y="340" width="50" height="130"/>' +
      '<rect x="262" y="250" width="56" height="220"/><rect x="330" y="320" width="62" height="150"/></g>' +
      '<g fill="#b6c8d8"><rect x="40" y="310" width="52" height="160"/><rect x="226" y="360" width="44" height="110"/><rect x="300" y="290" width="40" height="180"/></g>' +
      '<rect y="470" width="400" height="130" fill="#a9b8a3"/>' +
      '<rect y="470" width="400" height="6" fill="#8fa089"/>' +
      "</svg>"
    );
  }

  // --- Character (flattened body + outfit + face) --------------------------------------------
  // Placeholder drawing for each outfit variation id, written to match the outfit's name in
  // variation.js (the real art is one render per body type x gender presentation x outfit id).
  //   sleeves: long | short | none      pants: long | short      coat: longer outer layer
  const OUTFIT_LOOK = {
    "freezing-1": { sleeves: "long", pants: "long", coat: true, scarf: true },
    "freezing-2": { sleeves: "long", pants: "long", coat: true, beanie: true },
    "freezing-3": { sleeves: "long", pants: "long", coat: true },
    "cold-1": { sleeves: "long", pants: "long", coat: true },
    "cold-2": { sleeves: "long", pants: "long", coat: true, scarf: true },
    "cold-3": { sleeves: "long", pants: "long", coat: true },
    "cool-1": { sleeves: "long", pants: "long" },
    "cool-2": { sleeves: "long", pants: "long" },
    "cool-3": { sleeves: "long", pants: "long" },
    "mild-1": { sleeves: "short", pants: "long", cap: true },
    "mild-2": { sleeves: "long", pants: "long" },
    "mild-3": { sleeves: "short", pants: "long" },
    "warm-1": { sleeves: "long", pants: "short", sunHat: true },
    "warm-2": { sleeves: "short", pants: "short" },
    "warm-3": { sleeves: "short", pants: "short" },
    "hot-1": { sleeves: "short", pants: "short" },
    "hot-2": { sleeves: "long", pants: "short", sunHat: true, glasses: true },
    "hot-3": { sleeves: "none", pants: "short" },
    "extreme_heat-1": { sleeves: "none", pants: "short" },
    "extreme_heat-2": { sleeves: "none", pants: "short" },
    "extreme_heat-3": { sleeves: "none", pants: "short" },
  };
  const CATEGORY_COLOR = {
    freezing: "#35588f",
    cold: "#4a78b5",
    cool: "#6a8fb0",
    mild: "#6f9e6a",
    warm: "#d9a441",
    hot: "#e07a3f",
    extreme_heat: "#d9473f",
  };
  const DARK_CLOTHES = "#2d3139";
  const DEFAULT_SKIN = "#f0c6a2";

  // Face changes with personality (spec: personality is a separate overlay, not part of the outfit).
  function faceSvg(personality) {
    const ink = "#2a2320";
    const eyes = '<circle cx="51" cy="48" r="2.6" fill="' + ink + '"/><circle cx="69" cy="48" r="2.6" fill="' + ink + '"/>';
    const faces = {
      energetic: eyes + '<path d="M50 57q10 14 20 0z" fill="' + ink + '"/>',
      anxious:
        eyes +
        '<path d="M46 41l8 -3M74 41l-8 -3" stroke="' + ink + '" stroke-width="2" fill="none" stroke-linecap="round"/>' +
        '<path d="M50 62q5 -4 10 0t10 0" stroke="' + ink + '" stroke-width="2" fill="none" stroke-linecap="round"/>' +
        '<path d="M80 38q3 5 0 8q-3 -3 0 -8z" fill="#7bc4f0"/>',
      grumpy:
        eyes +
        '<path d="M45 40l9 4M75 40l-9 4" stroke="' + ink + '" stroke-width="2.4" fill="none" stroke-linecap="round"/>' +
        '<path d="M50 64q10 -8 20 0" stroke="' + ink + '" stroke-width="2.4" fill="none" stroke-linecap="round"/>',
      chill:
        '<path d="M46 48h10M64 48h10" stroke="' + ink + '" stroke-width="2.6" stroke-linecap="round"/>' +
        '<path d="M52 59q8 6 16 0" stroke="' + ink + '" stroke-width="2.4" fill="none" stroke-linecap="round"/>',
      neutral: eyes + '<path d="M52 60h16" stroke="' + ink + '" stroke-width="2.4" stroke-linecap="round"/>',
    };
    return faces[personality] || faces.neutral;
  }

  // look = { category, outfitId, tag, personality, skin, alt }
  function characterSvg(look) {
    const outfit = OUTFIT_LOOK[look.outfitId] || OUTFIT_LOOK["mild-2"];
    const skin = look.skin || DEFAULT_SKIN;
    const cloth = look.tag === "dark" ? DARK_CLOTHES : CATEGORY_COLOR[look.category] || CATEGORY_COLOR.mild;
    const trim = look.tag === "dark" ? "#454b55" : "#ffffff";
    const wide = look.tag === "loose" ? 12 : 0; // loose = baggier torso and legs
    const longPants = outfit.pants === "long";
    const parts = [];

    // legs: long pants, or shorts over bare lower legs
    const legW = 15 + wide / 3;
    const legXs = [60 - legW - 2, 62];
    legXs.forEach((x) => {
      parts.push('<rect x="' + x + '" y="140" width="' + legW + '" height="76" rx="6" fill="' + skin + '"/>');
      parts.push('<rect x="' + x + '" y="140" width="' + legW + '" height="' + (longPants ? 76 : 38) + '" rx="6" fill="' + (longPants ? cloth : "#8e8a7e") + '"/>');
    });
    if (look.tag === "sporty") {
      parts.push('<rect x="' + legXs[0] + '" y="140" width="3" height="' + (longPants ? 76 : 38) + '" fill="' + trim + '"/>');
    }
    parts.push('<ellipse cx="45" cy="220" rx="13" ry="6" fill="#3a3a3a"/><ellipse cx="75" cy="220" rx="13" ry="6" fill="#3a3a3a"/>');

    // arms: bare skin, with a sleeve drawn over the top when the outfit has one
    const sleeveH = { long: 56, short: 24, none: 0 }[outfit.sleeves];
    const torsoX = 38 - wide / 2;
    const torsoW = 44 + wide;
    [torsoX - 12, torsoX + torsoW].forEach((x) => {
      parts.push('<rect x="' + x + '" y="86" width="12" height="58" rx="6" fill="' + skin + '"/>');
      if (sleeveH) parts.push('<rect x="' + x + '" y="86" width="12" height="' + sleeveH + '" rx="6" fill="' + cloth + '"/>');
    });

    // torso (a coat is longer and gets a centre seam)
    parts.push('<rect x="' + torsoX + '" y="82" width="' + torsoW + '" height="' + (outfit.coat ? 80 : 62) + '" rx="9" fill="' + cloth + '"/>');
    if (outfit.coat) parts.push('<rect x="58" y="82" width="4" height="80" fill="rgba(0,0,0,.25)"/>');
    if (outfit.sleeves === "none") {
      parts.push('<path d="M' + (torsoX + 8) + ' 82h' + (torsoW - 16) + 'v10q-' + (torsoW / 2 - 8) + ' 12 -' + (torsoW - 16) + ' 0z" fill="' + skin + '"/>');
    }

    // head and hair
    parts.push('<circle cx="60" cy="48" r="24" fill="' + skin + '"/>');
    parts.push('<path d="M36 46a24 24 0 0 1 48 0q-24 -14 -48 0z" fill="#5b3a29"/>');
    parts.push(faceSvg(look.personality));
    if (outfit.glasses) parts.push('<rect x="43" y="44" width="34" height="9" rx="4" fill="#1d1d1d" opacity=".85"/>');

    // accessories only when the outfit's name mentions them (the test keeps name and drawing in sync)
    if (outfit.cap) {
      parts.push('<path d="M34 40a26 22 0 0 1 52 0z" fill="' + cloth + '"/><rect x="58" y="36" width="40" height="7" rx="3.5" fill="' + trim + '" opacity=".9"/>');
    }
    if (outfit.sunHat) {
      parts.push('<ellipse cx="60" cy="31" rx="40" ry="7" fill="#d8c08a"/><path d="M40 31a20 16 0 0 1 40 0z" fill="#e6d3a0"/>');
    }
    if (outfit.beanie) {
      parts.push('<path d="M35 38a25 24 0 0 1 50 0z" fill="#3b3f48"/><rect x="34" y="35" width="52" height="7" rx="3" fill="#2a2d34"/>');
    }
    if (outfit.scarf) {
      parts.push('<rect x="' + (torsoX - 2) + '" y="70" width="' + (torsoW + 4) + '" height="13" rx="6" fill="#c9553d"/>');
    }

    return (
      // No fixed size: CSS scales the figure to the room available, anchored to the ground.
      '<svg class="character-art" viewBox="0 0 120 232" preserveAspectRatio="xMidYMax meet" role="img" aria-label="' + look.alt + '">' +
      parts.join("") +
      "</svg>"
    );
  }

  window.Art = { WEATHER_ICONS, REMINDER_ICONS, OUTFIT_LOOK, weatherIcon, reminderIcon, sceneSvg, characterSvg };
})();
