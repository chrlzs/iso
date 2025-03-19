
export class Player {
    constructor({ x, y }) {
        this.x = x;
        this.y = y;
        this.speed = 0.005; // Reduced speed for better control
        this.size = 1;
        this.color = '#FF0000';
        
        this.currentPath = null;
        this.currentPathIndex = 0;
        this.isMoving = false;
        this.targetReachThreshold = 0.1;
        
        console.log('Player created at:', x, y);
    }

    setPath(path) {
        if (!path || path.length === 0) {
            console.log('Invalid path provided');
            return;
        }
        
        console.log('Setting new path:', path);
        this.currentPath = path;
        this.currentPathIndex = 0;
        this.isMoving = true;
    }

    update(deltaTime) {
        if (!this.isMoving || !this.currentPath || this.currentPathIndex >= this.currentPath.length) {
            return;
        }

        const targetPos = this.currentPath[this.currentPathIndex];
        if (!targetPos) {
            this.isMoving = false;
            this.currentPath = null;
            return;
        }

        const dx = targetPos.x - this.x;
        const dy = targetPos.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < this.targetReachThreshold) {
            this.currentPathIndex++;
            console.log('Reached waypoint:', this.currentPathIndex);
            
            if (this.currentPathIndex >= this.currentPath.length) {
                this.currentPath = null;
                this.isMoving = false;
                console.log('Reached destination');
                return;
            }
        } else {
            const moveDistance = this.speed * deltaTime;
            const ratio = Math.min(moveDistance / distance, 1);
            
            this.x += dx * ratio;
            this.y += dy * ratio;
            
            console.log('Moving to:', this.x, this.y);
        }
    }

    render(ctx) {
        ctx.save();
        
        // Draw player
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size * 0.5, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw path if it exists
        if (this.currentPath && this.isMoving) {
            ctx.strokeStyle = 'rgba(255, 255, 0, 0.5)'; // Yellow path
            ctx.lineWidth = 0.2;
            ctx.beginPath();
            ctx.moveTo(this.x, this.y);
            
            // Draw from current position to next target
            for (let i = this.currentPathIndex; i < this.currentPath.length; i++) {
                ctx.lineTo(this.currentPath[i].x, this.currentPath[i].y);
            }
            
            ctx.stroke();
        }
        
        ctx.restore();
    }

    getPosition() {
        return { x: this.x, y: this.y };
    }
}







