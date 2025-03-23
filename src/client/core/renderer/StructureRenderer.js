export class StructureRenderer {
    constructor(ctx, tileWidth = 64, tileHeight = 32) {
        this.ctx = ctx;
        this.tileWidth = tileWidth;
        this.tileHeight = tileHeight;
        this.heightOffset = tileHeight / 3;
    }

    render(structure, worldX, worldY, screenX, screenY) {
        this.ctx.save();
        const baseHeight = 1.5;
        const scale = 0.9;

        // Only draw base components from the primary position
        if (structure.isPrimaryTile(worldX, worldY)) {
            this.drawFoundation(structure, screenX, screenY, scale);
            this.drawWalls(structure, screenX, screenY, baseHeight, scale);
            this.drawPeakedRoof(structure, screenX, screenY, baseHeight, scale);
        }

        // Get the specific component at this position
        const component = structure.getComponentAt(worldX, worldY);
        if (component) {
            // Render position-specific components
            switch (component.type) {
                case 'window':
                    this.drawWindows(structure, screenX, screenY, baseHeight, scale);
                    break;
                case 'chimney':
                    this.drawChimney(structure, screenX, screenY, baseHeight, scale);
                    break;
                case 'door':
                    this.drawDoor(structure, screenX, screenY, baseHeight, scale);
                    break;
            }
        }
        
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

    drawWindows(structure, screenX, screenY, baseHeight, scale = 0.8) {
        const width = this.tileWidth * structure.width * scale;
        const wallHeight = baseHeight * this.heightOffset;

        // Window properties
        const windowWidth = width * 0.2;
        const windowHeight = wallHeight * 0.3;
        const windowColor = structure.states?.lightOn ? '#FFE08C' : '#2F343C';

        // Draw windows on front wall
        this.ctx.fillStyle = windowColor;
        this.ctx.strokeStyle = '#463E33';
        this.ctx.lineWidth = 2;

        // Left window
        this.ctx.fillRect(
            screenX - width * 0.35,
            screenY + this.tileHeight * scale - wallHeight * 0.6,
            windowWidth,
            windowHeight
        );
        this.ctx.strokeRect(
            screenX - width * 0.35,
            screenY + this.tileHeight * scale - wallHeight * 0.6,
            windowWidth,
            windowHeight
        );

        // Right window
        this.ctx.fillRect(
            screenX + width * 0.15,
            screenY + this.tileHeight * scale - wallHeight * 0.6,
            windowWidth,
            windowHeight
        );
        this.ctx.strokeRect(
            screenX + width * 0.15,
            screenY + this.tileHeight * scale - wallHeight * 0.6,
            windowWidth,
            windowHeight
        );

        // Add window crossbars
        this.drawWindowCrossbars(screenX - width * 0.35, screenY + this.tileHeight * scale - wallHeight * 0.6, windowWidth, windowHeight);
        this.drawWindowCrossbars(screenX + width * 0.15, screenY + this.tileHeight * scale - wallHeight * 0.6, windowWidth, windowHeight);
    }

    drawWindowCrossbars(x, y, width, height) {
        this.ctx.strokeStyle = '#463E33';
        this.ctx.lineWidth = 1;

        // Vertical crossbar
        this.ctx.beginPath();
        this.ctx.moveTo(x + width / 2, y);
        this.ctx.lineTo(x + width / 2, y + height);
        this.ctx.stroke();

        // Horizontal crossbar
        this.ctx.beginPath();
        this.ctx.moveTo(x, y + height / 2);
        this.ctx.lineTo(x + width, y + height / 2);
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

    drawChimney(structure, screenX, screenY, baseHeight, scale = 0.8) {
        if (!structure.template?.chimney) return;

        const width = this.tileWidth * scale;
        const wallHeight = baseHeight * this.heightOffset;
        const chimneyWidth = width * 0.3; // Make chimney narrower
        const chimneyHeight = wallHeight * 0.6;

        // Draw chimney at the specific tile position
        this.ctx.fillStyle = '#8B7355';
        this.ctx.strokeStyle = '#6B5335';
        this.ctx.lineWidth = 2;

        const chimneyX = screenX;
        const chimneyY = screenY - wallHeight - chimneyHeight;

        this.ctx.fillRect(chimneyX - chimneyWidth/2, chimneyY, chimneyWidth, chimneyHeight);
        this.ctx.strokeRect(chimneyX - chimneyWidth/2, chimneyY, chimneyWidth, chimneyHeight);

        // Draw chimney top
        this.ctx.fillStyle = '#6B5335';
        this.ctx.fillRect(
            chimneyX - chimneyWidth/2 - 2,
            chimneyY - 4,
            chimneyWidth + 4,
            4
        );

        // Draw smoke only from chimney position
        if (structure.states?.smokeActive) {
            this.drawChimneySmoke(chimneyX, chimneyY - 5);
        }
    }

    drawChimneySmoke(x, y) {
        this.ctx.fillStyle = 'rgba(200, 200, 200, 0.5)';
        const time = Date.now() / 1000;
        
        for (let i = 0; i < 3; i++) {
            const offset = i * 10;
            const size = 8 + Math.sin(time + i) * 2;
            const xOffset = Math.sin(time * 2 + i) * 5;
            
            this.ctx.beginPath();
            this.ctx.arc(x + xOffset, y - offset, size, 0, Math.PI * 2);
            this.ctx.fill();
        }
    }

    drawDoor(structure, screenX, screenY, baseHeight, scale = 0.8) {
        const width = this.tileWidth * structure.width * scale;
        const wallHeight = baseHeight * this.heightOffset;
        
        // Door frame
        this.ctx.fillStyle = '#8B4513';
        this.ctx.strokeStyle = '#6B3513';
        this.ctx.lineWidth = 2;
        
        const doorWidth = width * 0.25;
        const doorHeight = wallHeight * 0.4;
        const doorX = screenX - doorWidth / 2;
        const doorY = screenY + this.tileHeight * scale - wallHeight * 0.8;
        
        // Draw door frame
        this.ctx.fillStyle = '#8B4513';
        this.ctx.fillRect(
            doorX - 2,
            doorY,
            doorWidth + 4,
            doorHeight
        );
        
        // Draw the door itself
        if (structure.states?.doorOpen) {
            // Door open - draw at an angle
            this.ctx.save();
            this.ctx.translate(doorX, doorY);
            this.ctx.rotate(-Math.PI / 3); // Open at 60-degree angle
            
            this.ctx.fillStyle = '#654321';
            this.ctx.fillRect(0, 0, doorWidth, doorHeight);
            
            // Door details
            this.ctx.strokeStyle = '#463E33';
            this.ctx.strokeRect(0, 0, doorWidth, doorHeight);
            this.ctx.beginPath();
            this.ctx.moveTo(doorWidth * 0.2, 0);
            this.ctx.lineTo(doorWidth * 0.2, doorHeight);
            this.ctx.moveTo(doorWidth * 0.8, 0);
            this.ctx.lineTo(doorWidth * 0.8, doorHeight);
            this.ctx.stroke();
            
            this.ctx.restore();
        } else {
            // Door closed
            this.ctx.fillStyle = '#654321';
            this.ctx.fillRect(
                doorX,
                doorY,
                doorWidth,
                doorHeight
            );
            
            // Door details
            this.ctx.strokeStyle = '#463E33';
            this.ctx.strokeRect(
                doorX,
                doorY,
                doorWidth,
                doorHeight
            );
            
            // Vertical panels
            this.ctx.beginPath();
            this.ctx.moveTo(doorX + doorWidth * 0.2, doorY);
            this.ctx.lineTo(doorX + doorWidth * 0.2, doorY + doorHeight);
            this.ctx.moveTo(doorX + doorWidth * 0.8, doorY);
            this.ctx.lineTo(doorX + doorWidth * 0.8, doorY + doorHeight);
            this.ctx.stroke();
        }
        
        // Door handle
        this.ctx.fillStyle = '#C4A484';
        this.ctx.beginPath();
        this.ctx.arc(
            doorX + doorWidth * 0.85,
            doorY + doorHeight * 0.5,
            3,
            0,
            Math.PI * 2
        );
        this.ctx.fill();
    }
}





