'use client';
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const MORSE_MAP: Record<string, string> = {
  'A': '.-', 'B': '-...', 'C': '-.-.', 'D': '-..', 'E': '.', 'F': '..-.',
  'G': '--.', 'H': '....', 'I': '..', 'J': '.---', 'K': '-.-', 'L': '.-..',
  'M': '--', 'N': '-.', 'O': '---', 'P': '.--.', 'Q': '--.-', 'R': '.-.',
  'S': '...', 'T': '-', 'U': '..-', 'V': '...-', 'W': '.--', 'X': '-..-',
  'Y': '-.--', 'Z': '--..', ' ': '/'
};

export default function MorseSkeleton({ title, className = "" }: { title: string, className?: string }) {
  const [activeBit, setActiveBit] = useState(-1);
  const [morseSequence, setMorseSequence] = useState<string[]>([]);

  useEffect(() => {
    const encoded = title.toUpperCase().split('').map(char => MORSE_MAP[char] || '').join(' ');
    setMorseSequence(encoded.split(''));
    
    let i = 0;
    const interval = setInterval(() => {
      setActiveBit(i);
      i = (i + 1) % encoded.length;
    }, 150);

    return () => clearInterval(interval);
  }, [title]);

  return (
    <div className={`flex flex-col gap-4 ${className}`}>
        <div className="flex flex-wrap gap-2 items-center">
            {morseSequence.map((char, i) => {
                if (char === ' ') return <div key={i} className="w-2" />;
                if (char === '/') return <div key={i} className="w-6" />;
                
                const isDot = char === '.';
                const isActive = activeBit === i;

                return (
                    <motion.div
                        key={i}
                        initial={false}
                        animate={{ 
                            backgroundColor: isActive ? '#00e5ff' : 'rgba(0, 229, 255, 0.1)',
                            boxShadow: isActive ? '0 0 15px rgba(0, 229, 255, 0.8)' : '0 0 0px rgba(0, 229, 255, 0)',
                            scale: isActive ? 1.1 : 1
                        }}
                        className="h-2 rounded-full"
                        style={{ width: isDot ? '8px' : '24px' }}
                    />
                );
            })}
        </div>
        {/* Placeholder lines */}
        <div className="space-y-2 opacity-20">
            <div className="h-4 bg-white/10 rounded w-full" />
            <div className="h-4 bg-white/10 rounded w-3/4" />
        </div>
    </div>
  );
}
