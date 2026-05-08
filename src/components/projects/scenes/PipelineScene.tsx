'use client';
import type { SceneProps } from './types';
import { SceneSkeleton } from '../SceneSkeleton';

export default function PipelineScene({ inView: _inView }: SceneProps) {
  return <SceneSkeleton label="AKAMAI BYPASS ACTIVE // CODEX PENDING" />;
}
