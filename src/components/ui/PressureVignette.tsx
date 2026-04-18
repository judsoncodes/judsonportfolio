'use client';

import { useStore } from "@/lib/store/useStore";

export default function PressureVignette() {
  const depthPercent = useStore((state) => state.depthPercent);
  
  // Intensify vignette as we go deeper, from 0 to 0.85 opacity
  const opacity = depthPercent * 0.85;

  return (
    <div 
      className="fixed inset-0 pointer-events-none transition-all duration-300 ease-out" 
      style={{
        zIndex: 50,
        boxShadow: `inset 0 0 200px rgba(0,0,0,${opacity})`
      }}
      aria-hidden="true"
    />
  );
}
