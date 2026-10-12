# Implementation Plan

> EDITING DIRECTIVE: DEVELOPER AND AGENT EDIT THIS FILE COLLABORATIVELY. THE DEVELOPER MUST REVIEW AND APPROVE ITS CONTENT.

Purpose of this file: Turn the approved specification into an ordered, trackable build and verification plan.

## Instructions for the Developer

Set priorities, review the checklist, verify results rather than relying only on the Agent's report, and keep the project documents current as the work changes. Expect the build to take many rounds of testing and fixing; record material changes under Revisions.

To begin planning, open the project repository in a fresh chat and enter:

`Read ./plan.md and help me create the Project 3 implementation plan.`

After approving the plan, open the project repository in a fresh chat and enter:

`Read ./plan.md and help me implement the approved Project 3 plan in working checkpoints.`

## Instructions for the Agent

Read `AGENTS.md`, `brief.md`, `research.md`, `spec.md`, and this file, then inspect the relevant project files. Propose concrete tasks and checks without expanding the approved scope.

During implementation, follow the approved plan in working checkpoints and keep it current. Never mark approvals or items requiring Developer verification complete on the Developer's behalf.

## Approach

**Structure:** Plain HTML/CSS/JS, no build step or framework (assumption — flag if you'd rather use a framework), deployed as static files via GitHub Pages. No backend; all state lives in the browser (`localStorage`).

**Data flow:** Location (manual entry or device geolocation) → Open-Meteo geocoding → coordinates → Open-Meteo forecast fetch → per-character recommendation state (temperature category, outfit variation, active reminders, icon) → rendered to the main screen. See `spec.md`'s "Recommendation state and data flow" for the full chain.

**Dependencies:** Open-Meteo API (geocoding + forecast endpoints, both keyless); an AI image-generation tool for character/outfit/icon art; no other external services.

**Task order, and why:** Build the data/logic layer (weather fetch, recommendation rules, randomized-but-seeded variation picker) before investing in art, using placeholder shapes/colors — this lets every logic requirement (categories, thresholds, persistence) be verified correctly before the ~140-piece art set exists, so a logic bug doesn't surface only after art is already built around it. Art production (the largest single time cost) proceeds incrementally alongside UI work rather than all upfront, swapping into already-working placeholder slots. Responsive/accessibility work and cross-device testing come after the core screens exist, since they're easier to verify against something real. Usability testing and the resulting revision happen last, after deployment, since the brief requires testing the deployed app.

**Main risks:** (1) ~140 individual AI-generated art pieces is a lot of production/review work for a solo two-week build — mitigated by generating incrementally and starting early; (2) AI-generated pieces need consistent proportions/style to line up visually — mitigated by locking a reference prompt/style guide before bulk generation; (3) geolocation permission behavior varies by browser — needs testing on the actual deployed HTTPS URL, not just localhost, since some browsers restrict geolocation on non-HTTPS/local origins; (4) time budget is tight once usability testing and a revision round are included — build checkpoints should stay small and testable rather than batching work.

## Checklist

### Approvals

- [x] Research approved
- [x] Specification approved
- [x] Plan approved

### Build

- [x] Scaffold the project (HTML/CSS/JS, no build step) and confirm GitHub Pages serves a blank page at the public URL (https://inkinvader.github.io/weather/, verified 200 over HTTPS)
- [x] Integrate Open-Meteo geocoding + forecast fetch (manual city entry and device geolocation); confirm real current + forecast data logs correctly for a test location (`js/weather.js`; 17 checks in `test/weather-test.html` pass against the live API for Austin, TX. Real browser permission prompt on a phone still to verify at the deployed-app test.)
- [x] Implement temperature-band mapping and reminder-threshold evaluation (`research.md` rules); confirm correct category and active reminders for known test values (`js/recommend.js`; 68 checks in `test/recommend-test.html` pass: every band edge, heat index and wind chill vs NWS chart values, each threshold just below/at trigger, icons)
- [x] Implement the seeded random variation picker (keyed by location + date + character); confirm identical inputs always reproduce identical picks, and different inputs vary (`js/variation.js`; 29 checks in `test/variation-test.html` pass: repeatable x500, variety across dates/places/characters, personality skew over 6,000 draws, outfit and reminders independent)
- [x] Implement `localStorage` persistence (most-recent location, saved characters, cached recommendation state per location+date+character); confirm state survives a page reload (`js/store.js`; 27 checks in `test/store-test.html` pass, including a real reload of a fresh page, switching location leaving nothing of the old place in storage, and blocked/corrupt storage)
- [x] Build the main screen with placeholder art, wired to the recommendation state — one recommendation state must drive every visual and written output (character, icon, text, reminders) with nothing contradicting anything else (`js/app.js`, `js/art.js`, `css/style.css`, `index.html`; 56 checks in `test/main-test.html` pass at 390px phone width, plus a live-data check with `test/live-demo.html`. Phone layout only; the laptop layout is the responsive-pass item.)
- [ ] Build the date picker (14-day range calendar) and location picker (manual entry + device location) controls; confirm selecting a date/location updates the main screen and the Forecast badge correctly
- [ ] Build the character builder (scrollable trait tabs, gallery of up to 5 characters) with placeholder thumbnails, using the approved screen drawings for layout
- [ ] Build the Settings screen, including the About section with all five required info topics
- [ ] Build the four Error/Loading states, using the approved screen drawings
- [ ] Lock an AI art style/reference prompt and validate one sample render before bulk generation
- [ ] Generate and integrate art assets incrementally, replacing placeholders — prioritize weather icons, reminder icons, and the most common temperature categories first
- [ ] Apply the responsive layout pass (one-handed phone reachability; laptop layout distinct from a scaled-up phone layout)
- [ ] Apply the accessibility pass (touch targets, contrast, alt text, reduced motion) and confirm with an automated scan
- [ ] Test and fix each checkpoint above against the specification before starting the next
- [ ] Commit meaningful working checkpoints throughout
- [ ] Deploy to a public HTTPS URL (GitHub Pages)

### Verify and revise

- [ ] Check every specification requirement
- [ ] Test multiple locations, current and forecast dates, recommendation categories, outfit and reminder variations, and failure states
- [ ] Verify that eligible outfit and reminder variations are selected independently rather than as fixed pairs
- [ ] Verify that returning to a previously selected date shows the same variations
- [ ] Test the deployed app, independently of the local version, on a real phone and a laptop, including both screens, accessibility, and one-handed controls
- [ ] Prepare the usability test below
- [ ] Test with three peers and record each session
- [ ] Add the chosen improvement to this checklist, and update `spec.md` if the intended result changes
- [ ] Implement, verify, and redeploy at least one meaningful revision

### Deliver

- [ ] Confirm all brief deliverables, sources, privacy information, and asset credits
- [ ] Save all chat transcripts
- [ ] Complete the debrief

## Usability testing

Before testing, record the purpose, a few realistic tasks, non-leading prompts, and a consistent note format. For each session, use a non-identifying label and record the task, what the tester did or said, successes, barriers or questions, and possible changes. Keep observations separate from interpretations. After all three sessions, summarize the strongest findings and the improvement they support.

**Purpose:** Confirm that a new user can check today's and an upcoming day's weather, understand the character's outfit recommendation and any reminders, and build/customize a character — without guidance — on their own phone.

**Tasks** (given to each tester, phone first, then laptop if time allows):
1. "Open the app and find out what the weather is like right now, wherever you are."
2. "Check what it'll be like this weekend." (tests date picker + Forecast badge)
3. "Build a character that looks and acts like you." (tests character builder, personality)
4. "Find out where the weather data comes from and how your location is handled." (tests About/privacy)

**Prompts:** Keep non-leading — e.g., "What do you expect to happen if you tap that?" rather than "Tap the date button." Let the tester narrate out loud; only intervene if fully stuck for 30+ seconds.

**Note format** (one row per tester per task): Tester label (e.g., P1/P2/P3) · Task · What they did/said · Succeeded? · Barrier or question raised · Possible change (kept separate from the raw observation).

After all three sessions: summarize the strongest recurring finding and the one improvement it justifies, then add it to the Build checklist above and implement/verify/redeploy it.

## Revisions

Record material plan changes and why they were made.

- **2026-10-12, checkpoint 2:** Two data-handling decisions made while building the fetch layer, pending Developer review. (1) For future days the "temperature" fed to the recommendation is the forecast daily high (today uses the live current reading); the low is kept but unused. (2) Humidity for future days is the daily mean, so heat index for those days is computed from the high temperature with mean humidity, which tends to understate it. Also: device location is labelled "Current location" because Open-Meteo has no reverse geocoder. If any of these should change what the spec says, update `spec.md`.

- **2026-10-12, checkpoint 3:** Rule decisions where `research.md` was silent, pending Developer review. (1) Temperatures are rounded to whole degrees before banding, because the bands leave gaps for decimals (45.5 is between Cold and Cool); 45.5 rounds to Cool. (2) "Wind chill drops meaningfully below the actual temperature" is not defined by the NWS source; implemented as wind chill at least 5 F lower than the actual temperature (e.g. 40 F needs about 8 mph). Constant `WIND_CHILL_MIN_DROP_F` in `js/recommend.js`. (3) The windy/fog icon is chosen from fog weather codes only; no wind-speed rule exists in the spec. (4) Heat index uses the NWS equation with NOAA's published adjustments, checked against chart values (90 F/50% = 95, 90 F/70% = 106, 100 F/50% = 118).

- **2026-10-12, checkpoint 4:** Personality weighting approved by the Developer after revision. First proposal (two shared tags per personality, e.g. relaxed for grumpy) was rejected by the Developer as mismatched and overlapping. Final scheme: four clothing tags (sporty, covered, dark, loose); each personality favors exactly one and none share (energetic: sporty, anxious: covered, grumpy: dark, chill: loose, neutral: none). A favored style gets weight 3 vs 1, so it is about 60% likely; each category has 3 styles and leaves one tag out (rotated), where that personality gets even odds. Nothing ever drops to zero. Additional choices, pending review: (1) outfit and each reminder use separate seed streams, so adding a reminder never changes the outfit or another reminder's wording; (2) the seed uses coordinates rounded to 2 decimals (about 1 km) so small device-location jitter doesn't re-roll a day; (3) outfit style names and the 12 reminder wordings are placeholder content for the Developer to edit once the art direction is set.

- **2026-10-12, checkpoint 5:** Persistence decisions, pending Developer review. (1) The recommendation cache is stored as a single bucket tied to the current location, so switching location drops the old place's entries; this enforces spec requirement 5 ("no prior locations are retained anywhere") structurally. (2) A cached state is treated as stale when the rule outcome (category, icon, active reminders, forecast flag) or the character's personality changes; raw readings are ignored so today's live temperature drifting does not discard a still-correct state. (3) Because picks are already deterministic from the seed, the cache mainly keeps previously seen dates stable if the style tables or weights are edited later. (4) First run creates one default neutral character so the main screen always has someone to show. (5) If localStorage is blocked, the app falls back to memory for that visit instead of failing. (6) The object is `AppStore`, not `Storage`, which is a built-in browser name.

- **2026-10-12, checkpoint 6:** Main screen built from `reference/sketch-main-screen.jpg` (phone layout). Decisions and additions, pending Developer review. (1) **Conflict to resolve:** the sketch puts the Date and Location buttons in the top corners, which are the hardest spots to reach one-handed, while spec requirement 18 asks for primary controls in the lower two-thirds. Built as sketched; resolve in the responsive pass (e.g. pickers open as bottom sheets, or the buttons move down). (2) Added to the sketch because the spec requires them: a written outfit caption under each character, and an Open-Meteo credit line (data source) on the main screen. (3) Forecast days show "High 28°F" so it is clear the number is the daily high. (4) With several characters, the reminders next to the condition text use the first character's wording; the weather decides which reminders show, the seed decides phrasing. Open question: should each character show its own reminder wording? (5) Date, Location, Character and Settings controls are present but disabled until their checkpoints, so the deployed page is not usable (it shows "Choose a location") until the location picker exists. (6) Placeholder figures are drawn per outfit id and a test keeps each drawing in sync with its written name (sleeves, pants, coat, hats, scarf, sunglasses), after the first pass showed a sun hat and sleeves that contradicted captions. (7) Headless Edge cannot render narrower than about 500 px, so phone-width checks use fixed 390 px frames in the test page.

## Saving transcripts

At the end of planning, ask the Developer to enter `save transcript`. When directed, save the complete conversation as `transcripts/plan-YYYY-MM-DD_HHMMSS.md`, label chat messages `Developer` and `Agent`, and confirm the saved path.

At the end of every implementation chat, ask the Developer to enter `save transcript`. When directed, save the complete conversation as `transcripts/build-YYYY-MM-DD_HHMMSS.md` using the same formatting.
