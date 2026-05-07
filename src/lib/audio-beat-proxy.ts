/**
 * Synthetic beat proxy for visual reactivity when Spotify is playing.
 *
 * Since Spotify's iFrame audio cannot be routed through the Web Audio API
 * AnalyserNode, this module generates deterministic, musically coherent
 * bass/mid/high values based on the track's known BPM.
 *
 * The output is subtle and musical — not random noise. It drives the same
 * visual reactivity channels (particle spread, FBM turbulence, glow intensity)
 * that would normally be fed by real audio analysis.
 *
 * @see decisions-log.md D9
 */

import { SPOTIFY_TRACK_BPM } from '@/data/audio';

/** Shape returned by the beat proxy — matches getAnalyzerData() output. */
export interface BeatProxyData {
  bass: number;
  mid: number;
  high: number;
}

// ── Internal constants ──────────────────────────────────────

const BPM = SPOTIFY_TRACK_BPM;
const BEAT_HZ = BPM / 60; // quarter-note frequency in Hz

/** Attack/decay envelope for the bass pulse — sharp onset, slow tail. */
function pulseEnvelope(phase: number): number {
  // phase is 0–1 within one beat cycle
  // Sharp attack in first 10%, exponential decay for the rest
  if (phase < 0.1) {
    return phase / 0.1; // ramp up
  }
  return Math.exp(-4.5 * (phase - 0.1)); // exponential decay
}

/** Soft sine shimmer for higher-frequency subdivisions. */
function shimmer(phase: number): number {
  // Smooth sine pulse, squared for sharper peaks
  const s = Math.sin(phase * Math.PI);
  return s * s;
}

// ── Decay state ─────────────────────────────────────────────

let lastActiveTime = 0;
let wasActive = false;

/**
 * Returns synthetic bass/mid/high values (0–1) based on elapsed time.
 *
 * @param elapsedMs - Time in milliseconds since a stable reference (e.g. performance.now() or Date.now() at mount).
 * @param active    - true when Spotify is playing, false when paused/stopped.
 */
export function getBeatProxyData(elapsedMs: number, active: boolean): BeatProxyData {
  if (active) {
    lastActiveTime = elapsedMs;
    wasActive = true;
  }

  // ── Decay when inactive ─────────────────────────────────
  if (!active) {
    if (!wasActive) {
      return { bass: 0, mid: 0, high: 0 };
    }
    const decayMs = elapsedMs - lastActiveTime;
    const decayFactor = Math.max(0, Math.exp(-decayMs / 400)); // ~400ms decay constant
    if (decayFactor < 0.005) {
      wasActive = false;
      return { bass: 0, mid: 0, high: 0 };
    }
    // Freeze at last active values and decay them
    const frozenBeat = computeActive(lastActiveTime);
    return {
      bass: frozenBeat.bass * decayFactor,
      mid: frozenBeat.mid * decayFactor,
      high: frozenBeat.high * decayFactor,
    };
  }

  return computeActive(elapsedMs);
}

/** Compute live beat values when actively playing. */
function computeActive(elapsedMs: number): BeatProxyData {
  const t = elapsedMs / 1000; // seconds

  // ── Bass: quarter-note pulse ─────────────────────────────
  const beatPhase = (t * BEAT_HZ) % 1;
  const bassRaw = pulseEnvelope(beatPhase);
  // Add subtle variation every 4 beats (bar-level dynamics)
  const barPhase = (t * BEAT_HZ / 4) % 1;
  const barAccent = 0.7 + 0.3 * shimmer(barPhase);
  const bass = Math.min(1, bassRaw * barAccent * 0.85);

  // ── Mid: 8th-note secondary pulse, offset phase ──────────
  const eighthPhase = (t * BEAT_HZ * 2) % 1;
  const midRaw = pulseEnvelope(eighthPhase) * 0.55;
  // Slight syncopation offset
  const syncopation = 0.8 + 0.2 * Math.sin(t * BEAT_HZ * Math.PI * 0.5);
  const mid = Math.min(1, midRaw * syncopation);

  // ── High: 16th-note shimmer, very subtle ─────────────────
  const sixteenthPhase = (t * BEAT_HZ * 4) % 1;
  const high = shimmer(sixteenthPhase) * 0.35;

  return { bass, mid, high };
}
