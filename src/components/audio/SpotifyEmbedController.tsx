'use client';

/**
 * SpotifyEmbedController — manages the Spotify iFrame API lifecycle.
 *
 * Does NOT render until `shouldMount` is true. Once mounted:
 * 1. Injects the Spotify iFrame API <script> tag.
 * 2. Creates a controller via IFrameAPI.createController.
 * 3. Listens for playback_update events.
 * 4. Exposes controller to parent via onReady callback.
 * 5. Cleans up on unmount.
 *
 * The embed iframe is visually hidden but remains in the DOM for audio output.
 * Static-export safe — no window/document access at module scope.
 */

import { useRef, useEffect, useCallback } from 'react';
import { SPOTIFY_TRACK_URI, SPOTIFY_IFRAME_API_URL } from '@/data/audio';
import type {
  SpotifyIFrameAPI,
  SpotifyEmbedController as SpotifyEmbedControllerType,
  SpotifyPlaybackUpdate,
} from '@/types/spotify-iframe';

export interface SpotifyEmbedControllerProps {
  /** Set to true to begin loading the Spotify iFrame API. */
  shouldMount: boolean;
  /** Called when the controller is ready. */
  onReady: (controller: SpotifyEmbedControllerType) => void;
  /** Called when the iFrame API fails to load. */
  onError: () => void;
  /** Called on every playback state change. */
  onPlaybackUpdate?: (data: SpotifyPlaybackUpdate) => void;
}

export function SpotifyEmbedController({
  shouldMount,
  onReady,
  onError,
  onPlaybackUpdate,
}: SpotifyEmbedControllerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const controllerRef = useRef<SpotifyEmbedControllerType | null>(null);
  const scriptLoadedRef = useRef(false);
  const mountedRef = useRef(true);

  const handlePlaybackUpdate = useCallback(
    (e: { data: SpotifyPlaybackUpdate }) => {
      onPlaybackUpdate?.(e.data);
    },
    [onPlaybackUpdate],
  );

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (!shouldMount || scriptLoadedRef.current) return;
    scriptLoadedRef.current = true;

    const el = containerRef.current;
    if (!el) {
      onError();
      return;
    }

    // Set the global callback BEFORE injecting the script
    const previousCallback = window.onSpotifyIframeApiReady;

    window.onSpotifyIframeApiReady = (IFrameAPI: SpotifyIFrameAPI) => {
      if (!mountedRef.current) return;

      try {
        IFrameAPI.createController(
          el,
          { uri: SPOTIFY_TRACK_URI, width: 300, height: 80 },
          (controller: SpotifyEmbedControllerType) => {
            if (!mountedRef.current) {
              controller.destroy();
              return;
            }
            controllerRef.current = controller;
            controller.addListener('playback_update', handlePlaybackUpdate);
            onReady(controller);
          },
        );
      } catch {
        if (mountedRef.current) onError();
      }
    };

    // Inject the script
    const script = document.createElement('script');
    script.src = SPOTIFY_IFRAME_API_URL;
    script.async = true;
    script.onerror = () => {
      if (mountedRef.current) onError();
      // Restore previous callback if any
      window.onSpotifyIframeApiReady = previousCallback;
    };
    document.body.appendChild(script);

    // Timeout fallback — if the API doesn't call back within 15s, treat as error
    const timeout = window.setTimeout(() => {
      if (!controllerRef.current && mountedRef.current) {
        onError();
      }
    }, 15_000);

    return () => {
      window.clearTimeout(timeout);
      window.onSpotifyIframeApiReady = previousCallback;
      if (controllerRef.current) {
        controllerRef.current.destroy();
        controllerRef.current = null;
      }
    };
  }, [shouldMount, onReady, onError, handlePlaybackUpdate]);

  return (
    <div
      ref={containerRef}
      aria-hidden
      style={{
        position: 'fixed',
        left: -9999,
        top: -9999,
        width: 300,
        height: 80,
        overflow: 'hidden',
        pointerEvents: 'none',
        opacity: 0,
      }}
    />
  );
}
