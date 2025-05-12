import { PIXI } from '../../utils/PixiWrapper.js';
import { UIComponent } from './UIComponent.js';
import { Button } from './Button.js';

/**
 * StyleToggle - UI component for toggling between visual styles
 */
export class StyleToggle extends UIComponent {
    /**
     * Creates a new style toggle
     * @param {Object} options - Component options
     */
    constructor(options = {}) {
        super(options);

        this.game = options.game;
        this.styleManager = options.styleManager || (this.game ? this.game.styleManager : null);

        // Create background panel with increased height
        const panel = new PIXI.Graphics();
        panel.beginFill(0x000000, 0.9);
        panel.lineStyle(2, 0xFF00FF, 1);
        panel.drawRoundedRect(0, 0, 260, 220, 8); // Increased height from 180 to 220
        panel.endFill();
        this.addChild(panel);

        // Add title
        const title = new PIXI.Text('Visual Style', {
            fontFamily: 'Arial',
            fontSize: 18,
            fontWeight: 'bold',
            fill: 0xFF00FF,
            align: 'center'
        });
        title.anchor.set(0.5, 0);
        title.position.set(130, 15);
        this.addChild(title);

        // Create style buttons with more spacing
        const styles = ['cyberpunk', 'modern', 'retro'];
        const buttonWidth = 200;
        const buttonHeight = 40;
        const buttonSpacing = 15; // Increased from 10 to 15

        styles.forEach((style, index) => {
            const button = new PIXI.Container();
            button.position.set(30, 60 + index * (buttonHeight + buttonSpacing)); // Moved buttons down slightly

            // Button background with hover effect
            const bg = new PIXI.Graphics();
            const updateButtonState = (isHovered, isSelected) => {
                bg.clear();
                bg.lineStyle(2, 0xFF00FF, 1);
                bg.beginFill(isSelected ? 0x330033 : (isHovered ? 0x220022 : 0x000000), 0.9);
                bg.drawRoundedRect(0, 0, buttonWidth, buttonHeight, 8);
                bg.endFill();

                // Add glow effect when selected or hovered
                if (isSelected || isHovered) {
                    const glow = new PIXI.Graphics();
                    glow.beginFill(0xFF00FF, 0.15);
                    glow.drawRoundedRect(-2, -2, buttonWidth + 4, buttonHeight + 4, 10);
                    glow.endFill();
                    button.addChildAt(glow, 0);
                }
            };

            // Initial state
            const isCurrentStyle = this.styleManager && this.styleManager.currentStyle === style;
            updateButtonState(false, isCurrentStyle);
            button.addChild(bg);

            // Button text
            const text = new PIXI.Text(style.charAt(0).toUpperCase() + style.slice(1), {
                fontFamily: 'Arial',
                fontSize: 16,
                fill: isCurrentStyle ? 0xFF00FF : 0xFFFFFF,
                align: 'center'
            });
            text.anchor.set(0.5);
            text.position.set(buttonWidth / 2, buttonHeight / 2);
            button.addChild(text);

            // Make button interactive
            button.interactive = true;
            button.cursor = 'pointer';

            button.on('pointerover', () => updateButtonState(true, isCurrentStyle));
            button.on('pointerout', () => updateButtonState(false, isCurrentStyle));
            button.on('pointerdown', () => {
                if (this.styleManager) {
                    this.styleManager.setStyle(style);
                }
                // Update all buttons
                this.children.forEach(child => {
                    if (child instanceof PIXI.Container && child !== button) {
                        updateButtonState(false, false);
                    }
                });
                updateButtonState(false, true);
            });

            this.addChild(button);
        });
    }

    /**
     * Toggles the visibility of the component
     */
    toggle() {
        console.log('StyleToggle.toggle called, current visibility:', this.visible);
        this.visible = !this.visible;
        console.log('StyleToggle visibility set to:', this.visible);
    }

    /**
     * Updates the component
     * @param {number} deltaTime - Time since last update in seconds
     */
    update(deltaTime) {
        // Nothing to update
    }

    /**
     * Resizes the component
     * @param {number} width - New width
     * @param {number} height - New height
     */
    resize(width, height) {
        // Nothing to resize
    }
}
