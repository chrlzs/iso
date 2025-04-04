import { ModelBase } from './ModelBase.js';

/**
 * Class representing a character model
 * @class CharacterModel
 * @extends ModelBase
 */
export class CharacterModel extends ModelBase {
    /**
     * Creates a new character model
     * @param {string} id - Unique identifier for the model
     * @param {Object} [options={}] - Model options
     */
    constructor(id, options = {}) {
        super(id, { ...options, type: 'character' });
        
        this.characterType = options.characterType || 'generic';
        this.isAnimated = options.isAnimated !== undefined ? options.isAnimated : true;
        this.animationSpeed = options.animationSpeed || 0.1;
        this.currentFrame = 0;
        this.currentDirection = 'down';
        this.isMoving = false;
        this.lastAnimationUpdate = 0;
    }

    /**
     * Updates the character animation
     * @param {number} deltaTime - Time elapsed since last update
     * @param {boolean} isMoving - Whether the character is moving
     * @param {string} direction - Character direction
     */
    updateAnimation(deltaTime, isMoving, direction) {
        this.isMoving = isMoving;
        this.currentDirection = direction;

        // Only animate if the character is moving and animated
        if (this.isAnimated && isMoving) {
            this.lastAnimationUpdate += deltaTime;
            if (this.lastAnimationUpdate >= this.animationSpeed * 1000) {
                this.currentFrame = (this.currentFrame + 1) % 4; // Assuming 4 frames per animation
                this.lastAnimationUpdate = 0;
            }
        } else {
            // Reset to standing frame when not moving
            this.currentFrame = 0;
        }
    }

    /**
     * Renders the character
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     * @param {number} x - X position
     * @param {number} y - Y position
     * @param {number} width - Width
     * @param {number} height - Height
     * @param {Object} [options={}] - Render options
     */
    render(ctx, x, y, width, height, options = {}) {
        const texture = this.getTexture('default');
        if (!texture || !texture.isLoaded) {
            // Fallback rendering if texture is not available
            ctx.fillStyle = '#ff00ff';
            ctx.fillRect(x, y, width, height);
            return;
        }

        // If the texture is animated, get the current frame
        if (this.isAnimated && texture.isAnimated) {
            const frame = texture.getFrame(this.currentDirection, this.currentFrame);
            ctx.drawImage(
                frame.image,
                frame.sx, frame.sy, frame.sw, frame.sh,
                x, y, width, height
            );
        } else {
            // Draw the character texture
            ctx.drawImage(texture.image, x, y, width, height);
        }

        // Draw debug info if needed
        if (options.debug) {
            ctx.strokeStyle = '#ff0000';
            ctx.strokeRect(x, y, width, height);
            
            ctx.fillStyle = '#000000';
            ctx.font = '10px Arial';
            ctx.fillText(`${this.id} (${this.characterType})`, x + 5, y + 15);
            ctx.fillText(`Direction: ${this.currentDirection}`, x + 5, y + 30);
            ctx.fillText(`Frame: ${this.currentFrame}`, x + 5, y + 45);
        }
    }

    /**
     * Gets the current animation frame
     * @returns {number} Current frame index
     */
    getCurrentFrame() {
        return this.currentFrame;
    }

    /**
     * Gets the current direction
     * @returns {string} Current direction
     */
    getCurrentDirection() {
        return this.currentDirection;
    }
}
