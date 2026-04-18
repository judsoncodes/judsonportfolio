'use client';

import React from 'react';
import { motion, useTransform } from 'framer-motion';
import { useStore } from '@/lib/store/useStore';

export default function BathymetricScroll() {
    const depthPercent = useStore((state) => state.depthPercent);

    return (
        <div className="fixed left-6 top-1/2 -translate-y-1/2 h-[60vh] w-12 z-50 pointer-events-none hidden md:flex flex-col items-center">
            {/* The Bathymetric Chart */}
            <svg width="40" height="100%" viewBox="0 0 40 400" preserveAspectRatio="none" className="opacity-20">
                {/* Ocean Floor Profile */}
                <path 
                    d="M 40 0 
                       L 30 50 
                       L 10 100 
                       L 5 200 
                       L 15 300 
                       L 2 380 
                       L 40 400 Z" 
                    fill="url(#terrain-grad)"
                    stroke="#00e5ff"
                    strokeWidth="1"
                />
                <defs>
                    <linearGradient id="terrain-grad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#00e5ff" stopOpacity="0.5" />
                        <stop offset="100%" stopColor="#020810" stopOpacity="1" />
                    </linearGradient>
                </defs>
            </svg>

            {/* Glowing Submarine Icon */}
            <motion.div 
                className="absolute left-0 w-full flex justify-center"
                style={{ top: `${depthPercent * 100}%` }}
                transition={{ type: 'spring', stiffness: 100, damping: 20 }}
            >
                <div className="relative">
                    {/* Submarine Shape */}
                    <svg width="24" height="16" viewBox="0 0 24 16" fill="none">
                        <rect x="2" y="4" width="16" height="8" rx="4" fill="#00e5ff" className="shadow-[0_0_10px_#00e5ff]" />
                        <rect x="8" y="0" width="4" height="4" fill="#00e5ff" />
                        <path d="M18 8 L22 5 L22 11 Z" fill="#00e5ff" />
                        {/* Searchlight Cone */}
                        <path d="M2 8 L-15 0 L-15 16 Z" fill="url(#light-cone)" opacity="0.4" />
                        <defs>
                            <radialGradient id="light-cone" cx="1" cy="0.5" r="1">
                                <stop offset="0%" stopColor="#00e5ff" />
                                <stop offset="100%" stopColor="transparent" />
                            </radialGradient>
                        </defs>
                    </svg>
                    {/* Ping Ripple */}
                    <motion.div 
                        className="absolute inset-0 rounded-full border border-[#00e5ff] opacity-0"
                        animate={{ scale: [1, 3], opacity: [0.5, 0] }}
                        transition={{ repeat: Infinity, duration: 2 }}
                    />
                </div>
            </motion.div>

            {/* Depth Labels */}
            <div className="absolute left-10 inset-y-0 flex flex-col justify-between text-[8px] font-mono text-[#00e5ff] opacity-30 py-2">
                <span>0m</span>
                <span>1000m</span>
                <span>2000m</span>
                <span>3000m</span>
                <span>4000m</span>
            </div>
        </div>
    );
}
