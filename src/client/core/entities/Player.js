
export class Player {
    constructor({ x, y }) {
        this.x = x;
        this.y = y;
        this.speed = 0.1; // Units per millisecond
        this.size = 1; // Size in world units
        this.color = '#FF0000'; // Red color for player
        
        // Movement path
        this.currentPath = null;
        this.currentPathIndex = 0;
        
        // Movement state
        this.isMoving = false;
        this.targetReachThreshold = 0.1; // How close we need to be to consider reaching a point
    }

    setPath(path) {
        if (!path || path.length === 0) return;
        
        this.currentPath = path;
        this.currentPathIndex = 0;
        this.isMoving = true;
        
        // Log path for debugging
        console.log('New path set:', path);
    }

    update(deltaTime) {
        if (!this.isMoving || !this.currentPath) return;

        // Get current target position from path
        const targetPos = this.currentPath[this.currentPathIndex];
        if (!targetPos) {
            this.isMoving = false;
            return;
        }

        // Calculate distance to next point
        const dx = targetPos.x - this.x;
        const dy = targetPos.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // Check if we've reached the current target point
        if (distance < this.targetReachThreshold) {
            this.currentPathIndex++;
            
            // Check if we've reached the end of the path
            if (this.currentPathIndex >= this.currentPath.length) {
                this.currentPath = null;
                this.isMoving = false;
                return;
            }
        } else {
            // Move towards target
            const moveDistance = this.speed * deltaTime;
            const ratio = Math.min(moveDistance / distance, 1);
            
            this.x += dx * ratio;
            this.y += dy * ratio;
        }
    }

    render(ctx) {
        // Save context state
        ctx.save();
        
        // Draw player
        ctx.fillStyle = '#FF0000';  // Bright red
        ctx.strokeStyle = '#FFFFFF'; // White outline
        ctx.lineWidth = 2;
        
        // Draw a larger player
        const size = 10; // Increased size
        ctx.beginPath();
        ctx.arc(this.x, this.y, size, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        
        // Draw crosshair at player position
        const crosshairSize = size * 1.5;
        ctx.beginPath();
        ctx.moveTo(this.x - crosshairSize, this.y);
        ctx.lineTo(this.x + crosshairSize, this.y);
        ctx.moveTo(this.x, this.y - crosshairSize);
        ctx.lineTo(this.x, this.y + crosshairSize);
        ctx.stroke();
        
        // Draw path if it exists
        if (this.currentPath && this.isMoving) {
            ctx.strokeStyle = 'rgba(255, 255, 0, 0.5)'; // Yellow path
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(this.x, this.y);
            
            // Draw from current position to next target
            for (let i = this.currentPathIndex; i < this.currentPath.length; i++) {
                ctx.lineTo(this.currentPath[i].x, this.currentPath[i].y);
            }
            
            ctx.stroke();
        }
        
        // Restore context state
        ctx.restore();
    }

    // Helper method to get current position
    getPosition() {
        return { x: this.x, y: this.y };
    }
}



