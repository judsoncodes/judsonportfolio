'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '@/lib/store/useStore';

export default function LoadingScreen() {
  const [loading, setLoading] = useState(true);
  const [interactive, setInteractive] = useState(false);
  const [dismissing, setDismissing] = useState(false);
  const setIntroComplete = useStore((state) => state.setIntroComplete);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    const timeout = setTimeout(() => {
      setInteractive(true);
    }, 2000);

    return () => {
      clearTimeout(timeout);
      document.body.style.overflow = '';
    };
  }, []);

  const handleStart = () => {
    setDismissing(true);
    setTimeout(() => {
      setLoading(false);
      setIntroComplete(true);
      document.body.style.overflow = '';
    }, 1500);
  };

  return (
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
            className="absolute inset-0 flex flex-col justify-between items-center z-10 p-6"
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
                className="font-['var(--font-playfair)'] text-5xl md:text-7xl lg:text-8xl text-white tracking-wider uppercase leading-tight drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]"
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
                  className="w-24 h-24 md:w-32 md:h-32 rounded-full border-2 border-[#00e5ff] flex items-center justify-center relative"
                >
                  <div className="w-2 h-2 md:w-3 md:h-3 bg-[#00e5ff] rounded-full shadow-[0_0_15px_#00e5ff]" />
                  <motion.div 
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                    className="absolute inset-0 border-t-2 border-[#00e5ff] rounded-full opacity-50"
                  />
                  <motion.div 
                    animate={{ rotate: -360 }}
                    transition={{ repeat: Infinity, duration: 3, ease: "linear" }}
                    className="absolute -inset-4 border-b-2 border-[#00e5ff]/30 rounded-full opacity-30"
                  />
                </motion.div>
            </motion.div>

            {/* Bottom Button */}
            <div className="mb-20 md:mb-32">
              {!interactive ? (
                  <div className="flex flex-col items-center">
                    <div className="text-xs tracking-widest animate-pulse mb-4 text-[#00e5ff]">CALIBRATING SENSORS...</div>
                    <div className="w-48 h-1 bg-[#00e5ff]/20 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: "0%" }}
                        animate={{ width: "100%" }}
                        transition={{ duration: 2, ease: "linear" }}
                        className="h-full bg-[#00e5ff] shadow-[0_0_10px_#00e5ff]"
                      />
                    </div>
                  </div>
              ) : (
                  <motion.button
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    onClick={handleStart}
                    className="relative group px-12 py-5 bg-[#020810] border-2 border-[#00e5ff] text-[#00e5ff] font-bold rounded-full uppercase tracking-[0.2em] overflow-hidden transition-all hover:text-[#020810] hover:scale-105 shadow-[0_0_20px_rgba(0,229,255,0.2)] hover:shadow-[0_0_40px_rgba(0,229,255,0.6)] cursor-none md:cursor-pointer"
                  >
                    <span className="relative z-10 font-sans tracking-widest">Dive Into Abyss</span>
                    <div className="absolute inset-0 h-full w-full bg-[#00e5ff] translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-out z-0"></div>
                  </motion.button>
              )}
            </div>
          </motion.div>

          {/* Water Washout Wave */}
          <AnimatePresence>
            {dismissing && (
              <motion.div
                key="wave"
                initial={{ top: "100vh" }}
                animate={{ top: "-200vh" }}
                transition={{ duration: 1.5, ease: [0.45, 0, 0.55, 1] }}
                className="absolute left-0 right-0 h-[200vh] bg-[#00e5ff] z-[999999] pointer-events-none"
                style={{ 
                  borderRadius: "50% 50% 0 0 / 5% 5% 0 0",
                  boxShadow: "0 -20px 50px rgba(0,229,255,0.8)"
                }}
              >
                 <div className="absolute inset-0 bg-gradient-to-b from-white/40 via-[#00e5ff]/80 to-transparent"></div>
                 {/* Floating bubbles for water effect */}
                 <div className="absolute top-20 left-[10%] w-4 h-4 bg-white/60 rounded-full animate-bounce"></div>
                 <div className="absolute top-40 left-[30%] w-8 h-8 bg-white/40 rounded-full animate-pulse"></div>
                 <div className="absolute top-32 left-[70%] w-6 h-6 bg-white/50 rounded-full animate-bounce" style={{ animationDelay: '0.2s'}}></div>
                 <div className="absolute top-60 left-[85%] w-3 h-3 bg-white/70 rounded-full animate-ping"></div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
