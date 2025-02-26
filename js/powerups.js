// Power-Ups Management
const PowerUps = {
  // Array to store active power-ups
  powerUps: [],
  
  // Timer for power-up spawning
  powerUpTimer: 0,
  
  // Arrays for special effects
  gravityWells: [],
  multiBalls: [],
  obstacles: [],
  teleportMarkers: [],
  timeSlowActive: false,
  
  // Temp variables for special power-ups
  ballSpeedSide: null,
  ballSpeedActive: false,
  ballSpeedTimeout: null,
  mirrorActive: false,
  mirrorTimeout: null,
  
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
    
    // Remove all obstacles
    for (let i = this.obstacles.length - 1; i >= 0; i--) {
      Renderer.gameScene.remove(this.obstacles[i].mesh);
    }
    
    // Clear the obstacles array
    this.obstacles = [];
    
    // Remove all teleport markers
    for (let i = this.teleportMarkers.length - 1; i >= 0; i--) {
      Renderer.gameScene.remove(this.teleportMarkers[i].entranceMesh);
      Renderer.gameScene.remove(this.teleportMarkers[i].exitMesh);
    }
    
    // Clear the teleport markers array
    this.teleportMarkers = [];
    
    // Reset time slow
    if (this.timeSlowActive) {
      Settings.settings.game.gameSpeed = Settings.settings.game.gameSpeed * 2;
      this.timeSlowActive = false;
    }
    
    // Reset ball speed effect
    this.ballSpeedSide = null;
    this.ballSpeedActive = false;
    if (this.ballSpeedTimeout) {
      clearTimeout(this.ballSpeedTimeout);
      this.ballSpeedTimeout = null;
    }
    
    // Reset mirror effect
    this.mirrorActive = false;
    if (this.mirrorTimeout) {
      clearTimeout(this.mirrorTimeout);
      this.mirrorTimeout = null;
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
      case 'timeSlow':
        geometry = new THREE.TorusKnotGeometry(1.5, 0.5, 32, 8);
        material = new THREE.MeshPhongMaterial({ 
          color: 0x9C27B0, 
          emissive: 0x9C27B0,
          emissiveIntensity: 0.5,
          transparent: true,
          opacity: 0.9
        });
        break;
      case 'teleport':
        geometry = new THREE.ConeGeometry(1.5, 3, 16);
        material = new THREE.MeshPhongMaterial({ 
          color: 0xE91E63, 
          emissive: 0xE91E63,
          emissiveIntensity: 0.5,
          transparent: true,
          opacity: 0.9
        });
        break;
      case 'superShot':
        geometry = new THREE.SphereGeometry(2, 16, 16);
        material = new THREE.MeshPhongMaterial({ 
          color: 0xFFC107, 
          emissive: 0xFFC107,
          emissiveIntensity: 0.8,
          transparent: true,
          opacity: 0.9
        });
        break;
      case 'mirror':
        geometry = new THREE.PlaneGeometry(3, 3);
        material = new THREE.MeshPhongMaterial({ 
          color: 0xCDDC39, 
          emissive: 0xCDDC39,
          emissiveIntensity: 0.5,
          transparent: true,
          opacity: 0.9,
          side: THREE.DoubleSide
        });
        break;
      case 'obstacle':
        geometry = new THREE.CylinderGeometry(2, 2, 2, 8);
        material = new THREE.MeshPhongMaterial({ 
          color: 0x795548, 
          emissive: 0x795548,
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
    const negativeEffects = ['shrink', 'ballSpeed', 'freeze', 'obstacle'];
    const selfPaddle = powerUp.side === 'left' ? Game.leftPaddle : Game.rightPaddle;
    const oppPaddle = powerUp.side === 'left' ? Game.rightPaddle : Game.leftPaddle;
    const targetPaddle = negativeEffects.includes(powerUp.type) ? oppPaddle : selfPaddle;
    
    // Handle existing effects
    const existingEffect = targetPaddle.userData.activePowerUps.find(p => p.type === powerUp.type);
    
    if (existingEffect && 
        !['shield', 'magnet', 'multiBall', 'gravity', 'teleport', 'superShot', 'obstacle', 'mirror'].includes(powerUp.type)) {
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
          
        case 'timeSlow':
          // Slow down game time
          if (!this.timeSlowActive) {
            const oldSpeed = Settings.settings.game.gameSpeed;
            Settings.settings.game.gameSpeed = oldSpeed / 2;
            this.timeSlowActive = true;
            
            // Visual effect for time slow
            Utils.createSlowMotionEffect();
            
            // Reset after duration
            setTimeout(() => {
              Settings.settings.game.gameSpeed = oldSpeed;
              this.timeSlowActive = false;
            }, powerUp.duration);
          }
          break;
          
        case 'teleport':
          // Create teleport entrance and exit portals
          const entranceGeometry = new THREE.TorusGeometry(3, 0.5, 16, 32);
          const entranceMaterial = new THREE.MeshPhongMaterial({
            color: 0xE91E63,
            emissive: 0xE91E63,
            emissiveIntensity: 0.5,
            transparent: true,
            opacity: 0.7
          });
          
          const exitGeometry = new THREE.TorusGeometry(3, 0.5, 16, 32);
          const exitMaterial = new THREE.MeshPhongMaterial({
            color: 0x00BCD4,
            emissive: 0x00BCD4,
            emissiveIntensity: 0.5,
            transparent: true,
            opacity: 0.7
          });
          
          // Place entrance near player's paddle
          const entranceX = selfPaddle === Game.leftPaddle ? 
                           -Constants.FIELD_WIDTH / 4 : Constants.FIELD_WIDTH / 4;
          const entranceY = (Math.random() - 0.5) * (Constants.FIELD_HEIGHT / 2);
          
          // Place exit in opponent's half
          const exitX = oppPaddle === Game.leftPaddle ? 
                       -Constants.FIELD_WIDTH / 4 : Constants.FIELD_WIDTH / 4;
          const exitY = (Math.random() - 0.5) * (Constants.FIELD_HEIGHT / 2);
          
          const entranceMesh = new THREE.Mesh(entranceGeometry, entranceMaterial);
          entranceMesh.position.set(entranceX, entranceY, 0);
          entranceMesh.rotation.x = Math.PI / 2;
          
          const exitMesh = new THREE.Mesh(exitGeometry, exitMaterial);
          exitMesh.position.set(exitX, exitY, 0);
          exitMesh.rotation.x = Math.PI / 2;
          
          const teleport = {
            entranceMesh,
            exitMesh,
            entrancePosition: new THREE.Vector3(entranceX, entranceY, 0),
            exitPosition: new THREE.Vector3(exitX, exitY, 0),
            radius: 4,
            expiresAt: Date.now() + powerUp.duration,
            lastTeleport: 0 // To prevent constant teleporting
          };
          
          Renderer.gameScene.add(entranceMesh);
          Renderer.gameScene.add(exitMesh);
          this.teleportMarkers.push(teleport);
          
          // Add particle effect to portals
          const particleGeometry = new THREE.BufferGeometry();
          const particleCount = 50;
          const positions = new Float32Array(particleCount * 3);
          
          for (let i = 0; i < particleCount; i++) {
            const angle = (i / particleCount) * Math.PI * 2;
            const radius = 3;
            positions[i * 3] = Math.cos(angle) * radius;
            positions[i * 3 + 1] = Math.sin(angle) * radius;
            positions[i * 3 + 2] = 0;
          }
          
          particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
          
          const entranceParticleMaterial = new THREE.PointsMaterial({
            color: 0xE91E63,
            size: 0.3,
            transparent: true,
            opacity: 0.7
          });
          
          const exitParticleMaterial = new THREE.PointsMaterial({
            color: 0x00BCD4,
            size: 0.3,
            transparent: true,
            opacity: 0.7
          });
          
          const entranceParticles = new THREE.Points(particleGeometry, entranceParticleMaterial);
          const exitParticles = new THREE.Points(particleGeometry, exitParticleMaterial);
          
          entranceMesh.add(entranceParticles);
          exitMesh.add(exitParticles);
          break;
          
        case 'superShot':
          // Give the paddle a super shot ability
          targetPaddle.userData.activePowerUps.push({
            type: 'superShot',
            startTime: Date.now(),
            endTime: Date.now() + powerUp.duration,
            strength: powerUp.strength,
            usesLeft: 1
          });
          
          // Add visual effect to paddle
          const glowEffect = new THREE.PointLight(0xFFC107, 1, 20);
          glowEffect.position.set(0, 0, 2);
          targetPaddle.add(glowEffect);
          
          // Setup animation for glow effect
          const pulseAnimation = () => {
            const intensity = 0.7 + Math.sin(Date.now() * 0.005) * 0.3;
            glowEffect.intensity = intensity;
            
            if (Date.now() < Date.now() + powerUp.duration) {
              requestAnimationFrame(pulseAnimation);
            } else {
              targetPaddle.remove(glowEffect);
            }
          };
          
          pulseAnimation();
          break;
          
        case 'mirror':
          // Reverse controls of opponent for duration
          if (!this.mirrorActive) {
            oppPaddle.userData.controlsReversed = true;
            this.mirrorActive = true;
            
            // Visual indication of reversed controls
            oppPaddle.material.color.set(0xCDDC39);
            
            // Reset after duration
            this.mirrorTimeout = setTimeout(() => {
              oppPaddle.userData.controlsReversed = false;
              oppPaddle.material.color.set(oppPaddle === Game.leftPaddle ? 0x00fcff : 0xff00ff);
              this.mirrorActive = false;
            }, powerUp.duration);
          }
          break;
          
        case 'obstacle':
          // Create obstacle in opponent's half
          const obstacleGeometry = new THREE.BoxGeometry(3, 10, 3);
          const obstacleMaterial = new THREE.MeshPhongMaterial({
            color: 0x795548,
            emissive: 0x795548,
            emissiveIntensity: 0.3,
            transparent: true,
            opacity: 0.8
          });
          
          const obstacleMesh = new THREE.Mesh(obstacleGeometry, obstacleMaterial);
          
          // Place obstacle in opponent's half
          const obstacleX = oppPaddle === Game.leftPaddle ? 
                           -Constants.FIELD_WIDTH / 4 : Constants.FIELD_WIDTH / 4;
          const obstacleY = (Math.random() - 0.5) * (Constants.FIELD_HEIGHT / 2);
          
          obstacleMesh.position.set(obstacleX, obstacleY, 0);
          
          const obstacle = {
            mesh: obstacleMesh,
            position: new THREE.Vector3(obstacleX, obstacleY, 0),
            width: 3,
            height: 10,
            expiresAt: Date.now() + powerUp.duration
          };
          
          Renderer.gameScene.add(obstacleMesh);
          this.obstacles.push(obstacle);
          
          // Add crumbling effect as it approaches expiration
          const startCrumbling = () => {
            const timeLeft = obstacle.expiresAt - Date.now();
            if (timeLeft < 2000) {
              const crumbleAmount = 1 - (timeLeft / 2000);
              obstacleMesh.scale.set(1 - crumbleAmount * 0.3, 1 - crumbleAmount * 0.3, 1 - crumbleAmount * 0.3);
              obstacleMesh.material.opacity = 0.8 - crumbleAmount * 0.5;
              
              if (timeLeft > 0) {
                requestAnimationFrame(startCrumbling);
              }
            } else {
              setTimeout(startCrumbling, timeLeft - 2000);
            }
          };
          
          setTimeout(startCrumbling, Math.max(0, powerUp.duration - 2000));
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
      
      // Apply gravity to the main ball
      const dx = well.mesh.position.x - Game.ball.position.x;
      const dy = well.mesh.position.y - Game.ball.position.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance < well.radius) {
        const force = well.strength * (1 - distance / well.radius) * 0.2;
        Game.ball.userData.velocity.x += (dx / distance) * force;
        Game.ball.userData.velocity.y += (dy / distance) * force;
      }
    }
    
    // Update teleport portals
    for (let i = this.teleportMarkers.length - 1; i >= 0; i--) {
      const teleport = this.teleportMarkers[i];
      
      // Remove expired teleport portals
      if (Date.now() > teleport.expiresAt) {
        Renderer.gameScene.remove(teleport.entranceMesh);
        Renderer.gameScene.remove(teleport.exitMesh);
        this.teleportMarkers.splice(i, 1);
        continue;
      }
      
      // Rotate portals for visual effect
      teleport.entranceMesh.rotation.z += 0.01;
      teleport.exitMesh.rotation.z -= 0.01;
      
      // Check if ball is close to entrance portal and not recently teleported
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
    }
    
    // Update obstacles
    for (let i = this.obstacles.length - 1; i >= 0; i--) {
      const obstacle = this.obstacles[i];
      
      // Remove expired obstacles
      if (Date.now() > obstacle.expiresAt) {
        Renderer.gameScene.remove(obstacle.mesh);
        this.obstacles.splice(i, 1);
        continue;
      }
      
      // Check for collision with ball
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
      
      // Check for obstacle collisions
      this.obstacles.forEach(obstacle => {
        if (Math.abs(mb.mesh.position.x - obstacle.position.x) < obstacle.width/2 + Constants.BALL_RADIUS &&
            Math.abs(mb.mesh.position.y - obstacle.position.y) < obstacle.height/2 + Constants.BALL_RADIUS) {
          
          // Determine which side of the obstacle was hit
          const dx = mb.mesh.position.x - obstacle.position.x;
          const dy = mb.mesh.position.y - obstacle.position.y;
          
          if (Math.abs(dx) / (obstacle.width/2) > Math.abs(dy) / (obstacle.height/2)) {
            // Horizontal collision (left/right)
            mb.velocity.x *= -1;
            
            // Position correction
            const penetration = (obstacle.width/2 + Constants.BALL_RADIUS) - Math.abs(dx);
            mb.mesh.position.x += (dx > 0 ? penetration : -penetration);
          } else {
            // Vertical collision (top/bottom)
            mb.velocity.y *= -1;
            
            // Position correction
            const penetration = (obstacle.height/2 + Constants.BALL_RADIUS) - Math.abs(dy);
            mb.mesh.position.y += (dy > 0 ? penetration : -penetration);
          }
          
          // Play collision sound
          Audio.playSoundWithVolume(Audio.sounds.wall, 0.5);
        }
      });
      
      // Check for teleport portal collisions
      this.teleportMarkers.forEach(teleport => {
        const distanceToEntrance = mb.mesh.position.distanceTo(teleport.entrancePosition);
        if (distanceToEntrance < teleport.radius && 
            Date.now() - teleport.lastTeleport > 1000) {
          
          // Teleport the multi-ball
          mb.mesh.position.copy(teleport.exitPosition);
          
          // Randomize exit velocity a bit
          const speed = mb.velocity.length();
          const angle = Math.atan2(mb.velocity.y, mb.velocity.x);
          const newAngle = angle + (Math.random() - 0.5) * Math.PI / 4;
          
          mb.velocity.x = Math.cos(newAngle) * speed;
          mb.velocity.y = Math.sin(newAngle) * speed;
          
          // Create teleport effect
          Utils.createTeleportEffect(teleport.entrancePosition, teleport.exitPosition);
          
          // Play teleport sound
          Audio.playSoundWithVolume(Audio.sounds.teleport || Audio.sounds.powerUp, 0.5);
        }
      });
      
      // Move multi-ball
      mb.mesh.position.x += mb.velocity.x * deltaTime * Settings.settings.game.gameSpeed;
      mb.mesh.position.y += mb.velocity.y * deltaTime * Settings.settings.game.gameSpeed;
      
      // Wall collisions for multi-balls
      const fieldHalfHeight = Constants.FIELD_HEIGHT / 2 - Constants.BALL_RADIUS;
      if (mb.mesh.position.y > fieldHalfHeight || mb.mesh.position.y < -fieldHalfHeight) {
        // Store previous position for visual effects
        const prevY = mb.mesh.position.y;
        
        // Reverse velocity
        mb.velocity.y *= -1;
        
        // Position correction to ensure multi-ball isn't stuck in the wall
        if (mb.mesh.position.y > fieldHalfHeight) {
          mb.mesh.position.y = fieldHalfHeight - 0.05;
        } else if (mb.mesh.position.y < -fieldHalfHeight) {
          mb.mesh.position.y = -fieldHalfHeight + 0.05;
        }
        
        // Add randomness to bounce
        mb.velocity.y += (Math.random() - 0.5) * (Settings.settings.game.randomnessLevel / 50);
        
        // Play wall collision sound
        Audio.playSoundWithVolume(Audio.sounds.wall, 0.5);
        
        // Add impact effect
        Utils.createImpactEffect(
          mb.mesh.position.x,
          prevY > 0 ? fieldHalfHeight : -fieldHalfHeight,
          mb.mesh.position.z,
          0x00ffff
        );
      }
      
      // Rotate multi-ball for visual effect
      mb.mesh.rotation.x += mb.velocity.y * deltaTime * 0.2;
      mb.mesh.rotation.z -= mb.velocity.x * deltaTime * 0.2;
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
  },
  
  /**
   * Apply super shot effect when ball hits paddle
   * @param {Object} paddle - The paddle that hit the ball
   */
  applySuperShot: function(paddle) {
    const superShotEffect = paddle.userData.activePowerUps.find(pu => pu.type === 'superShot');
    
    if (superShotEffect && superShotEffect.usesLeft > 0) {
      // Increase ball speed significantly
      const currentSpeed = Game.ball.userData.velocity.length();
      const direction = new THREE.Vector3().copy(Game.ball.userData.velocity).normalize();
      
      const newSpeed = currentSpeed * superShotEffect.strength;
      Game.ball.userData.velocity.copy(direction.multiplyScalar(newSpeed));
      
      // Add visual trail effect
      Renderer.createSuperShotTrail();
      
      // Add camera shake for impact
      Renderer.createCameraShake(0.5);
      
      // Play super shot sound
      Audio.playSoundWithVolume(Audio.sounds.superShot || Audio.sounds.powerUp, 1.5);
      
      // Decrease uses left
      superShotEffect.usesLeft--;
      
      // If no uses left, remove the effect
      if (superShotEffect.usesLeft <= 0) {
        paddle.userData.activePowerUps = paddle.userData.activePowerUps.filter(pu => pu.type !== 'superShot');
        
        // Remove glow effect
        paddle.children.forEach(child => {
          if (child instanceof THREE.PointLight) {
            paddle.remove(child);
          }
        });
      }
      
      return true;
    }
    
    return false;
  }
};