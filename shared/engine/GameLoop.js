export class GameLoop {
    constructor(update, render) {
        this.lastTime = 0;
        this.running = false;
        this.loop = () => {
            if (!this.running)
                return;
            const currentTime = performance.now();
            const deltaTime = (currentTime - this.lastTime) / 1000;
            this.lastTime = currentTime;
            this.updateFn(deltaTime);
            this.renderFn(deltaTime);
            requestAnimationFrame(this.loop);
        };
        this.updateFn = update;
        this.renderFn = render;
    }
    start() {
        this.running = true;
        this.lastTime = performance.now();
        this.loop();
    }
    stop() {
        this.running = false;
    }
}
