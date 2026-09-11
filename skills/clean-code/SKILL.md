---
name: jikida-clean-code
description: Ship maintainable, non-sloppy code — refactor, simplify, and apply good engineering practice to what an AI editor just generated. Activates on "refactor this", "clean up this code", "review my code", "is this good practice", "simplify", "reduce duplication", "this feels messy", "make this maintainable", "remove dead code", "improve naming", "split this function", "code smell", SOLID, DRY, KISS, YAGNI, and when a user wants generated/vibe-coded code turned into code they'd be proud to ship. Complements the jikida security skill (which handles vulnerabilities); this handles quality. Run a Jikida repo scan for secrets/vulns separately.
---

# Jikida — clean code for what you just built

AI editors generate code that *works* but often ships slop: duplicated blocks, dead branches, god-functions, vague names, no error handling, comments that restate the code. This skill turns that into code a senior engineer would approve — **without over-engineering it the other way.**

## The one rule that beats all others

**Match the surrounding code.** Before refactoring, read the neighbouring files. Adopt their naming, their structure, their error style, their level of abstraction. Consistency is worth more than any single "best practice." A clever pattern that doesn't match the codebase is itself slop.

## Decide first: does this even need changing?

Not all code needs a refactor. Skip it when the code is small, correct, and already reads clearly. **The bar for a refactor is: it measurably reduces future cost** — less duplication, fewer places to change, clearer intent. If you can't name the concrete win, leave it alone. Over-refactoring is slop too.

## The refactor checklist — in priority order

Work top-down; stop when the remaining items don't apply.

1. **Correctness first.** A refactor must not change behaviour. If you find a bug while cleaning, fix it in a *separate* step and say so — never smuggle a behaviour change into a "cleanup."
2. **Names.** A good name removes the need for a comment. `isRegisteredForDiscounts`, not `flag`. `daysUntilExpiry`, not `d`. Rename before anything else — it makes every later step easier.
3. **Duplication (DRY, with judgement).** Three or more copies of the same logic → extract one. But **two similar-looking blocks that will diverge are NOT duplication** — forcing them together (premature abstraction) is worse than the repeat. Extract shared *meaning*, not shared *shape*.
4. **Function size & single responsibility.** A function doing five things at four abstraction levels is the #1 AI-slop pattern. Split it so each function does one thing and its name says what. Aim for a function that fits on a screen.
5. **Dead code & speculative generality.** Delete unused functions, params, imports, and `if (false)` branches. Delete "flexible" abstractions with exactly one caller (YAGNI). The best code is the code that isn't there.
6. **Error handling.** Generated code often ignores the failure path. Handle it explicitly: validate inputs at the boundary, fail loudly in dev, degrade gracefully in prod. An empty `catch {}` is a bug.
7. **Comments.** Delete comments that restate the code (`// increment i`). Keep comments that explain *why* — a non-obvious constraint, a workaround, a deliberate trade-off. If the code needs a comment to be understood, first try to make the code clearer.
8. **Nesting & early returns.** Flatten arrow-code with guard clauses: return/throw on the invalid cases first, so the happy path is unindented and linear.

## The anti-slop signals (what AI-generated code ships)

Scan for these — they're the tells:

- **Restating comments** — a comment on every line, each just narrating the next statement.
- **Copy-paste-with-a-tweak** — the same 20 lines three times with one variable changed.
- **The mega-function** — `handleSubmit` that validates, transforms, calls the API, updates the DOM, logs, and shows a toast.
- **Boolean-parameter soup** — `render(true, false, true)`. Split the function or pass an options object.
- **Magic values** — `if (status === 3)`. Name it: `if (status === Status.Shipped)`.
- **Catch-and-ignore** — `try { … } catch (e) {}` swallowing errors silently.
- **Inconsistent everything** — camelCase here, snake_case there; `getX` and `fetchY` and `loadZ` for the same idea.
- **Unused scaffolding** — imports, props, helpers, and config left over from an approach that changed.
- **Over-abstraction** — a factory + strategy + interface for a thing with one implementation.

## The good-practice baseline (framework-agnostic)

- **One source of truth.** No value defined in two places that can drift. Derive, don't duplicate.
- **Explicit over implicit.** Prefer clear types/return values and named things over cleverness the next reader must decode.
- **Boundaries validate.** Trust nothing from the network, the user, or the filesystem until it's checked at the edge.
- **Pure where you can.** Push side effects (I/O, DOM, network) to the edges; keep the core logic pure and testable.
- **Small, reviewable diffs.** A refactor should be a series of behaviour-preserving steps, each explainable in one sentence.
- **Leave it tested.** If you touched logic with no test and one is cheap to add, add it. Don't delete tests to make a change "pass."

## English & UI copy: ASD-STE100

For any text a human reads — UI strings, error messages, docs, commit messages — write in the spirit of **ASD-STE100 (Simplified Technical English)**: one idea per sentence, active voice, present tense, a controlled vocabulary, no synonyms-for-flavour. "Enter your email." not "Kindly proceed to input your electronic mail address." An error says what went wrong and how to fix it, with no apology and no vagueness. (For UI layout and interaction, use the `jikida-ux-design` skill.)

## Refactor, safely — the loop

1. **Read** the file and its neighbours; state the concrete win in one line. If you can't, stop.
2. **Rename** for clarity (behaviour-preserving).
3. **Extract / split / delete** per the checklist, one small step at a time.
4. **Re-run the tests** (or add one for the touched logic). Behaviour must be identical.
5. **Diff-review your own change** — is every line justified? Did you avoid adding new slop (over-abstraction, needless config)?

## What this skill is NOT

- Not a security review — for vulnerabilities, secrets, and exposed keys use the **jikida security skill** + a repo scan (`npx @jikida/scan ./` or MCP `scan_repo`). Clean code can still be insecure; secure code can still be slop. Run both.
- Not a rewrite mandate — the goal is the *smallest* change that makes the code clearly better. Wholesale rewrites lose working behaviour and reviewer trust.

## Ship checklist

Before it ships, the code should pass all of: reads top-to-bottom without a decoder ring · no duplicated logic that can drift · every function does one nameable thing · the failure path is handled · no dead code or leftover scaffolding · names make comments unnecessary · it matches the codebase around it · **and it passed a Jikida security scan.**
