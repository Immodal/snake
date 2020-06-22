
const HamiltonianTests = {
  "make Graph": () => {
    exp44Graph = ` v> ,  v><,  v><,  v <, 
^v> , ^v><, ^v><, ^v <, 
^v> , ^v><, ^v><, ^v <, 
^ > , ^ ><, ^ ><, ^  <, 
`

    const hm = Hamiltonian(4, 4)
    hm.graph = hm.mkGraph(4,4)
    eq(hm.toString(hm.graph), exp44Graph)
  },

  "Vertex": () => {
    const hm = Hamiltonian(4, 4)
    // Vertex set/get edge
    let vx = hm.Vertex(0,0)
    eq(vx.nEdges, 4)
    vx.setEdge(game.EAST, 0)
    eq(vx.nEdges, 3)
    vx.setEdge(game.EAST, -1)
    eq(vx.nEdges, 3)
    eq(vx.getEdge(game.NORTH), 1)
    eq(vx.getEdge(game.SOUTH), 1)
    eq(vx.getEdge(game.EAST), -1)
    eq(vx.getEdge(game.WEST), 1)

    hm.graph = hm.mkGraph(4,4)
    let graph = hm.graph
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
    exp44Graph = ` v> ,  v><,  v><,  v <, 
^v> , ^v><, ^v><, ^v <, 
^v> , ^v><, ^v><, ^v <, 
^ > , ^ ><, ^ ><, ^  <, 
`
    const hm = Hamiltonian(4, 4)
    graph = hm.graph
    for (let i=0; i<graph.length; i++) {
      for (let j=0; j<graph[i].length; j++) {
        game.DIRECTIONS.forEach(d => {
          if (graph[i][j].getEdge(d)>=0) {
            // They match their neighbors
            eq(graph[i][j].getEdge(d), graph[i][j].getNeighbor(d).getEdge(game.DIR_OPPOSITES.get(d)))
          }
        })
        eq(true, graph[i][j].nEdges>=2)
      }
    }
    eq(false, exp44Graph == hm.toString(graph))
  },

  'DestroyerNode': () => {
    const hm = Hamiltonian(4, 4)
    hm.graph = hm.mkGraph(4,4)
    graph = hm.graph

    const dn0 = hm.DestroyerNode(graph[0][0], null)
    eq(dn0.vertex, graph[0][0])
    eq(dn0.parent, null)
    eq(dn0.dirToParent, null)
    eq(dn0.pathVertices.size(), 1)
    eq(dn0.pathVertices.hasNode(dn0.vertex), true)
    eq(dn0.length, 1)
    eq(dn0.isDestroyer, false)

    // Add a node
    const dn1 = hm.DestroyerNode(graph[0][1], dn0)
    eq(dn1.vertex, graph[0][1])
    eq(dn1.parent, dn0)
    eq(true, dn1.dirToParent.eq(game.NORTH))
    eq(dn0.pathVertices.size(), 1)
    eq(dn0.pathVertices.hasNode(dn1.vertex), false)
    eq(dn1.pathVertices.size(), 2)
    eq(dn1.pathVertices.hasNode(dn1.vertex), true)
    eq(dn1.length, 2)
    eq(dn1.isDestroyer, false)

    const dn2 = hm.DestroyerNode(graph[1][1], dn1)
    eq(dn2.vertex, graph[1][1])
    eq(dn2.parent, dn1)
    eq(true, dn2.dirToParent.eq(game.WEST))
    eq(dn2.length, 3)
    eq(dn2.isDestroyer, false)

    let dn3 = hm.DestroyerNode(graph[2][1], dn2)
    eq(dn3.vertex, graph[2][1])
    eq(dn3.parent, dn2)
    eq(true, dn3.dirToParent.eq(game.WEST))
    eq(dn3.length, 4)
    eq(dn3.isDestroyer, false)

    // Add alternation
    graph[0][1].invertEdge(game.EAST)

    dn3 = hm.DestroyerNode(graph[2][1], dn2)
    eq(dn3.vertex, graph[2][1])
    eq(dn3.parent, dn2)
    eq(true, dn3.dirToParent.eq(game.WEST))
    eq(dn3.length, 4)
    eq(dn3.isDestroyer, true)

    let dn4 = hm.DestroyerNode(graph[3][1], dn3)
    eq(dn4.vertex, graph[3][1])
    eq(dn4.parent, dn3)
    eq(true, dn4.dirToParent.eq(game.WEST))
    eq(dn4.length, 5)
    eq(dn4.isDestroyer, false)

    let dn5 = hm.DestroyerNode(graph[3][2], dn4)
    eq(dn5.vertex, graph[3][2])
    eq(dn5.parent, dn4)
    eq(true, dn5.dirToParent.eq(game.NORTH))
    eq(dn5.length, 6)
    eq(dn5.isDestroyer, false)

    // Add alternation
    graph[2][1].invertEdge(game.EAST)

    dn5 = hm.DestroyerNode(graph[3][2], dn4)
    eq(dn5.vertex, graph[3][2])
    eq(dn5.parent, dn4)
    eq(true, dn5.dirToParent.eq(game.NORTH))
    eq(dn5.length, 6)
    eq(dn5.isDestroyer, true)
  },

  'destroyer': () => {
    const hm = Hamiltonian(4, 4)
    hm.graph = hm.mkGraph(4,4)
    graph = hm.graph

    graph[0][1].invertEdge(game.EAST)
    graph[2][1].invertEdge(game.EAST)

    console.log(hm.toString(hm.graph))
    let paths = hm.destroyer(hm.graph)
    console.log(paths)
  }
}