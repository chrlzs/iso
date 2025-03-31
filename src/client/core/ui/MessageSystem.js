/**
 * Handles in-game messages and dialog system
 * @class MessageSystem
 * @property {HTMLElement} container - Message container element
 * @property {boolean} isDisplaying - Whether a message is currently displayed
 * @property {Array<Message>} messageQueue - Queue of pending messages
 */

/**
 * @typedef {Object} MessageConfig
 * @property {string} text - Message content
 * @property {string} [type='info'] - Message type (info, warning, error)
 * @property {Array<MessageOption>} [options] - Dialog options
 * @property {string} [speaker] - Name of speaking character
 * @property {Function} [onShow] - Callback when message is shown
 * @property {Function} [onHide] - Callback when message is hidden
 */

/**
 * @typedef {Object} MessageOption
 * @property {string} text - Option text
 * @property {Function} action - Option callback function
 */

/**
 * @typedef {Object} MessageQueue
 * @property {Array<MessageConfig>} pending - Pending messages
 * @property {Array<MessageConfig>} history - Message history
 * @property {number} maxHistory - Maximum history size
 */

/**
 * @typedef {Object} MessageEvent
 * @property {string} type - Event type (show, hide, action)
 * @property {MessageConfig} message - Related message
 * @property {number} [index] - Option index if type is action
 */

/**
 * @typedef {Object} MessageAnimation
 * @property {string} type - Animation type (fade, slide, etc)
 * @property {number} duration - Animation duration in ms
 * @property {string} [easing] - Easing function name
 * @property {Function} [onComplete] - Animation complete callback
 */

/**
 * @typedef {Object} MessageTransition
 * @property {MessageAnimation} enter - Enter animation
 * @property {MessageAnimation} exit - Exit animation
 * @property {boolean} queueNext - Whether to queue next message
 */

export class MessageSystem {
    /**
     * Creates a new MessageSystem instance
     * @param {GameInstance} game - Reference to the main game instance
     * @param {Object} [options={}] - Configuration options
     * @param {number} [options.fadeTime=3000] - Message fade duration in milliseconds
     * @param {number} [options.maxMessages=5] - Maximum number of visible messages
     */
    constructor(game, options = {}) {
        this.game = game;
        this.messageQueue = [];
        this.isDisplaying = false;

        // Create dialog container if it doesn't exist
        this.container = document.createElement('div');
        this.container.className = 'message-dialog';
        this.container.style.display = 'none';
        document.body.appendChild(this.container);
    }

    /**
     * Queues a new message for display
     * @param {MessageConfig} messageConfig - Message configuration
     * @returns {void}
     */
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

    /**
     * Shows or hides the message system
     * @param {boolean} [visible=true] - Whether to show or hide
     * @returns {void}
     */
    setVisible(visible = true) {
        this.container.style.display = visible ? 'block' : 'none';
        this.isDisplaying = visible;
    }

    /**
     * Updates message states and animations
     * @param {number} deltaTime - Time elapsed since last update
     * @returns {void}
     */
    update(deltaTime) {
        // Placeholder for future implementation
    }

    /**
     * Renders the message system
     * @param {CanvasRenderingContext2D} ctx - The canvas rendering context
     * @returns {void}
     */
    render(ctx) {
        // Placeholder for future implementation
    }

    /**
     * Clears all current messages
     * @returns {void}
     */
    clear() {
        console.log('Clearing all messages');
        this.isDisplaying = false;
        this.container.style.display = 'none';
        this.messageQueue = [];
    }

    /**
     * Displays the next message in the queue
     * @private
     * @returns {void}
     */
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

    /**
     * Handles message events
     * @param {MessageEvent} event - Message event object
     * @returns {void}
     * @private
     */
    handleMessageEvent(event) {
        switch (event.type) {
            case 'show':
                if (event.message.onShow) event.message.onShow();
                break;
            case 'hide':
                if (event.message.onHide) event.message.onHide();
                break;
            case 'action':
                const option = event.message.options[event.index];
                if (option?.action) option.action();
                break;
        }
    }

    hide() {
        console.log('Hiding message dialog');
        this.isDisplaying = false;
        this.container.style.display = 'none';
        this.messageQueue = [];
    }
}


