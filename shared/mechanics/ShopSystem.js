export class ShopSystem {
    constructor(currencyManager) {
        this.items = new Map();
        this.currencyManager = currencyManager;
    }
    addItem(item) {
        this.items.set(item.id, { ...item });
    }
    getItems() {
        return Array.from(this.items.values());
    }
    purchaseItem(id) {
        const item = this.items.get(id);
        if (!item || item.owned)
            return false;
        if (item.cost.type === 'soft') {
            if (!this.currencyManager.spendSoft(item.cost.amount))
                return false;
        }
        else {
            if (!this.currencyManager.spendHard(item.cost.amount))
                return false;
        }
        item.owned = true;
        return true;
    }
    isOwned(id) {
        return this.items.get(id)?.owned ?? false;
    }
    exportData() {
        return Array.from(this.items.values());
    }
    importData(data) {
        data.forEach(item => this.items.set(item.id, { ...item }));
    }
}
