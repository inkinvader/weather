// Original vector artwork, drawn in code (Wii/Mii-era-inspired: big round heads, simple rounded
// shapes, soft outlines). This is the final art, not a placeholder: research.md Revisions records
// the 2026-10-12 decision to draw every character, icon and scene as vectors instead of generating
// images. Exposes window.Art.
//
// Everything on screen is chosen from the recommendation state: the weather art from
// weatherConditionIcon, the outfit drawing from the chosen outfit variation, and the face and
// body from the character's builder traits.

(function () {
  let uidCounter = 0;
  const nextId = (prefix) => prefix + "-" + ++uidCounter; // unique SVG ids when several figures share a page

  const INK = "#33283a"; // outline colour for everything drawn
  const FACE_INK = "#2a2320";
  const SOFT = "rgba(0,0,0,.45)"; // nose and ear outlines that read on every skin tone

  // amount in -1..1: negative darkens, positive lightens (hex colours only)
  function shade(hex, amount) {
    const n = parseInt(hex.slice(1), 16);
    const channels = [n >> 16, (n >> 8) & 255, n & 255].map((v) => Math.round(amount < 0 ? v * (1 + amount) : v + (255 - v) * amount));
    return "#" + channels.map((v) => v.toString(16).padStart(2, "0")).join("");
  }

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

  // --- Sky art: the big weather picture in the corner of the scene (filled shapes, outlined) ---
  // A "puffy" cloud is drawn as a union: the shapes once with a thick outline, then again flat on
  // top, so the outline follows the merged silhouette instead of crossing the inside.
  function puffyCloud(x, y, scale, fill, outline) {
    const shapes = '<circle cx="36" cy="52" r="16"/><circle cx="58" cy="38" r="22"/><circle cx="82" cy="50" r="17"/><rect x="26" y="50" width="68" height="20" rx="10"/>';
    return (
      '<g transform="translate(' + x + " " + y + ") scale(" + scale + ')">' +
      '<g fill="' + outline + '" stroke="' + outline + '" stroke-width="7" stroke-linejoin="round">' + shapes + "</g>" +
      '<g fill="' + fill + '">' + shapes + '</g><ellipse cx="50" cy="30" rx="12" ry="5" fill="#fff" opacity=".45"/></g>'
    );
  }

  function sunShape(cx, cy, scale) {
    const rays = Array.from({ length: 12 }, (_, k) =>
      '<rect x="' + (cx - 3.5 * scale) + '" y="' + (cy - 46 * scale) + '" width="' + 7 * scale + '" height="' + 13 * scale + '" rx="' + 3.5 * scale + '" transform="rotate(' + k * 30 + " " + cx + " " + cy + ')"/>'
    ).join("");
    return (
      '<circle cx="' + cx + '" cy="' + cy + '" r="' + 38 * scale + '" fill="#ffe9a0" opacity=".55"/>' +
      '<g fill="#ffbf2e" stroke="#d98f12" stroke-width="2" stroke-linejoin="round">' + rays + "</g>" +
      '<circle cx="' + cx + '" cy="' + cy + '" r="' + 25 * scale + '" fill="#ffd23f" stroke="#d98f12" stroke-width="3"/>' +
      '<ellipse cx="' + (cx - 8 * scale) + '" cy="' + (cy - 9 * scale) + '" rx="' + 9 * scale + '" ry="' + 5 * scale + '" fill="#fff" opacity=".5" transform="rotate(-30 ' + (cx - 8 * scale) + " " + (cy - 9 * scale) + ')"/>'
    );
  }

  const DROP = (x, y) => '<path d="M' + x + " " + y + 'q6 8 0 12q-6 -4 0 -12z" fill="#5aa7ec" stroke="#2f78b8" stroke-width="1.5" stroke-linejoin="round"/>';
  const FLAKE = (x, y) => '<circle cx="' + x + '" cy="' + y + '" r="4" fill="#fff" stroke="#8fb4d8" stroke-width="1.6"/>';

  const SKY_ART = {
    clear: () => sunShape(80, 60, 1.05),
    partly_cloudy: () => sunShape(60, 46, 0.78) + puffyCloud(40, 34, 1.0, "#ffffff", INK),
    cloudy: () => puffyCloud(48, 6, 0.9, "#cfd8e2", INK) + puffyCloud(14, 24, 1.15, "#f4f7fb", INK),
    rain: () => puffyCloud(16, 4, 1.25, "#aebccb", INK) + [30, 54, 78, 102, 126].map((x, i) => DROP(x, 92 + (i % 2) * 8)).join(""),
    thunderstorm: () =>
      puffyCloud(16, 2, 1.25, "#7a869c", INK) +
      '<path d="M82 66l-14 24h12l-8 22 26-30H85l9-16z" fill="#ffd23f" stroke="#c98f00" stroke-width="2.4" stroke-linejoin="round"/>',
    snow: () => puffyCloud(16, 2, 1.25, "#e9eff6", INK) + [34, 58, 82, 106, 130].map((x, i) => FLAKE(x, 96 + (i % 2) * 10)).join(""),
    windy_fog: () =>
      '<circle cx="104" cy="40" r="22" fill="#fff3c4" stroke="#e0c26a" stroke-width="2.4" opacity=".85"/>' +
      '<g fill="#f6f8fa" stroke="' + INK + '" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">' +
      '<path d="M18 46h86a9 9 0 0 1 0 18H70"/><path d="M50 70h80a9 9 0 0 1 0 18H30a9 9 0 0 1 0-18z"/>' +
      '<path d="M14 94h84a9 9 0 0 1 0 18H54"/></g>',
  };

  // Big weather picture, decorative (the condition is also written out as text next to it).
  function skyArt(icon) {
    return '<svg class="sky-art" viewBox="0 0 160 120" width="150" height="112" aria-hidden="true">' + (SKY_ART[icon] || SKY_ART.clear)() + "</svg>";
  }

  // --- Scene: city street whose sky and weather follow the condition ---------------------------
  const SKY = {
    clear: ["#7ec4f4", "#e4f3ff"],
    partly_cloudy: ["#96c8ec", "#e6f0f8"],
    cloudy: ["#b5c2ce", "#e3e8ed"],
    rain: ["#8999ad", "#cad3dd"],
    thunderstorm: ["#59647c", "#a7b1c1"],
    snow: ["#d2dde8", "#f3f7fb"],
    windy_fog: ["#cbd5dc", "#edf0f2"],
  };

  function building(b, fill, windowFill) {
    const wins = [];
    for (let wy = b.y + 14; wy < b.y + b.h - 20; wy += 18) {
      for (let wx = b.x + 9; wx < b.x + b.w - 12; wx += 14) {
        wins.push('<rect x="' + wx + '" y="' + wy + '" width="7" height="9" rx="1.5"/>');
      }
    }
    return '<rect x="' + b.x + '" y="' + b.y + '" width="' + b.w + '" height="' + b.h + '" fill="' + fill + '"/><g fill="' + windowFill + '">' + wins.join("") + "</g>";
  }

  function weatherOverlay(icon) {
    if (icon === "rain" || icon === "thunderstorm") {
      const streaks = Array.from({ length: 46 }, (_, i) => {
        const x = (i * 47) % 420;
        const y = (i * 83) % 540;
        return '<path d="M' + x + " " + y + "l-7 20" + '"/>';
      }).join("");
      return (
        (icon === "thunderstorm" ? '<rect width="400" height="600" fill="rgba(20,30,60,.16)"/>' : "") +
        '<g stroke="rgba(235,245,255,.6)" stroke-width="1.6" stroke-linecap="round">' + streaks + "</g>"
      );
    }
    if (icon === "snow") {
      const flakes = Array.from({ length: 64 }, (_, i) => '<circle cx="' + ((i * 61) % 400) + '" cy="' + ((i * 97) % 560) + '" r="' + (1.6 + (i % 3)) + '"/>').join("");
      return '<g fill="rgba(255,255,255,.92)">' + flakes + '</g><rect y="466" width="400" height="9" fill="rgba(255,255,255,.85)"/>';
    }
    if (icon === "windy_fog") {
      // haze that fades in from the sky, so there is no hard edge
      const haze = nextId("haze");
      return (
        '<defs><linearGradient id="' + haze + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".35" stop-color="#fff" stop-opacity=".55"/><stop offset="1" stop-color="#fff" stop-opacity=".5"/></linearGradient></defs>' +
        '<rect y="150" width="400" height="330" fill="url(#' + haze + ')"/>'
      );
    }
    return "";
  }

  function sceneSvg(icon) {
    const sky = SKY[icon] || SKY.clear;
    const gradient = nextId("sky");
    const back = [{ x: -12, y: 296, w: 72, h: 180 }, { x: 70, y: 350, w: 58, h: 126 }, { x: 226, y: 326, w: 62, h: 150 }, { x: 296, y: 270, w: 72, h: 206 }, { x: 358, y: 336, w: 60, h: 140 }];
    const front = [{ x: 14, y: 336, w: 64, h: 140 }, { x: 128, y: 386, w: 52, h: 90 }, { x: 246, y: 304, w: 52, h: 172 }, { x: 322, y: 372, w: 56, h: 104 }];
    const night = icon === "thunderstorm" ? 0.1 : 0;
    return (
      '<svg class="scene-art" viewBox="0 0 400 600" preserveAspectRatio="xMidYMax slice" aria-hidden="true">' +
      '<defs><linearGradient id="' + gradient + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + sky[0] + '"/><stop offset="1" stop-color="' + sky[1] + '"/></linearGradient></defs>' +
      '<rect width="400" height="600" fill="url(#' + gradient + ')"/>' +
      '<g stroke="' + INK + '" stroke-opacity=".35" stroke-width="1.5">' +
      back.map((b) => building(b, shade("#9fb4c6", -night), "rgba(255,255,255,.5)")).join("") +
      front.map((b) => building(b, shade("#8aa0b5", -night), "rgba(255,255,255,.42)")).join("") +
      "</g>" +
      // a tree and a lamp post for depth
      '<g stroke="' + INK + '" stroke-opacity=".4" stroke-width="1.5"><rect x="36" y="410" width="9" height="66" fill="#8a6a4a"/><circle cx="40" cy="398" r="26" fill="#6fa86a"/><circle cx="24" cy="414" r="17" fill="#7fb878"/><circle cx="57" cy="414" r="18" fill="#7fb878"/>' +
      '<rect x="384" y="380" width="5" height="96" fill="#6b7480"/><circle cx="386" cy="376" r="8" fill="#ffe9a0"/></g>' +
      '<rect y="470" width="400" height="130" fill="#b4bcc4"/><rect y="470" width="400" height="7" fill="#9aa3ad"/>' +
      '<g stroke="#9aa3ad" stroke-width="2">' + Array.from({ length: 9 }, (_, i) => '<path d="M' + (i * 52 - 10) + " 477l-" + 14 + ' 123"/>').join("") + "</g>" +
      weatherOverlay(icon) +
      "</svg>"
    );
  }

  // --- Character: body, outfit, head ----------------------------------------------------------
  // One entry per outfit id, written to match the outfit's name in variation.js (a test keeps the
  // drawing and the written name in sync). Fields:
  //   sleeves: long | short | none      pants: long | short      top, bottom, accent: colours
  //   coat: wool | puffer | parka (longer outer layer)   zip   hood: up | down   scarf   beanie   cap
  //   sunHat   glasses   socks   cuffs   stripe   pockets   crop   rib
  const OUTFIT_LOOK = {
    "freezing-1": { sleeves: "long", pants: "long", top: "#4b6fa8", bottom: "#2f3b52", accent: "#c9553d", coat: "puffer", hood: "up", scarf: true, cuffs: true },
    "freezing-2": { sleeves: "long", pants: "long", top: "#2d3139", bottom: "#23262e", accent: "#3b3f48", coat: "wool", beanie: true },
    "freezing-3": { sleeves: "long", pants: "long", top: "#6b8e6a", bottom: "#4a4f58", accent: "#f2efe6", coat: "parka", zip: true, socks: true },
    "cold-1": { sleeves: "long", pants: "long", top: "#d9573b", bottom: "#3a3f4b", accent: "#9aa1a9", zip: true, hood: "down", stripe: true, cuffs: true },
    "cold-2": { sleeves: "long", pants: "long", top: "#7a5c3e", bottom: "#3b4a6b", accent: "#c9553d", coat: "parka", zip: true, hood: "down", scarf: true },
    "cold-3": { sleeves: "long", pants: "long", top: "#2d3139", bottom: "#8a8f98", accent: "#454b55", coat: "wool" },
    "cool-1": { sleeves: "long", pants: "long", top: "#3fa3a0", bottom: "#2b2f38", accent: "#ffffff", zip: true, stripe: true, cuffs: true },
    "cool-2": { sleeves: "long", pants: "long", top: "#8a8f98", bottom: "#23262e", accent: "#6f757e", rib: true },
    "cool-3": { sleeves: "long", pants: "long", top: "#b58f6b", bottom: "#9aa1a9", accent: "#8d6c4e", rib: true, cuffs: true },
    "mild-1": { sleeves: "short", pants: "long", top: "#e05a47", bottom: "#3a3f4b", accent: "#1d4f91", cap: true, stripe: true, cuffs: true },
    "mild-2": { sleeves: "long", pants: "long", top: "#6f9e6a", bottom: "#3b4a6b", accent: "#4f7a4b", zip: true },
    "mild-3": { sleeves: "short", pants: "long", top: "#e8b84a", bottom: "#4a6b9a", accent: "#c9962d" },
    "warm-1": { sleeves: "long", pants: "short", top: "#eadfc8", bottom: "#7a8fa6", accent: "#d8c08a", sunHat: true },
    "warm-2": { sleeves: "short", pants: "short", top: "#2d3139", bottom: "#3a3f4b", accent: "#454b55" },
    "warm-3": { sleeves: "short", pants: "short", top: "#7fb3a0", bottom: "#b9a67a", accent: "#8c7a52", pockets: true },
    "hot-1": { sleeves: "short", pants: "short", top: "#4fb3e0", bottom: "#2d3139", accent: "#ffffff", stripe: true },
    "hot-2": { sleeves: "long", pants: "short", top: "#f2efe6", bottom: "#d4b98a", accent: "#d8c08a", sunHat: true, glasses: true },
    "hot-3": { sleeves: "none", pants: "short", top: "#2d3139", bottom: "#8a8f98", accent: "#454b55" },
    "extreme_heat-1": { sleeves: "none", pants: "short", top: "#ff7a59", bottom: "#2d3139", accent: "#ffffff", stripe: true },
    "extreme_heat-2": { sleeves: "none", pants: "short", top: "#2d3139", bottom: "#3a3f4b", accent: "#454b55" },
    "extreme_heat-3": { sleeves: "none", pants: "short", top: "#f5b8c4", bottom: "#a8d8c8", accent: "#e895a6", crop: true },
    // Not a real outfit: the plain tee and shorts the character builder shows (no hat, so hair is visible).
    preview: { sleeves: "short", pants: "short", top: "#6f9e6a", bottom: "#8e8a7e", accent: "#4f7a4b" },
  };

  // Body type sets the overall width; a loose outfit adds more. Gender presentation changes the
  // torso's SHAPE, as offsets from that width at the shoulders, the waist and the hem: feminine has
  // narrower shoulders, a waist and fuller hips; masculine has broad shoulders tapering down.
  const BODY_WIDTH = { skinny: -8, average: 0, fat: 14 };
  const GENDER_SHAPE = { feminine: { shoulders: -4, waist: -10, hem: -1 }, masculine: { shoulders: 6, waist: 1, hem: -3 } };

  // --- Head parts, drawn in a 120-wide head space (centre 60,48, radius 24) and scaled up later ---
  // Hair is returned in two layers: `back` goes behind the body, `front` over the head.
  function hairLayers(hair) {
    const color = hair.color;
    const cap = '<path d="M35 46a25 25 0 0 1 50 0q-25 -16 -50 0z" fill="' + color + '"/>';
    const layers = {
      short: { back: "", front: cap },
      long: { back: '<path d="M33 44h54v50q-27 9 -54 0z" fill="' + color + '"/>', front: cap },
      curly: {
        back: "",
        front:
          '<g fill="' + color + '"><circle cx="38" cy="40" r="8"/><circle cx="48" cy="30" r="9"/><circle cx="60" cy="27" r="9"/><circle cx="72" cy="30" r="9"/><circle cx="82" cy="40" r="8"/></g>' + cap,
      },
      spiky: { back: "", front: '<path d="M36 42L40 18l8 16 6 -18 6 17 6 -17 6 18 8 -16 4 24q-24 -10 -48 0z" fill="' + color + '"/>' },
      bun: { back: "", front: cap + '<circle cx="60" cy="19" r="9" fill="' + color + '"/>' },
      ponytail: { back: '<path d="M80 38q20 6 10 38q-8 -10 -14 -16z" fill="' + color + '"/>', front: cap },
      wavy: {
        back: '<path d="M34 44q-8 18 0 36q8 -6 4 -20zM86 44q8 18 0 36q-8 -6 -4 -20z" fill="' + color + '"/>',
        front: cap,
      },
      bald: { back: "", front: "" },
    };
    return layers[hair.style];
  }

  function earsSvg(id, skin) {
    const ear = (cx, flip) => {
      const f = flip ? -1 : 1;
      return {
        round: '<circle cx="' + cx + '" cy="50" r="4.5" fill="' + skin + '" stroke="' + SOFT + '" stroke-width="1"/>',
        pointed: '<path d="M' + cx + " 54l" + 9 * f + " -14l" + -5 * f + ' 16z" fill="' + skin + '" stroke="' + SOFT + '" stroke-width="1"/>',
        big: '<ellipse cx="' + cx + '" cy="50" rx="5.5" ry="8" fill="' + skin + '" stroke="' + SOFT + '" stroke-width="1"/>',
        small: '<circle cx="' + cx + '" cy="50" r="2.8" fill="' + skin + '" stroke="' + SOFT + '" stroke-width="1"/>',
      }[id];
    };
    return ear(36, false) + ear(84, true);
  }

  function eyesSvg(id) {
    const eye = (cx) =>
      ({
        round: '<circle cx="' + cx + '" cy="48" r="2.8" fill="' + FACE_INK + '"/>',
        wide: '<circle cx="' + cx + '" cy="48" r="4.6" fill="#fff" stroke="' + FACE_INK + '" stroke-width="1.2"/><circle cx="' + cx + '" cy="48" r="2.2" fill="' + FACE_INK + '"/>',
        narrow: '<ellipse cx="' + cx + '" cy="48" rx="3.6" ry="1.5" fill="' + FACE_INK + '"/>',
        happy: '<path d="M' + (cx - 4) + ' 49q4 -5 8 0" stroke="' + FACE_INK + '" stroke-width="2.2" fill="none" stroke-linecap="round"/>',
        large: '<circle cx="' + cx + '" cy="48" r="3.8" fill="' + FACE_INK + '"/>',
        sparkle: '<circle cx="' + cx + '" cy="48" r="3.4" fill="' + FACE_INK + '"/><circle cx="' + (cx + 1.2) + '" cy="46.8" r="1.1" fill="#fff"/>',
      }[id]);
    return eye(51) + eye(69);
  }

  function noseSvg(id) {
    return {
      dot: '<circle cx="60" cy="55" r="1.4" fill="' + SOFT + '"/>',
      line: '<path d="M60 51v8" stroke="' + SOFT + '" stroke-width="1.6" stroke-linecap="round"/>',
      button: '<circle cx="60" cy="56" r="2.6" fill="none" stroke="' + SOFT + '" stroke-width="1.4"/>',
      pointed: '<path d="M60 50l-3.5 9h7z" fill="none" stroke="' + SOFT + '" stroke-width="1.4" stroke-linejoin="round"/>',
      wide: '<path d="M55 57q5 4 10 0" fill="none" stroke="' + SOFT + '" stroke-width="1.6" stroke-linecap="round"/>',
    }[id];
  }

  function mouthSvg(id) {
    return {
      smile: '<path d="M52 61q8 7 16 0" stroke="' + FACE_INK + '" stroke-width="2.4" fill="none" stroke-linecap="round"/>',
      grin: '<path d="M50 60q10 12 20 0z" fill="' + FACE_INK + '"/>',
      flat: '<path d="M53 63h14" stroke="' + FACE_INK + '" stroke-width="2.4" stroke-linecap="round"/>',
      small: '<circle cx="60" cy="63" r="2.4" fill="' + FACE_INK + '"/>',
      smirk: '<path d="M52 63q8 3 15 -3" stroke="' + FACE_INK + '" stroke-width="2.4" fill="none" stroke-linecap="round"/>',
      lips: '<path d="M52 62q4 -3 8 -1q4 -2 8 1q-8 7 -16 0z" fill="#c0524f"/>',
    }[id];
  }

  // Personality is an expression layer over whatever eyes, nose and mouth were chosen:
  // eyebrows, plus a mark or two (sweat, blush) and, for chill, heavy lids.
  function expressionSvg(personality, skin) {
    const brow = (d, width) => '<path d="' + d + '" stroke="' + FACE_INK + '" stroke-width="' + width + '" fill="none" stroke-linecap="round"/>';
    return {
      energetic:
        brow("M46 40q5 -3 9 0", 2.2) + brow("M65 40q5 -3 9 0", 2.2) +
        '<circle cx="43" cy="58" r="4" fill="#ff8aa0" opacity=".45"/><circle cx="77" cy="58" r="4" fill="#ff8aa0" opacity=".45"/>',
      anxious:
        brow("M46 41l9 -3", 2) + brow("M74 41l-9 -3", 2) +
        '<path d="M82 38q3 5 0 8q-3 -3 0 -8z" fill="#7bc4f0"/>',
      grumpy: brow("M45 40l10 4", 2.8) + brow("M75 40l-10 4", 2.8),
      chill:
        '<rect x="45" y="42" width="12" height="6.4" fill="' + skin + '"/><rect x="63" y="42" width="12" height="6.4" fill="' + skin + '"/>' +
        brow("M46 48.4h10", 2.4) + brow("M64 48.4h10", 2.4) + brow("M46 40h9", 1.6) + brow("M65 40h9", 1.6),
      neutral: brow("M46 40.5h9", 1.8) + brow("M65 40.5h9", 1.8),
    }[personality];
  }

  // The figure's drawing area: 120 wide, 200 tall. The head is large (Mii-style proportions).
  const FIGURE_WIDTH = 120;
  const FIGURE_HEIGHT = 200;
  const HEAD_SCALE = 1.2; // head space (radius 24) -> figure space (radius ~29), centred at (60, 42)
  const HEAD_TRANSFORM = "translate(60 42) scale(" + HEAD_SCALE + ") translate(-60 -48)";

  // look = { character, category, outfitId, tag, alt, view: "full" | "head", decorative }
  function characterSvg(look) {
    const character = Traits.normalize(look.character || { id: "?" });
    const outfit = OUTFIT_LOOK[look.outfitId] || OUTFIT_LOOK["mild-2"];
    const skin = Traits.skinColor(character);
    const skinDark = shade(skin, -0.12);
    const hair = hairLayers(Traits.hairOf(character));
    const wide = BODY_WIDTH[character.bodyType] + (look.tag === "loose" ? 12 : 0);
    const longPants = outfit.pants === "long";
    const shadeRight = (x, y, w, h, rx) => '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="' + rx + '" fill="rgba(20,10,40,.11)"/>';

    // Geometry
    const shape = GENDER_SHAPE[character.genderPresentation];
    const baseW = 40 + wide;
    const torsoW = baseW + shape.shoulders; // shoulder width: the arms hang from here
    const torsoX = 60 - torsoW / 2;
    const defs = [];
    const torsoTop = 75;
    const torsoH = outfit.coat ? 72 : 52;
    const legW = 14 + wide / 3.5;
    const legXs = [60 - legW - 1.5, 61.5];
    const armW = 11 + Math.max(0, wide) / 8;
    const armXs = [torsoX - armW + 2.5, torsoX + torsoW - 2.5];
    const pantsEnd = outfit.pants === "short" ? 154 : outfit.socks ? 172 : 186;

    const body = [];

    // legs: skin first (shows below shorts and under socks), then the pants over the top
    legXs.forEach((x, i) => {
      body.push('<rect x="' + x + '" y="124" width="' + legW + '" height="64" rx="6" fill="' + skin + '"/>');
      body.push('<rect x="' + x + '" y="124" width="' + legW + '" height="' + (pantsEnd - 124) + '" rx="6" fill="' + outfit.bottom + '"/>');
      body.push(shadeRight(x + legW * 0.58, 124, legW * 0.42, pantsEnd - 124, 5));
      if (outfit.socks) body.push('<rect x="' + x + '" y="170" width="' + legW + '" height="16" rx="5" fill="#f4f1ea"/><path d="M' + x + " 175h" + legW + "M" + x + " 180h" + legW + '" stroke="' + shade(outfit.accent, -0.2) + '" stroke-width="1.6" fill="none"/>');
      if (outfit.cuffs && longPants) body.push('<rect x="' + x + '" y="' + (pantsEnd - 7) + '" width="' + legW + '" height="7" rx="3" fill="' + shade(outfit.bottom, -0.25) + '"/>');
      if (outfit.stripe) body.push('<rect x="' + (i === 0 ? x + 1 : x + legW - 3.5) + '" y="126" width="2.6" height="' + (pantsEnd - 128) + '" fill="' + (outfit.accent === "#ffffff" ? "#ffffff" : "#ffffff") + '" opacity=".9"/>');
      if (outfit.pockets) body.push('<rect x="' + (i === 0 ? x + 1.5 : x + legW - 8) + '" y="136" width="6.5" height="9" rx="1.5" fill="' + shade(outfit.bottom, -0.15) + '" stroke="' + shade(outfit.bottom, -0.4) + '" stroke-width="1"/>');
      if (!longPants) body.push('<rect x="' + x + '" y="' + (pantsEnd - 5) + '" width="' + legW + '" height="5" rx="2.5" fill="' + shade(outfit.bottom, -0.18) + '"/>');
    });
    // shoes: sneakers with a white sole
    legXs.forEach((x) => {
      body.push('<rect x="' + (x - 2) + '" y="183" width="' + (legW + 6) + '" height="12" rx="6" fill="#3b3b4a"/><rect x="' + (x - 2) + '" y="192" width="' + (legW + 6) + '" height="4" rx="2" fill="#f4f4f4"/>');
    });

    // arms: skin, sleeve over the top, hand at the end
    const sleeveEnd = { long: 119, short: 97, none: 0 }[outfit.sleeves];
    armXs.forEach((x) => {
      body.push('<rect x="' + x + '" y="78" width="' + armW + '" height="46" rx="' + armW / 2 + '" fill="' + skin + '"/>');
      if (sleeveEnd) {
        body.push('<rect x="' + x + '" y="78" width="' + armW + '" height="' + (sleeveEnd - 78) + '" rx="' + armW / 2.2 + '" fill="' + outfit.top + '"/>');
        body.push(shadeRight(x + armW * 0.55, 78, armW * 0.45, sleeveEnd - 78, 3));
        if (outfit.sleeves === "long") body.push('<rect x="' + x + '" y="' + (sleeveEnd - 6) + '" width="' + armW + '" height="6" rx="3" fill="' + shade(outfit.top, -0.22) + '"/>');
      }
      body.push('<circle cx="' + (x + armW / 2) + '" cy="125" r="' + (5.4 + armW / 14) + '" fill="' + skin + '"/>');
    });

    // torso
    const topH = outfit.crop ? 30 : torsoH;
    if (outfit.crop) body.push('<rect x="' + (torsoX + 2) + '" y="' + (torsoTop + 20) + '" width="' + (torsoW - 4) + '" height="34" rx="8" fill="' + skin + '"/>');
    // The torso is a path: shoulders, waist and hem widths follow the gender presentation.
    const waistW = baseW + shape.waist;
    const hemW = baseW + shape.hem;
    const t0 = torsoTop;
    const t1 = torsoTop + topH;
    const mid = torsoTop + topH * 0.5;
    const torsoPath =
      "M" + (60 - torsoW / 2 + 10) + " " + t0 + "H" + (60 + torsoW / 2 - 10) +
      "Q" + (60 + torsoW / 2) + " " + t0 + " " + (60 + torsoW / 2) + " " + (t0 + 10) +
      "L" + (60 + waistW / 2) + " " + mid + "L" + (60 + hemW / 2) + " " + (t1 - 8) +
      "Q" + (60 + hemW / 2) + " " + t1 + " " + (60 + hemW / 2 - 8) + " " + t1 +
      "H" + (60 - hemW / 2 + 8) +
      "Q" + (60 - hemW / 2) + " " + t1 + " " + (60 - hemW / 2) + " " + (t1 - 8) +
      "L" + (60 - waistW / 2) + " " + mid + "L" + (60 - torsoW / 2) + " " + (t0 + 10) +
      "Q" + (60 - torsoW / 2) + " " + t0 + " " + (60 - torsoW / 2 + 10) + " " + t0 + "Z";
    const clipId = nextId("torso");
    defs.push('<clipPath id="' + clipId + '"><path d="' + torsoPath + '"/></clipPath>');
    body.push('<path d="' + torsoPath + '" fill="' + outfit.top + '"/>');
    // shading, ribbed hem and quilting are clipped to the torso so they follow its shape
    body.push('<g clip-path="url(#' + clipId + ')" stroke="none">' + shadeRight(60 + torsoW * 0.14, t0, torsoW, topH, 0));
    if (outfit.rib) body.push('<rect x="0" y="' + (t1 - 6) + '" width="120" height="6" fill="' + shade(outfit.top, -0.22) + '"/>');
    if (outfit.coat === "puffer") {
      body.push('<path d="M0 ' + (t0 + 20) + "H120M0 " + (t0 + 40) + "H120M0 " + (t0 + 60) + 'H120" stroke="' + shade(outfit.top, -0.3) + '" stroke-width="1.6" fill="none"/>');
    }
    body.push("</g>");
    if (outfit.coat === "wool") {
      body.push('<path d="M60 ' + torsoTop + "L46 " + (torsoTop + 4) + "L55 " + (torsoTop + 32) + 'z" fill="' + shade(outfit.top, 0.14) + '"/><path d="M60 ' + torsoTop + "L74 " + (torsoTop + 4) + "L65 " + (torsoTop + 32) + 'z" fill="' + shade(outfit.top, 0.14) + '"/>');
      body.push('<path d="M60 ' + (torsoTop + 20) + "v" + (torsoH - 20) + '" stroke="' + shade(outfit.top, -0.35) + '" stroke-width="1.6"/>');
      [34, 46, 58].forEach((dy) => body.push('<circle cx="64.5" cy="' + (torsoTop + dy) + '" r="2" fill="' + shade(outfit.top, 0.35) + '"/>'));
    }
    if (outfit.coat === "parka") {
      body.push('<rect x="' + (torsoX + 3) + '" y="' + (torsoTop + 44) + '" width="9" height="13" rx="2" fill="' + shade(outfit.top, -0.14) + '" stroke="' + shade(outfit.top, -0.4) + '" stroke-width="1"/><rect x="' + (torsoX + torsoW - 12) + '" y="' + (torsoTop + 44) + '" width="9" height="13" rx="2" fill="' + shade(outfit.top, -0.14) + '" stroke="' + shade(outfit.top, -0.4) + '" stroke-width="1"/>');
    }
    if (outfit.zip) {
      body.push('<path d="M60 ' + torsoTop + "v" + topH + '" stroke="' + shade(outfit.top, -0.4) + '" stroke-width="1.8"/><circle cx="60" cy="' + (torsoTop + 12) + '" r="2" fill="#e9e9e9" stroke="' + INK + '" stroke-width="1"/>');
    }
    // neckline: tank tops and tees show skin at the chest; a hoodie shows its hood
    if (outfit.sleeves === "none" && !outfit.crop) {
      body.push('<rect x="' + (torsoX + 9) + '" y="' + torsoTop + '" width="' + (torsoW - 18) + '" height="15" rx="7" fill="' + skin + '"/>');
    } else if (outfit.crop) {
      body.push('<path d="M50 ' + torsoTop + "q10 11 20 0z" + '" fill="' + skin + '"/>');
    } else if (!outfit.coat && !outfit.zip && !outfit.hood && !outfit.scarf) {
      body.push('<path d="M51 ' + (torsoTop - 1) + "q9 11 18 0z" + '" fill="' + skinDark + '"/>');
    }
    if (outfit.hood === "down") {
      body.push('<path d="M43 ' + (torsoTop - 1) + "q17 18 34 0q5 11 -5 15h-24q-10 -4 -5 -15z" + '" fill="' + outfit.accent + '"/><path d="M55 ' + (torsoTop + 12) + "v12M65 " + (torsoTop + 12) + 'v12" stroke="#f4f1ea" stroke-width="1.8" stroke-linecap="round"/>');
    }
    if (outfit.scarf) {
      body.push('<rect x="' + (torsoX - 2) + '" y="69" width="' + (torsoW + 4) + '" height="13" rx="6" fill="' + outfit.accent + '"/><rect x="' + (torsoX + torsoW - 14) + '" y="76" width="9" height="22" rx="3.5" fill="' + shade(outfit.accent, -0.12) + '"/>');
    }

    // hood up goes behind the head
    const hoodBack = outfit.hood === "up" ? '<circle cx="60" cy="42" r="35" fill="' + outfit.top + '"/>' : "";

    // head group: scaled-up head space
    const head = [];
    head.push('<g stroke="' + INK + '" stroke-width="1.25" stroke-linejoin="round">' + earsSvg(character.ear, skin) + '<circle cx="60" cy="48" r="24" fill="' + skin + '"/>' + hair.front + "</g>");
    head.push('<ellipse cx="47" cy="34" rx="7" ry="3.6" fill="#fff" opacity=".22" transform="rotate(-28 47 34)"/>');
    head.push(noseSvg(character.nose), eyesSvg(character.eyes), mouthSvg(character.mouth), expressionSvg(character.personality, skin));
    if (outfit.glasses) head.push('<rect x="42" y="43" width="36" height="10" rx="4.5" fill="#1d1d1d" opacity=".88"/>');
    // accessories only when the outfit's name mentions them (the test keeps name and drawing in sync)
    if (outfit.cap) head.push('<g stroke="' + INK + '" stroke-width="1.2" stroke-linejoin="round"><path d="M34 40a26 22 0 0 1 52 0z" fill="' + outfit.accent + '"/><rect x="58" y="36" width="40" height="7" rx="3.5" fill="' + shade(outfit.accent, -0.15) + '"/></g>');
    if (outfit.sunHat) head.push('<g stroke="' + INK + '" stroke-width="1.2" stroke-linejoin="round"><ellipse cx="60" cy="31" rx="40" ry="7" fill="' + outfit.accent + '"/><path d="M40 31a20 16 0 0 1 40 0z" fill="' + shade(outfit.accent, 0.15) + '"/><rect x="40" y="26" width="40" height="5" fill="#c9553d"/></g>');
    if (outfit.beanie) head.push('<g stroke="' + INK + '" stroke-width="1.2" stroke-linejoin="round"><path d="M35 38a25 24 0 0 1 50 0z" fill="' + outfit.accent + '"/><rect x="34" y="35" width="52" height="7" rx="3" fill="' + shade(outfit.accent, -0.2) + '"/><circle cx="60" cy="14" r="5" fill="' + shade(outfit.accent, 0.2) + '"/></g>');
    const hoodRim = outfit.hood === "up"
      ? '<path d="M25 50A35 35 0 0 1 95 50L88 50A28 28 0 0 0 32 50Z" fill="' + outfit.top + '" stroke="' + INK + '" stroke-width="1.4" stroke-linejoin="round"/>'
      : "";

    const outlined = '<g stroke="' + INK + '" stroke-width="1.6" stroke-linejoin="round">' + body.join("") + "</g>";
    const parts =
      '<g stroke="' + INK + '" stroke-width="1.4" stroke-linejoin="round">' + hair.back + "</g>" +
      outlined +
      (hoodBack ? '<g stroke="' + INK + '" stroke-width="1.6">' + hoodBack + "</g>" : "") +
      '<g transform="' + HEAD_TRANSFORM + '">' + head.join("") + "</g>" +
      (hoodRim ? '<g transform="translate(0 0)">' + hoodRim + "</g>" : "");

    // "head" frames just the head and hair (builder face tabs, gallery thumbnails); no fixed size:
    // CSS scales the figure to the room available, anchored to the ground.
    const viewBox = look.view === "head" ? "18 -2 84 84" : "0 0 " + FIGURE_WIDTH + " " + FIGURE_HEIGHT;
    const aspect = look.view === "head" ? "xMidYMid meet" : "xMidYMax meet";
    const a11y = look.decorative ? 'aria-hidden="true"' : 'role="img" aria-label="' + look.alt + '"';
    return '<svg class="character-art" viewBox="' + viewBox + '" preserveAspectRatio="' + aspect + '" ' + a11y + ">" + (defs.length ? "<defs>" + defs.join("") + "</defs>" : "") + parts + "</svg>";
  }

  window.Art = {
    WEATHER_ICONS, REMINDER_ICONS, OUTFIT_LOOK, FIGURE_WIDTH, FIGURE_HEIGHT,
    weatherIcon, reminderIcon, skyArt, sceneSvg, characterSvg,
  };
})();
