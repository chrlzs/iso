export class StructureRenderer {
    constructor(ctx) {
        this.ctx = ctx;
        this.tileWidth = 64;
        this.tileHeight = 32;
        this.DEBUG = {
            enabled: true,
            showGrid: true,
            showAnchors: true,
            showBoundary: true
        };
    }

    render(structure, worldX, worldY, screenX, screenY) {
        if (!structure?.template) return;

        // Convert world coordinates to screen space with offset correction
        const isoX = screenX + (worldX - worldY) * (this.tileWidth / 2);
        const isoY = screenY + (worldX + worldY) * (this.tileHeight / 2);

        // Check if getVerticalOffset exists before calling it
        if (typeof structure.getVerticalOffset !== 'function') {
            console.error('Structure object missing getVerticalOffset method:', structure);
            return; // Exit if the method is missing
        }

        const heightOffset = structure.getVerticalOffset();

        // Sort components by depth (back to front)
        const sortedComponents = [...structure.components].sort((a, b) => {
            const depthA = (a.worldX + a.worldY) * 100 + (a.type === 'wall' ? 0 : 50);
            const depthB = (b.worldX + b.worldY) * 100 + (b.type === 'wall' ? 0 : 50);
            return depthA - depthB;
        });

        this.ctx.save();

        // Draw shadow and base
        this.drawStructureBase(isoX, isoY, structure);

        // Draw components
        sortedComponents.forEach(comp => {
            const localIsoX = (comp.localX - comp.localY) * (this.tileWidth / 2);
            const localIsoY = (comp.localX + comp.localY) * (this.tileHeight / 2);
            
            const compX = isoX + localIsoX;
            const compY = isoY + localIsoY - heightOffset;
            
            this.renderComponent(comp, compX, compY, structure);
        });

        // Debug visualization
        if (this.DEBUG.enabled) {
            this.drawDebugInfo(structure, worldX, worldY, isoX, isoY - heightOffset);
        }

        this.ctx.restore();
    }

    drawStructureBase(x, y, structure) {
        // Larger shadow for multi-story buildings
        const shadowDepth = Math.min(structure.floors * 4, 20);
        
        this.ctx.fillStyle = `rgba(0,0,0,${0.1 + (structure.floors * 0.02)})`;
        this.ctx.beginPath();
        this.ctx.moveTo(x, y);
        this.ctx.lineTo(x + structure.width * this.tileWidth/2, y + structure.height * this.tileHeight/2);
        this.ctx.lineTo(x, y + structure.height * this.tileHeight);
        this.ctx.lineTo(x - structure.width * this.tileWidth/2, y + structure.height * this.tileHeight/2);
        this.ctx.closePath();
        this.ctx.fill();
    }

    drawDebugInfo(structure, worldX, worldY, screenX, screenY) {
        const ctx = this.ctx;
        
        if (this.DEBUG.showBoundary) {
            // Structure boundary
            ctx.strokeStyle = 'rgba(255,0,0,0.5)';
            ctx.strokeRect(
                screenX, 
                screenY,
                structure.width * this.tileWidth/2,
                structure.height * this.tileHeight
            );
        }

        if (this.DEBUG.showGrid) {
            // Isometric grid
            ctx.strokeStyle = 'rgba(0,255,0,0.2)';
            for (let x = 0; x <= structure.width; x++) {
                for (let y = 0; y <= structure.height; y++) {
                    const gridX = screenX + (x - y) * this.tileWidth/2;
                    const gridY = screenY + (x + y) * this.tileHeight/2;
                    ctx.beginPath();
                    ctx.moveTo(gridX - this.tileWidth/2, gridY);
                    ctx.lineTo(gridX, gridY - this.tileHeight/2);
                    ctx.lineTo(gridX + this.tileWidth/2, gridY);
                    ctx.stroke();
                }
            }
        }

        // Structure info
        ctx.fillStyle = 'white';
        ctx.font = '12px Arial';
        ctx.fillText(
            `${structure.type} (${worldX},${worldY}) h:${structure.floors}`,
            screenX,
            screenY - 10
        );
    }

    renderComponent(comp, x, y, structure) {
        switch (comp.type) {
            case 'wall':
                this.drawWallSegment(x, y, structure);
                break;
            case 'door':
                this.drawDoor(x, y, structure.states.doorOpen);
                break;
            case 'window':
                this.drawWindow(x, y, structure.states.lightOn);
                break;
        }
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
        const height = structure.floors * this.tileHeight;
        
        // Shadow
        this.ctx.fillStyle = 'rgba(0,0,0,0.2)';
        this.ctx.beginPath();
        this.ctx.moveTo(isoX, isoY + this.tileHeight/2);
        this.ctx.lineTo(isoX + this.tileWidth/2, isoY + this.tileHeight);
        this.ctx.lineTo(isoX, isoY + this.tileHeight * 1.5);
        this.ctx.lineTo(isoX - this.tileWidth/2, isoY + this.tileHeight);
        this.ctx.fill();

        // Get base colors based on material
        const baseColor = this.getMaterialColor(structure.material);
        const darkerColor = this.adjustColor(baseColor, -30);
        const lighterColor = this.adjustColor(baseColor, 20);
        
        // Side wall (left)
        this.ctx.fillStyle = darkerColor;
        this.ctx.beginPath();
        this.ctx.moveTo(isoX, isoY);
        this.ctx.lineTo(isoX - this.tileWidth/2, isoY + this.tileHeight/2);
        this.ctx.lineTo(isoX - this.tileWidth/2, isoY + this.tileHeight/2 - height);
        this.ctx.lineTo(isoX, isoY - height);
        this.ctx.closePath();
        this.ctx.fill();
        this.ctx.stroke();

        // Add window pattern to left wall
        if (structure.states.lightOn) {
            this.drawWindowPattern(
                isoX - this.tileWidth/2, 
                isoY + this.tileHeight/2, 
                height, 
                'left',
                structure.floors,
                structure.states.lightOn
            );
        }

        // Front wall
        this.ctx.fillStyle = baseColor;
        this.ctx.beginPath();
        this.ctx.moveTo(isoX, isoY);
        this.ctx.lineTo(isoX + this.tileWidth/2, isoY + this.tileHeight/2);
        this.ctx.lineTo(isoX + this.tileWidth/2, isoY + this.tileHeight/2 - height);
        this.ctx.lineTo(isoX, isoY - height);
        this.ctx.closePath();
        this.ctx.fill();
        this.ctx.stroke();

        // Add window pattern to front wall
        if (structure.states.lightOn) {
            this.drawWindowPattern(
                isoX, 
                isoY, 
                height, 
                'front',
                structure.floors,
                structure.states.lightOn
            );
        }

        // Roof
        this.drawRoof(structure, isoX, isoY - height);
    }

    drawWallSegment(x, y, structure) {
        const height = structure.floors * this.tileHeight;
        const baseColor = this.getMaterialColor(structure.material);
        
        // Wall face
        this.ctx.fillStyle = baseColor;
        this.ctx.beginPath();
        this.ctx.moveTo(x, y);
        this.ctx.lineTo(x, y - height);
        this.ctx.lineTo(x + this.tileWidth/2, y - height + this.tileHeight/2);
        this.ctx.lineTo(x + this.tileWidth/2, y + this.tileHeight/2);
        this.ctx.closePath();
        this.ctx.fill();
        this.ctx.stroke();

        if (this.DEBUG) {
            // Wall anchor point
            this.ctx.fillStyle = 'red';
            this.ctx.fillRect(x-2, y-2, 4, 4);
        }
    }

    drawDoor(x, y, isOpen) {
        this.ctx.fillStyle = isOpen ? '#4a4a4a' : '#8b4513';
        this.ctx.fillRect(x, y, this.tileWidth, this.tileHeight);
    }

    drawWindowPattern(x, y, height, side, floors, isLightOn) {
        const windowColor = isLightOn ? 
            'rgba(255, 255, 150, 0.7)' : 
            'rgba(100, 149, 237, 0.5)';
        const windowBorder = isLightOn ?
            'rgba(255, 255, 200, 0.8)' :
            'rgba(70, 130, 180, 0.6)';

        this.ctx.save();
        
        // Calculate window positions based on floor height
        for (let floor = 1; floor <= floors; floor++) {
            const floorHeight = height * (floor / floors);
            const windowY = y - floorHeight + (height / floors) * 0.3;
            
            if (side === 'front') {
                // Two windows on front
                this.drawWindow(x + this.tileWidth * 0.15, windowY, windowColor, windowBorder);
                this.drawWindow(x + this.tileWidth * 0.35, windowY, windowColor, windowBorder);
            } else {
                // One window on side
                this.drawWindow(x + this.tileWidth * 0.25, windowY, windowColor, windowBorder);
            }
        }
        
        this.ctx.restore();
    }

    drawWindow(x, y, color, borderColor) {
        const windowWidth = this.tileWidth * 0.15;
        const windowHeight = this.tileHeight * 0.3;
        
        // Window frame
        this.ctx.fillStyle = borderColor;
        this.ctx.fillRect(x - 1, y - 1, windowWidth + 2, windowHeight + 2);
        
        // Window pane
        this.ctx.fillStyle = color;
        this.ctx.fillRect(x, y, windowWidth, windowHeight);
        
        // Window cross
        this.ctx.strokeStyle = borderColor;
        this.ctx.lineWidth = 1;
        this.ctx.beginPath();
        this.ctx.moveTo(x + windowWidth/2, y);
        this.ctx.lineTo(x + windowWidth/2, y + windowHeight);
        this.ctx.moveTo(x, y + windowHeight/2);
        this.ctx.lineTo(x + windowWidth, y + windowHeight/2);
        this.ctx.stroke();
    }

    drawRoof(structure, x, y) {
        const roofColor = this.getRoofColor(structure.roofType);
        const darkerRoof = this.adjustColor(roofColor, -20);
        
        switch (structure.roofType) {
            case 'flat':
                this.drawFlatRoof(x, y, roofColor, darkerRoof);
                break;
            case 'pitched':
                this.drawPitchedRoof(x, y, roofColor, darkerRoof);
                break;
            default:
                this.drawFlatRoof(x, y, roofColor, darkerRoof);
        }
    }

    drawFlatRoof(x, y, color, borderColor) {
        // Ensure we have valid colors
        color = color || this.getRoofColor('flat');
        borderColor = borderColor || this.adjustColor(color, -20);

        // Main roof surface
        this.ctx.fillStyle = color;
        this.ctx.beginPath();
        this.ctx.moveTo(x, y);
        this.ctx.lineTo(x + this.tileWidth/2, y + this.tileHeight/2);
        this.ctx.lineTo(x, y + this.tileHeight);
        this.ctx.lineTo(x - this.tileWidth/2, y + this.tileHeight/2);
        this.ctx.closePath();
        this.ctx.fill();
        
        // Roof edge detail
        this.ctx.strokeStyle = borderColor;
        this.ctx.lineWidth = 2;
        this.ctx.stroke();
        
        // Optional: Add roof texture pattern
        this.ctx.strokeStyle = this.adjustColor(color, -10);
        this.ctx.lineWidth = 1;
        for (let i = 0; i < this.tileWidth/2; i += 8) {
            this.ctx.beginPath();
            this.ctx.moveTo(x - i, y + i * 0.5);
            this.ctx.lineTo(x + this.tileWidth/2 - i, y + this.tileHeight/2 + i * 0.5);
            this.ctx.stroke();
        }
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

    adjustColor(hex, amount) {
        // Handle undefined or invalid color
        if (!hex || typeof hex !== 'string') {
            hex = '#808080'; // Default to gray if color is invalid
        }

        // Ensure hex color starts with #
        if (!hex.startsWith('#')) {
            hex = '#' + hex;
        }

        // Ensure hex color is 6 digits
        if (hex.length === 4) {
            hex = '#' + hex[1] + hex[1] + hex[2] + hex[2] + hex[3] + hex[3];
        }

        let r = parseInt(hex.slice(1,3), 16);
        let g = parseInt(hex.slice(3,5), 16);
        let b = parseInt(hex.slice(5,7), 16);

        r = Math.max(0, Math.min(255, r + amount));
        g = Math.max(0, Math.min(255, g + amount));
        b = Math.max(0, Math.min(255, b + amount));

        return `#${r.toString(16).padStart(2,'0')}${g.toString(16).padStart(2,'0')}${b.toString(16).padStart(2,'0')}`;
    }

    getMaterialColor(material) {
        const colors = {
            'brick': '#A94442',
            'concrete': '#989898',
            'wood': '#8B4513',
            'stone': '#808080',
            'metal': '#A9A9A9',
            'glass': '#ADD8E6'
        };
        return colors[material] || '#989898';
    }

    getRoofColor(roofType) {
        const colors = {
            'flat': '#4A4A4A',
            'pitched': '#8B4513',
            'dome': '#A9A9A9',
            'industrial': '#696969'
        };
        return colors[roofType] || '#4A4A4A'; // Default to dark gray if roof type not found
    }

    drawDecoration(decorationType, x, y) {
        const decorSize = this.tileWidth / 2;
        
        this.ctx.save();
        switch (decorationType) {
            case 'ac_unit':
                this.drawACUnit(x, y, decorSize);
                break;
            case 'sign':
                this.drawSign(x, y, decorSize);
                break;
            case 'window':
                this.drawStructureWindow(x, y, decorSize);
                break;
            default:
                // Fallback decoration
                this.drawGenericDecoration(x, y, decorSize);
        }
        this.ctx.restore();
    }

    drawACUnit(x, y, size) {
        // AC unit drawing
        this.ctx.fillStyle = '#A9A9A9';
        this.ctx.fillRect(x, y, size, size/2);
        
        // Grill lines
        this.ctx.strokeStyle = '#808080';
        this.ctx.lineWidth = 1;
        for (let i = 0; i < size; i += 4) {
            this.ctx.beginPath();
            this.ctx.moveTo(x + i, y);
            this.ctx.lineTo(x + i, y + size/2);
            this.ctx.stroke();
        }
    }

    drawSign(x, y, size) {
        // Sign background
        this.ctx.fillStyle = '#4A4A4A';
        this.ctx.fillRect(x, y, size * 1.5, size/3);
        
        // Sign text effect (simplified)
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.fillRect(x + 4, y + 4, size * 1.2, size/6);
    }

    drawStructureWindow(x, y, size) {
        // Window frame
        this.ctx.fillStyle = '#696969';
        this.ctx.fillRect(x, y, size, size * 1.5);
        
        // Window glass
        this.ctx.fillStyle = 'rgba(135, 206, 235, 0.5)';
        this.ctx.fillRect(x + 2, y + 2, size - 4, size * 1.5 - 4);
        
        // Window reflection
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        this.ctx.beginPath();
        this.ctx.moveTo(x + 4, y + 4);
        this.ctx.lineTo(x + size - 4, y + 4);
        this.ctx.stroke();
    }

    drawGenericDecoration(x, y, size) {
        // Simple square as fallback
        this.ctx.fillStyle = '#808080';
        this.ctx.fillRect(x, y, size, size);
    }
}










