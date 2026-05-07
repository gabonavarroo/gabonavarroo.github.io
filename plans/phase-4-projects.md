# Phase 4 — Projects (8 R3F scenes + horizontal-pin gallery)

> **Owners:** Claude Code (gallery + card template) + **Codex** (8 scenes + posters) + **Gemini** (data) + **ChatGPT** (descriptions) · **Estimated effort:** 3 sessions (Codex parallel batches) · **Prerequisites:** Phase 3 verification gate green; `src/data/projects.ts` populated.

## Context

Eight cards. Each has a unique R3F scene illustrating the project's core concept. Layout per **D5**: horizontal scroll-jacked carousel on desktop ≥768px, vertical pinned-stack on mobile <768px. Per **D7**, only the in-view card has its R3F Canvas mounted; off-screen cards show a static PNG poster. On mobile, posters only (no R3F).

## Owners

| Component | Owner |
|---|---|
| `ProjectGallery.tsx` (layout, scroll architecture) | Claude Code |
| `ProjectCard.tsx` (template, intersection-gated mount) | Claude Code |
| `SceneSkeleton.tsx` (Suspense fallback) | Claude Code |
| 8 scene components + 8 poster PNGs | **Codex** |
| Mexico simplified GeoJSON | **Gemini** |
| InsuLink graph layout, Wordle tree topology | **Gemini** |
| 60-char project descriptions | **ChatGPT** |

## Sprint 4A — Gallery layout (Claude Code)

`src/components/projects/ProjectGallery.tsx`:
- Reads `useIsMobile()` hook (Phase 1 helper, breakpoint 768).
- Desktop branch:
  - Outer container `position: relative; height: <8 * vh>` (one viewport per card).
  - Inner track: `display: flex; flex-direction: row; height: 100vh; width: <8 * 100vw>`.
  - GSAP ScrollTrigger:
    ```js
    ScrollTrigger.create({
      trigger: outer,
      start: 'top top',
      end: () => `+=${innerTrack.offsetWidth - window.innerWidth}`,
      pin: true,
      scrub: 1,
      onUpdate: (self) => {
        gsap.to(innerTrack, {
          x: -(innerTrack.offsetWidth - window.innerWidth) * self.progress,
          duration: 0.1,
          overwrite: 'auto',
        });
      },
    });
    ```
- Mobile branch:
  - Cards stack vertically, each `height: 100vh`. Each card pins for one viewport-height (`pin: true, scrub: 1`).

`src/components/projects/ProjectCard.tsx`:
- Renders the card layout per DESIGN.md §4 (3D scene area + meta panel).
- Wraps the scene in an IntersectionObserver:
  - When `isIntersecting === true` AND not mobile AND not low-power-mode → render `<Canvas>` with the project's scene component lazy-imported via `React.lazy`.
  - Otherwise → render `<img src={project.posterPath} />`.
- Meta panel: `PROJECT_0X.XX` ID + Orbitron name + JetBrains-Mono description + tech tag chips + `<GlowButton>` for GitHub link + optional secondary button for live URL.

## Sprint 4B — Project content seeding (ChatGPT + Claude Code)

ChatGPT writes a 60-character (max) description per project. Drop into `src/data/projects.ts`. Source material from resume + DESIGN.md §4 + index.html. Eight entries:

1. **CDAS** — Búsqueda Colectiva Nacional missing-persons platform (current ITAM internship; multi-container scheduler + scrapers).
2. **Faultmap** — Open-source LLM diagnostic library, published on PyPI.
3. **Pharmacy Network Optimization** — P-median facility location across Mexico.
4. **E-Commerce Data Pipeline** — Akamai bypass + proxy rotation + bot detection.
5. **Insulink** — Diabetes care platform connecting patients ↔ doctors; 70+ users.
6. **Genetic Algorithm CO₂ Estimator** — GA-fitted historical CO₂ curve.
7. **gabriel_regina Algorithmic Wordle** — 1st-place tournament solver (entropy-optimal).
8. **Options Flow Monitor** — Live options data terminal + volatility surface.

## Sprint 4C — Codex builds the 8 scenes (parallel batches)

Each scene lives at `src/components/projects/scenes/<Name>Scene.tsx` and follows the contract:
```tsx
interface SceneProps {
  inView: boolean;       // intersection state, drives mount / unmount
  audioBass?: number;    // optional reactivity
}
export default function <Name>Scene(props: SceneProps): JSX.Element { … }
```

Per scene, Codex must also:
1. Build the scene per DESIGN.md §4.x.
2. Open at `localhost:3000`, screenshot at 1280×900, attach to handoff file.
3. Export a final-state PNG at exactly **1200×900**, save to `public/posters/<scene-id>.png`.
4. Confirm dispose on unmount (no Three.js warnings in console after 5 cycles of mount/unmount).

**Batch 1** — `CDASScene` + `FaultmapScene`
- Inputs: `mexicoStates.ts` (Gemini, see Sprint 4D below) + DESIGN §4.1 / §4.2.

**Batch 2** — `PharmacyScene` + `PipelineScene`
- Inputs: same `mexicoStates.ts`; pipeline scene uses simple parametric paths.

**Batch 3** — `InsuLinkScene` + `GeneticScene`
- Inputs: Gemini graph layout for InsuLink (see Sprint 4D).

**Batch 4** — `WordleScene` + `OptionsScene`
- Inputs: Gemini decision-tree topology for Wordle.

## Sprint 4D — Gemini data generation

Three handoff files generated upfront so Codex isn't blocked:

1. `handoffs/2026-XX-XX-mexico-geojson.md` →
```
Output src/data/mexicoStates.ts:
  export interface MexicoState { name: string; coordinates: [number, number][]; }
  export const MEXICO_STATES: MexicoState[] = [...];          // 32 states
  export const MEXICO_OUTLINE: [number, number][] = [...];     // national perimeter
Coordinates normalized: x ∈ [-3, 3], y ∈ [-2, 2]. ≤50 points per polygon.
Source: Natural Earth public-domain shapefiles → simplify (Visvalingam) → normalize.
```

2. `handoffs/2026-XX-XX-insulink-graph.md` →
```
Output src/data/insulinkGraph.ts:
  Nodes: 70 patients + 12 doctors + 1 hub, each with [x, y, z] in [-2, 2]³ (force-directed pre-layout).
  Edges: each patient connected to 1 doctor (random pairing) and to hub.
  Type: { patients: Point[]; doctors: Point[]; hub: Point; edges: [string, string][] }
```

3. `handoffs/2026-XX-XX-wordle-tree.md` →
```
Output src/data/wordleTree.ts:
  A 4-level decision tree. Level 0 = root guess. Level 1 = 5 outcome buckets.
  Each branch's "kept" status (true on the optimal path, false on pruned branches).
  Type: { id: string; depth: number; pos: [x,y,z]; parent?: string; pruned: boolean }[]
```

## Verification gate

| Check | Pass |
|---|---|
| Gallery scrolls horizontally on desktop | Visual + DevTools confirms pin |
| Gallery stacks vertically on mobile | 375px playwright screenshot |
| Only one Canvas in DOM at a time | DevTools Elements panel during scroll |
| Each scene matches DESIGN.md §4.x | Codex screenshots attached |
| Posters render on mobile (no R3F) | Network tab shows 0 GLSL files on 375px |
| All 8 PNG posters in `public/posters/` | `ls public/posters/ | wc -l` == 8 |
| No "set on disposed object" warnings | DevTools console after 10 mount cycles |
| TypeScript + build clean | Standard gates |

## Exit criteria

- All 8 cards live, posters in place, gallery scroll architecture working both desktop and mobile.
- `progress.md` Phase 4 ticked. Component checklist updated.
- Commit per batch: `feat(projects): batch N scenes (CDAS, Faultmap)` etc.
