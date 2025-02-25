// Store & Player Data Management
const Store = {
  // Player data
  playerName: 'Player',
  playerAvatar: 'cyan',
  playerCredits: 1000,
  playerItems: {},
  paypalEmail: 'example@youremail.com', // Default PayPal email shown to user
  actualPaypalEmail: 'cartermoyer75@gmail.com', // Actual PayPal email for processing payments
  userEmail: '', // User's login email
  userPassword: '', // User's login password (hashed for storage)
  isLoggedIn: false, // Login status
  
  /**
   * Initialize PayPal buttons
   */
  initPayPalButtons: function() {
    // Check if PayPal SDK is available (handles both test and production environments)
    if (typeof paypal === 'undefined') {
      console.warn('PayPal SDK not loaded');
      return;
    }
    
    // Initialize PayPal buttons for each credit pack
    const paypal500Button = paypal.Buttons({
      createOrder: function(data, actions) {
        return actions.order.create({
          purchase_units: [{
            amount: {
              value: '4.99'
            },
            description: '500 Credits for Cosmic Pong',
            payee: {
              email_address: Store.actualPaypalEmail
            }
          }]
        });
      },
      onApprove: function(data, actions) {
        return actions.order.capture().then(function(details) {
          Store.addCredits(500);
          Utils.showNotification('Payment Successful', `Thank you, ${details.payer.name.given_name}! 500 credits have been added to your account.`, 'success');
        });
      },
      style: {
        layout: 'horizontal',
        color: 'blue',
        shape: 'rect',
        label: 'pay',
        height: 40
      }
    });
    
    const paypal1200Button = paypal.Buttons({
      createOrder: function(data, actions) {
        return actions.order.create({
          purchase_units: [{
            amount: {
              value: '9.99'
            },
            description: '1200 Credits for Cosmic Pong',
            payee: {
              email_address: Store.actualPaypalEmail
            }
          }]
        });
      },
      onApprove: function(data, actions) {
        return actions.order.capture().then(function(details) {
          Store.addCredits(1200);
          Utils.showNotification('Payment Successful', `Thank you, ${details.payer.name.given_name}! 1200 credits have been added to your account.`, 'success');
        });
      },
      style: {
        layout: 'horizontal',
        color: 'blue',
        shape: 'rect',
        label: 'pay',
        height: 40
      }
    });
    
    const paypal3000Button = paypal.Buttons({
      createOrder: function(data, actions) {
        return actions.order.create({
          purchase_units: [{
            amount: {
              value: '19.99'
            },
            description: '3000 Credits for Cosmic Pong',
            payee: {
              email_address: Store.actualPaypalEmail
            }
          }]
        });
      },
      onApprove: function(data, actions) {
        return actions.order.capture().then(function(details) {
          Store.addCredits(3000);
          Utils.showNotification('Payment Successful', `Thank you, ${details.payer.name.given_name}! 3000 credits have been added to your account.`, 'success');
        });
      },
      style: {
        layout: 'horizontal',
        color: 'blue',
        shape: 'rect',
        label: 'pay',
        height: 40
      }
    });
    
    // Try-catch blocks to handle rendering of PayPal buttons
    try {
      if (document.getElementById('paypal-500-container')) {
        paypal500Button.render('#paypal-500-container');
      }
    } catch (err) {
      console.warn('PayPal 500 button rendering error:', err);
    }
    
    try {
      if (document.getElementById('paypal-1200-container')) {
        paypal1200Button.render('#paypal-1200-container');
      }
    } catch (err) {
      console.warn('PayPal 1200 button rendering error:', err);
    }
    
    try {
      if (document.getElementById('paypal-3000-container')) {
        paypal3000Button.render('#paypal-3000-container');
      }
    } catch (err) {
      console.warn('PayPal 3000 button rendering error:', err);
    }
  },
  
  /**
   * Add credits to player account
   * @param {number} amount - Amount of credits to add
   */
  addCredits: function(amount) {
    this.playerCredits += amount;
    document.getElementById('playerCredits').textContent = this.playerCredits;
    
    // Save player data to localStorage
    this.savePlayerData();
  },
  
  /**
   * Purchase an item from the store
   * @param {string} itemId - Item identifier
   */
  purchaseItem: function(itemId) {
    // Define item prices
    const prices = {
      'neon_paddle_pack': 200,
      'cosmic_ball_skins': 300,
      'premium_powerups': 500,
      'arena_themes': 450
    };
    
    // Check if player has enough credits
    if (this.playerCredits >= prices[itemId]) {
      // Deduct credits
      this.playerCredits -= prices[itemId];
      document.getElementById('playerCredits').textContent = this.playerCredits;
      
      // Add item to player's inventory
      this.playerItems[itemId] = true;
      
      // Show success notification
      Utils.showNotification('Purchase Successful', `You have purchased the item for ${prices[itemId]} credits!`, 'success');
      
      // Save player data
      this.savePlayerData();
      
      // Update UI to show owned item
      const button = document.querySelector(`button[onclick="Store.purchaseItem('${itemId}')"]`);
      if (button) {
        button.textContent = 'Owned';
        button.disabled = true;
        button.classList.add('active');
      }
    } else {
      // Show error notification
      Utils.showNotification('Insufficient Credits', `You need ${prices[itemId] - this.playerCredits} more credits to buy this item.`, 'error');
    }
  },
  
  /**
   * Save player data to localStorage
   */
  savePlayerData: function() {
    // Save player data to localStorage
    const playerData = {
      name: this.playerName,
      avatar: this.playerAvatar,
      credits: this.playerCredits,
      items: this.playerItems,
      email: this.userEmail,
      isLoggedIn: this.isLoggedIn,
      paypalEmail: this.paypalEmail
    };
    
    localStorage.setItem('cosmicPongPlayerData', JSON.stringify(playerData));
  },
  
  /**
   * Load player data from localStorage
   */
  loadPlayerData: function() {
    // Load player data from localStorage
    const savedData = localStorage.getItem('cosmicPongPlayerData');
    if (savedData) {
      const data = JSON.parse(savedData);
      this.playerName = data.name || 'Player';
      this.playerAvatar = data.avatar || 'cyan';
      this.playerCredits = data.credits || 1000;
      this.playerItems = data.items || {};
      this.userEmail = data.email || '';
      this.isLoggedIn = data.isLoggedIn || false;
      this.paypalEmail = data.paypalEmail || 'cartermoyer75@gmail.com';
      
      // Update login state in Game
      Game.isLoggedIn = this.isLoggedIn;
      Game.currentUser = this.isLoggedIn ? {
        email: this.userEmail,
        name: this.playerName
      } : null;
      
      // Update UI
      if (document.getElementById('playerName')) {
        document.getElementById('playerName').value = this.playerName;
      }
      
      if (document.getElementById('playerAvatar')) {
        document.getElementById('playerAvatar').value = this.playerAvatar;
      }
      
      if (document.getElementById('paypalEmail')) {
        document.getElementById('paypalEmail').value = this.paypalEmail;
      }
      
      document.getElementById('playerCredits').textContent = this.playerCredits;
      
      // Update login status in UI
      this.updateLoginUI();
      
      // Update owned items
      for (const item in this.playerItems) {
        if (this.playerItems[item]) {
          const button = document.querySelector(`button[onclick="Store.purchaseItem('${item}')"]`);
          if (button) {
            button.textContent = 'Owned';
            button.disabled = true;
            button.classList.add('active');
          }
        }
      }
    }
  },
  
  /**
   * Update player profile
   */
  updateProfile: function() {
    this.playerName = document.getElementById('playerName').value;
    this.playerAvatar = document.getElementById('playerAvatar').value;
    
    if (document.getElementById('paypalEmail')) {
      this.paypalEmail = document.getElementById('paypalEmail').value;
    }
    
    this.savePlayerData();
    
    // Update game state
    if (Game.isLoggedIn && Game.currentUser) {
      Game.currentUser.name = this.playerName;
    }
    
    Utils.showNotification('Profile Updated', 'Your profile has been updated.', 'success');
  },
  
  /**
   * Login user with email and password
   * @param {string} email - User email
   * @param {string} password - User password
   */
  login: function(email, password) {
    // Simple validation
    if (!email || !password) {
      Utils.showNotification('Login Failed', 'Please enter both email and password.', 'error');
      return;
    }
    
    // In a real app, we would validate credentials against a server
    // For demo, we'll just store the login state
    this.userEmail = email;
    this.isLoggedIn = true;
    
    // Update game state
    Game.isLoggedIn = true;
    Game.currentUser = {
      email: this.userEmail,
      name: this.playerName
    };
    
    // Save to localStorage
    this.savePlayerData();
    
    // Update UI
    this.updateLoginUI();
    
    Utils.showNotification('Login Successful', `Welcome back, ${this.playerName}!`, 'success');
    
    // Close login panel
    UI.hidePanel('loginPanel');
  },
  
  /**
   * Register new user
   * @param {string} email - User email
   * @param {string} password - User password
   * @param {string} name - User name
   */
  register: function(email, password, name) {
    // Simple validation
    if (!email || !password || !name) {
      Utils.showNotification('Registration Failed', 'Please fill out all fields.', 'error');
      return;
    }
    
    // In a real app, we would register with a server
    // For demo, we'll just store the registration locally
    this.userEmail = email;
    this.playerName = name;
    this.isLoggedIn = true;
    
    // Update game state
    Game.isLoggedIn = true;
    Game.currentUser = {
      email: this.userEmail,
      name: this.playerName
    };
    
    // Save to localStorage
    this.savePlayerData();
    
    // Update UI
    this.updateLoginUI();
    
    Utils.showNotification('Registration Successful', `Welcome, ${this.playerName}!`, 'success');
    
    // Close register panel
    UI.hidePanel('registerPanel');
  },
  
  /**
   * Logout user
   */
  logout: function() {
    this.isLoggedIn = false;
    
    // Update game state
    Game.isLoggedIn = false;
    Game.currentUser = null;
    
    // Save to localStorage
    this.savePlayerData();
    
    // Update UI
    this.updateLoginUI();
    
    Utils.showNotification('Logged Out', 'You have been logged out successfully.', 'info');
  },
  
  /**
   * Update UI based on login status
   */
  updateLoginUI: function() {
    const loginButton = document.getElementById('loginButton');
    const logoutButton = document.getElementById('logoutButton');
    const userInfoDisplay = document.getElementById('userInfo');
    
    if (this.isLoggedIn) {
      // Show logout button
      if (loginButton) loginButton.style.display = 'none';
      if (logoutButton) logoutButton.style.display = 'inline-block';
      
      // Update user info display
      if (userInfoDisplay) {
        userInfoDisplay.textContent = `Logged in as: ${this.userEmail}`;
        userInfoDisplay.style.display = 'block';
      }
      
      // Enable store purchases
      document.querySelectorAll('.store-item button').forEach(button => {
        if (!button.classList.contains('active')) {
          button.disabled = false;
        }
      });
    } else {
      // Show login button
      if (loginButton) loginButton.style.display = 'inline-block';
      if (logoutButton) logoutButton.style.display = 'none';
      
      // Hide user info
      if (userInfoDisplay) {
        userInfoDisplay.style.display = 'none';
      }
      
      // Disable store purchases (except for viewing)
      document.querySelectorAll('.store-item button').forEach(button => {
        if (!button.classList.contains('active')) {
          button.disabled = true;
          button.title = 'Login to purchase';
        }
      });
    }
  }
};