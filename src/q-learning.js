/**
 * 
 */
const QLearn = (nEpisodes, maxSteps, exploreRate, exploreDecay, exploreMin, 
  learnRate, discountRate, eatReward, deathReward, cumulativePolicy=true) => {
  
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
  ql.cumulativePolicy = cumulativePolicy

  ql.actionMap = new Map()
  game.DIRECTIONS.forEach((d, i) => { ql.actionMap.set(i, d) })
  game.DIRECTIONS.forEach((d, i) => { ql.actionMap.set(d, i) })

  ql.policy = null

  /**
   * Returns a policy matrix filled with 0s
   * Policy is a 3D matrix of x columns, y rows, each [x,y] contains 
   * an value is the predicted reward for its corresponding action (direction)
   */
  ql.initPolicy = (nx, ny) => {
    const mkQs = () => Array(game.DIRECTIONS.length).fill(0)
    return Array.from(Array(nx), _ => Array.from(Array(ny), _ => mkQs()))
  },

  /**
   * Returns the best direction to move in for a given position in the policy
   */
  ql.getAction = node => ql.actionMap.get(ql.getActionIndex(node)),

  /**
   * Returns the best action index for a given position in the policy
   */
  ql.getActionIndex = node =>  ql.getQs(node).reduce((acc, v, i, arr) => i>0 ? (v>arr[acc] ? i : acc) : i, 0),

  /**
   * Returns a random action index
   */
  ql.getRandomActionIndex = () => utils.randInt(0, game.DIRECTIONS.length-1),

  /**
   * Returns the Q for a specified location and action
   */
  ql.getQs = node => ql.policy[node.x][node.y],

  /**
   * Returns the Q for a specified location and action index
   */
  ql.getQ = (i, node) => ql.getQs(node)[i],

  /**
   * Sets the Q at a specified location for a specified action index
   */
  ql.setQ = (i, q, node) => ql.policy[node.x][node.y][i] = q

  /**
   * Returns true if all Q in a given position are equal
   */
  ql.allQEq = node => ql.getQs(node).every((q, i, arr) => i>0 ? q==arr[i-1] : true),

  /**
   * Returns the maximum Q at a given position
   */
  ql.maxQ = node => ql.getQs(node).reduce((acc, v) => acc>v ? acc : v),
  
  /**
   * Updates the policy resulting from the Q-Learning algorithm based on the given state
   */
  ql.update = (next, state) => {
    let exploreRate = ql.exploreRate
    // If no policy is given, start fresh
    if (ql.policy==null || state.justEaten || !ql.cumulativePolicy) ql.policy = ql.initPolicy(state.nx, state.ny)
    // Play the game nEpisodes times from the current start to gather information
    for(let ep=0; ep<ql.nEpisodes; ep++) {
      let s = state;
      // Each episode is limited to a maximum number of steps that can be taken
      for(let step=0; step<maxSteps; step++) {
        const head = s.snake[0]
        // Get an action to try out
        const ai = ql.isExplore(head, exploreRate) ? ql.getRandomActionIndex() : ql.getActionIndex(head)
        const ns = next(s, {direction: ql.actionMap.get(ai)})
        // Get reward based on outcome of the action
        const r = !ns.isAlive ? ql.deathReward : (ns.justEaten ? ql.eatReward : 0)
        // Calculate and update the Q for the current head location
        const nQ = ql.calcQ(ql.getQ(ai, head), r, ql.maxQ(ns.snake[0]))
        ql.setQ(ai, nQ, head)
        // If the snake is dead or just ate, end the episode early, otherwise advance state
        if(!ns.isAlive || ns.justEaten) break
        else s = ns
      }
      // Exploration rate decays linearly with each episode until a minimum is reached
      exploreRate = Math.max(ql.exploreMin, exploreRate - ql.exploreDecay)
    }
  }

  /**
   * Return an updated q value for the current node
   * Using the Bellman equation
   */
  ql.calcQ = (q, r, nQ) => q + ql.learnRate * (r + ql.discountRate * nQ - q)

  /**
   * Returns true if the next action should be to explore
   */
  ql.isExplore = (node, exploreRate) => (Math.random() < exploreRate) || ql.allQEq(node)

  return ql
}
