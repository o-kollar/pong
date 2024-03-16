const canvas = document.getElementById('pongCanvas');
const ctx = canvas.getContext('2d');

// Define the environment
const env = {
    getNumStates: function () {
        return 10;
    },
    getMaxNumActions: function () {
        return 2;
    },
};

// Define agent configuration


// Create agents
let agent1 = new Agent(env, data.agentConfig);
let agent2 = new Agent(env, data.agentConfig);

function loadAgent(){
  agent1.buildNet();
  agent2.buildNet();
   data.gameConfig.scoreLeft = 0;
   data.gameConfig.scoreRight = 0;
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
   
    setTimeout(gameLoop,data.gameConfig.gameSpeed)
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

// Move paddles based on actions
function movePaddles() {
    // Get actions from agents
    let agent1State = [
        ball.y, // Ball y-position
        ball.x, // Ball x-position
        ball.dx, // Ball x-velocity
        ball.dx > 0 ? 1 : -1, // Ball x-direction
        ball.dy, // Ball y-velocity
        ball.dy > 0 ? 1 : -1, // Ball y-direction
        paddleLeft.y, // Left paddle y-position
        (paddleLeft.y - ball.y) / canvas.height, // Left paddle relative y-position
        paddleLeft.y - previousPaddleLeftY, // Left paddle movement direction
        (paddleRight.y - ball.y) / canvas.height, // Right paddle relative y-position
    ];
    
    let agent2State = [
        ball.y, // Ball y-position
        ball.x, // Ball x-position
        ball.dx, // Ball x-velocity
        ball.dx > 0 ? 1 : -1, // Ball x-direction
        ball.dy, // Ball y-velocity
        ball.dy > 0 ? 1 : -1, // Ball y-direction
        paddleRight.y, // Right paddle y-position
        (paddleRight.y - ball.y) / canvas.height, // Right paddle relative y-position
        paddleRight.y - previousPaddleRightY, // Right paddle movement direction
        (paddleLeft.y - ball.y) / canvas.height, // Left paddle relative y-position
    ];

    const action1 = agent1.act(agent1State);
    const action2 = agent2.act(agent2State);

    previousPaddleLeftY = paddleLeft.y;
    previousPaddleRightY = paddleRight.y;

    if (data.gameConfig.redPlayer) {
        // Add event listener for keydown event
        document.addEventListener('keydown', function(event) {
            // Check if the pressed key is the "W" key
            if (event.key === 'w' && paddleLeft.y > 0) {
                paddleLeft.y -= 0.08; // Move the left paddle up
            }
            // Check if the pressed key is the "S" key
            if (event.key === 's' && paddleLeft.y < canvas.height - paddleLeft.height) {
                paddleLeft.y += 0.08; // Move the left paddle down
            }
        })
    } else {
        // Move left paddle based on AI action
        if (action1 === 0 && paddleLeft.y > 0) {
            paddleLeft.y -= 5;
        }
        if (action1 === 1 && paddleLeft.y < canvas.height - paddleLeft.height) {
            paddleLeft.y += 5;
        }
    }

    // Move right paddle based on AI action
    if (action2 === 0 && paddleRight.y > 0) {
        paddleRight.y -= 5;
    }
    if (action2 === 1 && paddleRight.y < canvas.height - paddleRight.height) {
        paddleRight.y += 5;
    }
}
reward1 = [];
reward2 = [];

function handleCollisions() {
    // Calculate distance between ball and left paddle
    const distToLeftPaddle = Math.abs(ball.x - paddleLeft.x);

    // Calculate distance between ball and right paddle
    const distToRightPaddle = Math.abs(ball.x - paddleRight.x);

    // Determine negative reward based on distance from the ball
    const RewardLeft = -0.01 * distToLeftPaddle; // Adjust the factor as needed
    const RewardRight = -0.01 * distToRightPaddle; // Adjust the factor as needed

    // Check for collisions with the top and bottom walls
    if (ball.y + ball.dy > canvas.height - ball.radius || ball.y + ball.dy < ball.radius) {
        ball.dy = -ball.dy;
    }

    // Check collision with left paddle
    if (ball.x - ball.radius <= paddleLeft.x + paddleLeft.width && ball.y >= paddleLeft.y && ball.y <= paddleLeft.y + paddleLeft.height) {
        agent1.learn(0.02);
        reward1.push(0.02)
        ball.dx = Math.abs(ball.dx) + 0.5; // Increase horizontal velocity and reverse direction
        ball.dy *= 1; // Increase vertical velocity slightly
    }

    // Check collision with right paddle
    if (ball.x + ball.radius >= paddleRight.x && ball.y >= paddleRight.y && ball.y <= paddleRight.y + paddleRight.height) {
       // agent2.learn(0.02);
        reward2.push(0.02)
        ball.dx = -Math.abs(ball.dx) - 0.5; // Increase horizontal velocity and reverse direction
        ball.dy *= 1; // Increase vertical velocity slightly
    }

    // Score points and reset ball position if it goes out of bounds
    if (ball.x - ball.radius < 0) {
        // Right player scores
        agent1.learn(RewardLeft);
        reward1.push(RewardLeft)
       

        data.gameConfig.scoreRight++;
        resetBall();
    } else if (ball.x + ball.radius > canvas.width) {
        // Left player scores
        agent2.learn(RewardRight);
        reward2.push(RewardRight)
        

        data.gameConfig.scoreLeft++;
        resetBall();
    }else{
        agent1.learn(0);
        agent2.learn(0);
    }
    
}

// Draw game elements
function draw() {
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw paddles
    ctx.fillStyle = 'red'; // Set fill style to red for agent1's paddle
    ctx.fillRect(paddleLeft.x, paddleLeft.y, paddleLeft.width, paddleLeft.height);

    ctx.fillStyle = 'blue'; // Set fill style to blue for agent2's paddle
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
    ctx.fillText(`Score: ${data.gameConfig.scoreLeft}`, 20, 30);
    ctx.fillText(`Score: ${data.gameConfig.scoreRight}`, canvas.width - 120, 30);
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

