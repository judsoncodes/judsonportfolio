'use client';

import React, { useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useStore } from '@/lib/store/useStore';

export default function BathyscapheOverlay() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const depthPercent = useStore((state) => state.depthPercent);

    useEffect(() => {
        if (!canvasRef.current) return;
        const ctx = canvasRef.current.getContext('2d');
        if (!ctx) return;

        const w = 120;
        const h = 120;
        canvasRef.current.width = w;
        canvasRef.current.height = h;

        // Draw Scratched Glass Texture
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
        ctx.lineWidth = 0.5;
        for (let i = 0; i < 15; i++) {
            ctx.beginPath();
            ctx.moveTo(Math.random() * w, Math.random() * h);
            ctx.lineTo(Math.random() * w, Math.random() * h);
            ctx.stroke();
        }

        // Add Noise/Dust
        for (let i = 0; i < 50; i++) {
            ctx.fillStyle = `rgba(255, 255, 255, ${Math.random() * 0.1})`;
            ctx.beginPath();
            ctx.arc(Math.random() * w, Math.random() * h, Math.random() * 1.2, 0, Math.PI * 2);
            ctx.fill();
        }
    }, []);

    return (
        <div className="fixed bottom-8 right-8 z-[-1] pointer-events-none hidden md:block">
            {/* The Porthole Frame (Decorative Mini Version) */}
            <div className="relative w-[120px] h-[120px] rounded-full border-[8px] border-[#1a2b3c] shadow-[inset_0_0_20px_rgba(0,0,0,0.8),0_0_15px_rgba(0,229,255,0.1)] bg-[#02081033] backdrop-blur-sm">
                
                {/* Rivets (Mini) */}
                {Array.from({ length: 8 }).map((_, i) => (
                    <div 
                        key={i}
                        className="absolute w-2 h-2 bg-[#2c3e50] rounded-full border border-black/30 shadow-inner"
                        style={{
                            top: '50%',
                            left: '50%',
                            transform: `translate(-50%, -50%) rotate(${i * 45}deg) translateY(-52px)`,
                            transformOrigin: 'center center'
                        }}
                    />
                ))}

                {/* Glass Scratches Canvas */}
                <canvas ref={canvasRef} className="absolute inset-0 w-full h-full rounded-full opacity-60 mix-blend-screen" />

                {/* Mini Gauge Overlay */}
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-16 h-16 rounded-full border border-[#00e5ff22] flex items-center justify-center">
                        <motion.div 
                            className="w-[1.5px] h-6 bg-red-500 origin-bottom"
                            animate={{ rotate: -90 + (depthPercent * 180) }}
                            transition={{ type: 'spring', stiffness: 50 }}
                        />
                    </div>
                </div>

                {/* Label */}
                <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[8px] font-mono text-[#00e5ff] opacity-40 whitespace-nowrap uppercase tracking-tighter">
                    Aux-Porthole-01
                </div>
            </div>
        </div>
    );
}
