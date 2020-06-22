const Hamiltonian = () => {
  const hm = {}

  

  hm.edgeMap = new Map()
  game.DIRECTIONS.forEach((d, i) => { hm.edgeMap.set(i, d) })
  game.DIRECTIONS.forEach((d, i) => { hm.edgeMap.set(d, i) })

  /**
   * Returns a graph of width nx and height ny where all vertexes are connected to their 
   * North, South, East and West neighbors (except at the 4 sides of the graph)
   */
  hm.mkGraph = (nx, ny) => {
    const mkEdges = () => Array(game.DIRECTIONS.length).fill(1)
    const graph = Array.from(Array(nx), _ => Array.from(Array(ny), _ => mkEdges()))
    // 1 for edge, 0 for deleted edge, -1 for no edge
    // Top
    for (let i=0; i<graph.length; i++) {
      graph[i][0][hm.edgeMap.get(game.NORTH)] = -1
    }
    // Bottom
    const bottom = graph[0].length-1
    for (let i=0; i<graph.length; i++) {
      graph[i][bottom][hm.edgeMap.get(game.SOUTH)] = -1
    }
    // Left
    for (let i=0; i<graph[0].length; i++) {
      graph[0][i][hm.edgeMap.get(game.WEST)] = -1
    }
    // Right
    const right = graph[graph.length-1].length-1
    for (let i=0; i<graph[graph.length-1].length; i++) {
      graph[right][i][hm.edgeMap.get(game.EAST)] = -1
    }
    return graph
  }

  /**
   * Count the number of remaining edges in the given vertex
   */
  hm.countEdges = vertex => vertex.reduce((acc, v) => v>0 ? acc+1 : acc, 0)

  /**
   * Invert the status of the given edge between deleted and not deleted
   */
  hm.invertEdge = (graph, i, j, k) => {
    const i2 = i+game.DIRECTIONS[k].x
    const j2 = j+game.DIRECTIONS[k].y

    graph[i][j][k] = graph[i][j][k]==0 ? 1 : 0
    graph[i2][j2][hm.edgeMap.get(game.DIR_OPPOSITES[k])] = graph[i][j][k]
  }

  /**
   * Randomly delete surplus edges from each vertex until there are none remaining
   */
  hm.deletion = graph => {
    for (let i=0; i<graph.length; i++) {
      for (let j=0; j<graph[i].length; j++) {
        // In vertex[i,j],
        let edgeCount = hm.countEdges(graph[i][j])
        let rand = utils.shuffledRange(graph[i][j].length)
        // Evaluate edges in random order,
        for (let k=0 ; k<rand.length; k++) {
          // If there are more than 2 edges and the current edge has not been deleted,
          if (edgeCount>2 && graph[i][j][rand[k]]>0) {
            const i2 = i+game.DIRECTIONS[rand[k]].x
            const j2 = j+game.DIRECTIONS[rand[k]].y
            // And if it will not cause its counterpart to end up with less than 2 edges as well,
            if(hm.countEdges(graph[i2][j2])>2) {
              // Delete the current edge
              hm.invertEdge(graph, i, j, rand[k])
              edgeCount--
            }
          } else break
        }
      }
    }
  }

  /**
   * 
   */
  hm.destroyer = (graph)

  /**
   * Returns a string representation of the given graph
   */
  hm.toString = graph => {
    let string = ""
    for (let j=0; j<graph[0].length; j++) {
      for (let i=0; i<graph.length; i++) {
        for (let k=0; k<graph[i][j].length; k++) {
          const v = graph[i][j][k]
          if (v == 1) {
            string += game.DIR_SYMBOLS[k]
          } else string += " "
        }
        string += ", "
      }
      string += "\n"
    }
    return string
  }
  
  return hm
}