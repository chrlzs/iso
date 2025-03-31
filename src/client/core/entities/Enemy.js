import { NPC } from './NPC.js';

/**
 * Enemy entity class - represents hostile NPCs in the game
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
     * @param {number} [config.damage=10] - Base damage dealt by attacks
     * @param {number} [config.attackRange=50] - Attack range in pixels
     * @param {World} config.world - Reference to game world
     */
    constructor(config) {
        super(config);
        
        // Override sprite with enemy character
        this.spriteSheet = new Image();
        this.spriteSheet.src = 'assets/characters/enemy_character.png';
        this.spriteSheet.onload = () => {
            this.imageLoaded = true;
            this.frameWidth = this.spriteSheet.width / 12;
            this.frameHeight = this.spriteSheet.height / 8;
        };

        this.damage = config.damage || 10;
        this.attackRange = config.attackRange || 50;
        this.attackCooldown = 0;
        this.attackSpeed = 1000; // milliseconds between attacks
    }

    /**
     * Updates enemy AI behavior and state
     * @param {number} deltaTime - Time elapsed since last update
     * @param {Entity[]} entities - List of entities for AI targeting
     * @override
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
     * Performs an attack against the target entity
     * @param {Entity} target - Entity to attack
     * @returns {void}
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
     * Renders the enemy and its attack range indicator when attacking
     * @param {CanvasRenderingContext2D} ctx - The canvas rendering context
     * @override
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

