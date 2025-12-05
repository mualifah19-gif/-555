import * as THREE from 'three';

export enum TreeState {
  CHAOS = 'CHAOS',
  FORMED = 'FORMED'
}

export interface DualPosition {
  chaos: [number, number, number];
  target: [number, number, number];
  scale: number;
  color: string;
  type: 'gift' | 'ball' | 'light';
}

export interface FoliageUniforms {
  uTime: { value: number };
  uProgress: { value: number };
  uColor: { value: THREE.Color };
}