/**
 * Renders a miniature map of the game world
 * @class MinimapUI
 * @extends CanvasUI
 */
export class MinimapUI {
    /**
     * Creates a new MinimapUI instance
     * @param {GameInstance} game - Reference to game instance
     * @param {Object} [options={}] - Configuration options
     * @param {number} [options.size=200] - Size of minimap in pixels
     * @param {number} [options.scale=0.1] - Scale factor for world to minimap conversion
     */
    constructor(game, options = {}) {
        this.game = game;
        this.size = options.size || 200;
        this.scale = options.scale || 0.1;

        this.createCanvas();
        this.setupEventListeners();

        // Make minimap visible by default
        this.canvas.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            border: 2px solid #00f2ff;
            border-radius: 4px;
            background: rgba(0, 0, 0, 0.7);
            z-index: 1000;
            box-shadow: 0 0 10px rgba(0, 0, 0, 0.5);
        `;

        // Start render loop
        this.render();
    }

    /**
     * Creates the minimap canvas element
     * @private
     */
    createCanvas() {
        this.canvas = document.createElement('canvas');
        this.canvas.width = this.size;
        this.canvas.height = this.size;
        document.body.appendChild(this.canvas);
        this.ctx = this.canvas.getContext('2d');
    }

    /**
     * Sets up event listeners for minimap interactions
     * @private
     */
    setupEventListeners() {
        this.canvas.addEventListener('click', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            const worldCoords = this.minimapToWorld(x, y);
            if (this.game.pathFinder.isValidCoordinate(worldCoords.x, worldCoords.y)) {
                const path = this.game.pathFinder.findPath(
                    Math.round(this.game.player.x),
                    Math.round(this.game.player.y),
                    worldCoords.x,
                    worldCoords.y
                );
                if (path) {
                    this.game.player.setPath(path);
                }
            }
        });
    }

    /**
     * Renders the minimap
     * @returns {void}
     */
    render() {
        if (!this.ctx || !this.game.world) return;

        this.ctx.clearRect(0, 0, this.size, this.size);

        const world = this.game.world;
        const tileWidth = this.size / world.width;
        const tileHeight = this.size / world.height;

        for (let y = 0; y < world.height; y++) {
            for (let x = 0; x < world.width; x++) {
                const tile = world.getTileAt(x, y);
                if (tile) {
                    this.ctx.fillStyle = this.getTileColor(tile.type);
                    this.ctx.fillRect(x * tileWidth, y * tileHeight, tileWidth, tileHeight);
                }
            }
        }

        // Render player position
        const playerCoords = this.worldToMinimap(this.game.player.x, this.game.player.y);
        this.ctx.fillStyle = '#ff4444';
        this.ctx.beginPath();
        this.ctx.arc(playerCoords.x, playerCoords.y, 5, 0, Math.PI * 2);
        this.ctx.fill();

        // Request next frame
        requestAnimationFrame(() => this.render());
    }

    /**
     * Converts world coordinates to minimap coordinates
     * @param {number} x - World X coordinate
     * @param {number} y - World Y coordinate
     * @returns {{x: number, y: number}} Minimap coordinates
     * @private
     */
    worldToMinimap(x, y) {
        return {
            x: x * this.scale,
            y: y * this.scale
        };
    }

    /**
     * Converts minimap coordinates to world coordinates
     * @param {number} x - Minimap X coordinate
     * @param {number} y - Minimap Y coordinate
     * @returns {{x: number, y: number}} World coordinates
     * @private
     */
    minimapToWorld(x, y) {
        return {
            x: Math.floor(x / this.scale),
            y: Math.floor(y / this.scale)
        };
    }

    /**
     * Gets the color for a tile type
     * @param {string} tileType - Tile type
     * @returns {string} Tile color
     * @private
     */
    getTileColor(tileType) {
        const colors = {
            'water': '#1976D2',
            'wetland': '#558B2F',
            'sand': '#FDD835',
            'dirt': '#795548',
            'grass': '#4CAF50',
            'forest': '#2E7D32',
            'mountain': '#757575',
            'concrete': '#9E9E9E',
            'asphalt': '#424242',
            'metal': '#B0BEC5',
            'tiles': '#78909C',
            'gravel': '#707070',
            'solar': '#1A237E',
            'garden': '#66BB6A',
            'helipad': '#F57F17',
            'parking': '#37474F'
        };
        return colors[tileType] || '#000000';
    }

    /**
     * Toggles the visibility of the minimap
     */
    toggle() {
        if (this.canvas.style.display === 'none') {
            this.canvas.style.display = 'block';
        } else {
            this.canvas.style.display = 'none';
        }
    }
}