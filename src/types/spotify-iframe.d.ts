/**
 * Minimal type declarations for the Spotify iFrame Embed API.
 * @see https://developer.spotify.com/documentation/embeds/references/iframe-api
 *
 * Only the public embed API is typed — no Web Playback SDK, no OAuth, no Premium.
 */

/** Playback state payload delivered by the 'playback_update' event. */
export interface SpotifyPlaybackUpdate {
  isPaused: boolean;
  isBuffering: boolean;
  duration: number;
  position: number;
  playingURI: string;
}

/** The controller returned by IFrameAPI.createController. */
export interface SpotifyEmbedController {
  play(): void;
  pause(): void;
  resume(): void;
  togglePlay(): void;
  seek(positionMs: number): void;
  destroy(): void;
  loadUri(uri: string): void;
  addListener(
    event: 'playback_update',
    callback: (e: { data: SpotifyPlaybackUpdate }) => void,
  ): void;
  addListener(event: 'ready', callback: () => void): void;
}

/** Options passed to IFrameAPI.createController. */
export interface SpotifyEmbedOptions {
  uri: string;
  width?: number | string;
  height?: number | string;
}

/** The global Spotify iFrame API object. */
export interface SpotifyIFrameAPI {
  createController(
    element: HTMLElement,
    options: SpotifyEmbedOptions,
    callback: (controller: SpotifyEmbedController) => void,
  ): void;
}

/** Augment the global Window interface for the Spotify callback. */
declare global {
  interface Window {
    onSpotifyIframeApiReady?: (api: SpotifyIFrameAPI) => void;
  }
}
