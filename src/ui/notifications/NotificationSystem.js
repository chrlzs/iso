/**
 * Notification System for displaying construction progress and other notifications
 * Uses direct DOM manipulation to ensure visibility
 */
export class NotificationSystem {
    /**
     * Creates a new notification system
     * @param {Object} options - Options
     */
    constructor(options = {}) {
        this.game = options.game;
        this.notifications = [];
        this.container = null;

        // Create the notification container
        this.createContainer();

        // Notification system created
    }

    /**
     * Creates the notification container
     * @private
     */
    createContainer() {
        // Check if container already exists
        if (document.getElementById('notification-container')) {
            this.container = document.getElementById('notification-container');
            return;
        }

        // Create container
        this.container = document.createElement('div');
        this.container.id = 'notification-container';
        this.container.style.position = 'fixed';
        this.container.style.top = '10px';
        this.container.style.left = '50%';
        this.container.style.transform = 'translateX(-50%)';
        this.container.style.width = '300px';
        this.container.style.zIndex = '9999';
        this.container.style.fontFamily = 'Arial, sans-serif';
        this.container.style.textAlign = 'center';

        // Add to document
        document.body.appendChild(this.container);
    }

    /**
     * Shows a construction progress notification
     * @param {Object} options - Notification options
     * @returns {Object} Notification object
     */
    showConstructionProgress(options = {}) {
        const buildingType = options.buildingType || 'building';
        const gridX = options.gridX || 0;
        const gridY = options.gridY || 0;
        const buildTime = options.buildTime || 30;

        // Create notification element
        const notification = document.createElement('div');
        notification.className = 'notification construction-progress';
        notification.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
        notification.style.color = '#00ffff'; // Cyberpunk cyan color
        notification.style.padding = '10px';
        notification.style.marginBottom = '10px';
        notification.style.borderRadius = '5px';
        notification.style.boxShadow = '0 0 10px rgba(0, 255, 255, 0.5)';
        notification.style.border = '1px solid #00ffff';
        notification.style.textAlign = 'center';

        // Create title
        const title = document.createElement('div');
        title.className = 'notification-title';
        title.textContent = `BUILDING ${buildingType.toUpperCase()}`;
        title.style.fontWeight = 'bold';
        title.style.fontSize = '18px';
        title.style.marginBottom = '5px';
        title.style.textTransform = 'uppercase';
        title.style.letterSpacing = '1px';
        title.style.textShadow = '0 0 5px #00ffff';
        notification.appendChild(title);

        // Create coordinates
        const coords = document.createElement('div');
        coords.className = 'notification-coords';
        coords.textContent = `at (${gridX}, ${gridY})`;
        coords.style.fontSize = '14px';
        coords.style.marginBottom = '10px';
        coords.style.color = '#ff00ff'; // Cyberpunk magenta color
        notification.appendChild(coords);

        // Create progress container
        const progressContainer = document.createElement('div');
        progressContainer.className = 'progress-container';
        progressContainer.style.backgroundColor = '#111';
        progressContainer.style.height = '25px';
        progressContainer.style.position = 'relative';
        progressContainer.style.marginBottom = '5px';
        progressContainer.style.border = '1px solid #00ffff';
        progressContainer.style.boxShadow = 'inset 0 0 10px rgba(0, 0, 0, 0.5)';
        notification.appendChild(progressContainer);

        // Create progress bar
        const progressBar = document.createElement('div');
        progressBar.className = 'progress-bar';
        progressBar.style.backgroundColor = '#ff0000';
        progressBar.style.height = '100%';
        progressBar.style.width = '0%';
        progressBar.style.transition = 'width 0.5s ease-in-out, background-color 0.5s ease-in-out';
        progressBar.style.boxShadow = '0 0 10px rgba(255, 0, 0, 0.7)';
        progressContainer.appendChild(progressBar);

        // Create progress text
        const progressText = document.createElement('div');
        progressText.className = 'progress-text';
        progressText.textContent = '0%';
        progressText.style.position = 'absolute';
        progressText.style.top = '0';
        progressText.style.left = '0';
        progressText.style.right = '0';
        progressText.style.textAlign = 'center';
        progressText.style.lineHeight = '25px';
        progressText.style.fontWeight = 'bold';
        progressText.style.textShadow = '0 0 3px #000';
        progressText.style.color = '#fff';
        progressContainer.appendChild(progressText);

        // Add to container
        this.container.appendChild(notification);

        // Create notification object
        const notificationObj = {
            element: notification,
            progressBar: progressBar,
            progressText: progressText,
            buildProgress: 0,
            buildTime: buildTime,
            buildingType: buildingType,
            gridX: gridX,
            gridY: gridY,
            startTime: Date.now(),
            updateInterval: null,
            building: options.building
        };

        // Start update interval
        notificationObj.updateInterval = setInterval(() => {
            this.updateConstructionProgress(notificationObj);
        }, 100);

        // Add to notifications array
        this.notifications.push(notificationObj);

        return notificationObj;
    }

    /**
     * Updates a construction progress notification
     * @param {Object} notification - Notification object
     * @private
     */
    updateConstructionProgress(notification) {
        // Calculate progress
        const elapsedTime = (Date.now() - notification.startTime) / 1000;
        const progress = Math.min(1, elapsedTime / notification.buildTime);
        notification.buildProgress = progress;

        // Update progress bar
        notification.progressBar.style.width = `${progress * 100}%`;

        // Update progress text
        const progressPercent = Math.floor(progress * 100);
        notification.progressText.textContent = `${progressPercent}%`;

        // Update progress bar color - cyberpunk gradient
        if (progress < 0.25) {
            notification.progressBar.style.backgroundColor = '#ff0000'; // Red
            notification.progressBar.style.boxShadow = '0 0 10px rgba(255, 0, 0, 0.7)';
        } else if (progress < 0.5) {
            notification.progressBar.style.backgroundColor = '#ff00ff'; // Magenta
            notification.progressBar.style.boxShadow = '0 0 10px rgba(255, 0, 255, 0.7)';
        } else if (progress < 0.75) {
            notification.progressBar.style.backgroundColor = '#00ffff'; // Cyan
            notification.progressBar.style.boxShadow = '0 0 10px rgba(0, 255, 255, 0.7)';
        } else {
            notification.progressBar.style.backgroundColor = '#00ff00'; // Green
            notification.progressBar.style.boxShadow = '0 0 10px rgba(0, 255, 0, 0.7)';
        }

        // Make the progress text pulse
        const scale = 1.0 + 0.2 * Math.sin(Date.now() / 200);
        notification.progressText.style.transform = `scale(${scale})`;
        notification.progressText.style.transition = 'transform 0.1s ease-in-out';

        // Check if construction is complete
        if (progress >= 1) {
            // Clear update interval
            clearInterval(notification.updateInterval);

            // Update the building if it exists
            if (notification.building) {
                notification.building.isUnderConstruction = false;
                notification.building.isBuilt = true;
                notification.building.buildProgress = 1;

                // First try the gentle approach
                console.log(`Ensuring visibility for ${notification.building.buildingType} at (${notification.gridX}, ${notification.gridY})`);
                notification.building.ensureVisibility();

                // Then use the more aggressive approach
                console.log(`Forcing redraw for ${notification.building.buildingType} at (${notification.gridX}, ${notification.gridY})`);
                notification.building.forceRedraw();
                console.log('Building redraw complete');

                // Try multiple approaches at different intervals to ensure the building appears
                const delays = [500, 1000, 2000, 5000];
                delays.forEach((delay, index) => {
                    setTimeout(() => {
                        if (notification.building) {
                            // Alternate between gentle and aggressive approaches
                            if (index % 2 === 0) {
                                console.log(`Delayed visibility check at ${delay}ms...`);
                                notification.building.ensureVisibility();
                            } else {
                                console.log(`Delayed redraw at ${delay}ms...`);
                                notification.building.forceRedraw();
                            }
                        }
                    }, delay);
                });

                // Final check after all other attempts
                setTimeout(() => {
                    if (notification.building) {
                        console.log('FINAL ATTEMPT: Adding debug marker as last resort...');
                        // Add a debug marker
                        notification.building.addDebugMarker();

                        // Try to place the building in the world again if needed
                        if (!notification.building.parent || !notification.building.visible) {
                            console.log('Building still not visible, trying to place in world again...');
                            if (notification.building.world) {
                                notification.building.placeInWorld(notification.building.world, notification.gridX, notification.gridY);
                            }
                        }
                    }
                }, 10000); // 10 seconds later
            }

            // Show completion message
            this.showCompletionMessage(notification);

            // Also show a simple notification
            this.showNotification(`${notification.buildingType} construction complete!`, {
                type: 'success',
                duration: 8000 // Show for 8 seconds
            });

            // Remove notification after a delay
            setTimeout(() => {
                this.removeNotification(notification);
            }, 3000);
        }
    }

    /**
     * Shows a completion message
     * @param {Object} notification - Notification object
     * @private
     */
    showCompletionMessage(notification) {
        // Create message element
        const message = document.createElement('div');
        message.className = 'completion-message';
        message.style.position = 'fixed';
        message.style.top = '50%';
        message.style.left = '50%';
        message.style.transform = 'translate(-50%, -50%)';
        message.style.backgroundColor = 'rgba(0, 0, 0, 0.9)';
        message.style.color = '#00ffff'; // Cyberpunk cyan
        message.style.padding = '30px';
        message.style.borderRadius = '5px';
        message.style.boxShadow = '0 0 30px rgba(0, 255, 255, 0.7)';
        message.style.textAlign = 'center';
        message.style.zIndex = '10000';
        message.style.minWidth = '400px';
        message.style.border = '2px solid #00ffff';
        message.style.animation = 'pulse 2s infinite';

        // Add CSS animation
        const style = document.createElement('style');
        style.textContent = `
            @keyframes pulse {
                0% { box-shadow: 0 0 30px rgba(0, 255, 255, 0.7); }
                50% { box-shadow: 0 0 50px rgba(0, 255, 255, 0.9); }
                100% { box-shadow: 0 0 30px rgba(0, 255, 255, 0.7); }
            }
            @keyframes glitch {
                0% { transform: translate(0); }
                20% { transform: translate(-2px, 2px); }
                40% { transform: translate(-2px, -2px); }
                60% { transform: translate(2px, 2px); }
                80% { transform: translate(2px, -2px); }
                100% { transform: translate(0); }
            }
        `;
        document.head.appendChild(style);

        // Create title
        const title = document.createElement('div');
        title.className = 'message-title';
        title.textContent = 'CONSTRUCTION COMPLETE!';
        title.style.fontWeight = 'bold';
        title.style.fontSize = '28px';
        title.style.color = '#00ffff';
        title.style.marginBottom = '15px';
        title.style.textShadow = '0 0 10px #00ffff, 0 0 20px #00ffff';
        title.style.letterSpacing = '2px';
        title.style.textTransform = 'uppercase';
        title.style.animation = 'glitch 1s infinite';
        message.appendChild(title);

        // Create info
        const info = document.createElement('div');
        info.className = 'message-info';
        info.textContent = `${notification.buildingType.toUpperCase()} at (${notification.gridX}, ${notification.gridY})`;
        info.style.fontSize = '20px';
        info.style.marginBottom = '25px';
        info.style.color = '#ff00ff'; // Cyberpunk magenta
        message.appendChild(info);

        // Create close button
        const closeButton = document.createElement('button');
        closeButton.className = 'message-close';
        closeButton.textContent = 'CLOSE';
        closeButton.style.backgroundColor = '#111';
        closeButton.style.color = '#00ffff';
        closeButton.style.border = '1px solid #00ffff';
        closeButton.style.padding = '12px 25px';
        closeButton.style.borderRadius = '3px';
        closeButton.style.cursor = 'pointer';
        closeButton.style.fontWeight = 'bold';
        closeButton.style.fontSize = '16px';
        closeButton.style.letterSpacing = '1px';
        closeButton.style.boxShadow = '0 0 10px rgba(0, 255, 255, 0.5)';
        closeButton.style.transition = 'all 0.3s ease';
        closeButton.onmouseover = () => {
            closeButton.style.backgroundColor = '#00ffff';
            closeButton.style.color = '#000';
        };
        closeButton.onmouseout = () => {
            closeButton.style.backgroundColor = '#111';
            closeButton.style.color = '#00ffff';
        };
        closeButton.onclick = () => {
            document.body.removeChild(message);
        };
        message.appendChild(closeButton);

        // Add to document
        document.body.appendChild(message);

        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (document.body.contains(message)) {
                document.body.removeChild(message);
            }
        }, 5000);
    }

    /**
     * Removes a notification
     * @param {Object} notification - Notification object
     * @private
     */
    removeNotification(notification) {
        // Remove from DOM
        if (this.container.contains(notification.element)) {
            this.container.removeChild(notification.element);
        }

        // Remove from notifications array
        const index = this.notifications.indexOf(notification);
        if (index !== -1) {
            this.notifications.splice(index, 1);
        }
    }

    /**
     * Shows a simple notification
     * @param {string} message - Message to show
     * @param {Object} options - Notification options
     * @returns {Object} Notification object
     */
    showNotification(message, options = {}) {
        const type = options.type || 'info';
        const duration = options.duration || 5000;

        // Create notification element with cyberpunk styling
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        // Set background color based on type
        if (type === 'error') {
            notification.style.backgroundColor = 'rgba(255, 0, 0, 0.8)';
            notification.style.color = '#ffffff';
        } else if (type === 'success') {
            notification.style.backgroundColor = 'rgba(0, 255, 0, 0.8)';
            notification.style.color = '#000000';
        } else {
            notification.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
            notification.style.color = '#00ffff';
        }
        notification.style.padding = '15px';
        notification.style.marginBottom = '10px';
        notification.style.borderRadius = '5px';
        // Set box shadow and border based on type
        if (type === 'error') {
            notification.style.boxShadow = '0 0 10px rgba(255, 0, 0, 0.7)';
            notification.style.border = '1px solid #ff0000';
        } else if (type === 'success') {
            notification.style.boxShadow = '0 0 10px rgba(0, 255, 0, 0.7)';
            notification.style.border = '1px solid #00ff00';
        } else {
            notification.style.boxShadow = '0 0 10px rgba(0, 255, 255, 0.7)';
            notification.style.border = '1px solid #00ffff';
        }
        notification.style.textAlign = 'center';
        notification.style.fontWeight = 'bold';
        notification.style.fontSize = '16px';
        // Set text shadow based on type
        if (type === 'error') {
            notification.style.textShadow = '0 0 5px #ff0000';
        } else if (type === 'success') {
            notification.style.textShadow = '0 0 5px #00ff00';
        } else {
            notification.style.textShadow = '0 0 5px #00ffff';
        }

        // Create message
        notification.textContent = message.toUpperCase();

        // Add to container
        this.container.appendChild(notification);

        // Create notification object
        const notificationObj = {
            element: notification,
            type: type
        };

        // Auto-remove after duration
        setTimeout(() => {
            this.removeNotification(notificationObj);
        }, duration);

        // Add to notifications array
        this.notifications.push(notificationObj);

        return notificationObj;
    }

    /**
     * Disposes of the notification system
     */
    dispose() {
        // Clear all notifications
        this.notifications.forEach(notification => {
            if (notification.updateInterval) {
                clearInterval(notification.updateInterval);
            }
            if (this.container.contains(notification.element)) {
                this.container.removeChild(notification.element);
            }
        });

        // Clear notifications array
        this.notifications = [];

        // Remove container
        if (document.body.contains(this.container)) {
            document.body.removeChild(this.container);
        }
    }
}
