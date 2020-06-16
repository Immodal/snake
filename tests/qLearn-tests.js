const QLearnTests = {
  'qlearn': () => {
    let nx = 3
    let ny = 4
    let next = game.next(nx, ny, Walls())
    let state = next()
    let node = Node(1,1)

    let model = QLearn(300, 500, 1, 0.01, 0.05, 0.9, 0.9, 1, -1)
    model.policy = model.initPolicy(nx, ny)
    // This section checks
    // initPolicy, getAction, getQs, getQ, setQ, allQEq, maxQ
    // Policy Initialised correctly
    eq(model.policy.length, nx)
    eq(model.policy[0].length, ny)
    eq(model.policy[1][2].length, game.DIRECTIONS.length)
    eq(true, model.allQEq(Node(2,3)))
    eq(true, model.isExplore(node, 1))
    eq(true, model.isExplore(node, 0))
    // Initial
    eq(model.policy[1][1].length, game.DIRECTIONS.length)
    eq(true, model.allQEq(node))
    eq(true, game.NORTH.eq(model.getAction(node)))
    eq(0, model.maxQ(node))
    // Modified
    let north = model.actionMap.get(game.NORTH)
    let south = model.actionMap.get(game.SOUTH)
    let east = model.actionMap.get(game.EAST)
    let west = model.actionMap.get(game.WEST)

    model.setQ(north, -1, node)
    model.setQ(south, 99, node)
    model.setQ(east, 55, node)
    model.setQ(west, -999, node)
    eq(false, model.allQEq(node))
    eq(true, model.isExplore(node, 1))
    eq(false, model.isExplore(node, 0))
    let qs = model.getQs(node)

    eq(true, qs[north]==-1)
    eq(true, model.getQ(north, node)==-1)
    eq(true, qs[south]==99)
    eq(true, model.getQ(south, node)==99)
    eq(true, qs[east]==55)
    eq(true, model.getQ(east, node)==55)
    eq(true, qs[west]==-999)
    eq(true, model.getQ(west, node)==-999)
    eq(true, game.SOUTH.eq(model.getAction(node)))
    eq(99, model.maxQ(node))
    
    for (let i=0; i<10; i++) {
      const ra = model.getRandomActionIndex()
      eq(true, game.DIRECTIONS.some(n => n.eq(model.actionMap.get(ra))))
    }
  }
}