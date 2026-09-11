---
name: jikida-ux-design
description: Design UI that feels considered, not sloppy — apply proven UX laws (Hick's, Fitts's, Jakob's, Miller's, the aesthetic-usability effect) and clear UI writing to what an AI editor just generated. Activates on "design this screen", "improve this UI", "this looks off", "make it usable", "review my UX", "reduce clutter", "why is this confusing", "button placement", "form design", "empty state", "onboarding", "information hierarchy", "accessibility", UX laws by name (Hick, Fitts, Jakob, Miller, Tesler, Postel, aesthetic-usability), and when a user wants generated/vibe-coded UI turned into something that reads as intentional. Complements the jikida-clean-code and security skills.
---

# Jikida — UX for what you just built

AI-generated UIs work but feel generic: everything the same weight, no hierarchy, twelve buttons where three would do, forms that ask for everything at once, empty states that are just blank. This skill applies the UX laws that make an interface feel *designed* — grounded in how people actually perceive and decide.

## The one rule: reduce the choices, sharpen the hierarchy

Most "bad UX" is too many equally-weighted things on screen. Before styling anything, ask: **what is the one job of this screen, and what is the one action?** Make that obvious; make everything else quieter. A screen that does one thing well beats a screen that offers everything.

## The UX laws — and what each one tells you to DO

Apply these as design tests, not decoration.

- **Hick's Law** — decision time grows with the number and complexity of choices. → Cut options. Collapse a 12-item menu into groups. Show the primary action; tuck the rest behind "More." Progressive disclosure over a wall of controls.
- **Fitts's Law** — a target is easier to hit the bigger and closer it is. → Make primary buttons large and put them where the hand/eye already is. Don't make people travel to a tiny "Confirm." Destructive actions get distance from the happy path.
- **Jakob's Law** — users expect your site to work like the other sites they know. → Don't reinvent the checkout, the nav, the date picker, the login. Familiar patterns are faster because users already learned them elsewhere. Innovate on your value, not on your form controls.
- **Miller's Law** — people hold ~7 (±2) items in working memory. → Chunk. Group phone digits, break long forms into steps, limit a nav to a handful of top items. Don't ask someone to remember a value from three screens ago.
- **Aesthetic-Usability Effect** — people perceive good-looking design as more usable and forgive its minor flaws. → Polish is not vanity; consistent spacing, type hierarchy, and a considered palette *earn trust* and reduce reported friction. But it never excuses a real usability bug.
- **Law of Proximity** — things placed close together are perceived as related. → Group by whitespace, not just borders. A label belongs next to its field; unrelated controls get air between them.
- **Law of Common Region** — elements in a shared boundary are seen as a group. → Use a card/panel to bind related content — but don't box everything, or the boundaries become noise.
- **Von Restorff (Isolation) Effect** — the item that differs is the one remembered. → Give the primary action ONE distinct treatment (colour/size). If everything is emphasized, nothing is. One accent, used sparingly.
- **Peak-End Rule** — people judge an experience by its most intense moment and its end. → Invest in the peak (the "it worked!" moment) and the end (a clean success state, a helpful confirmation) — not just the average screen.
- **Tesler's Law (Conservation of Complexity)** — every system has irreducible complexity; the question is who absorbs it. → Absorb it for the user. Smart defaults, auto-detection, and pre-filled values move complexity from them to the system. Don't expose a setting the app can decide itself.
- **Postel's Law (Robustness)** — be liberal in what you accept, conservative in what you emit. → Accept the phone number with or without dashes; accept the URL with or without `https://`. Forgive input format; be precise in output.
- **Doherty Threshold** — interaction feels fluid under ~400 ms of response. → Give instant feedback: optimistic UI, a spinner within 100 ms, a skeleton while loading. Never leave an action looking dead.
- **Law of Prägnanz** — people read the simplest form of a complex image. → Prefer clean, simple layouts; the eye resolves them faster and with less effort.

## The anti-slop signals (what AI-generated UI ships)

- **No hierarchy** — every heading, button, and card the same size/weight, so the eye has nowhere to land.
- **Button soup** — five buttons in a row, all the same colour, no primary.
- **Everything-at-once forms** — 14 fields on one screen instead of a short first step.
- **Dead empty states** — a blank table with no "here's how to add your first X."
- **Centered everything** — every block centered by default; no intentional alignment.
- **Rounded-lg + one gradient on white** — the generic AI look. Make a real choice about palette and type instead.
- **No feedback** — a button that gives no sign it was clicked; a save with no confirmation.
- **Inconsistent spacing** — 13px here, 20px there; no scale.

## UI writing — clear, ASD-STE100 style

Words are design. Write UI copy in the spirit of **ASD-STE100 (Simplified Technical English)**:
- One idea per sentence. Active voice. Present tense.
- A control says exactly what it does — a button labelled **"Publish"**, and a toast that says **"Published."**
- Errors explain what went wrong and how to fix it — no apology, no vagueness, no blame. "That email is already registered — sign in instead?" not "An error occurred."
- Name things the way the user thinks of them, not how the system is built — a person manages *notifications*, not "webhook config."
- Cut hedge words ("simply", "just", "please"), marketing fluff, and synonyms-for-flavour. Specific beats clever.

## Accessibility is UX, not an add-on

- Every interactive element is reachable and operable by keyboard, with a visible focus state.
- Colour is never the only signal (pair it with an icon, label, or shape).
- Contrast meets WCAG AA (4.5:1 for text). Test both light and dark if you ship both.
- Respect `prefers-reduced-motion`; give images meaningful `alt` (or empty `alt` if decorative).
- Real semantic elements (`<button>`, `<nav>`, `<label>`) over `<div onclick>`.

## The review loop

1. **Name the screen's one job and one action.** If you can't, the design isn't ready.
2. **Apply the laws as tests** — too many choices (Hick)? primary action easy to hit (Fitts)? familiar patterns (Jakob)? chunked (Miller)? one thing emphasized (Von Restorff)?
3. **Fix hierarchy first** (size, weight, spacing), then reduce choices, then polish.
4. **Rewrite the copy** to ASD-STE100 clarity.
5. **Check keyboard + contrast + reduced-motion.**

## What this skill is NOT

Not a visual-brand generator and not a security or code-quality pass. Pair it with **jikida-clean-code** (maintainable implementation) and the **jikida security skill** (no vulnerabilities/leaks). A beautiful, usable UI can still ship a secret in the bundle — run a Jikida scan before you ship.
