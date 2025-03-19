
import { Entity } from './Entity.js';

/**
 * Player entity class
 * @class Player
 * @extends Entity
 */
export class Player extends Entity {
    /**
     * Creates a new Player
     * @param {Object} config - Player configuration
     * @param {number} config.x - Initial X position
     * @param {number} config.y - Initial Y position
     */
    constructor(config) {
        super({
            ...config,
            width: 48,
            height: 48,
            type: 'player'
        });

        // Player-specific properties
        this.speed = 300; // Faster than base entities
        this.isMoving = false;
        this.direction = 'down'; // down, up, left, right
        
        // Basic stats
        this.health = 100;
        this.maxHealth = 100;
        this.stamina = 100;
        this.maxStamina = 100;
    }

    /**
     * Updates player state
     * @param {number} deltaTime - Time elapsed since last update in milliseconds
     * @param {InputManager} inputManager - Game input manager
     */
    update(deltaTime, inputManager) {
        // Handle movement input
        this.handleMovement(inputManager);
        
        // Call parent update (handles actual movement)
        super.update(deltaTime);
    }

    /**
     * Handles player movement based on input
     * @param {InputManager} inputManager - Game input manager
     */
    handleMovement(inputManager) {
        let dx = 0;
        let dy = 0;

        // Get input state
        if (inputManager.isKeyPressed('KeyW') || inputManager.isKeyPressed('ArrowUp')) {
            dy = -1;
            this.direction = 'up';
        }
        if (inputManager.isKeyPressed('KeyS') || inputManager.isKeyPressed('ArrowDown')) {
            dy = 1;
            this.direction = 'down';
        }
        if (inputManager.isKeyPressed('KeyA') || inputManager.isKeyPressed('ArrowLeft')) {
            dx = -1;
            this.direction = 'left';
        }
        if (inputManager.isKeyPressed('KeyD') || inputManager.isKeyPressed('ArrowRight')) {
            dx = 1;
            this.direction = 'right';
        }

        // Normalize diagonal movement
        if (dx !== 0 && dy !== 0) {
            dx *= Math.SQRT1_2;
            dy *= Math.SQRT1_2;
        }

        // Update velocity
        this.setVelocity(dx * this.speed, dy * this.speed);
        
        // Update movement state
        this.isMoving = dx !== 0 || dy !== 0;
    }

    /**
     * Renders the player
     * @param {CanvasRenderingContext2D} ctx - The canvas rendering context
     */
    render(ctx) {
        // Temporary player rendering - we'll replace this with sprites later
        ctx.save();
        
        // Draw player body
        ctx.fillStyle = '#4A90E2';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.width/2, 0, Math.PI * 2);
        ctx.fill();

        // Draw direction indicator
        ctx.fillStyle = '#2C3E50';
        const indicatorSize = 8;
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
