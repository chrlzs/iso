/**
 * Launcher for the game profiler
 * 
 * This script provides a simple way to launch the profiler from the game.
 */

/**
 * Launches the game profiler in a new window
 * @param {Object} gameInstance - The game instance to profile
 */
export function launchProfiler(gameInstance) {
    // Make the game instance available to the profiler window
    window.gameInstance = gameInstance;
    
    // Open the profiler in a new window
    const profilerWindow = window.open('./debug/profile.html', 'GameProfiler', 'width=900,height=800,resizable=yes');
    
    // Handle window close
    profilerWindow.addEventListener('beforeunload', () => {
        // Clean up
        delete window.gameInstance;
    });
    
    return profilerWindow;
}

/**
 * Adds a profiler button to the game UI
 * @param {Object} gameInstance - The game instance to profile
 */
export function addProfilerButton(gameInstance) {
    // Create button
    const button = document.createElement('button');
    button.textContent = 'Profile Game';
    button.style.position = 'fixed';
    button.style.bottom = '10px';
    button.style.right = '10px';
    button.style.zIndex = '1000';
    button.style.padding = '8px 12px';
    button.style.backgroundColor = '#4CAF50';
    button.style.color = 'white';
    button.style.border = 'none';
    button.style.borderRadius = '4px';
    button.style.cursor = 'pointer';
    button.style.fontFamily = 'Arial, sans-serif';
    button.style.fontSize = '14px';
    
    // Add hover effect
    button.addEventListener('mouseover', () => {
        button.style.backgroundColor = '#45a049';
    });
    
    button.addEventListener('mouseout', () => {
        button.style.backgroundColor = '#4CAF50';
    });
    
    // Add click handler
    button.addEventListener('click', () => {
        launchProfiler(gameInstance);
    });
    
    // Add to document
    document.body.appendChild(button);
    
    return button;
}

// Add keyboard shortcut (Ctrl+Shift+P) to launch profiler
document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.shiftKey && e.key === 'P' && window.gameInstance) {
        e.preventDefault();
        launchProfiler(window.gameInstance);
    }
});
