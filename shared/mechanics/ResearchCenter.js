export class ResearchCenter {
    constructor() {
        this.researches = new Map();
        this.activeResearch = null;
    }
    addResearch(data) {
        this.researches.set(data.id, { ...data });
    }
    startResearch(id) {
        const research = this.researches.get(id);
        if (!research || research.completed || this.activeResearch)
            return false;
        this.activeResearch = id;
        return true;
    }
    update(deltaTime) {
        if (!this.activeResearch)
            return;
        const research = this.researches.get(this.activeResearch);
        if (!research)
            return;
        research.progress += deltaTime / research.duration;
        if (research.progress >= 1) {
            research.progress = 1;
            research.completed = true;
            this.activeResearch = null;
        }
    }
    getActiveResearch() {
        if (!this.activeResearch)
            return null;
        return this.researches.get(this.activeResearch) ?? null;
    }
    getAllResearch() {
        return Array.from(this.researches.values());
    }
    exportData() {
        return Array.from(this.researches.values());
    }
    importData(data) {
        data.forEach(r => this.researches.set(r.id, { ...r }));
    }
}
