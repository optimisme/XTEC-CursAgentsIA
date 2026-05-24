function drawClock() {
  const canvas = document.getElementById('clock');
  const ctx = canvas.getContext('2d');
  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2;
  const radius = Math.min(centerX, centerY) - 10;

  // Clear canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Draw clock face
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
  ctx.fillStyle = '#f0f0f0';
  ctx.fill();
  ctx.strokeStyle = '#333';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Draw numbers
  for (let i = 1; i <= 12; i++) {
    const angle = (i * 30) * Math.PI / 180;
    const x = centerX + (radius - 10) * Math.cos(angle);
    const y = centerY + (radius - 10) * Math.sin(angle);
    ctx.fillStyle = '#000';
    ctx.fillText(i, x, y);
  }

  // Draw hands
  const now = new Date();
  const sec = now.getSeconds();
  const min = now.getMinutes();
  const hr = now.getHours();

  // Seconds
  const secAngle = (sec * 6) * Math.PI / 180;
  drawHand(ctx, centerX, centerY, radius, secAngle, 5);

  // Minutes
  const minAngle = (min * 6 + sec * 0.1) * Math.PI / 180;
  drawHand(ctx, centerX, centerY, radius, minAngle, 4);

  // Hours
  const hrAngle = (hr * 30 + min * 0.5) * Math.PI / 180;
  drawHand(ctx, centerX, centerY, radius, hrAngle, 3);
}

function drawHand(ctx, centerX, centerY, radius, angle, length) {
  ctx.beginPath();
  ctx.moveTo(centerX, centerY);
  ctx.lineTo(
    centerX + (radius - length) * Math.cos(angle),
    centerY + (radius - length) * Math.sin(angle)
  );
  ctx.strokeStyle = '#000';
  ctx.lineWidth = 2;
  ctx.stroke();
}