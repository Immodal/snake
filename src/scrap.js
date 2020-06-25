/*
const isDestroyer = () => {
  // Must be an odd number of edges, edge must exist (not deleted)
  if (dn.length-1>=3 && dn.length%2==0 && dn.vertex.getEdge(dn.dirToParent)>0) { 
    // Must have alternating edge values current = 1, parent = 0, parent.parent = 1
    if(!dn.parent.isDestroyer && dn.parent.parent.isDestroyer) return true
    // Or it is the first destroyer in the path
    else {
      if(dn.length==4 && // 4 vertexes, 3 alternating edges current = 1, parent = 0, parent.parent = 1
      !dn.parent.isDestroyer && dn.parent.vertex.getEdge(dn.parent.dirToParent)==0 && 
      !dn.parent.parent.isDestroyer && dn.parent.parent.vertex.getEdge(dn.parent.parent.dirToParent)>0 &&
      !dn.parent.parent.parent.isDestroyer && dn.parent.parent.parent.parent==null) return true
    }
  }
  // Does not meet all requirements
  return false
}*/