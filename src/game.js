/**
 * This is the object used for each snake segment and apple
 * It contains its integer grid location, as well as some useful methods
 */
const Node = (x, y) => {
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
  node.sum = n => Node(node.x + n.x, node.y + n.y)

  return node
}

/**
 * This contains all the functions needed to run the game
 */
const game = {
  /**
   * Constants
   */
  NORTH: Node(0,-1),
  SOUTH: Node(0,1),
  EAST: Node(1,0),
  WEST: Node(-1,0),

  /**
   * Returns a State with mutations based on update
   */
  next: (nx, ny) => (state=null, update=null) => {
    if (state==null) {
      const snake = [Node(1,0), Node(0,0)]
      return {
        isAlive: true,
        justEaten: true,
        snake: snake,
        direction: game.EAST,
        apple: game.nextApple(nx, ny, snake),
        nx: nx,
        ny: ny
      }
    } else {
      const isValidDir = game.isValidDir(state.snake, update ? update.direction : null)
      // Necessary otherwise 1/4 exploration moves in qlearning could result in death
      const direction = isValidDir ? update.direction : state.direction 
      const head = game.nextHead(state.snake, direction)
      const willEat = game.willEat(head, state.apple)
      const willLive = game.willLive(state.nx, state.ny, head, state.snake)
      const snake = willLive ? game.nextSnake(state.snake, head, willEat) : state.snake
      return {
        isAlive: willLive,
        justEaten: willEat,
        snake: snake,
        direction: direction,
        apple: willEat? game.nextApple(state.nx, state.ny, snake) : state.apple,
        nx: nx,
        ny: ny
      }
    }
  },
  
  /**
   * 
   */
   isValidDir: (snake, dir) => dir==null ? false : !game.nextHead(snake, dir).eq(snake[1]),

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
  nextHead: (snake, dir) => snake[0].sum(dir),

  /**
   * If grow is true, return head + snake, else return head + snake[0:-1]
   */
  nextSnake: (snake, head, grow) => [head].concat(grow ? snake : snake.slice(0,-1)),

  /**
   * Returns a randomly positioned node that excludes any part of snake
   */
  nextApple: (nx, ny, snake) => {
    let apple = null
    while(apple==null || snake.some(node => node.eq(apple))) {
      apple = Node(utils.randInt(0, nx-1), utils.randInt(0, ny-1))
    }
    return apple
  },
}

game.DIRECTIONS = [game.NORTH, game.SOUTH, game.EAST, game.WEST]