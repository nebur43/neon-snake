const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');
const highScoreElement = document.getElementById('high-score');
const finalScoreElement = document.getElementById('final-score');
const startScreen = document.getElementById('start-screen');
const gameOverScreen = document.getElementById('game-over-screen');
const startBtn = document.getElementById('start-btn');
const restartBtn = document.getElementById('restart-btn');
const leaderboardList = document.getElementById('leaderboard-list');
const authContainer = document.getElementById('auth-container');
const userInfoPanel = document.getElementById('user-info');
const userAvatar = document.getElementById('user-avatar');
const displayNameElem = document.getElementById('display-name');
const logoutBtn = document.getElementById('logout-btn');
const googleLoginBtn = document.getElementById('google-login');

let currentUser = null;

// Firebase Configuration (received from user)
const firebaseConfig = {
    apiKey: "AIzaSyDPvz2uLxnmNxfCc9XMyoS3T1g45d8RUB4",
    authDomain: "snake-neon-1dddd.firebaseapp.com",
    projectId: "snake-neon-1dddd",
    storageBucket: "snake-neon-1dddd.firebasestorage.app",
    messagingSenderId: "819206866602",
    appId: "1:819206866602:web:8e4cb77aee5cd0464132d3",
    measurementId: "G-J5K26L249H"
};

// Initialize Firebase (SDK added to index.html)

// Game Constants
const GRID_SIZE = 20;
const TILE_COUNT = canvas.width / GRID_SIZE;
const GAME_SPEED = 100; // ms per frame

// Game State
let snake = [];
let foods = []; // Array to store multiple food items {x, y, type}
let dx = 0;
let dy = 0;
let score = 0;
let highScore = localStorage.getItem('snakeHighScore') || 0;
let isGameRunning = false;
let currentSpeed = GAME_SPEED;
let pendingGrowth = 0; // For growing snake by 30%
let changingDirection = false;

// Initialize High Score
highScoreElement.textContent = highScore;

// Input Handling
document.addEventListener('keydown', handleInput);
startBtn.addEventListener('click', startGame);
restartBtn.addEventListener('click', restartGame);
logoutBtn.addEventListener('click', () => firebase.auth().signOut());
googleLoginBtn.addEventListener('click', loginWithGoogle);

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const auth = firebase.auth();

// Auth State Listener
auth.onAuthStateChanged(user => {
    currentUser = user;
    if (user) {
        authContainer.classList.add('hidden');
        startBtn.classList.remove('hidden');
        userInfoPanel.classList.remove('hidden');

        userAvatar.src = user.photoURL || 'https://www.gravatar.com/avatar/0000?d=mp';
        displayNameElem.textContent = user.displayName || 'Player';
    } else {
        authContainer.classList.remove('hidden');
        startBtn.classList.add('hidden');
        userInfoPanel.classList.add('hidden');

        // Reset game state on logout
        isGameRunning = false;
        gameOverScreen.classList.add('hidden');
        startScreen.classList.remove('hidden');
        dx = 0; dy = 0; // Stop any current movement
    }
});

function loginWithGoogle() {
    const provider = new firebase.auth.GoogleAuthProvider();
    auth.signInWithPopup(provider).catch(error => console.error(error));
}

// Fetch leaderboard on load
fetchLeaderboard();

function fetchLeaderboard() {
    db.collection("highscores")
        .orderBy("score", "desc")
        .limit(10)
        .get()
        .then((querySnapshot) => {
            leaderboardList.innerHTML = "";
            let rank = 1;
            querySnapshot.forEach((doc) => {
                const data = doc.data();
                const entry = document.createElement('div');
                entry.className = 'leaderboard-entry';
                entry.innerHTML = `
                    <span class="rank">#${rank++}</span>
                    <span class="player-name">${data.name || 'Anonymous'}</span>
                    <span class="player-score">${data.score}</span>
                `;
                leaderboardList.appendChild(entry);
            });

            if (querySnapshot.empty) {
                leaderboardList.innerHTML = '<div class="loading">No scores yet. Be the first!</div>';
            }
        })
        .catch((error) => {
            console.error("Error getting leaderboard: ", error);
            leaderboardList.innerHTML = '<div class="loading">Error loading scores.</div>';
        });
}

function saveScore() {
    if (!currentUser) return; // Silent return if not logged in

    const saveStatus = document.getElementById('save-status');
    saveStatus.textContent = "SAVING SCORE...";
    saveStatus.style.color = "#888";

    db.collection("highscores").add({
        name: currentUser.displayName || "Anonymous",
        uid: currentUser.uid,
        score: score,
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
    })
        .then(() => {
            saveStatus.textContent = "SCORE SAVED!";
            saveStatus.style.color = "var(--primary-color)";
            fetchLeaderboard(); // Refresh leaderboard
        })
        .catch((error) => {
            console.error("Error adding document: ", error);
            saveStatus.textContent = "ERROR SAVING SCORE";
            saveStatus.style.color = "var(--secondary-color)";
        });
}

function startGame() {
    if (!currentUser) return; // Protect game start

    startScreen.classList.add('hidden');
    gameOverScreen.classList.add('hidden');
    resetGame();
    isGameRunning = true;
    gameLoopStep();
}

function restartGame() {
    startGame();
}

function resetGame() {
    // Start in the middle
    const startX = Math.floor(TILE_COUNT / 2);
    const startY = Math.floor(TILE_COUNT / 2);
    snake = [
        { x: startX, y: startY },
        { x: startX, y: startY + 1 },
        { x: startX, y: startY + 2 }
    ];
    // Start moving up
    dx = 0;
    dy = -1;
    score = 0;
    scoreElement.textContent = score;
    currentSpeed = GAME_SPEED; // Reset speed
    pendingGrowth = 0;
    changingDirection = false;

    // Initialize 1 food
    foods = [];
    spawnFood();
}

function handleInput(e) {
    if (!isGameRunning) return;
    console.log(e.key);
    if (changingDirection) return;

    // Prevent default scrolling for arrow keys
    if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].indexOf(e.code) > -1) {
        e.preventDefault();
    }

    switch (e.key) {
        case 'ArrowUp':
            if (dy === 1) return; // Can't move down if moving up
            dx = 0;
            dy = -1;
            changingDirection = true;
            break;
        case 'ArrowDown':
            if (dy === -1) return;
            dx = 0;
            dy = 1;
            changingDirection = true;
            break;
        case 'ArrowLeft':
            if (dx === 1) return;
            dx = -1;
            dy = 0;
            changingDirection = true;
            break;
        case 'ArrowRight':
            if (dx === -1) return;
            dx = 1;
            dy = 0;
            changingDirection = true;
            break;
    }
}

// Rewriting loop to use setTimeout for controlled game speed
function gameLoopStep() {
    if (!isGameRunning) return;

    setTimeout(() => {
        requestAnimationFrame(gameLoopStep);
        update();
        draw();
    }, currentSpeed);
}

function update() {
    // Move Snake
    const head = { x: snake[0].x + dx, y: snake[0].y + dy };

    // Check Wall Collision
    if (head.x < 0 || head.x >= TILE_COUNT || head.y < 0 || head.y >= TILE_COUNT) {
        gameOver();
        return;
    }

    // Check Self Collision
    for (let i = 0; i < snake.length; i++) {
        if (head.x === snake[i].x && head.y === snake[i].y) {
            gameOver();
            return;
        }
    }

    snake.unshift(head); // Add new head

    // Check Food Collision
    let ateFood = false;
    for (let i = 0; i < foods.length; i++) {
        if (head.x === foods[i].x && head.y === foods[i].y) {
            const eatenFood = foods[i];

            // Score handling
            const points = eatenFood.type === 'blue' ? 50 : 10;
            score += points;
            scoreElement.textContent = score;
            if (score > highScore) {
                highScore = score;
                highScoreElement.textContent = highScore;
                localStorage.setItem('snakeHighScore', highScore);
            }

            // Remove eaten food
            foods.splice(i, 1);

            if (eatenFood.type === 'blue') {
                // Blue Food Effects:
                // 1. Remove 50% of existing foods
                foods = foods.filter(() => Math.random() > 0.5);

                // 2. Reduce speed by 40% (increase delay)
                currentSpeed = currentSpeed / 0.6;

                // 3. Grow snake by 30%
                pendingGrowth += Math.floor(snake.length * 0.3);

                // Spawn 1 replacement food (optional, but good to ensure game continues)
                spawnFood();
            } else {
                // Normal Food Effects:
                // 1. Increase speed by 3%
                currentSpeed = currentSpeed * 0.97;

                // 2. Exponential growth: Spawn 2 new foods
                spawnFood();
                spawnFood();
            }

            ateFood = true;
            break; // Consume only one food per frame
        }
    }

    // Tail handling
    if (!ateFood) {
        if (pendingGrowth > 0) {
            pendingGrowth--; // Don't pop, effectively growing
        } else {
            snake.pop(); // Remove tail
        }
    }

    changingDirection = false;
}

function draw() {
    // Clear Canvas
    ctx.fillStyle = '#11111a'; // Match CSS game-bg
    ctx.fillRect(0, 0, canvas.width, canvas.height); // Clear but keep background color if transparent canvas wasn't used

    // Draw Foods
    foods.forEach(food => {
        if (food.type === 'blue') {
            ctx.fillStyle = '#0088ff'; // Neon Blue
            ctx.shadowColor = '#0088ff';
        } else {
            ctx.fillStyle = '#ff0055'; // Neon Red
            ctx.shadowColor = '#ff0055';
        }
        ctx.shadowBlur = 15;
        ctx.fillRect(food.x * GRID_SIZE, food.y * GRID_SIZE, GRID_SIZE - 2, GRID_SIZE - 2);
    });

    // Draw Snake
    ctx.fillStyle = '#00ff88';
    ctx.shadowBlur = 10;
    ctx.shadowColor = '#00ff88';

    snake.forEach((segment, index) => {
        // Head is slightly different color or brightness?
        if (index === 0) {
            ctx.fillStyle = '#ccffdd';
        } else {
            ctx.fillStyle = '#00ff88';
        }
        ctx.fillRect(segment.x * GRID_SIZE, segment.y * GRID_SIZE, GRID_SIZE - 2, GRID_SIZE - 2);
    });

    // Reset shadow for performance? or next frame
    ctx.shadowBlur = 0;
}

function spawnFood() {
    let food = { x: 0, y: 0, type: 'normal' };

    // 10% chance for Blue Food
    if (Math.random() < 0.10) {
        food.type = 'blue';
    }

    let validPosition = false;
    while (!validPosition) {
        food.x = Math.floor(Math.random() * TILE_COUNT);
        food.y = Math.floor(Math.random() * TILE_COUNT);

        validPosition = true;
        // Check against snake
        for (let segment of snake) {
            if (segment.x === food.x && segment.y === food.y) {
                validPosition = false;
                break;
            }
        }
        // Check against other foods
        if (validPosition) {
            for (let existingFood of foods) {
                if (existingFood.x === food.x && existingFood.y === food.y) {
                    validPosition = false;
                    break;
                }
            }
        }
    }
    foods.push(food);
}

function gameOver() {
    isGameRunning = false;
    finalScoreElement.textContent = score;
    gameOverScreen.classList.remove('hidden');
    saveScore(); // Auto-save score on game over
}
