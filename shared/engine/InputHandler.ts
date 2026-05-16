import { Vector2 } from '../types';

export class InputHandler {
  keys: Set<string> = new Set();
  mousePosition: Vector2 = { x: 0, y: 0 };
  mouseDown: boolean = false;

  constructor() {
    window.addEventListener('keydown', (e) => this.keys.add(e.key));
    window.addEventListener('keyup', (e) => this.keys.delete(e.key));
    window.addEventListener('mousemove', (e) => {
      const canvas = e.target as HTMLCanvasElement;
      const rect = canvas.getBoundingClientRect();
      this.mousePosition.x = e.clientX - rect.left;
      this.mousePosition.y = e.clientY - rect.top;
    });
    window.addEventListener('mousedown', () => this.mouseDown = true);
    window.addEventListener('mouseup', () => this.mouseDown = false);
  }

  isKeyDown(key: string): boolean {
    return this.keys.has(key);
  }
}
