import { APP_VERSION } from '../version.js';
export class VirtualDPad {
    constructor() {
        this.direction = { x: 0, y: 0 };
        this.active = false;
        this.radius = Math.min(65, window.innerWidth * 0.12);
        this.deadzone = this.radius * 0.2;
        this.el = document.createElement('div');
        this.el.id = 'dpad-overlay';
        this.applyElStyles();
        this.thumbEl = document.createElement('div');
        this.updateThumbStyles(0, 0);
        this.el.appendChild(this.thumbEl);
        const verEl = document.createElement('div');
        verEl.textContent = `v${APP_VERSION}`;
        verEl.style.cssText = `position:absolute;bottom:-18px;left:50%;transform:translateX(-50%);color:rgba(255,255,255,0.25);font-size:9px;white-space:nowrap;pointer-events:none;`;
        this.el.appendChild(verEl);
        const arrows = [
            { dx: 0, dy: -1, label: '▲' },
            { dx: 1, dy: 0, label: '►' },
            { dx: 0, dy: 1, label: '▼' },
            { dx: -1, dy: 0, label: '◄' },
        ];
        for (const a of arrows) {
            const arrow = document.createElement('span');
            arrow.textContent = a.label;
            arrow.style.cssText = `position:absolute;color:rgba(255,255,255,0.15);font-size:${this.radius * 0.3}px;pointer-events:none;transform:translate(-50%,-50%);left:${50 + a.dx * 33}%;top:${50 + a.dy * 33}%;`;
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
                this.updateThumbStyles((dx / dist) * d, (dy / dist) * d);
            }
            else {
                this.direction = { x: 0, y: 0 };
                this.updateThumbStyles(0, 0);
            }
        };
        const onEnd = () => {
            this.active = false;
            this.direction = { x: 0, y: 0 };
            this.updateThumbStyles(0, 0);
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
        window.addEventListener('resize', () => {
            this.radius = Math.min(65, window.innerWidth * 0.12);
            this.deadzone = this.radius * 0.2;
            this.applyElStyles();
        });
    }
    applyElStyles() {
        const sz = this.radius * 2;
        this.el.style.cssText = `
      position:fixed;bottom:${Math.max(30, window.innerHeight * 0.03)}px;left:${Math.max(20, window.innerWidth * 0.03)}px;
      width:${sz}px;height:${sz}px;
      border-radius:50%;background:rgba(255,255,255,0.08);
      border:2px solid rgba(255,255,255,0.2);
      z-index:500;touch-action:none;
      display:flex;align-items:center;justify-content:center;
    `;
    }
    updateThumbStyles(x, y) {
        this.thumbEl.style.cssText = `
      width:${this.radius * 0.18}px;height:${this.radius * 0.18}px;border-radius:50%;
      background:rgba(255,255,255,0.4);
      position:absolute;transition:transform 0.05s;
      pointer-events:none;
      transform:translate(${x}px, ${y}px);
    `;
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
