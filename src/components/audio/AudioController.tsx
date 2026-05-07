'use client';

/**
 * AudioController — React context provider for the audio system.
 *
 * Responsibilities:
 * - Boot SFX (synthesized via Web Audio API) — controlled by isMuted.
 * - UI SFX (synthesized via Web Audio API) — controlled by isMuted.
 * - Spotify playback state tracking — controlled separately by SpotifyMusicButton.
 * - getAnalyzerData() — returns real AnalyserNode data for synthesized SFX,
 *   or delegates to the synthetic beat proxy when Spotify is playing.
 *
 * This does NOT fetch or decode /audio/main-theme.mp3. Main music is
 * streamed via Spotify Embed (see SpotifyEmbedController.tsx).
 *
 * @see decisions-log.md D9
 */

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
  useEffect,
  type ReactNode,
} from 'react';
import { getBeatProxyData } from '@/lib/audio-beat-proxy';

// ── Context shape ───────────────────────────────────────────

interface AudioContextValue {
  /** Trigger boot SFX. */
  play: () => void;
  /** Mute synthesized SFX (boot + UI). Does not affect Spotify. */
  mute: () => void;
  /** Unmute synthesized SFX. */
  unmute: () => void;
  /** Whether synthesized SFX are muted. */
  isMuted: boolean;
  /** Whether Spotify embed is currently playing. */
  spotifyPlaying: boolean;
  /** Called by SpotifyMusicButton to sync Spotify playback state. */
  setSpotifyPlaying: (playing: boolean) => void;
  /**
   * Returns bass/mid/high in 0–1 range.
   * When Spotify is playing, uses a deterministic synthetic beat proxy.
   * When Spotify is not playing, returns zeros (or decaying values).
   */
  getAnalyzerData: () => { bass: number; mid: number; high: number };
}

const STORAGE_KEY = 'audio-muted';

function readMutePref(): boolean {
  if (typeof window === 'undefined') return true;
  try {
    return localStorage.getItem(STORAGE_KEY) === 'true';
  } catch {
    return true;
  }
}

function writeMutePref(muted: boolean): void {
  try {
    localStorage.setItem(STORAGE_KEY, String(muted));
  } catch {
    // localStorage unavailable — silently ignore
  }
}

// ── Context ─────────────────────────────────────────────────

const AudioCtx = createContext<AudioContextValue>({
  play: () => {},
  mute: () => {},
  unmute: () => {},
  isMuted: true,
  spotifyPlaying: false,
  setSpotifyPlaying: () => {},
  getAnalyzerData: () => ({ bass: 0, mid: 0, high: 0 }),
});

export function useAudio() {
  return useContext(AudioCtx);
}

// ── Provider ────────────────────────────────────────────────

export function AudioControllerShell({ children }: { children: ReactNode }) {
  const [isMuted, setIsMuted] = useState<boolean>(true);
  const [spotifyPlaying, setSpotifyPlaying] = useState(false);

  // Stable reference time for beat proxy
  const mountTimeRef = useRef<number>(0);

  // Initialise mute state from localStorage on mount
  useEffect(() => {
    setIsMuted(readMutePref());
    mountTimeRef.current = performance.now();
  }, []);

  const handleMute = useCallback(() => {
    setIsMuted(true);
    writeMutePref(true);
  }, []);

  const handleUnmute = useCallback(() => {
    setIsMuted(false);
    writeMutePref(false);
  }, []);

  const handlePlay = useCallback(() => {
    // Phase 2: boot SFX synthesis goes here (audio-boot.ts).
    // No-op for now — SFX implementation is a separate task.
  }, []);

  const handleSetSpotifyPlaying = useCallback((playing: boolean) => {
    setSpotifyPlaying(playing);
  }, []);

  const getAnalyzerData = useCallback(() => {
    const elapsed = performance.now() - mountTimeRef.current;
    return getBeatProxyData(elapsed, spotifyPlaying);
  }, [spotifyPlaying]);

  const value: AudioContextValue = {
    play: handlePlay,
    mute: handleMute,
    unmute: handleUnmute,
    isMuted,
    spotifyPlaying,
    setSpotifyPlaying: handleSetSpotifyPlaying,
    getAnalyzerData,
  };

  return <AudioCtx.Provider value={value}>{children}</AudioCtx.Provider>;
}
