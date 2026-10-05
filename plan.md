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

- [ ] Research approved
- [ ] Specification approved
- [ ] Plan approved

### Build

- [ ] Scaffold the project (HTML/CSS/JS, no build step) and confirm GitHub Pages serves a blank page at the public URL
- [ ] Integrate Open-Meteo geocoding + forecast fetch (manual city entry and device geolocation); confirm real current + forecast data logs correctly for a test location
- [ ] Implement temperature-band mapping and reminder-threshold evaluation (`research.md` rules); confirm correct category and active reminders for known test values
- [ ] Implement the seeded random variation picker (keyed by location + date + character); confirm identical inputs always reproduce identical picks, and different inputs vary
- [ ] Implement `localStorage` persistence (most-recent location, saved characters, cached recommendation state per location+date+character); confirm state survives a page reload
- [ ] Build the main screen with placeholder art, wired to the recommendation state — one recommendation state must drive every visual and written output (character, icon, text, reminders) with nothing contradicting anything else
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

## Revisions

Record material plan changes and why they were made.

## Saving transcripts

At the end of planning, ask the Developer to enter `save transcript`. When directed, save the complete conversation as `transcripts/plan-YYYY-MM-DD_HHMMSS.md`, label chat messages `Developer` and `Agent`, and confirm the saved path.

At the end of every implementation chat, ask the Developer to enter `save transcript`. When directed, save the complete conversation as `transcripts/build-YYYY-MM-DD_HHMMSS.md` using the same formatting.
