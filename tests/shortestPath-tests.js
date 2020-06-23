const ShortestPathTests = {
  "build path": () => {
    let current = [null, Node(0,0)]
    current = [current, Node(1,0)]
    current = [current, Node(1,1)]
    let path = fnShortestPath.buildPath(current)
    let pathExp = [Node(1,1), Node(1,0), Node(0,0)]
    eq(true, path.every((n, i) => path[i].eq(pathExp[i])))
  },

  "build policy": () => {
    let current = [null, Node(0,0)]
    current = [current, Node(1,0)]
    current = [current, Node(1,1)]
    let path = fnShortestPath.buildPath(current)
    let policy = fnShortestPath.buildPolicy(path, 3, 3)
    let policyExp = [
      [game.EAST, null, null],
      [game.SOUTH, null, null],
      [null, null, null],
    ]
    eq(true, policy.every((col, i) => col.every((v, j) => v==null ? v==policyExp[i][j] : v.eq(policyExp[i][j]))))
  },

  "search": () => {
    let exclusions = NodeSet()
    exclusions.addNode(Node(1,0))
    exclusions.addNode(Node(0,0))
    let path = fnShortestPath.search(Node(1,0), Node(2,3), 5, 5, exclusions.copy(), game.EAST)
    let pathExp = [Node(2,3), Node(2,2), Node(2,1), Node(2,0), Node(1,0)]
    eq(true, path.every((n, i) => path[i].eq(pathExp[i])))

    // Change initial direction
    path = fnShortestPath.search(Node(1,0), Node(2,3), 5, 5, exclusions.copy(), game.SOUTH)
    pathExp = [Node(2,3), Node(1,3), Node(1,2), Node(1,1), Node(1,0)]
    eq(true, path.every((n, i) => path[i].eq(pathExp[i])))

    // Wall
    exclusions.addNode(Node(1,1))
    path = fnShortestPath.search(Node(1,0), Node(2,3), 5, 5, exclusions.copy(), game.SOUTH)
    pathExp = [Node(2,3), Node(2,2), Node(2,1), Node(2,0), Node(1,0)]
    eq(true, path.every((n, i) => path[i].eq(pathExp[i])))
  },
}