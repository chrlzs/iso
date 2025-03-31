export const UIStyles = {
    modalWindow: `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: rgba(0, 0, 0, 0.9);
        border: 2px solid #00f2ff;
        border-radius: 8px;
        padding: 20px;
        color: #fff;
        z-index: 100000;  // Increased z-index to be above all game elements
        display: none;
        flex-direction: column;
    `,

    closeButton: `
        position: absolute;
        top: 10px;
        right: 10px;
        width: 24px;
        height: 24px;
        background: none;
        border: 2px solid #00f2ff;
        border-radius: 50%;
        color: #00f2ff;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 14px;
        transition: all 0.2s ease;
        padding: 0;
        line-height: 1;
    `,

    modalTitle: `
        color: #00f2ff;
        font-size: 20px;
        margin: 0 0 20px 0;
        text-align: center;
        padding-right: 30px;
    `,

    modalContent: `
        flex: 1;
        overflow-y: auto;
        min-height: 100px;
    `,

    createModalWindow(config = {}) {
        const container = document.createElement('div');
        container.className = `modal-window ${config.className || ''}`;
        container.style.cssText = this.modalWindow + `
            width: ${config.width || 400}px;
            height: ${config.height || 300}px;
        `;

        // Add close button
        const closeButton = document.createElement('button');
        closeButton.innerHTML = '×';
        closeButton.style.cssText = this.closeButton;
        closeButton.onclick = config.onClose || (() => container.style.display = 'none');
        container.appendChild(closeButton);

        // Add title if provided
        if (config.title) {
            const title = document.createElement('h2');
            title.textContent = config.title;
            title.style.cssText = this.modalTitle;
            container.appendChild(title);
        }

        return container;
    }
};
