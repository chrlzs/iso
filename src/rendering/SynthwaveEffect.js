import { PIXI } from '../utils/PixiWrapper.js';

/**
 * SynthwaveEffect - Adds synthwave/outrun visual effects to the game
 * Includes grid background, scan lines, and color effects
 */
export class SynthwaveEffect {
    /**
     * Creates a new synthwave effect
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
        this.showGrid = options.showGrid !== undefined ? options.showGrid : true;
        this.showScanLines = options.showScanLines !== undefined ? options.showScanLines : true;
        this.showVignette = options.showVignette !== undefined ? options.showVignette : true;

        // Create container for effects
        this.container = new PIXI.Container();
        this.container.sortableChildren = true;

        // Create grid background
        this.createGridBackground();

        // Create scan lines
        this.createScanLines();

        // Create vignette effect
        this.createVignette();

        // Set up animation
        if (this.app) {
            this.app.ticker.add(this.update.bind(this));
        }
    }

    /**
     * Creates the grid background effect
     * @private
     */
    createGridBackground() {
        // Create graphics for grid
        this.gridGraphics = new PIXI.Graphics();
        this.gridGraphics.zIndex = -10;
        this.container.addChild(this.gridGraphics);

        // Set visibility based on showGrid option
        this.gridGraphics.visible = this.showGrid;

        // Draw initial grid
        this.updateGrid();
    }

    /**
     * Creates scan line effect
     * @private
     */
    createScanLines() {
        // Create graphics for scan lines
        this.scanLinesGraphics = new PIXI.Graphics();
        this.scanLinesGraphics.zIndex = 100;
        this.container.addChild(this.scanLinesGraphics);

        // Set visibility based on showScanLines option
        this.scanLinesGraphics.visible = this.showScanLines;

        // Draw initial scan lines
        this.updateScanLines();
    }

    /**
     * Creates vignette effect
     * @private
     */
    createVignette() {
        // Create graphics for vignette
        this.vignetteGraphics = new PIXI.Graphics();
        this.vignetteGraphics.zIndex = 90;
        this.container.addChild(this.vignetteGraphics);

        // Set visibility based on showVignette option
        this.vignetteGraphics.visible = this.showVignette;

        // Draw initial vignette
        this.updateVignette();
    }

    /**
     * Updates the grid background
     * @private
     */
    updateGrid() {
        if (!this.gridGraphics) return;

        this.gridGraphics.clear();

        // Get current time for animation
        const time = performance.now() / 1000;
        const gridOffset = Math.sin(time * 0.5) * 10;

        // Adjust detail level based on quality setting
        let horizSpacing, vertSpacing;

        switch(this.quality) {
            case 'low':
                horizSpacing = 80;
                vertSpacing = 80;
                break;
            case 'medium':
                horizSpacing = 60;
                vertSpacing = 60;
                break;
            case 'high':
                horizSpacing = 40;
                vertSpacing = 40;
                break;
            default:
                horizSpacing = 60;
                vertSpacing = 60;
        }

        // Draw horizontal grid lines - using parallel lines instead of perspective
        this.gridGraphics.lineStyle(1, 0xFF00FF, 0.3);

        // Draw horizontal grid lines (parallel)
        for (let y = 0; y <= this.height; y += horizSpacing) {
            this.gridGraphics.moveTo(0, y);
            this.gridGraphics.lineTo(this.width, y);
        }

        // Draw vertical grid lines (parallel)
        this.gridGraphics.lineStyle(1, 0x00FFFF, 0.3);
        for (let x = 0; x <= this.width; x += vertSpacing) {
            this.gridGraphics.moveTo(x, 0);
            this.gridGraphics.lineTo(x, this.height);
        }

        // Sun/horizon overlay has been removed to focus on the game map
    }

    /**
     * Updates the scan lines effect
     * @private
     */
    updateScanLines() {
        if (!this.scanLinesGraphics) return;

        this.scanLinesGraphics.clear();

        // Get current time for animation
        const time = performance.now() / 1000;
        const scanLineOffset = (time * 20) % 4;

        // Adjust scan line spacing based on quality setting
        let lineSpacing;
        switch(this.quality) {
            case 'low':
                lineSpacing = 8;
                break;
            case 'medium':
                lineSpacing = 6;
                break;
            case 'high':
                lineSpacing = 4;
                break;
            default:
                lineSpacing = 6;
        }

        // Draw scan lines
        this.scanLinesGraphics.beginFill(0x000000, 0.1);
        for (let y = scanLineOffset; y < this.height; y += lineSpacing) {
            this.scanLinesGraphics.drawRect(0, y, this.width, 1);
        }
        this.scanLinesGraphics.endFill();
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
            sprite.alpha = 0.5;
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
        gradient.addColorStop(0.5, 'rgba(0,0,0,0.1)');
        gradient.addColorStop(1, 'rgba(0,0,0,0.7)');

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

        // Only update visual effects every 10 frames to improve performance
        this.frameCount = (this.frameCount || 0) + 1;
        if (this.frameCount % 10 === 0) {
            // Update grid
            this.updateGrid();

            // Update scan lines
            this.updateScanLines();
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
        this.updateGrid();
        this.updateScanLines();
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
     * Toggles the grid visibility
     * @param {boolean} visible - Whether the grid is visible
     */
    setGridVisible(visible) {
        this.showGrid = visible;
        if (this.gridGraphics) {
            this.gridGraphics.visible = visible;
        }
    }

    /**
     * Toggles the scan lines visibility
     * @param {boolean} visible - Whether the scan lines are visible
     */
    setScanLinesVisible(visible) {
        this.showScanLines = visible;
        if (this.scanLinesGraphics) {
            this.scanLinesGraphics.visible = visible;
        }
    }

    /**
     * Toggles the vignette visibility
     * @param {boolean} visible - Whether the vignette is visible
     */
    setVignetteVisible(visible) {
        this.showVignette = visible;
        if (this.vignetteGraphics) {
            this.vignetteGraphics.visible = visible;
        }
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
