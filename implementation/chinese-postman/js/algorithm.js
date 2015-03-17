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
    var statusID = null;
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

    var delta = new Object();

    var excess = 0;

    var demandNodes = new Object();

    var supplyNodes = new Object();
    /**
     * Assoz. Array mit Paaren von Knoten, die Pfade repraesentieren<br>
     * s: Startknoten, d: Zielknoten
     * @type Object
     */
    var matching = new Object();

    var matching_graph = null;

    var id_map = {};

    var current = 0;
    /**
     * Array mit den neu eingefuegten Pfaden<br>
     * Enthaelt Arrays von neuen Kanten
     * @type Object
     */
    var new_edges = [];

    var tour = new Array();

    var subtours = new Array();
    var color = {};
    var tourColors = new Array("#0000cc", "#006600", "#990000", "#999900", "#cc6600", "#660099", "#330000");
    var tourAnimationIndex = 0;
    var tourAnimation = null;
    var animationId = 0;
    /*
     * Alle benoetigten Information zur Wiederherstellung der vorangegangenen Schritte werden hier gespeichert.
     * @type Array
     * */
    var history = new Array();
    /**
     * Gibt das Statusausgabefenster an.
     */
    var statusErklaerung = "#ta_div_statusErklaerung";
    /*
     * Hier werden die Statuskonstanten definiert
     * */
    var FEASIBILITY = 0;
    var SHOW_UNBALANCED_NODES = 3;
    var SHORTEST_PATHS = 7;
    var ADD_PATHS = 11;
    var MATCHING = 4;
    var INIT_TOUR = 6;
    var SHOW_TOUR = 15;
    var END = 10;

    /*
     * Entferne alle Knoten, die zu keiner Kante inzident sind
     * */
    this.deleteIsolatedNodes = function(){
        for(var n in graph.nodes){
            var node = graph.nodes[n];
            if(Object.keys(node.getOutEdges()).length + Object.keys(node.getInEdges()).length == 0){
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
        $("#ta_div_abspielbuttons").append("<button id=\"ta_button_Zurueck\">" + LNG.K('algorithm_btn_prev') + "</button>"
        + "<button id=\"ta_button_1Schritt\">" + LNG.K('algorithm_btn_next') + "</button>"
        + "<button id=\"ta_button_vorspulen\">" + LNG.K('algorithm_btn_frwd') + "</button>"
        + "<button id=\"ta_button_stoppVorspulen\">" + LNG.K('algorithm_btn_paus') + "</button>");
        $("#ta_button_stoppVorspulen").hide();
        $("#ta_button_Zurueck").button({icons: {primary: "ui-icon-seek-start"}, disabled: true});
        $("#ta_button_1Schritt").button({icons: {primary: "ui-icon-seek-end"}, disabled: false});
        $("#ta_button_vorspulen").button({icons: {primary: "ui-icon-seek-next"}, disabled: false});
        $("#ta_button_stoppVorspulen").button({icons: {primary: "ui-icon-pause"}});
        $("#ta_div_statusTabs").tabs();
        $(".marked").removeClass("marked");
        $("#ta_p_begin").addClass("marked");
        $("#ta_tr_LegendeClickable").removeClass("greyedOutBackground");
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
        //delete all inserted edges
        /*for(var e in new_edges){
            for(var e in new_edges[p]){
                graph.removeEdge(new_edges[p][e].getEdgeID());
            }
        }*/
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
        var algo = new algorithm($("body").data("graph"), $("#ta_canvas_graph"), $("#tab_ta"));
        $("#tab_ta").data("algo", algo);
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
        $("#ta_button_1Schritt").on("click.algorithm", function () {
            algo.singleStepHandler();
        });
        $("#ta_button_vorspulen").on("click.algorithm", function () {
            algo.fastForwardAlgorithm();
        });
        $("#ta_button_stoppVorspulen").on("click.algorithm", function () {
            algo.stopFastForward();
        });
        $("#ta_button_Zurueck").on("click.algorithm", function () {
            algo.previousStepChoice();
        });
    };

    /**
     * Entferne die Eventhandler von Buttons und canvas im Namespace ".algorithm"
     * @method
     */
    this.deregisterEventHandlers = function () {
        canvas.off(".algorithm");
        $("#ta_button_1Schritt").off(".algorithm");
        $("#ta_button_vorspulen").off(".algorithm");
        $("#ta_button_stoppVorspulen").off(".algorithm");
        $("#ta_tr_LegendeClickable").off(".algorithm");
        $("#ta_button_Zurueck").off(".algorithm");
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
        $("#ta_button_vorspulen").hide();
        $("#ta_button_stoppVorspulen").show();
        $("#ta_button_1Schritt").button("option", "disabled", true);
        $("#ta_button_Zurueck").button("option", "disabled", true);
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
        $("#ta_button_vorspulen").show();
        $("#ta_button_stoppVorspulen").hide();
        $("#ta_button_1Schritt").button("option", "disabled", false);
        $("#ta_button_Zurueck").button("option", "disabled", false);
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
            case INIT_TOUR:
                this.startAddingPaths();
                break;
            case ADD_PATHS:
                this.addPaths();
                break;
            case SHOW_TOUR:
                clearInterval(animationId);
                this.startTour();
                break;
            case END:
                clearInterval(animationId);
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
    this.findMatching = function(){
        //construct cost matrix
        var uid_map = {};
        var vid_map = {};
        var n = 0;
        for(var node in supplyNodes){
            var id = supplyNodes[node].getNodeID();
            for (var i=0;i<-delta[id];i++){
                uid_map[n] = id;
                n++;
            }
        }
        n = 0;
        for(var node in demandNodes){
            var id = demandNodes[node].getNodeID();
            for (var i=0;i<delta[id];i++){
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
        for(var i = 0;i< match.length; i++){
            matching.push({s:uid_map[i],d:vid_map[match[i]]});
        }
    };
    /*
    * Computes the eulertour
    * @method
    * */
    this.computeEulerTour = function() {
        // init
        tour = [];
        subtours = [];
        var tourColorIndex = 0;
        // Starting node
        var start;
        for(var n in graph.nodes){
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
        while(numberOfEdgesInTour < numberOfEdgesInGraph) {
            // Add start to subtour
            subtour.push({type: "vertex", id: current.getNodeID()});
            // While start != current, except first iteration
            do {
                // Get out edges
                var outEdges = current.getOutEdges();
                var nextEdge = null;

                // Find unvisited out edge
                for(var kantenID in outEdges) {
                    if(visitedEdges.indexOf(kantenID) === -1) {
                        nextEdge = outEdges[kantenID];
                        visitedEdges.push(kantenID);
                        subtour.push({type: "edge", id: kantenID});
                        break;
                    }
                }
                if(nextEdge === null) {
                    return
                }
                // Get other Vertex which is new current
                current = graph.nodes[nextEdge.getTargetID()];
                subtour.push({type: "vertex", id: current.getNodeID()});
            } while(start.getNodeID() !== current.getNodeID());
            // Merge
            // If tour is empty, just replace with subtour
            if(tour.length === 0) {
                tour = subtour;
            }else{
                // Start node of subtour
                var startOfSubTour = subtour[0];
                var newTour = new Array();
                var replaced = false;
                // Find subtour's start node in tour
                for(var i = 0; i < tour.length; i++) {
                    // If found, add complete subtour
                    if(JSON.stringify(tour[i]) == JSON.stringify(startOfSubTour) && !replaced) {
                        for(var j = 0; j < subtour.length; j++) {
                            newTour.push(subtour[j]);
                        }
                        replaced = true;
                    // Otherwise add elements from tour
                    }else{
                        newTour.push(tour[i]);
                    }
                }
                tour = newTour;
            }
            subtours.push({color: tourColorIndex, tour: subtour});
            for(var i in subtour){//save colors
                var c = subtour[i];
                if(c.type == "edge"){
                    color[c.id] = tourColorIndex;
                }
            }
            tourColorIndex++;
            tourColorIndex = tourColorIndex % tourColors.length;
            subtour = [];
            // Count number of edges in tour
            numberOfEdgesInTour = 0;
            for(var i = 0; i < tour.length; i++) {
                if(tour[i].type === "edge") {
                    numberOfEdgesInTour++;
                }
            }
            //find next start node
            for(var node in tour){
                if(tour[node].type == "vertex"){
                    // Get out edges
                    var outEdges = graph.nodes[tour[node].id].getOutEdges();
                    var found = false;
                    // Find unvisited out edge
                    for(var kantenID in outEdges) {
                        if(visitedEdges.indexOf(kantenID) === -1) {
                            current = graph.nodes[tour[node].id];
                            start = graph.nodes[tour[node].id];
                            found = true;
                            break;
                        }
                    }
                    if(found) break;
                }
            }
        }
    };
    /**
     * Ueberpruefe ob das Problem loesbar ist.
     */
    this.checkFeasibility = function () {
        $("#ta_button_Zurueck").button({icons: {primary: "ui-icon-seek-start"}, disabled: false});
        //determine shortest paths
        distance = {};
        predecessor = {};
        shortestPaths(graph,distance,predecessor);
        //determine the feasibility of the problem
        var strongly_connected = true;
        for(var n1 in graph.nodes){
            for(var n2 in graph.nodes){
                if(distance[n1][n2] == "inf") strongly_connected = false;
            }
        }
        var negative_cycle = false;
        for(var n in graph.nodes){
            if(distance[n][n] < 0) negative_cycle = true;
        }
        var feasible = strongly_connected && !negative_cycle;
        $("#ta_div_statusErklaerung").html("<h3>1. " + LNG.K('algorithm_feasibility') + "</h3>"
                                            + "<p>" + LNG.K('algorithm_feasible_0') + "</p>");
        if (feasible) {
            statusID = SHOW_UNBALANCED_NODES;
            $("#ta_div_statusErklaerung").append(
                "<p>" + LNG.K('algorithm_feasible_1') + "</p>"
                + "<p>" + LNG.K('algorithm_feasible_2') + "</p>"
                + "<p>" + LNG.K('algorithm_feasible') + "</p>");
            //$(".marked").removeClass("marked");
        }
        else{
            statusID = END;
            if(!strongly_connected) $("#ta_div_statusErklaerung").append("<p>" + LNG.K('algorithm_infeasible_1') + "</p>");
            if(negative_cycle) $("#ta_div_statusErklaerung").append("<p>" + LNG.K('algorithm_infeasible_2') + "</p>");
            $("#ta_div_statusErklaerung").append("<p>" + LNG.K('algorithm_infeasible') + "</p>");
            //$(".marked").removeClass("marked");
        }
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
        for (var n in graph.nodes){
            var node = graph.nodes[n];
            var d = Object.keys(node.getOutEdges()).length - Object.keys(node.getInEdges()).length;
            delta[node.getNodeID()] = d;
            if(d < 0) {
                supplyNodes[node.getNodeID()] = node;
                highlightSupply(node);
            }
            else if(d > 0) {
                demandNodes[node.getNodeID()] = node;
                highlightDemand(node);
                excess+=d;
            }
            node.setLabel(d);
        }
        $("#ta_div_statusErklaerung").html("<h3>2. " + LNG.K('algorithm_find_balanced_nodes') + "</h3>" +
        "<p>" + LNG.K('algorithm_find_balanced_nodes_1') + "</p>");
        //fall es alle Knoten balanciert sind, kann gleich mit Eulertour begonnen werden
        if(excess == 0){
            statusID = SHOW_TOUR;
            // Erklärung im Statusfenster
            $("#ta_div_statusErklaerung").append("<p>" + LNG.K('algorithm_balanced_1') + "</p>"
            + "<p>" + LNG.K('algorithm_balanced_2') + "</p>");
        }
        else{
            statusID = SHORTEST_PATHS;
            // Erklärung im Statusfenster
            $("#ta_div_statusErklaerung").append("<p>" + LNG.K('algorithm_unbalanced_1') + "</p>"
            /*+ "<p>" + LNG.K('algorithm_unbalanced_2') + "</p>"
            + "<p>" + LNG.K('algorithm_unbalanced_3') + "</p>"*/);
        }
    };

    var highlightSupply = function(node){
        node.setLayout('fillStyle', '#CCFFFF');//slateBlue
    };
    var highlightDemand = function(node){
      node.setLayout('fillStyle', '#4E6AC1');//CornflowerBlue
    };
    var setEdgeMatched = function (e) {
        e.setLayout('lineColor', 'green');
        e.setLayout('lineWidth', global_Edgelayout.lineWidth * 2);
    };
    var hideEdge = function(edge) {
        edge.setLayout("lineWidth", global_Edgelayout.lineWidth * 0.4);
    };
    var hideNode = function(node){
        node.setLayout('fillStyle',"DarkGray");
        node.setLayout('borderWidth',global_NodeLayout.borderWidth);
        node.setLayout('borderColor',"Gray");
    };

    this.showShortestPaths = function () {
        this.findMatching();
        //construct new graph
        matching_graph = new Graph();
        id_map = {};
        var U_POSITION = 75; //standard 75
        var V_POSITION = 325;//standard 325
        var DIFF = 80;
        var i = 0;
        var j = 0;
        for(var n in graph.nodes){
            if(supplyNodes[n] || demandNodes[n]){
                var node = graph.nodes[n];
                var coord = node.getCoordinates();
                var newn= matching_graph.addNode(coord.x,coord.y);
                newn.setLayoutObject(node.getLayout());
                newn.setLabel(node.getLabel());
                id_map[node.getNodeID()] = newn.getNodeID();
                if(supplyNodes[n]){
                    this.animateMove(newn,{x: 50 + i*DIFF, y: V_POSITION});
                    i++;
                }
                else{
                    this.animateMove(newn,{x: 50 + j*DIFF, y: U_POSITION});
                    j++;
                }
            }
        }
        for(var s in supplyNodes){
            for(var d in demandNodes){
                var id1 = id_map[s];
                var id2 = id_map[d];
                matching_graph.addEdge(matching_graph.nodes[id1],matching_graph.nodes[id2],distance[supplyNodes[s].getNodeID()][demandNodes[d].getNodeID()],false);
            }
        }
        this.graph = matching_graph;
        statusID = MATCHING;
        // Erklärung im Statusfenster
        $("#ta_div_statusErklaerung").html("<h3>3. " + LNG.K('algorithm_paths') + "</h3>"
        + "<p>" + LNG.K('algorithm_paths_1') + "</p>"
        + "<p>" + LNG.K('algorithm_paths_2') + "</p>");
    };

    this.showMatching = function(){
        for(var e in matching_graph.edges){
            matching_graph.removeEdge(e);
        }
        for(var p in matching){
            var id1 = id_map[matching[p].s];
            var id2 = id_map[matching[p].d];
            var e = matching_graph.addEdge(matching_graph.nodes[id1],matching_graph.nodes[id2], distance[matching[p].s][matching[p].d],false);
            setEdgeMatched(e);
        }
        statusID = INIT_TOUR;
        // Erklärung im Statusfenster
        $("#ta_div_statusErklaerung").html("<h3>3. " + LNG.K('algorithm_paths') + "</h3>"
        + "<p>" + LNG.K('algorithm_matching_1') + "</p>"
        + "<p>" + LNG.K('algorithm_matching_2') + "</p>");
    };

    this.startAddingPaths = function(){
        this.graph = graph;
        //hide normal edges
        for(var e in graph.edges){
            hideEdge(graph.edges[e]);
        }
        //insert matching edges
        for(var p in matching){
            var s = matching[p].s;
            var d = matching[p].d;
            var e = graph.addEdge(graph.nodes[s],graph.nodes[d],distance[matching[p].s][matching[p].d],false);
            setEdgeMatched(e);
            matching[p].edge = e;
        }
        //start move animations
        for(var n in graph.nodes){
            if(supplyNodes[n] || demandNodes[n]){
                var old_coord = graph.nodes[n].getCoordinates();
                graph.nodes[n].setCoordinates(matching_graph.nodes[id_map[n]].getCoordinates());
                this.animateMove(graph.nodes[n],old_coord);
            }
        }
        statusID = ADD_PATHS;
        // Erklärung im Statusfenster
        $("#ta_div_statusErklaerung").html("<h3>4. " + LNG.K('algorithm_new_paths') + "</h3>"
        + "<p>" + LNG.K('algorithm_new_paths_1') + "</p>"
        + "<p>" + LNG.K('algorithm_new_paths_2') + "</p>");
    };
    /*
    *
    * */
    this.addPaths = function(){
        var step = 0;
        var current = 0;
        var shortest = [];
        //first find all edges on the matching paths
        for(var p in matching){
            var s = matching[p].s;
            var d = matching[p].d;
            var last = d;
            var prev = [];
            while(last != s){
                var e = predecessor[s][last];
                prev.push(e);
                last = e.getSourceID();
            }
            prev.reverse();
            shortest.push(prev);
        }
        // animate the adding of the matching path edges
        new_edges = [];
        animationId = setInterval(function () {
            if(current >= shortest.length){
                clearInterval(animationId);
                return;
            }
            if(step == 0){
                graph.nodes[matching[current].s].setLayout('borderColor', const_Colors.NodeBorderHighlight);
                graph.nodes[matching[current].d].setLayout('borderColor', const_Colors.NodeBorderHighlight);
            }
            else if(step == shortest[current].length + 1){
                graph.nodes[matching[current].s].setLayout('borderColor', const_Colors.NodeBorder);
                graph.nodes[matching[current].d].setLayout('borderColor', const_Colors.NodeBorder);
                graph.nodes[matching[current].s].setLabel(graph.nodes[s].getLabel() + 1);
                graph.nodes[matching[current].d].setLabel(graph.nodes[d].getLabel() - 1);
                graph.removeEdge(matching[current].edge.getEdgeID());
                step = -1;
                current++;
            }
            else{
                var e = shortest[current][step-1];
                var ne = graph.addEdge(graph.nodes[e.getSourceID()],graph.nodes[e.getTargetID()], e.weight);
                ne.setLayout('dashed',true);
                new_edges.push(ne);
            }
            step++;
            algo.needRedraw = true;
        }, 500);
        statusID = SHOW_TOUR;
        // Erklärung im Statusfenster
        $("#ta_div_statusErklaerung").append(
            //+ "<p>" + LNG.K('algorithm_add_path_3') + "</p>" +
                "<p>" + LNG.K('algorithm_balanced_1') + "</p>");
    };
    // Methoden fuer die Visualisierung der Eulertour
    /*
    *
    * */
     this.startTour = function(){
         for(var e in graph.edges){
             if(graph.edges[e].getLayout().dashed || !graph.edges[e].getDirected()){
                 graph.removeEdge(e);
             }
         }
         for(var m in matching){
             var s = matching[m].s;
             var d = matching[m].d;
             var last = d;
             while(last != s){
                 var e = predecessor[s][last];
                 var node1 = graph.nodes[e.getSourceID()];
                 var node2 = graph.nodes[e.getTargetID()];
                 var ne = graph.addEdge(node1,node2, e.weight);
                 ne.setLayout('dashed',true);
                 last = e.getSourceID();
             }
         }
        this.computeEulerTour();
        for (var n in graph.nodes) {
            graph.nodes[n].restoreLayout();
        }
        var cost = 0;
        for (var e in graph.edges) {
            cost += graph.edges[e].weight;
            graph.edges[e].setLayout('lineWidth',global_Edgelayout.lineWidth);
            graph.edges[e].setLayout('lineColor',global_Edgelayout.lineColor);
        }
        this.addNamingLabels();
        //create output path and subpaths
        var output = "";
        for(var i = 0; i < tour.length; i++) {
            if(tour[i].type == "vertex") {
                output += graph.nodes[tour[i].id].getLabel();
            }
            if(tour[i].type == "edge") {
                var layout = graph.edges[tour[i].id].getLayout();
                output += ' <span style="color: '+layout.lineColor+';">&rarr;</span> ';
            }
        }
        var output_subtours = "";
        for(var i = 0; i < subtours.length; i++) {
            var cur = subtours[i];
            output_subtours += '<li class="subtour_hover" data-tour-id="'+i+'" style="color: '+tourColors[cur['color']]+';">';
            for(var j = 0; j < cur['tour'].length; j++) {
                if(cur['tour'][j].type == "vertex" && j == 0) {
                    output_subtours += graph.nodes[cur['tour'][j].id].getLabel();
                }else if(cur['tour'][j].type == "vertex") {
                    output_subtours += "&rarr;"+graph.nodes[cur['tour'][j].id].getLabel();
                }
            }
            output_subtours += '</li>';
        }
        // Erklärung im Statusfenster
        $("#ta_div_statusErklaerung").html('<h3>5. '+LNG.K('algorithm_euler')+'</h3>\
            <p><button id="animateTour">'+LNG.K('algorithm_status51b_desc2')+'</button><button id="animateTourStop">'+LNG.K('algorithm_status51b_desc3')+'</button></p>\
            <p>'+LNG.K('algorithm_status51b_desc4')+'</p>\
            <p>' + LNG.K('algorithm_cost') + cost + '</p>\
            <p class="result_euleriantour">' + output + '</p>\
            <p>'+LNG.K('algorithm_status51b_desc1')+'</p>\
            <h3>'+LNG.K('algorithm_euler_subtours')+'</h3>\
            <ul class="subtourList result_subtour">'+output_subtours+'</ul>\
            <p>'+LNG.K('algorithm_status52_desc1')+'</p>');
        $(".subtourList").on("mouseenter", "li.subtour_hover", {org: this}, this.hoverSubtour).on("mouseleave", "li.subtour_hover", {org: this}, this.dehoverSubtour);
        $("#animateTour").button({icons:{primary: "ui-icon-play"}}).click({org: this}, this.animateTour);
        $("#animateTourStop").button({icons:{primary: "ui-icon-stop"}, disabled: true}).click({org: this}, this.animateTourStop);
        statusID = END;
    };

    this.addNamingLabels = function() {
        var nodeCounter = 1;
        for(var knotenID in graph.nodes) {
            graph.nodes[knotenID].setLabel(String.fromCharCode("a".charCodeAt(0)+nodeCounter-1));
            nodeCounter++;
        };
    };

    this.showEulerianCycle = function(){
        //create output path and subpaths
        var output = "";
        for(var i = 0; i < tour.length; i++) {
            if(tour[i].type == "vertex") {
                output += graph.nodes[tour[i].id].getLabel();
            }
            if(tour[i].type == "edge") {
                var layout = graph.edges[tour[i].id].getLayout();
                output += ' <span style="color: '+layout.lineColor+';">&rarr;</span> ';
            }
        }
        var output_subtours = "";
        for(var i = 0; i < subtours.length; i++) {
            var cur = subtours[i];
            output_subtours += '<li class="subtour_hover" data-tour-id="'+i+'" style="color: '+tourColors[cur['color']]+';">';
            for(var j = 0; j < cur['tour'].length; j++) {
                if(cur['tour'][j].type == "vertex" && j == 0) {
                    output_subtours += graph.nodes[cur['tour'][j].id].getLabel();
                }else if(cur['tour'][j].type == "vertex") {
                    output_subtours += "&rarr;"+graph.nodes[cur['tour'][j].id].getLabel();
                }
            }
            output_subtours += '</li>';
        }
        //print
        $("#ta_div_statusErklaerung").html('<h3>5. '+LNG.K('algorithm_euler')+'</h3>\
            <p class="result_euleriantour">' + output + '</p>\
            <p>'+LNG.K('algorithm_status51b_desc1')+'</p>\
            <p><button id="animateTour">'+LNG.K('algorithm_status51b_desc2')+'</button><button id="animateTourStop">'+LNG.K('algorithm_status51b_desc3')+'</button></p>\
            <p>'+LNG.K('algorithm_status51b_desc4')+'</p>\
            <h3>5.2 '+LNG.K('algorithm_status2_head')+'</h3>\
            <ul class="subtourList result_subtour">'+output_subtours+'</ul>\
            <p>'+LNG.K('algorithm_status52_desc1')+'</p>\
            <p></p><h3>'+LNG.K('algorithm_msg_finish')+'</h3>\
            <button id="ta_button_gotoIdee">'+LNG.K('algorithm_btn_more')+'</button>\
            <h3>'+LNG.K('algorithm_msg_test')+'</h3>\
            <button id="ta_button_gotoFA1">'+LNG.K('algorithm_btn_exe1')+'</button>\
            <button id="ta_button_gotoFA2">'+LNG.K('algorithm_btn_exe2')+'</button>');
        if(fastForwardIntervalID != null) {
            this.stopFastForward();
        }
        $("#ta_button_gotoIdee").button();
        $("#ta_button_gotoFA1").button();
        $("#ta_button_gotoFA2").button();
        $("#ta_button_gotoIdee").click(function() {$("#tabs").tabs("option", "active", 3);});
        $("#ta_button_gotoFA1").click(function() {$("#tabs").tabs("option", "active", 4);});
        $("#ta_button_gotoFA2").click(function() {$("#tabs").tabs("option", "active", 5);});
        $("#ta_button_1Schritt").button("option", "disabled", true);
        $("#ta_button_vorspulen").button("option", "disabled", true);
        $(".subtourList").on("mouseenter", "li.subtour_hover", {org: this}, this.hoverSubtour).on("mouseleave", "li.subtour_hover", {org: this}, this.dehoverSubtour);
        $("#animateTour").button({icons:{primary: "ui-icon-play"}}).click({org: this}, this.animateTour);
        $("#animateTourStop").button({icons:{primary: "ui-icon-stop"}, disabled: true}).click({org: this}, this.animateTourStop);
    };


    /**
     * Zeigt Texte und Buttons zum Ende des Algorithmus
     * @method
     */
    this.endAlgorithm = function () {
        //color edges
        for (var e in graph.edges) {
            graph.edges[e].setLayout('lineColor', tourColors[color[e]]);

        }
        $("#ta_div_statusErklaerung").append("<p></p><h3>" + LNG.K('algorithm_msg_finish') + "</h3>");
        $("#ta_div_statusErklaerung").append("<button id=ta_button_gotoIdee>" + LNG.K('algorithm_btn_more') + "</button>");
        $("#ta_div_statusErklaerung").append("<h3>" + LNG.K('algorithm_msg_test') + "</h3>");
        $("#ta_div_statusErklaerung").append("<button id=ta_button_gotoFA1>" + LNG.K('algorithm_btn_exe1') + "</button>");
        $("#ta_div_statusErklaerung").append("<button id=ta_button_gotoFA2>" + LNG.K('algorithm_btn_exe2') + "</button>");
        //this.showVariableStatusField(null, null);
        $("#ta_button_gotoIdee").button();
        $("#ta_button_gotoFA1").button();
        $("#ta_button_gotoFA2").button();
        $("#ta_button_gotoIdee").click(function () {
            $("#tabs").tabs("option", "active", 3);
        });
        $("#ta_button_gotoFA1").click(function () {
            $("#tabs").tabs("option", "active", 4);
        });
        $("#ta_button_gotoFA2").click(function () {
            $("#tabs").tabs("option", "active", 5);
        });
        // Falls wir im "Vorspulen" Modus waren, daktiviere diesen
        if (fastForwardIntervalID != null) {
            this.stopFastForward();
        }
        $("#ta_button_1Schritt").button("option", "disabled", true);
        $("#ta_button_vorspulen").button("option", "disabled", true);
    };

    this.hoverSubtour = function(event) {

        var tourId = $(event.target).data("tourId");
        $(event.target).css("font-weight", "bold");
        var curSubtour = subtours[tourId]['tour'];

        for(var i = 0; i < curSubtour.length; i++) {
            if(curSubtour[i].type == "edge") {
                graph.edges[curSubtour[i].id].setLayout("lineWidth", 6);
            }
        }
        event.data.org.needRedraw = true;

    };

    this.dehoverSubtour = function(event) {

        var tourId = $(event.target).data("tourId");
        $(event.target).css("font-weight", "normal");
        var curSubtour = subtours[tourId]['tour'];

        for(var i = 0; i < curSubtour.length; i++) {
            if(curSubtour[i].type == "edge") {
                graph.edges[curSubtour[i].id].setLayout("lineWidth", 3);
            }
        }
        event.data.org.needRedraw = true;

    };

    this.animateTourStep = function(event) {

        if(tourAnimationIndex > 0 && tour[(tourAnimationIndex - 1)].type == "vertex") {
            graph.nodes[tour[(tourAnimationIndex - 1)].id].setLayout("fillStyle", const_Colors.NodeFilling);
        }
        if(tourAnimationIndex > 0 && tour[(tourAnimationIndex - 1)].type == "edge") {
            graph.edges[tour[(tourAnimationIndex - 1)].id].setLayout("lineColor", tourColors[color[tour[(tourAnimationIndex - 1)].id]]);
            graph.edges[tour[(tourAnimationIndex - 1)].id].setLayout("lineWidth", 3);
        }
        this.needRedraw = true;

        if(tourAnimationIndex >= tour.length) {
            this.animateTourStop(event);
            return;
        }

        if(tour[tourAnimationIndex].type == "vertex") {
            graph.nodes[tour[tourAnimationIndex].id].setLayout("fillStyle", const_Colors.NodeFillingHighlight);
        }
        if(tour[tourAnimationIndex].type == "edge") {
            graph.edges[tour[tourAnimationIndex].id].setLayout("lineColor", tourColors[color[tour[tourAnimationIndex].id]]);
            graph.edges[tour[tourAnimationIndex].id].setLayout("lineWidth", 6);
        }

        this.needRedraw = true;
        tourAnimationIndex++;
    };

    this.animateTour = function(event) {
        $("#animateTour").button("option", "disabled", true);
        $("#animateTourStop").button("option", "disabled", false);
        tourAnimationIndex = 0;
        var self = event.data.org;
        tourAnimation = window.setInterval(function() {self.animateTourStep(event); }, 250);
    };

    this.animateTourStop = function(event) {
        if(tourAnimationIndex > 0 && tour[(tourAnimationIndex - 1)].type == "vertex") {
            graph.nodes[tour[(tourAnimationIndex - 1)].id].setLayout("fillStyle", const_Colors.NodeFilling);
        }
        if(tourAnimationIndex > 0 && tour[(tourAnimationIndex - 1)].type == "edge") {
            graph.edges[tour[(tourAnimationIndex - 1)].id].setLayout("lineWidth", 3);
        }
        event.data.org.needRedraw = true;
        tourAnimationIndex = 0;
        window.clearInterval(tourAnimation);
        tourAnimation = null;
        $("#animateTour").button("option", "disabled", false);
        $("#animateTourStop").button("option", "disabled", true);
        return;
    };

    this.animateMoveStep = function(node,c,newc,step, aid){
        var STEPS = 100;
        var coord = c;
        var dir = {x: newc.x-coord.x, y: newc.y-coord.y};
        node.setCoordinates({x: coord.x + (step/STEPS*dir.x), y: coord.y + (step/STEPS*dir.y)});
        algo.needRedraw = true;
        if(step >= STEPS){
            window.clearInterval(aid);
        }
    };
    this.animateMove = function(node,newc) {
        var step = 0;
        var an = 0;
        var c = node.getCoordinates();
        an = window.setInterval(function() {algo.animateMoveStep(node, c, newc, step++, an); }, 5);
    };

    /**
     * Ermittelt basierend auf der StatusID und anderen den vorherigen Schritt aus
     * und ruft die entsprechende Funktion auf.
     * @method
     */
    this.previousStepChoice = function() {
        this.replayStep();
        if(history.length == 0){
            $("#ta_button_Zurueck").button("option", "disabled", true);
        }
        else{
            $("#ta_button_1Schritt").button("option", "disabled", false);
            $("#ta_button_vorspulen").button("option", "disabled", false);
        }
        this.needRedraw = true;
    };

    this.addReplayStep = function() {
        var nodeProperties = {};
        for(var key in graph.nodes) {
            nodeProperties[graph.nodes[key].getNodeID()] = {layout: JSON.stringify(graph.nodes[key].getLayout()), label: graph.nodes[key].getLabel(), coordiantes: graph.nodes[key].getCoordinates()};
        }
        var edgeProperties = {}
        for(var key in graph.edges) {
            edgeProperties[graph.edges[key].getEdgeID()] = {layout: JSON.stringify(graph.edges[key].getLayout()), label: graph.edges[key].getAdditionalLabel()};
        }
        history.push({
            "previousStatusId": statusID,
            "nodeProperties": nodeProperties,
            "edgeProperties": edgeProperties,
            "phase": phase,
            "graph": this.graph,
            "htmlSidebar": $(statusErklaerung).html()
        });
        //console.log("Current History Step: ", history[history.length-1]);
    };

    this.replayStep = function() {
        if(history.length > 0){
            var oldState = history.pop();
            //remove new edges from the graph
            statusID = oldState.previousStatusId;
            phase = oldState.phase;
            this.graph = oldState.graph;
            $(statusErklaerung).html(oldState.htmlSidebar);
            for(var key in oldState.nodeProperties) {
                if(graph.nodes[key]){
                    graph.nodes[key].setLayoutObject(JSON.parse(oldState.nodeProperties[key].layout));
                    graph.nodes[key].setLabel(oldState.nodeProperties[key].label);
                    graph.nodes[key].setCoordinates(oldState.nodeProperties[key].coordiantes);
                }
            }
            for(var key in oldState.edgeProperties) {
                if(graph.edges[key]){
                    graph.edges[key].setLayoutObject(JSON.parse(oldState.edgeProperties[key].layout));
                    graph.edges[key].setAdditionalLabel(oldState.edgeProperties[key].label);
                }
            }
            if(statusID == INIT_TOUR){
                for(var m in matching){
                    var e = matching[m].edge.getEdgeID();
                    if(graph.edges[e]) graph.removeEdge(e);
                }
            }
            if(statusID == MATCHING){
                for(var e in matching_graph.edges){
                    matching_graph.removeEdge(e);
                }
                for(var s in supplyNodes){
                    for(var d in demandNodes){
                        matching_graph.addEdge(matching_graph.nodes[id_map[s]],matching_graph.nodes[id_map[d]],distance[supplyNodes[s].getNodeID()][demandNodes[d].getNodeID()],false);
                    }
                }
            }
            if(statusID == ADD_PATHS){
                clearInterval(animationId);
                for(var e in graph.edges){
                    if(graph.edges[e].getLayout().dashed){
                        graph.removeEdge(e);
                    }
                }
                for(var m in matching){//remove matching edges
                    var e = matching[m].edge.getEdgeID();
                    if(graph.edges[e]) graph.removeEdge(e);
                }
                //insert matching edges
                for(var p in matching){
                    var e = graph.addEdge(graph.nodes[matching[p].s],graph.nodes[matching[p].d],distance[matching[p].s][matching[p].d],false);
                    setEdgeMatched(e);
                    matching[p].edge = e;
                }
            }
            if(statusID == SHOW_TOUR){
                clearInterval(animationId);

            }
        }
    };
}

// Vererbung realisieren
algorithm.prototype = new CanvasDrawer;
algorithm.prototype.constructor = algorithm;