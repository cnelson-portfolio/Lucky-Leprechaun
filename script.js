const game = document.getElementById("game");
const player = document.createElement("div");
player.id = "player";
game.appendChild(player);
player.style.outline = "3px solid red";


const scoreEl = document.getElementById("score");
const missesEl = document.getElementById("misses");
const rotateNotice = document.getElementById("rotateNotice");

let score = 0;
let misses = 0;

let playerX = 50;
let speed = 2;
let spawnRate = 1500;

const MAX_MISSES = 5;
const PLAYER_SPEED = 3;

/* ---------------- INPUT ---------------- */

// Keyboard
document.addEventListener("keydown", e => {
  if (e.key === "ArrowLeft") movePlayer(-PLAYER_SPEED);
  if (e.key === "ArrowRight") movePlayer(PLAYER_SPEED);
});

// Tilt (mobile)
if (window.DeviceOrientationEvent) {
  window.addEventListener("deviceorientation", e => {
    if (e.gamma !== null) {
      movePlayer(e.gamma * 0.1);
    }
  });
}

function movePlayer(delta) {
  playerX = Math.max(0, Math.min(100, playerX + delta));
  player.style.left = `${playerX}%`;
}

/* ---------------- OBJECTS ---------------- */

function spawnObject() {
  const obj = document.createElement("div");
  const isBad = Math.random() < 0.25;

  obj.className = `object ${isBad ? "bad" : "good"}`;
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

  if (misses >= MAX_MISSES) {
    alert("Game Over!");
    location.reload();
  }
}

/* ---------------- DIFFICULTY ---------------- */

function increaseDifficulty() {
  speed += 0.5;
  spawnRate = Math.max(500, spawnRate - 100);
}

/* ---------------- ORIENTATION ---------------- */

function checkOrientation() {
  const landscape = window.innerWidth > window.innerHeight;
  rotateNotice.style.display = landscape ? "none" : "flex";
}

window.addEventListener("resize", checkOrientation);
checkOrientation();

/* ---------------- START ---------------- */

setInterval(spawnObject, spawnRate);
setInterval(increaseDifficulty, 5000);
