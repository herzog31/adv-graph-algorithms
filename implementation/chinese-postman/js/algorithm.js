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
    /**
     * Gibt an ob das Problem loesbar ist
     * @type Boolean
     */
    var feasible = null;
    /**
     * Die Differenzen der Ausgangs- und Eingagnsgrade aller Knoten
     * Keys: KnotenIDs Value: Differenz
     * @type {Object}
     */
    var delta = new Object();
    /**
     * Die Anzahl der zusaetzlichen Wege, die eingefuegt werden muessen
     * @type {number}
     */
    var excess = 0;
    /**
     * Knoten mit positiver delta
     * Keys: KnotenIDs Value: Knoten
     * @type {Object}
     */
    var demandNodes = new Object();
    /**
     * Knoten mit negativer delta
     * Keys: KnotenIDs Value: Knoten
     * @type {Object}
     */
    var supplyNodes = new Object();
    /**
     * Array mit Objekten der Form:<br>
     * s: Startknoten, d: Zielknoten, edge: Matching-Kante, path: der zugehoerige Pfad
     * @type Array
     */
    var matching = [];
    /**
     * Der Matching-Graph, der im Laufe des Algorithmen erstellt wird
     * @type {Object}
     */
    var matching_graph = null;
    /**
     * Mapping von Knoten im normalen Graph zu ihren repraesentativen Knoten im Matchinggraph
     * @type {Object}
     */
    var id_map = {};
    /**
     * Der naechste Weg, der eingefuegt werden soll
     * @type {number}
     */
    var next = 0;
    /**
     * Die guenstigsten Kosten des Rundgangs
     * @type {number}
     */
    var cost = 0;
    /**
     * Die berechnete Eulertour.
     * @type {Array}
     */
    var tour = new Array();
    /**
     * Die berechneten Subtouren.
     * @type {Array}
     */
    var subtours = new Array();
    /**
     * Die Farben der Kanten
     * @type {Object}
     */
    var color = {};
    /**
     * Menge von Farben, die als Subtourfarben verwendet werden
     * @type {Array}
     */
    var tourColors = new Array("#0000cc", "#006600", "#990000", "#999900", "#cc6600", "#660099", "#330000");
    /**
     * Wird bei einer Animation benoetigt
     * @type {number}
     */
    var tourAnimationIndex = 0;
    /**
     * Wird bei einer Animation benoetigt
     * @type {number}
     */
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
    /**
     * Zeigt an, ob vor dem Verlassen des Tabs gewarnt werden soll.
     * @type Boolean
     */
    var warnBeforeLeave = true;
    
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
    const INFEASIBLE = 17;

    /*
     * Entferne alle Knoten, die zu keiner Kante inzident sind.
     * @method
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
        clearInterval(animationId);//beende animation
        this.deleteInsertedEdges();
        this.stopFastForward();
        this.destroyCanvasDrawer();
        this.deregisterEventHandlers();
        //legende wiederherstellen
        $("#tab_"+st).find(".LegendeText").html('<table>\
            <tr><td class="LegendeTabelle"><img src="img/knoten.png" alt="Knoten" class="LegendeIcon" ></td><td><span>'+LNG.K('algorithm_legende_knoten')+'</span></td></tr>\
            <tr><td class="LegendeTabelle"><img src="img/kante.png" alt="Kante" class="LegendeIcon" ></td><td><span>'+LNG.K('algorithm_legende_kante')+'</span></td></tr>\
        </table>');
    };
    /**
     * Alle in den Graphen neu eingefuegten Kanten werden geloescht.
     * @method
     */
    this.deleteInsertedEdges = function(){
        for (var e in graph.edges) {
            if (graph.edges[e].getLayout().dashed || !graph.edges[e].getDirected()) {
                graph.removeEdge(e);
            }
        }
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
     * Zeigt and, ob vor dem Verlassen des Tabs gewarnt werden soll.
     * @returns {Boolean}
     */
    this.getWarnBeforeLeave = function() {
        return warnBeforeLeave;
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
            case INFEASIBLE:
                this.appendEndButtons();
                break;
            default:
                //console.log("Fehlerhafte StatusID.");
                break;
        }
        this.needRedraw = true;
    };
    /**
     * Konstruiert den Matchinggraphen und berechnet das optimale Matching
     * @method
     */
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
     * Berechnet die Eulertour
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
     * @method
     */
    this.checkFeasibility = function () {
        if(!fastForwardIntervalID) $("#"+st+"_button_Zurueck").button({icons: {primary: "ui-icon-seek-start"}, disabled: false});
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
            statusID = INFEASIBLE;
            if (!strongly_connected) $("#"+st+"_div_statusErklaerung").append("<p>" + LNG.K('algorithm_infeasible_1') + "</p>");
            if (negative_cycle) $("#"+st+"_div_statusErklaerung").append("<p>" + LNG.K('algorithm_infeasible_2') + "</p>");
            $("#"+st+"_div_statusErklaerung").append("<p>" + LNG.K('algorithm_infeasible') + "</p>");
        }
        $(".marked").removeClass("marked");
        $("#"+st+"_p_feasible").addClass("marked");
    };
    /*
     * Findet nicht balancierte Knoten und hebt diese hervor.
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
            // Erklärung im Statusfenster und Legende
            $("#tab_"+st).find(".LegendeText").html('<table><tr>' +
                '<td class="LegendeTabelle"><img src="img/legende_positive.png" alt="Knoten" class="LegendeIcon" width="22" height="22"></td><td><span>'+LNG.K('algorithm_legende_positive')+'</span></td></tr><tr>' +
                '<td class="LegendeTabelle"><img src="img/legende_negative.png" alt="Knoten" class="LegendeIcon" width="22" height="22"></td><td><span>'+LNG.K('algorithm_legende_negative')+'</span></td></tr></table>');
            $("#"+st+"_div_statusErklaerung").append("<p>" + LNG.K('algorithm_unbalanced_1') + "</p>"
                + "<p>" + LNG.K('algorithm_unbalanced_2') + "</p>"
                 + "<p>" + LNG.K('algorithm_unbalanced_3') + "</p>");
        }
        $(".marked").removeClass("marked");
        $("#"+st+"_p_2").addClass("marked");
    };
    /**
     * Methoden fuer die Visualisierung. Das Aussehen wird hier bestimmt.
     */
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
    var hideNode = function (node) {
        node.setLayout('fillStyle', "DarkGray");
        node.setLayout('borderWidth', global_NodeLayout.borderWidth);
        node.setLayout('borderColor', "Gray");
    };
    /**
     * Die Positon des Labels einer Kante wird zufaellig bestimmt.
     * @param edge Kante
     */
    var randomizeLabelPosition = function (edge) {
        var rand = Math.random() * 0.6 + 0.2;
        edge.setLayout('labelPosition', rand);
    };
    /**
     * Der Matching-Graph wird erstellt und gezeigt.
     * Die Kanten im Matchinggraphen sind die Laengen der kuerzesten Pfade.
     * @method
     */
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
        $("#"+st+"_p_3").addClass("marked");
    };
    /**
     * Nur die Matchingkanten bleiben im Matchinggraphen.
     * @method
     */
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
        // Erklärung im Statusfenster und Legende
        $("#tab_"+st).find(".LegendeText").html('<table>\
            <tr><td class="LegendeTabelle"><img src="img/legende_matching_kante.png" alt="Kante" class="LegendeIcon"></td><td><span>'+LNG.K('algorithm_legende_matching_kante')+'</span></td></tr>\
        </table>');
        $("#"+st+"_div_statusErklaerung").html("<h3>3. " + LNG.K('algorithm_paths') + "</h3>"
        + "<p>" + LNG.K('algorithm_matching_1') + "</p>"
        + "<p>" + LNG.K('algorithm_matching_2') + " <a href='"+LNG.K('algorithm_link_hungarian')+"' target='_blank'>"+LNG.K('algorithm_text_hungarian')+"</a>" + "</p>"
        + "<p>" + LNG.K('algorithm_matching_3') + "</p>");
        $(".marked").removeClass("marked");
        $("#"+st+"_p_3").addClass("marked");
    };
    /**
     * Es wird zurueck zum normalen Graphen gewechselt.
     * @method
     */
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
        // Erklärung im Statusfenster und Legende
        $("#tab_"+st).find(".LegendeText").html('<table>\
            <tr><td class="LegendeTabelle"><img src="img/legende_matching_kante.png" alt="Kante" class="LegendeIcon" ></td><td><span>'+LNG.K('algorithm_legende_matching_kante')+'</span></td></tr>\
            <tr><td class="LegendeTabelle"><img src="img/legende_neue_kante.png" alt="Kante" class="LegendeIcon" ></td><td><span>'+LNG.K('algorithm_legende_neue_kante')+'</span></td></tr>\
        </table>');
        $("#"+st+"_div_statusErklaerung").html("<h3>4. " + LNG.K('algorithm_new_paths') + "</h3>"
            + "<p>" + LNG.K('algorithm_new_paths_1') + "</p>"
            + "<p>" + LNG.K('algorithm_new_paths_2') + "</p>"
            + "<p>" + LNG.K('algorithm_new_paths_3') + "</p>");
        $(".marked").removeClass("marked");
        $("#"+st+"_p_4").addClass("marked");
    };
    /**
     * Falls die Animation nicht am Ende war, wird das Einfuegen eines Pfades beendet.
     * @param {number} path Weg im Graphen
     */
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
    /**
     * Das Einfuegen eines Pfades wird rueckgaengig gemacht.
     * @param path Weg
     */
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
     * Der naechste Pfad wird in den Graphen eingefuegt.
     * @method
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
        $("#"+st+"_p_4").addClass("marked");
    };


    /*
     * Den Knoten werden Labels zur Unterscheidung zugeordnet.
     * @method
     * */
    this.addNamingLabels = function () {
        var nodeCounter = 1;
        for (var knotenID in graph.nodes) {
            graph.nodes[knotenID].setLabel(String.fromCharCode("a".charCodeAt(0) + nodeCounter - 1));
            nodeCounter++;
        }
    };
    /*
     * Der eulersche Graph mit Knotenlabels wird angezeigt.
     * @method
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
        // Erklärung im Statusfenster und Legende
        $("#tab_"+st).find(".LegendeText").html('<table>\
            <tr><td class="LegendeTabelle"><img src="img/legende_neue_kante.png" alt="Kante" class="LegendeIcon" ></td><td><span>'+LNG.K('algorithm_legende_neue_kante')+'</span></td></tr>\
        </table>');
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
        $("#"+st+"_p_5").addClass("marked");
    };
    /*
     * Der eulersche Graph mit Knotenlabels wird angezeigt.
     * @method
     * */
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
        this.appendTours();
        statusID = END;
        $(".marked").removeClass("marked");
        $("#"+st+"_p_5").addClass("marked");
    };
    /*
     * Die Subtouren werden an die Erklaerung angehaengt.
     * @method
     * */
    this.appendTours = function () {
        //create output path and subpaths
        var output = "";
        for (var i = 0; i < tour.length; i++) {
            if (tour[i].type == "vertex") {
                output += graph.nodes[tour[i].id].getLabel();
            }
            if (tour[i].type == "edge") {
                //var layout = graph.edges[tour[i].id].getLayout();
                var c =  tourColors[color[tour[i].id]];
                output += ' <span style="color: ' + c + ';">&rarr;</span> ';
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
    /**
     * Hebe Subtour Fett hervor
     * @method
     * @param  {jQuery.Event} event Hover Event
     */
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
    /**
     * Macht die Hervorhebung rückgängig
     * @method
     * @param  {jQuery.Event} event Hover Event
     */
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

    /**
     * Führe Schritt in Eulertour Animation aus
     * State abhängig vom aktuellen Wer der tourAnimationIndex Variablen
     * @method
     * @param  {jQuery.Event} event
     */
    this.animateTourStep = function(event) {

        var currentEdge = Math.floor(tourAnimationIndex/30);
        var previousEdge = Math.floor((tourAnimationIndex - 1)/30);
        var currentArrowPosition = (tourAnimationIndex % 30) / 29;

        if(tourAnimationIndex >= (tour.length*30)) {
            this.animateTourStop(event);
            return;
        }

        if(tourAnimationIndex > 0 && tour[previousEdge].type === "edge") {
            graph.edges[tour[previousEdge].id].setLayout("progressArrow", false);
        }
        this.needRedraw = true;

        if(tour[currentEdge].type === "vertex") {
            tourAnimationIndex = tourAnimationIndex + 29;
        }

        if(tour[currentEdge].type === "edge") {
            graph.edges[tour[currentEdge].id].setLayout("progressArrow", true);
            graph.edges[tour[currentEdge].id].setLayout("lineColor", tourColors[color[tour[currentEdge].id]]);
            graph.edges[tour[currentEdge].id].setLayout("progressArrowPosition", currentArrowPosition);
        }
        this.needRedraw = true;
        tourAnimationIndex++;
    };
    /**
     * Starte Eulertour Animation
     * @method
     * @param  {jQuery.Event} event
     */
    this.animateTour = function (event) {
        $("#animateTour").button("option", "disabled", true);
        $("#animateTourStop").button("option", "disabled", false);
        tourAnimationIndex = 0;
        var self = event.data.org;
        animationId = window.setInterval(function () {
            self.animateTourStep(event);
        }, 1500.0/30);
    };
    /**
     * Stoppe Eulertour Animation
     * @method
     * @param  {jQuery.Event} event
     */
    this.animateTourStop = function(event) {
        var previousEdge = Math.floor((tourAnimationIndex - 1)/30);
        if(tourAnimationIndex > 0 && tour[previousEdge].type === "edge") {
            graph.edges[tour[previousEdge].id].setLayout("progressArrow", false);
        }
        event.data.org.needRedraw = true;
        tourAnimationIndex = 0;
        window.clearInterval(animationId);
        animationId = null;
        $("#animateTour").button("option", "disabled", false);
        $("#animateTourStop").button("option", "disabled", true);
    };
    /**
     * Zeigt Texte und Buttons zum Ende des Algorithmus
     * Faerbe die Kanten und entferne Subtouren
     * @method
     */
    this.endAlgorithm = function () {
        $( "#"+st+"_div_subtours" ).remove();
        for(var e in graph.edges){//faerbe die Kanten
            graph.edges[e].setLayout("lineColor", tourColors[color[e]]);
        }
        $("#"+st+"_div_statusErklaerung").append("<p><b>" + LNG.K('algorithm_cost_optimal') + cost + "</b></p>");
        $("#"+st+"_div_statusErklaerung").append("<br><h3>" + LNG.K('algorithm_msg_finish') + "</h3>");
        this.appendEndButtons();
    };
    /**
     * Zeige Buttons zum Ende des Algorithmus
     * @method
     */
    this.appendEndButtons = function(){
        $("#"+st+"_div_statusErklaerung").append("<button id="+st+"_button_gotoIdee>" + LNG.K('algorithm_btn_more') + "</button>");
        $("#"+st+"_div_statusErklaerung").append("<h3>" + LNG.K('algorithm_msg_test') + "</h3>");
        $("#"+st+"_div_statusErklaerung").append("<button id="+st+"_button_gotoFA1>" + LNG.K('algorithm_btn_exe1') + "</button>");
        $("#"+st+"_div_statusErklaerung").append("<button id="+st+"_button_gotoFA2>" + LNG.K('algorithm_btn_exe2') + "</button>");
        $("#"+st+"_button_gotoIdee").button();
        $("#"+st+"_button_gotoFA1").button();
        $("#"+st+"_button_gotoFA2").button();
        $("#"+st+"_button_gotoIdee").click(function () {
            $("#tabs").tabs("option", "active", 3);
        });
        $("#"+st+"_button_gotoFA1").click(function () {
            $("#tabs").tabs("option", "active", 4);
        });
        $("#"+st+"_button_gotoFA2").click(function () {
            $("#tabs").tabs("option", "active", 5);
        });
        // Falls wir im "Vorspulen" Modus waren, daktiviere diesen
        if (fastForwardIntervalID != null) {
            this.stopFastForward();
        }
        warnBeforeLeave = false;
        $(".marked").removeClass("marked");
        $("#"+st+"_p_end").addClass("marked");
        $("#"+st+"_button_1Schritt").button("option", "disabled", true);
        $("#"+st+"_button_vorspulen").button("option", "disabled", true);
    };
    /**
     * Schritt einer Animation, die den Knoten zu neuen Koordinaten transportiert.
     * @param node  Knoten
     * @param c     alte Koordinaten
     * @param newc  neue Koordinaten
     * @param step  aktuelle Schritt
     * @param aid   Animations-id
     */
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
    /**
     * Erzeugt eine Animation, die den Knoten zu neuen Koordinaten transportiert.
     * @param node Knoten
     * @param newc  neue Koordinaten
     */
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
    /**
     * Füge Schritt zum Replay Stack hinzu
     * @method
     */
    this.addReplayStep = function () {
        var nodeProperties = {};
        for (var key in graph.nodes) {
            nodeProperties[graph.nodes[key].getNodeID()] = {
                layout: JSON.stringify(graph.nodes[key].getLayout()),
                label: graph.nodes[key].getLabel()
            };
        }
        var edgeProperties = {}
        for (var key in graph.edges) {
            edgeProperties[graph.edges[key].getEdgeID()] = {
                layout: JSON.stringify(graph.edges[key].getLayout())
            };
        }
        history.push({
            "previousStatusId": statusID,
            "nodeProperties": nodeProperties,
            "edgeProperties": edgeProperties,
            "phase": phase,
            "next": next,
            "graph": this.graph,
            "warnBeforeLeave": warnBeforeLeave,
            "pseudocode": $("#"+st+"_div_statusPseudocode").html(),
            "legende": $("#tab_ta").find(".LegendeText").html(),
            "htmlSidebar": $("#"+st+"_div_statusErklaerung").html()
        });
    };
    /**
     * Stelle letzten Schritt auf dem Replay Stack wieder her
     * @method
     */
    this.replayStep = function () {
        if (history.length > 0) {
            var oldState = history.pop();
            statusID = oldState.previousStatusId;
            phase = oldState.phase;
            next = oldState.next;
            warnBeforeLeave = oldState.warnBeforeLeave;
            this.graph = oldState.graph;
            $("#"+st+"_div_statusErklaerung").html(oldState.htmlSidebar);
            $("#"+st+"_div_statusPseudocode").html(oldState.pseudocode);
            $("#tab_"+st).find(".LegendeText").html(oldState.legende);
            for (var key in oldState.nodeProperties) {
                if (graph.nodes[key]) {
                    graph.nodes[key].setLayoutObject(JSON.parse(oldState.nodeProperties[key].layout));
                    graph.nodes[key].setLabel(oldState.nodeProperties[key].label);
                }
            }
            for (var key in oldState.edgeProperties) {
                if (graph.edges[key]) {
                    graph.edges[key].setLayoutObject(JSON.parse(oldState.edgeProperties[key].layout));
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
    /**
     * Setzt das Ausgabefenster, wo Erklaerungen ausgegeben werden.
     * @param {String} fenster   Der Kontext des neuen Ausgabefensters
     * @method
     */
    this.setStatusWindow = function(fenster){
        st = fenster;
    };
    /**
     * Gibt die Distanzmatrix zurueck
     * @returns {Object}
     */
    this.getDistance = function(){
        return distance;
    };
    /**
     * Gibt das Matching zurueck
     * @returns {Object}
     */
    this.getMatching = function(){
        return matching;
    };
    /**
     * Gibt die Kosten des optimalen Rundgangs zurueck
     * @returns {number}
     */
    this.getCost = function(){
        return cost;
    };
    /**
     * Gibt aus, ob das Problem loesbar ist.
     * @returns {Boolean}
     */
    this.isFeasible = function(){
        return feasible;
    };

}

// Vererbung realisieren
algorithm.prototype = new CanvasDrawer;
algorithm.prototype.constructor = algorithm;