const ADMIN_USERNAME = "malenkiydanik";
let state = {
    balance: 0,
    energy: 150,
    lastDaily: 0,
    lastSave: Date.now()
};

const tg = window.Telegram.WebApp;
tg.expand();

function init() {
    const saved = localStorage.getItem('juug_pro_data');
    if (saved) state = JSON.parse(saved);
    
    // Принудительная проверка админа
    if (tg.initDataUnsafe?.user?.username === ADMIN_USERNAME) {
        document.getElementById('admin-panel').style.display = 'block';
    }
    
    updateUI();
    loop();
}

function updateUI() {
    document.getElementById('balance').innerText = Math.floor(state.balance).toLocaleString();
    document.getElementById('energy-current').innerText = Math.floor(state.energy);
    document.getElementById('energy-fill').style.width = (state.energy / 150 * 100) + "%";
}

// ТАП (Touchstart для скорости)
document.getElementById('character').addEventListener('touchstart', (e) => {
    e.preventDefault();
    if (state.energy >= 1) {
        state.balance += 1;
        state.energy -= 1;
        tg.HapticFeedback.impactOccurred('light');
        updateUI();
    }
});

// ЕЖЕДНЕВНАЯ НАГРАДА (раз в 10 часов)
window.claimDailyReward = () => {
    const now = Date.now();
    const cooldown = 10 * 60 * 60 * 1000; 

    if (now - state.lastDaily >= cooldown) {
        state.balance += 100;
        state.lastDaily = now;
        tg.showAlert("🎁 +100 PTS ADDED!");
        updateUI();
        save();
    } else {
        const diff = cooldown - (now - state.lastDaily);
        const h = Math.floor(diff / 3600000);
        const m = Math.floor((diff % 3600000) / 60000);
        tg.showAlert(`Wait ${h}h ${m}m more.`);
    }
};

function showScreen(id) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(id).classList.add('active');
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    event.currentTarget.classList.add('active');
}

// Цикл: автосохранение, энергия и обновление лидеров
function loop() {
    setInterval(() => {
        // Реген энергии
        if (state.energy < 150) state.energy += 0.5;
        
        // Автообновление лидеров, если экран открыт
        if (document.getElementById('leaderboard-screen').classList.contains('active')) {
            if (window.refreshLeaders) window.refreshLeaders();
        }
        
        updateUI();
        save();
    }, 1000);
}

function save() {
    localStorage.setItem('juug_pro_data', JSON.stringify(state));
    // Тут можно добавить вызов Firebase set(), если нужно сохранять в облако чаще
}

init();
