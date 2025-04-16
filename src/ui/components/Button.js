import { PIXI } from '../../utils/PixiWrapper.js';
import { UIComponent } from './UIComponent.js';

/**
 * Button - A customizable button component
 */
export class Button extends UIComponent {
    /**
     * Creates a new button
     * @param {Object} options - Button options
     */
    constructor(options = {}) {
        super({
            interactive: true,
            ...options
        });

        // Button properties
        this.text = options.text || '';
        this.onClick = options.onClick || null;
        this.enabled = options.enabled !== false;
        this.width = options.width || 100;
        this.height = options.height || 30;
        this.style = {
            fill: options.fill || this.colors.dark,
            hoverFill: options.hoverFill || 0x001122,
            disabledFill: options.disabledFill || 0x111111,
            textColor: options.textColor || this.colors.text,
            borderColor: options.borderColor || this.colors.primary,
            glowColor: options.glowColor || this.colors.primary,
            cornerRadius: options.cornerRadius || 2,
            padding: options.padding || 10
        };

        // Create the button
        this.createButton();

        // Set initial state
        if (!this.enabled) {
            this.disable();
        } else {
            this.enable();
        }
    }

    /**
     * Creates the button graphics
     * @private
     */
    createButton() {
        // Create angular accents
        this.accents = new PIXI.Graphics();
        this.accents.lineStyle(1, this.style.borderColor, 0.5);
        this.addChild(this.accents);

        // Create background with border
        this.background = new PIXI.Graphics();
        this.background.lineStyle(1, this.style.borderColor, 0.8);
        this.addChild(this.background);

        // Create text with glow effect
        this.textObj = new PIXI.Text(this.text, {
            fontFamily: 'Arial',
            fontSize: 14,
            fill: this.style.textColor,
            stroke: this.style.glowColor,
            strokeThickness: 1,
            align: 'center'
        });
        this.textObj.anchor.set(0.5);
        this.addChild(this.textObj);

        // Calculate size based on text if not specified
        if (!this.width) {
            this.width = Math.max(100, this.textObj.width + this.style.padding * 2);
        }
        if (!this.height) {
            this.height = Math.max(30, this.textObj.height + this.style.padding * 2);
        }

        // Create a hitArea to improve click detection
        this.hitArea = new PIXI.Rectangle(0, 0, this.width, this.height);

        // Add angular accents
        this.accents.moveTo(0, 5);
        this.accents.lineTo(5, 0);
        this.accents.moveTo(this.width - 5, 0);
        this.accents.lineTo(this.width, 5);
        this.accents.moveTo(this.width, this.height - 5);
        this.accents.lineTo(this.width - 5, this.height);
        this.accents.moveTo(5, this.height);
        this.accents.lineTo(0, this.height - 5);

        // Draw background with cyberpunk style
        this.background.lineStyle(1, this.style.borderColor, 0.8);
        this.background.beginFill(this.style.fill);
        this.background.drawRect(0, 0, this.width, this.height);
        this.background.endFill();

        // Add highlight line at the top
        this.background.lineStyle(1, 0xFFFFFF, 0.3);
        this.background.moveTo(1, 2);
        this.background.lineTo(this.width - 1, 2);

        // Position text
        this.textObj.position.set(this.width / 2, this.height / 2);

        // Add event listeners with cyberpunk effects
        this.on('pointerover', this.onPointerOver.bind(this));
        this.on('pointerout', this.onPointerOut.bind(this));
        this.on('pointertap', this.onPointerTap.bind(this));
        this.on('pointerdown', this.onPointerDown.bind(this));
        this.on('click', this.onClick.bind(this));
        this.on('mousedown', this.onPointerDown.bind(this));
        this.on('mouseup', this.onPointerTap.bind(this));
    }

    /**
     * Handles pointer over event
     * @private
     */
    onPointerOver() {
        if (this.enabled) {
            this.background.clear();
            this.background.lineStyle(1, this.style.borderColor, 1);
            this.background.beginFill(this.style.hoverFill);
            this.background.drawRect(0, 0, this.width, this.height);
            this.background.endFill();

            // Add glow effect
            if (!this.glow) {
                this.glow = new PIXI.Graphics();
                this.glow.beginFill(this.style.glowColor, 0.1);
                this.glow.drawRect(-2, -2, this.width + 4, this.height + 4);
                this.glow.endFill();
                this.addChildAt(this.glow, 0);
            }

            this.textObj.style.strokeThickness = 2;
        }
    }

    /**
     * Handles pointer out event
     * @private
     */
    onPointerOut() {
        if (this.enabled) {
            this.background.clear();
            this.background.lineStyle(1, this.style.borderColor, 0.8);
            this.background.beginFill(this.style.fill);
            this.background.drawRect(0, 0, this.width, this.height);
            this.background.endFill();

            // Remove glow effect
            if (this.glow) {
                this.removeChild(this.glow);
                this.glow = null;
            }

            this.textObj.style.strokeThickness = 1;
        }
    }

    /**
     * Handles pointer tap event
     * @param {PIXI.InteractionEvent} e - The interaction event
     * @private
     */
    onPointerTap(e) {
        if (this.enabled) {
            this.background.clear();
            this.background.lineStyle(1, this.style.borderColor, 1);
            this.background.beginFill(this.style.hoverFill);
            this.background.drawRect(0, 0, this.width, this.height);
            this.background.endFill();

            // Execute callback
            if (this.onClick) {
                this.onClick();
            }

            // Stop propagation
            e.stopPropagation();
        }
    }

    /**
     * Handles pointer down event
     * @param {PIXI.InteractionEvent} e - The interaction event
     * @private
     */
    onPointerDown(e) {
        if (this.enabled) {
            this.background.clear();
            this.background.lineStyle(1, this.style.borderColor, 0.8);
            this.background.beginFill(this.style.fill);
            this.background.drawRect(2, 2, this.width - 4, this.height - 4);
            this.background.endFill();

            // Stop propagation
            e.stopPropagation();
        }
    }

    /**
     * Enables the button
     */
    enable() {
        this.enabled = true;
        this.interactive = true;
        this.eventMode = 'static';
        this.cursor = 'pointer';

        this.background.clear();
        this.background.lineStyle(1, this.style.borderColor, 0.8);
        this.background.beginFill(this.style.fill);
        this.background.drawRect(0, 0, this.width, this.height);
        this.background.endFill();

        this.textObj.alpha = 1;
        this.accents.alpha = 1;
    }

    /**
     * Disables the button
     */
    disable() {
        this.enabled = false;
        this.interactive = false;
        this.eventMode = 'none';
        this.cursor = 'default';

        this.background.clear();
        this.background.lineStyle(1, this.style.borderColor, 0.3);
        this.background.beginFill(this.style.disabledFill);
        this.background.drawRect(0, 0, this.width, this.height);
        this.background.endFill();

        this.textObj.alpha = 0.5;
        this.accents.alpha = 0.3;

        // Remove glow effect if it exists
        if (this.glow) {
            this.removeChild(this.glow);
            this.glow = null;
        }
    }

    /**
     * Sets the button text
     * @param {string} text - New button text
     */
    setText(text) {
        this.text = text;
        this.textObj.text = text;
    }
}
