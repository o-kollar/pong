let data = Alpine.reactive({
    agentConfig: {
        gamma: 0.5,
        epsilon: 0.3,
        alpha: 0.005,
        experience_add_every: 1,
        experience_size: 50000,
        learning_steps_per_iteration: 32,
        tderror_clamp: 1.0,
        num_hidden_units: 64,
    },
    gameConfig:{
        gameSpeed:20,
        redPlayer:false,
        scoreLeft:0,
        scoreRight:0

    }
})

