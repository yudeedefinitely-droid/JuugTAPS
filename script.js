const ADMIN_USERNAME = "malenkiydanik";
let state = {
    balance: 0,
    energy: 150,
    lastDaily: 0
};

const tg = window.Telegram.WebApp;
tg.expand();

function init() {
    const saved = localStorage.getItem('juug_data');
    if (saved) state = JSON.parse(saved);
    
    // ПРОВЕРКА АДМИНА
    const user = tg.initDataUnsafe?.user?.username;
    if (user === ADMIN_USERNAME) {
        document.getElementById('admin-panel').style.display = 'block';
    }

    updateUI();
    
    // Запуск цикла регена
    setInterval(() => {
        if (state.energy < 150) {
            state.energy += 1;
            updateUI();
        }
        // Авто-сохранение в облако раз в 5 сек
        saveToCloud();
    }, 5000);
}

function updateUI() {
    document.getElementById('balance').innerText = Math.floor(state.balance).toLocaleString();
    document.getElementById('energy-current').innerText = Math.floor(state.energy);
    document.getElementById('energy-fill').style.width = (state.energy / 150 * 100) + "%";
}

// ТАП
document.getElementById('character').addEventListener('touchstart', (e) => {
    e.preventDefault();
    if (state.energy >= 1) {
        state.balance += 1;
        state.energy -= 1;
        tg.HapticFeedback.impactOccurred('medium');
        updateUI();
        localStorage.setItem('juug_data', JSON.stringify(state));
    }
});

// ПЕРЕКЛЮЧЕНИЕ ЭКРАНОВ
window.showScreen = (id) => {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(id).classList.add('active');
    
    document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
    event.currentTarget.classList.add('active');

    if(id === 'leaderboard-screen') window.loadLeaders();
};

// ЕЖЕДНЕВКА (10 часов)
window.claimDailyReward = () => {
    const now = Date.now();
    const cooldown = 10 * 60 * 60 * 1000;
    if (now - state.lastDaily >= cooldown) {
        state.balance += 100;
        state.lastDaily = now;
        updateUI();
        localStorage.setItem('juug_data', JSON.stringify(state));
        alert("🎁 Received 100 PTS!");
    } else {
        alert("Wait a bit more!");
    }
};

function saveToCloud() {
    const user = tg.initDataUnsafe?.user?.username || "Guest";
    if (window.saveToCloud) window.saveToCloud(user, state.balance);
}

init();
