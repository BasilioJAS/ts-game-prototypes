export class CurrencyManager {
    constructor() {
        this.data = { soft: 0, hard: 0 };
    }
    get soft() { return this.data.soft; }
    get hard() { return this.data.hard; }
    addSoft(amount) {
        this.data.soft += amount;
    }
    addHard(amount) {
        this.data.hard += amount;
    }
    spendSoft(amount) {
        if (this.data.soft >= amount) {
            this.data.soft -= amount;
            return true;
        }
        return false;
    }
    spendHard(amount) {
        if (this.data.hard >= amount) {
            this.data.hard -= amount;
            return true;
        }
        return false;
    }
    getData() {
        return { ...this.data };
    }
    setData(data) {
        this.data = { ...data };
    }
}
