export class StructureRenderer {
    constructor(ctx) {
        this.ctx = ctx;
        this.tileWidth = 64;
        this.tileHeight = 32;
        this.floorHeight = 32;
        
        // Initialize material patterns
        this.patterns = new Map();
        this.initializeMaterialPatterns();
        this.world = null; // Add reference to world
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

        // Brick patterns - create two patterns for different wall faces
        const createBrickPattern = (angle) => {
            patternCtx.clearRect(0, 0, 64, 64);
            patternCtx.fillStyle = '#963a2f';
            patternCtx.fillRect(0, 0, 64, 64);
            
            patternCtx.save();
            patternCtx.translate(32, 32);
            // For isometric walls, use atan2(0.5, 1) ≈ 26.57 degrees for proper alignment
            patternCtx.rotate(Math.atan2(0.5, 1) * (angle > 0 ? 1 : -1));
            patternCtx.translate(-32, -32);
            
            patternCtx.fillStyle = '#732219';
            // Adjust brick dimensions to match isometric perspective
            const brickWidth = 40;  // Increased for better coverage
            const brickHeight = 12;
            
            for (let y = -32; y < 96; y += brickHeight) {
                let offset = (y % (brickHeight * 2)) === 0 ? 0 : brickWidth / 2;
                for (let x = offset - 32; x < 96; x += brickWidth) {
                    patternCtx.fillRect(x, y, brickWidth - 2, brickHeight - 1);
                    patternCtx.strokeStyle = 'rgba(0,0,0,0.2)';
                    patternCtx.strokeRect(x, y, brickWidth - 2, brickHeight - 1);
                    
                    // Add highlights
                    patternCtx.fillStyle = 'rgba(255,255,255,0.1)';
                    patternCtx.fillRect(x, y, brickWidth - 2, 2);
                    patternCtx.fillStyle = '#732219';
                }
            }
            patternCtx.restore();
            return this.ctx.createPattern(patternCanvas, 'repeat');
        };

        // Create brick patterns with corrected angles
        this.patterns.set('brick_right', createBrickPattern(1));  // Right face
        this.patterns.set('brick_left', createBrickPattern(-1));  // Left face
        this.patterns.set('brick', createBrickPattern(1));  // Default pattern

        // Metal pattern
        patternCtx.clearRect(0, 0, 64, 64);
        patternCtx.fillStyle = '#8a8a8a';
        patternCtx.fillRect(0, 0, 64, 64);
        for (let y = 0; y < 64; y += 8) {
            patternCtx.fillStyle = 'rgba(255,255,255,0.1)';
            patternCtx.fillRect(0, y, 64, 1);
        }
        this.patterns.set('metal', this.ctx.createPattern(patternCanvas, 'repeat'));
    }

    render(structure, worldX, worldY, screenX, screenY) {
        if (!structure?.template) return;

        this.ctx.save();
        
        if (structure.type === 'dumpster') {
            this.drawDumpster(screenX, screenY, structure);
        } else {
            // Regular structure rendering
            const material = structure.template.material || 'concrete';
            const colors = {
                // Swap right/left patterns to match the wall angles correctly
                frontRight: this.patterns.get(material === 'brick' ? 'brick_left' : material) || '#a0a0a0',
                frontLeft: this.patterns.get(material === 'brick' ? 'brick_right' : material) || '#808080',
                top: '#c0c0c0'
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
            
            this.drawStructureBox(screenPoints, totalHeight, colors, structure.template.type, structure);
        }

        this.ctx.restore();
        // Store world reference from structure
        this.world = structure.world;
    }

    drawStructureBox(points, height, colors, structureType, structure) {
        const floors = Math.floor(height / this.floorHeight);
        
        // Draw back walls first (always visible)
        if (structure.visibility.backRightWall) {
            // Draw back-right wall
            this.drawWall(points.topRight, points.topLeft, height, colors.frontRight, 'right');
        }
        
        if (structure.visibility.backLeftWall) {
            // Draw back-left wall
            this.drawWall(points.topLeft, points.bottomLeft, height, colors.frontLeft, 'left');
        }

        // Draw floor
        if (structure.visibility.floor) {
            this.drawFloor(points, colors.top);
        }

        // Draw front walls only if visible
        if (structure.visibility.frontRightWall) {
            // Draw front-right face (SE)
            this.drawWall(points.bottomRight, points.topRight, height, colors.frontRight, 'right');
            this.drawWindows(points.topRight.x, points.topRight.y, 
                points.bottomRight.x - points.topRight.x, height, floors, 'right');
        }

        if (structure.visibility.frontLeftWall) {
            // Draw front-left face (SW)
            this.drawWall(points.bottomRight, points.bottomLeft, height, colors.frontLeft, 'left');
            this.drawWindows(points.bottomLeft.x, points.bottomLeft.y,
                points.bottomRight.x - points.bottomLeft.x, height, floors, 'left');
            this.drawDoor(points.bottomLeft.x, points.bottomLeft.y + this.floorHeight,
                points.bottomRight.x - points.bottomLeft.x, structureType);
        }

        // Draw roof only if visible
        if (structure.visibility.roof) {
            this.drawRoof(points, height, colors.top, structure);
        }
    }

    drawWall(start, end, height, color, face) {
        this.ctx.fillStyle = color;
        this.ctx.beginPath();
        this.ctx.moveTo(start.x, start.y);
        this.ctx.lineTo(end.x, end.y);
        this.ctx.lineTo(end.x, end.y - height);
        this.ctx.lineTo(start.x, start.y - height);
        this.ctx.closePath();
        this.ctx.fill();
        this.ctx.strokeStyle = 'rgba(0,0,0,0.2)';
        this.ctx.stroke();
    }

    drawFloor(points, color) {
        this.ctx.fillStyle = color;
        this.ctx.beginPath();
        this.ctx.moveTo(points.bottomRight.x, points.bottomRight.y);
        this.ctx.lineTo(points.topRight.x, points.topRight.y);
        this.ctx.lineTo(points.topLeft.x, points.topLeft.y);
        this.ctx.lineTo(points.bottomLeft.x, points.bottomLeft.y);
        this.ctx.closePath();
        this.ctx.fill();
        this.ctx.stroke();
    }

    drawRoof(points, height, color, structure) {
        const roofConfig = structure.template.roofConfig || {
            style: 'flat',
            color: color,
            height: 0
        };

        switch (roofConfig.style) {
            case 'gabled':
                this.drawGabledRoof(points, height, roofConfig);
                break;
            case 'clerestory':
                // Just draw a flat roof for now
                this.drawFlatRoof(points, height, roofConfig.baseColor || '#4A4A4A');
                break;
            default:
                this.drawFlatRoof(points, height, roofConfig.color);
                break;
        }
    }

    drawFlatRoof(points, height, color) {
        this.ctx.fillStyle = color;
        this.ctx.beginPath();
        this.ctx.moveTo(points.bottomRight.x, points.bottomRight.y - height);
        this.ctx.lineTo(points.topRight.x, points.topRight.y - height);
        this.ctx.lineTo(points.topLeft.x, points.topLeft.y - height);
        this.ctx.lineTo(points.bottomLeft.x, points.bottomLeft.y - height);
        this.ctx.closePath();
        this.ctx.fill();
        this.ctx.stroke();
    }

    drawGabledRoof(points, height, config) {
        // Calculate ridge line (peak of the roof)
        const ridgeHeight = height + config.height;
        
        // Calculate back and front ridge points
        const backRidgeX = (points.topLeft.x + points.topRight.x) / 2;
        const backRidgeY = ((points.topLeft.y + points.topRight.y) / 2) - ridgeHeight;
        
        const frontRidgeX = (points.bottomLeft.x + points.bottomRight.x) / 2;
        const frontRidgeY = ((points.bottomLeft.y + points.bottomRight.y) / 2) - ridgeHeight;

        // Draw slopes in order: back, right, left, front
        // Back slope
        this.ctx.fillStyle = this.adjustColorBrightness(config.color, -30);
        this.ctx.beginPath();
        this.ctx.moveTo(points.topLeft.x, points.topLeft.y - height);
        this.ctx.lineTo(backRidgeX, backRidgeY);
        this.ctx.lineTo(points.topRight.x, points.topRight.y - height);
        this.ctx.closePath();
        this.ctx.fill();
        this.ctx.stroke();

        // Right slope
        this.ctx.fillStyle = this.adjustColorBrightness(config.color, -15);
        this.ctx.beginPath();
        this.ctx.moveTo(points.topRight.x, points.topRight.y - height);
        this.ctx.lineTo(backRidgeX, backRidgeY);
        this.ctx.lineTo(frontRidgeX, frontRidgeY);
        this.ctx.lineTo(points.bottomRight.x, points.bottomRight.y - height);
        this.ctx.closePath();
        this.ctx.fill();
        this.ctx.stroke();

        // Left slope
        this.ctx.fillStyle = config.color;
        this.ctx.beginPath();
        this.ctx.moveTo(points.topLeft.x, points.topLeft.y - height);
        this.ctx.lineTo(backRidgeX, backRidgeY);
        this.ctx.lineTo(frontRidgeX, frontRidgeY);
        this.ctx.lineTo(points.bottomLeft.x, points.bottomLeft.y - height);
        this.ctx.closePath();
        this.ctx.fill();
        this.ctx.stroke();

        // Front slope
        this.ctx.fillStyle = this.adjustColorBrightness(config.color, -10);
        this.ctx.beginPath();
        this.ctx.moveTo(points.bottomLeft.x, points.bottomLeft.y - height);
        this.ctx.lineTo(frontRidgeX, frontRidgeY);
        this.ctx.lineTo(points.bottomRight.x, points.bottomRight.y - height);
        this.ctx.closePath();
        this.ctx.fill();
        this.ctx.stroke();
    }

    drawSawtoothRoof(points, height, config) {
        const toothHeight = config.height || 48;
        const halfWidth = (points.bottomRight.x - points.bottomLeft.x) / 2;
        const halfDepth = (points.bottomRight.y - points.topRight.y) / 2;
        const overlap = halfWidth * 0.5; // 50% overlap (increased from 20%)
        
        // Calculate points for left gabled roof (extends further past center)
        const leftPoints = {
            topLeft: points.topLeft,
            topRight: { 
                x: points.topLeft.x + halfWidth + overlap, 
                y: points.topLeft.y + halfDepth + (overlap * 0.5) 
            },
            bottomLeft: points.bottomLeft,
            bottomRight: { 
                x: points.bottomLeft.x + halfWidth + overlap, 
                y: points.bottomLeft.y - halfDepth - (overlap * 0.5) 
            }
        };

        // Calculate points for right gabled roof (extends further past center)
        const rightPoints = {
            topLeft: { 
                x: points.topRight.x - halfWidth - overlap, 
                y: points.topRight.y + halfDepth + (overlap * 0.5) 
            },
            topRight: points.topRight,
            bottomLeft: { 
                x: points.bottomRight.x - halfWidth - overlap, 
                y: points.bottomRight.y - halfDepth - (overlap * 0.5) 
            },
            bottomRight: points.bottomRight
        };

        // Draw left gabled roof
        const leftConfig = {
            ...config,
            height: toothHeight
        };
        this.drawGabledRoof(leftPoints, height, leftConfig);

        // Draw right gabled roof
        const rightConfig = {
            ...config,
            height: toothHeight,
            color: this.adjustColorBrightness(config.color, -10)
        };
        this.drawGabledRoof(rightPoints, height, rightConfig);
    }

    drawClerestoryRoof(points, height, config) {
        // Draw base flat roof first with slightly darker color
        const baseColor = this.adjustColorBrightness(config.baseColor || '#4A4A4A', -15);
        this.drawFlatRoof(points, height, baseColor);

        const extension = config.overlapExtend || 0.3;
        const overlapHeight = config.overlapHeight || 32;
        const overlapWidth = config.overlapWidth || 0.7;
        const sideMargin = 0.15;
        
        // Isometric angles (30 degrees)
        const isoAngle = Math.PI / 6;
        const isoSkewX = Math.cos(isoAngle);
        const isoSkewY = Math.sin(isoAngle);

        // Calculate base points for raised section
        const raisedStart = {
            x: points.topRight.x - (points.topRight.x - points.topLeft.x) * (overlapWidth + sideMargin),
            y: points.topRight.y - height
        };
        
        const raisedEnd = {
            x: points.bottomRight.x - (points.bottomRight.x - points.bottomLeft.x) * (overlapWidth + sideMargin),
            y: points.bottomRight.y - height
        };

        // Draw vertical walls with isometric perspective
        const wallColor = this.adjustColorBrightness(config.baseColor || '#4A4A4A', -20);
        this.ctx.fillStyle = wallColor;

        // Right wall (darker)
        this.ctx.beginPath();
        this.ctx.moveTo(points.topRight.x - (points.topRight.x - points.topLeft.x) * sideMargin, points.topRight.y - height);
        this.ctx.lineTo(points.bottomRight.x - (points.bottomRight.x - points.bottomLeft.x) * sideMargin, points.bottomRight.y - height);
        this.ctx.lineTo(points.bottomRight.x - (points.bottomRight.x - points.bottomLeft.x) * sideMargin, points.bottomRight.y - height - overlapHeight);
        this.ctx.lineTo(points.topRight.x - (points.topRight.x - points.topLeft.x) * sideMargin, points.topRight.y - height - overlapHeight);
        this.ctx.closePath();
        this.ctx.fill();
        this.ctx.stroke();

        // Draw windows with isometric perspective
        const windowCount = Math.max(2, Math.floor((raisedEnd.x - raisedStart.x) / 40));
        const windowSpacing = (raisedEnd.x - raisedStart.x) / windowCount;
        const windowHeight = overlapHeight * 0.7;
        const windowWidth = windowSpacing * 0.7;

        for (let i = 0; i < windowCount; i++) {
            const wx = raisedStart.x + (windowSpacing * i) + (windowSpacing * 0.15);
            const wy = raisedStart.y - overlapHeight + (overlapHeight * 0.15);
            
            // Draw isometric window frame
            this.ctx.fillStyle = '#2a2a2a';
            
            // Calculate isometric window points
            const windowPoints = [
                { x: wx, y: wy },
                { x: wx + windowWidth * isoSkewX, y: wy + windowWidth * isoSkewY },
                { x: wx + windowWidth * isoSkewX, y: wy + windowWidth * isoSkewY + windowHeight },
                { x: wx, y: wy + windowHeight }
            ];

            // Draw window frame
            this.ctx.beginPath();
            this.ctx.moveTo(windowPoints[0].x, windowPoints[0].y);
            this.ctx.lineTo(windowPoints[1].x, windowPoints[1].y);
            this.ctx.lineTo(windowPoints[2].x, windowPoints[2].y);
            this.ctx.lineTo(windowPoints[3].x, windowPoints[3].y);
            this.ctx.closePath();
            this.ctx.fill();
            this.ctx.stroke();

            // Draw window glass with gradient
            const gradient = this.ctx.createLinearGradient(
                windowPoints[0].x, windowPoints[0].y,
                windowPoints[2].x, windowPoints[2].y
            );
            gradient.addColorStop(0, 'rgba(173, 216, 230, 0.9)');
            gradient.addColorStop(0.5, 'rgba(173, 216, 230, 0.7)');
            gradient.addColorStop(1, 'rgba(173, 216, 230, 0.8)');
            
            this.ctx.fillStyle = gradient;
            this.ctx.fill();

            // Draw window panes following isometric perspective
            this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
            this.ctx.beginPath();
            // Vertical pane
            this.ctx.moveTo(wx + (windowWidth * 0.5) * isoSkewX, wy + (windowWidth * 0.5) * isoSkewY);
            this.ctx.lineTo(wx + (windowWidth * 0.5) * isoSkewX, wy + (windowWidth * 0.5) * isoSkewY + windowHeight);
            // Horizontal pane
            this.ctx.moveTo(wx, wy + windowHeight * 0.5);
            this.ctx.lineTo(wx + windowWidth * isoSkewX, wy + windowWidth * isoSkewY + windowHeight * 0.5);
            this.ctx.stroke();
        }
    }

    adjustColorBrightness(hex, percent) {
        const num = parseInt(hex.replace('#', ''), 16);
        const r = (num >> 16) + percent;
        const g = ((num >> 8) & 0x00FF) + percent;
        const b = (num & 0x0000FF) + percent;
        
        return '#' + (0x1000000 +
            (r < 255 ? (r < 0 ? 0 : r) : 255) * 0x10000 +
            (g < 255 ? (g < 0 ? 0 : g) : 255) * 0x100 +
            (b < 255 ? (b < 0 ? 0 : b) : 255)
        ).toString(16).slice(1);
    }

    drawWindows(startX, startY, faceWidth, totalHeight, floors, face) {
        const windowPadding = 8;
        // Make window width exactly 50% of a tile width
        const windowWidth = Math.floor(this.tileWidth * 0.5);
        const windowsPerFloor = Math.max(1, Math.floor(Math.abs(faceWidth) / this.tileWidth));
        
        // Adjust available height per floor
        const availableHeightPerFloor = (totalHeight - this.floorHeight) / (floors - 1);
        const windowHeight = Math.min(
            availableHeightPerFloor - (windowPadding * 2),
            this.floorHeight - (windowPadding * 3)
        );
        
        // Calculate isometric skew based on tile dimensions
        const isoSkew = (windowWidth * this.tileHeight) / this.tileWidth;

        this.ctx.save();

        // Skip ground floor and adjust starting position
        for (let floor = 1; floor < floors; floor++) {
            const floorY = startY - (floor * availableHeightPerFloor) + windowPadding;
            
            for (let w = 0; w < windowsPerFloor; w++) {
                const windowX = startX + (face === 'left' ? 1 : -1) * 
                    (windowPadding + (w * (this.tileWidth)));
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

    drawDoor(startX, startY, faceWidth, structureType) {
        const doorWidth = 16;
        let doorHeight;

        switch(structureType) {
            case 'warehouse':
            case 'factory':
                doorHeight = this.floorHeight * 1.2;
                break;
            default:
                doorHeight = this.floorHeight * 0.75;
        }

        // Calculate door position based on tile grid
        const tileCenter = {
            x: Math.round(startX / this.tileWidth) * this.tileWidth,
            y: Math.round(startY / this.tileHeight) * this.tileHeight
        };

        // Calculate window positions for ground floor
        const windowPadding = 8;
        const windowsPerFloor = Math.max(1, Math.floor(Math.abs(faceWidth) / 48));
        const windowWidth = (Math.abs(faceWidth) - (windowPadding * (windowsPerFloor + 1))) / windowsPerFloor;

        // Move forward by 0.5 tiles in isometric space
        let doorX = tileCenter.x + (this.tileWidth / 4);
        const doorY = tileCenter.y - (this.tileHeight / 4);
        let doorShifted = false;

        // Check if door position overlaps with any window position
        for (let w = 0; w < windowsPerFloor; w++) {
            const windowX = startX + (windowPadding + (w * (windowWidth + windowPadding)));
            const windowRight = windowX + windowWidth;
            
            // If door overlaps with window, mark that we need to shift
            if (doorX >= windowX - doorWidth && doorX <= windowRight + doorWidth) {
                doorShifted = true;
                doorX += this.tileWidth / 2; // Shift right by half a tile width
                break;
            }
        }

        // Convert coordinates and mark door tile, accounting for shift
        if (this.world) {
            const worldCoords = this.screenToWorld(startX, startY);
            // If door was shifted right, also shift the tile marker right
            if (doorShifted) {
                worldCoords.x += 1;
            }
            // Subtract one from Y to move the door tile back one space
            worldCoords.y -= 1;
            //console.log('Door position:', worldCoords); // Debug log
            this.world.setTileType(worldCoords.x, worldCoords.y, 'door');
        }

        const isoSkew = (doorWidth * this.tileHeight) / this.tileWidth;

        // Rest of door rendering remains the same
        this.ctx.fillStyle = 'rgba(80, 80, 80, 1)';
        this.ctx.beginPath();
        this.ctx.moveTo(doorX - 2, doorY - 2);
        this.ctx.lineTo(doorX + doorWidth, doorY + isoSkew - 2);
        this.ctx.lineTo(doorX + doorWidth, doorY - doorHeight + isoSkew);
        this.ctx.lineTo(doorX - 2, doorY - doorHeight);
        this.ctx.closePath();
        this.ctx.fill();

        // Door panel
        this.ctx.fillStyle = 'rgba(120, 100, 80, 1)';
        this.ctx.beginPath();
        this.ctx.moveTo(doorX, doorY);
        this.ctx.lineTo(doorX + doorWidth, doorY + isoSkew);
        this.ctx.lineTo(doorX + doorWidth, doorY - doorHeight + isoSkew);
        this.ctx.lineTo(doorX, doorY - doorHeight);
        this.ctx.closePath();
        this.ctx.fill();

        // Door knob
        this.ctx.fillStyle = 'rgba(220, 200, 180, 1)';
        this.ctx.beginPath();
        this.ctx.arc(doorX + doorWidth * 0.75, doorY - doorHeight / 2 + isoSkew / 2, 3, 0, Math.PI * 2);
        this.ctx.fill();
    }

    worldToScreen(x, y) {
        return {
            x: (x - y) * (this.tileWidth / 2),
            y: (x + y) * (this.tileHeight / 2)
        };
    }

    // Add this helper method
    screenToWorld(screenX, screenY) {
        // Convert isometric screen coordinates back to world coordinates
        const x = Math.round((screenX / (this.tileWidth / 2) + screenY / (this.tileHeight / 2)) / 2);
        const y = Math.round((screenY / (this.tileHeight / 2) - screenX / (this.tileWidth / 2)) / 2);
        return { x, y };
    }

    drawIsometricBox(x, y, width, height, depth, colors) {
        // Draw front face
        this.ctx.fillStyle = colors.frontRight;
        this.ctx.beginPath();
        this.ctx.moveTo(x, y);
        this.ctx.lineTo(x + width, y);
        this.ctx.lineTo(x + width, y - height);
        this.ctx.lineTo(x, y - height);
        this.ctx.closePath();
        this.ctx.fill();

        // Draw back face
        this.ctx.fillStyle = colors.frontLeft;
        this.ctx.beginPath();
        this.ctx.moveTo(x, y);
        this.ctx.lineTo(x, y - height);
        this.ctx.lineTo(x - depth, y - height);
        this.ctx.lineTo(x - depth, y);
        this.ctx.closePath();
        this.ctx.fill();

        // Draw top face
        this.ctx.fillStyle = colors.top;
        this.ctx.beginPath();
        this.ctx.moveTo(x, y - height);
        this.ctx.lineTo(x + width, y - height);
        this.ctx.lineTo(x + width - depth, y - height - depth);
        this.ctx.lineTo(x - depth, y - height - depth);
        this.ctx.closePath();
        this.ctx.fill();
    }

    drawDumpster(screenX, screenY, structure) {
        const colors = {
            base: '#3A3A3A',      // Dark gray for main body
            lid: '#4A4A4A',       // Slightly lighter for lid
            shadow: '#2A2A2A',    // Darker for shadows
            highlight: '#5A5A5A'  // Lighter for highlights
        };

        // Base elevation
        const elevation = structure.elevation * this.tileHeight;
        screenY -= elevation;

        // Dimensions
        const width = this.tileWidth;
        const height = this.tileHeight * 0.8;
        const depth = this.tileHeight * 0.3;

        // Draw main body
        this.ctx.beginPath();
        this.ctx.fillStyle = colors.base;
        
        // Front face
        this.ctx.moveTo(screenX, screenY);
        this.ctx.lineTo(screenX + width, screenY);
        this.ctx.lineTo(screenX + width, screenY + height);
        this.ctx.lineTo(screenX, screenY + height);
        this.ctx.fill();

        // Top face (lid)
        this.ctx.beginPath();
        this.ctx.fillStyle = structure.states.isOpen ? colors.highlight : colors.lid;
        this.ctx.moveTo(screenX, screenY);
        this.ctx.lineTo(screenX + width, screenY);
        this.ctx.lineTo(screenX + width - depth, screenY - depth);
        this.ctx.lineTo(screenX - depth, screenY - depth);
        this.ctx.fill();

        // Side face
        this.ctx.beginPath();
        this.ctx.fillStyle = colors.shadow;
        this.ctx.moveTo(screenX + width, screenY);
        this.ctx.lineTo(screenX + width - depth, screenY - depth);
        this.ctx.lineTo(screenX + width - depth, screenY + height - depth);
        this.ctx.lineTo(screenX + width, screenY + height);
        this.ctx.fill();

        // Add some detail lines
        this.ctx.strokeStyle = colors.highlight;
        this.ctx.lineWidth = 1;
        this.ctx.beginPath();
        this.ctx.moveTo(screenX + width * 0.2, screenY + height * 0.2);
        this.ctx.lineTo(screenX + width * 0.8, screenY + height * 0.2);
        this.ctx.stroke();
    }
}







































































