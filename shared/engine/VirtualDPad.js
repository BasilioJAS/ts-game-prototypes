export class VirtualDPad {
    constructor() {
        this.center = { x: 100, y: 0 };
        this.radius = 60;
        this.deadzone = 15;
        this.direction = { x: 0, y: 0 };
        this.active = false;
        this.thumbPosition = { x: 0, y: 0 };
        this.touchId = null;
        this.canvasWidth = 800;
        this.canvasHeight = 600;
    }
    setCanvasSize(w, h) {
        this.canvasWidth = w;
        this.canvasHeight = h;
        this.center.x = 100;
        this.center.y = h - 110;
    }
    updateFromTouches(touches, canvas) {
        this.active = false;
        this.direction = { x: 0, y: 0 };
        this.thumbPosition = { x: this.center.x, y: this.center.y };
        const rect = canvas.getBoundingClientRect();
        const sx = this.canvasWidth / rect.width;
        const sy = this.canvasHeight / rect.height;
        let touchOnDPad = null;
        for (const t of touches) {
            const tx = (t.clientX - rect.left) * sx;
            const ty = (t.clientY - rect.top) * sy;
            const dx = tx - this.center.x;
            const dy = ty - this.center.y;
            if (Math.sqrt(dx * dx + dy * dy) <= this.radius) {
                touchOnDPad = t;
                break;
            }
        }
        if (!touchOnDPad) {
            this.touchId = null;
            return;
        }
        this.touchId = touchOnDPad.identifier;
        const tx = (touchOnDPad.clientX - rect.left) * sx;
        const ty = (touchOnDPad.clientY - rect.top) * sy;
        const dx = tx - this.center.x;
        const dy = ty - this.center.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
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
        else {
            this.thumbPosition = { x: this.center.x, y: this.center.y };
        }
    }
    render(ctx) {
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
