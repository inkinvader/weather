// Original vector artwork, drawn in code (Wii/Mii-era-inspired: big round heads, simple rounded
// shapes, soft glossy 3D shading). This is the final art, not a placeholder: research.md Revisions
// records the 2026-10-12 decision to draw every character, icon and scene as vectors instead of
// generating images. Exposes window.Art.
//
// Everything on screen is chosen from the recommendation state: the weather art from
// weatherConditionIcon, the outfit drawing from the chosen outfit variation, and the face and
// body from the character's builder traits.
//
// The 3D look is built from gradients: limbs and torsos are shaded like cylinders, heads and hands
// like spheres, with light from the upper left, glossy highlights, and a contact shadow underfoot.

(function () {
  let uidCounter = 0;
  const nextId = (prefix) => prefix + "-" + ++uidCounter; // unique SVG ids when several figures share a page

  const INK = "#33283a";
  const OUTLINE = 'stroke="#2a1f33" stroke-opacity=".5" stroke-linejoin="round"'; // soft outline, not a hard black line
  const FACE_INK = "#2a2320";
  const SOFT = "rgba(0,0,0,.45)"; // nose and ear outlines that read on every skin tone

  // amount in -1..1: negative darkens, positive lightens (hex colours only)
  function shade(hex, amount) {
    const n = parseInt(hex.slice(1), 16);
    const channels = [n >> 16, (n >> 8) & 255, n & 255].map((v) => Math.round(amount < 0 ? v * (1 + amount) : v + (255 - v) * amount));
    return "#" + channels.map((v) => v.toString(16).padStart(2, "0")).join("");
  }

  // --- Volume shading ---------------------------------------------------------------------------
  // volumes() returns V(colour, kind), which gives a gradient fill for that colour and registers the
  // gradient in `defs` (to go in the SVG's <defs>). Gradients use the shape's own bounding box, so
  // every limb, torso and head is shaded on its own, lit from the upper left:
  //   "cyl"    light on the left, base in the middle, dark on the right (limbs, torsos, clothes)
  //   "sphere" a highlight toward the top left fading to a dark rim (heads, hands, hair)
  //   "vert"   light at the top, darker at the bottom (clouds, ground)
  function volumes() {
    const defs = [];
    const cache = {};
    const stop = (offset, color) => '<stop offset="' + offset + '" stop-color="' + color + '"/>';
    function V(color, kind) {
      const k = kind || "cyl";
      const key = k + color;
      if (cache[key]) return "url(#" + cache[key] + ")";
      const id = nextId("v");
      cache[key] = id;
      if (k === "hair") {
        // all hair pieces share one light source in head space, so merged pieces look like one mass
        defs.push('<radialGradient id="' + id + '" gradientUnits="userSpaceOnUse" cx="52" cy="30" r="42">' + stop(0, shade(color, 0.2)) + stop(0.5, color) + stop(1, shade(color, -0.3)) + "</radialGradient>");
      } else if (k === "sphere") {
        defs.push('<radialGradient id="' + id + '" cx=".36" cy=".3" r=".85">' + stop(0, shade(color, 0.14)) + stop(0.45, color) + stop(1, shade(color, -0.26)) + "</radialGradient>");
      } else if (k === "vert") {
        defs.push('<linearGradient id="' + id + '" x1="0" y1="0" x2="0" y2="1">' + stop(0, shade(color, 0.12)) + stop(0.6, color) + stop(1, shade(color, -0.2)) + "</linearGradient>");
      } else {
        defs.push('<linearGradient id="' + id + '" x1="0" y1="0" x2="1" y2="0">' + stop(0, shade(color, 0.1)) + stop(0.3, shade(color, 0.2)) + stop(0.62, color) + stop(1, shade(color, -0.28)) + "</linearGradient>");
      }
      return "url(#" + id + ")";
    }
    // soft white highlight and soft dark contact shadow, shared by everything in one SVG
    const shine = nextId("shine");
    const shadow = nextId("shadow");
    defs.push('<radialGradient id="' + shine + '"><stop offset="0" stop-color="#fff" stop-opacity=".85"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>');
    defs.push('<radialGradient id="' + shadow + '"><stop offset="0" stop-color="#1a1230" stop-opacity=".38"/><stop offset="1" stop-color="#1a1230" stop-opacity="0"/></radialGradient>');
    // soft fade used for shadows ON the body: always drawn inside a clip of the body's own shape
    const edge = nextId("edge");
    defs.push('<radialGradient id="' + edge + '" cx=".5" cy=".5" r=".5"><stop offset=".6" stop-color="#1a1230" stop-opacity="0"/><stop offset="1" stop-color="#1a1230" stop-opacity=".38"/></radialGradient>');
    const fade = nextId("fade");
    defs.push('<linearGradient id="' + fade + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1a1230" stop-opacity=".3"/><stop offset="1" stop-color="#1a1230" stop-opacity="0"/></linearGradient>');
    return {
      V: V,
      defs: defs,
      shineFill: "url(#" + shine + ")",
      shadowFill: "url(#" + shadow + ")",
      fadeFill: "url(#" + fade + ")",
      edgeFill: "url(#" + edge + ")",
    };
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

  // --- Sky art: the big weather picture (filled, shaded shapes) -----------------------------------
  // A "puffy" cloud is drawn as a union: the shapes once with a thick outline, then again shaded on
  // top, so the outline follows the merged silhouette instead of crossing the inside.
  function puffyCloud(V, x, y, scale, fill) {
    const shapes = (f) =>
      '<circle cx="36" cy="52" r="16" fill="' + f + '"/><circle cx="58" cy="38" r="22" fill="' + f + '"/><circle cx="82" cy="50" r="17" fill="' + f + '"/><rect x="26" y="50" width="68" height="20" rx="10" fill="' + f + '"/>';
    return (
      '<g transform="translate(' + x + " " + y + ") scale(" + scale + ')">' +
      '<g stroke="' + INK + '" stroke-opacity=".7" stroke-width="7" stroke-linejoin="round">' + shapes(INK) + "</g>" +
      shapes(V(fill, "sphere")) +
      '<ellipse cx="46" cy="30" rx="13" ry="6" fill="#fff" opacity=".55"/></g>'
    );
  }

  function sunShape(V, cx, cy, scale) {
    const rays = Array.from({ length: 12 }, (_, k) =>
      '<rect x="' + (cx - 3.5 * scale) + '" y="' + (cy - 46 * scale) + '" width="' + 7 * scale + '" height="' + 13 * scale + '" rx="' + 3.5 * scale + '" transform="rotate(' + k * 30 + " " + cx + " " + cy + ')"/>'
    ).join("");
    return (
      '<circle cx="' + cx + '" cy="' + cy + '" r="' + 38 * scale + '" fill="#ffe9a0" opacity=".55"/>' +
      '<g fill="#ffbf2e" stroke="#d98f12" stroke-width="2" stroke-linejoin="round">' + rays + "</g>" +
      '<circle cx="' + cx + '" cy="' + cy + '" r="' + 25 * scale + '" fill="' + V("#ffd23f", "sphere") + '" stroke="#d98f12" stroke-width="2.4"/>' +
      '<ellipse cx="' + (cx - 8 * scale) + '" cy="' + (cy - 10 * scale) + '" rx="' + 9 * scale + '" ry="' + 5 * scale + '" fill="#fff" opacity=".6" transform="rotate(-35 ' + (cx - 8 * scale) + " " + (cy - 10 * scale) + ')"/>'
    );
  }

  const DROP = (x, y) => '<path d="M' + x + " " + y + 'q6 8 0 12q-6 -4 0 -12z" fill="#5aa7ec" stroke="#2f78b8" stroke-width="1.5" stroke-linejoin="round"/>';
  const FLAKE = (x, y) => '<circle cx="' + x + '" cy="' + y + '" r="4" fill="#fff" stroke="#8fb4d8" stroke-width="1.6"/>';

  const SKY_ART = {
    clear: (V) => sunShape(V, 80, 60, 1.05),
    partly_cloudy: (V) => sunShape(V, 60, 46, 0.78) + puffyCloud(V, 40, 34, 1.0, "#ffffff"),
    cloudy: (V) => puffyCloud(V, 48, 6, 0.9, "#cfd8e2") + puffyCloud(V, 14, 24, 1.15, "#f4f7fb"),
    rain: (V) => puffyCloud(V, 16, 4, 1.25, "#aebccb") + [30, 54, 78, 102, 126].map((x, i) => DROP(x, 92 + (i % 2) * 8)).join(""),
    thunderstorm: (V) =>
      puffyCloud(V, 16, 2, 1.25, "#7a869c") +
      '<path d="M82 66l-14 24h12l-8 22 26-30H85l9-16z" fill="#ffd23f" stroke="#c98f00" stroke-width="2.4" stroke-linejoin="round"/>',
    snow: (V) => puffyCloud(V, 16, 2, 1.25, "#e9eff6") + [34, 58, 82, 106, 130].map((x, i) => FLAKE(x, 96 + (i % 2) * 10)).join(""),
    windy_fog: (V) =>
      '<circle cx="104" cy="40" r="22" fill="' + V("#fff3c4", "sphere") + '" stroke="#e0c26a" stroke-width="2.4" opacity=".85"/>' +
      '<g fill="#f6f8fa" stroke="' + INK + '" stroke-opacity=".7" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">' +
      '<path d="M18 46h86a9 9 0 0 1 0 18H70"/><path d="M50 70h80a9 9 0 0 1 0 18H30a9 9 0 0 1 0-18z"/>' +
      '<path d="M14 94h84a9 9 0 0 1 0 18H54"/></g>',
  };

  // Big weather picture, decorative (the condition is also written out as text next to it).
  function skyArt(icon) {
    const vol = volumes();
    const body = (SKY_ART[icon] || SKY_ART.clear)(vol.V);
    return '<svg class="sky-art" viewBox="0 0 160 120" width="150" height="112" aria-hidden="true"><defs>' + vol.defs.join("") + "</defs>" + body + "</svg>";
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

  function building(V, b, fill, windowFill) {
    const wins = [];
    for (let wy = b.y + 14; wy < b.y + b.h - 20; wy += 18) {
      for (let wx = b.x + 9; wx < b.x + b.w - 12; wx += 14) {
        wins.push('<rect x="' + wx + '" y="' + wy + '" width="7" height="9" rx="1.5"/>');
      }
    }
    return '<rect x="' + b.x + '" y="' + b.y + '" width="' + b.w + '" height="' + b.h + '" fill="' + V(fill, "cyl") + '"/><g fill="' + windowFill + '">' + wins.join("") + "</g>";
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
    const vol = volumes();
    const V = vol.V;
    const gradient = nextId("sky");
    const back = [{ x: -12, y: 296, w: 72, h: 180 }, { x: 70, y: 350, w: 58, h: 126 }, { x: 226, y: 326, w: 62, h: 150 }, { x: 296, y: 270, w: 72, h: 206 }, { x: 358, y: 336, w: 60, h: 140 }];
    const front = [{ x: 14, y: 336, w: 64, h: 140 }, { x: 128, y: 386, w: 52, h: 90 }, { x: 246, y: 304, w: 52, h: 172 }, { x: 322, y: 372, w: 56, h: 104 }];
    const night = icon === "thunderstorm" ? 0.1 : 0;
    // Build the shapes first: V() registers each gradient as it is used, so the <defs> must be
    // written out only after every shape has been made.
    const inner =
      '<rect width="400" height="600" fill="url(#' + gradient + ')"/>' +
      '<g stroke="' + INK + '" stroke-opacity=".3" stroke-width="1.5">' +
      back.map((b) => building(V, b, shade("#9fb4c6", -night), "rgba(255,255,255,.5)")).join("") +
      front.map((b) => building(V, b, shade("#8aa0b5", -night), "rgba(255,255,255,.42)")).join("") +
      "</g>" +
      // a tree (shaded canopy spheres) and a lamp post for depth
      '<g stroke="' + INK + '" stroke-opacity=".35" stroke-width="1.5"><rect x="36" y="410" width="9" height="66" fill="' + V("#8a6a4a", "cyl") + '"/><circle cx="40" cy="398" r="26" fill="' + V("#6fa86a", "sphere") + '"/><circle cx="24" cy="414" r="17" fill="' + V("#7fb878", "sphere") + '"/><circle cx="57" cy="414" r="18" fill="' + V("#7fb878", "sphere") + '"/>' +
      '<rect x="384" y="380" width="5" height="96" fill="' + V("#6b7480", "cyl") + '"/><circle cx="386" cy="376" r="8" fill="#ffe9a0"/></g>' +
      '<rect y="470" width="400" height="130" fill="' + V("#b4bcc4", "vert") + '"/><rect y="470" width="400" height="7" fill="#9aa3ad"/>' +
      '<g stroke="#9aa3ad" stroke-width="2">' + Array.from({ length: 9 }, (_, i) => '<path d="M' + (i * 52 - 10) + " 477l-" + 14 + ' 123"/>').join("") + "</g>" +
      weatherOverlay(icon);
    return (
      '<svg class="scene-art" viewBox="0 0 400 600" preserveAspectRatio="xMidYMax slice" aria-hidden="true">' +
      '<defs><linearGradient id="' + gradient + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + sky[0] + '"/><stop offset="1" stop-color="' + sky[1] + '"/></linearGradient>' + vol.defs.join("") + "</defs>" +
      inner +
      "</svg>"
    );
  }

  // --- Character: body, outfit, head ----------------------------------------------------------
  // One entry per outfit id, written to match the outfit's name in variation.js (a test keeps the
  // drawing and the written name in sync). Fields:
  //   sleeves: long | short | none      pants: long | short      top, bottom, accent: colours
  //   coat: wool | puffer | parka (longer outer layer)   zip   hood: up (always up, never down), hoodColor (defaults to top), hoodStyle (classic | puffy | slouch)   drawstrings   scarf   beanie   cap
  //   sunHat   glasses   socks   cuffs   stripe   pockets   crop   rib
  const OUTFIT_LOOK = {
    "freezing-1": { sleeves: "long", pants: "long", top: "#4b6fa8", bottom: "#2f3b52", accent: "#c9553d", coat: "puffer", hood: "up", hoodStyle: "puffy", scarf: true, cuffs: true },
    "freezing-2": { sleeves: "long", pants: "long", top: "#2d3139", bottom: "#23262e", accent: "#3b3f48", coat: "wool", beanie: true },
    "freezing-3": { sleeves: "long", pants: "long", top: "#6b8e6a", bottom: "#4a4f58", accent: "#f2efe6", coat: "parka", zip: true, socks: true },
    "cold-1": { sleeves: "long", pants: "long", top: "#d9573b", bottom: "#3a3f4b", accent: "#9aa1a9", zip: true, hood: "up", hoodColor: "#f0e2b8", hoodStyle: "classic", drawstrings: true, stripe: true, cuffs: true },
    "cold-2": { sleeves: "long", pants: "long", top: "#7a5c3e", bottom: "#3b4a6b", accent: "#c9553d", coat: "parka", zip: true, hood: "up", hoodColor: "#4a7f86", hoodStyle: "slouch", drawstrings: true, scarf: true },
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
  // Where the hair meets the forehead, measured in head space (the brows are at y=40).
  const HAIRLINE = { centreY: 29, browY: 40 };

  const SPIKES = [[-58, 9], [-38, 13], [-18, 16], [2, 19], [20, 15], [40, 12], [60, 8]]
    .map(([deg, len]) => {
      const at = (angle, radius) => [60 + radius * Math.sin((angle * Math.PI) / 180), 46 - radius * Math.cos((angle * Math.PI) / 180)];
      const [x1, y1] = at(deg - 12, 23);
      const [x2, y2] = at(deg + 12, 23);
      const [tx, ty] = at(deg * 0.55, 25 + len); // tips lean only a little outward, so the hair mostly points up
      return "M" + x1.toFixed(1) + " " + y1.toFixed(1) + "L" + tx.toFixed(1) + " " + ty.toFixed(1) + "L" + x2.toFixed(1) + " " + y2.toFixed(1) + "Z";
    })
    .join("");

  function hairLayers(hair, V) {
    if (hair.style === "bald") return { back: "", front: "" };
    const color = hair.color;
    const fill = V(color, "hair");
    const OUT = "#2a1f33";
    // Every hairstyle is made of several shapes, but it must read as ONE hair piece. So the shapes are drawn
    // twice: first with a thick soft outline (the outline of their merged silhouette), then again as flat
    // shaded fill with no outline of their own. That leaves no lines between overlapping pieces.
    const merged = (shapes) =>
      '<g stroke="' + OUT + '" stroke-opacity=".5" stroke-width="2.4" stroke-linejoin="round">' + shapes(OUT) + "</g>" + shapes(fill);
    // The hairline: a mass of hair over the top of the head, with a scalloped fringe across the forehead.
    // The hair mass: a dome over the top of the head with a natural fringe. The hairline sits high on the
    // forehead (about y=27-31; the brows are at y=40), with uneven tufts instead of a smooth curve, and the
    // sides come down only to the temples. (It used to be one smooth arc at eyebrow level.)
    const cap = (f) =>
      '<path d="M34 44A26 24 0 0 1 86 44L81 44C81 39 79 35 76 32C72 31 66 31 62 27C58 31 54 31 50 27C46 31 42 31 40 33C39 37 39 41 39 44L34 44Z" fill="' + f + '"/>';
    const layers = {
      short: { back: "", front: merged((f) => cap(f)) },
      long: { back: merged((f) => '<path d="M33 44h54v50q-27 9 -54 0z" fill="' + f + '"/>'), front: merged((f) => cap(f)) },
      // curly: puffs sit on the hair mass and merge into it: no circle outlines, no seam against the base
      curly: {
        back: "",
        front: merged((f) =>
          cap(f) +
          '<g fill="' + f + '"><circle cx="36" cy="38" r="8"/><circle cx="43" cy="28" r="9"/><circle cx="53" cy="23" r="9"/><circle cx="67" cy="23" r="9"/><circle cx="77" cy="28" r="9"/><circle cx="84" cy="38" r="8"/></g>'),
      },
      // spiky: a hair dome that follows the curve of the head, with seven spikes fanning out of it in
      // different directions (pointing mostly up, leaning slightly away from the middle, in uneven lengths), so no bare skin
      // shows above the hairline and it reads as hair rather than a crown
      spiky: {
        back: "",
        front: merged((f) => cap(f) + '<path d="' + SPIKES + '" fill="' + f + '"/>'),
      },
      bun: { back: "", front: merged((f) => cap(f) + '<circle cx="60" cy="18" r="9" fill="' + f + '"/>') },
      ponytail: { back: merged((f) => '<path d="M80 38q20 6 10 38q-8 -10 -14 -16z" fill="' + f + '"/>'), front: merged((f) => cap(f)) },
      wavy: {
        back: merged((f) => '<path d="M34 44q-8 18 0 36q8 -6 4 -20zM86 44q8 18 0 36q-8 -6 -4 -20z" fill="' + f + '"/>'),
        front: merged((f) => cap(f)),
      },
    };
    return layers[hair.style];
  }

  function earsSvg(id, skinFill, V, skin) {
    const f0 = V(skin, "sphere");
    const ear = (cx, flip) => {
      const f = flip ? -1 : 1;
      return {
        round: '<circle cx="' + cx + '" cy="50" r="4.5" fill="' + f0 + '" stroke="' + SOFT + '" stroke-width="1"/>',
        pointed: '<path d="M' + cx + " 54l" + 9 * f + " -14l" + -5 * f + ' 16z" fill="' + f0 + '" stroke="' + SOFT + '" stroke-width="1"/>',
        big: '<ellipse cx="' + cx + '" cy="50" rx="5.5" ry="8" fill="' + f0 + '" stroke="' + SOFT + '" stroke-width="1"/>',
        small: '<circle cx="' + cx + '" cy="50" r="2.8" fill="' + f0 + '" stroke="' + SOFT + '" stroke-width="1"/>',
      }[id];
    };
    return ear(36, false) + ear(84, true);
  }

  // Eyes get a small white highlight where they are round, which is what makes a face look glossy.
  function eyesSvg(id) {
    const gleam = (cx, r) => '<circle cx="' + (cx + 1.1) + '" cy="46.8" r="' + r + '" fill="#fff" opacity=".9"/>';
    const eye = (cx) =>
      ({
        round: '<circle cx="' + cx + '" cy="48" r="2.8" fill="' + FACE_INK + '"/>' + gleam(cx, 0.9),
        wide: '<circle cx="' + cx + '" cy="48" r="4.6" fill="#fff" stroke="' + FACE_INK + '" stroke-width="1.2"/><circle cx="' + cx + '" cy="48" r="2.2" fill="' + FACE_INK + '"/>' + gleam(cx, 0.8),
        narrow: '<ellipse cx="' + cx + '" cy="48" rx="3.6" ry="1.5" fill="' + FACE_INK + '"/>',
        happy: '<path d="M' + (cx - 4) + ' 49q4 -5 8 0" stroke="' + FACE_INK + '" stroke-width="2.2" fill="none" stroke-linecap="round"/>',
        large: '<circle cx="' + cx + '" cy="48" r="3.8" fill="' + FACE_INK + '"/>' + gleam(cx, 1.2),
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
      grin:
        '<path d="M48 59.5q12 14 24 0z" fill="#fff" stroke="' + FACE_INK + '" stroke-width="1.8" stroke-linejoin="round"/>' +
        '<path d="M50.5 62.8H69.5M54.5 60.5V65M60 60.5V66.5M65.5 60.5V65" stroke="' + FACE_INK + '" stroke-width="1.1" fill="none"/>',
      flat: '<path d="M53 63h14" stroke="' + FACE_INK + '" stroke-width="2.4" stroke-linecap="round"/>',
      small: '<circle cx="60" cy="63" r="2.4" fill="' + FACE_INK + '"/>',
      smirk: '<path d="M52 63q8 3 15 -3" stroke="' + FACE_INK + '" stroke-width="2.4" fill="none" stroke-linecap="round"/>',
      lips: '<path d="M52 62q4 -3 8 -1q4 -2 8 1q-8 7 -16 0z" fill="#c0524f"/>',
    }[id];
  }

  // Facial hair, in head space (centre 60,48; the face is a circle of radius 24; the chin is at y=72).
  // It takes the character's hair colour (a bald character gets dark brown). `behind` sits under the
  // nose, eyes and mouth; the mustache is drawn after the beard and before the nose.
  // The shapes are irregular, not smooth arcs: the beard's cheek line is diagonal from the sideburn to the
  // mouth corner, its lower edge is a row of uneven tufts, and a few strand lines run through it.
  const BEARD_LOWER = "C87 60 85 72 79 78C76 82 73 82 70 84C67 86 64 83 60 85C56 83 53 86 50 84C47 82 44 82 41 78C35 72 33 60 35 46Z";
  // full beard: covers the whole lower face, up to the mustache line
  const FULL_BEARD = "M35 46C35 51 38 56 43 58C47 60 53 59 60 59C67 59 73 60 77 58C82 56 85 51 85 46" + BEARD_LOWER;
  // beard without a mustache: sideburns, jaw and chin, with the upper lip and mouth left free
  const JAW_BEARD = "M35 46C35 51 38 56 43 59C46 62 49 66 54 67C58 68 62 68 66 67C71 66 74 62 77 59C82 56 85 51 85 46" + BEARD_LOWER;
  const MUSTACHE = "M47 60C48 55 54 54 58 57C59 58 61 58 62 57C66 54 72 55 73 60C71 63 66 61 62 60C61 61 59 61 58 60C54 61 49 63 47 60Z";
  // goatee: a RING of hair around the mouth (mustache above, chin patch below, joined at the corners).
  // One path, outer ring then the hole for the mouth, filled with the even-odd rule.
  const GOATEE_RING = "M46 62C46 56 52 55 60 57C68 55 74 56 74 62C74 70 70 76 60 76C50 76 46 70 46 62Z";
  const GOATEE_HOLE = "M52.5 62C52.5 59.5 56 59 60 60C64 59 67.5 59.5 67.5 62C67.5 65.5 64 67 60 67C56 67 52.5 65.5 52.5 62Z";
  const GOATEE = GOATEE_RING + GOATEE_HOLE;
  const FACIAL_SHAPES = { GOATEE, FULL_BEARD, JAW_BEARD, MUSTACHE };

  function facialHairSvg(id, hairColor, V, defs) {
    if (id === "clean") return { behind: "", mustache: "" };
    const color = hairColor === "#000000" ? "#3a2a22" : hairColor;
    const fill = V(color, "vert");
    const shape = (d, extra) => '<path d="' + d + '"' + (extra || "") + ' fill="' + fill + '" stroke="#2a1f33" stroke-opacity=".4" stroke-width="1" stroke-linejoin="round"/>';
    const strands = (d) => '<path d="' + d + '" stroke="' + shade(color, -0.4) + '" stroke-opacity=".5" stroke-width=".9" fill="none" stroke-linecap="round"/>';
    const BEARD_STRANDS = strands("M40 62C42 70 43 76 44 80M48 66C49 74 49 80 50 83M60 68V83M72 66C71 74 71 80 70 83M80 62C78 70 77 76 76 80");
    const MUSTACHE_STRANDS = strands("M51 57C53 58 55 59 58 60M69 57C67 58 65 59 62 60");
    if (id === "stubble") {
      // a faint shadow of hair over the lower face, kept inside the face circle, with a few short bristles
      const clip = nextId("stubble");
      defs.push('<clipPath id="' + clip + '"><circle cx="60" cy="48" r="24"/></clipPath>');
      const dots = [[46, 66], [52, 70], [58, 72], [64, 72], [70, 70], [74, 66], [42, 60], [78, 60], [50, 64], [56, 67], [62, 67], [68, 64], [54, 60.5], [66, 60.5], [45, 55], [75, 55], [60, 64.5], [48, 69]];
      return {
        behind: '<g clip-path="url(#' + clip + ')" stroke="none"><path d="' + FULL_BEARD + '" fill="' + color + '" opacity=".3"/>' + dots.map(([x, y]) => '<circle cx="' + x + '" cy="' + y + '" r=".9" fill="' + color + '" opacity=".6"/>').join("") + "</g>",
        mustache: "",
      };
    }
    return {
      mustache: { behind: "", mustache: shape(MUSTACHE) + MUSTACHE_STRANDS },
      goatee: { behind: shape(GOATEE, ' fill-rule="evenodd"') + strands("M55 69C55 72 56 74 57 75M65 69C65 72 64 74 63 75"), mustache: "" },
      beard: { behind: shape(JAW_BEARD) + BEARD_STRANDS, mustache: "" },
      full: { behind: shape(FULL_BEARD) + BEARD_STRANDS, mustache: shape(MUSTACHE) + MUSTACHE_STRANDS },
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

  // Hoods (figure space). A hoodie hood is NOT a closed shape with a hole in it. It is a thin band that
  // goes over the top of the head and down both sides of the face (a horseshoe, rounded on top, never
  // pointed). It is open under the chin; its two ends run down to a collar at the base of the neck, where
  // it joins the clothes. Three variants, so hoods are not all the same:
  //   classic: thin cotton hood      puffy: a thicker padded hood with quilting      slouch: thin, with the top flopped to one side
  // `band` is the cloth (one closed loop: the outside edge, then back along the inside edge). `inside` is the
  // area the face and neck show through, used for the soft shadow the hood casts on the forehead.
  const HOODS = {
    classic: {
      band: "M52 87C38 83 25 65 27 42C30 22 44 10 60 10C76 10 90 22 93 42C95 65 82 83 68 87L64 83C77 78 87 63 87 46C87 33 76 22 60 21C44 22 33 33 33 46C33 63 43 78 56 83Z",
      inside: "M56 83C43 78 33 63 33 46C33 33 44 22 60 21C76 22 87 33 87 46C87 63 77 78 64 83Z",
      back: "M52 87C38 83 25 65 27 42C30 22 44 10 60 10C76 10 90 22 93 42C95 65 82 83 68 87Q60 91 52 87Z",
      details: (c) => '<path d="M29 48C30 63 38 78 52 85M91 48C90 63 82 78 68 85M46 14C52 12 56 11 60 11" stroke="' + c + '" stroke-width="1.3" fill="none" stroke-linecap="round" opacity=".6"/>',
    },
    puffy: {
      band: "M52 88C36 84 20 66 22 40C26 18 43 6 60 6C77 6 94 18 98 40C100 66 84 84 68 88L64 84C78 79 88 64 88 47C88 32 76 20 60 20C44 20 32 32 32 47C32 64 42 79 56 84Z",
      inside: "M56 84C42 79 32 64 32 47C32 32 44 20 60 20C76 20 88 32 88 47C88 64 78 79 64 84Z",
      back: "M52 88C36 84 20 66 22 40C26 18 43 6 60 6C77 6 94 18 98 40C100 66 84 84 68 88Q60 92 52 88Z",
      details: (c) => '<path d="M21 50L32 52M21 42L32 42M24 29L34 33M31 15L40 23M45 8L48 20M60 6V20M99 50L88 52M99 42L88 42M96 29L86 33M89 15L80 23M75 8L72 20" stroke="' + c + '" stroke-width="1.5" fill="none" stroke-linecap="round" opacity=".6"/>',
    },
    slouch: {
      band: "M52 87C38 83 25 65 27 42C30 24 43 13 53 11C58 6 67 5 73 10C85 14 92 26 93 42C95 65 82 83 68 87L64 83C77 78 87 63 87 46C87 34 77 23 62 22C45 22 33 33 33 46C33 63 43 78 56 83Z",
      inside: "M56 83C43 78 33 63 33 46C33 34 45 22 62 22C77 23 87 34 87 46C87 63 77 78 64 83Z",
      back: "M52 87C38 83 25 65 27 42C30 24 43 13 53 11C58 6 67 5 73 10C85 14 92 26 93 42C95 65 82 83 68 87Q60 91 52 87Z",
      details: (c) => '<path d="M62 8C66 12 72 16 78 18M29 48C30 63 38 78 52 85M91 48C90 63 82 78 68 85" stroke="' + c + '" stroke-width="1.3" fill="none" stroke-linecap="round" opacity=".6"/>',
    },
  };
  const DEFAULT_HOOD = "classic";

  // Where the scarf's top edge sits: around the neck, which spans y 62-80 (it is 13 tall, so it wraps the lower neck).
  const SCARF_Y = 70;

  // The figure's drawing area: 120 wide, 200 tall. The head is large (Mii-style proportions).
  // (it starts 14 above the head's old top edge, so tall hair such as spikes is never cut off)
  const FIGURE_WIDTH = 120;
  const FIGURE_HEIGHT = 214;
  const FIGURE_VIEWBOX = "0 -14 120 214";
  const HEAD_VIEWBOX = "16 -16 88 98";
  const HEAD_SCALE = 1.2; // head space (radius 24) -> figure space (radius ~29), centred at (60, 42)
  const HEAD_TRANSFORM = "translate(60 42) scale(" + HEAD_SCALE + ") translate(-60 -48)";

  // look = { character, category, outfitId, tag, alt, view: "full" | "head", decorative }
  function characterSvg(look) {
    const character = Traits.normalize(look.character || { id: "?" });
    const outfit = OUTFIT_LOOK[look.outfitId] || OUTFIT_LOOK["mild-2"];
    const { V, defs, shineFill, shadowFill, fadeFill, edgeFill } = volumes();
    const skin = Traits.skinColor(character);
    const skinDark = shade(skin, -0.12);
    const hoodUp = outfit.hood === "up";
    // A hood covers the hair completely, so none of it is drawn (nothing can poke through).
    const hair = hoodUp ? { back: "", front: "" } : hairLayers(Traits.hairOf(character), V);
    const wide = BODY_WIDTH[character.bodyType] + (look.tag === "loose" ? 12 : 0);
    const longPants = outfit.pants === "long";
    const gleam = (cx, cy, rx, ry, rot, opacity) =>
      '<ellipse cx="' + cx + '" cy="' + cy + '" rx="' + rx + '" ry="' + ry + '" fill="' + shineFill + '" stroke="none" opacity="' + (opacity || 1) + '"' + (rot ? ' transform="rotate(' + rot + " " + cx + " " + cy + ')"' : "") + "/>";

    // Geometry
    const shape = GENDER_SHAPE[character.genderPresentation];
    const baseW = 40 + wide;
    const torsoW = baseW + shape.shoulders; // shoulder width: the arms hang from here
    const torsoX = 60 - torsoW / 2;
    const torsoTop = 75;
    const torsoH = outfit.coat ? 72 : 52;
    const legW = 14 + wide / 3.5;
    const legXs = [60 - legW - 1.5, 61.5];
    const armW = 11 + Math.max(0, wide) / 8;
    const armXs = [torsoX - armW + 2.5, torsoX + torsoW - 2.5];
    const pantsEnd = outfit.pants === "short" ? 154 : outfit.socks ? 172 : 186;

    const body = [];
    // The back of the hood (its inside): behind everything else, so the small windows between the head,
    // the neck and the band show darker hood fabric instead of the scene behind the figure.
    if (hoodUp) {
      const backFill = outfit.hoodColor || outfit.top;
      const backShape = (HOODS[look.hoodStyle || outfit.hoodStyle] || HOODS[DEFAULT_HOOD]).back;
      body.push('<path data-hood="back" d="' + backShape + '" fill="' + V(shade(backFill, -0.38), "cyl") + '"/>');
    }

    // legs: skin first (shows below shorts and under socks), then the pants over the top
    legXs.forEach((x, i) => {
      body.push('<rect x="' + x + '" y="124" width="' + legW + '" height="64" rx="6" fill="' + V(skin, "cyl") + '"/>');
      body.push('<rect x="' + x + '" y="124" width="' + legW + '" height="' + (pantsEnd - 124) + '" rx="6" fill="' + V(outfit.bottom, "cyl") + '"/>');
      if (outfit.socks) body.push('<rect x="' + x + '" y="170" width="' + legW + '" height="16" rx="5" fill="' + V("#f4f1ea", "cyl") + '"/><path d="M' + x + " 175h" + legW + "M" + x + " 180h" + legW + '" stroke="' + shade(outfit.accent, -0.2) + '" stroke-width="1.6" fill="none"/>');
      if (outfit.cuffs && longPants) body.push('<rect x="' + x + '" y="' + (pantsEnd - 7) + '" width="' + legW + '" height="7" rx="3" fill="' + V(shade(outfit.bottom, -0.25), "cyl") + '"/>');
      if (outfit.stripe) body.push('<rect x="' + (i === 0 ? x + 1 : x + legW - 3.5) + '" y="126" width="2.6" height="' + (pantsEnd - 128) + '" fill="#ffffff" opacity=".9"/>');
      if (outfit.pockets) body.push('<rect x="' + (i === 0 ? x + 1.5 : x + legW - 8) + '" y="136" width="6.5" height="9" rx="1.5" fill="' + shade(outfit.bottom, -0.15) + '" stroke="' + shade(outfit.bottom, -0.4) + '" stroke-width="1"/>');
      if (!longPants) body.push('<rect x="' + x + '" y="' + (pantsEnd - 5) + '" width="' + legW + '" height="5" rx="2.5" fill="' + V(shade(outfit.bottom, -0.18), "cyl") + '"/>');
      // soft highlight down the lit side of each leg
      body.push(gleam(x + legW * 0.3, 140, legW * 0.14, 14, 0, 0.55));
    });
    // shadow where the legs meet, then the shoes: glossy sneakers with a white sole
    // (shadows on the body are clipped to the body's own shape, so none can float in empty air)
    const legsClip = nextId("legclip");
    defs.push('<clipPath id="' + legsClip + '">' + legXs.map((x) => '<rect x="' + x + '" y="124" width="' + legW + '" height="' + (pantsEnd - 124) + '" rx="6"/>').join("") + "</clipPath>");
    body.push('<g clip-path="url(#' + legsClip + ')" stroke="none"><rect data-shadow="body" x="48" y="124" width="24" height="16" fill="' + fadeFill + '"/></g>');
    legXs.forEach((x) => {
      body.push('<rect x="' + (x - 2) + '" y="183" width="' + (legW + 6) + '" height="12" rx="6" fill="' + V("#3b3b4a", "cyl") + '"/><rect x="' + (x - 2) + '" y="192" width="' + (legW + 6) + '" height="4" rx="2" fill="#f4f4f4"/>');
      body.push(gleam(x + 3.5, 186.5, 4, 2, -15, 0.9));
    });

    // arms: skin, sleeve over the top, a hand (sphere) at the end
    const sleeveEnd = { long: 119, short: 97, none: 0 }[outfit.sleeves];
    armXs.forEach((x) => {
      body.push('<rect x="' + x + '" y="78" width="' + armW + '" height="46" rx="' + armW / 2 + '" fill="' + V(skin, "cyl") + '"/>');
      if (sleeveEnd) {
        body.push('<rect x="' + x + '" y="78" width="' + armW + '" height="' + (sleeveEnd - 78) + '" rx="' + armW / 2.2 + '" fill="' + V(outfit.top, "cyl") + '"/>');
        if (outfit.sleeves === "long") body.push('<rect x="' + x + '" y="' + (sleeveEnd - 6) + '" width="' + armW + '" height="6" rx="3" fill="' + V(shade(outfit.top, -0.22), "cyl") + '"/>');
      }
      body.push(gleam(x + armW * 0.3, 92, armW * 0.14, 9, 0, 0.55));
      body.push('<circle cx="' + (x + armW / 2) + '" cy="125" r="' + (5.4 + armW / 14) + '" fill="' + V(skin, "sphere") + '"/>');
    });

    // torso
    const topH = outfit.crop ? 30 : torsoH;
    if (outfit.crop) body.push('<rect x="' + (torsoX + 2) + '" y="' + (torsoTop + 20) + '" width="' + (torsoW - 4) + '" height="34" rx="8" fill="' + V(skin, "cyl") + '"/>');
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
    body.push('<path d="' + torsoPath + '" fill="' + V(outfit.top, "cyl") + '"/>');
    // ribbed hem, quilting, a soft chest highlight and a waist crease, clipped to the torso shape
    body.push('<g clip-path="url(#' + clipId + ')" stroke="none">');
    if (outfit.rib) body.push('<rect x="0" y="' + (t1 - 6) + '" width="120" height="6" fill="' + shade(outfit.top, -0.22) + '"/>');
    if (outfit.coat === "puffer") {
      body.push('<path d="M0 ' + (t0 + 20) + "H120M0 " + (t0 + 40) + "H120M0 " + (t0 + 60) + 'H120" stroke="' + shade(outfit.top, -0.3) + '" stroke-width="1.6" fill="none"/>');
    }
    body.push(gleam(60 - torsoW * 0.22, t0 + topH * 0.34, torsoW * 0.14, topH * 0.3, 0, 0.75));
    body.push('<path data-shadow="body" d="M0 ' + (mid + 2) + "Q60 " + (mid + 6) + ' 120 ' + (mid + 2) + '" stroke="rgba(20,10,40,.16)" stroke-width="3" fill="none"/>');
    body.push("</g>");
    if (outfit.coat === "wool") {
      body.push('<path d="M60 ' + torsoTop + "L46 " + (torsoTop + 4) + "L55 " + (torsoTop + 32) + 'z" fill="' + V(shade(outfit.top, 0.14), "cyl") + '"/><path d="M60 ' + torsoTop + "L74 " + (torsoTop + 4) + "L65 " + (torsoTop + 32) + 'z" fill="' + V(shade(outfit.top, 0.14), "cyl") + '"/>');
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
      body.push('<rect x="' + (torsoX + 9) + '" y="' + torsoTop + '" width="' + (torsoW - 18) + '" height="15" rx="7" fill="' + V(skin, "cyl") + '"/>');
    } else if (outfit.crop) {
      body.push('<path d="M50 ' + torsoTop + "q10 11 20 0z" + '" fill="' + skin + '"/>');
    } else if (!outfit.coat && !outfit.zip && !outfit.hood && !outfit.scarf) {
      body.push('<path d="M51 ' + (torsoTop - 1) + "q9 11 18 0z" + '" fill="' + skinDark + '"/>');
    }
    // The scarf is wrapped around the neck (the neck spans y 62-80). Under a hood it is drawn after the hood,
    // so it sits over the two ends of the hood where they meet at the neck.
    const scarfY = SCARF_Y;
    const scarfSvg = outfit.scarf
      ? '<rect x="' + (torsoX - 2) + '" y="' + scarfY + '" width="' + (torsoW + 4) + '" height="13" rx="6" fill="' + V(outfit.accent, "cyl") + '"/><rect x="' + (torsoX + torsoW - 14) + '" y="' + (scarfY + 7) + '" width="9" height="22" rx="3.5" fill="' + V(shade(outfit.accent, -0.12), "cyl") + '"/>'
      : "";
    if (!hoodUp) body.push(scarfSvg);
    // hoodie drawstrings hang from under the hood onto the chest
    if (outfit.drawstrings) {
      body.push('<path d="M53 88q-3 10 -1 19M67 88q3 10 1 19" stroke="#f4f1ea" stroke-width="2" fill="none" stroke-linecap="round"/><circle cx="52" cy="108" r="2.3" fill="#f4f1ea"/><circle cx="68" cy="108" r="2.3" fill="#f4f1ea"/>');
    }
    // a short neck; the head's shadow falls only on the neck and chest, clipped to them
    body.push('<rect x="53" y="62" width="14" height="18" rx="5" fill="' + V(skin, "cyl") + '"/>');
    const neckClip = nextId("neckclip");
    defs.push('<clipPath id="' + neckClip + '"><rect x="53" y="62" width="14" height="18" rx="5"/><path d="' + torsoPath + '"/></clipPath>');
    body.push('<g clip-path="url(#' + neckClip + ')" stroke="none"><rect data-shadow="body" x="40" y="62" width="40" height="20" fill="' + fadeFill + '"/></g>');

    // head group: scaled-up head space; the head is a shaded sphere with a glossy highlight
    const head = [];
    head.push('<g stroke="#2a1f33" stroke-opacity=".5" stroke-width="1.1" stroke-linejoin="round">' + (hoodUp ? "" : earsSvg(character.ear, null, V, skin)) + '<circle cx="60" cy="48" r="24" fill="' + V(skin, "sphere") + '"/>' + "</g>");
    head.push(hair.front);
    if (hair.front) head.push('<path d="M40 33q10 -9 24 -8" stroke="#fff" stroke-opacity=".3" stroke-width="2.6" fill="none" stroke-linecap="round"/>');
    head.push(gleam(45, 36, 7, 4.5, -28, 0.5));
    const hairColor = Traits.hairOf(character).color;
    const facial = facialHairSvg(character.facialHair, hairColor, V, defs);
    head.push(facial.behind, facial.mustache);
    head.push(noseSvg(character.nose), eyesSvg(character.eyes), mouthSvg(character.mouth), expressionSvg(character.personality, skin));
    if (outfit.glasses) head.push('<rect x="42" y="43" width="36" height="10" rx="4.5" fill="#1d1d1d" opacity=".88"/><rect x="45" y="44.5" width="12" height="2.4" rx="1.2" fill="#fff" opacity=".35"/>');
    // accessories only when the outfit's name mentions them (the test keeps name and drawing in sync)
    if (outfit.cap) head.push('<g stroke="#2a1f33" stroke-opacity=".5" stroke-width="1.1" stroke-linejoin="round"><path d="M34 40a26 22 0 0 1 52 0z" fill="' + V(outfit.accent, "sphere") + '"/><rect x="58" y="36" width="40" height="7" rx="3.5" fill="' + V(shade(outfit.accent, -0.15), "vert") + '"/></g>' + gleam(50, 28, 8, 3.5, -20, 0.7));
    if (outfit.sunHat) head.push('<g stroke="#2a1f33" stroke-opacity=".5" stroke-width="1.1" stroke-linejoin="round"><ellipse cx="60" cy="31" rx="40" ry="7" fill="' + V(outfit.accent, "vert") + '"/><path d="M40 31a20 16 0 0 1 40 0z" fill="' + V(shade(outfit.accent, 0.15), "sphere") + '"/><rect x="40" y="26" width="40" height="5" fill="#c9553d"/></g>');
    if (outfit.beanie) head.push('<g stroke="#2a1f33" stroke-opacity=".5" stroke-width="1.1" stroke-linejoin="round"><path d="M35 38a25 24 0 0 1 50 0z" fill="' + V(outfit.accent, "sphere") + '"/><rect x="34" y="35" width="52" height="7" rx="3" fill="' + V(shade(outfit.accent, -0.2), "vert") + '"/><circle cx="60" cy="14" r="5" fill="' + V(shade(outfit.accent, 0.2), "sphere") + '"/></g>' + gleam(48, 26, 8, 4, -20, 0.6));
    // Hood up: the thin band over the head and down both sides of the face (see HOODS). It is drawn over
    // the head, so it overlaps the top of the head and the cheeks, and it leaves the chin and neck open.
    // It casts a soft shadow on the forehead, clipped to the area the face shows through.
    let hoodFrame = "";
    if (hoodUp) {
      const hoodFill = outfit.hoodColor || outfit.top;
      const style = HOODS[look.hoodStyle || outfit.hoodStyle] || HOODS[DEFAULT_HOOD];
      const insideClip = nextId("hoodinside");
      defs.push('<clipPath id="' + insideClip + '"><path d="' + style.inside + '"/></clipPath>');
      hoodFrame =
        '<g clip-path="url(#' + insideClip + ')" stroke="none"><rect data-shadow="body" x="28" y="14" width="64" height="30" fill="' + fadeFill + '"/></g>' +
        '<path data-hood="band" d="' + style.band + '" fill="' + V(hoodFill, "cyl") + '" stroke="#2a1f33" stroke-opacity=".5" stroke-width="1.2" stroke-linejoin="round"/>' +
        '<path d="' + style.inside + '" fill="none" stroke="' + shade(hoodFill, -0.4) + '" stroke-opacity=".35" stroke-width="2" stroke-linejoin="round"/>' +
        style.details(shade(hoodFill, -0.3)) +
        '<ellipse cx="42" cy="22" rx="8" ry="4" fill="' + shineFill + '" stroke="none" transform="rotate(-40 42 22)" opacity=".7"/>';
    }

    const outlined = "<g " + OUTLINE + ' stroke-width="1.3">' + body.join("") + "</g>";
    const parts =
      (look.view === "head" ? "" : '<ellipse data-shadow="ground" cx="60" cy="195" rx="38" ry="5" fill="' + shadowFill + '"/>') + // contact shadow on the ground
      '<g transform="' + HEAD_TRANSFORM + '">' + hair.back + "</g>" +
      outlined +
      '<g transform="' + HEAD_TRANSFORM + '">' + head.join("") + "</g>" +
      hoodFrame +
      (hoodUp && scarfSvg ? "<g " + OUTLINE + ' stroke-width="1.3">' + scarfSvg + "</g>" : "");

    // "head" frames just the head and hair (builder face tabs, gallery thumbnails); no fixed size:
    // CSS scales the figure to the room available, anchored to the ground.
    const viewBox = look.view === "head" ? HEAD_VIEWBOX : FIGURE_VIEWBOX;
    const aspect = look.view === "head" ? "xMidYMid meet" : "xMidYMax meet";
    const a11y = look.decorative ? 'aria-hidden="true"' : 'role="img" aria-label="' + look.alt + '"';
    return '<svg class="character-art" viewBox="' + viewBox + '" preserveAspectRatio="' + aspect + '" ' + a11y + "><defs>" + defs.join("") + "</defs>" + parts + "</svg>";
  }

  window.Art = {
    WEATHER_ICONS, REMINDER_ICONS, OUTFIT_LOOK, FIGURE_WIDTH, FIGURE_HEIGHT, FIGURE_VIEWBOX, HEAD_VIEWBOX, HOODS, SCARF_Y, FACIAL_SHAPES, HAIRLINE,
    weatherIcon, reminderIcon, skyArt, sceneSvg, characterSvg,
  };
})();
