export class NPC {
    constructor(config) {
        this.x = config.x || 0;
        this.y = config.y || 0;
        this.name = config.name || 'NPC';
        this.size = config.size || 32;
        this.color = config.color || '#8B4513';
        this.world = config.world;
        this.currentStructure = null;
        this.isVisible = true;

        // If world is provided, check if spawning inside a structure
        if (this.world) {
            const structures = this.world.getAllStructures();
            this.currentStructure = structures.find(structure => 
                this.x >= structure.x && 
                this.x < structure.x + structure.width &&
                this.y >= structure.y && 
                this.y < structure.y + structure.height
            );

            if (this.currentStructure) {
                console.log(`${this.name} spawned inside structure at (${this.x}, ${this.y})`);
            }
        }
    }

    update(deltaTime) {
        // Get current structure if any
        if (this.world) {
            const structures = this.world.getAllStructures();
            this.currentStructure = structures.find(structure => 
                this.x >= structure.x && 
                this.x < structure.x + structure.width &&
                this.y >= structure.y && 
                this.y < structure.y + structure.height
            );
        }
    }

    render(ctx, renderer) {
        if (!this.isVisible) return;
        // Convert world coordinates to isometric coordinates
        const isoX = (this.x - this.y) * (renderer.tileWidth / 2);
        const isoY = (this.x + this.y) * (renderer.tileHeight / 2);
        
        // Draw NPC using canvas primitives
        ctx.save();
        
        // Draw body
        ctx.beginPath();
        ctx.fillStyle = this.color;
        ctx.ellipse(
            isoX, 
            isoY - this.size/2, 
            this.size/3, 
            this.size/2, 
            0, 
            0, 
            Math.PI * 2
        );
        ctx.fill();
        
        // Draw head
        ctx.beginPath();
        ctx.fillStyle = '#FFE0BD';  // Skin tone
        ctx.arc(
            isoX, 
            isoY - this.size, 
            this.size/4, 
            0, 
            Math.PI * 2
        );
        ctx.fill();
        
        // Draw name
        ctx.fillStyle = '#FFFFFF';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(
            this.name, 
            isoX, 
            isoY - this.size - 10
        );
        
        ctx.restore();
    }

    updateVisibility(playerStructure) {
        // If NPC is not in a structure, always visible
        if (!this.currentStructure) {
            this.isVisible = true;
            return;
        }

        // If player is in the same structure as NPC, visible
        // Otherwise, NPC should be hidden
        this.isVisible = (this.currentStructure === playerStructure);
    }

    findNearestDoor(structure) {
        if (!structure) return null;
        
        // Search the structure's perimeter for door tiles
        for (let y = structure.y; y < structure.y + structure.height; y++) {
            for (let x = structure.x; x < structure.x + structure.width; x++) {
                // Only check perimeter tiles
                if (x > structure.x && x < structure.x + structure.width - 1 &&
                    y > structure.y && y < structure.y + structure.height - 1) {
                    continue;
                }
                
                const tile = this.world.getTileAt(x, y);
                if (tile && tile.type === 'door') {
                    return { x, y };
                }
            }
        }
        return null;
    }

    async moveTo(targetX, targetY) {
        const currentStructure = this.currentStructure;
        const targetTile = this.world.getTileAt(targetX, targetY);
        const targetStructure = targetTile?.structure;

        // If entering or exiting a structure, find the nearest door
        if (currentStructure !== targetStructure) {
            const door = this.findNearestDoor(currentStructure || targetStructure);
            if (door) {
                // First move to the door
                await this.pathfindTo(door.x, door.y);
                // Then move to final destination
                await this.pathfindTo(targetX, targetY);
                return;
            }
        }

        // Regular movement if not crossing structure boundaries
        await this.pathfindTo(targetX, targetY);
    }

    async pathfindTo(x, y) {
        if (!this.world || !this.world.pathFinder) return;
        
        const path = this.world.pathFinder.findPath(
            Math.round(this.x),
            Math.round(this.y),
            Math.round(x),
            Math.round(y)
        );

        if (path) {
            // Implement movement along path
            for (const point of path) {
                this.x = point.x;
                this.y = point.y;
                // Add delay or animation between moves
                await new Promise(resolve => setTimeout(resolve, 100));
            }
        }
    }
}


