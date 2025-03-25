export class StructureRenderer {
    constructor(ctx) {
        this.ctx = ctx;
        this.tileSize = 64; // Base tile size
        this.wallHeight = 32; // Height of wall sections
    }

    render(structure, worldX, worldY, screenX, screenY) {
        if (!structure || !structure.template) return;

        const template = structure.template;
        const { blueprint } = template;
        
        // Calculate vertical offset for multi-story buildings
        const heightOffset = structure.getVerticalOffset();
        screenY -= heightOffset;

        // Render structure components in correct order (back to front, bottom to top)
        this.renderWalls(structure, blueprint, screenX, screenY);
        this.renderDecorations(structure, screenX, screenY);
        this.renderRoof(structure, screenX, screenY - (structure.floors * this.wallHeight));
    }

    renderWalls(structure, blueprint, screenX, screenY) {
        const components = structure.components || [];
        
        // Render back walls first
        components
            .filter(comp => comp.type === 'wall')
            .forEach(comp => {
                const dx = (comp.x - structure.x) * this.tileSize;
                const dy = (comp.y - structure.y) * this.tileSize;
                this.drawWall(screenX + dx, screenY + dy, structure.material);
            });

        // Then render doors and windows
        components
            .filter(comp => comp.type === 'door' || comp.type === 'window')
            .forEach(comp => {
                const dx = (comp.x - structure.x) * this.tileSize;
                const dy = (comp.y - structure.y) * this.tileSize;
                if (comp.type === 'door') {
                    this.drawDoor(screenX + dx, screenY + dy, structure.states.doorOpen);
                } else {
                    this.drawWindow(screenX + dx, screenY + dy, structure.states.lightOn);
                }
            });
    }

    renderDecorations(structure, screenX, screenY) {
        const decorations = structure.template.decorations || [];
        decorations.forEach(dec => {
            const dx = dec.x * this.tileSize;
            const dy = dec.y * this.tileSize;
            this.drawDecoration(dec.type, screenX + dx, screenY + dy);
        });
    }

    renderRoof(structure, screenX, screenY) {
        if (!structure.roofType || structure.roofType === 'none') return;

        const width = structure.width * this.tileSize;
        const height = structure.height * this.tileSize;

        this.ctx.save();
        this.ctx.translate(screenX, screenY);

        switch (structure.roofType) {
            case 'flat':
                this.drawFlatRoof(width, height);
                break;
            case 'pitched':
                this.drawPitchedRoof(width, height);
                break;
            case 'industrial':
                this.drawIndustrialRoof(width, height);
                break;
        }

        this.ctx.restore();
    }

    drawWall(x, y, material) {
        this.ctx.fillStyle = this.getMaterialColor(material);
        this.ctx.fillRect(x, y, this.tileSize, this.wallHeight);
    }

    drawDoor(x, y, isOpen) {
        this.ctx.fillStyle = isOpen ? '#4a4a4a' : '#8b4513';
        this.ctx.fillRect(x, y, this.tileSize, this.wallHeight);
    }

    drawWindow(x, y, isLit) {
        this.ctx.fillStyle = isLit ? '#ffff99' : '#87ceeb';
        this.ctx.fillRect(x + 8, y + 8, this.tileSize - 16, this.wallHeight - 16);
    }

    drawDecoration(type, x, y) {
        switch (type) {
            case 'sign':
                this.drawSign(x, y);
                break;
            case 'ac_unit':
                this.drawACUnit(x, y);
                break;
            case 'path':
                this.drawPath(x, y);
                break;
        }
    }

    drawSign(x, y) {
        // Draw sign post
        this.ctx.fillStyle = '#8B4513';
        this.ctx.fillRect(x + 28, y + 8, 8, 24);

        // Draw sign board
        this.ctx.fillStyle = '#DEB887';
        this.ctx.fillRect(x + 8, y + 4, 48, 20);

        // Add border to sign
        this.ctx.strokeStyle = '#8B4513';
        this.ctx.strokeRect(x + 8, y + 4, 48, 20);
    }

    drawACUnit(x, y) {
        // Main unit body
        this.ctx.fillStyle = '#A9A9A9';
        this.ctx.fillRect(x + 8, y + 8, 24, 16);

        // Grill lines
        this.ctx.strokeStyle = '#696969';
        for (let i = 0; i < 3; i++) {
            this.ctx.beginPath();
            this.ctx.moveTo(x + 10, y + 12 + i * 5);
            this.ctx.lineTo(x + 30, y + 12 + i * 5);
            this.ctx.stroke();
        }
    }

    drawPath(x, y) {
        // Main path
        this.ctx.fillStyle = '#B8860B';
        this.ctx.fillRect(x + 4, y + 4, this.tileSize - 8, this.tileSize - 8);

        // Add some texture/stones
        this.ctx.fillStyle = '#8B4513';
        for (let i = 0; i < 5; i++) {
            const rx = x + 8 + Math.random() * (this.tileSize - 16);
            const ry = y + 8 + Math.random() * (this.tileSize - 16);
            this.ctx.beginPath();
            this.ctx.arc(rx, ry, 2, 0, Math.PI * 2);
            this.ctx.fill();
        }
    }

    getMaterialColor(material) {
        const colors = {
            'brick': '#8b4513',
            'concrete': '#808080',
            'glass': '#87ceeb',
            'metal': '#a9a9a9',
            'wood': '#deb887',
            'stone': '#696969'
        };
        return colors[material] || '#808080';
    }

    drawFlatRoof(width, height) {
        this.ctx.fillStyle = '#4a4a4a';
        this.ctx.fillRect(0, 0, width, height);
    }

    drawPitchedRoof(width, height) {
        this.ctx.fillStyle = '#8b4513';
        this.ctx.beginPath();
        this.ctx.moveTo(0, height);
        this.ctx.lineTo(width / 2, 0);
        this.ctx.lineTo(width, height);
        this.ctx.closePath();
        this.ctx.fill();
    }

    drawIndustrialRoof(width, height) {
        this.ctx.fillStyle = '#696969';
        for (let x = 0; x < width; x += 32) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x + 16, height/4);
            this.ctx.lineTo(x + 32, 0);
            this.ctx.fill();
        }
    }
}




