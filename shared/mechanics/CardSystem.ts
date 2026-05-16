import { CardData, SkillData } from '../types';

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
    const container = document.createElement('div');
    container.id = 'card-choice-overlay';
    container.style.cssText = `
      position: fixed; top: 0; left: 0; width: 100%; height: 100%;
      background: rgba(0,0,0,0.8); display: flex; justify-content: center;
      align-items: center; z-index: 1000;
    `;

    const title = document.createElement('h2');
    title.textContent = 'Choose a Card';
    title.style.color = 'white';
    title.style.position = 'absolute';
    title.style.top = '20px';

    const cardsContainer = document.createElement('div');
    cardsContainer.style.cssText = `
      display: flex; gap: 20px; justify-content: center;
    `;

    cards.forEach(card => {
      const cardEl = document.createElement('div');
      cardEl.style.cssText = `
        width: 150px; height: 220px; background: ${this.getRarityColor(card.rarity)};
        border-radius: 10px; padding: 15px; cursor: pointer; display: flex;
        flex-direction: column; align-items: center; justify-content: space-between;
        transition: transform 0.2s;
      `;
      cardEl.onmouseenter = () => cardEl.style.transform = 'scale(1.05)';
      cardEl.onmouseleave = () => cardEl.style.transform = 'scale(1)';

      const name = document.createElement('h3');
      name.textContent = card.id;
      name.style.color = 'white';
      name.style.textAlign = 'center';

      const effect = document.createElement('p');
      effect.textContent = card.effect;
      effect.style.color = 'white';
      effect.style.textAlign = 'center';
      effect.style.fontSize = '12px';

      const rarity = document.createElement('span');
      rarity.textContent = card.rarity.toUpperCase();
      rarity.style.color = 'white';
      rarity.style.fontSize = '10px';

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
