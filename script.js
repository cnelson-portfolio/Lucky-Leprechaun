const game = document.getElementById("game");
const player = document.getElementById("player");
const startScreen = document.getElementById("start-screen");

const scoreEl = document.getElementById("score");
const missesEl = document.getElementById("misses");

/* ---------------- STATE ---------------- */

let gameRunning = false;

let score = 0;
let misses = 0;

let spawnInterval = null;
let difficultyInterval = null;

/* ---------------- PLAYER ---------------- */

let playerX = 50;           // percent
let targetX = 50;           // where player wants to go
const SMOOTHING = 0.09;     // lower = smoother

function updatePlayer() {
  if (!gameRunning) return;

  playerX += (targetX - playerX) * SMOOTHING;
  playerX = Math.max(0, Math.min(100, playerX));
  player.style.left = `${playerX}%`;

  requestAnimationFrame(updatePlayer);
}

/* ---------------- INPUT ---------------- */

// Keyboard
document.addEventListener("keydown", e => {
  if (!gameRunning) return;

  if (e.key === "ArrowLeft") targetX -= 4;
  if (e.key === "ArrowRight") targetX += 4;
});

/* ---- TILT (CALIBRATED) ---- */

let neutralGamma = null;

if (window.DeviceOrientationEvent) {
  window.addEventListener("deviceorientation", e => {
    if (!gameRunning || e.gamma == null) return;

    if (neutralGamma === null) {
      neutralGamma = e.gamma; // capture baseline
      return;
    }

    const delta = e.gamma - neutralGamma;

    // Clamp + scale gently
    const normalized = Math.max(-15, Math.min(15, delta)) / 15;

    targetX = 50 + normalized * 40;
  });
}

/* ---------------- OBJECTS ---------------- */

let fallSpeed = 2;
let spawnRate = 1500;

function spawnObject() {
  if (!gameRunning) return;

  const obj = document.createElement("div");
  const isBad = Math.random() < 0.25;

  obj.className = `object ${isBad ? "bad" : "good"}`;
  obj.style.left = Math.random() * 90 + "%";
  game.appendChild(obj);

  let y = 0;

  const fall = setInterval(() => {
    y += fallSpeed;
    obj.style.top = `${y}px`;

    if (collision(obj, player)) {
      clearInterval(fall);
      obj.remove();
      handleCatch(isBad);
    }

    if (y > game.clientHeight) {
      clearInterval(fall);
      obj.remove();
      if (obj.className === `object bad`) return;
      handleMiss();
    }
  }, 16);
}

function collision(a, b) {
  const r1 = a.getBoundingClientRect();
  const r2 = b.getBoundingClientRect();

  return !(
    r1.bottom < r2.top ||
    r1.top > r2.bottom ||
    r1.right < r2.left ||
    r1.left > r2.right
  );
}

/* ---------------- GAME LOGIC ---------------- */

function handleCatch(isBad) {
  score += isBad ? -1 : 1;
  scoreEl.textContent = score;
}

function handleMiss() {
  misses++;
  missesEl.textContent = misses;

  if (misses >= 5) {
    alert("Game Over!");
    location.reload();
  }
}

/* ---------------- DIFFICULTY ---------------- */

function increaseDifficulty() {
  fallSpeed += 0.4;
  spawnRate = Math.max(500, spawnRate - 100);

  clearInterval(spawnInterval);
  spawnInterval = setInterval(spawnObject, spawnRate);
}

/* ---------------- START ---------------- */

startScreen.addEventListener("pointerdown", () => {
  if (gameRunning) return;

  startScreen.style.display = "none";
  startGame();
});

function startGame() {
  gameRunning = true;

  neutralGamma = null; // reset calibration
  targetX = 50;
  playerX = 50;

  spawnInterval = setInterval(spawnObject, spawnRate);
  difficultyInterval = setInterval(increaseDifficulty, 5000);

  requestAnimationFrame(updatePlayer);
}
