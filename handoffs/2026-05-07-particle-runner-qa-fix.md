# Handoff: ParticleRunner QA Fix
**Date:** 2026-05-07  
**Author:** Claude Code (Sonnet 4.6)  
**Issue:** ParticleRunner shows elliptical particle cloud reacting to cursor instead of running humanoid silhouette

---

## Root-Cause Diagnosis

### What the user saw
An elliptical/capsule-like particle cloud that responded to cursor hover — identical to the HeroScene hero section behavior.

### What was actually happening (three compounding bugs)

**Bug 1 — HeroScene bleed-through (primary):**  
`HeroScene` is `position: fixed; z-index: 1` and remains mounted while the user scrolls. The ParticleRunner section had a CSS background of:
```
linear-gradient(180deg, rgba(5, 8, 15, 0) 0%, rgba(5, 8, 15, 0.72) 35%, ...)
```
The `0` alpha at the very top (the most visible part when the section first enters) left HeroScene completely visible. Since HeroScene runs its cursor-repel raycaster via `window.addEventListener('pointermove')`, the repel worked even though the user was viewing the runner section. The user was seeing HeroScene, not the runner.

**Bug 2 — StaticRunnerFallback also transparent:**  
The fallback `<section>` background was also a semi-transparent gradient (`rgba(5,8,15,0.2)` at 0%), with the same bleed effect.

**Bug 3 — `useMotionFallback` initialised as `true`:**  
```tsx
const [fallback, setFallback] = useState(true);
```
On the first render (before `useEffect` fires), desktop users with no `prefers-reduced-motion` were shown the static fallback. The Canvas version mounted only after the first paint, causing a flash. Since the component is `ssr: false`, `window` is always available and media queries can be read synchronously in the lazy initialiser.

### Was runnerPoses.ts malformed? NO
Five keyframes present and correct: `standing`, `stride1`, `sprint`, `stride2`, `recovery`. Side-view humanoid with distinct head/torso/pelvis/limb structure. Coordinates verified — sprint pose shows arms and legs reaching ±0.78 in X (forward/backward stride), consistent with a proper side-view running silhouette.

### Was ParticleRunner using wrong cloud logic? NO
`RunnerPoints` exclusively interpolates from `RUNNER_POSES` via `normalizeRunnerData()`. No elliptical cloud logic, no cursor-repel, no random distribution. `THREE.Points + BufferGeometry` as specified.

### Was the wrong component mounted? NO
`page.tsx` correctly mounts `<ParticleRunner />` after the hero `<section>`.

---

## Fixes Applied

### Fix 1 — Opaque section backgrounds (`ParticleRunner.tsx`)
Changed both the canvas section and the static-fallback section backgrounds to `var(--bg-void)` (`#05080F`).

Before:
```tsx
// canvas section:
background: 'linear-gradient(180deg, rgba(5, 8, 15, 0) 0%, ...'

// static fallback section:
background: 'linear-gradient(180deg, rgba(5, 8, 15, 0.2) 0%, ...'
```

After:
```tsx
background: 'var(--bg-void)'  // both sections
```

This ensures the runner section always blocks HeroScene from showing through, regardless of GSAP pin state or scroll position.

### Fix 2 — `useMotionFallback` lazy initialiser (`ParticleRunner.tsx`)
Changed `useState(true)` to a synchronous lazy initialiser that reads media queries on the first client paint:
```tsx
const [fallback, setFallback] = useState<boolean>(() => {
  if (typeof window === 'undefined') return true;
  return (
    window.matchMedia('(prefers-reduced-motion: reduce)').matches ||
    window.matchMedia('(max-width: 767px)').matches
  );
});
```
Desktop users now see the R3F canvas immediately without a flash to the static fallback.

### Fix 3 — HeroScene unmounted when hero leaves viewport (`page.tsx`)
Added an `IntersectionObserver` on the hero `<section>` ref. `HeroScene` unmounts when the hero section scrolls off-screen, eliminating both the visual bleed and the wasted GPU rendering during the runner section.

```tsx
const [heroInView, setHeroInView] = useState(true);
// ...
useEffect(() => {
  const observer = new IntersectionObserver(
    ([entry]) => setHeroInView(entry.isIntersecting),
    { threshold: 0 }
  );
  observer.observe(heroRef.current);
  return () => observer.disconnect();
}, []);
// ...
{heroInView && <HeroScene style={{ zIndex: 1 }} />}
```

---

## Verification

| Check | Result |
|---|---|
| `npx tsc --noEmit` | 0 errors |
| `npm run build` | ✓ static export, 105 kB |
| runnerPoses.ts malformed? | No — 5 keyframes, correct structure |
| ParticleRunner using wrong logic? | No — interpolates RUNNER_POSES exclusively |
| Wrong component mounted? | No — page.tsx correctly sequential |
| Root cause | HeroScene bleed-through via transparent gradient |

## Browser screenshots
Screenshots to be taken by user via `npm run dev` — Playwright MCP not available in this session.

Expected: scrolling past the hero should show a dark (`--bg-void`) backdrop with cyan particle points forming a side-view running silhouette, traversing left→center→right as the user scrolls the pinned section. At ~95% scroll progress, particles scatter outward and fade.
