
const QLearn = (nEpisodes, maxSteps, exploreRate, exploreDecay, exploreMin, 
  learnRate, discountRate, eatReward, deathReward) => {
  
  const ql = {}
  ql.nEpisodes = nEpisodes
  ql.maxSteps = maxSteps
  ql.exploreRate = exploreRate
  ql.exploreDecay = exploreDecay
  ql.exploreMin = exploreMin
  ql.learnRate = learnRate
  ql.discountRate = discountRate
  ql.eatReward = eatReward
  ql.deathReward = deathReward
  ql.policy = null

  /**
   * Returns a policy matrix filled with 0s
   * Policy is a 3D matrix of x columns, y rows, each [x,y] contains 
   * a map where each value is the predicted reward for its corresponding key (direction)
   */
  ql.initPolicy = (nx, ny) => {
    const dirMap = () => {
      const map = new Map()
      game.DIRECTIONS.forEach(v => map.set(v, 0))
      return map
    } 
    return Array.from(Array(nx), _ => Array.from(Array(ny), _ => dirMap()))
  }

  /**
   * Returns the best direction to move in for a given position in the policy
   */
  ql.getAction = node => {
    let best = null
    ql.policy[node.x][node.y].forEach((v, k, m) => {
      if (best==null || v>m.get(best)) best = k
    })
    return best
  },

  /**
   * Returns a random direction to move in
   */
  ql.getRandomAction = () => game.DIRECTIONS[utils.randInt(0, game.DIRECTIONS.length-1)],

  /**
   * Returns the Q for a specified location and action
   */
  ql.getQs = node => ql.policy[node.x][node.y],

  /**
   * Returns the Q for a specified location and action
   */
  ql.getQ = (action, node) => ql.getQs(node).get(action),

  /**
   * Sets the Q at a specified location for a specified action
   */
  ql.setQ = (action, q, node) => ql.policy[node.x][node.y].set(action, q),

  /**
   * Returns true if all Q in qs are equal
   */
  ql.allQEq = node => {
    let prev = null
    for (let v of ql.getQs(node).values()) {
      if(prev==null) prev = v
      else if(v != prev) return false
    }
    return true
  }

  /**
   * Returns the maximum Q in qs
   */
  ql.maxQ = node => {
    let maxQ = null
    ql.getQs(node).forEach(v => {
      if(maxQ==null || v>maxQ) maxQ = v
    })
    return maxQ
  }
  
  /**
   * Updates the policy resulting from the Q-Learning algorithm based on the given state
   */
  ql.update = (next, state, reset=false) => {
    let exploreRate = ql.exploreRate

    // If no policy is given, start fresh
    if (ql.policy==null || reset) ql.policy = ql.initPolicy(state.nx, state.ny)
    // Play the game nEpisodes times from the current start to gather information
    for(let ep=0; ep<ql.nEpisodes; ep++) {
      let s = state;
      // Each episode is limited to a maximum number of steps that can be taken
      for(let step=0; step<maxSteps; step++) {
        const head = s.snake[s.snake.length-1]
        const a = ql.isExplore(head, exploreRate) ? ql.getRandomAction() : ql.getAction(head)
        const ns = next(s, {direction: a})
        const r = !ns.isAlive ? ql.deathReward : (ns.justEaten ? ql.eatReward : 0)
        const nQ = ql.calcQ(ql.getQ(a, head), r, ql.maxQ(ns.snake[ns.snake.length-1]))
        ql.setQ(a, nQ, head)
        if(!ns.isAlive || ns.justEaten) break
        else s = ns
      }
      // Exploration rate decays linearly with each episode until a minimum is reached
      exploreRate = Math.max(ql.exploreMin, exploreRate - ql.exploreDecay)
    }
  }

  /**
   * Return an updated q value for the current node
   */
  ql.calcQ = (q, r, nQ) => q + ql.learnRate * (r + ql.discountRate * nQ - q)

  /**
   * Returns true if the next action should be to explore
   */
  ql.isExplore = (node, exploreRate) => (Math.random() < exploreRate) || ql.allQEq(node)

  return ql
}
