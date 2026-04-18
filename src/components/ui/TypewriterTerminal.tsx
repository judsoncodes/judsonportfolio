'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { audioEngine } from '@/lib/audio/AudioEngine';

export default function TypewriterTerminal({ text, delay = 0 }: { text: string, delay?: number }) {
    const [displayedText, setDisplayedText] = useState("");
    const [isComplete, setIsComplete] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const isInView = useInView(containerRef, { once: true, margin: "-100px" });

    useEffect(() => {
        if (!isInView) return;

        let currentIndex = 0;
        const startTimeout = setTimeout(() => {
            const interval = setInterval(() => {
                if (currentIndex < text.length) {
                    setDisplayedText(text.slice(0, currentIndex + 1));
                    currentIndex++;
                    
                    // Occasionally play keystroke sfx
                    if (Math.random() > 0.3 && audioEngine) {
                        audioEngine.playKeystroke();
                    }
                } else {
                    clearInterval(interval);
                    setIsComplete(true);
                }
            }, 40 + Math.random() * 40);

            return () => clearInterval(interval);
        }, delay);

        return () => clearTimeout(startTimeout);
    }, [isInView, text, delay]);

    return (
        <div ref={containerRef} className="font-mono text-sm sm:text-base inline-block">
            <span className="text-white/80">{displayedText}</span>
            <motion.span 
                animate={{ opacity: [1, 0] }}
                transition={{ repeat: Infinity, duration: 0.8 }}
                className={`inline-block w-[8px] h-[1em] bg-[#00e5ff] ml-1 align-middle ${isComplete ? 'hidden' : ''}`}
            />
        </div>
    );
}
