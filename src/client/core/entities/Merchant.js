import { NPC } from './NPC.js';

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
            hostile: false,
            speed: 100  // Merchants move slower
        });

        this.inventory = config.inventory || [];
        this.tradingRange = 100;
        this.state = 'idle'; // idle, wandering, trading
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
    }

    /**
     * Override render to add merchant-specific visuals
     */
    render(ctx) {
        super.render(ctx);
        
        // Add merchant-specific visual indicators
        ctx.save();
        
        // Draw merchant hat
        ctx.fillStyle = '#8B4513';
        ctx.beginPath();
        ctx.arc(this.x, this.y - this.height/2, 8, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }
}
