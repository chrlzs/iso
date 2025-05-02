// Create performance mode toggle button
const perfModeButton = document.createElement('button');
perfModeButton.textContent = 'PERF';
perfModeButton.title = 'Toggle Low Performance Mode';
perfModeButton.style.position = 'fixed';
perfModeButton.style.bottom = '10px';
perfModeButton.style.left = '460px'; // Position 50px from chunk debug button
perfModeButton.style.zIndex = '1001';

// Append the button to the document body
document.body.appendChild(perfModeButton);

// Add event listener for toggling performance mode
perfModeButton.addEventListener('click', () => {
    // Logic to toggle low performance mode
    console.log('Performance mode toggled');
});