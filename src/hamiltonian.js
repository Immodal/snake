
const Hamiltonian = state => {
  const hm = {}

  return hm
}

// https://springerplus.springeropen.com/articles/10.1186/s40064-016-2746-8
fnHamiltonian = {
  /**
   * 
   */
  mkCycle: (nx, ny, iLimit=100) => {
    let graph = fnHamiltonian.mkGraph(nx, ny)
    fnHamiltonian.runDeletion(graph)
    fnHamiltonian.getDestroyerPaths(graph).forEach(p => fnHamiltonian.invertPath(p))
    for(let i=0; i<iLimit; i++) {
      const start = graph[utils.randInt(0, graph.length-1)][utils.randInt(0, graph[0].length-1)]
      const goals = NodeSet()
      goals.addNode(start)
      fnHamiltonian.invertPath(fnHamiltonian.findConnector(graph, start, goals))
      if(fnHamiltonian.isHamiltonianCycle(graph)) break
    }
    return graph
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

    // Returns the neighboring Vertex in a given direction
    vx.getNeighbor = dir => {
      const node = vx.sum(dir)
      return node.inBounds(vx.graph.length, vx.graph[0].length) ? vx.graph[node.x][node.y] : null
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
        if (i==0) graph[i][j].setEdge(game.WEST, -1)
        else if (i==graph.length-1) graph[i][j].setEdge(game.EAST, -1)
        if (j==0) graph[i][j].setEdge(game.NORTH, -1)
        else if (j==graph[i].length-1) graph[i][j].setEdge(game.SOUTH, -1)
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
  _find: (graph, start, goals, pathCriteria=()=>true, goalCriteria=()=>true) => {
    const continuePath = (current, dir) => {
      const neighbor = current.vertex.getNeighbor(dir)
      // If the next vertex is not already part of the path (unless it is the start node), and meets path criteria
      return neighbor!=null && (neighbor==start || !current.pathVertices.hasNode(neighbor)) && pathCriteria(current, dir)
    }
    // Start BFS
    const open = [fnHamiltonian.PathNode(start, null)]
    let current = null
    while (open.length>0 && goals.size()>0) {
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
    }

    return [start]
  },

  /**
   * 
   */
  findConnector: (graph, start, goals) => {
    //
    const pathCriteria = (current, dir) => {
      return current.length<3 || 
        (current.isAltEdge && current.vertex.getEdge(current.dirToParent)!=current.vertex.getEdge(dir))
    }
    const goalCriteria = current => current.isEvenAltEdge
    return fnHamiltonian._find(graph, start, goals, pathCriteria, goalCriteria)
  },

  /**
   * Returns the shortest Destroyer path found between start and any one of the goals
   * This mutates the goals object by deleting the vertices that are part of the path
   */
  findDestroyer: (graph, start, goals) => {
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
    return fnHamiltonian._find(graph, start, goals, pathCriteria)
  },

  /**
   * Returns an array of destroyer paths in a given graph
   * These paths start and end at remainder nodes (more than 2 edges)
   */
  getDestroyerPaths: graph => {
    const remainders = fnHamiltonian.getRemainders(graph)
    const remCopy = remainders.copy()
    const paths = []
    remainders.lookup.forEach(vx => {
      if (remCopy.hasNode(vx)) paths.push(fnHamiltonian.findDestroyer(graph, vx, remCopy))
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
    // Get a direction to move in from the vertex
    const getMove = (vx, exDir=null) => {
      for (let i=0; i<game.DIRECTIONS.length; i++) {
        if (vx.getEdge(game.DIRECTIONS[i])>0 && (exDir==null ? true : !game.DIRECTIONS[i].eq(exDir))) {
          return game.DIRECTIONS[i]
        }
      }
      return null
    }

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
    let prevDir = getMove(start)
    let current = start.getNeighbor(prevDir)
    while (!pathVertices.hasNode(current) && !exclusions.hasNode(current)) {
      pathVertices.addNode(current)
      prevDir = getMove(current, game.DIR_OPPOSITES.get(prevDir))
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