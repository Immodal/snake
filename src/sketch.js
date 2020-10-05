

const sketch = ( p ) => {
  FRAMERATE_MAX = 60
  FRAMERATE_MIN = 1
  FRAMERATE_STEP = 1
  FRAMERATE_INITIAL = FRAMERATE_MAX

  SIZE_MAX = 6
  SIZE_MIN = 2
  SIZE_STEP = 1
  SIZE_INITIAL = 4

  // Pre-allocate DOM component vars, cant be inited until setup() is called
  let canvas = null
  const initCanvas = () => {
    canvas = p.createCanvas(500, 500)
    canvas.parent("#cv")
  }

  /**
   * Score Elements
   */
  let score = 0
  let scoreCounter = null
  const initScoreCounter = () => {
    scoreCounter = p.createSpan(`${score}`)
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
    scores.sort((a, b) => a - b)
    const sum = scores.reduce((acc, v) => acc+v, 0)
    const mid = Math.floor(scores.length/2)
    gameCount.html(scores.length)
    scoreMean.html(scores.length>0 ? (sum/scores.length).toFixed(2) : 0)
    scoreMedian.html(scores.length>0 ? scores[mid] : 0)
    scoreMin.html(scores.length>0 ? scores[0] : 0)
    scoreMax.html(scores.length>0 ? scores[scores.length-1] : 0)
  }

  /**
   * Player Selection Elements
   */
  const HUMAN = 0
  const QLEARN = 1
  const SP = 2
  const HMC = 3
  let playerSelect = null
  const initPlayerSelect = () => {
    playerSelect = p.createSelect()
    playerSelect.style('font-size', '13px')
    playerSelect.parent("#playerSelect")
    playerSelect.option("Human", HUMAN)
    playerSelect.option("Q-Learning", QLEARN)
    playerSelect.option("Shortest Path", SP)
    playerSelect.option("Hamiltonian Cycle", HMC)
    playerSelect.value(HMC)
    playerSelect.changed(resetGame)
  }

  /**
   * Game Settings Elements
   */
  let gameSizeLabel = null
  let gameSizeSlider = null
  const initGameSizeSlider = () => {
    gameSizeSlider = p.createSlider(SIZE_MIN, SIZE_MAX, SIZE_INITIAL, SIZE_STEP)
    gameSizeLabel = p.createSpan(`${gameSizeSlider.value()}`)
    gameSizeLabel.parent("#gameSizeLbl")
    gameSizeSlider.parent('#gameSize')
    gameSizeSlider.changed(() => {
      gameSizeLabel.html(gameSizeSlider.value())
      resetGame()
    })
  }

  let drawWallsCb = null
  let gameSpeedLabel = null
  let gameSpeedSlider = null
  const initGameSpeedSlider = () => {
    gameSpeedSlider = p.createSlider(FRAMERATE_MIN, FRAMERATE_MAX, FRAMERATE_INITIAL, FRAMERATE_STEP)
    gameSpeedLabel = p.createSpan(`${gameSpeedSlider.value()}`)
    gameSpeedLabel.parent("#gameSpeedLbl")
    gameSpeedSlider.parent('#gameSpeed')
    gameSpeedSlider.changed(() => {
      if(!drawWallsCb.checked()) p.frameRate(gameSpeedSlider.value())
      gameSpeedLabel.html(gameSpeedSlider.value())
    })
  }

  let clearWallsBtn = null
  let makeWalls = false
  let wallsSave = NodeSet()
  const initWallsBtns = () => {
    drawWallsCb = p.createCheckbox('Draw Walls (pauses game)', false);
    drawWallsCb.parent("#drawWalls")
    drawWallsCb.changed(() => {
      if(drawWallsCb.checked()) p.frameRate(FRAMERATE_MAX)
      if(!drawWallsCb.checked() && playerSelect.value()==HMC) {
        p.frameRate(gameSpeedSlider.value())
        resetGame()
      }
    })
    clearWallsBtn = p.createButton("Clear Walls")
    clearWallsBtn.parent("#drawWalls")
    clearWallsBtn.mousePressed(clearWalls)
  }
  const clearWalls = () => {
    wallsSave = NodeSet()
    state.walls = wallsSave
    if(playerSelect.value()==HMC) resetGame()
  }
  
  /**
   * Game State 
   */
  const nX = () => 2 * gameSizeSlider.value()
  const nY = () => 2 * gameSizeSlider.value()
  const toX = i => Math.floor(i * p.width / nX())
  const toY = i => Math.floor(i * p.height / nY())
  const fromX = x => Math.floor(x * nX() / p.width)
  const fromY = y => Math.floor(y * nY() / p.height)

  let next = null
  let state = null
  let update = null
  const restart = () => {
    next = game.next(nX(), nY(), wallsSave)
    state = next()
    update = {direction: game.EAST}
    qModel.reset()
    spModel = ShortestPath()
  }
  const resetGame = () => {
    scores = []
    updateScore(0)
    updateScoreStats(-1)
    hmcModel.reset()
    restart()
  }

  // Models
  let qModel = QLearn(100, 50, 1, 0.05, 0.01, 0.9, 0.9, 1, -1)
  let spModel = null
  let hmcModel = Hamiltonian(100, 100, 1000, 10)

  /**
   * Setup
   */
  p.setup = () => {
    initCanvas()
    initGameSizeSlider()
    initGameSpeedSlider()
    initWallsBtns()

    initScoreCounter()
    initScoreStats()
    initPlayerSelect()

    p.frameRate(gameSpeedSlider.value())
    resetGame()
  }

  /**
   * Draw
   */
  p.draw = () => {
    p.background(240)

    if (!drawWallsCb.checked()) {
      // Update Game State
      state = next(state, update)
      if (state.justEaten) updateScore(calcScore(state))
      if (!state.isAlive || state.apple==null) {
        updateScoreStats(calcScore(state))
        restart()
      }

      // Update Models
      if(playerSelect.value()==QLEARN) {
        // Update Q Learning
        qModel.update(next, state, state.justEaten)
        update.direction = qModel.getAction(state.snake[0])
        p5QLearn.draw(p, toX, toY, qModel)
      } else if(playerSelect.value()==SP) {
        // Update Shortest Path
        spModel.update(state, state.apple)
        update.direction = spModel.getAction(state.snake[0])
        p5ShortestPath.draw(p, toX, toY, spModel)
      } else if(playerSelect.value()==HMC) {
        // Update Hamiltonian Cycle
        hmcModel.update(state)
        update.direction = hmcModel.getAction(state.snake[0])
        p5Hamiltonian.draw(p, toX, toY, hmcModel)
      }
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

  // Required otherwise the Draw Wall feature will add walls to locations outside of canvas
  const mouseOverCanvas = () => {
    return p.mouseX <= p.width && p.mouseX >= 0 && p.mouseY <= p.height && p.mouseY >= 0
  }

  /**
   * 
   */
  p.mousePressed = () => {
    if (drawWallsCb.checked() && mouseOverCanvas()) {
      const x = fromX(p.mouseX)
      const y = fromY(p.mouseY)
      if (!state.walls.has(x, y)) {
        makeWalls = true
        state.walls.add(x, y)
      } else {
        makeWalls = false
        state.walls.delete(x, y)
      }
    }
  }

  /**
   * Mouse Dragged
   */
  p.mouseDragged = () => {
    if (drawWallsCb.checked() && mouseOverCanvas()) {
      const x = fromX(p.mouseX)
      const y = fromY(p.mouseY)
      if (makeWalls && !state.walls.has(x, y)) state.walls.add(x, y)
      else if(!makeWalls && state.walls.has(x, y)) state.walls.delete(x, y)
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
    const walls = state.walls

    // Draw snake
    p.stroke(0)
    p.strokeWeight(2)
    p.fill(0)
    snake.forEach(node => {
      p.rect(toX(node.x), toY(node.y), toX(1), toX(1))
    })
    // Draw Apple
    p.fill(255, 0, 0)
    p.rect(toX(apple.x), toY(apple.y), toX(1), toX(1))

    // Draw Walls
    p.strokeWeight(2)
    p.stroke(34,139,34)
    p.fill(34,139,34)
    walls.lookup.forEach(node => {
      p.rect(toX(node.x), toY(node.y), toX(1), toX(1))
    })


    // Draw Outer Frame
    p.stroke(0)
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
 * Draw Functions that can be shared between modules
 */
const p5Utils = {
  drawArrow: (p, direction, toX, toY) => {
    if (direction.eq(game.NORTH)) p5Utils._drawArrow(p, node, 0, -0.5, 0.15, 0, toX, toY)
    else if (direction.eq(game.SOUTH)) p5Utils._drawArrow(p, node, 0, 0.5, 0.15, 0, toX, toY)
    else if (direction.eq(game.EAST)) p5Utils._drawArrow(p, node, 0.5, 0, 0, 0.15, toX, toY)
    else if (direction.eq(game.WEST)) p5Utils._drawArrow(p, node, -0.5, 0, 0, 0.15, toX, toY)
  },

  _drawArrow: (p, node, tipXMove, tipYMove, baseXMove, baseYMove, toX, toY) => {
    let x = node.x + 0.5
    let y = node.y + 0.5
    p.triangle(
      toX(x+baseXMove), toY(y+baseYMove), 
      toX(x+tipXMove), toY(y+tipYMove),
      toX(x-baseXMove), toY(y-baseYMove)
    )
  },
}

/**
 * Draw and Misc UI related functions for Shortest Path
 */
const p5ShortestPath = {
  draw: (p, toX, toY, model) => {
    p.noStroke()
    p.fill(`rgb(0,191,255)`)
    model.policy.map((v, i) => v.map((q, j) => {
      if (q!=null) {
        node = Node(i,j)
        p5Utils.drawArrow(p, model.getAction(node), toX, toY)
      }
    }))
  }
}

/**
 * Draw and Misc UI related functions for Hamiltonian Cycle
 */
const p5Hamiltonian = {
  draw: (p, toX, toY, model) => {
    p.noStroke()
    p.fill(`rgb(0,191,255)`)
    if (model.isHamiltonianCycle) {
      model.policy.map((v, i) => v.map((q, j) => {
        if (q!=null) {
          node = Node(i,j)
          p5Utils.drawArrow(p, model.getAction(node), toX, toY)
        }
      }))
    } else {
      model.spAgent.policy.map((v, i) => v.map((q, j) => {
        if (q!=null) {
          node = Node(i,j)
          p5Utils.drawArrow(p, model.getAction(node), toX, toY)
        }
      }))
    }
  }
}

/**
 * Draw and Misc UI related functions for QLearn
 */
const p5QLearn = {
  draw: (p, toX, toY, model) => {
    // Get the largest value in the qTable
    let vmax = null
    for (let i=0; i<model.policy.length; i++) {
      for (let j=0; j<model.policy[0].length; j++) {
        const v = model.maxQ(Node(i,j))
        if (vmax==null || v>vmax) vmax = v
      }
    }

    p.noStroke()
    model.policy.map((v, i) => v.map((q, j) => {
      node = Node(i,j)
      if (!model.allQEq(node)) {
        p.fill(`rgba(0,191,255,${Math.max(0.1, p.map(model.maxQ(node), vmax/6, vmax, 0, 1))})`)
        p5Utils.drawArrow(p, model.getAction(node), toX, toY)
      }
    }))
  }
}

let p5Instance = new p5(sketch)
