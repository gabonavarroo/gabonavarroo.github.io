# DESIGN.md — Gabriel Navarro Portfolio
## Visual Design System & Interaction Bible
> Version 1.0 | May 2026 | Source of truth for all aesthetic and interaction decisions.
> This document supersedes any agent default. Every decision here is final. Do not deviate.

---

## 1. CONCEPT STATEMENT

This portfolio is not a website. It is an **interactive command interface** — as if J.A.R.V.I.S. (Tony Stark's AI) were presenting the operator's dossier to a visitor who just gained clearance. The visitor is recruited, not browsed. Every section feels like accessing a classified system. Content is revealed through cinematic sequences, not scrolled through like a feed.

**One-sentence design mandate:**
> "A retro-futuristic HUD narrative — military precision, cinematic motion, no compromises with generic."

**Anti-patterns to never reproduce:**
- Purple gradient + glass card + Inter/Space Grotesk = instant reject
- White or near-white backgrounds anywhere
- Static hero with a headshot and bullet points
- Generic timeline with dots and lines
- Shadcn/Chakra/MUI component defaults
- Any AI-portfolio-kit aesthetic

---

## 2. COLOR SYSTEM

### Base Palette

| Token | Hex | Usage |
|---|---|---|
| `--bg-void` | `#05080F` | Deepest background — pure void |
| `--bg-base` | `#080C14` | Primary page background (deep carbon + blue tint) |
| `--bg-surface` | `#0D1520` | Panel/card surfaces |
| `--bg-raised` | `#111B2C` | Elevated components, modals |
| `--bg-overlay` | `#162035` | Hover states, overlays |
| `--border-dim` | `#1A2840` | Subtle HUD grid lines |
| `--border-med` | `#1E3050` | Panel borders |
| `--border-bright` | `#264060` | Active/focused borders |

### Accent Palette (Cyan HUD)

| Token | Hex | Usage |
|---|---|---|
| `--cyan-pure` | `#00D4FF` | Primary accent, glows, highlights |
| `--cyan-dim` | `#007A99` | Secondary states, muted accents |
| `--cyan-ghost` | `#00D4FF18` | Background tints, fills |
| `--cyan-glow` | `#00D4FF40` | Box shadows, bloom effects |
| `--blue-deep` | `#0066CC` | Secondary accent |
| `--blue-electric` | `#2288FF` | Alternative highlight |

### Status & Data Colors

| Token | Hex | Usage |
|---|---|---|
| `--alert-amber` | `#FF8C00` | Amber alert / warning contexts |
| `--alert-red` | `#FF3333` | Critical / error states |
| `--system-green` | `#00FF88` | System OK / active indicators |
| `--data-gold` | `#FFCC44` | Financial / data highlight |
| `--bio-teal` | `#00CCAA` | Health/Insulink contexts |
| `--geo-orange` | `#FF6B35` | Geospatial / map hotspots |

### Typography Colors

| Token | Hex | Usage |
|---|---|---|
| `--text-primary` | `#E2E8F0` | Main body text |
| `--text-secondary` | `#8BA3C0` | Subtext, labels |
| `--text-muted` | `#4A6080` | Timestamps, metadata |
| `--text-accent` | `#00D4FF` | Highlighted terms |
| `--text-code` | `#A8D4FF` | Inline code, monospace labels |

### Glow / Bloom Effects
All glowing elements use layered `box-shadow` or CSS `filter: drop-shadow`:
```css
/* Standard HUD glow */
box-shadow: 0 0 8px var(--cyan-glow), 0 0 24px var(--cyan-ghost), 0 0 48px #00D4FF0A;

/* Intense active glow */
box-shadow: 0 0 4px var(--cyan-pure), 0 0 16px var(--cyan-glow), 0 0 40px var(--cyan-ghost);

/* Subtle ambient */
box-shadow: 0 0 20px var(--cyan-ghost);
```

---

## 3. TYPOGRAPHY SYSTEM

### Font Stack

```css
/* Display — Loud, futuristic, JARVIS-aligned */
--font-display: 'Orbitron', sans-serif;

/* Body / UI — Legible, techy, monospaced */
--font-mono: 'JetBrains Mono', 'Fira Code', monospace;

/* Fallback system */
--font-system: system-ui, -apple-system, sans-serif;
```

**Loading:** Both fonts from Google Fonts via `next/font/google`. **Orbitron** for all display headings (name, section titles, large numerals). **JetBrains Mono** for everything else — labels, body copy, data, code snippets, navigation. Space Grotesk and Rajdhani are explicitly forbidden (anti-pattern per §1).

### Type Scale

| Role | Font | Size | Weight | Letter-spacing | Usage |
|---|---|---|---|---|---|
| `display-hero` | Orbitron | clamp(48px, 8vw, 96px) | 900 | 0.05em | Name on hero |
| `display-xl`   | Orbitron | clamp(32px, 5vw, 64px) | 700 | 0.04em | Section titles |
| `display-lg`   | Orbitron | clamp(20px, 3vw, 40px) | 600 | 0.03em | Subsection titles |
| `ui-label` | JetBrains Mono | 11px | 500 | 0.12em | HUD labels, ALL CAPS |
| `ui-body` | JetBrains Mono | 14px | 400 | 0.02em | Body text |
| `ui-data` | JetBrains Mono | 13px | 600 | 0.05em | Numbers, metrics |
| `ui-code` | JetBrains Mono | 12px | 400 | 0em | Code snippets |
| `ui-micro` | JetBrains Mono | 10px | 400 | 0.08em | Timestamps, footnotes |

### Typography Rules
- HUD labels are always `text-transform: uppercase` with `letter-spacing: 0.12em`
- Never use Inter, Space Grotesk, Rajdhani, Roboto, or system fonts as visible UI text — Orbitron and JetBrains Mono only
- Kinetic text (name, hero statement) uses staggered character reveal (GSAP SplitText, free as of GSAP 3.13)
- Numbers in data widgets use tabular numerals: `font-variant-numeric: tabular-nums`

---

## 4. MOTION SYSTEM

### Motion Philosophy
Motion is **narrative**, not decoration. Every animation has a reason: revealing information, guiding attention, or giving physical feedback. No looping animations without purpose. No transitions under 200ms for major content.

### Easing Curves

```javascript
// Primary ease — cinematic, intentional
const EASE_OUT_EXPO = 'expo.out'; // GSAP

// Entrance — dramatic reveal
const EASE_CIRC_OUT = 'circ.out';

// Micro-interactions — snappy
const EASE_BACK_OUT = 'back.out(1.7)';

// Floating / breathing — organic
const EASE_SINE = 'sine.inOut';

// CSS equivalents
--ease-expo: cubic-bezier(0.16, 1, 0.3, 1);
--ease-circ: cubic-bezier(0, 0.55, 0.45, 1);
--ease-back: cubic-bezier(0.34, 1.56, 0.64, 1);
```

### Duration Scale

| Token | Value | Usage |
|---|---|---|
| `--dur-instant` | 80ms | Cursor, hover feedback |
| `--dur-fast` | 180ms | Micro-interactions, button states |
| `--dur-normal` | 400ms | Component transitions |
| `--dur-slow` | 800ms | Section entrances |
| `--dur-cinematic` | 1.2s–2.4s | Loading sequences, hero reveals |
| `--dur-epic` | 3s–6s | Scroll-driven narrative sequences |

### Scroll Architecture (GSAP ScrollTrigger)
- **Scrub factor:** 1.5 (smooth, cinema-like tracking)
- **Markers:** disabled in production
- **Pin spacing:** enabled for immersive sections
- **Snap points:** on major section boundaries

### Global Motion Rules
1. On page load, all elements start invisible (`opacity: 0`) and enter via timeline
2. Entrance animations are directional — content enters from the direction it "belongs" (top → hero, left → text, bottom → data)
3. Scroll-driven animations NEVER stutter — always precompute, never animate on main thread
4. Particle systems degrade gracefully: if `window.matchMedia('(prefers-reduced-motion)')` is true, freeze particles, keep CSS only
5. All GSAP timelines must be registered to a `gsap.context()` to avoid memory leaks in React

---

## 5. SECTION-BY-SECTION SPECIFICATION

### SECTION 0 — Loading Screen

**Duration:** 2.8–3.5 seconds | **Skippable:** No (too short) | **Transition:** Zoom-out dissolve

**Concept:** Tony Stark discovers a new element. The screen is pure void (`--bg-void`). At center, a single cyan dot materializes. It pulses once. Then: atom-ring geometry expands outward — three concentric orbit rings, each populated with 8–12 glowing nodes orbiting at different speeds. The rings scale from zero, staggered 200ms apart. On completion, the entire atom structure zooms toward the viewer (scale 1 → 8, opacity 1 → 0) revealing the hero behind it. An faint FBM shader fires up on the background simultaneously.

**Implementation:**
- Pure Three.js / R3F scene
- Orbiting nodes: `THREE.Points` with `BufferGeometry`, custom GLSL vertex shader for orbit math
- Rings: `THREE.RingGeometry` with animated `dashOffset` (dashed orbital paths)
- Zoom-out: GSAP timeline: `camera.position.z` from 4 → 0.8, duration 1.2s, expo.in easing
- FBM background: GLSL fragment shader (see shader spec, Section 8)
- Simultaneously: first 2 seconds of JARVIS techy sound effects play (see Audio spec, Section 7)

**Data:**
```
center: [0, 0, 0]
rings: [radius: 1.2, 1.9, 2.8]
nodes per ring: [8, 10, 12]
orbit speed (rad/s): [0.8, 0.5, 0.3]
node size: 0.04
node color: #00D4FF
ring color: #00D4FF60 (dashed, 60% opacity)
```

---

### SECTION 1 — Hero

**Viewport:** 100vh, full-bleed | **Scroll:** pinned until hero sequence completes

**Concept:** After the atom zoom, the hero reveals. A massive particle explosion (Astrodither-style) — thousands of cyan particles burst outward from center toward the viewer, decelerating and settling into a turbulent cloud. Behind this, an FBM shader creates a slowly-morphing dark nebula texture. The name and role text materialize through the particle cloud.

**Layout:**
```
[top-left: nav/logo area] ............... [top-right: system status HUD]
.
.
     GABRIEL                              [particle cloud swirls here]
     NAVARRO
     ──────────────────────────
     DATA SCIENCE · COMPUTER ENGINEERING
     ──────────────────────────
     Building systems at the intersection
     of intelligence and infrastructure.
.
.
[bottom-left: scroll indicator]  [bottom-right: audio toggle + mute]
```

**Visual Elements:**
- **Background:** FBM GLSL shader (dark nebula, slow morphing, `--bg-base` tones)
- **Particle cloud:** 3,000 particles, Three.js PointCloud, mouse-reactive (repel on proximity)
- **Particle audio reactivity:** Web Audio API analyzer → particle velocity/spread driven by bass frequency
- **Name reveal:** GSAP SplitText, character by character, staggered 0.04s, from `y: 40, opacity: 0`
- **Role line:** Typewriter effect (JetBrains Mono), character reveal 0.03s each
- **Divider lines:** Draw-in left to right, `clip-path: inset(0 100% 0 0)` → `inset(0 0% 0 0)`
- **Top-right HUD widget:** Small panel showing `SYS_STATUS: ONLINE`, current time, current date — blinking cursor
- **Bottom scroll indicator:** Animated chevron + `[ SCROLL TO INITIALIZE ]` text

**Music trigger:** The moment loading screen dissolves and hero reveals, audio begins:
1. First ~2s: JARVIS techy mechanical UI sounds (beeps, lock-in, power-up) — Web Audio API synthesized, no file
2. Then: royalty-free instrumental theme (`/public/audio/main-theme.mp3`) fades in at 20% volume
3. Mute toggle (always visible, top-right corner): SVG speaker icon, smooth volume fade

**Custom Cursor:** Active from this point forward (see Section 6).

---

### SECTION 1.5 — Transition: Particle Runner

**Duration:** 1 full scroll unit (pinned section) | **Concept:** Razorpay Sprint-style

Between Hero and About: a particle human figure (humanoid silhouette made of ~2,000 cyan particles in `BufferGeometry`) runs from left edge to right edge across the screen. As it exits right, it dissolves into the background of the About section. The camera follows.

**Implementation:**
- Particle positions precomputed to form human silhouette (body keypoints from MediaPipe skeleton or manual coordinates)
- GSAP ScrollTrigger drives the x-position of the particle group
- On exit: particles scatter (velocity + time integration in GLSL), opacity fades
- Optional: running leg animation via morph between 4 pose keyframes using GSAP

**Audio cue:** Subtle footstep mechanical click on each stride cycle.

---

### SECTION 2 — About / HUD Dossier

**Concept:** A classified dossier panel — like opening a personnel file. Left side: a photo of Gabriel with a holographic scan-line overlay effect. Right side: structured HUD data panels.

**Layout (split: 40% / 60%):**
```
LEFT COLUMN:                    RIGHT COLUMN:
┌─────────────────┐            ┌──────────────────────────────┐
│  [PHOTO]        │            │  PERSONNEL.FILE: GN-2024     │
│  [scan lines]   │            │  ─────────────────────────── │
│  [corner HUD    │            │  OPERATIVES: Data Science     │
│   brackets]     │            │             Comp. Engineering │
│  [STATUS: ACTIVE│            │  BASE: ITAM · Mexico City     │
│   indicator]    │            │  CLEARANCE: Academic Excellence│
│                 │            │  ─────────────────────────── │
│                 │            │  [ brief bio paragraph ]      │
│                 │            │  ─────────────────────────── │
│                 │            │  LANGUAGES: Spanish · English  │
│                 │            │  INTERESTS: Running · Music    │
│                 │            │             Competitive Prog   │
└─────────────────┘            └──────────────────────────────┘
```

**Photo treatment:**
- Black & white / desaturated image with cyan color grading (`mix-blend-mode: color-dodge`)
- Animated scan-line overlay: CSS `repeating-linear-gradient` with vertical translate animation
- Corner HUD brackets: SVG `<line>` elements at each corner, animated draw-in
- Status dot: Blinking `--system-green` indicator

**Panel entrance:** Each data row types in with 0.03s/character delay, row by row, 0.3s apart.

---

### SECTION 3 — Skills / Orbital Interface

**Concept:** A 3D solar system of technology. A central glowing core (representing the operator's intelligence) with orbiting satellites — each one a skill category. Hovering a satellite expands it into a cluster of specific technologies.

**3D Structure:**
- Core: Glowing sphere, emissive cyan, slow rotation, bloom effect
- Orbits: 4 rings at different inclinations (not all on same plane)
- Skill pods: Rounded rectangular panels floating in orbit — like space stations
- Categories: `ML/AI`, `Data Engineering`, `Systems & Infra`, `Algorithms`, `Web & Full-Stack`
- On hover: pod expands, specific tools appear as child nodes floating around it
- Camera: Orbits slowly when idle; locks to focused pod on hover

**Skill pod color coding:**
- ML/AI → `--cyan-pure`
- Data Engineering → `--blue-electric`
- Systems & Infra → `--system-green`
- Algorithms → `--data-gold`
- Web/Full-Stack → `--bio-teal`

**HUD overlay:** Top-left corner shows `SKILL MATRIX LOADED` with a fill bar completing.

---

### SECTION 4 — Projects / Mission Archive

**Concept:** Eight mission cards, each with a unique 3D particle visualization representing its core concept. Cards are stacked in a side-scrollable or stacked-scroll gallery. Clicking a card expands it to full-screen detail view.

#### Project 4.1 — CDAS / Amber Alert Platform
**3D Visual:** Interactive particle map of Mexico. Country outline in `THREE.Line`, 32 states as glowing polygons. 70,000+ particles distributed geographically, slowly drifting/clustering. Hotspots pulse in `--geo-orange`. Mouse hover over a region shows state name + simulated case count. FUI label: `SYSTEM: BÚSQUEDA COLECTIVA NACIONAL | NODES: 70,847 | STATUS: ACTIVE`.

#### Project 4.2 — Faultmap (LLM Diagnostic Library)
**3D Visual:** A 3D constellation — hundreds of glowing nodes (each representing an LLM prompt embedding). Initial state: scattered, chaotic. On scroll: nodes cluster into tight groups (HDBSCAN visual metaphor). Cluster centroids glow brighter. Lines connect within clusters. FUI label: `FAILURE SLICE DETECTION | CLUSTERS: 12 | COVERAGE: 94.3%`.

#### Project 4.3 — Pharmacy Network Optimization
**3D Visual:** Simplified Mexico map (same as 4.1 but sparser). 200 candidate sites appear as dim dots. As user scrolls, the optimal P selected sites light up in `--system-green` sequentially, one by one. Coverage rings expand around each. FUI label: `P-MEDIAN SOLVED | SITES: 47 | COVERAGE ΔGAIN: +12%`.

#### Project 4.4 — E-Commerce Data Pipeline
**3D Visual:** A layered pipeline visualization. Three horizontal planes (like circuit board layers). Animated data packets (glowing cubes) flow through routes: `BOT DETECT → BYPASS → PROXY FALLBACK → DB`. Failed routes flash `--alert-red`, successful routes stay `--system-green`. FUI label: `AKAMAI BYPASS: ACTIVE | UPTIME: 99.7%`.

#### Project 4.5 — Insulink (Diabetes Care Platform)
**3D Visual:** A network graph — patients as nodes (blue), doctors as nodes (teal), connections represent bookings. Nodes pulse with heartbeat timing. Central hub glows. `+70 users` counter increments in real time on reveal. FUI label: `INSULINK PLATFORM | USERS: 70+ | CONSULTATIONS: ACTIVE`.

#### Project 4.6 — Genetic Algorithm CO₂ Estimation
**3D Visual:** A 3D curve-fitting animation. Axes float in space. Historical CO₂ data as scattered white particles. As user scrolls, the GA-fitted curve materializes (smooth cyan line threading through the data). Fit quality indicator: `R² = 0.95` fills up like a gauge. FUI label: `GA OPTIMIZER | GEN: 342 | CONVERGENCE: ✓`.

#### Project 4.7 — Wordle Optimization (Tournament 1st Place)
**3D Visual:** A glowing decision tree. Initial state: massive branching structure. As user scrolls, branches prune away with a `--alert-red` flash until a single optimal path remains highlighted in `--cyan-pure`. Trophy icon (minimal SVG) materializes at the end. FUI label: `ENTROPY-OPTIMAL | BRANCHING FACTOR: 2.3 | RANK: #1`.

#### Project 4.8 — Options Flow Monitor
**3D Visual:** Last card. Minimalist — a translucent floating terminal with scrolling data. Behind it, a 3D volatility surface (`THREE.PlaneGeometry` with perlin noise displacement). Surface shifts with mouse movement. FUI label: `LIVE OPTIONS FLOW | MARKET: SIMULATION | LATENCY: <50ms`.

**Card Design (non-expanded state):**
```
┌──────────────────────────────────────┐
│ [3D particle visual — 60% height]    │
├──────────────────────────────────────┤
│ PROJECT_04.02                        │
│ FAULTMAP                             │
│ LLM Diagnostic & Evaluation Library  │
│ ──────────────────────────────       │
│ Python · HuggingFace · PyTorch ····  │
│ [OPEN MISSION] →              [↗ GH] │
└──────────────────────────────────────┘
```

---

### SECTION 5 — Experience / Mission Log

**Concept:** A vertical timeline styled as a satellite mission log. Each entry is a classified file card.

**Timeline structure:**
- Vertical spine: A glowing line with data packets flowing downward (animated `stroke-dashoffset`)
- Entry cards: Appear on scroll via clip-path reveal, left-alternating layout
- Time markers: `[2024.Q3]` format in JetBrains Mono
- Entries:
  - CDAS Research Internship — ITAM (current)
  - ITAM Coding Rush Organizer
  - Academic Excellence Award — ITAM

**Entry card anatomy:**
```
[2024.Q3] ──●────────────────────────────────────
              │  ORG: ITAM · CDAS
              │  ROLE: Software Engineer Intern
              │  ─────────────────────────────────
              │  Nation-scale missing persons platform.
              │  70k+ records. Real-time scraping.
              │  Python · Kafka · Docker
              └────────────────────────────────────
```

---

### SECTION 6 — Labs / Systems Monitor

**Concept:** A real-time HUD dashboard — the most data-dense section. Split into sub-panels.

**Sub-panels:**

**6.1 — Live System Stats (Top row):**
- `[GITHUB COMMITS]` — Live GitHub API: total commits this year, contribution streak, top language
- `[MEXICO CITY WEATHER]` — OpenWeatherMap API: temp, condition, humidity with weather icon in FUI style
- `[SYSTEM FUEL]` — Playful gauge: coffee cups + Monster White cans consumed (estimated from time of day / session, animated jokingly)
- `[UPTIME]` — Time since page load, counting up in `HH:MM:SS`

**6.2 — Research Interests (Middle):**
- Floating tags: `LLM Evaluation`, `Causal Inference`, `Geospatial ML`, `Algorithmic Markets`, `Civic Tech`
- Tags orbit slowly in a 2D vortex (CSS transform + requestAnimationFrame)

**6.3 — Current Stack (Bottom):**
- Tech logos rendered as 3D spinning objects (low-poly, particle-dust style like igloo.inc)
- Each logo: Python, PyTorch, HuggingFace, Kafka, Docker, Next.js, PostgreSQL, MongoDB

**API calls:** All client-side. GitHub GraphQL API (public, no auth needed for public profile). OpenWeatherMap free tier.

---

### SECTION 7 — Contact / Transmission Terminal

**Concept:** A terminal-style contact panel — as if sending a message to JARVIS. Styled like a satellite uplink.

**Layout:**
```
ESTABLISH CONTACT ─────────────────────────────────────────────
SATELLITE: ONLINE | ENCRYPTION: AES-256 | LATENCY: 12ms

> RECIPIENT: gabriel.navarro@[domain]
> CHANNEL  : [select: EMAIL / LINKEDIN / GITHUB]
> MESSAGE  : █

[ INITIATE TRANSMISSION ] ──────────────────────────────── [↗]

─────────────────────────────────────────────────────────
SOCIAL LINKS: [GH] [LI] [TW] [📄 RESUME]
```

**Interaction:**
- Input fields look like terminal prompts with blinking cursor
- On "INITIATE TRANSMISSION" click: animation plays — screen flashes, scan-line sweeps, then `TRANSMISSION SENT. RESPONSE ETA: <24H` appears in green
- EmailJS handles the actual email sending (static-compatible)
- Social links styled as command buttons: `[GH]`, `[LI]` in HUD bracket style

---

## 6. CUSTOM CURSOR

**Design:** Not just a dot — a precision reticle.

```
Default state:
    ·  ─── outer ring (20px, 1px stroke, 30% opacity, --cyan-pure)
    ·  ─── inner dot (4px, filled, --cyan-pure)

Hover state (clickable elements):
    ·  ─── outer ring expands to 36px, opacity 100%, full glow
    ·  ─── inner dot expands to 6px
    ·  ─── `LOCK` label appears above reticle in JetBrains Mono 10px

Text selection state:
    ·  ─── outer ring collapses to 12px
    ·  ─── inner becomes I-beam shape

Drag state:
    ·  ─── cross-hair style (4 tick marks extending from center)
```

**Implementation:**
- Two `div` elements: `.cursor-outer` and `.cursor-inner`, `position: fixed`, `pointer-events: none`
- GSAP to follow mouse with lag: outer ring follows with 0.15s delay (lerp), inner dot follows at 0.05s
- CSS class toggling on `mouseenter` of interactive elements
- Hidden on touch devices (mobile)

---

## 7. AUDIO SYSTEM

### Tracks & Sequence

**Phase 1 — Boot sequence (loading screen, ~2.5s):**
- JARVIS techy mechanical sounds: digital beeps, power-up hums, lock-in clicks
- Source: Web Audio API synthesized OR pre-recorded sfx file (reference: YouTube `zZ0tYNEv0cQ` first 2s before "I am Jarvis")
- These should feel like a system initializing — not a music track

**Phase 2 — Main theme (hero + rest of site):**
- **Royalty-free / CC0 instrumental** with guitar/punk-rock energy (sourcing tracked in `assets-checklist.md`). Asset path: `/public/audio/main-theme.mp3`. Reference vibe: clean electric guitar riff, mid-tempo, no vocals.
- Fade in over 1.5s at 20% volume from load completion
- Loops gracefully (crossfade last 2s with first 2s)
- Volume: 20% default
- **Copyrighted tracks (e.g., The Clash) are forbidden** — public hosting on GitHub Pages would constitute infringement.

**UI Sound Effects (throughout site):**
- Button hover: soft `tick` (4kHz, 20ms, -30dB)
- Button click: mechanical `click` (2kHz, 30ms, -25dB)
- Card open: swipe/whoosh sound
- Terminal input: key tap sound (light mechanical)
- Section transition: brief resonant hum
- All synthesized via Web Audio API (no external files needed except main music track)

### Audio Controls
- **Mute toggle:** Always visible (top-right corner of every section header)
- **SVG icon:** Speaker-with-waves (active) / Speaker-crossed (muted)
- **Animation:** Smooth volume fade (0.5s) on toggle
- **LocalStorage:** Persists mute preference across sessions
- **Default:** UNMUTED (brave choice, but this is a portfolio not an app)

### Audio Reactivity (Web Audio API Analyzer)
```javascript
// Analyzer configuration
const analyser = audioCtx.createAnalyser();
analyser.fftSize = 256; // 128 bins
const frequencies = new Uint8Array(analyser.frequencyBinCount);

// Every frame:
analyser.getByteFrequencyData(frequencies);
const bass = average(frequencies.slice(0, 10));   // 0–300 Hz
const mid  = average(frequencies.slice(10, 50));  // 300Hz–2kHz
const high = average(frequencies.slice(50, 128)); // 2kHz+

// Drive:
particleVelocityMultiplier = 1 + (bass / 128) * 2.5;
particleSpreadRadius = baseRadius + (mid / 128) * 60;
glowIntensity = 0.3 + (high / 128) * 0.7;
```

**What reacts to audio:**
- Hero particle cloud: velocity and spread (bass-driven)
- FBM shader: turbulence speed (mid-driven)
- HUD border glow intensity: overall level
- Section number counter: subtly pulses with beat

---

## 8. SHADER SPECIFICATIONS (GLSL)

### 8.1 — FBM Background Shader (Persistent)

```glsl
// Fractional Brownian Motion — applied to full-screen background plane
// Creates organic, slowly-morphing dark nebula texture

uniform float u_time;
uniform float u_audio_mid; // 0.0 - 1.0, driven by audio analyzer
uniform vec2 u_resolution;

// Noise function (value noise)
float hash(vec2 p) { ... }
float noise(vec2 p) { ... }

// 5-octave FBM
float fbm(vec2 p) {
  float value = 0.0;
  float amplitude = 0.5;
  float frequency = 1.0;
  for(int i = 0; i < 5; i++) {
    value += amplitude * noise(p * frequency);
    amplitude *= 0.5;
    frequency *= 2.1;
  }
  return value;
}

void main() {
  vec2 uv = gl_FragCoord.xy / u_resolution;
  float t = u_time * 0.08 + u_audio_mid * 0.3;

  float f = fbm(uv * 2.5 + vec2(t, t * 0.7));
  f = fbm(uv * 2.0 + vec2(f + t, f + t * 0.5));

  // Map to dark blue-carbon range
  vec3 col = mix(
    vec3(0.02, 0.04, 0.08),  // --bg-void
    vec3(0.05, 0.09, 0.16),  // --bg-surface
    clamp(f * 1.2, 0.0, 1.0)
  );

  // Add subtle cyan traces
  float trace = smoothstep(0.58, 0.62, f);
  col += vec3(0.0, 0.4, 0.6) * trace * 0.15;

  gl_FragColor = vec4(col, 1.0);
}
```

### 8.2 — Name Distortion Shader (Hero Hover)

```glsl
// Applied to a canvas/texture behind the name text
// On mouse hover: warps the background around the letters

uniform vec2 u_mouse;    // normalized mouse position
uniform float u_hover;  // 0.0 - 1.0 hover state
uniform sampler2D u_texture;
uniform vec2 u_resolution;

void main() {
  vec2 uv = gl_FragCoord.xy / u_resolution;
  vec2 mouse = u_mouse;

  float dist = distance(uv, mouse);
  float strength = u_hover * 0.04 / (dist * dist + 0.01);
  strength = clamp(strength, 0.0, 0.08);

  vec2 displaced = uv + normalize(uv - mouse) * strength;
  vec4 col = texture2D(u_texture, displaced);

  // Chromatic aberration on distortion peak
  float r = texture2D(u_texture, displaced + vec2(0.002, 0.0) * u_hover).r;
  float b = texture2D(u_texture, displaced - vec2(0.002, 0.0) * u_hover).b;
  col.r = r;
  col.b = b;

  gl_FragColor = col;
}
```

### 8.3 — Scan-line Overlay Shader (Photo treatment)

```glsl
// Applied over the About section photo
uniform float u_time;
uniform sampler2D u_photo;

void main() {
  vec2 uv = vUv;

  // Desaturate photo
  vec4 photo = texture2D(u_photo, uv);
  float lum = dot(photo.rgb, vec3(0.299, 0.587, 0.114));
  vec3 grey = vec3(lum);

  // Cyan color grade
  vec3 graded = mix(grey, vec3(0.0, 0.83, 1.0), 0.25);

  // Scan lines (horizontal bands moving down)
  float scanline = step(0.5, fract(uv.y * 80.0 - u_time * 0.2));
  graded *= 0.88 + scanline * 0.12;

  // Vignette
  vec2 center = uv - 0.5;
  float vignette = 1.0 - dot(center, center) * 1.5;
  graded *= vignette;

  gl_FragColor = vec4(graded, photo.a);
}
```

---

## 9. HUD DESIGN LANGUAGE

### Structural Elements
All panels, cards, and data widgets share a common HUD vocabulary:

**Corner brackets (SVG):**
```svg
<!-- Top-left bracket -->
<path d="M 0 16 L 0 0 L 16 0" fill="none" stroke="var(--cyan-pure)" stroke-width="1.5"/>
<!-- Repeat for all 4 corners, rotated -->
```

**Panel border style:**
```css
border: 1px solid var(--border-med);
border-top: 1px solid var(--cyan-dim);
position: relative;
/* After pseudo-element: top-left dot accent */
&::before {
  content: '';
  position: absolute;
  top: -1px;
  left: -1px;
  width: 4px;
  height: 4px;
  background: var(--cyan-pure);
}
```

**Data row pattern:**
```
LABEL ·············· VALUE
```
The dots between label and value: `letter-spacing: 0.05em`, color `--text-muted`.

**Blinking cursor:**
```css
.cursor-blink::after {
  content: '█';
  animation: blink 1.1s step-end infinite;
  color: var(--cyan-pure);
}
```

**Status indicator dot:**
```css
.status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--system-green);
  box-shadow: 0 0 6px var(--system-green);
  animation: pulse 2s ease-in-out infinite;
}
```

---

## 10. RESPONSIVE & PERFORMANCE RULES

### Breakpoints
```css
--bp-mobile: 375px;
--bp-tablet: 768px;
--bp-desktop: 1280px;
--bp-wide: 1600px;
```

### Mobile Strategy (< 768px)
- **Disable:** All Three.js scenes (replaced by static screenshots or CSS-only 2D representations)
- **Disable:** FBM background shader (replaced by CSS gradient)
- **Disable:** Custom cursor (default system cursor)
- **Keep:** GSAP scroll animations (reduced complexity)
- **Keep:** Audio system (muted by default on mobile)
- **Keep:** All content, layout adapts to single-column
- Particle runner section: replaced by simple CSS animated line

### Performance Targets
| Metric | Desktop | Mobile |
|---|---|---|
| LCP | < 2.5s | < 3.5s |
| FID | < 100ms | < 200ms |
| CLS | < 0.1 | < 0.1 |
| FPS (animation) | 60fps | — |
| Initial JS bundle | < 300KB gzipped | < 150KB |

### Three.js Optimization
- Use `THREE.InstancedMesh` for all particle systems (never individual `Mesh`)
- Dispose geometries and materials on section unmount
- Use `useFrame` throttling: non-visible canvases run at 10fps, active at 60fps
- Prefer `float16` textures over `float32` where precision allows
- Max particles: 3,000 desktop / disabled mobile

---

## 11. GITHUB PAGES COMPATIBILITY

### Static Export Requirements
- `next.config.js`: `output: 'export'`, `basePath: ''` (this is a **user site** at `gabonavarro.github.io` apex — no subpath needed)
- All asset paths: relative, not absolute
- No `next/image` with optimization — use `<img>` with manual loading
- No API routes — all data fetching client-side
- `404.html` hack for SPA routing on GitHub Pages (only if we add hash-route navigation later)
- `CNAME` file only if a custom domain is added (none planned at launch)

### External Service Dependencies (all free tier)
| Service | Purpose | Limits |
|---|---|---|
| GitHub GraphQL API | Commit stats, contribution data | 60 req/hr unauthenticated |
| OpenWeatherMap API | Mexico City weather | 1,000 req/day |
| EmailJS | Contact form | 200 emails/month |
| ElevenLabs / WebSpeechAPI | TTS for JARVIS (future) | Browser native = free |
| Vercel Edge Functions | API key proxy (future Jarvis) | 100k invocations/month |

---

## 12. FILE STRUCTURE

```
/
├── public/
│   ├── audio/
│   │   └── main-theme.mp3           # Royalty-free instrumental main theme (boot SFX synthesized)
│   ├── posters/                     # Static PNG fallbacks for the 8 project scenes (mobile + low-power)
│   └── images/
│       ├── gabriel-photo.jpg        # For About section
│       ├── favicon.svg              # Cyan reticle favicon
│       └── og-image.png             # Social preview (1200x630)
├── src/
│   ├── app/
│   │   ├── layout.tsx               # Root layout, font loading, cursor
│   │   ├── page.tsx                 # Main page, section orchestration
│   │   └── globals.css              # CSS variables, global resets
│   ├── components/
│   │   ├── loading/
│   │   │   └── AtomLoader.tsx       # Section 0: Tony Stark atom scene
│   │   ├── hero/
│   │   │   ├── HeroScene.tsx        # R3F canvas: particles + FBM
│   │   │   ├── HeroText.tsx         # Name reveal, typewriter
│   │   │   └── HeroHUD.tsx          # Top-right status widget
│   │   ├── transitions/
│   │   │   └── ParticleRunner.tsx   # Section 1.5: Running figure
│   │   ├── about/
│   │   │   ├── AboutPanel.tsx       # Dossier layout
│   │   │   └── PhotoShader.tsx      # Scan-line photo treatment
│   │   ├── skills/
│   │   │   └── SkillOrrery.tsx      # 3D orbital skill system
│   │   ├── projects/
│   │   │   ├── ProjectGallery.tsx   # Gallery container
│   │   │   ├── ProjectCard.tsx      # Individual card template
│   │   │   └── scenes/              # One file per project 3D scene
│   │   │       ├── CDASScene.tsx
│   │   │       ├── FaultmapScene.tsx
│   │   │       ├── PharmacyScene.tsx
│   │   │       ├── PipelineScene.tsx
│   │   │       ├── InsuLinkScene.tsx
│   │   │       ├── GeneticScene.tsx
│   │   │       ├── WordleScene.tsx
│   │   │       └── OptionsScene.tsx
│   │   ├── experience/
│   │   │   └── MissionLog.tsx       # Timeline
│   │   ├── labs/
│   │   │   ├── SystemMonitor.tsx    # Live stats dashboard
│   │   │   └── TechStack3D.tsx      # Spinning tech logos
│   │   ├── contact/
│   │   │   └── TransmissionPanel.tsx # Terminal contact form
│   │   └── ui/
│   │       ├── CustomCursor.tsx     # Global reticle cursor
│   │       ├── AudioController.tsx  # Audio engine + mute toggle
│   │       ├── HUDFrame.tsx         # Reusable panel with brackets
│   │       ├── GlowButton.tsx       # Styled interactive buttons
│   │       └── FBMBackground.tsx    # Global FBM shader canvas
│   ├── shaders/
│   │   ├── fbm.frag.glsl
│   │   ├── distortion.frag.glsl
│   │   └── scanline.frag.glsl
│   ├── hooks/
│   │   ├── useAudioAnalyzer.ts      # Web Audio API hook
│   │   ├── useGitHubStats.ts        # GitHub API fetch hook
│   │   └── useWeather.ts            # OpenWeatherMap hook
│   ├── data/
│   │   ├── projects.ts              # All project data
│   │   ├── experience.ts            # Experience timeline data
│   │   └── skills.ts                # Skills & categories data
│   └── lib/
│       ├── gsap.ts                  # GSAP init + ScrollTrigger register
│       └── audio.ts                 # Audio engine singleton
├── DESIGN.md                        # This file
├── CLAUDE.md                        # Agent instructions
├── AGENTS.md                        # Multi-agent orchestration
└── next.config.js
```

---

## 13. CONTENT DATA

### Personal Info
```typescript
export const OPERATOR = {
  name: "Gabriel Navarro",
  handle: "GN-2024",
  role: "Data Science · Computer Engineering",
  institution: "ITAM — Instituto Tecnológico Autónomo de México",
  location: "Mexico City, MX",
  clearance: "Academic Excellence Award",
  languages: ["Spanish (Native)", "English (Professional)"],
  statement: "Building systems at the intersection of intelligence and infrastructure.",
  email: "gabriel.navarrocr@gmail.com",
  github: "gabonavarroo",
  linkedin: "www.linkedin.com/in/gabrielnavarroceron",
};
```

Performance & Fallbacks
* **Low Power Mode Toggle:** Include a toggle to disable the heavy R3F WebGL elements and Web Audio visualizers for older devices, falling back to sleek CSS animations and kinetic typography.

### All content data lives in `/src/data/*.ts` — never hard-coded in components.

---

*DESIGN.md — End of Document. All decisions are final. Claude Code and all agents must treat this as the single source of truth.*