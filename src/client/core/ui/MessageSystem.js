class MessageSystem {
    constructor(game) {
        this.game = game;
        this.messageQueue = [];
        this.isDisplaying = false;
        
        // Create dialog container if it doesn't exist
        this.container = document.createElement('div');
        this.container.className = 'message-dialog';
        this.container.style.display = 'none';
        document.body.appendChild(this.container);
    }

    queueMessage(messageConfig) {
        console.log('Queueing message:', {
            text: messageConfig.text,
            speaker: messageConfig.speaker,
            hasOptions: !!messageConfig.options,
            optionsCount: messageConfig.options?.length
        });
        
        // Ensure options are properly structured
        if (messageConfig.options) {
            messageConfig.options = messageConfig.options.map(option => ({
                text: option.text,
                action: typeof option.action === 'function' ? option.action : () => {
                    console.warn('No action defined for option:', option.text);
                }
            }));
        }

        this.messageQueue.push(messageConfig);
        
        if (!this.isDisplaying) {
            this.displayNextMessage();
        }
    }

    displayNextMessage() {
        if (this.messageQueue.length === 0) {
            this.isDisplaying = false;
            this.container.style.display = 'none';
            return;
        }

        const message = this.messageQueue[0];
        console.log('Displaying message:', {
            text: message.text,
            speaker: message.speaker,
            hasOptions: !!message.options,
            optionsCount: message.options?.length
        });

        this.isDisplaying = true;
        this.container.innerHTML = `
            <div class="dialog-header">
                <h3>${message.speaker || ''}</h3>
            </div>
            <div class="dialog-content">
                <p>${message.text}</p>
                ${message.options ? `
                    <div class="dialog-options">
                        ${message.options.map((option, index) => `
                            <button class="dialog-option" data-option="${index}">
                                ${option.text}
                            </button>
                        `).join('')}
                    </div>
                ` : ''}
            </div>
        `;

        // Add click handlers for options
        if (message.options) {
            this.container.querySelectorAll('.dialog-option').forEach((button, index) => {
                button.addEventListener('click', () => {
                    console.log('Dialog option clicked:', index);
                    if (typeof message.options[index].action === 'function') {
                        message.options[index].action();
                        // Remove the current message after action is executed
                        this.messageQueue.shift();
                        this.displayNextMessage();
                    } else {
                        console.error('Invalid action for option:', message.options[index]);
                    }
                });
            });
        }

        this.container.style.display = 'block';
        
        if (message.onShow) {
            message.onShow();
        }
    }

    hide() {
        console.log('Hiding message dialog');
        this.isDisplaying = false;
        this.container.style.display = 'none';
        this.messageQueue = [];
    }
}

export { MessageSystem };


