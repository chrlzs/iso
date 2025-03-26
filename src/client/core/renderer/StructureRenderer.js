export class StructureRenderer {
    constructor(ctx) {
        this.ctx = ctx;
        this.tileWidth = 64;
        this.tileHeight = 32;
        this.floorHeight = 32;
        
        // Initialize material patterns
        this.patterns = new Map();
        this.initializeMaterialPatterns();
    }

    initializeMaterialPatterns() {
        // Create a temporary canvas for pattern generation
        const patternCanvas = document.createElement('canvas');
        patternCanvas.width = 64;
        patternCanvas.height = 64;
        const patternCtx = patternCanvas.getContext('2d');

        // Concrete pattern
        patternCtx.fillStyle = '#a0a0a0';
        patternCtx.fillRect(0, 0, 64, 64);
        for (let i = 0; i < 100; i++) {
            patternCtx.fillStyle = `rgba(0,0,0,${Math.random() * 0.1})`;
            patternCtx.fillRect(
                Math.random() * 64,
                Math.random() * 64,
                2,
                2
            );
        }
        this.patterns.set('concrete', this.ctx.createPattern(patternCanvas, 'repeat'));

        // Glass pattern with isometric window panes
        patternCtx.clearRect(0, 0, 64, 64);
        
        // Base color
        patternCtx.fillStyle = '#b8d6e6';
        patternCtx.fillRect(0, 0, 64, 64);
        
        // Save context for rotation
        patternCtx.save();
        
        // Translate to center for rotation
        patternCtx.translate(32, 32);
        // Rotate 30 degrees (isometric angle)
        patternCtx.rotate(Math.PI / 6);
        // Translate back
        patternCtx.translate(-32, -32);

        // Draw window panes
        patternCtx.strokeStyle = 'rgba(255,255,255,0.8)';
        patternCtx.lineWidth = 2;

        // Vertical lines (now at 30 degrees)
        for (let x = 0; x < 96; x += 16) {
            patternCtx.beginPath();
            patternCtx.moveTo(x, -16);
            patternCtx.lineTo(x, 80);
            patternCtx.stroke();
        }

        // Restore context for horizontal lines
        patternCtx.restore();
        patternCtx.save();

        // Rotate the other way for perpendicular lines
        patternCtx.translate(32, 32);
        patternCtx.rotate(-Math.PI / 6);
        patternCtx.translate(-32, -32);

        // Horizontal lines (now at -30 degrees)
        for (let y = 0; y < 96; y += 16) {
            patternCtx.beginPath();
            patternCtx.moveTo(-16, y);
            patternCtx.lineTo(80, y);
            patternCtx.stroke();
        }

        patternCtx.restore();

        // Add subtle reflection effect
        patternCtx.fillStyle = 'rgba(255,255,255,0.1)';
        for (let i = 0; i < 5; i++) {
            const x = Math.random() * 64;
            const y = Math.random() * 64;
            patternCtx.fillRect(x, y, 8, 8);
        }

        this.patterns.set('glass', this.ctx.createPattern(patternCanvas, 'repeat'));

        // Metal pattern
        patternCtx.clearRect(0, 0, 64, 64);
        patternCtx.fillStyle = '#8a8a8a';
        patternCtx.fillRect(0, 0, 64, 64);
        for (let y = 0; y < 64; y += 8) {
            patternCtx.fillStyle = 'rgba(255,255,255,0.1)';
            patternCtx.fillRect(0, y, 64, 1);
        }
        this.patterns.set('metal', this.ctx.createPattern(patternCanvas, 'repeat'));

        // Brick pattern
        patternCtx.clearRect(0, 0, 64, 64);
        patternCtx.fillStyle = '#963a2f';
        patternCtx.fillRect(0, 0, 64, 64);
        
        // Draw brick pattern
        patternCtx.fillStyle = '#732219';
        for (let y = 0; y < 64; y += 16) {
            let offset = (y % 32) === 0 ? 0 : 32;
            for (let x = offset; x < 64; x += 64) {
                patternCtx.fillRect(x, y, 30, 14);
                patternCtx.strokeRect(x, y, 30, 14);
            }
        }
        this.patterns.set('brick', this.ctx.createPattern(patternCanvas, 'repeat'));
    }

    render(structure, worldX, worldY, screenX, screenY) {
        if (!structure?.template) return;

        this.ctx.save();
        
        const material = structure.template.material || 'concrete';
        const colors = {
            frontRight: this.patterns.get(material) || '#a0a0a0',
            frontLeft: this.patterns.get(material) || '#808080',
            top: '#c0c0c0'  // Keep top solid for now
        };

        const basePoints = {
            bottomLeft: { x: worldX, y: worldY + structure.height },
            bottomRight: { x: worldX + structure.width, y: worldY + structure.height },
            topRight: { x: worldX + structure.width, y: worldY },
            topLeft: { x: worldX, y: worldY }
        };

        const screenPoints = {
            bottomLeft: this.worldToScreen(basePoints.bottomLeft.x, basePoints.bottomLeft.y),
            bottomRight: this.worldToScreen(basePoints.bottomRight.x, basePoints.bottomRight.y),
            topRight: this.worldToScreen(basePoints.topRight.x, basePoints.topRight.y),
            topLeft: this.worldToScreen(basePoints.topLeft.x, basePoints.topLeft.y)
        };

        const totalHeight = (structure.template.floors || 1) * this.floorHeight;
        
        this.drawStructureBox(screenPoints, totalHeight, colors);

        this.ctx.restore();
    }

    drawStructureBox(points, height, colors) {
        // Draw front-right face (SE)
        this.ctx.fillStyle = colors.frontRight;
        this.ctx.beginPath();
        this.ctx.moveTo(points.bottomRight.x, points.bottomRight.y);
        this.ctx.lineTo(points.topRight.x, points.topRight.y);
        this.ctx.lineTo(points.topRight.x, points.topRight.y - height);
        this.ctx.lineTo(points.bottomRight.x, points.bottomRight.y - height);
        this.ctx.closePath();
        this.ctx.fill();
        this.ctx.strokeStyle = 'rgba(0,0,0,0.2)';
        this.ctx.stroke();

        // Draw front-left face (SW)
        this.ctx.fillStyle = colors.frontLeft;
        this.ctx.beginPath();
        this.ctx.moveTo(points.bottomRight.x, points.bottomRight.y);
        this.ctx.lineTo(points.bottomLeft.x, points.bottomLeft.y);
        this.ctx.lineTo(points.bottomLeft.x, points.bottomLeft.y - height);
        this.ctx.lineTo(points.bottomRight.x, points.bottomRight.y - height);
        this.ctx.closePath();
        this.ctx.fill();
        this.ctx.stroke();

        // Draw top face
        this.ctx.fillStyle = colors.top;
        this.ctx.beginPath();
        this.ctx.moveTo(points.bottomRight.x, points.bottomRight.y - height);
        this.ctx.lineTo(points.topRight.x, points.topRight.y - height);
        this.ctx.lineTo(points.topLeft.x, points.topLeft.y - height);
        this.ctx.lineTo(points.bottomLeft.x, points.bottomLeft.y - height);
        this.ctx.closePath();
        this.ctx.fill();
        this.ctx.stroke();
    }

    worldToScreen(x, y) {
        return {
            x: (x - y) * (this.tileWidth / 2),
            y: (x + y) * (this.tileHeight / 2)
        };
    }
}

























