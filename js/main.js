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

// EMERGENCY FIX: Add error recovery to the game loop
let animationErrorCount = 0;
let lastAnimationErrorTime = 0;

// Global exception handler to catch any errors in the animation loop
window.addEventListener('error', function(event) {
  console.error('CAUGHT ERROR in game:', event.error);
  
  // Check if we're getting frequent errors
  const now = Date.now();
  if (now - lastAnimationErrorTime < 1000) {
    animationErrorCount++;
  } else {
    animationErrorCount = 1;
  }
  lastAnimationErrorTime = now;
  
  // If we have multiple errors in a short time, force recover the game
  if (animationErrorCount > 3) {
    console.warn('MULTIPLE ERRORS DETECTED - EMERGENCY RECOVERY');
    emergencyGameRecovery();
    animationErrorCount = 0;
  }
});

// Animation loop with safety catch
let lastTime = 0;
let loopId = null;
let lastSuccessfulAnimationTime = Date.now();

// Add a watchdog to detect animation loop freezes
setInterval(function() {
  const now = Date.now();
  if (now - lastSuccessfulAnimationTime > 2000) {
    console.warn('ANIMATION FREEZE DETECTED - EMERGENCY RECOVERY');
    emergencyGameRecovery();
  }
}, 2000);

// Emergency game recovery function
function emergencyGameRecovery() {
  console.warn("PERFORMING EMERGENCY GAME RECOVERY");
  
  try {
    // Force reset all game state
    Game.ball.position.set(0, 0, 0);
    Game.ball.userData.velocity.x = 0;
    Game.ball.userData.velocity.y = 0;
    Game.ball.userData.velocity.z = 0;
    
    // Reset any game state
    Game.gameState = 'playing';
    
    // Wait a moment then give the ball velocity
    setTimeout(() => {
      const angle = (Math.random() - 0.5) * Math.PI / 2;
      const direction = Math.random() < 0.5 ? 1 : -1;
      Game.ball.userData.velocity.x = Math.cos(angle) * Settings.settings.game.baseBallSpeed * direction;
      Game.ball.userData.velocity.y = Math.sin(angle) * Settings.settings.game.baseBallSpeed / 2;
      
      // Restart animation loop if needed
      if (!loopId) {
        console.log("Restarting animation loop");
        lastTime = 0;
        loopId = requestAnimationFrame(animate);
      }
    }, 1000);
    
    console.warn("EMERGENCY RECOVERY COMPLETE");
  } catch(e) {
    console.error("EMERGENCY RECOVERY FAILED:", e);
    // Last resort - if all else fails, refresh the page
    // window.location.reload();
  }
}

function animate(currentTime = 0) {
  try {
    // Update watchdog timer - animation is still running
    lastSuccessfulAnimationTime = Date.now();
    
    loopId = requestAnimationFrame(animate);
    
    // Calculate delta time in seconds
    const deltaTime = (currentTime - lastTime) / 1000;
    lastTime = currentTime;
    
    // Skip if delta time is too large (tab was inactive)
    if (deltaTime > 0.1) return;
    
    // Only check for invalid states - actual boundary checks are now in physics.js
    if (Game.ball) {
      // Handle emergency edge case - ball in invalid state
      if (Game.ball.position.x === undefined || 
          Game.ball.position.y === undefined ||
          isNaN(Game.ball.position.x) || 
          isNaN(Game.ball.position.y) || 
          Math.abs(Game.ball.position.x) > Constants.FIELD_WIDTH + 10) {
        console.warn("Ball in invalid state - forcing reset");
        emergencyGameRecovery();
        return;
      }
    }

  // Update the game state - TRY/CATCH each section for maximum robustness
  try {
    // ALWAYS update animations no matter what the game state is
    // This is critical to ensure animations never freeze
    Renderer.updatePopOutEffects(deltaTime);
    
    // Then handle specific game state logic
    switch (Game.gameState) {
      case 'menu':
        // Update menu animation
        Renderer.updateMenu(deltaTime);
        break;
        
      case 'playing':
        // Update game logic
        Game.update(deltaTime);
        break;
        
      case 'paused':
        // Just render the current state
        break;
        
      case 'finished':
        // Additional game over animations if needed
        break;
        
      // We no longer use gameOver state - removed completely
    }
  } catch (e) {
    console.error("ERROR in game state update:", e);
    // Auto-recover from state errors
    emergencyGameRecovery();
  }
  
  // Render the scene with try/catch for maximum resilience
  try {
    Renderer.render();
  } catch (e) {
    console.error("ERROR in renderer:", e);
    // Try to recover even from rendering errors
    emergencyGameRecovery();
  }
  } catch (e) {
    console.error("CRITICAL ERROR in animation loop:", e);
    emergencyGameRecovery();
  }
}

// Initialize loading sequence
document.addEventListener('DOMContentLoaded', initLoading);

function initLoading() {
  try {
    // Update loading bar as assets are loaded
    const loadingBar = document.getElementById('loadingBar');
    const loadingText = document.getElementById('loadingText');
    
    let progress = 0;
    const interval = setInterval(() => {
      progress += 5;
      loadingBar.style.width = `${progress}%`;
      
      if (progress === 20) {
        loadingText.textContent = 'Creating Star Background...';
        // Initialize UI first to ensure background animation starts
        try {
          UI.init();
          console.log("UI initialized with background");
        } catch (uiError) {
          console.error("UI initialization error:", uiError);
        }
      } else if (progress === 30) {
        loadingText.textContent = 'Initializing 3D Engine...';
      } else if (progress === 40) {
        // Initialize Store after UI is set up (moved to later in loading sequence)
        try {
          Store.init();
          console.log("Store initialized");
        } catch (storeError) {
          console.error("Store initialization error:", storeError);
        }
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
  
    // Set up event listeners for slider values
    try {
      UI.setupSliderListeners();
    } catch (uiError) {
      console.error("UI listener setup error:", uiError);
    }
  } catch (error) {
    console.error("Fatal loading error:", error);
    // Emergency recovery - try to show the game anyway
    document.getElementById('loadingScreen').style.display = 'none';
    initGame();
  }
}

function initGame() {
  try {
    console.log("Starting game initialization...");
    
    // Load stored settings if available
    Settings.loadSettings();
    
    // UI is now initialized earlier in the loading sequence
    // This ensures we don't reinitialize and lose the background animation
    if (!document.getElementById('backgroundStars')) {
      console.log("UI not initialized yet, initializing...");
      UI.init();
    } else {
      console.log("UI already initialized, skipping");
    }
    
    // Explicitly check and display main menu
    const mainMenu = document.getElementById('mainMenu');
    if (mainMenu) {
      console.log("Main menu element found, displaying...");
      mainMenu.style.display = 'block';
      UI.activePanel = 'mainMenu';
    } else {
      console.error("Main menu element not found!");
    }
    
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
    
    // Make sure Game is initialized correctly
    Game.gameState = 'menu';
    
    // Enter the animation loop
    animate();
    
    // Check for mobile device when loading
    if (Utils.isMobileDevice()) {
      detectDevice();
    }
    
    // Add event listeners for interactions
    addInteractionListeners();
    
    console.log("Game initialization complete");
  } catch (error) {
    console.error("ERROR during game initialization:", error);
    // Try to recover by forcing main menu display
    try {
      document.getElementById('mainMenu').style.display = 'block';
    } catch (e) {
      console.error("Could not recover from initialization error:", e);
    }
  }
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
  
  // Add explicit event listener for the Play Game button
  const playButton = document.getElementById('playGameButton');
  if (playButton) {
    // Remove the onclick attribute to prevent double execution
    playButton.removeAttribute('onclick');
    
    playButton.addEventListener('click', function() {
      console.log('Play button clicked, changing game state to playing');
      Game.startGame();
    });
    
    // Debug click handler to ensure it works
    playButton.addEventListener('mousedown', function() {
      console.log('Play button mousedown detected');
    });
  } else {
    console.error('Could not find Play Game button');
  }
  
  // Add event listener for the Account button
  const accountButton = document.getElementById('account-button');
  if (accountButton) {
    accountButton.addEventListener('click', function() {
      console.log('Account button clicked');
      UI.showPanel('accountPanel');
    });
  } else {
    console.error('Could not find Account button');
  }
  
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