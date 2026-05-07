# Phase 3 — About & Skills

> **Owners:** Claude Code (layout/copy) + **Codex** (PhotoShader, SkillOrrery) + **Gemini** (orbit math) + **ChatGPT** (bio copy) · **Estimated effort:** 1 session · **Prerequisites:** Phase 2 verification gate green; user-provided headshot in `public/images/gabriel-photo.jpg`.

## Context

Two sections that introduce the operator and his toolkit. About is a holographic dossier panel (photo + structured HUD data); Skills is a 3D orbital "solar system" of technology categories.

## Owners

| Component | Owner |
|---|---|
| `AboutPanel.tsx` (layout, type-in animation) | Claude Code |
| `PhotoShader.tsx` (R3F + scanline GLSL) | **Codex** |
| `scanline.frag.glsl` | **Codex** |
| Bio paragraph (≤60 words, JARVIS-dossier tone) | **ChatGPT** |
| `SkillOrrery.tsx` (3D orbital scene) | **Codex** |
| Orbit ring inclination angles + pod positioning math | **Gemini** |

## Sprints

### Sprint 3A — About Panel (Claude Code)

`src/components/about/AboutPanel.tsx`:
- CSS Grid `grid-template-columns: 40fr 60fr`; mobile single column.
- Left column: `<PhotoShader />` (Codex-built) inside an absolute-positioned container with SVG corner brackets at all 4 corners (animated draw-in via `clip-path` on entrance), and a `<StatusDot color="green" />` + `STATUS: ACTIVE` label below.
- Right column: dossier rows. Each row is `<DataRow label="OPERATIVES" value="Data Science · Comp. Engineering" />` rendered with the dotted-leader pattern from DESIGN.md §9.
- Rows on entrance: GSAP `ScrollTrigger` (`start: 'top 80%'`), each row's value text typewriters in (0.03s per char), rows stagger 0.3s apart.
- Bio paragraph (from ChatGPT) renders as a separate block under dossier rows, fades in last.

### Sprint 3B — PhotoShader (Codex)

`src/shaders/scanline.frag.glsl` per DESIGN.md §8.3 (verbatim).

`src/components/about/PhotoShader.tsx`:
- R3F `<Canvas>` constrained to the photo container size.
- Plane geometry filling viewport.
- `THREE.ShaderMaterial` with `scanline.frag.glsl`, uniforms: `u_time` (driven), `u_photo` (TextureLoader → `/images/gabriel-photo.jpg`).
- `useFrame` increments `u_time`.
- Dispose on unmount.

Codex screenshot deliverable: photo with scan-lines at t=0.5s and t=2.5s (lines should have visibly moved).

### Sprint 3C — Skill Orrery (Codex with Gemini math)

**Gemini handoff** (`handoffs/2026-XX-XX-orrery-math.md`):
```
Compute orbit parameters for SkillOrrery.tsx.
- 4 elliptical orbits at distinct inclinations (X-axis tilts in radians) and rotations (Y-axis).
- Recommended: ring radii 1.5, 2.2, 2.9, 3.6 units; inclinations [0.1, -0.25, 0.4, -0.55] rad.
- For each ring, compute the (x, y, z) world position for a single skill pod at orbit angle θ (parametric).
- Output: a TypeScript helper `getPodPosition(ringIndex: 0|1|2|3, theta: number): [x, y, z]` and the inclination/radius tables.
```

**Codex** builds `src/components/skills/SkillOrrery.tsx`:
- R3F isolated `<Canvas>`.
- Central core: `THREE.SphereGeometry` radius 0.6, `THREE.MeshStandardMaterial` with `emissive: '#00D4FF'`, `emissiveIntensity: 2`. Slow Y-axis rotation.
- Bloom postprocessing via `@react-three/postprocessing` `<EffectComposer><Bloom intensity={1.4} luminanceThreshold={0.2} /></EffectComposer>`.
- 4 orbit ring meshes (`THREE.RingGeometry`, dashed via instanced thin segments) per Gemini's tilts.
- One skill-pod per category (5 categories per DESIGN.md §3 → first 4 occupy rings, 5th sits in inner core orbit). Each pod is a Drei `<RoundedBox />` + Drei `<Text />` label, positioned at `getPodPosition(ringIndex, theta)`. Theta increments per `useFrame` at category-specific speed.
- Hover (`onPointerEnter`):
  - GSAP scales the pod 1 → 1.4 over 0.4s.
  - 5 child `THREE.Mesh` "tech nodes" (one per specific tool, e.g. `Python`, `PyTorch`) animate out from the pod center to a 0.6-unit radius.
  - Auto-rotate pauses (camera locks to pod).
- `<OrbitControls>` from Drei with `enablePan={false}`, damping `0.05`, `autoRotate` `true`, `autoRotateSpeed: 0.4` (paused on hover).
- Color coding per DESIGN.md §3 — pod material's `emissive` per category color token.

HUD overlay outside the Canvas: top-left `SKILL MATRIX LOADED` text + a thin progress bar that completes on initial mount (GSAP `width: 0% → 100%` over 1.2s).

### Sprint 3D — Bio copy (ChatGPT)

Prompt to ChatGPT:
```
Write a 60-word max bio for Gabriel Navarro Cerón, Data Science + Computer Engineering student at ITAM (Mexico City), to appear in a JARVIS-dossier-style portfolio About section. Tone: cinematic, precise, technical — like a classified file. Cover: research direction (LLM evaluation, geospatial ML, optimization), current role (CDAS intern), notable wins (Wordle tournament 1st, Academic Excellence Award). NOT: warm, casual, startup-y.
```
Output gets stored in `src/data/operator.ts` as `OPERATOR.bio`.

## Verification gate

| Check | Pass |
|---|---|
| Photo renders with scan-lines + cyan grade | Visual inspection |
| Corner brackets animate in on scroll entrance | DOM inspection |
| Status dot pulses green | CSS animation visible |
| Dossier rows type in row-by-row | Each row's value reveals char-by-char |
| Skill orrery: core glows, bloom visible | Codex screenshot |
| Hovering a pod expands it + reveals child nodes | Live test |
| Orrery auto-rotates, pauses on hover | Live test |
| TypeScript clean, build clean | Standard gates |

## Exit criteria

- Both sections render correctly at 1280×900 and 375×812.
- ChatGPT-authored bio committed to `operator.ts`.
- `progress.md` Phase 3 ticked.
- Commit: `feat(about+skills): dossier panel + orbital skill matrix`.
