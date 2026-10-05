# Research

> EDITING DIRECTIVE: DEVELOPER AND AGENT EDIT THIS FILE COLLABORATIVELY. THE DEVELOPER MUST REVIEW AND APPROVE ITS CONTENT.

Purpose of this file: Research your context of use, references, weather guidance, technical options, and choices that will guide the specification.

## Instructions for the Developer

Judge sources and recommendations, make the consequential decisions, and keep this file current as the work develops.

To begin, open the project repository in a fresh chat and enter:

`Read ./research.md and help me begin Project 3 research.`

## Instructions for the Agent

Read `AGENTS.md`, `brief.md`, and this file. Ask one focused question at a time. Help investigate and compare options without deciding for the Developer. Verify sources directly and keep this file concise.

## Context of use

I'd use this app frequently and casually throughout the day: sometimes spontaneously (right before heading out) and sometimes looking ahead to plan for later or tomorrow. I'm primarily on my phone, so quick, one-handed checks matter most, though I'd also expect it to work fine on a laptop. I move between multiple locations (e.g., home and campus) regularly, so switching location easily is important — even though the app only needs to remember the most recent one.

## User story

> As a college student who moves between locations, I want to quickly check current or upcoming weather and get a clear outfit/reminder recommendation for wherever I am, so that I can decide what to wear and prepare (umbrella, sunscreen, etc.) without digging through a full weather app.

## References

Collect 5–10 reference images from relevant products and interfaces. Save each image in `reference/`, identify its source, and record a brief observation about what is useful, ineffective, or relevant to this project. Reference images are examples only; do not use them in the app.

- **weatherfit-01-main-screen.png** — Source: Weather Fit app (own screenshot). The character stands full-body in a scene matching the location (house/trees for Palo Alto), with weather stats (condition, temp, feels-like) stacked cleanly at top and simple icon-only nav (Locations/Weather/Settings) at bottom. Useful: outfit is legible at a glance because the character is large and centered; minimal chrome keeps focus on the character.
- **weatherfit-02-onboarding-steps.png** — Source: Weather Fit marketing/onboarding (own screenshot, 3-panel). Shows character-builder, wardrobe setup, and "see what to wear" result in sequence. Useful: demonstrates that outfit choices come from a constrained wardrobe grid (labeled categories like "Collarless," "Checked"), a simpler content model than free-form clothing — relevant to how we'd define outfit variation categories.
- **weatherfit-03-outfit-suggestions.png** — Source: Weather Fit marketing (own screenshot). Dark-themed concept screen showing temperature + character surrounded by tappable clothing-item chips ("Umbrella?", "Sunglasses?", "Heavy coat?"). Useful: shows reminders/suggestions as discrete labeled prompts rather than paragraph text — worth considering for our reminder wording, though it looks like a concept/marketing mockup rather than shipped in-app UI.
- **weatherfit-04-multi-location-landscapes.png** — Source: Weather Fit marketing (own screenshot). Highlights that each saved location gets a distinct background landscape (mountains, city, beach, suburb) and the sky shifts with time of day (night scene shown). Useful: reinforces that background/scene, not just the character, communicates conditions — though it's a bigger art lift than our scope needs (we only keep the most recent location).
- **weatherpet-01-forecast-detail.png** — Source: Weather Pet App Store listing (own screenshot). Shows hourly + 10-day forecast as stacked card panels over the current-conditions header. Concept worth taking: layering a detail view (hourly/multi-day) below the main character/hero view, rather than a separate screen, keeps context (location, current temp) visible while scrolling to more data.
- **weatherpet-02-companion-choice.png** — Source: Weather Pet App Store listing (own screenshot). Lets the user choose which companion appears. Concept worth taking (not the literal pet imagery): a Mii-maker-style base character — face, hair, skin tone — kept separate from the weather-driven outfit layer. Candidate for the brief's required additional feature, refined in discussion to: 1–5 user-built characters can be present at once, each assigned a user-chosen personality. Personality changes reaction (movement/expression) directly, and biases outfit *style* — for a given weather-appropriate category, several garment options can express the same weather fit differently (illustrative examples: sweats vs. ripped jeans vs. cargo pants, t-shirt vs. tank top, tight vs. loose fit, ball cap vs. cowboy hat vs. bucket hat vs. beanie; the full set of style variations per category is to be designed later, along these lines). Personality weights which style a character is more likely to draw, without the user or personality directly picking the outfit. Selection stays random per the brief's base requirement, just with a personality-weighted probability rather than a uniform one.
- **weatherpet-03-weather-reactive-scene.png** — Source: Weather Pet App Store listing (own screenshot). Background and companion visibly react to condition (rain overlay, wet posture). Concept worth taking: the *reactivity* — visual cues tied directly to live condition, not just an icon — reinforces our own outfit-changes-with-weather approach; we'd express this through illustrated character/outfit changes, not photographic imagery or live-action animals.

## Weather and technical evidence

Record each useful source, what it supports, and important limitations. Research the weather variables, apparel guidance, reminders, accessibility, privacy, artwork, weather providers, and technical options needed for informed decisions.

### Weather provider

Compared three options, given the app deploys as static files on GitHub Pages with no backend to hide a secret key:

- **Open-Meteo** ([open-meteo.com](https://open-meteo.com/)) — No API key, CORS-enabled for direct client-side use. Free for non-commercial use: 10,000 calls/day (600/min). Current, hourly, and up to 16-day forecast. Includes its own free geocoding endpoint, needed to turn a manually entered US city into coordinates. Data licensed CC BY 4.0 — requires attribution, which fits the brief's required credits/info screen.
- **National Weather Service** (api.weather.gov) — No API key; requires only a `User-Agent` header identifying the app/contact. Official US government source (strong credibility for citation), but only accepts coordinates, not city names, so a separate geocoding source would still be needed. Forecast extends about 7 days in day/night periods plus hourly.
- **OpenWeatherMap** — Requires an API key, which would be exposed in client-side JS on a static site (readable via view-source by anyone). Its current forecast product (One Call API 3.0) also requires a credit card on file for the free 1,000 calls/day tier, even though it isn't charged unless that limit is exceeded. No functional benefit over the keyless options for this project.

**Decision:** Open-Meteo. Keyless, one provider for both geocoding and weather, no billing setup, sufficient forecast range and data fields for the brief's requirements.

### Apparel guidance and reminder thresholds

Temperature bands for outfit recommendation categories, calibrated to the Developer's own sense of temperature rather than generic guide defaults:

| Range (°F) | Category | General outfit direction |
|---|---|---|
| Below 32 | Freezing | Heavy winter coat, insulated layers |
| 32–45 | Cold | Winter coat, layered clothing |
| 46–60 | Cool | Jacket or sweater |
| 61–74 | Mild | T-shirt + light jacket, jeans |
| 75–80 | Warm | T-shirt, light pants or shorts |
| 81–89 | Hot | Shorts, breathable fabrics, sunscreen |
| 90+ | Extreme heat | Minimal/breathable clothing, hydration emphasis |

Reminder triggers, drawn from official sources rather than generic guides:

- **Sunscreen**: EPA UV Index ≥ 3 ("Moderate" and up). Source: [EPA UV Index Scale](https://19january2021snapshot.epa.gov/sunsafety/uv-index-scale-0_.html).
- **Umbrella**: precipitation probability ≥ 40% (Open-Meteo provides this field directly).
- **Extra hydration / heat caution**: NWS Heat Index ≥ 90°F ("Hot" classification and up). Source: [NOAA Heat Index Chart](https://www.noaa.gov/sites/default/files/2022-05/heatindex_chart_rh.pdf).
- **Cold/wind chill caution**: NWS wind chill applies at or below 50°F with wind ≥ 3 mph; flag when wind chill drops meaningfully below the actual temperature. Source: [NWS Wind Chill Temperature Index](https://www.weather.gov/media/ajk/brochures/Wind_Chill_Temperature_Index.pdf).

### Accessibility

- **Touch targets**: WCAG 2.2 Level AA requires at least 24×24 CSS pixels for interactive elements (buttons, location/date pickers, etc.). Source: [WCAG 2.2, Success Criterion 2.5.8](https://www.w3.org/TR/WCAG22/).
- **Color contrast**: 4.5:1 minimum for normal text, 3:1 for large text, and 3:1 for non-text UI elements (icons, control boundaries) against their background. Same source.
- **One-handed phone use**: interactive controls should sit in the thumb-reachable lower two-thirds of the screen rather than top corners, consistent with the brief's one-handed-use requirement.
- **Beyond baseline WCAG, specific to this app**: provide alt text for weather icons and character/outfit state for screen readers; never signal a condition (e.g., rain, extreme heat) through color alone — pair with icon and text; respect `prefers-reduced-motion` if the character has any animation.

### Privacy

- **Geolocation API**: the browser handles the permission prompt automatically; best practice is to request location only when the user actively chooses "use my location," not on page load. Source: [MDN Geolocation API](https://developer.mozilla.org/en-US/docs/Web/API/Geolocation_API).
- **No background tracking**: fetch location once per explicit user action — never use `watchPosition()` for continuous tracking, since this app has no ongoing need for it.
- **Data minimization**: per the brief, only the most recent location is stored, and only on-device (e.g., `localStorage`) — not sent to or retained by any server, since weather/geocoding calls go directly from the browser to Open-Meteo.
- **Info screen disclosure**: state that location (device GPS or manually typed city) is used only to fetch weather for that spot, stored locally on the user's device, never transmitted to a third party beyond the Open-Meteo API call itself, and never used for tracking.

### Artwork approach

Compared three production approaches given the modular (base body + swappable layers) character design and the art volume required:

- **Original hand-drawn**: full creative control, no licensing to track, but highest time cost — estimated 40+ individual pieces (see estimate below) is a lot alongside building and testing the app solo in two weeks.
- **Licensed asset pack**: e.g., Cozy People Asset Pack (itch.io) offers 5 skin tones, 10 hairstyles × 14 colors, and modular 32×32 clothing layers built for exactly this kind of mix-and-match character. Fast and consistent, but wouldn't match a Mii-inspired style without re-skinning, and the specific outfit variations per temperature category would still need separate sourcing.
- **AI-generated**: tools with character-consistency features (e.g., Midjourney's Omni Reference, Ideogram) can hold a character's identity across generations from one reference image, but produce whole finished images rather than separable transparent layers.

**Decision:** AI-generated. Body type (fat/skinny/average) and gender presentation (feminine/masculine qualities) are combined with each weather-driven outfit variation into one fully flattened character render per combination, rather than built from swappable transparent layers — simpler for the AI tool to produce reliably, generated one image at a time, incrementally during the build rather than in one upfront batch. Personality (energetic, anxious, grumpy, chill, neutral) is the one piece that stays a separate lightweight overlay — a swapped face/expression crop applied over whichever flattened render is showing — since personality, along with location/date, is the main input the user directly controls; body type, gender presentation, and the specific outfit variation drawn for a given weather condition are left to the app's randomization, not chosen by the user.

Visual style: heavily inspired by Nintendo Mii / Wii-era avatars (simplified, rounded features, minimal facial detail, stylized proportions) — described to the AI tool by these traits rather than by naming the trademarked "Mii" product, and credited on the info screen as stylistic inspiration (not an official license), with explicit context that this project is a non-commercial class assignment not distributed beyond it.

**Art estimate**, based on the categories and features decided so far:

| Asset | Count |
|---|---|
| Flattened body+outfit renders (3 body types × 2 gender presentations × 21 outfit variations) | 126 |
| Personality face/expression overlay crops (energetic, anxious, grumpy, chill, neutral) | 5 |
| Weather condition icons (clear, partly cloudy, cloudy, rain, thunderstorm, snow, windy/fog) | ~7 |
| Reminder icons (umbrella, sunscreen, hydration, cold caution) | 4 |

Total: roughly 142 individual art pieces, generated incrementally over the build rather than all at once.

### Deployment method

**Decision:** GitHub Pages, as recommended by the brief. The project already has a dedicated GitHub repository ([inkinvader/weather](https://github.com/inkinvader/weather)); GitHub Pages serves static files directly from it over HTTPS at no cost, with no separate hosting account or server needed — a good fit since the app is entirely client-side (Open-Meteo calls go straight from the browser).

## Decisions

Record the selected weather provider, forecast range, recommendation categories and rules, screen structure, visual direction, artwork approach (original, AI-generated, or appropriately licensed), deployment method, and one additional feature justified by the research. Briefly explain important trade-offs.

Once the recommendation categories are chosen, estimate the art needed: the character, three outfit variations per category, weather icons, and reminder icons. Use that estimate to choose the artwork approach.

- **Weather provider:** Open-Meteo — keyless, CORS-enabled, one provider for both geocoding and weather data. See "Weather provider" above.
- **Forecast range:** Today plus up to 14 days ahead (Open-Meteo supports up to 16; capped at 14 as a reasonable two-week planning window).
- **Recommendation categories and rules:** Seven temperature bands (Freezing <32°F, Cold 32–45°F, Cool 46–60°F, Mild 61–74°F, Warm 75–80°F, Hot 81–89°F, Extreme heat 90°F+), each with 3+ outfit style variations. Reminders trigger independently: sunscreen (UV Index ≥3), umbrella (precipitation probability ≥40%), hydration/heat caution (NWS Heat Index ≥90°F), cold/wind-chill caution (wind chill applicable ≤50°F with wind ≥3mph). See "Apparel guidance and reminder thresholds" above.
- **Screen structure:** Main screen (character, weather summary, location/date controls, recommendation, reminders), location/date selection, character builder (appearance + personality, 1–5 characters), information screen (source/credits/privacy/methodology). Detailed layout to be defined via hand-drawn designs in `spec.md`.
- **Visual direction:** AI-generated, heavily inspired by Nintendo Mii / Wii-era avatars (simplified, rounded features, minimal facial detail, stylized proportions), described to the AI tool by trait rather than by naming the trademarked product. See "Artwork approach" above.
- **Artwork approach:** AI-generated flattened body+outfit renders (body type × gender presentation × outfit variation), with personality as a separate lightweight face/expression overlay. ~142 pieces total, generated incrementally. See "Artwork approach" above.
- **Deployment method:** GitHub Pages, serving directly from the project's existing repository.
- **Additional feature (brief requirement):** Multiple characters (1–5) on screen at once, each user-built (appearance: body type, gender presentation, face/hair/skin tone) and assigned a user-chosen personality (energetic, anxious, grumpy, chill, neutral). Personality drives each character's reaction (movement/expression) and lightly weights which random outfit style it's more likely to draw, without the user or personality directly picking the outfit — keeping the brief's required random, independent outfit selection intact. Justified by reference research into companion/mascot apps (see Weather Pet references above) adapted away from literal pet imagery toward user-built, personality-driven characters.

## Revisions

Record new evidence or changed decisions and explain why they changed.

## Approval

The Developer reviews the sources and decisions, corrects this file, and explicitly approves it before specification begins.

**Approved by the Developer on 2026-10-05.**

## Saving the transcript

After the Developer approves the research, ask them to enter `save transcript`. When directed, save the complete conversation as `transcripts/research-YYYY-MM-DD_HHMMSS.md`, label chat messages `Developer` and `Agent`, and confirm the saved path.
