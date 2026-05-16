export class GameLoop {
  private lastTime: number = 0;
  private running: boolean = false;
  private updateFn: (deltaTime: number) => void;
  private renderFn: (deltaTime: number) => void;

  constructor(update: (deltaTime: number) => void, render: (deltaTime: number) => void) {
    this.updateFn = update;
    this.renderFn = render;
  }

  start(): void {
    this.running = true;
    this.lastTime = performance.now();
    this.loop();
  }

  stop(): void {
    this.running = false;
  }

  private loop = (): void => {
    if (!this.running) return;

    const currentTime = performance.now();
    const deltaTime = (currentTime - this.lastTime) / 1000;
    this.lastTime = currentTime;

    this.updateFn(deltaTime);
    this.renderFn(deltaTime);

    requestAnimationFrame(this.loop);
  };
}
