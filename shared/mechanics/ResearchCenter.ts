import { ResearchData } from '../types';

export class ResearchCenter {
  private researches: Map<string, ResearchData> = new Map();
  private activeResearch: string | null = null;

  addResearch(data: ResearchData): void {
    this.researches.set(data.id, { ...data });
  }

  startResearch(id: string): boolean {
    const research = this.researches.get(id);
    if (!research || research.completed || this.activeResearch) return false;
    this.activeResearch = id;
    return true;
  }

  update(deltaTime: number): void {
    if (!this.activeResearch) return;

    const research = this.researches.get(this.activeResearch);
    if (!research) return;

    research.progress += deltaTime / research.duration;
    if (research.progress >= 1) {
      research.progress = 1;
      research.completed = true;
      this.activeResearch = null;
    }
  }

  getActiveResearch(): ResearchData | null {
    if (!this.activeResearch) return null;
    return this.researches.get(this.activeResearch) ?? null;
  }

  getAllResearch(): ResearchData[] {
    return Array.from(this.researches.values());
  }

  exportData(): ResearchData[] {
    return Array.from(this.researches.values());
  }

  importData(data: ResearchData[]): void {
    data.forEach(r => this.researches.set(r.id, { ...r }));
  }
}
