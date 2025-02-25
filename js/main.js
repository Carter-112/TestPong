// Input handler
const Input = {
  // Keyboard state
  keys: {
    w: false,
    s: false,
    ArrowUp: false,
    ArrowDown: false,
    Escape: false,
    p: false
  },
  
  // Initialize input handlers
  init: function() {
    window.addEventListener('keydown', (e) => {
      if (e.key in this.keys) {
        this.keys[e.key] = true;
        e.preventDefault();
      }
    });
    
    window.addEventListener('keyup', (e) => {
      if (e.key in this.keys) {
        this.keys[e.key] = false;
        e.preventDefault();
        
        // Toggle pause menu on Escape or P
        if ((e.key === 'Escape' || e.key === 'p') && Game.gameState === 'playing') {
          UI.togglePanel('gameModePanel');
          Game.gameState = 'paused';
        } else if ((e.key === 'Escape' || e.key === 'p') && Game.gameState === 'paused') {
          UI.togglePanel('gameModePanel');
          Game.gameState = 'playing';
        }
      }
    });
  }
};

// Animation loop
let lastTime = 0;
let loopId = null;

function animate(currentTime = 0) {
  loopId = requestAnimationFrame(animate);
  
  // Calculate delta time in seconds
  const deltaTime = (currentTime - lastTime) / 1000;
  lastTime = currentTime;
  
  // Skip if delta time is too large (tab was inactive)
  if (deltaTime > 0.1) return;
  
  // Update the game state
  switch (Game.gameState) {
    case 'menu':
      // Update menu animation
      Renderer.updateMenu(deltaTime);
      break;
      
    case 'playing':
      // Update game logic
      Game.update(deltaTime);
      // Update 2.5D pop-out effects
      Renderer.updatePopOutEffects(deltaTime);
      break;
      
    case 'paused':
      // Just render the current state
      // Still update pop-out effects for visual appeal
      Renderer.updatePopOutEffects(deltaTime);
      break;
      
    case 'finished':
      // Game over animations
      Renderer.updatePopOutEffects(deltaTime);
      break;
  }
  
  // Render the scene
  Renderer.render();
}

// Initialize loading sequence
document.addEventListener('DOMContentLoaded', initLoading);

function initLoading() {
  // Update loading bar as assets are loaded
  const loadingBar = document.getElementById('loadingBar');
  const loadingText = document.getElementById('loadingText');
  
  let progress = 0;
  const interval = setInterval(() => {
    progress += 5;
    loadingBar.style.width = `${progress}%`;
    
    if (progress === 30) {
      loadingText.textContent = 'Initializing 3D Engine...';
    } else if (progress === 50) {
      loadingText.textContent = 'Loading Game Assets...';
    } else if (progress === 80) {
      loadingText.textContent = 'Preparing Cosmic Arena...';
    } else if (progress >= 100) {
      clearInterval(interval);
      loadingText.textContent = 'Ready to Play!';
      
      // Fade out loading screen
      setTimeout(() => {
        document.getElementById('loadingScreen').style.opacity = '0';
        setTimeout(() => {
          document.getElementById('loadingScreen').style.display = 'none';
          initGame();
        }, 1000);
      }, 500);
    }
  }, 80);
  
  // Initialize PayPal buttons
  Store.initPayPalButtons();
  
  // Set up event listeners for slider values
  UI.setupSliderListeners();
}

function initGame() {
  // Load stored settings if available
  Settings.loadSettings();
  
  // Initialize UI
  UI.init();
  
  // Display main menu
  document.getElementById('mainMenu').style.display = 'block';
  UI.activePanel = 'mainMenu';
  
  // Initialize the renderer and scene
  Renderer.init();
  
  // Create the game field
  Renderer.createGameField();
  
  // Create paddles
  Renderer.createPaddles();
  
  // Create the ball
  Renderer.createBall();
  
  // Initialize input handlers
  Input.init();
  
  // Initialize audio
  Audio.init();
  
  // Load player data
  Store.loadPlayerData();
  
  // Enter the animation loop
  animate();
  
  // Check for mobile device when loading
  if (Utils.isMobileDevice()) {
    detectDevice();
  }
  
  // Add event listeners for interactions
  addInteractionListeners();
}

function detectDevice() {
  // Check if mobile device
  if (Utils.isMobileDevice()) {
    // Show mobile controls
    document.getElementById('mobileControls').style.display = 'flex';
    Game.setupMobileControls();
    
    // Show mobile notification
    Utils.showNotification('Mobile Detected', 'Touch controls are enabled. You can also tilt your device to move the paddle.', 'info');
    
    // Set up device orientation for tilt controls
    if (window.DeviceOrientationEvent) {
      window.addEventListener('deviceorientation', handleTilt);
    }
  }
}

function handleTilt(event) {
  // Only use tilt controls for human-controlled paddles
  if (!Game.leftPaddle.userData.isAI) {
    // Use gamma (left/right tilt) for paddle movement
    const tilt = event.gamma;
    
    // Apply deadzone for stability
    if (Math.abs(tilt) < 5) {
      Game.leftPaddle.userData.direction = 0;
    } else {
      // Map tilt to paddle direction (-1 to 1)
      Game.leftPaddle.userData.direction = Math.max(-1, Math.min(1, -tilt / 20));
    }
  }
  
  if (!Game.rightPaddle.userData.isAI && Game.currentGameMode === 'human-vs-human') {
    // For right paddle in two-player mode, use beta (forward/back tilt)
    const tilt = event.beta;
    
    // Apply deadzone for stability
    if (Math.abs(tilt - 45) < 5) { // 45 is roughly neutral phone position
      Game.rightPaddle.userData.direction = 0;
    } else {
      // Map tilt to paddle direction (-1 to 1)
      Game.rightPaddle.userData.direction = Math.max(-1, Math.min(1, (tilt - 45) / 20));
    }
  }
}

/**
 * Add event listeners for better UI interactions
 */
function addInteractionListeners() {
  // Add form submission prevention
  document.querySelectorAll('form').forEach(form => {
    form.addEventListener('submit', function(e) {
      e.preventDefault();
      return false;
    });
  });
  
  // Make sure clicking input fields doesn't trigger other actions
  document.querySelectorAll('input, select').forEach(input => {
    input.addEventListener('click', function(e) {
      e.stopPropagation();
    });
    
    // Ensure proper focus and selection
    input.addEventListener('focus', function(e) {
      if (this.type === 'text' || this.type === 'email') {
        setTimeout(() => {
          this.select();
        }, 100);
      }
    });
  });
  
  // Make store items interactive
  document.querySelectorAll('.store-item').forEach(item => {
    item.addEventListener('mouseenter', function() {
      this.style.transform = 'scale(1.05)';
      this.style.transition = 'transform 0.2s ease-in-out';
    });
    
    item.addEventListener('mouseleave', function() {
      this.style.transform = 'scale(1)';
    });
  });
  
  // Ensure all panels can be properly scrolled
  document.querySelectorAll('.panel-content').forEach(panel => {
    panel.style.overflowY = 'auto';
    panel.style.maxHeight = '70vh';
    
    // Prevent propagation to ensure scrolling works
    panel.addEventListener('wheel', function(e) {
      e.stopPropagation();
    });
  });
}