// Game Settings Management
const Settings = {
  // Default settings are loaded from Constants.DEFAULT_SETTINGS
  settings: JSON.parse(JSON.stringify(Constants.DEFAULT_SETTINGS)),
  
  /**
   * Load settings from localStorage
   */
  loadSettings: function() {
    // Load settings from localStorage
    const savedSettings = localStorage.getItem('cosmicPongSettings');
    if (savedSettings) {
      const data = JSON.parse(savedSettings);
      
      // Merge saved settings with defaults
      this.settings = {
        ...this.settings,
        ...data
      };
      
      // Update UI to reflect loaded settings
      this.updateSettingsUI();
    }
    
    // Also load player data
    Store.loadPlayerData();
  },
  
  /**
   * Save settings to localStorage
   */
  saveSettings: function() {
    // Save current settings to localStorage
    localStorage.setItem('cosmicPongSettings', JSON.stringify(this.settings));
    Utils.showNotification('Settings Saved', 'Your settings have been saved.', 'success');
  },
  
  /**
   * Update UI to reflect current settings
   */
  updateSettingsUI: function() {
    // Update sliders and form elements to match current settings
    
    // Game settings
    document.getElementById('gameSpeed').value = this.settings.game.gameSpeed;
    document.getElementById('gameSpeedValue').textContent = this.settings.game.gameSpeed;
    
    document.getElementById('baseBallSpeed').value = this.settings.game.baseBallSpeed;
    document.getElementById('baseBallSpeedValue').textContent = this.settings.game.baseBallSpeed;
    
    document.getElementById('maxPoints').value = this.settings.game.maxPoints;
    document.getElementById('maxPointsValue').textContent = this.settings.game.maxPoints;
    
    document.getElementById('powerUpFrequency').value = this.settings.game.powerUpFrequency;
    document.getElementById('powerUpFrequencyValue').textContent = `${this.settings.game.powerUpFrequency / 1000}s`;
    
    document.getElementById('extraSpeedFactor').value = this.settings.game.extraSpeedFactor;
    document.getElementById('extraSpeedFactorValue').textContent = this.settings.game.extraSpeedFactor;
    
    document.getElementById('randomnessLevel').value = this.settings.game.randomnessLevel;
    document.getElementById('randomnessLevelValue').textContent = this.settings.game.randomnessLevel;
    
    // AI settings
    document.getElementById('leftDifficulty').value = this.settings.ai.leftDifficulty;
    document.getElementById('rightDifficulty').value = this.settings.ai.rightDifficulty;
    
    // Graphics settings
    document.getElementById('graphicsQuality').value = this.settings.graphics.quality;
    const qualities = ['Low', 'Medium', 'High'];
    document.getElementById('graphicsQualityValue').textContent = qualities[this.settings.graphics.quality];
    
    document.getElementById('enableParticles').checked = this.settings.graphics.enableParticles;
    document.getElementById('enableBloom').checked = this.settings.graphics.enableBloom;
    document.getElementById('enableShadows').checked = this.settings.graphics.enableShadows;
    
    // Sound settings
    document.getElementById('masterVolume').value = this.settings.sound.masterVolume;
    document.getElementById('masterVolumeValue').textContent = `${Math.round(this.settings.sound.masterVolume * 100)}%`;
    
    document.getElementById('sfxVolume').value = this.settings.sound.sfxVolume;
    document.getElementById('sfxVolumeValue').textContent = `${Math.round(this.settings.sound.sfxVolume * 100)}%`;
    
    document.getElementById('musicVolume').value = this.settings.sound.musicVolume;
    document.getElementById('musicVolumeValue').textContent = `${Math.round(this.settings.sound.musicVolume * 100)}%`;
    
    document.getElementById('enableMusic').checked = this.settings.sound.enableMusic;
    
    // Power-up settings
    document.getElementById('powerUpDurationFactor').value = this.settings.powerUps.durationFactor;
    document.getElementById('powerUpDurationFactorValue').textContent = `${this.settings.powerUps.durationFactor}x`;
    
    document.getElementById('powerUpStrengthFactor').value = this.settings.powerUps.strengthFactor;
    document.getElementById('powerUpStrengthFactorValue').textContent = `${this.settings.powerUps.strengthFactor}x`;
    
    // Power-up toggles
    for (const type in this.settings.powerUps.enabled) {
      const checkbox = document.getElementById(`toggle${type.charAt(0).toUpperCase() + type.slice(1)}`);
      if (checkbox) {
        checkbox.checked = this.settings.powerUps.enabled[type];
      }
    }
    
    // Power-up chances
    for (const type in this.settings.powerUps.chances) {
      const slider = document.getElementById(`${type}Chance`);
      const display = document.getElementById(`${type}ChanceValue`);
      if (slider && display) {
        slider.value = this.settings.powerUps.chances[type];
        display.textContent = `${this.settings.powerUps.chances[type]}%`;
      }
    }
  },
  
  /**
   * Apply settings from UI to game
   */
  applySettings: function() {
    // Read all settings from UI
    
    // Game settings
    this.settings.game.gameSpeed = parseFloat(document.getElementById('gameSpeed').value);
    this.settings.game.baseBallSpeed = parseFloat(document.getElementById('baseBallSpeed').value);
    this.settings.game.maxPoints = parseInt(document.getElementById('maxPoints').value);
    this.settings.game.powerUpFrequency = parseInt(document.getElementById('powerUpFrequency').value);
    this.settings.game.extraSpeedFactor = parseFloat(document.getElementById('extraSpeedFactor').value);
    this.settings.game.randomnessLevel = parseInt(document.getElementById('randomnessLevel').value);
    
    // AI settings
    this.settings.ai.leftDifficulty = document.getElementById('leftDifficulty').value;
    this.settings.ai.rightDifficulty = document.getElementById('rightDifficulty').value;
    
    // Graphics settings
    this.settings.graphics.quality = parseInt(document.getElementById('graphicsQuality').value);
    this.settings.graphics.enableParticles = document.getElementById('enableParticles').checked;
    this.settings.graphics.enableBloom = document.getElementById('enableBloom').checked;
    this.settings.graphics.enableShadows = document.getElementById('enableShadows').checked;
    
    // Sound settings
    this.settings.sound.masterVolume = parseFloat(document.getElementById('masterVolume').value);
    this.settings.sound.sfxVolume = parseFloat(document.getElementById('sfxVolume').value);
    this.settings.sound.musicVolume = parseFloat(document.getElementById('musicVolume').value);
    this.settings.sound.enableMusic = document.getElementById('enableMusic').checked;
    
    // Apply settings
    this.saveSettings();
    
    // Update game with new settings
    this.applyGameSettings();
    
    // Show notification
    Utils.showNotification('Settings Applied', 'Your settings have been applied to the game.', 'success');
  },
  
  /**
   * Apply settings to the game
   */
  applyGameSettings: function() {
    // Apply renderer settings
    Renderer.renderer.shadowMap.enabled = this.settings.graphics.enableShadows;
    
    // Apply sound settings
    for (const sound in Audio.sounds) {
      Audio.sounds[sound].volume(this.settings.sound[sound === 'music' ? 'musicVolume' : 'sfxVolume'] * this.settings.sound.masterVolume);
    }
    
    // Toggle music based on settings
    if (this.settings.sound.enableMusic && Game.gameState === 'playing') {
      if (!Audio.sounds.music.playing()) {
        Audio.sounds.music.play();
      }
    } else {
      Audio.sounds.music.pause();
    }
    
    // Apply AI difficulty settings
    if (Game.leftPaddle) {
      Game.leftPaddle.userData.difficulty = this.settings.ai.leftDifficulty;
    }
    if (Game.rightPaddle) {
      Game.rightPaddle.userData.difficulty = this.settings.ai.rightDifficulty;
    }
    
    // Update ball speed if the ball exists
    if (Game.ball) {
      Game.ball.userData.baseSpeed = this.settings.game.baseBallSpeed;
    }
  },
  
  /**
   * Apply power-up settings from UI
   */
  applyPowerUpSettings: function() {
    // Read power-up settings from UI
    
    // Duration and strength factors
    this.settings.powerUps.durationFactor = parseFloat(document.getElementById('powerUpDurationFactor').value);
    this.settings.powerUps.strengthFactor = parseFloat(document.getElementById('powerUpStrengthFactor').value);
    
    // Enabled power-ups
    for (const type in this.settings.powerUps.enabled) {
      const checkbox = document.getElementById(`toggle${type.charAt(0).toUpperCase() + type.slice(1)}`);
      if (checkbox) {
        this.settings.powerUps.enabled[type] = checkbox.checked;
      }
    }
    
    // Power-up chances
    for (const type in this.settings.powerUps.chances) {
      const slider = document.getElementById(`${type}Chance`);
      if (slider) {
        this.settings.powerUps.chances[type] = parseInt(slider.value);
      }
    }
    
    // Save settings
    this.saveSettings();
    
    // Show notification
    Utils.showNotification('Power-Up Settings Applied', 'Your power-up settings have been applied.', 'success');
  },
  
  /**
   * Reset all settings to defaults
   */
  resetSettings: function() {
    // Reset to default settings
    this.settings = JSON.parse(JSON.stringify(Constants.DEFAULT_SETTINGS));
    
    // Update UI
    this.updateSettingsUI();
    
    // Apply settings
    this.applyGameSettings();
    
    // Show notification
    Utils.showNotification('Settings Reset', 'All settings have been reset to defaults.', 'info');
  },
  
  /**
   * Reset power-up settings to defaults
   */
  resetPowerUpSettings: function() {
    // Reset to default power-up settings
    this.settings.powerUps = JSON.parse(JSON.stringify(Constants.DEFAULT_SETTINGS.powerUps));
    
    // Update UI
    this.updateSettingsUI();
    
    // Show notification
    Utils.showNotification('Power-Up Settings Reset', 'All power-up settings have been reset to defaults.', 'info');
  }
};