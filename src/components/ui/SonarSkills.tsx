'use client';

import { useRef, useEffect, useState } from 'react';
import { motion, useInView } from 'framer-motion';

const skills = [
  { name: 'C++', level: 'Proficient', pct: 90 },
  { name: 'Python', level: 'Intermediate', pct: 70 },
  { name: 'SQL', level: 'Intermediate', pct: 70 },
  { name: 'React.js', level: 'Competent', pct: 80 },
  { name: 'Full Stack', level: 'Proficient', pct: 85 },
  { name: 'Java', level: 'Intermediate', pct: 60 },
];

export default function SonarSkills() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const [pulse, setPulse] = useState(false);

  useEffect(() => {
    if (isInView) {
      setTimeout(() => setPulse(true), 500); // trigger sonar
    }
  }, [isInView]);

  return (
    <div ref={ref} className="relative w-full max-w-4xl mx-auto py-20 mt-12 mb-24">
      {/* Sonar Rings */}
      {pulse && (
        <>
          <motion.div 
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border-[2px] border-[#00e5ff] opacity-0" 
            initial={{ width: 0, height: 0, opacity: 0.8 }} 
            animate={{ width: 1200, height: 1200, opacity: 0 }} 
            transition={{ duration: 2.5, ease: "easeOut" }} 
            style={{ zIndex: 0 }}
          />
          <motion.div 
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border-[1px] border-[#00e5ff] opacity-0" 
            initial={{ width: 0, height: 0, opacity: 0.5 }} 
            animate={{ width: 1200, height: 1200, opacity: 0 }} 
            transition={{ duration: 2.5, delay: 0.4, ease: "easeOut" }} 
            style={{ zIndex: 0 }}
          />
        </>
      )}

      <div className="grid grid-cols-2 md:grid-cols-3 gap-12 relative z-10">
        {skills.map((s, i) => (
          <div key={s.name} className="flex flex-col items-center">
            <div className="w-32 h-32 rounded-full border-2 border-[#00e5ff44] overflow-hidden relative bg-[#00e5ff11] shadow-[0_0_20px_rgba(0,229,255,0.1)]">
              {/* Water Fill */}
              <motion.div 
                className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-[#006d8f] to-[#00e5ff] opacity-80"
                initial={{ height: "0%" }}
                animate={{ height: pulse ? `${s.pct}%` : "0%" }}
                transition={{ duration: 2, delay: 0.5 + i * 0.15, ease: "circOut" }}
              />
              <div className="absolute inset-0 flex items-center justify-center font-bold text-white z-10 text-xl drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                {s.name}
              </div>
            </div>
            <p className="mt-4 text-[#00e5ff] font-mono text-sm uppercase tracking-[0.2em]">{s.level}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
