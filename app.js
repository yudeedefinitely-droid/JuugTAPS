// Инициализация Telegram WebApp
const tg = window.Telegram.WebApp;
tg.expand();

// Состояние игры
let gameState = {
    balance: 0,
    energy: 1000,
    maxEnergy: 1000,
    tapPower: 1,
    pps: 0, // Passive Per Second
    lastUpdate: Date.now(),
    upgrades: { tap: [], passive: [] },
    settings: { sound: true },
    seasonEnd: new Date("2026-07-13T00:00:00").getTime() // Пример даты на 3 месяца
};

// Загрузка данных
function loadData() {
    const saved = localStorage.getItem('juugTapsData');
    if (saved) {
        const data = JSON.parse(saved);
        const offlineTime = (Date.now() - data.lastUpdate) / 1000;
        
        gameState = {...gameState, ...data};
        
        // Начисление офлайн дохода
        gameState.balance += offlineTime * data.pps;
        gameState.energy = Math.min(data.maxEnergy, data.energy + (offlineTime * 1.5)); // Восст. 1.5 ед/сек
    }
    initShopData();
    updateUI();
}

// Генерация 100 улучшений (50 тап, 50 пассив)
function initShopData() {
    if (gameState.upgrades.tap.length === 0) {
        for(let i=1; i<=50; i++) {
            gameState.upgrades.tap.push({ id: i, level: 0, basePrice: i * 50, power: i * 2 });
            gameState.upgrades.passive.push({ id: i, level: 0, basePrice: i * 150, power: i * 5 });
        }
    }
}

// Рендер магазина
function renderShop(type) {
    const list = document.getElementById('shop-list');
    list.innerHTML = '';
    const items = type === 'tap' ? gameState.upgrades.tap : gameState.upgrades.passive;

    items.forEach((item, index) => {
        const price = Math.floor(item.basePrice * Math.pow(1.5, item.level));
        const card = document.createElement('div');
        card.className = 'upgrade-card';
        card.innerHTML = `
            <div>
                <b>${type === 'tap' ? 'Power Up' : 'Juug Bot'} #${item.id}</b><br>
                <small>LVL ${item.level} (+${item.power}${type === 'tap' ? '' : '/s'})</small>
            </div>
            <button onclick="buyUpgrade('${type}', ${index})">${Math.round(price)}</button>
        `;
        list.appendChild(card);
    });
}

// Покупка
window.buyUpgrade = (type, index) => {
    const item = gameState.upgrades[type][index];
    const price = Math.floor(item.basePrice * Math.pow(1.5, item.level));

    if (gameState.balance >= price) {
        gameState.balance -= price;
        item.level++;
        if (type === 'tap') gameState.tapPower += item.power;
        else gameState.pps += item.power;
        
        if (gameState.settings.sound) playSound('buy');
        renderShop(type);
        updateUI();
    }
};

// Механика клика
document.getElementById('click-obj').addEventListener('touchstart', (e) => {
    if (gameState.energy >= 1) {
        gameState.balance += gameState.tapPower;
        gameState.energy -= 1;
        updateUI();
        createFloatingText(e.touches[0].clientX, e.touches[0].clientY, `+${gameState.tapPower}`);
    }
});

// Таймер сезона
function updateSeasonTimer() {
    const now = Date.now();
    const diff = gameState.seasonEnd - now;

    if (diff <= 0) {
        document.getElementById('season-timer').innerText = "SEASON ENDED";
        showWinner();
        return;
    }

    if (diff > 86400000) { // Больше 24 часов
        const months = Math.floor(diff / (1000 * 60 * 60 * 24 * 30));
        const days = Math.floor((diff % (1000 * 60 * 60 * 24 * 30)) / (1000 * 60 * 60 * 24));
        document.getElementById('season-timer').innerText = `${months}m ${days}d`;
    } else {
        const seconds = Math.floor(diff / 1000);
        document.getElementById('season-timer').innerText = `${seconds}s`;
    }
}

// Основной цикл
setInterval(() => {
    // Пассивный доход
    gameState.balance += gameState.pps / 10;
    // Регенерация энергии
    if (gameState.energy < gameState.maxEnergy) {
        gameState.energy = Math.min(gameState.maxEnergy, gameState.energy + 0.2);
    }
    updateUI();
    updateSeasonTimer();
    saveData();
}, 100);

function updateUI() {
    document.getElementById('balance').innerText = Math.floor(gameState.balance);
    document.getElementById('energy-bar').style.width = `${(gameState.energy / gameState.maxEnergy) * 100}%`;
    document.getElementById('energy-text').innerText = `${Math.floor(gameState.energy)} / ${gameState.maxEnergy}`;
    document.getElementById('pps-val').innerText = gameState.pps;
}

function saveData() {
    gameState.lastUpdate = Date.now();
    localStorage.setItem('juugTapsData', JSON.stringify(gameState));
}

// Навигация
window.showScreen = (id) => {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(id).classList.add('active');
    if (id === 'shop-screen') renderShop('tap');
};

function createFloatingText(x, y, text) {
    const el = document.createElement('div');
    el.innerText = text;
    el.style.position = 'fixed';
    el.style.left = `${x}px`;
    el.style.top = `${y}px`;
    el.style.color = 'var(--accent)';
    el.style.fontWeight = 'bold';
    el.style.pointerEvents = 'none';
    el.style.animation = 'floatUp 0.5s ease-out forwards';
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 500);
}

// Запуск
loadData();
