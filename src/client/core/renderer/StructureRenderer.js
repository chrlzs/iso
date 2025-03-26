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
        const floors = Math.floor(height / this.floorHeight);
        
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

        // Add windows to front-right face
        this.drawWindows(
            points.topRight.x,
            points.topRight.y,
            points.bottomRight.x - points.topRight.x,
            height,
            floors,
            'right'
        );

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

        // Add windows to front-left face
        this.drawWindows(
            points.bottomLeft.x,
            points.bottomLeft.y,
            points.bottomRight.x - points.bottomLeft.x,
            height,
            floors,
            'left'
        );

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

    drawWindows(startX, startY, faceWidth, totalHeight, floors, face) {
        const windowPadding = 8;
        const windowsPerFloor = Math.max(1, Math.floor(Math.abs(faceWidth) / 48));
        const windowWidth = (Math.abs(faceWidth) - (windowPadding * (windowsPerFloor + 1))) / windowsPerFloor;
        
        // Adjust window height to ensure all floors fit
        const availableHeightPerFloor = (totalHeight - this.floorHeight) / (floors - 1); // Subtract ground floor
        const windowHeight = Math.min(
            availableHeightPerFloor - (windowPadding * 2),
            this.floorHeight - (windowPadding * 3) // Add extra padding for top margin
        );
        
        // Use tile dimensions (64x32) to calculate correct isometric angle
        const tileWidth = 64;
        const tileHeight = 32;
        const isoSkew = (windowWidth * tileHeight) / tileWidth;

        this.ctx.save();

        // Skip ground floor and adjust starting position
        for (let floor = 1; floor < floors; floor++) {
            // Adjust floor Y position to ensure windows fit within building height
            const floorY = startY - (floor * availableHeightPerFloor) + windowPadding;
            
            for (let w = 0; w < windowsPerFloor; w++) {
                const windowX = startX + (face === 'left' ? 1 : -1) * 
                    (windowPadding + (w * (windowWidth + windowPadding)));
                const windowY = floorY;

                // Draw window frame with depth
                this.ctx.beginPath();
                if (face === 'left') {
                    this.ctx.moveTo(windowX - 2, windowY - 2);
                    this.ctx.lineTo(windowX + windowWidth, windowY + isoSkew - 2);
                    this.ctx.lineTo(windowX + windowWidth, windowY + windowHeight + isoSkew);
                    this.ctx.lineTo(windowX - 2, windowY + windowHeight);
                } else {
                    this.ctx.moveTo(windowX + 2, windowY - 2);
                    this.ctx.lineTo(windowX - windowWidth, windowY + isoSkew - 2);
                    this.ctx.lineTo(windowX - windowWidth, windowY + windowHeight + isoSkew);
                    this.ctx.lineTo(windowX + 2, windowY + windowHeight);
                }
                this.ctx.closePath();
                this.ctx.fillStyle = 'rgba(60, 60, 60, 0.6)';
                this.ctx.fill();

                // Draw main window glass
                this.ctx.beginPath();
                if (face === 'left') {
                    this.ctx.moveTo(windowX, windowY);
                    this.ctx.lineTo(windowX + windowWidth, windowY + isoSkew);
                    this.ctx.lineTo(windowX + windowWidth, windowY + windowHeight + isoSkew);
                    this.ctx.lineTo(windowX, windowY + windowHeight);
                } else {
                    this.ctx.moveTo(windowX, windowY);
                    this.ctx.lineTo(windowX - windowWidth, windowY + isoSkew);
                    this.ctx.lineTo(windowX - windowWidth, windowY + windowHeight + isoSkew);
                    this.ctx.lineTo(windowX, windowY + windowHeight);
                }
                this.ctx.closePath();

                // Window glass gradient
                const gradient = this.ctx.createLinearGradient(
                    windowX, windowY,
                    windowX + (face === 'left' ? windowWidth : -windowWidth), 
                    windowY + windowHeight
                );
                gradient.addColorStop(0, 'rgba(180, 214, 230, 0.8)');
                gradient.addColorStop(0.5, 'rgba(200, 230, 255, 0.9)');
                gradient.addColorStop(1, 'rgba(180, 214, 230, 0.8)');
                this.ctx.fillStyle = gradient;
                this.ctx.fill();

                // Draw window panes
                const paneCount = 3;
                
                // Vertical panes
                for (let i = 1; i < paneCount; i++) {
                    const ratio = i / paneCount;
                    const x1 = windowX + (face === 'left' ? windowWidth * ratio : -windowWidth * ratio);
                    const y1 = windowY + (isoSkew * ratio);
                    const x2 = x1;
                    const y2 = y1 + windowHeight;
                    
                    this.ctx.beginPath();
                    this.ctx.moveTo(x1, y1);
                    this.ctx.lineTo(x2, y2);
                    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
                    this.ctx.lineWidth = 1;
                    this.ctx.stroke();
                }

                // Horizontal panes
                for (let i = 1; i < paneCount; i++) {
                    const ratio = i / paneCount;
                    const startX = windowX;
                    const startY = windowY + (windowHeight * ratio);
                    const endX = windowX + (face === 'left' ? windowWidth : -windowWidth);
                    const endY = windowY + (windowHeight * ratio) + isoSkew;
                    
                    this.ctx.beginPath();
                    this.ctx.moveTo(startX, startY);
                    this.ctx.lineTo(endX, endY);
                    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
                    this.ctx.lineWidth = 1;
                    this.ctx.stroke();
                }

                // Window frame
                this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
                this.ctx.lineWidth = 1.5;
                this.ctx.stroke();
            }
        }

        this.ctx.restore();
    }

    worldToScreen(x, y) {
        return {
            x: (x - y) * (this.tileWidth / 2),
            y: (x + y) * (this.tileHeight / 2)
        };
    }
}








































