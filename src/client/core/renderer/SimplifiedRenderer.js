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
        
        if (distance > this.options.simplifyDistance) {
            // Use simple colored rectangle for distant tiles
            this.ctx.fillStyle = this.getTileColor(tile);
            this.ctx.fillRect(screenX, screenY, tileSize, tileSize);
        } else {
            // Use normal rendering for nearby tiles
            if (tile.texture) {
                this.ctx.drawImage(tile.texture, screenX, screenY, tileSize, tileSize);
            } else {
                // Fallback to colored rectangle
                this.ctx.fillStyle = this.getTileColor(tile);
                this.ctx.fillRect(screenX, screenY, tileSize, tileSize);
            }
        }
        
        this.stats.tilesRendered++;
    }
    
    /**
     * Gets a color for a tile type
     * @param {Object} tile - Tile object
     * @returns {string} CSS color
     */
    getTileColor(tile) {
        // Simple color mapping for tile types
        const colorMap = {
            grass: '#4CAF50',
            water: '#2196F3',
            sand: '#FFC107',
            dirt: '#795548',
            stone: '#9E9E9E',
            snow: '#ECEFF1',
            lava: '#FF5722',
            default: '#CCCCCC'
        };
        
        return colorMap[tile.type] || colorMap.default;
    }
    
    /**
     * Renders an entity
     * @param {Object} entity - Entity to render
     * @param {number} screenX - Screen X position
     * @param {number} screenY - Screen Y position
     * @param {Object} camera - Camera position and zoom
     */
    renderEntity(entity, screenX, screenY, camera) {
        // Calculate distance from camera
        const dx = entity.x - camera.x;
        const dy = entity.y - camera.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // Skip distant entities if we've reached the limit
        if (distance > this.options.simplifyDistance && 
            this.stats.entitiesRendered >= this.options.maxEntities) {
            return;
        }
        
        const entitySize = this.options.entitySize * camera.zoom;
        
        if (distance > this.options.simplifyDistance) {
            // Use simple colored rectangle for distant entities
            this.ctx.fillStyle = this.getEntityColor(entity);
            this.ctx.fillRect(screenX, screenY, entitySize, entitySize);
        } else {
            // Use normal rendering for nearby entities
            if (entity.texture) {
                this.ctx.drawImage(entity.texture, screenX, screenY, entitySize, entitySize);
            } else {
                // Fallback to colored rectangle
                this.ctx.fillStyle = this.getEntityColor(entity);
                this.ctx.fillRect(screenX, screenY, entitySize, entitySize);
            }
            
            // Draw entity name if close enough
            if (distance < 5 && entity.name) {
                this.ctx.fillStyle = '#FFFFFF';
                this.ctx.font = '12px Arial';
                this.ctx.textAlign = 'center';
                this.ctx.fillText(entity.name, screenX + entitySize / 2, screenY - 5);
            }
        }
        
        this.stats.entitiesRendered++;
    }
    
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
    
    /**
     * Renders a structure
     * @param {Object} structure - Structure to render
     * @param {number} screenX - Screen X position
     * @param {number} screenY - Screen Y position
     * @param {Object} camera - Camera position and zoom
     */
    renderStructure(structure, screenX, screenY, camera) {
        // Calculate distance from camera
        const dx = structure.x - camera.x;
        const dy = structure.y - camera.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // Skip distant structures if we've reached the limit
        if (distance > this.options.simplifyDistance && 
            this.stats.structuresRendered >= this.options.maxStructures) {
            return;
        }
        
        const tileSize = this.options.tileSize * camera.zoom;
        const width = structure.width * tileSize;
        const height = structure.height * tileSize;
        
        if (distance > this.options.simplifyDistance) {
            // Use simple colored rectangle for distant structures
            this.ctx.fillStyle = this.getStructureColor(structure);
            this.ctx.fillRect(screenX, screenY, width, height);
        } else {
            // Use normal rendering for nearby structures
            if (structure.texture) {
                this.ctx.drawImage(structure.texture, screenX, screenY, width, height);
            } else {
                // Fallback to colored rectangle
                this.ctx.fillStyle = this.getStructureColor(structure);
                this.ctx.fillRect(screenX, screenY, width, height);
                
                // Draw structure outline
                this.ctx.strokeStyle = '#000000';
                this.ctx.lineWidth = 1;
                this.ctx.strokeRect(screenX, screenY, width, height);
            }
            
            // Draw structure name if close enough
            if (distance < 10 && structure.name) {
                this.ctx.fillStyle = '#FFFFFF';
                this.ctx.font = '14px Arial';
                this.ctx.textAlign = 'center';
                this.ctx.fillText(structure.name, screenX + width / 2, screenY - 5);
            }
        }
        
        this.stats.structuresRendered++;
    }
    
    /**
     * Gets a color for a structure type
     * @param {Object} structure - Structure object
     * @returns {string} CSS color
     */
    getStructureColor(structure) {
        // Simple color mapping for structure types
        const colorMap = {
            house: '#8D6E63',
            shop: '#5D4037',
            tree: '#2E7D32',
            rock: '#616161',
            default: '#795548'
        };
        
        return colorMap[structure.type] || colorMap.default;
    }
    
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
     * Gets rendering statistics
     * @returns {Object} Rendering statistics
     */
    getStats() {
        return { ...this.stats };
    }
}
