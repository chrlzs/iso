import { NPC } from './NPC.js';
import { Inventory } from '../inventory/Inventory.js';
import { Item } from '../inventory/Item.js';

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
    constructor(config = {}) {
        super({
            ...config,
            name: config.name || 'Merchant',
            color: '#8B4513',
            size: 24
        });

        console.log('Creating merchant inventory with config:', config);
        
        // Create inventory with explicit error checking
        try {
            this.inventory = new Inventory({
                maxSlots: 50,
                maxWeight: 500,
                owner: this,
                eth: config.eth || 1000
            });

            if (!this.inventory) {
                throw new Error('Inventory creation failed');
            }

            console.log('Merchant inventory created successfully:', {
                hasInventory: !!this.inventory,
                slotsLength: this.inventory?.slots?.length,
                eth: this.inventory?.eth
            });
        } catch (error) {
            console.error('Failed to create merchant inventory:', error);
            throw error;
        }

        // Initialize trading parameters
        this.buyMultiplier = Number(config.buyMultiplier || 0.5);
        this.sellMultiplier = Number(config.sellMultiplier || 1.2);
        this.tradingRange = 100;
        this.state = 'idle';
    }

    getBuyPrice(item) {
        // Ensure we're working with numbers
        const value = Number(item.value);
        const multiplier = Number(this.buyMultiplier);
        const price = Math.floor(value * multiplier);
        
        console.log('Buy price calculation:', {
            itemValue: value,
            multiplier: multiplier,
            calculatedPrice: price
        });
        
        return price;
    }

    getSellPrice(item) {
        // Ensure we're working with numbers
        const value = Number(item.value);
        const multiplier = Number(this.sellMultiplier);
        const price = Math.floor(value * multiplier);
        
        console.log('Sell price calculation:', {
            itemValue: value,
            multiplier: multiplier,
            calculatedPrice: price
        });
        
        return price;
    }

    buyFromPlayer(playerSlot, quantity, player) {
        const item = player.inventory.getSlot(playerSlot);
        if (!item) return false;

        const price = this.getBuyPrice(item) * quantity;
        const currentEth = Number(this.inventory.eth || 0);

        console.log('Buy transaction details:', {
            price: price,
            quantity: quantity,
            totalPrice: price * quantity,
            merchantCurrentEth: currentEth
        });

        if (currentEth < price) {
            console.log('Insufficient merchant ETH:', {
                required: price,
                available: currentEth
            });
            return false;
        }

        if (player.inventory.transferItem(playerSlot, this.inventory, quantity)) {
            this.inventory.eth = currentEth - price;
            player.inventory.eth = Number(player.inventory.eth || 0) + price;
            
            console.log('Transaction complete:', {
                newMerchantEth: this.inventory.eth,
                newPlayerEth: player.inventory.eth
            });
            return true;
        }
        return false;
    }

    sellToPlayer(merchantSlot, quantity, player) {
        const item = this.inventory.getSlot(merchantSlot);
        if (!item) return false;

        const price = this.getSellPrice(item) * quantity;
        const playerEth = Number(player.inventory.eth || 0);
        
        console.log('Sell to player:', {
            price: price,
            playerEth: playerEth
        });

        if (playerEth < price) {
            console.log('Insufficient player ETH:', {
                required: price,
                available: playerEth
            });
            return false;
        }

        if (this.inventory.transferItem(merchantSlot, player.inventory, quantity)) {
            this.inventory.eth = Number(this.inventory.eth || 0) + price;
            player.inventory.eth = playerEth - price;
            
            console.log('Transaction complete:', {
                newMerchantEth: this.inventory.eth,
                newPlayerEth: player.inventory.eth
            });
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
                    return true; // Return true if player is in range
                }
            }
        }

        if (this.state === 'trading') {
            this.state = 'idle';
        }
        return false;
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















