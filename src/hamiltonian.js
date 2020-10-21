
const Hamiltonian = (findDestroyerStepLimit=100, findConnectorStepLimit=100, findConnectorIterLimit=1000, updateLimit=30) => {
  const hm = {}

  hm.getAction = (node, state=null) => {
    if (hm.isHamiltonianCycle) {
      return hm.policy[node.x][node.y] 
    } else return hm.spAgent.getAction(node)
  }

  hm.update = state => {
    let updated = false
    if(hm.graph==null) {
      // Init Graph
      hm.graph = fnHamiltonian.buildCycle(state.nx, state.ny, state.walls, hm.findDestroyerStepLimit, hm.findConnectorStepLimit, hm.findConnectorIterLimit)
      hm.isHamiltonianCycle = fnHamiltonian.isHamiltonianCycle(hm.graph)
      updated = true
    } else if (!hm.isHamiltonianCycle) {
      // Continue to search for a Hamiltonian Cycle
      // TODO: Improve iteration efficiency
      // Possibly get Sets of separate cycles in the graph, and only iterate on the edges of cycles that neighbor other edges,
      // from smallest cycles
      fnHamiltonian.invertConnectorPaths(hm.graph, 100, 1000)
      hm.isHamiltonianCycle = fnHamiltonian.isHamiltonianCycle(hm.graph)
      updated = true
    }

    if (updated) {
      if (hm.isHamiltonianCycle) {
        hm.path = fnHamiltonian.buildPath(hm.graph)
        hm.pathNodeIndex = NodeMap()
        hm.path.forEach((vx, i) => hm.pathNodeIndex.set(vx, i))
        hm.policy = fnHamiltonian.buildPolicy(hm.path, hm.graph.length, hm.graph[0].length)
      } else {
        // If not Cycle, then use Shortest Path agent
        hm.spAgent.update(state, state.apple)
        // Attempt to find a path in the given graph up to updateLimit times,
        // beyond that, just re-init and try with a different graph
        hm.updateCount++
        if(hm.updateCount>=hm.updateLimit) {
          hm.reset()
          hm.update(state)
        }
      }
    }
  }

  hm.reset = () => {
    hm.spAgent = ShortestPath()
    hm.graph = null
    hm.isHamiltonianCycle = false
    hm.path = null
    hm.pathNodeIndex = null
    hm.policy = null
    hm.updateCount = 0
  }

  hm.findDestroyerStepLimit = findDestroyerStepLimit
  hm.findConnectorStepLimit = findConnectorStepLimit
  hm.findConnectorIterLimit = findConnectorIterLimit
  hm.updateLimit = updateLimit
  hm.reset()

  return hm
}

// https://springerplus.springeropen.com/articles/10.1186/s40064-016-2746-8
fnHamiltonian = {
  /**
   * Returns a graph initialized to the given dimensions.
   * Will attempt to find a hamiltonian cycle while adhering to the given limits.
   */
  buildCycle: (nx, ny, exclusions=NodeSet(), findDestroyerStepLimit=0, findConnectorStepLimit=100, findConnectorIterLimit=100) => {
    let graph = fnHamiltonian.mkGraph(nx, ny)
    fnHamiltonian.processExclusions(graph, exclusions)
    fnHamiltonian.runDeletion(graph)
    fnHamiltonian.getDestroyerPaths(graph, findDestroyerStepLimit).forEach(p => fnHamiltonian.invertPath(p))
    fnHamiltonian.invertConnectorPaths(graph, findConnectorStepLimit, findConnectorIterLimit)
    return graph
  },

  /**
   * Deletes all edges for the vertices given in the exclusions Set
   */
  processExclusions: (graph, exclusions) => {
    exclusions.lookup.forEach(node => {
      game.DIRECTIONS.forEach(d => graph[node.x][node.y].deleteEdge(d))
    })
  },

  /**
   * Returns an array containing the vertex progression for the hamiltonian cycle
   */
  buildPath: graph => {
    let start = null
    // Check that all vertices are valid
    for (let i=0; i<graph.length; i++) {
      for (let j=0; j<graph[i].length; j++) {
        if (start==null && graph[i][j].nEdges!=0) {
          start = graph[i][j]
          break
        }
      }
    }

    // Build Path
    let path = [start]
    let prevDir = start.getMove()
    let current = start.getNeighbor(prevDir)
    while (current!=start && current!=null && path.length<graph.length*graph[0].length) {
      path.push(current)
      prevDir = current.getMove(game.DIR_OPPOSITES.get(prevDir))
      if(prevDir==null) break // A dead end has been hit
      current = current.getNeighbor(prevDir)
    }
    
    if (current==start) path.push(current)

    return path
  },

  /**
   * Returns a 2D matrix with directions to follow on each node based on the given path
   */
  buildPolicy: (path, nx, ny) => {
    let policy = Array.from(Array(nx), _ => Array.from(Array(ny), _ => null))
    for (let i=0; i<path.length-1; i++) {
      const srcVx = path[i]
      const nextVx = path[i+1]
      policy[srcVx.x][srcVx.y] = nextVx.sub(srcVx)
    }
    return policy
  },

  /**
   * Child class of Node that also includes methods for tracking and modifying its edges
   */
  Vertex: (x, y, graph) => {
    const vx = Node(x, y)
    vx.graph = graph
    vx.edges = NodeMap()
    game.DIRECTIONS.forEach(dir => vx.edges.set(dir, 1))
    vx.nEdges = game.DIRECTIONS.length

    // Set Edge to a specific value
    vx.setEdge = (dir, value) => {
      if (value>0 && vx.edges.get(dir)<=0) vx.nEdges++
      else if (value<=0 && vx.edges.get(dir)>0) vx.nEdges--
      vx.edges.set(dir, value)
    }

    // Returns the value of an end in a given direction
    vx.getEdge = dir => vx.edges.get(dir)

    // Invert the value of an edge between 0 and 1 (also affects its neighbor)
    // Has no effect on values less than 0
    vx.invertEdge = dir => { 
      if (vx.getEdge(dir)>=0) {
        vx.setEdge(dir, vx.getEdge(dir)>0 ? 0 : 1) 
        vx.getNeighbor(dir).setEdge(game.DIR_OPPOSITES.get(dir), vx.getEdge(dir)) 
      }
    }

    // Delete this edge by setting its value to -1 (also affects its neighbor)
    vx.deleteEdge = dir => { 
      if (vx.getEdge(dir)>=-1) {
        vx.setEdge(dir, -1) 
        const neighbor = vx.getNeighbor(dir)
        if (neighbor != null) neighbor.setEdge(game.DIR_OPPOSITES.get(dir), vx.getEdge(dir)) 
      }
    }

    // Returns the neighboring Vertex in a given direction
    vx.getNeighbor = dir => {
      const node = vx.sum(dir)
      return node.inBounds(vx.graph.length, vx.graph[0].length) ? vx.graph[node.x][node.y] : null
    }

    // Returns the first direction to move in from the vertex
    vx.getMove = (exDir=null) => {
      for (let i=0; i<game.DIRECTIONS.length; i++) {
        if (vx.getEdge(game.DIRECTIONS[i])>0 && (exDir==null ? true : !game.DIRECTIONS[i].eq(exDir))) {
          return game.DIRECTIONS[i]
        }
      }
      return null
    }    

    return vx
  },

  /**
   * Returns a graph of width nx and height ny where all vertexes are connected to their 
   * North, South, East and West neighbors (except at the 4 sides of the graph)
   */
  mkGraph: (nx, ny) => {
    const graph = Array.from(Array(nx), _ => Array.from(Array(ny), _ => null))
    // 1 for edge, 0 for deleted edge, -1 for no edge
    for (let i=0; i<graph.length; i++) {
      for (let j=0; j<graph[i].length; j++) {
        graph[i][j] = fnHamiltonian.Vertex(i, j, graph)
        // No edges at the ends of the graph
        if (i==0) graph[i][j].deleteEdge(game.WEST)
        else if (i==graph.length-1) graph[i][j].deleteEdge(game.EAST)
        if (j==0) graph[i][j].deleteEdge(game.NORTH)
        else if (j==graph[i].length-1) graph[i][j].deleteEdge(game.SOUTH)
      }
    }
    return graph
  },

  /**
   * Randomly delete surplus edges in place from each vertex until there are none remaining
   */
  runDeletion: graph => {
    for (let i=0; i<graph.length; i++) {
      for (let j=0; j<graph[i].length; j++) {
        // In vertex[i,j],
        const vx = graph[i][j]
        const ord = game.DIRECTIONS.concat()
        utils.shuffle(ord)
        // Evaluate edges in random order,
        for (let k=0 ; k<ord.length; k++) {
          if(vx.nEdges<=2) break // no point looping if there at minimum number
          // If there are more than 2 edges and the current edge has not been deleted
          // and will not cause its neighbor to end up with less than 2 edges as well,
          else if (vx.getEdge(ord[k])>0 && vx.getNeighbor(ord[k]).nEdges>2) {
            // Delete the current edge
            vx.invertEdge(ord[k])
          }
        }
      }
    }
  },

  /**
   * Returns a NodeSet of all vertices with more than 2 edges remaining
   */
  getRemainders: graph => {
    const rems = NodeSet()
    for (let i=0; i<graph.length; i++) {
      for (let j=0; j<graph[i].length; j++) {
        if(graph[i][j].nEdges>2) rems.addNode(graph[i][j])
      }
    }
    return rems
  },

  /**
   * Object used to track the progress of a path, used in findDestroyer()
   */
  PathNode: (vertex, parent) => {
    const dn = {}
    
    dn.vertex = vertex
    dn.parent = parent
    dn.dirToParent = parent == null ? null : parent.vertex.sub(dn.vertex)
    dn.length = parent == null ? 1 : parent.length + 1
    dn.pathVertices = parent == null ? NodeSet() : dn.parent.pathVertices.copy()
    dn.pathVertices.addNode(dn.vertex)
    // These only works assuming nodes are added to the path correctly
    dn.isDestroyer = dn.length>=4 && dn.length%2==0 && dn.vertex.getEdge(dn.dirToParent)==1 && dn.parent.vertex.getEdge(dn.parent.dirToParent)==0
    dn.isAltEdge = dn.length<3 ? false : dn.vertex.getEdge(dn.dirToParent)!=dn.parent.vertex.getEdge(dn.parent.dirToParent)
    dn.isEvenAltEdge = dn.isAltEdge && dn.length%2==1

    dn.toPath = () => {
      const path = []
      for(c=dn; c!=null; c=c.parent) {
        path.push(c.vertex)
      }
      return path
    }

    return dn
  },

  /**
   * Breadth first search, can produce cycle unless prohibited in pathCriteria
   */
  _find: (graph, start, goals, stepLimit=0, pathCriteria=()=>true, goalCriteria=()=>true) => {
    const continuePath = (current, dir) => {
      const neighbor = current.vertex.getNeighbor(dir)
      // If the next vertex is not already part of the path (unless it is the start node), and meets path criteria
      return neighbor!=null && (neighbor==start || !current.pathVertices.hasNode(neighbor)) && pathCriteria(current, dir)
    }
    // Start BFS
    const open = [fnHamiltonian.PathNode(start, null)]
    let steps = 0
    let current = null
    while ((stepLimit<=0 || steps<stepLimit) && open.length>0 && goals.size()>0) {
      current = open.shift()
      if (goals.hasNode(current.vertex) && goalCriteria(current)) {
        goals.deleteNode(current.vertex)
        return current.toPath()
      }
      // For each direction from this vertex,
      game.DIRECTIONS.forEach(dir => {
        // Excluding the direction to the parent, add to open if meets criteria.
        if(current.parent==null || !dir.eq(current.dirToParent)) {
          if(continuePath(current, dir)) {
            const node = current.vertex.sum(dir)
            open.push(fnHamiltonian.PathNode(graph[node.x][node.y], current))
          }
        }
      })
      steps++
    }

    return [start]
  },

  /**
   * Returns the shortest Connector cycle for a given starting node.
   * This mutates the goals object by deleting the vertices that are part of the path.
   */
  findConnector: (graph, start, goals, stepLimit=100) => {
    //
    const pathCriteria = (current, dir) => {
      return current.length<3 || 
        (current.isAltEdge && current.vertex.getEdge(current.dirToParent)!=current.vertex.getEdge(dir))
    }
    const goalCriteria = current => current.isEvenAltEdge
    return fnHamiltonian._find(graph, start, goals, stepLimit, pathCriteria, goalCriteria)
  },

  /**
   * Randomly selects a vertex to search for a connector cycle, if one is found, it will invert it.
   * This is done until the iteration limit is hit or a hamiltonian cycle is found.
   */
  invertConnectorPaths: (graph, stepLimit=0, iterationLimit=100) => {
    for(let i=0; i<iterationLimit; i++) {
      const start = graph[utils.randInt(0, graph.length-1)][utils.randInt(0, graph[0].length-1)]
      const goals = NodeSet()
      goals.addNode(start)
      fnHamiltonian.invertPath(fnHamiltonian.findConnector(graph, start, goals, stepLimit))
      if(fnHamiltonian.isHamiltonianCycle(graph)) break
    }
  },

  /**
   * Returns the shortest Destroyer path found between start and any one of the goals.
   * This mutates the goals object by deleting the vertices that are part of the path.
   */
  findDestroyer: (graph, start, goals, stepLimit=0) => {
    const pathCriteria = (current, dir) => {
      // If below minimum length, check if it is alternating in the right way
      return (current.length==1 && current.vertex.getEdge(dir)==1) ||  
      (current.length==2 && current.vertex.getEdge(current.dirToParent)==1 && current.vertex.getEdge(dir)==0) ||
      (current.length==3 && current.vertex.getEdge(current.dirToParent)==0 && current.vertex.getEdge(dir)==1) ||
      // If isDestroyer and the next edge has been deleted
      (current.length>=4 && current.isDestroyer && current.vertex.getEdge(dir)==0) ||
      // If not destroyer, parent isDestroyer and the next edge exists
      (current.length>=4 && !current.isDestroyer && current.parent.isDestroyer && current.vertex.getEdge(dir)==1)
    }
    goals.deleteNode(start)
    return fnHamiltonian._find(graph, start, goals, stepLimit, pathCriteria)
  },

  /**
   * Returns an array of destroyer paths in a given graph.
   * These paths start and end at remainder nodes (more than 2 edges).
   */
  getDestroyerPaths: (graph, stepLimit=0) => {
    const remainders = fnHamiltonian.getRemainders(graph)
    const remCopy = remainders.copy()
    const paths = []
    remainders.lookup.forEach(vx => {
      if (remCopy.hasNode(vx)) paths.push(fnHamiltonian.findDestroyer(graph, vx, remCopy, stepLimit))
    })
    return paths
  },

  /**
   * Inverts all edges in the path, 10101 becomes 01010
   * When used on a destroyer path where the start and end vertices have 3 edges each,
   * It will reduce them both down to 2 edges while maintaining the same number of edges for
   * all other vertices in the path.
   */
  invertPath: path => {
    path.forEach((vx, i) => {
      if (i<path.length-1) {
        const dir = path[i+1].sub(vx)
        vx.invertEdge(dir)
      }
    })
  },

  /**
   * Returns true if the graph contains a Hamiltonian cycle
   */
  isHamiltonianCycle: graph => {
    const exclusions = NodeSet()
    const pathVertices = NodeSet()
    let start = null
    // Check that all vertices are valid
    for (let i=0; i<graph.length; i++) {
      for (let j=0; j<graph[i].length; j++) {
        // No edges means it is deliberately excluded from the path
        if(graph[i][j].nEdges==0) exclusions.addNode(graph[i][j]) 
        // Must only have 2 edges
        else if (graph[i][j].nEdges!=2) return false 
        else if (start==null) start = graph[i][j]
      }
    }

    // Go through the path and check if it is a Hamiltonian Cycle
    pathVertices.addNode(start)
    let prevDir = start.getMove()
    let current = start.getNeighbor(prevDir)
    while (!pathVertices.hasNode(current) && !exclusions.hasNode(current)) {
      pathVertices.addNode(current)
      prevDir = current.getMove(game.DIR_OPPOSITES.get(prevDir))
      current = current.getNeighbor(prevDir)
      if (current==null) break
    }

    const nVx = pathVertices.size() + exclusions.size()
    const nGraphVx = graph.length * graph[0].length
    return current!=null && current == start && nVx==nGraphVx
  },

  /**
   * Returns a string representation of the given graph
   */
  toString: graph => {
    let string = ""
    // Rows first and then Columns
    for (let j=0; j<graph[0].length; j++) {
      for (let i=0; i<graph.length; i++) {
        for (let k=0; k<game.DIRECTIONS.length; k++) {
          const v = graph[i][j].getEdge(game.DIRECTIONS[k])
          if (v == 1) string += game.DIR_SYMBOLS.get(game.DIRECTIONS[k])
          else string += " "
        }
        string += ", "
      }
      string += "\n"
    }
    return string
  },
}