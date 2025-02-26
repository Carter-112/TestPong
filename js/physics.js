// Physics Engine
const Physics = {
  // Counter for consecutive hits (for rally speed boost)
  consecutiveHitCount: 0,
  
  // Counter for balls that might be stuck
  stuckCounter: 0,
  
  /**
   * Update ball physics
   * @param {number} deltaTime - Time since last frame
   */
  updateBall: function(deltaTime) {
    // FUNDAMENTAL FIX: Calculate the new position BEFORE applying it
    // This way we can check if the ball will cross boundaries
    const newX = Game.ball.position.x + Game.ball.userData.velocity.x * deltaTime * Settings.settings.game.gameSpeed;
    const newY = Game.ball.position.y + 
    let velocityY = Game.ball.userData.velocity.y;

    // Restrict Y velocity to prevent excessive top/bottom bouncing
    if (Math.abs(velocityY) > 2.5) {
        velocityY = Math.sign(velocityY) * 2.5;
    } else if (Math.abs(velocityY) < 1.0) {
        velocityY = Math.sign(velocityY) * 1.5; 
    }

    Game.ball.userData.velocity.y = velocityY;
    
    
    // Check boundaries - LEFT SIDE
    if (newX < -Constants.FIELD_WIDTH / 2) {
      // NEVER update position past the boundary
      console.log("Ball about to hit left boundary");
      
      // Right player scores
      Game.rightPaddle.userData.score++;
      UI.updateScoreDisplay();
      
      // Play score sound
      Audio.playSoundWithVolume(Audio.sounds.score);
      
      // CRITICAL: Bounce the ball back instead of resetting
      // This allows animation to continue without interruption
      Game.ball.userData.velocity.x = -Game.ball.userData.velocity.x;
      Game.ball.position.x = -Constants.FIELD_WIDTH / 2 + Constants.BALL_RADIUS;
      
      // Display message instead of stopping animation
      UI.showGameMessage("SCORE!", Game.rightPaddle.userData.score + " - " + Game.leftPaddle.userData.score);
      
      // Hide message after a delay
      setTimeout(() => {
        UI.hideGameMessage();
      }, 1000);
      
      // Add some randomness to the bounce
      const angle = (Math.random() - 0.5) * Math.PI / 4;
      const newVelX = Game.ball.userData.velocity.x;
      const newVelY = Math.sin(angle) * Math.abs(newVelX) * 0.75;
      Game.ball.userData.velocity.y = newVelY;
      
      // Do NOT return - continue with animation
    }
    
    // Check boundaries - RIGHT SIDE
    if (newX > Constants.FIELD_WIDTH / 2) {
      // NEVER update position past the boundary
      console.log("Ball about to hit right boundary");
      
      // Left player scores
      Game.leftPaddle.userData.score++;
      UI.updateScoreDisplay();
      
      // Play score sound
      Audio.playSoundWithVolume(Audio.sounds.score);
      
      // CRITICAL: Bounce the ball back instead of resetting
      // This allows animation to continue without interruption
      Game.ball.userData.velocity.x = -Game.ball.userData.velocity.x;
      Game.ball.position.x = Constants.FIELD_WIDTH / 2 - Constants.BALL_RADIUS;
      
      // Display message instead of stopping animation
      UI.showGameMessage("SCORE!", Game.leftPaddle.userData.score + " - " + Game.rightPaddle.userData.score);
      
      // Hide message after a delay
      setTimeout(() => {
        UI.hideGameMessage();
      }, 1000);
      
      // Add some randomness to the bounce
      const angle = (Math.random() - 0.5) * Math.PI / 4;
      const newVelX = Game.ball.userData.velocity.x;
      const newVelY = Math.sin(angle) * Math.abs(newVelX) * 0.75;
      Game.ball.userData.velocity.y = newVelY;
      
      // Do NOT return - continue with animation
    }
    
    // SAFE TO UPDATE: Only if ball is staying within bounds
    Game.ball.position.x = newX;
    Game.ball.position.y = newY;
    
    // For 2.5D effect: move ball in z axis with damping
    if (Game.ball.userData.velocity.z) {
      Game.ball.position.z += Game.ball.userData.velocity.z * deltaTime * Settings.settings.game.gameSpeed;
      Game.ball.userData.velocity.z *= 0.95; // Damping
      
      // Keep ball within reasonable z bounds for 2.5D effect
      if (Game.ball.position.z < 2) {
        Game.ball.position.z = 2;
        Game.ball.userData.velocity.z = Math.abs(Game.ball.userData.velocity.z) * 0.5;
      } else if (Game.ball.position.z > 8) {
        Game.ball.position.z = 8;
        Game.ball.userData.velocity.z = -Math.abs(Game.ball.userData.velocity.z) * 0.5;
      }
      
      // Adjust ball size based on z position for depth effect
      const scale = 1 + (Game.ball.position.z - 4) / 16;
      Game.ball.scale.set(scale, scale, scale);
      
      // Adjust ball shadow
      if (Game.ballShadow) {
        const shadowScale = 0.7 + (Game.ball.position.z - 4) / 20;
        Game.ballShadow.scale.set(shadowScale, shadowScale, 1);
        Game.ballShadow.material.opacity = 0.3 - (Game.ball.position.z - 4) / 40;
      }
    }
    
    // Check collision with top and bottom walls
    const fieldHalfHeight = Constants.FIELD_HEIGHT / 2 - Constants.BALL_RADIUS;
    if (Game.ball.position.y > fieldHalfHeight || Game.ball.position.y < -fieldHalfHeight) {
      // Store previous position y to prevent continuous wall triggering
      const prevY = Game.ball.position.y;
      
      // Reverse velocity
      Game.ball.userData.velocity.y *= -1;
      
      // STRONGLY enforce position correction to ensure ball is not stuck in the wall
      // Use a larger offset to be absolutely sure we're clear of the wall
      if (Game.ball.position.y > fieldHalfHeight) {
        Game.ball.position.y = fieldHalfHeight - 0.3;
      } else if (Game.ball.position.y < -fieldHalfHeight) {
        Game.ball.position.y = -fieldHalfHeight + 0.3;
      }
      
      // Add randomness to bounce based on settings
      Game.ball.userData.velocity.y += (Math.random() - 0.5) * (Settings.settings.game.randomnessLevel / 50);
      
      // Add slight z-velocity for 2.5D effect
      Game.ball.userData.velocity.z = (Math.random() - 0.5) * 3;
      
      // Play wall collision sound
      Audio.playSoundWithVolume(Audio.sounds.wall);
      
      // Add visual effect for wall hit
      Utils.createImpactEffect(
        Game.ball.position.x, 
        prevY > 0 ? fieldHalfHeight : -fieldHalfHeight, 
        Game.ball.position.z, 
        0x00ffff
      );
      
      // Add camera shake for 2.5D effect
      if (Math.abs(Game.ball.userData.velocity.y) > 5) {
        Renderer.createCameraShake(0.2);
      }
    }
    
    // Rotate ball based on velocity for 2.5D effect
    if (Game.ball) {
      Game.ball.rotation.z -= Game.ball.userData.velocity.x * deltaTime * 0.2;
      Game.ball.rotation.x += Game.ball.userData.velocity.y * deltaTime * 0.2;
    }
    
    // Check for gravity well effects
    PowerUps.gravityWells.forEach(well => {
      if (Date.now() < well.expiresAt) {
        const dx = well.mesh.position.x - Game.ball.position.x;
        const dy = well.mesh.position.y - Game.ball.position.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < well.radius) {
          const force = well.strength * (1 - distance / well.radius) * 0.2;
          Game.ball.userData.velocity.x += (dx / distance) * force;
          Game.ball.userData.velocity.y += (dy / distance) * force;
        }
      }
    });
    
    // Check for obstacle collisions
    PowerUps.obstacles.forEach(obstacle => {
      if (Math.abs(Game.ball.position.x - obstacle.position.x) < obstacle.width/2 + Constants.BALL_RADIUS &&
          Math.abs(Game.ball.position.y - obstacle.position.y) < obstacle.height/2 + Constants.BALL_RADIUS) {
        
        // Determine which side of the obstacle was hit
        const dx = Game.ball.position.x - obstacle.position.x;
        const dy = Game.ball.position.y - obstacle.position.y;
        
        if (Math.abs(dx) / (obstacle.width/2) > Math.abs(dy) / (obstacle.height/2)) {
          // Horizontal collision (left/right)
          Game.ball.userData.velocity.x *= -1;
          
          // Position correction
          const penetration = (obstacle.width/2 + Constants.BALL_RADIUS) - Math.abs(dx);
          Game.ball.position.x += (dx > 0 ? penetration : -penetration);
        } else {
          // Vertical collision (top/bottom)
          Game.ball.userData.velocity.y *= -1;
          
          // Position correction
          const penetration = (obstacle.height/2 + Constants.BALL_RADIUS) - Math.abs(dy);
          Game.ball.position.y += (dy > 0 ? penetration : -penetration);
        }
        
        // Add randomness to bounce
        Game.ball.userData.velocity.x += (Math.random() - 0.5) * 0.5;
        Game.ball.userData.velocity.y += (Math.random() - 0.5) * 0.5;
        
        // Play collision sound
        Audio.playSoundWithVolume(Audio.sounds.wall);
        
        // Create impact visual effect
        Utils.createImpactEffect(Game.ball.position.x, Game.ball.position.y, Game.ball.position.z, 0x795548);
      }
    });
    
    // Check for teleport portal interactions
    PowerUps.teleportMarkers.forEach(teleport => {
      const distanceToEntrance = Game.ball.position.distanceTo(teleport.entrancePosition);
      if (distanceToEntrance < teleport.radius && 
          Date.now() - teleport.lastTeleport > 1000) { // Prevent too frequent teleports
        
        // Teleport the ball
        Game.ball.position.copy(teleport.exitPosition);
        
        // Slightly randomize exit velocity to prevent loops
        const speed = Game.ball.userData.velocity.length();
        const angle = Math.atan2(Game.ball.userData.velocity.y, Game.ball.userData.velocity.x);
        const newAngle = angle + (Math.random() - 0.5) * Math.PI / 4;
        
        Game.ball.userData.velocity.x = Math.cos(newAngle) * speed;
        Game.ball.userData.velocity.y = Math.sin(newAngle) * speed;
        
        // Add teleport visual effect
        Utils.createTeleportEffect(teleport.entrancePosition, teleport.exitPosition);
        
        // Play teleport sound
        Audio.playSoundWithVolume(Audio.sounds.teleport || Audio.sounds.powerUp);
        
        // Update last teleport time
        teleport.lastTeleport = Date.now();
      }
    });
    
    // Check for paddle collisions
    this.checkPaddleCollisions();
    
    // We no longer use this - scoring is handled at the top of updateBall
    // this.checkScoring();
    
    // ANIMATION DEBUG: Always update visual effects whether or not we score
    // This ensures animations keep running
    console.log("ANIMATION DEBUG: Updating ball visual effects");
    
    // Apply magnet effect if active
    PowerUps.applyMagnetEffect();
    
    // Update ball ghost effect if active
    if (Game.ball.userData.isGhost) {
      Game.ball.material.opacity = Game.ball.userData.ghostOpacity;
    }
    
    // Update ball trail - CRITICAL for animation
    Renderer.updateBallTrail();
    
    // Handle balls that get stuck
    this.handleStuckBall();
  },
  
  /**
   * Check for collisions with paddles
   */
  checkPaddleCollisions: function() {
    // Left paddle collision
    if (Game.ball.position.x - Constants.BALL_RADIUS <= Game.leftPaddle.position.x + Constants.PADDLE_WIDTH / 2 &&
        Game.ball.position.x > Game.leftPaddle.position.x - Constants.PADDLE_WIDTH / 2 &&
        Game.ball.position.y >= Game.leftPaddle.position.y - Game.leftPaddle.userData.height / 2 &&
        Game.ball.position.y <= Game.leftPaddle.position.y + Game.leftPaddle.userData.height / 2) {
      
      // Calculate hit point relative to paddle center
      const relativeHitPoint = (Game.ball.position.y - Game.leftPaddle.position.y) / (Game.leftPaddle.userData.height / 2);
      
      // Add randomness based on settings
      const randomFactor = (Math.random() - 0.5) * (Settings.settings.game.randomnessLevel / 100) * Math.PI;
      let angle = relativeHitPoint * (70 * Math.PI / 180) + randomFactor;
      
      // Rally speedup
      this.consecutiveHitCount++;
      const quadraticRallyFactor = Math.min(5, 1 + Math.pow(this.consecutiveHitCount / 10, 2));
      const extraSpeed = this.consecutiveHitCount * Settings.settings.game.extraSpeedFactor * quadraticRallyFactor;
      
      // Add paddle movement influence
      const paddleInfluence = Math.abs(Game.leftPaddle.userData.direction) * 0.3;
      const newSpeed = Game.ball.userData.speed + paddleInfluence + extraSpeed;
      
      // Apply new velocity
      Game.ball.userData.velocity.x = Math.abs(newSpeed * Math.cos(angle));
      Game.ball.userData.velocity.y = newSpeed * Math.sin(angle);
      
      // Apply super shot if active
      const appliedSuperShot = PowerUps.applySuperShot(Game.leftPaddle);
      
      // Add slight z-velocity for 2.5D pop-out effect (more if super shot)
      Game.ball.userData.velocity.z = (Math.random() - 0.5) * (appliedSuperShot ? 4 : 2);
      
      // Play paddle collision sound
      Audio.playSoundWithVolume(Audio.sounds.paddle);
      
      // Add visual effect for paddle hit
      Utils.createImpactEffect(
        Game.leftPaddle.position.x + Constants.PADDLE_WIDTH / 2, 
        Game.ball.position.y, 
        0, 
        appliedSuperShot ? 0xFFC107 : 0x00fcff
      );
      
      // Trigger paddle hit animation for 2.5D effect
      Renderer.triggerPaddleHitAnimation(Game.leftPaddle);
      
      // Reset stuck counter
      this.stuckCounter = 0;
    }
    
    // Right paddle collision
    if (Game.ball.position.x + Constants.BALL_RADIUS >= Game.rightPaddle.position.x - Constants.PADDLE_WIDTH / 2 &&
        Game.ball.position.x < Game.rightPaddle.position.x + Constants.PADDLE_WIDTH / 2 &&
        Game.ball.position.y >= Game.rightPaddle.position.y - Game.rightPaddle.userData.height / 2 &&
        Game.ball.position.y <= Game.rightPaddle.position.y + Game.rightPaddle.userData.height / 2) {
      
      // Calculate hit point relative to paddle center
      const relativeHitPoint = (Game.ball.position.y - Game.rightPaddle.position.y) / (Game.rightPaddle.userData.height / 2);
      
      // Add randomness based on settings
      const randomFactor = (Math.random() - 0.5) * (Settings.settings.game.randomnessLevel / 100) * Math.PI;
      let angle = relativeHitPoint * (70 * Math.PI / 180) + randomFactor;
      
      // Rally speedup
      this.consecutiveHitCount++;
      const quadraticRallyFactor = Math.min(5, 1 + Math.pow(this.consecutiveHitCount / 10, 2));
      const extraSpeed = this.consecutiveHitCount * Settings.settings.game.extraSpeedFactor * quadraticRallyFactor;
      
      // Add paddle movement influence
      const paddleInfluence = Math.abs(Game.rightPaddle.userData.direction) * 0.3;
      const newSpeed = Game.ball.userData.speed + paddleInfluence + extraSpeed;
      
      // Apply new velocity
      Game.ball.userData.velocity.x = -Math.abs(newSpeed * Math.cos(angle));
      Game.ball.userData.velocity.y = newSpeed * Math.sin(angle);
      
      // Apply super shot if active
      const appliedSuperShot = PowerUps.applySuperShot(Game.rightPaddle);
      
      // Add slight z-velocity for 2.5D pop-out effect (more if super shot)
      Game.ball.userData.velocity.z = (Math.random() - 0.5) * (appliedSuperShot ? 4 : 2);
      
      // Play paddle collision sound
      Audio.playSoundWithVolume(Audio.sounds.paddle);
      
      // Add visual effect for paddle hit
      Utils.createImpactEffect(
        Game.rightPaddle.position.x - Constants.PADDLE_WIDTH / 2, 
        Game.ball.position.y, 
        0, 
        appliedSuperShot ? 0xFFC107 : 0xff00ff
      );
      
      // Trigger paddle hit animation for 2.5D effect
      Renderer.triggerPaddleHitAnimation(Game.rightPaddle);
      
      // Reset stuck counter
      this.stuckCounter = 0;
    }
    
    // Multi-ball collisions with paddles
    PowerUps.multiBalls.forEach(mb => {
      // Left paddle collision
      if (mb.mesh.position.x - Constants.BALL_RADIUS <= Game.leftPaddle.position.x + Constants.PADDLE_WIDTH / 2 &&
          mb.mesh.position.x > Game.leftPaddle.position.x - Constants.PADDLE_WIDTH / 2 &&
          mb.mesh.position.y >= Game.leftPaddle.position.y - Game.leftPaddle.userData.height / 2 &&
          mb.mesh.position.y <= Game.leftPaddle.position.y + Game.leftPaddle.userData.height / 2) {
        
        // Calculate hit point relative to paddle center
        const relativeHitPoint = (mb.mesh.position.y - Game.leftPaddle.position.y) / (Game.leftPaddle.userData.height / 2);
        
        // Add randomness based on settings
        const randomFactor = (Math.random() - 0.5) * (Settings.settings.game.randomnessLevel / 100) * Math.PI;
        let angle = relativeHitPoint * (70 * Math.PI / 180) + randomFactor;
        
        // Apply new velocity
        mb.velocity.x = Math.abs(mb.speed * Math.cos(angle));
        mb.velocity.y = mb.speed * Math.sin(angle);
        
        // Play paddle hit sound
        Audio.playSoundWithVolume(Audio.sounds.paddle, 0.5);
      }
      
      // Right paddle collision
      if (mb.mesh.position.x + Constants.BALL_RADIUS >= Game.rightPaddle.position.x - Constants.PADDLE_WIDTH / 2 &&
          mb.mesh.position.x < Game.rightPaddle.position.x + Constants.PADDLE_WIDTH / 2 &&
          mb.mesh.position.y >= Game.rightPaddle.position.y - Game.rightPaddle.userData.height / 2 &&
          mb.mesh.position.y <= Game.rightPaddle.position.y + Game.rightPaddle.userData.height / 2) {
        
        // Calculate hit point relative to paddle center
        const relativeHitPoint = (mb.mesh.position.y - Game.rightPaddle.position.y) / (Game.rightPaddle.userData.height / 2);
        
        // Add randomness based on settings
        const randomFactor = (Math.random() - 0.5) * (Settings.settings.game.randomnessLevel / 100) * Math.PI;
        let angle = relativeHitPoint * (70 * Math.PI / 180) + randomFactor;
        
        // Apply new velocity
        mb.velocity.x = -Math.abs(mb.speed * Math.cos(angle));
        mb.velocity.y = mb.speed * Math.sin(angle);
        
        // Play paddle hit sound
        Audio.playSoundWithVolume(Audio.sounds.paddle, 0.5);
      }
    });
  },
  
  /**
   * Check for scoring - Direct implementation with explicit ball reset
   */
  checkScoring: function() {
    // This function is now a placeholder since scoring is handled in updateBall
    // Leaving it here for backward compatibility, but it doesn't do anything now
    return false;
  },
  
  /**
   * Check scoring for multi-balls
   */
  checkMultiBallScoring: function() {
    // Check scoring for multi-balls
    for (let i = PowerUps.multiBalls.length - 1; i >= 0; i--) {
      const mb = PowerUps.multiBalls[i];
      
      if (mb.mesh.position.x < -Constants.FIELD_WIDTH / 2) {
        // Reset velocity
        mb.velocity.x = 0;
        mb.velocity.y = 0;
        
        // Score for right player
        Game.rightPaddle.userData.score++;
        UI.updateScoreDisplay();
        
        // Play score sound
        Audio.playSoundWithVolume(Audio.sounds.score, 0.5);
        
        // Remove multi-ball
        Renderer.gameScene.remove(mb.mesh);
        PowerUps.multiBalls.splice(i, 1);
        
        // Check for game end
        if (Game.rightPaddle.userData.score >= Settings.settings.game.maxPoints) {
          Game.endGame('right');
        }
      } else if (mb.mesh.position.x > Constants.FIELD_WIDTH / 2) {
        // Reset velocity
        mb.velocity.x = 0;
        mb.velocity.y = 0;
        
        // Score for left player
        Game.leftPaddle.userData.score++;
        UI.updateScoreDisplay();
        
        // Play score sound
        Audio.playSoundWithVolume(Audio.sounds.score, 0.5);
        
        // Remove multi-ball
        Renderer.gameScene.remove(mb.mesh);
        PowerUps.multiBalls.splice(i, 1);
        
        // Check for game end
        if (Game.leftPaddle.userData.score >= Settings.settings.game.maxPoints) {
          Game.endGame('left');
        }
      }
    }
  },
  
  /**
   * Handle balls that get stuck or move horizontally
   */
  handleStuckBall: function() {
    if (Game.ball.position.y < Constants.BALL_RADIUS + 10 || 
        Game.ball.position.y > Constants.FIELD_HEIGHT - Constants.BALL_RADIUS - 10 || 
        Math.abs(Game.ball.userData.velocity.y) < 0.5) {
      this.stuckCounter++;
    } else {
      this.stuckCounter = 0;
    }
    
    if (this.stuckCounter > (60 / Settings.settings.game.gameSpeed)) {
      let newSpeed = Game.ball.userData.speed;
      // Add more randomness to unstuck the ball
      let angle = (Math.random() * (Math.PI / 2)) - (Math.PI / 4);
      Game.ball.userData.velocity.x = newSpeed * Math.cos(angle) * (Game.ball.userData.velocity.x < 0 ? -1 : 1);
      Game.ball.userData.velocity.y = newSpeed * Math.sin(angle);
      this.stuckCounter = 0;
    }
    
    // Make multi-balls more interesting by adjusting their trajectory occasionally
    PowerUps.multiBalls.forEach(mb => {
      if (Math.random() < 0.02) { // 2% chance per frame to adjust trajectory
        let speed = Math.sqrt(mb.velocity.x * mb.velocity.x + mb.velocity.y * mb.velocity.y);
        let angle = Math.atan2(mb.velocity.y, mb.velocity.x) + (Math.random() - 0.5) * Math.PI / 4;
        mb.velocity.x = speed * Math.cos(angle);
        mb.velocity.y = speed * Math.sin(angle);
      }
    });
  },
  
  /**
   * Update paddle positions and effects
   * @param {number} deltaTime - Time since last frame
   */
  updatePaddles: function(deltaTime) {
    // Update paddle positions based on their direction and speed
    if (!Game.leftPaddle.userData.isFrozen || Date.now() > Game.leftPaddle.userData.frozenUntil) {
      Game.leftPaddle.position.y += Game.leftPaddle.userData.direction * Game.leftPaddle.userData.speed * deltaTime * Settings.settings.game.gameSpeed;
    }
    
    if (!Game.rightPaddle.userData.isFrozen || Date.now() > Game.rightPaddle.userData.frozenUntil) {
      Game.rightPaddle.position.y += Game.rightPaddle.userData.direction * Game.rightPaddle.userData.speed * deltaTime * Settings.settings.game.gameSpeed;
    }
    
    // Constrain paddle positions to the game field
    const paddleHalfHeight = Game.leftPaddle.userData.height / 2;
    const fieldHalfHeight = Constants.FIELD_HEIGHT / 2 - 1;
    
    Game.leftPaddle.position.y = Math.max(-fieldHalfHeight + paddleHalfHeight, 
                             Math.min(fieldHalfHeight - paddleHalfHeight, Game.leftPaddle.position.y));
    
    Game.rightPaddle.position.y = Math.max(-fieldHalfHeight + paddleHalfHeight, 
                              Math.min(fieldHalfHeight - paddleHalfHeight, Game.rightPaddle.position.y));
    
    // Apply power-up effects to paddles
    this.updatePaddlePowerUps();
  },
  
  /**
   * Update paddle power-up effects
   */
  updatePaddlePowerUps: function() {
    // Update left paddle power-ups
    Game.leftPaddle.userData.activePowerUps = Game.leftPaddle.userData.activePowerUps.filter(pu => Date.now() < pu.endTime);
    
    // Update right paddle power-ups
    Game.rightPaddle.userData.activePowerUps = Game.rightPaddle.userData.activePowerUps.filter(pu => Date.now() < pu.endTime);
    
    // Apply speed power-up
    Game.leftPaddle.userData.speed = Constants.PADDLE_SPEED * (1 + (Game.leftPaddle.userData.activePowerUps.some(pu => pu.type === 'speed') ? 
                              Game.leftPaddle.userData.activePowerUps.find(pu => pu.type === 'speed').strength : 0));
    
    Game.rightPaddle.userData.speed = Constants.PADDLE_SPEED * (1 + (Game.rightPaddle.userData.activePowerUps.some(pu => pu.type === 'speed') ? 
                               Game.rightPaddle.userData.activePowerUps.find(pu => pu.type === 'speed').strength : 0));
    
    // Apply shrink power-up (reduces paddle height)
    const leftShrinkEffect = Game.leftPaddle.userData.activePowerUps.some(pu => pu.type === 'shrink') ? 
                           Game.leftPaddle.userData.activePowerUps.find(pu => pu.type === 'shrink').strength : 0;
    
    const rightShrinkEffect = Game.rightPaddle.userData.activePowerUps.some(pu => pu.type === 'shrink') ? 
                            Game.rightPaddle.userData.activePowerUps.find(pu => pu.type === 'shrink').strength : 0;
    
    // Apply giant power-up (increases paddle height)
    const leftGiantEffect = Game.leftPaddle.userData.activePowerUps.some(pu => pu.type === 'giant') ? 
                          Game.leftPaddle.userData.activePowerUps.find(pu => pu.type === 'giant').strength : 0;
    
    const rightGiantEffect = Game.rightPaddle.userData.activePowerUps.some(pu => pu.type === 'giant') ? 
                           Game.rightPaddle.userData.activePowerUps.find(pu => pu.type === 'giant').strength : 0;
    
    // Calculate final paddle height (apply shrink first, then giant)
    Game.leftPaddle.userData.height = Constants.PADDLE_HEIGHT * (1 - leftShrinkEffect) * (1 + leftGiantEffect);
    Game.rightPaddle.userData.height = Constants.PADDLE_HEIGHT * (1 - rightShrinkEffect) * (1 + rightGiantEffect);
    
    // Update paddle scale
    Game.leftPaddle.scale.y = Game.leftPaddle.userData.height / Constants.PADDLE_HEIGHT;
    Game.rightPaddle.scale.y = Game.rightPaddle.userData.height / Constants.PADDLE_HEIGHT;
    
    // Update visual effects for power-ups
    UI.updatePowerUpVisuals();
    
    // Update paddle materials based on active power-ups
    const leftPowerUpType = Game.leftPaddle.userData.activePowerUps.length > 0 ? 
                           Game.leftPaddle.userData.activePowerUps[Game.leftPaddle.userData.activePowerUps.length - 1].type : null;
    
    const rightPowerUpType = Game.rightPaddle.userData.activePowerUps.length > 0 ? 
                            Game.rightPaddle.userData.activePowerUps[Game.rightPaddle.userData.activePowerUps.length - 1].type : null;
    
    // Update left paddle material
    const leftEmissiveColor = new THREE.Color(0x00fcff);
    
    if (leftPowerUpType) {
      switch (leftPowerUpType) {
        case 'speed': leftEmissiveColor.set(0xffeb3b); break;
        case 'shield': leftEmissiveColor.set(0x2196F3); break;
        case 'magnet': leftEmissiveColor.set(0x4CAF50); break;
        case 'giant': leftEmissiveColor.set(0xFF9800); break;
        case 'freeze': leftEmissiveColor.set(0x008080); break;
      }
      
      Game.leftPaddle.material.emissive = leftEmissiveColor;
      Game.leftPaddle.material.emissiveIntensity = 0.8;
    } else {
      Game.leftPaddle.material.emissive.set(0x00fcff);
      Game.leftPaddle.material.emissiveIntensity = 0.5;
    }
    
    // Update right paddle material
    const rightEmissiveColor = new THREE.Color(0xff00ff);
    
    if (rightPowerUpType) {
      switch (rightPowerUpType) {
        case 'speed': rightEmissiveColor.set(0xffeb3b); break;
        case 'shield': rightEmissiveColor.set(0x2196F3); break;
        case 'magnet': rightEmissiveColor.set(0x4CAF50); break;
        case 'giant': rightEmissiveColor.set(0xFF9800); break;
        case 'freeze': rightEmissiveColor.set(0x008080); break;
      }
      
      Game.rightPaddle.material.emissive = rightEmissiveColor;
      Game.rightPaddle.material.emissiveIntensity = 0.8;
    } else {
      Game.rightPaddle.material.emissive.set(0xff00ff);
      Game.rightPaddle.material.emissiveIntensity = 0.5;
    }
  }
};