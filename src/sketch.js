const sketch = ( p ) => {

  p.frameRate(24)
  let scale = 5
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
    update = {direction: game.EAST}
    qModel.policy = null
  }

  const PLAY = 0
  const QLEARN = 1
  let mode = QLEARN
  let qModel = QLearn(500, 300, 1, 0.01, 0.01, 0.9, 0.9, 1, -1)

  // Pre-allocate DOM component vars, cant be inited until setup() is called
  let canvas = null
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

    if(mode==QLEARN) {
      qModel.update(next, state, state.justEaten)
      update.direction = qModel.getAction(state.snake[state.snake.length-1])
      p5QLearn.draw(p, toX, toY, qModel, state)
    }

    p5Game.draw(p, toX, toY, state)
    
    p.noFill()
    p.strokeWeight(5)
    p.rect(0, 0, p.width, p.height)
  }

  p.keyPressed = () => {
    if (p.key == "w") {
      update.direction = game.NORTH
    } else if (p.key == "s") {
      update.direction = game.SOUTH
    } else if (p.key == "d") {
      update.direction = game.EAST
    } else if (p.key == "a") {
      update.direction = game.WEST
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

const p5QLearn = {
  draw: (p, toX, toY, model, state) => {
    // See if the best move (a direction) is equal to dir (a given direction)
    const matchDir = (node, dir) => model.getAction(node).eq(dir)
    const max = () => { // Get the largest value in the qTable
      let maxQ = null
      for (let i=0; i<model.policy.length; i++) {
        for (let j=0; j<model.policy[0].length; j++) {
          const v = model.maxQ(Node(i,j))
          if (maxQ==null || v>maxQ) maxQ = v
        }
      }
      return maxQ
    }
    const drawArrow = (node, tipXMove, tipYMove, baseXMove, baseYMove) => {
      let x = node.x + 0.5
      let y = node.y + 0.5
      p.beginShape();
      p.vertex(toX(x+baseXMove), toY(y+baseYMove));
      p.vertex(toX(x+tipXMove), toY(y+tipYMove));
      p.vertex(toX(x-baseXMove), toY(y-baseYMove));
      p.endShape(p.CLOSE);
    }

    const vmax = max()
    model.policy.map((v, i) => v.map((q, j) => {
      node = Node(i,j)
      p.noStroke()
      p.fill(`rgba(0,191,255,${Math.max(0.1, p.map(model.maxQ(node), vmax/6, vmax, 0, 1))})`)
      if (model.allQEq(node)) {} // Do nothing, if all qs are equal, the move is random
      else if (matchDir(node, game.NORTH)) drawArrow(node, 0, -0.5, 0.25, 0)
      else if (matchDir(node, game.SOUTH)) drawArrow(node, 0, 0.5, 0.25, 0)
      else if (matchDir(node, game.EAST)) drawArrow(node, 0.5, 0, 0, 0.25)
      else drawArrow(node, -0.5, 0, 0, 0.25)
    }))
  }
}

let p5Instance = new p5(sketch)
