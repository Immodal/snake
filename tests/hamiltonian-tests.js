
const HamiltonianTests = {
  "Hamiltonian": () => {
    exp44Graph = ` v> ,  v><,  v><,  v <, 
^v> , ^v><, ^v><, ^v <, 
^v> , ^v><, ^v><, ^v <, 
^ > , ^ ><, ^ ><, ^  <, 
`

    const hm = Hamiltonian()
    let graph = hm.mkGraph(4,4)
    eq(hm.toString(graph), exp44Graph)
    eq(hm.countEdges(graph[3][3]), 2)
    eq(hm.countEdges(graph[0][0]), 2)
    eq(hm.countEdges(graph[0][1]), 3)
    eq(hm.countEdges(graph[1][0]), 3)
    eq(hm.countEdges(graph[1][1]), 4)
    hm.invertEdge(graph, 0, 0, 1)
    hm.invertEdge(graph, 1, 1, 0)
    eq(hm.countEdges(graph[3][3]), 2)
    eq(hm.countEdges(graph[0][0]), 1)
    eq(hm.countEdges(graph[0][1]), 2)
    eq(hm.countEdges(graph[1][0]), 2)
    eq(hm.countEdges(graph[1][1]), 3)

    graph = hm.mkGraph(4,4)
    hm.deletion(graph)
    for (let i=0; i<graph.length; i++) {
      for (let j=0; j<graph[i].length; j++) {
        eq(true, hm.countEdges(graph[i][j])>=2)
      }
    }
    eq(false, exp44Graph == hm.toString(graph))
  }
}