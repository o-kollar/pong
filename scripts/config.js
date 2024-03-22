let data = Alpine.reactive({
    agentConfig: {
        gamma: 0.5,
        epsilon: 0.2,
        alpha: 0.005,
        experience_add_every: 1,
        experience_size: 50000,
        learning_steps_per_iteration: 32,
        tderror_clamp: 1.0,
        num_hidden_units: 80,
    },
    gameConfig:{
        env:{
            getNumStates: function () {
                return 8;
            },
            getMaxNumActions: function () {
                return 2;
            }
        },
        gameSpeed:10,
        scoreLeft:0,
        scoreRight:0,
        touchLeft:false,
        touchRight:false,
        winLeft:0,
        winRight:0,
        iterationLeft:0,
        iterationRight:0,
        scores:[0,0]
    }
})

