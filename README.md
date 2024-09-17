# Pong AI Game Simulation

This repository contains the code for a simple Pong game simulation where two AI agents, Red and Blue, compete against each other. The AI agents use reinforcement learning techniques to control the movement of the paddles, attempting to maximize their score by hitting the ball and preventing it from crossing their side of the screen.

## Features

- Two AI agents (Red and Blue) control the paddles using learned behavior.
- The ball accelerates and is affected by friction for more dynamic gameplay.
- Scoring mechanism and ball resetting on point.
- Agents can learn from rewards based on paddle-ball interactions and game state.
- Rewards are based on the distance between the paddle and the ball, as well as the score.
- Paddles and ball are rendered on an HTML canvas using JavaScript.

## How It Works

The game consists of the following core components:

- **Paddles**: Two paddles (Red and Blue) controlled by their respective agents.
- **Ball**: A small ball moves across the canvas, bouncing off walls and paddles. The ball accelerates over time and experiences friction.
- **Agents**: Both Red and Blue agents use a neural network (built using `buildNet`) to take actions based on the current game state.
- **Rewards**: Agents receive rewards based on their paddle's distance from the ball and whether they successfully hit it.
- **Game State**: The state includes the ball's position, velocity, paddle position, and paddle movement, which is fed to the agents to decide their next move.

## Game Flow

1. **Initialization**: The game initializes with the ball in the center of the canvas and paddles positioned on each side.
2. **Game Loop**: The game continuously updates the ball and paddles' positions, checks for collisions, and renders the updated state on the canvas.
3. **Agent Actions**: In each game loop iteration, the agents decide whether to move their paddle up or down based on the current game state.
4. **Scoring**: Points are scored when the ball crosses the boundary on either side. The game resets the ball after each score.
5. **Rewards**: Agents receive rewards based on their actions and outcomes, which help them adjust their behavior over time.

## Code Structure

### Core Functions

- `initializeGame()`: Sets up the initial positions of the ball and paddles and initializes the agents' neural networks.
- `gameLoop()`: The main loop that drives the game by updating game states, handling collisions, and drawing the game.
- `moveBall()`: Moves the ball across the canvas while applying acceleration and friction, and checks for boundary collisions.
- `movePaddles()`: Uses the agents' actions to move paddles up or down.
- `handleCollisions()`: Detects collisions between the ball and paddles, updates the ball's velocity, and handles scoring.
- `getGameState()`: Returns the current state of the game for the agents to make decisions.
- `resetBall()`: Resets the ball to the center when a point is scored.
- `draw()`: Renders the paddles, ball, and scores on the canvas.

### AI Agent Interaction

Each agent receives the following information about the game state:

1. Ball's position (x, y).
2. Ball's velocity (dx, dy).
3. Paddle's current position.
4. Paddle's relative position to the ball.
5. Previous paddle position to track movement direction.
6. Opponent paddle's relative position to the ball.

The agent uses this information to decide whether to move the paddle up or down.

### Reward System

- The reward is based on the agent's distance from the ball, encouraging the agent to minimize the gap and successfully hit the ball.
- If the agent misses the ball and the opponent scores, a penalty is applied.


## Agent Overview

The `Agent` class defines how the AI agent behaves, learns, and interacts with the environment. The agent uses Q-learning to make decisions on moving its paddle in response to the game state. It employs a replay memory to learn from past experiences, improving its decision-making over time.

### Key Features

- **Reinforcement Learning**: The agent learns to play Pong by receiving rewards based on the game's progress. It adjusts its actions to maximize future rewards.
- **Experience Replay**: The agent stores past experiences and learns from batches of these experiences, helping it generalize and improve stability in learning.
- **Q-Network**: The agent uses a neural network to approximate Q-values, which represent the expected future rewards for taking a particular action in a given state.
- **Epsilon-Greedy Strategy**: The agent explores random actions with probability `epsilon` and exploits its knowledge (choosing the best action) with `1 - epsilon`.

## Constructor Parameters

- `gamma`: Discount factor for future rewards.
- `epsilon`: Exploration rate for epsilon-greedy action selection.
- `alpha`: Learning rate for updating the neural network.
- `experience_add_every`: Frequency at which experiences are added to the replay memory.
- `experience_size`: Maximum size of the replay memory.
- `learning_steps_per_iteration`: Number of learning steps per game iteration.
- `tderror_clamp`: Clamps the temporal difference (TD) error to prevent extreme updates.
- `num_hidden_units`: Number of units in the hidden layer of the neural network.
- `batch_size`: Number of experiences to use when learning from the replay memory.

## Key Functions

### 1. **buildNet()**

Sets up the agent's neural network, which consists of:
- A hidden layer (`W1`, `b1`).
- An output layer (`W2`, `b2`).

The network's weights are initialized with small random values.

### 2. **act(slist)**

Chooses an action based on the current game state:
- Converts the game state (`slist`) into a matrix.
- With probability `epsilon`, selects a random action (exploration).
- Otherwise, selects the action with the highest predicted reward (exploitation) using the Q-network.

### 3. **learn(r1)**

Updates the agent's knowledge based on the reward (`r1`) received from the last action:
- Calculates the TD error, representing the difference between predicted and actual rewards.
- If the agent is learning, adds experiences to the replay memory and updates the network by learning from batches of experiences.

### 4. **addToReplayMemory(experience)**

Stores the agent's experience (current state, action, reward, next state) in the replay memory. If the memory exceeds its size limit, the oldest experience is discarded.

### 5. **generateExperiences()**

Yields batches of experiences from the replay memory for the agent to learn from in mini-batches.

### 6. **forwardQ(net, s, needs_backprop)**

Performs a forward pass through the agent's neural network to compute the Q-values for the given state (`s`). If `needs_backprop` is true, the network records operations for backpropagation.

### 7. **learnFromBatch(batch)**

Iterates over a batch of experiences, updating the agent's knowledge by calling `learnFromTuple()` on each experience.

### 8. **learnFromTuple(s0, a0, r0, s1, a1)**

Performs a single update to the network based on an experience tuple (state, action, reward, next state, next action). It calculates the TD error, performs backpropagation, and updates the network weights accordingly.

### Temporal Difference Error (TD Error)

The agent uses the temporal difference error to adjust its predictions:
- \( \text{TD Error} = Q(s_0, a_0) - [r_0 + \gamma \cdot \max(Q(s_1, a_1))] \)

### 9. **learnFromTuple()**

Clamps the TD error to ensure that updates don't destabilize the learning process. The clamped TD error is used for backpropagation through the network, and the network's weights are updated with a step size proportional to `alpha`.

