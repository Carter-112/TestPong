// Game constants
const Constants = {
  // Paddle properties
  PADDLE_WIDTH: 1,
  PADDLE_HEIGHT: 10,
  PADDLE_DEPTH: 3,
  PADDLE_SPEED: 0.5,
  
  // Ball properties
  BALL_RADIUS: 1,
  BALL_SEGMENTS: 32,
  
  // Game field dimensions
  FIELD_WIDTH: 80,
  FIELD_HEIGHT: 50,
  FIELD_DEPTH: 5,
  
  // Power-up duration and strength ranges
  POWER_UP_DURATIONS: {
    speed: [3000, 6500],
    ballSpeed: [3000, 5000],
    shrink: [3000, 5000],
    shield: [8000, 10000],
    magnet: [7000, 9000],
    giant: [5000, 8000],
    ghost: [4000, 7000],
    multiBall: [3000, 6000],
    freeze: [2000, 4000],
    gravity: [5000, 8000],
    timeSlow: [3000, 5000],
    teleport: [2000, 4000],
    superShot: [3000, 6000],
    mirror: [5000, 8000],
    obstacle: [4000, 7000]
  },
  
  POWER_UP_STRENGTHS: {
    speed: [0.5, 0.9],
    ballSpeed: [0.35, 0.7],
    shrink: [0.3, 0.5],
    shield: [1, 1],
    magnet: [0.8, 1.5],
    giant: [0.7, 1.2],
    ghost: [0.6, 0.9],
    multiBall: [1, 1],
    freeze: [1, 1],
    gravity: [0.5, 1.0],
    timeSlow: [0.3, 0.7],
    teleport: [1, 1],
    superShot: [1.2, 2.0],
    mirror: [1, 1],
    obstacle: [1, 1]
  },
  
  // Default settings
  DEFAULT_SETTINGS: {
    game: {
      gameSpeed: 2.2,
      baseBallSpeed: 4,
      maxPoints: 10,
      powerUpFrequency: 5000,
      extraSpeedFactor: 0.05,
      randomnessLevel: 15
    },
    ai: {
      leftDifficulty: 'normal',
      rightDifficulty: 'normal'
    },
    graphics: {
      quality: 1, // 0: low, 1: medium, 2: high
      enableParticles: true,
      enableBloom: true,
      enableShadows: true
    },
    sound: {
      masterVolume: 0.8,
      sfxVolume: 0.8,
      musicVolume: 0.5,
      enableMusic: true
    },
    powerUps: {
      durationFactor: 1.0,
      strengthFactor: 1.0,
      enabled: {
        speed: true,
        ballSpeed: true,
        shrink: true,
        shield: true,
        magnet: true,
        giant: true,
        ghost: true,
        multiBall: true,
        freeze: true,
        gravity: true,
        timeSlow: true,
        teleport: true,
        superShot: true,
        mirror: true,
        obstacle: true
      },
      chances: {
        speed: 10,
        ballSpeed: 10,
        shrink: 10,
        shield: 10,
        magnet: 10,
        giant: 10,
        ghost: 10,
        multiBall: 10,
        freeze: 10,
        gravity: 10,
        timeSlow: 10,
        teleport: 10,
        superShot: 10,
        mirror: 10,
        obstacle: 10
      }
    }
  }
};