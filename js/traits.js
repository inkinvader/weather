// Character traits: the options the builder offers for each trait, the defaults, and helpers to
// keep saved characters complete. Tab order is general -> specific, as in spec requirement 10.
// Exposes window.Traits.

(function () {
  const SKIN_TONES = [
    { id: "fair", label: "Fair", color: "#fde0c8" },
    { id: "light", label: "Light", color: "#f0c6a2" },
    { id: "medium", label: "Medium", color: "#d9a47a" },
    { id: "tan", label: "Tan", color: "#b9794d" },
    { id: "brown", label: "Brown", color: "#8d5524" },
    { id: "deep", label: "Deep", color: "#5b3a24" },
  ];

  // Hair is style + colour in one choice; the label names both so colour is never the only cue.
  const HAIR = [
    { id: "short-brown", label: "Short brown", style: "short", color: "#5b3a29" },
    { id: "long-black", label: "Long black", style: "long", color: "#1f1a1a" },
    { id: "curly-auburn", label: "Curly auburn", style: "curly", color: "#8a3b1f" },
    { id: "spiky-blond", label: "Spiky blond", style: "spiky", color: "#e0b84a" },
    { id: "bun-red", label: "Red bun", style: "bun", color: "#b5382a" },
    { id: "ponytail-dark", label: "Dark ponytail", style: "ponytail", color: "#3a2a22" },
    { id: "wavy-gray", label: "Gray waves", style: "wavy", color: "#9aa1a9" },
    { id: "bald", label: "Bald", style: "bald", color: "#000000" },
  ];

  const plain = (...pairs) => pairs.map(([id, label]) => ({ id: id, label: label }));

  // `tab` is the short label on the tab strip; `view` is how the preview is framed for that trait.
  const TRAITS = [
    { key: "bodyType", tab: "Body", label: "Body type", view: "full", options: plain(["skinny", "Skinny"], ["average", "Average"], ["fat", "Fat"]) },
    { key: "genderPresentation", tab: "Gender", label: "Gender presentation", view: "full", options: plain(["feminine", "Feminine"], ["masculine", "Masculine"]) },
    { key: "skinTone", tab: "Skin", label: "Skin tone", view: "full", options: SKIN_TONES },
    { key: "hair", tab: "Hair", label: "Hair", view: "head", options: HAIR },
    { key: "eyes", tab: "Eyes", label: "Eyes", view: "head", options: plain(["round", "Round"], ["wide", "Wide"], ["narrow", "Narrow"], ["happy", "Happy"], ["large", "Large"], ["sparkle", "Sparkle"]) },
    { key: "nose", tab: "Nose", label: "Nose", view: "head", options: plain(["dot", "Dot"], ["line", "Line"], ["button", "Button"], ["pointed", "Pointed"], ["wide", "Wide"]) },
    { key: "mouth", tab: "Mouth", label: "Mouth", view: "head", options: plain(["smile", "Smile"], ["grin", "Grin"], ["flat", "Flat"], ["small", "Small"], ["smirk", "Smirk"], ["lips", "Lips"]) },
    { key: "ear", tab: "Ear", label: "Ear", view: "head", options: plain(["round", "Round"], ["pointed", "Pointed"], ["big", "Big"], ["small", "Small"]) },
    { key: "personality", tab: "Personality", label: "Personality", view: "head", options: plain(["energetic", "Energetic"], ["anxious", "Anxious"], ["grumpy", "Grumpy"], ["chill", "Chill"], ["neutral", "Neutral"]) },
  ];

  const DEFAULTS = {
    bodyType: "average",
    genderPresentation: "feminine",
    skinTone: "light",
    hair: "short-brown",
    eyes: "round",
    nose: "dot",
    mouth: "smile",
    ear: "round",
    personality: "neutral",
  };

  const traitByKey = (key) => TRAITS.find((t) => t.key === key);
  const optionOf = (key, id) => traitByKey(key).options.find((o) => o.id === id) || null;

  function defaultCharacter(id) {
    return Object.assign({ id: id }, DEFAULTS);
  }

  // Fills any missing or unrecognised trait with its default, so older saves and hand-edited
  // data can never produce a half-drawn character.
  function normalize(character) {
    const result = { id: character.id };
    TRAITS.forEach((trait) => {
      result[trait.key] = optionOf(trait.key, character[trait.key]) ? character[trait.key] : DEFAULTS[trait.key];
    });
    return result;
  }

  // "char-1", "char-2", ... : the next number above the highest one in use, so an id is never reused
  // (variation picks are seeded by id).
  function nextCharacterId(characters) {
    const numbers = characters.map((c) => Number(String(c.id).replace("char-", ""))).filter((n) => Number.isFinite(n));
    return "char-" + (numbers.length ? Math.max(...numbers) + 1 : 1);
  }

  const skinColor = (character) => optionOf("skinTone", character.skinTone).color;
  const hairOf = (character) => optionOf("hair", character.hair);

  window.Traits = { TRAITS, DEFAULTS, SKIN_TONES, HAIR, traitByKey, optionOf, defaultCharacter, normalize, nextCharacterId, skinColor, hairOf };
})();
