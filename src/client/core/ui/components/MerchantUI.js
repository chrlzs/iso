export class MerchantUI {
    constructor(config) {
        console.log('MerchantUI constructor called');
        this.game = config.game;
        this.merchant = null;
        this.isVisible = false;
        
        this.createElements();
        this.setupEventListeners();
    }

    createElements() {
        console.log('Creating merchant UI elements');
        this.container = document.createElement('div');
        this.container.className = 'merchant-ui';
        
        // Force initial positioning
        this.container.style.cssText = `
            position: fixed;
            top: 50vh;
            left: 50vw;
            transform: translate(-50%, -50%);
            display: none;
            z-index: 100000;
        `;

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

        // Append to document.body
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
        console.log('MerchantUI.show called with merchant:', merchant);
        this.merchant = merchant;
        this.isVisible = true;
        
        // Force positioning and visibility
        this.container.style.cssText = `
            position: fixed !important;
            top: 50vh !important;
            left: 50vw !important;
            transform: translate(-50%, -50%) !important;
            display: flex !important;
            visibility: visible !important;
            opacity: 1 !important;
            z-index: 100000 !important;
            background: #1a1a1a !important;
            border: 4px solid gold !important;
            width: 800px !important;
            height: 600px !important;
        `;
        
        // Add debug outline
        this.container.style.outline = '10px solid red';
        
        this.refresh();
        
        // Hide the message system
        this.game.messageSystem.hide();
        
        // Log positions after a short delay to ensure rendering
        setTimeout(() => {
            const bounds = this.container.getBoundingClientRect();
            console.log('Updated container bounds:', bounds);
            console.log('Viewport size:', {
                width: window.innerWidth,
                height: window.innerHeight
            });
            
            // Add viewport center indicator
            const centerIndicator = document.createElement('div');
            centerIndicator.style.cssText = `
                position: fixed;
                top: 50vh;
                left: 50vw;
                width: 20px;
                height: 20px;
                background: red;
                border-radius: 50%;
                transform: translate(-50%, -50%);
                z-index: 100002;
            `;
            document.body.appendChild(centerIndicator);
        }, 100);
    }

    hide() {
        this.isVisible = false;
        this.container.style.display = 'none';
        this.merchant = null;
    }

    refresh() {
        console.log('MerchantUI.refresh called');
        if (!this.merchant) {
            console.warn('No merchant set for UI refresh');
            return;
        }

        // Add debug border
        this.container.style.border = '4px solid red';
        
        // Basic content with high contrast
        this.merchantInventory.innerHTML = `
            <h3 style="color: yellow; font-size: 24px;">Merchant's Goods</h3>
            <div class="merchant-slots" style="background: #333; padding: 20px;">
                ${this.renderMerchantSlots()}
            </div>
        `;

        this.playerInventory.innerHTML = `
            <h3 style="color: yellow; font-size: 24px;">Your Items</h3>
            <div class="player-slots" style="background: #333; padding: 20px;">
                ${this.renderPlayerSlots()}
            </div>
        `;

        this.goldDisplay.innerHTML = `
            <div style="color: yellow; font-size: 20px">Merchant's Gold: ${this.merchant.inventory.gold}</div>
            <div style="color: yellow; font-size: 20px">Your Gold: ${this.game.player.inventory.gold}</div>
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




