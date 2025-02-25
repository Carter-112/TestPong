// Main Game Logic
const Game = {
  // Game objects
  leftPaddle: null,
  rightPaddle: null,
  ball: null,
  gameField: null,
  
  // Game state
  gameState: 'menu', // menu, playing, paused, gameOver, finished
  currentGameMode: 'ai-vs-ai',
  gameOverTime: 0,
  winner: null,
  isLoggedIn: false,
  currentUser: null,
  
  
  /**
   * Start the game
   */
  startGame: function() {
    // Hide main menu using UI system
    UI.hidePanel('mainMenu');
    
    // Reset game state
    this.resetGame();
    
    // Start the game
    this.gameState = 'playing';
    
    // Show score display
    document.querySelector('.score-container').style.display = 'flex';
    
    // Update score display
    UI.updateScoreDisplay();
    
    // Play background music if enabled
    Audio.startMusic();
    
    // Show mobile controls if on mobile device
    if (Utils.isMobileDevice()) {
      document.getElementById('mobileControls').style.display = 'flex';
      this.setupMobileControls();
    }
    
    // Connect to multiplayer server if multiplayer mode
    if (Multiplayer.isMultiplayer) {
      Multiplayer.connectToMultiplayerServer();
    }
  },
  
  /**
   * Reset the game to initial state
   */
  resetGame: function() {
    // Reset scores
    if (this.leftPaddle && this.rightPaddle) {
      this.leftPaddle.userData.score = 0;
      this.rightPaddle.userData.score = 0;
      UI.updateScoreDisplay();
    }
    
    // Reset ball
    this.resetBall();
    
    // Reset paddles
    this.resetPaddles();
    
    // Clear power-ups
    PowerUps.clearPowerUps();
    
    // Reset physics
    Physics.consecutiveHitCount = 0;
    Physics.stuckCounter = 0;
    
    // Reset power-up timer
    PowerUps.powerUpTimer = 0;
  },
  
  /**
   * Reset the ball to center
   */
  resetBall: function() {
    // Position ball at the center
    this.ball.position.set(0, 0, 0);
    
    // Set random direction
    const angle = (Math.random() - 0.5) * Math.PI / 2;
    const direction = Math.random() < 0.5 ? 1 : -1;
    
    this.ball.userData.velocity.x = Math.cos(angle) * Settings.settings.game.baseBallSpeed * direction;
    this.ball.userData.velocity.y = Math.sin(angle) * Settings.settings.game.baseBallSpeed / 2;
    this.ball.userData.velocity.z = 0;
    
    this.ball.userData.baseSpeed = Settings.settings.game.baseBallSpeed;
    this.ball.userData.speed = Settings.settings.game.baseBallSpeed;
    this.ball.userData.isGhost = false;
    this.ball.userData.ghostOpacity = 1;
    
    // Reset material
    this.ball.material.opacity = 0.9;
    
    // Add ball to the scene if it was removed
    if (!this.ball.parent) {
      Renderer.gameScene.add(this.ball);
    }
  },
  
  /**
   * Reset paddles to initial state
   */
  resetPaddles: function() {
    // Reset paddle positions
    this.leftPaddle.position.y = 0;
    this.rightPaddle.position.y = 0;
    
    // Reset paddle properties
    this.leftPaddle.userData.speed = Constants.PADDLE_SPEED;
    this.leftPaddle.userData.direction = 0;
    this.leftPaddle.userData.height = Constants.PADDLE_HEIGHT;
    this.leftPaddle.userData.activePowerUps = [];
    this.leftPaddle.userData.isFrozen = false;
    this.leftPaddle.userData.frozenUntil = 0;
    
    this.rightPaddle.userData.speed = Constants.PADDLE_SPEED;
    this.rightPaddle.userData.direction = 0;
    this.rightPaddle.userData.height = Constants.PADDLE_HEIGHT;
    this.rightPaddle.userData.activePowerUps = [];
    this.rightPaddle.userData.isFrozen = false;
    this.rightPaddle.userData.frozenUntil = 0;
    
    // Reset paddle scale
    this.leftPaddle.scale.y = 1;
    this.rightPaddle.scale.y = 1;
    
    // Set AI according to game mode
    this.updateGameMode();
  },
  
  /**
   * Set the game mode
   * @param {string} mode - The game mode to set
   */
  setGameMode: function(mode) {
    // Update buttons
    document.querySelectorAll('#gameModeButtons button').forEach(btn => {
      btn.classList.remove('active');
    });
    document.getElementById(mode).classList.add('active');
    
    // Set game mode
    this.currentGameMode = mode;
    Multiplayer.isMultiplayer = (mode === 'multiplayer');
    
    // Update game mode
    this.updateGameMode();
    
    // Show notification
    let modeName = mode.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    if (mode === 'multiplayer') modeName = 'Online Multiplayer';
    
    Utils.showNotification('Game Mode Changed', `Switched to ${modeName} mode`, 'info');
  },
  
  /**
   * Update game mode settings
   */
  updateGameMode: function() {
    if (!this.leftPaddle || !this.rightPaddle) return;
    
    switch (this.currentGameMode) {
      case 'ai-vs-ai':
        this.leftPaddle.userData.isAI = true;
        this.rightPaddle.userData.isAI = true;
        break;
      case 'human-vs-ai':
        this.leftPaddle.userData.isAI = false;
        this.rightPaddle.userData.isAI = true;
        break;
      case 'ai-vs-human':
        this.leftPaddle.userData.isAI = true;
        this.rightPaddle.userData.isAI = false;
        break;
      case 'human-vs-human':
        this.leftPaddle.userData.isAI = false;
        this.rightPaddle.userData.isAI = false;
        break;
      case 'multiplayer':
        this.leftPaddle.userData.isAI = false; // Local player
        this.rightPaddle.userData.isAI = false; // Remote player
        Multiplayer.isMultiplayer = true;
        break;
    }
    
    if (this.leftPaddle.userData.score !== undefined && this.rightPaddle.userData.score !== undefined) {
      UI.updateScoreDisplay();
    }
  },
  
  /**
   * Update human paddle controls
   */
  updateHumanPaddles: function() {
    // Left paddle control with W/S keys
    if (!this.leftPaddle.userData.isAI) {
      this.leftPaddle.userData.direction = 0;
      if (Input.keys.w) this.leftPaddle.userData.direction = 1;
      if (Input.keys.s) this.leftPaddle.userData.direction = -1;
    }
    
    // Right paddle control with arrow keys
    if (!this.rightPaddle.userData.isAI) {
      this.rightPaddle.userData.direction = 0;
      if (Input.keys.ArrowUp) this.rightPaddle.userData.direction = 1;
      if (Input.keys.ArrowDown) this.rightPaddle.userData.direction = -1;
    }
  },
  
  /**
   * Setup mobile controls
   */
  setupMobileControls: function() {
    // Set up touch events for mobile controls
    const leftUp = document.getElementById('leftPaddleUp');
    const leftDown = document.getElementById('leftPaddleDown');
    const rightUp = document.getElementById('rightPaddleUp');
    const rightDown = document.getElementById('rightPaddleDown');
    
    // Left paddle up button
    leftUp.addEventListener('touchstart', () => {
      Input.keys.w = true;
    });
    leftUp.addEventListener('touchend', () => {
      Input.keys.w = false;
    });
    
    // Left paddle down button
    leftDown.addEventListener('touchstart', () => {
      Input.keys.s = true;
    });
    leftDown.addEventListener('touchend', () => {
      Input.keys.s = false;
    });
    
    // Right paddle up button
    rightUp.addEventListener('touchstart', () => {
      Input.keys.ArrowUp = true;
    });
    rightUp.addEventListener('touchend', () => {
      Input.keys.ArrowUp = false;
    });
    
    // Right paddle down button
    rightDown.addEventListener('touchstart', () => {
      Input.keys.ArrowDown = true;
    });
    rightDown.addEventListener('touchend', () => {
      Input.keys.ArrowDown = false;
    });
  },
  
  /**
   * End the game
   * @param {string} winner - Which side won ('left' or 'right')
   */
  endGame: function(winner) {
    this.gameState = 'finished';
    
    // Display game over panel
    UI.showGameOverPanel(winner);
    
    // Award credits for winning games as player
    if ((this.currentGameMode === 'human-vs-ai' && winner === 'left') || 
        (this.currentGameMode === 'ai-vs-human' && winner === 'right') ||
        (this.currentGameMode === 'multiplayer' && winner === 'left')) {
      const creditsEarned = 50;
      Store.addCredits(creditsEarned);
      Utils.showNotification('Credits Earned', `You earned ${creditsEarned} credits for winning!`, 'success');
    }
    
    // Stop background music
    Audio.stopMusic();
  },
  
  /**
   * Play again after a game ends
   */
  playAgain: function() {
    // Remove game over panel
    const gameOverPanel = document.querySelector('.ui-panel[style*="z-index: 100"]');
    if (gameOverPanel) {
      document.body.removeChild(gameOverPanel);
    }
    
    // Reset and start a new game
    this.resetGame();
    this.gameState = 'playing';
    
    // Play background music if enabled
    Audio.startMusic();
  },
  
  /**
   * Return to main menu
   */
  showMainMenu: function() {
    // Remove game over panel
    const gameOverPanel = document.querySelector('.ui-panel[style*="z-index: 100"]');
    if (gameOverPanel) {
      document.body.removeChild(gameOverPanel);
    }
    
    // Reset game
    this.resetGame();
    this.gameState = 'menu';
    
    // Hide score display
    document.querySelector('.score-container').style.display = 'none';
    
    // Hide mobile controls if shown
    document.getElementById('mobileControls').style.display = 'none';
    
    // Show main menu using UI system
    UI.showPanel('mainMenu');
  },
  
  /**
   * Deploy the game to GitHub (passes to Deployment module)
   */
  deployToGitHub: function() {
    Deployment.deployToGitHub();
  },
  
  /**
   * Update the game state (called every frame)
   * @param {number} deltaTime - Time since last frame
   */
  update: function(deltaTime) {
    // Check max points before any other update.
    if (this.leftPaddle.userData.score >= Settings.settings.game.maxPoints || 
        this.rightPaddle.userData.score >= Settings.settings.game.maxPoints) {
      this.gameState = 'finished';
      return;
    }
    
    if (this.gameState === 'gameOver') {
      const targetY = (Constants.FIELD_HEIGHT - Constants.PADDLE_HEIGHT) / 2;
      this.leftPaddle.position.y += (targetY - this.leftPaddle.position.y) * 0.1;
      this.rightPaddle.position.y += (targetY - this.rightPaddle.position.y) * 0.1;
      if (Date.now() - this.gameOverTime >= 1000 / Settings.settings.game.gameSpeed) {
        this.resetBall();
        this.gameState = 'playing';
      }
      return;
    }
    
    if (this.gameState !== 'playing') return;
    
    // Update human paddle controls if applicable
    this.updateHumanPaddles();
    
    // Move AI paddles if applicable
    AI.updateAIPaddles();
    
    // Update paddles physics
    Physics.updatePaddles(deltaTime);
    
    // Update ball physics
    Physics.updateBall(deltaTime);
    
    // Update power-ups
    PowerUps.update(deltaTime);
  }
};