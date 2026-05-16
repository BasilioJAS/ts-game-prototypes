import { APP_VERSION } from '../version.js';
export class VirtualDPad {
    constructor() {
        this.direction = { x: 0, y: 0 };
        this.active = false;
        this.centerX = 0;
        this.centerY = 0;
        this.radius = 60;
        this.deadzone = 15;
        this.el = document.createElement('div');
        this.el.id = 'dpad-overlay';
        this.el.style.cssText = `
      position: fixed; bottom: 40px; left: 40px;
      width: ${this.radius * 2}px; height: ${this.radius * 2}px;
      border-radius: 50%; background: rgba(255,255,255,0.12);
      border: 2px solid rgba(255,255,255,0.3); 
      z-index: 500; touch-action: none;
      display: flex; align-items: center; justify-content: center;
    `;
        this.thumbEl = document.createElement('div');
        this.thumbEl.style.cssText = `
      width: 24px; height: 24px; border-radius: 50%;
      background: rgba(255,255,255,0.5);
      position: absolute; transition: transform 0.05s;
      pointer-events: none;
    `;
        this.el.appendChild(this.thumbEl);
        const verEl = document.createElement('div');
        verEl.textContent = `v${APP_VERSION}`;
        verEl.style.cssText = `
      position: absolute; bottom: -20px; left: 50%; transform: translateX(-50%);
      color: rgba(255,255,255,0.3); font-size: 10px; white-space: nowrap;
      pointer-events: none;
    `;
        this.el.appendChild(verEl);
        const arrows = [
            { dx: 0, dy: -1, label: '↑' },
            { dx: 1, dy: 0, label: '→' },
            { dx: 0, dy: 1, label: '↓' },
            { dx: -1, dy: 0, label: '←' },
        ];
        for (const a of arrows) {
            const arrow = document.createElement('span');
            arrow.textContent = a.label;
            arrow.style.cssText = `
        position: absolute; color: rgba(255,255,255,0.3);
        font-size: 20px; pointer-events: none;
        transform: translate(-50%, -50%);
        left: ${50 + a.dx * 35}%; top: ${50 + a.dy * 35}%;
      `;
            this.el.appendChild(arrow);
        }
        const getCenter = () => {
            const r = this.el.getBoundingClientRect();
            return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
        };
        const onTouch = (clientX, clientY) => {
            const c = getCenter();
            const dx = clientX - c.x;
            const dy = clientY - c.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            this.active = true;
            if (dist > this.deadzone) {
                this.direction = { x: dx / dist, y: dy / dist };
                const maxDist = this.radius * 0.4;
                const d = Math.min(dist, maxDist);
                this.thumbEl.style.transform = `translate(${(dx / dist) * d}px, ${(dy / dist) * d}px)`;
            }
            else {
                this.direction = { x: 0, y: 0 };
                this.thumbEl.style.transform = 'translate(0, 0)';
            }
        };
        const onEnd = () => {
            this.active = false;
            this.direction = { x: 0, y: 0 };
            this.thumbEl.style.transform = 'translate(0, 0)';
        };
        this.el.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const t = e.changedTouches[0];
            onTouch(t.clientX, t.clientY);
        }, { passive: false });
        this.el.addEventListener('touchmove', (e) => {
            e.preventDefault();
            const t = e.changedTouches[0];
            onTouch(t.clientX, t.clientY);
        }, { passive: false });
        this.el.addEventListener('touchend', (e) => {
            e.preventDefault();
            if (e.touches.length === 0)
                onEnd();
        }, { passive: false });
        this.el.addEventListener('mousedown', (e) => {
            onTouch(e.clientX, e.clientY);
            const onMove = (ev) => onTouch(ev.clientX, ev.clientY);
            const onUp = () => { onEnd(); window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
            window.addEventListener('mousemove', onMove);
            window.addEventListener('mouseup', onUp);
        });
    }
    show() {
        if (!this.el.parentElement)
            document.body.appendChild(this.el);
        this.el.style.display = '';
    }
    hide() {
        this.el.style.display = 'none';
        this.direction = { x: 0, y: 0 };
        this.active = false;
    }
}
