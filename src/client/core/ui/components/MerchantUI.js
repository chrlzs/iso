export class MerchantUI {
    constructor(config) {
        this.game = config.game;
        this.merchant = null;
        this.isVisible = false;
        
        this.createElements();
        this.setupEventListeners();
    }

    createElements() {
        // Main container
        this.container = document.createElement('div');
        this.container.className = 'merchant-ui';
        this.container.style.cssText = `
            position: fixed;
            top: 50vh;
            left: 50vw;
            transform: translate(-50%, -50%);
            display: none;
            z-index: 100000;
            background: #1a1a1a;
            border: 4px solid #00f2ff;
            width: 800px;
            height: 600px;
            padding: 20px;
        `;

        // Create merchant inventory section
        this.merchantInventory = document.createElement('div');
        this.merchantInventory.className = 'merchant-inventory';
        this.container.appendChild(this.merchantInventory);

        // Create player inventory section
        this.playerInventory = document.createElement('div');
        this.playerInventory.className = 'player-inventory';
        this.container.appendChild(this.playerInventory);

        // Create gold display section
        this.goldDisplay = document.createElement('div');
        this.goldDisplay.className = 'gold-display';
        this.goldDisplay.style.cssText = `
            margin-top: 20px;
            padding: 10px;
            background: #333;
        `;
        this.container.appendChild(this.goldDisplay);

        // Add close button
        const closeButton = document.createElement('button');
        closeButton.textContent = 'Close';
        closeButton.style.cssText = `
            position: absolute;
            top: 10px;
            right: 10px;
            padding: 5px 10px;
            background: #ff4444;
            color: white;
            border: none;
            cursor: pointer;
        `;
        closeButton.onclick = () => this.hide();
        this.container.appendChild(closeButton);

        // Add to document body
        document.body.appendChild(this.container);

        // Add CSS styles for slots
        const style = document.createElement('style');
        style.textContent = `
            .merchant-slot, .player-slot {
                width: 64px;
                height: 64px;
                border: 2px solid #666;
                margin: 4px;
                display: inline-block;
                position: relative;
                background: #2a2a2a;
                cursor: pointer;
            }
            .merchant-slot img, .player-slot img {
                width: 100%;
                height: 100%;
                object-fit: contain;
            }
            .merchant-slot.empty, .player-slot.empty {
                background: #222;
            }
            .item-price {
                position: absolute;
                bottom: 0;
                left: 0;
                right: 0;
                background: rgba(0,0,0,0.7);
                color: #00f2ff;
                font-size: 12px;
                padding: 2px;
                text-align: center;
            }
            .item-quantity {
                position: absolute;
                top: 2px;
                right: 2px;
                background: rgba(0,0,0,0.7);
                color: white;
                padding: 2px 4px;
                border-radius: 3px;
                font-size: 12px;
            }
            .merchant-slots, .player-slots {
                display: grid;
                grid-template-columns: repeat(4, 1fr);
                gap: 4px;
                padding: 10px;
            }
        `;
        document.head.appendChild(style);
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
        const playerEth = Number(this.game.player.inventory.eth || 0);
        
        console.log('Attempting to buy:', {
            price: price,
            playerEth: playerEth,
            item: item.name
        });
        
        if (playerEth >= price) {
            if (this.merchant.sellToPlayer(slotIndex, 1, this.game.player)) {
                console.log('Purchase successful');
                this.refresh();
            }
        } else {
            console.log('Insufficient ETH:', {
                required: price,
                available: playerEth
            });
        }
    }

    handlePlayerSlotClick(slotIndex) {
        const item = this.game.player.inventory.getSlot(slotIndex);
        if (!item) return;

        const price = this.merchant.getBuyPrice(item);
        const merchantEth = Number(this.merchant.inventory.eth || 0);
        
        console.log('Sale attempt details:', {
            itemName: item.name,
            itemValue: item.value,
            calculatedPrice: price,
            merchantCurrentEth: merchantEth,
            priceType: typeof price
        });
        
        if (merchantEth >= price) {
            if (this.merchant.buyFromPlayer(slotIndex, 1, this.game.player)) {
                console.log('Sale successful');
                this.refresh();
            }
        } else {
            console.log('Merchant has insufficient ETH:', {
                required: price,
                available: merchantEth
            });
        }
    }

    show(merchant) {
        if (!merchant || !merchant.inventory) {
            console.error('Invalid merchant or merchant inventory:', {
                hasMerchant: !!merchant,
                hasInventory: !!merchant?.inventory
            });
            return;
        }

        // Verify player inventory exists
        if (!this.game?.player?.inventory) {
            console.error('Player inventory not initialized');
            return;
        }
        
        this.merchant = merchant;
        this.isVisible = true;
        
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
            border: 4px solid #00f2ff !important;
            width: 800px !important;
            height: 600px !important;
        `;
        
        this.refresh();
        this.game.messageSystem.hide();
        this.game.uiManager.activeWindows.add('merchantUI');
    }

    hide() {
        this.isVisible = false;
        this.container.style.display = 'none';
        this.game.uiManager.activeWindows.delete('merchantUI');
    }

    refresh() {
        console.log('MerchantUI.refresh called');
        console.log('Current merchant ETH:', this.merchant?.inventory?.eth);
        console.log('Current player ETH:', this.game.player?.inventory?.eth);
        
        if (!this.merchant) {
            console.warn('No merchant set for UI refresh');
            return;
        }

        // Update the displays
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

        this.updateGoldDisplay();
    }

    updateGoldDisplay() {
        // Add debug logging
        console.log('Merchant inventory:', this.merchant.inventory);
        console.log('Player inventory:', this.game.player.inventory);

        // Check for undefined and provide fallback
        const merchantEth = this.merchant?.inventory?.eth ?? 0;
        const playerEth = this.game.player?.inventory?.eth ?? 0;

        this.goldDisplay.innerHTML = `
            <div style="color: #00f2ff; font-size: 20px">Merchant's ETH: ${merchantEth}</div>
            <div style="color: #00f2ff; font-size: 20px">Your ETH: ${playerEth}</div>
        `;
    }

    renderMerchantSlots() {
        let html = '';
        // Limit to 16 slots (4 rows of 4) for merchant inventory
        const maxVisibleSlots = 16;
        
        for (let i = 0; i < Math.min(maxVisibleSlots, this.merchant.inventory.maxSlots); i++) {
            const item = this.merchant.inventory.getSlot(i);
            if (item) {
                const price = this.merchant.getSellPrice(item);
                html += `
                    <div class="merchant-slot" data-slot="${i}">
                        <img src="${item.icon}" alt="${item.name}">
                        <div class="item-price">${price} ETH</div>
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
        // Check if player and inventory exist
        if (!this.game?.player?.inventory) {
            console.error('Player inventory not initialized:', {
                hasGame: !!this.game,
                hasPlayer: !!this.game?.player,
                hasInventory: !!this.game?.player?.inventory
            });
            return '';
        }

        let html = '';
        const inventory = this.game.player.inventory;
        // Limit to 16 slots (4 rows of 4) for player inventory
        const maxVisibleSlots = 16;
        
        for (let i = 0; i < Math.min(maxVisibleSlots, inventory.maxSlots); i++) {
            const item = inventory.getSlot(i);
            if (item) {
                const price = this.merchant.getBuyPrice(item);
                html += `
                    <div class="player-slot" data-slot="${i}">
                        <img src="${item.icon}" alt="${item.name}">
                        <div class="item-price">${price} ETH</div>
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



















