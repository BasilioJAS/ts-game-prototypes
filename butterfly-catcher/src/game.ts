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

interface Butterfly {
  id: string;
  position: Vector2;
  velocity: Vector2;
  color: string;
  value: number;
  caught: boolean;
}

interface Player {
  position: Vector2;
  speed: number;
  catchRadius: number;
}

interface House {
  position: Vector2;
  width: number;
  height: number;
}

export class ButterflyCatcherGame {
  private renderer: CanvasRenderer;
  private input: InputHandler;
  private gameLoop: GameLoop;
  private currencies: CurrencyManager;
  private cardSystem: CardSystem;
  private skills: SkillManager;
  private research: ResearchCenter;
  private shop: ShopSystem;
  private adReward: AdRewardSystem;

  private player: Player = {
    position: { x: 400, y: 300 },
    speed: 200,
    catchRadius: 50,
  };

  private house: House = {
    position: { x: 50, y: 50 },
    width: 80,
    height: 80,
  };

  private butterflies: Butterfly[] = [];
  private caughtButterflies: Butterfly[] = [];
  private score: number = 0;
  private cardChoiceThreshold: number = 100;
  private lastCardChoiceAt: number = 0;
  private dpad: VirtualDPad = new VirtualDPad();

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

    this.dpad.setCanvasSize(this.renderer.canvas.width, this.renderer.canvas.height);
    this.setupInitialData();
  }

  private setupInitialData(): void {
    // Setup skills
    this.skills.addSkill({
      id: 'speed',
      name: 'Speed',
      level: 1,
      maxLevel: 10,
      description: 'Increase movement speed',
    });

    this.skills.addSkill({
      id: 'catch_radius',
      name: 'Catch Radius',
      level: 1,
      maxLevel: 10,
      description: 'Increase catch range',
    });

    this.skills.addSkill({
      id: 'butterfly_value',
      name: 'Butterfly Value',
      level: 1,
      maxLevel: 10,
      description: 'Increase soft currency per butterfly',
    });

    // Setup cards
    this.cardSystem.setCards([
      { id: 'speed_boost', skillId: 'speed', effect: '+1 Speed Level', rarity: 'common' },
      { id: 'catch_boost', skillId: 'catch_radius', effect: '+1 Catch Radius Level', rarity: 'common' },
      { id: 'value_boost', skillId: 'butterfly_value', effect: '+1 Butterfly Value Level', rarity: 'common' },
      { id: 'speed_rare', skillId: 'speed', effect: '+2 Speed Levels', rarity: 'rare' },
      { id: 'catch_rare', skillId: 'catch_radius', effect: '+2 Catch Radius Levels', rarity: 'rare' },
      { id: 'value_legendary', skillId: 'butterfly_value', effect: '+3 Butterfly Value Levels', rarity: 'legendary' },
    ]);

    // Setup research
    this.research.addResearch({
      id: 'butterfly_spawn_rate',
      name: 'Butterfly Spawn Rate',
      duration: 30,
      progress: 0,
      completed: false,
    });

    // Setup shop
    this.shop.addItem({
      id: 'double_currency',
      name: 'Double Currency',
      description: '2x soft currency for 5 minutes',
      cost: { type: 'hard', amount: 10 },
      owned: false,
    });

    this.shop.addItem({
      id: 'speed_boost_item',
      name: 'Speed Boost',
      description: 'Instant +1 speed level',
      cost: { type: 'soft', amount: 50 },
      owned: false,
    });
  }

  start(): void {
    this.gameLoop.start();
    this.adReward.showAdButton();
    this.spawnButterflies(5);
  }

  private spawnButterflies(count: number): void {
    for (let i = 0; i < count; i++) {
      const butterfly: Butterfly = {
        id: `butterfly_${Date.now()}_${i}`,
        position: {
          x: Math.random() * (this.renderer.canvas.width - 40) + 20,
          y: Math.random() * (this.renderer.canvas.height - 40) + 20,
        },
        velocity: {
          x: (Math.random() - 0.5) * 100,
          y: (Math.random() - 0.5) * 100,
        },
        color: ['#ff6b6b', '#4ecdc4', '#45b7d1', '#f9ca24', '#6c5ce7'][Math.floor(Math.random() * 5)],
        value: Math.floor(Math.random() * 10) + 5,
        caught: false,
      };
      this.butterflies.push(butterfly);
    }
  }

  private update = (deltaTime: number): void => {
    // D-pad touch input
    this.dpad.updateFromTouches(this.input.activeTouches, this.renderer.canvas);

    // Player movement (keyboard + gamepad + d-pad)
    const kbDir = this.input.getMovementDirection();
    const dpadDir = this.dpad.direction;
    const dx = kbDir.x + dpadDir.x;
    const dy = kbDir.y + dpadDir.y;
    const len = Math.sqrt(dx * dx + dy * dy);
    if (len > 0.01) {
      this.player.position.x += (dx / len) * this.player.speed * deltaTime;
      this.player.position.y += (dy / len) * this.player.speed * deltaTime;
    }

    // Clamp to canvas bounds
    this.player.position.x = Math.max(10, Math.min(this.renderer.canvas.width - 10, this.player.position.x));
    this.player.position.y = Math.max(10, Math.min(this.renderer.canvas.height - 10, this.player.position.y));

    // Update butterflies
    this.butterflies.forEach(b => {
      b.position.x += b.velocity.x * deltaTime;
      b.position.y += b.velocity.y * deltaTime;

      // Change direction randomly
      if (Math.random() < 0.02) {
        b.velocity.x = (Math.random() - 0.5) * 100;
        b.velocity.y = (Math.random() - 0.5) * 100;
      }

      // Bounce off walls
      if (b.position.x < 10 || b.position.x > this.renderer.canvas.width - 10) b.velocity.x *= -1;
      if (b.position.y < 10 || b.position.y > this.renderer.canvas.height - 10) b.velocity.y *= -1;

      b.position.x = Math.max(10, Math.min(this.renderer.canvas.width - 10, b.position.x));
      b.position.y = Math.max(10, Math.min(this.renderer.canvas.height - 10, b.position.y));
    });

    // Check butterfly catches
    this.butterflies.forEach(b => {
      if (b.caught) return;
      const dist = Math.sqrt(
        Math.pow(b.position.x - this.player.position.x, 2) +
        Math.pow(b.position.y - this.player.position.y, 2)
      );
      if (dist < this.player.catchRadius) {
        b.caught = true;
        this.caughtButterflies.push(b);
      }
    });

    // Remove caught butterflies from active list
    this.butterflies = this.butterflies.filter(b => !b.caught);

    // Check if player is at house to deposit butterflies
    const atHouse =
      this.player.position.x > this.house.position.x &&
      this.player.position.x < this.house.position.x + this.house.width &&
      this.player.position.y > this.house.position.y &&
      this.player.position.y < this.house.position.y + this.house.height;

    if (atHouse && this.caughtButterflies.length > 0) {
      const valueMultiplier = 1 + (this.skills.getSkillLevel('butterfly_value') - 1) * 0.2;
      const totalValue = this.caughtButterflies.reduce((sum, b) => sum + b.value, 0) * valueMultiplier;
      this.currencies.addSoft(Math.floor(totalValue));
      this.score += Math.floor(totalValue);
      this.caughtButterflies = [];

      // Check for card choice
      if (this.score - this.lastCardChoiceAt >= this.cardChoiceThreshold) {
        this.lastCardChoiceAt = this.score;
        this.triggerCardChoice();
      }

      // Spawn more butterflies
      this.spawnButterflies(3);
    }

    // Update research
    this.research.update(deltaTime);
  };

  private triggerCardChoice(): void {
    const cards = this.cardSystem.getRandomCards(3);
    this.cardSystem.showChoice(cards, (card) => {
      this.skills.upgradeSkill(card.skillId);
    });
  }

  private render = (_deltaTime: number): void => {
    this.renderer.clear();

    // Draw background
    this.renderer.drawRect(0, 0, this.renderer.canvas.width, this.renderer.canvas.height, '#2d3748');

    // Draw house
    this.renderer.drawRect(
      this.house.position.x,
      this.house.position.y,
      this.house.width,
      this.house.height,
      '#8b4513'
    );
    this.renderer.drawText('HOUSE', this.house.position.x + 10, this.house.position.y + 45, 'white', 12);

    // Draw player
    this.renderer.drawCircle(this.player.position.x, this.player.position.y, 10, '#3182ce');
    this.renderer.drawCircle(
      this.player.position.x,
      this.player.position.y,
      this.player.catchRadius,
      'rgba(49, 130, 206, 0.2)'
    );

    // Draw butterflies
    this.butterflies.forEach(b => {
      this.renderer.drawCircle(b.position.x, b.position.y, 8, b.color);
    });

    // Draw UI
    this.renderer.drawText(`Soft: ${this.currencies.soft}`, 10, 30, 'white', 16);
    this.renderer.drawText(`Hard: ${this.currencies.hard}`, 10, 50, 'white', 16);
    this.renderer.drawText(`Score: ${this.score}`, 10, 70, 'white', 16);
    this.renderer.drawText(`Caught: ${this.caughtButterflies.length}`, 10, 90, 'white', 16);

    // Draw d-pad
    this.dpad.render(this.renderer.ctx);

    // Draw instructions
    this.renderer.drawText('Keyboard/Gamepad: WASD/Arrows | Touch: use D-Pad', 180, 30, '#a0aec0', 12);
  };
}
