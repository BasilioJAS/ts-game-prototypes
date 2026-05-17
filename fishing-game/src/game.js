import { GameLoop } from '../../shared/engine/GameLoop.js';
import { CanvasRenderer } from '../../shared/engine/CanvasRenderer.js';
import { InputHandler } from '../../shared/engine/InputHandler.js';
import { CurrencyManager } from '../../shared/mechanics/CurrencyManager.js';
import { CardSystem } from '../../shared/mechanics/CardSystem.js';
import { SkillManager } from '../../shared/mechanics/SkillManager.js';
import { ResearchCenter } from '../../shared/mechanics/ResearchCenter.js';
import { ShopSystem } from '../../shared/mechanics/ShopSystem.js';
import { AdRewardSystem } from '../../shared/mechanics/AdRewardSystem.js';
import { VirtualDPad } from '../../shared/engine/VirtualDPad.js';
const WORLD_W = 2400;
const WORLD_H = 1800;
const FISH_TYPES = [
    { id: 'minnow', name: 'Minnow', color: '#a0aec0', size: 6, value: 5, speed: 40, rarity: 'common' },
    { id: 'perch', name: 'Perch', color: '#48bb78', size: 9, value: 12, speed: 55, rarity: 'common' },
    { id: 'trout', name: 'Trout', color: '#4299e1', size: 12, value: 22, speed: 70, rarity: 'rare' },
    { id: 'pike', name: 'Pike', color: '#ed8936', size: 16, value: 40, speed: 85, rarity: 'rare' },
    { id: 'salmon', name: 'Salmon', color: '#fc8181', size: 14, value: 55, speed: 90, rarity: 'legendary' },
    { id: 'goldfish', name: 'Gold Fish', color: '#f6e05e', size: 8, value: 80, speed: 100, rarity: 'legendary' },
];
const CARD_BASE = 80;
const CARD_SCALE = 40;
const MAX_FISH = 12;
const INITIAL_FISH = 5;
export class FishingGame {
    constructor() {
        this.dpad = new VirtualDPad();
        this.state = 'menu';
        this.elapsed = 0;
        this.player = { position: { x: 1200, y: 900 }, speed: 180, netRadius: 40 };
        this.fish = [];
        this.caughtFish = [];
        this.score = 0;
        this.catches = 0;
        this.cardThreshold = CARD_BASE;
        this.lastCardAt = 0;
        this.decorations = [];
        this.shopBtn = null;
        this.shopOverlay = null;
        this.update = (dt) => {
            if (this.state === 'menu')
                return;
            this.elapsed += dt;
            const k = this.input.getMovementDirection();
            const d = this.dpad.direction;
            let dx = k.x + d.x, dy = k.y + d.y;
            const len = Math.sqrt(dx * dx + dy * dy);
            if (len > 0.01) {
                const spd = this.player.speed + (this.skills.getSkillLevel('boat_speed') - 1) * 15;
                this.player.position.x += (dx / len) * spd * dt;
                this.player.position.y += (dy / len) * spd * dt;
            }
            this.player.position.x = Math.max(20, Math.min(WORLD_W - 20, this.player.position.x));
            this.player.position.y = Math.max(20, Math.min(WORLD_H - 20, this.player.position.y));
            if (this.input.mouseDown) {
                const mp = this.input.mousePosition;
                const nr = this.player.netRadius + (this.skills.getSkillLevel('net_size') - 1) * 6;
                this.fish.forEach(f => {
                    if (f.caught)
                        return;
                    const dist = Math.sqrt(Math.pow(f.position.x - mp.x, 2) + Math.pow(f.position.y - mp.y, 2));
                    if (dist < nr) {
                        f.caught = true;
                        this.caughtFish.push(f);
                    }
                });
            }
            this.fish.forEach(f => {
                if (Math.random() < 0.02) {
                    f.velocity.x = (Math.random() - 0.5) * f.speed;
                    f.velocity.y = (Math.random() - 0.5) * f.speed;
                }
                f.position.x += f.velocity.x * dt;
                f.position.y += f.velocity.y * dt;
                if (f.position.x < 20 || f.position.x > WORLD_W - 20)
                    f.velocity.x *= -1;
                if (f.position.y < 20 || f.position.y > WORLD_H - 20)
                    f.velocity.y *= -1;
                f.position.x = Math.max(20, Math.min(WORLD_W - 20, f.position.x));
                f.position.y = Math.max(20, Math.min(WORLD_H - 20, f.position.y));
            });
            this.fish = this.fish.filter(f => !f.caught);
            const atDock = this.player.position.x < 130 && this.player.position.y < 130;
            if (atDock && this.caughtFish.length > 0) {
                const mult = 1 + (this.skills.getSkillLevel('fish_value') - 1) * 0.15;
                const total = Math.floor(this.caughtFish.reduce((s, f) => s + f.value, 0) * mult);
                this.currencies.addSoft(total);
                this.score += total;
                this.catches += this.caughtFish.length;
                this.caughtFish = [];
                if (this.score - this.lastCardAt >= this.cardThreshold) {
                    this.lastCardAt = this.score;
                    this.cardThreshold += CARD_SCALE;
                    this.cardSystem.showChoice(this.cardSystem.getRandomCards(3), (card) => this.skills.upgradeSkill(card.skillId));
                }
                this.spawnFish(2);
            }
            this.research.update(dt);
            const a = this.research.getActiveResearch();
            if (a && a.completed) {
                if (a.id === 'speed_r')
                    this.skills.upgradeSkill('boat_speed');
                else if (a.id === 'net_r')
                    this.skills.upgradeSkill('net_size');
            }
            const allR = this.research.getAllResearch();
            if (!allR.every(r => r.completed) && !this.research.getActiveResearch()) {
                const n = allR.find(r => !r.completed);
                if (n)
                    this.research.startResearch(n.id);
            }
        };
        this.render = (_) => {
            const ctx = this.renderer.ctx;
            const cw = this.renderer.canvas.width;
            const ch = this.renderer.canvas.height;
            const vw = window.innerWidth;
            const vh = window.innerHeight;
            ctx.setTransform(1, 0, 0, 1, 0, 0);
            ctx.clearRect(0, 0, cw, ch);
            if (this.state === 'menu') {
                ctx.fillStyle = '#1a202c';
                ctx.fillRect(0, 0, cw, ch);
                return;
            }
            const scale = vh / ch;
            const camX = Math.max(vw - WORLD_W * scale, Math.min(0, vw / 2 - this.player.position.x * scale));
            const camY = Math.max(vh - WORLD_H * scale, Math.min(0, vh / 2 - this.player.position.y * scale));
            ctx.setTransform(scale, 0, 0, scale, camX, camY);
            ctx.fillStyle = '#1a3a5c';
            ctx.fillRect(0, 0, WORLD_W, WORLD_H);
            for (let gy = 0; gy < WORLD_H; gy += 80)
                for (let gx = 0; gx < WORLD_W; gx += 80) {
                    ctx.fillStyle = (Math.floor(gx / 80) + Math.floor(gy / 80)) % 2 === 0 ? '#1e4d7a' : '#1a3a5c';
                    ctx.fillRect(gx, gy, 80, 80);
                }
            this.decorations.forEach(d => {
                if (d.type === 'lilypad') {
                    ctx.beginPath();
                    ctx.ellipse(d.position.x, d.position.y, d.size, d.size * 0.6, 0, 0, Math.PI * 2);
                    ctx.fillStyle = d.color;
                    ctx.fill();
                }
                else if (d.type === 'island') {
                    ctx.beginPath();
                    ctx.ellipse(d.position.x, d.position.y, d.size, d.size * 0.7, 0, 0, Math.PI * 2);
                    ctx.fillStyle = d.color;
                    ctx.fill();
                    ctx.beginPath();
                    ctx.ellipse(d.position.x - d.size * 0.2, d.position.y - d.size * 0.3, d.size * 0.3, d.size * 0.4, 0, 0, Math.PI * 2);
                    ctx.fillStyle = '#2f6b2f';
                    ctx.fill();
                }
                else if (d.type === 'rock') {
                    ctx.beginPath();
                    ctx.ellipse(d.position.x, d.position.y, d.size, d.size * 0.6, 0, 0, Math.PI * 2);
                    ctx.fillStyle = d.color;
                    ctx.fill();
                }
                else if (d.type === 'buoy') {
                    this.renderer.drawRect(d.position.x - 2, d.position.y - 10, 4, 12, '#4a5568');
                    this.renderer.drawCircle(d.position.x, d.position.y, d.size, d.color);
                }
            });
            this.renderer.drawRect(20, 20, 110, 110, '#8b4513');
            this.renderer.drawRect(30, 30, 90, 25, '#a0522d');
            this.renderer.drawText('DOCK', 50, 48, 'white', 14);
            this.renderer.drawRect(30, 65, 90, 55, '#6b3410');
            this.fish.forEach(f => {
                const wobble = Math.sin(this.elapsed * 2 + parseFloat(f.id.slice(-4))) * 3;
                ctx.globalAlpha = 0.7;
                this.renderer.drawEllipse(f.position.x, f.position.y + wobble, f.size, f.size * 0.5, f.color);
                ctx.globalAlpha = 1;
                this.renderer.drawCircle(f.position.x - f.size * 0.5, f.position.y + wobble - 2, 2, '#1a202c');
            });
            this.caughtFish.forEach(f => this.renderer.drawCircle(this.player.position.x, this.player.position.y - 25, 4, f.color));
            const nr = this.player.netRadius + (this.skills.getSkillLevel('net_size') - 1) * 6;
            this.renderer.drawCircle(this.player.position.x, this.player.position.y, 14, '#3182ce');
            this.renderer.drawCircle(this.player.position.x, this.player.position.y, nr, 'rgba(49, 130, 206, 0.1)');
            const mp = this.input.mousePosition;
            this.renderer.drawCircle(mp.x, mp.y, nr, 'rgba(49, 130, 206, 0.15)');
            this.renderer.drawCircle(mp.x, mp.y, 4, '#63b3ed');
            ctx.setTransform(1, 0, 0, 1, 0, 0);
            this.renderer.drawText(`Soft: ${this.currencies.soft}`, 8, 18, 'white', 13);
            this.renderer.drawText(`Hard: ${this.currencies.hard}`, 8, 34, 'white', 13);
            this.renderer.drawText(`Score: ${this.score}`, 8, 50, 'white', 13);
            this.renderer.drawText(`Caught: ${this.caughtFish.length}`, 8, 66, 'white', 13);
            const sl = [{ id: 'boat_speed', label: 'Spd' }, { id: 'net_size', label: 'Net' }, { id: 'fish_value', label: 'Val' }];
            const rx = cw - 130;
            sl.forEach((s, i) => {
                const lv = this.skills.getSkillLevel(s.id);
                const by = 20 + i * 24;
                this.renderer.drawText(`${s.label} Lv.${lv}`, rx, by, '#e2e8f0', 11);
                this.renderer.drawRect(rx, by + 4, 90, 7, '#4a5568');
                this.renderer.drawRect(rx, by + 4, 90 * (lv / 10), 7, '#48bb78');
            });
            const a = this.research.getActiveResearch();
            if (a) {
                this.renderer.drawRect(rx, 100, 120, 12, '#4a5568');
                this.renderer.drawRect(rx, 100, 120 * a.progress, 12, '#4299e1');
                this.renderer.drawText(`${a.name} ${Math.floor(a.progress * 100)}%`, rx + 2, 109, 'white', 9);
            }
            else {
                const allR = this.research.getAllResearch();
                const d = allR.filter(r => r.completed).length;
                this.renderer.drawText(d < allR.length ? `R&D: ${d}/${allR.length}` : 'All done!', rx, 100, d < allR.length ? '#a0aec0' : '#48bb78', 11);
            }
            this.renderer.drawText('Click to cast net at mouse. Go to DOCK to sell.', 8, 84, '#a0aec0', 10);
        };
        this.renderer = new CanvasRenderer('gameCanvas', 800, 600);
        this.input = new InputHandler(this.renderer.canvas);
        this.gameLoop = new GameLoop(this.update, this.render);
        this.currencies = new CurrencyManager();
        this.cardSystem = new CardSystem();
        this.skills = new SkillManager();
        this.research = new ResearchCenter();
        this.shop = new ShopSystem(this.currencies);
        this.adReward = new AdRewardSystem(this.currencies);
        this.setupData();
        this.genDecorations();
    }
    genDecorations() {
        const a = () => Math.random();
        for (let i = 0; i < 30; i++)
            this.decorations.push({ type: 'lilypad', position: { x: a() * WORLD_W, y: a() * WORLD_H }, size: 12 + a() * 15, color: '#38a169' });
        for (let i = 0; i < 10; i++)
            this.decorations.push({ type: 'island', position: { x: a() * WORLD_W, y: a() * WORLD_H }, size: 50 + a() * 80, color: '#68d391' });
        for (let i = 0; i < 15; i++)
            this.decorations.push({ type: 'rock', position: { x: a() * WORLD_W, y: a() * WORLD_H }, size: 8 + a() * 12, color: '#718096' });
        for (let i = 0; i < 8; i++)
            this.decorations.push({ type: 'buoy', position: { x: a() * WORLD_W, y: a() * WORLD_H }, size: 6, color: '#e53e3e' });
    }
    setupData() {
        this.skills.addSkill({ id: 'boat_speed', name: 'Boat Speed', level: 1, maxLevel: 10, description: 'Faster boat' });
        this.skills.addSkill({ id: 'net_size', name: 'Net Size', level: 1, maxLevel: 10, description: 'Bigger catch range' });
        this.skills.addSkill({ id: 'fish_value', name: 'Fish Value', level: 1, maxLevel: 10, description: 'More per fish' });
        this.cardSystem.setCards([
            { id: 'spd', skillId: 'boat_speed', effect: '+1 Boat Speed', rarity: 'common' },
            { id: 'net', skillId: 'net_size', effect: '+1 Net Size', rarity: 'common' },
            { id: 'val', skillId: 'fish_value', effect: '+1 Fish Value', rarity: 'common' },
            { id: 'spd_r', skillId: 'boat_speed', effect: '+2 Boat Speed', rarity: 'rare' },
            { id: 'net_r', skillId: 'net_size', effect: '+2 Net Size', rarity: 'rare' },
            { id: 'val_l', skillId: 'fish_value', effect: '+3 Fish Value', rarity: 'legendary' },
        ]);
        this.research.addResearch({ id: 'find_fish', name: 'Fish Finder', duration: 30, progress: 0, completed: false });
        this.research.addResearch({ id: 'speed_r', name: 'Speed+', duration: 45, progress: 0, completed: false });
        this.research.addResearch({ id: 'net_r', name: 'Net+', duration: 60, progress: 0, completed: false });
        this.shop.addItem({ id: 'lucky_lure', name: 'Lucky Lure', description: 'Better fish for 3min', cost: { type: 'hard', amount: 10 }, owned: false });
        this.shop.addItem({ id: 'speed_up', name: 'Speed Up', description: '+1 Boat Speed', cost: { type: 'soft', amount: 100 }, owned: false });
        this.shop.addItem({ id: 'net_up', name: 'Net Upgrade', description: '+1 Net Size', cost: { type: 'soft', amount: 150 }, owned: false });
        this.shop.addItem({ id: 'sonar', name: 'Sonar', description: 'Reveal all fish for 10s', cost: { type: 'hard', amount: 20 }, owned: false });
    }
    start() { this.dpad.hide(); this.menuRender(); this.gameLoop.start(); }
    menuRender() {
        this.state = 'menu';
        document.querySelectorAll('.game-ui').forEach(e => e.remove());
        const ov = document.createElement('div');
        ov.className = 'game-ui';
        ov.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.85);display:flex;flex-direction:column;align-items:center;justify-content:center;z-index:999;';
        const t = document.createElement('h1');
        t.textContent = '🎣 Fishing';
        t.style.cssText = 'color:#e2e8f0;margin:0 0 8px;font-size:clamp(24px,7vw,42px);';
        const s = document.createElement('p');
        s.textContent = 'Catch fish, sell at the dock, upgrade your gear!';
        s.style.cssText = 'color:#a0aec0;margin:0 0 40px;font-size:clamp(12px,3vw,16px);text-align:center;';
        const btn = document.createElement('button');
        btn.textContent = 'Start Fishing!';
        btn.style.cssText = 'width:min(280px,80vw);padding:16px 32px;border:none;border-radius:12px;font-size:clamp(16px,4vw,20px);cursor:pointer;background:#4299e1;color:white;font-weight:bold;';
        btn.onclick = () => { ov.remove(); this.playGame(); };
        ov.appendChild(t);
        ov.appendChild(s);
        ov.appendChild(btn);
        document.body.appendChild(ov);
    }
    playGame() {
        this.state = 'playing';
        this.elapsed = 0;
        this.player.position = { x: 1200, y: 900 };
        this.fish = [];
        this.caughtFish = [];
        this.score = 0;
        this.catches = 0;
        this.lastCardAt = 0;
        this.cardThreshold = CARD_BASE;
        this.currencies.setData({ soft: 0, hard: 0 });
        this.dpad.show();
        this.adReward.createButton();
        this.adReward.show();
        this.createShop();
        this.spawnFish(INITIAL_FISH);
    }
    spawnFish(n) {
        for (let i = 0; i < n && this.fish.length < MAX_FISH; i++) {
            const ti = Math.floor(Math.random() * FISH_TYPES.length);
            const ft = FISH_TYPES[ti];
            this.fish.push({
                id: `f_${Date.now()}_${i}`, typeIdx: ti,
                position: { x: 100 + Math.random() * (WORLD_W - 200), y: 100 + Math.random() * (WORLD_H - 200) },
                velocity: { x: (Math.random() - 0.5) * ft.speed, y: (Math.random() - 0.5) * ft.speed },
                size: ft.size, value: ft.value, color: ft.color, speed: ft.speed, caught: false,
            });
        }
    }
    createShop() {
        if (this.shopBtn)
            this.shopBtn.remove();
        this.shopBtn = document.createElement('button');
        this.shopBtn.className = 'game-ui';
        this.shopBtn.textContent = 'Shop';
        this.shopBtn.style.cssText = `position:fixed;bottom:${Math.max(30, window.innerHeight * 0.03)}px;right:${Math.max(20, window.innerWidth * 0.03)}px;padding:10px 16px;background:#4299e1;color:white;border:none;border-radius:8px;font-size:14px;cursor:pointer;z-index:200;font-weight:bold;`;
        this.shopBtn.onclick = () => this.showShop();
        document.body.appendChild(this.shopBtn);
    }
    showShop() {
        this.hideShop();
        const ov = document.createElement('div');
        ov.className = 'game-ui';
        ov.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.85);display:flex;flex-direction:column;align-items:center;justify-content:center;z-index:1000;padding:20px;box-sizing:border-box;';
        const t = document.createElement('h2');
        t.textContent = 'Tackle Shop';
        t.style.cssText = 'color:#e2e8f0;margin:0 0 20px;font-size:clamp(20px,5vw,28px);';
        const g = document.createElement('div');
        g.style.cssText = 'display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:12px;max-width:500px;width:100%;margin-bottom:20px;';
        this.shop.getItems().forEach(item => {
            const c = document.createElement('div');
            c.style.cssText = 'background:#2d3748;border-radius:10px;padding:14px;display:flex;flex-direction:column;gap:6px;';
            const n = document.createElement('div');
            n.textContent = item.name;
            n.style.cssText = 'color:white;font-size:15px;font-weight:bold;';
            const d = document.createElement('div');
            d.textContent = item.description;
            d.style.cssText = 'color:#a0aec0;font-size:12px;';
            const co = document.createElement('div');
            co.textContent = `Cost: ${item.cost.amount} ${item.cost.type}`;
            co.style.cssText = `color:${item.cost.type === 'soft' ? '#48bb78' : '#f6ad55'};font-size:13px;`;
            c.appendChild(n);
            c.appendChild(d);
            c.appendChild(co);
            if (item.owned) {
                const o = document.createElement('div');
                o.textContent = 'Owned';
                o.style.cssText = 'color:#48bb78;font-size:13px;font-weight:bold;';
                c.appendChild(o);
            }
            else {
                const b = document.createElement('button');
                b.textContent = 'Buy';
                b.style.cssText = 'background:#48bb78;color:white;border:none;border-radius:6px;padding:6px 14px;cursor:pointer;font-size:13px;font-weight:bold;';
                b.onclick = () => { if (this.shop.purchaseItem(item.id)) {
                    this.applyShop(item.id);
                    this.hideShop();
                    this.showShop();
                }
                else {
                    b.textContent = 'No funds!';
                    b.style.background = '#e53e3e';
                    setTimeout(() => { b.textContent = 'Buy'; b.style.background = '#48bb78'; }, 1200);
                } };
                c.appendChild(b);
            }
            g.appendChild(c);
        });
        const close = document.createElement('button');
        close.textContent = 'Close';
        close.style.cssText = 'background:#4a5568;color:white;border:none;border-radius:8px;padding:10px 30px;cursor:pointer;font-size:15px;';
        close.onclick = () => this.hideShop();
        ov.appendChild(t);
        ov.appendChild(g);
        ov.appendChild(close);
        document.body.appendChild(ov);
        this.shopOverlay = ov;
    }
    hideShop() { if (this.shopOverlay) {
        this.shopOverlay.remove();
        this.shopOverlay = null;
    } }
    applyShop(id) {
        if (id === 'lucky_lure') { /* increases rare fish spawn for 3min - timer placeholder */ }
        else if (id === 'speed_up')
            this.skills.upgradeSkill('boat_speed');
        else if (id === 'net_up')
            this.skills.upgradeSkill('net_size');
        else if (id === 'sonar') { }
    }
}
