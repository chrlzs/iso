import { Entity } from './Entity.js';

/**
 * Base class for all non-player characters
 * @class NPC
 * @extends Entity
 */
export class NPC extends Entity {
    /**
     * Creates a new NPC
     * @param {Object} config - NPC configuration
     * @param {number} config.x - Initial X position
     * @param {number} config.y - Initial Y position
     * @param {string} [config.name='Unknown'] - NPC name
     * @param {boolean} [config.hostile=false] - Whether NPC is hostile
     */
    constructor(config) {
        super({
            ...config,
            width: 40,
            height: 40,
            type: 'npc'
        });

        this.name = config.name || 'Unknown';
        this.hostile = config.hostile || false;
        this.direction = 'down';
        this.speed = 150; // Slower than player
        
        // Basic AI state
        this.state = 'idle'; // idle, wandering, following, attacking
        this.stateTimer = 0;
        this.targetEntity = null;
        this.detectionRange = 200;
    }

    /**
     * Updates NPC state and position
     * @param {number} deltaTime - Time elapsed since last update
     * @param {Array<Entity>} entities - All game entities for AI decisions
     */
    update(deltaTime, entities) {
        this.updateAI(deltaTime, entities);
        super.update(deltaTime);
    }

    /**
     * Updates NPC AI behavior
     * @param {number} deltaTime - Time elapsed since last update
     * @param {Array<Entity>} entities - All game entities for AI decisions
     */
    updateAI(deltaTime, entities) {
        this.stateTimer -= deltaTime;

        switch (this.state) {
            case 'idle':
                if (this.stateTimer <= 0) {
                    // Randomly decide to start wandering
                    if (Math.random() < 0.3) {
                        this.state = 'wandering';
                        this.stateTimer = 2000 + Math.random() * 3000;
                        this.setRandomDirection();
                    } else {
                        this.stateTimer = 1000 + Math.random() * 2000;
                    }
                }
                break;

            case 'wandering':
                if (this.stateTimer <= 0) {
                    this.state = 'idle';
                    this.stateTimer = 1000 + Math.random() * 2000;
                    this.setVelocity(0, 0);
                }
                break;
        }

        if (this.hostile) {
            this.checkForTargets(entities);
        }
    }

    /**
     * Sets a random movement direction
     * @private
     */
    setRandomDirection() {
        const angle = Math.random() * Math.PI * 2;
        const dx = Math.cos(angle) * this.speed;
        const dy = Math.sin(angle) * this.speed;
        this.setVelocity(dx, dy);
        
        // Update facing direction
        if (Math.abs(dx) > Math.abs(dy)) {
            this.direction = dx > 0 ? 'right' : 'left';
        } else {
            this.direction = dy > 0 ? 'down' : 'up';
        }
    }

    /**
     * Checks for potential targets within detection range
     * @param {Array<Entity>} entities - All game entities
     * @private
     */
    checkForTargets(entities) {
        if (this.state === 'attacking') return;

        for (const entity of entities) {
            if (entity.type === 'player') {
                const dx = entity.x - this.x;
                const dy = entity.y - this.y;
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance < this.detectionRange) {
                    this.targetEntity = entity;
                    this.state = 'following';
                    return;
                }
            }
        }
    }

    /**
     * Renders the NPC
     * @param {CanvasRenderingContext2D} ctx - The canvas rendering context
     */
    render(ctx) {
        ctx.save();
        
        // Draw NPC body
        ctx.fillStyle = this.hostile ? '#E74C3C' : '#27AE60';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.width/2, 0, Math.PI * 2);
        ctx.fill();

        // Draw direction indicator
        ctx.fillStyle = '#2C3E50';
        const indicatorSize = 6;
        switch (this.direction) {
            case 'up':
                ctx.fillRect(this.x - indicatorSize/2, this.y - this.height/2, indicatorSize, indicatorSize);
                break;
            case 'down':
                ctx.fillRect(this.x - indicatorSize/2, this.y + this.height/2 - indicatorSize, indicatorSize, indicatorSize);
                break;
            case 'left':
                ctx.fillRect(this.x - this.width/2, this.y - indicatorSize/2, indicatorSize, indicatorSize);
                break;
            case 'right':
                ctx.fillRect(this.x + this.width/2 - indicatorSize, this.y - indicatorSize/2, indicatorSize, indicatorSize);
                break;
        }

        ctx.restore();
    }
}