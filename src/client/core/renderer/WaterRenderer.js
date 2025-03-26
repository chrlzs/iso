export class WaterRenderer {
    constructor() {
        this.canvas = document.createElement('canvas');
        this.ctx = this.canvas.getContext('2d');
        this.time = 0;
        this.waves = [];
        
        // Wave parameters
        this.waveCount = 3;
        this.amplitude = 5;
        this.frequency = 0.02;
        this.speed = 0.002;
        
        // Initialize waves with different phases
        for (let i = 0; i < this.waveCount; i++) {
            this.waves.push({
                phase: Math.random() * Math.PI * 2,
                amplitude: this.amplitude * (0.8 + Math.random() * 0.4),
                frequency: this.frequency * (0.8 + Math.random() * 0.4)
            });
        }
    }

    renderWaterTile(ctx, x, y, width, height) {
        // Resize canvas if needed
        if (this.canvas.width !== width || this.canvas.height !== height) {
            this.canvas.width = width;
            this.canvas.height = height;
        }

        // Clear canvas
        this.ctx.clearRect(0, 0, width, height);

        // Create water gradient
        const gradient = this.ctx.createLinearGradient(0, 0, width, height);
        gradient.addColorStop(0, '#4A90E2');  // Light blue
        gradient.addColorStop(1, '#357ABD');  // Darker blue

        // Fill base water color
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, width, height);

        // Draw waves
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        this.ctx.lineWidth = 2;

        for (let wave of this.waves) {
            this.ctx.beginPath();
            for (let i = 0; i < width; i++) {
                const yPos = height / 2 + 
                    Math.sin(i * wave.frequency + this.time + wave.phase) * 
                    wave.amplitude;
                
                if (i === 0) {
                    this.ctx.moveTo(i, yPos);
                } else {
                    this.ctx.lineTo(i, yPos);
                }
            }
            this.ctx.stroke();
        }

        // Add highlight
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
        this.ctx.fillRect(0, 0, width, height / 2);

        // Draw the water effect onto the main canvas
        ctx.drawImage(this.canvas, x, y);
    }

    update() {
        this.time += this.speed;
    }
}
