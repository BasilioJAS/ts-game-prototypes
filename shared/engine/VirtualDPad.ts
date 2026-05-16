import { Vector2 } from '../types/index.js';

export class VirtualDPad {
  center: Vector2 = { x: 100, y: 0 };
  radius: number = 60;
  deadzone: number = 15;
  direction: Vector2 = { x: 0, y: 0 };
  active: boolean = false;
  thumbPosition: Vector2 = { x: 0, y: 0 };

  setCanvasSize(w: number, h: number): void {
    this.center.x = 100;
    this.center.y = h - 110;
  }

  update(touchCoords: Vector2[]): void {
    this.active = false;
    this.direction = { x: 0, y: 0 };
    this.thumbPosition = { x: this.center.x, y: this.center.y };

    for (const t of touchCoords) {
      const dx = t.x - this.center.x;
      const dy = t.y - this.center.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist <= this.radius) {
        this.active = true;
        if (dist > this.deadzone) {
          this.direction = { x: dx / dist, y: dy / dist };
          const maxThumbDist = this.radius * 0.45;
          const thumbDist = Math.min(dist, maxThumbDist);
          this.thumbPosition = {
            x: this.center.x + (dx / dist) * thumbDist,
            y: this.center.y + (dy / dist) * thumbDist,
          };
        }
        return;
      }
    }
  }

  render(ctx: CanvasRenderingContext2D): void {
    const cx = this.center.x;
    const cy = this.center.y;

    ctx.save();

    ctx.beginPath();
    ctx.arc(cx, cy, this.radius, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,255,255,0.12)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.35)';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(cx, cy, this.deadzone, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,255,255,0.05)';
    ctx.fill();

    if (this.active) {
      ctx.beginPath();
      ctx.arc(this.thumbPosition.x, this.thumbPosition.y, 12, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255,255,255,0.5)';
      ctx.fill();
    }

    const arrowDist = this.radius * 0.55;
    const arrows = [
      { dx: 0, dy: -1, label: '↑' },
      { dx: 1, dy: 0, label: '→' },
      { dx: 0, dy: 1, label: '↓' },
      { dx: -1, dy: 0, label: '←' },
    ];
    ctx.fillStyle = 'rgba(255,255,255,0.25)';
    ctx.font = '18px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (const a of arrows) {
      ctx.fillText(a.label, cx + a.dx * arrowDist, cy + a.dy * arrowDist);
    }

    ctx.restore();
  }
}
