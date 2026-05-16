import { SkillData } from '../types/index.js';

export class SkillManager {
  private skills: Map<string, SkillData> = new Map();

  addSkill(skill: SkillData): void {
    this.skills.set(skill.id, { ...skill });
  }

  getSkill(id: string): SkillData | undefined {
    return this.skills.get(id);
  }

  getAllSkills(): SkillData[] {
    return Array.from(this.skills.values());
  }

  upgradeSkill(id: string): boolean {
    const skill = this.skills.get(id);
    if (!skill || skill.level >= skill.maxLevel) return false;
    skill.level++;
    return true;
  }

  getSkillLevel(id: string): number {
    return this.skills.get(id)?.level ?? 0;
  }

  exportData(): SkillData[] {
    return Array.from(this.skills.values());
  }

  importData(data: SkillData[]): void {
    data.forEach(skill => this.skills.set(skill.id, { ...skill }));
  }
}
