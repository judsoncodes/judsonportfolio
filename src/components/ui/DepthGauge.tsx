'use client';

import { useStore } from "@/lib/store/useStore";
import { useEffect } from "react";
import { motion, useSpring, useTransform } from "framer-motion";

export default function DepthGauge() {
  const depthPercent = useStore((state) => state.depthPercent);
  const depth = useStore((state) => state.depth);
  
  let zoneName = "SUNLIT";
  if (depthPercent >= 0.33 && depthPercent < 0.66) zoneName = "TWILIGHT";
  else if (depthPercent >= 0.66) zoneName = "MIDNIGHT";

  useEffect(() => {
    document.title = `[ ${zoneName} ] Judson J`;
  }, [zoneName]);

  const springDepth = useSpring(depth, { bounce: 0, duration: 0.5 });
  const displayDepth = useTransform(springDepth, (v) => Math.round(v) + "m");

  return (
    <>
      {/* Fixed Left Zone Label */}
      <div className="fixed left-8 top-1/2 -translate-y-1/2 z-50 pointer-events-none -rotate-90 origin-left">
        <span className="text-[#00e5ff] opacity-40 font-mono text-xs tracking-[0.5em] uppercase">
          {zoneName} ZONE
        </span>
      </div>

      {/* Fixed Right Depth Gauge */}
      <div className="fixed right-8 top-1/2 -translate-y-1/2 flex flex-col items-center gap-4 z-50 pointer-events-none" style={{ fontFamily: 'var(--font-space-mono), monospace' }}>
        <div className="text-[#00e5ff] text-sm tracking-widest drop-shadow-[0_0_8px_rgba(0,229,255,0.8)]">
          0m
        </div>
        
        {/* The Gauge Container */}
        <div className="w-1 h-[200px] bg-white/10 rounded-full overflow-hidden relative shadow-[0_0_10px_rgba(0,229,255,0.2)]">
          {/* The Fill */}
          <div 
            className="absolute bottom-0 w-full rounded-full transition-all duration-300 ease-out"
            style={{
              height: `${depthPercent * 100}%`,
              background: 'linear-gradient(to top, #00e5ff, #ff6b35)'
            }}
          />
        </div>

        <div className="text-[#00e5ff] text-sm tracking-widest drop-shadow-[0_0_8px_rgba(0,229,255,0.8)]">
          4000m
        </div>

        {/* Current Depth Counter and Zone Label */}
        <div className="absolute -bottom-16 flex flex-col items-center">
          <motion.div className="text-white text-sm font-bold tracking-widest drop-shadow-md mb-2">
            {displayDepth}
          </motion.div>
          <div className="whitespace-nowrap text-[#00e5ff] text-xs tracking-[0.3em] font-bold drop-shadow-[0_0_10px_rgba(0,229,255,1)] transition-colors duration-500"
            style={{
              color: zoneName === 'MIDNIGHT' ? '#ff6b35' : '#00e5ff',
              textShadow: zoneName === 'MIDNIGHT' ? '0 0 10px rgba(255,107,53,1)' : '0 0 10px rgba(0,229,255,1)'
            }}
          >
            {zoneName}
          </div>
        </div>
      </div>
    </>
  );
}
