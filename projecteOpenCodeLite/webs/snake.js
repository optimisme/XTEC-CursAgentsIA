const CANVAS_SIZE = 400;
const GRID_SIZE = 20;
const TILE_COUNT = CANVAS_SIZE / GRID_SIZE;

let canvas, ctx;
let snake = [];
let food = { x: 0, y: 0 };
let dx = 0;
let dy = 0;
let score = 0;
let gameRunning = false;
let gameLoopId = null;
let frame = 0;
const MOVES_PER_SECOND = 6;
const FPS = 30;

function init() {
  canvas = document.getElementById('gameCanvas');
  ctx = canvas.getContext('2d');

  snake = [
    { x: Math.floor(TILE_COUNT / 2), y: Math.floor(TILE_COUNT / 2) }
  ];
  food = { x: 0, y: 0 };
  dx = 1;
  dy = 0;
  score = 0;
  gameRunning = true;

  placeFood();

  document.getElementById('gameOver').style.display = 'none';
  document.getElementById('score').textContent = '0';

  if (gameLoopId) clearInterval(gameLoopId);
  gameLoopId = setInterval(gameLoop, 1000 / FPS);
}

function placeFood() {
  let newFood;
  let onSnake;
  do {
    newFood = {
      x: Math.floor(Math.random() * TILE_COUNT),
      y: Math.floor(Math.random() * TILE_COUNT)
    };
    onSnake = snake.some(function(seg) {
      return seg.x === newFood.x && seg.y === newFood.y;
    });
  } while (onSnake);
  food = newFood;
}

function draw() {
  ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

  snake.forEach(function(seg) {
    ctx.fillStyle = 'green';
    ctx.fillRect(seg.x * GRID_SIZE, seg.y * GRID_SIZE, GRID_SIZE - 1, GRID_SIZE - 1);
  });

  ctx.fillStyle = 'red';
  ctx.beginPath();
  ctx.arc(
    food.x * GRID_SIZE + GRID_SIZE / 2,
    food.y * GRID_SIZE + GRID_SIZE / 2,
    GRID_SIZE / 2 - 1,
    0,
    Math.PI * 2
  );
  ctx.fill();
}

function update() {
  if (!gameRunning) return;

  var head = { x: snake[0].x + dx, y: snake[0].y + dy };

  if (head.x < 0 || head.x >= TILE_COUNT || head.y < 0 || head.y >= TILE_COUNT) {
    gameRunning = false;
    drawGameOver();
    return;
  }

  if (snake.some(function(seg) {
    return seg.x === head.x && seg.y === head.y;
  })) {
    gameRunning = false;
    drawGameOver();
    return;
  }

  snake.unshift(head);

  if (head.x === food.x && head.y === food.y) {
    score++;
    document.getElementById('score').textContent = String(score);
    placeFood();
  } else {
    snake.pop();
  }
}

function gameLoop() {
  frame++;
  draw();
  if (frame % Math.round(FPS / MOVES_PER_SECOND) === 0) {
    update();
  }
}

function drawGameOver() {
  if (gameLoopId) clearInterval(gameLoopId);
  document.getElementById('gameOver').style.display = 'block';
}

function handleKeydown(e) {
  var key = e.key.toLowerCase();

  if ((key === 'arrowup' || key === 'w') && dy !== 1) {
    dx = 0; dy = -1;
  } else if ((key === 'arrowdown' || key === 's') && dy !== -1) {
    dx = 0; dy = 1;
  } else if ((key === 'arrowleft' || key === 'a') && dx !== 1) {
    dx = -1; dy = 0;
  } else if ((key === 'arrowright' || key === 'd') && dx !== -1) {
    dx = 1; dy = 0;
  }
}

document.addEventListener('DOMContentLoaded', function() {
  document.addEventListener('keydown', handleKeydown);
  document.getElementById('playAgain').addEventListener('click', function() {
    init();
  });
  init();
});
