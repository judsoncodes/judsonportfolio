import { VerletNode, VerletLink } from './verlet';
import { Vector2, SpatialHash } from './boids';
import { audioEngine } from '../audio/AudioEngine';

export class Jellyfish {
  x: number;
  y: number;
  scale: number = 1;
  phase: number = 0;
  tentacles: { nodes: VerletNode[], links: VerletLink[] }[] = [];
  bellNodes: VerletNode[] = [];
  bellLinks: VerletLink[] = [];

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;

    // Soft-body Bell (12 nodes)
    for (let i = 0; i < 12; i++) {
        const angle = (i / 11) * Math.PI; // semi-circle
        const bx = x + Math.cos(angle - Math.PI) * 40;
        const by = y + Math.sin(angle - Math.PI) * 20;
        this.bellNodes.push(new VerletNode(bx, by));
    }
    // Links between nodes (peripheral)
    for (let i = 0; i < 11; i++) {
        this.bellLinks.push(new VerletLink(this.bellNodes[i], this.bellNodes[i+1], 15));
    }
    // Structural cross-links for elastic expansion
    for (let i = 0; i < 6; i++) {
        this.bellLinks.push(new VerletLink(this.bellNodes[i], this.bellNodes[11-i], 80));
    }

    for (let i = 0; i < 8; i++) {
      const nodes: VerletNode[] = [];
      const links: VerletLink[] = [];
      const startX = x + (i - 3.5) * 5;
      
      for (let j = 0; j < 8; j++) {
        nodes.push(new VerletNode(startX, y + j * 15));
      }
      for (let j = 0; j < 7; j++) {
        links.push(new VerletLink(nodes[j], nodes[j+1], 15));
      }
      this.tentacles.push({ nodes, links });
    }
  }

  update(cursor: Vector2, active: boolean) {
    if (!active) return;
    this.phase += 0.05;
    
    // Contraction pulse logic
    const pulse = Math.sin(this.phase);
    const isContracting = pulse > 0.5;
    
    // Propulsion: only moves up during contraction
    if (isContracting) {
        this.y -= 1.2;
    } else {
        this.y -= 0.1; // slow drift
    }

    // Update bell physics
    this.bellNodes.forEach((n, i) => {
        const targetX = this.x + Math.cos((i/11) * Math.PI - Math.PI) * 40 * (isContracting ? 0.6 : 1.0);
        const targetY = this.y + Math.sin((i/11) * Math.PI - Math.PI) * 20 * (isContracting ? 1.4 : 1.0);
        
        // Soft pull towards pulse target
        n.x += (targetX - n.x) * 0.1;
        n.y += (targetY - n.y) * 0.1;
        
        n.applyDrag(0.1);
        n.update(0); // no gravity for the bell
    });

    for (let i = 0; i < 5; i++) {
        this.bellLinks.forEach(l => l.resolve());
    }

    // Wrap around
    if (this.y < -200) this.y = window.innerHeight + 200;

    this.tentacles.forEach((t, index) => {
      // Anchor tentacles to bell base
      const anchorNodeIdx = Math.floor(2 + (index / 7) * 7);
      t.nodes[0].x = this.bellNodes[anchorNodeIdx].x;
      t.nodes[0].y = this.bellNodes[anchorNodeIdx].y;

      t.nodes.forEach(n => {
        const dx = n.x - cursor.x;
        const dy = n.y - cursor.y;
        const dist = Math.sqrt(dx*dx + dy*dy);
        if (dist < 100) {
          n.x += (dx / dist) * 2;
          n.y += (dy / dist) * 2;
        }
        
        // Fluid drag: Stokes' Law approximation
        // Slow drifts feel weightless, fast movements (interaction) feel viscous
        n.applyDrag(0.12);
        
        n.update(0.05); // Reduced gravity for underwater buoyancy
      });

      for (let i = 0; i < 3; i++) { 
        t.links.forEach(l => l.resolve());
      }
    });
  }

  draw(ctx: CanvasRenderingContext2D, active: boolean) {
    if (!active) return;
    ctx.save();
    
    // Soft-body Bell Glow
    const grad = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, 80);
    grad.addColorStop(0, 'rgba(120, 0, 255, 0.3)');
    grad.addColorStop(1, 'rgba(120, 0, 255, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(this.x, this.y, 80, 0, Math.PI * 2);
    ctx.fill();

    // Soft-body Bell Shell
    ctx.beginPath();
    ctx.moveTo(this.bellNodes[0].x, this.bellNodes[0].y);
    for (let i = 1; i < this.bellNodes.length; i++) {
        ctx.lineTo(this.bellNodes[i].x, this.bellNodes[i].y);
    }
    // Close the bell base with a slight curve
    ctx.quadraticCurveTo(this.x, this.y + 10, this.bellNodes[0].x, this.bellNodes[0].y);
    
    ctx.fillStyle = 'rgba(200, 150, 255, 0.6)';
    ctx.fill();
    ctx.restore();

    ctx.strokeStyle = 'rgba(200, 150, 255, 0.4)';
    ctx.lineWidth = 2;
    this.tentacles.forEach(t => {
      ctx.beginPath();
      ctx.moveTo(t.nodes[0].x, t.nodes[0].y);
      for (let i = 1; i < t.nodes.length; i++) {
        ctx.lineTo(t.nodes[i].x, t.nodes[i].y);
      }
      ctx.stroke();
    });
  }
}

export class SeaTurtle {
  x: number = 0;
  y: number = 0;
  progress: number = Math.random();
  points: Vector2[];
  angle: number = 0;

  constructor(w: number, h: number) {
    // Strategic control points that weave through the sunlit/twilight interface
    this.points = [
      { x: -200, y: h * 0.2 },
      { x: w * 0.3, y: h * 0.5 },
      { x: w * 0.7, y: h * 0.3 },
      { x: w + 200, y: h * 0.6 },
      { x: w * 0.5, y: h * 0.8 },
      { x: -200, y: h * 0.4 }
    ];
  }

  interpolate(p0: number, p1: number, p2: number, p3: number, t: number) {
    const v0 = (p2 - p0) * 0.5;
    const v1 = (p3 - p1) * 0.5;
    const t2 = t * t;
    const t3 = t2 * t;
    return (2 * p1 - 2 * p2 + v0 + v1) * t3 + (-3 * p1 + 3 * p2 - 2 * v0 - v1) * t2 + v0 * t + p1;
  }

  update(obstacles: { x: number, y: number, w: number, h: number }[]) {
    this.progress += 0.0004;
    if (this.progress > 1.0) this.progress = 0;

    const pCount = this.points.length;
    const i = Math.floor(this.progress * (pCount - 1));
    const t = (this.progress * (pCount - 1)) % 1;

    const p0 = this.points[Math.max(0, i - 1)];
    const p1 = this.points[i];
    const p2 = this.points[Math.min(pCount - 1, i + 1)];
    const p3 = this.points[Math.min(pCount - 1, i + 2)];

    const targetX = this.interpolate(p0.x, p1.x, p2.x, p3.x, t);
    const targetY = this.interpolate(p0.y, p1.y, p2.y, p3.y, t);

    // SDF Repulsion Force from UI Cards
    let offsetX = 0;
    let offsetY = 0;
    obstacles.forEach(rect => {
        // Simple SDF for box
        const dx = Math.max(rect.x - targetX, 0, targetX - (rect.x + rect.w));
        const dy = Math.max(rect.y - targetY, 0, targetY - (rect.y + rect.h));
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist < 150) {
            const force = (150 - dist) / 150;
            const dirX = targetX - (rect.x + rect.w / 2);
            const dirY = targetY - (rect.y + rect.h / 2);
            const mag = Math.sqrt(dirX * dirX + dirY * dirY);
            offsetX += (dirX / mag) * force * 100;
            offsetY += (dirY / mag) * force * 100;
        }
    });

    const nextX = targetX + offsetX;
    const nextY = targetY + offsetY;
    
    this.angle = Math.atan2(nextY - this.y, nextX - this.x);
    this.x = nextX;
    this.y = nextY;
  }

  draw(ctx: CanvasRenderingContext2D, active: boolean) {
    if (!active) return;

    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle);

    ctx.fillStyle = 'rgba(15, 80, 50, 0.85)';
    ctx.shadowBlur = 15;
    ctx.shadowColor = 'rgba(0, 255, 150, 0.2)';
    
    // Shell
    ctx.beginPath();
    ctx.ellipse(0, 0, 45, 35, 0, 0, Math.PI * 2);
    ctx.fill();

    // Flippers with swimming animation
    const swim = Math.sin(Date.now() * 0.002) * 0.2;
    ctx.beginPath();
    ctx.ellipse(25, -35, 25, 12, Math.PI / 4 + swim, 0, Math.PI * 2);
    ctx.ellipse(25, 35, 25, 12, -Math.PI / 4 - swim, 0, Math.PI * 2);
    ctx.ellipse(-30, -25, 18, 10, -Math.PI / 4 + swim, 0, Math.PI * 2);
    ctx.ellipse(-30, 25, 18, 10, Math.PI / 4 - swim, 0, Math.PI * 2);
    ctx.fill();

    // Head
    ctx.beginPath();
    ctx.arc(55, 0, 14, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }
}

enum AnglerState {
  IDLE,
  STALKING,
  LUNGE,
  RECOIL,
  REST
}

export class Anglerfish {
  x: number;
  y: number;
  baseX: number;
  baseY: number;
  state: AnglerState = AnglerState.IDLE;
  stateTime: number = 0;
  lungeX: number = 0;
  lungeY: number = 0;

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
    this.baseX = x;
    this.baseY = y;
  }

  lunge() {
    if (this.state !== AnglerState.LUNGE) {
      this.state = AnglerState.LUNGE;
      this.stateTime = Date.now();
      this.lungeX = this.x;
      this.lungeY = this.y;
    }
  }

  update(cursor: Vector2) {
    const now = Date.now();
    const dx = cursor.x - (this.x + 80); // Relative to lure
    const dy = cursor.y - (this.y - 30);
    const d = Math.sqrt(dx * dx + dy * dy);

    switch (this.state) {
      case AnglerState.IDLE:
        // Slow breathing drift
        this.x = this.baseX + Math.sin(now * 0.001) * 20;
        this.y = this.baseY + Math.cos(now * 0.0008) * 15;
        if (d < 350) this.state = AnglerState.STALKING;
        break;

      case AnglerState.STALKING:
        // Creeping towards target
        this.x += (cursor.x - 100 - this.x) * 0.02;
        this.y += (cursor.y - this.y) * 0.02;
        if (d < 100) this.lunge();
        if (d > 450) this.state = AnglerState.IDLE;
        break;

      case AnglerState.LUNGE:
        const lungeProgress = (now - this.stateTime) / 300;
        if (lungeProgress < 1.0) {
          // Explosive dash (using easing)
          const easeOut = 1 - Math.pow(1 - lungeProgress, 3);
          this.x = this.lungeX + (cursor.x - 100 - this.lungeX) * easeOut * 1.5;
        } else {
          this.state = AnglerState.RECOIL;
          this.stateTime = now;
          this.lungeX = this.x;
          this.lungeY = this.y;
        }
        break;

      case AnglerState.RECOIL:
        const recoilProgress = (now - this.stateTime) / 1000;
        if (recoilProgress < 1.0) {
          const easeInOut = recoilProgress < 0.5 ? 2 * recoilProgress * recoilProgress : 1 - Math.pow(-2 * recoilProgress + 2, 2) / 2;
          this.x = this.lungeX + (this.baseX - this.lungeX) * easeInOut;
          this.y = this.lungeY + (this.baseY - this.lungeY) * easeInOut;
        } else {
          this.state = AnglerState.REST;
          this.stateTime = now;
        }
        break;

      case AnglerState.REST:
        if (now - this.stateTime > 2000) {
          this.state = AnglerState.IDLE;
        }
        break;
    }
  }

  draw(ctx: CanvasRenderingContext2D, time: number, active: boolean) {
    if (!active) return;

    ctx.save();
    ctx.translate(this.x, this.y);

    // Sine-animated glow radius for photophore
    const glowPulse = 130 + Math.sin(time * 0.05) * 30;
    const grad = ctx.createRadialGradient(80, -30, 0, 80, -30, glowPulse);
    grad.addColorStop(0, 'rgba(0, 255, 100, 0.2)');
    grad.addColorStop(1, 'rgba(0, 255, 100, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(80, -30, glowPulse, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#050a0a';
    ctx.beginPath();
    ctx.ellipse(0, 0, 60, 40, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#111';
    ctx.beginPath();
    ctx.arc(30, -10, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(0,255,100,0.5)';
    ctx.beginPath();
    ctx.arc(32, -12, 2, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#222';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(40, -20);
    ctx.quadraticCurveTo(60, -60, 80, -30);
    ctx.stroke();

    const flicker = 0.5 + Math.sin(time * 0.1) * 0.5;
    ctx.fillStyle = `rgba(0, 255, 100, ${0.5 + flicker * 0.5})`;
    ctx.beginPath();
    ctx.arc(80, -30, 6, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }
}

// Simple pseudo-random noise for current simulation
function noise1D(x: number) {
  return Math.sin(x) * Math.sin(x * 1.2) * Math.sin(x * 0.5) * 0.5 + 0.5;
}

export class Osedax {
  nodes: VerletNode[] = [];
  links: VerletLink[] = [];
  anchorX: number;
  anchorY: number;
  timeOffset: number;

  constructor(x: number, y: number) {
    this.anchorX = x;
    this.anchorY = y;
    this.timeOffset = Math.random() * 1000;
    
    for (let i = 0; i < 20; i++) {
      this.nodes.push(new VerletNode(x, y - i * 5));
    }
    for (let i = 0; i < 19; i++) {
      this.links.push(new VerletLink(this.nodes[i], this.nodes[i+1], 5));
    }
  }

  update(time: number) {
    const t = time * 0.01 + this.timeOffset;
    
    // Layered noise for current
    const currentX = (noise1D(t) - 0.5) * 4.0 + (noise1D(t * 2.1) - 0.5) * 0.5;
    const currentY = (noise1D(t * 0.8) - 0.5) * 1.0;

    this.nodes.forEach((n, i) => {
      if (i === 0) {
        n.x = this.anchorX;
        n.y = this.anchorY;
      } else {
        // Apply current force (stronger at the tip)
        const tipFactor = i / 20;
        n.x += currentX * tipFactor;
        n.y += currentY * tipFactor;
        
        n.applyDrag(0.1);
        n.update(-0.02); // slight buoyancy (upwards gravity)
      }
    });

    for (let i = 0; i < 5; i++) {
      this.links.forEach(l => l.resolve());
    }
    
    // Hard anchor
    this.nodes[0].x = this.anchorX;
    this.nodes[0].y = this.anchorY;
  }

  draw(ctx: CanvasRenderingContext2D, active: boolean) {
    if (!active) return;
    
    ctx.save();
    ctx.lineWidth = 2;
    ctx.strokeStyle = 'rgba(255, 100, 150, 0.4)';
    
    this.nodes.forEach((n, i) => {
      const radius = 6 * (1 - i / 25);
      ctx.beginPath();
      ctx.arc(n.x, n.y, radius, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 100, 150, ${0.6 * (1 - i / 30)})`;
      ctx.fill();
      
      // Add small "hairs" or cilia
      if (i % 4 === 0) {
          ctx.beginPath();
          ctx.moveTo(n.x, n.y);
          ctx.lineTo(n.x + 8, n.y - 4);
          ctx.stroke();
      }
    });
    ctx.restore();
  }
}

export class Octopus {
  x: number;
  y: number;
  baseX: number;
  baseY: number;
  timeOffset: number;

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
    this.baseX = x;
    this.baseY = y;
    this.timeOffset = Math.random() * 1000;
  }

  update(time: number) {
    const t = time * 0.01 + this.timeOffset;
    this.x = this.baseX + Math.sin(t) * 100;
    this.y = this.baseY + Math.cos(t * 0.5) * 50;
  }

  draw(ctx: CanvasRenderingContext2D, active: boolean) {
    if (!active) return;
    ctx.save();
    ctx.translate(this.x, this.y);
    
    ctx.fillStyle = 'rgba(120, 40, 60, 0.8)';
    // Head
    ctx.beginPath();
    ctx.ellipse(0, 0, 30, 40, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Eyes
    ctx.fillStyle = 'white';
    ctx.beginPath();
    ctx.arc(-10, 10, 4, 0, Math.PI * 2);
    ctx.arc(10, 10, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'black';
    ctx.beginPath();
    ctx.arc(-10, 11, 2, 0, Math.PI * 2);
    ctx.arc(10, 11, 2, 0, Math.PI * 2);
    ctx.fill();

    // Tentacles (procedural sine)
    ctx.strokeStyle = 'rgba(120, 40, 60, 0.6)';
    ctx.lineWidth = 8;
    for (let i = 0; i < 8; i++) {
        const angle = (i / 8) * Math.PI + Math.PI * 0.25;
        const length = 60 + Math.sin(Date.now() * 0.005 + i) * 10;
        ctx.beginPath();
        ctx.moveTo(Math.cos(angle) * 15, Math.sin(angle) * 15);
        ctx.quadraticCurveTo(
            Math.cos(angle) * length * 0.5 + Math.sin(Date.now() * 0.002 + i) * 20,
            Math.sin(angle) * length * 0.5,
            Math.cos(angle) * length,
            Math.sin(angle) * length
        );
        ctx.stroke();
    }

    ctx.restore();
  }
}



export class Whale {
  x: number = 0;
  y: number = 0;
  progress: number = 0;
  points: Vector2[];
  dronePlayed: boolean = false;

  constructor() {
    this.points = [
      { x: -1000, y: 500 },
      { x: 400, y: 400 },
      { x: 1200, y: 600 },
      { x: 2000, y: 300 },
      { x: 3000, y: 500 }
    ];
  }

  // Cubic Hermite Spline
  interpolate(p0: number, p1: number, p2: number, p3: number, t: number) {
    const v0 = (p2 - p0) * 0.5;
    const v1 = (p3 - p1) * 0.5;
    const t2 = t * t;
    const t3 = t2 * t;
    return (2 * p1 - 2 * p2 + v0 + v1) * t3 + (-3 * p1 + 3 * p2 - 2 * v0 - v1) * t2 + v0 * t + p1;
  }

  update(time: number, depthPercent: number) {
    // Only migrates in Midnight zone (around 66%)
    if (depthPercent < 0.4 || depthPercent > 0.8) {
      this.progress = 0;
      this.dronePlayed = false;
      return;
    }

    this.progress += 0.0002;
    if (this.progress > 1.0) {
        this.progress = 0;
        this.dronePlayed = false;
    }

    const pCount = this.points.length;
    const i = Math.floor(this.progress * (pCount - 1));
    const t = (this.progress * (pCount - 1)) % 1;

    const p0 = this.points[Math.max(0, i - 1)];
    const p1 = this.points[i];
    const p2 = this.points[Math.min(pCount - 1, i + 1)];
    const p3 = this.points[Math.min(pCount - 1, i + 2)];

    this.x = this.interpolate(p0.x, p1.x, p2.x, p3.x, t);
    this.y = this.interpolate(p0.y, p1.y, p2.y, p3.y, t);

    // Trigger drone when whale is in view
    if (this.x > -200 && this.x < window.innerWidth + 200 && !this.dronePlayed) {
        if (audioEngine) audioEngine.playWhaleCall();
        this.dronePlayed = true;
    }
  }

  draw(ctx: CanvasRenderingContext2D, time: number, active: boolean) {
    if (!active || this.progress === 0) return;

    ctx.save();
    ctx.translate(this.x, this.y);
    
    // Scale up for a massive silhouette
    ctx.scale(3.5, 3.5);

    // Whale Body
    ctx.fillStyle = "rgba(10, 25, 45, 0.45)";
    ctx.beginPath();
    ctx.ellipse(0, 0, 100, 35, 0, 0, Math.PI * 2);
    ctx.fill();

 // Head bulge
 ctx.beginPath();
 ctx.ellipse(60, -5, 45, 30, 0, 0, Math.PI * 2);
 ctx.fill();

 // Tail Fluke (Procedural oscillation)
 const tailOsc = Math.sin(time * 0.015) * 12;
 ctx.save();
 ctx.translate(-95, 0);
 ctx.rotate(tailOsc * 0.02);
 
 ctx.beginPath();
 ctx.moveTo(0, 0);
 ctx.bezierCurveTo(-30, -30, -60, -25, -70, -45);
 ctx.bezierCurveTo(-65, -10, -65, 10, -70, 45);
 ctx.bezierCurveTo(-60, 25, -30, 30, 0, 0);
 ctx.fill();
 ctx.restore();

 // Fin
 ctx.beginPath();
 ctx.moveTo(10, 20);
 ctx.lineTo(-10, 50);
 ctx.lineTo(-30, 30);
 ctx.fill();

 ctx.restore();
 }
}

