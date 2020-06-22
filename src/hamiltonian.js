const Hamiltonian = (nx, ny) => {
  const hm = {}

  hm.Vertex = (x, y) => {
    const vx = Node(x, y)
    vx.edges = hm.EdgeMap()
    game.DIRECTIONS.forEach(dir => vx.edges.set(dir, 1))
    vx.nEdges = game.DIRECTIONS.length

    vx.setEdge = (dir, value) => {
      if (value>0 && vx.edges.get(dir)<=0) vx.nEdges++
      else if (value<=0 && vx.edges.get(dir)>0) vx.nEdges--
      vx.edges.set(dir, value)
    }

    vx.getEdge = dir => vx.edges.get(dir)

    vx.invertEdge = dir => { 
      if (vx.getEdge(dir)>=0) {
        vx.setEdge(dir, vx.getEdge(dir)>0 ? 0 : 1) 
        vx.getNeighbor(dir).setEdge(game.DIR_OPPOSITES.get(dir), vx.getEdge(dir)) 
      }
    }

    vx.getNeighbor = dir => {
      const node = vx.sum(dir)
      return node.inBounds(hm.graph.length, hm.graph[0].length) ? hm.graph[node.x][node.y] : null
    }

    return vx
  }

  hm.EdgeMap = () => {
    const em = {}
    em.lookup = new Map()

    em.encXY = (x, y) => `${x},${y}`

    em.set = (dir, value) => em.lookup.set(em.encXY(dir.x, dir.y), value)
  
    em.get = dir => em.lookup.get(em.encXY(dir.x,dir.y))
  
    em.size = () => em.lookup.size

    return em
  }

  /**
   * Returns a graph of width nx and height ny where all vertexes are connected to their 
   * North, South, East and West neighbors (except at the 4 sides of the graph)
   */
  hm.mkGraph = (nx, ny) => {
    const graph = Array.from(Array(nx), _ => Array.from(Array(ny), _ => null))
    // 1 for edge, 0 for deleted edge, -1 for no edge
    for (let i=0; i<graph.length; i++) {
      for (let j=0; j<graph[i].length; j++) {
        graph[i][j] = hm.Vertex(i, j)
        // No edges at the ends of the graph
        if (i==0) graph[i][j].setEdge(game.WEST, -1)
        else if (i==graph.length-1) graph[i][j].setEdge(game.EAST, -1)
        if (j==0) graph[i][j].setEdge(game.NORTH, -1)
        else if (j==graph[i].length-1) graph[i][j].setEdge(game.SOUTH, -1)
      }
    }
    return graph
  }

  /**
   * Returns a string representation of the given graph
   */
  hm.toString = graph => {
    let string = ""
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
  }

  /**
   * Randomly delete surplus edges from each vertex until there are none remaining
   */
  hm.deletion = () => {
    const graph = hm.graph
    for (let i=0; i<graph.length; i++) {
      for (let j=0; j<graph[i].length; j++) {
        // In vertex[i,j],
        const vx = graph[i][j]
        const ord = game.DIRECTIONS.concat()
        utils.shuffle(ord)
        // Evaluate edges in random order,
        for (let k=0 ; k<ord.length; k++) {
          // If there are more than 2 edges and the current edge has not been deleted
          // and will not cause its neighbor to end up with less than 2 edges as well,
          if (vx.nEdges>2 && vx.getEdge(ord[k])>0 && vx.getNeighbor(ord[k]).nEdges>2) {
            // Delete the current edge
            vx.invertEdge(ord[k])
          } else break // no point looping if there at minimum number
        }
      }
    }
  }

  /**
   * 
   */
  hm.DestroyerNode = (vertex, parent) => {
    const dn = {}
    
    dn.vertex = vertex
    dn.parent = parent
    dn.dirToParent = parent == null ? null : parent.vertex.sub(dn.vertex)
    dn.length = parent == null ? 1 : parent.length + 1
    dn.pathVertices = parent == null ? NodeMap() : dn.parent.pathVertices.copy()
    dn.pathVertices.addNode(dn.vertex)
    // This only works assuming nodes are added to the path correctly
    dn.isDestroyer = dn.length>=4 && dn.length%2==0 && dn.vertex.getEdge(dn.dirToParent)==1 && dn.parent.vertex.getEdge(dn.parent.dirToParent)==0
    return dn
  }

  /**
   * 
   */
  hm.destroyer = graph => {
    const continuePath = (current, dir) => {
      const neighbor = current.vertex.getNeighbor(dir)
      // If the next vertex is not already part of the path, and
      return neighbor!=null && !current.pathVertices.hasNode(neighbor) && (
        // If below minimum length, check if it is alternating in the right way
        (current.length==1 && current.vertex.getEdge(dir)==1) ||  
        (current.length==2 && current.vertex.getEdge(current.dirToParent)==1 && current.vertex.getEdge(dir)==0) ||
        (current.length==3 && current.vertex.getEdge(current.dirToParent)==0 && current.vertex.getEdge(dir)==1) ||
        // If isDestroyer and the next edge has been deleted
        (current.isDestroyer && current.vertex.getEdge(dir)==0) ||
        // If not destroyer, parent isDestroyer and the next edge exists
        (!current.isDestroyer && current.parent.isDestroyer && current.vertex.getEdge(dir)==1)
      )
    }

    const paths = []
    const open = [hm.DestroyerNode(graph[0][0], null, false)]
    let current = null
    while (open.length>0) {
      current = open.pop()
      let count = 0
      // For each direction from this vertex,
      game.DIRECTIONS.forEach(dir => {
        // Excluding the direction to the parent, add to open if meets criteria.
        if(current.parent==null || !dir.eq(current.dirToParent)) {
          if(continuePath(current, dir)) {
            const node = current.vertex.sum(dir)
            open.push(hm.DestroyerNode(graph[node.x][node.y], current))
            count++
          }
        }
      })
      // if can't extend anymore, get the longest destroyer from this path
      if (count==0 && current.length>=4) {
        if (current.length%2==0 && current.isDestroyer) paths.push(current)
        else if (current.length%2==1 && !current.isDestroyer && current.parent.isDestroyer) paths.push(current.parent)
      }
    }

    return paths
  }

  hm.graph = hm.mkGraph(nx, ny)
  hm.deletion()
  
  return hm
}