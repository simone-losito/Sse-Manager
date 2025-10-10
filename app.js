// app.js - Ver.1.0.3: bind login/menu and initialize app

// Binding login and menu buttons once DOM loaded
window.addEventListener('DOMContentLoaded', () => {
  const loginBtn = document.getElementById('login-btn');
  const menuBtn = document.getElementById('menu-btn');

  if (loginBtn) loginBtn.addEventListener('click', loginMaster);
  if (menuBtn) menuBtn.addEventListener('click', toggleMenu);

  // Initialize layout and start app hidden logic
  layoutCantieriGrid();
});

// Ensure startApp triggered inside app.js, remove inline

// Rest of app.js remains Ver.1.0.2