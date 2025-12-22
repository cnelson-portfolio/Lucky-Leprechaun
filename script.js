const game = document.getElementById("game");
const timerEl = document.getElementById("timer");
const levelEl = document.getElementById("level");
const coinCountEl = document.getElementById("coinCount");
const instructionsEl = document.getElementById("instructions");
const coinSound = document.getElementById("coinSound");

let level = 1;
let coins = 0;
let timeLeft = 10;
let timer = null;
let gameStarted = false;
let bricks = [];

const BRICK_IMAGES = [
  "brick_0.svg",
  "brick_1.svg",
  "brick_2.svg",
  "brick_3.svg",
  "coin.svg"
];

const HITS_PER_STATE = 5;
const MAX_LEVEL = 10;

/* ---------- LOAD HIGH SCORE ---------- */
const highScoreTextEl = document.getElementById("highScoreText");

function loadHighScore() {
  const stored = JSON.parse(localStorage.getItem("highScore"));

  if (stored && stored.player && stored.score !== undefined) {
    highScoreTextEl.textContent = `${stored.player} ${stored.score}`;
  } else {
    highScoreTextEl.textContent = "—";
  }
}


/* ---------- TIMER ---------- */

function startTimer() {
  if (timer) return;

  timer = setInterval(() => {
    timeLeft--;
    timerEl.textContent = timeLeft;

    if (timeLeft <= 0) {
      endGame();
    }
  }, 1000);
}

/* ---------- BRICKS ---------- */

function createBrick() {
  const container = document.createElement("div");
  container.className = "breakable";

  const img = document.createElement("img");
  img.src = BRICK_IMAGES[0];

  const brick = {
    state: 0,
    hits: 0,
    element: img,
    container: container
  };

  img.addEventListener("click", () => handleTap(brick));

  container.appendChild(img);
  game.appendChild(container);

  bricks.push(brick);
}

function handleTap(brick) {
  if (!gameStarted) {
    gameStarted = true;
    instructionsEl.textContent = "Keep tapping the brick to break it";
    startTimer();
  }

  // Coin collected
  if (brick.state === BRICK_IMAGES.length - 1) {
    collectCoin(brick);
    return;
  }

  brick.hits++;

  if (brick.hits >= HITS_PER_STATE) {
    brick.hits = 0;
    brick.state++;
    brick.element.src = BRICK_IMAGES[brick.state];

    if (brick.state === BRICK_IMAGES.length - 1) {
      instructionsEl.textContent = "Tap the coin to collect it";
    }
  }
}

/* ---------- COINS ---------- */

function collectCoin(brick) {
  coinSound.play();
  coins++;
  coinCountEl.textContent = coins;

  // Hide visually (do NOT remove from DOM)
  brick.container.style.visibility = "hidden";
  brick.container.style.pointerEvents = "none";

  // Remove from game logic
  bricks = bricks.filter(b => b !== brick);

  if (bricks.length === 0) {
    nextLevel();
  }
}


/* ---------- LEVELS ---------- */

function nextLevel() {
  if (level >= MAX_LEVEL) {
    endGame();
    return;
  }

  level++;
  levelEl.textContent = `Level ${level}`;

  timeLeft += level * 10;
  timerEl.textContent = timeLeft;

  instructionsEl.textContent = "You've unlocked the next level! KEEP GOING!!!";

  gameStarted = false;
  clearInterval(timer);
  timer = null;

  bricks = [];
  game.innerHTML = "";

  const brickCount = level * level;

  const gridSize = level;
  game.style.gridTemplateColumns = `repeat(${gridSize}, 1fr)`;
  game.style.gridAutoRows = "1fr";

  for (let i = 0; i < brickCount; i++) {
    createBrick();
  }
}

/* ---------- RESET GAME ---------*/
function resetGame() {
  clearInterval(timer);
  timer = null;

  level = 1;
  coins = 0;
  timeLeft = 10;
  gameStarted = false;

  bricks = [];
  game.innerHTML = "";

  levelEl.textContent = "Level 1";
  timerEl.textContent = timeLeft;
  coinCountEl.textContent = coins;

  instructionsEl.textContent = "Tap the brick to begin";

  game.style.gridTemplateColumns = "repeat(1, 1fr)";

  createBrick();
}

/* ---------- GAME OVER ---------- */

function endGame() {
  clearInterval(timer);
  timer = null;

  const name = prompt("Game Over! Enter your name:");

  if (name) {
    const stored = JSON.parse(localStorage.getItem("highScore"));

    if (!stored || coins > stored.score) {
      const newHighScore = {
        player: name,
        score: coins
      };

      localStorage.setItem("highScore", JSON.stringify(newHighScore));
      highScoreTextEl.textContent = `${name} ${coins}`;
    }
  }


  alert("Thanks for playing!");
  resetGame();
}

/* ---------- INIT ---------- */

function startGame() {
  levelEl.textContent = `Level ${level}`;
  timerEl.textContent = timeLeft;
  coinCountEl.textContent = coins;

  const gridSize = level;
  game.style.gridTemplateColumns = `repeat(${gridSize}, 1fr)`;
  game.style.gridAutoRows = "1fr";

  createBrick();

}

window.addEventListener("load", () => {
  loadHighScore();
  startGame();
});

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("service-worker.js");
}

