import { create } from 'zustand'

interface AbyssState {
  depth: number;
  depthPercent: number; // 0 to 1
  ecoMode: boolean;
  introComplete: boolean;
  setDepth: (depth: number) => void;
  setEcoMode: (ecoMode: boolean) => void;
  setIntroComplete: (val: boolean) => void;
}

const MAX_DEPTH = 4000;

export const useStore = create<AbyssState>((set) => ({
  depth: 0,
  depthPercent: 0,
  ecoMode: false,
  introComplete: false,
  setDepth: (depth) => set({ 
    depth, 
    depthPercent: Math.min(Math.max(depth / MAX_DEPTH, 0), 1)
  }),
  setEcoMode: (ecoMode) => set({ ecoMode }),
  setIntroComplete: (introComplete) => set({ introComplete }),
}))
