const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreEl = document.getElementById('score');
const highScoreEl = document.getElementById('high-score');
const livesEl = document.getElementById('lives');
const overlay = document.getElementById('overlay');
const overlayTitle = document.getElementById('overlay-title');
const overlayMsg = document.getElementById('overlay-msg');

canvas.width = 800;
canvas.height = 600;

// Constants
const SHIP_SIZE = 20;
const SHIP_THRUST = 0.1;
const SHIP_TURN_SPEED = 0.08;
const FRICTION = 0.99;
const BULLET_SPEED = 6;
const MAX_BULLETS = 10;
const ASTEROID_NUM = 5;
const ASTEROID_SIZE = 50;
const ASTEROID_SPD = 1.5;
const ASTEROID_VERT = 10;
const SAUCER_SPD = 3;
const SAUCER_FREQ = 0.001;

// State
let score = 0;
let highScore = localStorage.getItem('asteroids-high-score') || 0;
let lives = 3;
let ship;
let asteroids = [];
let bullets = [];
let saucer;
let gameState = 'START'; // START, PLAYING, PAUSED, GAMEOVER
let keys = {};

highScoreEl.innerText = `HIGH: ${highScore}`;

function initGame() {
    score = 0;
    lives = 3;
    asteroids = [];
    bullets = [];
    saucer = null;
    scoreEl.innerText = `SCORE: ${score}`;
    livesEl.innerText = `LIVES: ${lives}`;
    createShip();
    createAsteroids();
    gameState = 'PLAYING';
    overlay.style.display = 'none';
}

function createShip() {
    ship = {
        x: canvas.width / 2,
        y: canvas.height / 2,
        r: SHIP_SIZE,
        angle: -Math.PI / 2,
        xv: 0,
        yv: 0,
        thrusting: false,
        blinkNum: 30, // invulnerability frames after respawn
    };
}

function createAsteroids() {
    asteroids = [];
    for (let i = 0; i < ASTEROID_NUM; i++) {
        let x, y;
        do {
            x = Math.random() * canvas.width;
            y = Math.random() * canvas.height;
        } while (distBetween(ship.x, ship.y, x, y) < 150);
        asteroids.push(new Asteroid(x, y, ASTEROID_SIZE));
    }
}

function distBetween(x1, y1, x2, y2) {
    return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
}

class Asteroid {
    constructor(x, y, r) {
        this.x = x;
        this.y = y;
        this.r = r;
        this.xv = (Math.random() * ASTEROID_SPD * 2 - ASTEROID_SPD);
        this.yv = (Math.random() * ASTEROID_SPD * 2 - ASTEROID_SPD);
        this.vert = Math.floor(Math.random() * (ASTEROID_VERT + 1) + ASTEROID_VERT / 2);
        this.offset = [];
        for (let i = 0; i < this.vert; i++) {
            this.offset.push(Math.random() * 0.4 + 0.8);
        }
    }

    update() {
        this.x += this.xv;
        this.y += this.yv;
        // wrap
        if (this.x < 0 - this.r) this.x = canvas.width + this.r;
        else if (this.x > canvas.width + this.r) this.x = 0 - this.r;
        if (this.y < 0 - this.r) this.y = canvas.height + this.r;
        else if (this.y > canvas.height + this.r) this.y = 0 - this.r;
    }

    draw() {
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(
            this.x + this.r * this.offset[0] * Math.cos(0),
            this.y + this.r * this.offset[0] * Math.sin(0)
        );
        for (let i = 1; i < this.vert; i++) {
            ctx.lineTo(
                this.x + this.r * this.offset[i] * Math.cos(i * Math.PI * 2 / this.vert),
                this.y + this.r * this.offset[i] * Math.sin(i * Math.PI * 2 / this.vert)
            );
        }
        ctx.closePath();
        ctx.stroke();
    }
}

class Saucer {
    constructor() {
        this.x = Math.random() > 0.5 ? 0 : canvas.width;
        this.y = Math.random() * canvas.height;
        this.xv = (this.x === 0 ? 1 : -1) * SAUCER_SPD;
        this.yv = (Math.random() - 0.5) * 2;
        this.r = 15;
        this.shootCooldown = 60;
    }

    update() {
        this.x += this.xv;
        this.y += this.yv;
        if (this.x < -this.r) this.x = canvas.width + this.r;
        else if (this.x > canvas.width + this.r) this.x = -this.r;
        if (this.y < -this.r) this.y = canvas.height + this.r;
        else if (this.y > canvas.height + this.r) this.y = -this.r;

        this.shootCooldown--;
        if (this.shootCooldown <= 0) {
            this.shoot();
            this.shootCooldown = 100;
        }
    }

    shoot() {
        let angle = Math.atan2(ship.y - this.y, ship.x - this.x);
        bullets.push({
            x: this.x + Math.cos(angle) * this.r,
            y: this.y + Math.sin(angle) * this.r,
            xv: Math.cos(angle) * BULLET_SPEED,
            yv: Math.sin(angle) * BULLET_SPEED,
            owner: 'saucer'
        });
    }

    draw() {
        ctx.strokeStyle = '#f0f'; // Magenta for saucer
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.ellipse(this.x, this.y, this.r * 1.5, this.r, 0, 0, Math.PI * 2);
        ctx.stroke();
    }
}

function update() {
    if (gameState !== 'PLAYING') return;

    // Ship movement
    if (keys['ArrowLeft']) ship.angle -= SHIP_TURN_SPEED;
    if (keys['ArrowRight']) ship.angle += SHIP_TURN_SPEED;
    
    if (keys['ArrowUp']) {
        ship.xv += SHIP_THRUST * Math.cos(ship.angle);
        ship.yv += SHIP_THRUST * Math.sin(ship.angle);
        ship.thrusting = true;
    } else {
        ship.thrusting = false;
    }

    ship.x += ship.xv;
    ship.y += ship.yv;
    ship.xv *= FRICTION;
    ship.yv *= FRICTION;

    // Ship wrap
    if (ship.x < 0 - ship.r) ship.x = canvas.width + ship.r;
    else if (ship.x > canvas.width + ship.r) ship.x = 0 - ship.r;
    if (ship.y < 0 - ship.r) ship.y = canvas.height + ship.r;
    else if (ship.y > canvas.height + ship.r) ship.y = 0 - ship.r;

    if (ship.blinkNum > 0) ship.blinkNum--;

    // Asteroids update
    asteroids.forEach(a => a.update());

    // Saucer update/spawn
    if (!saucer && Math.random() < SAUCER_FREQ) {
        saucer = new Saucer();
    }
    if (saucer) {
        saucer.update();
        if (saucer.x < -100 || saucer.x > canvas.width + 100) saucer = null;
    }

    // Bullets update
    for (let i = bullets.length - 1; i >= 0; i--) {
        let b = bullets[i];
        b.x += b.xv;
        b.y += b.yv;

        // wrap bullets
        if (b.x < 0) b.x = canvas.width;
        else if (b.x > canvas.width) b.x = 0;
        if (b.y < 0) b.y = canvas.height;
        else if (b.y > canvas.height) b.y = 0;

        // lifespan (optional, but good for performance)
        if (b.life === undefined) b.life = 100;
        b.life--;
        if (b.life <= 0) {
            bullets.splice(i, 1);
            continue;
        }

        // collision: bullet with asteroid
        if (b.owner === 'player') {
            for (let j = asteroids.length - 1; j >= 0; j--) {
                let a = asteroids[j];
                if (distBetween(b.x, b.y, a.x, a.y) < a.r) {
                    bullets.splice(i, 1);
                    splitAsteroid(j);
                    score += 100;
                    scoreEl.innerText = `SCORE: ${score}`;
                    break;
                }
            }
            // collision: bullet with saucer
            if (saucer && distBetween(b.x, b.y, saucer.x, saucer.y) < saucer.r) {
                bullets.splice(i, 1);
                saucer = null;
                score += 500;
                scoreEl.innerText = `SCORE: ${score}`;
            }
        } else {
            // saucer bullet with ship
            if (ship.blinkNum === 0 && distBetween(b.x, b.y, ship.x, ship.y) < ship.r) {
                bullets.splice(i, 1);
                handleShipHit();
            }
        }
    }

    // collision: ship with asteroid
    if (ship.blinkNum === 0) {
        for (let a of asteroids) {
            if (distBetween(ship.x, ship.y, a.x, a.y) < ship.r + a.r) {
                handleShipHit();
                break;
            }
        }
        if (saucer && distBetween(ship.x, ship.y, saucer.x, saucer.y) < ship.r + saucer.r) {
            handleShipHit();
        }
    }

    if (asteroids.length === 0) {
        createAsteroids();
        // Level up logic? maybe just more asteroids.
    }
}

function splitAsteroid(index) {
    let a = asteroids[index];
    if (a.r > 20) {
        asteroids.push(new Asteroid(a.x, a.y, a.r / 2));
        asteroids.push(new Asteroid(a.x, a.y, a.r / 2));
    }
    asteroids.splice(index, 1);
}

function handleShipHit() {
    lives--;
    livesEl.innerText = `LIVES: ${lives}`;
    if (lives <= 0) {
        gameOver();
    } else {
        createShip();
    }
}

function gameOver() {
    gameState = 'GAMEOVER';
    overlay.style.display = 'block';
    overlayTitle.innerText = 'GAME OVER';
    overlayMsg.innerText = 'PRESS ENTER TO RESTART';
    if (score > highScore) {
        highScore = score;
        localStorage.setItem('asteroids-high-score', highScore);
        highScoreEl.innerText = `HIGH: ${highScore}`;
    }
}

function draw() {
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (gameState === 'START') {
        return;
    }

    // Asteroids
    asteroids.forEach(a => a.draw());

    // Saucer
    if (saucer) saucer.draw();

    // Bullets
    bullets.forEach(b => {
        ctx.fillStyle = (b.owner === 'player') ? 'white' : '#f0f';
        ctx.beginPath();
        ctx.arc(b.x, b.y, 2, 0, Math.PI * 2);
        ctx.fill();
    });

    // Ship
    if (ship.blinkNum % 4 < 2) {
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(
            ship.x + ship.r * Math.cos(ship.angle),
            ship.y + ship.r * Math.sin(ship.angle)
        );
        ctx.lineTo(
            ship.x - ship.r * (Math.cos(ship.angle) + Math.sin(ship.angle)),
            ship.y - ship.r * (Math.sin(ship.angle) - Math.cos(ship.angle))
        );
        ctx.lineTo(
            ship.x - ship.r * (Math.cos(ship.angle) - Math.sin(ship.angle)),
            ship.y - ship.r * (Math.sin(ship.angle) + Math.cos(ship.angle))
        );
        ctx.closePath();
        ctx.stroke();

        if (ship.thrusting) {
            ctx.strokeStyle = 'yellow';
            ctx.beginPath();
            ctx.moveTo(
                ship.x - ship.r * Math.cos(ship.angle),
                ship.y - ship.r * Math.sin(ship.angle)
            );
            ctx.lineTo(
                ship.x - ship.r * 1.5 * Math.cos(ship.angle),
                ship.y - ship.r * 1.5 * Math.sin(ship.angle)
            );
            ctx.stroke();
        }
    }

    if (gameState === 'PAUSED') {
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = 'white';
        ctx.textAlign = 'center';
        ctx.font = '30px Courier New';
        ctx.fillText('PAUSED', canvas.width / 2, canvas.height / 2);
    }
}

function loop() {
    update();
    draw();
    requestAnimationFrame(loop);
}

window.addEventListener('keydown', e => {
    keys[e.code] = true;

    if (gameState === 'START') {
        initGame();
    } else if (gameState === 'PLAYING' && e.code === 'KeyP') {
        gameState = 'PAUSED';
    } else if (gameState === 'PAUSED' && e.code === 'KeyP') {
        gameState = 'PLAYING';
    } else if (gameState === 'GAMEOVER' && e.code === 'Enter') {
        initGame();
    }

    if (e.code === 'Space' && gameState === 'PLAYING' && bullets.length < MAX_BULLETS) {
        bullets.push({
            x: ship.x + ship.r * Math.cos(ship.angle),
            y: ship.y + ship.r * Math.sin(ship.angle),
            xv: BULLET_SPEED * Math.cos(ship.angle),
            yv: BULLET_SPEED * Math.sin(ship.angle),
            owner: 'player'
        });
    }
});

window.addEventListener('keyup', e => {
    keys[e.code] = false;
});

loop();
