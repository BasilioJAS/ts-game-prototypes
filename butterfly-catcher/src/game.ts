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
import { MenuSystem, BUTTERFLY_TYPES, ButterflyEntry } from '../../shared/mechanics/MenuSystem.js';
import { VirtualDPad } from '../../shared/engine/VirtualDPad.js';

const WORLD_W = 2400; const WORLD_H = 1800;
const FLUTTER_SPEED = 6;
const MAX_BUTTERFLIES = 10; const INITIAL_BUTTERFLIES = 4; const SPAWN_ON_DEPOSIT = 2;
const CARD_BASE_THRESHOLD = 50; const CARD_THRESHOLD_SCALE = 25;
const BUTTERFLY_FLEE_RADIUS = 150; const FLOWER_HIDE_RADIUS = 60;
const BEE_COUNT = 3; const MOSQUITO_COUNT = 4;
const PLAYER_MAX_HP = 100; const BEE_DAMAGE = 10; const BEE_ATTACK_COOLDOWN = 1.5;

interface Butterfly {
  id: string; type: string; position: Vector2; velocity: Vector2;
  color: string; value: number; caught: boolean;
  wingOffset: number; size: number;
  scared: boolean; scaredTimer: number; hidden: boolean;
  emergeTimer: number; hideTarget: Vector2 | null;
}

interface Bee {
  id: string; position: Vector2; velocity: Vector2;
  aggroRange: number; damage: number;
  patrolCenter: Vector2; patrolRadius: number;
  chasing: boolean; attackTimer: number; size: number;
}

interface Mosquito {
  id: string; position: Vector2; velocity: Vector2;
  biteCooldown: number; size: number; timer: number;
}

interface Player { position: Vector2; speed: number; catchRadius: number; hp: number; maxHp: number; }

interface Decoration { type: 'tree' | 'flower' | 'rock' | 'bush'; position: Vector2; color?: string; size: number; }

type GameState = 'menu' | 'playing';

export class ButterflyCatcherGame {
  private renderer: CanvasRenderer; private input: InputHandler; private gameLoop: GameLoop;
  private currencies: CurrencyManager; private cardSystem: CardSystem; private skills: SkillManager;
  private research: ResearchCenter; private shop: ShopSystem; private adReward: AdRewardSystem;
  private menu: MenuSystem; private dpad: VirtualDPad = new VirtualDPad();

  private state: GameState = 'menu'; private elapsedTime: number = 0;

  private player: Player = { position: { x: 1200, y: 900 }, speed: 220, catchRadius: 55, hp: PLAYER_MAX_HP, maxHp: PLAYER_MAX_HP };

  private butterflies: Butterfly[] = []; private caughtButterflies: Butterfly[] = [];
  private bees: Bee[] = []; private mosquitoes: Mosquito[] = [];
  private score: number = 0;
  private cardChoiceThreshold: number = CARD_BASE_THRESHOLD; private lastCardChoiceAt: number = 0;
  private encyclopedia: Map<string, ButterflyEntry> = new Map();
  private decorations: Decoration[] = [];
  private doubleCurrencyTimer: number = 0; private researchSpawnBonus: number = 0;
  private shopBtn: HTMLButtonElement | null = null; private shopOverlay: HTMLDivElement | null = null;
  private skillDebuffs: Map<string, number> = new Map();
  private invulnTimer: number = 0;

  constructor() {
    this.renderer = new CanvasRenderer('gameCanvas', 800, 600);
    this.input = new InputHandler(this.renderer.canvas);
    this.gameLoop = new GameLoop(this.update, this.render);
    this.currencies = new CurrencyManager();
    this.cardSystem = new CardSystem();
    this.skills = new SkillManager();
    this.research = new ResearchCenter();
    this.shop = new ShopSystem(this.currencies);
    this.adReward = new AdRewardSystem(this.currencies);
    this.menu = new MenuSystem(() => this.startGame(), () => Array.from(this.encyclopedia.values()));
    this.setupInitialData(); this.generateDecorations();
  }

  private generateDecorations(): void {
    const a = () => Math.random();
    for (let i = 0; i < 25; i++) this.decorations.push({ type: 'tree', position: { x: a() * WORLD_W, y: a() * WORLD_H }, size: 35 + a() * 25 });
    const fc = ['#ff6b6b', '#ffa502', '#ff4757', '#e056fd', '#ff9ff3'];
    for (let i = 0; i < 40; i++) {
      const bx = a() * WORLD_W, by = a() * WORLD_H;
      for (let j = 0; j < 3 + Math.floor(a() * 3); j++) this.decorations.push({ type: 'flower', position: { x: bx + (a() - 0.5) * 30, y: by + (a() - 0.5) * 30 }, color: fc[Math.floor(a() * fc.length)], size: 4 + a() * 4 });
    }
    for (let i = 0; i < 15; i++) this.decorations.push({ type: 'rock', position: { x: a() * WORLD_W, y: a() * WORLD_H }, size: 10 + a() * 15 });
    for (let i = 0; i < 12; i++) this.decorations.push({ type: 'bush', position: { x: a() * WORLD_W, y: a() * WORLD_H }, size: 20 + a() * 15 });
  }

  private findNearestFlower(pos: Vector2): Vector2 | null {
    let best: Vector2 | null = null; let bestD = Infinity;
    for (const d of this.decorations) {
      if (d.type !== 'flower') continue;
      const dx = d.position.x - pos.x, dy = d.position.y - pos.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < bestD) { bestD = dist; best = d.position; }
    }
    return bestD < FLOWER_HIDE_RADIUS * 2 ? best : null;
  }

  private setupInitialData(): void {
    this.skills.addSkill({ id: 'speed', name: 'Speed', level: 1, maxLevel: 10, description: 'Move faster' });
    this.skills.addSkill({ id: 'catch_radius', name: 'Catch Radius', level: 1, maxLevel: 10, description: 'Catch from further' });
    this.skills.addSkill({ id: 'butterfly_value', name: 'Butterfly Value', level: 1, maxLevel: 10, description: 'More currency per butterfly' });
    this.skills.addSkill({ id: 'hp', name: 'HP', level: 1, maxLevel: 10, description: 'More health' });
    this.cardSystem.setCards([
      { id: 'speed_boost', skillId: 'speed', effect: '+1 Speed Level', rarity: 'common' },
      { id: 'catch_boost', skillId: 'catch_radius', effect: '+1 Catch Radius', rarity: 'common' },
      { id: 'value_boost', skillId: 'butterfly_value', effect: '+1 Value Level', rarity: 'common' },
      { id: 'hp_boost', skillId: 'hp', effect: '+1 HP Level', rarity: 'common' },
      { id: 'speed_rare', skillId: 'speed', effect: '+2 Speed', rarity: 'rare' },
      { id: 'value_legendary', skillId: 'butterfly_value', effect: '+3 Value', rarity: 'legendary' },
      { id: 'hp_rare', skillId: 'hp', effect: '+2 HP', rarity: 'rare' },
    ]);
    this.research.addResearch({ id: 'butterfly_spawn_rate', name: 'Spawn Rate', duration: 30, progress: 0, completed: false });
    this.research.addResearch({ id: 'speed_research', name: 'Speed Boost', duration: 45, progress: 0, completed: false });
    this.research.addResearch({ id: 'catch_research', name: 'Catch Range', duration: 60, progress: 0, completed: false });
    this.shop.addItem({ id: 'double_currency', name: 'Double Currency', description: '2x soft currency for 5min', cost: { type: 'hard', amount: 10 }, owned: false });
    this.shop.addItem({ id: 'speed_boost_item', name: 'Speed Boost', description: '+1 Speed level', cost: { type: 'soft', amount: 100 }, owned: false });
    this.shop.addItem({ id: 'catch_boost_item', name: 'Catch Boost', description: '+1 Catch Radius level', cost: { type: 'soft', amount: 150 }, owned: false });
    this.shop.addItem({ id: 'big_net', name: 'Big Net', description: '+20 catch radius permanently', cost: { type: 'hard', amount: 25 }, owned: false });
    this.shop.addItem({ id: 'hp_potion', name: 'HP Potion', description: 'Restore 50 HP', cost: { type: 'soft', amount: 75 }, owned: false });
  }

  start(): void { this.dpad.hide(); this.adReward.createButton(); this.adReward.hide(); this.menu.showMenu(); this.gameLoop.start(); }

  private startGame(): void {
    this.state = 'playing'; this.elapsedTime = 0;
    this.player.position = { x: 1200, y: 900 }; this.player.hp = PLAYER_MAX_HP;
    this.butterflies = []; this.caughtButterflies = []; this.bees = []; this.mosquitoes = [];
    this.score = 0; this.lastCardChoiceAt = 0; this.cardChoiceThreshold = CARD_BASE_THRESHOLD;
    this.doubleCurrencyTimer = 0; this.researchSpawnBonus = 0; this.invulnTimer = 0;
    this.skillDebuffs.clear();
    this.currencies.setData({ soft: 0, hard: 0 });
    this.dpad.show(); this.adReward.createButton(); this.adReward.show(); this.createShopButton();
    this.spawnButterflies(INITIAL_BUTTERFLIES); this.spawnBees(); this.spawnMosquitoes();
  }

  private spawnButterflies(count: number): void {
    const max = MAX_BUTTERFLIES + Math.floor(this.researchSpawnBonus);
    const space = max - this.butterflies.length; if (space <= 0) return;
    const n = Math.min(count, space);
    for (let i = 0; i < n; i++) {
      const t = BUTTERFLY_TYPES[Math.floor(Math.random() * BUTTERFLY_TYPES.length)];
      this.butterflies.push({ id: `bf_${Date.now()}_${i}`, type: t.id, position: { x: 100 + Math.random() * (WORLD_W - 200), y: 100 + Math.random() * (WORLD_H - 200) }, velocity: { x: (Math.random() - 0.5) * 100, y: (Math.random() - 0.5) * 100 }, color: t.color, value: 8 + Math.floor(Math.random() * 25), caught: false, wingOffset: Math.random() * Math.PI * 2, size: 7 + Math.random() * 6, scared: false, scaredTimer: 0, hidden: false, emergeTimer: 0, hideTarget: null });
    }
  }

  private spawnBees(): void {
    for (let i = 0; i < BEE_COUNT; i++) {
      const cx = 200 + Math.random() * (WORLD_W - 400), cy = 200 + Math.random() * (WORLD_H - 400);
      this.bees.push({ id: `bee_${i}`, position: { x: cx + (Math.random() - 0.5) * 100, y: cy + (Math.random() - 0.5) * 100 }, velocity: { x: (Math.random() - 0.5) * 60, y: (Math.random() - 0.5) * 60 }, aggroRange: 200, damage: BEE_DAMAGE, patrolCenter: { x: cx, y: cy }, patrolRadius: 80, chasing: false, attackTimer: 0, size: 10 + Math.random() * 3 });
    }
  }

  private spawnMosquitoes(): void {
    for (let i = 0; i < MOSQUITO_COUNT; i++) {
      this.mosquitoes.push({ id: `mos_${i}`, position: { x: 100 + Math.random() * (WORLD_W - 200), y: 100 + Math.random() * (WORLD_H - 200) }, velocity: { x: (Math.random() - 0.5) * 40, y: (Math.random() - 0.5) * 40 }, biteCooldown: 5 + Math.random() * 5, size: 5, timer: 0 });
    }
  }

  private trackEncyclopedia(b: Butterfly): void {
    const e = this.encyclopedia.get(b.type);
    if (e) { e.count++; e.totalValue += b.value; } else this.encyclopedia.set(b.type, { type: b.type, color: b.color, count: 1, totalValue: b.value });
  }

  private getEffectiveSkill(id: string): number { return Math.max(1, (this.skills.getSkillLevel(id) - ((this.skillDebuffs.get(id) ?? 0) > 0 ? 1 : 0))); }

  private createShopButton(): void {
    if (this.shopBtn) this.shopBtn.remove();
    this.shopBtn = document.createElement('button');
    this.shopBtn.textContent = 'Shop';
    this.shopBtn.style.cssText = `position:fixed;bottom:${Math.max(30, window.innerHeight * 0.03)}px;right:${Math.max(20, window.innerWidth * 0.03)}px;padding:10px 16px;background:#4299e1;color:white;border:none;border-radius:8px;font-size:14px;cursor:pointer;z-index:200;font-weight:bold;box-shadow:0 2px 8px rgba(0,0,0,0.3);`;
    this.shopBtn.onclick = () => this.showShop();
    document.body.appendChild(this.shopBtn);
  }

  private showShop(): void {
    this.hideShop();
    const ov = document.createElement('div'); ov.id = 'shop-overlay';
    ov.style.cssText = `position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.85);display:flex;flex-direction:column;align-items:center;justify-content:center;z-index:1000;padding:20px;box-sizing:border-box;`;
    const title = document.createElement('h2'); title.textContent = 'Shop'; title.style.cssText = 'color:#e2e8f0;margin:0 0 20px 0;font-size:clamp(20px,5vw,28px);';
    const grid = document.createElement('div'); grid.style.cssText = `display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:12px;max-width:500px;width:100%;margin-bottom:20px;`;
    this.shop.getItems().forEach(item => {
      const card = document.createElement('div'); card.style.cssText = 'background:#2d3748;border-radius:10px;padding:14px;display:flex;flex-direction:column;gap:6px;';
      const n = document.createElement('div'); n.textContent = item.name; n.style.cssText = 'color:white;font-size:15px;font-weight:bold;';
      const d = document.createElement('div'); d.textContent = item.description; d.style.cssText = 'color:#a0aec0;font-size:12px;';
      const c = document.createElement('div'); c.textContent = `Cost: ${item.cost.amount} ${item.cost.type === 'soft' ? 'Soft' : 'Hard'}`; c.style.cssText = `color:${item.cost.type === 'soft' ? '#48bb78' : '#f6ad55'};font-size:13px;`;
      card.appendChild(n); card.appendChild(d); card.appendChild(c);
      if (item.owned) { const o = document.createElement('div'); o.textContent = 'Owned'; o.style.cssText = 'color:#48bb78;font-size:13px;font-weight:bold;'; card.appendChild(o); }
      else {
        const btn = document.createElement('button'); btn.textContent = 'Buy'; btn.style.cssText = 'background:#48bb78;color:white;border:none;border-radius:6px;padding:6px 14px;cursor:pointer;font-size:13px;font-weight:bold;';
        btn.onclick = () => { if (this.shop.purchaseItem(item.id)) { this.applyShopEffect(item.id); this.hideShop(); this.showShop(); } else { btn.textContent = 'Not enough!'; btn.style.background = '#e53e3e'; setTimeout(() => { btn.textContent = 'Buy'; btn.style.background = '#48bb78'; }, 1200); } };
        card.appendChild(btn);
      }
      grid.appendChild(card);
    });
    const close = document.createElement('button'); close.textContent = 'Close'; close.style.cssText = 'background:#4a5568;color:white;border:none;border-radius:8px;padding:10px 30px;cursor:pointer;font-size:15px;';
    close.onclick = () => this.hideShop();
    ov.appendChild(title); ov.appendChild(grid); ov.appendChild(close);
    document.body.appendChild(ov); this.shopOverlay = ov;
  }

  private hideShop(): void { if (this.shopOverlay) { this.shopOverlay.remove(); this.shopOverlay = null; } }

  private applyShopEffect(id: string): void {
    switch (id) {
      case 'double_currency': this.doubleCurrencyTimer = 300; break;
      case 'speed_boost_item': this.skills.upgradeSkill('speed'); break;
      case 'catch_boost_item': this.skills.upgradeSkill('catch_radius'); break;
      case 'big_net': this.player.catchRadius += 20; break;
      case 'hp_potion': this.player.hp = Math.min(this.player.maxHp, this.player.hp + 50); break;
    }
  }

  private update = (deltaTime: number): void => {
    if (this.state === 'menu') return;
    this.elapsedTime += deltaTime;

    const k = this.input.getMovementDirection(); const d = this.dpad.direction;
    let dx = k.x + d.x, dy = k.y + d.y;
    const len = Math.sqrt(dx * dx + dy * dy);
    if (len > 0.01) {
      const spd = this.player.speed + (this.getEffectiveSkill('speed') - 1) * 15;
      this.player.position.x += (dx / len) * spd * deltaTime;
      this.player.position.y += (dy / len) * spd * deltaTime;
    }
    this.player.position.x = Math.max(20, Math.min(WORLD_W - 20, this.player.position.x));
    this.player.position.y = Math.max(20, Math.min(WORLD_H - 20, this.player.position.y));

    if (this.invulnTimer > 0) this.invulnTimer -= deltaTime;

    for (const debuff of this.skillDebuffs.keys()) {
      const t = this.skillDebuffs.get(debuff)! - deltaTime;
      if (t <= 0) this.skillDebuffs.delete(debuff); else this.skillDebuffs.set(debuff, t);
    }

    this.butterflies.forEach(b => {
      const pdx = this.player.position.x - b.position.x, pdy = this.player.position.y - b.position.y;
      const dist = Math.sqrt(pdx * pdx + pdy * pdy);

      if (dist < BUTTERFLY_FLEE_RADIUS) {
        b.scared = true; b.scaredTimer = 6;
        if (dist > 1) {
          const fleeSpd = 150;
          b.velocity.x = (-pdx / dist) * fleeSpd + (Math.random() - 0.5) * 40;
          b.velocity.y = (-pdy / dist) * fleeSpd + (Math.random() - 0.5) * 40;
        }
      } else if (b.scaredTimer > 0) {
        b.scaredTimer -= deltaTime;
        if (b.scaredTimer <= 0) { b.scared = false; b.scaredTimer = 0; }
      }

      if (b.scared && !b.hidden) {
        const flower = this.findNearestFlower(b.position);
        if (flower) {
          const fd = Math.sqrt(Math.pow(flower.x - b.position.x, 2) + Math.pow(flower.y - b.position.y, 2));
          if (fd < FLOWER_HIDE_RADIUS) { b.hidden = true; b.hideTarget = flower; b.emergeTimer = 4; }
          else {
            const fdx = flower.x - b.position.x, fdy = flower.y - b.position.y;
            b.velocity.x = (fdx / fd) * 100; b.velocity.y = (fdy / fd) * 100;
          }
        }
      }

      if (b.hidden) {
        b.emergeTimer -= deltaTime;
        if (!b.scared && b.emergeTimer <= 0) {
          b.hidden = false; b.hideTarget = null;
          b.velocity.x = (Math.random() - 0.5) * 100; b.velocity.y = (Math.random() - 0.5) * 100;
        }
      }

      if (!b.hidden && !b.scared) {
        if (Math.random() < 0.015) { b.velocity.x = (Math.random() - 0.5) * 100; b.velocity.y = (Math.random() - 0.5) * 100; }
        b.position.x += b.velocity.x * deltaTime; b.position.y += b.velocity.y * deltaTime;
      }

      if (b.position.x < 20 || b.position.x > WORLD_W - 20) b.velocity.x *= -1;
      if (b.position.y < 20 || b.position.y > WORLD_H - 20) b.velocity.y *= -1;
      b.position.x = Math.max(20, Math.min(WORLD_W - 20, b.position.x));
      b.position.y = Math.max(20, Math.min(WORLD_H - 20, b.position.y));
    });

    const catchR = this.player.catchRadius + (this.getEffectiveSkill('catch_radius') - 1) * 8;
    this.butterflies.forEach(b => {
      if (b.caught || b.hidden) return;
      const dist = Math.sqrt(Math.pow(b.position.x - this.player.position.x, 2) + Math.pow(b.position.y - this.player.position.y, 2));
      if (dist < catchR) { b.caught = true; this.caughtButterflies.push(b); this.trackEncyclopedia(b); }
    });
    this.butterflies = this.butterflies.filter(b => !b.caught);

    this.bees.forEach(b => {
      const pdx = this.player.position.x - b.position.x, pdy = this.player.position.y - b.position.y;
      const dist = Math.sqrt(pdx * pdx + pdy * pdy);
      b.attackTimer = Math.max(0, b.attackTimer - deltaTime);

      if (dist < b.aggroRange && b.attackTimer === 0) {
        b.chasing = true;
        const spd = 140;
        if (dist > 1) { b.velocity.x = (pdx / dist) * spd; b.velocity.y = (pdy / dist) * spd; }
        if (dist < 25 && this.invulnTimer <= 0) {
          this.player.hp = Math.max(0, this.player.hp - b.damage);
          this.invulnTimer = 0.5;
          b.attackTimer = BEE_ATTACK_COOLDOWN;
          if (this.player.hp <= 0) { this.respawn(); }
        }
      } else {
        if (b.chasing) {
          b.chasing = false;
          const cdx = b.patrolCenter.x - b.position.x, cdy = b.patrolCenter.y - b.position.y;
          const cd = Math.sqrt(cdx * cdx + cdy * cdy);
          b.velocity.x = cd > 1 ? (cdx / cd) * 50 : 0; b.velocity.y = cd > 1 ? (cdy / cd) * 50 : 0;
        } else {
          const cdx = b.position.x - b.patrolCenter.x, cdy = b.position.y - b.patrolCenter.y;
          const cd = Math.sqrt(cdx * cdx + cdy * cdy);
          if (cd > b.patrolRadius) { b.velocity.x += (-cdx / cd) * 20 * deltaTime; b.velocity.y += (-cdy / cd) * 20 * deltaTime; }
          if (Math.random() < 0.02) { b.velocity.x = (Math.random() - 0.5) * 60; b.velocity.y = (Math.random() - 0.5) * 60; }
          b.position.x += b.velocity.x * deltaTime; b.position.y += b.velocity.y * deltaTime;
        }
      }
    });

    this.mosquitoes.forEach(m => {
      const pdx = this.player.position.x - m.position.x, pdy = this.player.position.y - m.position.y;
      const dist = Math.sqrt(pdx * pdx + pdy * pdy);
      m.timer += deltaTime;

      if (dist < 150 && m.biteCooldown <= 0) {
        const spd = 80;
        if (dist > 1) { m.velocity.x = (pdx / dist) * spd + (Math.random() - 0.5) * 30; m.velocity.y = (pdy / dist) * spd + (Math.random() - 0.5) * 30; }
        if (dist < 15) {
          const skills = ['speed', 'catch_radius', 'butterfly_value'];
          const target = skills[Math.floor(Math.random() * skills.length)];
          this.skillDebuffs.set(target, 10);
          m.biteCooldown = 8 + Math.random() * 4;
        }
      } else {
        if (m.biteCooldown > 0) m.biteCooldown -= deltaTime;
        if (Math.random() < 0.03) { m.velocity.x = (Math.random() - 0.5) * 50; m.velocity.y = (Math.random() - 0.5) * 50; }
        m.position.x += m.velocity.x * deltaTime; m.position.y += m.velocity.y * deltaTime;
      }
      if (m.position.x < 20 || m.position.x > WORLD_W - 20) m.velocity.x *= -1;
      if (m.position.y < 20 || m.position.y > WORLD_H - 20) m.velocity.y *= -1;
      m.position.x = Math.max(20, Math.min(WORLD_W - 20, m.position.x));
      m.position.y = Math.max(20, Math.min(WORLD_H - 20, m.position.y));
    });

    const atHouse = this.player.position.x < 130 && this.player.position.y < 130;
    if (atHouse && this.caughtButterflies.length > 0) {
      let totalValue = this.caughtButterflies.reduce((sum, b) => sum + b.value, 0) * (1 + (this.getEffectiveSkill('butterfly_value') - 1) * 0.15);
      if (this.doubleCurrencyTimer > 0) totalValue *= 2;
      this.currencies.addSoft(Math.floor(totalValue)); this.score += Math.floor(totalValue);
      this.caughtButterflies = [];
      if (this.score - this.lastCardChoiceAt >= this.cardChoiceThreshold) { this.lastCardChoiceAt = this.score; this.cardChoiceThreshold += CARD_THRESHOLD_SCALE; this.triggerCardChoice(); }
      this.spawnButterflies(SPAWN_ON_DEPOSIT);
    }

    if (this.doubleCurrencyTimer > 0) { this.doubleCurrencyTimer -= deltaTime; if (this.doubleCurrencyTimer < 0) this.doubleCurrencyTimer = 0; }

    this.research.update(deltaTime);
    const active = this.research.getActiveResearch();
    if (active && active.completed) {
      if (active.id === 'butterfly_spawn_rate') { this.researchSpawnBonus += 3; this.spawnButterflies(3); }
      else if (active.id === 'speed_research') this.skills.upgradeSkill('speed');
      else if (active.id === 'catch_research') this.skills.upgradeSkill('catch_radius');
    }
    const allR = this.research.getAllResearch();
    if (!allR.every(r => r.completed) && !this.research.getActiveResearch()) {
      const n = allR.find(r => !r.completed); if (n) this.research.startResearch(n.id);
    }
  };

  private respawn(): void {
    this.player.position = { x: 60, y: 60 }; this.player.hp = Math.floor(this.player.maxHp / 2);
    this.caughtButterflies = [];
    const lost = Math.floor(this.currencies.soft * 0.3);
    this.currencies.spendSoft(lost);
  }

  private triggerCardChoice(): void {
    this.cardSystem.showChoice(this.cardSystem.getRandomCards(3), (card) => { this.skills.upgradeSkill(card.skillId); });
  }

  private render = (_dt: number): void => {
    const ctx = this.renderer.ctx; const cw = this.renderer.canvas.width; const ch = this.renderer.canvas.height;
    const vw = window.innerWidth; const vh = window.innerHeight;
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, cw, ch);

    if (this.state === 'menu') { ctx.fillStyle = '#1a202c'; ctx.fillRect(0, 0, cw, ch); this.renderer.drawText('Butterfly Catcher', cw / 2, ch / 2, '#e2e8f0', 32); this.renderer.drawText('Select from menu', cw / 2, ch / 2 + 40, '#a0aec0', 16); return; }

    const scale = vh / ch;
    const camX = Math.max(vw - WORLD_W * scale, Math.min(0, vw / 2 - this.player.position.x * scale));
    const camY = Math.max(vh - WORLD_H * scale, Math.min(0, vh / 2 - this.player.position.y * scale));
    ctx.setTransform(scale, 0, 0, scale, camX, camY);

    ctx.fillStyle = '#2d5a27'; ctx.fillRect(0, 0, WORLD_W, WORLD_H);
    for (let gy = 0; gy < WORLD_H; gy += 80) for (let gx = 0; gx < WORLD_W; gx += 80) { if ((Math.floor(gx / 80) + Math.floor(gy / 80)) % 2 === 0) { ctx.fillStyle = '#336b2e'; ctx.fillRect(gx, gy, 80, 80); } }

    this.decorations.forEach(d => {
      if (d.type === 'tree') this.renderer.drawTree(d.position.x, d.position.y, d.size);
      else if (d.type === 'flower') this.renderer.drawFlower(d.position.x, d.position.y, d.color!, d.size);
      else if (d.type === 'rock') this.renderer.drawRock(d.position.x, d.position.y, d.size);
      else if (d.type === 'bush') this.renderer.drawBush(d.position.x, d.position.y, d.size);
    });

    this.renderer.drawRect(20, 20, 110, 110, '#8b4513'); this.renderer.drawRect(30, 30, 90, 25, '#a0522d'); this.renderer.drawText('HOUSE', 50, 48, 'white', 14); this.renderer.drawRect(30, 65, 90, 55, '#6b3410');

    this.butterflies.forEach(b => {
      if (b.hidden) return;
      const wo = 0.3 + 0.7 * (Math.sin(this.elapsedTime * FLUTTER_SPEED + b.wingOffset) * 0.5 + 0.5);
      this.renderer.drawButterfly(b.position.x, b.position.y, b.color, wo, b.size);
    });

    this.bees.forEach(b => {
      const bz = 10 + (Math.sin(this.elapsedTime * 4 + this.bees.indexOf(b)) * 0.5 + 0.5) * 3;
      this.renderer.drawCircle(b.position.x, b.position.y, b.size + bz * 0.2, '#f6ad55');
      this.renderer.drawCircle(b.position.x - 3, b.position.y - 4, 4, '#ecc94b');
      this.renderer.drawCircle(b.position.x + 3, b.position.y - 4, 4, '#ecc94b');
      if (b.chasing) this.renderer.drawCircle(b.position.x, b.position.y, 18, 'rgba(246, 173, 85, 0.15)');
    });

    this.mosquitoes.forEach(m => {
      ctx.globalAlpha = 0.6;
      this.renderer.drawCircle(m.position.x, m.position.y, m.size, '#718096');
      ctx.globalAlpha = 1;
    });

    this.renderer.drawCircle(this.player.position.x, this.player.position.y, 12, '#3182ce');
    const catchR = this.player.catchRadius + (this.getEffectiveSkill('catch_radius') - 1) * 8;
    this.renderer.drawCircle(this.player.position.x, this.player.position.y, catchR, 'rgba(49, 130, 206, 0.12)');

    this.caughtButterflies.forEach(b => this.renderer.drawButterfly(this.player.position.x, this.player.position.y - 30, b.color, 0.3, 5));

    ctx.setTransform(1, 0, 0, 1, 0, 0);

    this.renderer.drawText(`HP: ${this.player.hp}/${this.player.maxHp}`, 8, 18, this.player.hp < 30 ? '#fc8181' : '#48bb78', 14);
    this.renderer.drawText(`Soft: ${this.currencies.soft}`, 8, 36, 'white', 13);
    this.renderer.drawText(`Hard: ${this.currencies.hard}`, 8, 52, 'white', 13);
    this.renderer.drawText(`Score: ${this.score}`, 8, 68, 'white', 13);
    this.renderer.drawText(`Caught: ${this.caughtButterflies.length}`, 8, 84, 'white', 13);

    const sl = [{ id: 'speed', label: 'Spd' }, { id: 'catch_radius', label: 'Ctc' }, { id: 'butterfly_value', label: 'Val' }, { id: 'hp', label: 'HP' }];
    const rx = cw - 130;
    sl.forEach((s, i) => {
      const lv = this.skills.getSkillLevel(s.id); const debuff = (this.skillDebuffs.get(s.id) ?? 0) > 0;
      const elv = this.getEffectiveSkill(s.id);
      const bw = 90; const bh = 7; const by = 20 + i * 24;
      this.renderer.drawText(`${s.label} ${debuff ? `${elv}->${lv}` : `Lv.${lv}`}`, rx, by, debuff ? '#fc8181' : '#e2e8f0', 11);
      this.renderer.drawRect(rx, by + 4, bw, bh, '#4a5568');
      this.renderer.drawRect(rx, by + 4, bw * (lv / 10), bh, debuff ? '#e53e3e' : '#48bb78');
    });

    const a = this.research.getActiveResearch();
    if (a) { this.renderer.drawRect(rx, 126, 120, 12, '#4a5568'); this.renderer.drawRect(rx, 126, 120 * a.progress, 12, '#4299e1'); this.renderer.drawText(`${a.name} ${Math.floor(a.progress * 100)}%`, rx + 2, 135, 'white', 9); }
    else { const allR = this.research.getAllResearch(); const d = allR.filter(r => r.completed).length; this.renderer.drawText(d < allR.length ? `Research: ${d}/${allR.length}` : 'All research done!', rx, 126, d < allR.length ? '#a0aec0' : '#48bb78', 11); }

    if (this.doubleCurrencyTimer > 0) this.renderer.drawText(`2x ${Math.ceil(this.doubleCurrencyTimer)}s`, 8, 100, '#f9ca24', 12);
  };
}
