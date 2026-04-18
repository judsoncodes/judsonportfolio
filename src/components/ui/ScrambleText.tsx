'use client';

import React, { useState, useEffect } from 'react';

const SYMBOLS = "!@#$%^&*()_+-=[]{}|;:,.<>?/¥§¶†‡•‣⌘⌥⇧⌃";

interface ScrambleTextProps {
    text: string;
    duration?: number; // total duration per character
    delay?: number; // ms before starting
    className?: string;
}

export default function ScrambleText({ text, duration = 600, delay = 0, className = "" }: ScrambleTextProps) {
    const [displayedText, setDisplayedText] = useState("");
    
    useEffect(() => {
        let isMounted = true;
        let timeoutId: NodeJS.Timeout | null = null;
        const characters = text.split("");
        const results = Array(characters.length).fill("");
        
        const startScramble = () => {
            characters.forEach((char, i) => {
                let count = 0;
                const maxCycles = 15;
                const cycleDuration = duration / maxCycles;
                
                const interval = setInterval(() => {
                    if (!isMounted) {
                        clearInterval(interval);
                        return;
                    }
                    if (count < maxCycles) {
                        results[i] = SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)];
                        setDisplayedText(results.join(""));
                        count++;
                    } else {
                        results[i] = char;
                        setDisplayedText(results.join(""));
                        clearInterval(interval);
                    }
                }, cycleDuration + (i * 20));
            });
        };

        timeoutId = setTimeout(() => {
            if (isMounted) startScramble();
        }, delay);

        return () => {
            isMounted = false;
            if (timeoutId) clearTimeout(timeoutId);
        };
    }, [text, duration, delay]);

    return (
        <span className={className}>
            {displayedText}
        </span>
    );
}
