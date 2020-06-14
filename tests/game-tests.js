const gameTests = {
  'Node': () => {
    const nodes = [game.Node(1,2), game.Node(1,2), game.Node(0,3), game.Node(1,3), game.Node(0,2)]

    eq(1, nodes[0].x)
    eq(2, nodes[0].y)

    //equality
    eq(true, nodes[0].eq(nodes[1]))
    eq(false, nodes[0].eq(nodes[2]))
    eq(false, nodes[0].eq(nodes[3]))
    eq(false, nodes[0].eq(nodes[4]))

    // sum
    eq(true, game.Node(2,4).eq(nodes[0].sum(nodes[1])))
    eq(false, game.Node(2,2).eq(nodes[0].sum(nodes[1])))
    eq(false, game.Node(1,4).eq(nodes[0].sum(nodes[1])))
    eq(true, game.Node(1,5).eq(nodes[0].sum(nodes[2])))
    eq(true, game.Node(2,5).eq(nodes[0].sum(nodes[3])))
    eq(true, game.Node(1,4).eq(nodes[0].sum(nodes[4])))
    
    // inbounds
    eq(true, nodes[0].inBounds(3, 3))
    eq(true, nodes[0].inBounds(2, 3))
    eq(false, nodes[0].inBounds(0, 3))
    eq(false, nodes[0].inBounds(2, 2))
    eq(false, game.Node(-1, 2).inBounds(5, 5))
    eq(false, game.Node(2, -1).inBounds(5, 5))
  },

  'willEat': () => {
    const head = game.Node(5,8)
    const apples = [game.Node(5,8), game.Node(5,9), game.Node(4,8)]

    eq(true, game.willEat(head, apples[0]))
    eq(false, game.willEat(head, apples[1]))
    eq(false, game.willEat(head, apples[2]))
  },

  'willLive': () => {
    const heads = [game.Node(5,8), game.Node(1,1), game.Node(1,-1), game.Node(-1,1)]
    const snake1 = [game.Node(0,0), game.Node(0,1)]
    const snake2 = [game.Node(1,1), game.Node(0,1)]

    eq(false, game.willLive(2, 2, heads[0], snake1))
    eq(false, game.willLive(6, 8, heads[0], snake1))
    eq(false, game.willLive(5, 9, heads[0], snake1))
    eq(true, game.willLive(6, 9, heads[0], snake1))
    eq(true, game.willLive(10, 10, heads[1], snake1))
    eq(false, game.willLive(10, 10, heads[1], snake2))
    eq(false, game.willLive(10, 10, heads[2], snake1))
    eq(false, game.willLive(10, 10, heads[3], snake1))
  },

  'nextHead': () => {
    const cur = game.Node(1,1)
    eq(true, game.Node(1,0).eq(cur.sum(gmc.NORTH)))
    eq(true, game.Node(1,2).eq(cur.sum(gmc.SOUTH)))
    eq(true, game.Node(0,1).eq(cur.sum(gmc.WEST)))
    eq(true, game.Node(2,1).eq(cur.sum(gmc.EAST)))
  },

  'nextSnake': () => {
    const snake1 = [game.Node(0,0), game.Node(0,1)]
    const snake2 = [game.Node(0,0), game.Node(0,1), game.Node(1,1)]
    const snake3 = [game.Node(0,1), game.Node(1,1)]

    eq(true, game.nextSnake(snake1, game.Node(1,1), true).every((node, i) => node.eq(snake2[i])))
    eq(false, game.nextSnake(snake1, game.Node(1,1), true).every((node, i) => node.eq(snake3[i])))
    eq(false, game.nextSnake(snake1, game.Node(1,1), false).every((node, i) => node.eq(snake2[i])))
    eq(true, game.nextSnake(snake1, game.Node(1,1), false).every((node, i) => node.eq(snake3[i])))
  },

  'nextApple': () => {
    const snake1 = [game.Node(0,0), game.Node(0,1), game.Node(1,1)]

    // Should never return any apples on the snake
    for (let i=0; i<10; i++) {
      eq(true, game.Node(1,0).eq(game.nextApple(2,2,snake1)))
    }

    let apple = game.nextApple(1000,1000,snake1)
    let tolerance = 1
    // Should always be different position, but this can still sometimes fail
    for (let i=0; i<10; i++) {
      let res = apple.eq(game.nextApple(1000,1000,snake1))
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
    const next = game.next(10, 9)
    const dirs = [gmc.NORTH, gmc.SOUTH, gmc.EAST, gmc.WEST]
    let state = next()

    eq(state.nx, 10)
    eq(state.ny, 9)
    eq(state.isAlive, true)
    eq(state.justEaten, false)
    eq(true, state.snake.reduce((isLinked, node, i, arr)=> {
      if (i==0) return true
      else if (isLinked) return dirs.some(d => arr[i-1].eq(d.sum(node)))
      else return isLinked
    }))
    eq(true, dirs.some(d => d.eq(state.direction)))
    eq(true, compareKeys(game.Node(0,0), state.apple))

    state.snake = [game.Node(5,5), game.Node(6,5)]
    state.apple = game.Node(6,6)
    let state2 = next(state, {direction: gmc.SOUTH})
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
    eq(true, state2.direction.eq(gmc.SOUTH))
    eq(true, compareKeys(game.Node(0,0), state2.apple))
  },
}