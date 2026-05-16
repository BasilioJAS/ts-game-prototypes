import { Vector2 } from '../types/index.js';

export class InputHandler {
  keys: Set<string> = new Set();
  mousePosition: Vector2 = { x: 0, y: 0 };
  mouseDown: boolean = false;

  touchPosition: Vector2 = { x: 0, y: 0 };
  touchActive: boolean = false;
  activeTouches: Vector2[] = [];
  private canvas: HTMLCanvasElement;

  private gamepadIndex: number | null = null;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;

    window.addEventListener('keydown', (e) => this.keys.add(e.key));
    window.addEventListener('keyup', (e) => this.keys.delete(e.key));

    const toCanvas = (clientX: number, clientY: number) => {
      const rect = canvas.getBoundingClientRect();
      return {
        x: (clientX - rect.left) * (canvas.width / rect.width),
        y: (clientY - rect.top) * (canvas.height / rect.height),
      };
    };

    window.addEventListener('mousemove', (e) => {
      const p = toCanvas(e.clientX, e.clientY);
      this.mousePosition.x = p.x;
      this.mousePosition.y = p.y;
    });
    window.addEventListener('mousedown', () => this.mouseDown = true);
    window.addEventListener('mouseup', () => this.mouseDown = false);

    const updateTouches = (e: TouchEvent) => {
      this.activeTouches = Array.from(e.touches).map(t => toCanvas(t.clientX, t.clientY));
    };

    canvas.addEventListener('touchstart', (e) => {
      e.preventDefault();
      updateTouches(e);
      const p = toCanvas(e.touches[0].clientX, e.touches[0].clientY);
      this.touchPosition.x = p.x;
      this.touchPosition.y = p.y;
      this.touchActive = true;
    }, { passive: false });

    canvas.addEventListener('touchmove', (e) => {
      e.preventDefault();
      updateTouches(e);
    }, { passive: false });

    canvas.addEventListener('touchend', (e) => {
      e.preventDefault();
      updateTouches(e);
      if (e.touches.length === 0) {
        this.touchActive = false;
      }
    }, { passive: false });

    window.addEventListener('gamepadconnected', (e: GamepadEvent) => {
      this.gamepadIndex = e.gamepad.index;
    });
    window.addEventListener('gamepaddisconnected', () => {
      this.gamepadIndex = null;
    });
  }

  isKeyDown(key: string): boolean {
    return this.keys.has(key);
  }

  getMovementDirection(): Vector2 {
    let dx = 0;
    let dy = 0;

    if (this.isKeyDown('ArrowUp') || this.isKeyDown('w')) dy = -1;
    if (this.isKeyDown('ArrowDown') || this.isKeyDown('s')) dy = 1;
    if (this.isKeyDown('ArrowLeft') || this.isKeyDown('a')) dx = -1;
    if (this.isKeyDown('ArrowRight') || this.isKeyDown('d')) dx = 1;

    if (dx !== 0 || dy !== 0) {
      const len = Math.sqrt(dx * dx + dy * dy);
      return { x: dx / len, y: dy / len };
    }

    const gp = this.getGamepad();
    if (gp) {
      const gx = gp.axes[0] ?? 0;
      const gy = gp.axes[1] ?? 0;
      const len = Math.sqrt(gx * gx + gy * gy);
      if (len > 0.2) {
        return { x: gx / len, y: gy / len };
      }
    }

    return { x: 0, y: 0 };
  }

  getTouchTarget(): Vector2 | null {
    if (!this.touchActive) return null;
    return { x: this.touchPosition.x, y: this.touchPosition.y };
  }

  private getGamepad(): Gamepad | null {
    if (this.gamepadIndex === null) return null;
    const gp = navigator.getGamepads?.()?.[this.gamepadIndex];
    return gp ?? null;
  }
}
