export class Minimap {
    constructor(config) {
        this.position = config.position;
        this.size = config.size;
        this.game = config.game;
        this.scale = this.size / Math.max(this.game.world.width, this.game.world.height);
    }

    getTileColor(tile) {
        // If tile has a structure, return structure color
        if (tile.structure) {
            const structureColors = {
                'apartment': '#808080',  // Modern gray
                'nightclub': '#FF1493',  // Deep pink for neon effect
                'office': '#4682B4',     // Steel blue
                'wall': '#696969',       // Dim gray
                'door': '#FFD700'        // Gold color for doors
            };
            
            // If the structure component is a door, return door color
            if (tile.structure.type === 'door') {
                return structureColors.door;
            }
            
            return structureColors[tile.structure.type] || '#DAA520'; // Default: Goldenrod
        }

        // Original tile colors
        const colors = {
            grass: '#2d5a27',
            dirt: '#8b4513',
            stone: '#808080',
            sand: '#f4a460',
            water: '#4169e1',
            wetland: '#2f4f4f'
        };
        return colors[tile.type] || '#ffffff';
    }

    render(ctx) {
        // Draw minimap background
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(this.position.x, this.position.y, this.size, this.size);

        // Draw border
        ctx.strokeStyle = '#ffffff';
        ctx.strokeRect(this.position.x, this.position.y, this.size, this.size);

        // Calculate visible range in world coordinates
        const viewRange = 32;
        const centerX = Math.floor(this.game.player.x);
        const centerY = Math.floor(this.game.player.y);
        
        // Render tiles around the player
        for (let y = centerY - viewRange; y <= centerY + viewRange; y++) {
            for (let x = centerX - viewRange; x <= centerX + viewRange; x++) {
                // Skip if outside world bounds
                if (x < 0 || x >= this.game.world.width || y < 0 || y >= this.game.world.height) {
                    continue;
                }

                const tile = this.game.world.getTileAt(x, y);
                if (tile) {
                    const minimapX = this.position.x + x * this.scale;
                    const minimapY = this.position.y + y * this.scale;

                    // Draw tile
                    ctx.fillStyle = this.getTileColor(tile);
                    ctx.fillRect(minimapX, minimapY, this.scale + 0.5, this.scale + 0.5);

                    // Add border for structures
                    if (tile.structure) {
                        ctx.strokeStyle = '#FFD700';
                        ctx.strokeRect(minimapX, minimapY, this.scale + 0.5, this.scale + 0.5);
                    }
                }
            }
        }

        // Draw player position
        const playerX = this.position.x + this.game.player.x * this.scale;
        const playerY = this.position.y + this.game.player.y * this.scale;

        ctx.fillStyle = '#ff0000';
        ctx.beginPath();
        ctx.arc(playerX, playerY, 3, 0, Math.PI * 2);
        ctx.fill();
    }
}








