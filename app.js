import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, doc, setDoc, onSnapshot, query, collection, orderBy, limit, updateDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// Твой Telegram ID (узнай через @userinfobot)
const ADMIN_TG_ID = 123456789; 

// Хардкорная экономика
const clickUpgradesCost = [1000, 5000, 25000, 100000, 500000, 2000000, 10000000, 50000000, 250000000, 1000000000];
const clickPower = [1, 2, 5, 15, 50, 150, 500, 2000, 10000, 50000, 250000]; // 11 значений (база + 10 улучшений)

const passiveUpgradesCost = [2000, 10000, 50000, 200000, 1000000, 5000000, 25000000, 100000000, 500000000, 2000000000];
const passivePower = [0, 5, 20, 100, 400, 2000, 10000, 50000, 250000, 1000000, 5000000];

let userData = {
    score: 0,
    clickLevel: 0,
    passiveLevel: 0
};

// Инициализация Telegram
const tg = window.Telegram.WebApp;
tg.expand();
const user = tg.initDataUnsafe?.user || { id: "test_user", username: "Guest" };

document.getElementById('userInfo').innerText = `@${user.username}`;

// Проверка на админа
if (user.id === ADMIN_TG_ID) {
    document.getElementById('adminBtn').classList.remove('hidden');
}

// Элементы DOM
const scoreEl = document.getElementById('score');
const tapBtn = document.getElementById('tapBtn');
const passiveIncomeEl = document.getElementById('passiveIncome');

// Функция обновления UI
function updateUI() {
    scoreEl.innerText = Math.floor(userData.score).toLocaleString('ru-RU');
    passiveIncomeEl.innerText = passivePower[userData.passiveLevel].toLocaleString('ru-RU');
}

// Тап логика
tapBtn.addEventListener('click', () => {
    userData.score += clickPower[userData.clickLevel];
    updateUI();
    // В реальном проекте отправлять данные в Firebase лучше с дебаунсом (раз в 1-2 секунды), 
    // чтобы не превысить лимиты бесплатных чтений/записей.
});

// Пассивный доход
setInterval(() => {
    if (userData.passiveLevel > 0) {
        userData.score += passivePower[userData.passiveLevel];
        updateUI();
    }
}, 1000);

// TODO: Настроить Firebase конфигурацию и логику
// const firebaseConfig = { ... };
// const app = initializeApp(firebaseConfig);
// const db = getFirestore(app);

// Лидерборд в реальном времени (Пример)
/*
const q = query(collection(db, "users"), orderBy("score", "desc"), limit(5));
onSnapshot(q, (snapshot) => {
    const list = document.getElementById('leaderboardList');
    list.innerHTML = '';
    snapshot.forEach((doc) => {
        const data = doc.data();
        list.innerHTML += `<li>@${data.username} - ${Math.floor(data.score)} | Клик: ${data.clickLevel} | Пассив: ${data.passiveLevel}</li>`;
    });
});
*/
