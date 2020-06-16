const QLearnTests = {
  'qlearn': () => {
    let nx = 3
    let ny = 4
    let next = game.next(nx, ny)
    let state = next()
    let node = Node(1,1)

    let model = QLearn(300, 500, 1, 0.01, 0.05, 0.9, 0.9, 1, -1)
    model.policy = model.initPolicy(nx, ny)
    // This section checks
    // initPolicy, getAction, getQs, getQ, setQ, allQEq, maxQ
    // Policy Initialised correctly
    eq(model.policy.length, nx)
    eq(model.policy[0].length, ny)
    eq(model.policy[1][2].size, game.DIRECTIONS.length)
    eq(true, model.allQEq(Node(2,3)))
    game.DIRECTIONS.every(d => model.policy[1][2].has(d))
    eq(true, model.isExplore(node, 1))
    eq(true, model.isExplore(node, 0))
    // Initial
    eq(model.policy[1][1].size, game.DIRECTIONS.length)
    eq(true, model.allQEq(node))
    eq(true, game.NORTH.eq(model.getAction(node)))
    eq(0, model.maxQ(node))
    // Modified
    model.setQ(game.NORTH, -1, node)
    model.setQ(game.SOUTH, 99, node)
    model.setQ(game.EAST, 55, node)
    model.setQ(game.WEST, -999, node)
    eq(false, model.allQEq(node))
    eq(true, model.isExplore(node, 1))
    eq(false, model.isExplore(node, 0))
    let qs = model.getQs(node)
    eq(true, qs.get(game.NORTH)==-1)
    eq(true, model.getQ(game.NORTH, node)==-1)
    eq(true, qs.get(game.SOUTH)==99)
    eq(true, model.getQ(game.SOUTH, node)==99)
    eq(true, qs.get(game.EAST)==55)
    eq(true, model.getQ(game.EAST, node)==55)
    eq(true, qs.get(game.WEST)==-999)
    eq(true, model.getQ(game.WEST, node)==-999)
    eq(true, game.SOUTH.eq(model.getAction(node)))
    eq(99, model.maxQ(node))
    
    for (let i=0; i<10; i++) {
      const ra = model.getRandomAction()
      eq(true, game.DIRECTIONS.some(n => n.eq(ra)))
    }
  }
}