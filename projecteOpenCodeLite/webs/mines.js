const difficulties = {
    Beginner: { rows: 10, cols: 10, mines: 10 },
    Intermediate: { rows: 16, cols: 16, mines: 40 },
    Expert: { rows: 16, cols: 30, mines: 99 }
};
let currentDifficulty = difficulties.Beginner;

const gridElement = document.getElementById('grid');
const mineCountDisplay = document.getElementById('mine-count');
const resetBtn = document.getElementById('reset-btn');

let grid = [];
let revealedCount = 0;
let gameOver = false;
let minesLocation = [];

function initGame() {
    gridElement.innerHTML = '';
    grid = [];
    revealedCount = 0;
    gameOver = false;
    minesLocation = [];
    
    mineCountDisplay.textContent = `Mines: ${currentDifficulty.mines}`;
    gridElement.style.gridTemplateColumns = `repeat(${currentDifficulty.cols}, 30px)`;
    gridElement.style.gridTemplateRows = `repeat(${currentDifficulty.rows}, 30px)`;

    // Create grid array
    for (let r = 0; r < currentDifficulty.rows; r++) {
        grid[r] = [];
        for (let c = 0; c < currentDifficulty.cols; c++) {
            const cell = {
                isMine: false,
                isRevealed: false,
                isFlagged: false,
                neighborMines: 0,
                element: null
            };
            
            const div = document.createElement('div');
            div.classList.add('cell');
            div.style.cursor = 'pointer';
            
            div.addEventListener('click', () => clickCell(r, c));
            div.addEventListener('contextmenu', (e) => {
                e.preventDefault();
                toggleFlag(r, c);
            });

            cell.element = div;
            grid[r][c] = cell;
            gridElement.appendChild(div);
        }
    }

    // Place mines
    let placedMines = 0;
    while (placedMines < currentDifficulty.mines) {
        const r = Math.floor(Math.random() * currentDifficulty.rows);
        const c = Math.floor(Math.random() * currentDifficulty.cols);
        if (!grid[r][c].isMine) {
            grid[r][c].isMine = true;
            minesLocation.push([r, c]);
            placedMines++;
        }
    }

    // Calculate neighbor mines
    for (let r = 0; r < currentDifficulty.rows; r++) {
        for (let c = 0; c < currentDifficulty.cols; c++) {
            if (grid[r][c].isMine) continue;
            let count = 0;
            for (let dr = -1; dr <= 1; dr++) {
                for (let dc = -1; dc <= 1; dc++) {
                    const nr = r + dr;
                    const nc = c + dc;
                    if (nr >= 0 && nr < currentDifficulty.rows && nc >= 0 && nc < currentDifficulty.cols && grid[nr][nc].isMine) {
                        count++;
                    }
                }
            }
            grid[r][c].neighborMines = count;
        }
    }
}

function clickCell(r, c) {
    const cell = grid[r][c];
    if (gameOver || cell.isRevealed || cell.isFlagged) return;

    if (cell.isMine) {
        gameOver = true;
        cell.element.textContent = '💣';
        cell.element.style.backgroundColor = 'red';
        alert('Game Over!');
        return;
    }

    revealCell(r, c);

    if (revealedCount === (currentDifficulty.rows * currentDifficulty.cols) - currentDifficulty.mines) {
        gameOver = true;
        alert('You Win!');
    }
}

function revealCell(r, c) {
    const cell = grid[r][c];
    if (cell.isRevealed || cell.isFlagged || cell.isMine) return;

    cell.isRevealed = true;
    revealedCount++;
    
    if (cell.neighborMines === 0) {
        for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
                const nr = r + dr;
                const nc = c + dc;
                if (nr >= 0 && nr < currentDifficulty.rows && nc >= 0 && nc < currentDifficulty.cols) {
                    revealCell(nr, nc);
                }
            }
        }
    }

    if (cell.neighborMines > 0) {
        cell.element.textContent = cell.neighborMines;
        cell.element.style.backgroundColor = '#ddd';
    } else {
        cell.element.style.backgroundColor = '#eee';
    }
    
    cell.element.style.border = '1px solid #ccc';
}

function toggleFlag(r, c) {
    const cell = grid[r][c];
    if (gameOver || cell.isRevealed) return;

    cell.isFlagged = !cell.isFlagged;
    cell.element.textContent = cell.isFlagged ? '🚩' : '';
    cell.element.style.backgroundColor = cell.isFlagged ? '#ffcc00' : '';
}

resetBtn.addEventListener('click', initGame);
window.addEventListener('load', initGame);

function setDifficulty(type) {
    if (difficulties[type]) {
        currentDifficulty = difficulties[type];
        mineCountDisplay.textContent = `Mines: ${currentDifficulty.mines}`;
        initGame();
    }
}

document.getElementById('beginner').addEventListener('click', () => setDifficulty('Beginner'));
document.getElementById('intermediate').addEventListener('click', () => setDifficulty('Intermediate'));
document.getElementById('expert').addEventListener('click', () => setDifficulty('Expert'));
