// Seeded random variation: which outfit style and which reminder wording each character shows.
// Randomness is deterministic: the same (location, date, character) always resolves the same picks,
// so returning to a date shows the same variations (spec requirements 12-14).
// Outfit and every reminder are separate picks with their own seed stream, never a fixed bundle.

(function () {
  // Weight of a variation whose style tag matches one of the character's favored tags.
  // Unmatched variations weigh 1, so nothing ever has zero chance (approved 2026-10-12: 3:1).
  const FAVORED_WEIGHT = 3;

  // Personality only nudges the odds; it never selects an outfit. Each personality favors exactly one
  // clothing tag and no two personalities share one (approved 2026-10-12). Neutral favors nothing.
  //   sporty  = athletic gear, caps, joggers          covered = extra layers, hood up, scarf, sun hat
  //   dark    = all black/gray, plain, no color       loose   = baggy, slouchy, oversized
  // A category with 3 styles leaves one tag out; a personality whose tag is absent there gets even odds.
  const PERSONALITY_FAVORED_TAGS = {
    energetic: ["sporty"],
    anxious: ["covered"],
    grumpy: ["dark"],
    chill: ["loose"],
    neutral: [],
  };

  // 3 outfit styles per temperature category. The `id` is what gets cached and later maps to art
  // (category + id + body type + gender presentation); names are placeholders until the art exists.
  const OUTFIT_VARIATIONS = {
    // Left out per category (rotated so each tag is missing from at most 2 of the 7):
    // freezing: sporty | cold: loose | cool: covered | mild: dark | warm: sporty | hot: loose | extreme_heat: covered
    freezing: [
      { id: "freezing-1", tag: "covered", name: "Puffer with hood up and thick scarf" },
      { id: "freezing-2", tag: "dark", name: "Black wool coat and beanie" },
      { id: "freezing-3", tag: "loose", name: "Oversized parka and slouchy socks" },
    ],
    cold: [
      { id: "cold-1", tag: "sporty", name: "Track jacket over a hoodie, with joggers" },
      { id: "cold-2", tag: "covered", name: "Hoodie under a zipped coat and scarf" },
      { id: "cold-3", tag: "dark", name: "Black peacoat and gray jeans" },
    ],
    cool: [
      { id: "cool-1", tag: "sporty", name: "Windbreaker and leggings" },
      { id: "cool-2", tag: "dark", name: "Gray sweater and black jeans" },
      { id: "cool-3", tag: "loose", name: "Baggy sweatshirt and sweats" },
    ],
    mild: [
      { id: "mild-1", tag: "sporty", name: "Tee, joggers and ball cap" },
      { id: "mild-2", tag: "covered", name: "Zipped light jacket, long sleeves and jeans" },
      { id: "mild-3", tag: "loose", name: "Oversized tee and baggy jeans" },
    ],
    warm: [
      { id: "warm-1", tag: "covered", name: "Long-sleeve sun shirt and sun hat" },
      { id: "warm-2", tag: "dark", name: "Black tee and shorts" },
      { id: "warm-3", tag: "loose", name: "Loose tee and cargo shorts" },
    ],
    hot: [
      { id: "hot-1", tag: "sporty", name: "Breathable tee and running shorts" },
      { id: "hot-2", tag: "covered", name: "Light long sleeves, sun hat and sunglasses" },
      { id: "hot-3", tag: "dark", name: "Black tank and gray shorts" },
    ],
    extreme_heat: [
      { id: "extreme_heat-1", tag: "sporty", name: "Moisture-wicking tank and shorts" },
      { id: "extreme_heat-2", tag: "dark", name: "Dark tank and shorts" },
      { id: "extreme_heat-3", tag: "loose", name: "Loose linen top and shorts" },
    ],
  };

  // 3 wordings per reminder type, shown next to the condition text. Placeholder tone, open to edit.
  const REMINDER_WORDINGS = {
    sunscreen: [
      "The sun is strong today. Put on sunscreen before you head out.",
      "Don't skip the sunscreen, the UV is up.",
      "UV is high enough to burn. Sunscreen first!",
    ],
    umbrella: [
      "Rain is possible. Grab an umbrella.",
      "Better pack an umbrella today.",
      "Good chance of showers, so keep an umbrella in your bag.",
    ],
    hydration: [
      "It's hot out there. Drink extra water.",
      "Heat alert: keep a water bottle with you.",
      "Stay hydrated, the heat index is high.",
    ],
    cold_caution: [
      "The wind makes it feel colder. Bundle up.",
      "Wind chill is biting, so cover up.",
      "It feels a lot colder than it is. Layer up.",
    ],
  };

  // --- Seeded randomness -------------------------------------------------------------------
  // xmur3 turns any string into a 32-bit seed; mulberry32 turns a seed into a repeatable stream of
  // numbers in [0, 1). Both are small, well-known public-domain generators.
  function seedFromString(text) {
    let h = 1779033703 ^ text.length;
    for (let i = 0; i < text.length; i++) {
      h = Math.imul(h ^ text.charCodeAt(i), 3432918353);
      h = (h << 13) | (h >>> 19);
    }
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return (h ^ (h >>> 16)) >>> 0;
  }

  function randomFromSeedKey(seedKey) {
    let a = seedFromString(seedKey);
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  // Same place + date + character -> same key. Coordinates are rounded to 2 decimals (~1 km) so
  // device-location jitter between visits doesn't count as a new place.
  function seedKeyFor(location, date, characterId) {
    const where = location.latitude.toFixed(2) + "," + location.longitude.toFixed(2);
    return [where, date, characterId].join("|");
  }

  // --- Picks --------------------------------------------------------------------------------
  function weightedPick(options, weights, randomValue) {
    const total = weights.reduce((sum, w) => sum + w, 0);
    let remaining = randomValue * total;
    for (let i = 0; i < options.length; i++) {
      remaining -= weights[i];
      if (remaining < 0) return options[i];
    }
    return options[options.length - 1]; // guards against floating-point edge at the very top
  }

  function outfitWeights(category, personality) {
    const favored = PERSONALITY_FAVORED_TAGS[personality] || [];
    return OUTFIT_VARIATIONS[category].map((v) => (favored.includes(v.tag) ? FAVORED_WEIGHT : 1));
  }

  function pickOutfit(category, personality, seedKey) {
    const random = randomFromSeedKey(seedKey + "|outfit");
    return weightedPick(OUTFIT_VARIATIONS[category], outfitWeights(category, personality), random);
  }

  // Each reminder type has its own stream, so adding or removing another active reminder
  // (or changing the outfit) never changes this wording.
  function pickReminderWording(type, seedKey) {
    const wordings = REMINDER_WORDINGS[type];
    const random = randomFromSeedKey(seedKey + "|reminder:" + type);
    const index = Math.floor(random * wordings.length);
    return { id: type + "-" + (index + 1), text: wordings[index] };
  }

  // Rules result (Recommend.evaluate) + who/where/when -> the single recommendation state
  // that drives every visual and written output for one character (spec "Recommendation state").
  function resolve(evaluation, location, date, character) {
    const seedKey = seedKeyFor(location, date, character.id);
    return {
      outfitCategory: evaluation.outfitCategory,
      outfitVariation: pickOutfit(evaluation.outfitCategory, character.personality, seedKey).id,
      weatherConditionIcon: evaluation.weatherConditionIcon,
      activeReminders: evaluation.activeReminders.map((type) => ({
        type: type,
        wordingVariation: pickReminderWording(type, seedKey).id,
      })),
      isForecast: evaluation.isForecast,
    };
  }

  window.Variation = {
    OUTFIT_VARIATIONS,
    REMINDER_WORDINGS,
    PERSONALITY_FAVORED_TAGS,
    seedKeyFor,
    outfitWeights,
    pickOutfit,
    pickReminderWording,
    resolve,
  };
})();
