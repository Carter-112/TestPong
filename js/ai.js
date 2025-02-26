// AI Controller
const AI = {
  /**
   * Update AI-controlled paddles
   */
  updateAIPaddles: function() {
    // Update AI for left paddle if AI-controlled
    if (Game.leftPaddle.userData.isAI) {
      const predictedY = this.predictBallPosition(Game.leftPaddle);
      const difficultyFactor = this.getAIDifficultyFactor(Game.leftPaddle.userData.difficulty);
      
      // Add error based on difficulty
      const maxError = (1.0 - difficultyFactor) * 15;
      const aiError = THREE.MathUtils.randFloatSpread(maxError);
      
      const targetY = predictedY + aiError;
      const currentY = Game.leftPaddle.position.y;
      const difference = targetY - currentY;
      
      if (Math.abs(difference) < 0.5) {
        Game.leftPaddle.userData.direction = 0;
      } else {
        Game.leftPaddle.userData.direction = difference > 0 ? 1 : -1;
      }
    }
    
    // Update AI for right paddle if AI-controlled
    if (Game.rightPaddle.userData.isAI) {
      const predictedY = this.predictBallPosition(Game.rightPaddle);
      const difficultyFactor = this.getAIDifficultyFactor(Game.rightPaddle.userData.difficulty);
      
      // Add error based on difficulty
      const maxError = (1.0 - difficultyFactor) * 15;
      const aiError = THREE.MathUtils.randFloatSpread(maxError);
      
      const targetY = predictedY + aiError;
      const currentY = Game.rightPaddle.position.y;
      const difference = targetY - currentY;
      
      if (Math.abs(difference) < 0.5) {
        Game.rightPaddle.userData.direction = 0;
      } else {
        Game.rightPaddle.userData.direction = difference > 0 ? 1 : -1;
      }
    }
  },
  
  /**
   * Predict where the ball will be when it reaches the paddle
   * @param {Object} paddle - The paddle to predict for
   * @returns {number} - Predicted Y position
   */
  predictBallPosition: function(paddle) {
    if (Game.ball.userData.velocity.x === 0) return paddle.position.y;
    
    const isLeftPaddle = (paddle === Game.leftPaddle);
    
    // Only predict if the ball is moving toward this paddle
    if ((isLeftPaddle && Game.ball.userData.velocity.x >= 0) || 
        (!isLeftPaddle && Game.ball.userData.velocity.x <= 0)) {
      return paddle.position.y;
    }
    
    // Calculate distance to paddle
    const paddleX = isLeftPaddle ? Game.leftPaddle.position.x + Constants.PADDLE_WIDTH / 2 : Game.rightPaddle.position.x - Constants.PADDLE_WIDTH / 2;
    const distanceX = Math.abs(paddleX - Game.ball.position.x);
    
    // Calculate time to reach paddle
    const timeToReach = distanceX / Math.abs(Game.ball.userData.velocity.x);
    
    // Predict ball Y position at the paddle
    let predictedY = Game.ball.position.y + Game.ball.userData.velocity.y * timeToReach;
    
    // Account for bounces off the top and bottom walls
    const halfFieldHeight = Constants.FIELD_HEIGHT / 2 - Constants.BALL_RADIUS;
    while (Math.abs(predictedY) > halfFieldHeight) {
      if (predictedY > halfFieldHeight) {
        predictedY = 2 * halfFieldHeight - predictedY;
      } else if (predictedY < -halfFieldHeight) {
        predictedY = -2 * halfFieldHeight - predictedY;
      }
    }
    
    // For harder difficulties, try to aim for power-ups or strategic positions
    const difficultyFactor = this.getAIDifficultyFactor(paddle.userData.difficulty);
    if (difficultyFactor > 0.7 && Math.random() < difficultyFactor * 0.3) {
      // Look for nearby power-ups
      for (const powerUp of PowerUps.powerUps) {
        const isSameSide = (isLeftPaddle && powerUp.x < 0) || (!isLeftPaddle && powerUp.x > 0);
        if (isSameSide && Math.random() < 0.8) {
          predictedY = THREE.MathUtils.lerp(predictedY, powerUp.mesh.position.y, 0.5);
          break;
        }
      }
    }
    
    return predictedY;
  },
  
  /**
   * Get AI difficulty factor based on difficulty setting
   * @param {string} difficulty - The difficulty setting
   * @returns {number} - Difficulty factor between 0 and 1
   */
  getAIDifficultyFactor: function(difficulty) {
    switch (difficulty) {
      case 'easy': return 0.3;
      case 'normal': return 0.6;
      case 'hard': return 0.8;
      case 'insane': return 0.95;
      case 'adaptive': return 0.5 + (Math.sin(Date.now() * 0.0005) + 1) * 0.25;
      default: return 0.6;
    }
  }
};