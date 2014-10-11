# Hierholzer's Algorithm

### Description

The hierholzer algorithm finds a circle in the graph that traverses the entire graph whereas every edge is traversed only once. This path is called Eulerian trail.

The input graph has to be eulerian or semi eulerian. If the graph is eulerian an eulerian cicle can be found. For semi eulerian graphs only an eulerian path / trail can be found.

Eulerian: Every vertice has an even degree.

Semi Eulerian: Every vertice has an even degree except two. The eulerian trail has to start and end at a vertice with an uneven degree.

### Pseudo Code


```
// Data structure
UndirectedGraph graph { 
	vertices = [], 
	edges = [] 
}

Vertice v {
	edges = [],
	degree = |edges|,
	degreeUnvisited = |edges.visited == false|
}

Edge e {
	vertices = [],
	visited = false
}

// Check if input is valid
function validGraph(graph) {
	if |graph.vertices| < 2
		return false // invalid
	
	sum = 0
	startOdd = null

	foreach v : graph.vertices
		if v.degree % 2 = 1
			startOdd = v
		sum += v.degree % 2

	if sum == 0 
		return true 							// valid, eulerian
	elseif sum == 2
		return startOdd 						// valid, semi eulerian, start from algorithm from startOdd
	else
		return false 							// invalid
}

// Hierholzer algorithm

function findEuclideanTour(graph) {

	valid = validGraph(graph)
	if valid === true							// start with first vertice in graph
		start = graph.vertices[0]	
	elseif valid !== false						// start with vertice with odd degreee
		start = valid
	else
		return false

	tour = []
	tour = findTour(start, graph)				// find the first tour

	while (|tour| - 1) < graph.edges 			// check if tour is euclidean, otherwise find next tour
		foreach v : tour
			if v.degreeUnvisited > 0
				nextTour = (v, graph)
				tour.replace(v, nextTour)		// merge next tour with previous tours
				break

}

function findTour(start, graph) {

	tour = []
	tour.add(start)

	currentVertice = start

	while true

		nextEdge = null

		foreach e : currentVertice.edges
			if !e.visited
				nextEdge = e
				nextEdge.visited = true
				break

		if(nextEdge == null) {					// exit with eulerian path not tour / circle
			return tour
		}

		currentVertice = (e.vertices \ currentVertice)[0]
		tour.add(currentVertice)

		if currentVertice = tour[0]
			return tour

}
```
