
/**
 * 
 */
const ShortestPath = () => {
  const sp = {}
  sp.path = null
  sp.policy = null

  sp.getAction = node => sp.policy[node.x][node.y]

  sp.search = (origin, goal, nx, ny, exclusions=NodeMap(), startDir=game.NORTH) => {
    const open = [[null, origin]]
    const closed = exclusions

    let current = null
    while (open.length>0) {
      current = open.shift()
      if(current[1].eq(goal)) return sp.buildPath(current)
      else {
        const currentDir = current[0]==null ? startDir : current[1].sub(current[0][1])
        const dirs = [currentDir].concat(game.DIRECTIONS.filter(d => !d.eq(currentDir)))
        dirs.map(d => current[1].sum(d))
          .filter(n => n.inBounds(nx, ny) && !closed.has(n.x, n.y))
          .forEach(n => {
            open.push([current, n])
            closed.addNode(n)
          })
      }
    }

    return []
  }

  sp.buildPath = current => {
    let path = []
    for (let c=current; c!=null; c=c[0]) {
      path.push(c[1])
    }
    return path
  }

  sp.buildPolicy = (state, path) => {
    let policy = Array.from(Array(state.nx), _ => Array.from(Array(state.ny), _ => null))
    for (let i=0; i<path.length-1; i++) {
      const nextNode = path[i]
      const srcNode = path[i+1]
      policy[srcNode.x][srcNode.y] = nextNode.sub(srcNode)
    }
    return policy
  }

  sp.buildAnyPath = state => {
    const start = [null, state.snake[0]]
    const neighbors = [state.direction].concat(game.DIRECTIONS.filter(d => !d.eq(state.direction)))
      .map(d => state.snake[0].sum(d))
      .filter(n => 
        n.inBounds(state.nx, state.ny) && 
        !state.snake.some(n1 => n1.eq(n) && 
        !state.walls.has(n.x, n.y)))
    
    if (neighbors.length>0) return sp.buildPath([start, neighbors[0]])
    else return sp.buildPath([start, state.snake[0].sum(state.direction)])
  }

  sp.update = (state, goal) => {
    const exclusions = state.walls.copy()
    state.snake.forEach(n => exclusions.addNode(n))
    let path = sp.search(state.snake[0], goal, state.nx, state.ny, exclusions, state.direction)
    if (path.length>0) {
      sp.path = path
      sp.policy = sp.buildPolicy(state, sp.path)
    } else {
      sp.path = sp.buildAnyPath(state)
      sp.policy = sp.buildPolicy(state, sp.path)
    }
  }

  return sp
}