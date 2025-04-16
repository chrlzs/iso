import { PIXI } from '../../utils/PixiWrapper.js';
import { UIComponent } from '../components/UIComponent.js';
import { Button } from '../components/Button.js';

/**
 * ConstructionUIOverlay - Overlay for building construction
 */
export class ConstructionUIOverlay extends UIComponent {
    /**
     * Creates a new construction UI overlay
     * @param {Object} options - Overlay options
     */
    constructor(options = {}) {
        super({
            id: 'constructionOverlay',
            interactive: true,
            ...options
        });
        
        // Building manager reference
        this.buildingManager = options.buildingManager || null;
        this.game = options.game || null;
        
        // Set dimensions to full screen
        if (this.game && this.game.app) {
            this.width = this.game.app.screen.width;
            this.height = this.game.app.screen.height;
        } else {
            this.width = options.width || 800;
            this.height = options.height || 600;
        }
        
        // Building types
        this.buildingTypes = options.buildingTypes || [
            { id: 'house', name: 'House', cost: 100 },
            { id: 'farm', name: 'Farm', cost: 200 },
            { id: 'mine', name: 'Mine', cost: 300 },
            { id: 'barracks', name: 'Barracks', cost: 400 }
        ];
        
        // Selected building type
        this.selectedBuildingType = null;
        
        // Create the overlay
        this.createOverlay();
        
        // Hide by default
        this.visible = false;
    }
    
    /**
     * Creates the construction overlay
     * @private
     */
    createOverlay() {
        // Create semi-transparent overlay
        this.background = new PIXI.Graphics();
        this.background.beginFill(0x000000, 0.3);
        this.background.drawRect(0, 0, this.width, this.height);
        this.background.endFill();
        this.addChild(this.background);
        
        // Create building panel
        this.createBuildingPanel();
        
        // Create placement grid
        this.createPlacementGrid();
        
        // Create cancel button
        this.createCancelButton();
    }
    
    /**
     * Creates the building panel
     * @private
     */
    createBuildingPanel() {
        // Create panel container
        this.buildingPanel = new PIXI.Container();
        this.buildingPanel.position.set(20, 20);
        this.addChild(this.buildingPanel);
        
        // Create panel background
        const panelBg = new PIXI.Graphics();
        panelBg.beginFill(0x000000, 0.8);
        panelBg.lineStyle(2, this.colors.primary, 0.8);
        panelBg.drawRect(0, 0, 200, 300);
        panelBg.endFill();
        this.buildingPanel.addChild(panelBg);
        
        // Create panel title
        const title = new PIXI.Text('BUILDINGS', {
            fontFamily: 'Arial',
            fontSize: 18,
            fill: this.colors.primary,
            stroke: this.colors.dark,
            strokeThickness: 2,
            align: 'center'
        });
        title.position.set(100, 15);
        title.anchor.set(0.5, 0);
        this.buildingPanel.addChild(title);
        
        // Create building buttons
        this.buildingButtons = [];
        
        this.buildingTypes.forEach((building, index) => {
            const button = new Button({
                text: `${building.name} (${building.cost})`,
                width: 180,
                height: 40,
                x: 10,
                y: 50 + (index * 50),
                onClick: () => this.selectBuildingType(building)
            });
            
            this.buildingPanel.addChild(button);
            this.buildingButtons.push(button);
        });
    }
    
    /**
     * Creates the placement grid
     * @private
     */
    createPlacementGrid() {
        // Create grid container
        this.gridContainer = new PIXI.Container();
        this.addChild(this.gridContainer);
        
        // Create grid graphics
        this.grid = new PIXI.Graphics();
        this.gridContainer.addChild(this.grid);
        
        // Create placement marker
        this.placementMarker = new PIXI.Graphics();
        this.gridContainer.addChild(this.placementMarker);
        
        // Create info text
        this.infoText = new PIXI.Text('', {
            fontFamily: 'Arial',
            fontSize: 14,
            fill: 0xFFFFFF,
            stroke: 0x000000,
            strokeThickness: 2,
            align: 'center'
        });
        this.infoText.position.set(this.width / 2, this.height - 50);
        this.infoText.anchor.set(0.5, 0);
        this.addChild(this.infoText);
    }
    
    /**
     * Creates the cancel button
     * @private
     */
    createCancelButton() {
        this.cancelButton = new Button({
            text: 'CANCEL',
            width: 100,
            height: 40,
            x: this.width - 120,
            y: 20,
            onClick: () => this.hide()
        });
        
        this.addChild(this.cancelButton);
    }
    
    /**
     * Selects a building type
     * @param {Object} buildingType - Building type to select
     * @private
     */
    selectBuildingType(buildingType) {
        this.selectedBuildingType = buildingType;
        
        // Update button states
        this.buildingButtons.forEach(button => {
            const buttonBuildingType = this.buildingTypes[this.buildingButtons.indexOf(button)];
            
            if (buttonBuildingType.id === buildingType.id) {
                button.background.clear();
                button.background.lineStyle(1, this.colors.accent, 1);
                button.background.beginFill(0x001122);
                button.background.drawRect(0, 0, button.width, button.height);
                button.background.endFill();
            } else {
                button.background.clear();
                button.background.lineStyle(1, this.colors.primary, 0.8);
                button.background.beginFill(0x000000);
                button.background.drawRect(0, 0, button.width, button.height);
                button.background.endFill();
            }
        });
        
        // Update info text
        this.infoText.text = `Selected: ${buildingType.name} - Cost: ${buildingType.cost} - Click on the map to place`;
    }
    
    /**
     * Updates the placement grid
     * @param {number} mouseX - Mouse X position
     * @param {number} mouseY - Mouse Y position
     */
    updatePlacementGrid(mouseX, mouseY) {
        if (!this.visible || !this.game || !this.game.world) return;
        
        // Get grid position from mouse coordinates
        const gridPos = this.game.world.screenToGrid(mouseX, mouseY);
        
        // Update placement marker
        this.placementMarker.clear();
        
        if (this.selectedBuildingType) {
            // Check if placement is valid
            const canPlace = this.buildingManager ? 
                this.buildingManager.canPlaceBuilding(gridPos.x, gridPos.y, this.selectedBuildingType.id) : 
                true;
            
            // Draw placement marker
            const screenPos = this.game.world.gridToScreen(gridPos.x, gridPos.y);
            
            this.placementMarker.lineStyle(2, canPlace ? 0x00FF00 : 0xFF0000, 0.8);
            this.placementMarker.beginFill(canPlace ? 0x00FF00 : 0xFF0000, 0.3);
            this.placementMarker.drawRect(
                screenPos.x - 32, 
                screenPos.y - 16, 
                64, 
                32
            );
            this.placementMarker.endFill();
        }
    }
    
    /**
     * Handles mouse down event
     * @param {number} x - Mouse X position
     * @param {number} y - Mouse Y position
     * @returns {boolean} Whether the event was handled
     */
    onMouseDown(x, y) {
        if (!this.visible || !this.selectedBuildingType) return false;
        
        // Get grid position from mouse coordinates
        const gridPos = this.game.world.screenToGrid(x, y);
        
        // Try to place building
        if (this.buildingManager) {
            const placed = this.buildingManager.placeBuilding(
                gridPos.x, 
                gridPos.y, 
                this.selectedBuildingType.id
            );
            
            if (placed) {
                // Hide overlay after successful placement
                this.hide();
                return true;
            }
        }
        
        return false;
    }
    
    /**
     * Shows the overlay
     */
    show() {
        super.show();
        
        // Reset selected building type
        this.selectedBuildingType = null;
        
        // Update button states
        this.buildingButtons.forEach(button => {
            button.background.clear();
            button.background.lineStyle(1, this.colors.primary, 0.8);
            button.background.beginFill(0x000000);
            button.background.drawRect(0, 0, button.width, button.height);
            button.background.endFill();
        });
        
        // Clear placement marker
        this.placementMarker.clear();
        
        // Clear info text
        this.infoText.text = 'Select a building type from the panel';
    }
    
    /**
     * Updates the overlay
     * @param {number} deltaTime - Time since last update in seconds
     */
    update(deltaTime) {
        if (!this.visible) return;
        
        // Update placement grid with current mouse position
        if (this.game && this.game.inputManager) {
            const mousePos = this.game.inputManager.getMousePosition();
            this.updatePlacementGrid(mousePos.x, mousePos.y);
        }
    }
    
    /**
     * Resizes the overlay
     * @param {number} width - New width
     * @param {number} height - New height
     */
    resize(width, height) {
        this.width = width;
        this.height = height;
        
        // Update background
        this.background.clear();
        this.background.beginFill(0x000000, 0.3);
        this.background.drawRect(0, 0, width, height);
        this.background.endFill();
        
        // Update cancel button position
        if (this.cancelButton) {
            this.cancelButton.x = width - 120;
        }
        
        // Update info text position
        if (this.infoText) {
            this.infoText.position.set(width / 2, height - 50);
        }
    }
}
