# CLAUDE.md — Agent Instructions for Claude Code
## Gabriel Navarro Portfolio — Build Manifest
> Read DESIGN.md first and completely before any action. This file tells you HOW to build. DESIGN.md tells you WHAT to build. Both are required.

---

## YOUR MISSION

You are building a **motion-first, art-directed personal portfolio** for Gabriel Navarro — a Data Science and Computer Engineering student at ITAM (Mexico City). This is not a template project. This is a cinematic, JARVIS-inspired, retro-futuristic interactive experience. Every decision must serve that aesthetic.

**The cardinal rule:** If what you are about to generate could appear on a generic AI-built portfolio, stop and make it more specific, more intentional, and more original.

---


## Host Environment & Performance Context
You are running on a macOS environment with an M4 Pro chip. While local compilation and WebGL rendering will be extremely fast on this machine, you must optimize the final build for standard web traffic. All React Three Fiber (R3F) and complex GLSL shader components must be conditionally wrapped with a `Low Power Mode` toggle to ensure accessibility for older devices.


## TECH STACK — DO NOT DEVIATE

```json
{
  "framework": "Next.js 15 (App Router, static export)",
  "3D_engine": "React Three Fiber (R3F) + @react-three/drei",
  "animation": "GSAP 3.13+ with ScrollTrigger + SplitText (both free as of 3.13)",
  "smooth_scroll": "lenis (formerly @studio-freight/lenis)",
  "styling": "Tailwind CSS v4 (CSS-first @theme)",
  "language": "TypeScript (strict mode, no 'any')",
  "shaders": "Custom GLSL via @react-three/drei rawShaderMaterial",
  "audio": "Web Audio API (native browser, no library)",
  "particles": "Three.js BufferGeometry + InstancedMesh",
  "contact": "EmailJS (@emailjs/browser)",
  "live_data": "GitHub GraphQL API + OpenWeatherMap REST API",
  "deployment": "GitHub Pages (static export)"
}
```

**Forbidden dependencies:**
- `@mui/material`, `@chakra-ui`, `@shadcn/ui` — no component kits
- `styled-components`, `emotion` — use Tailwind + CSS vars only
- `framer-motion` — use GSAP exclusively for animations
- `axios` — use native `fetch`
- `lodash` — use native JS
- `react-spring` — use GSAP

---

## BUILD PHASES — EXECUTE IN ORDER

### PHASE 1 — Foundation (Do this first, nothing else)

**Tasks:**
1. Scaffold Next.js 15 project:
   ```bash
   npx create-next-app@latest portfolio --typescript --tailwind --app --no-src-dir
   # Then move to src/ manually
   ```

2. Install dependencies:
   ```bash
   npm install three @react-three/fiber @react-three/drei
   npm install gsap @gsap/react
   npm install lenis
   npm install @emailjs/browser
   ```

3. Configure `next.config.js` for static export:
   ```js
   const nextConfig = {
     output: 'export',
     trailingSlash: true,
     images: { unoptimized: true },
     basePath: '', // user site at gabonavarro.github.io apex — leave empty
   }
   ```

4. Set up CSS variables in `globals.css` — copy EVERY token from DESIGN.md Section 2 and 3

5. Set up Google Fonts in `layout.tsx` via `next/font/google`:
   - **Orbitron** (weights: 400, 600, 700, 900) — exposed as `--font-orbitron`
   - **JetBrains Mono** (weights: 400, 500, 600) — exposed as `--font-mono`
   - Space Grotesk and Rajdhani are forbidden (anti-pattern per DESIGN.md §1)

6. Create all `/src/data/*.ts` stub files with type definitions

7. Set up GSAP context and ScrollTrigger registration in `/src/lib/gsap.ts`

8. Create `CustomCursor.tsx` component and mount it in root layout

9. Create `FBMBackground.tsx` — global R3F canvas, pointer-events none, position fixed behind everything

**PHASE 1 CHECKPOINT:** Run `npm run build`. Must succeed with zero errors. Do not proceed until clean.

---

### PHASE 2 — Loading & Hero (Most complex, most important)

**Tasks (in order):**

1. `AtomLoader.tsx` — Loading screen
   - Pure R3F scene, full-screen overlay
   - Three orbit rings (RingGeometry, dashed via dashOffset animation)
   - Orbiting nodes (InstancedMesh, ~30 total across rings)
   - GSAP timeline: stagger ring reveals → zoom camera forward → fade out
   - Triggers audio Phase 1 (JARVIS boot sounds) via AudioController

2. `AudioController.tsx` — Audio engine singleton
   - Web Audio API: `AudioContext`, `GainNode`, `AnalyserNode`
   - Load and decode: `jarvis-boot.mp3`, `should-i-stay-guitar.mp3`
   - Expose: `play()`, `mute()`, `getAnalyzerData()` via React context
   - Persist mute preference: `localStorage.getItem('audio-muted')`

3. `HeroScene.tsx` — R3F canvas
   - FBM fragment shader on a full-screen plane (ShaderMaterial)
   - `u_time` uniform driven by `useFrame`
   - `u_audio_mid` uniform driven by `useAudioAnalyzer()` hook
   - Particle cloud: 3,000 `THREE.Points` (BufferGeometry)
   - Mouse repel: raycaster + distance-based velocity offset
   - Audio reactivity: bass → particle spread, mid → FBM turbulence

4. `HeroText.tsx` — DOM text over canvas
   - **Orbitron 900** for name, clamp(48px, 8vw, 96px)
   - GSAP SplitText: stagger per-character, `y: 40, opacity: 0` → default (SplitText is free as of GSAP 3.13)
   - Role line: custom typewriter effect (JetBrains Mono)
   - Two divider lines: clip-path draw-in animation

5. `HeroHUD.tsx` — Top-right status widget
   - `SYS_STATUS: ONLINE`
   - Live time + date in JetBrains Mono
   - HUD corner brackets (SVG)

6. `ParticleRunner.tsx` — Transition between Hero and About
   - Humanoid particle figure: 2,000 points in BufferGeometry
   - Point positions forming a running silhouette (pre-computed coordinates array)
   - GSAP ScrollTrigger scrub: x-position driven by scroll progress
   - On exit (scroll 100%): particle scatter animation, opacity fade

**PHASE 2 CHECKPOINT:** Hero renders correctly. Loading sequence plays. Audio boots. Particles respond to mouse. Scroll triggers runner.

---

### PHASE 3 — About & Skills

1. `AboutPanel.tsx`
   - CSS Grid: 40%/60% split (single column on mobile)
   - Photo: `PhotoShader.tsx` (R3F ShaderMaterial with scan-line GLSL)
   - HUD corner brackets on photo frame (SVG positioned absolutely)
   - Blinking `STATUS: ACTIVE` indicator
   - Data rows type in on scroll entrance (GSAP + stagger)

2. `SkillOrrery.tsx`
   - R3F scene, isolated canvas
   - Central sphere: `SphereGeometry`, emissive material, bloom via `@react-three/postprocessing`
   - 4 orbit rings at different inclinations: `RingGeometry`, rotation animation via `useFrame`
   - Skill pods: `RoundedBoxGeometry` from Drei, custom panel material
   - Hover: `onPointerEnter` → GSAP scale up pod, child tech nodes float out
   - Camera: `OrbitControls` with damping, auto-rotate when idle

---

### PHASE 4 — Projects (8 scenes)

**Gallery architecture:**
- **Desktop (≥768px):** GSAP ScrollTrigger pinned section with horizontal translate — 8 cards scroll-jacked across the viewport. Pin spacing equal to total horizontal width.
- **Mobile (<768px):** Vertical pinned-stack — each card pins for one viewport-height of scroll, then unpins to the next.
- **R3F mounting:** IntersectionObserver-gated. **Only the in-view card's Canvas is mounted**; off-screen cards show a static PNG poster from `public/posters/`. Mobile shows posters only — no R3F.
- **Posters:** Each Codex-built scene must export a 1200×900 PNG snapshot of the final scene state, committed to `public/posters/<scene-id>.png`.

For EACH project card:

**Template structure** (`ProjectCard.tsx`):
```tsx
<div className="project-card">
  <div className="project-scene">
    <Suspense fallback={<SceneSkeleton />}>
      <Canvas>{/* project-specific scene */}</Canvas>
    </Suspense>
  </div>
  <div className="project-meta">
    <span className="project-id font-mono">PROJECT_0X.XX</span>
    <h3 className="font-orbitron">{project.name}</h3>
    <p className="font-mono text-sm">{project.description}</p>
    <div className="tech-tags">{project.stack.map(...)}</div>
    <div className="project-actions">
      <GlowButton href={project.github}>OPEN MISSION →</GlowButton>
      {project.live && <GlowButton href={project.live} variant="secondary">↗</GlowButton>}
    </div>
  </div>
</div>
```

**Each project scene in `/src/components/projects/scenes/`:**
- `CDASScene.tsx` — Mexico outline + particle hotspots (see DESIGN.md 4.1)
- `FaultmapScene.tsx` — LLM embedding constellation (see DESIGN.md 4.2)
- `PharmacyScene.tsx` — Facility location optimization map (see DESIGN.md 4.3)
- `PipelineScene.tsx` — Data flow pipeline visualization (see DESIGN.md 4.4)
- `InsuLinkScene.tsx` — Patient-doctor network graph (see DESIGN.md 4.5)
- `GeneticScene.tsx` — GA curve fitting animation (see DESIGN.md 4.6)
- `WordleScene.tsx` — Decision tree pruning (see DESIGN.md 4.7)
- `OptionsScene.tsx` — Volatility surface + terminal (see DESIGN.md 4.8)

**Rule for all scenes:** Use `THREE.InstancedMesh` never individual `Mesh`. Dispose on unmount. Lazy-load via Suspense.

---

### PHASE 5 — Experience, Labs, Contact

1. `MissionLog.tsx` — Animated timeline (DESIGN.md Section 5)
2. `SystemMonitor.tsx` — Live data dashboard
   - `useGitHubStats.ts` hook: fetch public GitHub GraphQL for username: **`gabonavarroo`** (two r, two o), no auth needed for public data
   - `useWeather.ts` hook: OpenWeatherMap API, Mexico City (lat: 19.43, lon: -99.13)
   - "System Fuel" gauge: time-based formula, animated with CSS
3. `TransmissionPanel.tsx` — Terminal contact form with EmailJS

---

### PHASE 6 — Polish, Performance, Deploy

1. Add GSAP ScrollTrigger entrance to every section (fade + translate from direction)
2. Verify custom cursor state changes (default → hover → text)
3. Mobile breakpoint: disable all R3F canvases, use static fallbacks
4. Run Playwright MCP: screenshot all sections at 1280px and 375px
5. Bundle analysis: `npm run build -- --analyze`. Fix any chunk > 150KB gzipped (matches the verification table below).
6. Create GitHub Actions workflow for auto-deploy to GitHub Pages

---

## COMPONENT RULES

### Every component must:
1. Have full TypeScript types — no implicit `any`
2. Import `useEffect` cleanup for GSAP contexts:
   ```tsx
   useEffect(() => {
     const ctx = gsap.context(() => { /* animations */ }, ref);
     return () => ctx.revert();
   }, []);
   ```
3. Use CSS variables for ALL colors — never hardcode hex values
4. Have a `data-section` attribute for ScrollTrigger targeting
5. Handle loading/error states for any async data

### R3F / Three.js rules:
```tsx
// ALWAYS dispose on unmount
useEffect(() => {
  return () => {
    geometry.dispose();
    material.dispose();
    texture?.dispose();
  };
}, []);

// Use THREE.Points for dot-particle clouds (BufferGeometry + PointsMaterial / ShaderMaterial)
//   ↳ Hero particle cloud, ParticleRunner, FaultmapScene constellation, etc.
const points = new THREE.Points(bufferGeometry, pointsMaterial);

// Use THREE.InstancedMesh ONLY for repeated 3D meshes
//   ↳ Skill orrery pods, TechStack3D logos, AtomLoader orbital nodes
const mesh = new THREE.InstancedMesh(geometry, material, count);
// Do NOT conflate the two — Points is for dots, InstancedMesh is for repeated solids.

// ALWAYS check device capability before heavy scenes
const isLowEnd = navigator.hardwareConcurrency <= 4 ||
                 !navigator.gpu; // WebGPU check
```

### GSAP rules:
```tsx
// ALWAYS register plugins at module level
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
gsap.registerPlugin(ScrollTrigger, SplitText);

// ALWAYS use contexts in React
const ctx = gsap.context(() => {
  // all animations here
}, containerRef);

// Standard entrance animation:
gsap.fromTo(element, 
  { opacity: 0, y: 40 },
  { opacity: 1, y: 0, duration: 0.8, ease: 'expo.out', 
    scrollTrigger: { trigger: element, start: 'top 80%' }
  }
);
```

---

## DESIGN SYSTEM ENFORCEMENT

### Fonts — always via Tailwind classes:
```
font-orbitron → Orbitron (display headings)
font-mono     → JetBrains Mono (everything else)
```

### Color — always via CSS variables:
```tsx
// ✅ Correct
className="text-[var(--cyan-pure)]"
style={{ color: 'var(--cyan-pure)' }}

// ❌ Wrong
className="text-cyan-400"  // Tailwind color names not mapped to our system
style={{ color: '#00D4FF' }}
```

### HUD Panel pattern — reuse `HUDFrame.tsx`:
```tsx
<HUDFrame label="SECTION.LABEL" status="ACTIVE">
  {children}
</HUDFrame>
```
`HUDFrame` applies: border, corner brackets, top label, status indicator.

### Spacing scale:
```
All spacing in multiples of 4px via Tailwind.
Section padding: py-32 (128px) desktop / py-16 (64px) mobile
Content max-width: max-w-7xl centered
Panel internal padding: p-6 (24px)
```

---

## DO NOT / FORBIDDEN PATTERNS

```
❌ White or light backgrounds anywhere
❌ Purple gradients (the #8B5CF6 / violet aesthetic)
❌ Inter, Roboto, or system fonts visible in UI
❌ Generic card grids (Bootstrap-style rows of equal cards)
❌ Placeholder content — always use real data from /src/data/
❌ CSS animations for anything GSAP should handle
❌ Nested Three.js canvases (one global FBM canvas, isolated canvases per section)
❌ Console.log in production code
❌ useEffect without cleanup for subscriptions/animations
❌ Any MUI, Chakra, Radix component
❌ next/image with remote optimization (GitHub Pages incompatible)
❌ Hard-coded strings outside data files
```

---

## MCP SERVER USAGE

**GitHub MCP:** Use for all git operations. Never run git commands manually.
```
- Create commits after each phase completion
- Use conventional commits: feat(hero): add particle explosion scene
- Create feature branches: feat/loading-screen, feat/hero, feat/projects
```

**Playwright MCP:** Run after Phase 2 and Phase 6.
```
- Screenshot hero at 1280x900
- Screenshot at 375x812 (mobile)  
- Verify all animations trigger (use page.evaluate to check GSAP timeline states)
- Check console for Three.js warnings and dispose errors
```

**Magic UI MCP:** Check before building any UI component.
```
- "Do you have a text reveal animation component?"
- "Is there a glowing button component?"
- "Do you have a marquee/ticker component?"
Use if available. Build custom only if not.
```

**Figma MCP:** If a Figma file is provided with design mockups, extract exact tokens before building.

---

## QUALITY CHECKPOINTS

After each phase, verify:

| Check | Tool | Pass Criteria |
|---|---|---|
| TypeScript | `npx tsc --noEmit` | Zero errors |
| Build | `npm run build` | Successful static export |
| Bundle size | Build output | No single chunk > 150KB gzipped |
| Three.js leaks | Browser DevTools | No "Cannot set properties on disposed object" |
| Animation performance | Chrome Performance tab | 60fps, no janks |
| Mobile layout | Playwright 375px | No overflow, no broken layout |
| Accessibility | axe-core via Playwright | Zero critical violations |

---

## COMMUNICATION PROTOCOL

When you complete a phase:
```
✅ PHASE X COMPLETE
Built: [list of components created]
Tests: [Playwright results summary]  
Issues: [any known limitations]
Next: [first task of next phase]
```

When you hit a blocker:
```
🔴 BLOCKER: [description]
Attempted: [what you tried]
Options: [2-3 possible solutions]
Recommendation: [which one and why]
```

When asking for clarification:
```
❓ CLARIFICATION NEEDED
Decision: [what needs deciding]
Context: [why it matters]
Options: A) ... B) ... C) ...
```

---

## LAUNCH SEQUENCE

Once all phases complete, run this final deploy:

```bash
# 1. Final build
npm run build

# 2. Verify /out directory
ls -la out/

# 3. Create deploy workflow (via GitHub MCP)
# .github/workflows/deploy.yml
# Triggers on push to main
# Uses actions/deploy-pages@v4

# 4. Push and verify deployment
```

**GitHub Pages URL pattern:** `https://[username].github.io/[repo-name]`
**Custom domain:** Add CNAME file with custom domain if applicable.

---

*CLAUDE.md — End. Begin with PHASE 1 immediately. Read DESIGN.md before any pixel.*