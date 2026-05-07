/**
 * Audio system constants.
 *
 * The main music track is streamed via Spotify's official Embed iFrame API.
 * No copyrighted audio is stored locally. Boot SFX and UI SFX remain
 * synthesized in-browser via the Web Audio API.
 *
 * @see decisions-log.md D9
 */

/** Spotify URI for The Clash — "Should I Stay or Should I Go" */
export const SPOTIFY_TRACK_URI = 'spotify:track:39shmbIHICJ2Wxnk1fPSdz';

/** Direct link for the fallback (if embed fails) */
export const SPOTIFY_TRACK_URL = 'https://open.spotify.com/track/39shmbIHICJ2Wxnk1fPSdz';

/** Spotify iFrame API script URL — loaded client-side only on first user gesture */
export const SPOTIFY_IFRAME_API_URL = 'https://open.spotify.com/embed/iframe-api/v1';

/**
 * Actual BPM of the track. Used by the synthetic beat proxy
 * to generate musically coherent bass/mid/high values when
 * Spotify audio cannot be analyzed through the Web Audio API.
 */
export const SPOTIFY_TRACK_BPM = 116;
