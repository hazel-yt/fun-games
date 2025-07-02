// =========== Data Storage & Helpers =============
function saveUsers(users) {
  localStorage.setItem('funGenUsers', JSON.stringify(users));
}
function loadUsers() {
  const data = localStorage.getItem('funGenUsers');
  return data ? JSON.parse(data) : {};
}

function saveCurrentUser(user) {
  localStorage.setItem('funGenCurrentUser', JSON.stringify(user));
}
function loadCurrentUser() {
  const data = localStorage.getItem('funGenCurrentUser');
  return data ? JSON.parse(data) : null;
}

// Generate random id for models/games
function generateId() {
  return Math.random().toString(36).slice(2,10);
}

// =========== Global State ============
let users = loadUsers();
let currentUser = loadCurrentUser();

// Elements
const loginPanel = document.getElementById('loginPanel');
const mainPanel = document.getElementById('mainPanel');
const errorMsg = document.getElementById('errorMsg');
const usernameInput = document.getElementById('usernameInput');
const passwordInput = document.getElementById('passwordInput');
const loginBtn = document.getElementById('loginBtn');

const coinsDisplay = document.getElementById('coinsDisplay');

const studioBtn = document.getElementById('studioBtn');
const playBtn = document.getElementById('playBtn');
const storeBtn = document.getElementById('storeBtn');
const friendsBtn = document.getElementById('friendsBtn');
const logoutBtn = document.getElementById('logoutBtn');

const studioArea = document.getElementById('studioArea');
const playArea = document.getElementById('playArea');
const storeArea = document.getElementById('storeArea');
const friendsArea = document.getElementById('friendsArea');

const addModelBtn = document.getElementById('addModelBtn');
const studioCanvas = document.getElementById('studioCanvas');
const studioItems = document.getElementById('studioItems');

const gamesList = document.getElementById('gamesList');
const playGameBtn = document.getElementById('playGameBtn');

const storeItemsDiv = document.getElementById('storeItems');
const ownedClothesDiv = document.getElementById('ownedClothes');

const friendUsernameInput = document.getElementById('friendUsernameInput');
const addFriendBtn = document.getElementById('addFriendBtn');
const friendsListDiv = document.getElementById('friendsList');

const adminPanel = document.getElementById('adminPanel');
const promoteUsernameInput = document.getElementById('promoteUsername');
const promoteBtn = document.getElementById('promoteBtn');
const banUsernameInput = document.getElementById('banUsername');
const banBtn = document.getElementById('banBtn');
const coinsUsernameInput = document.getElementById('coinsUsername');
const coinsAmountInput = document.getElementById('coinsAmount');
const giveCoinsBtn = document.getElementById('giveCoinsBtn');

// Premade clothes in store
const premadeClothes = [
  { id: 'hat1', name: 'Cool Blue Hat', description: 'A stylish blue hat.', price: 20 },
  { id: 'hat2', name: 'Red Cap', description: 'Bright red baseball cap.', price: 15 },
  { id: 'hat3', name: 'Wizard Hat', description: 'Magical pointy hat.', price: 30 }
];

// =========== Login & Account system ============
loginBtn.addEventListener('click', () => {
  const username = usernameInput.value.trim();
  const password = passwordInput.value.trim();
  errorMsg.textContent = '';

  if(username.length < 3){
    errorMsg.textContent = 'Username must be at least 3 characters';
    return;
  }
  if(password.length < 3){
    errorMsg.textContent = 'Password must be at least 3 characters';
    return;
  }

  if(users[username]){
    // User exists, check password
    if(users[username].password !== password){
      errorMsg.textContent = 'Incorrect password';
      return;
    }
    if(users[username].banned){
      errorMsg.textContent = 'You are banned.';
      return;
    }
    currentUser = users[username];
    saveCurrentUser(currentUser);
    showMainPanel();
  } else {
    // Register new user - first user is super admin
    const isFirstUser = Object.keys(users).length === 0;
    users[username] = {
      username,
      password,
      coins: 50,
      friends: [],
      ownedClothes: [],
      models: [],
      playedGames: [],
      isAdmin: isFirstUser,
      isSuperAdmin: isFirstUser,
      banned: false
    };
    currentUser = users[username];
    saveUsers(users);
    saveCurrentUser(currentUser);
    showMainPanel();
  }
});

function showMainPanel(){
  loginPanel.classList.add('hidden');
  mainPanel.classList.remove('hidden');
  updateCoins();
  updateAdminPanelVisibility();
  showStudio();
}

logoutBtn.addEventListener('click', () => {
  currentUser = null;
  saveCurrentUser(null);
  loginPanel.classList.remove('hidden');
  mainPanel.classList.add('hidden');
});

function updateCoins(){
  coinsDisplay.textContent = currentUser.coins;
}

// =========== Navigation =============
studioBtn.addEventListener('click', () => {
  hideAllContent();
  showStudio();
});
playBtn.addEventListener('click', () => {
  hideAllContent();
  showPlay();
});
storeBtn.addEventListener('click', () => {
  hideAllContent();
  showStore();
});
friendsBtn.addEventListener('click', () => {
  hideAllContent();
  showFriends();
});

function hideAllContent(){
  studioArea.classList.add('hidden');
  playArea.classList.add('hidden');
  storeArea.classList.add('hidden');
  friendsArea.classList.add('hidden');
  adminPanel.classList.add('hidden');
}

// =========== Studio Mode ============
function showStudio(){
  studioArea.classList.remove('hidden');
  renderModels();
  studioCanvas.innerHTML = '';
}

addModelBtn.addEventListener('click', () => {
  // Add a model at random pos
  const id = generateId();
  const newModel = {
    id,
    name: 'Unnamed Hat',
    description: '',
    x: 50 + Math.random() * (studioCanvas.clientWidth-60),
    y: 50 + Math.random() * (studioCanvas.clientHeight-60)
  };
  currentUser.models.push(newModel);
  saveUserChanges();
  renderModels();
});

function renderModels(){
  studioCanvas.innerHTML = '';
  studioItems.innerHTML = '';

  currentUser.models.forEach(model => {
    // Add model div on canvas
    const div = document.createElement('div');
    div.className = 'model';
    div.style.left = model.x + 'px';
    div.style.top = model.y + 'px';
    div.textContent = model.name;
    div.title = model.description || 'No description';

    // Make draggable inside canvas
    makeDraggable(div, model);

    // Right click for naming
    div.addEventListener('contextmenu', e => {
      e.preventDefault();
      const newName = prompt('Enter Hat Name:', model.name);
      if(newName) model.name = newName;
      const newDesc = prompt('Enter Hat Description:', model.description);
      if(newDesc !== null) model.description = newDesc;
      saveUserChanges();
      renderModels();
    });

    studioCanvas.appendChild(div);

    // Also show in list below
    const listItem = document.createElement('div');
    listItem.textContent = `${model.name} - ${model.description || 'No description'}`;
    studioItems.appendChild(listItem);
  });
}

function makeDraggable(element, model){
  let offsetX, offsetY, dragging = false;

  element.addEventListener('mousedown', e => {
    dragging = true;
    offsetX = e.clientX - element.getBoundingClientRect().left;
    offsetY = e.clientY - element.getBoundingClientRect().top;
    element.style.zIndex = 1000;
  });
  window.addEventListener('mouseup', e => {
    if(dragging){
      dragging = false;
      model.x = parseInt(element.style.left);
      model.y = parseInt(element.style.top);
      saveUserChanges();
      element.style.zIndex = '';
    }
  });
  window.addEventListener('mousemove', e => {
    if(dragging){
      let newX = e.clientX - offsetX - studioCanvas.getBoundingClientRect().left;
      let newY = e.clientY - offsetY - studioCanvas.getBoundingClientRect().top;
      // Keep inside canvas
      newX = Math.min(Math.max(0, newX), studioCanvas.clientWidth - element.clientWidth);
      newY = Math.min(Math.max(0, newY), studioCanvas.clientHeight - element.clientHeight);
      element.style.left = newX + 'px';
      element.style.top = newY + 'px';
    }
  });
}

// =========== Play Mode ============
function showPlay(){
  playArea.classList.remove('hidden');
  renderPlayedGames();
  playGameBtn.disabled = true;
}

function renderPlayedGames(){
  gamesList.innerHTML = '';
  if(currentUser.playedGames.length === 0){
    gamesList.textContent = 'You have not played any games yet.';
    return;
  }
  currentUser.playedGames.forEach((game, index) => {
    const div = document.createElement('div');
    div.textContent = `${game.name} (ID: ${game.id})`;
    div.dataset.index = index;
    div.style.cursor = 'pointer';
    div.addEventListener('click', () => {
      // Highlight selected
      [...gamesList.children].forEach(c => c.style.background = '#333');
      div.style.background = '#0a84ff';
      playGameBtn.disabled = false;
      playGameBtn.dataset.selectedIndex = index;
    });
    gamesList.appendChild(div);
  });
}

playGameBtn.addEventListener('click', () => {
  const idx = parseInt(playGameBtn.dataset.selectedIndex);
  if(isNaN(idx)) return;
  const game = currentUser.playedGames[idx];
  alert(`Playing game: ${game.name}\n(Imagine gameplay here!)`);
  // Reward coins
  currentUser.coins += 10;
  saveUserChanges();
  updateCoins();
});

// =========== Store ===========
function showStore(){
  storeArea.classList.remove('hidden');
  renderStoreItems();
  renderOwnedClothes();
}

function renderStoreItems(){
  storeItemsDiv.innerHTML = '';
  premadeClothes.forEach(item => {
    if(currentUser.ownedClothes.includes(item.id)) return; // skip owned
    const div = document.createElement('div');
    div.className = 'item';
    div.innerHTML = `<span>${item.name} - ${item.price} coins</span>`;
    const buyBtn = document.createElement('button');
    buyBtn.textContent = 'Buy';
    buyBtn.addEventListener('click', () => {
      if(currentUser.coins >= item.price){
        currentUser.coins -= item.price;
        currentUser.ownedClothes.push(item.id);
        saveUserChanges();
        updateCoins();
        renderStoreItems();
        renderOwnedClothes();
        alert(`You bought ${item.name}!`);
      } else {
        alert('Not enough coins');
      }
    });
    div.appendChild(buyBtn);
    storeItemsDiv.appendChild(div);
  });
}

function renderOwnedClothes(){
  ownedClothesDiv.innerHTML = '';
  currentUser.ownedClothes.forEach(id => {
    const item = premadeClothes.find(c => c.id === id);
    if(!item) return;
    const div = document.createElement('div');
    div.textContent = `${item.name} - ${item.description}`;
    ownedClothesDiv.appendChild(div);
  });
}

// =========== Friends ============
function showFriends(){
  friendsArea.classList.remove('hidden');
  renderFriends();
}

function renderFriends(){
  friendsListDiv.innerHTML = '';
  if(currentUser.friends.length === 0){
    friendsListDiv.textContent = 'No friends added.';
    return;
  }
  currentUser.friends.forEach(friendName => {
    const div = document.createElement('div');
    div.textContent = friendName;
    friendsListDiv.appendChild(div);
  });
}

addFriendBtn.addEventListener('click', () => {
  const friendName = friendUsernameInput.value.trim();
  if(!friendName){
    alert('Enter a username');
    return;
  }
  if(friendName === currentUser.username){
    alert('Cannot add yourself');
    return;
  }
  if(!users[friendName]){
    alert('User not found');
    return;
  }
  if(currentUser.friends.includes(friendName)){
    alert('Already friends');
    return;
  }
  currentUser.friends.push(friendName);
  saveUserChanges();
  renderFriends();
  friendUsernameInput.value = '';
});

// =========== Admin Panel ============
function updateAdminPanelVisibility(){
  if(currentUser.isAdmin){
    adminPanel.classList.remove('hidden');
  } else {
    adminPanel.classList.add('hidden');
  }
}

promoteBtn.addEventListener('click', () => {
  const name = promoteUsernameInput.value.trim();
  if(!name){
    alert('Enter username');
    return;
  }
  if(!users[name]){
    alert('User not found');
    return;
  }
  users[name].isAdmin = true;
  saveUsers(users);
  alert(`${name} is now an admin.`);
});

banBtn.addEventListener('click', () => {
  const name = banUsernameInput.value.trim();
  if(!name){
    alert('Enter username');
    return;
  }
  if(!users[name]){
    alert('User not found');
    return;
  }
  users[name].banned = true;
  saveUsers(users);
  alert(`${name} has been banned.`);
  if(name === currentUser.username){
    alert('You have been banned and will be logged out.');
    logoutBtn.click();
  }
});

giveCoinsBtn.addEventListener('click', () => {
  const name = coinsUsernameInput.value.trim();
  const amount = parseInt(coinsAmountInput.value);
  if(!name || isNaN(amount) || amount <= 0){
    alert('Enter valid username and amount');
    return;
  }
  if(!users[name]){
    alert('User not found');
    return;
  }
  users[name].coins = (users[name].coins || 0) + amount;
  saveUsers(users);
  alert(`Gave ${amount} coins to ${name}.`);
});

// =========== Save User Changes ============
function saveUserChanges(){
  users[currentUser.username] = currentUser;
  saveUsers(users);
  saveCurrentUser(currentUser);
}
