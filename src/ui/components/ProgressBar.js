import { PIXI } from '../../utils/PixiWrapper.js';

/**
 * ProgressBar - A customizable progress bar component
 */
export class ProgressBar extends PIXI.Container {
    /**
     * Creates a new progress bar
     * @param {Object} options - Progress bar options
     */
    constructor(options = {}) {
        super();

        // Progress bar properties
        this._value = options.value || 0;
        this._maxValue = options.maxValue || 100;
        this._barWidth = options.width || 100;
        this._barHeight = options.height || 10;
        this._showText = options.showText !== false;

        // Cyberpunk color scheme
        this.colors = {
            primary: 0x00AAFF,    // Neon blue
            secondary: 0x00FFAA,   // Neon cyan
            dark: 0x000811,       // Dark blue-black
            accent: 0xFF00AA,     // Neon pink
            warning: 0xFFAA00,    // Neon orange
            success: 0x33FF66,    // Neon green
            error: 0xFF3366,      // Neon red
            text: 0xFFFFFF,       // White
            healthBar: 0xFF3366,  // Health bar color
            energyBar: 0x33FFAA,  // Energy bar color
            expBar: 0xFF00AA      // Experience bar color
        };

        // Set colors
        this._color = options.color || this.colors.primary;
        this._backgroundColor = options.backgroundColor || this.colors.dark;

        // Set text format function
        this._textFormat = options.textFormat || ((value, max) => `${Math.floor(value)}/${max}`);

        // Set position if provided
        if (options.x !== undefined) this.x = options.x;
        if (options.y !== undefined) this.y = options.y;

        // Create graphics objects
        this._createGraphics();

        // Update the bar
        this._updateBar();
    }

    /**
     * Creates the graphics objects for the progress bar
     * @private
     */
    _createGraphics() {
        // Create container for background
        this.bgContainer = new PIXI.Container();
        this.addChild(this.bgContainer);

        // Create background
        this.background = new PIXI.Graphics();
        this.bgContainer.addChild(this.background);

        // Create container for foreground (with mask)
        this.fgContainer = new PIXI.Container();
        this.addChild(this.fgContainer);

        // Create foreground
        this.foreground = new PIXI.Graphics();
        this.fgContainer.addChild(this.foreground);

        // Create mask for foreground
        this.fgMask = new PIXI.Graphics();
        this.addChild(this.fgMask);
        this.fgContainer.mask = this.fgMask;

        // Create border
        this.border = new PIXI.Graphics();
        this.addChild(this.border);

        // Create text if needed
        if (this._showText) {
            this.text = new PIXI.Text('', {
                fontFamily: 'Arial',
                fontSize: 12,
                fill: 0xFFFFFF,
                stroke: 0x000000,
                strokeThickness: 2,
                align: 'center'
            });
            this.text.anchor.set(0.5);
            this.addChild(this.text);
        }

        // Draw the initial graphics
        this._drawGraphics();
    }

    /**
     * Draws the graphics for the progress bar
     * @private
     */
    _drawGraphics() {
        // Clear all graphics
        this.background.clear();
        this.foreground.clear();
        this.fgMask.clear();
        this.border.clear();

        // Draw background
        this.background.beginFill(this._backgroundColor);
        this.background.drawRect(0, 0, this._barWidth, this._barHeight);
        this.background.endFill();

        // Add subtle grid pattern to background
        this.background.lineStyle(1, this._color, 0.1);
        for (let x = 5; x < this._barWidth; x += 10) {
            this.background.moveTo(x, 0);
            this.background.lineTo(x, this._barHeight);
        }

        // Draw foreground
        this.foreground.beginFill(this._color, 0.8);
        this.foreground.drawRect(0, 0, this._barWidth, this._barHeight);
        this.foreground.endFill();

        // Add highlight line to foreground
        this.foreground.lineStyle(1, 0xFFFFFF, 0.3);
        this.foreground.moveTo(0, 2);
        this.foreground.lineTo(this._barWidth, 2);

        // Draw border
        this.border.lineStyle(1, this._color, 0.8);
        this.border.drawRect(0, 0, this._barWidth, this._barHeight);

        // Draw angular corners
        this.border.lineStyle(1, this._color, 0.5);
        // Top left
        this.border.moveTo(0, 5);
        this.border.lineTo(5, 0);
        // Top right
        this.border.moveTo(this._barWidth - 5, 0);
        this.border.lineTo(this._barWidth, 5);
        // Bottom right
        this.border.moveTo(this._barWidth, this._barHeight - 5);
        this.border.lineTo(this._barWidth - 5, this._barHeight);
        // Bottom left
        this.border.moveTo(5, this._barHeight);
        this.border.lineTo(0, this._barHeight - 5);

        // Position text
        if (this._showText && this.text) {
            this.text.position.set(this._barWidth / 2, this._barHeight / 2);
        }
    }

    /**
     * Updates the progress bar based on current value
     * @private
     */
    _updateBar() {
        // Calculate progress percentage
        const progress = Math.max(0, Math.min(1, this._value / this._maxValue));

        // Update mask to show correct amount of foreground
        this.fgMask.clear();
        this.fgMask.beginFill(0xFFFFFF);
        this.fgMask.drawRect(0, 0, this._barWidth * progress, this._barHeight);
        this.fgMask.endFill();

        // Update text if needed
        if (this._showText && this.text) {
            this.text.text = this._textFormat(this._value, this._maxValue);
        }
    }

    /**
     * Gets the current value
     * @returns {number} Current value
     */
    get value() {
        return this._value;
    }

    /**
     * Sets the current value
     * @param {number} value - New value
     */
    set value(value) {
        this._value = Math.max(0, Math.min(value, this._maxValue));
        this._updateBar();
    }

    /**
     * Gets the maximum value
     * @returns {number} Maximum value
     */
    get maxValue() {
        return this._maxValue;
    }

    /**
     * Sets the maximum value
     * @param {number} value - New maximum value
     */
    set maxValue(value) {
        this._maxValue = Math.max(1, value);
        this._updateBar();
    }

    /**
     * Gets the bar width
     * @returns {number} Bar width
     */
    get barWidth() {
        return this._barWidth;
    }

    /**
     * Sets the bar width
     * @param {number} width - New bar width
     */
    set barWidth(width) {
        this._barWidth = width;
        this._drawGraphics();
        this._updateBar();
    }

    /**
     * Gets the bar height
     * @returns {number} Bar height
     */
    get barHeight() {
        return this._barHeight;
    }

    /**
     * Sets the bar height
     * @param {number} height - New bar height
     */
    set barHeight(height) {
        this._barHeight = height;
        this._drawGraphics();
        this._updateBar();
    }

    /**
     * Sets the current value of the progress bar
     * @param {number} value - Current value
     * @param {number} maxValue - Maximum value (optional)
     */
    setValue(value, maxValue = null) {
        this._value = Math.max(0, Math.min(value, this._maxValue));

        if (maxValue !== null) {
            this._maxValue = Math.max(1, maxValue);
        }

        this._updateBar();
    }

    /**
     * Updates the progress bar
     * @param {number} deltaTime - Time since last update in seconds
     */
    update(deltaTime) {
        // Add any animation or update logic here
    }

    /**
     * Resizes the progress bar
     * @param {number} width - New width
     * @param {number} height - New height (optional)
     */
    resize(width, height = null) {
        this._barWidth = width;

        if (height !== null) {
            this._barHeight = height;
        }

        this._drawGraphics();
        this._updateBar();
    }
}
