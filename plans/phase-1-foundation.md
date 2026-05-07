# Phase 1 — Foundation

> **Owner:** Claude Code (sole) · **Estimated effort:** 1 session · **Prerequisites:** Phase 0 complete, decisions-log.md D1–D8 logged.

## Context

Build the skeleton: Next.js 15 static-export project, design tokens loaded as CSS variables, fonts wired, GSAP context registered, custom cursor and global FBM background canvas mounted at the layout root, and stub data files with full TypeScript types. No section content yet.

## Deliverables

### 1. Project scaffold
```bash
npx create-next-app@latest . --typescript --tailwind --app --no-src-dir --import-alias "@/*"
# Then move app/, components/, lib/, data/ into src/ manually
```
Move:
- `app/` → `src/app/`
- create `src/components/`, `src/lib/`, `src/data/`, `src/hooks/`, `src/shaders/`

### 2. Dependencies (per CLAUDE.md, post-D6/D8)
```bash
npm i three @react-three/fiber @react-three/drei @react-three/postprocessing
npm i gsap@^3.13 @gsap/react
npm i lenis
npm i @emailjs/browser
npm i -D @types/three
```

### 3. `next.config.js`
```js
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  trailingSlash: true,
  images: { unoptimized: true },
  basePath: '', // user site at apex
};
module.exports = nextConfig;
```

### 4. `src/app/globals.css`
Literal copy of every CSS variable from DESIGN.md §2 + §3 wrapped in a Tailwind v4 `@theme` block. Pattern:
```css
@import "tailwindcss";

@theme {
  --color-bg-void: #05080F;
  --color-bg-base: #080C14;
  /* …every token from DESIGN.md §2 */
  --font-orbitron: var(--font-orbitron-loaded);
  --font-mono: var(--font-mono-loaded);
}

:root {
  --bg-void: #05080F;
  --bg-base: #080C14;
  /* …mirror as plain CSS vars for consumption outside Tailwind utilities */
}

* { cursor: none; } /* hidden default cursor; CustomCursor takes over */
@media (pointer: coarse) { * { cursor: auto; } }

body {
  background: var(--bg-base);
  color: var(--text-primary);
  font-family: var(--font-mono);
  overflow-x: hidden;
}
```

### 5. `src/app/layout.tsx`
- Import `Orbitron` + `JetBrains_Mono` from `next/font/google`, expose as `--font-orbitron-loaded` and `--font-mono-loaded` CSS variables on `<html>`.
- Mount `<FBMBackground />` (z-index 0) and `<CustomCursor />` (z-index 9999).
- Mount `<AudioController />` provider (Phase 2 will wire it; Phase 1 just exports a no-op shell).
- Set `<html lang="en">`, dark scheme.

### 6. `src/data/*.ts` — typed stubs
- `operator.ts` — exports `OPERATOR` per DESIGN.md §13 (with locked email/handle/linkedin from D2).
- `projects.ts` — exports `PROJECTS: Project[]` with full data for the 8 projects (seeded from resume + DESIGN.md §4 + index.html). Type definition includes `id, title, codename, role, year, stack[], description, github?, live?, posterPath, sceneId`.
- `experience.ts` — exports `EXPERIENCE: ExperienceEntry[]` (CDAS internship, Coding Rush, Academic Excellence, plus any others from resume).
- `skills.ts` — exports `SKILLS: SkillCategory[]` matching DESIGN.md §3 categories with color tokens.
- `research.ts` — exports `RESEARCH_TAGS: string[]` for Labs §6.2.

All types declared in `src/data/types.ts`. Strict TypeScript, no `any`.

### 7. `src/lib/gsap.ts`
```ts
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger, SplitText);
}

export { gsap, ScrollTrigger, SplitText };
```

### 8. `src/components/ui/CustomCursor.tsx`
- Two divs (`.cursor-outer`, `.cursor-inner`), `position: fixed`, `pointer-events: none`.
- GSAP `quickTo` for smooth lerp (outer 0.15s lag, inner 0.05s).
- Expose data attribute hooks: `data-cursor="lock"` / `data-cursor="text"` on interactive elements changes the reticle state.
- Hide on `(pointer: coarse)` media query.

### 9. `src/components/ui/FBMBackground.tsx`
- Global `<Canvas>` with `position: fixed; inset: 0; z-index: 0; pointer-events: none`.
- Renders a fullscreen plane with `THREE.ShaderMaterial`. Phase 1 ships an inline placeholder shader (solid `--bg-base`); Phase 2 swaps in `fbm.frag.glsl` from Codex.
- `useFrame` increments `u_time`; `u_resolution` updates on resize.

### 10. UI primitives
- `src/components/ui/HUDFrame.tsx` — wraps children with corner brackets (SVG), top-left dot, optional label + status indicator.
- `src/components/ui/GlowButton.tsx` — `<button>` or `<a>` styled with cyan border + glow box-shadow + hover state. Supports `variant="primary" | "secondary"`.
- `src/components/ui/StatusDot.tsx` — pulsing colored dot.

### 11. `src/app/page.tsx`
- Empty in Phase 1; just `<main data-section="root" />` so we can verify the layout renders.

## Files created or modified

| Path | Action |
|---|---|
| `package.json` | created |
| `next.config.js` | created |
| `tsconfig.json` | created (strict) |
| `postcss.config.mjs` | created |
| `src/app/layout.tsx` | created |
| `src/app/page.tsx` | created |
| `src/app/globals.css` | created |
| `src/components/ui/CustomCursor.tsx` | created |
| `src/components/ui/FBMBackground.tsx` | created |
| `src/components/ui/HUDFrame.tsx` | created |
| `src/components/ui/GlowButton.tsx` | created |
| `src/components/ui/StatusDot.tsx` | created |
| `src/lib/gsap.ts` | created |
| `src/data/types.ts` | created |
| `src/data/operator.ts` | created |
| `src/data/projects.ts` | created |
| `src/data/experience.ts` | created |
| `src/data/skills.ts` | created |
| `src/data/research.ts` | created |
| `src/components/audio/AudioController.tsx` | shell only (filled in Phase 2) |
| `.env.example` | created (no secret values) |
| `.gitignore` | extended (add `.env.local`) |
| `index.html` (root) | **delete after user confirms** |

## Verification gate

| Check | Command | Pass criteria |
|---|---|---|
| Type-check | `npx tsc --noEmit` | 0 errors |
| Build | `npm run build` | Static export to `out/` succeeds |
| Dev server | `npm run dev` then load `http://localhost:3000` | Page renders, FBM placeholder fills viewport, custom cursor reticle follows mouse, no console errors |
| Bundle size | build output | First-load JS for `/` < 200KB gzipped (it's still a near-empty page) |
| Fonts loading | DevTools Network | Orbitron and JetBrains Mono loaded once, font-display: swap |
| Lighthouse smoke | `npx lighthouse http://localhost:3000 --view` | Performance ≥90 |

## Exit criteria

- All 11 deliverables done, all 6 verification checks pass.
- `progress.md` updated with Phase 1 ✅, Phase 2 components moved to ⏳/🔲.
- Commit: `feat(foundation): scaffold next.js + design tokens + ui primitives`.

## Hand-off after exit

- Codex prompt for Phase 2 step 1 (AtomLoader.tsx) drafted in `handoffs/`.
- Codex prompt for `fbm.frag.glsl` drafted in `handoffs/`.
