// Utility functions for the game
const Utils = {
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
    
    // Animate the ring
    const expandRing = function() {
      ring.scale.x += 0.1;
      ring.scale.y += 0.1;
      ring.scale.z += 0.1;
      ring.material.opacity -= 0.02;
      
      if (ring.material.opacity > 0) {
        requestAnimationFrame(expandRing);
      } else {
        Renderer.gameScene.remove(ring);
      }
    };
    
    expandRing();
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