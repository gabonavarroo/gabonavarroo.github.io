# AGENTS.md — Multi-Agent Orchestration
## Gabriel Navarro Portfolio — Agent Roles, Task Division & Skill Configuration
> This document coordinates which AI agent handles which task and in what sequence.
> Read alongside DESIGN.md and CLAUDE.md.

---

## AGENT ROSTER

| Agent | Strengths | Role in This Project |
|---|---|---|
| **Claude Pro (Chat)** | Architecture, design, prompt crafting, reasoning | Design decisions, file generation, blocker resolution |
| **Claude Code** | Full-stack implementation, file management, MCP orchestration | PRIMARY build agent — all scaffolding and component work |
| **Codex (OpenAI)** | Low-level code, GLSL shaders, browser-verified frontend | GLSL shader authoring, animation polish, visual QA |
| **Gemini 2.5 Pro** | Long context synthesis, 3D scene planning, ideation | Research, 3D asset planning, content strategy |
| **ChatGPT Plus** | Copy editing, content hierarchy, quick iteration | Copywriting passes, micro-copy refinement |

---

## AGENT TASK MATRIX

### Claude Code — PRIMARY AGENT
Claude Code is the main executor. It has MCP access, reads both DESIGN.md and CLAUDE.md, and builds the entire project. All other agents feed INTO Claude Code's work.

**Owns:**
- Project scaffolding (Next.js 15 setup)
- Global layout, routing, TypeScript config
- Audio engine (`AudioController.tsx`)
- Custom cursor (`CustomCursor.tsx`)
- FBM background canvas (`FBMBackground.tsx`)
- Hero text animation (`HeroText.tsx`)
- About section layout (`AboutPanel.tsx`)
- All data files (`/src/data/*.ts`)
- Experience timeline (`MissionLog.tsx`)
- Labs / System Monitor (`SystemMonitor.tsx`, `useGitHubStats.ts`, `useWeather.ts`)
- Contact terminal (`TransmissionPanel.tsx`)
- GitHub Actions deploy workflow
- CSS design system (`globals.css`, Tailwind config)
- All `HUDFrame`, `GlowButton`, UI primitive components

**Does NOT own (hands off to Codex):**
- GLSL shader files (`.frag.glsl`, `.vert.glsl`)
- Complex R3F particle systems requiring shader expertise
- The ParticleRunner transition scene (humanoid silhouette)

---

### Codex — SHADER & ANIMATION SPECIALIST
Use Codex for tasks requiring deep knowledge of GLSL, WebGL pipeline, and browser-verified visual output. Codex can run browsers and visually verify its output.

**Owns:**
- `fbm.frag.glsl` — Fractional Brownian Motion background shader
- `distortion.frag.glsl` — Name hover distortion + chromatic aberration
- `scanline.frag.glsl` — Photo scan-line treatment
- `AtomLoader.tsx` — Loading screen orbit scene (complex geometry + timing)
- `HeroScene.tsx` — Particle cloud with mouse repel + audio reactivity
- `ParticleRunner.tsx` — Humanoid silhouette running figure
- `SkillOrrery.tsx` — 3D orbital system (complex inclinations + hover)
- All 8 project scenes in `/src/components/projects/scenes/`
- Post-processing setup (`@react-three/postprocessing` bloom on skill orrery)

**Codex prompt template for each shader:**
```
You are writing production GLSL for a WebGL/Three.js portfolio.
Context: [paste relevant section from DESIGN.md]
Requirements:
- Compatible with THREE.ShaderMaterial / THREE.RawShaderMaterial
- Uniforms required: [list from DESIGN.md]
- Target: 60fps on modern desktop GPU
- Must degrade gracefully (no crash) on integrated graphics
Output: Complete .frag.glsl and .vert.glsl file content only.
After writing: open a browser, initialize the shader in a minimal Three.js scene,
screenshot the result at 1280x900, and confirm visual output matches the design spec.
```

**Codex prompt template for R3F particle scenes:**
```
You are building a React Three Fiber component for a futuristic portfolio.
Design spec: [paste relevant project section from DESIGN.md]
Rules:
- Use THREE.InstancedMesh (never individual Mesh objects)
- Use BufferGeometry with typed arrays
- All resources disposed in useEffect cleanup
- TypeScript strict, no 'any'
- Target: smooth animation, mouse interactive, scroll-triggered via GSAP
- Color palette: --cyan-pure (#00D4FF) as primary, see DESIGN.md Section 2
After writing: render in browser at 800x600, screenshot, verify against spec.
```

---

### Gemini 2.5 Pro — RESEARCH & PLANNING
Use Gemini before building any complex 3D scene. Its large context window makes it ideal for processing multiple reference sites and synthesizing concrete implementation plans.

**Use for:**
- Planning the exact `BufferGeometry` vertex coordinates for the ParticleRunner human silhouette
- Synthesizing how igloo.inc-style particle-dust logos are implemented technically
- Researching how to extract Mexico's state polygon GeoJSON data for the CDAS scene
- Planning the Web Audio API analyzer integration with Three.js uniforms
- Generating the "System Fuel" formula logic (entertaining, time-based estimate)

**Gemini task example — ParticleRunner coordinates:**
```
I need to build a particle human silhouette for a Three.js BufferGeometry.
The figure should be in a running pose, viewed from the side.
The output should be a TypeScript array of Vector3-compatible coordinates [x, y, z]
representing ~2,000 points distributed across the body silhouette.
The figure should be approximately 2 units tall, centered at origin.
Include 5 keyframe poses for animation (standing → stride → full sprint → recovery).
Format: export const RUNNER_POSE_1: [number, number, number][] = [...];
```

**Gemini task example — Mexico GeoJSON:**
```
I need GeoJSON polygon data for Mexico's 32 states, simplified to ~50 points per polygon
for Three.js performance. Provide it as a TypeScript module:
export const MEXICO_STATES: { name: string; coordinates: [number, number][] }[] = [...];
Coordinates should be in Three.js world space (normalized to [-3, 3] range for x,
[-2, 2] for y). Include major cities as point coordinates too.
```

---

### ChatGPT Plus — COPY & CONTENT
Use ChatGPT for finalizing all visible text content. It's fast for copy iteration.

**Use for:**
- Polishing the one-line positioning statement on the hero
- Writing HUD data label copy ("CLEARANCE: Academic Excellence" vs other framings)
- Writing the About section bio paragraph (max 60 words, JARVIS-dossier tone)
- Contact section copy ("ESTABLISH CONTACT", "INITIATE TRANSMISSION", etc.)
- Any error state messages / empty state copy
- The "System Fuel" widget jokes and labels

**ChatGPT prompt:**
```
You are writing micro-copy for a futuristic JARVIS-inspired developer portfolio.
The owner is Gabriel Navarro, ITAM Data Science + Computer Engineering student, Mexico City.
Tone: Cinematic, precise, technical — like a classified military AI dossier.
NOT: casual, warm, startup-y, or generic.
Write: [specific copy task here]
Max length: [word count]
```

---

## ORCHESTRATION FILES

Multi-agent builds drift unless every agent reads from and writes to a shared, versioned record. This project uses five files (all at repo root unless noted) as the operational source of truth between sessions and across agent handoffs:

| File | Purpose | Who writes |
|---|---|---|
| `progress.md` | Live phase/sprint tracker, blockers, recent handoffs. Every agent updates this when starting/finishing work. | Every agent |
| `decisions-log.md` | ADR-style record of every architectural decision (e.g., D1–D8). One entry per decision, status = Accepted/Superseded. | Claude Code (writes), all agents (read) |
| `assets-checklist.md` | Inventory of every external asset needed (audio, photo, fonts, GeoJSON, API keys). Status checkboxes + license notes. | Claude Code (maintains), user (sources) |
| `plans/phase-{1..6}-*.md` | Per-phase sub-plans: components, owners, inputs/outputs, verification gate, exit criteria. Created in Phase 0. | Claude Code |
| `handoffs/<YYYY-MM-DD>-<tag>.md` | One file per cross-agent handoff, using the format in §"Agent Communication Format". | Source agent of the handoff |

**Read order at session start:**
1. `progress.md` — what's the current phase/sprint, who's blocked
2. `plans/phase-N-*.md` for the active phase
3. `decisions-log.md` — to understand any constraints set since last session
4. Then DESIGN.md / CLAUDE.md as reference

**Write order at session end:**
1. Update `progress.md` with what was completed and what's next
2. If a decision was made, append to `decisions-log.md`
3. If an asset was sourced or required, update `assets-checklist.md`
4. If work is being handed off, create `handoffs/YYYY-MM-DD-<tag>.md`

---

## EXECUTION SEQUENCE

### Sprint 0 — Pre-build (Claude Pro in Chat)
**Duration:** 1 session | **Output:** This document + DESIGN.md + CLAUDE.md + orchestration scaffolding

- [x] DESIGN.md — complete visual spec
- [x] CLAUDE.md — Claude Code instructions
- [x] AGENTS.md — this document
- [x] **D1** — Display font locked to **Orbitron** (decisions-log.md)
- [x] **D2** — GitHub handle locked to **`gabonavarroo`** (two r, two o)
- [x] **D3** — `basePath: ''` (user site at `gabonavarro.github.io` apex)
- [x] **D4** — Music: royalty-free instrumental (sourcing in assets-checklist.md)
- [x] **D5** — Project gallery: horizontal pin desktop, vertical stack mobile
- [x] **D6** — Tailwind v4 (CSS-first `@theme`)
- [x] **D7** — R3F mounting: IntersectionObserver-gated, one Canvas at a time, PNG posters on mobile
- [x] **D8** — GSAP SplitText/MorphSVG free as of 3.13 — used freely
- [x] Orchestration scaffolding created: `progress.md`, `decisions-log.md`, `assets-checklist.md`, `plans/`, `handoffs/`
- [ ] Fill in personal data: email, GitHub handle, LinkedIn, photo (user)
- [ ] Obtain API keys: OpenWeatherMap (free), EmailJS (free) — tracked in `assets-checklist.md`
- [ ] Source royalty-free main theme track — tracked in `assets-checklist.md`

---

### Sprint 1 — Foundation (Claude Code)
**Trigger:** `claude code` in project root, attach CLAUDE.md
**Prompt:**
```
Read CLAUDE.md and DESIGN.md completely. Execute PHASE 1 exactly as specified.
Do not start Phase 2 until the build is clean and you report PHASE 1 COMPLETE.
Use GitHub MCP to create an initial commit after scaffold.
```
**Done when:** `npm run build` succeeds, CSS vars loaded, fonts loading, cursor visible.

---

### Sprint 2 — Audio + FBM Background (Claude Code)
**Prompt:**
```
Execute PHASE 2, steps 1 and 2 only: AudioController.tsx and FBMBackground.tsx.
For the FBM shader, use the exact GLSL from DESIGN.md Section 8.1 as your base.
Test audio plays on user interaction (browser autoplay policy requires gesture).
```
**Done when:** FBM renders, audio boots, mute toggle works.

---

### Sprint 2B — Loading Screen (Codex)
**Prompt to Codex:**
```
Build AtomLoader.tsx per this spec: [paste DESIGN.md Section 5 Loading Screen section].
Use React Three Fiber. Three orbit rings, staggered reveal, camera zoom-out at end.
Open in browser, screenshot, confirm atom animation is correct. Share the screenshot.
The component should accept an `onComplete: () => void` prop called when zoom-out ends.
Stack: Next.js 15, R3F, GSAP 3. TypeScript strict.
```
**Done when:** Codex shares screenshot showing atom rings + zoom animation.

---

### Sprint 3 — Hero (Claude Code + Codex)

**Claude Code handles:** HeroText.tsx, HeroHUD.tsx, hero layout, scroll indicator
**Codex handles:** HeroScene.tsx (R3F particle cloud + mouse repel + audio reactivity)

**Claude Code prompt:**
```
Implement HeroText.tsx and HeroHUD.tsx per CLAUDE.md Phase 2 specs.
Name uses Space Grotesk 900 with GSAP SplitText stagger.
Role uses typewriter effect (JetBrains Mono).
HUD widget top-right: live time + status.
Use Playwright MCP to screenshot result.
```

**Codex prompt:**
```
Build HeroScene.tsx: a React Three Fiber scene with 3,000 particle points.
Particles: cyan (#00D4FF), mouse repel within 150px radius.
Audio reactivity: accepts `bassLevel: number` prop (0-1), drives particle spread.
Full-screen background plane with FBM shader (use DESIGN.md 8.1 spec).
Browser-test: open at 1280x900, move mouse, verify particles repel. Screenshot.
```

---

### Sprint 4 — ParticleRunner (Codex + Gemini)

**Step 1 — Gemini:** Generate humanoid silhouette coordinates (see Gemini task above).

**Step 2 — Codex:**
```
Build ParticleRunner.tsx using these coordinates: [paste Gemini output].
GSAP ScrollTrigger scrub drives x-position of the particle group.
On scroll exit: scatter animation (velocity = normalize(position) * 8, opacity fades).
Browser-test: verify runner crosses screen on scroll. Screenshot at start and end.
```

---

### Sprint 5 — About + Skills (Claude Code + Codex)

**Claude Code:** AboutPanel.tsx layout, data rows, type-in animation
**Codex:** PhotoShader.tsx (GLSL scan-line), SkillOrrery.tsx (3D orbital)

---

### Sprint 6 — All 8 Project Scenes (Codex, parallel)

Run 4 scenes simultaneously (Codex can handle multiple tasks):

**Batch 1:**
- CDASScene.tsx — Mexico map
- FaultmapScene.tsx — LLM constellation

**Batch 2:**
- PharmacyScene.tsx — Facility optimization
- PipelineScene.tsx — Data flow

**Batch 3:**
- InsuLinkScene.tsx — Network graph
- GeneticScene.tsx — GA curve fitting

**Batch 4:**
- WordleScene.tsx — Decision tree
- OptionsScene.tsx — Volatility surface

**For each, Codex must:** build → open browser → screenshot → confirm visual matches DESIGN.md description → **export 1200×900 PNG poster to `public/posters/<scene-id>.png`** → share screenshot before proceeding. The poster is the mobile/low-power-mode fallback and is non-optional.

---

### Sprint 7 — Experience, Labs, Contact (Claude Code)
Standard scroll-triggered sections. Claude Code owns all of these.

**Specific:** `useGitHubStats.ts` — use GitHub GraphQL v4 API:
```graphql
query {
  user(login: "gabonavarroo") {
    contributionsCollection {
      totalCommitContributions
      contributionCalendar { totalContributions }
    }
    repositories(first: 5, orderBy: {field: STARGAZERS, direction: DESC}) {
      nodes { name stargazerCount primaryLanguage { name } }
    }
  }
}
```

---

### Sprint 8 — Copy Pass (ChatGPT)
Run ChatGPT over all visible text in the site. Gabriel reviews and approves.

---

### Sprint 9 — Polish & QA (Claude Code + Playwright MCP)

```
Run Playwright MCP on full site:
1. Screenshot every section at 1280x900
2. Screenshot every section at 375x812
3. Run axe-core accessibility check
4. Verify: mute toggle, custom cursor states, all project card opens
5. Check console: zero Three.js warnings, zero unhandled promises
Report all findings before final deploy.
```

---

### Sprint 10 — Deploy (Claude Code + GitHub MCP)

```
Using GitHub MCP:
1. Create .github/workflows/deploy.yml for GitHub Pages
2. Merge all feature branches to main
3. Push and verify deployment URL
4. Run one final Playwright screenshot of live URL
```

---

## SKILLS TO ACTIVATE

### For Claude Code (`.claude/settings.json` or CLAUDE.md references):

**frontend-design skill** — CRITICAL. Load before any component work.
Location: `/mnt/skills/public/frontend-design/SKILL.md`
Effect: Prevents Claude Code from defaulting to generic AI aesthetics.

**Usage:** At the start of any component creation task, prepend:
```
[Read /mnt/skills/public/frontend-design/SKILL.md first. Apply its principles.]
Build [component] per DESIGN.md spec...
```

### For Codex — Frontend Verification Workflow:
Codex has native browser access. Configure it to:
1. Write component
2. Open `localhost:3000` in browser
3. Take screenshot
4. Compare against DESIGN.md description
5. Fix any visual discrepancies
6. Repeat until visually correct

Activate "frontend design verification" mode in Codex settings.

---

## BLOCKER ESCALATION

```
If Claude Code is blocked → escalate to Claude Pro (chat)
If Codex fails visually → send screenshot to Claude Pro for diagnosis
If Gemini data output is wrong format → clean up in Claude Pro before passing to Codex
If audio policy blocks play → Claude Pro provides workaround (click-to-unlock pattern)
If GitHub Pages routing breaks → Claude Pro solves with 404.html spa redirect hack
```

---

## AGENT COMMUNICATION FORMAT

When passing work between agents, use this handoff format:

```
HANDOFF: [Source Agent] → [Target Agent]
Task: [specific task name]
Input: [file paths or data to use]
Spec reference: [section in DESIGN.md]
Expected output: [what the result should look like]
Quality bar: [screenshot / test to pass]
Deadline: [which sprint this must complete]
```

Example:
```
HANDOFF: Gemini → Codex
Task: ParticleRunner humanoid silhouette
Input: /src/data/runnerPoses.ts (generated by Gemini)
Spec reference: DESIGN.md Section 1.5
Expected output: Particle figure crosses screen on scroll, dissolves on exit
Quality bar: Playwright screenshot shows recognizable human silhouette at start position
Sprint: Sprint 4
```

---

## NOTES ON SPECIFIC IMPLEMENTATIONS

### Audio Autoplay Policy (Critical)
Browsers block audio autoplay without user gesture. Workaround:
```tsx
// Mount a full-screen invisible click target on first load
// First click anywhere → unlocks AudioContext → plays jarvis boot
// This is transparent to the user but satisfies browser policy
const [audioUnlocked, setAudioUnlocked] = useState(false);

useEffect(() => {
  const unlock = () => {
    audioEngine.unlock(); // creates AudioContext on gesture
    setAudioUnlocked(true);
    document.removeEventListener('click', unlock);
  };
  document.addEventListener('click', unlock, { once: true });
}, []);
```

### Three.js Canvas Layering (Critical for GitHub Pages)
```tsx
// Global FBM canvas — behind everything
<div style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none' }}>
  <Canvas><FBMBackground /></Canvas>
</div>

// Section-specific canvases — inside their sections
<div style={{ position: 'relative', zIndex: 1 }}>
  <Canvas style={{ position: 'absolute', inset: 0 }}><HeroParticles /></Canvas>
  <div className="hero-text" style={{ position: 'relative', zIndex: 2 }}>
    {/* DOM text above canvas */}
  </div>
</div>
```

### GSAP + R3F (Critical — they fight each other)
R3F runs its own render loop. GSAP ScrollTrigger runs on scroll events. They must not both try to update the same Three.js objects.
**Rule:** GSAP drives GROUP position/rotation. R3F's `useFrame` drives MATERIAL uniforms and instance matrices. Never let both touch the same property.

```tsx
// ✅ Safe: GSAP moves the group, useFrame animates the material
const groupRef = useRef();
useEffect(() => {
  // GSAP drives position
  gsap.to(groupRef.current.position, { x: 100, scrollTrigger: {...} });
}, []);

useFrame(({ clock }) => {
  // R3F drives material (no conflict)
  groupRef.current.material.uniforms.u_time.value = clock.elapsedTime;
});
```

---

*AGENTS.md — End. Sprints begin after Sprint 0 checklist is complete.*