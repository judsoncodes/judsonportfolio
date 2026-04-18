'use client';

import { useEffect, useRef, useState } from 'react';
import { useStore } from '@/lib/store/useStore';
import { Boid, Food, Vector2, SpatialHash } from '@/lib/physics/boids';
import { Jellyfish, SeaTurtle, Anglerfish, Osedax, Whale, Octopus } from '@/lib/physics/creatures';
import { audioEngine } from '@/lib/audio/AudioEngine';

function interpolateColor(color1: number[], color2: number[], factor: number) {
  const result = color1.slice();
  for (let i = 0; i < 3; i++) {
    result[i] = Math.round(result[i] + factor * (color2[i] - color1[i]));
  }
  return `rgb(${result[0]}, ${result[1]}, ${result[2]})`;
}

// 2D Wave Equation Simulation for Pressure Ripples
class WaveGrid {
  width: number;
  height: number;
  buffer1: Float32Array;
  buffer2: Float32Array;
  cols: number;
  rows: number;
  res: number = 25; // 25px per cell

  constructor(w: number, h: number) {
    this.width = w;
    this.height = h;
    this.cols = Math.ceil(w / this.res) + 2;
    this.rows = Math.ceil(h / this.res) + 2;
    this.buffer1 = new Float32Array(this.cols * this.rows);
    this.buffer2 = new Float32Array(this.cols * this.rows);
  }

  update() {
    for (let i = 1; i < this.cols - 1; i++) {
      for (let j = 1; j < this.rows - 1; j++) {
        const idx = i + j * this.cols;
        this.buffer2[idx] = (
          this.buffer1[idx - 1] +
          this.buffer1[idx + 1] +
          this.buffer1[idx - this.cols] +
          this.buffer1[idx + this.cols]
        ) / 2 - this.buffer2[idx];
        this.buffer2[idx] *= 0.98; // damping
      }
    }
    // Swap
    const temp = this.buffer1;
    this.buffer1 = this.buffer2;
    this.buffer2 = temp;
  }

  splash(x: number, y: number, strength: number) {
    const gx = Math.floor(x / this.res);
    const gy = Math.floor(y / this.res);
    if (gx > 0 && gx < this.cols - 1 && gy > 0 && gy < this.rows - 1) {
      this.buffer1[gx + gy * this.cols] = strength;
    }
  }

  getDisplacement(x: number, y: number): { dx: number, dy: number } {
    const gx = Math.floor(x / this.res);
    const gy = Math.floor(y / this.res);
    if (gx > 1 && gx < this.cols - 2 && gy > 1 && gy < this.rows - 2) {
      const idx = gx + gy * this.cols;
      // Gradient of the wave field
      const dx = (this.buffer1[idx + 1] - this.buffer1[idx - 1]) * 2.0;
      const dy = (this.buffer1[idx + this.cols] - this.buffer1[idx - this.cols]) * 2.0;
      return { dx, dy };
    }
    return { dx: 0, dy: 0 };
  }
}


interface JumpingFish {
    x: number;
    y: number;
    vx: number;
    vy: number;
    angle: number;
}

interface Ripple {
    x: number;
    y: number;
    radius: number;
    opacity: number;
}

interface GlowTrail {
    x: number;
    y: number;
    createdAt: number;
}

interface InkParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  life: number;
}

interface VentParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  life: number;
  age: number;
}

interface Vent {
  x: number;
  y: number;
}

export default function CanvasEngine() {
  const creaturesRef = useRef<HTMLCanvasElement>(null);
  const atmosphereRef = useRef<HTMLCanvasElement>(null);

  const pointerRef = useRef<Vector2>({ x: -1000, y: -1000 });
  const foodsRef = useRef<Food[]>([]);
  const glowTrailsRef = useRef<GlowTrail[]>([]);

  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  useEffect(() => {
    if (reducedMotion) return;

    const creaturesCtx = creaturesRef.current?.getContext('2d');
    const atmosphereCtx = atmosphereRef.current?.getContext('2d');

    if (!creaturesCtx || !atmosphereCtx) return;

    let time = 0;
    let animationFrameId: number;
    let lastScrollY = useStore.getState().depth;

    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    let isDegraded = isMobile;
    useStore.getState().setEcoMode(isDegraded);

    let frames = 0;
    let lastSecond = performance.now();
    let lowFpsCount = 0;
    let lastRecoveryCheck = performance.now();

    const resize = () => {
      [creaturesRef, atmosphereRef].forEach((ref) => {
        if (ref.current) {
          ref.current.width = window.innerWidth;
          ref.current.height = window.innerHeight;
        }
      });
    };

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(document.body);
    resize();

    const waveGrid = new WaveGrid(window.innerWidth, window.innerHeight);

    const rays = Array.from({ length: 8 }).map(() => ({
      x: Math.random() * window.innerWidth,
      width: Math.random() * 100 + 50,
      angle: Math.PI / 6 + (Math.random() * 0.1 - 0.05),
      speed: Math.random() * 0.01 + 0.005,
      opacity: Math.random() * 0.15 + 0.05
    }));

    const particles = Array.from({ length: 400 }).map(() => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      radius: Math.random() * 1.4 + 0.4,   // Prompt 4: 0.4 - 1.8px
      speedY: Math.random() * 0.5 + 0.1,
      drift: Math.random() * 0.16 - 0.08, // Prompt 5: -0.08 to +0.08 px/frame
      opacity: Math.random() * 0.4 + 0.1  // Prompt 4: 0.1 - 0.5
    }));

    const boids = Array.from({ length: 500 }).map(() => {
      const b = new Boid(window.innerWidth + Math.random() * 1000, Math.random() * window.innerHeight);
      b.vel.x = -2; // swim left on spawn
      return b;
    });
    const boidHash = new SpatialHash(50);
    const jumpingFishes: JumpingFish[] = [];
    const ripples: Ripple[] = [];
    
    const jellyfish = new Jellyfish(window.innerWidth * 0.8, window.innerHeight + 100);
    const seaTurtle = new SeaTurtle(window.innerWidth * 0.5, window.innerHeight * 0.5);
    const anglerfish = new Anglerfish(window.innerWidth * 0.3, window.innerHeight * 0.7);
    const worms = Array.from({ length: 15 }).map((_, i) => {
      return new Osedax(window.innerWidth * (0.05 + i * 0.07) + (Math.random() - 0.5) * 50, window.innerHeight + 10);
    });
    const whale = new Whale();
    const octopus = new Octopus(window.innerWidth * 0.7, window.innerHeight * 0.4);
    const inkParticles: InkParticle[] = [];
    const vents: Vent[] = [
        { x: window.innerWidth * 0.2, y: window.innerHeight },
        { x: window.innerWidth * 0.5, y: window.innerHeight },
        { x: window.innerWidth * 0.8, y: window.innerHeight }
    ];
    const ventParticles: VentParticle[] = [];
    let baitBallCooldown = 0;
    let baitBallTarget: Vector2 | null = null;

    const handlePointerMove = (e: MouseEvent) => {
      const oldX = pointerRef.current.x;
      const oldY = pointerRef.current.y;
      pointerRef.current = { x: e.clientX, y: e.clientY };
      
      // Inject pressure into wave grid on movement
      const dist = Math.sqrt((e.clientX - oldX)**2 + (e.clientY - oldY)**2);
      if (dist > 5) {
        waveGrid.splash(e.clientX, e.clientY, Math.min(dist * 0.5, 50));
      }
    };

    const handleClick = (e: MouseEvent) => {
      const dx = e.clientX - octopus.x;
      const dy = e.clientY - octopus.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Trigger ink cloud if click is near octopus
      if (dist < 150) {
        for (let i = 0; i < 40; i++) {
          inkParticles.push({
            x: octopus.x,
            y: octopus.y,
            vx: (Math.random() - 0.5) * 4,
            vy: (Math.random() - 0.5) * 4,
            radius: Math.random() * 20 + 10,
            life: 1.0
          });
        }
        if (audioEngine) audioEngine.playBubble();
      }

      const state = useStore.getState();
      if (state.depthPercent >= 0.66) {
        const adx = e.clientX - anglerfish.x;
        const ady = e.clientY - anglerfish.y;
        if (Math.sqrt(adx * adx + ady * ady) < 150) {
          anglerfish.lunge();
        }
      }
      
      foodsRef.current.push({
        x: e.clientX,
        y: e.clientY,
        createdAt: Date.now()
      });
      if (audioEngine) audioEngine.playBubble();
    };

    const handleDoubleClick = (e: MouseEvent) => {
      for (let i = 0; i < 3; i++) {
        foodsRef.current.push({
          x: e.clientX + (Math.random() - 0.5) * 40,
          y: e.clientY + (Math.random() - 0.5) * 40,
          createdAt: Date.now()
        });
      }
    };

    window.addEventListener('mousemove', handlePointerMove);
    window.addEventListener('click', handleClick);
    window.addEventListener('dblclick', handleDoubleClick);

    const render = () => {
      const now = performance.now();
      frames++;
      
      if (now - lastSecond >= 1000) {
        const fps = frames;
        frames = 0;
        lastSecond = now;

        if (!isMobile) {
          if (fps < 50) {
            lowFpsCount++;
            if (lowFpsCount >= 3 && !isDegraded) {
              isDegraded = true;
              useStore.getState().setEcoMode(true);
            }
          } else {
            lowFpsCount = 0;
          }

          if (isDegraded && now - lastRecoveryCheck >= 5000) {
            lastRecoveryCheck = now;
            if (fps >= 58) {
              isDegraded = false;
              useStore.getState().setEcoMode(false);
            }
          }
        }
      }

      const activeBoidCount = isDegraded ? 150 : 500;
      const drawGodRays = !isDegraded;
      const updateTentacles = !isDegraded;

      const state = useStore.getState();
      const depthPercent = state.depthPercent;
      const scrollVelocity = Math.abs(state.depth - lastScrollY);
      lastScrollY = state.depth;

      const w = window.innerWidth;
      const h = window.innerHeight;

      foodsRef.current = foodsRef.current.filter((f) => Date.now() - f.createdAt < 4000);

      // 2. CREATURES
      creaturesCtx.clearRect(0, 0, w, h);
      
      const surfaceY = Math.max(0, h * 0.2 - lastScrollY * 0.8);

      // Spawn rare jumping fish only when near the surface
      if (depthPercent < 0.1 && Math.random() < 0.002 && jumpingFishes.length < 1) {
          if (surfaceY > 0 && surfaceY < h) {
              jumpingFishes.push({
                  x: w * 0.2 + Math.random() * (w * 0.6), // Spawn mostly in the middle 60%
                  y: surfaceY,
                  vx: (Math.random() - 0.5) * 3.0,
                  vy: -(Math.random() * 2.0 + 5.0),
                  angle: 0
              });
          }
      }

      // Update & Draw Ripples
      for (let i = ripples.length - 1; i >= 0; i--) {
          const r = ripples[i];
          r.radius += 0.8;
          r.opacity -= 0.015;
          if (r.opacity <= 0) {
              ripples.splice(i, 1);
          } else {
              creaturesCtx.beginPath();
              creaturesCtx.ellipse(r.x, surfaceY, r.radius * 2, r.radius * 0.5, 0, 0, Math.PI * 2);
              creaturesCtx.strokeStyle = `rgba(0, 229, 255, ${r.opacity * 0.6})`;
              creaturesCtx.lineWidth = 1.5;
              creaturesCtx.stroke();
          }
      }

      // Update & Draw Jumping Fishes
      for (let i = jumpingFishes.length - 1; i >= 0; i--) {
          const f = jumpingFishes[i];
          f.vy += 0.15; // smooth gravity
          f.x += f.vx;
          f.y += f.vy;
          f.angle = Math.atan2(f.vy, f.vx);
          
          if (f.vy > 0 && f.y >= surfaceY) {
              // Hits the water
              if (audioEngine && Math.random() < 0.5) audioEngine.playBubble(); // Optional subtle sound
              ripples.push({ x: f.x, y: surfaceY, radius: 2, opacity: 1.0 });
              jumpingFishes.splice(i, 1);
          } else {
              // Draw minimalistic elegant fish shape
              creaturesCtx.save();
              creaturesCtx.translate(f.x, f.y);
              creaturesCtx.rotate(f.angle);
              
              creaturesCtx.beginPath();
              creaturesCtx.moveTo(8, 0);
              creaturesCtx.lineTo(-6, 2);
              creaturesCtx.lineTo(-8, 0);
              creaturesCtx.lineTo(-6, -2);
              creaturesCtx.closePath();
              
              creaturesCtx.fillStyle = 'rgba(180, 240, 255, 0.9)';
              creaturesCtx.fill();
              creaturesCtx.restore();
          }
      }

      foodsRef.current.forEach((food) => {
        food.y += 0.5;
        creaturesCtx.beginPath();
        creaturesCtx.arc(food.x, food.y, 2, 0, Math.PI * 2);
        creaturesCtx.fillStyle = '#FFD700';
        creaturesCtx.fill();
      });

      // Boids fade in only AFTER the surface (0.05 to 0.15) and fade out before midnight (0.4 to 0.66)
      let boidOpacity = 0;
      if (depthPercent > 0.05 && depthPercent <= 0.66) {
         if (depthPercent < 0.15) {
            boidOpacity = (depthPercent - 0.05) / 0.1;
         } else if (depthPercent > 0.4) {
            boidOpacity = 1.0 - ((depthPercent - 0.4) / 0.26);
         } else {
            boidOpacity = 1.0;
         }
      }

      if (boidOpacity > 0) {
        // Update pressure waves
        waveGrid.update();
        
        // Bait Ball Logic (Defensive Sphere against Anglerfish)
        const dToAngler = Math.sqrt((anglerfish.x - w/2)**2 + (anglerfish.y - h/2)**2);
        if (dToAngler < 400 && baitBallCooldown <= 0 && depthPercent > 0.4) {
          baitBallTarget = { x: w/2, y: h/2 };
          baitBallCooldown = 400; // ~6.5 seconds
        }
        if (baitBallCooldown > 0) {
          baitBallCooldown--;
          if (baitBallCooldown < 50) baitBallTarget = null; // Begin dispersing
        }

        // Spatial Hashing Pass for high-performance neighbor lookups
        boidHash.clear();
        for (let i = 0; i < activeBoidCount; i++) {
          boidHash.insert(boids[i]);
        }

        for (let i = 0; i < activeBoidCount; i++) {
          const boid = boids[i];
          
          // Apply pressure wave displacement to boids
          const wave = waveGrid.getDisplacement(boid.pos.x, boid.pos.y);
          boid.vel.x += wave.dx;
          boid.vel.y += wave.dy;

          boid.update(boidHash, pointerRef.current, foodsRef.current, w, h, depthPercent, baitBallTarget);
          
          // Bioluminescent pulse trail emission
          if (!isDegraded && Math.sin(time * 0.1 + i) > 0.8) {
              glowTrailsRef.current.push({ x: boid.pos.x, y: boid.pos.y, createdAt: now });
          }
          
          foodsRef.current = foodsRef.current.filter((f) => {
            const d = Math.sqrt((boid.pos.x - f.x)**2 + (boid.pos.y - f.y)**2);
            return d > 10;
          });

          const angle = Math.atan2(boid.vel.y, boid.vel.x);
          creaturesCtx.save();
          creaturesCtx.translate(boid.pos.x, boid.pos.y);
          creaturesCtx.rotate(angle);
          
          creaturesCtx.beginPath();
          creaturesCtx.moveTo(boid.size, 0);
          creaturesCtx.lineTo(-boid.size, boid.size * 0.6);
          creaturesCtx.lineTo(-boid.size, -boid.size * 0.6);
          creaturesCtx.closePath();
          
          creaturesCtx.fillStyle = `rgba(0, 229, 255, ${0.7 * boidOpacity})`;
          creaturesCtx.fill();
          creaturesCtx.restore();
        }
      }

      const isTwilight = depthPercent >= 0.33 && depthPercent < 0.8;
      if (isTwilight) {
        // If degraded, update physics with active=false (skip verlet) but still draw the static ones
        jellyfish.update(pointerRef.current, updateTentacles);
        
        // Apply pressure wave to jellyfish tentacles
        jellyfish.tentacles.forEach(t => {
            t.nodes.forEach(n => {
                const wave = waveGrid.getDisplacement(n.x, n.y);
                n.x += wave.dx * 0.5;
                n.y += wave.dy * 0.5;
            });
        });

        jellyfish.draw(creaturesCtx, true);
        seaTurtle.draw(creaturesCtx, true);
      } else {
        jellyfish.update(pointerRef.current, false);
      }

      const isTwilightZone = depthPercent >= 0.25 && depthPercent < 0.66;
      octopus.update(time);
      octopus.draw(creaturesCtx, isTwilightZone);

      const isMidnight = depthPercent >= 0.66;
      if (isMidnight) {
        anglerfish.update(pointerRef.current);
      }
      anglerfish.draw(creaturesCtx, time, isMidnight);

      whale.update(time, depthPercent);
      whale.draw(creaturesCtx, time, isMidnight);

      const isAbyss = depthPercent >= 0.8;
      worms.forEach(worm => {
        worm.update(time);
        worm.draw(creaturesCtx, isAbyss);
      });

      // Hydrothermal Vents & Plumes
      if (isAbyss) {
          // Update & Draw Vents
          vents.forEach(v => {
              creaturesCtx.fillStyle = '#111';
              // Voxel-style rock column
              creaturesCtx.fillRect(v.x - 20, v.y - 60, 40, 60);
              creaturesCtx.fillRect(v.x - 10, v.y - 80, 20, 20);
              
              // Emit particles
              if (Math.random() < 0.4) {
                  ventParticles.push({
                      x: v.x + (Math.random() - 0.5) * 10,
                      y: v.y - 80,
                      vx: (Math.random() - 0.5) * 1,
                      vy: -1,
                      radius: Math.random() * 5 + 2,
                      life: 1.0,
                      age: 0
                  });
              }
          });

          // Update & Draw Plumes
          creaturesCtx.save();
          for (let i = ventParticles.length - 1; i >= 0; i--) {
              const p = ventParticles[i];
              p.age += 0.01;
              
              // Buoyancy: upward force inversely proportional to age
              const buoyancy = Math.max(0.5 / (p.age + 0.1), 0.1);
              p.vy -= buoyancy * 0.1;
              p.vx += Math.sin(time * 0.1 + p.y * 0.05) * 0.1; // Shimmer drift
              
              p.x += p.vx;
              p.y += p.vy;
              p.life -= 0.005;

              if (p.life <= 0 || p.y < 0) {
                  ventParticles.splice(i, 1);
                  continue;
              }

              const alpha = p.life * 0.4;
              const size = p.radius * (1 + p.age * 5);
              
              const pGrad = creaturesCtx.createRadialGradient(p.x, p.y, 0, p.x, p.y, size);
              pGrad.addColorStop(0, `rgba(60, 60, 70, ${alpha})`);
              pGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
              
              creaturesCtx.fillStyle = pGrad;
              creaturesCtx.beginPath();
              creaturesCtx.arc(p.x, p.y, size, 0, Math.PI * 2);
              creaturesCtx.fill();
          }
          creaturesCtx.restore();
      }

      // 3. ATMOSPHERE
      atmosphereCtx.clearRect(0, 0, w, h);

      // Bioluminescent Glow Trails
      if (!isDegraded) {
          glowTrailsRef.current = glowTrailsRef.current.filter(t => now - t.createdAt < 400);
          glowTrailsRef.current.forEach(t => {
              const lifeRatio = 1.0 - ((now - t.createdAt) / 400.0);
              const radius = 10 + (1.0 - lifeRatio) * 15; // Expands as it fades
              
              // Gaussian blur approximation via radial gradient
              const grad = atmosphereCtx.createRadialGradient(t.x, t.y, 0, t.x, t.y, radius);
              grad.addColorStop(0, `rgba(0, 255, 200, ${lifeRatio * 0.5})`);
              grad.addColorStop(0.4, `rgba(0, 229, 255, ${lifeRatio * 0.2})`);
              grad.addColorStop(1, 'rgba(0, 255, 200, 0)');
              
              atmosphereCtx.beginPath();
              atmosphereCtx.arc(t.x, t.y, radius, 0, Math.PI * 2);
              atmosphereCtx.fillStyle = grad;
              atmosphereCtx.fill();
          });
      }

      // Marine snow fades in as you go deeper. Surface is clean and minimal.
      // Marine Snow System (Prompts 1-5)
      const depth = state.depth;
      let snowDensityMult = 0;
      // Prompt 3: Fade in gradually between 200m and 600m
      if (depth > 200) {
          snowDensityMult = Math.min((depth - 200) / 400, 1.0);
      }
      // Intensify at Midnight and below
      if (depthPercent >= 0.66) snowDensityMult *= 1.5;

      const extraSpeed = scrollVelocity * 0.08;

      if (snowDensityMult > 0) {
          atmosphereCtx.save();
          // Prompt 2: Soft luminous halo
          atmosphereCtx.shadowBlur = 4;
          atmosphereCtx.shadowColor = 'rgba(255, 255, 255, 0.6)';
          
          const activeParticles = Math.floor(particles.length * Math.min(snowDensityMult, 1.0));

          for (let i = 0; i < activeParticles; i++) {
            const p = particles[i];
            // Prompt 5: Gentle horizontal drift
            p.x += p.drift + Math.sin(time * 0.01 + p.y * 0.01) * 0.2;
            p.y += p.speedY + extraSpeed;

            if (p.y > h) p.y = 0;
            if (p.x > w) p.x = 0;
            if (p.x < 0) p.x = w;

            // Prompt 4: Unique opacity
            atmosphereCtx.globalAlpha = p.opacity * Math.min(snowDensityMult, 1.0);
            
            // Prompt 1: High-fidelity circles
            atmosphereCtx.beginPath();
            atmosphereCtx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
            atmosphereCtx.fillStyle = 'white';
            atmosphereCtx.fill();
          }
          atmosphereCtx.restore();
      }

      if (drawGodRays && depthPercent < 0.6) {
        const rayFade = Math.max(1 - (depthPercent / 0.4), 0);
        if (rayFade > 0) {
          rays.forEach((ray, i) => {
            const osc = Math.sin(time * ray.speed + i);
            const currentOpacity = ray.opacity * rayFade * (0.8 + osc * 0.2);

            // Calculate exact surface level to prevent drawing in the sky
            const surfaceY = Math.max(0, h * 0.2 - lastScrollY * 0.8);

            atmosphereCtx.beginPath();
            const xTop = ray.x + osc * 50;
            const xBottom = xTop + Math.tan(ray.angle) * h;
            
            atmosphereCtx.moveTo(xTop, surfaceY);
            atmosphereCtx.lineTo(xTop + ray.width, surfaceY);
            atmosphereCtx.lineTo(xBottom + ray.width * 1.5, h);
            atmosphereCtx.lineTo(xBottom, h);
            atmosphereCtx.closePath();

            const rayGrad = atmosphereCtx.createLinearGradient(xTop, surfaceY, xBottom, h);
            rayGrad.addColorStop(0, `rgba(200, 240, 255, ${currentOpacity})`);
            rayGrad.addColorStop(1, `rgba(200, 240, 255, 0)`);
            
            atmosphereCtx.fillStyle = rayGrad;
            atmosphereCtx.fill();
          });
        }
      }



      // Ink Cloud Simulation (Brownian motion & decay)
      if (inkParticles.length > 0) {
        atmosphereCtx.save();
        for (let i = inkParticles.length - 1; i >= 0; i--) {
          const p = inkParticles[i];
          
          // Brownian motion + expansion
          p.x += p.vx + (Math.random() - 0.5) * 2;
          p.y += p.vy + (Math.random() - 0.5) * 2;
          p.vx *= 0.95;
          p.vy *= 0.95;
          p.radius += 0.5;
          p.life -= 0.008; // Roughly 3 seconds at 60fps

          if (p.life <= 0) {
            inkParticles.splice(i, 1);
            continue;
          }

          atmosphereCtx.globalAlpha = p.life * 0.7;
          atmosphereCtx.fillStyle = '#050510'; // Deep dark ink
          atmosphereCtx.beginPath();
          atmosphereCtx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
          atmosphereCtx.fill();
        }
        atmosphereCtx.restore();
      }

      time += 1;
      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('mousemove', handlePointerMove);
      window.removeEventListener('click', handleClick);
      window.removeEventListener('dblclick', handleDoubleClick);
      cancelAnimationFrame(animationFrameId);
    };
  }, [reducedMotion]);

  if (reducedMotion) {
    return <div className="fixed inset-0 -z-20 bg-gradient-to-b from-[#006d8f] to-[#020810]" />;
  }

  return (
    <>
      <canvas ref={creaturesRef} className="fixed inset-0 pointer-events-none" style={{ zIndex: 1 }} aria-hidden="true" role="presentation" />
      <canvas ref={atmosphereRef} className="fixed inset-0 pointer-events-none mix-blend-screen" style={{ zIndex: 2 }} aria-hidden="true" role="presentation" />
    </>
  );
}
