'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function CustomCursor() {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [ripples, setRipples] = useState<{ id: number; x: number; y: number }[]>([]);

  useEffect(() => {
    const updatePosition = (e: MouseEvent) => {
      setPosition({ x: e.clientX, y: e.clientY });
    };

    const handleDoubleClick = (e: MouseEvent) => {
      const newRipple = { id: Date.now(), x: e.clientX, y: e.clientY };
      setRipples((prev) => [...prev, newRipple]);
      setTimeout(() => {
        setRipples((prev) => prev.filter((r) => r.id !== newRipple.id));
      }, 1000);
    };

    window.addEventListener('mousemove', updatePosition);
    window.addEventListener('dblclick', handleDoubleClick);

    return () => {
      window.removeEventListener('mousemove', updatePosition);
      window.removeEventListener('dblclick', handleDoubleClick);
    };
  }, []);

  return (
    <>
      {/* The main cursor */}
      <motion.div
        className="fixed top-0 left-0 pointer-events-none mix-blend-screen z-[9999]"
        animate={{
          x: position.x - 16,
          y: position.y - 16,
        }}
        transition={{ type: 'tween', ease: 'backOut', duration: 0.15 }}
      >
        <div className="w-8 h-8 rounded-full border border-[#00e5ff] flex items-center justify-center">
          <div className="w-1 h-1 bg-[#00e5ff] rounded-full" />
        </div>
      </motion.div>

      {/* Ripples on double click */}
      <AnimatePresence>
        {ripples.map((ripple) => (
          <motion.div
            key={ripple.id}
            className="fixed top-0 left-0 pointer-events-none mix-blend-screen z-[9998] rounded-full border border-[#00e5ff]"
            initial={{
              x: ripple.x - 16,
              y: ripple.y - 16,
              width: 32,
              height: 32,
              opacity: 1,
            }}
            animate={{
              x: ripple.x - 64,
              y: ripple.y - 64,
              width: 128,
              height: 128,
              opacity: 0,
            }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1, ease: 'easeOut' }}
          />
        ))}
      </AnimatePresence>
    </>
  );
}
