# Roadmap

Planned enhancements to the Threadbase CI Dashboard. Not yet implemented.

---

## Mobile top-bar: hamburger menu

**Goal:** on small screens, collapse the `AppHeader` nav (Deploy / History / Admin) into a hamburger toggle that opens a slide-in panel — matching the pattern already shipped in `tb-landing` (`RonenMars/tb-landing`, `origin/main`).

### Reference implementation
`tb-landing/components/NavMenu/index.tsx` is the source of truth for the look and behavior. Mirror it:

- **Toggle icon:** the [`hamburger-react`](https://www.npmjs.com/package/hamburger-react) package, `Divide` variant (imported as `Hamburger`). It animates the bars into an X on open. tb-landing uses `import { Divide as Hamburger } from "hamburger-react"`.
- **Panel motion:** `framer-motion` (`AnimatePresence` + `motion`). The panel slides in from the side (`x: "-100%"` → `0`, RTL-aware — flips to `100%` for RTL), over a fading backdrop. Easing `[0.22, 1, 0.36, 1]`, ~0.4s in / ~0.28s out.
- **Staggered links:** `staggerChildren: 0.05, delayChildren: 0.1`; each link fades + slides in (`opacity 0→1`, `x: -12→0`).
- **Backdrop:** a full-screen overlay behind the panel, fades `opacity 0→1`, click-to-close.
- **A11y:** focus the first link on open, restore focus to the trigger on close, `Escape` closes, `aria-expanded` on the toggle. tb-landing wires all of this (`triggerRef`, `firstLinkRef`, `useId`).

### Scope in this project
- The dashboard nav is simpler than tb-landing's (3 role-gated links + user identity, no i18n/locale switcher, no platform detection). Drop the RTL/`next-intl`/platform-detection machinery unless we add i18n later.
- Show the hamburger only below the `sm` breakpoint (640px); keep the current inline nav at `sm` and up.
- The slide-in panel should carry the same items as the desktop nav: Deploy (if `canDeploy`), History, Admin (if `isAdmin`), plus the user identity row and Sign out.
- Style to the Threadbase design system: ink-4 panel surface, hairline border, the same hover treatment as the desktop links.

### Dependencies to add
- `hamburger-react`
- `framer-motion` (also unlocks the `animate` motion work if we do more of it)

### Verification
- At <640px the inline links are replaced by a hamburger; tapping it slides the panel in over a backdrop.
- Links are staggered on entry; tapping a link navigates and closes the panel.
- Escape and backdrop-click close it; focus returns to the toggle.
- At ≥640px the panel machinery is absent and the inline nav shows.
