export class StructureRenderer {
    constructor(ctx) {
        this.ctx = ctx;
        this.tileWidth = 64; // Base tile width
        this.tileHeight = 32; // Base tile height
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
        this.renderRoof(structure, screenX, screenY - (structure.floors * this.tileHeight));
    }

    renderWalls(structure, blueprint, screenX, screenY) {
        const components = structure.components || [];
        
        // Render back walls first
        components
            .filter(comp => comp.type === 'wall')
            .forEach(comp => {
                const dx = (comp.x - structure.x) * this.tileWidth;
                const dy = (comp.y - structure.y) * this.tileHeight;
                this.drawStructure(screenX + dx, screenY + dy, structure);
            });

        // Then render doors and windows
        components
            .filter(comp => comp.type === 'door' || comp.type === 'window')
            .forEach(comp => {
                const dx = (comp.x - structure.x) * this.tileWidth;
                const dy = (comp.y - structure.y) * this.tileHeight;
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
            const dx = dec.x * this.tileWidth;
            const dy = dec.y * this.tileHeight;
            this.drawDecoration(dec.type, screenX + dx, screenY + dy);
        });
    }

    renderRoof(structure, screenX, screenY) {
        if (!structure.roofType || structure.roofType === 'none') return;

        const width = structure.width * this.tileWidth;
        const height = structure.height * this.tileHeight;

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

    drawStructure(x, y, structure) {
        const isoX = (x - y) * (this.tileWidth / 2);
        const isoY = (x + y) * (this.tileHeight / 2);

        // Draw base
        this.ctx.fillStyle = this.getMaterialColor(structure.material);
        this.ctx.strokeStyle = 'rgba(0,0,0,0.3)';
        this.ctx.lineWidth = 1;

        // Draw walls with height
        const height = structure.floors * this.tileHeight;
        
        // Front wall
        this.ctx.beginPath();
        this.ctx.moveTo(isoX, isoY);
        this.ctx.lineTo(isoX + this.tileWidth/2, isoY + this.tileHeight/2);
        this.ctx.lineTo(isoX + this.tileWidth/2, isoY + this.tileHeight/2 - height);
        this.ctx.lineTo(isoX, isoY - height);
        this.ctx.closePath();
        this.ctx.fill();
        this.ctx.stroke();

        // Side wall
        this.ctx.beginPath();
        this.ctx.moveTo(isoX, isoY);
        this.ctx.lineTo(isoX - this.tileWidth/2, isoY + this.tileHeight/2);
        this.ctx.lineTo(isoX - this.tileWidth/2, isoY + this.tileHeight/2 - height);
        this.ctx.lineTo(isoX, isoY - height);
        this.ctx.closePath();
        this.ctx.fill();
        this.ctx.stroke();

        // Roof
        this.ctx.fillStyle = this.getRoofColor(structure.roofType);
        this.ctx.beginPath();
        this.ctx.moveTo(isoX, isoY - height);
        this.ctx.lineTo(isoX + this.tileWidth/2, isoY + this.tileHeight/2 - height);
        this.ctx.lineTo(isoX, isoY + this.tileHeight - height);
        this.ctx.lineTo(isoX - this.tileWidth/2, isoY + this.tileHeight/2 - height);
        this.ctx.closePath();
        this.ctx.fill();
        this.ctx.stroke();

        // Draw windows if present
        if (structure.states.lightOn) {
            this.drawWindows(isoX, isoY, height, structure.floors);
        }
    }

    drawDoor(x, y, isOpen) {
        this.ctx.fillStyle = isOpen ? '#4a4a4a' : '#8b4513';
        this.ctx.fillRect(x, y, this.tileWidth, this.tileHeight);
    }

    drawWindow(x, y, isLit) {
        this.ctx.fillStyle = isLit ? '#ffff99' : '#87ceeb';
        this.ctx.fillRect(x + 8, y + 8, this.tileWidth - 16, this.tileHeight - 16);
    }

    drawDecoration(type, x, y) {
        this.ctx.save();
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
            case 'chimney':
                this.drawChimney(x, y);
                break;
            case 'antenna':
                this.drawAntenna(x, y);
                break;
            case 'satellite_dish':
                this.drawSatelliteDish(x, y);
                break;
        }
        this.ctx.restore();
    }

    drawSign(x, y) {
        // Draw sign board
        this.ctx.fillStyle = '#8B4513';
        this.ctx.fillRect(x - 15, y - 20, 30, 15);
        
        // Add simple text lines
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.fillRect(x - 10, y - 17, 20, 2);
        this.ctx.fillRect(x - 10, y - 12, 15, 2);
    }

    drawACUnit(x, y) {
        // Main unit body
        this.ctx.fillStyle = '#A9A9A9';
        this.ctx.fillRect(x - 10, y - 8, 20, 16);
        
        // Ventilation lines
        this.ctx.fillStyle = '#696969';
        for (let i = 0; i < 3; i++) {
            this.ctx.fillRect(x - 8, y - 6 + (i * 5), 16, 2);
        }
    }

    drawPath(x, y) {
        // Stone path
        this.ctx.fillStyle = '#808080';
        for (let i = 0; i < 4; i++) {
            this.ctx.beginPath();
            this.ctx.ellipse(
                x + (i * 8) - 12,
                y,
                4,
                3,
                0,
                0,
                Math.PI * 2
            );
            this.ctx.fill();
        }
    }

    drawChimney(x, y) {
        // Main chimney body
        this.ctx.fillStyle = '#8B4513';
        this.ctx.fillRect(x - 6, y - 20, 12, 20);
        
        // Top rim
        this.ctx.fillStyle = '#696969';
        this.ctx.fillRect(x - 8, y - 22, 16, 4);
    }

    drawAntenna(x, y) {
        // Antenna pole
        this.ctx.strokeStyle = '#696969';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.moveTo(x, y);
        this.ctx.lineTo(x, y - 30);
        this.ctx.stroke();

        // Antenna elements
        for (let i = 0; i < 3; i++) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, y - 10 - (i * 8));
            this.ctx.lineTo(x + 10, y - 13 - (i * 8));
            this.ctx.stroke();
        }
    }

    drawSatelliteDish(x, y) {
        // Dish
        this.ctx.fillStyle = '#A9A9A9';
        this.ctx.beginPath();
        this.ctx.ellipse(x, y - 15, 12, 8, Math.PI / 4, 0, Math.PI * 2);
        this.ctx.fill();

        // Mount
        this.ctx.fillStyle = '#696969';
        this.ctx.fillRect(x - 2, y - 12, 4, 12);
        
        // Receiver
        this.ctx.fillStyle = '#4A4A4A';
        this.ctx.fillRect(x + 8, y - 18, 4, 4);
    }

    getMaterialColor(material) {
        const colors = {
            'brick': '#8B4513',
            'concrete': '#808080',
            'wood': '#DEB887',
            'stone': '#696969',
            'metal': '#A9A9A9'
        };
        return colors[material] || '#808080';
    }

    getRoofColor(roofType) {
        const colors = {
            'flat': '#4A4A4A',
            'pitched': '#8B4513',
            'dome': '#A9A9A9'
        };
        return colors[roofType] || '#4A4A4A';
    }

    drawWindows(x, y, height, floors) {
        const windowColor = 'rgba(255, 255, 150, 0.5)';
        const windowSize = this.tileWidth / 6;

        for (let floor = 1; floor <= floors; floor++) {
            const floorHeight = height * (floor / floors);
            
            // Front windows
            this.ctx.fillStyle = windowColor;
            this.ctx.fillRect(
                x + windowSize, 
                y - floorHeight + windowSize, 
                windowSize, 
                windowSize
            );

            // Side windows
            this.ctx.fillRect(
                x - windowSize * 2, 
                y - floorHeight + windowSize, 
                windowSize, 
                windowSize
            );
        }
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






