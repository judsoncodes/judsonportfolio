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

  const pressure = (1 + depth / 10).toFixed(1);
  const temp = Math.max(2.1, 26.5 - (depth / 100)).toFixed(1); // Rapid drop in first few hundred meters
  const deepTemp = Math.max(2.1, 4.0 - (depth / 4000) * 2).toFixed(1);
  const finalTemp = depth > 500 ? deepTemp : temp;

  const springDepth = useSpring(depth, { bounce: 0, duration: 0.5 });
  
  // Ticker offset logic: 100 units = 100m
  const tickerY = useTransform(springDepth, (v) => -v % 100);

  return (
    <>
      {/* Vertical Ticker */}
      <div className="fixed right-10 top-1/2 -translate-y-1/2 z-50 pointer-events-none flex items-center gap-6 font-mono text-white/80">
        
        {/* Readings Panel */}
        <div className="flex flex-col gap-4 text-right">
            <div className="flex flex-col">
                <span className="text-[10px] opacity-40 uppercase tracking-tighter">Pressure</span>
                <span className="text-[#00e5ff] text-sm leading-none">{pressure} <span className="text-[10px]">ATM</span></span>
            </div>
            <div className="flex flex-col">
                <span className="text-[10px] opacity-40 uppercase tracking-tighter">Temp</span>
                <span className="text-[#ff6b35] text-sm leading-none">{finalTemp} <span className="text-[10px]">°C</span></span>
            </div>
        </div>

        {/* Ticker Scale */}
        <div className="relative h-[240px] w-20 flex items-center justify-end overflow-hidden border-r border-white/10 pr-2">
            {/* The Moving Scale */}
            <motion.div 
                className="absolute right-2 flex flex-col items-end gap-0"
                style={{ y: tickerY }}
            >
                {Array.from({ length: 11 }).map((_, i) => {
                    const currentTickDepth = Math.floor(depth / 100) * 100 + (i - 5) * 100;
                    if (currentTickDepth < 0) return null;
                    return (
                        <div key={i} className="h-[100px] flex flex-col justify-center items-end">
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] opacity-60">{currentTickDepth}m</span>
                                <div className="w-4 h-[1px] bg-white/40" />
                            </div>
                            <div className="h-[25px] w-2 bg-white/20 mr-0" />
                            <div className="h-[25px] w-3 bg-white/20 mr-0" />
                            <div className="h-[25px] w-2 bg-white/20 mr-0" />
                        </div>
                    );
                })}
            </motion.div>

            {/* Red Needle */}
            <div className="absolute right-0 top-1/2 -translate-y-1/2 flex items-center">
                <div className="w-8 h-[2px] bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.8)] z-10" />
                <div className="absolute right-[-4px] w-0 h-0 border-t-[4px] border-t-transparent border-b-[4px] border-b-transparent border-r-[6px] border-r-red-500" />
            </div>
        </div>
      </div>

      {/* Fixed Left Zone Label */}
      <div className="fixed left-8 top-1/2 -translate-y-1/2 z-50 pointer-events-none -rotate-90 origin-left">
        <span className="text-[#00e5ff] opacity-40 font-mono text-xs tracking-[0.5em] uppercase">
          {zoneName} ZONE
        </span>
      </div>
    </>
  );
}
