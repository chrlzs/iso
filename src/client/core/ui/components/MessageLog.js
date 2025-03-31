/**
 * Manages and displays in-game messages, notifications, and combat feedback
 * @class MessageLog
 */
export class MessageLog {
    /**
     * Creates a new MessageLog instance
     * @param {Object} config - Configuration object
     * @param {GameInstance} config.game - Reference to game instance
     * @param {Object} config.position - Log position
     * @param {number} config.position.x - X coordinate
     * @param {number} config.position.y - Y coordinate
     * @param {number} [config.width=300] - Log width in pixels
     * @param {number} [config.height=100] - Log height in pixels
     * @param {number} [config.messageLifetime=5000] - Message display duration in ms
     */
    constructor(config) {
        if (!config || !config.position) {
            throw new Error('MessageLog requires configuration with position');
        }
        
        this.position = config.position;
        this.width = config.width || 300;
        this.height = config.height || 100;
        this.game = config.game;
        this.messages = [];
        this.maxMessages = 5;
        this.lineHeight = 20;
        this.padding = 10;
        this.font = '12px Arial';
    }

    /**
     * Adds a new message to the log
     * @param {string} text - Message content
     * @param {string} [type='info'] - Message type (info, warning, error, combat)
     * @returns {void}
     */
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

    /**
     * Updates message states and animations
     * @param {number} deltaTime - Time elapsed since last update
     * @returns {void}
     */
    update(deltaTime) {
        // Update logic here if needed
    }

    /**
     * Renders the message log
     * @param {CanvasRenderingContext2D} ctx - The canvas rendering context
     * @returns {void}
     */
    render(ctx) {
        if (!ctx || !this.position) return;

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

    /**
     * Clears all messages from the log
     * @returns {void}
     */
    clear() {
        this.messages = [];
    }
}


