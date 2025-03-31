/**
 * Manages and displays temporary notifications and alerts
 * @class NotificationSystem
 */
export class NotificationSystem {
    /**
     * Creates a new NotificationSystem instance
     * @param {GameInstance} game - Reference to game instance
     * @param {Object} [options={}] - Configuration options
     * @param {number} [options.duration=3000] - Default notification duration in ms
     * @param {number} [options.maxNotifications=3] - Maximum concurrent notifications
     */
    constructor(game, options = {}) {
        this.game = game;
        this.duration = options.duration || 3000;
        this.maxNotifications = options.maxNotifications || 3;
        this.notifications = [];
        
        this.createContainer();
    }

    /**
     * Shows a new notification
     * @param {Object} config - Notification configuration
     * @param {string} config.message - Notification text
     * @param {string} [config.type='info'] - Notification type (info, warning, error)
     * @param {number} [config.duration] - Display duration in milliseconds
     * @returns {void}
     */
    show(config) {
        if (this.notifications.length >= this.maxNotifications) {
            console.warn('Maximum notifications reached');
            return;
        }

        const notification = document.createElement('div');
        notification.className = `notification ${config.type || 'info'}`;
        notification.textContent = config.message;

        this.container.appendChild(notification);
        this.notifications.push(notification);

        setTimeout(() => {
            this.removeNotification(notification);
        }, config.duration || this.duration);
    }

    /**
     * Creates the notification container
     * @private
     */
    createContainer() {
        this.container = document.createElement('div');
        this.container.className = 'notification-container';
        this.container.style.cssText = `
            position: fixed;
            top: 10px;
            right: 10px;
            display: flex;
            flex-direction: column;
            gap: 10px;
            z-index: 1000;
        `;
        document.body.appendChild(this.container);
    }

    /**
     * Updates notification states and animations
     * @param {number} deltaTime - Time elapsed since last update
     * @returns {void}
     */
    update(deltaTime) {
        // Placeholder for future update logic
    }

    /**
     * Removes a notification from display
     * @param {HTMLElement} notification - Notification element to remove
     * @private
     */
    removeNotification(notification) {
        this.container.removeChild(notification);
        this.notifications = this.notifications.filter(n => n !== notification);
    }
}