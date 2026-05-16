export class SkillManager {
    constructor() {
        this.skills = new Map();
    }
    addSkill(skill) {
        this.skills.set(skill.id, { ...skill });
    }
    getSkill(id) {
        return this.skills.get(id);
    }
    getAllSkills() {
        return Array.from(this.skills.values());
    }
    upgradeSkill(id) {
        const skill = this.skills.get(id);
        if (!skill || skill.level >= skill.maxLevel)
            return false;
        skill.level++;
        return true;
    }
    getSkillLevel(id) {
        return this.skills.get(id)?.level ?? 0;
    }
    exportData() {
        return Array.from(this.skills.values());
    }
    importData(data) {
        data.forEach(skill => this.skills.set(skill.id, { ...skill }));
    }
}
