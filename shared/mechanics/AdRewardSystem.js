export class AdRewardSystem {
    constructor(currencyManager) {
        this.rewardAmount = 5;
        this.cooldown = 60;
        this.lastReward = 0;
        this.button = null;
        this.intervalId = null;
        this.currencyManager = currencyManager;
    }
    canWatchAd() {
        const now = Date.now() / 1000;
        return now - this.lastReward >= this.cooldown;
    }
    watchAd() {
        if (!this.canWatchAd())
            return false;
        this.lastReward = Date.now() / 1000;
        this.currencyManager.addHard(this.rewardAmount);
        return true;
    }
    getCooldownRemaining() {
        const now = Date.now() / 1000;
        const elapsed = now - this.lastReward;
        return Math.max(0, this.cooldown - elapsed);
    }
    createButton() {
        if (this.button)
            return;
        const container = document.createElement('div');
        container.id = 'ad-reward-button';
        container.style.cssText = `
      position: fixed; bottom: 20px; right: 20px; padding: 10px 20px;
      background: #38a169; color: white; border-radius: 5px; cursor: pointer;
      z-index: 100; font-size: clamp(11px, 2.5vw, 14px);
    `;
        container.textContent = this.canWatchAd() ? 'Watch Ad (+5 Hard Currency)' : 'Ad on Cooldown';
        container.onclick = () => {
            if (this.watchAd()) {
                container.textContent = 'Ad Watched! +5 Hard Currency';
                setTimeout(() => this.updateDisplay(), 1000);
            }
        };
        document.body.appendChild(container);
        this.button = container;
        this.intervalId = window.setInterval(() => this.updateDisplay(), 1000);
    }
    show() {
        if (!this.button)
            this.createButton();
        if (this.button)
            this.button.style.display = '';
    }
    hide() {
        if (this.button)
            this.button.style.display = 'none';
    }
    updateDisplay() {
        if (!this.button)
            return;
        if (this.button.style.display === 'none')
            return;
        if (this.canWatchAd()) {
            this.button.textContent = 'Watch Ad (+5 Hard Currency)';
            this.button.style.background = '#38a169';
        }
        else {
            const remaining = Math.ceil(this.getCooldownRemaining());
            this.button.textContent = `Ad on Cooldown (${remaining}s)`;
            this.button.style.background = '#718096';
        }
    }
}
