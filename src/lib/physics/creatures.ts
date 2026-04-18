import { VerletNode, VerletLink } from './verlet';
import { Vector2 } from './boids';

export class Jellyfish {
  x: number;
  y: number;
  scale: number = 1;
  phase: number = 0;
  tentacles: { nodes: VerletNode[], links: VerletLink[] }[] = [];

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
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
    this.scale = 1 + Math.sin(this.phase) * 0.1;
    this.y -= 0.5; 
    
    // Wrap around
    if (this.y < -200) this.y = window.innerHeight + 200;

    this.tentacles.forEach((t, index) => {
      t.nodes[0].x = this.x + (index - 3.5) * 8 * this.scale;
      t.nodes[0].y = this.y + 10 * this.scale;

      t.nodes.forEach(n => {
        const dx = n.x - cursor.x;
        const dy = n.y - cursor.y;
        const dist = Math.sqrt(dx*dx + dy*dy);
        if (dist < 100) {
          n.x += (dx / dist) * 2;
          n.y += (dy / dist) * 2;
        }
        n.update(0.5); 
      });

      for (let i = 0; i < 3; i++) { 
        t.links.forEach(l => l.resolve());
      }
      
      t.nodes[0].x = this.x + (index - 3.5) * 8 * this.scale;
      t.nodes[0].y = this.y + 10 * this.scale;
    });
  }

  draw(ctx: CanvasRenderingContext2D, active: boolean) {
    if (!active) return;
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.scale(this.scale, this.scale);

    const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, 80);
    grad.addColorStop(0, 'rgba(120, 0, 255, 0.3)');
    grad.addColorStop(1, 'rgba(120, 0, 255, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(0, 0, 80, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(-40, 10);
    ctx.bezierCurveTo(-40, -40, 40, -40, 40, 10);
    ctx.bezierCurveTo(20, 0, -20, 0, -40, 10);
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
  time: number = 0;
  baseX: number;
  baseY: number;

  constructor(x: number, y: number) {
    this.baseX = x;
    this.baseY = y;
  }

  draw(ctx: CanvasRenderingContext2D, active: boolean) {
    if (!active) return;
    this.time += 0.005;
    const x = this.baseX + Math.sin(this.time) * 400;
    const y = this.baseY + Math.sin(this.time * 2) * 150;
    
    const vx = Math.cos(this.time) * 400;
    const vy = Math.cos(this.time * 2) * 300;
    const angle = Math.atan2(vy, vx);

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);

    ctx.fillStyle = 'rgba(10, 60, 40, 0.8)';
    
    ctx.beginPath();
    ctx.ellipse(0, 0, 40, 30, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.ellipse(20, -35, 20, 10, Math.PI / 4, 0, Math.PI * 2);
    ctx.ellipse(20, 35, 20, 10, -Math.PI / 4, 0, Math.PI * 2);
    ctx.ellipse(-25, -20, 15, 8, -Math.PI / 4, 0, Math.PI * 2);
    ctx.ellipse(-25, 20, 15, 8, Math.PI / 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.arc(45, 0, 12, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }
}

export class Anglerfish {
  x: number;
  y: number;
  lungeTime: number = 0;

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
  }

  lunge() {
    this.lungeTime = Date.now();
  }

  draw(ctx: CanvasRenderingContext2D, time: number, active: boolean) {
    if (!active) return;
    let offsetX = 0;
    const timeSinceLunge = Date.now() - this.lungeTime;
    
    if (timeSinceLunge < 200) {
      offsetX = (timeSinceLunge / 200) * 150;
    } else if (timeSinceLunge < 1000) {
      offsetX = 150 - ((timeSinceLunge - 200) / 800) * 150;
    }

    ctx.save();
    ctx.translate(this.x + offsetX, this.y + Math.sin(time * 0.02) * 20);

    const grad = ctx.createRadialGradient(80, -30, 0, 80, -30, 150);
    grad.addColorStop(0, 'rgba(0, 255, 100, 0.15)');
    grad.addColorStop(1, 'rgba(0, 255, 100, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(80, -30, 150, 0, Math.PI * 2);
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
