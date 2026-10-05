# Technical Specification

> EDITING DIRECTIVE: DEVELOPER AND AGENT EDIT THIS FILE COLLABORATIVELY. THE DEVELOPER MUST REVIEW AND APPROVE ITS CONTENT.

Purpose of this file: Turn the approved research, project brief, and hand-drawn screen designs into testable requirements.

## Instructions for the Developer

Make and approve the product decisions, draw every proposed screen, provide the drawings to the Agent, and keep this file current as the intended result changes.

To begin, open the project repository in a fresh chat and enter:

`Read ./spec.md and help me begin the Project 3 specification.`

## Instructions for the Agent

Read `AGENTS.md`, `brief.md`, `research.md`, and this file. Review the screen drawings the Developer provides. Ask one focused question at a time, surface gaps and trade-offs without inventing requirements, and keep the specification concise and testable.

## Goal

Help a college student who moves between locations quickly check current or upcoming weather for wherever they are, and get a clear, character-based outfit recommendation plus relevant reminders (umbrella, sunscreen, hydration, cold caution), so they can decide what to wear and prepare without digging through a full weather app. Defined by the user story in `research.md`.

## Screen designs

Hand-drawn phone and laptop layouts for every screen, saved in `reference/`:

- **Main screen** — [sketch-main-screen.jpg](reference/sketch-main-screen.jpg). One or more characters (side by side when multiple) stand in a scene matching location/time of day. Date and location buttons sit at the top (phone: inline with weather text; laptop: as separate control bars at the bottom), each opening an inline picker (calendar for date, within the 14-day forecast range; search/current-location for location) rather than navigating to a separate screen. Weather condition and temperature display near the top, with a "Forecast" badge shown whenever the selected date isn't today. Conditional reminder text/icon appears next to the condition text only when a threshold is triggered (not a permanent fixture). Bottom (phone) / left sidebar (laptop) navigation: Home, Character, Settings.
- **Character builder** — [sketch-character-builder.jpg](reference/sketch-character-builder.jpg). Snapchat/Bitmoji-style builder. A gallery grid (top-left) switches between saved characters (1–5). The character preview is central/large. Scrollable trait tabs, ordered general → specific: Body type, Gender presentation, Skin tone, Hair, Eyes, Nose, Mouth, Ear, Personality — each tab shows a grid of selectable options. Laptop layout: Home/Character/Settings nav on the left (matching other screens), trait tabs and option grid on the right, character preview in the center.
- **Settings** — [sketch-settings.jpg](reference/sketch-settings.jpg). List layout (Profile/Account-style items are placeholders for the real item set, still to be finalized — e.g., units, saved location, reset character data, privacy, About). The "About" item holds the brief's required info-screen content: creator, weather-data source, recommendation methodology, privacy practices, and art/style credits. Same Home/Character/Settings nav as other screens.
- **Error / Loading** — [sketch-error-loading.jpg](reference/sketch-error-loading.jpg). Shared centered layout across four states: Loading (spinner + "Loading"); Missing data (X icon + "Missing data, try again in a moment."); Service error (X icon + "Error. Reload the page."); Denied location permission (X icon + "Denied location permission." + a back button to the previous screen).

## Requirements

Translate every fixed brief requirement and the selected research-driven feature into a testable requirement. Define the chosen behavior, content, controls, current and forecast data, responsive layout, accessibility, error handling, privacy, credits, and deployment. The main screen should make clear the location, date, units, data source, and whether conditions are current or forecast. Include an acceptance check for each requirement.

### Weather data

1. **Current and forecast data from one provider.** The app fetches current and forecast weather from Open-Meteo for the selected location and date.
   *Check:* for any valid US location, current conditions and a 14-day-out forecast both return real values from Open-Meteo, visible on the main screen.
2. **Forecast range.** The date picker allows today through 14 days ahead; dates outside that range cannot be selected.
   *Check:* the calendar control opening from the date button only allows selecting today through day+14; no control exists to pick further out.
3. **Units.** Temperature displays in Fahrenheit with the °F symbol shown (assumption: no Celsius toggle, since the brief scopes the app to US locations — flag if you want a toggle instead).
   *Check:* every displayed temperature includes "°F".

### Location

4. **Manual entry and device location.** The location control accepts either a typed US city (geocoded via Open-Meteo) or the device's geolocation.
   *Check:* typing a valid US city updates the main screen to that location's weather; tapping "use my location" (with permission granted) does the same using device coordinates.
5. **Most-recent-location persistence.** Only the most recently selected location is saved on-device (`localStorage`); it is not sent to or retained by any server beyond the Open-Meteo API call itself.
   *Check:* after selecting a new location and reloading the page, the main screen loads that same location without re-prompting; no prior locations are retained anywhere.

### Main screen and character

6. **Character(s) as the focus.** The main screen displays 1–5 user-built characters (per the character builder), arranged side by side in the scene.
   *Check:* the number of characters shown matches the number of active/selected characters, up to 5, displayed side by side.
7. **Single recommendation state drives all output.** For a given location + date + character, one recommendation state (derived from live weather values and the rules in `research.md`) determines that character's outfit, the weather icon, the written recommendation, and any reminders — no part of the display can contradict another.
   *Check:* for a fixed location/date/character, outfit, icon, written text, and reminders are all internally consistent with the same temperature band and condition (see "Recommendation state and data flow" below).
8. **Current vs. forecast indicator.** A "Forecast" badge appears next to the date whenever the selected date is not today; it's absent when viewing today.
   *Check:* selecting any future date shows the badge; selecting today hides it.
9. **Conditional reminders.** Reminder text/icon (umbrella, sunscreen, hydration, cold caution) appears next to the condition text only when that reminder's threshold (defined in `research.md`) is met for the selected location/date — not shown otherwise.
   *Check:* a location/date combination below any reminder threshold shows no reminder text; one above a threshold shows the corresponding reminder.

### Character builder

10. **Trait customization.** The character builder lets the user set, per saved character: body type (fat/skinny/average), gender presentation, skin tone, hair, eyes, nose, mouth, ear, and personality (energetic/anxious/grumpy/chill/neutral) — scrollable tabs, ordered general → specific as listed.
    *Check:* each trait tab is reachable by scrolling, and a selection in each tab visibly changes the character preview (except personality, which changes reaction behavior rather than appearance).
11. **Character gallery.** A gallery view lets the user switch between, add, or remove saved characters (up to 5).
    *Check:* the gallery shows all saved characters; selecting one makes it active; the limit of 5 is enforced (the add control is disabled or hidden at 5).

### Content variation

12. **Outfit variation.** Each of the 7 temperature categories (see `research.md`) has 3+ outfit style variations, selected independently at random per character, weighted (not determined) by that character's personality.
    *Check:* repeated visits to the same weather category with a fresh random seed show different outfit styles across characters/visits; a character's personality visibly skews its style distribution over many draws without ever being user-selectable.
13. **Reminder wording variation.** Each reminder type has 3+ wording variations, chosen independently at random.
    *Check:* triggering the same reminder across multiple dates shows varied wording, not identical text each time.
14. **Persistence of variation.** For a given (location, date, character) combination, the same outfit and reminder wording variations are shown on return visits, including after a page reload, until that combination's weather data changes.
    *Check:* selecting the same past-selected date/location/character again — including after reloading the page — shows the same outfit and reminder wording as before.

### Information screen

15. **About content.** The Settings → About screen states the creator, Open-Meteo as the weather/geocoding data source (with CC BY 4.0 attribution), the recommendation methodology (temperature bands and reminder thresholds, with sources), privacy practices (per `research.md`), and art/style credits (AI-generated, Wii/Mii-era-inspired, non-commercial class assignment).
    *Check:* each of the five required topics (creator, data source, methodology, privacy, art credits) is present and readable on the About screen.

### Error handling

16. **Loading state.** While fetching weather/location data, a spinner displays with "Loading" text.
    *Check:* on a slow/throttled connection, the loading state appears before data arrives.
17. **Missing data / service error / denied permission states.** Each shows an X icon with its specific message ("Missing data, try again in a moment." / "Error. Reload the page." / "Denied location permission.") and a back button returning to the previous screen.
    *Check:* simulating each condition (e.g., blocking the API, denying the geolocation permission prompt) shows the correct message and a working back button.

### Responsive layout and accessibility

18. **Responsive layout.** Phone layout keeps primary controls reachable one-handed (lower two-thirds of the screen); laptop layout uses the wider viewport distinctly (e.g., side navigation, side-by-side panels) rather than a stretched phone layout.
    *Check:* on a phone-width viewport, all primary controls fall within comfortable one-handed thumb reach; on a laptop-width viewport, the layout visibly differs from a simple scaled-up phone layout.
19. **Accessibility baseline.** Interactive elements meet WCAG 2.2 AA: ≥24×24 CSS px touch targets, 4.5:1 text contrast (3:1 for large text/icons); weather icons and character/outfit state have alt text; conditions are never signaled by color alone; animations respect `prefers-reduced-motion`.
    *Check:* an automated accessibility scan (e.g., axe) reports no violations of these criteria on each screen.

### Deployment

20. **Public HTTPS deployment.** The app is deployed via GitHub Pages at a public HTTPS URL, matching the approved specification.
    *Check:* the deployed URL loads over HTTPS and matches the behavior verified locally.

## Recommendation state and data flow

Define the weather inputs, recommendation categories, coded rules, and shared state. Weather values must come from the provider, and rules must follow the weather guidance cited in `research.md`. The selected location, date, and live weather data must produce one recommendation state that drives every visual and written output.

**Weather inputs** (from Open-Meteo, per selected location + date): temperature, precipitation probability, UV index, heat index (or computed from temperature + humidity if not provided directly), wind chill (or computed from temperature + wind speed), wind speed, weather condition code (clear/cloudy/rain/snow/etc.).

**Data flow**, per active character:

1. Resolve location (manual entry or device geolocation) → coordinates, via Open-Meteo geocoding.
2. Fetch weather for coordinates + selected date (today or up to 14 days out) from Open-Meteo.
3. Map temperature to one of the 7 categories (`research.md` bands) → **outfit category**.
4. Evaluate each reminder's threshold independently against the fetched values → zero or more **active reminders**.
5. Derive a seed from (location, date, character ID) so the same combination always resolves the same random picks (see Content variation).
6. Using that seed: pick one outfit style variation from the outfit category's 3+ options, weighted by the character's personality; pick one wording variation per active reminder.
7. Combine into one **recommendation state** per character: `{ outfitCategory, outfitVariation, weatherConditionIcon, activeReminders: [{type, wordingVariation}], isForecast }`.
8. Render: character's outfit (from `outfitVariation`), weather icon (from `weatherConditionIcon`), written recommendation text, and reminder text/icons — all read from this one state object, so nothing on screen can contradict anything else.

Each character on screen has its own recommendation state (steps 3–8 run once per active character, sharing the same fetched weather from steps 1–2).

## Content variation

Define at least three outfit variations for each recommendation category and at least three wording variations for each reminder type. Define how outfit and reminder variations are chosen independently at random, and how a previously selected date keeps the same variations, including whether they persist after the page reloads.

- **Outfit variations:** 3+ per temperature category (7 categories), per `research.md`'s art estimate. Selection is independent per category — the variation chosen for "Cool" has no bearing on what would be chosen for "Mild."
- **Reminder wording variations:** 3+ per reminder type (sunscreen, umbrella, hydration, cold caution). Selection is independent per reminder type and independent of the outfit variation.
- **Independence:** outfit and each active reminder are drawn as separate random picks — not as a fixed bundle — so, e.g., two characters with the same outfit style can still show different reminder wording.
- **Randomness source:** a seed derived from `(location, date, characterId)` (see data flow) feeds a deterministic pseudo-random function, so the same inputs always reproduce the same picks instead of true fresh randomness on every render.
- **Persistence:** the recommendation state (including the specific outfit/reminder variations chosen) is cached in `localStorage`, keyed by `(location, date, characterId)`. On revisiting that exact combination — including after a full page reload — the cached state is reused rather than re-rolled, as long as the underlying weather data for that date hasn't changed (e.g., a forecast updating closer to the date invalidates the cache for that entry).

## Assets

List every art and graphical asset: the character, each outfit variation, icons, and any other visuals. For each, note where it appears, its format, and whether it will be created, generated, or licensed, with its credit or license.

| Asset | Appears on | Format | Source | Count |
|---|---|---|---|---|
| Flattened body+outfit renders (3 body types × 2 gender presentations × 21 outfit variations) | Main screen (character display) | Transparent PNG | AI-generated, Wii/Mii-inspired style, generated incrementally during build | 126 |
| Personality face/expression overlay crops (energetic, anxious, grumpy, chill, neutral) | Main screen (composited over body+outfit render) | Transparent PNG | AI-generated, same style/reference | 5 |
| Character builder trait thumbnails (body type, gender presentation, skin tone, hair, eyes, nose, mouth, ear options) | Character builder | Transparent PNG | AI-generated, same style/reference; reuses/derives from the body+outfit renders where applicable | Scales with option count per trait (finalized during build) |
| Weather condition icons (clear, partly cloudy, cloudy, rain, thunderstorm, snow, windy/fog) | Main screen (near condition text) | SVG or PNG | AI-generated or simple original vector icons, Wii/Mii-inspired style | ~7 |
| Reminder icons (umbrella, sunscreen, hydration, cold caution) | Main screen (next to active reminder text) | SVG or PNG | AI-generated or simple original vector icons, same style | 4 |
| Location background scenery (city/suburb/etc., varies with location or kept generic) | Main screen (behind character) | PNG or SVG | AI-generated or simple original illustration | 1+ (scope decided during build) |
| Loading spinner / error "X" icon | Error/Loading screen | SVG | Original (simple vector) or a standard open-source icon set | 2 |

All AI-generated assets credited on the Settings → About screen as "AI-generated, Wii/Mii-era-inspired style" — stylistic inspiration only, not an official license, per `research.md`'s Artwork approach decision. Open-Meteo data attribution (CC BY 4.0) also appears there.

## Out of scope

Record features intentionally excluded from this project.

## Revisions

After implementation or testing, record requirement changes and the evidence that prompted them. Update the screen drawings when a material layout or interaction changes.

## Approval

The Developer reviews and explicitly approves this specification and its screen designs before planning begins.

## Saving the transcript

After the Developer approves the specification, ask them to enter `save transcript`. When directed, save the complete conversation as `transcripts/spec-YYYY-MM-DD_HHMMSS.md`, label chat messages `Developer` and `Agent`, and confirm the saved path.
