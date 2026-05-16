export interface ButterflyEntry {
  type: string;
  color: string;
  count: number;
  totalValue: number;
}

export const BUTTERFLY_TYPES: { id: string; name: string; color: string }[] = [
  { id: 'red', name: 'Red Admiral', color: '#ff6b6b' },
  { id: 'teal', name: 'Teal Swallowtail', color: '#4ecdc4' },
  { id: 'blue', name: 'Blue Morpho', color: '#45b7d1' },
  { id: 'yellow', name: 'Gold Wing', color: '#f9ca24' },
  { id: 'purple', name: 'Purple Emperor', color: '#6c5ce7' },
];

export class MenuSystem {
  private onNewGame: () => void;
  private getEncyclopediaData: () => ButterflyEntry[];

  constructor(onNewGame: () => void, getEncyclopediaData: () => ButterflyEntry[]) {
    this.onNewGame = onNewGame;
    this.getEncyclopediaData = getEncyclopediaData;
  }

  showMenu(): void {
    this.clearOverlays();
    this.renderMenu();
  }

  private clearOverlays(): void {
    const ids = ['menu-overlay', 'encyclopedia-overlay'];
    ids.forEach(id => {
      const el = document.getElementById(id);
      if (el) el.remove();
    });
  }

  private renderMenu(): void {
    const prev = document.getElementById('menu-overlay');
    if (prev) prev.remove();

    const container = document.createElement('div');
    container.id = 'menu-overlay';
    container.style.cssText = `
      position: fixed; top: 0; left: 0; width: 100%; height: 100%;
      background: rgba(0,0,0,0.85); display: flex; flex-direction: column;
      justify-content: center; align-items: center; z-index: 999;
      padding: 24px; box-sizing: border-box;
    `;

    const title = document.createElement('h1');
    title.textContent = 'Butterfly Catcher';
    title.style.cssText = 'color: #e2e8f0; margin: 0 0 8px 0; font-size: clamp(24px, 7vw, 42px);';

    const subtitle = document.createElement('p');
    subtitle.textContent = 'Catch butterflies, collect rewards, grow stronger!';
    subtitle.style.cssText = 'color: #a0aec0; margin: 0 0 40px 0; font-size: clamp(12px, 3vw, 16px); text-align: center;';

    const btnStyle = `
      width: min(280px, 80vw); padding: 16px 32px; margin: 8px 0;
      border: none; border-radius: 12px; font-size: clamp(16px, 4vw, 20px);
      cursor: pointer; transition: transform 0.2s; font-weight: bold;
    `;

    const newGameBtn = document.createElement('button');
    newGameBtn.textContent = 'New Game';
    newGameBtn.style.cssText = `${btnStyle} background: #48bb78; color: white;`;
    newGameBtn.onmouseenter = () => newGameBtn.style.transform = 'scale(1.05)';
    newGameBtn.onmouseleave = () => newGameBtn.style.transform = 'scale(1)';
    newGameBtn.onclick = () => {
      this.clearOverlays();
      this.onNewGame();
    };

    const encBtn = document.createElement('button');
    encBtn.textContent = 'Encyclopedia';
    encBtn.style.cssText = `${btnStyle} background: #4299e1; color: white;`;
    encBtn.onmouseenter = () => encBtn.style.transform = 'scale(1.05)';
    encBtn.onmouseleave = () => encBtn.style.transform = 'scale(1)';
    encBtn.onclick = () => this.showEncyclopedia();

    container.appendChild(title);
    container.appendChild(subtitle);
    container.appendChild(newGameBtn);
    container.appendChild(encBtn);
    document.body.appendChild(container);
  }

  showEncyclopedia(): void {
    const data = this.getEncyclopediaData();
    const prev = document.getElementById('encyclopedia-overlay');
    if (prev) prev.remove();

    const container = document.createElement('div');
    container.id = 'encyclopedia-overlay';
    container.style.cssText = `
      position: fixed; top: 0; left: 0; width: 100%; height: 100%;
      background: rgba(0,0,0,0.9); display: flex; flex-direction: column;
      padding: 24px; box-sizing: border-box; z-index: 999;
      overflow-y: auto;
    `;

    const header = document.createElement('div');
    header.style.cssText = 'display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; flex-shrink: 0;';

    const title = document.createElement('h1');
    title.textContent = 'Encyclopedia';
    title.style.cssText = 'color: #e2e8f0; margin: 0; font-size: clamp(22px, 6vw, 36px);';

    const backBtn = document.createElement('button');
    backBtn.textContent = '← Back';
    backBtn.style.cssText = `
      background: #4a5568; color: white; border: none;
      border-radius: 8px; padding: 10px 20px; font-size: clamp(14px, 3vw, 16px);
      cursor: pointer;
    `;
    backBtn.onclick = () => {
      container.remove();
      this.showMenu();
    };

    header.appendChild(title);
    header.appendChild(backBtn);
    container.appendChild(header);

    const grid = document.createElement('div');
    grid.style.cssText = `
      display: grid; grid-template-columns: repeat(auto-fill, minmax(min(200px, 90vw), 1fr));
      gap: 16px; max-width: 800px; width: 100%; margin: 0 auto;
    `;

    if (data.length === 0) {
      const empty = document.createElement('p');
      empty.textContent = 'No butterflies caught yet. Start a game and catch some!';
      empty.style.cssText = 'color: #a0aec0; text-align: center; font-size: 16px; grid-column: 1 / -1;';
      grid.appendChild(empty);
    } else {
      data.forEach(entry => {
        const typeInfo = BUTTERFLY_TYPES.find(t => t.id === entry.type);
        const card = document.createElement('div');
        card.style.cssText = `
          background: #2d3748; border-radius: 12px; padding: 16px;
          display: flex; flex-direction: column; align-items: center; gap: 8px;
        `;

        const colorDot = document.createElement('div');
        colorDot.style.cssText = `
          width: 40px; height: 40px; border-radius: 50%;
          background: ${typeInfo?.color ?? '#fff'};
          border: 2px solid #4a5568;
        `;

        const name = document.createElement('h3');
        name.textContent = typeInfo?.name ?? entry.type;
        name.style.cssText = 'color: white; margin: 0; font-size: 16px; text-align: center;';

        const stats = document.createElement('p');
        stats.textContent = `Caught: ${entry.count} | Value: ${entry.totalValue}`;
        stats.style.cssText = 'color: #a0aec0; margin: 0; font-size: 13px;';

        card.appendChild(colorDot);
        card.appendChild(name);
        card.appendChild(stats);
        grid.appendChild(card);
      });
    }

    container.appendChild(grid);
    document.body.appendChild(container);
  }
}
