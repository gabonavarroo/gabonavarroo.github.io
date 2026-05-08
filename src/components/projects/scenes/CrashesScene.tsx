'use client';
import type { SceneProps } from './types';
import { SceneSkeleton } from '../SceneSkeleton';

export default function CrashesScene({ inView: _inView }: SceneProps) {
  return <SceneSkeleton label="CRASH RISK PREDICTOR // CODEX PENDING" />;
}
