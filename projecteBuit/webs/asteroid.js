const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const W = 960;
const H = 720;
canvas.width = W;
canvas.height = H;

const SHIP_SIZE = 18;
const SHIP_THRUST = 0.12;
const SHIP_TURN_RATE = 0.07;
const SHIP_MAX_SPEED = 7;
const BULLET_SPEED = 10;
const BULLET_RANGE = 60;
const BULLET_COOLDOWN = 12;
const ASTEROID_SPEED = 1.5;
const SAUCER_SPAWN_INTERVAL = 480;
const SAUCER_SHOOT_INTERVAL = 90;
const MAX_SAUCERS = 3;
const MAX_BULLETS_PER_SAUCER = 2;

let gameState = 'waiting';
let score = 0;
let highScore = parseInt(localStorage.getItem('asteroidsHighScore')) || 0;
let lives = 3;
let level = 1;
let ship, bullets, asteroids, saucers, saucerBullets, particles;
let bulletCooldown = 0;
let saucerSpawnTimer = 0;
let keys = {};
let shipInvulnerable = 0;
let shipRespawning = false;
let shipRespawnTimer = 0;
let lastTime = 0;
let shipAngle = 0;
let thrusting = false;
let thrustFlame = 0;
let asteroidVertices = [];
let levelTransition = false;
let levelTransitionTimer = 0;
let pauseBlinkTimer = 0;
let starField = [];

function initStarField() {
    starField = [];
    for (let i = 0; i < 120; i++) {
        starField.push({
            x: Math.random() * W,
            y: Math.random() * H,
            size: Math.random() * 1.5 + 0.5,
            brightness: Math.random() * 0.5 + 0.3
        });
    }
}

function generateAsteroidVertices(x, y, radius, detail) {
    const verts = [];
    const numVerts = 8 + Math.floor(Math.random() * 6);
    for (let i = 0; i < numVerts; i++) {
        const angle = (Math.PI * 2 * i) / numVerts;
        const r = radius * (0.7 + Math.random() * 0.3);
        verts.push({
            x: x + Math.cos(angle) * r,
            y: y + Math.sin(angle) * r
        });
    }
    return verts;
}

function createAsteroid(x, y, size, vx, vy) {
    const radii = { large: 55, medium: 28, small: 13 };
    const r = radii[size];
    return {
        x: x || Math.random() * W,
        y: y || Math.random() * H,
        vx: vx || (Math.random() - 0.5) * ASTEROID_SPEED * (1 + level * 0.3),
        vy: vy || (Math.random() - 0.5) * ASTEROID_SPEED * (1 + level * 0.3),
        radius: r,
        size: size,
        verts: generateAsteroidVertices(
            x != null ? x : Math.random() * W,
            y != null ? y : Math.random() * H,
            r, 0
        )
    };
}

function spawnAsteroids(count) {
    for (let i = 0; i < count; i++) {
        let x, y;
        do {
            x = Math.random() * W;
            y = Math.random() * H;
        } while (dist(x, y, ship.x, ship.y) < 180);
        asteroids.push(createAsteroid(x, y, 'large'));
    }
}

function createSaucer() {
    const fromLeft = Math.random() < 0.5;
    return {
        x: fromLeft ? -40 : W + 40,
        y: 60 + Math.random() * (H - 120),
        vx: fromLeft ? 3.5 : -3.5,
        vy: 0,
        radius: 16,
        angle: fromLeft ? 0 : Math.PI,
        shootTimer: SAUCER_SHOOT_INTERVAL + Math.floor(Math.random() * 40),
        alive: true,
        flicker: 0
    };
}

function createBullet(x, y, angle) {
    return {
        x: x,
        y: y,
        vx: Math.cos(angle) * BULLET_SPEED,
        vy: Math.sin(angle) * BULLET_SPEED,
        life: BULLET_RANGE
    };
}

function createParticle(x, y, color, speed, life) {
    const angle = Math.random() * Math.PI * 2;
    const spd = Math.random() * speed;
    return {
        x: x,
        y: y,
        vx: Math.cos(angle) * spd,
        vy: Math.sin(angle) * spd,
        life: life || 30 + Math.random() * 20,
        maxLife: life || 30 + Math.random() * 20,
        color: color || '#ffffff'
    };
}

function dist(x1, y1, x2, y2) {
    return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
}

function wrapPosition(obj) {
    if (obj.x < 0) obj.x = W;
    if (obj.x > W) obj.x = 0;
    if (obj.y < 0) obj.y = H;
    if (obj.y > H) obj.y = 0;
}

function initGame() {
    score = 0;
    lives = 3;
    level = 1;
    bullets = [];
    asteroids = [];
    saucers = [];
    saucerBullets = [];
    particles = [];
    shipAngle = -Math.PI / 2;
    bulletCooldown = 0;
    saucerSpawnTimer = 0;
    shipInvulnerable = 0;
    shipRespawning = false;
    shipRespawnTimer = 0;
    levelTransition = false;
    levelTransitionTimer = 0;
    initShip();
    spawnAsteroids(3 + level);
}

function initShip() {
    ship = {
        x: W / 2,
        y: H / 2,
        vx: 0,
        vy: 0
    };
}

function drawShip() {
    if (shipRespawning) {
        shipRespawnTimer--;
        if (shipRespawnTimer <= 0) {
            shipRespawning = false;
            shipInvulnerable = 180;
        }
        return;
    }

    if (shipInvulnerable > 0) {
        shipInvulnerable--;
        if (Math.floor(shipInvulnerable / 5) % 2 === 0) return;
    }

    ctx.save();
    ctx.translate(ship.x, ship.y);
    ctx.rotate(shipAngle);

    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(16, 0);
    ctx.lineTo(-12, -10);
    ctx.lineTo(-8, 0);
    ctx.lineTo(-12, 10);
    ctx.closePath();
    ctx.stroke();

    if (thrusting) {
        thrustFlame++;
        if (thrustFlame % 3 < 2) {
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(-8, -5);
            ctx.lineTo(-16 - Math.random() * 6, 0);
            ctx.lineTo(-8, 5);
            ctx.stroke();
        }
    }

    ctx.restore();
}

function drawAsteroid(a) {
    ctx.strokeStyle = '#aaaaaa';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(a.verts[0].x, a.verts[0].y);
    for (let i = 1; i < a.verts.length; i++) {
        ctx.lineTo(a.verts[i].x, a.verts[i].y);
    }
    ctx.closePath();
    ctx.stroke();
}

function drawSaucer(s) {
    ctx.save();
    ctx.translate(s.x, s.y);

    ctx.strokeStyle = '#ff4444';
    ctx.lineWidth = 2;

    ctx.beginPath();
    ctx.ellipse(0, 0, 16, 7, 0, 0, Math.PI * 2);
    ctx.stroke();

    ctx.beginPath();
    ctx.ellipse(0, -3, 8, 5, 0, Math.PI, Math.PI * 2);
    ctx.stroke();

    const glow = Math.sin(Date.now() * 0.01) * 0.3 + 0.7;
    ctx.fillStyle = `rgba(255, 68, 68, ${glow})`;
    ctx.beginPath();
    ctx.arc(0, 0, 2, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
}

function drawBullet(b) {
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(b.x, b.y, 2, 0, Math.PI * 2);
    ctx.fill();
}

function drawSaucerBullet(b) {
    ctx.fillStyle = '#ff4444';
    ctx.beginPath();
    ctx.arc(b.x, b.y, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 68, 68, 0.4)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(b.x, b.y, 5, 0, Math.PI * 2);
    ctx.stroke();
}

function drawParticle(p) {
    const alpha = p.life / p.maxLife;
    ctx.fillStyle = p.color;
    ctx.globalAlpha = alpha;
    ctx.fillRect(p.x - 1, p.y - 1, 2, 2);
    ctx.globalAlpha = 1;
}

function drawHUD() {
    ctx.fillStyle = '#ffffff';
    ctx.font = '16px "Courier New", monospace';
    ctx.textAlign = 'left';
    ctx.fillText('SCORE: ' + score.toString().padStart(6, '0'), 20, 30);

    ctx.textAlign = 'center';
    ctx.fillText('LEVEL ' + level, W / 2, 30);

    ctx.textAlign = 'right';
    ctx.fillText('HI: ' + highScore.toString().padStart(6, '0'), W - 20, 30);

    for (let i = 0; i < lives; i++) {
        ctx.save();
        ctx.translate(30 + i * 28, H - 25);
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(10, 0);
        ctx.lineTo(-7, -6);
        ctx.lineTo(-5, 0);
        ctx.lineTo(-7, 6);
        ctx.closePath();
        ctx.stroke();
        ctx.restore();
    }
}

function drawWaiting() {
    ctx.fillStyle = '#ffffff';
    ctx.font = '28px "Courier New", monospace';
    ctx.textAlign = 'center';
    ctx.fillText('ASTEROIDS', W / 2, H / 2 - 60);

    const blink = Math.sin(Date.now() * 0.005) > 0;
    if (blink) {
        ctx.font = '14px "Courier New", monospace';
        ctx.fillText('PRESS ANY KEY TO START', W / 2, H / 2);
    }

    ctx.font = '12px "Courier New", monospace';
    ctx.fillText('ARROWS: MOVE & SHOOT  |  P: PAUSE', W / 2, H / 2 + 60);

    if (highScore > 0) {
        ctx.fillText('HIGH SCORE: ' + highScore.toString().padStart(6, '0'), W / 2, H / 2 + 100);
    }
}

function drawPaused() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.fillRect(0, 0, W, H);

    pauseBlinkTimer++;
    if (pauseBlinkTimer % 30 < 15) {
        ctx.fillStyle = '#ffffff';
        ctx.font = '28px "Courier New", monospace';
        ctx.textAlign = 'center';
        ctx.fillText('PAUSED', W / 2, H / 2);
    }
}

function drawGameOver() {
    ctx.fillStyle = '#ffffff';
    ctx.font = '32px "Courier New", monospace';
    ctx.textAlign = 'center';
    ctx.fillText('GAME OVER', W / 2, H / 2 - 30);

    const blink = Math.sin(Date.now() * 0.005) > 0;
    if (blink) {
        ctx.font = '14px "Courier New", monospace';
        ctx.fillText('PRESS ENTER TO RESTART', W / 2, H / 2 + 30);
    }
}

function drawLevelTransition() {
    ctx.fillStyle = '#ffffff';
    ctx.font = '24px "Courier New", monospace';
    ctx.textAlign = 'center';
    ctx.fillText('LEVEL ' + level, W / 2, H / 2);
}

function drawStars() {
    for (const star of starField) {
        ctx.fillStyle = `rgba(255, 255, 255, ${star.brightness})`;
        ctx.fillRect(star.x, star.y, star.size, star.size);
    }
}

function updateShip() {
    if (shipRespawning || shipInvulnerable > 0) return;

    if (keys['ArrowLeft']) {
        shipAngle -= SHIP_TURN_RATE;
    }
    if (keys['ArrowRight']) {
        shipAngle += SHIP_TURN_RATE;
    }

    thrusting = keys['ArrowUp'];
    if (thrusting) {
        ship.vx += Math.cos(shipAngle) * SHIP_THRUST;
        ship.vy += Math.sin(shipAngle) * SHIP_THRUST;
    } else {
        const friction = 0.99;
        ship.vx *= friction;
        ship.vy *= friction;
    }

    let speed = Math.sqrt(ship.vx ** 2 + ship.vy ** 2);
    if (speed > SHIP_MAX_SPEED) {
        ship.vx = (ship.vx / speed) * SHIP_MAX_SPEED;
        ship.vy = (ship.vy / speed) * SHIP_MAX_SPEED;
    }

    ship.x += ship.vx;
    ship.y += ship.vy;
    wrapPosition(ship);
}

function updateBullets() {
    for (let i = bullets.length - 1; i >= 0; i--) {
        bullets[i].x += bullets[i].vx;
        bullets[i].y += bullets[i].vy;
        bullets[i].life--;
        wrapPosition(bullets[i]);
        if (bullets[i].life <= 0) {
            bullets.splice(i, 1);
        }
    }
}

function updateAsteroids() {
    for (const a of asteroids) {
        a.x += a.vx;
        a.y += a.vy;
        wrapPosition(a);
    }
}

function updateSaucers() {
    saucerSpawnTimer++;
    if (saucerSpawnTimer >= SAUCER_SPAWN_INTERVAL && saucers.length < MAX_SAUCERS) {
        saucers.push(createSaucer());
        saucerSpawnTimer = 0;
    }

    for (let i = saucers.length - 1; i >= 0; i--) {
        const s = saucers[i];
        s.x += s.vx;
        s.y += s.vy;
        s.shootTimer--;

        if (s.x < -60 || s.x > W + 60) {
            saucers.splice(i, 1);
            continue;
        }

        if (s.shootTimer <= 0 && !shipRespawning) {
            const angle = Math.atan2(ship.y - s.y, ship.x - s.x);
            saucerBullets.push({
                x: s.x,
                y: s.y,
                vx: Math.cos(angle) * 4.5,
                vy: Math.sin(angle) * 4.5
            });
            s.shootTimer = SAUCER_SHOOT_INTERVAL + Math.floor(Math.random() * 60);
        }
    }
}

function updateSaucerBullets() {
    for (let i = saucerBullets.length - 1; i >= 0; i--) {
        saucerBullets[i].x += saucerBullets[i].vx;
        saucerBullets[i].y += saucerBullets[i].vy;
        wrapPosition(saucerBullets[i]);
        if (saucerBullets[i].x < -10 || saucerBullets[i].x > W + 10 ||
            saucerBullets[i].y < -10 || saucerBullets[i].y > H + 10) {
            saucerBullets.splice(i, 1);
        }
    }
}

function updateParticles() {
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vx *= 0.98;
        p.vy *= 0.98;
        p.life--;
        if (p.life <= 0) {
            particles.splice(i, 1);
        }
    }
}

function handleCollisions() {
    for (let i = bullets.length - 1; i >= 0; i--) {
        let hit = false;
        for (let j = asteroids.length - 1; j >= 0; j--) {
            const a = asteroids[j];
            if (dist(bullets[i].x, bullets[i].y, a.x, a.y) < a.radius + 4) {
                hit = true;
                bullets.splice(i, 1);

                const points = { large: 20, medium: 50, small: 100 };
                score += points[a.size];

                const splitSize = {
                    large: 'medium',
                    medium: 'small',
                    small: null
                };

                for (let k = 0; k < 8; k++) {
                    particles.push(createParticle(a.x, a.y, '#aaaaaa', 3, 25));
                }

                if (splitSize[a.size]) {
                    const count = a.size === 'large' ? 2 : 1;
                    for (let c = 0; c < count; c++) {
                        const angle = Math.random() * Math.PI * 2;
                        const spd = 1.5 + Math.random() * 1.5;
                        asteroids.push(createAsteroid(
                            a.x + Math.cos(angle) * a.radius,
                            a.y + Math.sin(angle) * a.radius,
                            splitSize[a.size],
                            Math.cos(angle) * spd,
                            Math.sin(angle) * spd
                        ));
                    }
                }

                asteroids.splice(j, 1);
                break;
            }
        }
    }

    for (let i = saucerBullets.length - 1; i >= 0; i--) {
        const b = saucerBullets[i];
        if (!shipRespawning && shipInvulnerable <= 0) {
            if (dist(b.x, b.y, ship.x, ship.y) < SHIP_SIZE) {
                saucerBullets.splice(i, 1);
                playerHit();
                break;
            }
        }
    }

    if (!shipRespawning && shipInvulnerable <= 0) {
        for (const a of asteroids) {
            if (dist(a.x, a.y, ship.x, ship.y) < a.radius + SHIP_SIZE * 0.6) {
                playerHit();
                break;
            }
        }
    }

    for (const s of saucers) {
        if (!shipRespawning && shipInvulnerable <= 0) {
            if (dist(s.x, s.y, ship.x, ship.y) < s.radius + SHIP_SIZE * 0.6) {
                playerHit();
                break;
            }
        }
    }

    if (asteroids.length === 0 && !levelTransition) {
        levelTransition = true;
        levelTransitionTimer = 120;
        level++;
    }

    if (levelTransition) {
        levelTransitionTimer--;
        if (levelTransitionTimer <= 0) {
            levelTransition = false;
            spawnAsteroids(3 + level);
        }
    }
}

function playerHit() {
    lives--;
    shipInvulnerable = 120;
    for (let i = 0; i < 20; i++) {
        particles.push(createParticle(ship.x, ship.y, '#ffffff', 5, 40));
    }
    if (lives <= 0) {
        if (score > highScore) {
            highScore = score;
            localStorage.setItem('asteroidsHighScore', highScore);
        }
        gameState = 'gameover';
    } else {
        shipRespawning = true;
        shipRespawnTimer = 60;
    }
}

function shoot() {
    if (bulletCooldown > 0) return;
    if (shipRespawning) return;

    bullets.push(createBullet(
        ship.x + Math.cos(shipAngle) * 14,
        ship.y + Math.sin(shipAngle) * 14,
        shipAngle
    ));
    bulletCooldown = BULLET_COOLDOWN;
}

function update() {
    if (gameState !== 'playing') return;
    if (levelTransition) return;

    updateShip();
    updateBullets();
    updateAsteroids();
    updateSaucers();
    updateSaucerBullets();
    updateParticles();

    if (bulletCooldown > 0) bulletCooldown--;

    if (keys[' ']) {
        shoot();
    }

    handleCollisions();
}

function draw() {
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, W, H);

    drawStars();

    if (gameState === 'waiting') {
        drawWaiting();
        return;
    }

    for (const a of asteroids) {
        drawAsteroid(a);
    }

    for (const s of saucers) {
        drawSaucer(s);
    }

    for (const b of bullets) {
        drawBullet(b);
    }

    for (const b of saucerBullets) {
        drawSaucerBullet(b);
    }

    for (const p of particles) {
        drawParticle(p);
    }

    drawShip();
    drawHUD();

    if (levelTransition) {
        drawLevelTransition();
    }

    if (gameState === 'paused') {
        drawPaused();
    }

    if (gameState === 'gameover') {
        drawGameOver();
    }
}

function gameLoop(timestamp) {
    if (!lastTime) lastTime = timestamp;
    lastTime = timestamp;

    update();
    draw();
    requestAnimationFrame(gameLoop);
}

document.addEventListener('keydown', (e) => {
    keys[e.key] = true;

    if (gameState === 'waiting') {
        gameState = 'playing';
        initGame();
        return;
    }

    if (gameState === 'gameover') {
        if (e.key === 'Enter') {
            initGame();
            gameState = 'playing';
        }
        return;
    }

    if (gameState === 'playing' && e.key === 'p') {
        gameState = 'paused';
    }

    if (gameState === 'paused' && e.key === 'p') {
        gameState = 'playing';
    }

    if (e.key === 'ArrowUp' || e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        e.preventDefault();
    }
});

document.addEventListener('keyup', (e) => {
    keys[e.key] = false;
});

initStarField();
requestAnimationFrame(gameLoop);
