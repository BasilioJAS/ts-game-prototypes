export class InputHandler {
    constructor() {
        this.keys = new Set();
        this.mousePosition = { x: 0, y: 0 };
        this.mouseDown = false;
        window.addEventListener('keydown', (e) => this.keys.add(e.key));
        window.addEventListener('keyup', (e) => this.keys.delete(e.key));
        window.addEventListener('mousemove', (e) => {
            const canvas = e.target;
            const rect = canvas.getBoundingClientRect();
            this.mousePosition.x = e.clientX - rect.left;
            this.mousePosition.y = e.clientY - rect.top;
        });
        window.addEventListener('mousedown', () => this.mouseDown = true);
        window.addEventListener('mouseup', () => this.mouseDown = false);
    }
    isKeyDown(key) {
        return this.keys.has(key);
    }
}
