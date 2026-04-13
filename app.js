// Инициализация Telegram WebApp
const tg = window.Telegram.WebApp;
tg.expand();
tg.ready();

// Состояние игры по умолчанию
const DEFAULT_STATE = {
    balance: 0,
    energy: 1000,
    maxEnergy: 1000,
    tapPower: 1,
    pps: 0,
    lastUpdate: Date.now(),
    upgrades: { tap: [], passive: [] },
    settings: { sound: true },
    seasonEnd: new Date("2026-07-13T00:00:00").getTime()
};

let gameState = { ...DEFAULT_STATE };

// Исправленная загрузка данных
function loadData() {
    const saved = localStorage.getItem('juugTapsData');
    if (saved) {
        try {
            const parsed = JSON.parse(saved);
            gameState = { ...gameState, ...parsed };
            
            // Важно: пересчитываем офлайн прогресс
            const now = Date.now();
            const offlineSeconds = Math.max(0, (now - gameState.lastUpdate) / 1000);
            
            // Начисляем пассивный доход за время отсутствия
            gameState.balance += offlineSeconds * gameState.pps;
            // Восстанавливаем энергию (3 ед. в секунду)
            gameState.energy = Math.min(gameState.maxEnergy, gameState.energy + (offlineSeconds * 3));
            gameState.lastUpdate = now;
        } catch (e) {
            console.error("Ошибка загрузки данных, сброс...", e);
            gameState = { ...DEFAULT_STATE };
        }
    }
    initShopData();
}

// Генерация улучшений с проверкой на дубликаты
function initShopData() {
    if (gameState.upgrades.tap.length === 0) {
        for(let i=1; i<=50; i++) {
            gameState.upgrades.tap.push({ level: 0, basePrice: i * 15, power: i });
        }
    }
    if (gameState.upgrades.passive.length === 0) {
        for(let i=1; i<=50; i++) {
            gameState.upgrades.passive.push({ level: 0, basePrice: i * 100, power: i * 0.5 });
        }
    }
}

// Умный расчет цены (экспонента)
function getPrice(item) {
    return Math.floor(item.basePrice * Math.pow(1.25, item.level));
}

// Рендер магазина (исправлен баг с очисткой)
let currentShopTab = 'tap';
window.switchShop = (type) => {
    currentShopTab = type;
    renderShop();
};

function renderShop() {
    const list = document.getElementById('shop-list');
    if (!list) return;
    list.innerHTML = '';
    
    const items = gameState.upgrades[currentShopTab];

    items.forEach((item, index) => {
        const price = getPrice(item);
        const card = document.createElement('div');
        card.className = 'upgrade-card';
        card.innerHTML = `
            <div style="text-align: left;">
                <b style="color: var(--accent)">Lv. ${item.level} — ${currentShopTab === 'tap' ? 'Удар' : 'Бот'} #${index + 1}</b><br>
                <small>Бонус: +${item.power.toFixed(1)}</small>
            </div>
            <button onclick="buyUpgrade('${currentShopTab}', ${index})" ${gameState.balance < price ? 'disabled style="opacity:0.5"' : ''}>
                🪙 ${price}
            </button>
        `;
        list.appendChild(card);
    });
}

// Покупка (исправлен баг с обновлением баланса)
window.buyUpgrade = (type, index) => {
    const item = gameState.upgrades[type][index];
    const price = getPrice(item);

    if (gameState.balance >= price) {
        gameState.balance -= price;
        item.level++;
        
        // Пересчитываем общие показатели
        recalculateStats();
        renderShop();
        updateUI();
        saveData();
    }
};

function recalculateStats() {
    // Сбрасываем к базе и суммируем все уровни
    gameState.tapPower = 1 + gameState.upgrades.tap.reduce((sum, item) => sum + (item.level * item.power), 0);
    gameState.pps = gameState.upgrades.passive.reduce((sum, item) => sum + (item.level * item.power), 0);
}

// Механика клика (защита от Ghost Clicks и Zoom)
const clickObj = document.getElementById('click-obj');
if (clickObj) {
    clickObj.addEventListener('pointerdown', (e) => {
        e.preventDefault(); // Защита от системных жестов
        if (gameState.energy >= 1) {
            gameState.balance += gameState.tapPower;
            gameState.energy -= 1;
            
            // Визуальный отклик
            clickObj.style.transform = 'scale(0.92)';
            setTimeout(() => clickObj.style.transform = 'scale(1)', 50);
            
            createFloatingText(e.clientX, e.clientY, `+${gameState.tapPower.toFixed(0)}`);
            updateUI();
        }
    });
}

// Основной цикл (10 раз в секунду)
setInterval(() => {
    // Пассивный доход
    if (gameState.pps > 0) {
        gameState.balance += gameState.pps / 10;
    }
    // Регенерация энергии (2 ед. в секунду)
    if (gameState.energy < gameState.maxEnergy) {
        gameState.energy = Math.min(gameState.maxEnergy, gameState.energy + 0.2);
    }
    updateUI();
}, 100);

// Отдельный цикл для сохранения и таймера (раз в секунду)
setInterval(() => {
    saveData();
    updateSeasonTimer();
}, 1000);

function updateUI() {
    const balEl = document.getElementById('balance');
    const enBar = document.getElementById('energy-bar');
    const enTxt = document.getElementById('energy-text');
    const ppsEl = document.getElementById('pps-val');

    if (balEl) balEl.innerText = Math.floor(gameState.balance).toLocaleString();
    if (enBar) enBar.style.width = `${(gameState.energy / gameState.maxEnergy) * 100}%`;
    if (enTxt) enTxt.innerText = `${Math.floor(gameState.energy)} / ${gameState.maxEnergy}`;
    if (ppsEl) ppsEl.innerText = gameState.pps.toFixed(1);
}

function saveData() {
    gameState.lastUpdate = Date.now();
    localStorage.setItem('juugTapsData', JSON.stringify(gameState));
}

// Навигация
window.showScreen = (id) => {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    const target = document.getElementById(id);
    if (target) target.classList.add('active');
    if (id === 'shop-screen') renderShop();
};

function createFloatingText(x, y, text) {
    const el = document.createElement('div');
    el.innerText = text;
    el.className = 'floating-text';
    el.style.left = `${x}px`;
    el.style.top = `${y}px`;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 800);
}

// Запуск игры
loadData();
recalculateStats();
