# Phase 6 — Polish, Performance, Deploy

> **Owner:** Claude Code (sole, with Playwright MCP for QA) · **Estimated effort:** 1 session · **Prerequisites:** Phase 5 verification gate green; all 8 project posters in `public/posters/`.

## Context

Final pass: section-entrance polish, mobile fallbacks, accessibility, performance, Low Power Mode toggle, deploy workflow. After this phase, `gabonavarro.github.io` is live.

## Tasks

### 6A — ScrollTrigger entrances (every section)

For Hero, About, Skills, Projects, Experience, Labs, Contact — wrap each section's root `<section>` in a GSAP context that animates direct-children entrance via the directional rule from DESIGN.md §4 (top → hero, left → text, bottom → data). Standard pattern:

```ts
useGSAP(() => {
  gsap.fromTo(
    section.querySelectorAll('[data-reveal]'),
    { opacity: 0, y: 40 },
    {
      opacity: 1, y: 0, duration: 0.8, ease: 'expo.out', stagger: 0.08,
      scrollTrigger: { trigger: section, start: 'top 75%' },
    }
  );
}, { scope: sectionRef });
```

Add `data-reveal` attribute to every block-level component inside sections that should animate.

### 6B — Custom cursor states

Verify the cursor reticle changes correctly on:
- buttons → `LOCK` label appears
- inputs / textareas → I-beam shape
- canvases (project scene, hero) → no change (default reticle, but inner dot expands)
- Drag (e.g., on mobile-disabled OrbitControls) → cross-hair

Use Playwright MCP to programmatically `page.hover()` each interactive selector and snapshot.

### 6C — Mobile fallbacks

For each R3F-heavy component, add an `if (isMobile) return <PosterFallback />` branch:
- `FBMBackground` mobile → CSS `linear-gradient` mimicking the nebula in `--bg-base` / `--bg-surface`.
- `HeroScene` mobile → static cyan radial gradient + a simple CSS particle (`@keyframes` driven dots).
- `AtomLoader` mobile → CSS-only spinning ring overlay (still ~3s).
- `ParticleRunner` mobile → simple horizontal CSS line that draws across.
- `SkillOrrery` mobile → static SVG of orbits + pods, no R3F.
- All 8 project scenes → poster only (already implemented in Phase 4).
- `TechStack3D` mobile → 2-column grid of CSS-styled logo chips.

`useIsMobile()` hook lives in `src/hooks/useIsMobile.ts` (created in Phase 1, used here).

### 6D — Low Power Mode toggle

Per CLAUDE.md "Host Environment & Performance Context": ship a user-flippable toggle that disables R3F entirely.

- `src/lib/lowPowerMode.ts` — singleton with `isLowPower(): boolean` reading `localStorage('low-power-mode')`. Default off on desktop, **on** for mobile and `prefers-reduced-motion`.
- `LowPowerToggle.tsx` — small button in the persistent header (top-right, next to mute).
- When ON:
  - Every `<Canvas>` short-circuits to its CSS fallback.
  - GSAP animations run with `duration *= 0.5` and `ease: 'power1.out'` (no expo, no dramatic timelines).
  - FBM background → static gradient.
- When toggled, page does a soft reload of dynamic regions (no full page reload — use a context value that propagates).

### 6E — Bundle analysis

```bash
npm run build -- --analyze   # if @next/bundle-analyzer integrated
# OR
npx next-bundle-analyzer
```

Targets (from CLAUDE.md updated):
- No single chunk > 150 KB gzipped
- First-load JS for `/` < 300 KB gzipped (desktop), < 150 KB on mobile (achieved via dynamic imports for R3F)

Lazy-load via `next/dynamic`:
- `AtomLoader` (loaded only on first mount, not subsequent)
- All 8 project scenes (`React.lazy` already in Phase 4)
- `SkillOrrery`
- `TechStack3D`
- `ParticleRunner`

Three.js itself is the biggest dep — accept it. Tree-shake aggressively (no kitchen-sink imports).

### 6F — Accessibility

Run `axe-core` via Playwright MCP. Fix:
- Color contrast ratios (some grayed text on dark may need bump to AAA).
- Skip-link to main content (Phase 1 layout adds `<a href="#main" class="sr-only">Skip to content</a>`).
- All `<canvas>` elements have `aria-hidden="true"` and a `<noscript>` / SR-only text fallback describing what's there.
- Form inputs have `<label>`s.
- All interactive elements reachable via Tab; visible focus ring (cyan outline).
- Mute toggle and Low Power toggle have `aria-pressed`.
- `prefers-reduced-motion` honored: no parallax, no scroll-jacking — fall back to natural scroll, no GSAP scrub.

### 6G — Final cleanup

- Remove all `console.log` calls (per CLAUDE.md forbidden patterns).
- Strip unused imports.
- Verify no hardcoded hex colors anywhere outside `globals.css` / `decisions-log.md`.
- Verify no Inter / Roboto / Space Grotesk references.
- Run `npm run lint` clean.

### 6H — Deploy workflow

`.github/workflows/deploy.yml`:
```yaml
name: Deploy
on:
  push: { branches: [main] }
  workflow_dispatch:
permissions:
  pages: write
  id-token: write
concurrency:
  group: pages
  cancel-in-progress: true
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 22, cache: npm }
      - run: npm ci
      - run: npm run build
        env:
          NEXT_PUBLIC_OPENWEATHER_KEY: ${{ secrets.OPENWEATHER_KEY }}
          NEXT_PUBLIC_EMAILJS_SERVICE_ID: ${{ secrets.EMAILJS_SERVICE_ID }}
          NEXT_PUBLIC_EMAILJS_TEMPLATE_ID: ${{ secrets.EMAILJS_TEMPLATE_ID }}
          NEXT_PUBLIC_EMAILJS_PUBLIC_KEY: ${{ secrets.EMAILJS_PUBLIC_KEY }}
      - uses: actions/upload-pages-artifact@v3
        with: { path: out }
  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - uses: actions/deploy-pages@v4
        id: deployment
```

User adds the four secrets in repo Settings → Secrets and variables → Actions.

GitHub Pages settings: Source = "GitHub Actions" (not "Deploy from a branch").

### 6I — Final QA sweep (Playwright MCP)

```
For each section:
  - 1280x900 screenshot
  - 375x812 screenshot
  - axe-core check
  - DevTools console log check (no warnings)
For end-to-end:
  - Reload, click anywhere, atom plays, hero reveals, scroll through every section, submit test email
  - Toggle mute → check persistence after reload
  - Toggle Low Power Mode → check R3F replaced with CSS fallback
```

All screenshots saved under `handoffs/launch-2026-XX-XX-qa/`.

## Verification gate

| Check | Pass |
|---|---|
| All sections have ScrollTrigger entrance | Visual sweep |
| Cursor states transition correctly | Playwright snapshots |
| Mobile fallbacks render at 375px | Playwright screenshot, no R3F in DOM |
| Low Power toggle disables R3F | DevTools, no `<canvas>` |
| Bundle no chunk > 150KB gzipped | Build output |
| axe-core | 0 critical violations |
| Lighthouse | Performance ≥ 85 desktop / ≥ 70 mobile |
| Deploy workflow | Manual `workflow_dispatch` from GH Actions tab succeeds |
| Live URL | `https://gabonavarro.github.io/` returns the portfolio |

## Exit criteria

- Live URL responds with the portfolio.
- Final Playwright screenshot of live URL stored at `handoffs/launch-2026-XX-XX/live.png`.
- `progress.md` Phase 6 ticked, project marked SHIPPED.
- Commit: `chore(deploy): github actions workflow + final polish`.
- README.md updated with live URL link.
