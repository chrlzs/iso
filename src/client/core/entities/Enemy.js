import { NPC } from './NPC.js';

/**
 * Enemy entity class
 * @class Enemy
 * @extends NPC
 */
export class Enemy extends NPC {
    /**
     * Creates a new Enemy
     * @param {Object} config - Enemy configuration
     * @param {number} config.x - Initial X position
     * @param {number} config.y - Initial Y position
     * @param {string} [config.name='Enemy'] - Enemy name
     * @param {number} [config.damage=10] - Base damage
     * @param {number} [config.attackRange=50] - Attack range in pixels
     */
    constructor(config) {
        super({
            ...config,
            name: config.name || 'Enemy',
            hostile: true,
            type: 'enemy'
        });

        this.damage = config.damage || 10;
        this.attackRange = config.attackRange || 50;
        this.attackCooldown = 0;
        this.attackSpeed = 1000; // milliseconds between attacks
    }

    /**
     * Updates enemy AI behavior
     * @param {number} deltaTime - Time elapsed since last update
     * @param {Array<Entity>} entities - All game entities for AI decisions
     */
    updateAI(deltaTime, entities) {
        super.updateAI(deltaTime, entities);

        if (this.attackCooldown > 0) {
            this.attackCooldown -= deltaTime;
        }

        if (this.targetEntity) {
            const dx = this.targetEntity.x - this.x;
            const dy = this.targetEntity.y - this.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < this.attackRange) {
                this.state = 'attacking';
                if (this.attackCooldown <= 0) {
                    this.attack(this.targetEntity);
                }
            } else if (distance < this.detectionRange) {
                this.state = 'following';
                // Move towards target
                const speed = this.speed / distance;
                this.setVelocity(dx * speed, dy * speed);
            } else {
                this.targetEntity = null;
                this.state = 'idle';
                this.setVelocity(0, 0);
            }
        }
    }

    /**
     * Performs an attack on the target
     * @param {Entity} target - The target to attack
     */
    attack(target) {
        // Reset attack cooldown
        this.attackCooldown = this.attackSpeed;

        // Apply damage to target if it has health
        if (target.health) {
            target.health = Math.max(0, target.health - this.damage);
        }
    }

    /**
     * Renders the enemy
     * @param {CanvasRenderingContext2D} ctx - The canvas rendering context
     */
    render(ctx) {
        super.render(ctx);

        // Draw attack range indicator when attacking
        if (this.state === 'attacking') {
            ctx.save();
            ctx.strokeStyle = 'rgba(231, 76, 60, 0.3)';
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.attackRange, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();
        }
    }
}