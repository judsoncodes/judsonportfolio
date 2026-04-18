'use client';

import { useEffect, useRef } from 'react';
import { useStore } from '@/lib/store/useStore';

// Helper to interpolate colors
function interpolateColor(color1: number[], color2: number[], factor: number) {
  const result = color1.slice();
  for (let i = 0; i < 3; i++) {
    result[i] = Math.round(result[i] + factor * (color2[i] - color1[i]));
  }
  return `rgb(${result[0]}, ${result[1]}, ${result[2]})`;
}

// Colors
const SURFACE_TOP = [0, 109, 143]; // #006d8f
const SURFACE_BOTTOM = [0, 26, 47]; // #001a2f
const ABYSS_TOP = [0, 20, 40]; // Twilight
const ABYSS_BOTTOM = [0, 4, 8]; // #000408 Midnight

export default function SurfaceCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let time = 0;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    
    window.addEventListener('resize', resize);
    resize();

    // 5 layers of parametric sine waves
    const waves = [
      { amplitude: 20, frequency: 0.01, speed: 0.02, opacity: 0.1, yOffset: 150 },
      { amplitude: 30, frequency: 0.008, speed: 0.015, opacity: 0.15, yOffset: 120 },
      { amplitude: 40, frequency: 0.006, speed: 0.01, opacity: 0.2, yOffset: 90 },
      { amplitude: 50, frequency: 0.004, speed: 0.008, opacity: 0.25, yOffset: 60 },
      { amplitude: 60, frequency: 0.003, speed: 0.005, opacity: 0.4, yOffset: 30 },
    ];

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const maxDepth = 4000;
      const currentDepth = useStore.getState().depth;
      const depthRatio = Math.min(currentDepth / maxDepth, 1);
      
      const topColor = interpolateColor(SURFACE_TOP, ABYSS_TOP, depthRatio);
      const bottomColor = interpolateColor(SURFACE_BOTTOM, ABYSS_BOTTOM, depthRatio);
      
      const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
      gradient.addColorStop(0, topColor);
      gradient.addColorStop(1, bottomColor);
      
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const scrollOffset = currentDepth * 0.8; // Parallax speed for waves

      if (scrollOffset < canvas.height + 200) {
        waves.forEach((wave) => {
          ctx.beginPath();
          ctx.moveTo(0, canvas.height);
          ctx.lineTo(0, wave.yOffset - scrollOffset);

          for (let x = 0; x <= canvas.width; x += 20) {
            const y = Math.sin(x * wave.frequency + time * wave.speed) * wave.amplitude + wave.yOffset - scrollOffset;
            ctx.lineTo(x, y);
          }

          ctx.lineTo(canvas.width, canvas.height);
          ctx.closePath();
          
          ctx.fillStyle = `rgba(255, 255, 255, ${wave.opacity})`;
          ctx.fill();
        });
      }

      time += 1;
      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas 
      ref={canvasRef} 
      className="fixed inset-0 pointer-events-none -z-20 block"
      aria-hidden="true"
    />
  );
}
