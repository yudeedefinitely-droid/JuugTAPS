const tg = window.Telegram.WebApp;
tg.expand();

// Настройки экономики
const ADMIN_ID = 5291965471; // Замени на свой ID
let state = {
    score: 0,
    energy: 150,
    maxEnergy: 150,
    tapPower: 1,
    passiveIncome: 0,
    music: true
};

// Функция переключения экранов
window.changeScreen = (screenId) => {
    // Скрываем все экраны
    document.querySelectorAll('.screen').forEach(s => s.classList.add('hidden'));
    // Показываем нужный
    document.getElementById(screenId).classList.remove('hidden');
    
    // Обновляем активную кнопку в меню
    document.querySelectorAll('.bottom-nav button').forEach(btn => btn.classList.remove('active'));
    event.currentTarget.classList.add('active');

    if (screenId === 'shop-screen') renderShop();
};

// Логика тапа
const tapBtn = document.getElementById('tapBtn');
tapBtn.addEventListener('click', () => {
    if (state.energy >= 1) {
        state.score += state.tapPower;
        state.energy -= 1;
        updateUI();
        tg.HapticFeedback.impactOccurred('medium');
    }
});

// Обновление UI
function updateUI() {
    document.getElementById('score').innerText = Math.floor(state.score).toLocaleString();
    document.getElementById('energy-text').innerText = `${state.energy} / ${state.maxEnergy}`;
    document.getElementById('energy-fill').style.width = `${(state.energy / state.maxEnergy) * 100}%`;
}

// Регенерация и пассивный доход
setInterval(() => {
    if (state.energy < state.maxEnergy) state.energy++;
    state.score += state.passiveIncome;
    updateUI();
}, 1000);

// Магазин (пример)
function renderShop() {
    const shop = document.getElementById('shop-items');
    shop.innerHTML = `
        <button class="menu-btn" onclick="buyUpgrade('tap')">UPGRADE CLICK (Cost: 1000)</button>
        <button class="menu-btn" onclick="buyUpgrade('passive')">UPGRADE PASSIVE (Cost: 5000)</button>
    `;
}

window.buyUpgrade = (type) => {
    if (type === 'tap' && state.score >= 1000) {
        state.score -= 1000;
        state.tapPower += 2;
        tg.showAlert("Click Upgraded!");
    } else if (type === 'passive' && state.score >= 5000) {
        state.score -= 5000;
        state.passiveIncome += 5;
        tg.showAlert("Passive Income Upgraded!");
    } else {
        tg.showAlert("Not enough score!");
    }
    updateUI();
    renderShop();
};

// Инициализация юзера
const user = tg.initDataUnsafe?.user;
if (user) {
    document.getElementById('username').innerText = `@${user.username}`;
    if (user.id === ADMIN_ID) document.getElementById('admin-section').classList.remove('hidden');
}

updateUI();
