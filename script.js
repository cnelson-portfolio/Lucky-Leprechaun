const game = document.getElementById("game");
const player = document.getElementById("player");
const startScreen = document.getElementById("start-screen");

const scoreEl = document.getElementById("score");
const missesEl = document.getElementById("misses");

const PLAYER_NORMAL_WIDTH = 96;
const PLAYER_SHRUNK_WIDTH = 48;
const SHRINK_DURATION = 3000; // ms

const HIGH_SCORE_KEY = "luckyHighScore"
/* ---------------- STATE ---------------- */

let gameRunning = false;

let score = 0;
let misses = 0;

let spawnInterval = null;
let difficultyInterval = null;

let shrinkTimeout = null;

let highScoreHandled = false;


/* ---------------- PLAYER ---------------- */

let playerX = 50;           // percent
let targetX = 50;           // where player wants to go
const SMOOTHING = 0.12;     // lower = smoother

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

const OBJECT_TYPES = [
  { type: "bad",   chance: 0.25 },
  { type: "bonus", chance: 0.05 },
  { type: "good",  chance: 0.7 }
];

function pickObjectType() {
  const r = Math.random();
  let sum = 0;

  for (const o of OBJECT_TYPES) {
    sum += o.chance;
    if (r < sum) return o.type;
  }

  return "good"; // fallback
}

let fallSpeed = 2;
let spawnRate = 1500;

function spawnObject() {
  if (!gameRunning) return;

  const type = pickObjectType();
  const obj = document.createElement("div");
  const isBad = (type === "bad")
  
  obj.className = `object ${type}`;
  obj.style.left = Math.random() * 90 + "%";
  game.appendChild(obj);

  let y = 0;

  const fall = setInterval(() => {
    y += fallSpeed;
    obj.style.top = `${y}px`;

    if (collision(obj, player)) {
      clearInterval(fall);
      obj.remove();
      handleCatch(type);
    }

    if (y > game.clientHeight) {
      clearInterval(fall);
      obj.remove();
      if (type === "good") handleMiss();
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

/* ---------------- SHRINK BAR ---------- */

function shrinkPlayer() {
  // Apply shrink
  player.style.width = `${PLAYER_SHRUNK_WIDTH}px`;

  // Reset timer if already shrinking
  if (shrinkTimeout) {
    clearTimeout(shrinkTimeout);
  }

  // Restore after delay
  shrinkTimeout = setTimeout(() => {
    player.style.width = `${PLAYER_NORMAL_WIDTH}px`;
    shrinkTimeout = null;
  }, SHRINK_DURATION);
}

/* ---------------- SCREEN TIMEOUT ------------ */

let wakeLock = null;

async function requestWakeLock() {
  try {
    wakeLock = await navigator.wakeLock.request("screen");

    wakeLock.addEventListener("release", () => {
      console.log("Wake Lock released");
    });

    console.log("Wake Lock active");
  } catch (err) {
    console.warn("Wake Lock failed:", err);
  }
}

function releaseWakeLock() {
  if (wakeLock) {
    wakeLock.release();
    wakeLock = null;
  }
}

/* ---------------- RESET GAME ------------ */

function resetGame() {
  score = 0;
  misses = 0;

  scoreEl.textContent = score;
  missesEl.textContent = misses;

  fallSpeed = 2;
  spawnRate = 1500;

  playerX = 50;
  targetX = 50;
  player.style.left = "50%";
  player.style.width = `${PLAYER_NORMAL_WIDTH}px`;

  neutralGamma = null;

  if (shrinkTimeout) {
    clearTimeout(shrinkTimeout);
    shrinkTimeout = null;
  }
}


/* ---------------- GAME OVER ----------------- */

function gameOver() {
  if (!gameRunning) return;

  gameRunning = false;

  clearInterval(spawnInterval);
  clearInterval(difficultyInterval);

  document.querySelectorAll(".object").forEach(o => o.remove());

  if (!highScoreHandled) {
    highScoreHandled = true;
    newHighScore();
  }

  releaseWakeLock();
  startScreen.style.display = "flex";
}



/* ---------------- GAME LOGIC ---------------- */

function handleCatch(type) {
  if (type === "bad") {
    shrinkPlayer();
    return;
  }

  if (type === "bonus") {
    score += 5;
  } else {
    score += 1;
  }

  scoreEl.textContent = score;
}



function handleMiss() {
  misses++;
  missesEl.textContent = misses;

  if (misses >= 5) {
    gameOver();
  }
}

/* ---------------- DIFFICULTY ---------------- */

function increaseDifficulty() {
  fallSpeed += 0.4;
  spawnRate = Math.max(500, spawnRate - 100);

  clearInterval(spawnInterval);
  spawnInterval = setInterval(spawnObject, spawnRate);
}

/* ---------- NEW HIGH SCORE --------------- */

function newHighScore() {
  const name = prompt("Game Over! Enter your name:");

    if (name) {
      const stored = JSON.parse(localStorage.getItem(HIGH_SCORE_KEY));

      if (!stored || score > stored.score) {
        const newHighScore = {
          player: name,
          score: score
        };

        localStorage.setItem(HIGH_SCORE_KEY, JSON.stringify(newHighScore));
        highScoreTextEl.textContent = `${name} ${score}`;
      }
    }
}

/* ---------- LOAD HIGH SCORE ---------- */
const highScoreTextEl = document.getElementById("highScoreText");

function loadHighScore() {
  const stored = JSON.parse(localStorage.getItem(HIGH_SCORE_KEY));

  if (stored && stored.player && stored.score !== undefined) {
    highScoreTextEl.textContent = `${stored.player} ${stored.score}`;
  } else {
    highScoreTextEl.textContent = "—";
  }
}

/* ---------------- START ---------------- */

startScreen.addEventListener("pointerdown", () => {
  if (gameRunning) return;

  startScreen.style.display = "none";
  requestWakeLock();
  startGame();
});

document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible" && wakeLock === null) {
    requestWakeLock();
  }
});

function startGame() {
  resetGame();
  loadHighScore();

  highScoreHandled = false; //  reset here

  gameRunning = true;

  neutralGamma = null;
  targetX = 50;
  playerX = 50;

  spawnInterval = setInterval(spawnObject, spawnRate);
  difficultyInterval = setInterval(increaseDifficulty, 5000);

  requestAnimationFrame(updatePlayer);
}

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("service-worker.js");
}
