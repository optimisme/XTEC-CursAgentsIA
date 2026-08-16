// ============================================================
// CONSTANTS I DEFINICIONS
// ============================================================

const COLS = 12;
const ROWS = 20;
const CELL_SIZE = 20;

const COLORS = [
    null,
    '#00FFFF', // I - Cyan
    '#FFFF00', // O - Yellow
    '#800080', // T - Purple
    '#00FF00', // S - Green
    '#FF0000', // Z - Red
    '#0000FF', // J - Blue
    '#FFA500', // L - Orange
];

const TETROMINOS = {
    I: {
        shape: [
            [[0,0,0,0],[1,1,1,1],[0,0,0,0],[0,0,0,0]],
            [[0,0,1,0],[0,0,1,0],[0,0,1,0],[0,0,1,0]],
            [[0,0,0,0],[0,0,0,0],[1,1,1,1],[0,0,0,0]],
            [[0,1,0,0],[0,1,0,0],[0,1,0,0],[0,1,0,0]]
        ],
        color: 1
    },
    O: {
        shape: [
            [[1,1],[1,1]],
            [[1,1],[1,1]],
            [[1,1],[1,1]],
            [[1,1],[1,1]]
        ],
        color: 2
    },
    T: {
        shape: [
            [[0,1,0],[1,1,1],[0,0,0]],
            [[0,1,0],[0,1,1],[0,1,0]],
            [[0,0,0],[1,1,1],[0,1,0]],
            [[0,1,0],[1,1,0],[0,1,0]]
        ],
        color: 3
    },
    S: {
        shape: [
            [[0,1,1],[1,1,0],[0,0,0]],
            [[1,0,0],[1,1,0],[0,1,0]],
            [[0,0,0],[0,1,1],[1,1,0]],
            [[0,0,1],[1,1,0],[1,0,0]]
        ],
        color: 4
    },
    Z: {
        shape: [
            [[1,1,0],[0,1,1],[0,0,0]],
            [[0,0,1],[0,1,1],[0,1,0]],
            [[0,0,0],[1,1,0],[0,1,1]],
            [[1,0,0],[1,1,0],[0,0,1]]
        ],
        color: 5
    },
    J: {
        shape: [
            [[1,0,0],[1,1,1],[0,0,0]],
            [[0,1,1],[0,1,0],[0,1,0]],
            [[0,0,0],[1,1,1],[0,0,1]],
            [[0,1,0],[0,1,0],[1,1,0]]
        ],
        color: 6
    },
    L: {
        shape: [
            [[0,0,1],[1,1,1],[0,0,0]],
            [[0,1,0],[0,1,0],[0,1,1]],
            [[0,0,0],[1,1,1],[1,0,0]],
            [[1,1,0],[0,1,0],[0,1,0]]
        ],
        color: 7
    }
};

const PIECE_NAMES = ['I', 'O', 'T', 'S', 'Z', 'J', 'L'];

// ============================================================
// ESTRUCTURES DE DADES
// ============================================================

let gameBoard;
let currentPiece;
let nextPieceData;
let gameRunning = false;
let score = 0;
let level = 1;
let linesCleared = 0;
let gameOver = false;
let lastDropTime = 0;
let animationFrameId = null;
let initialSpawnDone = false;

// ============================================================
// INICIALITZACIÓ
// ============================================================

function initGame() {
    gameBoard = [];
    for (let r = 0; r < ROWS; r++) {
        gameBoard[r] = [];
        for (let c = 0; c < COLS; c++) {
            gameBoard[r][c] = 0;
        }
    }
    initialSpawnDone = false;
    gameOver = false;
    gameRunning = false;
    syncState();
}

function pauseGame() {
    gameRunning = false;
    gameOver = false;
    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
    }
    syncState();
}

function resetGameState() {
    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
    }
    initGame();
    score = 0;
    level = 1;
    linesCleared = 0;
    gameRunning = true;
    spawnPiece();
    updateUI();
    hideGameOverOverlay();
    lastDropTime = performance.now();
    animationFrameId = requestAnimationFrame(gameLoop);
}

function fullReset() {
    gameBoard = [];
    currentPiece = null;
    nextPieceData = null;
    gameRunning = false;
    score = 0;
    level = 1;
    linesCleared = 0;
    gameOver = false;
    lastDropTime = 0;
    initialSpawnDone = false;
    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
    }
    // Rebuild empty game board
    for (let r = 0; r < ROWS; r++) {
        gameBoard[r] = [];
        for (let c = 0; c < COLS; c++) {
            gameBoard[r][c] = 0;
        }
    }
    syncState();
}

// ============================================================
// GENERACIÓ DE PECES
// ============================================================

function getRandomPiece() {
    const name = PIECE_NAMES[Math.floor(Math.random() * PIECE_NAMES.length)];
    return { name: name, shape: TETROMINOS[name].shape, color: TETROMINOS[name].color };
}

function spawnPiece() {
    let shape, color, name;
    
    if (nextPieceData) {
        shape = nextPieceData.shape[0];
        color = nextPieceData.color;
        name = nextPieceData.name;
        nextPieceData = getRandomPiece();
    } else {
        const piece = getRandomPiece();
        shape = piece.shape[0];
        color = piece.color;
        name = piece.name;
        nextPieceData = getRandomPiece();
    }
    
    const pieceCol = Math.floor(COLS / 2) - Math.floor(shape[0].length / 2);
    
    currentPiece = {
        shape: shape,
        color: color,
        x: pieceCol,
        y: 0,
        rotationIndex: 0,
        name: name
    };
    
    if (checkCollision(currentPiece, 0, 0)) {
        gameOver = true;
        gameRunning = false;
        showGameOverOverlay();
        currentPiece = null;
        return false;
    }
    
    return true;
}

// ============================================================
// COL·LISIONS
// ============================================================

function checkCollision(piece, dx, dy) {
    const board = window.gameBoard || gameBoard;
    const shape = piece.shape;
    for (let r = 0; r < shape.length; r++) {
        for (let c = 0; c < shape[r].length; c++) {
            if (shape[r][c]) {
                const newX = piece.x + c + dx;
                const newY = piece.y + r + dy;
                if (newX < 0 || newX >= COLS) return true;
                if (newY >= ROWS) return true;
                if (newY >= 0 && board[newY] && board[newY][newX]) return true;
            }
        }
    }
    return false;
}

// ============================================================
// MOVIMENT DE PECES
// ============================================================

function movePiece(dx) {
    if (!gameRunning || gameOver) return false;
    if (!checkCollision(currentPiece, dx, 0)) {
        currentPiece.x += dx;
        draw();
        return true;
    }
    return false;
}

function movePieceDown() {
    if (!gameRunning || gameOver) return false;
    if (!checkCollision(currentPiece, 0, 1)) {
        currentPiece.y++;
        draw();
        return true;
    }
    lockPiece();
    return false;
}

function hardDrop() {
    if (!gameRunning || gameOver) return;
    let dropDistance = 0;
    while (!checkCollision(currentPiece, 0, 1)) {
        currentPiece.y++;
        dropDistance++;
    }
    score += dropDistance * 2;
    updateUI();
    draw();
    lockPiece();
}

function rotatePiece() {
    if (!gameRunning || gameOver) return;
    const newIndex = (currentPiece.rotationIndex + 1) % 4;
    const newShape = TETROMINOS[currentPiece.name].shape[newIndex];
    
    const kicks = [0, -1, 1, -2, 2];
    for (let i = 0; i < kicks.length; i++) {
        if (!checkCollision(currentPiece, kicks[i], 0)) {
            currentPiece.x += kicks[i];
            currentPiece.shape = JSON.parse(JSON.stringify(newShape));
            currentPiece.rotationIndex = newIndex;
            draw();
            return;
        }
    }
}

// ============================================================
// FIXACIÓ DE PECES
// ============================================================

function lockPiece() {
    const board = window.gameBoard || gameBoard;
    const shape = currentPiece.shape;
    for (let r = 0; r < shape.length; r++) {
        for (let c = 0; c < shape[r].length; c++) {
            if (shape[r][c]) {
                const boardY = currentPiece.y + r;
                const boardX = currentPiece.x + c;
                if (boardY >= 0 && boardY < ROWS && boardX >= 0 && boardX < COLS) {
                    board[boardY][boardX] = currentPiece.color;
                }
            }
        }
    }
    clearLines();
    spawnPiece();
}

// ============================================================
// ELIMINACIÓ DE LÍNIES
// ============================================================

function checkLines() {
    const board = window.gameBoard || gameBoard;
    const fullLines = [];
    for (let r = 0; r < ROWS; r++) {
        if (board[r].every(cell => cell !== 0)) {
            fullLines.push(r);
        }
    }
    return fullLines;
}

function clearLines() {
    const board = window.gameBoard || gameBoard;
    const fullLines = checkLines();
    if (fullLines.length === 0) return;

    const sortedLines = fullLines.sort((a, b) => b - a);
    for (let i = 0; i < sortedLines.length; i++) {
        board.splice(sortedLines[i], 1);
        board.unshift(new Array(COLS).fill(0));
    }

    const count = fullLines.length;
    linesCleared += count;
    
    const points = [0, 100, 300, 500, 800];
    score += points[count] || 0;
    
    const newLevel = Math.floor(linesCleared / 10) + 1;
    if (newLevel !== level) {
        level = newLevel;
    }
    
    updateUI();
    syncState();
}

function getDropInterval() {
    return Math.max(100, 1000 - (level - 1) * 90);
}

// ============================================================
// GAME OVER I REINICI
// ============================================================

function checkGameOver() {
    return gameOver;
}

function showGameOverOverlay() {
    const overlay = document.getElementById('game-over-overlay');
    const finalScoreEl = document.getElementById('final-score');
    if (overlay && finalScoreEl) {
        finalScoreEl.textContent = 'Puntuació final: ' + score;
        overlay.classList.add('visible');
    }
}

function hideGameOverOverlay() {
    const overlay = document.getElementById('game-over-overlay');
    if (overlay) {
        overlay.classList.remove('visible');
    }
}

function restartGame() {
    resetGameState();
}

// ============================================================
// DIBUIXAT
// ============================================================

function drawCell(canvas, ctx, x, y, color) {
    ctx.fillStyle = color;
    ctx.fillRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
    
    ctx.strokeStyle = 'rgba(255,255,255,0.1)';
    ctx.lineWidth = 1;
    ctx.strokeRect(x * CELL_SIZE + 1, y * CELL_SIZE + 1, CELL_SIZE - 2, CELL_SIZE - 2);
    
    ctx.fillStyle = 'rgba(255,255,255,0.2)';
    ctx.fillRect(x * CELL_SIZE + 2, y * CELL_SIZE + 2, CELL_SIZE / 3, CELL_SIZE / 3);
}

function drawBoard() {
    const board = window.gameBoard || gameBoard;
    const canvas = document.getElementById('game-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Grid lines
    ctx.strokeStyle = 'rgba(255,255,255,0.05)';
    ctx.lineWidth = 0.5;
    for (let r = 0; r <= ROWS; r++) {
        ctx.beginPath();
        ctx.moveTo(0, r * CELL_SIZE);
        ctx.lineTo(canvas.width, r * CELL_SIZE);
        ctx.stroke();
    }
    for (let c = 0; c <= COLS; c++) {
        ctx.beginPath();
        ctx.moveTo(c * CELL_SIZE, 0);
        ctx.lineTo(c * CELL_SIZE, canvas.height);
        ctx.stroke();
    }
    
    for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
            if (board[r][c]) {
                drawCell(canvas, ctx, c, r, COLORS[board[r][c]]);
            }
        }
    }
}

function drawCurrentPiece() {
    if (!currentPiece) return;
    const shape = currentPiece.shape;
    
    for (let r = 0; r < shape.length; r++) {
        for (let c = 0; c < shape[r].length; c++) {
            if (shape[r][c]) {
                drawCell(document.getElementById('game-canvas'), 
                         document.getElementById('game-canvas').getContext('2d'),
                         currentPiece.x + c, currentPiece.y + r, currentPiece.color);
            }
        }
    }
    
    // Draw ghost piece
    let ghostY = currentPiece.y;
    while (!checkCollision(currentPiece, 0, ghostY - currentPiece.y + 1)) {
        ghostY++;
    }
    if (ghostY !== currentPiece.y) {
        const canvas = document.getElementById('game-canvas');
        const ctx = canvas.getContext('2d');
        ctx.save();
        ctx.globalAlpha = 0.2;
        for (let r = 0; r < shape.length; r++) {
            for (let c = 0; c < shape[r].length; c++) {
                if (shape[r][c]) {
                    drawCell(canvas, ctx, currentPiece.x + c, ghostY + r, currentPiece.color);
                }
            }
        }
        ctx.restore();
    }
}

function drawNextPiece() {
    const canvas = document.getElementById('next-piece');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    if (!nextPieceData) return;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    const shape = nextPieceData.shape[0];
    const pieceWidth = shape[0].length;
    const pieceHeight = shape.length;
    const offsetX = (canvas.width - pieceWidth * CELL_SIZE) / 2;
    const offsetY = (canvas.height - pieceHeight * CELL_SIZE) / 2;
    
    for (let r = 0; r < pieceHeight; r++) {
        for (let c = 0; c < pieceWidth; c++) {
            if (shape[r][c]) {
                const px = c * CELL_SIZE + offsetX;
                const py = r * CELL_SIZE + offsetY;
                ctx.fillStyle = COLORS[nextPieceData.color];
                ctx.fillRect(px, py, CELL_SIZE, CELL_SIZE);
                ctx.strokeStyle = 'rgba(255,255,255,0.1)';
                ctx.lineWidth = 1;
                ctx.strokeRect(px + 1, py + 1, CELL_SIZE - 2, CELL_SIZE - 2);
                ctx.fillStyle = 'rgba(255,255,255,0.2)';
                ctx.fillRect(px + 2, py + 2, CELL_SIZE / 3, CELL_SIZE / 3);
            }
        }
    }
}

function updateUI() {
    const scoreEl = document.getElementById('score');
    const levelEl = document.getElementById('level');
    const linesEl = document.getElementById('lines');
    if (scoreEl) scoreEl.textContent = score;
    if (levelEl) levelEl.textContent = level;
    if (linesEl) linesEl.textContent = linesCleared;
}

function draw() {
    drawBoard();
    if (currentPiece) {
        drawCurrentPiece();
    }
    drawNextPiece();
    updateUI();
    syncState();
}

// ============================================================
// GAME LOOP
// ============================================================

function gameLoop(timestamp) {
    if (!gameRunning || gameOver) return;
    
    const dropInterval = getDropInterval();
    if (timestamp - lastDropTime > dropInterval) {
        movePieceDown();
        lastDropTime = timestamp;
    }
    
    draw();
    animationFrameId = requestAnimationFrame(gameLoop);
}

function startGame() {
    if (gameRunning) return;
    resetGameState();
}

// ============================================================
// CONTROLS DE TECLAT
// ============================================================

document.addEventListener('keydown', (e) => {
    // Auto-start game on any key if not running and not game over
    if (!gameRunning && !gameOver) {
        startGame();
    }
    
    if (e.key === 'ArrowLeft') {
        e.preventDefault();
        movePiece(-1);
    } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        movePiece(1);
    } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        movePieceDown();
    } else if (e.key === 'ArrowUp' || e.key === ' ') {
        e.preventDefault();
        if (e.key === ' ') {
            hardDrop();
        } else {
            rotatePiece();
        }
    } else if (e.key === 'w' || e.key === 'W') {
        e.preventDefault();
        rotatePiece();
    } else if (e.key === 'Enter') {
        e.preventDefault();
        if (gameOver || !gameRunning) {
            restartGame();
        }
    }
});

// ============================================================
// BOTÓ DE REINICI
// ============================================================

const restartButton = document.getElementById('restart-button');
if (restartButton) {
    restartButton.addEventListener('click', () => {
        restartGame();
    });
}

// ============================================================
// EXPOSICIÓ PER A VALIDACIÓ (sincronitza variables del mòdul amb window)
// ============================================================

function syncState() {
    window.gameBoard = gameBoard;
    window.currentPiece = currentPiece;
    window.nextPieceData = nextPieceData;
    window.gameRunning = gameRunning;
    window.score = score;
    window.level = level;
    window.linesCleared = linesCleared;
    window.gameOver = gameOver;
}

window.pauseGame = pauseGame;
window.restartGame = restartGame;
window.fullReset = fullReset;
window.spawnPiece = spawnPiece;
window.clearLines = clearLines;
window.movePiece = movePiece;
window.movePieceDown = movePieceDown;
window.hardDrop = hardDrop;
window.rotatePiece = rotatePiece;
window.draw = draw;
window.checkLines = checkLines;

// ============================================================
// INICIALITZACIÓ
// ============================================================

initGame();
draw();
