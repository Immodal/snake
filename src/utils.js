const utils = {
  /**
   * Returns a random integer between min and max (inclusive)
   */
  randInt: (min, max) => Math.floor(Math.random() * (max - min + 1)) + min,

  /**
   * Returns as Array of numbers 0 -> (n-1)
   */
  range:n => Array(n).fill().map((_, i) => i),

  /**
   * Returns as Array of numbers 0 -> (n-1)
   */
  shuffledRange:n => {
    const r = utils.range(n)
    utils.shuffle(r)
    return r
  },

  /**
   * Shuffles array in place
   */
  shuffle: arr => {
    let j, x;
    for (let i = arr.length - 1; i > 0; i--) {
      j = utils.randInt(0, i)
      x = arr[i]
      arr[i] = arr[j]
      arr[j] = x
    }
  }
}
