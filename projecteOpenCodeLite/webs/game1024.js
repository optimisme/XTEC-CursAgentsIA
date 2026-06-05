const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');

const GRID_SIZE = 4;
const TILE_SIZE = 100;
const PADDING = 10;

let score = 0;
let grid = [];
let isMoving = false;

class Tile {
    constructor(x, y, value) {
        this.x = x;
        this.y = y;
        this.targetX = x;
        this.targetY = y;
        this.value = value;
        this.isLocked = false;
        this.color = this.getColor(value);
    }

    getColor(value) {
        const colors = {
            2: '#eee4da',
            4: '#ede0c8',
            8: '#f2b179',
            16: '#f59563',
            32: '#f67c5f',
            64: '#f65e3b',
            128: '#edcf72',
            256: '#edc22e',
            512: '#edc22e',
            1024: '#edc22e',
            2048: '#edc22e'
        };
        return colors[value] || '#3c3b37';
    }

    update() {
        this.x += (this.targetX - this.x) * 0.2;
        this.y += (this.targetY - this.y) * 0.2;
    }

    draw(ctx) {
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.roundRect(
            this.x * TILE_SIZE + PADDING,
            this.y * TILE_SIZE + PADDING,
            TILE_SIZE - PADDING * 2,
            TILE_SIZE - PADDING * 2,
            10
        );
        ctx.fill();

        ctx.fillStyle = '#776e65';
        ctx.font = 'bold 30px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(this.value, this.x * TILE_SIZE + TILE_SIZE / 2, this.y * TILE_SIZE + TILE_SIZE / 2);
    }
}

function initGame() {
    grid = Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(null));
    score = 0;
    scoreElement.textContent = 'Score: ' + score;
    addRandomTile();
    addRandomTile();
    requestAnimationFrame(gameLoop);
}

function addRandomTile() {
    let emptyCells = [];
    for (let y = 0; y < GRID_SIZE; y++) {
        for (let x = 0; x < GRID_SIZE; x++) {
            if (grid[y][x] === null) emptyCells.push({ x, y });
        }
    }
    if (emptyCells.length > 0) {
        const cell = emptyCells[Math.floor(Math.random() * emptyCells.length)];
        const value = Math.random() > 0.9 ? 4 : 2;
        grid[cell.y][cell.x] = new Tile(cell.x, cell.y, value);
    }
}

function gameLoop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let y = 0; y < GRID_SIZE; y++) {
        for (let x = 0; x < GRID_SIZE; x++) {
            if (grid[y][x]) {
                grid[y][x].update();
                grid[y][x].draw(ctx);
            }
        }
    }
    requestAnimationFrame(gameLoop);
}

window.addEventListener('keydown', (e) => {
    const key = e.key;
    if (['ArrowUp', 'w', 'W'].includes(key)) move('up');
    else if (['ArrowDown', 's', 'S'].includes(key)) move('down');
    else if (['ArrowLeft', 'a', 'A'].includes(key)) move('left');
    else if (['ArrowRight', 'd', 'D'].includes(key)) move('right');
});


    if (moved) {
        grid = newGrid;
        scoreElement.textContent = 'Score: ' + score;
        addRandomTile();
        checkGameOver();
    }
}

function checkGameOver() {
    let canMove = false;
    for (let y = 0; y < GRID_SIZE; y++) {
        for (let x = 0; x < GRID_SIZE; x++) {
            if (grid[y][x] === null) {
                canMove = true;
                break;
            }
            // Check horizontal merges
            if (x < GRID_SIZE - 1 && grid[y][x] && grid[y][x+1] && grid[y][x].value === grid[y][x+1].value && !grid[y][x].isLocked) {
                canMove = true;
                break;
            }
            // Check vertical merges
            if (y < GRID_SIZE - 1 && grid[y][x] && grid[y+1][x] && grid[y][x].value === grid[y+1][x].value && !grid[y][x].isLocked) {
                canMove = true;
                break;
            }
        }
    }
    if (!canMove) {
        alert('Game Over! Score: ' + score);
        initGame();
    }
}

initGame();
