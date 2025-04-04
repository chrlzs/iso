import { UIStyles } from '../UIStyles.js';

/**
 * Manages the merchant trading interface
 * @class MerchantUI
 * @extends UIComponent
 */
export class MerchantUI {
    /**
     * Creates a new MerchantUI instance
     * @param {Object} config - Configuration object
     * @param {GameInstance} config.game - Reference to game instance
     * @param {number} [config.width=800] - Width of merchant window
     * @param {number} [config.height=600] - Height of merchant window
     */
    constructor(config) {
        this.game = config.game;
        this.merchant = null;
        this.isVisible = false;
        
        this.createElements();
        this.setupEventListeners();
        
        // Don't call hide() in constructor
        this.container.style.display = 'none';
    }

    createElements() {
        this.container = UIStyles.createModalWindow({
            className: 'merchant-ui',
            width: 800,
            height: 600,
            title: 'Merchant Trade',
            onClose: () => this.hide()
        });

        // Create inventories container
        const inventoriesContainer = document.createElement('div');
        inventoriesContainer.style.cssText = `
            display: flex;
            gap: 20px;
            flex: 1;
        `;
        this.container.appendChild(inventoriesContainer);

        // Create merchant inventory section
        this.merchantInventory = document.createElement('div');
        this.merchantInventory.className = 'merchant-inventory';
        this.merchantInventory.style.cssText = `
            flex: 1;
            background: #2a2a2a;
            padding: 15px;
            border-radius: 8px;
            min-width: 0;
        `;
        inventoriesContainer.appendChild(this.merchantInventory);

        // Create player inventory section
        this.playerInventory = document.createElement('div');
        this.playerInventory.className = 'player-inventory';
        this.playerInventory.style.cssText = `
            flex: 1;
            background: #2a2a2a;
            padding: 15px;
            border-radius: 8px;
            min-width: 0;
        `;
        inventoriesContainer.appendChild(this.playerInventory);

        // Create gold display section at the bottom
        this.goldDisplay = document.createElement('div');
        this.goldDisplay.className = 'gold-display';
        this.goldDisplay.style.cssText = `
            margin-top: 20px;
            padding: 10px;
            background: #333;
            border-radius: 8px;
            display: flex;
            justify-content: space-between;
        `;
        this.container.appendChild(this.goldDisplay);

        // Add styles for slots
        const style = document.createElement('style');
        style.textContent = `
            .merchant-slots, .player-slots {
                display: grid;
                grid-template-columns: repeat(4, 1fr);
                gap: 8px;
                padding: 10px;
            }
            
            .merchant-slot, .player-slot {
                aspect-ratio: 1;
                background: #333;
                border: 2px solid #444;
                border-radius: 4px;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                position: relative;
                cursor: pointer;
                padding: 5px;
            }
            
            .merchant-slot:hover, .player-slot:hover {
                border-color: #00f2ff;
            }
            
            .merchant-slot img, .player-slot img {
                max-width: 70%;
                max-height: 70%;
                object-fit: contain;
            }
            
            .merchant-slot.empty, .player-slot.empty {
                background: #222;
                border: 2px dashed #444;
            }
            
            .item-price {
                position: absolute;
                bottom: 2px;
                left: 50%;
                transform: translateX(-50%);
                background: rgba(0, 0, 0, 0.7);
                padding: 2px 6px;
                border-radius: 4px;
                font-size: 12px;
                color: #00f2ff;
            }
            
            .item-quantity {
                position: absolute;
                top: 2px;
                right: 2px;
                background: rgba(0, 0, 0, 0.7);
                padding: 2px 6px;
                border-radius: 4px;
                font-size: 12px;
                color: white;
            }
        `;
        document.head.appendChild(style);

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

    /**
     * Handles item purchase from merchant
     * @param {Item} item - Item being purchased
     * @param {number} quantity - Quantity to purchase
     * @returns {boolean} Success status of purchase
     * @private
     */
    handlePurchase(item, quantity) {
        const price = this.merchant.getSellPrice(item);
        const playerEth = Number(this.game.player.inventory.eth || 0);
        
        console.log('Attempting to buy:', {
            price: price,
            playerEth: playerEth,
            item: item.name
        });
        
        if (playerEth >= price) {
            if (this.merchant.sellToPlayer(item.slotIndex, quantity, this.game.player)) {
                console.log('Purchase successful');
                this.refresh();
                return true;
            }
        } else {
            console.log('Insufficient ETH:', {
                required: price,
                available: playerEth
            });
        }
        return false;
    }

    /**
     * Handles selling item to merchant
     * @param {Item} item - Item being sold
     * @param {number} quantity - Quantity to sell
     * @returns {boolean} Success status of sale
     * @private
     */
    handleSale(item, quantity) {
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
            if (this.merchant.buyFromPlayer(item.slotIndex, quantity, this.game.player)) {
                console.log('Sale successful');
                this.refresh();
                return true;
            }
        } else {
            console.log('Merchant has insufficient ETH:', {
                required: price,
                available: merchantEth
            });
        }
        return false;
    }

    /**
     * Shows the merchant interface with specified merchant
     * @param {Merchant} merchant - The merchant to trade with
     * @returns {void}
     */
    show(merchant) {
        console.log('MerchantUI show called with merchant:', {
            id: merchant?.id,
            hasInventory: !!merchant?.inventory,
            uiVisible: this.isVisible,
            containerExists: !!this.container
        });

        if (!merchant?.inventory) {
            console.error('Invalid merchant or missing inventory');
            return;
        }

        this.merchant = merchant;
        this.isVisible = true;

        if (this.container) {
            this.container.style.display = 'flex';
            this.refresh();
        } else {
            console.error('MerchantUI container not initialized');
        }

        console.log('MerchantUI shown successfully');
    }

    hide() {
        this.isVisible = false;
        this.container.style.display = 'none';
        // Only modify activeWindows if game and uiManager exist
        if (this.game?.uiManager?.activeWindows) {
            this.game.uiManager.activeWindows.delete('merchantUI');
        }
    }

    refresh() {
        if (!this.merchant) {
            console.warn('No merchant set for UI refresh');
            return;
        }

        // Update the displays
        this.merchantInventory.innerHTML = `
            <h3 style="color: #00f2ff; font-size: 20px; margin-bottom: 15px; text-align: center;">Merchant's Goods</h3>
            <div class="merchant-slots">
                ${this.renderMerchantSlots()}
            </div>
        `;

        this.playerInventory.innerHTML = `
            <h3 style="color: #00f2ff; font-size: 20px; margin-bottom: 15px; text-align: center;">Your Items</h3>
            <div class="player-slots">
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
        const maxVisibleSlots = 16;
        
        for (let i = 0; i < Math.min(maxVisibleSlots, this.merchant.inventory.maxSlots); i++) {
            const item = this.merchant.inventory.getSlot(i);
            if (item) {
                const price = this.merchant.getSellPrice(item);
                html += `
                    <div class="merchant-slot" data-slot="${i}">
                        <img src="${item.icon}" alt="${item.name}" title="${item.name}">
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
        if (!this.game?.player?.inventory) {
            console.error('Player inventory not initialized');
            return '';
        }

        let html = '';
        const inventory = this.game.player.inventory;
        const maxVisibleSlots = 16;
        
        for (let i = 0; i < Math.min(maxVisibleSlots, inventory.maxSlots); i++) {
            const item = inventory.getSlot(i);
            if (item) {
                const price = this.merchant.getBuyPrice(item);
                html += `
                    <div class="player-slot" data-slot="${i}">
                        <img src="${item.icon}" alt="${item.name}" title="${item.name}">
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

    /**
     * Updates merchant interface elements
     * @param {number} deltaTime - Time elapsed since last update
     * @returns {void}
     */
    update(deltaTime) {
        // Placeholder for future update logic
    }
}
























