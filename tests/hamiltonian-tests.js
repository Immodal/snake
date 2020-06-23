
const HamiltonianTests = {
  "make Graph": () => {
    const exp44Graph = ` v> ,  v><,  v><,  v <, 
^v> , ^v><, ^v><, ^v <, 
^v> , ^v><, ^v><, ^v <, 
^ > , ^ ><, ^ ><, ^  <, 
`

    let graph = fnHamiltonian.mkGraph(4,4)
    eq(fnHamiltonian.toString(graph), exp44Graph)
  },

  "Vertex": () => {
    let graph = fnHamiltonian.mkGraph(4,4)
    // Vertex set/get edge
    let vx = fnHamiltonian.Vertex(0,0,graph)
    eq(vx.nEdges, 4)
    vx.setEdge(game.EAST, 0)
    eq(vx.nEdges, 3)
    vx.setEdge(game.EAST, -1)
    eq(vx.nEdges, 3)
    eq(vx.getEdge(game.NORTH), 1)
    eq(vx.getEdge(game.SOUTH), 1)
    eq(vx.getEdge(game.EAST), -1)
    eq(vx.getEdge(game.WEST), 1)
    vx.setEdge(game.EAST, 1)
    eq(vx.getEdge(game.EAST), 1)

    // vertex get neighbor
    eq(graph[1][1].getNeighbor(game.NORTH), graph[1][0])
    eq(graph[1][1].getNeighbor(game.SOUTH), graph[1][2])
    eq(graph[1][1].getNeighbor(game.EAST), graph[2][1])
    eq(graph[1][1].getNeighbor(game.WEST), graph[0][1])

    // mk graph
    eq(graph[3][3].nEdges, 2)
    eq(graph[0][0].nEdges, 2)
    eq(graph[0][1].nEdges, 3)
    eq(graph[1][0].nEdges, 3)
    eq(graph[1][1].nEdges, 4)

    // invert edge
    graph[0][0].invertEdge(game.NORTH) // Should do nothing
    eq(graph[0][0].nEdges, 2)

    graph[0][0].invertEdge(game.SOUTH)
    eq(graph[0][0].nEdges, 1)
    eq(graph[0][1].nEdges, 2)

    graph[1][1].invertEdge(game.NORTH)
    eq(graph[1][0].nEdges, 2)
    eq(graph[1][1].nEdges, 3)

    eq(graph[3][3].nEdges, 2)
  },

  "deletion": () => {
    const exp44Graph = ` v> ,  v><,  v><,  v <, 
^v> , ^v><, ^v><, ^v <, 
^v> , ^v><, ^v><, ^v <, 
^ > , ^ ><, ^ ><, ^  <, 
`

    let graph = fnHamiltonian.mkGraph(4,4)
    fnHamiltonian.runDeletion(graph)
    for (let i=0; i<graph.length; i++) {
      for (let j=0; j<graph[i].length; j++) {
        game.DIRECTIONS.forEach(d => {
          if (graph[i][j].getEdge(d)>=0) {
            // They match their neighbors
            eq(graph[i][j].getEdge(d), graph[i][j].getNeighbor(d).getEdge(game.DIR_OPPOSITES.get(d)))
          }
        })
        eq(true, graph[i][j].nEdges>=2)
        if (graph[i][j].nEdges>2) {
          if (i-1>=0) eq(true, graph[i-1][j].nEdges==2)
          if (j-1>=0) eq(true, graph[i][j-1].nEdges==2)
          if (i+1<graph.length) eq(true, graph[i+1][j].nEdges==2)
          if (j+1<graph[i].length) eq(true, graph[i][j+1].nEdges==2)
        }
      }
    }
    eq(false, exp44Graph == fnHamiltonian.toString(graph))
  },

  'get remainders': () => {
    eq(fnHamiltonian.getRemainders(fnHamiltonian.mkGraph(2, 2)).size(), 0)
    eq(fnHamiltonian.getRemainders(fnHamiltonian.mkGraph(3, 3)).size(), 5)
    eq(fnHamiltonian.getRemainders(fnHamiltonian.mkGraph(4, 4)).size(), 12)
  },

  'DestroyerNode': () => {
    let graph = fnHamiltonian.mkGraph(4,4)

    const dn0 = fnHamiltonian.DestroyerNode(graph[0][0], null)
    eq(dn0.vertex, graph[0][0])
    eq(dn0.parent, null)
    eq(dn0.dirToParent, null)
    eq(dn0.pathVertices.size(), 1)
    eq(dn0.pathVertices.hasNode(dn0.vertex), true)
    eq(dn0.length, 1)
    eq(dn0.isDestroyer, false)

    // Add a node
    const dn1 = fnHamiltonian.DestroyerNode(graph[0][1], dn0)
    eq(dn1.vertex, graph[0][1])
    eq(dn1.parent, dn0)
    eq(true, dn1.dirToParent.eq(game.NORTH))
    eq(dn0.pathVertices.size(), 1)
    eq(dn0.pathVertices.hasNode(dn1.vertex), false)
    eq(dn1.pathVertices.size(), 2)
    eq(dn1.pathVertices.hasNode(dn1.vertex), true)
    eq(dn1.length, 2)
    eq(dn1.isDestroyer, false)

    const dn2 = fnHamiltonian.DestroyerNode(graph[1][1], dn1)
    eq(dn2.vertex, graph[1][1])
    eq(dn2.parent, dn1)
    eq(true, dn2.dirToParent.eq(game.WEST))
    eq(dn2.length, 3)
    eq(dn2.isDestroyer, false)

    let dn3 = fnHamiltonian.DestroyerNode(graph[2][1], dn2)
    eq(dn3.vertex, graph[2][1])
    eq(dn3.parent, dn2)
    eq(true, dn3.dirToParent.eq(game.WEST))
    eq(dn3.length, 4)
    eq(dn3.isDestroyer, false)

    // Add alternation
    graph[0][1].invertEdge(game.EAST)

    dn3 = fnHamiltonian.DestroyerNode(graph[2][1], dn2)
    eq(dn3.vertex, graph[2][1])
    eq(dn3.parent, dn2)
    eq(true, dn3.dirToParent.eq(game.WEST))
    eq(dn3.length, 4)
    eq(dn3.isDestroyer, true)

    let dn4 = fnHamiltonian.DestroyerNode(graph[3][1], dn3)
    eq(dn4.vertex, graph[3][1])
    eq(dn4.parent, dn3)
    eq(true, dn4.dirToParent.eq(game.WEST))
    eq(dn4.length, 5)
    eq(dn4.isDestroyer, false)

    let dn5 = fnHamiltonian.DestroyerNode(graph[3][2], dn4)
    eq(dn5.vertex, graph[3][2])
    eq(dn5.parent, dn4)
    eq(true, dn5.dirToParent.eq(game.NORTH))
    eq(dn5.length, 6)
    eq(dn5.isDestroyer, false)

    // Add alternation
    graph[2][1].invertEdge(game.EAST)

    dn5 = fnHamiltonian.DestroyerNode(graph[3][2], dn4)
    eq(dn5.vertex, graph[3][2])
    eq(dn5.parent, dn4)
    eq(true, dn5.dirToParent.eq(game.NORTH))
    eq(dn5.length, 6)
    eq(dn5.isDestroyer, true)

    let path = dn5.toPath()
    eq(path.length, 6)
    eq(path[5], dn0.vertex)
    eq(path[4], dn1.vertex)
    eq(path[3], dn2.vertex)
    eq(path[2], dn3.vertex)
    eq(path[1], dn4.vertex)
    eq(path[0], dn5.vertex)
  },

  'find destroyer': () => {
    let graph = fnHamiltonian.mkGraph(4,4)

    graph[0][1].invertEdge(game.EAST)
    graph[2][1].invertEdge(game.EAST)

    const goals = NodeSet()
    //goals.addNode(graph[3][2])
    goals.addNode(graph[3][0])
    const paths = []
    paths.push(fnHamiltonian.findDestroyer(graph, graph[0][0], goals))
    eq(goals.size(), 0)
    eq(paths[0].length, 6)
    eq(paths[0][5], graph[0][0])
    eq(paths[0][4], graph[0][1])
    eq(paths[0][3], graph[1][1])
    eq(paths[0][2], graph[2][1])
    eq(paths[0][1], graph[3][1])
    eq(paths[0][0], graph[3][0])
  },

  'get destroyer paths': () => {
    let graph = fnHamiltonian.mkGraph(10,10)
    fnHamiltonian.runDeletion(graph)
    const paths = fnHamiltonian.getDestroyerPaths(graph)
    const rems = fnHamiltonian.getRemainders(graph)

    eq(rems.size()/2, paths.length)
    // Make sure that the paths start and end with vertices in rems
    paths.forEach(p => {
      eq(rems.hasNode(p[0]), true)
      rems.deleteNode(p[0])
      eq(rems.hasNode(p[p.length-1]), true)
      rems.deleteNode(p[p.length-1])
    })
  },

  'destroy paths': () => {
    const graphExp = ` v> ,  v><,   ><,  v><,  v <, 
^v  , ^v  ,  v> , ^  <, ^v  , 
^v> , ^  <, ^v  ,  v> , ^v <, 
^ > ,   ><, ^  <, ^ > , ^  <, 
`
    
    let graph = fnHamiltonian.mkGraph(5,4)

    graph[0][1].invertEdge(game.EAST)
    graph[1][1].invertEdge(game.EAST)
    graph[2][1].invertEdge(game.NORTH)
    graph[3][1].invertEdge(game.SOUTH)
    graph[3][1].invertEdge(game.EAST)
    graph[1][2].invertEdge(game.SOUTH)
    graph[1][2].invertEdge(game.EAST)
    graph[2][2].invertEdge(game.EAST)
    graph[2][3].invertEdge(game.EAST)
    eq(fnHamiltonian.toString(graph), graphExp)

    const paths = fnHamiltonian.getDestroyerPaths(graph)
    fnHamiltonian.destroyPath(paths[0])
    fnHamiltonian.destroyPath(paths[1])

    eq(fnHamiltonian.getRemainders(graph).size(), 0)
  }

  /*'make example fig2': () => {
    const graphExp = ` v> ,  v><,   ><,  v><,  v <, 
^v  , ^v  ,  v> , ^  <, ^v  , 
^v> , ^  <, ^v  ,  v> , ^v <, 
^ > ,   ><, ^  <, ^ > , ^  <, 
`

    let graph = fnHamiltonian.mkGraph(5,4)

    graph[0][1].invertEdge(game.EAST)
    graph[1][1].invertEdge(game.EAST)
    graph[2][1].invertEdge(game.NORTH)
    graph[3][1].invertEdge(game.SOUTH)
    graph[3][1].invertEdge(game.EAST)
    graph[1][2].invertEdge(game.SOUTH)
    graph[1][2].invertEdge(game.EAST)
    graph[2][2].invertEdge(game.EAST)
    graph[2][3].invertEdge(game.EAST)
    eq(fnHamiltonian.toString(graph), graphExp)

    const remainders = fnHamiltonian.getRemainders(graph)
    eq(remainders.size(), 4)

    const paths = fnHamiltonian.getDestroyerPaths(graph)
    console.log(paths)
    eq(paths.length, 2)
    eq(paths[0][0].eq(Node(1,0)), true)
    eq(paths[0][paths[0].length-1].eq(Node(0,2)), true)
    eq(paths[1][0].eq(Node(1,0)), true)
    eq(paths[1][paths[1].length-1].eq(Node(0,2)), true)
  },*/
}