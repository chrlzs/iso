import { PIXI } from '../utils/PixiWrapper.js';

/**
 * ModernUrbanEffect - Adds modern urban visual effects to the game
 * Includes subtle ambient occlusion, light bloom, and clean visual style
 */
export class ModernUrbanEffect {
    /**
     * Creates a new modern urban effect
     * @param {Object} options - Effect options
     * @param {PIXI.Application} options.app - The PIXI application
     * @param {number} options.width - The effect width
     * @param {number} options.height - The effect height
     */
    constructor(options = {}) {
        this.app = options.app;
        this.width = options.width || 800;
        this.height = options.height || 600;
        this.enabled = options.enabled !== undefined ? options.enabled : true;
        this.frameCount = 0;
        this.quality = options.quality || 'medium'; // 'low', 'medium', 'high'

        // Create container for effects
        this.container = new PIXI.Container();
        this.container.sortableChildren = true;

        // Create ambient occlusion effect
        this.createAmbientOcclusion();

        // Create subtle bloom effect
        this.createBloom();

        // Create vignette effect (more subtle than synthwave)
        this.createVignette();

        // Set up animation
        if (this.app) {
            this.app.ticker.add(this.update.bind(this));
        }
    }

    /**
     * Creates the ambient occlusion effect
     * @private
     */
    createAmbientOcclusion() {
        // Create graphics for ambient occlusion
        this.aoGraphics = new PIXI.Graphics();
        this.aoGraphics.zIndex = 90;
        this.container.addChild(this.aoGraphics);

        // Draw initial ambient occlusion
        this.updateAmbientOcclusion();
    }

    /**
     * Creates bloom effect
     * @private
     */
    createBloom() {
        // Create graphics for bloom
        this.bloomGraphics = new PIXI.Graphics();
        this.bloomGraphics.zIndex = 95;
        this.container.addChild(this.bloomGraphics);

        // Draw initial bloom
        this.updateBloom();
    }

    /**
     * Creates vignette effect
     * @private
     */
    createVignette() {
        // Create graphics for vignette
        this.vignetteGraphics = new PIXI.Graphics();
        this.vignetteGraphics.zIndex = 100;
        this.container.addChild(this.vignetteGraphics);

        // Draw initial vignette
        this.updateVignette();
    }

    /**
     * Updates the ambient occlusion effect
     * @private
     */
    updateAmbientOcclusion() {
        if (!this.aoGraphics) return;

        this.aoGraphics.clear();

        // Draw subtle ambient occlusion in corners
        const cornerSize = Math.min(this.width, this.height) * 0.3;
        
        // Top-left corner
        this.aoGraphics.beginFill(0x000000, 0.1);
        this.aoGraphics.drawRect(0, 0, cornerSize, cornerSize);
        this.aoGraphics.endFill();
        
        // Top-right corner
        this.aoGraphics.beginFill(0x000000, 0.1);
        this.aoGraphics.drawRect(this.width - cornerSize, 0, cornerSize, cornerSize);
        this.aoGraphics.endFill();
        
        // Bottom-left corner
        this.aoGraphics.beginFill(0x000000, 0.1);
        this.aoGraphics.drawRect(0, this.height - cornerSize, cornerSize, cornerSize);
        this.aoGraphics.endFill();
        
        // Bottom-right corner
        this.aoGraphics.beginFill(0x000000, 0.1);
        this.aoGraphics.drawRect(this.width - cornerSize, this.height - cornerSize, cornerSize, cornerSize);
        this.aoGraphics.endFill();
    }

    /**
     * Updates the bloom effect
     * @private
     */
    updateBloom() {
        if (!this.bloomGraphics) return;

        this.bloomGraphics.clear();

        // Get current time for subtle animation
        const time = performance.now() / 1000;
        const bloomIntensity = 0.05 + Math.sin(time * 0.2) * 0.02;

        // Draw subtle bloom overlay
        this.bloomGraphics.beginFill(0xFFFFFF, bloomIntensity);
        this.bloomGraphics.drawRect(0, 0, this.width, this.height);
        this.bloomGraphics.endFill();
    }

    /**
     * Updates the vignette effect
     * @private
     */
    updateVignette() {
        if (!this.vignetteGraphics) return;

        this.vignetteGraphics.clear();

        // Create radial gradient for vignette
        const centerX = this.width / 2;
        const centerY = this.height / 2;
        const radius = Math.max(this.width, this.height);

        // Draw vignette
        this.vignetteGraphics.beginFill(0x000000, 0);
        this.vignetteGraphics.drawRect(0, 0, this.width, this.height);
        this.vignetteGraphics.endFill();

        // Add radial gradient
        const gradientTexture = this.createGradientTexture();
        if (gradientTexture) {
            const sprite = new PIXI.Sprite(gradientTexture);
            sprite.width = this.width;
            sprite.height = this.height;
            sprite.alpha = 0.3; // More subtle than synthwave
            this.vignetteGraphics.addChild(sprite);
        }
    }

    /**
     * Creates a radial gradient texture for the vignette
     * @returns {PIXI.Texture} The gradient texture
     * @private
     */
    createGradientTexture() {
        if (!this.app || !this.app.renderer) return null;

        // Adjust quality based on quality setting
        let quality;
        switch(this.quality) {
            case 'low':
                quality = 128;
                break;
            case 'medium':
                quality = 192;
                break;
            case 'high':
                quality = 256;
                break;
            default:
                quality = 192;
        }

        // Use cached texture if it exists
        if (this.gradientTexture) {
            return this.gradientTexture;
        }

        const canvas = document.createElement('canvas');
        canvas.width = quality;
        canvas.height = quality;

        const ctx = canvas.getContext('2d');

        // Create radial gradient
        const gradient = ctx.createRadialGradient(
            quality/2, quality/2, 0,
            quality/2, quality/2, quality/2
        );

        // Add color stops
        gradient.addColorStop(0, 'rgba(0,0,0,0)');
        gradient.addColorStop(0.7, 'rgba(0,0,0,0.05)');
        gradient.addColorStop(1, 'rgba(0,0,0,0.3)');

        // Fill with gradient
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, quality, quality);

        // Create texture from canvas and cache it
        this.gradientTexture = PIXI.Texture.from(canvas);
        return this.gradientTexture;
    }

    /**
     * Updates the effect
     * @param {number} deltaTime - Time since last update in seconds
     */
    update(deltaTime) {
        if (!this.enabled) return;

        // Only update visual effects every 30 frames to improve performance
        this.frameCount = (this.frameCount || 0) + 1;
        if (this.frameCount % 30 === 0) {
            // Update bloom
            this.updateBloom();
        }
    }

    /**
     * Resizes the effect
     * @param {number} width - New width
     * @param {number} height - New height
     */
    resize(width, height) {
        this.width = width;
        this.height = height;

        // Update effects
        this.updateAmbientOcclusion();
        this.updateBloom();
        this.updateVignette();
    }

    /**
     * Enables or disables the effect
     * @param {boolean} enabled - Whether the effect is enabled
     */
    setEnabled(enabled) {
        this.enabled = enabled;
        this.container.visible = enabled;
    }

    /**
     * Adds the effect to a container
     * @param {PIXI.Container} container - The container to add the effect to
     */
    addTo(container) {
        if (container) {
            container.addChild(this.container);
        }
    }

    /**
     * Removes the effect from its parent
     */
    remove() {
        if (this.container.parent) {
            this.container.parent.removeChild(this.container);
        }
    }
}
