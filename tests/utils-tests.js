const utilsTests = {
  'makes range of numbers': () => {
    let exp = [0,1,2,3,4]
    eq(true, utils.range(5).every((v,i) => v==exp[i]))
  },

  'shuffles array': () => {
    const array  = utils.range(100)
    const array2 = utils.range(100)
    eq(true, array.every((v,i) => v==array2[i]))
    utils.shuffle(array)
    eq(false, array.every((v,i) => v==array2[i]))
    // No accidental duplication
    eq(true, array.sort().every((v,i,arr) => i>0 ? v!=arr[i-1] : true))
  },

  'shuffled range': () => {
    let sr = utils.shuffledRange(100)
    eq(false, utils.range(100).every((v,i) => v==sr[i]))
    sr = utils.shuffledRange(200)
    eq(false, utils.range(200).every((v,i) => v==sr[i]))
  }
}