const game = document.getElementById("game");
const player = document.getElementById("player");
const scoreEl = document.getElementById("score");
const missesEl = document.getElementById("misses");

/* ---------------- GAME STATE ---------------- */

let score = 0;
let misses = 0;
let speed = 2;
let spawnRate = 1500;
let gameRunning = false;

const MAX_MISSES = 5;
const PLAYER_SPEED = 2;

/* ---------------- PLAYER POSITION ---------------- */

let playerX = 50; // percent (0–100)
player.style.left = "50%";

/* ---------------- START OVERLAY ---------------- */

const startOverlay = document.createElement("div");
startOverlay.id = "startOverlay";
startOverlay.textContent = "Tap to Start";
document.body.appendChild(startOverlay);

startOverlay.addEventListener("click", startGame);

/* ---------------- INPUT: KEYBOARD ---------------- */

document.addEventListener("keydown", e => {
  if (!gameRunning) return;

  if (e.key === "ArrowLeft") movePlayer(-PLAYER_SPEED);
  if (e.key === "ArrowRight") movePlayer(PLAYER_SPEED);
});

/* ---------------- INPUT: TILT (Z-AXIS) ---------------- */

let baseAlpha = null;
let tiltVelocity = 0;

if (window.DeviceOrientationEvent) {
  window.addEventListener("deviceorientation", e => {
    if (!gameRunning) return;
    if (e.alpha === null) return;

    // Capture neutral steering position
    if (baseAlpha === null) {
      baseAlpha = e.alpha;
      return;
    }

    // Calculate delta with wrap correction
    let delta = e.alpha - baseAlpha;
    if (delta > 180) delta -= 360;
    if (delta < -180) delta += 360;

    // Normalize (-1 to 1)
    let normalized = Math.max(-30, Math.min(30, delta)) / 30;

    // Dead zone
    if (Math.abs(normalized) < 0.05) normalized = 0;

    // Smooth steering
    tiltVelocity = tiltVelocity * 0.8 + normalized * 0.2;
    movePlayer(tiltVelocity * 2);
  });
}

/* ---------------- PLAYER MOVEMENT ---------------- */

function movePlayer(delta) {
  playerX = Math.max(0, Math.min(100, playerX + delta));
  player.style.left = `${playerX}%`;
}

/* ---------------- OBJECT SPAWNING ---------------- */

function spawnObject() {
  if (!gameRunning) return;

  const obj = document.createElement("div");
  const isBad = Math.random() < 0.25;

  obj.className = `object ${isBad ? "bad" : "good"}`;
  obj.dataset.bad = isBad;
  obj.style.left = Math.random() * 90 + "%";

  game.appendChild(obj);

  let y = 0;

  const fall = setInterval(() => {
    y += speed;
    obj.style.top = `${y}px`;

    if (collision(obj, player)) {
      clearInterval(fall);
      obj.remove();
      handleCatch(isBad);
    }

    if (y > game.clientHeight) {
      clearInterval(fall);
      obj.remove();
      if (!isBad) handleMiss(); // bad objects do NOT count as misses
    }
  }, 16);
}

/* ---------------- COLLISION ---------------- */

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

  if (misses >= MAX_MISSES) {
    alert("Game Over!");
    location.reload();
  }
}

/* ---------------- DIFFICULTY ---------------- */

function increaseDifficulty() {
  if (!gameRunning) return;

  speed += 0.4;
  spawnRate = Math.max(500, spawnRate - 100);

  clearInterval(spawnInterval);
  spawnInterval = setInterval(spawnObject, spawnRate);
}

/* ---------------- START GAME ---------------- */

let spawnInterval;
let difficultyInterval;

function startGame() {
  startOverlay.remove();
  gameRunning = true;

  spawnInterval = setInterval(spawnObject, spawnRate);
  difficultyInterval = setInterval(increaseDifficulty, 5000);
}
