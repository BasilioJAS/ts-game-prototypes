import { Vector2 } from '../../shared/types/index.js';
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

const WORLD_W = 2400; const WORLD_H = 1800;
const MAX_ZOMBIES = 15; const INITIAL_ZOMBIES = 3; const ZOMBIE_SPAWN_RATE = 8;
const CARD_BASE = 75; const CARD_SCALE = 50;
const PLAYER_HP = 100; const ZOMBIE_DAMAGE = 8; const BULLET_SPEED = 500; const BULLET_LIFE = 1;

interface Zombie { id: string; position: Vector2; velocity: Vector2; hp: number; maxHp: number; speed: number; damage: number; size: number; killed: boolean; attackTimer: number; state: 'idle' | 'chase'; }
interface Player { position: Vector2; speed: number; hp: number; maxHp: number; }
interface Bullet { position: Vector2; velocity: Vector2; life: number; }
interface Decoration { type: 'building' | 'tree' | 'fence' | 'car'; position: Vector2; size: number; color: string; }
type GameState = 'menu' | 'playing';

export class ZombieCatcherGame {
  private renderer: CanvasRenderer; private input: InputHandler; private gameLoop: GameLoop;
  private currencies: CurrencyManager; private cardSystem: CardSystem; private skills: SkillManager;
  private research: ResearchCenter; private shop: ShopSystem; private adReward: AdRewardSystem;
  private dpad: VirtualDPad = new VirtualDPad();
  private state: GameState = 'menu'; private elapsed: number = 0;
  private player: Player = { position: { x: 1200, y: 900 }, speed: 200, hp: PLAYER_HP, maxHp: PLAYER_HP };
  private zombies: Zombie[] = []; private bullets: Bullet[] = [];
  private kills: number = 0; private score: number = 0;
  private cardThreshold: number = CARD_BASE; private lastCardAt: number = 0;
  private decorations: Decoration[] = [];
  private spawnTimer: number = 0; private invuln: number = 0;
  private shopBtn: HTMLButtonElement | null = null; private shopOverlay: HTMLDivElement | null = null;

  constructor() {
    this.renderer = new CanvasRenderer('gameCanvas', 800, 600);
    this.input = new InputHandler(this.renderer.canvas);
    this.gameLoop = new GameLoop(this.update, this.render);
    this.currencies = new CurrencyManager(); this.cardSystem = new CardSystem(); this.skills = new SkillManager();
    this.research = new ResearchCenter(); this.shop = new ShopSystem(this.currencies);
    this.adReward = new AdRewardSystem(this.currencies);
    this.setupData(); this.genDecorations();
  }

  private genDecorations(): void {
    const a = () => Math.random();
    const colors = ['#4a5568', '#2d3748', '#1a202c', '#5c3a1e'];
    for (let i = 0; i < 12; i++) this.decorations.push({ type: 'building', position: { x: a() * WORLD_W, y: a() * WORLD_H }, size: 40 + a() * 50, color: colors[Math.floor(a() * colors.length)] });
    for (let i = 0; i < 20; i++) this.decorations.push({ type: 'tree', position: { x: a() * WORLD_W, y: a() * WORLD_H }, size: 30 + a() * 30, color: '#2d5016' });
    for (let i = 0; i < 10; i++) this.decorations.push({ type: 'fence', position: { x: a() * WORLD_W, y: a() * WORLD_H }, size: 15 + a() * 10, color: '#8b7355' });
    for (let i = 0; i < 6; i++) this.decorations.push({ type: 'car', position: { x: a() * WORLD_W, y: a() * WORLD_H }, size: 20 + a() * 15, color: ['#e53e3e', '#3182ce', '#48bb78', '#d69e2e'][Math.floor(a() * 4)] });
  }

  private setupData(): void {
    this.skills.addSkill({ id: 'speed', name: 'Speed', level: 1, maxLevel: 10, description: 'Move faster' });
    this.skills.addSkill({ id: 'damage', name: 'Damage', level: 1, maxLevel: 10, description: 'More bullet damage' });
    this.skills.addSkill({ id: 'fire_rate', name: 'Fire Rate', level: 1, maxLevel: 10, description: 'Shoot faster' });
    this.skills.addSkill({ id: 'hp', name: 'HP', level: 1, maxLevel: 10, description: 'More health' });
    this.cardSystem.setCards([
      { id: 'spd', skillId: 'speed', effect: '+1 Speed', rarity: 'common' },
      { id: 'dmg', skillId: 'damage', effect: '+1 Damage', rarity: 'common' },
      { id: 'fire', skillId: 'fire_rate', effect: '+1 Fire Rate', rarity: 'common' },
      { id: 'hp_c', skillId: 'hp', effect: '+1 HP', rarity: 'common' },
      { id: 'spd_r', skillId: 'speed', effect: '+2 Speed', rarity: 'rare' },
      { id: 'dmg_r', skillId: 'damage', effect: '+2 Damage', rarity: 'rare' },
      { id: 'fire_l', skillId: 'fire_rate', effect: '+3 Fire Rate', rarity: 'legendary' },
    ]);
    this.research.addResearch({ id: 'spawn_slower', name: 'Slow Spawn', duration: 30, progress: 0, completed: false });
    this.research.addResearch({ id: 'dmg_res', name: 'Damage+', duration: 45, progress: 0, completed: false });
    this.research.addResearch({ id: 'hp_res', name: 'HP+', duration: 60, progress: 0, completed: false });
    this.shop.addItem({ id: 'medkit', name: 'Medkit', description: 'Restore 50 HP', cost: { type: 'soft', amount: 80 }, owned: false });
    this.shop.addItem({ id: 'dmg_up', name: 'Damage Up', description: '+1 Damage level', cost: { type: 'soft', amount: 120 }, owned: false });
    this.shop.addItem({ id: 'speed_up', name: 'Speed Up', description: '+1 Speed level', cost: { type: 'soft', amount: 100 }, owned: false });
    this.shop.addItem({ id: 'nuke', name: 'Nuke', description: 'Kill all zombies on screen', cost: { type: 'hard', amount: 15 }, owned: false });
  }

  start(): void { this.dpad.hide(); this.menuRender(); this.gameLoop.start(); }

  private menuRender(): void {
    this.state = 'menu';
    document.querySelectorAll('.game-ui').forEach(e => e.remove());
    const ov = document.createElement('div');
    ov.className = 'game-ui';
    ov.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.85);display:flex;flex-direction:column;align-items:center;justify-content:center;z-index:999;padding:24px;box-sizing:border-box;';
    const t = document.createElement('h1'); t.textContent = '🧟 Zombie Hunter'; t.style.cssText = 'color:#e2e8f0;margin:0 0 8px;font-size:clamp(24px,7vw,42px);';
    const s = document.createElement('p'); s.textContent = 'Shoot zombies, survive, earn rewards!'; s.style.cssText = 'color:#a0aec0;margin:0 0 40px;font-size:clamp(12px,3vw,16px);';
    const btn = document.createElement('button'); btn.textContent = 'Start Game'; btn.style.cssText = 'width:min(280px,80vw);padding:16px 32px;border:none;border-radius:12px;font-size:clamp(16px,4vw,20px);cursor:pointer;background:#e53e3e;color:white;font-weight:bold;';
    btn.onclick = () => { ov.remove(); this.playGame(); };
    ov.appendChild(t); ov.appendChild(s); ov.appendChild(btn);
    document.body.appendChild(ov);
  }

  private playGame(): void {
    this.state = 'playing'; this.elapsed = 0;
    this.player.position = { x: 1200, y: 900 }; this.player.hp = PLAYER_HP;
    this.zombies = []; this.bullets = []; this.kills = 0; this.score = 0;
    this.lastCardAt = 0; this.cardThreshold = CARD_BASE; this.spawnTimer = 0; this.invuln = 0;
    this.currencies.setData({ soft: 0, hard: 0 });
    this.dpad.show(); this.adReward.createButton(); this.adReward.show(); this.createShop();
    this.spawnZombies(INITIAL_ZOMBIES);
  }

  private spawnZombies(n: number): void {
    for (let i = 0; i < n && this.zombies.length < MAX_ZOMBIES; i++) {
      let x: number, y: number;
      const side = Math.floor(Math.random() * 4);
      if (side === 0) { x = Math.random() * WORLD_W; y = 0; }
      else if (side === 1) { x = WORLD_W; y = Math.random() * WORLD_H; }
      else if (side === 2) { x = Math.random() * WORLD_W; y = WORLD_H; }
      else { x = 0; y = Math.random() * WORLD_H; }
      this.zombies.push({ id: `z_${Date.now()}_${i}`, position: { x, y }, velocity: { x: 0, y: 0 }, hp: 15 + Math.floor(this.elapsed / 60) * 5, maxHp: 15 + Math.floor(this.elapsed / 60) * 5, speed: 60 + Math.random() * 30, damage: ZOMBIE_DAMAGE, size: 12 + Math.random() * 8, killed: false, attackTimer: 0, state: 'idle' });
    }
  }

  private createShop(): void {
    if (this.shopBtn) this.shopBtn.remove();
    this.shopBtn = document.createElement('button');
    this.shopBtn.textContent = 'Shop'; this.shopBtn.className = 'game-ui';
    this.shopBtn.style.cssText = `position:fixed;bottom:${Math.max(30, window.innerHeight * 0.03)}px;right:${Math.max(20, window.innerWidth * 0.03)}px;padding:10px 16px;background:#e53e3e;color:white;border:none;border-radius:8px;font-size:14px;cursor:pointer;z-index:200;font-weight:bold;box-shadow:0 2px 8px rgba(0,0,0,0.3);`;
    this.shopBtn.onclick = () => this.showShop();
    document.body.appendChild(this.shopBtn);
  }

  private showShop(): void {
    this.hideShop();
    const ov = document.createElement('div'); ov.className = 'game-ui';
    ov.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.85);display:flex;flex-direction:column;align-items:center;justify-content:center;z-index:1000;padding:20px;box-sizing:border-box;';
    const t = document.createElement('h2'); t.textContent = 'Shop'; t.style.cssText = 'color:#e2e8f0;margin:0 0 20px;font-size:clamp(20px,5vw,28px);';
    const g = document.createElement('div'); g.style.cssText = 'display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:12px;max-width:500px;width:100%;margin-bottom:20px;';
    this.shop.getItems().forEach(item => {
      const c = document.createElement('div'); c.style.cssText = 'background:#2d3748;border-radius:10px;padding:14px;display:flex;flex-direction:column;gap:6px;';
      const n = document.createElement('div'); n.textContent = item.name; n.style.cssText = 'color:white;font-size:15px;font-weight:bold;';
      const d = document.createElement('div'); d.textContent = item.description; d.style.cssText = 'color:#a0aec0;font-size:12px;';
      const co = document.createElement('div'); co.textContent = `Cost: ${item.cost.amount} ${item.cost.type === 'soft' ? 'Soft' : 'Hard'}`; co.style.cssText = `color:${item.cost.type === 'soft' ? '#48bb78' : '#f6ad55'};font-size:13px;`;
      c.appendChild(n); c.appendChild(d); c.appendChild(co);
      if (item.owned) { const o = document.createElement('div'); o.textContent = 'Owned'; o.style.cssText = 'color:#48bb78;font-size:13px;font-weight:bold;'; c.appendChild(o); }
      else {
        const b = document.createElement('button'); b.textContent = 'Buy'; b.style.cssText = 'background:#48bb78;color:white;border:none;border-radius:6px;padding:6px 14px;cursor:pointer;font-size:13px;font-weight:bold;';
        b.onclick = () => { if (this.shop.purchaseItem(item.id)) { this.applyShop(item.id); this.hideShop(); this.showShop(); } else { b.textContent = 'No funds!'; b.style.background = '#e53e3e'; setTimeout(() => { b.textContent = 'Buy'; b.style.background = '#48bb78'; }, 1200); } };
        c.appendChild(b);
      }
      g.appendChild(c);
    });
    const close = document.createElement('button'); close.textContent = 'Close'; close.style.cssText = 'background:#4a5568;color:white;border:none;border-radius:8px;padding:10px 30px;cursor:pointer;font-size:15px;';
    close.onclick = () => this.hideShop();
    ov.appendChild(t); ov.appendChild(g); ov.appendChild(close);
    document.body.appendChild(ov); this.shopOverlay = ov;
  }

  private hideShop(): void { if (this.shopOverlay) { this.shopOverlay.remove(); this.shopOverlay = null; } }

  private applyShop(id: string): void {
    if (id === 'medkit') this.player.hp = Math.min(this.player.maxHp, this.player.hp + 50);
    else if (id === 'dmg_up') this.skills.upgradeSkill('damage');
    else if (id === 'speed_up') this.skills.upgradeSkill('speed');
    else if (id === 'nuke') { this.zombies = []; this.currencies.addSoft(this.kills * 5); }
  }

  private update = (dt: number): void => {
    if (this.state === 'menu') return;
    this.elapsed += dt;

    const k = this.input.getMovementDirection(); const d = this.dpad.direction;
    let dx = k.x + d.x, dy = k.y + d.y; const len = Math.sqrt(dx * dx + dy * dy);
    if (len > 0.01) {
      const spd = this.player.speed + (this.skills.getSkillLevel('speed') - 1) * 15;
      this.player.position.x += (dx / len) * spd * dt; this.player.position.y += (dy / len) * spd * dt;
    }
    this.player.position.x = Math.max(20, Math.min(WORLD_W - 20, this.player.position.x));
    this.player.position.y = Math.max(20, Math.min(WORLD_H - 20, this.player.position.y));
    if (this.invuln > 0) this.invuln -= dt;

    let nearestZombie: Zombie | null = null;
    let nearestDist = Infinity;
    for (const z of this.zombies) {
      const dx = z.position.x - this.player.position.x, dy = z.position.y - this.player.position.y;
      const d = Math.sqrt(dx * dx + dy * dy);
      if (d < nearestDist) { nearestDist = d; nearestZombie = z; }
    }
    if (nearestZombie && nearestDist < 400) {
      const fireRate = Math.max(0.12, 0.45 - (this.skills.getSkillLevel('fire_rate') - 1) * 0.035);
      if (this.bullets.length === 0 || this.bullets[this.bullets.length - 1].life > BULLET_LIFE - fireRate - 0.05) {
        const dx = nearestZombie.position.x - this.player.position.x, dy = nearestZombie.position.y - this.player.position.y;
        const d = Math.sqrt(dx * dx + dy * dy);
        if (d > 0) this.bullets.push({ position: { x: this.player.position.x, y: this.player.position.y }, velocity: { x: (dx / d) * BULLET_SPEED, y: (dy / d) * BULLET_SPEED }, life: BULLET_LIFE });
      }
    }

    this.bullets.forEach(b => {
      b.position.x += b.velocity.x * dt; b.position.y += b.velocity.y * dt;
      b.life -= dt;
    });
    this.bullets = this.bullets.filter(b => b.life > 0 && b.position.x > 0 && b.position.x < WORLD_W && b.position.y > 0 && b.position.y < WORLD_H);

    this.zombies.forEach(z => {
      const pdx = this.player.position.x - z.position.x, pdy = this.player.position.y - z.position.y;
      const dist = Math.sqrt(pdx * pdx + pdy * pdy);
      if (z.attackTimer > 0) z.attackTimer -= dt;
      z.state = 'chase';
      const chaseSpeed = (dist > 300 ? 0.5 : 1) * z.speed;
      if (dist > 1) { z.velocity.x = (pdx / dist) * chaseSpeed; z.velocity.y = (pdy / dist) * chaseSpeed; }
      if (dist < 20 && this.invuln <= 0) {
        this.player.hp = Math.max(0, this.player.hp - z.damage);
        this.invuln = 0.5;
        z.attackTimer = 2;
        if (this.player.hp <= 0) this.respawn();
      }
      z.position.x += z.velocity.x * dt; z.position.y += z.velocity.y * dt;
      z.position.x = Math.max(0, Math.min(WORLD_W, z.position.x));
      z.position.y = Math.max(0, Math.min(WORLD_H, z.position.y));
    });

    const dmg = 10 + (this.skills.getSkillLevel('damage') - 1) * 5;
    this.bullets.forEach(b => {
      this.zombies.forEach(z => {
        if (z.killed) return;
        const dist = Math.sqrt(Math.pow(b.position.x - z.position.x, 2) + Math.pow(b.position.y - z.position.y, 2));
        if (dist < z.size + 5) {
          z.hp -= dmg; b.life = 0;
          if (z.hp <= 0) { z.killed = true; this.kills++; const val = 5 + Math.floor(z.maxHp / 5); this.currencies.addSoft(val); this.score += val; }
        }
      });
    });
    this.zombies = this.zombies.filter(z => !z.killed);

    const atHouse = this.player.position.x < 130 && this.player.position.y < 130;
    if (atHouse && this.kills > 0) {
      if (this.score - this.lastCardAt >= this.cardThreshold) {
        this.lastCardAt = this.score; this.cardThreshold += CARD_SCALE;
        this.cardSystem.showChoice(this.cardSystem.getRandomCards(3), (card) => this.skills.upgradeSkill(card.skillId));
      }
    }

    this.spawnTimer += dt;
    if (this.spawnTimer >= ZOMBIE_SPAWN_RATE && this.zombies.length < MAX_ZOMBIES) {
      this.spawnTimer = 0; this.spawnZombies(1 + Math.floor(this.elapsed / 90));
    }

    if (this.player.hp < this.player.maxHp && atHouse) this.player.hp = Math.min(this.player.maxHp, this.player.hp + 10 * dt);

    this.research.update(dt);
    const act = this.research.getActiveResearch();
    if (act && act.completed) {
      if (act.id === 'spawn_slower') { }
      else if (act.id === 'dmg_res') this.skills.upgradeSkill('damage');
      else if (act.id === 'hp_res') this.skills.upgradeSkill('hp');
    }
    const allR = this.research.getAllResearch();
    if (!allR.every(r => r.completed) && !this.research.getActiveResearch()) {
      const n = allR.find(r => !r.completed); if (n) this.research.startResearch(n.id);
    }
  };

  private respawn(): void {
    this.player.position = { x: 60, y: 60 }; this.player.hp = Math.floor(this.player.maxHp / 2);
    const lost = Math.floor(this.currencies.soft * 0.3);
    this.currencies.spendSoft(lost);
  }

  private render = (_: number): void => {
    const ctx = this.renderer.ctx; const cw = this.renderer.canvas.width; const ch = this.renderer.canvas.height;
    const vw = window.innerWidth; const vh = window.innerHeight;
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, cw, ch);

    if (this.state === 'menu') { ctx.fillStyle = '#1a202c'; ctx.fillRect(0, 0, cw, ch); return; }

    const scale = vh / ch;
    const camX = Math.max(vw - WORLD_W * scale, Math.min(0, vw / 2 - this.player.position.x * scale));
    const camY = Math.max(vh - WORLD_H * scale, Math.min(0, vh / 2 - this.player.position.y * scale));
    ctx.setTransform(scale, 0, 0, scale, camX, camY);

    ctx.fillStyle = '#1a202c'; ctx.fillRect(0, 0, WORLD_W, WORLD_H);
    for (let gy = 0; gy < WORLD_H; gy += 80) for (let gx = 0; gx < WORLD_W; gx += 80) { ctx.fillStyle = (Math.floor(gx / 80) + Math.floor(gy / 80)) % 2 === 0 ? '#2d3748' : '#1a202c'; ctx.fillRect(gx, gy, 80, 80); }

    this.decorations.forEach(d => {
      if (d.type === 'tree') { this.renderer.drawTree(d.position.x, d.position.y, d.size); }
      else if (d.type === 'building') { this.renderer.drawRect(d.position.x, d.position.y, d.size, d.size * 0.8, d.color); this.renderer.drawRect(d.position.x + d.size * 0.3, d.position.y + d.size * 0.2, d.size * 0.15, d.size * 0.15, '#f6e05e'); }
      else if (d.type === 'fence') { this.renderer.drawRect(d.position.x, d.position.y, d.size, d.size * 0.3, d.color); for (let i = 0; i < 4; i++) this.renderer.drawRect(d.position.x + i * d.size / 4, d.position.y - d.size * 0.3, 3, d.size * 0.3, d.color); }
      else if (d.type === 'car') { this.renderer.drawRect(d.position.x, d.position.y, d.size * 2.2, d.size, d.color); this.renderer.drawCircle(d.position.x + d.size * 0.3, d.position.y + d.size, d.size * 0.3, '#1a202c'); this.renderer.drawCircle(d.position.x + d.size * 1.7, d.position.y + d.size, d.size * 0.3, '#1a202c'); }
    });

    this.renderer.drawRect(20, 20, 110, 110, '#4a5568'); this.renderer.drawRect(30, 30, 90, 25, '#718096'); this.renderer.drawText('SAFE ZONE', 35, 48, 'white', 13); this.renderer.drawRect(30, 65, 90, 55, '#2d3748');

    this.zombies.forEach(z => {
      const wobble = Math.sin(this.elapsed * 3 + parseFloat(z.id.slice(-4))) * 2;
      this.renderer.drawCircle(z.position.x, z.position.y + wobble, z.size, '#48bb78');
      this.renderer.drawCircle(z.position.x - z.size * 0.3, z.position.y - z.size * 0.3 + wobble, 4, '#e53e3e');
      this.renderer.drawCircle(z.position.x + z.size * 0.3, z.position.y - z.size * 0.3 + wobble, 4, '#e53e3e');
      if (z.hp < z.maxHp) { const bw = z.size * 1.5; this.renderer.drawRect(z.position.x - bw / 2, z.position.y - z.size - 8, bw, 4, '#4a5568'); this.renderer.drawRect(z.position.x - bw / 2, z.position.y - z.size - 8, bw * (z.hp / z.maxHp), 4, '#48bb78'); }
      if (z.state === 'chase') this.renderer.drawCircle(z.position.x, z.position.y, z.size + 8, 'rgba(72, 187, 120, 0.1)');
    });

    this.bullets.forEach(b => { this.renderer.drawCircle(b.position.x, b.position.y, 4, '#f6e05e'); this.renderer.drawCircle(b.position.x, b.position.y, 2, 'white'); });

    this.renderer.drawCircle(this.player.position.x, this.player.position.y, 12, '#3182ce');
    this.renderer.drawCircle(this.player.position.x, this.player.position.y, 20, 'rgba(49, 130, 206, 0.15)');

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    this.renderer.drawText(`HP: ${this.player.hp}/${this.player.maxHp}`, 8, 18, this.player.hp < 30 ? '#fc8181' : '#48bb78', 14);
    this.renderer.drawText(`Soft: ${this.currencies.soft}`, 8, 36, 'white', 13);
    this.renderer.drawText(`Hard: ${this.currencies.hard}`, 8, 52, 'white', 13);
    this.renderer.drawText(`Kills: ${this.kills}`, 8, 68, 'white', 13);
    this.renderer.drawText(`Score: ${this.score}`, 8, 84, 'white', 13);

    const sl = [{ id: 'speed', label: 'Spd' }, { id: 'damage', label: 'Dmg' }, { id: 'fire_rate', label: 'Fire' }, { id: 'hp', label: 'HP' }];
    const rx = cw - 130;
    sl.forEach((s, i) => {
      const lv = this.skills.getSkillLevel(s.id); const by = 20 + i * 24;
      this.renderer.drawText(`${s.label} Lv.${lv}`, rx, by, '#e2e8f0', 11);
      this.renderer.drawRect(rx, by + 4, 90, 7, '#4a5568'); this.renderer.drawRect(rx, by + 4, 90 * (lv / 10), 7, '#48bb78');
    });

    const a = this.research.getActiveResearch();
    if (a) { this.renderer.drawRect(rx, 126, 120, 12, '#4a5568'); this.renderer.drawRect(rx, 126, 120 * a.progress, 12, '#4299e1'); this.renderer.drawText(`${a.name} ${Math.floor(a.progress * 100)}%`, rx + 2, 135, 'white', 9); }
    else { const allR = this.research.getAllResearch(); const d = allR.filter(r => r.completed).length; this.renderer.drawText(d < allR.length ? `R&D: ${d}/${allR.length}` : 'All done!', rx, 126, d < allR.length ? '#a0aec0' : '#48bb78', 11); }

    this.renderer.drawText('Auto-fire at nearest zombie. Move with WASD/D-Pad.', 8, 102, '#a0aec0', 10);
  };
}
