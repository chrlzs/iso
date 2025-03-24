export class MessageLog {
    constructor(config) {
        this.position = config.position;
        this.width = config.width;
        this.height = config.height;
        this.game = config.game;
        this.messages = [];
        this.maxMessages = 5;
        this.lineHeight = 20;
        this.padding = 10;
        this.font = '12px Arial';
    }

    addMessage(message) {
        // Split long messages into multiple lines
        const ctx = this.game.ctx;
        ctx.font = this.font;
        const words = message.split(' ');
        let lines = [];
        let currentLine = words[0];

        for (let i = 1; i < words.length; i++) {
            const word = words[i];
            const width = ctx.measureText(currentLine + " " + word).width;
            if (width < this.width - (this.padding * 2)) {
                currentLine += " " + word;
            } else {
                lines.push(currentLine);
                currentLine = word;
            }
        }
        lines.push(currentLine);

        // Add each line as a separate message
        lines.forEach(line => {
            this.messages.unshift(line);
        });

        // Trim messages to max length
        while (this.messages.length > this.maxMessages) {
            this.messages.pop();
        }
    }

    render(ctx) {
        // Draw message log background
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(this.position.x, this.position.y, this.width, this.height);

        // Draw messages
        ctx.fillStyle = '#ffffff';
        ctx.font = this.font;
        this.messages.forEach((message, index) => {
            ctx.fillText(
                message,
                this.position.x + this.padding,
                this.position.y + this.padding + (index * this.lineHeight)
            );
        });
    }

    update(deltaTime) {
        // Update logic here if needed
    }
}
