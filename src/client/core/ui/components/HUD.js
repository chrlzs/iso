import { CanvasUI } from './CanvasUI.js';

/**
 * Manages the heads-up display elements
 * @class HUD
 * @extends CanvasUI
 */
export class HUD extends CanvasUI {
    /**
     * Creates a new HUD instance
     * @param {GameInstance} game - Reference to game instance
     * @param {Object} [options={}] - HUD configuration options
     */
    constructor(game, options = {}) {
        super(game, options);
        this.setupHUDElements();
    }

    /**
     * Sets up default HUD elements
     * @private
     */
    setupHUDElements() {
        // Add coordinates display
        this.addElement('coordinates', {
            render: (ctx) => this.renderCoordinates(ctx),
            position: { x: 10, y: 30 }
        });

        // Add time display
        this.addElement('timeDisplay', {
            render: (ctx) => this.renderTimeDisplay(ctx),
            position: { x: 10, y: 50 }
        });
    }

    /**
     * Renders player coordinates
     * @param {CanvasRenderingContext2D} ctx - The canvas rendering context
     * @private
     */
    renderCoordinates(ctx) {
        const player = this.game.player;
        if (!player) return;

        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(10, 10, 150, 25);
        ctx.fillStyle = '#ffffff';
        ctx.fillText(
            `Position: ${Math.floor(player.x)}, ${Math.floor(player.y)}`,
            15,
            25
        );
    }

    /**
     * Renders game time display
     * @param {CanvasRenderingContext2D} ctx - The canvas rendering context
     * @private
     */
    renderTimeDisplay(ctx) {
        const gameHour = this.game.getGameHour();
        const hours = Math.floor(gameHour);
        const minutes = Math.floor((gameHour % 1) * 60);

        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(10, 40, 100, 25);
        ctx.fillStyle = '#ffffff';
        ctx.fillText(
            `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`,
            15,
            55
        );
    }
}
