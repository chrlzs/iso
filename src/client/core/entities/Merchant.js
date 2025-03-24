
import { NPC } from './NPC.js';
import { Inventory } from '../inventory/Inventory.js';

/**
 * Merchant NPC class
 * @class Merchant
 * @extends NPC
 */
export class Merchant extends NPC {
    /**
     * Creates a new Merchant
     * @param {Object} config - Merchant configuration
     * @param {number} config.x - Initial X position
     * @param {number} config.y - Initial Y position
     * @param {string} [config.name='Merchant'] - Merchant name
     * @param {Array} [config.inventory=[]] - Initial inventory
     */
    constructor(config) {
        super({
            ...config,
            name: config.name || 'Merchant',
            color: '#8B4513', // Brown color for merchants
            size: 24 // Slightly larger than regular NPCs
        });
        
        this.inventory = new Inventory({
            maxSlots: 50,
            maxWeight: 500,
            owner: this,
            gold: config.gold || 1000
        });

        // Add merchant's inventory if provided
        if (config.inventory) {
            config.inventory.forEach(item => this.inventory.addItem(item));
        }

        this.buyMultiplier = config.buyMultiplier || 0.5; // Pay 50% of value when buying from player
        this.sellMultiplier = config.sellMultiplier || 1.2; // Charge 120% of value when selling to player
        this.tradingRange = 100;
        this.state = 'idle'; // idle, wandering, trading
    }

    getBuyPrice(item) {
        return Math.floor(item.value * this.buyMultiplier);
    }

    getSellPrice(item) {
        return Math.floor(item.value * this.sellMultiplier);
    }

    buyFromPlayer(playerSlot, quantity, player) {
        const item = player.inventory.getSlot(playerSlot);
        if (!item) return false;

        const price = this.getBuyPrice(item) * quantity;
        if (this.inventory.gold < price) return false;

        if (player.inventory.transferItem(playerSlot, this.inventory, quantity)) {
            this.inventory.gold -= price;
            player.inventory.gold += price;
            return true;
        }
        return false;
    }

    sellToPlayer(merchantSlot, quantity, player) {
        const item = this.inventory.getSlot(merchantSlot);
        if (!item) return false;

        const price = this.getSellPrice(item) * quantity;
        if (player.inventory.gold < price) return false;

        if (this.inventory.transferItem(merchantSlot, player.inventory, quantity)) {
            this.inventory.gold += price;
            player.inventory.gold -= price;
            return true;
        }
        return false;
    }

    /**
     * Override updateAI to include trading behavior
     */
    updateAI(deltaTime, entities) {
        this.stateTimer -= deltaTime;

        switch (this.state) {
            case 'idle':
                if (this.stateTimer <= 0) {
                    // Reduce wandering chance to 5%
                    if (Math.random() < 0.05) {
                        this.state = 'wandering';
                        this.stateTimer = 1000 + Math.random() * 1000; // Shorter wandering time
                        this.setRandomDirection();
                    } else {
                        this.stateTimer = 2000 + Math.random() * 2000;
                    }
                }
                break;

            case 'wandering':
                if (this.stateTimer <= 0) {
                    this.state = 'idle';
                    this.stateTimer = 2000 + Math.random() * 2000;
                    this.setVelocity(0, 0);
                }
                break;

            case 'trading':
                this.setVelocity(0, 0);
                break;
        }

        // Check for nearby players to trade with
        this.checkForTrade(entities);
    }

    setRandomDirection() {
        const angle = Math.random() * Math.PI * 2;
        const maxDistance = 1; // Very limited movement range
        
        this.velocityX = Math.cos(angle) * this.speed * maxDistance;
        this.velocityY = Math.sin(angle) * this.speed * maxDistance;
    }

    /**
     * Check for players within trading range
     * @private
     */
    checkForTrade(entities) {
        if (!entities || !Array.isArray(entities)) {
            return;
        }

        for (const entity of entities) {
            if (entity.type === 'player') {
                const dx = entity.x - this.x;
                const dy = entity.y - this.y;
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance < this.tradingRange) {
                    this.state = 'trading';
                    this.setVelocity(0, 0);
                    return;
                }
            }
        }

        // If no players are in range and we're trading, go back to idle
        if (this.state === 'trading') {
            this.state = 'idle';
            this.stateTimer = 2000 + Math.random() * 2000;
        }
    }

    /**
     * Override render to add merchant-specific visuals
     */
    render(ctx, renderer) {
        // Call parent render method with both ctx and renderer
        super.render(ctx, renderer);
        
        if (!renderer) return;
        
        // Get isometric coordinates
        const isoPos = renderer.convertToIsometric(this.x, this.y);
        
        // Add merchant-specific visual indicators
        ctx.save();
        
        // Draw merchant hat - adjusted position to be above the sprite
        ctx.fillStyle = '#4B2510';  // Darker brown for hat
        ctx.beginPath();
        ctx.arc(isoPos.x, isoPos.y - this.frameHeight - 10, this.size / 2, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw hat brim - adjusted position to match hat
        ctx.beginPath();
        ctx.ellipse(
            isoPos.x, 
            isoPos.y - this.frameHeight - 8, 
            this.size * 0.7, 
            this.size / 4, 
            0, 
            0, 
            Math.PI * 2
        );
        ctx.fill();

        ctx.restore();
    }
}




