/**
 * Manages and renders player status information
 * @class StatusUI
 * @extends UIComponent
 */
export class StatusUI {
    /**
     * Creates a new StatusUI instance
     * @param {GameInstance} gameInstance - Reference to the main game instance
     * @param {Object} [options={}] - Configuration options
     * @param {number} [options.width=200] - Width of status panel
     * @param {number} [options.height=100] - Height of status panel
     */
    constructor(gameInstance, options = {}) {
        this.game = gameInstance;
        this.width = options.width || 200;
        this.height = options.height || 100;
        this.position = {
            x: 10,
            y: 10
        };

        this.createStatusPanel();
    }

    /**
     * Creates the status panel DOM elements
     * @private
     */
    createStatusPanel() {
        this.container = document.createElement('div');
        this.container.className = 'status-panel';
        this.container.style.cssText = `
            position: fixed;
            top: ${this.position.y}px;
            left: ${this.position.x}px;
            width: ${this.width}px;
            background: rgba(0, 0, 0, 0.7);
            border: 2px solid #00f2ff;
            border-radius: 8px;
            padding: 10px;
            color: #fff;
            z-index: 1000;
        `;

        this.healthBar = this.createBar('health-bar', '#ff4444');
        this.energyBar = this.createBar('energy-bar', '#44ff44');
        this.effectsContainer = this.createEffectsContainer();

        this.container.appendChild(this.healthBar);
        this.container.appendChild(this.energyBar);
        this.container.appendChild(this.effectsContainer);

        document.body.appendChild(this.container);
    }

    /**
     * Creates a status bar element
     * @param {string} className - CSS class for the bar
     * @param {string} color - Bar fill color
     * @returns {HTMLElement} The created bar element
     * @private
     */
    createBar(className, color) {
        const barContainer = document.createElement('div');
        barContainer.className = `status-bar ${className}`;
        barContainer.style.cssText = `
            width: 100%;
            height: 20px;
            background: rgba(0, 0, 0, 0.5);
            border-radius: 4px;
            margin: 5px 0;
            overflow: hidden;
            position: relative;
        `;

        const fill = document.createElement('div');
        fill.className = 'bar-fill';
        fill.style.cssText = `
            width: 100%;
            height: 100%;
            background: ${color};
            transition: width 0.3s ease;
        `;

        const label = document.createElement('div');
        label.className = 'bar-label';
        label.style.cssText = `
            position: absolute;
            width: 100%;
            text-align: center;
            line-height: 20px;
            color: #fff;
            text-shadow: 1px 1px 2px #000;
        `;

        barContainer.appendChild(fill);
        barContainer.appendChild(label);
        return barContainer;
    }

    /**
     * Creates the effects display container
     * @returns {HTMLElement} The effects container element
     * @private
     */
    createEffectsContainer() {
        const container = document.createElement('div');
        container.className = 'status-effects';
        container.style.cssText = `
            display: flex;
            gap: 5px;
            margin-top: 10px;
        `;
        return container;
    }

    /**
     * Updates the status display
     * @param {number} deltaTime - Time elapsed since last update
     * @returns {void}
     */
    update(deltaTime) {
        if (!this.game.player) return;

        const player = this.game.player;
        this.updateBar(this.healthBar, player.health, player.maxHealth, 'Health');
        this.updateBar(this.energyBar, player.energy, player.maxEnergy, 'Energy');
        this.updateEffects(player.activeEffects);
    }

    /**
     * Updates a status bar's fill and label
     * @param {HTMLElement} bar - The bar element to update
     * @param {number} current - Current value
     * @param {number} max - Maximum value
     * @param {string} label - Bar label text
     * @private
     */
    updateBar(bar, current, max, label) {
        const percentage = (current / max) * 100;
        const fill = bar.querySelector('.bar-fill');
        const labelElement = bar.querySelector('.bar-label');
        
        fill.style.width = `${percentage}%`;
        labelElement.textContent = `${label}: ${Math.floor(current)}/${max}`;
    }

    /**
     * Updates the status effects display
     * @param {Array<Object>} effects - Active effects to display
     * @private
     */
    updateEffects(effects = []) {
        this.effectsContainer.innerHTML = '';
        effects.forEach(effect => {
            const effectIcon = document.createElement('div');
            effectIcon.className = 'effect-icon';
            effectIcon.style.cssText = `
                width: 24px;
                height: 24px;
                background: rgba(0, 0, 0, 0.5);
                border: 1px solid ${effect.color || '#fff'};
                border-radius: 4px;
                display: flex;
                align-items: center;
                justify-content: center;
            `;
            effectIcon.title = `${effect.name}: ${effect.description}`;
            this.effectsContainer.appendChild(effectIcon);
        });
    }
}
