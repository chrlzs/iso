export class MessageLog {
    constructor(config) {
        this.position = config.position;
        this.width = config.width;
        this.height = config.height;
        this.game = config.game;
        this.messages = [];
        this.maxMessages = 5;
    }

    addMessage(message) {
        this.messages.unshift(message);
        if (this.messages.length > this.maxMessages) {
            this.messages.pop();
        }
    }

    render(ctx) {
        // Draw message log background
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(this.position.x, this.position.y, this.width, this.height);

        // Draw messages
        ctx.fillStyle = '#ffffff';
        ctx.font = '12px Arial';
        this.messages.forEach((message, index) => {
            ctx.fillText(message, 
                this.position.x + 10, 
                this.position.y + 20 + (index * 20)
            );
        });
    }

    update(deltaTime) {
        // Update logic here if needed
    }
}