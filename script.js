// --- НАСТРОЙКИ АДМИНА (ЗАМЕНИ НА СВОЙ НИК, БЕЗ СОБАЧКИ) ---
const ADMIN_USERNAME = "ТВОЙ_НИК_БЕЗ_СОБАЧКИ";

// Переменные состояния
let gameState = {
    balance: 0,
    energy: 150, // Хардкорно мало
    maxEnergy: 150,
    tapPower: 1,
    passiveIncome: 0,
    lastUpdate: Date.now(),
    upgrades: {
        tap: Array(10).fill(0), // Хардкорно мало уровней
        passive: Array(10).fill(0)
    }
};

const tg = window.Telegram.WebApp;
tg.expand();

// Настройка магазина
const shopData = {
    tap: Array.from({length: 10}, (_, i) => ({
        id: i,
        name: `Crystal Spike T${i+1}`,
        cost: 100 * Math.pow(4, i),
        effect: Math.pow(2, i+1)
    })),
    passive: Array.from({length: 10}, (_, i) => ({
        id: i,
        name: `Frozen Mine T${i+1}`,
        cost: 500 * Math.pow(5, i),
        effect: Math.pow(3, i+1)
    }))
};

// Функция клика по персонажу
function handleTap(e) {
    if (gameState.energy >= 1) {
        gameState.balance += gameState.tapPower;
        gameState.energy -= 1;
        updateUI();
        // В Telegram API нет прямой поддержки вибрации при клике,
        // но можно вызвать tg.HapticFeedback если устройство поддерживает
        tg.HapticFeedback?.impactOccurred('light');
    } else {
        tg.HapticFeedback?.notificationOccurred('warning');
    }
}

// Логика покупки улучшений
function buyUpgrade(type, id) {
    let currentLevel = gameState.upgrades[type][id];
    let itemData = shopData[type][id];
    
    // Цена растет хардкорно в 2.5 раза
    let currentCost = Math.floor(itemData.cost * Math.pow(2.5, currentLevel));

    if (gameState.balance >= currentCost && currentLevel < 100) {
        gameState.balance -= currentCost;
        gameState.upgrades[type][id]++;
        
        if (type === 'tap') gameState.tapPower += itemData.effect;
        else gameState.passiveIncome += itemData.effect;
        
        tg.HapticFeedback?.notificationOccurred('success');
        renderShopItems(type);
        updateUI();
        saveGame();
    } else {
        tg.HapticFeedback?.notificationOccurred('error');
    }
}

// === ОБНОВЛЕНИЕ ИНТЕРФЕЙСА (UI) ===
function updateUI() {
    document.getElementById('balance').innerText = Math.floor(gameState.balance).toLocaleString();
    document.getElementById('energy-current').innerText = Math.floor(gameState.energy);
    document.getElementById('energy-fill').style.width = (gameState.energy / gameState.maxEnergy * 100) + "%";
}

// Отрисовка элементов магазина
function renderShopItems(type) {
    const list = document.getElementById('shop-list');
    list.innerHTML = shopData[type].map(item => {
        let lvl = gameState.upgrades[type][item.id];
        let cost = Math.floor(item.cost * Math.pow(2.5, lvl));
        
        return `<div class="shop-item cry-frame-h">
            <div>
                <b>${item.name}</b><br>
                <small>Lvl ${lvl} (+${item.effect}/клик)</small>
            </div>
            <button class="menu-btn" onclick="buyUpgrade('${type}', ${item.id})">${cost.toLocaleString()}</button>
        </div>`;
    }).join('');
}

// === НАВИГАЦИЯ И ВКЛАДКИ (UI Logic) ===
window.showScreen = function(screenId) {
    // Скрыть все экраны
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    // Убрать активный класс с кнопок навигации
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('nav-active'));

    // Показать выбранный экран
    document.getElementById(screenId).classList.add('active');

    // Найти кнопку навигации и подсветить
    const activeNavBtn = Array.from(document.querySelectorAll('.nav-btn'))
        .find(b => b.getAttribute('onclick').includes(screenId));
    if(activeNavBtn) activeNavBtn.classList.add('nav-active');

    if(screenId === 'shop-screen') renderShopItems('tap');
};

window.switchShopTab = function(type) {
    document.querySelectorAll('.shop-tab').forEach(b => b.classList.remove('active-tab'));
    event.currentTarget.classList.add('active-tab');
    renderShopItems(type);
};

// === ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ===
// Админ-панель
function startGlobalTimer() {
    localStorage.setItem('airdrop_start', Date.now());
    alert("3-month Airdrop Timer started!");
}

// Музыка
function toggleMusic() {
    const music = document.getElementById('bg-music');
    if (music.paused) {
        music.play();
        tg.HapticFeedback?.impactOccurred('medium');
    } else {
        music.pause();
    }
}

// === СОХРАНЕНИЕ И ЗАГРУЗКА (Firebase + Local) ===
function saveGame() {
    localStorage.setItem('juug_v3_state', JSON.stringify(gameState));
    // Отправляем очки в Firebase
    if(window.sendScoreToCloud) {
        window.sendScoreToCloud(gameState.balance);
    }
}

function loadGame() {
    const saved = localStorage.getItem('juug_v3_state');
    if (saved) {
        gameState = JSON.parse(saved);
        // Оффлайн доход
        let diff = Math.floor((Date.now() - gameState.lastUpdate) / 1000);
        gameState.balance += diff * gameState.passiveIncome;
        // Энергия (0.1 ед/сек)
        gameState.energy = Math.min(150, gameState.energy + (diff * 0.1));
    }
    // Проверка админа
    const currentUser = tg.initDataUnsafe?.user?.username;
    if (currentUser === ADMIN_USERNAME) {
        document.getElementById('admin-panel').style.display = 'block';
    }
}

// === ГЛАВНЫЙ ИГРОВОЙ ЦИКЛ ===
setInterval(() => {
    // Пассивный доход
    gameState.balance += (gameState.passiveIncome / 10);
    // Восстановление энергии
    if (gameState.energy < 150) gameState.energy += 0.01;
    
    gameState.lastUpdate = Date.now();
    updateUI();
    
    // Таймер
    const start = localStorage.getItem('airdrop_start');
    if(start) {
        const rem = (parseInt(start) + (90*24*60*60*1000)) - Date.now();
        document.getElementById('airdrop-timer').innerText = Math.max(0, Math.floor(rem/1000)) + "s";
    }
}, 100);

// Инициализация
document.getElementById('character').addEventListener('click', handleTap);
window.addEventListener('load', () => {
    loadGame();
    updateUI();
});
