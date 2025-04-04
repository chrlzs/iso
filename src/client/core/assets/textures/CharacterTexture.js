import { TextureBase } from './TextureBase.js';

/**
 * Class representing a character texture
 * @class CharacterTexture
 * @extends TextureBase
 */
export class CharacterTexture extends TextureBase {
    /**
     * Checks if this texture can be generated without a color or source
     * @returns {boolean} True if the texture can be generated
     */
    canGenerateTexture() {
        // Character textures can always be generated based on characterType
        return true;
    }
    /**
     * Creates a new character texture
     * @param {string} id - Unique identifier for the texture
     * @param {Object} [options={}] - Texture options
     */
    constructor(id, options = {}) {
        super(id, { ...options, type: 'character' });

        this.width = options.width || 64;
        this.height = options.height || 64;
        this.characterType = options.characterType || 'generic';
        this.skinColor = options.skinColor || '#f5d0a9';
        this.hairColor = options.hairColor || '#8b4513';
        this.clothesColor = options.clothesColor || '#4169e1';
        this.isAnimated = options.isAnimated || false;
        this.frames = options.frames || 1;
        this.directions = options.directions || ['down', 'left', 'right', 'up'];
        this.spritesheet = null;
    }

    /**
     * Generates a character texture
     * @async
     * @param {AssetManager} assetManager - Asset manager instance
     * @returns {Promise<HTMLImageElement>} The generated image
     */
    async generateTexture(assetManager) {
        // If this is an animated character, we need to generate a spritesheet
        if (this.isAnimated) {
            return this.generateSpritesheet(assetManager);
        }

        // Create a canvas for the texture
        const canvas = document.createElement('canvas');
        canvas.width = this.width;
        canvas.height = this.height;
        const ctx = canvas.getContext('2d');

        // Generate based on character type
        switch (this.characterType) {
            case 'player':
                this.generatePlayer(ctx, canvas.width, canvas.height);
                break;
            case 'npc':
                this.generateNPC(ctx, canvas.width, canvas.height);
                break;
            case 'enemy':
                this.generateEnemy(ctx, canvas.width, canvas.height);
                break;
            default:
                this.generateGenericCharacter(ctx, canvas.width, canvas.height);
        }

        // Convert canvas to image
        return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.src = canvas.toDataURL('image/png');
        });
    }

    /**
     * Generates a spritesheet for animated characters
     * @async
     * @param {AssetManager} assetManager - Asset manager instance
     * @returns {Promise<HTMLImageElement>} The generated spritesheet
     */
    async generateSpritesheet(assetManager) {
        // Create a canvas for the spritesheet
        const canvas = document.createElement('canvas');
        canvas.width = this.width * this.frames;
        canvas.height = this.height * this.directions.length;
        const ctx = canvas.getContext('2d');

        // Generate each frame for each direction
        for (let d = 0; d < this.directions.length; d++) {
            const direction = this.directions[d];
            for (let f = 0; f < this.frames; f++) {
                // Calculate position in spritesheet
                const x = f * this.width;
                const y = d * this.height;

                // Generate character for this frame and direction
                this.generateCharacterFrame(ctx, x, y, this.width, this.height, direction, f);
            }
        }

        // Convert canvas to image
        return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => {
                this.spritesheet = img;
                resolve(img);
            };
            img.src = canvas.toDataURL('image/png');
        });
    }

    /**
     * Generates a single frame of a character
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     * @param {number} x - X position in spritesheet
     * @param {number} y - Y position in spritesheet
     * @param {number} width - Frame width
     * @param {number} height - Frame height
     * @param {string} direction - Character direction
     * @param {number} frameIndex - Frame index
     */
    generateCharacterFrame(ctx, x, y, width, height, direction, frameIndex) {
        // Save context state
        ctx.save();

        // Translate to the frame position
        ctx.translate(x, y);

        // Generate character based on type
        switch (this.characterType) {
            case 'player':
                this.generatePlayer(ctx, width, height, direction, frameIndex);
                break;
            case 'npc':
                this.generateNPC(ctx, width, height, direction, frameIndex);
                break;
            case 'enemy':
                this.generateEnemy(ctx, width, height, direction, frameIndex);
                break;
            default:
                this.generateGenericCharacter(ctx, width, height, direction, frameIndex);
        }

        // Restore context state
        ctx.restore();
    }

    /**
     * Generates a generic character texture
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     * @param {number} width - Canvas width
     * @param {number} height - Canvas height
     * @param {string} [direction='down'] - Character direction
     * @param {number} [frameIndex=0] - Frame index for animation
     */
    generateGenericCharacter(ctx, width, height, direction = 'down', frameIndex = 0) {
        // Body
        ctx.fillStyle = this.clothesColor;
        ctx.fillRect(width * 0.25, height * 0.4, width * 0.5, height * 0.5);

        // Head
        ctx.fillStyle = this.skinColor;
        ctx.beginPath();
        ctx.arc(width / 2, height * 0.3, width * 0.2, 0, Math.PI * 2);
        ctx.fill();

        // Hair
        ctx.fillStyle = this.hairColor;
        ctx.beginPath();
        ctx.arc(width / 2, height * 0.25, width * 0.15, 0, Math.PI);
        ctx.fill();

        // Apply animation if needed
        if (frameIndex > 0) {
            // Simple animation: move legs
            const legOffset = frameIndex % 2 === 0 ? 0 : height * 0.05;

            // Left leg
            ctx.fillStyle = '#000000';
            ctx.fillRect(width * 0.3, height * 0.9 - legOffset, width * 0.1, height * 0.1);

            // Right leg
            ctx.fillRect(width * 0.6, height * 0.9 + legOffset, width * 0.1, height * 0.1);
        } else {
            // Default legs
            ctx.fillStyle = '#000000';
            ctx.fillRect(width * 0.3, height * 0.9, width * 0.1, height * 0.1);
            ctx.fillRect(width * 0.6, height * 0.9, width * 0.1, height * 0.1);
        }

        // Apply direction-specific changes
        switch (direction) {
            case 'left':
                // Face left
                ctx.fillStyle = '#000000';
                ctx.fillRect(width * 0.35, height * 0.3, width * 0.05, height * 0.05);
                break;
            case 'right':
                // Face right
                ctx.fillStyle = '#000000';
                ctx.fillRect(width * 0.6, height * 0.3, width * 0.05, height * 0.05);
                break;
            case 'up':
                // Face up (back of head)
                ctx.fillStyle = this.hairColor;
                ctx.fillRect(width * 0.35, height * 0.2, width * 0.3, height * 0.15);
                break;
            case 'down':
            default:
                // Face down (default)
                ctx.fillStyle = '#000000';
                ctx.fillRect(width * 0.4, height * 0.3, width * 0.05, height * 0.05);
                ctx.fillRect(width * 0.55, height * 0.3, width * 0.05, height * 0.05);
                ctx.beginPath();
                ctx.arc(width / 2, height * 0.35, width * 0.05, 0, Math.PI);
                ctx.stroke();
        }
    }

    /**
     * Generates a player character texture
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     * @param {number} width - Canvas width
     * @param {number} height - Canvas height
     * @param {string} [direction='down'] - Character direction
     * @param {number} [frameIndex=0] - Frame index for animation
     */
    generatePlayer(ctx, width, height, direction = 'down', frameIndex = 0) {
        // Use a more detailed version of the generic character
        this.generateGenericCharacter(ctx, width, height, direction, frameIndex);

        // Add player-specific details
        ctx.fillStyle = '#ffd700'; // Gold
        ctx.fillRect(width * 0.4, height * 0.4, width * 0.2, height * 0.1); // Belt
    }

    /**
     * Generates an NPC character texture
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     * @param {number} width - Canvas width
     * @param {number} height - Canvas height
     * @param {string} [direction='down'] - Character direction
     * @param {number} [frameIndex=0] - Frame index for animation
     */
    generateNPC(ctx, width, height, direction = 'down', frameIndex = 0) {
        // Use a variation of the generic character
        this.generateGenericCharacter(ctx, width, height, direction, frameIndex);

        // Add NPC-specific details
        ctx.fillStyle = '#32cd32'; // Lime green
        ctx.fillRect(width * 0.25, height * 0.6, width * 0.5, height * 0.1); // Apron
    }

    /**
     * Generates an enemy character texture
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     * @param {number} width - Canvas width
     * @param {number} height - Canvas height
     * @param {string} [direction='down'] - Character direction
     * @param {number} [frameIndex=0] - Frame index for animation
     */
    generateEnemy(ctx, width, height, direction = 'down', frameIndex = 0) {
        // Body
        ctx.fillStyle = '#8b0000'; // Dark red
        ctx.fillRect(width * 0.25, height * 0.4, width * 0.5, height * 0.5);

        // Head
        ctx.fillStyle = '#a0522d'; // Sienna
        ctx.beginPath();
        ctx.arc(width / 2, height * 0.3, width * 0.2, 0, Math.PI * 2);
        ctx.fill();

        // Horns
        ctx.fillStyle = '#000000';
        ctx.beginPath();
        ctx.moveTo(width * 0.3, height * 0.2);
        ctx.lineTo(width * 0.4, height * 0.1);
        ctx.lineTo(width * 0.45, height * 0.2);
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(width * 0.7, height * 0.2);
        ctx.lineTo(width * 0.6, height * 0.1);
        ctx.lineTo(width * 0.55, height * 0.2);
        ctx.fill();

        // Apply animation if needed
        if (frameIndex > 0) {
            // Simple animation: move legs
            const legOffset = frameIndex % 2 === 0 ? 0 : height * 0.05;

            // Left leg
            ctx.fillStyle = '#000000';
            ctx.fillRect(width * 0.3, height * 0.9 - legOffset, width * 0.1, height * 0.1);

            // Right leg
            ctx.fillRect(width * 0.6, height * 0.9 + legOffset, width * 0.1, height * 0.1);
        } else {
            // Default legs
            ctx.fillStyle = '#000000';
            ctx.fillRect(width * 0.3, height * 0.9, width * 0.1, height * 0.1);
            ctx.fillRect(width * 0.6, height * 0.9, width * 0.1, height * 0.1);
        }

        // Apply direction-specific changes
        switch (direction) {
            case 'left':
                // Face left
                ctx.fillStyle = '#ff0000'; // Red
                ctx.fillRect(width * 0.35, height * 0.3, width * 0.05, height * 0.05);
                break;
            case 'right':
                // Face right
                ctx.fillStyle = '#ff0000'; // Red
                ctx.fillRect(width * 0.6, height * 0.3, width * 0.05, height * 0.05);
                break;
            case 'up':
                // Face up (back of head)
                ctx.fillStyle = '#a0522d'; // Sienna
                ctx.fillRect(width * 0.35, height * 0.2, width * 0.3, height * 0.15);
                break;
            case 'down':
            default:
                // Face down (default)
                ctx.fillStyle = '#ff0000'; // Red
                ctx.fillRect(width * 0.4, height * 0.3, width * 0.05, height * 0.05);
                ctx.fillRect(width * 0.55, height * 0.3, width * 0.05, height * 0.05);
                ctx.beginPath();
                ctx.arc(width / 2, height * 0.35, width * 0.05, Math.PI, Math.PI * 2);
                ctx.stroke();
        }
    }

    /**
     * Gets a specific frame from the spritesheet
     * @param {string} direction - Character direction
     * @param {number} frameIndex - Frame index
     * @returns {Object} Frame information
     */
    getFrame(direction, frameIndex) {
        if (!this.isAnimated || !this.spritesheet) {
            return { image: this.image, sx: 0, sy: 0, sw: this.width, sh: this.height };
        }

        const directionIndex = this.directions.indexOf(direction);
        if (directionIndex === -1) {
            return { image: this.spritesheet, sx: 0, sy: 0, sw: this.width, sh: this.height };
        }

        const actualFrameIndex = frameIndex % this.frames;

        return {
            image: this.spritesheet,
            sx: actualFrameIndex * this.width,
            sy: directionIndex * this.height,
            sw: this.width,
            sh: this.height
        };
    }
}
