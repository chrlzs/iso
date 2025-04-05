/**
 * SimplifiedRenderer - A simplified renderer for low-end devices
 */
export class SimplifiedRenderer {
    /**
     * Creates a new simplified renderer
     * @param {HTMLCanvasElement} canvas - The canvas element to render to
     * @param {Object} options - Renderer options
     */
    constructor(canvas, options = {}) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.options = {
            tileSize: 32,
            entitySize: 32,
            simplifyDistance: 15,
            maxEntities: 30,
            maxStructures: 20,
            ...options
        };

        // Rendering state
        this.isReady = true;
        this.stats = {
            entitiesRendered: 0,
            structuresRendered: 0,
            tilesRendered: 0
        };
    }

    /**
     * Clears the canvas
     */
    clear() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Reset stats
        this.stats.entitiesRendered = 0;
        this.stats.structuresRendered = 0;
        this.stats.tilesRendered = 0;
    }

    /**
     * Converts world coordinates to isometric screen coordinates
     * @param {number} x - World X coordinate
     * @param {number} y - World Y coordinate
     * @param {number} tileSize - Size of a tile
     * @returns {Object} Screen coordinates {x, y}
     */
    worldToScreen(x, y, tileSize) {
        // Isometric projection (2:1 ratio)
        const screenX = (x - y) * tileSize / 2;
        const screenY = (x + y) * tileSize / 4;
        return { x: screenX, y: screenY };
    }

    /**
     * Converts screen coordinates to world coordinates
     * @param {number} screenX - Screen X coordinate
     * @param {number} screenY - Screen Y coordinate
     * @param {number} tileSize - Size of a tile
     * @returns {Object} World coordinates {x, y}
     */
    screenToWorld(screenX, screenY, tileSize) {
        // Inverse isometric projection
        const x = (screenX / (tileSize / 2) + screenY / (tileSize / 4)) / 2;
        const y = (screenY / (tileSize / 4) - screenX / (tileSize / 2)) / 2;
        return { x, y };
    }

    /**
     * Renders a tile
     * @param {Object} tile - Tile to render
     * @param {number} x - X position
     * @param {number} y - Y position
     * @param {number} screenX - Screen X position
     * @param {number} screenY - Screen Y position
     * @param {Object} camera - Camera position and zoom
     */
    renderTile(tile, x, y, screenX, screenY, camera) {
        // Calculate distance from camera
        const dx = x - camera.x;
        const dy = y - camera.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        // Simplified rendering for distant tiles
        const tileSize = this.options.tileSize * camera.zoom;

        // Draw a simple colored diamond for the tile (isometric view)
        this.ctx.fillStyle = this.getTileColor(tile);

        // Draw isometric diamond shape
        this.ctx.beginPath();
        this.ctx.moveTo(screenX, screenY - tileSize / 4); // Top point
        this.ctx.lineTo(screenX + tileSize / 2, screenY); // Right point
        this.ctx.lineTo(screenX, screenY + tileSize / 4); // Bottom point
        this.ctx.lineTo(screenX - tileSize / 2, screenY); // Left point
        this.ctx.closePath();
        this.ctx.fill();

        // Add a subtle outline
        this.ctx.strokeStyle = 'rgba(0,0,0,0.2)';
        this.ctx.lineWidth = 0.5;
        this.ctx.stroke();

        this.stats.tilesRendered++;
    }

    /**
     * Gets a color for a tile based on its type
     * @param {Object} tile - Tile to get color for
     * @returns {string} Color
     */
    getTileColor(tile) {
        if (!tile || !tile.type) return '#000000';

        switch (tile.type.toLowerCase()) {
            case 'grass': return '#4CAF50';
            case 'water': return '#2196F3';
            case 'sand': return '#FFC107';
            case 'dirt': return '#795548';
            case 'stone': return '#9E9E9E';
            case 'snow': return '#ECEFF1';
            case 'lava': return '#FF5722';
            default: return '#9CCC65';
        }
    }

    /**
     * Renders an entity
     * @param {Object} entity - Entity to render
     * @param {number} screenX - Screen X position
     * @param {number} screenY - Screen Y position
     * @param {Object} camera - Camera position and zoom
     */
    renderEntity(entity, screenX, screenY, camera) {
        if (!entity) return;

        const entitySize = this.options.entitySize * camera.zoom;

        // Draw a simple colored diamond for the entity (isometric view)
        this.ctx.fillStyle = this.getEntityColor(entity);

        // Draw isometric diamond shape
        this.ctx.beginPath();
        this.ctx.moveTo(screenX, screenY - entitySize / 2); // Top point
        this.ctx.lineTo(screenX + entitySize / 2, screenY); // Right point
        this.ctx.lineTo(screenX, screenY + entitySize / 2); // Bottom point
        this.ctx.lineTo(screenX - entitySize / 2, screenY); // Left point
        this.ctx.closePath();
        this.ctx.fill();

        // Add a subtle outline
        this.ctx.strokeStyle = 'rgba(0,0,0,0.3)';
        this.ctx.lineWidth = 1;
        this.ctx.stroke();

        // Draw entity name if available
        if (entity.name) {
            this.renderText(entity.name, screenX, screenY - entitySize, {
                font: '12px Arial',
                color: '#FFFFFF',
                align: 'center',
                baseline: 'bottom'
            });
        }
    }

    /**
     * Gets a color for an entity based on its type
     * @param {Object} entity - Entity to get color for
     * @returns {string} Color
     */
    getEntityColor(entity) {
        if (!entity) return '#FFFFFF';

        if (entity.isPlayer) return '#FF0000';

        switch (entity.type?.toLowerCase()) {
            case 'npc': return '#2196F3';
            case 'enemy': return '#F44336';
            case 'merchant': return '#FFC107';
            case 'item': return '#9C27B0';
            default: return '#FFFFFF';
        }
    }

    /**
     * Renders a structure
     * @param {Object} structure - Structure to render
     * @param {number} screenX - Screen X position
     * @param {number} screenY - Screen Y position
     * @param {Object} camera - Camera position and zoom
     */
    renderStructure(structure, screenX, screenY, camera) {
        if (!structure) return;

        const width = (structure.width || 1) * this.options.tileSize * camera.zoom;
        const height = (structure.height || 1) * this.options.tileSize * camera.zoom;

        // Draw a simple colored diamond for the structure (isometric view)
        this.ctx.fillStyle = this.getStructureColor(structure);

        // Calculate diamond dimensions based on width and height
        const diamondWidth = width;
        const diamondHeight = height / 2; // Adjust for isometric view

        // Draw isometric diamond shape
        this.ctx.beginPath();
        this.ctx.moveTo(screenX, screenY - diamondHeight); // Top point
        this.ctx.lineTo(screenX + diamondWidth / 2, screenY); // Right point
        this.ctx.lineTo(screenX, screenY + diamondHeight); // Bottom point
        this.ctx.lineTo(screenX - diamondWidth / 2, screenY); // Left point
        this.ctx.closePath();
        this.ctx.fill();

        // Add a subtle outline
        this.ctx.strokeStyle = 'rgba(0,0,0,0.4)';
        this.ctx.lineWidth = 1;
        this.ctx.stroke();

        // Draw structure name if available
        if (structure.name) {
            this.renderText(structure.name, screenX, screenY - height / 2, {
                font: '14px Arial',
                color: '#FFFFFF',
                align: 'center',
                baseline: 'bottom'
            });
        }
    }

    /**
     * Gets a color for a structure based on its type
     * @param {Object} structure - Structure to get color for
     * @returns {string} Color
     */
    getStructureColor(structure) {
        if (!structure) return '#9E9E9E';

        switch (structure.type?.toLowerCase()) {
            case 'house': return '#8D6E63';
            case 'shop': return '#FFB74D';
            case 'inn': return '#A1887F';
            case 'temple': return '#B39DDB';
            case 'castle': return '#78909C';
            case 'tower': return '#90A4AE';
            case 'wall': return '#607D8B';
            default: return '#9E9E9E';
        }
    }

    /**
     * Renders UI elements
     * @param {Object} ui - UI manager
     * @param {Object} camera - Camera position and zoom
     */
    renderUI(ui, camera) {
        // Simplified UI rendering
        // Draw a health bar
        const healthBarWidth = 200;
        const healthBarHeight = 20;
        const healthBarX = 10;
        const healthBarY = this.canvas.height - 30;

        // Background
        this.ctx.fillStyle = '#333333';
        this.ctx.fillRect(healthBarX, healthBarY, healthBarWidth, healthBarHeight);

        // Health
        const healthPercent = ui.player?.health / ui.player?.maxHealth || 0.5;
        this.ctx.fillStyle = '#4CAF50';
        this.ctx.fillRect(healthBarX, healthBarY, healthBarWidth * healthPercent, healthBarHeight);

        // Border
        this.ctx.strokeStyle = '#FFFFFF';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(healthBarX, healthBarY, healthBarWidth, healthBarHeight);
    }

    // This is a duplicate method that was causing syntax errors - removed

    // This is a duplicate method that was causing syntax errors - removed

    /**
     * Gets a color for an entity type
     * @param {Object} entity - Entity object
     * @returns {string} CSS color
     */
    getEntityColor(entity) {
        // Simple color mapping for entity types
        const colorMap = {
            player: '#FF0000',
            npc: '#00FF00',
            enemy: '#FF00FF',
            item: '#FFFF00',
            default: '#FFFFFF'
        };

        return colorMap[entity.type] || colorMap.default;
    }

    // This is a duplicate method that was causing syntax errors - removed

    // This is a duplicate method that was causing syntax errors - removed

    /**
     * Renders text
     * @param {string} text - Text to render
     * @param {number} x - X position
     * @param {number} y - Y position
     * @param {Object} options - Text options
     */
    renderText(text, x, y, options = {}) {
        const {
            font = '14px Arial',
            color = '#FFFFFF',
            align = 'left',
            baseline = 'top',
            maxWidth = null
        } = options;

        this.ctx.font = font;
        this.ctx.fillStyle = color;
        this.ctx.textAlign = align;
        this.ctx.textBaseline = baseline;

        if (maxWidth) {
            this.ctx.fillText(text, x, y, maxWidth);
        } else {
            this.ctx.fillText(text, x, y);
        }
    }

    /**
     * Renders a UI element
     * @param {Object} element - UI element to render
     */
    renderUIElement(element) {
        const { type, x, y, width, height, color, text, image } = element;

        switch (type) {
            case 'rect':
                this.ctx.fillStyle = color || '#FFFFFF';
                this.ctx.fillRect(x, y, width, height);
                break;

            case 'text':
                this.renderText(text, x, y, element);
                break;

            case 'image':
                if (image) {
                    this.ctx.drawImage(image, x, y, width, height);
                }
                break;

            case 'button':
                // Draw button background
                this.ctx.fillStyle = color || '#4CAF50';
                this.ctx.fillRect(x, y, width, height);

                // Draw button border
                this.ctx.strokeStyle = '#000000';
                this.ctx.lineWidth = 1;
                this.ctx.strokeRect(x, y, width, height);

                // Draw button text
                if (text) {
                    this.renderText(text, x + width / 2, y + height / 2, {
                        font: element.font || '14px Arial',
                        color: element.textColor || '#FFFFFF',
                        align: 'center',
                        baseline: 'middle'
                    });
                }
                break;
        }
    }

    /**
     * Renders the game world in simplified mode
     * @param {Object} gameInstance - Game instance
     */
    render(gameInstance) {
        try {
            // Clear the canvas
            this.clear();

            // Get camera and world
            const camera = gameInstance.camera;
            const world = gameInstance.world;

            if (!camera || !world) return;

            // Draw a simple background
            this.ctx.fillStyle = '#333333';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

            // Calculate visible area
            const visibleWidth = this.canvas.width / camera.zoom;
            const visibleHeight = this.canvas.height / camera.zoom;

            const minX = Math.floor(camera.x - visibleWidth / 2);
            const minY = Math.floor(camera.y - visibleHeight / 2);
            const maxX = Math.ceil(camera.x + visibleWidth / 2);
            const maxY = Math.ceil(camera.y + visibleHeight / 2);

            // Render visible tiles
            for (let y = minY; y <= maxY; y++) {
                for (let x = minX; x <= maxX; x++) {
                    const tile = world.getTileAt ? world.getTileAt(x, y) : (world.getTile ? world.getTile(x, y) : null);
                    if (tile) {
                        // Calculate isometric screen position
                        const tileSize = this.options.tileSize * camera.zoom;
                        const isoPos = this.worldToScreen(x - camera.x, y - camera.y, tileSize);
                        const screenX = isoPos.x + this.canvas.width / 2;
                        const screenY = isoPos.y + this.canvas.height / 2;

                        // Render tile
                        this.renderTile(tile, x, y, screenX, screenY, camera);
                    }
                }
            }

            // Render structures
            if (world.structures && Array.isArray(world.structures)) {
                const visibleStructures = world.structures
                    .filter(structure => {
                        if (!structure || typeof structure.x !== 'number' || typeof structure.y !== 'number') return false;
                        return structure.x >= minX - 5 && structure.x <= maxX + 5 &&
                               structure.y >= minY - 5 && structure.y <= maxY + 5;
                    })
                    .slice(0, this.options.maxStructures);

                for (const structure of visibleStructures) {
                    // Calculate isometric screen position
                    const tileSize = this.options.tileSize * camera.zoom;
                    const isoPos = this.worldToScreen(structure.x - camera.x, structure.y - camera.y, tileSize);
                    const screenX = isoPos.x + this.canvas.width / 2;
                    const screenY = isoPos.y + this.canvas.height / 2;

                    // Render structure
                    this.renderStructure(structure, screenX, screenY, camera);
                    this.stats.structuresRendered++;
                }
            }

            // Render entities
            if (world.entities && Array.isArray(world.entities)) {
                const visibleEntities = world.entities
                    .filter(entity => {
                        if (!entity || !entity.isVisible) return false;
                        if (typeof entity.x !== 'number' || typeof entity.y !== 'number') return false;

                        return entity.x >= minX - 2 && entity.x <= maxX + 2 &&
                               entity.y >= minY - 2 && entity.y <= maxY + 2;
                    })
                    .slice(0, this.options.maxEntities);

                for (const entity of visibleEntities) {
                    // Calculate isometric screen position
                    const tileSize = this.options.tileSize * camera.zoom;
                    const isoPos = this.worldToScreen(entity.x - camera.x, entity.y - camera.y, tileSize);
                    const screenX = isoPos.x + this.canvas.width / 2;
                    const screenY = isoPos.y + this.canvas.height / 2;

                    // Render entity
                    this.renderEntity(entity, screenX, screenY, camera);
                    this.stats.entitiesRendered++;
                }
            }

            // Render player
            if (gameInstance.player) {
                const player = gameInstance.player;

                // Calculate screen position (player is always at center)
                const screenX = this.canvas.width / 2;
                const screenY = this.canvas.height / 2;

                // Render player
                this.renderEntity(player, screenX, screenY, camera);
                this.stats.entitiesRendered++;
            }

            // Render UI
            if (gameInstance.ui) {
                // Render UI elements
                this.renderUI(gameInstance.ui, camera);
            }

            // Render FPS counter
            if (gameInstance.debug?.flags?.showFPS) {
                this.renderText(`FPS: ${gameInstance.currentFPS || 0}`, 10, 20, {
                    font: '14px monospace',
                    color: '#FFFFFF',
                    align: 'left',
                    baseline: 'top'
                });
            }
        } catch (error) {
            // Log error but don't crash
            console.error('Error in simplified renderer:', error);

            // Draw error message on canvas
            this.ctx.fillStyle = '#333';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

            this.ctx.fillStyle = '#F00';
            this.ctx.font = '16px monospace';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('Renderer Error', this.canvas.width / 2, this.canvas.height / 2 - 20);
            this.ctx.fillText('Check console for details', this.canvas.width / 2, this.canvas.height / 2 + 20);
        }
    }

    /**
     * Gets rendering statistics
     * @returns {Object} Rendering statistics
     */
    getStats() {
        return { ...this.stats };
    }
}
