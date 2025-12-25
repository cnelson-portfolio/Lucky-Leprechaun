const game = document.getElementById("game");
const player = document.getElementById("player");
const startScreen = document.getElementById("start-screen");

const scoreEl = document.getElementById("score");
const missesEl = document.getElementById("misses");

/* ---------------- GAME STATE ---------------- */

let score = 0;
let misses = 0;

let gameRunning = false;

let spawnInterval = null;
let difficultyInterval = null;

/* ---------------- PLAYER ---------------- */

let playerX = 50; // percent (0–100)
let velocity = 0;

const PLAYER_SPEED = 0.8;
const FRICTION = 0.9;

function updatePlayer() {
  playerX += velocity;
  velocity *= FRICTION;

  playerX = Math.max(0, Math.min(100, playerX));
  player.style.left = `${playerX}%`;

  if (gameRunning) {
    requestAnimationFrame(updatePlayer);
  }
}

/* ---------------- INPUT ---------------- */

// Keyboard
document.addEventListener("keydown", e => {
  if (!gameRunning) return;

  if (e.key === "ArrowLeft") velocity -= PLAYER_SPEED;
  if (e.key === "ArrowRight") velocity += PLAYER_SPEED;
});

// Tilt (smoothed & centered)
if (window.DeviceOrientationEvent) {
  window.addEventListener("deviceorientation", e => {
    if (!gameRunning || e.gamma === null) return;

    const tilt = Math.max(-20, Math.min(20, e.gamma)) / 20;
    velocity += tilt * PLAYER_SPEED;
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

startScreen.addEventListener("click", () => {
  startScreen.style.display = "none";
  startGame();
});

function startGame() {
  gameRunning = true;

  spawnInterval = setInterval(spawnObject, spawnRate);
  difficultyInterval = setInterval(increaseDifficulty, 5000);

  requestAnimationFrame(updatePlayer);
}
