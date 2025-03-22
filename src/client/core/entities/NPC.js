export class NPC {
    constructor(config) {
        this.x = config.x;
        this.y = config.y;
        this.name = config.name;
        this.size = config.size || 20;
        this.color = config.color || '#FF0000';
        this.state = 'idle';
        this.stateTimer = 2000;
    }

    render(ctx, renderer) {
        if (!renderer) return;
        
        // Get isometric coordinates
        const isoPos = renderer.convertToIsometric(this.x, this.y);
        
        // Draw shadow
        ctx.beginPath();
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.ellipse(isoPos.x, isoPos.y + 2, this.size / 2, this.size / 4, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw NPC circle
        ctx.beginPath();
        ctx.fillStyle = this.color;
        ctx.arc(isoPos.x, isoPos.y - this.size/2, this.size / 2, 0, Math.PI * 2);
        ctx.fill();
        
        // Add outline
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Draw name above NPC
        ctx.fillStyle = '#FFFFFF';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(this.name, isoPos.x, isoPos.y - this.size - 5);
    }
}


