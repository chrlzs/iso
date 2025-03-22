export class NPC {
    constructor(config) {
        this.x = config.x;
        this.y = config.y;
        this.name = config.name;
        this.size = config.size || 20;
        this.color = config.color || '#FF0000';
        this.state = 'idle';
        this.stateTimer = 2000;
        
        // Sprite properties
        this.spriteSheet = new Image();
        this.spriteSheet.src = 'assets/characters/npc_character.png';
        this.spriteSheet.onload = () => {
            this.imageLoaded = true;
            this.frameWidth = this.spriteSheet.width / 12;
            this.frameHeight = this.spriteSheet.height / 8;
        };

        // Animation properties
        this.direction = 'south';
        this.frameX = 0;
        this.frameY = 0;
        this.frameCount = 0;
        this.animationSpeed = 8;
        this.imageLoaded = false;

        // Define animation rows (0-based index)
        this.directions = {
            'south': 0,
            'southeast': 1,
            'southwest': 2,
            'west': 3,
            'northwest': 4,
            'north': 5,
            'northeast': 6,
            'east': 7
        };
    }

    render(ctx, renderer) {
        if (!renderer) return;
        
        const isoPos = renderer.convertToIsometric(this.x, this.y);
        
        // Draw shadow
        ctx.beginPath();
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.ellipse(isoPos.x, isoPos.y + 2, this.size / 2, this.size / 4, 0, 0, Math.PI * 2);
        ctx.fill();
        
        if (this.imageLoaded) {
            // Draw sprite
            ctx.drawImage(
                this.spriteSheet,
                this.frameX * this.frameWidth,
                this.frameY * this.frameHeight,
                this.frameWidth,
                this.frameHeight,
                isoPos.x - this.frameWidth / 2,
                isoPos.y - this.frameHeight,
                this.frameWidth,
                this.frameHeight
            );
            
            // Draw name above sprite
            ctx.fillStyle = '#FFFFFF';
            ctx.font = '12px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(this.name, isoPos.x, isoPos.y - this.frameHeight - 5);
        } else {
            // Fallback rendering
            ctx.beginPath();
            ctx.fillStyle = this.color;
            ctx.arc(isoPos.x, isoPos.y - this.size/2, this.size / 2, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#000000';
            ctx.lineWidth = 2;
            ctx.stroke();
            
            // Draw name above circle
            ctx.fillStyle = '#FFFFFF';
            ctx.font = '12px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(this.name, isoPos.x, isoPos.y - this.size - 5);
        }
    }
}




