# Chinese Postman Problem

### Description
A problem asking for the shortest tour of a graph G which visits each edge at least once. 
For an eulerian graph, an eulerian cycle is the optimal solution.
Idea: double edges until the graph becomes eulerian. To achieve shortest tour use the minimum matching algorithm on the nodes with uneven degree.

### Pseudo Code
1: O = all nodes with odd degree (there must be even number of them).
2: Constrict a complete graph K on all nodes in O. The distance of two nodes u and v in K is equal to the shortest distance between u and v in G. (e.g. Floyd-Warshall)
3: Find a perfect matching M in K. (e.g. Hungarian method)
4: For each edge in M duplicate the edges of the corresponding path in G.
5: The resulting graph must have an eulerian cycle C.
6: Compute C. (e.g. Hierholzer)
7: return C
