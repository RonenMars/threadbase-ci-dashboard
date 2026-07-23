---
name: Threadbase CI Dashboard
description: A dark, IDE-adjacent deploy console for threadbase-mobile — thread-blue accents, live-amber for the "now".
colors:
  ink-1: "#070b11"
  ink-2: "#0b1220"
  ink-3: "#0f1a2c"
  ink-4: "#152238"
  ink-5: "#1a2d47"
  ink-6: "#243a59"
  fg-0: "#f4f7fb"
  fg-2: "#9fb0c8"
  fg-3: "#6c809b"
  blue-300: "#7fb6ff"
  blue-400: "#63b3ff"
  amber-400: "#f08a24"
  success-400: "#4ade80"
  danger-400: "#ff6b6b"
typography:
  display:
    fontFamily: "Inter, -apple-system, BlinkMacSystemFont, sans-serif"
    fontSize: "36px"
    fontWeight: 600
    lineHeight: "44px"
    letterSpacing: "-0.02em"
  title:
    fontFamily: "Inter, sans-serif"
    fontSize: "24px"
    fontWeight: 600
    lineHeight: "32px"
    letterSpacing: "-0.01em"
  body:
    fontFamily: "Inter, sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: "20px"
    letterSpacing: "normal"
  eyebrow:
    fontFamily: "Inter, sans-serif"
    fontSize: "12px"
    fontWeight: 600
    lineHeight: "16px"
    letterSpacing: "0.08em"
  mono:
    fontFamily: "JetBrains Mono, SF Mono, Menlo, monospace"
    fontSize: "13px"
    fontWeight: 500
    lineHeight: "18px"
    letterSpacing: "normal"
rounded:
  sm: "6px"
  md: "8px"
  lg: "12px"
  xl: "16px"
  pill: "999px"
spacing:
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
components:
  button-primary:
    backgroundColor: "{colors.blue-400}"
    textColor: "{colors.ink-1}"
    rounded: "{rounded.md}"
    padding: "0 14px"
    height: "36px"
  button-primary-hover:
    backgroundColor: "{colors.blue-300}"
  button-live:
    backgroundColor: "{colors.amber-400}"
    textColor: "#2a1a04"
    rounded: "{rounded.md}"
  button-secondary:
    backgroundColor: "{colors.ink-3}"
    textColor: "{colors.fg-0}"
    rounded: "{rounded.md}"
  input-field:
    backgroundColor: "{colors.ink-2}"
    textColor: "{colors.fg-0}"
    rounded: "{rounded.md}"
    height: "40px"
    padding: "0 12px"
  card:
    backgroundColor: "{colors.ink-2}"
    textColor: "{colors.fg-0}"
    rounded: "{rounded.lg}"
    padding: "16px"
  pill-status:
    rounded: "{rounded.pill}"
    padding: "5px 10px"
---

# Design System: Threadbase CI Dashboard

## 1. Overview

**Creative North Star: "The Terminal Next Door"**

Threadbase CI lives next to the developer's terminal and code editor, and it dresses for that company. The surface is a near-black midnight ground (`#070b11`) carrying a faint 32px grid — the same grid stamped into the product's app icon — so the console reads as an instrument panel, not a marketing page. Two brand signals do the emotional work: a cyan thread-blue (`#63b3ff`) for anything the operator commands, and a warm live-amber (`#f08a24`) reserved for the single idea of *now* — an in-flight deploy, an active build. Everything else recedes into a disciplined ink scale.

This is a **product** register: the design serves the task, it is not the product. Density is high but never cramped; the operator scans a table of deploys, picks a ref, fires a workflow, and watches it go. Color is spent, not sprayed — a screen is mostly ink, with blue and amber earning their pixels. The system explicitly rejects the SaaS-marketing dialect: no cream-and-navy gradients, no glassmorphic hero cards, no drop-shadowed pastel dashboards, no rounded-everything friendliness. It should feel closer to a well-lit CI log than to a landing page.

**Key Characteristics:**
- Dark-first, IDE-adjacent: midnight ink surfaces under a faint blueprint grid.
- Two-signal color economy: thread-blue for control, live-amber for "now".
- Inter for UI, JetBrains Mono for identifiers (branches, run numbers, tokens).
- Status is a pill with a dot, never a bare word.
- Restraint over decoration: flat surfaces, hairline borders, glow only where it means something.

## 2. Colors

A near-black ink scale anchors everything; two saturated brand hues (blue, amber) and three status hues carry all the meaning.

### Primary
- **Thread Blue** (`#63b3ff`): The control color — primary buttons, active nav, links, focus rings, the "running" status. Pulled directly from the icon's thread motif. Its hover step is **Thread Blue Light** (`#7fb6ff`).

### Secondary
- **Live Amber** (`#f08a24`): Reserved for *now* — an in-progress deploy's status pill and any "resume / go live" action. Carries an optional glow (`0 0 22px rgba(240,138,36,0.30)`). Rare by rule; its scarcity is what makes "live" legible at a glance.

### Neutral
- **Ink 1 — Canvas** (`#070b11`): The app background, under the grid.
- **Ink 2 — Surface** (`#0b1220`): Cards, tables, elevated panels.
- **Ink 3 — Raised** (`#0f1a2c`): Secondary buttons, field-adjacent chips, hover fills.
- **Ink 4 — Toolbar** (`#152238`): The sticky top header (at 80% + backdrop blur).
- **Ink 5 — Hairline** (`#1a2d47`): Borders and dividers.
- **Foreground 0** (`#f4f7fb`): Primary text.
- **Foreground 2** (`#9fb0c8`): Secondary text, metadata, muted labels.
- **Foreground 3** (`#6c809b`): Tertiary text, timestamps, placeholders.

### Status
- **Success** (`#4ade80`): Completed deploys.
- **Danger** (`#ff6b6b`): Failed deploys, errors, destructive actions.
- **Live Amber** (`#f08a24`) doubles as the "running/live" signal.

### Named Rules
**The Two-Signal Rule.** Only two hues ever carry brand meaning: blue for control, amber for now. If a third accent shows up "for variety," it's wrong — reach for the ink scale or a status hue instead.

**The Amber-Is-Now Rule.** Amber means exactly one thing: something is happening right now. Never use it decoratively, never for a resting state. A screen with two amber elements should have two live things.

## 3. Typography

**Display / UI Font:** Inter (with `-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`)
**Mono Font:** JetBrains Mono (with `"SF Mono", Menlo, Consolas, monospace`)

**Character:** One humanist sans for all prose and chrome, one crisp monospace for every machine identifier. The contrast axis is sans-vs-mono, never two similar sans families. Mono is not decorative here — it marks the things a machine owns: branch names, tags, run numbers, tokens.

### Hierarchy
- **Display** (600, 36px / 44px, `-0.02em`): Page titles ("Deploy history").
- **Title** (600, 24px / 32px, `-0.01em`): Section headings, card titles.
- **Body** (400, 14px / 20px): Default UI text; cap prose at 65–75ch.
- **Eyebrow** (600, 12px, `0.08em`, uppercase): The one deliberate small-caps label — a page's register word ("DEPLOY", "HISTORY") above its title, and table column headers. Used as a system, not sprinkled per section.
- **Mono** (500, 13px / 18px): Branch/tag chips, run numbers (`#74`), tokens, code.

### Named Rules
**The Mono-For-Machines Rule.** Anything a machine produced or owns — a branch, a tag, a run number, a token count — is set in JetBrains Mono. Anything a human reads as prose is Inter. The font *is* the type signal.

## 4. Elevation

Flat by default. Depth comes from the ink scale (tonal layering) first, hairline borders second, and shadow only on genuinely floating surfaces. There is no drop-shadow-on-everything; a resting card is `ink-2` with a `1px ink-5` border and nothing more.

### Shadow Vocabulary
- **Card** (`box-shadow: 0 4px 12px rgba(0,0,0,0.45)`): The history table and other elevated panels against the canvas.
- **Overlay** (`box-shadow: 0 14px 40px rgba(0,0,0,0.55)`): The sign-in card and any modal-level surface.
- **Amber Glow** (`box-shadow: 0 0 0 1px rgba(240,138,36,0.35), 0 0 22px rgba(240,138,36,0.30)`): The one expressive shadow — attaches only to a live/amber action to make "now" glow.

### Named Rules
**The Flat-Rest Rule.** Surfaces are flat at rest, separated by tone and hairline. A shadow is a response — to floating above the canvas, or to being live — never ambient polish.

## 5. Components

### Buttons
- **Shape:** 8px radius (`rounded.md`), 36px tall default; 44px for a mobile touch target, 28px compact.
- **Primary:** Thread-blue fill, ink-1 text — the operator's main action ("Run Workflow"). Hover lightens to `#7fb6ff`.
- **Live:** Amber fill, dark-brown text (`#2a1a04`), amber glow. Only for "go live / resume now" actions.
- **Secondary:** Ink-3 fill, foreground-0 text, ink-6 border. Neutral actions (Export).
- **Ghost:** Transparent, thread-blue text. Low-emphasis (Cancel).
- **Danger:** Transparent, danger-red text, red-tinted border. Destructive.
- **Disabled:** Ink-2 fill, foreground-4 text, `not-allowed` cursor.

### Status Pills
The signature component. A pill (`999px` radius, `5px 10px`) with a leading 6px dot and an uppercase, `0.08em`-tracked label, on a 14%-opacity tint of its own hue.
- **Live** (amber): pulsing dot with an amber glow — an in-progress run.
- **Running** (blue), **Completed** (green), **Failed** (red): solid dot, tinted background.
- Never render a status as a bare word; it is always dot + pill.

### Cards / Containers
- **Corner Style:** 12px (`rounded.lg`).
- **Background:** Ink-2 surface.
- **Border:** 1px ink-5 hairline.
- **Shadow Strategy:** Card shadow (`0 4px 12px rgba(0,0,0,0.45)`) only when floating on the canvas; see Elevation.
- **Internal Padding:** 16px (`spacing.md`).
- Never nest a card inside a card.

### Inputs / Fields
- **Style:** Ink-2 background, 1px ink-5 border, 8px radius, 40px tall.
- **Focus:** Border shifts to thread-blue with a 3px focus ring (`rgba(99,179,255,0.55)`).
- **Keyboard hint:** trailing `kbd` chip in mono on ink-3.

### Navigation
- **Style:** Sticky top header on ink-4 at 80% with backdrop blur, hairline bottom border. Brand icon + "Threadbase CI" wordmark on the left, primary links (Deploy / History / Admin, role-gated) center-left, user identity + avatar + sign-out on the right.
- **States:** Links are foreground-2 at rest, foreground-0 on a rounded ink-3 hover fill. The current section reads as active via the same fill.
- **Mobile:** identity text collapses; icons and links remain.

### Signature Background
- **The Blueprint Grid:** a 32px `linear-gradient` grid at `rgba(26,45,71,0.45)` over ink-1, applied to the page shell (`.tb-grid`). It is the visual through-line to the app icon and the single most identity-carrying element. Subtle — felt, not read.

## 6. Do's and Don'ts

### Do:
- **Do** keep the canvas dark (`#070b11`) with the 32px blueprint grid; it is the identity.
- **Do** set every machine identifier — branch, tag, run number, token — in JetBrains Mono.
- **Do** render status as a dot-plus-pill with an uppercase tracked label, tinted to its own hue.
- **Do** reserve amber strictly for "now" — the live/in-progress state and go-live actions — and let it glow.
- **Do** separate surfaces with the ink scale and 1px hairlines first; add a shadow only when a surface truly floats.
- **Do** verify body text (`#f4f7fb` / `#9fb0c8`) clears 4.5:1 on ink surfaces; push toward foreground-0 when close.

### Don't:
- **Don't** introduce a third brand accent. Blue controls, amber is now, status hues carry state — nothing else.
- **Don't** use amber for a resting or decorative element; it must mean something is happening.
- **Don't** ship the SaaS-marketing dialect here: no cream/sand backgrounds, no navy-and-gold, no gradient text, no glassmorphic hero cards, no drop-shadow-on-every-card.
- **Don't** pair Inter with a second similar sans; the only type contrast is Inter-vs-JetBrains-Mono.
- **Don't** use a `border-left`/`border-right` colored stripe as an accent on cards, rows, or alerts — full borders or background tints only.
- **Don't** nest cards, and don't render a status as a bare uncolored word.
