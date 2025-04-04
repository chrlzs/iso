/**
 * TextureAtlas - Manages texture packing into a single atlas for efficient rendering
 */
export class TextureAtlas {
    /**
     * Creates a new texture atlas
     * @param {number} width - Width of the atlas
     * @param {number} height - Height of the atlas
     * @param {string} name - Name of the atlas
     */
    constructor(width = 2048, height = 2048, name = 'atlas') {
        this.width = width;
        this.height = height;
        this.name = name;
        this.canvas = document.createElement('canvas');
        this.canvas.width = width;
        this.canvas.height = height;
        this.ctx = this.canvas.getContext('2d');
        this.image = null;
        this.isReady = false;
        this.textureMap = new Map(); // Maps texture IDs to atlas coordinates
        this.packer = new RectanglePacker(width, height);
        this.dirty = false;
    }

    /**
     * Adds a texture to the atlas
     * @param {string} id - Unique identifier for the texture
     * @param {HTMLImageElement|HTMLCanvasElement} texture - The texture to add
     * @returns {Object|null} Atlas coordinates or null if texture couldn't be added
     */
    addTexture(id, texture) {
        if (this.textureMap.has(id)) {
            return this.textureMap.get(id);
        }

        const width = texture.width;
        const height = texture.height;
        
        // Find space in the atlas
        const position = this.packer.pack(width, height);
        if (!position) {
            console.warn(`TextureAtlas: No space for texture ${id} (${width}x${height})`);
            return null;
        }

        // Add texture to the atlas
        this.ctx.drawImage(texture, position.x, position.y, width, height);
        
        // Store texture coordinates
        const coords = {
            x: position.x,
            y: position.y,
            width,
            height,
            u0: position.x / this.width,
            v0: position.y / this.height,
            u1: (position.x + width) / this.width,
            v1: (position.y + height) / this.height
        };
        
        this.textureMap.set(id, coords);
        this.dirty = true;
        
        return coords;
    }

    /**
     * Gets texture coordinates from the atlas
     * @param {string} id - Texture identifier
     * @returns {Object|null} Atlas coordinates or null if texture not found
     */
    getTextureCoords(id) {
        return this.textureMap.get(id) || null;
    }

    /**
     * Finalizes the atlas and creates an image
     * @returns {Promise<HTMLImageElement>} The atlas image
     */
    async finalize() {
        if (!this.dirty && this.image) {
            return this.image;
        }

        return new Promise((resolve) => {
            this.image = new Image();
            this.image.onload = () => {
                this.isReady = true;
                this.dirty = false;
                resolve(this.image);
            };
            this.image.src = this.canvas.toDataURL('image/png');
        });
    }

    /**
     * Clears the atlas
     */
    clear() {
        this.ctx.clearRect(0, 0, this.width, this.height);
        this.textureMap.clear();
        this.packer = new RectanglePacker(this.width, this.height);
        this.isReady = false;
        this.dirty = true;
    }
}

/**
 * Simple rectangle packing algorithm for texture atlas
 */
class RectanglePacker {
    constructor(width, height) {
        this.width = width;
        this.height = height;
        this.root = { x: 0, y: 0, width, height };
        this.nodes = [this.root];
    }

    /**
     * Packs a rectangle into the atlas
     * @param {number} width - Width of the rectangle
     * @param {number} height - Height of the rectangle
     * @returns {Object|null} Position or null if no space available
     */
    pack(width, height) {
        // Add 1px padding to avoid texture bleeding
        width += 1;
        height += 1;
        
        // Find a node that can fit this rectangle
        for (let i = 0; i < this.nodes.length; i++) {
            const node = this.nodes[i];
            
            // Skip nodes that are too small
            if (node.width < width || node.height < height) {
                continue;
            }
            
            // Perfect fit
            if (node.width === width && node.height === height) {
                const position = { x: node.x, y: node.y };
                this.nodes.splice(i, 1); // Remove this node
                return position;
            }
            
            // Split the node
            const newNode = { x: node.x, y: node.y, width, height };
            
            // Adjust the remaining space
            if (node.width - width > node.height - height) {
                // Split horizontally
                this.nodes.push({
                    x: node.x + width,
                    y: node.y,
                    width: node.width - width,
                    height: node.height
                });
                
                this.nodes[i] = {
                    x: node.x,
                    y: node.y + height,
                    width: width,
                    height: node.height - height
                };
            } else {
                // Split vertically
                this.nodes.push({
                    x: node.x,
                    y: node.y + height,
                    width: node.width,
                    height: node.height - height
                });
                
                this.nodes[i] = {
                    x: node.x + width,
                    y: node.y,
                    width: node.width - width,
                    height: height
                };
            }
            
            return newNode;
        }
        
        // No space found
        return null;
    }
}
