/**
 * MinimalRenderer - Extremely simplified renderer for critical performance situations
 */
export class MinimalRenderer {
    /**
     * Creates a new minimal renderer
     * @param {HTMLCanvasElement} canvas - Canvas element
     * @param {Object} options - Renderer options
     */
    constructor(canvas, options = {}) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        
        this.options = {
            tileSize: 16,
            entitySize: 8,
            maxEntities: 5,
            maxTiles: 100,
            gridSize: 32,
            ...options
        };
        
        this.stats = {
            drawCalls: 0,
            entitiesRendered: 0,
            tilesRendered: 0,
            frameTime: 0
        };
    }
    
    /**
     * Clears the canvas
     */
    clear() {
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        this.stats.drawCalls = 0;
        this.stats.entitiesRendered = 0;
        this.stats.tilesRendered = 0;
    }
    
    /**
     * Renders the game world in minimal mode
     * @param {Object} gameInstance - Game instance
     */
    render(gameInstance) {
        const startTime = performance.now();
        
        // Clear canvas
        this.clear();
        
        // Get camera position
        const camera = gameInstance.camera;
        if (!camera) return;
        
        // Draw grid
        this.drawGrid(camera);
        
        // Draw player
        if (gameInstance.player) {
            this.drawPlayer(gameInstance.player, camera);
        }
        
        // Draw minimal entities
        if (gameInstance.world && gameInstance.world.entities) {
            this.drawEntities(gameInstance.world.entities, camera);
        }
        
        // Draw FPS counter
        this.drawFPS(gameInstance.currentFPS);
        
        // Update stats
        this.stats.frameTime = performance.now() - startTime;
    }
    
    /**
     * Draws a simple grid
     * @param {Object} camera - Camera
     */
    drawGrid(camera) {
        const { ctx, options } = this;
        const { gridSize } = options;
        
        // Calculate grid offset
        const offsetX = -camera.x % gridSize;
        const offsetY = -camera.y % gridSize;
        
        // Draw grid lines
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        
        // Vertical lines
        for (let x = offsetX; x < this.canvas.width; x += gridSize) {
            ctx.moveTo(x, 0);
            ctx.lineTo(x, this.canvas.height);
        }
        
        // Horizontal lines
        for (let y = offsetY; y < this.canvas.height; y += gridSize) {
            ctx.moveTo(0, y);
            ctx.lineTo(this.canvas.width, y);
        }
        
        ctx.stroke();
        this.stats.drawCalls++;
    }
    
    /**
     * Draws the player
     * @param {Object} player - Player entity
     * @param {Object} camera - Camera
     */
    drawPlayer(player, camera) {
        const { ctx, options } = this;
        const { entitySize } = options;
        
        // Calculate screen position
        const screenX = this.canvas.width / 2;
        const screenY = this.canvas.height / 2;
        
        // Draw player
        ctx.fillStyle = '#0F0';
        ctx.fillRect(screenX - entitySize / 2, screenY - entitySize / 2, entitySize, entitySize);
        
        // Draw direction indicator
        ctx.fillStyle = '#FFF';
        ctx.beginPath();
        ctx.arc(screenX, screenY - entitySize / 2, 2, 0, Math.PI * 2);
        ctx.fill();
        
        this.stats.drawCalls++;
        this.stats.entitiesRendered++;
    }
    
    /**
     * Draws entities
     * @param {Array} entities - Entities to draw
     * @param {Object} camera - Camera
     */
    drawEntities(entities, camera) {
        const { ctx, options } = this;
        const { entitySize, maxEntities } = options;
        
        // Sort entities by importance and distance to player
        const sortedEntities = entities
            .filter(entity => entity && entity.isVisible && entity !== camera.target)
            .sort((a, b) => {
                // Important entities first
                if (a.isImportant && !b.isImportant) return -1;
                if (!a.isImportant && b.isImportant) return 1;
                
                // Then by distance to camera
                const aDist = Math.pow(a.x - camera.x, 2) + Math.pow(a.y - camera.y, 2);
                const bDist = Math.pow(b.x - camera.x, 2) + Math.pow(b.y - camera.y, 2);
                return aDist - bDist;
            })
            .slice(0, maxEntities);
        
        // Draw entities
        for (const entity of sortedEntities) {
            // Calculate screen position
            const screenX = (entity.x - camera.x) + this.canvas.width / 2;
            const screenY = (entity.y - camera.y) + this.canvas.height / 2;
            
            // Skip if off screen
            if (screenX < -entitySize || screenX > this.canvas.width + entitySize ||
                screenY < -entitySize || screenY > this.canvas.height + entitySize) {
                continue;
            }
            
            // Draw entity
            ctx.fillStyle = this.getEntityColor(entity);
            ctx.fillRect(screenX - entitySize / 2, screenY - entitySize / 2, entitySize, entitySize);
            
            this.stats.entitiesRendered++;
        }
        
        this.stats.drawCalls++;
    }
    
    /**
     * Gets a color for an entity based on its type
     * @param {Object} entity - Entity
     * @returns {string} Color
     */
    getEntityColor(entity) {
        if (!entity.type) return '#AAA';
        
        switch (entity.type.toLowerCase()) {
            case 'npc':
            case 'merchant':
                return '#00F';
            case 'enemy':
                return '#F00';
            case 'item':
                return '#FF0';
            case 'structure':
            case 'building':
                return '#888';
            default:
                return '#AAA';
        }
    }
    
    /**
     * Draws the FPS counter
     * @param {number} fps - Current FPS
     */
    drawFPS(fps) {
        const { ctx } = this;
        
        ctx.fillStyle = fps < 5 ? '#F00' : fps < 15 ? '#FF0' : '#0F0';
        ctx.font = '14px monospace';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.fillText(`FPS: ${Math.round(fps)}`, 10, 10);
        
        this.stats.drawCalls++;
    }
    
    /**
     * Disposes of renderer resources
     */
    dispose() {
        // Nothing to dispose in this simple renderer
    }
}
