import { CurrencyData } from '../types';

export class CurrencyManager {
  private data: CurrencyData = { soft: 0, hard: 0 };

  get soft(): number { return this.data.soft; }
  get hard(): number { return this.data.hard; }

  addSoft(amount: number): void {
    this.data.soft += amount;
  }

  addHard(amount: number): void {
    this.data.hard += amount;
  }

  spendSoft(amount: number): boolean {
    if (this.data.soft >= amount) {
      this.data.soft -= amount;
      return true;
    }
    return false;
  }

  spendHard(amount: number): boolean {
    if (this.data.hard >= amount) {
      this.data.hard -= amount;
      return true;
    }
    return false;
  }

  getData(): CurrencyData {
    return { ...this.data };
  }

  setData(data: CurrencyData): void {
    this.data = { ...data };
  }
}
