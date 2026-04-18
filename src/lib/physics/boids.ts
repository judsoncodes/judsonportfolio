export interface Vector2 { x: number; y: number; }
export interface Food { x: number; y: number; createdAt: number; }

export class Boid {
  pos: Vector2;
  vel: Vector2;
  acc: Vector2;
  size: number;
  maxSpeed: number;
  maxForce: number;

  constructor(x: number, y: number) {
    this.pos = { x, y };
    const angle = Math.random() * Math.PI * 2;
    this.vel = { x: Math.cos(angle), y: Math.sin(angle) };
    this.acc = { x: 0, y: 0 };
    this.size = Math.random() * 4 + 4; // 4 to 8px
    this.maxSpeed = 2;
    this.maxForce = 0.05;
  }

  update(boids: Boid[], cursor: Vector2, foods: Food[], width: number, height: number, depthPercent: number) {
    if (depthPercent > 0.6) return; // Inactive below 60%

    const sep = this.separate(boids);
    const ali = this.align(boids);
    const coh = this.cohere(boids);

    sep.x *= 1.5; sep.y *= 1.5;
    ali.x *= 1.0; ali.y *= 1.0;
    coh.x *= 1.0; coh.y *= 1.0;

    let forceScale = 1;
    let overridesFlocking = false;

    // Food seeking
    let foodForce = { x: 0, y: 0 };
    if (foods.length > 0) {
      let nearestDist = Infinity;
      let nearestFood: Food | null = null;
      for (const f of foods) {
        const d = dist(this.pos, f);
        if (d < 200 && d < nearestDist) {
          nearestDist = d;
          nearestFood = f;
        }
      }
      if (nearestFood) {
        foodForce = this.seek(nearestFood);
        foodForce.x *= 2.0; foodForce.y *= 2.0;
        overridesFlocking = true;
      }
    }

    // Cursor fear
    let fearForce = { x: 0, y: 0 };
    const dCursor = dist(this.pos, cursor);
    if (dCursor < 120) {
      forceScale = 2.5; // speed burst
      const diff = { x: this.pos.x - cursor.x, y: this.pos.y - cursor.y };
      const mag = Math.sqrt(diff.x * diff.x + diff.y * diff.y);
      if (mag > 0) {
        fearForce.x = (diff.x / mag) * this.maxForce * 10;
        fearForce.y = (diff.y / mag) * this.maxForce * 10;
      }
      overridesFlocking = true; // overrides feeding too
    }

    if (overridesFlocking) {
      this.acc.x += sep.x * 2 + foodForce.x + fearForce.x;
      this.acc.y += sep.y * 2 + foodForce.y + fearForce.y;
    } else {
      this.acc.x += sep.x + ali.x + coh.x;
      this.acc.y += sep.y + ali.y + coh.y;
    }

    this.vel.x += this.acc.x;
    this.vel.y += this.acc.y;
    
    // Limit speed
    const currentMaxSpeed = this.maxSpeed * forceScale;
    const speed = Math.sqrt(this.vel.x * this.vel.x + this.vel.y * this.vel.y);
    if (speed > currentMaxSpeed) {
      this.vel.x = (this.vel.x / speed) * currentMaxSpeed;
      this.vel.y = (this.vel.y / speed) * currentMaxSpeed;
    }

    this.pos.x += this.vel.x;
    this.pos.y += this.vel.y;

    this.acc.x = 0;
    this.acc.y = 0;

    // Screen wrapping
    if (this.pos.x < -this.size) this.pos.x = width + this.size;
    if (this.pos.y < -this.size) this.pos.y = height + this.size;
    if (this.pos.x > width + this.size) this.pos.x = -this.size;
    if (this.pos.y > height + this.size) this.pos.y = -this.size;
  }

  seek(target: Vector2) {
    const desired = { x: target.x - this.pos.x, y: target.y - this.pos.y };
    const dMag = Math.sqrt(desired.x * desired.x + desired.y * desired.y);
    if (dMag === 0) return { x: 0, y: 0 };
    desired.x = (desired.x / dMag) * this.maxSpeed;
    desired.y = (desired.y / dMag) * this.maxSpeed;
    const steer = { x: desired.x - this.vel.x, y: desired.y - this.vel.y };
    return this.limit(steer, this.maxForce);
  }

  separate(boids: Boid[]) {
    const desiredSeparation = 30.0;
    let steer = { x: 0, y: 0 };
    let count = 0;
    for (const other of boids) {
      const d = dist(this.pos, other.pos);
      if ((d > 0) && (d < desiredSeparation)) {
        let diff = { x: this.pos.x - other.pos.x, y: this.pos.y - other.pos.y };
        diff.x /= d; diff.y /= d;
        steer.x += diff.x; steer.y += diff.y;
        count++;
      }
    }
    if (count > 0) {
      steer.x /= count; steer.y /= count;
    }
    const mag = Math.sqrt(steer.x * steer.x + steer.y * steer.y);
    if (mag > 0) {
      steer.x = (steer.x / mag) * this.maxSpeed;
      steer.y = (steer.y / mag) * this.maxSpeed;
      steer.x -= this.vel.x; steer.y -= this.vel.y;
      steer = this.limit(steer, this.maxForce);
    }
    return steer;
  }

  align(boids: Boid[]) {
    const neighborDist = 50;
    let sum = { x: 0, y: 0 };
    let count = 0;
    for (const other of boids) {
      const d = dist(this.pos, other.pos);
      if ((d > 0) && (d < neighborDist)) {
        sum.x += other.vel.x; sum.y += other.vel.y;
        count++;
      }
    }
    if (count > 0) {
      sum.x /= count; sum.y /= count;
      const mag = Math.sqrt(sum.x * sum.x + sum.y * sum.y);
      if (mag > 0) {
        sum.x = (sum.x / mag) * this.maxSpeed;
        sum.y = (sum.y / mag) * this.maxSpeed;
        const steer = { x: sum.x - this.vel.x, y: sum.y - this.vel.y };
        return this.limit(steer, this.maxForce);
      }
    }
    return { x: 0, y: 0 };
  }

  cohere(boids: Boid[]) {
    const neighborDist = 50;
    let sum = { x: 0, y: 0 };
    let count = 0;
    for (const other of boids) {
      const d = dist(this.pos, other.pos);
      if ((d > 0) && (d < neighborDist)) {
        sum.x += other.pos.x; sum.y += other.pos.y;
        count++;
      }
    }
    if (count > 0) {
      sum.x /= count; sum.y /= count;
      return this.seek(sum);
    }
    return { x: 0, y: 0 };
  }

  limit(v: Vector2, max: number) {
    const mag = Math.sqrt(v.x * v.x + v.y * v.y);
    if (mag > max) {
      return { x: (v.x / mag) * max, y: (v.y / mag) * max };
    }
    return { ...v };
  }
}

function dist(v1: Vector2, v2: Vector2) {
  return Math.sqrt((v1.x - v2.x)**2 + (v1.y - v2.y)**2);
}
