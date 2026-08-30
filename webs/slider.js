class SliderPuzzle {
    constructor() {
        this.board = document.getElementById('board');
        this.movesDisplay = document.getElementById('moves');
        this.timeDisplay = document.getElementById('time');
        this.messageDisplay = document.getElementById('message');
        
        this.tiles = [1, 2, 3, 4, 5, 6, 7, 8, 0];
        this.moves = 0;
        this.timer = null;
        this.seconds = 0;
        this.started = false;
        
        this.tileElements = [];
        this.gapSize = 8;
        this.padding = 15;
        
        this.init();
    }
    
    getTileSize() {
        return this.board.offsetWidth - this.padding * 2 - this.gapSize * 2;
    }
    
    getGapSize() {
        return parseFloat(getComputedStyle(this.board).gap) || this.gapSize;
    }
    
    init() {
        this.tiles.forEach((value, i) => {
            const el = this.board.children[i];
            el.dataset.value = value;
            
            if (value === 0) {
                el.classList.add('empty');
                el.textContent = '';
            } else {
                el.addEventListener('click', () => this.handleTileClick(i));
                
                const correctPos = value - 1;
                if (i === correctPos) {
                    el.classList.add('correct');
                }
            }
            
            this.tileElements.push(el);
        });
        
        this.gapSize = this.getGapSize();
        this.positionAllTiles();
    }
    
    positionAllTiles() {
        const tileSize = this.getTileSize();
        
        this.tileElements.forEach((el, index) => {
            const row = Math.floor(index / 3);
            const col = index % 3;
            
            const x = this.padding + col * (tileSize + this.gapSize);
            const y = this.padding + row * (tileSize + this.gapSize);
            
            el.style.width = tileSize + 'px';
            el.style.height = tileSize + 'px';
            el.style.transform = `translate(${x}px, ${y}px)`;
        });
    }
    
    positionTile(el, index) {
        const tileSize = this.getTileSize();
        const row = Math.floor(index / 3);
        const col = index % 3;
        
        const x = this.padding + col * (tileSize + this.gapSize);
        const y = this.padding + row * (tileSize + this.gapSize);
        
        el.style.transform = `translate(${x}px, ${y}px)`;
    }
    
    getEmptyIndex() {
        return this.tiles.indexOf(0);
    }
    
    isAdjacent(idx1, idx2) {
        const row1 = Math.floor(idx1 / 3);
        const col1 = idx1 % 3;
        const row2 = Math.floor(idx2 / 3);
        const col2 = idx2 % 3;
        
        return (Math.abs(row1 - row2) + Math.abs(col1 - col2)) === 1;
    }
    
    handleTileClick(index) {
        const emptyIndex = this.getEmptyIndex();
        
        if (!this.isAdjacent(index, emptyIndex)) {
            return;
        }
        
        if (!this.started) {
            this.startTimer();
            this.started = true;
        }
        
        const tileEl = this.tileElements[index];
        const emptyEl = this.tileElements[emptyIndex];
        
        this.swapTiles(index, emptyIndex);
        
        this.tileElements[index] = emptyEl;
        this.tileElements[emptyIndex] = tileEl;
        
        this.moves++;
        this.movesDisplay.textContent = this.moves;
        
        this.positionTile(tileEl, emptyIndex);
        this.positionTile(emptyEl, index);
        
        this.updateClasses();
        
        setTimeout(() => {
            if (this.isSolved()) {
                this.stopTimer();
                this.showWin();
            }
        }, 260);
    }
    
    updateClasses() {
        this.tileElements.forEach((el, index) => {
            const value = this.tiles[index];
            
            if (value === 0) {
                el.classList.add('empty');
                el.textContent = '';
                el.onclick = null;
            } else {
                el.classList.remove('empty');
                el.textContent = value;
                
                if (!el.onclick) {
                    el.addEventListener('click', () => {});
                }
                
                const correctPos = value - 1;
                if (index === correctPos) {
                    el.classList.add('correct');
                } else {
                    el.classList.remove('correct');
                }
            }
        });
        
        this.board.children[0].onclick = () => this.handleTileClick(this.tiles.indexOf(this.board.children[0]?.dataset.value));
    }
    
    swapTiles(idx1, idx2) {
        [this.tiles[idx1], this.tiles[idx2]] = [this.tiles[idx2], this.tiles[idx1]];
    }
    
    isSolved() {
        for (let i = 0; i < 8; i++) {
            if (this.tiles[i] !== i + 1) {
                return false;
            }
        }
        return this.tiles[8] === 0;
    }
    
    shuffleBoard() {
        this.stopTimer();
        this.started = false;
        this.moves = 0;
        this.seconds = 0;
        this.movesDisplay.textContent = '0';
        this.timeDisplay.textContent = '00:00';
        this.messageDisplay.textContent = 'Shuffling...';
        this.messageDisplay.className = 'message visible shuffling';
        
        setTimeout(() => {
            do {
                this.randomShuffle();
            } while (this.isSolved());
            
            this.updateTileOrder();
            this.positionAllTiles();
            this.messageDisplay.className = 'message';
        }, 100);
    }
    
    updateTileOrder() {
        this.tiles.forEach((value, i) => {
            this.tileElements[i].dataset.value = value;
        });
    }
    
    randomShuffle() {
        for (let i = 0; i < 500; i++) {
            const emptyIndex = this.getEmptyIndex();
            const neighbors = [];
            
            const row = Math.floor(emptyIndex / 3);
            const col = emptyIndex % 3;
            
            if (row > 0) neighbors.push(emptyIndex - 3);
            if (row < 2) neighbors.push(emptyIndex + 3);
            if (col > 0) neighbors.push(emptyIndex - 1);
            if (col < 2) neighbors.push(emptyIndex + 1);
            
            const randomNeighbor = neighbors[Math.floor(Math.random() * neighbors.length)];
            this.swapTiles(emptyIndex, randomNeighbor);
        }
    }
    
    resetBoard() {
        this.stopTimer();
        this.started = false;
        this.moves = 0;
        this.seconds = 0;
        this.tiles = [1, 2, 3, 4, 5, 6, 7, 8, 0];
        this.movesDisplay.textContent = '0';
        this.timeDisplay.textContent = '00:00';
        this.messageDisplay.className = 'message';
        this.updateTileOrder();
        this.positionAllTiles();
        this.updateClasses();
    }
    
    startTimer() {
        this.started = true;
        this.timer = setInterval(() => {
            this.seconds++;
            const mins = String(Math.floor(this.seconds / 60)).padStart(2, '0');
            const secs = String(this.seconds % 60).padStart(2, '0');
            this.timeDisplay.textContent = `${mins}:${secs}`;
        }, 1000);
    }
    
    stopTimer() {
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
    }
    
    showWin() {
        this.messageDisplay.textContent = `Solved in ${this.moves} moves!`;
        this.messageDisplay.className = 'message visible won';
    }
}

const puzzle = new SliderPuzzle();

function shuffleBoard() {
    puzzle.shuffleBoard();
}

function resetBoard() {
    puzzle.resetBoard();
}
