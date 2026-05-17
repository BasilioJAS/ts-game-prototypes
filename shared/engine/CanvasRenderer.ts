export class CanvasRenderer {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;

  constructor(canvasId: string, width: number, height: number) {
    this.canvas = document.getElementById(canvasId) as HTMLCanvasElement;
    if (!this.canvas) throw new Error(`Canvas with id "${canvasId}" not found`);
    this.canvas.width = width;
    this.canvas.height = height;
    const ctx = this.canvas.getContext('2d');
    if (!ctx) throw new Error('Could not get 2D context');
    this.ctx = ctx;
  }

  clear(): void {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  drawRect(x: number, y: number, w: number, h: number, color: string): void {
    this.ctx.fillStyle = color;
    this.ctx.fillRect(x, y, w, h);
  }

  drawCircle(x: number, y: number, r: number, color: string): void {
    this.ctx.beginPath();
    this.ctx.arc(x, y, r, 0, Math.PI * 2);
    this.ctx.fillStyle = color;
    this.ctx.fill();
  }

  drawText(text: string, x: number, y: number, color: string = 'white', fontSize: number = 16): void {
    this.ctx.fillStyle = color;
    this.ctx.font = `${fontSize}px Arial`;
    this.ctx.fillText(text, x, y);
  }

  drawImage(img: HTMLImageElement, x: number, y: number, w: number, h: number): void {
    this.ctx.drawImage(img, x, y, w, h);
  }

  drawEllipse(x: number, y: number, rx: number, ry: number, color: string): void {
    this.ctx.beginPath();
    this.ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
    this.ctx.fillStyle = color;
    this.ctx.fill();
  }

  drawButterfly(x: number, y: number, color: string, wingOpenness: number, size: number = 10): void {
    const ctx = this.ctx;
    ctx.save();
    ctx.translate(x, y);
    const ww = size * 2.2 * wingOpenness;
    const wh = size * 1.0;
    ctx.beginPath();
    ctx.ellipse(-size * 0.3, 0, ww, wh, -0.1, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(size * 0.3, 0, ww, wh, 0.1, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(0, 0, size * 0.25, size * 0.6, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#1a202c';
    ctx.fill();
    ctx.strokeStyle = '#1a202c';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(-size * 0.1, -size * 0.5);
    ctx.lineTo(-size * 0.4, -size * 1.2);
    ctx.moveTo(size * 0.1, -size * 0.5);
    ctx.lineTo(size * 0.4, -size * 1.2);
    ctx.stroke();
    ctx.restore();
  }

  drawTree(x: number, y: number, size: number = 40): void {
    const ctx = this.ctx;
    ctx.fillStyle = '#5c3a1e';
    ctx.fillRect(x - size * 0.08, y - size * 0.1, size * 0.16, size * 0.5);
    ctx.beginPath();
    ctx.arc(x, y - size * 0.2, size * 0.35, 0, Math.PI * 2);
    ctx.fillStyle = '#2f6b2f';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x - size * 0.15, y - size * 0.05, size * 0.25, 0, Math.PI * 2);
    ctx.fillStyle = '#3a8a3a';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x + size * 0.15, y - size * 0.05, size * 0.25, 0, Math.PI * 2);
    ctx.fillStyle = '#3a8a3a';
    ctx.fill();
  }

  drawFlower(x: number, y: number, color: string, size: number = 6): void {
    const ctx = this.ctx;
    const n = 5;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      ctx.beginPath();
      ctx.arc(x + Math.cos(a) * size * 0.6, y + Math.sin(a) * size * 0.6, size * 0.4, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
    }
    ctx.beginPath();
    ctx.arc(x, y, size * 0.3, 0, Math.PI * 2);
    ctx.fillStyle = '#ffd700';
    ctx.fill();
  }

  drawRock(x: number, y: number, size: number = 15): void {
    const ctx = this.ctx;
    ctx.beginPath();
    ctx.ellipse(x, y, size * 0.6, size * 0.4, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#718096';
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(x - size * 0.15, y - size * 0.1, size * 0.3, size * 0.2, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#a0aec0';
    ctx.fill();
  }

  drawBush(x: number, y: number, size: number = 25): void {
    const ctx = this.ctx;
    ctx.beginPath();
    ctx.arc(x, y, size * 0.5, 0, Math.PI * 2);
    ctx.fillStyle = '#276b27';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x - size * 0.3, y + size * 0.1, size * 0.4, 0, Math.PI * 2);
    ctx.fillStyle = '#2f7a2f';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x + size * 0.3, y + size * 0.1, size * 0.4, 0, Math.PI * 2);
    ctx.fillStyle = '#2f7a2f';
    ctx.fill();
  }
}
