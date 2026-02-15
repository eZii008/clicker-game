// Состояние игры
let gameState = {
    images: [],
    currentImageIndex: 0,
    clickCount: 0,
    maxClicks: 140,
    isGameActive: false,
    adminTapCount: 0
};

const ADMIN_PASSWORD = "admin123";

// DOM элементы
const gameScreen = document.getElementById('game-screen');
const adminScreen = document.getElementById('admin-screen');
const startMenu = document.getElementById('start-menu');
const fallingImage = document.getElementById('falling-image');
const completionMessage = document.getElementById('completion-message');
const completionText = document.getElementById('completion-text');
const nextButton = document.getElementById('next-button');
const imageItems = document.getElementById('image-items');
const imageUpload = document.getElementById('image-upload');
const selectImageBtn = document.getElementById('select-image-btn');
const exitAdminBtn = document.getElementById('exit-admin-btn');

// Кнопка меню в игре
let menuButton = null;
let adminTapTimer = null;

// Загрузка из localStorage
function loadFromStorage() {
    const saved = localStorage.getItem('clickerImages');
    if (saved) {
        try {
            gameState.images = JSON.parse(saved);
        } catch (e) {
            gameState.images = [];
        }
    }
    updateImagesList();
}

// Сохранение
function saveToStorage() {
    localStorage.setItem('clickerImages', JSON.stringify(gameState.images));
}

// Обновление списка картинок
function updateImagesList() {
    imageItems.innerHTML = '';
    gameState.images.forEach((imageData, index) => {
        const li = document.createElement('li');
        
        const img = document.createElement('img');
        img.src = imageData;
        img.className = 'image-preview';
        
        const infoDiv = document.createElement('div');
        infoDiv.className = 'image-info';
        
        const nameSpan = document.createElement('span');
        nameSpan.className = 'image-name';
        nameSpan.textContent = `Картинка ${index + 1}`;
        
        infoDiv.appendChild(img);
        infoDiv.appendChild(nameSpan);
        
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'delete-image';
        deleteBtn.textContent = '✖ Удалить';
        deleteBtn.dataset.index = index;
        
        li.appendChild(infoDiv);
        li.appendChild(deleteBtn);
        imageItems.appendChild(li);
    });

    document.querySelectorAll('.delete-image').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const index = parseInt(btn.dataset.index);
            gameState.images.splice(index, 1);
            saveToStorage();
            updateImagesList();
        });
    });
}

// СКРЫТАЯ АДМИНКА - 5 кликов в левый верхний угол
startMenu.addEventListener('click', (e) => {
    const rect = startMenu.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    if (x >= 0 && x <= 80 && y >= 0 && y <= 80) {
        gameState.adminTapCount++;
        
        if (adminTapTimer) clearTimeout(adminTapTimer);
        adminTapTimer = setTimeout(() => {
            gameState.adminTapCount = 0;
        }, 2000);
        
        if (gameState.adminTapCount >= 5) {
            gameState.adminTapCount = 0;
            if (adminTapTimer) {
                clearTimeout(adminTapTimer);
                adminTapTimer = null;
            }
            openAdmin();
        }
    }
});

// Открыть админку
function openAdmin() {
    startMenu.style.display = 'none';
    gameScreen.style.display = 'none';
    adminScreen.style.display = 'block';
    document.getElementById('admin-login').style.display = 'block';
    document.getElementById('admin-panel').style.display = 'none';
    document.getElementById('password-input').value = '';
}

// Логин
document.getElementById('login-btn').addEventListener('click', () => {
    const pwd = document.getElementById('password-input').value;
    if (pwd === ADMIN_PASSWORD) {
        document.getElementById('admin-login').style.display = 'none';
        document.getElementById('admin-panel').style.display = 'block';
    } else {
        alert('Неверный пароль!');
    }
});

// Выбор фото
selectImageBtn.addEventListener('click', () => {
    imageUpload.click();
});

imageUpload.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        if (!file.type.startsWith('image/')) {
            alert('Выберите картинку!');
            return;
        }

        const reader = new FileReader();
        reader.onload = (event) => {
            gameState.images.push(event.target.result);
            saveToStorage();
            updateImagesList();
            imageUpload.value = '';
        };
        reader.readAsDataURL(file);
    }
});

// Выход из админки
exitAdminBtn.addEventListener('click', () => {
    adminScreen.style.display = 'none';
    startMenu.style.display = 'flex';
    gameScreen.style.display = 'block';
});

// Возврат в меню
function returnToMenu() {
    gameState.isGameActive = false;
    startMenu.style.display = 'flex';
    gameScreen.style.display = 'block';
    fallingImage.style.display = 'none';
    if (menuButton) {
        menuButton.style.display = 'none';
    }
}

// Кнопка меню в игре
function createMenuButton() {
    if (!menuButton) {
        menuButton = document.createElement('button');
        menuButton.id = 'in-game-menu-btn';
        menuButton.className = 'menu-btn';
        menuButton.textContent = '☰ Меню';
        menuButton.addEventListener('click', returnToMenu);
        gameScreen.appendChild(menuButton);
    }
    menuButton.style.display = 'block';
}

// Старт игры
document.getElementById('start-game-btn').addEventListener('click', startGame);

function startGame() {
    if (gameState.images.length === 0) {
        alert('Как открыть админку:\nКликни 5 раз в левый верхний угол');
        return;
    }

    if (gameState.images.length > 1) {
        gameState.currentImageIndex = Math.floor(Math.random() * gameState.images.length);
    } else {
        gameState.currentImageIndex = 0;
    }

    fallingImage.src = gameState.images[gameState.currentImageIndex];
    fallingImage.style.display = 'block';
    
    // ВАЖНО: Низ картинки немного торчит с самого начала (30 пикселей)
    // То есть картинка почти полностью скрыта, но нижний край видно
    fallingImage.style.top = 'calc(-100% + 30px)';
    
    gameState.clickCount = 0;
    gameState.isGameActive = true;
    completionMessage.style.display = 'none';
    
    createMenuButton();
    
    startMenu.style.display = 'none';
    adminScreen.style.display = 'none';
    gameScreen.style.display = 'block';
}

// КЛИК - движение с ПЕРВОГО раза
document.getElementById('click-area').addEventListener('click', function(e) {
    if (!gameState.isGameActive) return;
    
    gameState.clickCount++;
    
    const gameHeight = gameScreen.clientHeight;
    const imageHeight = fallingImage.clientHeight;
    
    // Начальная позиция: низ картинки торчит на 30px
    const startPos = -imageHeight + 30;
    // Конечная позиция: картинка полностью внизу
    const endPos = gameHeight - imageHeight;
    
    // Процент завершения
    const percent = gameState.clickCount / gameState.maxClicks;
    
    // Новая позиция
    const newTop = startPos + ((endPos - startPos) * percent);
    
    // Двигаем картинку
    fallingImage.style.top = newTop + 'px';
    
    // Для отладки - можно посмотреть в консоль
    console.log('Клик:', gameState.clickCount, 'Позиция:', newTop);
    
    if (gameState.clickCount >= gameState.maxClicks) {
        gameState.isGameActive = false;
        showCompletionMessage();
    }
});

function showCompletionMessage() {
    completionMessage.style.display = 'flex';
    
    if (gameState.images.length === 1) {
        completionText.textContent = 'Картинка готова!';
        nextButton.textContent = 'Ещё';
        nextButton.onclick = () => {
            completionMessage.style.display = 'none';
            startGame();
        };
    } else {
        completionText.textContent = 'Круто! Дальше?';
        nextButton.textContent = 'Дальше';
        nextButton.onclick = () => {
            completionMessage.style.display = 'none';
            let newIndex;
            do {
                newIndex = Math.floor(Math.random() * gameState.images.length);
            } while (newIndex === gameState.currentImageIndex && gameState.images.length > 1);
            gameState.currentImageIndex = newIndex;
            startGame();
        };
    }
}

// Запуск
loadFromStorage();
startMenu.style.display = 'flex';
gameScreen.style.display = 'block';
fallingImage.style.display = 'none';
