/**
 * @author Ruslan Zabrodin
 * Animation des Chinese-Postman-Algorithmus
 */

/**
 * Instanz des Chinese-Postman-Algorithmus, erweitert die Klasse CanvasDrawer
 * @constructor
 * @augments CanvasDrawer
 * @param {Graph} p_graph Graph, auf dem der Algorithmus ausgeführt wird
 * @param {Object} p_canvas jQuery Objekt des Canvas, in dem gezeichnet wird.
 * @param {Object} p_tab jQuery Objekt des aktuellen Tabs.
 */
function algorithm(p_graph, p_canvas, p_tab) {
    CanvasDrawer.call(this, p_graph, p_canvas, p_tab);

    /**
     * Convenience Objekt, damit man den Graph ohne this ansprechen kann.
     * @type Graph
     */
    var graph = this.graph;
    /**
     * Convenience Objekt, damit man das Canvas ohne this. ansprechen kann.
     * @type Object
     */
    var canvas = p_canvas;
    /**
     * ID des Intervals, der für das "Vorspulen" genutzt wurde.
     * @type Number
     */
    var fastForwardIntervalID = null;
    /**
     * Der Algorithmus kann in verschiedenen Zuständen sein, diese Variable
     * speichert die ID des aktuellen Zustands.<br>
     * Siehe Dokumentation bei der Funktion nextStepChoice
     * @type Number
     */
    var statusID = 0;
    /**
     * Closure Variable für dieses Objekt
     * @type algorithm
     */
    var algo = this;
    /**
     * Assoziatives Array(2d) mit den Abstandswerten aller Knoten<br>
     * Keys: KnotenIDs Value: Abstandswert
     * @type Object
     */
    var distance = new Object();
    /**
     * Assoziatives Array(2d) mit den Vorgängerkanten aller Knoten<br>
     * Keys: KnotenIDs Value: Kanten
     * @type Object
     */
    var predecessor = new Object();
    /**
     * Zählt die Phasen / Runden.
     * @type Number
     */
    var phase = 0;

    var feasible = null;

    var delta = new Object();

    var excess = 0;

    var demandNodes = new Object();

    var supplyNodes = new Object();
    /**
     * Array mit Objekten der Form:<br>
     * s: Startknoten, d: Zielknoten, edge: Matching-Kante, path: der zugehoerige Pfad
     * @type Array
     */
    var matching = [];

    var matching_graph = null;

    var id_map = {};

    var next = 0;
    /**
     * Array mit den neu eingefuegten Pfaden<br>
     * Enthaelt Arrays von neuen Kanten
     * @type Object
     */
    var cost = null;

    var tour = new Array();

    var subtours = new Array();
    var color = {};
    var tourColors = new Array("#0000cc", "#006600", "#990000", "#999900", "#cc6600", "#660099", "#330000");
    var tourAnimationIndex = 0;
    var animationId = 0;
    /*
     * Alle benoetigten Information zur Wiederherstellung der vorangegangenen Schritte werden hier gespeichert.
     * @type Array
     * */
    var history = new Array();
    /**
     * Gibt das Ausgabefenster an.
     */
    var st = "ta";//"#ta_div_statusErklaerung
    
    /*
     * Hier werden die Statuskonstanten definiert
     * */
    const FEASIBILITY = 0;
    const SHOW_UNBALANCED_NODES = 3;
    const SHORTEST_PATHS = 7;
    const ADD_PATHS = 11;
    const MATCHING = 4;
    const START_ADDING_PATHS = 6;
    const START_TOUR = 16;
    const SHOW_TOUR = 15;
    const END = 10;
    const STOP = 19;
    /*
     * Entferne alle Knoten, die zu keiner Kante inzident sind
     * */
    this.deleteIsolatedNodes = function () {
        for (var n in graph.nodes) {
            var node = graph.nodes[n];
            if (Object.keys(node.getOutEdges()).length + Object.keys(node.getInEdges()).length == 0) {
                graph.removeNode(n)
            }
        }
    };
    /**
     * Startet die Ausführung des Algorithmus.
     * @method
     */
    this.run = function () {
        this.initCanvasDrawer();
        // Die Buttons werden erst im Javascript erstellt, um Problemen bei der mehrfachen Initialisierung vorzubeugen.
        $("#"+st+"_div_abspielbuttons").append("<button id=\""+st+"_button_Zurueck\">" + LNG.K('algorithm_btn_prev') + "</button>"
        + "<button id=\""+st+"_button_1Schritt\">" + LNG.K('algorithm_btn_next') + "</button>"
        + "<button id=\""+st+"_button_vorspulen\">" + LNG.K('algorithm_btn_frwd') + "</button>"
        + "<button id=\""+st+"_button_stoppVorspulen\">" + LNG.K('algorithm_btn_paus') + "</button>");
        $("#"+st+"_button_stoppVorspulen").hide();
        $("#"+st+"_button_Zurueck").button({icons: {primary: "ui-icon-seek-start"}, disabled: true});
        $("#"+st+"_button_1Schritt").button({icons: {primary: "ui-icon-seek-end"}, disabled: false});
        $("#"+st+"_button_vorspulen").button({icons: {primary: "ui-icon-seek-next"}, disabled: false});
        $("#"+st+"_button_stoppVorspulen").button({icons: {primary: "ui-icon-pause"}});
        $("#"+st+"_div_statusTabs").tabs();
        $(".marked").removeClass("marked");
        $("#"+st+"_p_begin").addClass("marked");
        $("#"+st+"_tr_LegendeClickable").removeClass("greyedOutBackground");
        this.registerEventHandlers();
        this.deleteIsolatedNodes();
        this.needRedraw = true;
        statusID = FEASIBILITY;
    };

    /**
     * Beendet die Ausführung des Algorithmus.
     * @method
     */
    this.destroy = function () {
        clearInterval(animationId);//stop animations
        this.deleteInsertedEdges();//delete all new edges
        this.stopFastForward();
        this.destroyCanvasDrawer();
        this.deregisterEventHandlers();
    };

    /**
     * Beendet den Tab und startet ihn neu
     * @method
     */
    this.refresh = function () {
        this.destroy();
        var algo = new algorithm($("body").data("graph"), $("#"+st+"_canvas_graph"), $("#tab_"+st));
        $("#tab_"+st).data("algo", algo);
        algo.run();
    };

    /**
     * Zeigt and, in welchem Zustand sich der Algorithmus im Moment befindet.
     * @returns {Number} StatusID des Algorithmus
     */
    this.getStatusID = function () {
        return statusID;
    };

    /**
     * Registriere die Eventhandler an Buttons und canvas<br>
     * Nutzt den Event Namespace ".algorithm"
     * @method
     */
    this.registerEventHandlers = function () {
        $("#"+st+"_button_1Schritt").on("click.algorithm", function () {
            algo.singleStepHandler();
        });
        $("#"+st+"_button_vorspulen").on("click.algorithm", function () {
            algo.fastForwardAlgorithm();
        });
        $("#"+st+"_button_stoppVorspulen").on("click.algorithm", function () {
            algo.stopFastForward();
        });
        $("#"+st+"_button_Zurueck").on("click.algorithm", function () {
            algo.previousStepChoice();
        });
    };

    /**
     * Entferne die Eventhandler von Buttons und canvas im Namespace ".algorithm"
     * @method
     */
    this.deregisterEventHandlers = function () {
        canvas.off(".algorithm");
        $("#"+st+"_button_1Schritt").off(".algorithm");
        $("#"+st+"_button_vorspulen").off(".algorithm");
        $("#"+st+"_button_stoppVorspulen").off(".algorithm");
        $("#"+st+"_tr_LegendeClickable").off(".algorithm");
        $("#"+st+"_button_Zurueck").off(".algorithm");
    };

    /**
     * Wird aufgerufen, wenn der "1 Schritt" Button gedrückt wird.
     * @method
     */
    this.singleStepHandler = function () {
        this.nextStepChoice();
    };

    /**
     * "Spult vor", führt den Algorithmus mit hoher Geschwindigkeit aus.
     * @method
     */
    this.fastForwardAlgorithm = function () {
        $("#"+st+"_button_vorspulen").hide();
        $("#"+st+"_button_stoppVorspulen").show();
        $("#"+st+"_button_1Schritt").button("option", "disabled", true);
        $("#"+st+"_button_Zurueck").button("option", "disabled", true);
        var geschwindigkeit = 200;	// Geschwindigkeit, mit der der Algorithmus ausgeführt wird in Millisekunden

        fastForwardIntervalID = window.setInterval(function () {
            algo.nextStepChoice();
        }, geschwindigkeit);
    };

    /**
     * Stoppt das automatische Abspielen des Algorithmus
     * @method
     */
    this.stopFastForward = function () {
        $("#"+st+"_button_vorspulen").show();
        $("#"+st+"_button_stoppVorspulen").hide();
        $("#"+st+"_button_1Schritt").button("option", "disabled", false);
        $("#"+st+"_button_Zurueck").button("option", "disabled", false);
        window.clearInterval(fastForwardIntervalID);
        fastForwardIntervalID = null;
    };

    /**
     * In dieser Funktion wird der nächste Schritt des Algorithmus ausgewählt.
     * Welcher das ist, wird über die Variable "statusID" bestimmt.<br>
     * Mögliche Werte sind:<br>
     *  0: Initialisierung<br>
     *  1: Prüfung ob Gewichte aktualisiert werden sollen, und initialierung<br>
     *  2: Prüfe, ob anhand der aktuellen Kante ein Update vorgenommen wird (Animation)<br>
     *  3: Update, falls nötig, den Knoten<br>
     *  4: Untersuche, ob es eine Kante gibt, die auf einen negativen Kreis hinweist.<br>
     *  5: Finde den negativen Kreis im Graph und beende<br>
     *  6: Normales Ende, falls kein negativer Kreis gefunden wurde.
     *  @method
     */
    this.nextStepChoice = function () {
        window.clearInterval(animationId);
        this.addReplayStep();
        switch (statusID) {
            case FEASIBILITY:
                this.checkFeasibility();
                break;
            case SHOW_UNBALANCED_NODES:
                this.showUnbalancedNodes();
                break;
            case SHORTEST_PATHS:
                this.showShortestPaths();
                break;
            case MATCHING:
                this.showMatching();
                break;
            case START_ADDING_PATHS:
                this.startAddingPaths();
                break;
            case ADD_PATHS:
                this.addPath();
                break;
            case START_TOUR:
                this.startTour();
                break;
            case SHOW_TOUR:
                this.showTour();
                break;
            case END:
                this.endAlgorithm();
                break;
            default:
                //console.log("Fehlerhafte StatusID.");
                break;
        }
        this.needRedraw = true;
        //console.log(tour);
        //console.log(new_edges);
    };
    /*
     *
     * */
    this.findMatching = function () {
        //construct cost matrix
        var uid_map = {};
        var vid_map = {};
        var n = 0;
        for (var node in supplyNodes) {
            var id = supplyNodes[node].getNodeID();
            for (var i = 0; i < -delta[id]; i++) {
                uid_map[n] = id;
                n++;
            }
        }
        n = 0;
        for (var node in demandNodes) {
            var id = demandNodes[node].getNodeID();
            for (var i = 0; i < delta[id]; i++) {
                vid_map[n] = id;
                n++;
            }
        }
        var cost = new Array(n);
        for (var i = 0; i < n; i++) {
            cost[i] = new Array(n);
            for (var j = 0; j < n; j++) {
                cost[i][j] = -distance[uid_map[i]][vid_map[j]];
            }
        }
        var match = maxMatching(cost);
        //find the original nodes and paths of the matching
        matching = [];
        for (var i = 0; i < match.length; i++) {
            matching.push({s: uid_map[i], d: vid_map[match[i]]});
        }
    };
    /*
     * Computes the eulertour
     * @method
     * */
    this.computeEulerTour = function () {
        // init
        tour = [];
        subtours = [];
        var tourColorIndex = 0;
        // Starting node
        var start;
        for (var n in graph.nodes) {
            start = graph.nodes[n];
            break;
        }
        // Current node
        var current = start;
        // Current subtour
        var subtour = [];
        // IDs of visited edges
        var visitedEdges = [];
        // Number of edges in graph
        var numberOfEdgesInGraph = Object.keys(graph.edges).length;
        // number of edges in tour
        var numberOfEdgesInTour = 0;

        // As long as tour not eulerian
        while (numberOfEdgesInTour < numberOfEdgesInGraph) {
            // Add start to subtour
            subtour.push({type: "vertex", id: current.getNodeID()});
            // While start != current, except first iteration
            do {
                // Get out edges
                var outEdges = current.getOutEdges();
                var nextEdge = null;

                // Find unvisited out edge
                for (var kantenID in outEdges) {
                    if (visitedEdges.indexOf(kantenID) === -1) {
                        nextEdge = outEdges[kantenID];
                        visitedEdges.push(kantenID);
                        subtour.push({type: "edge", id: kantenID});
                        break;
                    }
                }
                if (nextEdge === null) {
                    return
                }
                // Get other Vertex which is new current
                current = graph.nodes[nextEdge.getTargetID()];
                subtour.push({type: "vertex", id: current.getNodeID()});
            } while (start.getNodeID() !== current.getNodeID());
            // Merge
            // If tour is empty, just replace with subtour
            if (tour.length === 0) {
                tour = subtour;
            } else {
                // Start node of subtour
                var startOfSubTour = subtour[0];
                var newTour = new Array();
                var replaced = false;
                // Find subtour's start node in tour
                for (var i = 0; i < tour.length; i++) {
                    // If found, add complete subtour
                    if (JSON.stringify(tour[i]) == JSON.stringify(startOfSubTour) && !replaced) {
                        for (var j = 0; j < subtour.length; j++) {
                            newTour.push(subtour[j]);
                        }
                        replaced = true;
                        // Otherwise add elements from tour
                    } else {
                        newTour.push(tour[i]);
                    }
                }
                tour = newTour;
            }
            subtours.push({color: tourColorIndex, tour: subtour});
            for (var i in subtour) {//save colors
                var c = subtour[i];
                if (c.type == "edge") {
                    color[c.id] = tourColorIndex;
                }
            }
            tourColorIndex++;
            tourColorIndex = tourColorIndex % tourColors.length;
            subtour = [];
            // Count number of edges in tour
            numberOfEdgesInTour = 0;
            for (var i = 0; i < tour.length; i++) {
                if (tour[i].type === "edge") {
                    numberOfEdgesInTour++;
                }
            }
            //find next start node
            for (var node in tour) {
                if (tour[node].type == "vertex") {
                    // Get out edges
                    var outEdges = graph.nodes[tour[node].id].getOutEdges();
                    var found = false;
                    // Find unvisited out edge
                    for (var kantenID in outEdges) {
                        if (visitedEdges.indexOf(kantenID) === -1) {
                            current = graph.nodes[tour[node].id];
                            start = graph.nodes[tour[node].id];
                            found = true;
                            break;
                        }
                    }
                    if (found) break;
                }
            }
        }
    };
    /**
     * Ueberpruefe ob das Problem loesbar ist.
     */
    this.checkFeasibility = function () {
        $("#"+st+"_button_Zurueck").button({icons: {primary: "ui-icon-seek-start"}, disabled: false});
        //determine shortest paths
        distance = {};
        predecessor = {};
        shortestPaths(graph, distance, predecessor);
        //determine the feasibility of the problem
        var strongly_connected = true;
        for (var n1 in graph.nodes) {
            for (var n2 in graph.nodes) {
                if (distance[n1][n2] == "inf") strongly_connected = false;
            }
        }
        var negative_cycle = false;
        for (var n in graph.nodes) {
            if (distance[n][n] < 0) negative_cycle = true;
        }
        feasible = strongly_connected && !negative_cycle;
        $("#"+st+"_div_statusErklaerung").html("<h3>1. " + LNG.K('algorithm_feasibility') + "</h3>"
            + "<p>" + LNG.K('algorithm_feasible_0') + "</p>"
            + "<p>" + LNG.K('algorithm_feasible_0_1') + "</p>");
        if (feasible) {
            statusID = SHOW_UNBALANCED_NODES;
            $("#"+st+"_div_statusErklaerung").append(
                "<p>" + LNG.K('algorithm_feasible_1') + "</p>"
                + "<p>" + LNG.K('algorithm_feasible_2') + "</p>"
                + "<p>" + LNG.K('algorithm_feasible') + "</p>");
        }
        else {
            statusID = END;
            if (!strongly_connected) $("#"+st+"_div_statusErklaerung").append("<p>" + LNG.K('algorithm_infeasible_1') + "</p>");
            if (negative_cycle) $("#"+st+"_div_statusErklaerung").append("<p>" + LNG.K('algorithm_infeasible_2') + "</p>");
            $("#"+st+"_div_statusErklaerung").append("<p>" + LNG.K('algorithm_infeasible') + "</p>");
        }
        $(".marked").removeClass("marked");
        $("#ta_p_feasible").addClass("marked");
    };
    /*
     * Findet nicht balancierte Knoten
     * @method
     * */
    this.showUnbalancedNodes = function () {
        excess = 0;
        delta = {};
        supplyNodes = {};
        demandNodes = {};
        for (var n in graph.nodes) {
            var node = graph.nodes[n];
            var d = Object.keys(node.getOutEdges()).length - Object.keys(node.getInEdges()).length;
            delta[node.getNodeID()] = d;
            if (d < 0) {
                supplyNodes[node.getNodeID()] = node;
                highlightSupply(node);
            }
            else if (d > 0) {
                demandNodes[node.getNodeID()] = node;
                highlightDemand(node);
                excess += d;
            }
            node.setLabel(d);
        }
        $("#"+st+"_div_statusErklaerung").html("<h3>2. " + LNG.K('algorithm_find_balanced_nodes') + "</h3>" +
        "<p>" + LNG.K('algorithm_find_balanced_nodes_1') + "</p>");
        //fall es alle Knoten balanciert sind, kann gleich mit Eulertour begonnen werden
        if (excess == 0) {
            statusID = START_TOUR;
            // Erklärung im Statusfenster
            $("#"+st+"_div_statusErklaerung").append("<p>" + LNG.K('algorithm_balanced_1') + "</p>"
            + "<p>" + LNG.K('algorithm_balanced_2') + "</p>");
        }
        else {
            statusID = SHORTEST_PATHS;
            // Erklärung im Statusfenster
            $("#"+st+"_div_statusErklaerung").append("<p>" + LNG.K('algorithm_unbalanced_1') + "</p>"
                + "<p>" + LNG.K('algorithm_unbalanced_2') + "</p>"
                 + "<p>" + LNG.K('algorithm_unbalanced_3') + "</p>");
        }
        $(".marked").removeClass("marked");
        $("#ta_p_2").addClass("marked");
    };

    var highlightSupply = function (node) {
        node.setLayout('fillStyle', '#CCFFFF');
    };
    var highlightDemand = function (node) {
        node.setLayout('fillStyle', '#4E6AC1');
    };
    var setEdgeMatched = function (e) {
        e.setLayout('lineColor', 'green');
        e.setLayout('lineWidth', global_Edgelayout.lineWidth * 2);
    };
    var hideEdge = function (edge) {
        edge.setLayout("lineWidth", global_Edgelayout.lineWidth * 0.4);
    };
    var randomizeLabelPosition = function (edge) {
        var rand = Math.random() * 0.6 + 0.2;
        edge.setLayout('labelPosition', rand);
    };
    var hideNode = function (node) {
        node.setLayout('fillStyle', "DarkGray");
        node.setLayout('borderWidth', global_NodeLayout.borderWidth);
        node.setLayout('borderColor', "Gray");
    };

    this.showShortestPaths = function () {
        this.findMatching();
        //construct new graph
        matching_graph = new Graph();
        id_map = {};
        var U_POSITION = 75; //standard 75
        var V_POSITION = 225;//standard 325
        var DIFF = 80;
        var i = 0;
        var j = 0;
        for (var n in graph.nodes) {//add nodes to the graph
            if (supplyNodes[n] || demandNodes[n]) {
                var node = graph.nodes[n];
                var coord = node.getCoordinates();
                var newn = matching_graph.addNode(coord.x, coord.y);
                newn.setLayoutObject(node.getLayout());
                newn.setLabel(node.getLabel());
                id_map[node.getNodeID()] = newn.getNodeID();
                if (supplyNodes[n]) {
                    this.animateMove(newn, {x: 50 + i * DIFF, y: V_POSITION});
                    i++;
                }
                else {
                    this.animateMove(newn, {x: 50 + j * DIFF, y: U_POSITION});
                    j++;
                }
            }
        }
        for (var s in supplyNodes) {//add edges to the graph, randomize label position
            for (var d in demandNodes) {
                var id1 = id_map[s];
                var id2 = id_map[d];
                var e = matching_graph.addEdge(matching_graph.nodes[id1], matching_graph.nodes[id2], distance[supplyNodes[s].getNodeID()][demandNodes[d].getNodeID()], false);
                randomizeLabelPosition(e);
            }
        }
        this.graph = matching_graph;
        statusID = MATCHING;
        // Erklärung im Statusfenster
        $("#"+st+"_div_statusErklaerung").html("<h3>3. " + LNG.K('algorithm_paths') + "</h3>"
        + "<p>" + LNG.K('algorithm_paths_1') + "</p>"
        + "<p>" + LNG.K('algorithm_paths_2')
            + " <a href='"+LNG.K('algorithm_link_floyd_warshall')+"' target='_blank'>"+LNG.K('algorithm_text_floyd_warshall')+"</a>" + LNG.K('algorithm_paths_2_1') + "</p>"
        + "<p>" + LNG.K('algorithm_paths_3') + "</p>"
        + "<p>" + LNG.K('algorithm_paths_4') + "</p>");
        $(".marked").removeClass("marked");
        $("#ta_p_3").addClass("marked");
    };

    this.showMatching = function () {
        for (var e in matching_graph.edges) {//remove all edges
            matching_graph.removeEdge(e);
        }
        for (var p in matching) {//insert only matching edges
            var id1 = id_map[matching[p].s];
            var id2 = id_map[matching[p].d];
            var e = matching_graph.addEdge(matching_graph.nodes[id1], matching_graph.nodes[id2], distance[matching[p].s][matching[p].d], false);
            setEdgeMatched(e);
            randomizeLabelPosition(e);
        }
        statusID = START_ADDING_PATHS;
        // Erklärung im Statusfenster
        $("#"+st+"_div_statusErklaerung").html("<h3>3. " + LNG.K('algorithm_paths') + "</h3>"
        + "<p>" + LNG.K('algorithm_matching_1') + "</p>"
        + "<p>" + LNG.K('algorithm_matching_2') + " <a href='"+LNG.K('algorithm_link_hungarian')+"' target='_blank'>"+LNG.K('algorithm_text_hungarian')+"</a>" + "</p>"
        + "<p>" + LNG.K('algorithm_matching_3') + "</p>");
        $(".marked").removeClass("marked");
        $("#ta_p_3").addClass("marked");
    };

    this.startAddingPaths = function () {
        this.graph = graph;
        //insert matching edges
        for (var p in matching) {
            var s = matching[p].s;
            var d = matching[p].d;
            var e = graph.addEdge(graph.nodes[s], graph.nodes[d], distance[matching[p].s][matching[p].d], false);
            setEdgeMatched(e);
            matching[p].edge = e;
        }
        //start move animations
        for (var n in graph.nodes) {
            if (supplyNodes[n] || demandNodes[n]) {
                var old_coord = graph.nodes[n].getCoordinates();
                graph.nodes[n].setCoordinates(matching_graph.nodes[id_map[n]].getCoordinates());
                this.animateMove(graph.nodes[n], old_coord);
            }
        }
        //compute new paths
        for (var p in matching) {
            var s = matching[p].s;
            var d = matching[p].d;
            var last = d;
            var prev = [];
            while (last != s) {
                var e = predecessor[s][last];
                prev.push(e);
                last = e.getSourceID();
            }
            prev.reverse();
            matching[p].path = prev;
        }
        next = 0;
        statusID = ADD_PATHS;
        // Erklärung im Statusfenster
        $("#"+st+"_div_statusErklaerung").html("<h3>4. " + LNG.K('algorithm_new_paths') + "</h3>"
        + "<p>" + LNG.K('algorithm_new_paths_1') + "</p>"
        + "<p>" + LNG.K('algorithm_new_paths_2') + "</p>");
        $(".marked").removeClass("marked");
        $("#ta_p_4").addClass("marked");
    };

    var redoPath = function(path){//if the animation not yet ended, repare
        var match = matching[path];
        if(next > 0 && graph.edges[match.edge.getEdgeID()]){
            var s = match.s;
            var d = match.d;
            graph.removeEdge(match.edge.getEdgeID());//remove matching edge
            for(var i = match.new_edges.length; i < match.path.length; i++){//add all not yet added
                var e = match.path[i];
                var ne = graph.addEdge(graph.nodes[e.getSourceID()], graph.nodes[e.getTargetID()], e.weight);
                ne.setLayout('dashed', true);
                match.new_edges.push(ne);
            }
            graph.nodes[s].setLayout('borderColor', const_Colors.NodeBorder);//unmark the end nodes
            graph.nodes[d].setLayout('borderColor', const_Colors.NodeBorder);
            graph.nodes[s].setLabel(graph.nodes[s].getLabel() + 1);
            graph.nodes[d].setLabel(graph.nodes[d].getLabel() - 1);
        }
    };
    var undoPath = function(path){
        var match = matching[path];
        var s = match.s;
        var d = match.d;
        graph.nodes[s].setLayout('borderColor', const_Colors.NodeBorder);//unmark the end nodes
        graph.nodes[d].setLayout('borderColor', const_Colors.NodeBorder);
        for (var e in match.new_edges) {//delete the edges of the path
            var edge = match.new_edges[e];
            graph.removeEdge(edge.getEdgeID());
        }
        var e = match.edge.getEdgeID();
        if (!graph.edges[e]) {//insert matching edge if already deleted
            var e = graph.addEdge(graph.nodes[match.s], graph.nodes[match.d], distance[match.s][match.d], false);
            setEdgeMatched(e);
            matching[path].edge = e;
        }
    };
    /*
     *
     * */
    this.addPath = function () {
        if(next > 0){
            redoPath(next-1); //falls die animation nicht beendet wurde
            graph.nodes[matching[next-1].s].setLayout('fillStyle', const_Colors.NodeFilling);
            graph.nodes[matching[next-1].d].setLayout('fillStyle', const_Colors.NodeFilling);
        }
        var step = 0;
        var current = next;
        next++;
        var cost = matching[current].edge.weight;
        var s = matching[current].s;
        var d = matching[current].d;
        graph.nodes[s].setLayout('fillStyle', const_Colors.NodeBorderHighlight);
        graph.nodes[d].setLayout('fillStyle', const_Colors.NodeBorderHighlight);
        matching[current].new_edges = [];
        animationId = setInterval(function () {//animate adding of new edges/paths
            var path = matching[current].path;
            if (step == 0) {
                matching[current].edge.setLayout('lineColor','red');
            }
            else if (step == path.length + 1) {
                graph.nodes[s].setLabel(graph.nodes[s].getLabel() + 1);
                graph.nodes[d].setLabel(graph.nodes[d].getLabel() - 1);
                graph.removeEdge(matching[current].edge.getEdgeID());
                clearInterval(animationId);
            }
            else {
                var e = path[step - 1];
                var ne = graph.addEdge(graph.nodes[e.getSourceID()], graph.nodes[e.getTargetID()], e.weight);
                ne.setLayout('dashed', true);
                matching[current].new_edges.push(ne);
            }
            step++;
            algo.needRedraw = true;
        }, 500);
        $("#"+st+"_div_statusErklaerung").html("<h3>4. " + LNG.K('algorithm_new_paths') + "</h3>"
            + "<p>" + LNG.K('algorithm_add_path_1') + LNG.K('algorithm_add_path_2') + "</p>"
            + "<p>" + LNG.K('algorithm_add_path_cost') + cost + "</p>");
        if (next >= matching.length) {
            statusID = START_TOUR;
            $("#"+st+"_div_statusErklaerung").append("<p>" + LNG.K('algorithm_balanced_1') + "</p>");
        }
        else {
            statusID = ADD_PATHS;
        }
        $(".marked").removeClass("marked");
        $("#ta_p_4").addClass("marked");
    };


    // Methoden fuer die Visualisierung der Eulertour
    /*
     *
     * */
    this.addNamingLabels = function () {
        var nodeCounter = 1;
        for (var knotenID in graph.nodes) {
            graph.nodes[knotenID].setLabel(String.fromCharCode("a".charCodeAt(0) + nodeCounter - 1));
            nodeCounter++;
        }
    };
    /*
    *
    * */
    this.startTour = function () {
        if(next > 0) redoPath(next-1);
        //compute the tour and the cost of the tour
        this.computeEulerTour();
        cost = 0;
        for (var e in graph.edges) {
            cost += graph.edges[e].weight;
        }
        //restore layout, add labels
        for (var n in graph.nodes) {
            graph.nodes[n].restoreLayout();
        }
        this.addNamingLabels();
        // Erklärung im Statusfenster
        $("#"+st+"_div_statusErklaerung").html('<h3>5. ' + LNG.K('algorithm_euler') + '</h3>' +
            '<p>' + LNG.K('algorithm_tour_hierholzer_1') + " <a href='"+LNG.K('algorithm_link_hierholzer')+"' target='_blank'>"+LNG.K('algorithm_text_hierholzer')+"</a>" + LNG.K('algorithm_tour_hierholzer_2') + '</p>' +
            '<p>' + LNG.K('algorithm_tour_hierholzer_3') + '</p>' +
/*            '<p><button id="animateTour">' + LNG.K('algorithm_status51b_desc2') + '</button><button id="animateTourStop">' + LNG.K('algorithm_status51b_desc3') + '</button></p>' +
            '<p>' + LNG.K('algorithm_status51b_desc4') + '</p>' +*/
            '<p>' + LNG.K('algorithm_cost') + cost + '</p>');
        $("#animateTour").button({icons: {primary: "ui-icon-play"}}).click({org: this}, this.animateTour);
        $("#animateTourStop").button({
            icons: {primary: "ui-icon-stop"},
            disabled: true
        }).click({org: this}, this.animateTourStop);
        statusID = SHOW_TOUR;
        $(".marked").removeClass("marked");
        $("#ta_p_5").addClass("marked");
    };
    this.showTour = function(){
        //create output path and subpaths
        $("#"+st+"_div_statusErklaerung").html('<h3>5. ' + LNG.K('algorithm_euler') + '</h3>\
            <p><button id="animateTour">' + LNG.K('algorithm_status51b_desc2') + '</button><button id="animateTourStop">' + LNG.K('algorithm_status51b_desc3') + '</button></p>\
            <p>' + LNG.K('algorithm_status51b_desc4') + '</p>');
        $("#animateTour").button({icons: {primary: "ui-icon-play"}}).click({org: this}, this.animateTour);
        $("#animateTourStop").button({
            icons: {primary: "ui-icon-stop"},
            disabled: true
        }).click({org: this}, this.animateTourStop);
        statusID = END;
        $(".marked").removeClass("marked");
        $("#ta_p_5").addClass("marked");
    };

    this.appendTours = function () {
        //create output path and subpaths
        var output = "";
        for (var i = 0; i < tour.length; i++) {
            if (tour[i].type == "vertex") {
                output += graph.nodes[tour[i].id].getLabel();
            }
            if (tour[i].type == "edge") {
                var layout = graph.edges[tour[i].id].getLayout();
                output += ' <span style="color: ' + layout.lineColor + ';">&rarr;</span> ';
            }
        }
        var output_subtours = "";
        for (var i = 0; i < subtours.length; i++) {
            var cur = subtours[i];
            output_subtours += '<li class="subtour_hover" data-tour-id="' + i + '" style="color: ' + tourColors[cur['color']] + ';">';
            for (var j = 0; j < cur['tour'].length; j++) {
                if (cur['tour'][j].type == "vertex" && j == 0) {
                    output_subtours += graph.nodes[cur['tour'][j].id].getLabel();
                } else if (cur['tour'][j].type == "vertex") {
                    output_subtours += "&rarr;" + graph.nodes[cur['tour'][j].id].getLabel();
                }
            }
            output_subtours += '</li>';
        }
        // Erklärung im Statusfenster
        $("#"+st+"_div_statusErklaerung").append('<div id="ta_div_subtours"><p class="result_euleriantour">' + output + '</p>\
            <p>' + LNG.K('algorithm_status51b_desc1') + '</p>\
            <h3>' + LNG.K('algorithm_euler_subtours') + '</h3>\
            <ul class="subtourList result_subtour">' + output_subtours + '</ul>\
            <p>' + LNG.K('algorithm_status52_desc1') + '</p></div>');
        $(".subtourList").on("mouseenter", "li.subtour_hover", {org: this}, this.hoverSubtour).on("mouseleave", "li.subtour_hover", {org: this}, this.dehoverSubtour);
        statusID = END;
    };

    this.hoverSubtour = function (event) {
        var tourId = $(event.target).data("tourId");
        $(event.target).css("font-weight", "bold");
        var curSubtour = subtours[tourId]['tour'];

        for (var i = 0; i < curSubtour.length; i++) {
            if (curSubtour[i].type == "edge") {
                graph.edges[curSubtour[i].id].setLayout("lineWidth", 6);
            }
        }
        event.data.org.needRedraw = true;
    };

    this.dehoverSubtour = function (event) {
        var tourId = $(event.target).data("tourId");
        $(event.target).css("font-weight", "normal");
        var curSubtour = subtours[tourId]['tour'];

        for (var i = 0; i < curSubtour.length; i++) {
            if (curSubtour[i].type == "edge") {
                graph.edges[curSubtour[i].id].setLayout("lineWidth", 3);
            }
        }
        event.data.org.needRedraw = true;
    };

    this.animateTourStep = function (event) {
        if (tourAnimationIndex > 0 && tour[(tourAnimationIndex - 1)].type == "vertex") {
            graph.nodes[tour[(tourAnimationIndex - 1)].id].setLayout("fillStyle", const_Colors.NodeFilling);
        }
        if (tourAnimationIndex > 0 && tour[(tourAnimationIndex - 1)].type == "edge") {
            graph.edges[tour[(tourAnimationIndex - 1)].id].setLayout("lineColor", tourColors[color[tour[(tourAnimationIndex - 1)].id]]);
            graph.edges[tour[(tourAnimationIndex - 1)].id].setLayout("lineWidth", 3);
        }
        this.needRedraw = true;
        if (tourAnimationIndex >= tour.length) {
            if(statusID == END) this.appendTours();
            this.animateTourStop(event);
            return;
        }
        if (tour[tourAnimationIndex].type == "vertex") {
            graph.nodes[tour[tourAnimationIndex].id].setLayout("fillStyle", const_Colors.NodeFillingHighlight);
        }
        if (tour[tourAnimationIndex].type == "edge") {
            graph.edges[tour[tourAnimationIndex].id].setLayout("lineColor", tourColors[color[tour[tourAnimationIndex].id]]);
            graph.edges[tour[tourAnimationIndex].id].setLayout("lineWidth", 6);
        }
        this.needRedraw = true;
        tourAnimationIndex++;
    };

    this.animateTour = function (event) {
        $("#animateTour").button("option", "disabled", true);
        $("#animateTourStop").button("option", "disabled", false);
        tourAnimationIndex = 0;
        var self = event.data.org;
        animationId = window.setInterval(function () {
            self.animateTourStep(event);
        }, 250);
    };

    this.animateTourStop = function (event) {
        if (tourAnimationIndex > 0 && tour[(tourAnimationIndex - 1)].type == "vertex") {
            graph.nodes[tour[(tourAnimationIndex - 1)].id].setLayout("fillStyle", const_Colors.NodeFilling);
        }
        if (tourAnimationIndex > 0 && tour[(tourAnimationIndex - 1)].type == "edge") {
            graph.edges[tour[(tourAnimationIndex - 1)].id].setLayout("lineWidth", 3);
        }
        event.data.org.needRedraw = true;
        tourAnimationIndex = 0;
        window.clearInterval(animationId);
        animationId = null;
        $("#animateTour").button("option", "disabled", false);
        $("#animateTourStop").button("option", "disabled", true);
        return;
    };

    /**
     * Zeigt Texte und Buttons zum Ende des Algorithmus
     * @method
     */
    this.endAlgorithm = function () {
        statusID = STOP;
        $(".marked").removeClass("marked");
        $("#ta_p_end").addClass("marked");
        $( "#ta_div_subtours" ).remove();
        $("#"+st+"_div_statusErklaerung").append("<p></p><h3>" + LNG.K('algorithm_msg_finish') + "</h3>");
        $("#"+st+"_div_statusErklaerung").append("<button id=ta_button_gotoIdee>" + LNG.K('algorithm_btn_more') + "</button>");
        $("#"+st+"_div_statusErklaerung").append("<h3>" + LNG.K('algorithm_msg_test') + "</h3>");
        $("#"+st+"_div_statusErklaerung").append("<button id=ta_button_gotoFA1>" + LNG.K('algorithm_btn_exe1') + "</button>");
        $("#"+st+"_div_statusErklaerung").append("<button id=ta_button_gotoFA2>" + LNG.K('algorithm_btn_exe2') + "</button>");
        $("#"+st+"_button_gotoIdee").button();
        $("#"+st+"_button_gotoFA1").button();
        $("#"+st+"_button_gotoFA2").button();
        $("#"+st+"_button_gotoIdee").click(function () {
            $("#"+st+"bs").tabs("option", "active", 3);
        });
        $("#"+st+"_button_gotoFA1").click(function () {
            $("#"+st+"bs").tabs("option", "active", 4);
        });
        $("#"+st+"_button_gotoFA2").click(function () {
            $("#"+st+"bs").tabs("option", "active", 5);
        });
        // Falls wir im "Vorspulen" Modus waren, daktiviere diesen
        if (fastForwardIntervalID != null) {
            this.stopFastForward();
        }
        $("#"+st+"_button_1Schritt").button("option", "disabled", true);
        $("#"+st+"_button_vorspulen").button("option", "disabled", true);
    };

    this.animateMoveStep = function (node, c, newc, step, aid) {
        var STEPS = 100;
        var coord = c;
        var dir = {x: newc.x - coord.x, y: newc.y - coord.y};
        node.setCoordinates({x: coord.x + (step / STEPS * dir.x), y: coord.y + (step / STEPS * dir.y)});
        algo.needRedraw = true;
        if (step >= STEPS) {
            window.clearInterval(aid);
        }
    };
    this.animateMove = function (node, newc) {
        var step = 0;
        var an = 0;
        var c = node.getCoordinates();
        an = window.setInterval(function () {
            algo.animateMoveStep(node, c, newc, step++, an);
        }, 5);
    };

    /**
     * Ermittelt basierend auf der StatusID und anderen den vorherigen Schritt aus
     * und ruft die entsprechende Funktion auf.
     * @method
     */
    this.previousStepChoice = function () {
        window.clearInterval(animationId);
        this.replayStep();
        if (history.length == 0) {
            $("#"+st+"_button_Zurueck").button("option", "disabled", true);
        }
        else {
            $("#"+st+"_button_1Schritt").button("option", "disabled", false);
            $("#"+st+"_button_vorspulen").button("option", "disabled", false);
        }
        this.needRedraw = true;
    };

    this.addReplayStep = function () {
        var nodeProperties = {};
        for (var key in graph.nodes) {
            nodeProperties[graph.nodes[key].getNodeID()] = {
                layout: JSON.stringify(graph.nodes[key].getLayout()),
                label: graph.nodes[key].getLabel()
                //coordiantes: graph.nodes[key].getCoordinates()
            };
        }
        var edgeProperties = {}
        for (var key in graph.edges) {
            edgeProperties[graph.edges[key].getEdgeID()] = {
                layout: JSON.stringify(graph.edges[key].getLayout()),
                label: graph.edges[key].getAdditionalLabel()
            };
        }
        history.push({
            "previousStatusId": statusID,
            "nodeProperties": nodeProperties,
            "edgeProperties": edgeProperties,
            "phase": phase,
            "next": next,
            "graph": this.graph,
            "pseudocode": $("#"+st+"_div_statusPseudocode").html(),
            "htmlSidebar": $("#"+st+"_div_statusErklaerung").html()
        });
        //console.log("Current History Step: ", history[history.length-1]);
    };

    this.replayStep = function () {
        if (history.length > 0) {
            var oldState = history.pop();
            //remove new edges from the graph
            statusID = oldState.previousStatusId;
            phase = oldState.phase;
            next = oldState.next;
            this.graph = oldState.graph;
            $("#"+st+"_div_statusErklaerung").html(oldState.htmlSidebar);
            $("#"+st+"_div_statusPseudocode").html(oldState.pseudocode);
            for (var key in oldState.nodeProperties) {
                if (graph.nodes[key]) {
                    graph.nodes[key].setLayoutObject(JSON.parse(oldState.nodeProperties[key].layout));
                    graph.nodes[key].setLabel(oldState.nodeProperties[key].label);
                    //graph.nodes[key].setCoordinates(oldState.nodeProperties[key].coordiantes);
                }
            }
            for (var key in oldState.edgeProperties) {
                if (graph.edges[key]) {
                    graph.edges[key].setLayoutObject(JSON.parse(oldState.edgeProperties[key].layout));
                    graph.edges[key].setAdditionalLabel(oldState.edgeProperties[key].label);
                }
            }
            if (statusID == START_ADDING_PATHS) {
                for (var m in matching) {
                    var e = matching[m].edge.getEdgeID();
                    if (graph.edges[e]) graph.removeEdge(e);
                }
            }
            if (statusID == MATCHING) {
                for (var e in matching_graph.edges) {
                    matching_graph.removeEdge(e);
                }
                for (var s in supplyNodes) {
                    for (var d in demandNodes) {
                        var e = matching_graph.addEdge(matching_graph.nodes[id_map[s]], matching_graph.nodes[id_map[d]], distance[supplyNodes[s].getNodeID()][demandNodes[d].getNodeID()], false);
                        randomizeLabelPosition(e);
                    }
                }
            }
            if (statusID == ADD_PATHS) {
                undoPath(next);
            }
            if (statusID == SHOW_TOUR) {
                this.startTour();
            }
            if (statusID == END && feasible) {
                this.showTour();
            }
        }
    };

    this.setStatusWindow = function(fenster){
        st = fenster;
    };
    this.getDistance = function(){
        return distance;
    };
    this.getMatching = function(){
        return matching;
    };
    this.getCost = function(){
        return cost;
    };
    this.isFeasible = function(){
        return feasible;
    };

    this.deleteInsertedEdges = function(){
        for (var e in graph.edges) {
            if (graph.edges[e].getLayout().dashed || !graph.edges[e].getDirected()) {
                graph.removeEdge(e);
            }
        }
    };
}

// Vererbung realisieren
algorithm.prototype = new CanvasDrawer;
algorithm.prototype.constructor = algorithm;