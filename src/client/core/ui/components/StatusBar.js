export class StatusBar {
    constructor(config) {
        this.position = config.position;
        this.width = config.width;
        this.height = config.height;
        this.game = config.game;
        console.log('StatusBar initialized with config:', config);
    }

    drawBar(ctx, yOffset, label, color, value) {
        const barWidth = this.width - 60;  // Leave space for label
        const barHeight = 15;
        const x = this.position.x;
        const y = this.position.y + yOffset;

        // Draw label
        ctx.fillStyle = '#ffffff';
        ctx.font = '12px Arial';
        ctx.fillText(label, x, y + 12);

        // Draw background
        ctx.fillStyle = '#333333';
        ctx.fillRect(x + 50, y, barWidth, barHeight);

        // Draw value bar
        ctx.fillStyle = color;
        const valueWidth = (value / 100) * barWidth;
        ctx.fillRect(x + 50, y, valueWidth, barHeight);

        // Draw value text
        ctx.fillStyle = '#ffffff';
        ctx.fillText(`${Math.round(value)}%`, x + 50 + barWidth + 5, y + 12);
    }

    render(ctx) {
        //console.log('StatusBar render called');
        
        // Draw background
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(this.position.x, this.position.y, this.width, this.height);

        // Get player stats with proper null checking and defaults
        const stats = {
            health: this.game?.player?.health ?? 100,
            mana: this.game?.player?.mana ?? 100,
            stamina: this.game?.player?.stamina ?? 100
        };

        // Health bar
        this.drawBar(ctx, 0, 'Health', '#ff0000', stats.health);
        
        // Mana bar
        this.drawBar(ctx, 20, 'Mana', '#0000ff', stats.mana);
        
        // Stamina bar
        this.drawBar(ctx, 40, 'Stamina', '#00ff00', stats.stamina);
    }
}

