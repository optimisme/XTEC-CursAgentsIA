const ROWS = 10;
const COLS = 10;
const MINES_COUNT = 10;

let grid = [];
let minesLocation = [];
let revealedCount = 0;
let gameOver = false;
let timerInterval = null;
let seconds = 0;

const gridElement = document.getElementById('grid');
const mineCountElement = document.getElementById('mine-count');
const timerElement = document.getElementById('timer');
const resetBtn = document.getElementById('reset-btn');

function initGame() {
    grid = [];
    minesLocation = [];
    revealedCount = 0;
    gameOver = false;
    seconds = 0;
    clearInterval(timerInterval);
    timerElement.textContent = '000';
    mineCountElement.textContent = MINES_COUNT;
    
    gridElement.innerHTML = '';
    for (let r = 0; r < ROWS; r++) {
        grid[r] = [];
        for (let c = 0; c < COLS; c++) {
            const cell = document.createElement('div');
            cell.classList.add('cell');
            cell.dataset.row = r;
            cell.dataset.col = c;
            
            cell.addEventListener('click', () => handleCellClick(r, c));
            cell.addEventListener('contextmenu', (e) => {
                e.preventDefault();
                handleCellRightClick(r, c);
            });
            
            gridElement.appendChild(cell);
            grid[r][c] = {
                element: cell,
                isMine: false,
                isRevealed: false,
                isFlagged: false,
                neighborMines: 0
            };
        }
    }

    // Place mines
    let minesPlaced = 0;
    while (minesPlaced < MINES_COUNT) {
        let r = Math.floor(Math.random() * ROWS);
        let c = Math.floor(Math.random() * COLS);
        if (!grid[r][c].isMine) {
            grid[r][c].isMine = true;
            minesLocation.push([r, c]);
            minesPlaced++;
        }
    }

    // Calculate neighbor mines
    for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
            if (!grid[r][c].isMine) {
                let count = 0;
                for (let dr = -1; dr <= 1; dr++) {
                    for (let dc = -1; dc <= 1; dc++) {
                        let nr = r + dr;
                        let nc = c + dc;
                        if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS && grid[nr][nc].isMine) {
                            count++;
                        }
                    }
                }
                grid[r][c].neighborMines = count;
            }
        }
    }

    timerInterval = setInterval(() => {
        seconds++;
        timerElement.textContent = seconds.toString().padStart(3, '0');
    }, 1000);
}

function handleCellClick(r, c) {
    if (gameOver || grid[r][c].isFlagged || grid[r][c].isRevealed) return;

    const cell = grid[r][c];
    cell.isRevealed = true;
    cell.element.classList.add('revealed');

    if (cell.isMine) {
        gameOver = true;
        revealAllMines();
        gameOver = true;
        clearInterval(timerInterval);
        alert("Game Over!");
        return;
    }

    revealedCount++;
    if (cell.neighborMines > 0) {
        cell.element.textContent = cell.neighborMines;
        cell.element.style.color = getNumberColor(cell.neighborMines);
    } else {
        // Recursive reveal
        for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
                let nr = r + dr;
                let nc = c + dc;
                if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS) {
                    handleCellClick(nr, nc);
                }
            }
        }
    }

    if (revealedCount === (ROWS * COLS) - MINES_COUNT) {
        gameOver = true;
        clearInterval(timerInterval);
        alert("You Win!");
    }
}

function handleCellRightClick(r, c) {
    if (gameOver || grid[r][c].isRevealed) return;
    const cell = grid[r][c];
    cell.isFlagged = !cell.isFlagged;
    cell.element.textContent = cell.isFlagged ? '🚩' : '';
}

function revealAllMines() {
    minesLocation.forEach(([r, c]) => {
        grid[r][c].element.classList.add('mine');
        grid[r][c].element.textContent = '💣';
    });
}

function getNumberColor(num) {
    const colors = [null, 'blue', 'green', 'red', 'darkblue', 'brown', 'cyan', 'black', 'darkred'];
    return colors[num];
}

resetBtn.addEventListener('click', initGame);

gridElement.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    const cell = e.target.closest('.cell');
    if (cell) {
        const r = parseInt(cell.dataset.row);
        const c = parseInt(cell.dataset.col);
        handleCellRightClick(r, c);
    }
});

initGame();
