const gameTests = {
  'Node': () => {
    const nodes = [Node(1,2), Node(1,2), Node(0,3), Node(1,3), Node(0,2)]

    eq(1, nodes[0].x)
    eq(2, nodes[0].y)

    //equality
    eq(true, nodes[0].eq(nodes[1]))
    eq(false, nodes[0].eq(nodes[2]))
    eq(false, nodes[0].eq(nodes[3]))
    eq(false, nodes[0].eq(nodes[4]))

    // sum
    eq(true, Node(2,4).eq(nodes[0].sum(nodes[1])))
    eq(false, Node(2,2).eq(nodes[0].sum(nodes[1])))
    eq(false, Node(1,4).eq(nodes[0].sum(nodes[1])))
    eq(true, Node(1,5).eq(nodes[0].sum(nodes[2])))
    eq(true, Node(2,5).eq(nodes[0].sum(nodes[3])))
    eq(true, Node(1,4).eq(nodes[0].sum(nodes[4])))
    
    // inbounds
    eq(true, nodes[0].inBounds(3, 3))
    eq(true, nodes[0].inBounds(2, 3))
    eq(false, nodes[0].inBounds(0, 3))
    eq(false, nodes[0].inBounds(2, 2))
    eq(false, Node(-1, 2).inBounds(5, 5))
    eq(false, Node(2, -1).inBounds(5, 5))
  },

  'walls': () => {
    const walls = Walls()
    eq(walls.size(), 0)
    eq(walls.has(10, 6), false)
    walls.add(10, 6)
    eq(walls.size(), 1)
    eq(walls.has(10, 6), true)
    eq(true, walls.get(10,6).eq(Node(10,6)))
    walls.delete(10, 6)
    eq(walls.size(), 0)
    eq(walls.has(10, 6), false)
  },

  'willEat': () => {
    const head = Node(5,8)
    const apples = [Node(5,8), Node(5,9), Node(4,8)]

    eq(true, game.willEat(head, apples[0]))
    eq(false, game.willEat(head, apples[1]))
    eq(false, game.willEat(head, apples[2]))
  },

  'willLive': () => {
    const heads = [Node(5,8), Node(1,1), Node(1,-1), Node(-1,1)]
    const snake1 = [Node(0,0), Node(0,1)]
    const snake2 = [Node(1,1), Node(0,1)]
    const wallsEmpty = Walls()
    
    eq(false, game.willLive(2, 2, heads[0], snake1, wallsEmpty))
    eq(false, game.willLive(6, 8, heads[0], snake1, wallsEmpty))
    eq(false, game.willLive(5, 9, heads[0], snake1, wallsEmpty))
    eq(true, game.willLive(6, 9, heads[0], snake1, wallsEmpty))
    eq(true, game.willLive(10, 10, heads[1], snake1, wallsEmpty))
    eq(false, game.willLive(10, 10, heads[1], snake2, wallsEmpty))
    eq(false, game.willLive(10, 10, heads[2], snake1, wallsEmpty))
    eq(false, game.willLive(10, 10, heads[3], snake1, wallsEmpty))

    const walls1 = Walls()
    walls1.add(5, 8)
    eq(false, game.willLive(6, 9, heads[0], snake1, walls1))
    eq(true, game.willLive(10, 10, heads[1], snake1, walls1))
    walls1.delete(5, 8)
    walls1.add(1, 1)
    eq(true, game.willLive(6, 9, heads[0], snake1, walls1))
    eq(false, game.willLive(10, 10, heads[1], snake1, walls1))
  },

  'nextHead': () => {
    const cur = Node(1,1)
    eq(true, Node(1,0).eq(cur.sum(game.NORTH)))
    eq(true, Node(1,2).eq(cur.sum(game.SOUTH)))
    eq(true, Node(0,1).eq(cur.sum(game.WEST)))
    eq(true, Node(2,1).eq(cur.sum(game.EAST)))
  },

  'nextSnake': () => {
    const snake1 = [Node(0,1), Node(0,0)]
    const snake2 = [Node(1,1), Node(0,1), Node(0,0)]
    const snake3 = [Node(1,1), Node(0,1)]

    eq(true, game.nextSnake(snake1, Node(1,1), true).every((node, i) => node.eq(snake2[i])))
    eq(false, game.nextSnake(snake1, Node(1,1), true).length == snake3.length)
    eq(false, game.nextSnake(snake1, Node(1,1), false).length == snake2.length)
    eq(true, game.nextSnake(snake1, Node(1,1), false).every((node, i) => node.eq(snake3[i])))
  },

  'nextApple': () => {
    const snake1 = [Node(0,0), Node(0,1), Node(1,1)]
    const wall1 = Walls()
    wall1.add(2,1)
    wall1.add(2,0)

    // Should never return any apples on the snake
    for (let i=0; i<10; i++) {
      eq(true, Node(1,0).eq(game.nextApple(3,2,snake1,wall1)))
    }

    let apple = game.nextApple(1000,1000,snake1,wall1)
    let tolerance = 1
    // Should always be different position, but this can still sometimes fail
    for (let i=0; i<10; i++) {
      let res = apple.eq(game.nextApple(1000,1000,snake1,wall1))
      if (res && tolerance>0) {
        tolerance--
        res = false
      }
      eq(false, res)
    }
  },

  'next': () => {
    const compareKeys = (a, b) => {
      var aKeys = Object.keys(a).sort();
      var bKeys = Object.keys(b).sort();
      return JSON.stringify(aKeys) === JSON.stringify(bKeys);
    }
    const next = game.next(10, 9, Walls())
    const dirs = game.DIRECTIONS
    let state = next()

    // Check initial State
    eq(state.nx, 10)
    eq(state.ny, 9)
    eq(state.isAlive, true)
    eq(state.justEaten, true)
    eq(true, state.snake.reduce((isLinked, node, i, arr)=> {
      if (i==0) return true
      else if (isLinked) return dirs.some(d => arr[i-1].eq(d.sum(node)))
      else return isLinked
    }))
    eq(true, dirs.some(d => d.eq(state.direction)))
    eq(true, compareKeys(Node(0,0), state.apple))
    eq(true, compareKeys(Walls(), state.walls))

    // Check initial state advanced by one step
    let state3 = next(state)
    eq(state3.nx, 10)
    eq(state3.ny, 9)
    eq(state3.isAlive, true)
    eq(state3.justEaten, false)
    eq(true, state.snake.reduce((isLinked, node, i, arr)=> {
      if (i==0) return true
      else if (isLinked) return dirs.some(d => arr[i-1].eq(d.sum(node)))
      else return isLinked
    }))
    eq(true, dirs.some(d => d.eq(state.direction)))
    eq(state3.walls, state.walls)

    // Check custom state
    state.snake = [Node(6,5), Node(5,5)]
    state.apple = Node(6,6)
    let state2 = next(state, {direction: game.SOUTH})
    eq(false, state == state2) // state should always be a new state
    eq(false, state.snake == state2.snake) // snake should always be a copy
    eq(state2.nx, 10)
    eq(state2.ny, 9)
    eq(state2.isAlive, true)
    eq(state2.justEaten, true)
    eq(true, state2.snake.reduce((isLinked, node, i, arr)=> {
      if (i==0) return true
      else if (isLinked) return dirs.some(d => arr[i-1].eq(d.sum(node)))
      else return isLinked
    }))
    eq(state2.snake.length, 3)
    eq(true, state2.direction.eq(game.SOUTH))
    eq(true, compareKeys(Node(0,0), state2.apple))
  },
}