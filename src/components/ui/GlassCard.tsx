'use client';
import { motion, useMotionValue, useSpring, useTransform, useScroll, useVelocity } from 'framer-motion';
import React from 'react';

export default function GlassCard({ children, className = "" }: { children: React.ReactNode, className?: string }) {
  const { scrollY } = useScroll();
  const scrollVelocity = useVelocity(scrollY);
  const velocitySpring = useSpring(scrollVelocity, { stiffness: 100, damping: 30 });
  const scrollYOffset = useTransform(velocitySpring, [-2000, 2000], [-40, 40]);

  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const mouseXSpring = useSpring(x);
  const mouseYSpring = useSpring(y);

  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["7.5deg", "-7.5deg"]);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-7.5deg", "7.5deg"]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const xPct = mouseX / width - 0.5;
    const yPct = mouseY / height - 0.5;
    x.set(xPct);
    y.set(yPct);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  const lightX = useTransform(mouseXSpring, [-0.5, 0.5], ["0%", "100%"]);
  const lightY = useTransform(mouseYSpring, [-0.5, 0.5], ["0%", "100%"]);
  const sheenAngle = useTransform(mouseXSpring, [-0.5, 0.5], [120, 240]);

  return (
    <motion.div
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ rotateX, rotateY, y: scrollYOffset, transformStyle: "preserve-3d" }}
      className={`relative group bg-[#020810aa] border border-[#00e5ff22] backdrop-blur-[20px] rounded-[24px] overflow-hidden p-8 transition-all hover:border-[#00e5ff66] hover:shadow-[0_0_40px_rgba(0,229,255,0.15)] turtle-obstacle ${className}`}
    >
      {/* Anisotropic Sheen Pass */}
      <motion.div 
        className="absolute inset-0 pointer-events-none opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{
          background: useTransform(sheenAngle, (angle) => 
            `linear-gradient(${angle}deg, transparent 0%, rgba(0, 229, 255, 0.08) 45%, rgba(255, 255, 255, 0.15) 50%, rgba(0, 229, 255, 0.08) 55%, transparent 100%)`
          ),
          left: lightX,
          top: lightY,
          transform: 'translate(-50%, -50%) scale(2)',
        }}
      />
      
      {/* Position-aware Tint */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(circle at center, transparent 0%, rgba(0, 109, 143, 0.1) 100%)`
        }}
      />

      <div className="relative z-10" style={{ transform: "translateZ(40px)" }}>
        {children}
      </div>
    </motion.div>
  );
}
