export class StatusBar {
    constructor(config) {
        this.position = config.position;
        this.width = config.width;
        this.height = config.height;
        this.game = config.game;
    }

    update(deltaTime) {
        // Update logic here if needed
    }

    drawBar(ctx, yOffset, label, color, value) {
        const barHeight = 15;
        const x = this.position.x;
        const y = this.position.y + yOffset;
        
        // Draw background
        ctx.fillStyle = '#333333';
        ctx.fillRect(x, y, this.width, barHeight);
        
        // Draw value bar
        ctx.fillStyle = color;
        ctx.fillRect(x, y, this.width * (value / 100), barHeight);
        
        // Draw border
        ctx.strokeStyle = '#ffffff';
        ctx.strokeRect(x, y, this.width, barHeight);
        
        // Draw label
        ctx.fillStyle = '#ffffff';
        ctx.font = '12px Arial';
        ctx.fillText(`${label}: ${value}%`, x + 5, y + 12);
    }

    render(ctx) {
        // Health bar
        this.drawBar(ctx, 0, 'Health', '#ff0000', this.game.player.health || 100);
        
        // Mana bar
        this.drawBar(ctx, 20, 'Mana', '#0000ff', this.game.player.mana || 100);
        
        // Stamina bar
        this.drawBar(ctx, 40, 'Stamina', '#00ff00', this.game.player.stamina || 100);
    }
}
