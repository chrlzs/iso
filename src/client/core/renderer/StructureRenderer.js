export class StructureRenderer {
    constructor(ctx) {
        this.ctx = ctx;
        this.tileWidth = 64;
        this.tileHeight = 32;
        this.floorHeight = 32;
    }

    render(structure, worldX, worldY, screenX, screenY) {
        if (!structure?.template) return;

        this.ctx.save();
        
        const colors = {
            frontRight: '#a0a0a0',
            frontLeft: '#808080',
            top: '#c0c0c0'
        };

        // For a structure at (x,y), the corners should be at:
        // (x,y+h), (x+w,y+h), (x+w,y), (x,y)
        // where w and h are the width and height of the structure
        const basePoints = {
            bottomLeft: { x: worldX, y: worldY + structure.height },
            bottomRight: { x: worldX + structure.width, y: worldY + structure.height },
            topRight: { x: worldX + structure.width, y: worldY },
            topLeft: { x: worldX, y: worldY }
        };

        // Convert world coordinates to screen coordinates
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

    worldToScreen(x, y) {
        return {
            x: (x - y) * (this.tileWidth / 2),
            y: (x + y) * (this.tileHeight / 2)
        };
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
}























