const sketch = ( p ) => {
  // Pre-allocate DOM component vars, cant be inited until setup() is called
  let canvas = null
  const initCanvas = () => {
    canvas = p.createCanvas(500, 500)
    canvas.parent("#cv")
  }

  let score = 0
  let scoreCounter = null
  const initScoreCounter = () => {
    scoreCounter = p.createSpan("0")
    scoreCounter.parent("#scoreCount")
  }
  const calcScore = state => state.snake.length-2
  const updateScore = s => {
    score = s
    scoreCounter.html(score)
  }

  let scores = []
  let scoreMean = null
  let scoreMedian = null
  let scoreMin = null
  let scoreMax = null
  let gameCount = null
  const initScoreStats = () => {
    gameCount = p.createSpan("0")
    gameCount.parent("#gameCount")
    scoreMean = p.createSpan("0")
    scoreMean.parent("#scoreMean")
    scoreMedian = p.createSpan("0")
    scoreMedian.parent("#scoreMedian")
    scoreMin = p.createSpan("0")
    scoreMin.parent("#scoreMin")
    scoreMax = p.createSpan("0")
    scoreMax.parent("#scoreMax")
  }
  const updateScoreStats = score => {
    if (score>=0) scores.push(score)
    scores.sort()
    const sum = scores.reduce((acc, v) => acc+v, 0)
    const mid = Math.floor(scores.length/2)
    gameCount.html(scores.length)
    scoreMean.html(scores.length>0 ? (sum/scores.length).toFixed(2) : 0)
    scoreMedian.html(scores.length>0 ? scores[mid] : 0)
    scoreMin.html(scores.length>0 ? scores[0] : 0)
    scoreMax.html(scores.length>0 ? scores[scores.length-1] : 0)
  }
  const resetScoreStats = () => {
    scores = []
    updateScore(0)
    updateScoreStats(-1)
  }

  const HUMAN = 0
  const QLEARN = 1
  let playerSelect = null
  const initPlayerSelect = () => {
    playerSelect = p.createSelect()
    playerSelect.style('font-size', '13px')
    playerSelect.parent("#playerSelect")
    playerSelect.option("Human", HUMAN)
    playerSelect.option("Q-Learning", QLEARN)
    playerSelect.value(QLEARN)
    playerSelect.changed(() => {
      resetScoreStats()
      restart()
    })
  }

  // Data
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
    update = {direction: game.EAST}
  }

  // Models
  let qModel = QLearn(100, 50, 1, 0.05, 0.01, 0.9, 0.9, 1, -1)

  /**
   * Setup
   */
  p.setup = () => {
    initCanvas()
    initScoreCounter()
    initScoreStats()
    initPlayerSelect()
    restart()

  }

  /**
   * Draw
   */
  p.draw = () => {
    p.background(240)
    state = next(state, update)
    if (state.justEaten) updateScore(calcScore(state))
    if (!state.isAlive) {
      updateScoreStats(calcScore(state))
      restart()
    }

    if(playerSelect.value()==QLEARN) {
      qModel.update(next, state, state.justEaten)
      update.direction = qModel.getAction(state.snake[0])
      p5QLearn.draw(p, toX, toY, qModel, state)
    }

    p5Game.draw(p, toX, toY, state)
  }

  /**
   * Key Pressed
   */
  p.keyPressed = () => {
    if (playerSelect.value()==HUMAN) {
      const direction = p5Game.processUserInput(p)
      update.direction = direction==null ? update.direction : direction
    }
  }
}

/**
 * Draw and Misc UI related functions for Game
 */
const p5Game = {
  draw: (p, toX, toY, state) => {
    const snake = state.snake
    const apple = state.apple

    p.stroke(0)
    // Draw snake
    p.strokeWeight(2)
    p.fill(0)
    snake.forEach(node => {
      p.rect(toX(node.x), toY(node.y), toX(1), toX(1))
    })
    // Draw Apple
    p.fill(255, 0, 0)
    p.rect(toX(apple.x), toY(apple.y), toX(1), toX(1))

    // Draw Outer Frame
    p.noFill()
    p.strokeWeight(5)
    p.rect(0, 0, p.width, p.height)
  },

  processUserInput: p => {
    if (p.key == "w") return game.NORTH
    else if (p.key == "s") return game.SOUTH
    else if (p.key == "d") return game.EAST
    else if (p.key == "a") return game.WEST
    else return null
  },
}

/**
 * Draw and Misc UI related functions for QLearn
 */
const p5QLearn = {
  draw: (p, toX, toY, model) => {
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
      p.triangle(
        toX(x+baseXMove), toY(y+baseYMove), 
        toX(x+tipXMove), toY(y+tipYMove),
        toX(x-baseXMove), toY(y-baseYMove)
      )
    }

    const vmax = max()
    model.policy.map((v, i) => v.map((q, j) => {
      node = Node(i,j)
      p.noStroke()
      p.fill(`rgba(0,191,255,${Math.max(0.1, p.map(model.maxQ(node), vmax/6, vmax, 0, 1))})`)
      if (model.allQEq(node)) {} // Do nothing, if all qs are equal, the move is random
      else if (matchDir(node, game.NORTH)) drawArrow(node, 0, -0.5, 0.15, 0)
      else if (matchDir(node, game.SOUTH)) drawArrow(node, 0, 0.5, 0.15, 0)
      else if (matchDir(node, game.EAST)) drawArrow(node, 0.5, 0, 0, 0.15)
      else drawArrow(node, -0.5, 0, 0, 0.15)
    }))
  }
}

let p5Instance = new p5(sketch)
