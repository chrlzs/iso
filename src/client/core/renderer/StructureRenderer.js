export class StructureRenderer {
    constructor(ctx) {
        this.ctx = ctx;
        this.tileWidth = 64;
        this.tileHeight = 32;
        this.heightScale = 32;
    }

    render(structure, worldX, worldY, screenX, screenY) {
        if (!structure?.template) return;

        this.ctx.save();
        
        const colors = {
            frontRight: '#a0a0a0',  // SE face
            frontLeft: '#808080',   // SW face
            top: '#c0c0c0'
        };

        this.drawSingleTileBox(
            screenX,
            screenY,
            this.heightScale,  // Single floor height
            colors
        );

        this.ctx.restore();
    }

    drawSingleTileBox(x, y, height, colors) {
        // Define the diamond shape points for a single tile
        const points = {
            center: { x: x, y: y },
            right: { x: x + this.tileWidth/2, y: y - this.tileHeight/2 },  // Changed to front right
            left: { x: x - this.tileWidth/2, y: y - this.tileHeight/2 },   // Changed to front left
            top: { x: x, y: y - height },
            topRight: { x: x + this.tileWidth/2, y: y - this.tileHeight/2 - height },
            topLeft: { x: x - this.tileWidth/2, y: y - this.tileHeight/2 - height }
        };

        // Front-right face (NE)
        this.ctx.fillStyle = colors.frontRight;
        this.ctx.beginPath();
        this.ctx.moveTo(points.center.x, points.center.y);
        this.ctx.lineTo(points.right.x, points.right.y);
        this.ctx.lineTo(points.topRight.x, points.topRight.y);
        this.ctx.lineTo(points.top.x, points.top.y);
        this.ctx.closePath();
        this.ctx.fill();
        this.ctx.stroke();

        // Front-left face (NW)
        this.ctx.fillStyle = colors.frontLeft;
        this.ctx.beginPath();
        this.ctx.moveTo(points.center.x, points.center.y);
        this.ctx.lineTo(points.left.x, points.left.y);
        this.ctx.lineTo(points.topLeft.x, points.topLeft.y);
        this.ctx.lineTo(points.top.x, points.top.y);
        this.ctx.closePath();
        this.ctx.fill();
        this.ctx.stroke();

        // Top face
        this.ctx.fillStyle = colors.top;
        this.ctx.beginPath();
        this.ctx.moveTo(points.top.x, points.top.y);
        this.ctx.lineTo(points.topRight.x, points.topRight.y);
        this.ctx.lineTo(points.center.x, points.center.y - height);
        this.ctx.lineTo(points.topLeft.x, points.topLeft.y);
        this.ctx.closePath();
        this.ctx.fill();
        this.ctx.stroke();
    }
}



















