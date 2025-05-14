/**
 * PrisonUI class
 * Manages prison-specific UI elements
 */

import { UI } from '@iso-game/core';
import { PIXI } from '@iso-game/core';

export class PrisonUI extends UI {
  /**
   * Creates a new prison UI
   * @param {Object} options - UI options
   */
  constructor(options = {}) {
    // Call parent constructor
    super(options);
    
    // Prison-specific UI elements
    this.prisonStatsPanel = null;
    this.prisonerManagementPanel = null;
    this.guardManagementPanel = null;
    this.buildingPanel = null;
    this.timeControlPanel = null;
    
    // Create prison-specific UI
    this.createPrisonUI();
    
    console.log('Prison UI initialized');
  }
  
  /**
   * Creates prison-specific UI elements
   * @private
   */
  createPrisonUI() {
    // Create prison stats panel
    this.createPrisonStatsPanel();
    
    // Create time control panel
    this.createTimeControlPanel();
    
    // Create building panel
    this.createBuildingPanel();
  }
  
  /**
   * Creates the prison stats panel
   * @private
   */
  createPrisonStatsPanel() {
    // Create container
    this.prisonStatsPanel = new PIXI.Container();
    this.prisonStatsPanel.x = 10;
    this.prisonStatsPanel.y = 10;
    this.addChild(this.prisonStatsPanel);
    
    // Create background
    const background = new PIXI.Graphics();
    background.beginFill(0x000000, 0.7);
    background.lineStyle(2, 0x00FFFF, 1);
    background.drawRoundedRect(0, 0, 200, 120, 10);
    background.endFill();
    this.prisonStatsPanel.addChild(background);
    
    // Create title
    const title = new PIXI.Text('Prison Stats', {
      fontFamily: 'Arial',
      fontSize: 16,
      fill: 0x00FFFF,
      align: 'center'
    });
    title.x = 10;
    title.y = 10;
    this.prisonStatsPanel.addChild(title);
    
    // Create stats text
    this.fundsText = new PIXI.Text('Funds: $10,000', {
      fontFamily: 'Arial',
      fontSize: 14,
      fill: 0xFFFFFF
    });
    this.fundsText.x = 10;
    this.fundsText.y = 40;
    this.prisonStatsPanel.addChild(this.fundsText);
    
    this.prisonersText = new PIXI.Text('Prisoners: 0/20', {
      fontFamily: 'Arial',
      fontSize: 14,
      fill: 0xFFFFFF
    });
    this.prisonersText.x = 10;
    this.prisonersText.y = 60;
    this.prisonStatsPanel.addChild(this.prisonersText);
    
    this.guardsText = new PIXI.Text('Guards: 0/5', {
      fontFamily: 'Arial',
      fontSize: 14,
      fill: 0xFFFFFF
    });
    this.guardsText.x = 10;
    this.guardsText.y = 80;
    this.prisonStatsPanel.addChild(this.guardsText);
  }
  
  /**
   * Creates the time control panel
   * @private
   */
  createTimeControlPanel() {
    // Create container
    this.timeControlPanel = new PIXI.Container();
    this.timeControlPanel.x = 10;
    this.timeControlPanel.y = 140;
    this.addChild(this.timeControlPanel);
    
    // Create background
    const background = new PIXI.Graphics();
    background.beginFill(0x000000, 0.7);
    background.lineStyle(2, 0x00FFFF, 1);
    background.drawRoundedRect(0, 0, 200, 80, 10);
    background.endFill();
    this.timeControlPanel.addChild(background);
    
    // Create title
    const title = new PIXI.Text('Time Control', {
      fontFamily: 'Arial',
      fontSize: 16,
      fill: 0x00FFFF,
      align: 'center'
    });
    title.x = 10;
    title.y = 10;
    this.timeControlPanel.addChild(title);
    
    // Create time text
    this.timeText = new PIXI.Text('Day 1 - 08:00', {
      fontFamily: 'Arial',
      fontSize: 14,
      fill: 0xFFFFFF
    });
    this.timeText.x = 10;
    this.timeText.y = 40;
    this.timeControlPanel.addChild(this.timeText);
    
    // Create speed buttons
    this.createSpeedButtons();
  }
  
  /**
   * Creates the building panel
   * @private
   */
  createBuildingPanel() {
    // Implementation will be added later
  }
  
  /**
   * Creates time speed control buttons
   * @private
   */
  createSpeedButtons() {
    // Implementation will be added later
  }
  
  /**
   * Updates the UI
   * @param {number} deltaTime - Time since last update in seconds
   * @override
   */
  update(deltaTime) {
    // Call parent update method
    super.update(deltaTime);
    
    // Update prison stats
    this.updatePrisonStats();
    
    // Update time display
    this.updateTimeDisplay();
  }
  
  /**
   * Updates prison stats display
   * @private
   */
  updatePrisonStats() {
    if (this.game) {
      // Update funds
      this.fundsText.text = `Funds: $${Math.floor(this.game.funds).toLocaleString()}`;
      
      // Update prisoners
      this.prisonersText.text = `Prisoners: ${this.game.prisoners.size}/${this.game.maxPrisoners}`;
      
      // Update guards
      this.guardsText.text = `Guards: ${this.game.guards.size}/5`;
    }
  }
  
  /**
   * Updates time display
   * @private
   */
  updateTimeDisplay() {
    if (this.game && this.game.prisonManager) {
      const pm = this.game.prisonManager;
      
      // Convert minutes to hours and minutes
      const hours = Math.floor(pm.currentTime / 60);
      const minutes = Math.floor(pm.currentTime % 60);
      
      // Format time string
      const timeString = `Day ${pm.day} - ${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
      
      // Update time text
      this.timeText.text = timeString;
    }
  }
}
