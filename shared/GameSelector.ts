export interface GameInfo { id: string; name: string; description: string; emoji: string; bg: string; }

export const GAMES: GameInfo[] = [
  { id: 'butterfly', name: 'Butterfly Catcher', description: 'Catch butterflies, flee from bees, avoid mosquitoes!', emoji: '🦋', bg: '#2d5a27' },
  { id: 'zombie', name: 'Zombie Hunter', description: 'Shoot zombies, survive waves, earn rewards!', emoji: '🧟', bg: '#2d1b1b' },
  { id: 'fishing', name: 'Fishing', description: 'Cast your line, time your reel, catch rare fish!', emoji: '🎣', bg: '#1a2a4a' },
];

export function renderGameSelector(onSelect: (id: string) => void): void {
  document.body.innerHTML = '';
  const c = document.createElement('canvas');
  c.id = 'gameCanvas'; c.width = 800; c.height = 600;
  c.style.cssText = 'display:block;width:100%;height:100dvh;touch-action:none;';
  document.body.appendChild(c);

  const ov = document.createElement('div');
  ov.id = 'selector-overlay';
  ov.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.9);display:flex;flex-direction:column;align-items:center;justify-content:center;z-index:999;padding:20px;box-sizing:border-box;';
  const title = document.createElement('h1');
  title.textContent = '🎮 TS Game Prototypes';
  title.style.cssText = 'color:#e2e8f0;margin:0 0 8px 0;font-size:clamp(22px,6vw,36px);text-align:center;';
  const sub = document.createElement('p');
  sub.textContent = 'Select a game to play';
  sub.style.cssText = 'color:#a0aec0;margin:0 0 30px 0;font-size:clamp(13px,3vw,16px);text-align:center;';
  ov.appendChild(title); ov.appendChild(sub);

  const grid = document.createElement('div');
  grid.style.cssText = 'display:grid;grid-template-columns:repeat(auto-fill,minmax(min(250px,90vw),1fr));gap:16px;max-width:900px;width:100%;';
  GAMES.forEach(g => {
    const card = document.createElement('div');
    card.style.cssText = `background:${g.bg};border-radius:16px;padding:20px;cursor:pointer;text-align:center;transition:transform 0.2s;border:2px solid rgba(255,255,255,0.1);`;
    card.onmouseenter = () => card.style.transform = 'scale(1.05)';
    card.onmouseleave = () => card.style.transform = 'scale(1)';
    card.onclick = () => { ov.remove(); onSelect(g.id); };
    const emoji = document.createElement('div'); emoji.textContent = g.emoji; emoji.style.cssText = 'font-size:48px;margin-bottom:10px;';
    const name = document.createElement('h2'); name.textContent = g.name; name.style.cssText = 'color:white;margin:0 0 8px 0;font-size:18px;';
    const desc = document.createElement('p'); desc.textContent = g.description; desc.style.cssText = 'color:#a0aec0;margin:0;font-size:13px;';
    card.appendChild(emoji); card.appendChild(name); card.appendChild(desc);
    grid.appendChild(card);
  });
  ov.appendChild(grid);
  document.body.appendChild(ov);
}

export function destroyActiveGame(): void {
  const ads = ['shop-overlay', 'card-choice-overlay', 'menu-overlay', 'encyclopedia-overlay', 'ad-reward-button', 'dpad-overlay', 'shop-btn'];
  ads.forEach(id => { const el = document.getElementById(id); if (el) el.remove(); });
}
