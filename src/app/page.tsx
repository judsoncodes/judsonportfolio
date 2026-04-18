'use client';

import CanvasEngine from "@/components/canvas/CanvasEngine";
import PressureVignette from "@/components/ui/PressureVignette";
import DepthGauge from "@/components/ui/DepthGauge";
import GlassCard from "@/components/ui/GlassCard";
import SonarSkills from "@/components/ui/SonarSkills";
import SoundToggle from "@/components/ui/SoundToggle";
import { useStore } from "@/lib/store/useStore";
import { motion } from "framer-motion";
import { ExternalLink, Mail, Phone, MapPin, Download } from 'lucide-react';

const GithubIcon = ({ size = 24, className = "" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.02c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A4.8 4.8 0 0 0 8 18v4"></path>
  </svg>
);

const LinkedinIcon = ({ size = 24, className = "" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path>
    <rect x="2" y="9" width="4" height="12"></rect>
    <circle cx="4" cy="4" r="2"></circle>
  </svg>
);

function EcoBadge() {
  const ecoMode = useStore((state) => state.ecoMode);
  if (!ecoMode) return null;
  return (
    <div className="fixed bottom-4 left-4 z-[100] text-[#00e5ff] font-mono text-xs opacity-50 pointer-events-none tracking-widest">
      [ ECO MODE ]
    </div>
  );
}

const sectionVariants = {
  hidden: { opacity: 0, y: 50 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: "easeOut" } }
};

// Legendary hero animations
const heroContainerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.3,
    }
  }
};

const glitchTitleVariants = {
  hidden: { opacity: 0, x: -100, skewX: 30, filter: "blur(20px)" },
  visible: {
    opacity: 1, 
    x: 0, 
    skewX: 0, 
    filter: "blur(0px)",
    transition: {
      type: "spring", 
      stiffness: 150, 
      damping: 12, 
      mass: 0.8
    }
  }
};

const popItemVariants = {
  hidden: { opacity: 0, y: 40, scale: 0.8, filter: "blur(10px)" },
  visible: { 
    opacity: 1, 
    y: 0, 
    scale: 1, 
    filter: "blur(0px)",
    transition: { 
      type: "spring", stiffness: 120, damping: 14, mass: 1 
    }
  }
};

export default function Home() {
  const introComplete = useStore((state) => state.introComplete);

  return (
    <main className="relative w-full text-white overflow-hidden font-sans">
      <CanvasEngine />
      <PressureVignette />
      <DepthGauge />
      <SoundToggle />
      <EcoBadge />

      {/* Content Container */}
      <div className="relative z-10 w-full max-w-6xl mx-auto px-6 lg:px-12 pb-48">
        
        {/* HERO SECTION (0m - Sunlit) */}
        <section className="min-h-screen flex flex-col justify-center pt-20">
          <motion.div 
            initial="hidden" 
            animate={introComplete ? "visible" : "hidden"} 
            variants={heroContainerVariants}
          >
            <motion.div variants={popItemVariants} className="text-[#00e5ff] font-mono tracking-[0.3em] text-sm mb-4">0m // SUNLIT ZONE</motion.div>
            <motion.h1 variants={glitchTitleVariants} className="font-['var(--font-playfair)'] text-7xl md:text-9xl font-black mb-6 tracking-tight bg-gradient-to-br from-white to-[#00e5ff] bg-clip-text text-transparent drop-shadow-[0_0_15px_rgba(0,229,255,0.3)]">
              Judson J
            </motion.h1>
            <motion.h2 variants={popItemVariants} className="text-2xl md:text-3xl text-white/90 mb-8 font-light">
              CS Engineer <span className="text-[#00e5ff]">·</span> ML <span className="text-[#00e5ff]">·</span> Full Stack Developer
            </motion.h2>
            <motion.p variants={popItemVariants} className="max-w-2xl text-lg text-white/70 mb-12 leading-relaxed">
              Motivated problem-solver passionate about ML, data science, and building real-world systems. 300+ LeetCode problems solved. Building from Chennai.
            </motion.p>
            
            <motion.div variants={popItemVariants} className="flex flex-wrap gap-6">
              <a href="#projects" className="px-8 py-4 bg-[#00e5ff] text-[#020810] font-bold rounded-full hover:bg-white hover:scale-105 transition-all shadow-[0_0_20px_rgba(0,229,255,0.5)]">
                View Projects
              </a>
              <a href="/CV.pdf" className="px-8 py-4 bg-transparent border border-[#00e5ff] text-[#00e5ff] font-bold rounded-full hover:bg-[#00e5ff11] hover:scale-105 transition-all flex items-center gap-2">
                <Download size={20} /> Download CV
              </a>
            </motion.div>
          </motion.div>
        </section>

        {/* ABOUT & STATS */}
        <section className="py-32">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={heroContainerVariants}>
            <motion.div variants={popItemVariants} className="text-[#00e5ff] font-mono tracking-[0.3em] text-sm mb-12">400m // SUNLIT DESCENT</motion.div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <motion.div variants={popItemVariants}>
                <GlassCard className="text-center h-full">
                  <h3 className="text-4xl font-bold text-white mb-2">300+</h3>
                  <p className="text-[#00e5ff] font-mono text-xs uppercase tracking-widest">LeetCode</p>
                </GlassCard>
              </motion.div>
              <motion.div variants={popItemVariants}>
                <GlassCard className="text-center h-full">
                  <h3 className="text-4xl font-bold text-white mb-2">8.0</h3>
                  <p className="text-[#00e5ff] font-mono text-xs uppercase tracking-widest">CGPA</p>
                </GlassCard>
              </motion.div>
              <motion.div variants={popItemVariants}>
                <GlassCard className="text-center h-full">
                  <h3 className="text-4xl font-bold text-white mb-2">2</h3>
                  <p className="text-[#00e5ff] font-mono text-xs uppercase tracking-widest">Core Projects</p>
                </GlassCard>
              </motion.div>
              <motion.div variants={popItemVariants}>
                <GlassCard className="text-center h-full">
                  <h3 className="text-4xl font-bold text-white mb-2">4+</h3>
                  <p className="text-[#00e5ff] font-mono text-xs uppercase tracking-widest">Certifications</p>
                </GlassCard>
              </motion.div>
            </div>
          </motion.div>
        </section>

        {/* SKILLS SECTION */}
        <section className="py-32">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={heroContainerVariants}>
            <motion.div variants={popItemVariants} className="text-[#00e5ff] font-mono tracking-[0.3em] text-sm mb-4">1000m // TWILIGHT ZONE</motion.div>
            <motion.h2 variants={glitchTitleVariants} className="font-['var(--font-playfair)'] text-5xl font-black mb-12">Sonar Skills</motion.h2>
            <motion.div variants={popItemVariants}>
              <SonarSkills />
            </motion.div>
          </motion.div>
        </section>

        {/* PROJECTS SECTION */}
        <section id="projects" className="py-32">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={heroContainerVariants}>
            <motion.div variants={popItemVariants} className="text-[#00e5ff] font-mono tracking-[0.3em] text-sm mb-4">1800m // DEEP TWILIGHT</motion.div>
            <motion.h2 variants={glitchTitleVariants} className="font-['var(--font-playfair)'] text-5xl font-black mb-12">Featured Expeditions</motion.h2>
            
            <div className="grid md:grid-cols-2 gap-10">
              <motion.div variants={popItemVariants}>
                <GlassCard className="h-full">
                  <div className="text-[#00e5ff] font-mono text-xs mb-4">07/2025 – 09/2025</div>
                  <h3 className="text-3xl font-bold mb-4 flex justify-between items-center">
                    SecureSight <a href="#" aria-label="View SecureSight Project" className="text-white/30 hover:text-white transition-colors focus:outline-none"><ExternalLink /></a>
                  </h3>
                  <p className="text-white/70 mb-8 leading-relaxed">
                    ML-based intrusion detection system for real-time threat detection and anomaly classification.
                  </p>
                  <div className="flex gap-3 flex-wrap mt-auto">
                    <span className="px-3 py-1 rounded-full bg-[#00e5ff22] border border-[#00e5ff44] text-xs text-[#00e5ff]">Python</span>
                    <span className="px-3 py-1 rounded-full bg-[#00e5ff22] border border-[#00e5ff44] text-xs text-[#00e5ff]">Machine Learning</span>
                    <span className="px-3 py-1 rounded-full bg-[#00e5ff22] border border-[#00e5ff44] text-xs text-[#00e5ff]">Security</span>
                  </div>
                </GlassCard>
              </motion.div>

              <motion.div variants={popItemVariants}>
                <GlassCard className="h-full">
                  <div className="text-[#00e5ff] font-mono text-xs mb-4">06/2025 – 09/2025</div>
                  <h3 className="text-3xl font-bold mb-4 flex justify-between items-center">
                    UrbanConnect <a href="#" aria-label="View UrbanConnect Project" className="text-white/30 hover:text-white transition-colors focus:outline-none"><ExternalLink /></a>
                  </h3>
                  <p className="text-white/70 mb-8 leading-relaxed">
                    A dynamic system empowering citizens to report city issues and receive real-time service alerts and updates.
                  </p>
                  <div className="flex gap-3 flex-wrap mt-auto">
                    <span className="px-3 py-1 rounded-full bg-[#00e5ff22] border border-[#00e5ff44] text-xs text-[#00e5ff]">Full Stack</span>
                    <span className="px-3 py-1 rounded-full bg-[#00e5ff22] border border-[#00e5ff44] text-xs text-[#00e5ff]">React.js</span>
                    <span className="px-3 py-1 rounded-full bg-[#00e5ff22] border border-[#00e5ff44] text-xs text-[#00e5ff]">Node.js</span>
                  </div>
                </GlassCard>
              </motion.div>
            </div>
          </motion.div>
        </section>

        {/* ACHIEVEMENTS & CERTIFICATIONS */}
        <section className="py-32">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={heroContainerVariants}>
            <motion.div variants={popItemVariants} className="text-[#ff6b35] font-mono tracking-[0.3em] text-sm mb-4">2800m // MIDNIGHT DESCENT</motion.div>
            <motion.h2 variants={glitchTitleVariants} className="font-['var(--font-playfair)'] text-5xl font-black mb-12">Logbook & Honors</motion.h2>
            
            <div className="grid md:grid-cols-2 gap-10">
              <motion.div variants={popItemVariants} className="space-y-6">
                <h3 className="text-2xl font-bold text-[#00e5ff] mb-6 border-b border-white/10 pb-4">Achievements</h3>
                <ul className="space-y-4">
                  <li className="flex gap-4">
                    <div className="w-2 h-2 rounded-full bg-[#ff6b35] mt-2 shadow-[0_0_8px_#ff6b35]"></div>
                    <div>
                      <p className="font-bold">IBM Cloud Skills</p>
                      <p className="text-white/60 text-sm">Python for Data Science & SQL Basics</p>
                    </div>
                  </li>
                  <li className="flex gap-4">
                    <div className="w-2 h-2 rounded-full bg-[#ff6b35] mt-2 shadow-[0_0_8px_#ff6b35]"></div>
                    <div>
                      <p className="font-bold">Cisco Academy</p>
                      <p className="text-white/60 text-sm">Cybersecurity, IoT, Modern AI</p>
                    </div>
                  </li>
                  <li className="flex gap-4">
                    <div className="w-2 h-2 rounded-full bg-[#ff6b35] mt-2 shadow-[0_0_8px_#ff6b35]"></div>
                    <div>
                      <p className="font-bold">300+ LeetCode</p>
                      <p className="text-white/60 text-sm">Strong foundation in DSA & C++</p>
                    </div>
                  </li>
                </ul>
              </motion.div>

              <motion.div variants={popItemVariants} className="space-y-6">
                <h3 className="text-2xl font-bold text-[#00e5ff] mb-6 border-b border-white/10 pb-4">Certifications</h3>
                <ul className="space-y-4">
                  <li className="flex gap-4">
                    <div className="w-2 h-2 rounded-full bg-[#00e5ff] mt-2 shadow-[0_0_8px_#00e5ff]"></div>
                    <div>
                      <p className="font-bold">React.js Certificate of Excellence</p>
                      <p className="text-white/60 text-sm">Scaler Topics (June 2025)</p>
                    </div>
                  </li>
                  <li className="flex gap-4">
                    <div className="w-2 h-2 rounded-full bg-[#00e5ff] mt-2 shadow-[0_0_8px_#00e5ff]"></div>
                    <div>
                      <p className="font-bold">MongoDB for Developers</p>
                      <p className="text-white/60 text-sm">MongoDB University</p>
                    </div>
                  </li>
                  <li className="flex gap-4">
                    <div className="w-2 h-2 rounded-full bg-[#00e5ff] mt-2 shadow-[0_0_8px_#00e5ff]"></div>
                    <div>
                      <p className="font-bold">Google Cloud Essentials</p>
                      <p className="text-white/60 text-sm">Google Cloud</p>
                    </div>
                  </li>
                  <li className="flex gap-4">
                    <div className="w-2 h-2 rounded-full bg-[#00e5ff] mt-2 shadow-[0_0_8px_#00e5ff]"></div>
                    <div>
                      <p className="font-bold">Cybersecurity Internship</p>
                      <p className="text-white/60 text-sm">Palo Alto Networks</p>
                    </div>
                  </li>
                </ul>
              </motion.div>
            </div>
          </motion.div>
        </section>

        {/* CONTACT SECTION */}
        <section className="py-32">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={heroContainerVariants}>
            <motion.div variants={popItemVariants} className="text-[#ff6b35] font-mono tracking-[0.3em] text-sm mb-4">4000m // THE ABYSS</motion.div>
            <motion.h2 variants={glitchTitleVariants} className="font-['var(--font-playfair)'] text-5xl font-black mb-12">Establish Comms</motion.h2>
            
            <motion.div variants={popItemVariants}>
              <GlassCard className="p-12">
                <div className="grid md:grid-cols-2 gap-12">
                  <div>
                    <p className="text-xl text-white/80 mb-8">
                      Currently open for new opportunities. Whether you have a question or just want to say hi, my inbox is always open.
                    </p>
                    <div className="flex gap-4">
                      <a href="https://github.com/judsoncodes" aria-label="GitHub Profile" target="_blank" rel="noreferrer" className="w-12 h-12 rounded-full bg-[#00e5ff22] border border-[#00e5ff44] flex items-center justify-center text-[#00e5ff] hover:bg-[#00e5ff] hover:text-[#020810] transition-colors focus:outline-none focus:ring-2 focus:ring-[#00e5ff]">
                        <GithubIcon size={20} />
                      </a>
                      <a href="https://linkedin.com/in/J-JUDSON-CSE" aria-label="LinkedIn Profile" target="_blank" rel="noreferrer" className="w-12 h-12 rounded-full bg-[#00e5ff22] border border-[#00e5ff44] flex items-center justify-center text-[#00e5ff] hover:bg-[#00e5ff] hover:text-[#020810] transition-colors focus:outline-none focus:ring-2 focus:ring-[#00e5ff]">
                        <LinkedinIcon size={20} />
                      </a>
                    </div>
                  </div>
                  
                  <div className="space-y-6">
                    <a href="mailto:jjudsoncse2024@citchennai.net" className="flex items-center gap-4 text-white/80 hover:text-[#00e5ff] transition-colors group">
                      <div className="w-10 h-10 rounded-full bg-[#00e5ff11] flex items-center justify-center group-hover:bg-[#00e5ff22]">
                        <Mail size={18} className="text-[#00e5ff]" />
                      </div>
                      jjudsoncse2024@citchennai.net
                    </a>
                    <a href="tel:+918106502995" className="flex items-center gap-4 text-white/80 hover:text-[#00e5ff] transition-colors group">
                      <div className="w-10 h-10 rounded-full bg-[#00e5ff11] flex items-center justify-center group-hover:bg-[#00e5ff22]">
                        <Phone size={18} className="text-[#00e5ff]" />
                      </div>
                      +91 81065 02995
                    </a>
                    <div className="flex items-center gap-4 text-white/80 group">
                      <div className="w-10 h-10 rounded-full bg-[#00e5ff11] flex items-center justify-center">
                        <MapPin size={18} className="text-[#00e5ff]" />
                      </div>
                      Chennai, India
                    </div>
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          </motion.div>
        </section>

      </div>
    </main>
  );
}
