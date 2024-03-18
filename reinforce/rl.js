var randi = utils.randi;
class Agent {


  constructor(env, spec) {
    const {
      gamma,
      epsilon,
      alpha,
      experience_add_every,
      experience_size,
      learning_steps_per_iteration,
      tderror_clamp,
      num_hidden_units,
      batch_size
    } = spec;

    this.gamma = gamma;
    this.epsilon = epsilon;
    this.alpha = alpha;
    this.experience_add_every = experience_add_every;
    this.experience_size = experience_size;
    this.learning_steps_per_iteration = learning_steps_per_iteration;
    this.tderror_clamp = tderror_clamp;
    this.num_hidden_units = num_hidden_units;
    this.batch_size = batch_size;

    this.env = env;
    this.buildNet();
  }

  buildNet() {
    this.nh = this.num_hidden_units;
    this.ns = this.env.getNumStates();
    this.na = this.env.getMaxNumActions();

    this.net = {
      W1: new utils.RandMat(this.nh, this.ns, 0, 0.01),
      b1: new utils.Mat(this.nh, 1, 0, 0.01),
      W2: new utils.RandMat(this.na, this.nh, 0, 0.01),
      b2: new utils.Mat(this.na, 1, 0, 0.01)
    };

    this.exp = [];
    this.expi = 0;
    this.t = 0;

    this.r0 = null;
    this.s0 = null;
    this.s1 = null;
    this.a0 = null;
    this.a1 = null;

    this.tderror = 0;
  }

  *generateExperiences() {
    while (true) {
      if (this.exp.length >= this.experience_add_every) {
        for (let i = 0; i < this.exp.length; i += this.batch_size) {
          yield this.exp.slice(i, i + this.batch_size);
        }
      }
      yield null;
    }
  }

  addToReplayMemory(experience) {
    this.exp.push(experience);
    if (this.exp.length > this.experience_size) {
      this.exp.shift();
    }
  }

  forwardQ(net, s, needs_backprop) {
    const G = new utils.Graph(needs_backprop);
    const a1mat = G.add(G.mul(net.W1, s), net.b1);
    const h1mat = G.gelu(a1mat);
    const a2mat = G.add(G.mul(net.W2, h1mat), net.b2);
    this.lastG = G;
    return a2mat;
  }

  act(slist) {
    const s = new utils.Mat(this.ns, 1);
    s.setFrom(slist);

    const randomAction = randi(0, this.na);

    if (Math.random() < this.epsilon) {
      return randomAction;
    }

    const amat = this.forwardQ(this.net, s, false);
    const action = utils.maxi(amat.w);

    this.s0 = this.s1;
    this.a0 = this.a1;
    this.s1 = s;
    this.a1 = action;

    return action;
  }

  learn(r1) {
    if (this.r0 !== null && this.alpha > 0) {
      const tderror = this.learnFromTuple(this.s0, this.a0, this.r0, this.s1, this.a1);
      this.tderror = tderror;

      if (this.t % this.experience_add_every === 0) {
        this.addToReplayMemory([this.s0, this.a0, this.r0, this.s1, this.a1]);
      }
      this.t += 1;

      const experienceGenerator = this.generateExperiences();
      while (true) {
        const batch = experienceGenerator.next().value;
        if (batch === null) break;
        this.learnFromBatch(batch);
      }
    }
    this.r0 = r1;
  }

  learnFromBatch(batch) {
    for (const [s0, a0, r0, s1, a1] of batch) {
      this.learnFromTuple(s0, a0, r0, s1, a1);
    }
  }

  learnFromTuple(s0, a0, r0, s1, a1) {
    const tmat = this.forwardQ(this.net, s1, false);
    const qmax = r0 + this.gamma * tmat.w[utils.maxi(tmat.w)];

    const pred = this.forwardQ(this.net, s0, true);

    let tderror = pred.w[a0] - qmax;
    const clamp = this.tderror_clamp;
    tderror = Math.max(-clamp, Math.min(tderror, clamp));

    pred.dw[a0] = tderror;
    this.lastG.backward();

    utils.updateNet(this.net, this.alpha);
    return tderror;
  }
}
