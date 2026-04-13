const ADMIN_USERNAME = "malenkiydanik";

let gameState = {
    balance: 0,
    energy: 150,
    maxEnergy: 150,
    tapPower: 1,
    passiveIncome: 0,
    lastUpdate: Date.now(),
    lastDailyReward: 0,
    upgrades: {
        tap: Array(10).fill(0),
        passive: Array(10).fill(0)
    }
};

const tg = window.Telegram.WebApp;
tg.expand();

const shopData = {
    tap: Array.from({length: 10}, (_, i) => ({
        id: i, name: `Crystal Spike T${i+1}`, cost: 100 * Math.pow(4, i), effect: Math.pow(2, i+1)
    })),
    passive: Array.from({length: 10}, (_, i) => ({
        id: i, name: `Frozen Mine T${i+1}`, cost: 500 * Math.pow(5, i), effect: Math.pow(3, i+1)
    }))
};

// Функция тапа с анимацией
function handleTap(e) {
    if (gameState.energy >= 1) {
        gameState.balance += gameState.tapPower;
        gameState.energy -= 1;
        
        createTapAnim(e);
        updateUI();
        tg.HapticFeedback?.impactOccurred('light');
    } else {
        tg.HapticFeedback?.notificationOccurred('warning');
    }
}

function createTapAnim(e) {
    const el = document.createElement('div');
    el.className = 'tap-number';
    el.innerText = `+${gameState.tapPower}`;
    const x = e.clientX || (e.touches ? e.touches[0].clientX : 0);
    const y = e.clientY || (e.touches ? e.touches[0].clientY : 0);
    el.style.left = `${x}px`;
    el.style.top = `${y}px`;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 800);
}

// Ежедневная награда
window.claimDailyReward = function() {
    const now = Date.now();
    const oneDay = 24 * 60 * 60 * 1000;
    if (now - gameState.lastDailyReward >= oneDay) {
        gameState.balance += 5000;
        gameState.lastDailyReward = now;
        alert("Daily Reward Claimed: +5,000!");
        updateUI();
        saveGame();
    } else {
        const hours = Math.floor((oneDay - (now - gameState.lastDailyReward)) / 3600000);
        alert(`Next reward in ${hours} hours.`);
    }
};

// Админ функции
window.addAdminBalance = function() {
    gameState.balance += 1000000;
    updateUI();
    saveGame();
};

window.startGlobalTimer = function() {
    localStorage.setItem('airdrop_start', Date.now());
    alert("3-month Timer Started!");
};

// Магазин
window.buyUpgrade = function(type, id) {
    let currentLevel = gameState.upgrades[type][id];
    let itemData = shopData[type][id];
    let currentCost = Math.floor(itemData.cost * Math.pow(2.5, currentLevel));

    if (gameState.balance >= currentCost) {
        gameState.balance -= currentCost;
        gameState.upgrades[type][id]++;
        if (type === 'tap') gameState.tapPower += itemData.effect;
        else gameState.passiveIncome += itemData.effect;
        tg.HapticFeedback?.notificationOccurred('success');
        renderShopItems(type);
        updateUI();
        saveGame();
    }
};

function renderShopItems(type) {
    const list = document.getElementById('shop-list');
    if(!list) return;
    list.innerHTML = shopData[type].map(item => {
        let lvl = gameState.upgrades[type][item.id];
        let cost = Math.floor(item.cost * Math.pow(2.5, lvl));
        return `<div class="shop-item cry-frame-h">
            <div><b>${item.name}</b><br><small>Lvl ${lvl}</small></div>
            <button class="menu-btn" onclick="buyUpgrade('${type}', ${item.id})">${cost.toLocaleString()}</button>
        </div>`;
    }).join('');
}

// UI и Навигация
function updateUI() {
    document.getElementById('balance').innerText = Math.floor(gameState.balance).toLocaleString();
    document.getElementById('energy-current').innerText = Math.floor(gameState.energy);
    document.getElementById('energy-fill').style.width = (gameState.energy / gameState.maxEnergy * 100) + "%";
}

window.showScreen = function(screenId) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('nav-active'));
    document.getElementById(screenId).classList.add('active');
    if(screenId === 'shop-screen') renderShopItems('tap');
};

window.switchShopTab = function(type) {
    document.querySelectorAll('.shop-tab').forEach(b => b.classList.remove('active-tab'));
    event.currentTarget.classList.add('active-tab');
    renderShopItems(type);
};

function toggleMusic() {
    const music = document.getElementById('bg-music');
    music.paused ? music.play() : music.pause();
}

// Сохранение и загрузка
function saveGame() {
    gameState.lastUpdate = Date.now();
    localStorage.setItem('juug_v3_state', JSON.stringify(gameState));
    if(window.sendScoreToCloud) window.sendScoreToCloud(gameState.balance);
}

function loadGame() {
    const saved = localStorage.getItem('juug_v3_state');
    if (saved) {
        gameState = JSON.parse(saved);
        let diff = Math.floor((Date.now() - gameState.lastUpdate) / 1000);
        gameState.balance += diff * gameState.passiveIncome;
        gameState.energy = Math.min(150, gameState.energy + (diff * 0.1));
    }
    const currentUser = tg.initDataUnsafe?.user?.username;
    if (currentUser === ADMIN_USERNAME) {
        document.getElementById('admin-panel').style.display = 'block';
    }
}

// Цикл
setInterval(() => {
    gameState.balance += (gameState.passiveIncome / 10);
    if (gameState.energy < 150) gameState.energy += 0.01;
    updateUI();
    const start = localStorage.getItem('airdrop_start');
    if(start) {
        const rem = (parseInt(start) + (90*24*60*60*1000)) - Date.now();
        document.getElementById('airdrop-timer').innerText = Math.max(0, Math.floor(rem/1000)) + "s";
    }
}, 100);

document.getElementById('character').addEventListener('click', handleTap);
window.addEventListener('load', () => { loadGame(); updateUI(); });
