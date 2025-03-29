export class MessageSystem {
    constructor(game) {
        this.game = game;
        this.messageQueue = [];
        this.currentMessage = null;
        this.isActive = false;
        this.createMessageContainer();
    }

    createMessageContainer() {
        this.container = document.createElement('div');
        this.container.className = 'message-system';
        this.container.style.display = 'none';
        document.body.appendChild(this.container);
    }

    getMessageLog() {
        if (!this._messageLog) {
            this._messageLog = this.game.uiManager.components.get('messageLog');
            if (!this._messageLog) {
                console.warn('MessageLog component not found in UIManager');
            }
        }
        return this._messageLog;
    }

    showMessage(messageConfig) {
        this.isActive = true;
        this.currentMessage = messageConfig;
        
        // Log the message to MessageLog if it's significant
        const messageLog = this.getMessageLog();
        if (messageLog) {
            if (messageConfig.speaker) {
                messageLog.addMessage(`${messageConfig.speaker}: ${messageConfig.text}`);
            } else if (messageConfig.logMessage) {
                messageLog.addMessage(messageConfig.text);
            }
        }
        
        this.container.innerHTML = `
            <div class="message-content">
                ${messageConfig.speaker ? `<div class="message-speaker">${messageConfig.speaker}</div>` : ''}
                <div class="message-text">${messageConfig.text}</div>
                <div class="message-options">
                    ${this.generateOptions(messageConfig)}
                </div>
            </div>
        `;
        
        this.container.style.display = 'block';
        
        // Add to active windows
        this.game.uiManager.activeWindows.add('messageSystem');
        
        // Add event listeners to options
        const options = this.container.querySelectorAll('.message-option');
        options.forEach((option, index) => {
            option.addEventListener('click', () => {
                const selectedOption = messageConfig.options[index];
                this.handleChoice(selectedOption);
            });
        });
    }

    generateOptions(messageConfig) {
        if (!messageConfig.options) {
            return '<button class="message-option">Next</button>';
        }
        
        return messageConfig.options
            .map(option => `<button class="message-option">${option.text}</button>`)
            .join('');
    }

    queueMessage(messageConfig) {
        this.messageQueue.push(messageConfig);
        if (!this.isActive) {
            this.next();
        }
    }

    next() {
        if (this.messageQueue.length > 0) {
            const nextMessage = this.messageQueue.shift();
            this.showMessage(nextMessage);
        } else {
            this.hide();
        }
    }

    hide() {
        this.isActive = false;
        this.currentMessage = null;
        this.container.style.display = 'none';
        this.game.uiManager.activeWindows.delete('messageSystem');
    }

    clear() {
        this.messageQueue = [];
        this.hide();
    }

    handleChoice(option) {
        const messageLog = this.getMessageLog();
        if (messageLog && this.currentMessage.speaker) {
            messageLog.addMessage(`[You chose: ${option.text}]`);
        }
        
        if (option.action) {
            option.action();
        }
        this.next();
    }
}


