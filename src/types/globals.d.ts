// Augment React.JSX.IntrinsicElements with R3F Three.js elements.
// R3F 8.x was built for React 18 (global JSX namespace); React 19 uses React.JSX.
// This bridges both until @react-three/fiber v9 officially supports React 19.
import type { ThreeElements } from '@react-three/fiber';

declare module 'react' {
  namespace JSX {
    interface IntrinsicElements extends ThreeElements {}
  }
}
