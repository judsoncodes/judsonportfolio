'use client';

import { useEffect, useRef, useState } from 'react';
import { useStore } from '@/lib/store/useStore';
import { Boid, Food, Vector2 } from '@/lib/physics/boids';
import { Jellyfish, SeaTurtle, Anglerfish } from '@/lib/physics/creatures';
import { audioEngine } from '@/lib/audio/AudioEngine';

function interpolateColor(color1: number[], color2: number[], factor: number) {
  const result = color1.slice();
  for (let i = 0; i < 3; i++) {
    result[i] = Math.round(result[i] + factor * (color2[i] - color1[i]));
  }
  return `rgb(${result[0]}, ${result[1]}, ${result[2]})`;
}

export default function CanvasEngine() {
  const bgRef = useRef<HTMLCanvasElement>(null);
  const creaturesRef = useRef<HTMLCanvasElement>(null);
  const atmosphereRef = useRef<HTMLCanvasElement>(null);

  const pointerRef = useRef<Vector2>({ x: -1000, y: -1000 });
  const foodsRef = useRef<Food[]>([]);

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

    const bgCtx = bgRef.current?.getContext('2d');
    const creaturesCtx = creaturesRef.current?.getContext('2d');
    const atmosphereCtx = atmosphereRef.current?.getContext('2d');

    if (!bgCtx || !creaturesCtx || !atmosphereCtx) return;

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
      [bgRef, creaturesRef, atmosphereRef].forEach((ref) => {
        if (ref.current) {
          ref.current.width = window.innerWidth;
          ref.current.height = window.innerHeight;
        }
      });
    };

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(document.body);
    resize();

    const particles = Array.from({ length: 300 }).map(() => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      radius: Math.random() * 1.5 + 0.5,
      speedY: Math.random() * 0.5 + 0.1,
      speedX: Math.random() * 0.2 - 0.1,
      opacity: Math.random() * 0.5 + 0.2
    }));

    const rays = Array.from({ length: 8 }).map(() => ({
      x: Math.random() * window.innerWidth,
      width: Math.random() * 100 + 50,
      angle: Math.PI / 6 + (Math.random() * 0.1 - 0.05),
      speed: Math.random() * 0.01 + 0.005,
      opacity: Math.random() * 0.15 + 0.05
    }));

    const boids = Array.from({ length: 60 }).map(() => {
      const b = new Boid(window.innerWidth + Math.random() * 500, Math.random() * window.innerHeight);
      b.vel.x = -2; // swim left on spawn
      return b;
    });
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

      const activeBoidCount = isDegraded ? 25 : 60;
      const activeParticleCount = isDegraded ? 80 : 300;
      const drawGodRays = !isDegraded;
      const updateTentacles = !isDegraded;

      const state = useStore.getState();
      const depthPercent = state.depthPercent;
      const scrollVelocity = Math.abs(state.depth - lastScrollY);
      lastScrollY = state.depth;

      const w = window.innerWidth;
      const h = window.innerHeight;

      foodsRef.current = foodsRef.current.filter((f) => Date.now() - f.createdAt < 4000);

      // 1. BG
      bgCtx.clearRect(0, 0, w, h);
      let topColor, bottomColor;
      if (depthPercent <= 0.33) {
        const p = depthPercent / 0.33;
        topColor = interpolateColor([13, 59, 79], [7, 21, 37], p);
        bottomColor = interpolateColor([7, 21, 37], [2, 8, 16], p);
      } else if (depthPercent <= 0.66) {
        const p = (depthPercent - 0.33) / 0.33;
        topColor = interpolateColor([7, 21, 37], [2, 8, 16], p);
        bottomColor = interpolateColor([2, 8, 16], [1, 4, 8], p);
      } else {
        const p = (depthPercent - 0.66) / 0.34;
        topColor = interpolateColor([2, 8, 16], [1, 4, 8], p);
        bottomColor = interpolateColor([1, 4, 8], [2, 8, 16], p);
      }

      const grad = bgCtx.createLinearGradient(0, 0, 0, h);
      grad.addColorStop(0, topColor);
      grad.addColorStop(1, bottomColor);
      bgCtx.fillStyle = grad;
      bgCtx.fillRect(0, 0, w, h);

      const surfaceY = 100 - (state.depth * 0.8);
      if (surfaceY < h + 150) {
        bgCtx.beginPath();
        bgCtx.moveTo(0, h);
        bgCtx.lineTo(0, surfaceY);
        for (let x = 0; x <= w; x += 20) {
          const y = surfaceY + Math.sin(x * 0.008 + time * 0.02) * 25 + Math.cos(x * 0.003 + time * 0.015) * 15;
          bgCtx.lineTo(x, y);
        }
        bgCtx.lineTo(w, h);
        bgCtx.closePath();
        bgCtx.fillStyle = 'rgba(0, 229, 255, 0.2)';
        bgCtx.fill();
      }

      // 2. CREATURES
      creaturesCtx.clearRect(0, 0, w, h);
      
      foodsRef.current.forEach((food) => {
        food.y += 0.5;
        creaturesCtx.beginPath();
        creaturesCtx.arc(food.x, food.y, 2, 0, Math.PI * 2);
        creaturesCtx.fillStyle = '#FFD700';
        creaturesCtx.fill();
      });

      const boidOpacity = depthPercent > 0.66 ? 0 : Math.max(1 - (depthPercent / 0.66), 0.1);
      if (boidOpacity > 0) {
        for (let i = 0; i < activeBoidCount; i++) {
          const boid = boids[i];
          boid.update(boids.slice(0, activeBoidCount), pointerRef.current, foodsRef.current, w, h, depthPercent);
          
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

      const snowOpacityMult = depthPercent >= 0.66 ? 1.5 : Math.max(1 - (Math.pow(depthPercent, 2) * 1.5), 0.2);
      const extraSpeed = scrollVelocity * 0.08;

      for (let i = 0; i < activeParticleCount; i++) {
        const p = particles[i];
        p.y += p.speedY + extraSpeed;
        p.x += p.speedX + Math.sin(time * 0.01 + p.y * 0.01) * 0.5;

        if (p.y > h) p.y = 0;
        if (p.x > w) p.x = 0;
        if (p.x < 0) p.x = w;

        atmosphereCtx.beginPath();
        atmosphereCtx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        atmosphereCtx.fillStyle = `rgba(255, 255, 255, ${Math.min(p.opacity * snowOpacityMult, 1)})`;
        atmosphereCtx.fill();
      }

      if (drawGodRays && depthPercent < 0.6) {
        const rayFade = Math.max(1 - (depthPercent / 0.4), 0);
        if (rayFade > 0) {
          rays.forEach((ray, i) => {
            const osc = Math.sin(time * ray.speed + i);
            const currentOpacity = ray.opacity * rayFade * (0.8 + osc * 0.2);

            atmosphereCtx.beginPath();
            const xTop = ray.x + osc * 50;
            const xBottom = xTop + Math.tan(ray.angle) * h;
            
            atmosphereCtx.moveTo(xTop, 0);
            atmosphereCtx.lineTo(xTop + ray.width, 0);
            atmosphereCtx.lineTo(xBottom + ray.width * 1.5, h);
            atmosphereCtx.lineTo(xBottom, h);
            atmosphereCtx.closePath();

            const rayGrad = atmosphereCtx.createLinearGradient(xTop, 0, xBottom, h);
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
      <canvas ref={bgRef} className="fixed inset-0 pointer-events-none" style={{ zIndex: 0 }} aria-hidden="true" role="presentation" />
      <canvas ref={creaturesRef} className="fixed inset-0 pointer-events-none" style={{ zIndex: 1 }} aria-hidden="true" role="presentation" />
      <canvas ref={atmosphereRef} className="fixed inset-0 pointer-events-none mix-blend-screen" style={{ zIndex: 2 }} aria-hidden="true" role="presentation" />
    </>
  );
}
