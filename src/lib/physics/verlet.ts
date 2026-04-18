export class VerletNode {
  x: number;
  y: number;
  oldX: number;
  oldY: number;

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
    this.oldX = x;
    this.oldY = y;
  }

  update(gravity: number, friction: number = 0.99) {
    const vx = (this.x - this.oldX) * friction;
    const vy = (this.y - this.oldY) * friction;

    this.oldX = this.x;
    this.oldY = this.y;

    this.x += vx;
    this.y += vy + gravity;
  }
}

export class VerletLink {
  n1: VerletNode;
  n2: VerletNode;
  targetDist: number;

  constructor(n1: VerletNode, n2: VerletNode, dist: number) {
    this.n1 = n1;
    this.n2 = n2;
    this.targetDist = dist;
  }

  resolve() {
    const dx = this.n1.x - this.n2.x;
    const dy = this.n1.y - this.n2.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    if (dist === 0) return;

    const diff = (this.targetDist - dist) / dist;
    const px = dx * diff * 0.5;
    const py = dy * diff * 0.5;

    this.n1.x += px;
    this.n1.y += py;
    this.n2.x -= px;
    this.n2.y -= py;
  }
}
