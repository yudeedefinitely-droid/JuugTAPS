const ADMIN_USERNAME = "malenkiydanik";
let gameState = { balance: 0, energy: 150, lastDaily: 0 };

const tg = window.Telegram.WebApp;
tg.expand();

function init() {
    const saved = localStorage.getItem('juug_save');
    if (saved) gameState = JSON.parse(saved);
    
    // Проверка админа
    if (tg.initDataUnsafe?.user?.username === ADMIN_USERNAME) {
        document.getElementById('admin-panel').style.display = 'block';
    }
    updateUI();
    startEnergyRegen();
}

function updateUI() {
    document.getElementById('balance').innerText = Math.floor(gameState.balance).toLocaleString();
    document.getElementById('energy-current').innerText = Math.floor(gameState.energy);
    document.getElementById('energy-fill').style.width = (gameState.energy / 150 * 100) + "%";
}

// КЛИК
document.getElementById('character').addEventListener('touchstart', (e) => {
    e.preventDefault();
    if (gameState.energy >= 1) {
        gameState.balance += 1;
        gameState.energy -= 1;
        updateUI();
        save();
    }
});

// ЕЖЕДНЕВНАЯ НАГРАДА (10 часов)
function claimDailyReward() {
    const now = Date.now();
    const cooldown = 10 * 60 * 60 * 1000; // 10 часов в мс

    if (now - gameState.lastDaily >= cooldown) {
        gameState.balance += 100;
        gameState.lastDaily = now;
        save();
        updateUI();
        alert("Success! +100 PTS");
    } else {
        const remaining = cooldown - (now - gameState.lastDaily);
        const hours = Math.floor(remaining / 3600000);
        const mins = Math.floor((remaining % 3600000) / 60000);
        alert(`Next reward in ${hours}h ${mins}m`);
    }
}

function showScreen(id) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(id).classList.add('active');
    document.querySelectorAll('.bottom-nav button').forEach(b => b.classList.remove('active-nav'));
    event.currentTarget.classList.add('active-nav');
}

function save() { localStorage.setItem('juug_save', JSON.stringify(gameState)); }

function startEnergyRegen() {
    setInterval(() => {
        if (gameState.energy < 150) {
            gameState.energy++;
            updateUI();
        }
    }, 3000);
}

init();
