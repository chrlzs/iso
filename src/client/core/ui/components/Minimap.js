export class Minimap {
    constructor(config) {
        this.position = config.position;
        this.size = config.size;
        this.game = config.game;
        
        // Scale factor for converting world coordinates to minimap coordinates
        this.scale = this.size / Math.max(this.game.world.width, this.game.world.height);
    }

    render(ctx) {
        // Draw minimap background
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(this.position.x, this.position.y, this.size, this.size);

        // Draw border
        ctx.strokeStyle = '#ffffff';
        ctx.strokeRect(this.position.x, this.position.y, this.size, this.size);

        // Calculate visible range in world coordinates
        const viewRange = 32; // How many tiles to show in each direction
        const centerX = Math.floor(this.game.player.x);
        const centerY = Math.floor(this.game.player.y);
        
        // Render tiles around the player
        for (let y = centerY - viewRange; y <= centerY + viewRange; y++) {
            for (let x = centerX - viewRange; x <= centerX + viewRange; x++) {
                // Skip if outside world bounds
                if (x < 0 || x >= this.game.world.width || y < 0 || y >= this.game.world.height) {
                    continue;
                }

                // Get height and moisture for this position
                const height = this.game.world.generateHeight(x, y);
                const moisture = this.game.world.generateMoisture(x, y);
                
                // Generate tile using World's generateTile method
                const tile = this.game.world.generateTile(x, y, height, moisture);

                if (tile) {
                    // Convert world coordinates to minimap coordinates
                    const minimapX = this.position.x + x * this.scale;
                    const minimapY = this.position.y + y * this.scale;

                    ctx.fillStyle = this.getTileColor(tile.type);
                    ctx.fillRect(minimapX, minimapY, this.scale + 0.5, this.scale + 0.5);
                }
            }
        }

        // Draw player position
        const playerX = this.position.x + this.game.player.x * this.scale;
        const playerY = this.position.y + this.game.player.y * this.scale;

        // Draw player indicator
        ctx.fillStyle = '#ff0000';
        ctx.beginPath();
        ctx.arc(playerX, playerY, 3, 0, Math.PI * 2);
        ctx.fill();
    }

    getTileColor(tileType) {
        const colors = {
            grass: '#2d5a27',
            dirt: '#8b4513',
            stone: '#808080',
            sand: '#f4a460',
            water: '#4169e1',
            wetland: '#2f4f4f'
        };
        return colors[tileType] || '#ffffff';
    }

    update(deltaTime) {
        // Update logic here if needed
    }
}



