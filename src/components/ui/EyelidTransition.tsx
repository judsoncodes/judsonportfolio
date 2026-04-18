'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '@/lib/store/useStore';

export default function EyelidTransition() {
    const depth = useStore((state) => state.depth);
    const [prevDepth, setPrevDepth] = useState(0);
    const [isBlinking, setIsBlinking] = useState(false);
    
    const boundaries = [200, 1000, 3000]; // Key zone boundaries
    const velocityThreshold = 15; // Speed required to trigger blink

    useEffect(() => {
        const diff = Math.abs(depth - prevDepth);
        
        // Check if we crossed any boundary rapidly
        const crossed = boundaries.some(b => 
            (prevDepth <= b && depth > b) || (prevDepth >= b && depth < b)
        );

        if (crossed && diff > velocityThreshold && !isBlinking) {
            setIsBlinking(true);
            setTimeout(() => setIsBlinking(false), 800);
        }

        setPrevDepth(depth);
    }, [depth, prevDepth, isBlinking]);

    return (
        <div className="fixed inset-0 z-[1000] pointer-events-none">
            <AnimatePresence>
                {isBlinking && (
                    <>
                        {/* Upper Eyelid */}
                        <motion.div 
                            initial={{ y: "-100%" }}
                            animate={{ y: "0%" }}
                            exit={{ y: "-100%" }}
                            transition={{ duration: 0.4, ease: [0.45, 0, 0.55, 1] }}
                            className="absolute top-0 left-0 w-full h-1/2 bg-[#020810] rounded-b-[50%]"
                            style={{ boxShadow: "0 10px 50px rgba(0,0,0,1)" }}
                        />
                        {/* Lower Eyelid */}
                        <motion.div 
                            initial={{ y: "100%" }}
                            animate={{ y: "0%" }}
                            exit={{ y: "100%" }}
                            transition={{ duration: 0.4, ease: [0.45, 0, 0.55, 1] }}
                            className="absolute bottom-0 left-0 w-full h-1/2 bg-[#020810] rounded-t-[50%]"
                            style={{ boxShadow: "0 -10px 50px rgba(0,0,0,1)" }}
                        />
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}
