// Audio Management
const Audio = {
  // Sound effects
  sounds: {
    paddle: new Howl({ src: ['https://assets.codepen.io/21542/impactPlank_medium_004.mp3'], volume: 0.7 }),
    wall: new Howl({ src: ['https://assets.codepen.io/21542/impactGlass_medium_004.mp3'], volume: 0.5 }),
    score: new Howl({ src: ['https://assets.codepen.io/21542/jingles_PIZZI10.mp3'], volume: 0.8 }),
    powerUp: new Howl({ src: ['https://assets.codepen.io/21542/powerUp12.mp3'], volume: 0.6 }),
    music: new Howl({ 
      src: ['https://assets.codepen.io/21542/Cyberpunk-Streetlight-Serenade.mp3'], 
      volume: 0.3, 
      loop: true 
    })
  },
  
  /**
   * Play a sound with adjusted volume based on settings
   * @param {Howl} sound - The Howl sound object to play
   * @param {number} volumeScale - Optional volume scaling factor
   */
  playSoundWithVolume: function(sound, volumeScale = 1.0) {
    const volume = Settings.settings.sound.sfxVolume * Settings.settings.sound.masterVolume * volumeScale;
    sound.volume(volume);
    sound.play();
  },
  
  /**
   * Initialize audio settings
   */
  init: function() {
    // Apply volume settings to all sounds
    for (const sound in this.sounds) {
      if (sound === 'music') {
        this.sounds[sound].volume(Settings.settings.sound.musicVolume * Settings.settings.sound.masterVolume);
      } else {
        this.sounds[sound].volume(Settings.settings.sound.sfxVolume * Settings.settings.sound.masterVolume);
      }
    }
  },
  
  /**
   * Start background music if enabled
   */
  startMusic: function() {
    if (Settings.settings.sound.enableMusic) {
      this.sounds.music.volume(Settings.settings.sound.musicVolume * Settings.settings.sound.masterVolume);
      this.sounds.music.play();
    }
  },
  
  /**
   * Stop background music
   */
  stopMusic: function() {
    this.sounds.music.stop();
  }
};