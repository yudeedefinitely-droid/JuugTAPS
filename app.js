const tg = window.Telegram.WebApp;
tg.expand();

let state = {
    score: 0,
    energy: 150,
    maxEnergy: 150,
    tapPower: 1,
};

// Функция переключения экранов
window.showScreen = (screenId) => {
    // Скрываем все экраны
    document.querySelectorAll('.screen').forEach(s => s.classList.add('hidden'));
    // Показываем нужный
    document.getElementById(screenId).classList.remove('hidden');
    
    // Сбрасываем активные кнопки навигации
    document.querySelectorAll('.nav-item').forEach(btn => btn.classList.remove('active'));
    
    // Находим нажатую кнопку и подсвечиваем её
    event.currentTarget.classList.add('active');
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

function updateUI() {
    document.getElementById('score').innerText = Math.floor(state.score).toLocaleString();
    document.getElementById('energy-text').innerText = `${state.energy} / ${state.maxEnergy}`;
    document.getElementById('energy-fill').style.width = `${(state.energy / state.maxEnergy) * 100}%`;
}

// Восполнение энергии
setInterval(() => {
    if (state.energy < state.maxEnergy) {
        state.energy++;
        updateUI();
    }
}, 1000);

// Инициализация юзера
if (tg.initDataUnsafe?.user) {
    document.getElementById('username').innerText = `@${tg.initDataUnsafe.user.username}`;
}

updateUI();
