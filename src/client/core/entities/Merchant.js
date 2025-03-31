import { NPC } from './NPC.js';
import { InventorySystem } from '../inventory/InventorySystem.js';

/**
 * Represents a merchant NPC with trading capabilities
 * @class Merchant
 * @extends NPC
 */
export class Merchant extends NPC {
    /**
     * Creates a new Merchant instance
     * @param {Object} config - Merchant configuration
     * @param {string} config.name - Merchant's name
     * @param {number} config.x - X coordinate
     * @param {number} config.y - Y coordinate
     * @param {World} config.world - Reference to game world
     * @param {Object} [config.inventory] - Initial inventory items
     * @param {number} [config.level=1] - Merchant's trading level
     * @param {number} [config.profitMargin=0.2] - Merchant's profit margin
     */
    constructor(config) {
        super({
            ...config,
            type: 'merchant'
        });

        // Initialize trading properties
        this.level = config.level || 1;
        this.profitMargin = config.profitMargin || 0.2;
        this.inventory = new InventorySystem({
            maxSlots: 50,
            maxWeight: 1000,
            startingEth: 1000
        });

        // Add initial inventory if provided
        if (config.inventory) {
            Object.entries(config.inventory).forEach(([itemId, quantity]) => {
                this.inventory.addItem({ id: itemId }, quantity);
            });
        }
    }

    /**
     * Calculates selling price for an item
     * @param {Item} item - Item to sell
     * @returns {number} Selling price
     */
    getSellPrice(item) {
        const basePrice = item.value || 0;
        const markup = this.profitMargin * (1 + (this.level * 0.1));
        return Math.ceil(basePrice * (1 + markup));
    }

    /**
     * Calculates buying price for an item
     * @param {Item} item - Item to buy
     * @returns {number} Buying price
     */
    getBuyPrice(item) {
        const basePrice = item.value || 0;
        const discount = Math.min(0.3, 0.1 + (this.level * 0.05));
        return Math.floor(basePrice * (1 - discount));
    }

    /**
     * Sells an item to a player
     * @param {number} slotIndex - Inventory slot index
     * @param {number} quantity - Quantity to sell
     * @param {Player} player - Player buying the item
     * @returns {boolean} True if sale was successful
     */
    sellToPlayer(slotIndex, quantity, player) {
        const item = this.inventory.getSlot(slotIndex);
        if (!item) return false;

        const price = this.getSellPrice(item) * quantity;
        if (player.inventory.eth < price) return false;

        const soldItem = this.inventory.removeItem(slotIndex, quantity);
        if (!soldItem) return false;

        player.inventory.eth -= price;
        this.inventory.eth += price;
        player.inventory.addItem(soldItem, quantity);

        return true;
    }

    /**
     * Buys an item from a player
     * @param {number} slotIndex - Player's inventory slot index
     * @param {number} quantity - Quantity to buy
     * @param {Player} player - Player selling the item
     * @returns {boolean} True if purchase was successful
     */
    buyFromPlayer(slotIndex, quantity, player) {
        const item = player.inventory.getSlot(slotIndex);
        if (!item) return false;

        const price = this.getBuyPrice(item) * quantity;
        if (this.inventory.eth < price) return false;

        const boughtItem = player.inventory.removeItem(slotIndex, quantity);
        if (!boughtItem) return false;

        this.inventory.eth -= price;
        player.inventory.eth += price;
        this.inventory.addItem(boughtItem, quantity);

        return true;
    }

    /**
     * Handles player interaction with merchant
     * @param {Player} player - The interacting player
     * @returns {boolean} True if interaction was successful
     */
    interact(player) {
        console.log('Merchant interact called:', {
            merchantId: this.id,
            hasGame: !!this.game,
            hasWorld: !!this.world,
            hasInventory: !!this.inventory,
            playerGame: !!player?.game
        });

        // Ensure the game instance is available
        if (!this.game && this.world?.game) {
            this.game = this.world.game;
        }
        if (!this.game && player?.game) {
            this.game = player.game;
        }

        if (!this.game) {
            console.error('No game instance available for merchant:', this.id);
            return false;
        }

        // Ensure the UI Manager is available
        if (!this.game.uiManager) {
            console.error('UI Manager not available:', {
                merchantId: this.id,
                hasGame: !!this.game,
                hasUIManager: !!this.game?.uiManager
            });
            return false;
        }

        // Get the MerchantUI component
        const merchantUI = this.game.uiManager.getComponent('merchantUI');
        if (!merchantUI) {
            console.error('MerchantUI component not found');
            return false;
        }

        // Show the MerchantUI
        console.log('Opening merchant UI:', {
            merchantId: this.id,
            inventorySlots: this.inventory?.slots?.length,
            eth: this.inventory?.eth
        });

        merchantUI.show(this);
        this.game.uiManager.activeWindows.add('merchantUI');
        return true;
    }

    /**
     * Renders the merchant character
     * @param {CanvasRenderingContext2D} ctx - The canvas rendering context
     * @param {IsometricRenderer} renderer - The game's isometric renderer
     */
    render(ctx, renderer) {
        if (!this.isVisible) return;

        const screenPos = renderer.convertToIsometric(this.x, this.y);
        
        ctx.save();
        ctx.translate(screenPos.x, screenPos.y);
        
        // Draw shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.beginPath();
        ctx.ellipse(0, 8, 20, 10, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw character
        this.drawMerchant(ctx);
        
        ctx.restore();
    }

    /**
     * Draws the merchant character
     * @param {CanvasRenderingContext2D} ctx - The canvas rendering context
     * @private
     */
    drawMerchant(ctx) {
        // Holographic robe effect
        ctx.fillStyle = '#1A1A2E';  // Dark base
        ctx.strokeStyle = '#FF0066'; // Neon pink trim
        ctx.lineWidth = 2;
        
        // Draw tech-robe
        ctx.beginPath();
        this.roundRect(ctx, -15, -20, 30, 35, 8);
        ctx.fill();
        ctx.stroke();

        // Energy pattern
        ctx.strokeStyle = '#FF0066';
        for (let i = -12; i < 12; i += 8) {
            ctx.beginPath();
            ctx.moveTo(i, -15);
            ctx.lineTo(i, 10);
            ctx.stroke();
        }

        // Cyber-enhanced head
        ctx.fillStyle = '#1A1A2E';
        ctx.strokeStyle = '#00f2ff';
        ctx.beginPath();
        ctx.arc(0, -28, 10, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Digital visor
        ctx.fillStyle = '#FF0066';
        ctx.globalAlpha = 0.7;
        ctx.fillRect(-12, -32, 24, 3);
        ctx.globalAlpha = 1;

        // Holographic trading interface
        ctx.fillStyle = '#00f2ff';
        ctx.globalAlpha = 0.3;
        ctx.beginPath();
        ctx.arc(-18, -10, 8, 0, Math.PI * 2);
        ctx.fill();
        
        // ETH symbol hologram
        ctx.strokeStyle = '#00f2ff';
        ctx.lineWidth = 1;
        ctx.globalAlpha = 1;
        ctx.beginPath();
        ctx.moveTo(-22, -10);
        ctx.lineTo(-14, -10);
        ctx.moveTo(-18, -14);
        ctx.lineTo(-18, -6);
        ctx.stroke();
    }

    /**
     * Helper method to draw rounded rectangles
     * @param {CanvasRenderingContext2D} ctx - The canvas rendering context
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     * @param {number} width - Rectangle width
     * @param {number} height - Rectangle height
     * @param {number} radius - Corner radius
     * @private
     */
    roundRect(ctx, x, y, width, height, radius) {
        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + width - radius, y);
        ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
        ctx.lineTo(x + width, y + height - radius);
        ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        ctx.lineTo(x + radius, y + height);
        ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
        ctx.lineTo(x, y + radius);
        ctx.quadraticCurveTo(x, y, x + radius, y);
        ctx.closePath();
    }
}


















