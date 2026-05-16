export interface Vector2 {
  x: number;
  y: number;
}

export interface GameConfig {
  width: number;
  height: number;
  canvasId: string;
}

export interface CurrencyData {
  soft: number;
  hard: number;
}

export interface SkillData {
  id: string;
  name: string;
  level: number;
  maxLevel: number;
  description: string;
}

export interface CardData {
  id: string;
  skillId: string;
  effect: string;
  rarity: 'common' | 'rare' | 'legendary';
}

export interface ResearchData {
  id: string;
  name: string;
  duration: number; // seconds
  progress: number; // 0-1
  completed: boolean;
}

export interface ShopItem {
  id: string;
  name: string;
  description: string;
  cost: {
    type: 'soft' | 'hard';
    amount: number;
  };
  owned: boolean;
}

export interface GameState {
  currencies: CurrencyData;
  skills: SkillData[];
  research: ResearchData[];
  shopItems: ShopItem[];
  points: number;
  lastCardChoiceThreshold: number;
}
