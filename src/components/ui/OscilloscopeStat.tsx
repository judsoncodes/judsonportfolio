'use client';

import React, { useRef, useEffect } from 'react';
import { motion } from 'framer-motion';

interface OscilloscopeStatProps {
    value: string;
    label: string;
    intensity?: number; // 0 to 1
}

export default function OscilloscopeStat({ value, label, intensity = 0.5 }: OscilloscopeStatProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const sweepRef = useRef(0);

    useEffect(() => {
        if (!canvasRef.current) return;
        const ctx = canvasRef.current.getContext('2d');
        if (!ctx) return;

        let animationId: number;
        const w = 200;
        const h = 100;
        canvasRef.current.width = w;
        canvasRef.current.height = h;

        const render = () => {
            // Fading trail for phosphor effect
            ctx.fillStyle = 'rgba(2, 8, 16, 0.2)';
            ctx.fillRect(0, 0, w, h);

            // Draw Grid
            ctx.strokeStyle = 'rgba(51, 255, 51, 0.05)';
            ctx.lineWidth = 1;
            for (let x = 0; x < w; x += 20) {
                ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
            }
            for (let y = 0; y < h; y += 20) {
                ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
            }

            // Draw Waveform
            ctx.strokeStyle = '#33ff33';
            ctx.lineWidth = 2;
            ctx.shadowBlur = 10;
            ctx.shadowColor = '#33ff33';
            
            ctx.beginPath();
            const sweepX = (sweepRef.current % w);
            
            for (let i = 0; i < 5; i++) {
                const x = sweepX - i;
                if (x < 0) continue;
                
                // Signal logic: sine wave + noise
                const freq = 0.1 + intensity * 0.2;
                const amp = 10 + intensity * 25;
                const y = h/2 + Math.sin(x * freq) * amp + (Math.random() - 0.5) * 5;
                
                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            ctx.stroke();
            ctx.shadowBlur = 0;

            // Sweep Line
            ctx.fillStyle = 'rgba(51, 255, 51, 0.8)';
            ctx.fillRect(sweepX, 0, 2, h);

            sweepRef.current = (sweepRef.current + 2) % (w * 1.5); // pause at end
            animationId = requestAnimationFrame(render);
        };

        render();
        return () => cancelAnimationFrame(animationId);
    }, [intensity]);

    return (
        <div className="relative group bg-[#020810] border border-[#33ff3333] rounded-lg overflow-hidden p-4">
            {/* CRT Scanline Overlay */}
            <div className="absolute inset-0 pointer-events-none z-10" style={{
                background: 'linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.1) 50%), linear-gradient(90deg, rgba(255, 0, 0, 0.03), rgba(0, 255, 0, 0.01), rgba(0, 0, 255, 0.03))',
                backgroundSize: '100% 4px, 3px 100%'
            }} />

            <div className="flex flex-col items-center">
                <canvas ref={canvasRef} className="w-full h-[80px] mb-4 opacity-80" />
                
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
                    <motion.h3 
                        initial={{ opacity: 0, scale: 0.5 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        className="text-4xl font-bold text-[#33ff33] drop-shadow-[0_0_10px_#33ff33] font-mono"
                    >
                        {value}
                    </motion.h3>
                </div>
                
                <p className="text-[#33ff33aa] font-mono text-[10px] uppercase tracking-widest mt-2">{label}</p>
            </div>
        </div>
    );
}
