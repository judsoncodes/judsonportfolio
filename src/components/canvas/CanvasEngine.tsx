'use client';

import { useEffect, useRef, useState } from 'react';
import { useStore } from '@/lib/store/useStore';
import { Boid, Food, Vector2, SpatialHash } from '@/lib/physics/boids';
import { Jellyfish, SeaTurtle, Anglerfish } from '@/lib/physics/creatures';
import { audioEngine } from '@/lib/audio/AudioEngine';

function interpolateColor(color1: number[], color2: number[], factor: number) {
  const result = color1.slice();
  for (let i = 0; i < 3; i++) {
    result[i] = Math.round(result[i] + factor * (color2[i] - color1[i]));
  }
  return `rgb(${result[0]}, ${result[1]}, ${result[2]})`;
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

    const rays = Array.from({ length: 8 }).map(() => ({
      x: Math.random() * window.innerWidth,
      width: Math.random() * 100 + 50,
      angle: Math.PI / 6 + (Math.random() * 0.1 - 0.05),
      speed: Math.random() * 0.01 + 0.005,
      opacity: Math.random() * 0.15 + 0.05
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

    const handlePointerMove = (e: MouseEvent) => {
      pointerRef.current = { x: e.clientX, y: e.clientY };
    };

    const handleClick = (e: MouseEvent) => {
      if (audioEngine) audioEngine.playBubble();

      const state = useStore.getState();
      if (state.depthPercent >= 0.66) {
        const dx = e.clientX - anglerfish.x;
        const dy = e.clientY - anglerfish.y;
        if (Math.sqrt(dx * dx + dy * dy) < 150) {
          anglerfish.lunge();
        }
      }
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
        // Spatial Hashing Pass for high-performance neighbor lookups
        boidHash.clear();
        for (let i = 0; i < activeBoidCount; i++) {
          boidHash.insert(boids[i]);
        }

        for (let i = 0; i < activeBoidCount; i++) {
          const boid = boids[i];
          boid.update(boidHash, pointerRef.current, foodsRef.current, w, h, depthPercent);
          
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
        jellyfish.draw(creaturesCtx, true);
        seaTurtle.draw(creaturesCtx, true);
      } else {
        jellyfish.update(pointerRef.current, false);
      }

      const isMidnight = depthPercent >= 0.66;
      anglerfish.draw(creaturesCtx, time, isMidnight);

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
      let snowOpacityMult = 0.0;
      if (depthPercent > 0.05) {
          snowOpacityMult = Math.min((depthPercent - 0.05) / 0.1, 1.0);
      }
      if (depthPercent >= 0.66) snowOpacityMult = 1.5;

      const extraSpeed = scrollVelocity * 0.08;

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
