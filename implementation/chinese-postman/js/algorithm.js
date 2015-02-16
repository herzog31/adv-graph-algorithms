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
     * Knoten, von dem aus alle Entfernungen berechnet werden.
     * @type GraphNode
     */
    var startNode = null;
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
     * Assoziatives Array mit den Abstandswerten aller Knoten<br>
     * Keys: KnotenIDs Value: Abstandswert
     * @type Object
     */
    var distance = new Object();
    /**
     * Assoziatives Array mit den Vorgängerkanten aller Knoten<br>
     * Keys: KnotenIDs Value: KantenID
     * @type Object
     */
    var predecessor = new Object();
    /**
     * Zählt die Phasen / Runden.
     * @type Number
     */
    var phase = 0;
/*    *//**
     * Zeigt an, ob die Vorgängerkanten markiert werden sollen oder nicht.
     * @type Boolean
     *//*
    var showVorgaenger = true;*/

    //var strongly_connected = true;

    var start_node = null;

    var delta = new Object();

    var excess = 0;

    var demandNodes = new Array();

    var supplyNodes = new Array();

    var paths = new Object();

    var current = 0;

    var new_edges = new Array();

    var euler_tour = new Array();

    var feasible = true;
    /**
     * Gibt an, ob der Algorithmus am Ende ist.
     * @type Boolean
     */
    var end = false;
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
    var ADD_PATH = 11;
    //var ADD_NEW_EDGES = 4;
    var START_TOUR = 6;
    var NEXT_EDGE = 5;
    var END_TOUR = 13;
    var END = 10;

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
        canvas.on("click.algorithm", function (e) {
            algo.canvasClickHandler(e);
        });
        $("#ta_button_1Schritt").on("click.algorithm", function () {
            algo.singleStepHandler();
        });
        $("#ta_button_vorspulen").on("click.algorithm", function () {
            algo.fastForwardAlgorithm();
        });
        $("#ta_button_stoppVorspulen").on("click.algorithm", function () {
            algo.stopFastForward();
        });
        $("#ta_tr_LegendeClickable").on("click.algorithm", function () {
            algo.changeVorgaengerVisualization();
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
     * Wird aufgerufen, sobald auf das Canvas geklickt wird.
     * @param {jQuery.Event} e jQuery Event Objekt, gibt Koordinaten
     */
    this.canvasClickHandler = function (e) {
        if (startNode == null) {
            var mx = e.pageX - canvas.offset().left;
            var my = e.pageY - canvas.offset().top;
            for (var knotenID in graph.nodes) {
                if (graph.nodes[knotenID].contains(mx, my)) {
                    graph.nodes[knotenID].setLayout("fillStyle", const_Colors.NodeFillingHighlight);
                    graph.nodes[knotenID].setLabel("S");
                    startNode = graph.nodes[knotenID];
                    this.needRedraw = true;
                    $("#ta_div_statusErklaerung").removeClass("ui-state-error");
                    $("#ta_div_statusErklaerung").html("<h3>" + LNG.K('textdb_msg_case5_1') + "</h3>");
                    $("#ta_button_1Schritt").button("option", "disabled", false);
                    $("#ta_button_vorspulen").button("option", "disabled", false);
                    statusID = 0;
                    break;                   // Maximal einen Knoten auswählen
                }
            }
        }
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
            case ADD_PATH:
                this.addPath();
                break;
            case START_TOUR:
                this.startTour();
                break;
            case NEXT_EDGE:
                this.nextEdge();
                break;
            case END_TOUR:
                this.endTour();
                break;
            case END:
                this.endAlgorithm();
                break;
            default:
                //console.log("Fehlerhafte StatusID.");
                break;
        }
        this.needRedraw = true;
    };
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
        feasible = strongly_connected && !negative_cycle;
        $("#ta_div_statusErklaerung").html("<h3>1. " + LNG.K('textdb_feasibility') + "</h3>");
        if (feasible) {
            statusID = SHOW_UNBALANCED_NODES;
            $("#ta_div_statusErklaerung").append(
                "<p>" + LNG.K('textdb_feasible_1') + "</p>"
                + "<p>" + LNG.K('textdb_feasible_2') + "</p>"
                + "<p>" + LNG.K('textdb_feasible') + "</p>");
            //$(".marked").removeClass("marked");
        }
        else{
            statusID = END;
            if(!strongly_connected) $("#ta_div_statusErklaerung").append("<p>" + LNG.K('textdb_infeasible_1') + "</p>");
            if(negative_cycle) $("#ta_div_statusErklaerung").append("<p>" + LNG.K('textdb_infeasible_2') + "</p>");
            $("#ta_div_statusErklaerung").append("<p>" + LNG.K('textdb_infeasible') + "</p>");
            //$(".marked").removeClass("marked");
        }
    };

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
        paths = [];
        for(var i = 0;i< match.length; i++){
            paths.push({s:uid_map[i],d:vid_map[match[i]]});
        }
    };

    this.computeEulerTour = function() {

        // Check node degrees
/*        for(var knotenID in graph.nodes) {
            var inDegree = graph.nodes[knotenID].getInEdges().length;
            var outDegree = graph.nodes[knotenID].getOutEdges().length;
            if(inDegree !== outDegree || inDegree < 1 || outDegree < 1)
                return
        }*/

        // Starting node
        var start = start_node;
        // Current node
        var current = start;
        // Current subtour
        var subtour = [];
        // Complete tour
        var tour = [];
        // IDs of visited edges
        var visitedEdges = [];
        // Number of edges in graph
        var numberOfEdgesInGraph = Object.keys(graph.edges).length;
        // number of edges in tour
        var numberOfEdgesInTour = 0;

        // As long as tour not eulerian
        while(numberOfEdgesInTour < numberOfEdgesInGraph) {
            // Add start to subtour
            subtour.push({type: "vertex", id: start.getNodeID()});
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
                if(node.type == "vertex"){
                    // Get out edges
                    var outEdges = graph.nodes[node.id].getOutEdges();
                    var found = false;
                    // Find unvisited out edge
                    for(var kantenID in outEdges) {
                        if(visitedEdges.indexOf(kantenID) === -1) {
                            start = graph.nodes[node.id];
                            found = true;
                            break;
                        }
                    }
                    if(found) break;
                }
            }
        }

        euler_tour = [];

        for(var i = 0; i < tour.length; i++) {
            if(tour[i].type === "edge") {
                euler_tour.push(tour[i].id);
            }
        }

    };

    this.findUnbalancedNodes = function () {
        for (var n in graph.nodes){
            var node = graph.nodes[n];
            var d = Object.keys(node.getOutEdges()).length - Object.keys(node.getInEdges()).length;
            delta[node.getNodeID()] = d;
            if(d < 0) supplyNodes.push(node);
            else if(d > 0) {
                demandNodes.push(node);
                excess+=d;
            }
        }
    };

    this.showUnbalancedNodes = function () {
        this.findUnbalancedNodes();
        if(excess == 0){
            statusID = START_TOUR;
            // Erklärung im Statusfenster
            $("#ta_div_statusErklaerung").html("<h3>2. " + LNG.K('textdb_find_balanced_nodes') + "</h3>"
            + "<p>" + LNG.K('textdb_balanced_1') + "</p>"
            + "<p>" + LNG.K('textdb_balanced_2') + "</p>");
        }
        else{
            for (var n in supplyNodes) {
                var node = supplyNodes[n];
                highlightSupply(node);
            }
            for (var n in demandNodes) {
                var node = demandNodes[n];
                highlightDemand(node);
            }
            statusID = SHORTEST_PATHS;
            // Erklärung im Statusfenster
            $("#ta_div_statusErklaerung").html("<h3>2. " + LNG.K('textdb_find_balanced_nodes') + "</h3>"
            + "<p>" + LNG.K('textdb_unbalanced_1') + "</p>"
            + "<p>" + LNG.K('textdb_unbalanced_2') + "</p>"
            + "<p>" + LNG.K('textdb_unbalanced_3') + "</p>");
        }
    };

    var highlightSupply = function(node){
        node.setLayout('fillStyle', 'green');
    };
    var highlightDemand = function(node){
      node.setLayout('fillStyle', 'royalblue');
    };

    var hideEdge = function(edge) {
        edge.setLayout("lineWidth", global_Edgelayout.lineWidth * 0.3);
    };
    var hideNode = function(node){
        node.setLayout('fillStyle',"DarkGray");
        node.setLayout('borderWidth',global_NodeLayout.borderWidth);
        node.setLayout('borderColor',"Gray");
    };

    this.showShortestPaths = function () {
        this.findMatching();
        for (var e in graph.edges) {
            hideEdge(graph.edges[e]);
        }
        for (var i in paths) {
            var s = paths[i].s;
            var last = paths[i].d;
            while (last != s) {
                var e = predecessor[s][last];
                e.restoreLayout();
                last = e.getSourceID();
            }
        }
        statusID = ADD_PATH;
        // Erklärung im Statusfenster
        $("#ta_div_statusErklaerung").html("<h3>3. " + LNG.K('textdb_paths') + "</h3>"
        + "<p>" + LNG.K('textdb_paths_1') + "</p>"
        + "<p>" + LNG.K('textdb_paths_2') + "</p>");
    };

    this.addPath = function(){
        var s = paths[current].s;
        var d = paths[current].d;
        var last = d;
        var edges_on_path = [];
        while(last != s){
            var e = predecessor[s][last];
            var node1 = graph.nodes[e.getSourceID()];
            var node2 = graph.nodes[last];
            var ne = graph.addEdge(node1,node2, e.weight);
            edges_on_path.push(ne);
            last = e.getSourceID();
        }
        //highlight the path
        var cost = 0;
        for(var e in edges_on_path){
            edges_on_path[e].setLayout('lineColor','blue');//highlight path
            cost += e.weight;
        }
        //unhighlight previous path
        if(new_edges.length > 0){
            for(var i in new_edges[new_edges.length-1]){
                var edge = new_edges[new_edges.length-1][i];
                edge.setLayout('lineColor','black');
            }
        }
        new_edges.push(edges_on_path);
        current++;
        statusID = ADD_PATH;
        // Erklärung im Statusfenster
        $("#ta_div_statusErklaerung").html("<h3>3. " + LNG.K('textdb_paths') + "</h3>"
        + "<p>" + LNG.K('textdb_add_path') + "</p>"
        + "<p>" + LNG.K('textdb_add_path_1') + "</p>"
        + "<p>" + LNG.K('textdb_add_path_2') + "</p>"
        + "<p>" + LNG.K('textdb_add_path_cost') + cost + "</p>");
        if(current >= paths.length){
            statusID = START_TOUR;
            // Erklärung im Statusfenster
            $("#ta_div_statusErklaerung").append(
            //+ "<p>" + LNG.K('textdb_add_path_3') + "</p>" +
            "<p>" + LNG.K('textdb_balanced_1') + "</p>");
        }
    };

    this.startTour = function () {
        //find start node
        for(n in graph.nodes){
            start_node = graph.nodes[n];
            break;
        }
        //compute the euler tour
        this.computeEulerTour();
        for (var e in graph.edges) {
            graph.edges[e].restoreLayout();
        }
        for (var n in graph.nodes) {
            graph.nodes[n].restoreLayout();
        }
        current = 0;
        statusID = NEXT_EDGE;
        // Erklärung im Statusfenster
        $("#ta_div_statusErklaerung").html("<h3>4. " + LNG.K('textdb_tour') + "</h3>"
        + "<p>" + LNG.K('textdb_start_tour_1') + "</p>"
        + "<p>" + LNG.K('textdb_start_tour_2') + "</p>"
        + "<p>" + LNG.K('textdb_start_tour_3') + "</p>");
    };

    this.nextEdge = function(){
        var edge = graph.edges[euler_tour[current]];
/*        if(current > 0){
            var prev = graph.edges[euler_tour[current-1]];
            prev.restoreLayout();
        }*/
        //edge.setLayout('isHighlighted',true);
        edge.setLayout('lineColor','blue');
        current++;
        statusID = NEXT_EDGE;
        // Erklärung im Statusfenster
        $("#ta_div_statusErklaerung").html("<h3>4. " + LNG.K('textdb_tour') + "</h3>"
        + "<p>" + LNG.K('textdb_next_edge') + "</p>");
        if(current >= euler_tour.length){
            statusID = END_TOUR;
            // Erklärung im Statusfenster
            $("#ta_div_statusErklaerung").append(
                "<p>" + LNG.K('textdb_end_tour_1') + "</p>"
                + "<p>" + LNG.K('textdb_end_tour_2') + "</p>");
        }
    };

    this.endTour = function(){
        var cost = 0;
        for (var e in graph.edges) {
            graph.edges[e].restoreLayout();
            cost += graph.edges[e].weight;
        }
        statusID = END;
        // Erklärung im Statusfenster
        $("#ta_div_statusErklaerung").html("<h3>4. " + LNG.K('textdb_tour') + "</h3>"
            + "<p>" + LNG.K('textdb_end_success') + "</p>"
            + "<p>" + LNG.K('textdb_cost') + cost + "</p>");
    };
    /**
     * Zeigt Texte und Buttons zum Ende des Algorithmus
     * @method
     */
    this.endAlgorithm = function () {
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
        end = true;
        $("#ta_button_1Schritt").button("option", "disabled", true);
        $("#ta_button_vorspulen").button("option", "disabled", true);
    };

    /**
     * Ermittelt basierend auf der StatusID und anderen den vorherigen Schritt aus
     * und ruft die entsprechende Funktion auf.
     * @method
     */
    this.previousStepChoice = function() {
        this.replayStep();
        this.needRedraw = true;
    };


    this.addReplayStep = function() {
        var nodeProperties = {};
        for(var key in graph.nodes) {
            nodeProperties[graph.nodes[key].getNodeID()] = {edge: JSON.stringify(graph.nodes[key].getLayout())};
        }
        var edgeProperties = {};
        for(var key in graph.edges) {
            edgeProperties[graph.edges[key].getEdgeID()] = {edge: JSON.stringify(graph.edges[key].getLayout())};
        }
        history.push({
            "previousStatusId": statusID,
            "nodeProperties": nodeProperties,
            "edgeProperties": edgeProperties,
            "phase": phase,
            "current": current,
            //"graph": $.extend(true,{},graph),
            "htmlSidebar": $(statusErklaerung).html()
        });
        //console.log("Current History Step: ", history[history.length-1]);
    };

    this.replayStep = function() {
        if(history.length > 0){
            var oldState = history.pop();
            statusID = oldState.previousStatusId;
            phase = oldState.phase;
            current = oldState.current;
            $(statusErklaerung).html(oldState.htmlSidebar);
            //graph = oldState.graph;
            for(var key in oldState.nodeProperties) {
                graph.nodes[key].setLayoutObject(JSON.parse(oldState.nodeProperties[key].edge));
                //graph.nodes[key].setLabel(oldState.nodeProperties[key].label);
            }
            for(var key in oldState.edgeProperties) {
                graph.edges[key].setLayoutObject(JSON.parse(oldState.edgeProperties[key].edge));
                //graph.edges[key].setAdditionalLabel(oldState.edgeProperties[key].label);
            }
            //remove new edges from the graph
            if(statusID == ADD_PATH){
                var edges = new_edges.pop();
                for(var e in edges){
                    graph.removeEdge(edges[e].getEdgeID());
                }
            }
        }
        if(history.length == 0){
            $("#ta_button_Zurueck").button("option", "disabled", true);
        }
        if(end){
            end = false;
            $("#ta_button_1Schritt").button("option", "disabled", false);
            $("#ta_button_vorspulen").button("option", "disabled", false);
        }
    };

    /**
     * Blendet die Vorgängerkanten ein und aus.
     * @method
     */
    this.changeVorgaengerVisualization = function () {
        showVorgaenger = !showVorgaenger;
        for (var knotenID in predecessor) {
            if (predecessor[knotenID] != null) {
                graph.edges[predecessor[knotenID]].setHighlighted(showVorgaenger);
            }
        }
        $("#ta_tr_LegendeClickable").toggleClass("greyedOutBackground");
        this.needRedraw = true;
    };



}

// Vererbung realisieren
algorithm.prototype = new CanvasDrawer;
algorithm.prototype.constructor = algorithm;