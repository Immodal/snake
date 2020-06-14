const sketch = ( p ) => {
  // Pre-allocate DOM component vars, cant be inited until setup() is called
  let canvas = null

  p.frameRate(24)
  let scale = 15
  const nX = () => 2 * scale
  const nY = () => 2 * scale
  const toX = i => Math.round(i * p.width / nX())
  const toY = i => Math.round(i * p.height / nY())

  let next = null
  let state = null
  let update = null
  const restart = () => {
    next = game.next(nX(), nY())
    state = next()
    update = {direction: gmc.EAST}
  }

  const initCanvas = () => {
    canvas = p.createCanvas(500, 500)
    canvas.parent("#cv")
  }

  p.setup = () => {
    initCanvas()
    restart()
  }

  p.draw = () => {
    p.background(240)
    state = next(state, update)
    if (!state.isAlive) restart()

    p5Game.draw(p, toX, toY, state)
    p.noFill()
    p.strokeWeight(5)
    p.rect(0, 0, p.width, p.height)
  }

  p.keyPressed = () => {
    if (p.key == "w") {
      update.direction = gmc.NORTH
    } else if (p.key == "s") {
      update.direction = gmc.SOUTH
    } else if (p.key == "d") {
      update.direction = gmc.EAST
    } else if (p.key == "a") {
      update.direction = gmc.WEST
    }
  }
}

const p5Game = {
  draw: (p, toX, toY, state) => {
    const snake = state.snake
    const apple = state.apple

    // Draw snake
    p.strokeWeight(2)
    p.fill(0)
    snake.forEach(node => {
      p.rect(toX(node.x), toY(node.y), toX(1), toX(1))
    })
    // Draw Apple
    p.fill(255, 0, 0)
    p.rect(toX(apple.x), toY(apple.y), toX(1), toX(1))
  }
}

let p5Instance = new p5(sketch)
