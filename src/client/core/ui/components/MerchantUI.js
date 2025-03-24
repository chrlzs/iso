export class MerchantUI {
    constructor(config) {
        this.game = config.game;
        this.merchant = null;
        this.isVisible = false;
        
        this.createElements();
        this.setupEventListeners();
    }

    createElements() {
        this.container = document.createElement('div');
        this.container.className = 'merchant-ui';
        this.container.style.display = 'none';

        // Merchant inventory
        this.merchantInventory = document.createElement('div');
        this.merchantInventory.className = 'merchant-inventory';

        // Player inventory
        this.playerInventory = document.createElement('div');
        this.playerInventory.className = 'player-inventory';

        // Gold display
        this.goldDisplay = document.createElement('div');
        this.goldDisplay.className = 'merchant-gold-display';

        this.container.appendChild(this.merchantInventory);
        this.container.appendChild(this.playerInventory);
        this.container.appendChild(this.goldDisplay);

        document.body.appendChild(this.container);
    }

    setupEventListeners() {
        this.container.addEventListener('click', (e) => {
            const slot = e.target.closest('.merchant-slot, .player-slot');
            if (!slot) return;

            const slotIndex = parseInt(slot.dataset.slot);
            const isMerchantSlot = slot.classList.contains('merchant-slot');

            if (isMerchantSlot) {
                this.handleMerchantSlotClick(slotIndex);
            } else {
                this.handlePlayerSlotClick(slotIndex);
            }
        });

        // Close on ESC
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isVisible) {
                this.hide();
            }
        });
    }

    handleMerchantSlotClick(slotIndex) {
        const item = this.merchant.inventory.getSlot(slotIndex);
        if (!item) return;

        const price = this.merchant.getSellPrice(item);
        if (this.game.player.inventory.gold >= price) {
            this.merchant.sellToPlayer(slotIndex, 1, this.game.player);
            this.refresh();
        }
    }

    handlePlayerSlotClick(slotIndex) {
        const item = this.game.player.inventory.getSlot(slotIndex);
        if (!item) return;

        const price = this.merchant.getBuyPrice(item);
        if (this.merchant.inventory.gold >= price) {
            this.merchant.buyFromPlayer(slotIndex, 1, this.game.player);
            this.refresh();
        }
    }

    show(merchant) {
        this.merchant = merchant;
        this.isVisible = true;
        this.container.style.display = 'flex';
        this.refresh();
    }

    hide() {
        this.isVisible = false;
        this.container.style.display = 'none';
        this.merchant = null;
    }

    refresh() {
        if (!this.merchant) return;

        // Update merchant inventory
        this.merchantInventory.innerHTML = `
            <h3>Merchant's Goods</h3>
            <div class="merchant-slots">
                ${this.renderMerchantSlots()}
            </div>
        `;

        // Update player inventory
        this.playerInventory.innerHTML = `
            <h3>Your Items</h3>
            <div class="player-slots">
                ${this.renderPlayerSlots()}
            </div>
        `;

        // Update gold display
        this.goldDisplay.innerHTML = `
            <div>Merchant's Gold: ${this.merchant.inventory.gold}</div>
            <div>Your Gold: ${this.game.player.inventory.gold}</div>
        `;
    }

    renderMerchantSlots() {
        let html = '';
        for (let i = 0; i < this.merchant.inventory.maxSlots; i++) {
            const item = this.merchant.inventory.getSlot(i);
            if (item) {
                const price = this.merchant.getSellPrice(item);
                html += `
                    <div class="merchant-slot" data-slot="${i}">
                        <img src="${item.icon}" alt="${item.name}">
                        <div class="item-price">${price} gold</div>
                        ${item.isStackable ? `<span class="item-quantity">${item.quantity}</span>` : ''}
                    </div>
                `;
            } else {
                html += `<div class="merchant-slot empty" data-slot="${i}"></div>`;
            }
        }
        return html;
    }

    renderPlayerSlots() {
        let html = '';
        for (let i = 0; i < this.game.player.inventory.maxSlots; i++) {
            const item = this.game.player.inventory.getSlot(i);
            if (item) {
                const price = this.merchant.getBuyPrice(item);
                html += `
                    <div class="player-slot" data-slot="${i}">
                        <img src="${item.icon}" alt="${item.name}">
                        <div class="item-price">${price} gold</div>
                        ${item.isStackable ? `<span class="item-quantity">${item.quantity}</span>` : ''}
                    </div>
                `;
            } else {
                html += `<div class="player-slot empty" data-slot="${i}"></div>`;
            }
        }
        return html;
    }
}