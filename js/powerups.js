// Power-Ups Management
const PowerUps = {
  // Array to store active power-ups
  powerUps: [],
  
  // Timer for power-up spawning
  powerUpTimer: 0,
  
  // Arrays for special effects
  gravityWells: [],
  multiBalls: [],
  
  // Temp variables for ball speed power-up
  ballSpeedSide: null,
  ballSpeedActive: false,
  ballSpeedTimeout: null,
  
  /**
   * Clear all power-ups
   */
  clearPowerUps: function() {
    // Remove all power-up meshes from the scene
    for (let i = this.powerUps.length - 1; i >= 0; i--) {
      Renderer.gameScene.remove(this.powerUps[i].mesh);
    }
    
    // Clear the power-ups array
    this.powerUps = [];
    
    // Remove all gravity wells
    for (let i = this.gravityWells.length - 1; i >= 0; i--) {
      Renderer.gameScene.remove(this.gravityWells[i].mesh);
    }
    
    // Clear the gravity wells array
    this.gravityWells = [];
    
    // Remove all multi-balls
    for (let i = this.multiBalls.length - 1; i >= 0; i--) {
      Renderer.gameScene.remove(this.multiBalls[i].mesh);
    }
    
    // Clear the multi-balls array
    this.multiBalls = [];
    
    // Reset ball speed effect
    this.ballSpeedSide = null;
    this.ballSpeedActive = false;
    if (this.ballSpeedTimeout) {
      clearTimeout(this.ballSpeedTimeout);
      this.ballSpeedTimeout = null;
    }
    
    // Clear power-up displays
    document.getElementById('leftPowerUps').innerHTML = '';
    document.getElementById('rightPowerUps').innerHTML = '';
  },
  
  /**
   * Spawn a new power-up
   */
  spawnPowerUp: function() {
    // Determine power-up type based on chances
    let r = Math.random();
    let cumulative = 0;
    let type;
    
    for (const [key, chance] of Object.entries(Settings.settings.powerUps.chances)) {
      if (!Settings.settings.powerUps.enabled[key]) continue;
      
      cumulative += chance / 100;
      if (r <= cumulative) {
        type = key;
        break;
      }
    }
    
    if (!type) return;
    
    // Determine which side of the field
    const x = (Math.random() - 0.5) * (Constants.FIELD_WIDTH - 20);
    const y = (Math.random() - 0.5) * (Constants.FIELD_HEIGHT - 10);
    const side = x < 0 ? 'left' : 'right';
    
    // Create power-up geometry based on type
    let geometry, material;
    
    switch (type) {
      case 'speed':
        geometry = new THREE.OctahedronGeometry(2, 0);
        material = new THREE.MeshPhongMaterial({ 
          color: 0xffeb3b, 
          emissive: 0xffeb3b,
          emissiveIntensity: 0.5,
          transparent: true,
          opacity: 0.9
        });
        break;
      case 'ballSpeed':
        geometry = new THREE.TetrahedronGeometry(2, 0);
        material = new THREE.MeshPhongMaterial({ 
          color: 0xf44336, 
          emissive: 0xf44336,
          emissiveIntensity: 0.5,
          transparent: true,
          opacity: 0.9
        });
        break;
      case 'shrink':
        geometry = new THREE.BoxGeometry(2, 3, 2);
        material = new THREE.MeshPhongMaterial({ 
          color: 0x800080, 
          emissive: 0x800080,
          emissiveIntensity: 0.5,
          transparent: true,
          opacity: 0.9
        });
        break;
      case 'shield':
        geometry = new THREE.CylinderGeometry(0, 2, 3, 6);
        material = new THREE.MeshPhongMaterial({ 
          color: 0x2196F3, 
          emissive: 0x2196F3,
          emissiveIntensity: 0.5,
          transparent: true,
          opacity: 0.9
        });
        break;
      case 'magnet':
        geometry = new THREE.TorusGeometry(1.5, 0.7, 8, 16);
        material = new THREE.MeshPhongMaterial({ 
          color: 0x4CAF50, 
          emissive: 0x4CAF50,
          emissiveIntensity: 0.5,
          transparent: true,
          opacity: 0.9
        });
        break;
      case 'giant':
        geometry = new THREE.BoxGeometry(2, 4, 2);
        material = new THREE.MeshPhongMaterial({ 
          color: 0xFF9800, 
          emissive: 0xFF9800,
          emissiveIntensity: 0.5,
          transparent: true,
          opacity: 0.9
        });
        break;
      case 'ghost':
        geometry = new THREE.SphereGeometry(2, 16, 16);
        material = new THREE.MeshPhongMaterial({ 
          color: 0xFFFFFF, 
          emissive: 0xFFFFFF,
          emissiveIntensity: 0.5,
          transparent: true,
          opacity: 0.5
        });
        break;
      case 'multiBall':
        geometry = new THREE.IcosahedronGeometry(2, 0);
        material = new THREE.MeshPhongMaterial({ 
          color: 0x00FFFF, 
          emissive: 0x00FFFF,
          emissiveIntensity: 0.5,
          transparent: true,
          opacity: 0.9
        });
        break;
      case 'freeze':
        geometry = new THREE.DodecahedronGeometry(2, 0);
        material = new THREE.MeshPhongMaterial({ 
          color: 0x008080, 
          emissive: 0x008080,
          emissiveIntensity: 0.5,
          transparent: true,
          opacity: 0.9
        });
        break;
      case 'gravity':
        geometry = new THREE.SphereGeometry(2, 16, 16);
        material = new THREE.MeshPhongMaterial({ 
          color: 0x8000FF, 
          emissive: 0x8000FF,
          emissiveIntensity: 0.5,
          transparent: true,
          opacity: 0.9
        });
        break;
      default:
        geometry = new THREE.BoxGeometry(2, 2, 2);
        material = new THREE.MeshPhongMaterial({ 
          color: 0xFFFFFF, 
          transparent: true,
          opacity: 0.9
        });
    }
    
    // Create power-up mesh
    const powerUpMesh = new THREE.Mesh(geometry, material);
    powerUpMesh.position.set(x, y, 0);
    Renderer.gameScene.add(powerUpMesh);
    
    // Calculate power-up duration and strength
    const durMin = Constants.POWER_UP_DURATIONS[type][0] * Settings.settings.powerUps.durationFactor;
    const durMax = Constants.POWER_UP_DURATIONS[type][1] * Settings.settings.powerUps.durationFactor;
    const duration = Math.random() * (durMax - durMin) + durMin;
    
    const strMin = Constants.POWER_UP_STRENGTHS[type][0] * Settings.settings.powerUps.strengthFactor;
    const strMax = Constants.POWER_UP_STRENGTHS[type][1] * Settings.settings.powerUps.strengthFactor;
    const strength = Math.random() * (strMax - strMin) + strMin;
    
    // Add power-up to array
    this.powerUps.push({
      type,
      x,
      y,
      side,
      mesh: powerUpMesh,
      duration,
      strength
    });
  },
  
  /**
   * Apply a power-up effect
   * @param {Object} powerUp - The power-up to apply
   */
  applyPowerUpEffect: function(powerUp) {
    // Determine target paddle based on power-up type and side
    const negativeEffects = ['shrink', 'ballSpeed', 'freeze'];
    const selfPaddle = powerUp.side === 'left' ? Game.leftPaddle : Game.rightPaddle;
    const oppPaddle = powerUp.side === 'left' ? Game.rightPaddle : Game.leftPaddle;
    const targetPaddle = negativeEffects.includes(powerUp.type) ? oppPaddle : selfPaddle;
    
    // Handle existing effects
    const existingEffect = targetPaddle.userData.activePowerUps.find(p => p.type === powerUp.type);
    
    if (existingEffect && !['shield', 'magnet', 'multiBall', 'gravity'].includes(powerUp.type)) {
      // Extend duration of existing effect
      existingEffect.endTime = Date.now() + powerUp.duration;
    } else {
      // Apply new effect
      switch (powerUp.type) {
        case 'speed':
        case 'shrink':
        case 'ballSpeed':
        case 'giant':
          targetPaddle.userData.activePowerUps.push({
            type: powerUp.type,
            startTime: Date.now(),
            endTime: Date.now() + powerUp.duration,
            strength: powerUp.strength
          });
          break;
          
        case 'shield':
          let existingShield = targetPaddle.userData.activePowerUps.find(p => p.type === 'shield');
          if (existingShield) {
            existingShield.count = (existingShield.count || 1) + 1;
          } else {
            targetPaddle.userData.activePowerUps.push({
              type: 'shield',
              startTime: Date.now(),
              endTime: Date.now() + powerUp.duration,
              count: 1
            });
          }
          break;
          
        case 'magnet':
          targetPaddle.userData.activePowerUps.push({
            type: 'magnet',
            startTime: Date.now(),
            endTime: Date.now() + powerUp.duration,
            strength: powerUp.strength
          });
          break;
          
        case 'ghost':
          // Make ball semi-transparent
          Game.ball.userData.isGhost = true;
          Game.ball.userData.ghostOpacity = 0.4;
          setTimeout(() => {
            Game.ball.userData.isGhost = false;
            Game.ball.userData.ghostOpacity = 0.9;
          }, powerUp.duration);
          break;
          
        case 'multiBall':
          // Create an additional ball
          const ballGeometry = new THREE.SphereGeometry(Constants.BALL_RADIUS, Constants.BALL_SEGMENTS, Constants.BALL_SEGMENTS);
          const ballMaterial = new THREE.MeshPhongMaterial({
            color: 0x00FFFF,
            emissive: 0x00FFFF,
            emissiveIntensity: 0.5,
            transparent: true,
            opacity: 0.9
          });
          
          const newBallMesh = new THREE.Mesh(ballGeometry, ballMaterial);
          newBallMesh.position.copy(Game.ball.position);
          
          // Set velocity at a different angle
          const angle = Math.random() * Math.PI * 2;
          const speed = Game.ball.userData.velocity.length() * 0.9;
          
          const multiBall = {
            mesh: newBallMesh,
            velocity: new THREE.Vector3(
              Math.cos(angle) * speed,
              Math.sin(angle) * speed,
              0
            ),
            speed: speed,
            expiresAt: Date.now() + powerUp.duration
          };
          
          Renderer.gameScene.add(newBallMesh);
          this.multiBalls.push(multiBall);
          break;
          
        case 'freeze':
          // Freeze the opponent's paddle
          targetPaddle.userData.isFrozen = true;
          targetPaddle.userData.frozenUntil = Date.now() + powerUp.duration;
          targetPaddle.userData.activePowerUps.push({
            type: 'freeze',
            startTime: Date.now(),
            endTime: Date.now() + powerUp.duration
          });
          
          // Add frozen visual effect
          targetPaddle.material.color.set(0x88CCEE);
          setTimeout(() => {
            targetPaddle.userData.isFrozen = false;
            targetPaddle.material.color.set(targetPaddle === Game.leftPaddle ? 0x00fcff : 0xff00ff);
          }, powerUp.duration);
          break;
          
        case 'gravity':
          // Create gravity well in opponent's half
          const wellGeometry = new THREE.SphereGeometry(10, 16, 16);
          const wellMaterial = new THREE.MeshPhongMaterial({
            color: 0x8000FF,
            emissive: 0x8000FF,
            emissiveIntensity: 0.5,
            transparent: true,
            opacity: 0.2,
            wireframe: true
          });
          
          const wellMesh = new THREE.Mesh(wellGeometry, wellMaterial);
          const wellX = oppPaddle === Game.leftPaddle ? -Constants.FIELD_WIDTH / 4 : Constants.FIELD_WIDTH / 4;
          wellMesh.position.set(wellX, 0, 0);
          
          const gravityWell = {
            mesh: wellMesh,
            radius: 20,
            strength: powerUp.strength,
            expiresAt: Date.now() + powerUp.duration
          };
          
          Renderer.gameScene.add(wellMesh);
          this.gravityWells.push(gravityWell);
          
          // Add gravity visual effect
          const glowGeometry = new THREE.SphereGeometry(10.5, 32, 32);
          const glowMaterial = new THREE.MeshBasicMaterial({
            color: 0x8000FF,
            transparent: true,
            opacity: 0.1,
            side: THREE.BackSide
          });
          
          const glowMesh = new THREE.Mesh(glowGeometry, glowMaterial);
          wellMesh.add(glowMesh);
          break;
      }
    }
    
    // Create power-up activation effect
    Utils.createPowerUpEffect(powerUp.mesh.position.x, powerUp.mesh.position.y, 0, powerUp.type);
    
    // Play power-up sound
    Audio.playSoundWithVolume(Audio.sounds.powerUp);
  },
  
  /**
   * Update power-ups (called every frame)
   * @param {number} deltaTime - Time elapsed since last frame
   */
  update: function(deltaTime) {
    // Update power-up timer
    this.powerUpTimer += deltaTime * 1000 * Settings.settings.game.gameSpeed;
    
    // Spawn a new power-up if it's time
    if (this.powerUpTimer >= Settings.settings.game.powerUpFrequency) {
      this.spawnPowerUp();
      this.powerUpTimer = 0;
    }
    
    // Update existing power-ups
    for (let i = this.powerUps.length - 1; i >= 0; i--) {
      const powerUp = this.powerUps[i];
      
      // Rotate power-up for visual effect
      powerUp.mesh.rotation.y += 0.02;
      
      // Bobbing motion
      powerUp.mesh.position.y = powerUp.y + Math.sin(Date.now() * 0.003) * 0.5;
      
      // Check for collision with ball
      if (powerUp.mesh.position.distanceTo(Game.ball.position) < Constants.BALL_RADIUS + 2) {
        // Apply power-up effect
        this.applyPowerUpEffect(powerUp);
        
        // Remove power-up from scene and array
        Renderer.gameScene.remove(powerUp.mesh);
        this.powerUps.splice(i, 1);
      }
    }
    
    // Update gravity wells
    for (let i = this.gravityWells.length - 1; i >= 0; i--) {
      const well = this.gravityWells[i];
      
      // Remove expired gravity wells
      if (Date.now() > well.expiresAt) {
        Renderer.gameScene.remove(well.mesh);
        this.gravityWells.splice(i, 1);
        continue;
      }
      
      // Update gravity well visual effect
      const pulseScale = 1 + Math.sin(Date.now() * 0.005) * 0.1;
      well.mesh.scale.set(pulseScale, pulseScale, pulseScale);
    }
    
    // Update multi-balls
    for (let i = this.multiBalls.length - 1; i >= 0; i--) {
      const mb = this.multiBalls[i];
      
      // Remove expired multi-balls
      if (Date.now() > mb.expiresAt) {
        Renderer.gameScene.remove(mb.mesh);
        this.multiBalls.splice(i, 1);
        continue;
      }
      
      // Apply gravity well effects to the multi-ball
      this.gravityWells.forEach(well => {
        if (Date.now() < well.expiresAt) {
          const dx = well.mesh.position.x - mb.mesh.position.x;
          const dy = well.mesh.position.y - mb.mesh.position.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          if (distance < well.radius) {
            const force = well.strength * (1 - distance / well.radius) * 0.2;
            mb.velocity.x += (dx / distance) * force;
            mb.velocity.y += (dy / distance) * force;
          }
        }
      });
      
      // Move multi-ball
      mb.mesh.position.x += mb.velocity.x * deltaTime * Settings.settings.game.gameSpeed;
      mb.mesh.position.y += mb.velocity.y * deltaTime * Settings.settings.game.gameSpeed;
      
      // Wall collisions for multi-balls
      const fieldHalfHeight = Constants.FIELD_HEIGHT / 2 - Constants.BALL_RADIUS;
      if (mb.mesh.position.y > fieldHalfHeight || mb.mesh.position.y < -fieldHalfHeight) {
        mb.velocity.y *= -1;
        
        // Add randomness to bounce
        mb.velocity.y += (Math.random() - 0.5) * (Settings.settings.game.randomnessLevel / 50);
        
        // Play wall collision sound
        Audio.playSoundWithVolume(Audio.sounds.wall, 0.5);
      }
    }
  },
  
  /**
   * Apply magnet effect to the ball
   */
  applyMagnetEffect: function() {
    // Apply magnet power-up for left paddle
    if (Game.leftPaddle.userData.activePowerUps.some(pu => pu.type === 'magnet')) {
      const magnetEffect = Game.leftPaddle.userData.activePowerUps.find(pu => pu.type === 'magnet');
      
      // Only affect ball when it's in the left half of the field
      if (Game.ball.position.x < 0) {
        const targetY = Game.leftPaddle.position.y;
        const diff = targetY - Game.ball.position.y;
        Game.ball.userData.velocity.y += diff * (magnetEffect.strength * 0.0005);
      }
    }
    
    // Apply magnet power-up for right paddle
    if (Game.rightPaddle.userData.activePowerUps.some(pu => pu.type === 'magnet')) {
      const magnetEffect = Game.rightPaddle.userData.activePowerUps.find(pu => pu.type === 'magnet');
      
      // Only affect ball when it's in the right half of the field
      if (Game.ball.position.x > 0) {
        const targetY = Game.rightPaddle.position.y;
        const diff = targetY - Game.ball.position.y;
        Game.ball.userData.velocity.y += diff * (magnetEffect.strength * 0.0005);
      }
    }
  }
};