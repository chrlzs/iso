export class StructureRenderer {
    constructor(ctx, tileWidth = 64, tileHeight = 32) {
        this.ctx = ctx;
        this.tileWidth = tileWidth;
        this.tileHeight = tileHeight;
        this.heightOffset = tileHeight / 3;
    }

    render(structure, screenX, screenY) {
        this.ctx.save();
        const adjustedX = screenX;
        const adjustedY = screenY - (structure.height * this.heightOffset / 3);
        const baseHeight = 1.2; // Slightly lower walls to accommodate roof
        const scale = 0.8;
        
        this.drawFoundation(structure, adjustedX, adjustedY, scale);
        this.drawWalls(structure, adjustedX, adjustedY, baseHeight, scale);
        this.drawPeakedRoof(structure, adjustedX, adjustedY, baseHeight, scale);
        
        this.ctx.restore();
    }

    drawFoundation(structure, screenX, screenY, scale = 0.8) {
        this.ctx.fillStyle = '#8B7355';
        this.ctx.strokeStyle = '#6B5335';
        this.ctx.lineWidth = 1;
        
        const width = this.tileWidth * structure.width * scale;
        
        this.ctx.beginPath();
        this.ctx.moveTo(screenX, screenY);
        this.ctx.lineTo(screenX + width / 2, screenY + this.tileHeight * scale / 2);
        this.ctx.lineTo(screenX, screenY + this.tileHeight * scale);
        this.ctx.lineTo(screenX - width / 2, screenY + this.tileHeight * scale / 2);
        this.ctx.closePath();
        
        this.ctx.fill();
        this.ctx.stroke();
    }

    drawWalls(structure, screenX, screenY, baseHeight, scale = 0.8) {
        const width = this.tileWidth * structure.width * scale;
        const wallHeight = baseHeight * this.heightOffset;

        // Front wall (slightly lighter)
        this.ctx.fillStyle = '#D2B48C';
        this.ctx.strokeStyle = '#A67B5B';
        this.ctx.lineWidth = 1;
        
        this.ctx.beginPath();
        this.ctx.moveTo(screenX - width / 2, screenY + this.tileHeight * scale / 2);
        this.ctx.lineTo(screenX, screenY + this.tileHeight * scale);
        this.ctx.lineTo(screenX, screenY + this.tileHeight * scale - wallHeight);
        this.ctx.lineTo(screenX - width / 2, screenY + this.tileHeight * scale / 2 - wallHeight);
        this.ctx.closePath();
        this.ctx.fill();
        this.ctx.stroke();

        // Side wall (slightly darker)
        this.ctx.fillStyle = '#C3A379';
        this.ctx.beginPath();
        this.ctx.moveTo(screenX, screenY + this.tileHeight * scale);
        this.ctx.lineTo(screenX + width / 2, screenY + this.tileHeight * scale / 2);
        this.ctx.lineTo(screenX + width / 2, screenY + this.tileHeight * scale / 2 - wallHeight);
        this.ctx.lineTo(screenX, screenY + this.tileHeight * scale - wallHeight);
        this.ctx.closePath();
        this.ctx.fill();
        this.ctx.stroke();
    }

    drawPeakedRoof(structure, screenX, screenY, baseHeight, scale = 0.8) {
        const width = this.tileWidth * structure.width * scale;
        const wallHeight = baseHeight * this.heightOffset;
        const roofHeight = this.heightOffset * 0.8; // Height of roof peak
        
        // Calculate roof points
        const baseY = screenY + this.tileHeight * scale - wallHeight;
        const peakY = baseY - roofHeight;
        
        // Front roof face (darker)
        this.ctx.fillStyle = '#8B4513';
        this.ctx.strokeStyle = '#6B3513';
        this.ctx.lineWidth = 1;
        
        this.ctx.beginPath();
        // Left edge
        this.ctx.moveTo(screenX - width / 2, screenY + this.tileHeight * scale / 2 - wallHeight);
        // Bottom right
        this.ctx.lineTo(screenX, screenY + this.tileHeight * scale - wallHeight);
        // Peak
        this.ctx.lineTo(screenX, peakY);
        this.ctx.closePath();
        this.ctx.fill();
        this.ctx.stroke();

        // Right roof face (even darker for contrast)
        this.ctx.fillStyle = '#654321';
        this.ctx.beginPath();
        // Bottom left
        this.ctx.moveTo(screenX, screenY + this.tileHeight * scale - wallHeight);
        // Right edge
        this.ctx.lineTo(screenX + width / 2, screenY + this.tileHeight * scale / 2 - wallHeight);
        // Peak
        this.ctx.lineTo(screenX, peakY);
        this.ctx.closePath();
        this.ctx.fill();
        this.ctx.stroke();

        // Optional: Add roof ridge line
        this.ctx.strokeStyle = '#5C3317';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.moveTo(screenX - width / 4, screenY + this.tileHeight * scale / 2 - wallHeight - roofHeight / 2);
        this.ctx.lineTo(screenX + width / 4, screenY + this.tileHeight * scale / 2 - wallHeight - roofHeight / 2);
        this.ctx.stroke();

        // Optional: Add roof texture lines (shingles effect)
        this.ctx.strokeStyle = '#5C3317';
        this.ctx.lineWidth = 0.5;
        const shingleRows = 5;
        for (let i = 1; i < shingleRows; i++) {
            const y = baseY - (roofHeight * i / shingleRows);
            const xOffset = (width / 4) * (i / shingleRows);
            
            // Left side shingles
            this.ctx.beginPath();
            this.ctx.moveTo(screenX - width / 2 + xOffset, screenY + this.tileHeight * scale / 2 - wallHeight + (roofHeight * i / shingleRows) / 2);
            this.ctx.lineTo(screenX - xOffset, baseY - (roofHeight * i / shingleRows));
            this.ctx.stroke();

            // Right side shingles
            this.ctx.beginPath();
            this.ctx.moveTo(screenX + xOffset, baseY - (roofHeight * i / shingleRows));
            this.ctx.lineTo(screenX + width / 2 - xOffset, screenY + this.tileHeight * scale / 2 - wallHeight + (roofHeight * i / shingleRows) / 2);
            this.ctx.stroke();
        }
    }
}


