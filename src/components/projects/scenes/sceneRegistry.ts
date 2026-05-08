import { lazy } from 'react';
import type { ComponentType } from 'react';
import type { SceneProps } from './types';

const registry = {
  cdas:     lazy(() => import('./CDASScene')),
  faultmap: lazy(() => import('./FaultmapScene')),
  pharmacy: lazy(() => import('./PharmacyScene')),
  pipeline: lazy(() => import('./PipelineScene')),
  insulink: lazy(() => import('./InsuLinkScene')),
  genetic:  lazy(() => import('./GeneticScene')),
  wordle:   lazy(() => import('./WordleScene')),
  options:  lazy(() => import('./OptionsScene')),
  crashes:  lazy(() => import('./CrashesScene')),
} as const;

type SceneId = keyof typeof registry;

export function getScene(sceneId: string): ComponentType<SceneProps> | null {
  if (sceneId in registry) {
    // LazyExoticComponent is a valid JSX element constructor; cast to satisfy ComponentType
    return registry[sceneId as SceneId] as unknown as ComponentType<SceneProps>;
  }
  return null;
}
