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

## Recommendation state and data flow

Define the weather inputs, recommendation categories, coded rules, and shared state. Weather values must come from the provider, and rules must follow the weather guidance cited in `research.md`. The selected location, date, and live weather data must produce one recommendation state that drives every visual and written output.

## Content variation

Define at least three outfit variations for each recommendation category and at least three wording variations for each reminder type. Define how outfit and reminder variations are chosen independently at random, and how a previously selected date keeps the same variations, including whether they persist after the page reloads.

## Assets

List every art and graphical asset: the character, each outfit variation, icons, and any other visuals. For each, note where it appears, its format, and whether it will be created, generated, or licensed, with its credit or license.

## Out of scope

Record features intentionally excluded from this project.

## Revisions

After implementation or testing, record requirement changes and the evidence that prompted them. Update the screen drawings when a material layout or interaction changes.

## Approval

The Developer reviews and explicitly approves this specification and its screen designs before planning begins.

## Saving the transcript

After the Developer approves the specification, ask them to enter `save transcript`. When directed, save the complete conversation as `transcripts/spec-YYYY-MM-DD_HHMMSS.md`, label chat messages `Developer` and `Agent`, and confirm the saved path.
