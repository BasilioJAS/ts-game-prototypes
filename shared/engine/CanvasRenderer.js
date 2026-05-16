export class CanvasRenderer {
    constructor(canvasId, width, height) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas)
            throw new Error(`Canvas with id "${canvasId}" not found`);
        this.canvas.width = width;
        this.canvas.height = height;
        const ctx = this.canvas.getContext('2d');
        if (!ctx)
            throw new Error('Could not get 2D context');
        this.ctx = ctx;
    }
    clear() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
    drawRect(x, y, width, height, color) {
        this.ctx.fillStyle = color;
        this.ctx.fillRect(x, y, width, height);
    }
    drawCircle(x, y, radius, color) {
        this.ctx.beginPath();
        this.ctx.arc(x, y, radius, 0, Math.PI * 2);
        this.ctx.fillStyle = color;
        this.ctx.fill();
    }
    drawText(text, x, y, color = 'white', fontSize = 16) {
        this.ctx.fillStyle = color;
        this.ctx.font = `${fontSize}px Arial`;
        this.ctx.fillText(text, x, y);
    }
    drawImage(img, x, y, width, height) {
        this.ctx.drawImage(img, x, y, width, height);
    }
}
