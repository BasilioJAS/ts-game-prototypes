import { ShopItem } from '../types';
import { CurrencyManager } from './CurrencyManager';

export class ShopSystem {
  private items: Map<string, ShopItem> = new Map();
  private currencyManager: CurrencyManager;

  constructor(currencyManager: CurrencyManager) {
    this.currencyManager = currencyManager;
  }

  addItem(item: ShopItem): void {
    this.items.set(item.id, { ...item });
  }

  getItems(): ShopItem[] {
    return Array.from(this.items.values());
  }

  purchaseItem(id: string): boolean {
    const item = this.items.get(id);
    if (!item || item.owned) return false;

    if (item.cost.type === 'soft') {
      if (!this.currencyManager.spendSoft(item.cost.amount)) return false;
    } else {
      if (!this.currencyManager.spendHard(item.cost.amount)) return false;
    }

    item.owned = true;
    return true;
  }

  isOwned(id: string): boolean {
    return this.items.get(id)?.owned ?? false;
  }

  exportData(): ShopItem[] {
    return Array.from(this.items.values());
  }

  importData(data: ShopItem[]): void {
    data.forEach(item => this.items.set(item.id, { ...item }));
  }
}
