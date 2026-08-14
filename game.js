const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Game constants
const GAME_WIDTH = 800;
const GAME_HEIGHT = 600;
const PLAYER_SIZE = 20;
const PLAYER_SPEED = 4;

// Game states
const STATES = {
    DIALOGUE: 'dialogue',
    BATTLE: 'battle',
    GAME_OVER: 'gameOver',
    WIN: 'win'
};

// Player object
const player = {
    x: GAME_WIDTH / 2,
    y: GAME_HEIGHT - 100,
    width: PLAYER_SIZE,
    height: PLAYER_SIZE,
    hp: 100,
    maxHp: 100,
    speed: PLAYER_SPEED,
    vx: 0,
    vy: 0
};

// Sans boss object
const sans = {
    x: GAME_WIDTH / 2,
    y: 150,
    width: 40,
    height: 60,
    hp: 300,
    maxHp: 300,
    phase: 1,
    actionCooldown: 0,
    blinkTimer: 0
};

// Game state
let gameState = STATES.DIALOGUE;
let dialogueIndex = 0;
let gameTime = 0;
let score = 0;

// Input handling
const keys = {};
window.addEventListener('keydown', (e) => {
    keys[e.key] = true;
    if (e.key === ' ' && gameState === STATES.DIALOGUE) {
        advanceDialogue();
    }
});
window.addEventListener('keyup', (e) => {
    keys[e.key] = false;
});

// Dialogue system
const dialogues = [
    "* You approach Sans...",
    "* sans: heya...",
    "* sans: you really are a determined one, huh?",
    "* sans: i can see it. that power in your eyes.",
    "* sans: well then... let's get this show on the road.",
    "* [FIGHT]"
];

function advanceDialogue() {
    dialogueIndex++;
    if (dialogueIndex >= dialogues.length) {
        gameState = STATES.BATTLE;
        dialogueIndex = 0;
    }
}

// Bullet patterns
class Bullet {
    constructor(x, y, vx, vy) {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.radius = 5;
        this.color = '#ffff00';
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
    }

    draw() {
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
    }

    isOffScreen() {
        return this.x < 0 || this.x > GAME_WIDTH || this.y < 0 || this.y > GAME_HEIGHT;
    }
}

const bullets = [];

function spawnBulletPattern(pattern) {
    switch (pattern) {
        case 'spread':
            for (let i = 0; i < 8; i++) {
                const angle = (Math.PI * 2 / 8) * i;
                const speed = 3;
                bullets.push(new Bullet(
                    sans.x,
                    sans.y,
                    Math.cos(angle) * speed,
                    Math.sin(angle) * speed
                ));
            }
            break;
        case 'wave':
            for (let i = 0; i < 5; i++) {
                bullets.push(new Bullet(
                    sans.x + (i - 2) * 40,
                    sans.y,
                    0,
                    3 + i * 0.5
                ));
            }
            break;
        case 'chaos':
            for (let i = 0; i < 12; i++) {
                const angle = Math.random() * Math.PI * 2;
                const speed = 2 + Math.random() * 2;
                bullets.push(new Bullet(
                    sans.x,
                    sans.y,
                    Math.cos(angle) * speed,
                    Math.sin(angle) * speed
                ));
            }
            break;
    }
}

// Player movement
function updatePlayer() {
    player.vx = 0;
    player.vy = 0;

    if (keys['ArrowLeft'] || keys['a']) player.vx = -player.speed;
    if (keys['ArrowRight'] || keys['d']) player.vx = player.speed;
    if (keys['ArrowUp'] || keys['w']) player.vy = -player.speed;
    if (keys['ArrowDown'] || keys['s']) player.vy = player.speed;

    player.x += player.vx;
    player.y += player.vy;

    // Boundary checking
    if (player.x < 0) player.x = 0;
    if (player.x + player.width > GAME_WIDTH) player.x = GAME_WIDTH - player.width;
    if (player.y < 0) player.y = 0;
    if (player.y + player.height > GAME_HEIGHT) player.y = GAME_HEIGHT - player.height;
}

// Collision detection
function checkCollisions() {
    for (let i = bullets.length - 1; i >= 0; i--) {
        const bullet = bullets[i];
        const dx = bullet.x - (player.x + player.width / 2);
        const dy = bullet.y - (player.y + player.height / 2);
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < bullet.radius + PLAYER_SIZE / 2) {
            player.hp -= 5;
            bullets.splice(i, 1);
        }
    }
}

// Sans AI
function updateSans() {
    sans.actionCooldown--;
    sans.blinkTimer++;

    if (sans.actionCooldown <= 0) {
        const patterns = ['spread', 'wave', 'chaos'];
        const randomPattern = patterns[Math.floor(Math.random() * patterns.length)];
        spawnBulletPattern(randomPattern);
        sans.actionCooldown = 60 + Math.random() * 40;

        // Phase change at certain HP thresholds
        if (sans.hp < sans.maxHp * 0.66) {
            sans.phase = 2;
        }
        if (sans.hp < sans.maxHp * 0.33) {
            sans.phase = 3;
        }
    }

    // Teleport effect in later phases
    if (sans.phase >= 2 && Math.random() < 0.02) {
        sans.x = Math.random() * (GAME_WIDTH - 80) + 40;
        sans.y = Math.random() * (GAME_HEIGHT / 2 - 100) + 50;
    }
}

// Update bullets
function updateBullets() {
    for (let i = bullets.length - 1; i >= 0; i--) {
        bullets[i].update();
        if (bullets[i].isOffScreen()) {
            bullets.splice(i, 1);
        }
    }
}

// Handle player attacks
function checkPlayerAttack() {
    if (gameState === STATES.BATTLE && score > 0) {
        if (gameTime % 30 === 0) {
            sans.hp -= 2;
        }
    }
}

// Drawing functions
function drawPlayer() {
    ctx.fillStyle = '#ffff00';
    ctx.fillRect(player.x, player.y, player.width, player.height);
    ctx.strokeStyle = '#ff0000';
    ctx.lineWidth = 2;
    ctx.strokeRect(player.x, player.y, player.width, player.height);
}

function drawSans() {
    const x = sans.x;
    const y = sans.y;

    const isBlink = Math.floor(sans.blinkTimer / 10) % 2 === 0 && sans.blinkTimer % 10 < 2;

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(x, y, 40, 40);

    if (!isBlink) {
        ctx.fillStyle = '#000000';
        ctx.fillRect(x + 8, y + 10, 8, 8);
        ctx.fillRect(x + 24, y + 10, 8, 8);
    }

    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x + 20, y + 28, 6, 0, Math.PI);
    ctx.stroke();

    ctx.fillStyle = '#000000';
    ctx.fillRect(x + 5, y + 40, 30, 20);

    ctx.fillStyle = '#000000';
    ctx.fillRect(x - 20, y - 20, 80, 5);
    ctx.fillStyle = '#00ff00';
    const healthWidth = (sans.hp / sans.maxHp) * 80;
    ctx.fillRect(x - 20, y - 20, healthWidth, 5);
}

function drawBullets() {
    bullets.forEach(bullet => bullet.draw());
}

function drawDialogue() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(50, GAME_HEIGHT - 150, GAME_WIDTH - 100, 130);

    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.strokeRect(50, GAME_HEIGHT - 150, GAME_WIDTH - 100, 130);

    ctx.fillStyle = '#ffffff';
    ctx.font = '14px Arial';
    const text = dialogues[dialogueIndex];
    const words = text.split(' ');
    let line = '';
    let y = GAME_HEIGHT - 120;

    words.forEach((word, index) => {
        const testLine = line + word + ' ';
        if (testLine.length > 60) {
            ctx.fillText(line, 70, y);
            line = word + ' ';
            y += 25;
        } else {
            line = testLine;
        }
    });
    ctx.fillText(line, 70, y);

    ctx.fillStyle = '#ffff00';
    ctx.font = 'bold 12px Arial';
    ctx.fillText('[ SPACE to continue ]', 70, GAME_HEIGHT - 30);
}

function drawGameOver() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    ctx.fillStyle = '#ff0000';
    ctx.font = 'bold 48px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('GAME OVER', GAME_WIDTH / 2, GAME_HEIGHT / 2);

    ctx.fillStyle = '#ffffff';
    ctx.font = '24px Arial';
    ctx.fillText('You were defeated...', GAME_WIDTH / 2, GAME_HEIGHT / 2 + 50);
}

function drawWin() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    ctx.fillStyle = '#00ff00';
    ctx.font = 'bold 48px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('YOU WIN!', GAME_WIDTH / 2, GAME_HEIGHT / 2);

    ctx.fillStyle = '#ffffff';
    ctx.font = '24px Arial';
    ctx.fillText('Sans has been defeated...', GAME_WIDTH / 2, GAME_HEIGHT / 2 + 50);
}

// Main game loop
function gameLoop() {
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    gameTime++;

    if (gameState === STATES.DIALOGUE) {
        drawDialogue();
    } else if (gameState === STATES.BATTLE) {
        updatePlayer();
        updateBullets();
        updateSans();
        checkCollisions();
        checkPlayerAttack();

        drawBullets();
        drawSans();
        drawPlayer();

        document.getElementById('hpText').textContent = `HP: ${Math.max(0, player.hp)}/100`;
        document.getElementById('hpFill').style.width = `${Math.max(0, player.hp)}%`;
        document.getElementById('gameState').textContent = `Sans HP: ${Math.max(0, sans.hp)}/${sans.maxHp} | Phase: ${sans.phase}`;

        if (player.hp <= 0) {
            gameState = STATES.GAME_OVER;
        }
        if (sans.hp <= 0) {
            gameState = STATES.WIN;
        }
    } else if (gameState === STATES.GAME_OVER) {
        drawGameOver();
    } else if (gameState === STATES.WIN) {
        drawWin();
    }

    requestAnimationFrame(gameLoop);
}

gameLoop();