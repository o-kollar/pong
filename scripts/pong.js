const canvas = document.getElementById('pongCanvas');
const ctx = canvas.getContext('2d');

// Define the environment

let Red = new Agent(data.gameConfig.env, data.agentConfig);
let Blue = new Agent(data.gameConfig.env, data.agentConfig);

function loadAgent() {
    Red.buildNet();
    Blue.buildNet();
    data.gameConfig.scoreLeft = 0;
    data.gameConfig.scoreRight = 0;
    data.gameConfig.touchLeft;
    data.gameConfig.scores = [0, 0];
}

// Initialize game elements
let ball, paddleLeft, paddleRight;
let previousPaddleLeftY = canvas.height / 2 - 50;
let previousPaddleRightY = canvas.height / 2 - 50;

function initializeGame() {
    // Set initial positions for ball and paddles
    ball = { x: canvas.width / 2, y: canvas.height / 2, radius: 4, dx: 5, dy: 5 };
    paddleLeft = { x: 10, y: canvas.height / 2 - 50, width: 6, height: 35 };
    paddleRight = { x: canvas.width - 20, y: canvas.height / 2 - 50, width: 6, height: 35 };
}

// Main game loop
function gameLoop() {
    update();
    draw();

    setTimeout(gameLoop, data.gameConfig.gameSpeed);
}

// Update game state
function update() {
    moveBall();
    movePaddles();
    handleCollisions();
}

// Move the ball
// Move the ball
// Move the ball
function moveBall() {
    // Apply acceleration to the ball
    ball.dx *= 1.01; // Increase horizontal speed over time
    ball.dy *= 1.01; // Increase vertical speed over time

    // Apply friction to slow down the horizontal velocity gradually
    const friction = 0.99;
    if (Math.abs(ball.dx) > 0.1) {
        // Apply friction only if the ball is moving significantly horizontally
        ball.dx *= friction;
    }
    ball.dy *= friction; // Apply friction to vertical velocity regardless

    // Update the ball's position based on its velocity
    ball.x += ball.dx;
    ball.y += ball.dy;

    // Check for collisions with the top and bottom walls
    if (ball.y - ball.radius < 0 || ball.y + ball.radius > canvas.height) {
        ball.dy = -ball.dy; // Reverse the vertical velocity
    }
}

// Function to update previous paddle positions
function updatePreviousPaddlePositions() {
    previousPaddleLeftY = paddleLeft.y;
    previousPaddleRightY = paddleRight.y;
}

// Function to get game state
function getGameState(paddle, opponentPaddle, previousPaddleY) {
    return [
        ball.y, // Ball y-position
        ball.x, // Ball x-position
        ball.dx, // Ball x-velocity
        ball.dy, // Ball y-velocity
        paddle.y, // Paddle y-position
        (paddle.y - ball.y) / canvas.height, // Paddle relative y-position
        paddle.y - previousPaddleY, // Paddle movement direction
        (opponentPaddle.y - ball.y) / canvas.height, // Opponent paddle relative y-position
    ];
}

function movePaddles() {
    // Get actions from agents
    const RedState = getGameState(paddleLeft, paddleRight, previousPaddleLeftY);
    const BlueState = getGameState(paddleRight, paddleLeft, previousPaddleRightY);

    const action1 = Red.act(RedState);
    const action2 = Blue.act(BlueState);

    // Update previous paddle positions
    updatePreviousPaddlePositions();

    // Move left paddle
    movePaddle(action1, paddleLeft, previousPaddleLeftY);

    // Move right paddle
    movePaddle(action2, paddleRight, previousPaddleRightY);
}

// Function to move paddle
function movePaddle(action, paddle) {
    // Check if the player is controlling the paddle
    // Move paddle based on AI action
    if (action === 0 && paddle.y > 0) {
        paddle.y -= 10; // Move the paddle up
    }
    if (action === 1 && paddle.y < canvas.height - paddle.height) {
        paddle.y += 10; // Move the paddle down
    }
}

// Calculate distance between the ball and a paddle
function calculateDistance(ballX, paddleX) {
    return Math.abs(ballX - paddleX);
}

// Calculate reward based on score and distance
function calculateReward(score, distance) {
    return -(score / 10000) * distance;
}

let reward1 = [];
let reward2 = [];

// Function to handle collisions and update rewards
function handleCollisions() {
    const distToLeftPaddle = calculateDistance(ball.x, paddleLeft.x);
    const distToRightPaddle = calculateDistance(ball.x, paddleRight.x);

    const RewardLeft = calculateReward(data.gameConfig.scoreRight, distToLeftPaddle);
    const RewardRight = calculateReward(data.gameConfig.scoreLeft, distToRightPaddle);

    // Function to update rewards and learning for agents
    function updateRewardsAndLearning(agent, rewardArray, score, touched, points) {
        if (rewardArray < 1) {
            agent.learn(points / 1000);
        }
    }

    // Check collision with left paddle
    if (ball.x - ball.radius <= paddleLeft.x + paddleLeft.width && ball.y >= paddleLeft.y && ball.y <= paddleLeft.y + paddleLeft.height) {
        data.gameConfig.touchLeft = true;
        ball.dx = Math.abs(ball.dx) + 0.5; // Increase horizontal velocity and reverse direction
        ball.dy *= 1; // Increase vertical velocity slightly
        updateRewardsAndLearning(Red, data.gameConfig.winLeft, RewardLeft, data.gameConfig.touchedRight, data.gameConfig.scoreLeft);
    }

    // Check collision with right paddle
    if (ball.x + ball.radius >= paddleRight.x && ball.y >= paddleRight.y && ball.y <= paddleRight.y + paddleRight.height) {
        data.gameConfig.touchedRight = true;
        ball.dx = -Math.abs(ball.dx) - 0.5; // Increase horizontal velocity and reverse direction
        ball.dy *= 1; // Increase vertical velocity slightly
        updateRewardsAndLearning(Blue, data.gameConfig.winRight, RewardRight, data.gameConfig.touchLeft, data.gameConfig.scoreRight);
    }

    // Score points and reset ball position if it goes out of bounds
    function scoreAndResetBall(agent, rewardArray, score) {
        if (rewardArray < 1) {
            agent.learn(score);
        }
        resetBall();
    }

    if (ball.x - ball.radius < 0) {
        if (data.gameConfig.scoreRight < 100) {
            if (data.gameConfig.scoreLeft > 0) {
                data.gameConfig.scoreLeft--;
            }
            data.gameConfig.scores[1]++;
            data.gameConfig.scoreRight++;
        } else {
            data.gameConfig.scoreRight = 0;
            data.gameConfig.winRight++;
            if (data.gameConfig.winRight > data.gameConfig.winLeft) {
                data.gameConfig.iterationRight++;
                if(data.gameConfig.scoreLeft < 0.3){
                    Red.buildNet();
                }
                data.gameConfig.iterationLeft = 0;
                data.gameConfig.winRight = 0;
                data.gameConfig.scores = [0, 0];
            }
        }

        scoreAndResetBall(Red, data.gameConfig.winLeft, RewardLeft);
    } else if (ball.x + ball.radius > canvas.width) {
        if (data.gameConfig.scoreLeft < 100) {
            data.gameConfig.scoreLeft++;
            if (data.gameConfig.scoreRight > 0) {
                data.gameConfig.scoreRight--;
            }
            data.gameConfig.scores[0]++;
        } else {
            data.gameConfig.scoreLeft = 0;
            data.gameConfig.winLeft++;
            if (data.gameConfig.winLeft > data.gameConfig.winRight) {
                data.gameConfig.iterationLeft++;
                if(data.gameConfig.scoreRight < 0.3){
                    Blue.buildNet();
                }
                
                data.gameConfig.iterationRight = 0;
                data.gameConfig.winLeft = 0;
                data.gameConfig.scores = [0, 0];
            }
        }

        scoreAndResetBall(Blue, data.gameConfig.winRight, RewardRight);
    }
}

// Draw game elements
function draw() {
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw paddles
    ctx.fillStyle = 'red'; // Set fill style to red for Red's paddle
    ctx.fillRect(paddleLeft.x, paddleLeft.y, paddleLeft.width, paddleLeft.height);

    ctx.fillStyle = 'blue'; // Set fill style to blue for Blue's paddle
    ctx.fillRect(paddleRight.x, paddleRight.y, paddleRight.width, paddleRight.height);

    // Draw ball
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
    ctx.fillStyle = 'white';
    ctx.fill();
    ctx.closePath();

    // Draw scores
    ctx.font = '12px "Courier New", Courier, monospace';
    ctx.fillStyle = 'white';
    ctx.fillText(`Score: ${data.gameConfig.scores[0]}`, 20, 30);
    ctx.fillText(`Score: ${data.gameConfig.scores[1]}`, canvas.width - 120, 30);
}

// Reset ball to center
// Reset ball to center
function resetBall() {
    ball.x = canvas.width / 2;
    ball.y = canvas.height / 2;
    ball.dx = Math.random() > 0.5 ? 3 : -3;
    ball.dy = Math.random() > 0.5 ? 5 : -5; // Randomize initial vertical velocity
}

// Initialize the game and start the loop
initializeGame();
gameLoop();
