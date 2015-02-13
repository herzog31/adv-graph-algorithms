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
    /**
     * Ein Array der KantenIDs, damit man die Kanten linear ablaufen kann
     * @type Number[]
     */
    var kantenIDs = Utilities.arrayOfKeys(graph.edges);
    /**
     * Die Kante, die wir als nächstes betrachten werden, als Key für das
     * Array kantenIDs.
     * @type Number
     */
    var nextKantenID = null;

    /**
     * Zeigt an, ob die Vorgängerkanten markiert werden sollen oder nicht.
     * @type Boolean
     */
    var showVorgaenger = true;

    var strongly_connected = true;

    var delta = new Object();

    var demandNodes = new Array();

    var supplyNodes = new Array();

    var paths = new Object();

    var new_edges = new Object();

    var euler_tour = new Array();

    var SHOW_UNBALANCED_NODES = 3;
    var INFEASIBLE = 10;


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
        $("#ta_button_vorspulen").button({icons: {primary: "ui-icon-seek-next"}, disabled: true});
        $("#ta_button_stoppVorspulen").button({icons: {primary: "ui-icon-pause"}});
        $("#ta_div_statusTabs").tabs();
        $(".marked").removeClass("marked");
        $("#ta_p_begin").addClass("marked");
        $("#ta_tr_LegendeClickable").removeClass("greyedOutBackground");
        this.registerEventHandlers();
        this.needRedraw = true;
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
        if (startNode != null) {
            this.nextStepChoice();
        }
    };

    /**
     * "Spult vor", führt den Algorithmus mit hoher Geschwindigkeit aus.
     * @method
     */
    this.fastForwardAlgorithm = function () {
        if (startNode == null) {
            // Auf Startknotenwahl hinweisen
            $("#ta_div_statusErklaerung").addClass("ui-state-error");
        }
        else {
            $("#ta_button_vorspulen").hide();
            $("#ta_button_stoppVorspulen").show();
            $("#ta_button_1Schritt").button("option", "disabled", true);
            $("#ta_button_Zurueck").button("option", "disabled", true);
            var geschwindigkeit = 200;	// Geschwindigkeit, mit der der Algorithmus ausgeführt wird in Millisekunden

            fastForwardIntervalID = window.setInterval(function () {
                algo.nextStepChoice();
            }, geschwindigkeit);
        }
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
        switch (statusID) {
            case 0:
                this.initializeAlgorithm();
                break;
            case 1:
                this.updateWeightsInitialisation();
                break;
            case SHOW_UNBALANCED_NODES:
                this.showUnbalancedNodes();
                break;
            case 3:
                this.updateSingleNode();
                break;
            case 4:
                this.checkNextEdgeForNegativeCycle();
                break;
            case 5:
                this.backtrackNegativeCycle();
                break;
            case 6:
                this.showNoNegativeCycle();
                break;
            default:
                //console.log("Fehlerhafte StatusID.");
                break;
        }
        this.needRedraw = true;
    };

    /**
     * Initialisiere den Algorithmus
     */
    this.initializeAlgorithm = function () {
        if(this.isFeasible()){
            this.findUnbalancedNodes();
            this.findShortestPaths();
            this.findMatching();
            this.addNewEdges();
            this.computeEulerTour();
            statusID = SHOW_UNBALANCED_NODES;
            // Erklärung im Statusfenster
            $("#ta_div_statusErklaerung").html("<h3>1 " + LNG.K('textdb_msg_case0_1') + "</h3>"
            + "<p>" + LNG.K('textdb_msg_case0_2') + "</p>"
            + "<p>" + LNG.K('textdb_msg_case0_3') + "</p>"
            + "<p>" + LNG.K('textdb_msg_case0_4') + "</p>");
            $(".marked").removeClass("marked");
        }
        else{
            statusID = INFEASIBLE;
            // Erklärung im Statusfenster
            $("#ta_div_statusErklaerung").html("<h3>1 " + LNG.K('textdb_msg_case0_1') + "</h3>"
            + "<p>" + LNG.K('textdb_msg_case0_2') + "</p>"
            + "<p>" + LNG.K('textdb_msg_case0_3') + "</p>"
            + "<p>" + LNG.K('textdb_msg_case0_4') + "</p>");
            $(".marked").removeClass("marked");
        }
    };

    this.isFeasible = function() {

        // check from every node
        for (var startNode in graph.nodes) {
            var reachableVertices = [];
            var visitedEdges = [];
            var queue = [parseInt(startNode)];

            while(queue.length > 0) {
                var currentNode = parseInt(queue.shift());
                // add current node to reachable vertices if not yet in
                if(reachableVertices.indexOf(currentNode) === -1) reachableVertices.push(currentNode);

                // check every neighbor
                var outEdges = graph.nodes[currentNode].getOutEdges();
                for(var kantenID in outEdges) {
                    // skip already used edges
                    if (visitedEdges.indexOf(kantenID) !== -1) continue;
                    // add unvisited neighbors to queue
                    if(reachableVertices.indexOf(graph.edges[kantenID].getTargetID()) === -1) queue.push(graph.edges[kantenID].getTargetID());
                    // set edge to visited
                    visitedEdges.push(kantenID);
                }

            }

            // return false if not all nodes can be reached
            if(Object.keys(graph.nodes).length !== reachableVertices.length) {
                return false;
            }

        }

        return true;

    };



    this.findUnbalancedNodes = function () {
        for (var n in graph.nodes){
            var node = graph.nodes[n];
            var d = Object.keys(node.getOutEdges()).length - Object.keys(node.getInEdges()).length;
            delta[node.getNodeID()] = d;
            if(d < 0) supplyNodes.push(node);
            else if(d > 0) demandNodes.push(node);
        }
    };

    this.findShortestPaths = function(){
        //TODO
        /*
        * hier uebergebe ich den Graphen an die floyd-warshall-methode
        * ich brauche die abstandswerte und die vorgaengermatrix
        * falls moeglich brauche ich die benutzten Kanten in der Vorgaengermatrix
        * d = distance[nodeId1][nodeId2] soll diese form haben
        * edge = predecessor[nodeId1][nodeId2]
        * floydWarshall(graph,distance,predecessor);
        * */
        distance = {};
        predecessor = {};

        for(var n1 in graph.nodes){
            var nodeId = graph.nodes[n1].getNodeID();
            distance[nodeId] = new Object();
            for(var n2 in graph.nodes){
                var tmpId = graph.nodes[n2].getNodeID();
                if(n1 == n2) distance[nodeId][tmpId] = 0;
                else distance[nodeId][tmpId] = Math.random()*30;
            }
        }
    };

    this.findMatching = function(){
        //construct matching graph
        var mg = new BipartiteGraph();
        var unodes = {};
        var vnodes = {};
        var id_map = {};
        //insert supply nodes
        for(var node in supplyNodes){
            var id = node.getNodeID();
            for (var i=0;i<-delta[id];i++){
                var tmp = mg.addNode(true);
                id_map[tmp.getNodeID()] = id;
                unodes[tmp.getNodeID()]=tmp;
            }
        }
        //insert demand nodes
        for(var node in demandNodes){
            var id = node.getNodeID();
            for (var i=0;i<delta[id];i++){
                var tmp = mg.addNode(false);
                id_map[tmp.getNodeID()] = id;
                vnodes[tmp.getNodeID()]=tmp;
            }
        }
        //insert edges
        for(var n1 in unodes){
            for(var n2 in vnodes){
                var id1 = id_map[n1.getNodeID()];
                var id2 = id_map[n2.getNodeID()];
                var dist = distance[id1][id2];
                mg.addEdge(n1,n2,-dist);
            }
        }
        //TODO
        /*
        * hier uebergebe ich den Graphen mg an die ungarische Methode
        * als rueckgabewert erwarte ich eine Menge von Kanten
        * var edges = ungarisch(mg);
        * */
        var edges = {};

        //find the original nodes and paths of the matching
        paths = {};
        for(var v in supplyNodes){
            paths[v] = [];
        }
        for(var e in edges){
            var edge = edges[e];
            var s = id_map[edge.getSourceID()];
            var t = id_map[edge.getTargetID()];
            if(delta[s]>0) {
                paths[s].push(t);
            }
            else paths[t].push(s);
        }
    };

    this.addNewEdges = function(){
        for(var s in paths){
            for(var t in paths[s]){
                var last = t;
                while(last != s){
                    var e = predecessor[s][last];
                    var node1 = graph.nodes[e.getSourceID()];
                    var node2 = graph.nodes[last];
                    var ne = graph.addEdge(node1,node2, e.weight);
                    new_edges[ne.getEdgeID()] = ne;
                    last = e.getSourceID();
                }
            }
        }
    };

    this.computeEulerTour = function() {

        // Check node degrees
        for(var knotenID in graph.nodes) {
            var inDegree = graph.nodes[knotenID].getInEdges().length;
            var outDegree = graph.nodes[knotenID].getOutEdges().length;
            if(inDegree !== outDegree || inDegree < 1 || outDegree < 1)
                return
        }

        // Starting node
        var start = graph.nodes[0];
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

        // Add start to subtour
        subtour.push({type: "vertex", id: start.getNodeID()});

        // As long as tour not eulerian
        while(numberOfEdgesInTour < numberOfEdgesInGraph) {

            // While start != current, except first iteration
            do {
                // Get out edges
                var outEdges = current.getOutEdges();
                var nextEdge = null;

                // Find unvisited out edge
                for(var kantenID in outEdges) {
                    if(visitedEdges.indexOf() !== -1) {
                        nextEdge = outEdges[kantenID];
                        visitedEdges.push(kantenID);
                        subtour.push({type: "edge", id: kantenID});
                    }
                }

                if(nextEdge === null) {
                    return
                }

                // Get other Vertex which is new current
                current = graph.edges[nextEdge].getTargetID();
                subtour.push({type: "vertex", id: current.getNodeID()});

            } while(start.getNodeID() === current.getNodeID());

            // Merge
            // If tour is empty, just replace with subtour
            if(tour.length === 0) {
                tour = subtour;
            }else{
                // Start node of subtour
                var startOfSubTour = subtour[0];
                var newTour = new Array();

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

            subtour = []

            // Count number of edges in tour
            numberOfEdgesInTour = 0;
            for(var i = 0; i < tour.length; i++) {
                if(tour[i].type === "edge") {
                    numberOfEdgesInTour++;
                }
            }
        }

        euler_tour = [];

        for(var i = 0; i < euclideanTour.length; i++) {
            if(euclideanTour[i].type === "edge") {
                euler_tour.push(euclideanTour[i].id);
            }
        }
    };


    this.showUnbalancedNodes = function () {
        for (var n in supplyNodes) {
            var node = supplyNodes[n];
            node.setLayout();
        }
        for (var n in demandNodes) {
            var node = demandNodes[n];
            node.setLayout();
        }
        // Erklärung im Statusfenster
        $("#ta_div_statusErklaerung").html("<h3>1 " + LNG.K('textdb_unbalanced_0') + "</h3>"
        + "<p>" + LNG.K('textdb_msg_case0_2') + "</p>"
        + "<p>" + LNG.K('textdb_msg_case0_3') + "</p>"
        + "<p>" + LNG.K('textdb_msg_case0_4') + "</p>");
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
        this.showVariableStatusField(null, null);
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