'use client';

import { useRef, useEffect } from 'react';
import { useInView } from 'framer-motion';
import { audioEngine } from '@/lib/audio/AudioEngine';

const SKILLS = [
  { name: 'C++', angle: 0, dist: 0.75 },
  { name: 'Python', angle: 45, dist: 0.85 },
  { name: 'SQL', angle: 90, dist: 0.65 },
  { name: 'React', angle: 135, dist: 0.8 },
  { name: 'Next.js', angle: 180, dist: 0.9 },
  { name: 'Node.js', angle: 225, dist: 0.7 },
  { name: 'ML', angle: 270, dist: 0.85 },
  { name: 'TS', angle: 315, dist: 0.6 },
];

export default function SonarSkills() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isInView = useInView(containerRef, { margin: "-100px" });
  const sweepRef = useRef(0);
  const discoveredRef = useRef<Set<number>>(new Set());

  useEffect(() => {
    if (!canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    const w = 600;
    const h = 600;
    canvasRef.current.width = w;
    canvasRef.current.height = h;

    const render = () => {
      if (!isInView) {
        animationId = requestAnimationFrame(render);
        return;
      }

      // 1. Technical Decay Trail
      ctx.fillStyle = 'rgba(2, 8, 16, 0.12)';
      ctx.fillRect(0, 0, w, h);

      const cx = w / 2;
      const cy = h / 2;
      const radius = w * 0.4;

      // 2. Draw Radar Grid
      ctx.strokeStyle = 'rgba(0, 229, 255, 0.15)';
      ctx.lineWidth = 1;
      [0.25, 0.5, 0.75, 1].forEach(r => {
        ctx.beginPath();
        ctx.arc(cx, cy, radius * r, 0, Math.PI * 2);
        ctx.stroke();
      });

      // 3. Sweep Rotation
      sweepRef.current = (sweepRef.current + 0.02) % (Math.PI * 2);
      
      const sweepGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
      sweepGrad.addColorStop(0, 'rgba(0, 229, 255, 0)');
      sweepGrad.addColorStop(1, 'rgba(0, 229, 255, 0.2)');

      ctx.save();
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, radius, sweepRef.current - 0.25, sweepRef.current);
      ctx.lineTo(cx, cy);
      ctx.fillStyle = sweepGrad;
      ctx.fill();
      
      // Sweep Line
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + Math.cos(sweepRef.current) * radius, cy + Math.sin(sweepRef.current) * radius);
      ctx.strokeStyle = 'rgba(0, 229, 255, 0.6)';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.restore();

      // 4. Node Discovery Logic
      SKILLS.forEach((skill, i) => {
        const targetRad = (skill.angle * Math.PI) / 180;
        const normalizedSweep = sweepRef.current;
        const diff = Math.abs(normalizedSweep - targetRad);

        // Discovery threshold
        if (diff < 0.05 && !discoveredRef.current.has(i)) {
          discoveredRef.current.add(i);
          if (audioEngine) audioEngine.playSonarPing();
        }

        if (discoveredRef.current.has(i)) {
          const nx = cx + Math.cos(targetRad) * radius * skill.dist;
          const ny = cy + Math.sin(targetRad) * radius * skill.dist;

          // Drawing discovered node
          ctx.beginPath();
          ctx.arc(nx, ny, 4, 0, Math.PI * 2);
          ctx.fillStyle = '#00e5ff';
          ctx.shadowBlur = 15;
          ctx.shadowColor = '#00e5ff';
          ctx.fill();
          ctx.shadowBlur = 0;

          // Label
          ctx.fillStyle = `rgba(255, 255, 255, 0.9)`;
          ctx.font = 'bold 12px monospace';
          ctx.fillText(skill.name.toUpperCase(), nx + 10, ny + 5);
        }
      });

      animationId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animationId);
  }, [isInView]);

  return (
    <div ref={containerRef} className="flex justify-center items-center w-full min-h-[500px] relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,229,255,0.03)_0%,transparent_70%)] pointer-events-none" />
      <canvas ref={canvasRef} className="max-w-full h-auto drop-shadow-[0_0_30px_rgba(0,229,255,0.1)]" />
      
      {/* Decorative Grid Lines */}
      <div className="absolute inset-0 pointer-events-none opacity-10" style={{ 
          backgroundImage: 'linear-gradient(#00e5ff 1px, transparent 1px), linear-gradient(90deg, #00e5ff 1px, transparent 1px)',
          backgroundSize: '40px 40px'
      }} />
    </div>
  );
}
