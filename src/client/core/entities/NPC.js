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
}

