# Phase 2 — Loading & Hero

> **Owners (split):** Claude Code + **Codex** (heavy R3F + GLSL) + **Gemini** (data) · **Estimated effort:** 2–3 sessions · **Prerequisites:** Phase 1 verification gate green.

## Context

Phase 2 is the highest-risk slice of the build because it sets the viewer's first impression. It comprises: the atom loader, the audio engine (with browser autoplay-unlock), the hero scene's R3F particle cloud + FBM nebula + audio reactivity, the hero DOM text reveal, the top-right HUD widget, and the ParticleRunner transition that bridges into Phase 3.

## Owners

| Component | Owner | Why |
|---|---|---|
| `AtomLoader.tsx` | **Codex** | Pure R3F geometry + precise GSAP timing; Codex can browser-verify the zoom-out frame. |
| `AudioController.tsx`, `useAudioAnalyzer.ts` | Claude Code | Web Audio API is plain JS — no shader/math heavy lifting, but needs the autoplay-unlock pattern (DOM gesture listener). |
| `fbm.frag.glsl` | **Codex** | DESIGN.md §8.1 |
| `distortion.frag.glsl` | **Codex** | DESIGN.md §8.2 |
| `HeroScene.tsx` (R3F) | **Codex** | 3,000-particle cloud, mouse repel, audio uniforms |
| `HeroText.tsx` | Claude Code | DOM + GSAP SplitText |
| `HeroHUD.tsx` | Claude Code | DOM, live-time tick |
| `runnerPoses.ts` | **Gemini** | Pre-compute 5 keyframe arrays of 2,000 humanoid silhouette points |
| `ParticleRunner.tsx` | **Codex** | R3F Points + GSAP ScrollTrigger scrub + scatter on exit |

## Sequenced sprints

### Sprint 2A — Audio engine (Claude Code) ✅ DONE (D9 — Spotify Embed)

`src/components/audio/AudioController.tsx`:
- React context exposing `{ play, mute, unmute, isMuted, spotifyPlaying, setSpotifyPlaying, getAnalyzerData }`.
- Lazy `AudioContext` creation on first user gesture (document `click` listener with `{ once: true }`).
- `GainNode` master + `AnalyserNode` (`fftSize: 256`) for synthesized boot SFX + UI SFX.
- **Main music:** streamed via Spotify Embed iFrame API (`spotify:track:39shmbIHICJ2Wxnk1fPSdz`). No local MP3 — see D9.
- Boot SFX (Phase 1 of audio per DESIGN.md §7) — synthesized with `OscillatorNode` chain: 3 short beeps + power-up sweep, total ~2s. Code in `src/lib/audio-boot.ts`.
- Mute toggle UI in top-right (sits next to HeroHUD); SVG speaker icons. Controls synthesized SFX only.
- Persist mute pref in `localStorage('audio-muted')`. Default unmuted (per DESIGN.md §7).
- **Spotify playback** controlled separately by `SpotifyMusicButton` (bottom-right corner). Pause/resume via `EmbedController.togglePlay()`.

`src/components/audio/SpotifyMusicButton.tsx` + `SpotifyEmbedController.tsx`:
- HUD-styled button in bottom-right corner. On click: loads Spotify iFrame API script, creates controller, calls `togglePlay()`.
- States: idle → loading → playing/paused → error (fallback link to Spotify track URL).
- Accessible: `aria-pressed`, keyboard-focusable, focus ring.

`src/lib/audio-beat-proxy.ts`:
- Deterministic synthetic beat proxy at 116 BPM (actual track BPM).
- Returns `{ bass, mid, high }` (0–1) using pulse envelopes at quarter/eighth/sixteenth note rates.
- When Spotify paused, values decay to 0 over ~400ms.
- Drives HeroScene particles, FBM shader, and HUD glow exactly like real analyzer data would.

`src/hooks/useAudioAnalyzer.ts`:
- Reads from controller's analyser on each `useFrame` tick.
- Returns `{ bass: number, mid: number, high: number }` normalized 0–1.
- Bands per DESIGN.md §7: bass = avg of bins 0–10, mid = bins 10–50, high = bins 50–128.
- When Spotify is playing, delegates to the synthetic beat proxy instead of the AnalyserNode.

### Sprint 2B — FBM background shader (Codex)

`src/shaders/fbm.frag.glsl` + `src/shaders/fbm.vert.glsl`:
- Implement DESIGN.md §8.1 verbatim (the noise-hash + 5-octave FBM + cyan-trace mapping).
- Uniforms: `u_time`, `u_audio_mid`, `u_resolution`.

Codex prompt template (drop in `handoffs/2026-XX-XX-fbm-shader.md`):
```
You are writing the FBM background shader for the global FBMBackground.tsx canvas.
Spec: DESIGN.md §8.1 (verbatim).
Stack: Three.js ShaderMaterial, R3F.
Uniforms: u_time (float), u_audio_mid (float, 0-1), u_resolution (vec2).
Verification: open localhost:3000, observe slow-morphing dark blue nebula with subtle cyan traces.
Browser-screenshot at 1280×900, attach to this handoff file.
```

Claude Code wires Codex's shader into `FBMBackground.tsx`, replacing the placeholder.

### Sprint 2C — AtomLoader (Codex)

`src/components/loading/AtomLoader.tsx`:
- Full-screen R3F overlay (`position: fixed; inset: 0; z-index: 100`).
- Three orbit rings (`THREE.RingGeometry`, dashed via `LineDashedMaterial`'s `dashOffset` animation).
- Orbiting nodes: **`THREE.InstancedMesh`** (per CLAUDE.md updated rule — these are 3D balls, not points). 8/10/12 nodes per ring per DESIGN.md §0 data block.
- GSAP timeline:
  1. Stagger ring reveal (200ms apart, scale 0→1, expo.out)
  2. Rings rotate at orbit speeds (0.8/0.5/0.3 rad/s)
  3. After 2.4s, camera.position.z animates 4 → 0.8, scene group scale 1 → 8, opacity 1 → 0 (1.2s, expo.in)
  4. `onComplete` calls `props.onComplete()` to dismount loader and start hero
- Triggers `AudioController.play()` boot SFX on first frame after first user gesture.

Codex screenshot deliverable: 1280×900 frame at t=1.5s (mid-orbit) and t=3.0s (zoom-out peak).

### Sprint 2D — HeroScene (Codex)

`src/components/hero/HeroScene.tsx`:
- R3F `<Canvas>` with `dpr={[1, 2]}`, `gl={{ antialias: true, powerPreference: 'high-performance' }}`.
- Children:
  - Full-screen plane with `fbm.frag.glsl` ShaderMaterial (we **don't** reuse the global FBMBackground here — hero has its own slightly more turbulent variant).
  - **`THREE.Points`** with `BufferGeometry` containing 3,000 vertex positions in a turbulent cloud distribution.
  - Custom `THREE.ShaderMaterial` for the points: cyan core + soft falloff + audio-driven size scaling.
- Mouse repel: every `useFrame`, compute distance from cursor (raycaster against an invisible plane at z=0); within 1.5 world-units radius, displace particles outward proportionally; restore via spring.
- Audio reactivity:
  - `bass` → particle spread radius multiplier (1 + bass×2.5)
  - `mid` → FBM `u_audio_mid` uniform (turbulence speed)
  - `high` → particle alpha intensity

### Sprint 2E — HeroText + HeroHUD (Claude Code)

`src/components/hero/HeroText.tsx`:
- Container with `position: absolute`, centered content per DESIGN.md §1 layout.
- Name in **Orbitron 900**, clamp(48px, 8vw, 96px), `--text-primary`.
  - On mount, `SplitText` splits into chars; GSAP staggers `y: 40 → 0`, `opacity: 0 → 1`, 0.04s per char, expo.out.
- Role line: typewriter effect via custom hook (`useTypewriter`). JetBrains Mono, 13px tracking 0.05em.
- Two divider lines: `clip-path: inset(0 100% 0 0)` → `inset(0 0 0 0)` over 0.6s with delay matching name reveal completion.
- Bottom indicator: `[ SCROLL TO INITIALIZE ]` + animated chevron (CSS keyframe).

`src/components/hero/HeroHUD.tsx`:
- Top-right widget. `HUDFrame` wrapper.
- Rows:
  - `SYS_STATUS: ONLINE` with `<StatusDot />`
  - Live `HH:MM:SS` (updates every second via `setInterval`, cleaned up on unmount)
  - Date `YYYY.MM.DD` (in JetBrains Mono ui-data style)
  - Blinking cursor terminator
- Audio mute toggle adjacent (lives in `HeroHUD` for now; hoisted in Phase 6 to a global header).

### Sprint 2F — ParticleRunner (Gemini → Codex)

**Gemini handoff** (`handoffs/2026-XX-XX-runner-poses.md`):
```
Generate src/data/runnerPoses.ts:
  export const RUNNER_POSES: { [keyframe: string]: [number, number, number][] } = {
    standing: [...],   // 2000 points
    stride1:  [...],
    sprint:   [...],
    stride2:  [...],
    recovery: [...],
  };
Each pose: ~2000 [x, y, z] coordinates in side-view, figure ≈2 units tall, centered at origin.
Distribute across head/torso/arms/legs (more density on torso).
Z-coordinate: small (≤0.1) variation for depth.
```

**Codex** then builds `src/components/transitions/ParticleRunner.tsx`:
- Imports `RUNNER_POSES`.
- `THREE.Points` with `BufferGeometry`. Per-frame, interpolate between 2 poses based on stride cycle phase (`Math.sin(t * stridFreq)`).
- Group `position.x` driven by GSAP ScrollTrigger scrub (`scrub: 1.5`), from `-viewportWidth/2` to `+viewportWidth/2` over 1 viewport-unit of scroll.
- Pin the section while runner crosses (ScrollTrigger pin, no spacer = false).
- On `progress >= 0.95`, scatter: each point `position += velocity * t`, `opacity -= 0.04 / frame`. Velocity is computed once as `normalize(point - figureCenter) * (8 + Math.random() * 4)`.
- Audio cue: subtle `tick` SFX on each stride peak (synthesized via `AudioController`).

## Verification gate

| Check | Pass |
|---|---|
| Atom loader plays | Codex screenshots at t=1.5s and t=3.0s match spec |
| Audio unlocks on first click | Console shows `AudioContext: running` |
| Mute toggle persists | Refresh → mute state preserved |
| Hero name reveals char-by-char | Visual + DOM nodes have inline transforms |
| Particles repel cursor | Move mouse → ring of empty space follows |
| Bass drives spread | Loud beat → particles visibly disperse |
| FBM `u_audio_mid` reacts | Quiet → slow swirl; loud → faster turbulence |
| ParticleRunner crosses on scroll | At 50% pin progress, figure is centered |
| Runner scatters at exit | Past 95%, particles spray outward |
| TypeScript | `npx tsc --noEmit` 0 errors |
| Build | `npm run build` clean |
| Playwright | Screenshots at 1280×900 + 375×812 stored in `handoffs/` |

## Exit criteria

- All component checks green; user has reviewed at least one Codex screenshot per scene and confirmed visual fidelity.
- `progress.md` Phase 2 box ticked; component checklist updated.
- Commit: `feat(hero): atom loader, audio, particle hero, runner transition`.
- Codex prompts for Phase 3 (PhotoShader, SkillOrrery) drafted in `handoffs/`.
