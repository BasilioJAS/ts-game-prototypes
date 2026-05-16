import { CardData, SkillData } from '../types/index.js';

const CARD_WIDTH = 140;
const CARD_HEIGHT = 200;
const GAP = 12;

export class CardSystem {
  private cards: CardData[] = [];
  private onChoiceCallback: ((card: CardData) => void) | null = null;

  setCards(cards: CardData[]): void {
    this.cards = cards;
  }

  getRandomCards(count: number = 3): CardData[] {
    const shuffled = [...this.cards].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count);
  }

  showChoice(cards: CardData[], callback: (card: CardData) => void): void {
    this.onChoiceCallback = callback;
    this.renderChoiceUI(cards);
  }

  private renderChoiceUI(cards: CardData[]): void {
    const prev = document.getElementById('card-choice-overlay');
    if (prev) prev.remove();

    const container = document.createElement('div');
    container.id = 'card-choice-overlay';
    container.style.cssText = `
      position: fixed; top: 0; left: 0; width: 100%; height: 100%;
      background: rgba(0,0,0,0.85); display: flex; flex-direction: column;
      justify-content: center; align-items: center; z-index: 1000;
      padding: 16px; box-sizing: border-box;
    `;

    const title = document.createElement('h2');
    title.textContent = 'Choose a Card';
    title.style.cssText = 'color: white; margin: 0 0 20px 0; font-size: clamp(18px, 5vw, 28px);';

    const cardsContainer = document.createElement('div');
    cardsContainer.style.cssText = `
      display: flex; flex-wrap: wrap; gap: ${GAP}px;
      justify-content: center; align-items: center;
      max-width: 100%;
    `;

    cards.forEach(card => {
      const cardEl = document.createElement('div');
      const isSmall = window.innerWidth < 500;
      const w = isSmall ? Math.min(CARD_WIDTH, (window.innerWidth - 48) / cards.length - GAP) : CARD_WIDTH;
      const h = isSmall ? CARD_HEIGHT * 0.75 : CARD_HEIGHT;

      cardEl.style.cssText = `
        width: ${w}px; height: ${h}px;
        background: ${this.getRarityColor(card.rarity)};
        border-radius: 10px; padding: ${isSmall ? '10px' : '15px'};
        cursor: pointer; display: flex;
        flex-direction: column; align-items: center;
        justify-content: space-between;
        transition: transform 0.2s;
        box-sizing: border-box;
      `;
      cardEl.onmouseenter = () => cardEl.style.transform = 'scale(1.05)';
      cardEl.onmouseleave = () => cardEl.style.transform = 'scale(1)';

      const name = document.createElement('h3');
      name.textContent = card.id.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
      name.style.cssText = 'color: white; text-align: center; margin: 0; font-size: clamp(11px, 3vw, 14px); word-break: break-word;';

      const effect = document.createElement('p');
      effect.textContent = card.effect;
      effect.style.cssText = 'color: white; text-align: center; font-size: clamp(10px, 2.5vw, 13px); margin: 0;';

      const rarity = document.createElement('span');
      rarity.textContent = card.rarity.toUpperCase();
      rarity.style.cssText = 'color: white; font-size: clamp(9px, 2vw, 12px);';

      cardEl.appendChild(name);
      cardEl.appendChild(effect);
      cardEl.appendChild(rarity);

      cardEl.onclick = () => {
        if (this.onChoiceCallback) {
          this.onChoiceCallback(card);
        }
        document.body.removeChild(container);
      };

      cardsContainer.appendChild(cardEl);
    });

    container.appendChild(title);
    container.appendChild(cardsContainer);
    document.body.appendChild(container);
  }

  private getRarityColor(rarity: string): string {
    switch (rarity) {
      case 'common': return '#4a5568';
      case 'rare': return '#3182ce';
      case 'legendary': return '#d69e2e';
      default: return '#4a5568';
    }
  }
}
