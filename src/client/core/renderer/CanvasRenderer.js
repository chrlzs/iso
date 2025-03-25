
/**
 * Handles rendering of the game world to a canvas
 * @class CanvasRenderer
 */
export class CanvasRenderer {
    /**
     * Creates a new CanvasRenderer instance
     * @param {HTMLCanvasElement} canvas - The canvas element to render to
     */
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.tileWidth = 64;
        this.tileHeight = 32;
        // Log only once during initialization
        console.log('CanvasRenderer initialized with canvas:', canvas.width, 'x', canvas.height);
    }

    /**
     * Sets the current transform for rendering
     * @param {Object} transform - The transform object from camera
     * @param {number} transform.scale - Scale factor
     * @param {number} transform.offsetX - X offset
     * @param {number} transform.offsetY - Y offset
     */
    setTransform(transform) {
        this.ctx.setTransform(
            transform.scale, 0,
            0, transform.scale,
            this.canvas.width / 2 + transform.offsetX,
            this.canvas.height / 2 + transform.offsetY
        );
    }

    /**
     * Clears the entire canvas
     */
    clear() {
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }

    /**
     * Converts isometric coordinates to screen coordinates
     * @param {number} x - Isometric x coordinate
     * @param {number} y - Isometric y coordinate
     * @returns {{x: number, y: number}} Screen coordinates
     */
    isoToScreen(x, y) {
        return {
            x: (x - y) * this.tileWidth / 2,
            y: (x + y) * this.tileHeight / 2
        };
    }

    /**
     * Converts screen coordinates to isometric coordinates
     * @param {number} screenX - Screen x coordinate
     * @param {number} screenY - Screen y coordinate
     * @returns {{x: number, y: number}} Isometric coordinates
     */
    screenToIso(screenX, screenY) {
        const x = (screenX / this.tileWidth + screenY / this.tileHeight) / 2;
        const y = (screenY / this.tileHeight - screenX / this.tileWidth) / 2;
        return { x, y };
    }

    /**
     * Gets the visible tiles based on camera position
     * @param {Object} camera - Camera object
     * @param {number} worldWidth - World width in tiles
     * @param {number} worldHeight - World height in tiles
     * @returns {Array<{x: number, y: number}>} Array of visible tile coordinates
     */
    getVisibleTiles(camera, worldWidth, worldHeight) {
        const tiles = [];
        const startX = Math.max(0, Math.floor(camera.x - this.canvas.width / this.tileWidth));
        const startY = Math.max(0, Math.floor(camera.y - this.canvas.height / this.tileHeight));
        const endX = Math.min(worldWidth, startX + this.canvas.width / this.tileWidth + 2);
        const endY = Math.min(worldHeight, startY + this.canvas.height / this.tileHeight + 2);

        for (let y = startY; y < endY; y++) {
            for (let x = startX; x < endX; x++) {
                tiles.push({ x, y });
            }
        }
        return tiles;
    }

    /**
     * Renders the entire world
     * @param {World} world - The world to render
     * @param {TileManager} tileManager - TileManager instance for tile properties
     * @param {Camera} camera - Camera instance for view transformation
     */
    renderWorld(world, tileManager, camera) {
        const visibleTiles = this.getVisibleTiles(camera, world.width, world.height);

        for (const { x, y } of visibleTiles) {
            const tile = world.getTile(x, y);
            if (tile) {
                this.drawTile(x, y, tile, tileManager);
            }
        }
    }

    /**
     * Draws a single tile
     * @param {number} x - Tile x coordinate
     * @param {number} y - Tile y coordinate
     * @param {Object} tile - The tile object to draw
     * @param {TileManager} tileManager - TileManager instance for tile properties
     */
    drawTile(x, y, tile, tileManager) {
        const isoX = (x - y) * (this.tileWidth / 2);
        const isoY = (x + y) * (this.tileHeight / 2);

        // Draw base tile shape
        this.ctx.beginPath();
        this.ctx.moveTo(isoX, isoY - this.tileHeight / 2);
        this.ctx.lineTo(isoX + this.tileWidth / 2, isoY);
        this.ctx.lineTo(isoX, isoY + this.tileHeight / 2);
        this.ctx.lineTo(isoX - this.tileWidth / 2, isoY);
        this.ctx.closePath();

        // Fill with tile color
        this.ctx.fillStyle = this.getTileColor(tile);
        this.ctx.fill();

        // Add tile border
        this.ctx.strokeStyle = 'rgba(0,0,0,0.2)';
        this.ctx.stroke();

        // Draw decoration if present
        if (tile.decoration) {
            this.drawDecoration(isoX, isoY, tile.decoration);
        }
    }

    getTileColor(tile) {
        const colors = {
            'water': '#4A90E2',
            'sand': '#F5A623',
            'grass': '#7ED321',
            'wetland': '#417505',
            'dirt': '#8B572A',
            'stone': '#9B9B9B',
            'asphalt': '#4A4A4A',
            'concrete': '#9B9B9B'
        };
        return colors[tile.type] || '#FF0000';
    }

    drawDecoration(x, y, decoration) {
        const decorSize = this.tileWidth / 4;
        
        this.ctx.save();
        switch (decoration.type) {
            case 'flowers':
                this.drawFlowers(x, y, decorSize);
                break;
            case 'rocks':
                this.drawRocks(x, y, decorSize);
                break;
            case 'grassTufts':
                this.drawGrassTufts(x, y, decorSize);
                break;
        }
        this.ctx.restore();
    }

    drawFlowers(x, y, size) {
        const colors = ['#FF69B4', '#FFD700', '#FF6B6B', '#87CEEB'];
        for (let i = 0; i < 4; i++) {
            const offsetX = (Math.random() - 0.5) * size;
            const offsetY = (Math.random() - 0.5) * size;
            
            this.ctx.fillStyle = colors[i % colors.length];
            this.ctx.beginPath();
            this.ctx.arc(x + offsetX, y + offsetY, size/4, 0, Math.PI * 2);
            this.ctx.fill();
        }
    }

    drawRocks(x, y, size) {
        const rockColors = ['#808080', '#696969', '#A9A9A9'];
        for (let i = 0; i < 3; i++) {
            const offsetX = (Math.random() - 0.5) * size;
            const offsetY = (Math.random() - 0.5) * size;
            
            this.ctx.fillStyle = rockColors[i % rockColors.length];
            this.ctx.beginPath();
            this.ctx.ellipse(
                x + offsetX, 
                y + offsetY, 
                size/3, 
                size/4, 
                Math.random() * Math.PI, 
                0, 
                Math.PI * 2
            );
            this.ctx.fill();
        }
    }

    drawGrassTufts(x, y, size) {
        const grassColors = ['#7ED321', '#417505'];
        for (let i = 0; i < 5; i++) {
            const offsetX = (Math.random() - 0.5) * size;
            const offsetY = (Math.random() - 0.5) * size;
            
            this.ctx.strokeStyle = grassColors[i % 2];
            this.ctx.lineWidth = 2;
            this.ctx.beginPath();
            this.ctx.moveTo(x + offsetX, y + offsetY);
            this.ctx.quadraticCurveTo(
                x + offsetX + (Math.random() - 0.5) * size/2,
                y + offsetY - size/2,
                x + offsetX + (Math.random() - 0.5) * size,
                y + offsetY - size
            );
            this.ctx.stroke();
        }
    }
}


