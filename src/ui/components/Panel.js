import { PIXI } from '../../utils/PixiWrapper.js';
import { UIComponent } from './UIComponent.js';
import { Button } from './Button.js';

/**
 * Panel - A customizable UI panel component
 */
export class Panel extends UIComponent {
    /**
     * Creates a new panel
     * @param {Object} options - Panel options
     */
    constructor(options = {}) {
        super({
            interactive: true,
            ...options
        });
        
        // Panel properties
        this.title = options.title || '';
        this.closable = options.closable !== false;
        this.draggable = options.draggable !== false;
        this.width = options.width || 300;
        this.height = options.height || 200;
        this.style = {
            fill: options.fill || this.colors.dark,
            alpha: options.alpha !== undefined ? options.alpha : 0.92,
            borderColor: options.borderColor || this.colors.primary,
            borderWidth: options.borderWidth || 1,
            cornerRadius: options.cornerRadius || 2,
            padding: options.padding || 10,
            gridColor: options.gridColor || this.colors.primary,
            gridAlpha: options.gridAlpha || 0.1,
            gridSpacing: options.gridSpacing || 20
        };
        
        // Dragging state
        this.isDragging = false;
        this.dragOffset = { x: 0, y: 0 };
        
        // Create the panel
        this.createPanel();
        
        // Set initial visibility
        this.visible = options.visible !== false;
    }
    
    /**
     * Creates the panel graphics
     * @private
     */
    createPanel() {
        // Create background with grid pattern
        this.background = new PIXI.Graphics();
        
        // Main dark background with gradient
        this.background.beginFill(this.style.fill, this.style.alpha);
        this.background.drawRect(0, 0, this.width, this.height);
        this.background.endFill();
        
        // Add cyberpunk grid pattern
        this.background.lineStyle(1, this.style.gridColor, this.style.gridAlpha);
        
        // Vertical lines
        for (let x = 0; x <= this.width; x += this.style.gridSpacing) {
            this.background.moveTo(x, 0);
            this.background.lineTo(x, this.height);
        }
        
        // Horizontal lines
        for (let y = 0; y <= this.height; y += this.style.gridSpacing) {
            this.background.moveTo(0, y);
            this.background.lineTo(this.width, y);
        }
        
        // Add neon border
        this.background.lineStyle(this.style.borderWidth, this.style.borderColor, 1);
        this.background.drawRect(0, 0, this.width, this.height);
        
        // Add angular accents in corners
        const accentSize = 15;
        this.background.lineStyle(1, this.style.borderColor, 0.5);
        // Top left
        this.background.moveTo(0, accentSize);
        this.background.lineTo(accentSize, 0);
        // Top right
        this.background.moveTo(this.width - accentSize, 0);
        this.background.lineTo(this.width, accentSize);
        // Bottom right
        this.background.moveTo(this.width, this.height - accentSize);
        this.background.lineTo(this.width - accentSize, this.height);
        // Bottom left
        this.background.moveTo(accentSize, this.height);
        this.background.lineTo(0, this.height - accentSize);
        
        this.addChild(this.background);
        
        // Create content container
        const contentY = this.title ? 40 : this.style.padding;
        this.contentContainer = new PIXI.Container();
        this.contentContainer.position.set(this.style.padding, contentY);
        this.addChild(this.contentContainer);
        
        // Add title if specified
        if (this.title) {
            this.titleText = new PIXI.Text(this.title, {
                ...this.styles.heading,
                fontSize: 16,
                stroke: this.style.borderColor,
                strokeThickness: 2,
                dropShadow: true,
                dropShadowColor: this.style.borderColor,
                dropShadowBlur: 4,
                dropShadowDistance: 0
            });
            this.titleText.position.set(this.width / 2, this.style.padding);
            this.titleText.anchor.set(0.5, 0);
            this.addChild(this.titleText);
        }
        
        // Add close button if closable
        if (this.closable) {
            this.closeButton = new Button({
                text: 'X',
                width: 24,
                height: 24,
                x: this.width - 30,
                y: 6,
                onClick: () => this.hide(),
                zIndex: 10
            });
            this.addChild(this.closeButton);
        }
        
        // Set up dragging if enabled
        if (this.draggable) {
            this.on('pointerdown', this.onDragStart.bind(this));
            this.on('pointermove', this.onDragMove.bind(this));
            this.on('pointerup', this.onDragEnd.bind(this));
            this.on('pointerupoutside', this.onDragEnd.bind(this));
        }
    }
    
    /**
     * Handles drag start
     * @param {PIXI.InteractionEvent} event - The interaction event
     * @private
     */
    onDragStart(event) {
        // Only start dragging if clicking on the title bar area
        const localPos = event.data.getLocalPosition(this);
        if (this.title && localPos.y < 40) {
            this.isDragging = true;
            this.dragOffset.x = localPos.x;
            this.dragOffset.y = localPos.y;
            this.cursor = 'grabbing';
        }
    }
    
    /**
     * Handles drag move
     * @param {PIXI.InteractionEvent} event - The interaction event
     * @private
     */
    onDragMove(event) {
        if (this.isDragging) {
            const newPosition = event.data.getLocalPosition(this.parent);
            this.x = newPosition.x - this.dragOffset.x;
            this.y = newPosition.y - this.dragOffset.y;
        }
    }
    
    /**
     * Handles drag end
     * @private
     */
    onDragEnd() {
        this.isDragging = false;
        this.cursor = 'pointer';
    }
    
    /**
     * Adds content to the panel
     * @param {PIXI.DisplayObject} content - Content to add
     */
    addContent(content) {
        this.contentContainer.addChild(content);
    }
    
    /**
     * Clears all content from the panel
     */
    clearContent() {
        while (this.contentContainer.children.length > 0) {
            this.contentContainer.removeChildAt(0);
        }
    }
    
    /**
     * Resizes the panel
     * @param {number} width - New width
     * @param {number} height - New height
     */
    resize(width, height) {
        // Store old dimensions
        const oldWidth = this.width;
        const oldHeight = this.height;
        
        // Update dimensions
        this.width = width;
        this.height = height;
        
        // If dimensions changed, recreate the panel
        if (this.width !== oldWidth || this.height !== oldHeight) {
            // Remove old elements
            this.removeChildren();
            
            // Create new panel
            this.createPanel();
        }
    }
    
    /**
     * Brings the panel to the front
     */
    bringToFront() {
        if (this.parent) {
            this.zIndex = 1000;
            if (this.parent.sortableChildren) {
                this.parent.sortChildren();
            }
        }
    }
}
