'use client';

import React, { useRef, useEffect, useState } from 'react';
import { useStore } from '@/lib/store/useStore';

export default function BiomeTransition() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const depth = useStore((state) => state.depth);
    const [lastDepth, setLastDepth] = useState(0);
    const [isAnimating, setIsAnimating] = useState(false);
    const [direction, setDirection] = useState<'descending' | 'ascending'>('descending');
    
    const boundary = 200; // 200m is the transition point

    useEffect(() => {
        // Detect crossing
        if ((lastDepth <= boundary && depth > boundary) || (lastDepth >= boundary && depth < boundary)) {
            setDirection(depth > boundary ? 'descending' : 'ascending');
            setIsAnimating(true);
        }
        setLastDepth(depth);
    }, [depth, lastDepth]);

    useEffect(() => {
        if (!isAnimating || !canvasRef.current) return;
        
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const w = window.innerWidth;
        const h = window.innerHeight;
        canvas.width = w;
        canvas.height = h;

        let startTime = performance.now();
        const duration = 1200; // 1.2s wipe

        const particles = Array.from({ length: 100 }).map(() => ({
            x: Math.random() * w,
            y: Math.random() * h,
            size: Math.random() * 3 + 1,
            speed: Math.random() * 2 + 1
        }));

        const animate = (now: number) => {
            const elapsed = now - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            ctx.clearRect(0, 0, w, h);
            
            // Draw the wipe
            const wipeY = direction === 'descending' 
                ? h * progress 
                : h * (1 - progress);

            ctx.beginPath();
            ctx.moveTo(0, direction === 'descending' ? 0 : h);
            
            // Procedural sine-edge
            for (let x = 0; x <= w; x += 10) {
                const sine = Math.sin(x * 0.01 + progress * 10) * 20;
                const jitter = Math.random() * 5;
                ctx.lineTo(x, wipeY + sine + jitter);
            }
            
            ctx.lineTo(w, direction === 'descending' ? 0 : h);
            ctx.closePath();
            
            // Biome colors
            const grad = ctx.createLinearGradient(0, wipeY - 100, 0, wipeY + 100);
            if (direction === 'descending') {
                grad.addColorStop(0, 'rgba(0, 229, 255, 0.2)'); // Twilight cyan
                grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
            } else {
                grad.addColorStop(0, 'rgba(0, 0, 0, 0)');
                grad.addColorStop(1, 'rgba(255, 255, 255, 0.2)'); // Sunlit white
            }
            
            ctx.fillStyle = grad;
            ctx.fill();

            // Particles on the edge
            ctx.fillStyle = '#00e5ff';
            particles.forEach(p => {
                const pProgress = (progress + p.speed * 0.1) % 1;
                const py = direction === 'descending' ? h * pProgress : h * (1 - pProgress);
                const distToEdge = Math.abs(py - wipeY);
                
                if (distToEdge < 100) {
                    ctx.globalAlpha = (1 - distToEdge / 100) * 0.6;
                    ctx.beginPath();
                    ctx.arc(p.x, py, p.size, 0, Math.PI * 2);
                    ctx.fill();
                }
            });
            ctx.globalAlpha = 1.0;

            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                setIsAnimating(false);
            }
        };

        requestAnimationFrame(animate);
    }, [isAnimating, direction]);

    return (
        <canvas 
            ref={canvasRef} 
            className={`fixed inset-0 z-[60] pointer-events-none ${isAnimating ? 'block' : 'hidden'}`}
        />
    );
}
