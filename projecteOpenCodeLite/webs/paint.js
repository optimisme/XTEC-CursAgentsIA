const canvas = document.getElementById('paintCanvas');
const ctx = canvas.getContext('2d');
const colorPicker = document.getElementById('colorPicker');
const brushSizeSlider = document.getElementById('brushSize');
const brushSizeDisplay = document.getElementById('brushSizeValue');
const eraserBtn = document.getElementById('eraserBtn');
const clearBtn = document.getElementById('clearBtn');

let isDrawing = false;
let currentBrushSize = 5;
let isEraserMode = false;

// Set default values
ctx.lineCap = 'round';
ctx.lineJoin = 'round';
brushSizeDisplay.textContent = currentBrushSize;

// Update brush size display
brushSizeSlider.addEventListener('input', (e) => {
    currentBrushSize = parseInt(e.target.value, 10);
    brushSizeDisplay.textContent = currentBrushSize;
});

// Toggle eraser mode
eraserBtn.addEventListener('click', () => {
    isEraserMode = !isEraserMode;
    eraserBtn.classList.toggle('active', isEraserMode);
    ctx.globalCompositeOperation = isEraserMode ? 'destination-out' : 'source-over';
});

// Clear canvas
clearBtn.addEventListener('click', () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
});

// Handle mouse events
canvas.addEventListener('mousedown', (e) => {
    isDrawing = true;
    ctx.beginPath();
    ctx.moveTo(e.offsetX, e.offsetY);
});

canvas.addEventListener('mousemove', (e) => {
    if (!isDrawing) return;
    ctx.strokeStyle = colorPicker.value;
    ctx.lineWidth = currentBrushSize;
    ctx.lineTo(e.offsetX, e.offsetY);
    ctx.stroke();
});

window.addEventListener('mouseup', () => {
    isDrawing = false;
});

// Save canvas as PNG
const saveBtn = document.getElementById('saveBtn');
saveBtn.addEventListener('click', () => {
    const dataURL = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.href = dataURL;
    link.download = 'paint.png';
    link.click();
    link.remove();
});
