const game = {
  /**
   * Returns a State with mutations based on update
   */
  next: (nx, ny) => (state=null, update=null) => {
    if (state==null) {
      const snake = [game.Node(0,0), game.Node(0,1)]
      return {
        isAlive: true,
        justEaten: false,
        snake: snake,
        direction: gmc.EAST,
        apple: game.nextApple(nx, ny, snake),
        nx: nx,
        ny: ny
      }
    } else {
      const head = game.nextHead(state.snake, update.direction)
      const willEat = game.willEat(head, state.apple)
      const snake = game.nextSnake(state.snake, head, willEat)
      return {
        isAlive: game.willLive(state.nx, state.ny, head, state.snake),
        justEaten: willEat,
        snake: snake,
        direction: update.direction,
        apple: willEat? game.nextApple(state.nx, state.ny, snake) : state.apple,
        nx: nx,
        ny: ny
      }
    }
  },

  /**
   * Returns true if head is equal to apple
   */
  willEat: (head, apple) => head.eq(apple),

  /**
   * Returns true if snake does not leave the game area or intercept itself
   */
  willLive: (nx, ny, head, snake) => head.inBounds(nx, ny) && !snake.some(node => node.eq(head)),
  
  /**
   * Returns a Node where the snake's head would be if it moved toward dir
   */
  nextHead: (snake, dir) => snake[snake.length-1].sum(dir),

  /**
   * If grow is true, return snake + head, else return snake[0:-1] + head
   */
  nextSnake: (snake, head, grow) => grow ? snake.concat(head) : snake.slice(1).concat(head),

  /**
   * Returns a randomly positioned node that excludes any part of snake
   */
  nextApple: (nx, ny, snake) => {
    let apple = null
    while(apple==null || snake.some(node => node.eq(apple))) {
      apple = game.Node(utils.randInt(0, nx-1), utils.randInt(0, ny-1))
    }
    return apple
  },

  /**
   * Returns a Node at position x,y
   */
  Node: (x, y) => {
    const node = {}
    node.x = x
    node.y = y

    /**
     * Returns true if node is in game boundary given by nx, ny
     */
    node.inBounds = (nx, ny) => node.x>=0 && node.x<nx && node.y>=0 && node.y<ny

    /**
     * Returns true if node's components equal n's components
     */
    node.eq = n => node.x == n.x && node.y == n.y

    /**
     * Returns a new Node with the sum of node and n's components
     */
    node.sum = n => game.Node(node.x + n.x, node.y + n.y)

    return node
  },
}

/**
 * Game Constants
 */
const gmc = {
  NORTH: game.Node(0,-1), 
  SOUTH: game.Node(0,1), 
  EAST: game.Node(1,0), 
  WEST: game.Node(-1,0),
}