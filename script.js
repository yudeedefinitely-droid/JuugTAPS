const ADMIN_USERNAME = "malenkiydanik"; // Убедись, что это твой ник без @

let gameState = {
    balance: 0,
    energy: 150,
    maxEnergy: 150,
    tapPower: 1,
    passiveIncome: 0,
    lastDailyReward: 0,
    lastUpdate: Date.now()
};

const tg = window.Telegram.WebApp;
tg.expand();

// Инициализация данных
function init() {
    loadGame();
    checkAdmin();
    updateUI();
}

// ПРОВЕРКА АДМИНА
function checkAdmin() {
    const user = tg.initDataUnsafe?.user?.username;
    // Если запускаешь в браузере для теста - временно убери "user === ADMIN_USERNAME"
    if (user === ADMIN_USERNAME) {
        document.getElementById('admin-panel').style.display = 'block';
    }
}

// ТАП
function handleTap(e) {
    if (gameState.energy >= 1) {
        gameState.balance += gameState.tapPower;
        gameState.energy -= 1;
        createParticle(e);
        updateUI();
        tg.HapticFeedback.impactOccurred('medium');
    }
}

// ЕЖЕДНЕВНАЯ НАГРАДА (Исправлено)
function claimDailyReward() {
    const now = Date.now();
    const day = 24 * 60 * 60 * 1000;
    
    if (now - gameState.lastDailyReward >= day) {
        gameState.balance += 10000;
        gameState.lastDailyReward = now;
        tg.showAlert("🎁 Reward: +10,000 JUUG!");
        saveGame();
        updateUI();
    } else {
        const remaining = Math.ceil((day - (now - gameState.lastDailyReward)) / 3600000);
        tg.showAlert(`Come back in ${remaining} hours!`);
    }
}

// АДМИНКА
function addAdminBalance() {
    gameState.balance += 1000000;
    updateUI();
    saveGame();
}

function startGlobalTimer() {
    localStorage.setItem('airdrop_start', Date.now());
    tg.showAlert("✅ 3-Month Timer Activated!");
}

// СИСТЕМНЫЕ
function updateUI() {
    document.getElementById('balance').innerText = Math.floor(gameState.balance).toLocaleString();
    document.getElementById('energy-current').innerText = Math.floor(gameState.energy);
    document.getElementById('energy-fill').style.width = (gameState.energy / gameState.maxEnergy * 100) + "%";
}

function saveGame() {
    localStorage.setItem('juug_save', JSON.stringify(gameState));
}

function loadGame() {
    const saved = localStorage.getItem('juug_save');
    if (saved) gameState = JSON.parse(saved);
}

function showScreen(id) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(id).classList.add('active');
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active-nav'));
}

// Частицы при клике
function createParticle(e) {
    const p = document.createElement('div');
    p.innerText = "+" + gameState.tapPower;
    p.style.position = 'absolute';
    p.style.left = (e.clientX || e.touches[0].clientX) + 'px';
    p.style.top = (e.clientY || e.touches[0].clientY) + 'px';
    p.style.color = 'var(--accent)';
    p.style.fontWeight = 'bold';
    p.style.pointerEvents = 'none';
    p.animate([{transform: 'translateY(0)', opacity: 1}, {transform: 'translateY(-50px)', opacity: 0}], 600);
    document.body.appendChild(p);
    setTimeout(() => p.remove(), 600);
}

// Слушатели
document.getElementById('character').addEventListener('touchstart', (e) => {
    e.preventDefault();
    handleTap(e);
});

// Запуск
init();

// Регенерация энергии
setInterval(() => {
    if (gameState.energy < gameState.maxEnergy) {
        gameState.energy += 0.5;
        updateUI();
    }
}, 2000);
