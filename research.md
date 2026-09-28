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

## Weather and technical evidence

Record each useful source, what it supports, and important limitations. Research the weather variables, apparel guidance, reminders, accessibility, privacy, artwork, weather providers, and technical options needed for informed decisions.

## Decisions

Record the selected weather provider, forecast range, recommendation categories and rules, screen structure, visual direction, artwork approach (original, AI-generated, or appropriately licensed), deployment method, and one additional feature justified by the research. Briefly explain important trade-offs.

Once the recommendation categories are chosen, estimate the art needed: the character, three outfit variations per category, weather icons, and reminder icons. Use that estimate to choose the artwork approach.

## Revisions

Record new evidence or changed decisions and explain why they changed.

## Approval

The Developer reviews the sources and decisions, corrects this file, and explicitly approves it before specification begins.

## Saving the transcript

After the Developer approves the research, ask them to enter `save transcript`. When directed, save the complete conversation as `transcripts/research-YYYY-MM-DD_HHMMSS.md`, label chat messages `Developer` and `Agent`, and confirm the saved path.
