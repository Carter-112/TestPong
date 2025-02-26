// Renderer & Visual Effects
const Renderer = {
  // Main Three.js objects
  scene: null,
  camera: null,
  renderer: null,
  gameScene: null,
  
  // Game objects
  particles: null,  // Ball trail particles
  effectComposer: null, // Postprocessing
  popOutElements: [], // Elements that pop out in 2.5D
  
  /**
   * Initialize the renderer
   */
  init: function() {
    // Get the canvas
    const canvas = document.getElementById('gameCanvas');
    
    // Create scene container for game objects
    this.gameScene = new THREE.Group();
    
    // Create Three.js scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x000033);
    this.scene.fog = new THREE.FogExp2(0x000033, 0.01);
    this.scene.add(this.gameScene);
    
    // Create camera - using orthographic for 2.5D effect
    const aspect = window.innerWidth / window.innerHeight;
    const frustumSize = 100;
    this.camera = new THREE.OrthographicCamera(
      frustumSize * aspect / -2, 
      frustumSize * aspect / 2, 
      frustumSize / 2, 
      frustumSize / -2, 
      0.1, 
      1000
    );
    this.camera.position.z = 40;
    this.camera.position.y = 10;
    this.camera.lookAt(0, 0, 0);
    
    // Create renderer
    this.renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true });
    this.renderer.setSize(canvas.width, canvas.height);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.shadowMap.enabled = Settings.settings.graphics.enableShadows;
    
    // Log renderer creation
    console.log('Renderer created with canvas dimensions:', canvas.width, 'x', canvas.height);
    
    // Handle window resize
    window.addEventListener('resize', () => {
      const canvas = document.getElementById('gameCanvas');
      const aspect = canvas.width / canvas.height;
      const frustumSize = 100;
      
      this.camera.left = frustumSize * aspect / -2;
      this.camera.right = frustumSize * aspect / 2;
      this.camera.top = frustumSize / 2;
      this.camera.bottom = frustumSize / -2;
      this.camera.updateProjectionMatrix();
      
      // Keep the renderer matching the canvas size rather than window
      this.renderer.setSize(canvas.width, canvas.height);
      
      if (this.effectComposer) {
        this.effectComposer.setSize(canvas.width, canvas.height);
      }
      
      console.log('Resized renderer to:', canvas.width, 'x', canvas.height);
    });
    
    // Create game scene group
    this.gameScene = new THREE.Group();
    this.scene.add(this.gameScene);
    
    // Create ambient light
    const ambientLight = new THREE.AmbientLight(0x333344, 0.7);
    this.scene.add(ambientLight);
    
    // Create directional light
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(20, 30, 50);
    directionalLight.castShadow = Settings.settings.graphics.enableShadows;
    this.scene.add(directionalLight);
    
    // Add point lights for glow effect
    const pointLight1 = new THREE.PointLight(0x00ffff, 1, 100);
    pointLight1.position.set(-30, 10, 20);
    this.scene.add(pointLight1);
    
    const pointLight2 = new THREE.PointLight(0xff00ff, 1, 100);
    pointLight2.position.set(30, 10, 20);
    this.scene.add(pointLight2);
    
    // Create the starfield background
    this.createStarfield();
    
    // Initialize post-processing effects for 2.5D pop-out
    this.initPostProcessing();
    
    // Position game scene
    this.gameScene.position.y = -5;
    this.gameScene.rotation.x = -0.15; // Slight tilt for 2.5D effect
  },
  
  /**
   * Initialize post-processing effects for 2.5D pop-out visuals
   */
  initPostProcessing: function() {
    try {
      // Log for debugging
      console.log('Initializing post-processing effects...');
      
      // Set up effect composer for post-processing
      this.effectComposer = new THREE.EffectComposer(this.renderer);
      
      // Add render pass
      const renderPass = new THREE.RenderPass(this.scene, this.camera);
      this.effectComposer.addPass(renderPass);
      
      // Add bloom pass for glow effects
      if (Settings.settings.graphics.enableBloom) {
        console.log('Adding bloom pass...');
        const bloomPass = new THREE.UnrealBloomPass(
          new THREE.Vector2(window.innerWidth, window.innerHeight),
          1.5,  // strength
          0.4,  // radius
          0.85   // threshold
        );
        this.effectComposer.addPass(bloomPass);
      }
      
      // Add outline pass for pop-out effect
      console.log('Adding outline pass...');
      const outlinePass = new THREE.OutlinePass(
        new THREE.Vector2(window.innerWidth, window.innerHeight),
        this.scene,
        this.camera
      );
      outlinePass.edgeStrength = 3.0;
      outlinePass.edgeGlow = 0.7;
      outlinePass.edgeThickness = 1.0;
      outlinePass.pulsePeriod = 0;
      outlinePass.visibleEdgeColor.set(0x00ffff);
      outlinePass.hiddenEdgeColor.set(0xff00ff);
      this.effectComposer.addPass(outlinePass);
      
      // Final pass with film grain for arcade effect
      console.log('Adding film pass...');
      const filmPass = new THREE.FilmPass(0.35, 0.025, 648, false);
      filmPass.renderToScreen = true;
      this.effectComposer.addPass(filmPass);
      
      console.log('Post-processing initialized successfully');
    } catch (error) {
      console.error('Error initializing post-processing:', error);
      // Continue without post-processing if it fails
    }
  },
  
  /**
   * Create starfield background
   */
  createStarfield: function() {
    // Create star particles
    const starGeometry = new THREE.BufferGeometry();
    const starMaterial = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.2,
      transparent: true,
      opacity: 0.8,
      map: new THREE.TextureLoader().load('https://threejs.org/examples/textures/sprites/disc.png'),
      blending: THREE.AdditiveBlending
    });
    
    // Generate random stars
    const starPositions = [];
    const starCount = 2000;
    const starSpread = 300;
    
    for (let i = 0; i < starCount; i++) {
      const x = THREE.MathUtils.randFloatSpread(starSpread);
      const y = THREE.MathUtils.randFloatSpread(starSpread);
      const z = THREE.MathUtils.randFloatSpread(starSpread) - 100; // Move stars behind the game
      
      starPositions.push(x, y, z);
    }
    
    starGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starPositions, 3));
    const stars = new THREE.Points(starGeometry, starMaterial);
    this.scene.add(stars);
  },
  
  /**
   * Create the game field
   */
  createGameField: function() {
    console.log('Creating game field...');
    
    // Create game field
    const fieldGeometry = new THREE.BoxGeometry(Constants.FIELD_WIDTH, Constants.FIELD_HEIGHT, Constants.FIELD_DEPTH);
    
    // Create glowing wireframe material
    const edgesMaterial = new THREE.LineBasicMaterial({ 
      color: 0x00fcff,
      transparent: true,
      opacity: 0.3
    });
    
    // Create edges geometry
    const edges = new THREE.EdgesGeometry(fieldGeometry);
    const wireframe = new THREE.LineSegments(edges, edgesMaterial);
    this.gameScene.add(wireframe);
    Game.gameField = wireframe;
    
    console.log('Game field created with dimensions:', 
                Constants.FIELD_WIDTH, 'x', 
                Constants.FIELD_HEIGHT, 'x', 
                Constants.FIELD_DEPTH);
    
    // Create center line
    const centerLineGeometry = new THREE.PlaneGeometry(0.3, Constants.FIELD_HEIGHT, 1, 10);
    const centerLineMaterial = new THREE.MeshBasicMaterial({ 
      color: 0x00fcff,
      transparent: true,
      opacity: 0.3,
      side: THREE.DoubleSide
    });
    
    const centerLine = new THREE.Mesh(centerLineGeometry, centerLineMaterial);
    centerLine.rotation.y = Math.PI / 2;
    this.gameScene.add(centerLine);
    
    // Create center circle
    const centerCircleGeometry = new THREE.RingGeometry(7, 7.3, 32);
    const centerCircleMaterial = new THREE.MeshBasicMaterial({ 
      color: 0x00fcff,
      transparent: true,
      opacity: 0.3,
      side: THREE.DoubleSide
    });
    
    const centerCircle = new THREE.Mesh(centerCircleGeometry, centerCircleMaterial);
    centerCircle.rotation.x = Math.PI / 2;
    this.gameScene.add(centerCircle);
    
    // Create floor with grid texture
    const floorGeometry = new THREE.PlaneGeometry(Constants.FIELD_WIDTH, Constants.FIELD_HEIGHT);
    const floorMaterial = new THREE.MeshBasicMaterial({
      color: 0x000066,
      transparent: true,
      opacity: 0.2,
      side: THREE.DoubleSide
    });
    
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = Math.PI / 2;
    floor.position.y = -Constants.FIELD_DEPTH / 2;
    this.gameScene.add(floor);
    
    // Create grid lines on floor
    const gridHelper = new THREE.GridHelper(Constants.FIELD_WIDTH, 20, 0x00fcff, 0x00fcff);
    gridHelper.position.y = -Constants.FIELD_DEPTH / 2 + 0.01;
    gridHelper.material.transparent = true;
    gridHelper.material.opacity = 0.1;
    this.gameScene.add(gridHelper);
  },
  
  /**
   * Create paddles with 2.5D effect
   */
  createPaddles: function() {
    // Create paddle geometry - use extruded geometry for 2.5D effect
    const paddleShape = new THREE.Shape();
    paddleShape.moveTo(-Constants.PADDLE_WIDTH/2, -Constants.PADDLE_HEIGHT/2);
    paddleShape.lineTo(Constants.PADDLE_WIDTH/2, -Constants.PADDLE_HEIGHT/2);
    paddleShape.lineTo(Constants.PADDLE_WIDTH/2, Constants.PADDLE_HEIGHT/2);
    paddleShape.lineTo(-Constants.PADDLE_WIDTH/2, Constants.PADDLE_HEIGHT/2);
    paddleShape.lineTo(-Constants.PADDLE_WIDTH/2, -Constants.PADDLE_HEIGHT/2);
    
    const extrudeSettings = {
      steps: 1,
      depth: Constants.PADDLE_DEPTH,
      bevelEnabled: true,
      bevelThickness: 0.5,
      bevelSize: 0.5,
      bevelOffset: 0,
      bevelSegments: 3
    };
    
    const paddleGeometry = new THREE.ExtrudeGeometry(paddleShape, extrudeSettings);
    
    // Create left paddle with glow effect
    const leftPaddleMaterial = new THREE.MeshPhongMaterial({ 
      color: 0x00fcff,
      emissive: 0x00fcff,
      emissiveIntensity: 0.5,
      transparent: true,
      opacity: 0.9,
      shininess: 50
    });
    
    Game.leftPaddle = new THREE.Mesh(paddleGeometry, leftPaddleMaterial);
    Game.leftPaddle.position.set(-Constants.FIELD_WIDTH / 2 + 3, 0, 2); // Slightly forward for pop-out effect
    Game.leftPaddle.castShadow = Settings.settings.graphics.enableShadows;
    Game.leftPaddle.receiveShadow = Settings.settings.graphics.enableShadows;
    Game.leftPaddle.userData = {
      speed: Constants.PADDLE_SPEED,
      direction: 0,
      score: 0,
      height: Constants.PADDLE_HEIGHT,
      isAI: true,
      difficulty: Settings.settings.ai.leftDifficulty,
      activePowerUps: [],
      isFrozen: false,
      frozenUntil: 0,
      isPopOut: true // Flag for pop-out effect
    };
    this.gameScene.add(Game.leftPaddle);
    this.popOutElements.push(Game.leftPaddle); // Add to pop-out elements
    
    // Create right paddle with glow effect
    const rightPaddleMaterial = new THREE.MeshPhongMaterial({ 
      color: 0xff00ff,
      emissive: 0xff00ff,
      emissiveIntensity: 0.5,
      transparent: true,
      opacity: 0.9,
      shininess: 50
    });
    
    Game.rightPaddle = new THREE.Mesh(paddleGeometry, rightPaddleMaterial);
    Game.rightPaddle.position.set(Constants.FIELD_WIDTH / 2 - 3, 0, 2); // Slightly forward for pop-out effect
    Game.rightPaddle.castShadow = Settings.settings.graphics.enableShadows;
    Game.rightPaddle.receiveShadow = Settings.settings.graphics.enableShadows;
    Game.rightPaddle.userData = {
      speed: Constants.PADDLE_SPEED,
      direction: 0,
      score: 0,
      height: Constants.PADDLE_HEIGHT,
      isAI: true,
      difficulty: Settings.settings.ai.rightDifficulty,
      activePowerUps: [],
      isFrozen: false,
      frozenUntil: 0,
      isPopOut: true // Flag for pop-out effect
    };
    this.gameScene.add(Game.rightPaddle);
    this.popOutElements.push(Game.rightPaddle); // Add to pop-out elements
  },
  
  /**
   * Create the ball with 2.5D pop-out effect
   */
  createBall: function() {
    // Create ball geometry - use icosahedron for more detailed 3D look
    const ballGeometry = new THREE.IcosahedronGeometry(
      Constants.BALL_RADIUS,
      2 // Subdivision level for more detailed sphere
    );
    
    // Create ball material with glow effect
    const ballMaterial = new THREE.MeshPhongMaterial({ 
      color: 0xffffff,
      emissive: 0xffffaa,
      emissiveIntensity: 0.7,
      transparent: true,
      opacity: 0.9,
      shininess: 100
    });
    
    Game.ball = new THREE.Mesh(ballGeometry, ballMaterial);
    Game.ball.position.z = 4; // Position in front for pop-out effect
    Game.ball.castShadow = Settings.settings.graphics.enableShadows;
    Game.ball.receiveShadow = Settings.settings.graphics.enableShadows;
    Game.ball.userData = {
      velocity: new THREE.Vector3(Settings.settings.game.baseBallSpeed, 0, 0),
      baseSpeed: Settings.settings.game.baseBallSpeed,
      speed: Settings.settings.game.baseBallSpeed,
      isGhost: false,
      ghostOpacity: 1,
      isPopOut: true // Flag for pop-out effect
    };
    this.gameScene.add(Game.ball);
    this.popOutElements.push(Game.ball); // Add to pop-out elements
    
    // Create ball halo for enhanced pop-out effect
    const haloGeometry = new THREE.RingGeometry(
      Constants.BALL_RADIUS * 1.2,
      Constants.BALL_RADIUS * 1.6,
      32
    );
    const haloMaterial = new THREE.MeshBasicMaterial({
      color: 0xffffaa,
      transparent: true,
      opacity: 0.3,
      side: THREE.DoubleSide
    });
    
    Game.ballHalo = new THREE.Mesh(haloGeometry, haloMaterial);
    Game.ballHalo.position.z = 3.9; // Just behind the ball
    Game.ball.add(Game.ballHalo);
    Game.ballHalo.rotation.x = Math.PI / 2; // Face camera
    
    // Create ball trail if particles are enabled
    if (Settings.settings.graphics.enableParticles) {
      this.createBallTrail();
    }
    
    // Add pulsing animation to ball for extra pop-out effect
    this.animateBallPopOut();
  },
  
  /**
   * Add pulsing animation to ball for enhanced pop-out effect
   */
  animateBallPopOut: function() {
    // Use GSAP for smooth animation
    TweenMax.to(Game.ball.scale, 0.6, {
      x: 1.1,
      y: 1.1,
      z: 1.1,
      repeat: -1,
      yoyo: true,
      ease: Power1.easeInOut
    });
    
    // Animate halo opacity
    if (Game.ballHalo) {
      TweenMax.to(Game.ballHalo.material, 0.8, {
        opacity: 0.6,
        repeat: -1,
        yoyo: true,
        ease: Power1.easeInOut
      });
    }
  },
  
  /**
   * Create ball trail
   */
  createBallTrail: function() {
    // Create particle system for the ball trail
    const particleCount = 100;
    const particleGeometry = new THREE.BufferGeometry();
    const particleMaterial = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.5,
      transparent: true,
      opacity: 0.6,
      map: new THREE.TextureLoader().load('https://threejs.org/examples/textures/sprites/spark1.png'),
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    
    // Create particle positions
    const positions = new Float32Array(particleCount * 3);
    const alphas = new Float32Array(particleCount);
    
    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = Game.ball.position.x;
      positions[i * 3 + 1] = Game.ball.position.y;
      positions[i * 3 + 2] = Game.ball.position.z;
      alphas[i] = 0;
    }
    
    particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    particleGeometry.setAttribute('alpha', new THREE.BufferAttribute(alphas, 1));
    
    this.particles = new THREE.Points(particleGeometry, particleMaterial);
    this.gameScene.add(this.particles);
  },
  
  /**
   * Update ball trail
   */
  updateBallTrail: function() {
    // ANIMATION DEBUG: Track if ball trail is updating
    console.log("ANIMATION DEBUG: Ball trail update triggered");
    
    if (!this.particles || !Settings.settings.graphics.enableParticles) {
      console.log("ANIMATION DEBUG: No particles to update");
      return;
    }
    
    const positions = this.particles.geometry.attributes.position.array;
    const alphas = this.particles.geometry.attributes.alpha.array;
    const count = positions.length / 3;
    
    // ANIMATION DEBUG: Always update trail position and fade even during game over
    console.log("ANIMATION DEBUG: Updating ball trail particles: " + count);
    
    // Move all particles one step in the trail
    for (let i = count - 1; i > 0; i--) {
      positions[i * 3] = positions[(i - 1) * 3];
      positions[i * 3 + 1] = positions[(i - 1) * 3 + 1];
      positions[i * 3 + 2] = positions[(i - 1) * 3 + 2];
      alphas[i] = alphas[i - 1] * 0.95;
    }
    
    // Set the first particle position to the ball's current position
    positions[0] = Game.ball.position.x;
    positions[1] = Game.ball.position.y;
    positions[2] = Game.ball.position.z;
    alphas[0] = 1.0;
    
    // Update the colors based on ball speed
    const speed = Game.ball.userData.velocity.length();
    const normalizedSpeed = Math.min(1.0, speed / 15);
    const color = new THREE.Color();
    
    if (normalizedSpeed < 0.3) {
      color.setHSL(0.6, 1, 0.5); // Blue
    } else if (normalizedSpeed < 0.6) {
      color.setHSL(0.3, 1, 0.5); // Green
    } else {
      color.setHSL(0.0, 1, 0.5); // Red
    }
    
    this.particles.material.color = color;
    
    // Update the geometry
    this.particles.geometry.attributes.position.needsUpdate = true;
    this.particles.geometry.attributes.alpha.needsUpdate = true;
  },
  
  /**
   * Update menu animation
   * @param {number} deltaTime - Time since last frame
   */
  updateMenu: function(deltaTime) {
    // Rotate the game field for a cool effect
    if (Game.gameField) {
      Game.gameField.rotation.y += deltaTime * 0.2;
    }
    
    // Make camera slowly move around
    const t = Date.now() * 0.0005;
    this.camera.position.x = Math.sin(t) * 20;
    this.camera.position.z = 60 + Math.cos(t) * 10;
    this.camera.lookAt(0, 0, 0);
    
    // Add some subtle movement to lights
    this.scene.children.forEach(child => {
      if (child.type === 'PointLight') {
        child.position.y = 10 + Math.sin(t * 0.5 + child.position.x * 0.1) * 5;
      }
    });
  },
  
  /**
   * Update pop-out elements
   * @param {number} deltaTime - Time since last frame
   */
  updatePopOutEffects: function(deltaTime) {
    // Animate pop-out elements
    this.popOutElements.forEach(element => {
      if (element === Game.ball) {
        // Ball is already animated in animateBallPopOut
        return;
      }
      
      // For power-ups, make them float and rotate
      if (element.userData && element.userData.isPowerUp) {
        element.rotation.y += deltaTime * 2;
        element.position.y = element.userData.baseY + Math.sin(Date.now() * 0.003) * 0.5;
      }
      
      // For paddles when hit, add temporary pop-out effect
      if ((element === Game.leftPaddle || element === Game.rightPaddle) && 
          element.userData && element.userData.justHit) {
        
        element.userData.hitAnimTime = (element.userData.hitAnimTime || 0) + deltaTime;
        
        // Pop out effect lasts 0.3 seconds
        if (element.userData.hitAnimTime < 0.3) {
          const scale = 1 + Math.sin(element.userData.hitAnimTime * Math.PI / 0.3) * 0.2;
          element.scale.z = scale;
          element.position.z = 2 + (scale - 1) * 2;
        } else {
          element.scale.z = 1;
          element.position.z = 2;
          element.userData.justHit = false;
          element.userData.hitAnimTime = 0;
        }
      }
    });
    
    // Make power-ups pop out more when player approaches them
    PowerUps.powerUps.forEach(powerUp => {
      if (!powerUp.mesh) return;
      
      // Calculate distance to ball
      const distToBall = powerUp.mesh.position.distanceTo(Game.ball.position);
      
      if (distToBall < 10) {
        // Scale up as ball gets closer
        const scale = 1 + (1 - distToBall / 10) * 0.5;
        powerUp.mesh.scale.set(scale, scale, scale);
        
        // Increase glow intensity
        if (powerUp.mesh.material) {
          powerUp.mesh.material.emissiveIntensity = 0.8 * (1 - distToBall / 10);
        }
      } else {
        powerUp.mesh.scale.set(1, 1, 1);
        if (powerUp.mesh.material) {
          powerUp.mesh.material.emissiveIntensity = 0.5;
        }
      }
    });
  },
  
  /**
   * Trigger hit animation for paddle
   * @param {Object} paddle - The paddle that was hit
   */
  triggerPaddleHitAnimation: function(paddle) {
    if (!paddle) return;
    
    paddle.userData.justHit = true;
    paddle.userData.hitAnimTime = 0;
    
    // Create hit splash effect
    if (Settings.settings.graphics.enableParticles) {
      this.createHitSplash(paddle.position);
    }
    
    // Create camera shake effect
    this.createCameraShake();
  },
  
  /**
   * Create hit splash effect
   * @param {THREE.Vector3} position - Position for the splash effect
   */
  createHitSplash: function(position) {
    const particleCount = 20;
    const particles = [];
    
    for (let i = 0; i < particleCount; i++) {
      const particle = new THREE.Mesh(
        new THREE.SphereGeometry(0.2, 8, 8),
        new THREE.MeshBasicMaterial({
          color: 0xffffff,
          transparent: true,
          opacity: 0.8
        })
      );
      
      particle.position.copy(position);
      particle.position.z += 2; // In front of paddle
      
      // Random velocity
      const angle = Math.random() * Math.PI * 2;
      const speed = 2 + Math.random() * 5;
      particle.userData.velocity = new THREE.Vector3(
        Math.cos(angle) * speed,
        Math.sin(angle) * speed,
        Math.random() * 2
      );
      
      particle.userData.lifetime = 0;
      particle.userData.maxLifetime = 0.5 + Math.random() * 0.5;
      
      this.gameScene.add(particle);
      particles.push(particle);
    }
    
    // Animation loop for particles
    const updateParticles = () => {
      const toRemove = [];
      
      particles.forEach(particle => {
        particle.position.add(particle.userData.velocity.clone().multiplyScalar(0.016));
        particle.userData.velocity.multiplyScalar(0.95); // Slow down
        particle.userData.velocity.z -= 0.1; // Gravity
        
        particle.userData.lifetime += 0.016;
        
        // Fade out
        const normalizedLife = particle.userData.lifetime / particle.userData.maxLifetime;
        particle.material.opacity = 0.8 * (1 - normalizedLife);
        
        // Remove when expired
        if (particle.userData.lifetime >= particle.userData.maxLifetime) {
          toRemove.push(particle);
        }
      });
      
      // Remove expired particles
      toRemove.forEach(particle => {
        this.gameScene.remove(particle);
        particles.splice(particles.indexOf(particle), 1);
      });
      
      // Continue animation if particles remain
      if (particles.length > 0) {
        requestAnimationFrame(updateParticles);
      }
    };
    
    requestAnimationFrame(updateParticles);
  },
  
  /**
   * Create camera shake effect
   * @param {number} intensity - Shake intensity (default: 0.5)
   */
  createCameraShake: function(intensity = 0.5) {
    const originalPosition = this.camera.position.clone();
    const duration = 0.3; // seconds
    let elapsed = 0;
    
    const updateShake = () => {
      elapsed += 0.016;
      
      if (elapsed < duration) {
        const strength = intensity * (1 - elapsed / duration);
        
        this.camera.position.set(
          originalPosition.x + (Math.random() - 0.5) * strength,
          originalPosition.y + (Math.random() - 0.5) * strength,
          originalPosition.z + (Math.random() - 0.5) * strength
        );
        
        requestAnimationFrame(updateShake);
      } else {
        // Reset camera position
        this.camera.position.copy(originalPosition);
      }
    };
    
    requestAnimationFrame(updateShake);
  },
  
  /**
   * Create super shot trail effect for the ball
   */
  createSuperShotTrail: function() {
    if (!Game.ball) return;
    
    // Create special trail for super shot
    const trailCount = 25;
    const trailSegments = [];
    
    // Direction of ball movement
    const ballDirection = new THREE.Vector3().copy(Game.ball.userData.velocity).normalize();
    
    // Create trail segments
    for (let i = 0; i < trailCount; i++) {
      const size = Constants.BALL_RADIUS * (1 - i / (trailCount * 0.7));
      
      // Use cone for directional effect
      const trailGeometry = new THREE.ConeGeometry(size, size * 3, 8);
      const trailMaterial = new THREE.MeshBasicMaterial({
        color: 0xFFC107,
        transparent: true,
        opacity: 0.8 - (i * 0.03),
        emissive: 0xFFC107,
        emissiveIntensity: 0.5
      });
      
      const trailMesh = new THREE.Mesh(trailGeometry, trailMaterial);
      
      // Position along the velocity vector
      const distance = i * 0.4;
      const position = new THREE.Vector3().copy(Game.ball.position).sub(
        new THREE.Vector3().copy(ballDirection).multiplyScalar(distance)
      );
      
      trailMesh.position.copy(position);
      
      // Rotate to face the direction of movement
      trailMesh.lookAt(Game.ball.position);
      trailMesh.rotateX(Math.PI / 2);
      
      this.gameScene.add(trailMesh);
      trailSegments.push({
        mesh: trailMesh,
        life: 1.0
      });
    }
    
    // Create flash effect at ball position
    const flashGeometry = new THREE.SphereGeometry(Constants.BALL_RADIUS * 2, 16, 16);
    const flashMaterial = new THREE.MeshBasicMaterial({
      color: 0xFFC107,
      transparent: true,
      opacity: 0.7
    });
    
    const flash = new THREE.Mesh(flashGeometry, flashMaterial);
    flash.position.copy(Game.ball.position);
    this.gameScene.add(flash);
    
    // Animate trail and flash
    let elapsed = 0;
    const duration = 1.2;
    
    const updateTrail = () => {
      elapsed += 0.016;
      
      // Animate flash
      flash.scale.multiplyScalar(0.95);
      flash.material.opacity *= 0.93;
      
      // Fade out trail segments
      for (let i = trailSegments.length - 1; i >= 0; i--) {
        const segment = trailSegments[i];
        segment.life -= 0.03;
        
        if (segment.life <= 0) {
          this.gameScene.remove(segment.mesh);
          trailSegments.splice(i, 1);
        } else {
          segment.mesh.material.opacity = segment.life * 0.8;
          segment.mesh.scale.multiplyScalar(0.97);
        }
      }
      
      // Continue animation as long as needed
      if (trailSegments.length > 0 || flash.material.opacity > 0.01) {
        requestAnimationFrame(updateTrail);
      } else {
        // Clean up
        this.gameScene.remove(flash);
        trailSegments.forEach(segment => {
          this.gameScene.remove(segment.mesh);
        });
      }
    };
    
    requestAnimationFrame(updateTrail);
  },
  
  /**
   * Render the scene with post-processing effects
   */
  render: function() {
    try {
      // Use effect composer if available and settings allow
      if (this.effectComposer && Settings.settings.graphics.enableBloom) {
        this.effectComposer.render();
      } else {
        // Fallback to standard rendering
        this.renderer.render(this.scene, this.camera);
      }
    } catch (error) {
      console.error('Render error:', error);
      // Always try to render, even if post-processing fails
      try {
        this.renderer.render(this.scene, this.camera);
      } catch (fallbackError) {
        console.error('Critical render failure:', fallbackError);
      }
    }
  }
};