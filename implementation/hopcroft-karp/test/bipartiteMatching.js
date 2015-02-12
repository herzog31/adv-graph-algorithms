/**
 * Instanz des Hopcroft-Karp Algorithmus
 * @constructor
 * @param {Number} ucount
 * @param {Number} vcount
 * @param {Object} adjList Die Adjazenzliste des bipartiten Graphen. Nur Knoten aus U mit Nachbarn aus V.
 */

function Node(n) {
    this.id = n;
    this.free = false;
    this.children = {};
    this.parents = {};
    //var edges = [];

    this.getId = function(){
        return this.id;
    }

    this.getParents = function() {
        return this.parents;
    }

    this.isFree = function() {
        return this.free;
    }

    this.setFree = function() {
        this.free = true;
    }

    this.addChild = function(node) {
        this.children[node.getId()] = node;
    }

    this.addParent = function(node) {
        this.parents[node.getId()] = node;
    }
    this.removeParent = function(node) {
        delete this.parents[node.getId()];
    }

    this.getChildCount = function() {
        return Object.keys(this.children).length;
    }

    this.getAllParents = function() {
        return this.parents;
    }
    this.getAllChildren = function() {
        return this.children;
    }

    this.removeChild = function(c) {
        delete this.children[c.id];
    }
}

function HopcroftKarp(ucount, vcount, adjList) {
    //initialize
    var matching = []; // matching[i] gives the matching partner of node i in V
    var supernode = {}; // contains the free vertices of U
    for (var i = 0; i < adjList.length; i++) {
        var v = new Node(i);
        supernode[i] = v;
    }

    //the main loop
    do {
        //first create the directed augmenting graph
        var shortestPathLength = bfs(supernode, adjList, matching);
        //if possible then find disjoint augmenting paths in the graph
        var paths = dfs(supernode);
        for (var s in paths) {
            var stack = paths[s];
            //delete matched vertices from supernode
            delete supernode[stack[0].getId()];
            //now augment the matching
            for (i = 1; i < stack.length; i++) {
                matching[stack[i].getId()] = stack[i - 1].getId();
            }
        }
    } while (paths.length > 0); //repeat until there is no improvement
    return matching;
}

//Do a breadth first search starting at all free vertices in the left side U.
function bfs(supernode, adjList, matching) {
    var currentLayer = [];
    var nextLayer = [];
    var examined = {};
    var shortestPathLength = 0;

    //initialize
    for (var free in supernode) {
        currentLayer.push(supernode[free]);
        var node = supernode[free];
        var id = node.getId();
        //examined[id] = true;
    }
    var freeNodeFound = false;
    var emptyLayer = false;

    //execute bfs
    while (!freeNodeFound && !emptyLayer) {
        for (i = 0; i < currentLayer.length; i++) {
            var node = currentLayer[i];
            for (var j = 0; j < adjList[node.getId()].length;j++) {
                var adj = adjList[node.getId()][j];
                if (!examined.hasOwnProperty(adj)) {
                    var n = new Node(adj);
                    node.addChild(n);
                    n.addParent(node);
                    nextLayer.push(n);
                    if (!matching.hasOwnProperty(adj)) { // if unmatched we found the shortest path
                        freeNodeFound = true;
                        n.setFree();
                    }
                }
            }
        }
        if (freeNodeFound) {
            for (var ind in currentLayer) {
                var node = currentLayer[ind];
                var children = node.getAllChildren();
                for (n in children) {
                    if (matching[children[n].getId()] !== undefined) {
                        node.removeChild(n);
                    }
                }
            }
        }
        else if (nextLayer.length === 0) {
            emptyLayer = true;
        }
        else {
            currentLayer = [];
            for (var ind in nextLayer) {
                var node = nextLayer[ind];
                var n = new Node(matching[node.getId()]);
                node.addChild(n);
                n.addParent(node);
                currentLayer.push(n);
                examined[node.getId()] = true;
            }
            nextLayer = [];
            shortestPathLength++;
        }
    }
    return shortestPathLength;
}

function dfs(supernode) {
    var paths = [];
    var stack = [];
    var augmentingPaths = 0;

    for (var node in supernode) {
        var foundAugmentingPath = recursiveDfs(supernode[node], stack);
        if (foundAugmentingPath) {
            augmentingPaths++;
            for (var i = 1; i < stack.length; i++) {
                var prev = stack[i-1];
                var curr = stack[i];
                //delete the nodes in stack from the graph
                var parents = curr.getAllParents();
                for (p in parents) {
                    parents[p].removeChild(curr);
                }
            }
            paths.push(stack);
        }
        stack = [];
    }
    return paths;

    function recursiveDfs(node, stack) {
        stack.push(node);
        if (node.isFree() && stack.length>1) return true;
        else {
            var children = node.getAllChildren();
            for (var c in children) {
                if (recursiveDfs(children[c], stack)) return true;
            }
        }
        stack.pop();
        return false;
    }
}