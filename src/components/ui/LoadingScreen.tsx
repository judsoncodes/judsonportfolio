'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '@/lib/store/useStore';
import OceanWave from './OceanWave';

export default function LoadingScreen() {
  const [loading, setLoading] = useState(true);
  const [dismissing, setDismissing] = useState(false);
  const { setIntroComplete, isWaving, setWaving } = useStore();

  useEffect(() => {
    // Check if the user has already loaded the site this session
    const hasLoadedBefore = sessionStorage.getItem('hasLoadedBefore');
    
    if (hasLoadedBefore) {
      setLoading(false);
      setIntroComplete(true);
      return;
    }

    // Initial descent automatically starts
    document.body.style.overflow = 'hidden';
    
    // Automatically trigger start after 2.5 seconds
    const timeout = setTimeout(() => {
      sessionStorage.setItem('hasLoadedBefore', 'true');
      handleStart();
    }, 2500);

    return () => {
      clearTimeout(timeout);
    };
  }, []);

  // Handle manual wave scroll
  useEffect(() => {
    if (isWaving) {
      document.body.style.overflow = 'hidden';
      // Wait for wave to cover screen before scrolling instantly
      setTimeout(() => {
        window.scrollTo({ top: 0, behavior: 'instant' });
      }, 1500); // 1.5s is when wave crest is fully covering the screen
    }
  }, [isWaving]);

  const handleStart = () => {
    setDismissing(true);
    setTimeout(() => {
      setLoading(false);
      setIntroComplete(true);
      document.body.style.overflow = '';
    }, 2000); // Wait for wave to partially cover before removing loading screen
  };

  const handleWaveComplete = () => {
    setWaving(false);
    setDismissing(false);
    document.body.style.overflow = '';
  };

  return (
    <>
      {/* Initial Loading Overlay */}
      <AnimatePresence>
        {loading && (
          <motion.div
            key="landing-overlay"
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="fixed inset-0 z-[99999] pointer-events-auto flex flex-col justify-between items-center text-[#00e5ff] font-mono overflow-hidden bg-transparent"
          >
            {/* Background layer */}
            <motion.div 
              animate={dismissing ? { opacity: 0 } : { opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="absolute inset-0 bg-[#020810]"
            />

            {/* Content */}
            <motion.div 
              animate={dismissing ? { opacity: 0, y: -50 } : { opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="absolute inset-0 flex flex-col justify-between items-center z-10 p-6 md:p-12"
            >
              {/* Top text */}
              <div className="mt-20 md:mt-32 flex flex-col items-center gap-4 text-center">
                <motion.div 
                  initial={{ opacity: 0, y: -20 }} 
                  animate={{ opacity: 1, y: 0 }} 
                  transition={{ duration: 1 }}
                  className="text-xs md:text-sm tracking-[0.5em] text-[#00e5ff]/70 uppercase"
                >
                  System Status Online
                </motion.div>
                <motion.h1 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 1.5, delay: 0.5 }}
                  className="font-['var(--font-playfair)'] text-5xl sm:text-7xl md:text-8xl lg:text-9xl text-white tracking-wider uppercase leading-tight drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]"
                >
                  Initiating <br/> The Descent
                </motion.h1>
              </div>

              {/* Center Sonar */}
              <motion.div 
                className="flex flex-col items-center justify-center my-auto"
              >
                 <motion.div 
                    animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                    className="w-32 h-32 md:w-48 md:h-48 rounded-full border-2 border-[#00e5ff] flex items-center justify-center relative"
                  >
                    <div className="w-3 h-3 md:w-4 md:h-4 bg-[#00e5ff] rounded-full shadow-[0_0_15px_#00e5ff]" />
                    <motion.div 
                      animate={{ rotate: 360 }}
                      transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                      className="absolute inset-0 border-t-2 border-[#00e5ff] rounded-full opacity-50"
                    />
                    <motion.div 
                      animate={{ rotate: -360 }}
                      transition={{ repeat: Infinity, duration: 3, ease: "linear" }}
                      className="absolute -inset-6 border-b-2 border-[#00e5ff]/30 rounded-full opacity-30"
                    />
                  </motion.div>
              </motion.div>

              {/* Bottom Loading Bar (no button) */}
              <div className="mb-20 md:mb-32">
                <div className="flex flex-col items-center">
                  <div className="text-xs tracking-widest animate-pulse mb-4 text-[#00e5ff]">CALIBRATING SENSORS...</div>
                  <div className="w-64 h-1 bg-[#00e5ff]/20 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: "0%" }}
                      animate={{ width: "100%" }}
                      transition={{ duration: 2.5, ease: "linear" }}
                      className="h-full bg-[#00e5ff] shadow-[0_0_10px_#00e5ff]"
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Realistic Ocean Canvas Simulation */}
      {dismissing && !isWaving && (
        <OceanWave duration={4000} onComplete={handleWaveComplete} direction="down" />
      )}
      {isWaving && (
        <OceanWave duration={4000} onComplete={handleWaveComplete} direction="up" />
      )}
    </>
  );
}
