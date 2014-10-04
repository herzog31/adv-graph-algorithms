# Hopcroft–Karp Algorithm

### Description
This algorithm finds a maximum cardinality matching in a bipartite graph.
Augmenting path - path that consists of alternating edges (matched, not matched) and starts and ends with an unmatched vertex.
### Pseudo Code

1: M = null
2: repeat
3: 		let P ={P1,...,Pk} be maximal set of
4: 		vertex-disjoint, shortest augmenting paths w.r.t. M.
5: 		M <- M symmetric difference (P1 union ... union Pk) 	
6: until P = null	
7: return M

### Notes
- Computing shortest augmenting paths could be implemented with breadth first search and deep first search.