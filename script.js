const gameContainer = document.getElementById('game-container');
const rabbit = document.getElementById('rabbit');
const scoreElement = document.getElementById('score');
const victoryMessage = document.getElementById('victory-message');
const restartButton = document.getElementById('restart-button');

let score = 0; // Total chocolates eaten
let rabbitX = 0;
let rabbitScale = 1;

// Poop Logic
let isPoopMode = false;
let recoveryCount = 0; // Needs 3 chocolates to recover
let isGameOver = false;

const CHOCOLATE_TARGET = 30;

// Rabbit Movement
document.addEventListener('mousemove', (e) => {
    if (isGameOver) return;
    rabbitX = getPointerX(e.clientX, e.clientY);
    updateRabbitPosition();
});

document.addEventListener('touchmove', (e) => {
    if (isGameOver) return;
    rabbitX = getPointerX(e.touches[0].clientX, e.touches[0].clientY);
    updateRabbitPosition();
});

function getViewport() {
    const isPortrait = window.matchMedia('(orientation: portrait)').matches;
    if (isPortrait) {
        return { width: window.innerHeight, height: window.innerWidth };
    }
    return { width: window.innerWidth, height: window.innerHeight };
}

function getPointerX(clientX, clientY) {
    const viewport = getViewport();
    const isPortrait = window.matchMedia('(orientation: portrait)').matches;
    if (isPortrait) {
        return clientY;
    }
    return clientX;
}

function updateRabbitPosition() {
    const viewport = getViewport();
    // Clamp
    if (rabbitX < 30 * rabbitScale) rabbitX = 30 * rabbitScale;
    if (rabbitX > viewport.width - 30 * rabbitScale) rabbitX = viewport.width - 30 * rabbitScale;
    
    // Apply position and scale
    rabbit.style.left = `${rabbitX}px`;
    rabbit.style.transform = `translateX(-50%) scale(${rabbitScale})`;
}

// Spawning
function spawnItem() {
    if (isGameOver) return;

    const item = document.createElement('div');
    item.classList.add('falling-item');
    
    const isPoop = Math.random() < 0.3; // 30% chance of poop
    item.dataset.type = isPoop ? 'poop' : 'chocolate';

    // Random parachute color
    const colors = ['#FF69B4', '#FFA500', '#9370DB', '#00BFFF', '#FF4500', '#32CD32'];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];
    
    let content = `<div class="parachute" style="background-color: ${randomColor}"></div>`;
    if (isPoop) {
        content += `<div class="poop-item"></div>`;
    } else {
        content += `<div class="chocolate"></div>`;
    }
    item.innerHTML = content;
    
    // Random input position
    const viewport = getViewport();
    const startX = Math.random() * (viewport.width - 50);
    const safeX = Math.max(20, Math.min(startX, viewport.width - 60));
    
    item.style.left = `${safeX}px`;
    item.style.top = '-60px';
    
    gameContainer.appendChild(item);
    
    let posY = -60;
    const speed = 3 + Math.random() * 3; // Random speed
    
    function fall() {
        if (!item.parentElement || isGameOver) {
             if (isGameOver && item.parentElement) item.remove(); // Clear items on game over
             return;
        }

        posY += speed;
        item.style.top = `${posY}px`;
        
        // Collision Detection
        if (checkCollision(rabbit, item)) {
            handleCollision(item);
            return;
        }
        
        // Missed
        if (posY > viewport.height - 80) { 
            item.remove();
            return;
        }
        
        requestAnimationFrame(fall);
    }
    
    requestAnimationFrame(fall);
}

function checkCollision(player, enemy) {
    const rRect = player.getBoundingClientRect();
    const eRect = enemy.getBoundingClientRect();
    
    // Hitbox adjust
    return !(
        eRect.bottom < rRect.top + 20 || 
        eRect.top > rRect.bottom ||
        eRect.right < rRect.left + 10 ||
        eRect.left > rRect.right - 10
    );
}

function handleCollision(item) {
    const type = item.dataset.type;
    item.remove();

    if (type === 'poop') {
        becomePoop();
    } else {
        eatChocolate();
    }
}

function becomePoop() {
    if (!isPoopMode) {
        isPoopMode = true;
        rabbit.classList.add('poop-mode');
        recoveryCount = 0;
        // Visual reset ok?
    }
}

function eatChocolate() {
    if (isPoopMode) {
        recoveryCount++;
        if (recoveryCount >= 3) {
            isPoopMode = false;
            rabbit.classList.remove('poop-mode');
            recoveryCount = 0;
        }
    } else {
        // Normal Mode
        score++;
        scoreElement.innerText = score;
        
        // Growth logic
        if (rabbitScale < 3) { // Slow growth to keep playability on mobile
            rabbitScale += 0.05;
            updateRabbitPosition();
        }

        if (score >= CHOCOLATE_TARGET) {
            triggerWin();
        }
    }
}

function triggerWin() {
    isGameOver = true;
    victoryMessage.style.display = 'block';
    
    // Make rabbit HUGE
    rabbitScale = 6;
    updateRabbitPosition();
    rabbit.style.zIndex = 1000; // Visible above everything
    
    // Confetti or something? For now just big rabbit
}

function restartGame() {
    score = 0;
    scoreElement.innerText = score;
    isPoopMode = false;
    recoveryCount = 0;
    isGameOver = false;
    rabbitScale = 1;
    rabbit.classList.remove('poop-mode');
    victoryMessage.style.display = 'none';
    rabbit.style.zIndex = 10;

    document.querySelectorAll('.falling-item').forEach((item) => item.remove());

    rabbitX = getViewport().width / 2;
    updateRabbitPosition();
}

restartButton.addEventListener('click', restartGame);

// Game Loop
setInterval(spawnItem, 800); 

rabbitX = getViewport().width / 2;
updateRabbitPosition();

window.addEventListener('resize', updateRabbitPosition);
