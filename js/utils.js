// Utility functions for the game
const Utils = {
  /**
   * Creates a teleport effect between entrance and exit portals
   * @param {THREE.Vector3} entrancePos - Entrance portal position
   * @param {THREE.Vector3} exitPos - Exit portal position
   */
  createTeleportEffect: function(entrancePos, exitPos) {
    if (!Settings.settings.graphics.enableParticles) return;
    
    // Create particle trails at both portals
    const createPortalParticles = (position, color) => {
      const particleCount = 30;
      const particles = new THREE.Group();
      
      for (let i = 0; i < particleCount; i++) {
        const size = Math.random() * 0.4 + 0.1;
        const angle = Math.random() * Math.PI * 2;
        const radius = 3 + Math.random();
        
        const particle = new THREE.Mesh(
          new THREE.SphereGeometry(size, 8, 8),
          new THREE.MeshBasicMaterial({
            color: color,
            transparent: true,
            opacity: 0.8
          })
        );
        
        // Position around ring
        particle.position.set(
          position.x + Math.cos(angle) * radius * 0.5,
          position.y + Math.sin(angle) * radius * 0.5,
          position.z
        );
        
        // Velocity toward center
        particle.userData.velocity = new THREE.Vector3(
          (position.x - particle.position.x) * 1.5,
          (position.y - particle.position.y) * 1.5,
          (Math.random() - 0.5) * 0.5
        );
        
        particle.userData.life = 1.0;
        particles.add(particle);
      }
      
      return particles;
    };
    
    // Create entrance and exit effects with different colors
    const entranceParticles = createPortalParticles(entrancePos, 0xE91E63);
    const exitParticles = createPortalParticles(exitPos, 0x00BCD4);
    
    Renderer.gameScene.add(entranceParticles);
    Renderer.gameScene.add(exitParticles);
    
    // Create connecting beam effect
    const beamGeometry = new THREE.CylinderGeometry(0.2, 0.2, 1, 8);
    const beamMaterial = new THREE.MeshBasicMaterial({
      color: 0xFFFFFF,
      transparent: true,
      opacity: 0.5
    });
    
    const beam = new THREE.Mesh(beamGeometry, beamMaterial);
    
    // Position and scale beam to connect portals
    const midPoint = new THREE.Vector3().addVectors(entrancePos, exitPos).multiplyScalar(0.5);
    const distance = entrancePos.distanceTo(exitPos);
    
    beam.position.copy(midPoint);
    beam.scale.set(1, distance, 1);
    
    // Rotate beam to point from entrance to exit
    beam.lookAt(exitPos);
    beam.rotateX(Math.PI / 2);
    
    Renderer.gameScene.add(beam);
    
    // Animate
    const animate = function() {
      // Animate particles
      const updateParticleGroup = (group) => {
        for (let i = group.children.length - 1; i >= 0; i--) {
          const p = group.children[i];
          
          p.position.x += p.userData.velocity.x * 0.05;
          p.position.y += p.userData.velocity.y * 0.05;
          p.position.z += p.userData.velocity.z * 0.05;
          
          p.userData.life -= 0.05;
          p.material.opacity = p.userData.life;
          
          if (p.userData.life <= 0) {
            group.remove(p);
          }
        }
      };
      
      updateParticleGroup(entranceParticles);
      updateParticleGroup(exitParticles);
      
      // Fade beam
      beam.material.opacity -= 0.05;
      
      // Continue animation if any effect is still visible
      if (beam.material.opacity > 0 || 
          entranceParticles.children.length > 0 || 
          exitParticles.children.length > 0) {
        requestAnimationFrame(animate);
      } else {
        // Clean up
        Renderer.gameScene.remove(beam);
        Renderer.gameScene.remove(entranceParticles);
        Renderer.gameScene.remove(exitParticles);
      }
    };
    
    animate();
  },
  
  /**
   * Creates a slow motion effect for the time slow power-up
   */
  createSlowMotionEffect: function() {
    if (!Settings.settings.graphics.enableParticles) return;
    
    // Create ripple effect
    const ringGeometry = new THREE.RingGeometry(5, 40, 32);
    const ringMaterial = new THREE.MeshBasicMaterial({
      color: 0x9C27B0,
      transparent: true,
      opacity: 0.3,
      side: THREE.DoubleSide
    });
    
    const ring = new THREE.Mesh(ringGeometry, ringMaterial);
    ring.position.set(0, 0, 0);
    ring.rotation.x = Math.PI / 2;
    Renderer.gameScene.add(ring);
    
    // Create particles around the field
    const particleCount = 100;
    const particles = new THREE.Group();
    
    // Add particles along the field borders
    for (let i = 0; i < particleCount; i++) {
      const size = Math.random() * 0.4 + 0.2;
      
      const particle = new THREE.Mesh(
        new THREE.SphereGeometry(size, 8, 8),
        new THREE.MeshBasicMaterial({
          color: 0x9C27B0,
          transparent: true,
          opacity: 0.5
        })
      );
      
      // Position particles around the field borders
      if (i < particleCount / 2) {
        // Top and bottom edges
        const xPos = (Math.random() * Constants.FIELD_WIDTH) - Constants.FIELD_WIDTH / 2;
        const yPos = Math.random() < 0.5 ? 
                    Constants.FIELD_HEIGHT / 2 : -Constants.FIELD_HEIGHT / 2;
        
        particle.position.set(xPos, yPos, Math.random() * 5);
      } else {
        // Left and right edges
        const xPos = Math.random() < 0.5 ?
                    Constants.FIELD_WIDTH / 2 : -Constants.FIELD_WIDTH / 2;
        const yPos = (Math.random() * Constants.FIELD_HEIGHT) - Constants.FIELD_HEIGHT / 2;
        
        particle.position.set(xPos, yPos, Math.random() * 5);
      }
      
      particle.userData.life = 1.0;
      particles.add(particle);
    }
    
    Renderer.gameScene.add(particles);
    
    // Animate
    const animate = function() {
      // Expand ripple
      ring.scale.x += 0.05;
      ring.scale.y += 0.05;
      
      // Fade ring
      ringMaterial.opacity -= 0.01;
      
      // Fade particles
      for (let i = particles.children.length - 1; i >= 0; i--) {
        const p = particles.children[i];
        p.userData.life -= 0.02;
        p.material.opacity = p.userData.life * 0.5;
        
        if (p.userData.life <= 0) {
          particles.remove(p);
        }
      }
      
      // Continue animation if any effect is still visible
      if (ringMaterial.opacity > 0 || particles.children.length > 0) {
        requestAnimationFrame(animate);
      } else {
        // Clean up
        Renderer.gameScene.remove(ring);
        Renderer.gameScene.remove(particles);
      }
    };
    
    animate();
  },
  /**
   * Shows a notification message
   * @param {string} title - Notification title
   * @param {string} message - Notification message
   * @param {string} type - Notification type (info, success, warning, error)
   */
  showNotification: function(title, message, type = 'info') {
    const notifContainer = document.getElementById('notificationContainer');
    
    // Create notification element
    const notif = document.createElement('div');
    notif.className = `notification ${type}`;
    
    // Set icon based on type
    let icon;
    switch(type) {
      case 'success': icon = 'fa-check-circle'; break;
      case 'error': icon = 'fa-exclamation-circle'; break;
      case 'warning': icon = 'fa-exclamation-triangle'; break;
      default: icon = 'fa-info-circle';
    }
    
    // Create notification content
    notif.innerHTML = `
      <div class="notification-icon">
        <i class="fas ${icon}"></i>
      </div>
      <div class="notification-content">
        <div class="notification-title">${title}</div>
        <div class="notification-message">${message}</div>
      </div>
    `;
    
    // Add to container
    notifContainer.appendChild(notif);
    
    // Trigger animation
    setTimeout(() => {
      notif.classList.add('show');
    }, 10);
    
    // Remove after a delay
    setTimeout(() => {
      notif.classList.remove('show');
      setTimeout(() => {
        notifContainer.removeChild(notif);
      }, 300);
    }, 5000);
  },
  
  /**
   * Creates a special visual effect at the given position
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate
   * @param {number} z - Z coordinate
   * @param {number} color - Effect color
   */
  createImpactEffect: function(x, y, z, color) {
    if (!Settings.settings.graphics.enableParticles) return;
    
    // Create a burst of particles at the impact point
    const particleCount = 20;
    const particles = new THREE.Group();
    
    for (let i = 0; i < particleCount; i++) {
      const size = Math.random() * 0.5 + 0.2;
      const speed = Math.random() * 2 + 1;
      const angle = Math.random() * Math.PI * 2;
      const elevation = Math.random() * Math.PI - Math.PI / 2;
      
      const particle = new THREE.Mesh(
        new THREE.SphereGeometry(size, 8, 8),
        new THREE.MeshBasicMaterial({
          color: color,
          transparent: true,
          opacity: 0.8
        })
      );
      
      particle.position.set(x, y, z);
      particle.userData.velocity = new THREE.Vector3(
        Math.cos(angle) * Math.cos(elevation) * speed,
        Math.sin(elevation) * speed,
        Math.sin(angle) * Math.cos(elevation) * speed
      );
      particle.userData.life = 1.0;
      
      particles.add(particle);
    }
    
    Renderer.gameScene.add(particles);
    
    // Animate and fade out
    const animateParticles = function() {
      for (let i = particles.children.length - 1; i >= 0; i--) {
        const p = particles.children[i];
        
        p.position.x += p.userData.velocity.x * 0.1;
        p.position.y += p.userData.velocity.y * 0.1;
        p.position.z += p.userData.velocity.z * 0.1;
        
        p.userData.life -= 0.03;
        p.material.opacity = p.userData.life;
        
        if (p.userData.life <= 0) {
          particles.remove(p);
        }
      }
      
      if (particles.children.length > 0) {
        requestAnimationFrame(animateParticles);
      } else {
        Renderer.gameScene.remove(particles);
      }
    };
    
    animateParticles();
  },
  
  /**
   * Creates a power-up activation effect
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate
   * @param {number} z - Z coordinate
   * @param {string} type - Power-up type
   */
  createPowerUpEffect: function(x, y, z, type) {
    if (!Settings.settings.graphics.enableParticles) return;
    
    // Determine color based on power-up type
    let color;
    switch (type) {
      case 'speed': color = 0xffeb3b; break;
      case 'ballSpeed': color = 0xf44336; break;
      case 'shrink': color = 0x800080; break;
      case 'shield': color = 0x2196F3; break;
      case 'magnet': color = 0x4CAF50; break;
      case 'giant': color = 0xFF9800; break;
      case 'ghost': color = 0xFFFFFF; break;
      case 'multiBall': color = 0x00FFFF; break;
      case 'freeze': color = 0x008080; break;
      case 'gravity': color = 0x8000FF; break;
      case 'timeSlow': color = 0x9C27B0; break;
      case 'teleport': color = 0xE91E63; break;
      case 'superShot': color = 0xFFC107; break;
      case 'mirror': color = 0xCDDC39; break;
      case 'obstacle': color = 0x795548; break;
      default: color = 0xFFFFFF;
    }
    
    // Create expanding ring effect
    const ringGeometry = new THREE.RingGeometry(0.1, 3, 32);
    const ringMaterial = new THREE.MeshBasicMaterial({
      color: color,
      transparent: true,
      opacity: 0.8,
      side: THREE.DoubleSide
    });
    
    const ring = new THREE.Mesh(ringGeometry, ringMaterial);
    ring.position.set(x, y, z);
    ring.rotation.x = Math.PI / 2;
    Renderer.gameScene.add(ring);
    
    // Create particle burst for added effect
    const particleCount = 30;
    const particles = new THREE.Group();
    
    for (let i = 0; i < particleCount; i++) {
      const size = Math.random() * 0.3 + 0.1;
      const speed = Math.random() * 3 + 2;
      const angle = Math.random() * Math.PI * 2;
      
      const particle = new THREE.Mesh(
        new THREE.SphereGeometry(size, 8, 8),
        new THREE.MeshBasicMaterial({
          color: color,
          transparent: true,
          opacity: 0.8
        })
      );
      
      particle.position.set(x, y, z);
      particle.userData.velocity = new THREE.Vector3(
        Math.cos(angle) * speed,
        Math.sin(angle) * speed,
        (Math.random() - 0.5) * 2
      );
      particle.userData.life = 1.0;
      
      particles.add(particle);
    }
    
    Renderer.gameScene.add(particles);
    
    // Animate the ring and particles
    const animateEffect = function() {
      // Animate ring
      ring.scale.x += 0.15;
      ring.scale.y += 0.15;
      ring.scale.z += 0.15;
      ring.material.opacity -= 0.02;
      
      // Animate particles
      for (let i = particles.children.length - 1; i >= 0; i--) {
        const p = particles.children[i];
        
        p.position.x += p.userData.velocity.x * 0.1;
        p.position.y += p.userData.velocity.y * 0.1;
        p.position.z += p.userData.velocity.z * 0.1;
        
        // Slow down
        p.userData.velocity.x *= 0.95;
        p.userData.velocity.y *= 0.95;
        p.userData.velocity.z *= 0.95;
        
        p.userData.life -= 0.03;
        p.material.opacity = p.userData.life;
        
        if (p.userData.life <= 0) {
          particles.remove(p);
        }
      }
      
      // Continue animation if either effect is still active
      if (ring.material.opacity > 0 || particles.children.length > 0) {
        requestAnimationFrame(animateEffect);
      } else {
        // Clean up
        Renderer.gameScene.remove(ring);
        Renderer.gameScene.remove(particles);
      }
    };
    
    // Start animation
    animateEffect();
  },
  
  /**
   * Creates a scoring effect
   * @param {number} score - Current score
   * @param {string} side - Which side scored ('left' or 'right')
   */
  createScoreEffect: function(score, side) {
    // Create floating score text
    const textElement = document.createElement('div');
    textElement.className = 'score-popup';
    textElement.textContent = score.toString();
    document.body.appendChild(textElement);
    
    // Position near the scoring player's side
    const x = side === 'left' ? '25%' : '75%';
    
    // Set style
    textElement.style.position = 'absolute';
    textElement.style.left = x;
    textElement.style.top = '40%';
    textElement.style.fontSize = '80px';
    textElement.style.fontWeight = 'bold';
    textElement.style.color = side === 'left' ? 'var(--primary)' : 'var(--secondary)';
    textElement.style.textShadow = '0 0 20px ' + (side === 'left' ? 'var(--primary)' : 'var(--secondary)');
    textElement.style.opacity = '0';
    textElement.style.zIndex = '100';
    textElement.style.pointerEvents = 'none';
    textElement.style.transition = 'all 0.5s ease-out';
    
    // Animate
    setTimeout(() => {
      textElement.style.opacity = '1';
      textElement.style.transform = 'translateY(-50px) scale(1.5)';
    }, 10);
    
    // Remove after animation
    setTimeout(() => {
      textElement.style.opacity = '0';
      setTimeout(() => {
        document.body.removeChild(textElement);
      }, 500);
    }, 1000);
  },
  
  /**
   * Check if running on a mobile device
   * @returns {boolean} True if on mobile device
   */
  isMobileDevice: function() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  }
};