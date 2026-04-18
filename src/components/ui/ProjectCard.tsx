'use client';
import { motion, useMotionValue, useSpring, useTransform, useMotionTemplate, useScroll, useVelocity } from 'framer-motion';
import React from 'react';

export default function ProjectCard({ children, className = "" }: { children: React.ReactNode, className?: string }) {
  const { scrollY } = useScroll();
  const scrollVelocity = useVelocity(scrollY);
  const velocitySpring = useSpring(scrollVelocity, { stiffness: 100, damping: 30 });
  const scrollYOffset = useTransform(velocitySpring, [-2000, 2000], [-40, 40]);

  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const mouseXSpring = useSpring(x);
  const mouseYSpring = useSpring(y);

  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["12deg", "-12deg"]);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-12deg", "12deg"]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    x.set(mouseX / rect.width - 0.5);
    y.set(mouseY / rect.height - 0.5);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  const sheenX = useTransform(mouseXSpring, [-0.5, 0.5], ["0%", "100%"]);
  const sheenY = useTransform(mouseYSpring, [-0.5, 0.5], ["0%", "100%"]);

  // Holographic conic gradient mask logic
  const sheenGradient = useMotionTemplate`conic-gradient(from 0deg at ${sheenX} ${sheenY}, 
    rgba(255, 0, 128, 0.15) 0%, 
    rgba(121, 68, 255, 0.15) 15%, 
    rgba(0, 229, 255, 0.15) 30%, 
    rgba(0, 255, 128, 0.15) 45%, 
    rgba(255, 255, 0, 0.15) 60%, 
    rgba(255, 128, 0, 0.15) 75%, 
    rgba(255, 0, 128, 0.15) 100%)`;

  return (
    <motion.div
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ rotateX, rotateY, y: scrollYOffset, transformStyle: "preserve-3d" }}
      className={`relative group bg-[#020810aa] border border-[#00e5ff22] backdrop-blur-[20px] rounded-[24px] overflow-hidden p-8 transition-all hover:border-[#00e5ff66] hover:shadow-[0_0_40px_rgba(0,229,255,0.15)] turtle-obstacle ${className}`}
    >
      {/* Holographic Foil Layer */}
      <motion.div 
        className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500 mix-blend-screen"
        style={{ background: sheenGradient }}
      />

      {/* Glossy Reflection Pass */}
      <motion.div 
        className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-20 transition-opacity duration-500"
        style={{
          background: `linear-gradient(135deg, transparent 0%, rgba(255,255,255,0.5) 50%, transparent 100%)`,
          left: sheenX,
          top: sheenY,
          transform: 'translate(-50%, -50%) scale(2)'
        }}
      />

      <div className="relative z-10" style={{ transform: "translateZ(60px)" }}>
        {children}
      </div>
    </motion.div>
  );
}
