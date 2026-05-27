const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');
const messageElement = document.getElementById('message');

canvas.width = 480;
canvas.height = 640;

const STATE_START = 'START';
const STATE_PLAYING = 'PLAYING';
const STATE_GAMEOVER = 'GAMEOVER';

let gameState = STATE_START;
let score = 0;
let player = { x: canvas.width / 2, y: canvas.height - 50, width: 30, height: 30, speed: 5 };
let bullets = [];
let enemies = [];
let enemyBullets = [];
let stars = [];
let keys = {};

// Initialize stars for background
for (let i = 0; i < 100; i++) {
    stars.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * 2,
        speed: Math.random() * 0.5 + 0.2
    });
}

// Input handling
window.addEventListener('keydown', (e) => {
    keys[e.code] = true;
    if (gameState !== STATE_PLAYING && gameState !== STATE_GAMEOVER) {
        startGame();
    }
});
window.addEventListener('keyup', (e) => {
    keys[e.code] = false;
});

function startGame() {
    gameState = STATE_PLAYING;
    score = 0;
    scoreElement.textContent = `Score: ${score}`;
    messageElement.textContent = '';
    player.x = canvas.width / 2;
    bullets = [];
    enemies = [];
    enemyBullets = [];
    spawnEnemies();
}

function spawnEnemies() {
    for (let row = 0; row < 4; row++) {
        for (let col = 0; col < 8; col++) {
            enemies.push({
                x: 50 + col * 50,
                y: 50 + row * 40,
                width: 30,
                height: 30,
                speed: 1,
                direction: 1,
                type: Math.floor(Math.random() * 3),
                isDiving: false,
                diveOffset: 0
            });
        }
    }
}

function update() {
    if (gameState !== STATE_PLAYING) return;

    // Player movement
    if (keys['ArrowLeft'] && player.x > 0) player.x -= player.speed;
    if (keys['ArrowRight'] && player.x < canvas.width - player.width) player.x += player.speed;
    
    // Shooting (Space) - note: instructions said shoot with space
    if (keys['Space']) {
        if (bullets.length === 0 || bullets[bullets.length - 1].y < player.y - 100) {
            bullets.push({ x: player.x + player.width / 2 - 2, y: player.y, width: 4, height: 10 });
        }
    }

    // Update bullets
    bullets.forEach((bullet, index) => {
        bullet.y -= 7;
        if (bullet.y < 0) bullets.splice(index, 1);
    });

    // Update stars
    stars.forEach(star => {
        star.y += star.speed;
        if (star.y > canvas.height) star.y = 0;
    });

    // Update enemies
    let edgeReached = false;
    enemies.forEach(enemy => {
        if (!enemy.isDiving) {
            enemy.x += enemy.speed * enemy.direction;
            if (enemy.x <= 0 || enemy.x >= canvas.width - enemy.width) {
                edgeReached = true;
            }
        } else {
            enemy.y += 3;
            enemy.x += Math.sin(enemy.diveOffset) * 2;
            enemy.diveOffset += 0.05;
            if (enemy.y > canvas.height) {
                // enemy died off screen (prevented by actual shooting usually)
                enemy.y = -30; 
            }
        }

        // Random dive chance
        if (!enemy.isDiving && Math.random() < 0.001) {
            enemy.isDiving = true;
            enemy.diveOffset = 0;
        }

        // Enemy attack
        if (!enemy.isDiving && Math.random() < 0.002) {
            enemyBullets.push({ x: enemy.x + enemy.width / 2, y: enemy.y + enemy.height, width: 4, height: 10 });
        }

        // Check collision with player bullets
        bullets.forEach((bullet, bIndex) => {
            if (bullet.x < enemy.x + enemy.width &&
                bullet.x + bullet.width > enemy.x &&
                bullet.y < enemy.y + enemy.height &&
                bullet.y + bullet.height > enemy.y) {
                enemies.splice(enemies.indexOf(enemy), 1);
                bullets.splice(bIndex, 1);
                score += 100;
                scoreElement.textContent = `Score: ${score}`;
            }
        });

        // Check collision with player
        if (enemy.x < player.x + player.width &&
            enemy.x + enemy.width > player.x &&
            enemy.y < player.y + player.height &&
            enemy.y + enemy.height > player.y) {
            gameOver();
        }
    });

    if (edgeReached) {
        enemies.forEach(enemy => {
            enemy.direction *= -1;
            enemy.y += 10;
        });
    }

    // Update enemy bullets
    enemyBullets.forEach((eb, index) => {
        eb.y += 4;
        if (eb.y > canvas.height) enemyBullets.splice(index, 1);
        
        if (eb.x < player.x + player.width &&
            eb.x + eb.width > player.x &&
            eb.y < player.y + player.height &&
            eb.y + eb.height > player.y) {
            gameOver();
        }
    });

    if (enemies.length === 0) {
        spawnEnemies();
    }
}

function gameOver() {
    gameState = STATE_GAMEOVER;
    messageElement.textContent = 'GAME OVER - PRESS ANY KEY TO RESTART';
}

function draw() {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw stars
    ctx.fillStyle = '#fff';
    stars.forEach(star => {
        ctx.fillRect(star.x, star.y, star.size, star.size);
    });

    if (gameState === STATE_PLAYING || gameState === STATE_GAMEOVER) {
        // Draw player (Galaxip style)
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.moveTo(player.x + player.width / 2, player.y);
        ctx.lineTo(player.x, player.y + player.height);
        ctx.lineTo(player.x + player.width, player.y + player.height);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#f00';
        ctx.fillRect(player.x + player.width/2 - 2, player.y + player.height - 5, 4, 5);

        // Draw bullets
        ctx.fillStyle = '#fff';
        bullets.forEach(bullet => {
            ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
        });

        // Draw enemies
        enemies.forEach(enemy => {
            ctx.fillStyle = enemy.type === 0 ? '#f0f' : (enemy.type === 1 ? '#0ff' : '#ff0');
            ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
            // Add a little "eye" to make it look more like an alien
            ctx.fillStyle = '#000';
            ctx.fillRect(enemy.x + 5, enemy.y + 5, 5, 5);
            ctx.fillRect(enemy.x + enemy.width - 10, enemy.y + 5, 5, 5);
        });

        // Draw enemy bullets
        ctx.fillStyle = '#f00';
        enemyBullets.forEach(eb => {
            ctx.fillRect(eb.x, eb.y, eb.width, eb.height);
        });
    }

    requestAnimationFrame(() => {
        update();
        draw();
    });
}

draw();
