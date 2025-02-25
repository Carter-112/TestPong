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
    // Move the ball based on its velocity
    Game.ball.position.x += Game.ball.userData.velocity.x * deltaTime * Settings.settings.game.gameSpeed;
    Game.ball.position.y += Game.ball.userData.velocity.y * deltaTime * Settings.settings.game.gameSpeed;
    
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
      Game.ball.userData.velocity.y *= -1;
      
      // Add randomness to bounce based on settings
      Game.ball.userData.velocity.y += (Math.random() - 0.5) * (Settings.settings.game.randomnessLevel / 50);
      
      // Add slight z-velocity for 2.5D effect
      Game.ball.userData.velocity.z = (Math.random() - 0.5) * 3;
      
      // Play wall collision sound
      Audio.playSoundWithVolume(Audio.sounds.wall);
      
      // Add visual effect for wall hit
      Utils.createImpactEffect(
        Game.ball.position.x, 
        Game.ball.position.y > 0 ? fieldHalfHeight : -fieldHalfHeight, 
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
    
    // Check for paddle collisions
    this.checkPaddleCollisions();
    
    // Check for scoring
    this.checkScoring();
    
    // Apply magnet effect if active
    PowerUps.applyMagnetEffect();
    
    // Update ball ghost effect if active
    if (Game.ball.userData.isGhost) {
      Game.ball.material.opacity = Game.ball.userData.ghostOpacity;
    }
    
    // Update ball trail
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
      
      // Add slight z-velocity for 2.5D pop-out effect
      Game.ball.userData.velocity.z = (Math.random() - 0.5) * 2;
      
      // Play paddle collision sound
      Audio.playSoundWithVolume(Audio.sounds.paddle);
      
      // Add visual effect for paddle hit
      Utils.createImpactEffect(
        Game.leftPaddle.position.x + Constants.PADDLE_WIDTH / 2, 
        Game.ball.position.y, 
        0, 
        0x00fcff
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
      
      // Add slight z-velocity for 2.5D pop-out effect
      Game.ball.userData.velocity.z = (Math.random() - 0.5) * 2;
      
      // Play paddle collision sound
      Audio.playSoundWithVolume(Audio.sounds.paddle);
      
      // Add visual effect for paddle hit
      Utils.createImpactEffect(
        Game.rightPaddle.position.x - Constants.PADDLE_WIDTH / 2, 
        Game.ball.position.y, 
        0, 
        0xff00ff
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
   * Check for scoring
   */
  checkScoring: function() {
    // Ball goes past left paddle
    if (Game.ball.position.x < -Constants.FIELD_WIDTH / 2) {
      // Check if left paddle has shield
      const shieldEffect = Game.leftPaddle.userData.activePowerUps.find(pu => pu.type === 'shield');
      if (shieldEffect) {
        // Use up shield
        if (shieldEffect.count > 1) {
          shieldEffect.count--;
        } else {
          Game.leftPaddle.userData.activePowerUps = Game.leftPaddle.userData.activePowerUps.filter(pu => pu.type !== 'shield');
        }
        
        // Bounce ball back
        Game.ball.userData.velocity.x = Math.abs(Game.ball.userData.velocity.x);
        Game.ball.position.x = -Constants.FIELD_WIDTH / 2 + Constants.BALL_RADIUS + 1;
        
        // Play shield sound and create visual effect
        Audio.playSoundWithVolume(Audio.sounds.paddle);
        Utils.createImpactEffect(Game.ball.position.x, Game.ball.position.y, 0, 0x2196F3);
      } else {
        // Score point for right player
        Game.rightPaddle.userData.score++;
        UI.updateScoreDisplay();
        
        // Play score sound
        Audio.playSoundWithVolume(Audio.sounds.score);
        
        // Show score effect
        Utils.createScoreEffect(Game.rightPaddle.userData.score, 'right');
        
        // Reset for next round
        Game.resetBall();
        this.consecutiveHitCount = 0;
        
        // Check for game end
        if (Game.rightPaddle.userData.score >= Settings.settings.game.maxPoints) {
          Game.endGame('right');
        }
      }
    }
    
    // Ball goes past right paddle
    if (Game.ball.position.x > Constants.FIELD_WIDTH / 2) {
      // Check if right paddle has shield
      const shieldEffect = Game.rightPaddle.userData.activePowerUps.find(pu => pu.type === 'shield');
      if (shieldEffect) {
        // Use up shield
        if (shieldEffect.count > 1) {
          shieldEffect.count--;
        } else {
          Game.rightPaddle.userData.activePowerUps = Game.rightPaddle.userData.activePowerUps.filter(pu => pu.type !== 'shield');
        }
        
        // Bounce ball back
        Game.ball.userData.velocity.x = -Math.abs(Game.ball.userData.velocity.x);
        Game.ball.position.x = Constants.FIELD_WIDTH / 2 - Constants.BALL_RADIUS - 1;
        
        // Play shield sound and create visual effect
        Audio.playSoundWithVolume(Audio.sounds.paddle);
        Utils.createImpactEffect(Game.ball.position.x, Game.ball.position.y, 0, 0x2196F3);
      } else {
        // Score point for left player
        Game.leftPaddle.userData.score++;
        UI.updateScoreDisplay();
        
        // Play score sound
        Audio.playSoundWithVolume(Audio.sounds.score);
        
        // Show score effect
        Utils.createScoreEffect(Game.leftPaddle.userData.score, 'left');
        
        // Reset for next round
        Game.resetBall();
        this.consecutiveHitCount = 0;
        
        // Check for game end
        if (Game.leftPaddle.userData.score >= Settings.settings.game.maxPoints) {
          Game.endGame('left');
        }
      }
    }
    
    // Check scoring for multi-balls
    for (let i = PowerUps.multiBalls.length - 1; i >= 0; i--) {
      const mb = PowerUps.multiBalls[i];
      
      if (mb.mesh.position.x < -Constants.FIELD_WIDTH / 2) {
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