/**
 * @author Richard Stotz
 * Animation des Bellman-Ford-Algorithmus
 */

/**
 * Instanz des Bellmann-Ford Algorithmus, erweitert die Klasse CanvasDrawer
 * @constructor
 * @augments CanvasDrawer
 * @param {Graph} p_graph Graph, auf dem der Algorithmus ausgeführt wird
 * @param {Object} p_canvas jQuery Objekt des Canvas, in dem gezeichnet wird.
 * @param {Object} p_tab jQuery Objekt des aktuellen Tabs.
 */
function BFAlgorithm(p_graph,p_canvas,p_tab) {
    CanvasDrawer.call(this,p_graph,p_canvas,p_tab); 
    
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
     * @type BFAlgorithm
     */
    var algo = this;
    
    var replayHistory = new Array();
    var debugConsole = true;
    var tourStartVertex = null;
    var tourStartOddVertex = null;
    var tourCurrentVertex = null;
    var semiEuclideanGraph = false;
    var validGraph = false;
    var euclideanTour = new Array();
    var euclideanSubTour = new Array();
    var currentPseudoCodeLine = 1;
    var tourColors = new Array("blue", "green", "red", "yellow", "orange", "purple", "brown");
    var tourColorIndex = 0;
    
    /**
     * Startet die Ausführung des Algorithmus.
     * @method
     */
    this.run = function() {
        this.initCanvasDrawer();

        // Die Buttons werden erst im Javascript erstellt, um Problemen bei der mehrfachen Initialisierung vorzubeugen.
        $("#ta_div_abspielbuttons").append("<button id=\"ta_button_Zurueck\">"+LNG.K('algorithm_btn_prev')+"</button>"
                        +"<button id=\"ta_button_1Schritt\">"+LNG.K('algorithm_btn_next')+"</button>"
                        +"<button id=\"ta_button_vorspulen\">"+LNG.K('algorithm_btn_frwd')+"</button>"
                        +"<button id=\"ta_button_stoppVorspulen\">"+LNG.K('algorithm_btn_paus')+"</button>");
        $("#ta_button_stoppVorspulen").hide();
        $("#ta_button_Zurueck").button({icons:{primary: "ui-icon-seek-start"}, disabled: true});
        $("#ta_button_1Schritt").button({icons:{primary: "ui-icon-seek-end"}, disabled: false}); <!-- TODO -->
        $("#ta_button_vorspulen").button({icons:{primary: "ui-icon-seek-next"}, disabled: false}); <!-- TODO -->
        $("#ta_button_stoppVorspulen").button({icons:{primary: "ui-icon-pause"}});
        $("#ta_div_statusTabs").tabs();
        $(".marked").removeClass("marked");
        $("#ta_p_l1").addClass("marked");
        $("#ta_tr_LegendeClickable").removeClass("greyedOutBackground");

        this.registerEventHandlers();
        this.needRedraw = true;
        this.minimizeLegend();
        statusID = 0;

    };
    
    /**
     * Beendet die Ausführung des Algorithmus.
     * @method
     */
    this.destroy = function() {
        this.stopFastForward();
        this.destroyCanvasDrawer();
        this.deregisterEventHandlers();
    };
    
    /**
     * Beendet den Tab und startet ihn neu
     * @method
     */
    this.refresh = function() {
        this.destroy();
        var algo = new BFAlgorithm($("body").data("graph"),$("#ta_canvas_graph"),$("#tab_ta"));
        $("#tab_ta").data("algo",algo);
        algo.run();
    };
    
    /**
     * Zeigt and, in welchem Zustand sich der Algorithmus im Moment befindet.
     * @returns {Number} StatusID des Algorithmus
     */
    this.getStatusID = function() {
        return statusID;
    };
    
    /**
     * Registriere die Eventhandler an Buttons und canvas<br>
     * Nutzt den Event Namespace ".BFAlgorithm"
     * @method
     */
    this.registerEventHandlers = function() {
        $("#ta_button_1Schritt").on("click.BFAlgorithm",function() {algo.singleStepHandler();});
        $("#ta_button_vorspulen").on("click.BFAlgorithm",function() {algo.fastForwardAlgorithm();});
        $("#ta_button_stoppVorspulen").on("click.BFAlgorithm",function() {algo.stopFastForward();});
        $("#ta_button_Zurueck").on("click.BFAlgorithm",function() {algo.previousStepChoice();});
    };
    
    /**
     * Entferne die Eventhandler von Buttons und canvas im Namespace ".BFAlgorithm"
     * @method
     */
    this.deregisterEventHandlers = function() {
        canvas.off(".BFAlgorithm");
        $("#ta_button_1Schritt").off(".BFAlgorithm");
        $("#ta_button_vorspulen").off(".BFAlgorithm");
        $("#ta_button_stoppVorspulen").off(".BFAlgorithm");
        $("#ta_tr_LegendeClickable").off(".BFAlgorithm");
        $("#ta_button_Zurueck").off(".BFAlgorithm");
    };
    
    /**
     * Wird aufgerufen, wenn der "1 Schritt" Button gedrückt wird.
     * @method
     */
    this.singleStepHandler = function() {
        this.nextStepChoice();
    };

    /**
     * "Spult vor", führt den Algorithmus mit hoher Geschwindigkeit aus.
     * @method
     */
    this.fastForwardAlgorithm = function() {
        $("#ta_button_vorspulen").hide();
        $("#ta_button_stoppVorspulen").show();
        $("#ta_button_1Schritt").button("option", "disabled", true);
        $("#ta_button_Zurueck").button("option", "disabled", true);
        var geschwindigkeit = 200;	// Geschwindigkeit, mit der der Algorithmus ausgeführt wird in Millisekunden

        fastForwardIntervalID = window.setInterval(function(){algo.nextStepChoice();},geschwindigkeit);
    };
    
    /**
     * Stoppt das automatische Abspielen des Algorithmus
     * @method
     */
    this.stopFastForward = function() {
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
    this.nextStepChoice = function() {

        if(debugConsole) console.log("Current State: " + statusID);

        this.addReplayStep();

        switch(statusID) {
        case 0:
            $("#ta_button_Zurueck").button("option", "disabled", false);
            this.initializeGraph();
            break;
        case 1:
            $("#ta_button_Zurueck").button("option", "disabled", false);
            this.checkGraph();
            break;
        case 2:
            $("#ta_button_Zurueck").button("option", "disabled", true);
            this.invalidGraph();
            break;
        case 3:
            this.findStartingVertex();
            break;
        case 4:
            this.findNextVertexForTour();
            break;
        case 5:
            this.compareVertexWithStart();
            break;
        case 6:
            this.mergeTour();
            break;
        case 7:
            this.checkForEuclideanTour();
            break;
        case 8:
            this.returnTour();
            break;
        case 9:
            this.findNewStartingVertex();
            break;
        default:
            console.log("Fehlerhafter State");
            break;
        }

        this.updatePseudoCodeValues();

        this.needRedraw = true;
    };
    
    /**
     * Zeigt Texte und Buttons zum Ende des Algorithmus
     * @method
     */
    this.endAlgorithm = function() {
        $("#ta_div_statusErklaerung").append("<p></p><h3>"+LNG.K('algorithm_msg_finish')+"</h3>");
        $("#ta_div_statusErklaerung").append("<button id=ta_button_gotoIdee>"+LNG.K('algorithm_btn_more')+"</button>");
        $("#ta_div_statusErklaerung").append("<h3>"+LNG.K('algorithm_msg_test')+"</h3>");
        $("#ta_div_statusErklaerung").append("<button id=ta_button_gotoFA1>"+LNG.K('algorithm_btn_exe1')+"</button>");
        $("#ta_div_statusErklaerung").append("<button id=ta_button_gotoFA2>"+LNG.K('algorithm_btn_exe2')+"</button>");
        this.showVariableStatusField(null,null);
        $("#ta_button_gotoIdee").button();
        $("#ta_button_gotoFA1").button();
        $("#ta_button_gotoFA2").button();
        $("#ta_button_gotoIdee").click(function() {$("#tabs").tabs("option","active", 3);});
        $("#ta_button_gotoFA1").click(function() {$("#tabs").tabs("option","active", 4);});
        $("#ta_button_gotoFA2").click(function() {$("#tabs").tabs("option","active", 5);});
        // Falls wir im "Vorspulen" Modus waren, daktiviere diesen
        if(fastForwardIntervalID != null) {
            this.stopFastForward();
        }
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

        if(statusID == 0) {
            $("#ta_button_Zurueck").button("option", "disabled", true);
        }

        if(statusID == 8) {
            $("#ta_button_1Schritt").button("option", "disabled", false);
            $("#ta_button_vorspulen").button("option", "disabled", false);
        }

       this.needRedraw = true;
    };

    this.performBFS = function() {

        var reachableVertices = new Array();
        var visitedEdges = new Array();
        var queue = new Array();

        for (var startNode in graph.nodes) break;
        queue.push(startNode);

        while(queue.length > 0) {
            var currentNode = queue.shift();

            if(reachableVertices.indexOf(currentNode) === -1) reachableVertices.push(currentNode);

            var outEdges = graph.nodes[currentNode].getOutEdges();
            var inEdges = graph.nodes[currentNode].getInEdges();
            var edges = new Array();

            for(var kantenID in outEdges) {
                if (visitedEdges.indexOf(kantenID) != -1) continue;
                edges.push(kantenID);
                visitedEdges.push(kantenID);
            }

            for(var kantenID in inEdges) {
                if (visitedEdges.indexOf(kantenID) != -1) continue;
                edges.push(kantenID);
                visitedEdges.push(kantenID);
            }

            for (var i = 0; i < edges.length; i++) {
                if(graph.edges[edges[i]].getSourceID() == currentNode) {
                    queue.push(graph.edges[edges[i]].getTargetID());
                }else{
                    queue.push(graph.edges[edges[i]].getSourceID());
                }
            }

        }

        return reachableVertices;

    };

    this.markPseudoCodeLine = function(line) {
        currentPseudoCodeLine = line;
        $(".marked").removeClass('marked');
        $("#ta_p_l"+line).addClass('marked');
    };

    this.updatePseudoCodeValues = function() {
        if(tourStartVertex != null) {
            $("#ta_td_tourStartVertex").html(graph.nodes[tourStartVertex].getLabel());
        }else{
            $("#ta_td_tourStartVertex").html("-");
        }
        if(tourCurrentVertex != null) {
            $("#ta_td_tourCurrentVertex").html(graph.nodes[tourCurrentVertex].getLabel());
        }else{
            $("#ta_td_tourCurrentVertex").html("-");
        }
        if(euclideanSubTour.length == 0) {
            $("#ta_td_euclideanSubtour").html("&#8709;");
        }else{
            var subtour = new Array();
            for(var i = 0; i < euclideanSubTour.length; i++) {
                if(euclideanSubTour[i].type == "vertex") {
                    subtour.push(graph.nodes[euclideanSubTour[i].id].getLabel());
                }
            }
            $("#ta_td_euclideanSubtour").html("{" + subtour.join(',') + "}");
        }
        if(euclideanTour.length == 0) {
            $("#ta_td_euclideanTour").html("&#8709;");
        }else{
            var tour = new Array();
            for(var i = 0; i < euclideanTour.length; i++) {
                if(euclideanTour[i].type == "vertex") {
                    tour.push(graph.nodes[euclideanTour[i].id].getLabel());
                }
            }
            $("#ta_td_euclideanTour").html("{" + tour.join(',') + "}");
        }
        

    };

    this.addReplayStep = function() {

        var nodeProperties = {};
        for(var key in graph.nodes) {
            nodeProperties[graph.nodes[key].getNodeID()] = {layout: JSON.stringify(graph.nodes[key].getLayout()), label: graph.nodes[key].getLabel()};
        }

        var edgeProperties = {}
        for(var key in graph.edges) {
            edgeProperties[graph.edges[key].getEdgeID()] = {layout: JSON.stringify(graph.edges[key].getLayout()), label: graph.edges[key].getAdditionalLabel(), visited: graph.edges[key].getVisited()};
        }

        replayHistory.push({
            "previousStatusId": statusID,
            "nodeProperties": nodeProperties,
            "edgeProperties": edgeProperties,
            "tourStartVertex": tourStartVertex,
            "tourStartOddVertex": tourStartOddVertex,
            "tourCurrentVertex": tourCurrentVertex,
            "semiEuclideanGraph": semiEuclideanGraph,
            "validGraph": validGraph,
            "tourColorIndex": tourColorIndex,
            "htmlSidebar": $("#ta_div_statusErklaerung").html(),
            "euclideanTour": JSON.stringify(euclideanTour),
            "euclideanSubTour": JSON.stringify(euclideanSubTour),
            "legende": $("#tab_ta").find(".LegendeText").html(),
            "pseudoCodeLine" : currentPseudoCodeLine,
            "pseudo_start" : $("#ta_td_tourStartVertex").html(),
            "pseudo_cur" : $("#ta_td_tourCurrentVertex").html(),
            "pseudo_subtour" : $("#ta_td_euclideanSubtour").html(),
            "pseudo_tour" : $("#ta_td_euclideanTour").html()
        });

        if(debugConsole) console.log("Current History Step: ", replayHistory[replayHistory.length-1]);

    };

    this.replayStep = function() {

        var oldState = replayHistory.pop();

        if(debugConsole) console.log("Replay Step", oldState);

        statusID = oldState.previousStatusId;
        tourStartVertex = oldState.tourStartVertex;
        tourStartOddVertex = oldState.tourStartOddVertex;
        tourCurrentVertex = oldState.tourCurrentVertex;
        semiEuclideanGraph = oldState.semiEuclideanGraph;
        validGraph = oldState.validGraph;
        tourColorIndex = oldState.tourColorIndex;
        $("#ta_div_statusErklaerung").html(oldState.htmlSidebar);
        euclideanTour = JSON.parse(oldState.euclideanTour);
        euclideanSubTour = JSON.parse(oldState.euclideanSubTour);
        $("#tab_ta").find(".LegendeText").html(oldState.legende);
        currentPseudoCodeLine = oldState.pseudoCodeLine;
        this.markPseudoCodeLine(currentPseudoCodeLine);
        $("#ta_td_tourStartVertex").html(oldState.pseudo_start);
        $("#ta_td_tourCurrentVertex").html(oldState.pseudo_cur);
        $("#ta_td_euclideanSubtour").html(oldState.pseudo_subtour);
        $("#ta_td_euclideanTour").html(oldState.pseudo_tour);

        for(var key in oldState.nodeProperties) {
            graph.nodes[key].setLayoutObject(JSON.parse(oldState.nodeProperties[key].layout));
            graph.nodes[key].setLabel(oldState.nodeProperties[key].label);
        }

        for(var key in oldState.edgeProperties) {
            graph.edges[key].setLayoutObject(JSON.parse(oldState.edgeProperties[key].layout));
            graph.edges[key].setAdditionalLabel(oldState.edgeProperties[key].label);
            graph.edges[key].setVisited(oldState.edgeProperties[key].visited);
        }

        this.needRedraw = true;

    };

    this.addVertexToTour = function(vertex, tour) {
        tour.push({type: "vertex", id: vertex.getNodeID()});
    };

    this.addEdgeToTour = function(edge, tour) {
        tour.push({type: "edge", id: edge.getEdgeID()});
    };

    this.addNamingLabels = function() {

        var edgeCounter = 1;
        var nodeCounter = 1;

        for(var knotenID in graph.nodes) {
            graph.nodes[knotenID].setLabel(String.fromCharCode("a".charCodeAt(0)+nodeCounter-1));
            nodeCounter++;
        };

        /* for(var kantenID in graph.edges) {
            graph.edges[kantenID].setAdditionalLabel("{"+graph.nodes[graph.edges[kantenID].getSourceID()].getLabel()+", "+graph.nodes[graph.edges[kantenID].getTargetID()].getLabel()+"}")
            edgeCounter++;
        }; */

    };

    // Edge visited = false
    // Benennung v1, v2, ... & e1, e2, ...
    this.initializeGraph = function() {
        this.markPseudoCodeLine(2);

        $("#ta_div_statusErklaerung").html("<h3>Initialisiere Graph</h3>");

        this.addNamingLabels();

        var edgeCounter = 1;

        for(var kantenID in graph.edges) {
            graph.edges[kantenID].setVisited(false);
            edgeCounter++;
        };

        statusID = 1;

        this.needRedraw = true;

        return true;

    };

    // Check ob Graph Euclidisch oder Semi Euclidisch ist
    // TODO checke ob Graph zusammenhängend via Breitensuche
    this.checkGraph = function() {
        this.markPseudoCodeLine(3);
        $("#ta_div_statusErklaerung").html("<h3>Prüfe ob Graph euclidisch oder semi-euclidisch ist</h3>");
        $("#tab_ta").find(".LegendeText").html('<table><tr><td class="LegendeTabelle"><img src="img/knoten_even.png" alt="Knoten" class="LegendeIcon"></td><td><span>Knoten mit geradem Grad 2</span></td></tr><tr><td class="LegendeTabelle"><img src="img/knoten_odd.png" alt="Knoten" class="LegendeIcon"></td><td><span>Knoten mit ungeradem Grad 3</span></td></tr></table>');

        var numberOfOddVertices = 0;
        var firstOddVertex = null;

        this.needRedraw = true;

        if(Object.keys(graph.nodes).length < 2) {       // Graph too small
            statusID = 2;
            validGraph = false;
            if(debugConsole) console.log("Invalid graph: Graph too small");
            return false;
        }

        var reachableVertices = this.performBFS();
        if(Utilities.objectSize(graph.nodes) != reachableVertices.length) {
            statusID = 2;
            validGraph = false;
            if(debugConsole) console.log("Invalid graph: Unconnected graph detected");
            return false;
            
        }

        for(var knotenID in graph.nodes) {
            var degree = graph.nodes[knotenID].getDegree();
            graph.nodes[knotenID].setLabel(degree);
            if(degree % 2 === 1) {
                graph.nodes[knotenID].setLayout("borderColor", "red");
                graph.nodes[knotenID].setLayout("borderWidth", 3);
                numberOfOddVertices++;
                if(firstOddVertex === null) {
                    firstOddVertex = knotenID;
                }
            }else{
                graph.nodes[knotenID].setLayout("borderColor", "green");
            }
        }

        if(numberOfOddVertices === 0) {              // Euclidean Graph
            validGraph = true;
            statusID = 3;
            semiEuclideanGraph = false;
            return true;

        }else if(numberOfOddVertices === 2) {        // Semi Euclidean Graph
            validGraph = true;
            statusID = 3;
            semiEuclideanGraph = true;
            tourStartOddVertex = firstOddVertex;
            return true;

        }else{                                       // Invalid Graph
            statusID = 2;
            validGraph = false;
            if(debugConsole) console.log("Invalid graph: Graph is not euclidean or semi euclidean");
            return false;
        }

    };

    // State wenn Graph invalid ist
    this.invalidGraph = function() {
        $("#ta_div_statusErklaerung").html("<h3>Graph ist nicht euclidisch!</h3>").addClass("ui-state-error");

        if(fastForwardIntervalID != null) {
            this.stopFastForward();
        }

        $("#ta_button_1Schritt").button("option", "disabled", true);
        $("#ta_button_vorspulen").button("option", "disabled", true);
        $("#ta_button_Zurueck").button("option", "disabled", true);

        return true;

    };

    // Selectiere Start Vertice, entweder #1 (Euclidisch) oder #1 mit ungeradem Grad (Semi Euclidisch)
    this.findStartingVertex = function() {
        this.markPseudoCodeLine(5);
        $("#ta_div_statusErklaerung").html("<h3>Finde Start Knoten</h3>");
        $("#tab_ta").find(".LegendeText").html('<table><tr><td class="LegendeTabelle"><img src="img/startknoten.png" alt="Knoten" class="LegendeIcon"></td><td><span>Startknoten bzw. Knoten der mit dem Startknoten verglichen wird</span></td></tr><tr><td class="LegendeTabelle"><img src="img/pfad.png" alt="Kante" class="LegendeIcon"></td><td><span>Kante der Eulertour im aktuellen Durchgang</span></td></tr></table>');

        // Restore Naming
        this.addNamingLabels();

        // Set Starting & Current Vertex
        if(semiEuclideanGraph) {
            tourStartVertex = tourStartOddVertex;
        }else{
            for (var knotenID in graph.nodes) {
                tourStartVertex = knotenID;
                break;
            };
        }

        graph.nodes[tourStartVertex].setLayout("fillStyle", const_Colors.NodeFillingHighlight);
        tourCurrentVertex = tourStartVertex;

        euclideanSubTour = new Array();
        this.addVertexToTour(graph.nodes[tourCurrentVertex], euclideanSubTour);
        if(debugConsole) console.log("Subtour: ", euclideanSubTour);

        this.needRedraw = true;

        statusID = 4;

        return true;

    };

    // Finde nächsten Vertice über unbesuchte Kante
    // Wenn keiner gefunden -> mergeTour()
    // Wenn gefunden -> findNextVertexForTour()
    this.findNextVertexForTour = function() {
        this.markPseudoCodeLine(9);
        $("#ta_div_statusErklaerung").html("<h3>Finde nächsten Knoten</h3>");

        graph.nodes[tourStartVertex].setLayout("fillStyle", const_Colors.NodeFilling);

        var outEdges = graph.nodes[tourCurrentVertex].getOutEdges();
        var inEdges = graph.nodes[tourCurrentVertex].getInEdges();

        var nextEdge = null;

        // Find first unvisited Edge
        for(var kantenID in outEdges) {
            if(!outEdges[kantenID].getVisited()) {
                if(nextEdge === null) {
                    nextEdge = kantenID;
                    outEdges[kantenID].setVisited(true);
                    outEdges[kantenID].setLayout("lineColor", tourColors[tourColorIndex]);
                    outEdges[kantenID].setLayout("lineWidth", 3);
                }else{
                    break;
                }   
            }
        }

        for(var kantenID in inEdges) {
            if(!inEdges[kantenID].getVisited()) {
                if(nextEdge === null) {
                    nextEdge = kantenID;
                    inEdges[kantenID].setVisited(true);
                    inEdges[kantenID].setLayout("lineColor", tourColors[tourColorIndex]);
                    inEdges[kantenID].setLayout("lineWidth", 3);
                }else{
                    break;
                }  
            }
        }

        this.needRedraw = true;

        // Merge Tour if stuck
        if(nextEdge === null) {
            statusID = 6;
            return false;
        }

        this.addEdgeToTour(graph.edges[nextEdge], euclideanSubTour);
        if(debugConsole) console.log("Subtour: ", euclideanSubTour);

        graph.nodes[tourCurrentVertex].setLayout("fillStyle", const_Colors.NodeFilling);

        // Get other Vertex
        if(graph.edges[nextEdge].getSourceID() == tourCurrentVertex) {
            tourCurrentVertex = graph.edges[nextEdge].getTargetID();
        }else{
            tourCurrentVertex = graph.edges[nextEdge].getSourceID();
        }

        this.addVertexToTour(graph.nodes[tourCurrentVertex], euclideanSubTour);
        if(debugConsole) console.log("Subtour: ", euclideanSubTour);

        graph.nodes[tourCurrentVertex].setLayout("fillStyle", const_Colors.NodeFillingHighlight);

        statusID = 5;

        return true;

    };

    // Vergleiche nächsten Vertex mit ursprünglichem Start Vertex
    // Wenn gleich -> mergeTour()
    // Wenn ungleich -> findNextVertexForTour()
    this.compareVertexWithStart = function() {
        this.markPseudoCodeLine(7);
        $("#ta_div_statusErklaerung").html("<h3>Vergleiche Knoten mit Startknoten</h3>");

        graph.nodes[tourStartVertex].setLayout("fillStyle", const_Colors.NodeFillingHighlight);

        if(debugConsole) console.log("Start: " + tourStartVertex + ", Current: "+ tourCurrentVertex);

        if(tourStartVertex == tourCurrentVertex) {
            statusID = 6;
            return true;
        }else{
            statusID = 4;
            return false;
        }

    };

    // Merge Subtour in Tour
    // Bei leerer Tour, Tour = Subtour
    // Bei vorhandener Tour, Replace Start mit Subtour
    // TODO Subtouren speichern
    this.mergeTour = function() {
        this.markPseudoCodeLine(10);
        $("#ta_div_statusErklaerung").html("<h3>Integriere Tour in Gesamttour</h3>");

        tourColorIndex++;
        tourColorIndex = tourColorIndex % tourColors.length;

        graph.nodes[tourStartVertex].setLayout("fillStyle", const_Colors.NodeFilling);

        var replaced = false;

        if(euclideanTour.length === 0) {
            euclideanTour = euclideanSubTour;          
        }else if(JSON.stringify(euclideanSubTour[0]) !== JSON.stringify(euclideanSubTour[(euclideanSubTour.length - 1)])) {
            if(debugConsole) console.log("Spezialfall mit 2 Odd Vertices");

            var startOfSubTour = euclideanSubTour[0];
            var newTour = new Array();
            var specialLast = null;

            for(var i = 0; i < euclideanTour.length; i++) {
                if(JSON.stringify(euclideanTour[i]) === JSON.stringify(startOfSubTour)) {
                    specialLast = i;
                }
            }

            for(var i = 0; i < euclideanTour.length; i++) {
                if(specialLast == i) {
                    for(var j = 0; j < euclideanSubTour.length; j++) {
                        /* if(euclideanSubTour[j].type == "edge") {
                            graph.edges[euclideanSubTour[j].id].setLayout("lineColor", tourColors[0]);
                        } */
                        newTour.push(euclideanSubTour[j]);
                    }
                    replaced = true;
                }else{
                    newTour.push(euclideanTour[i]);
                }
            }

            euclideanTour = newTour;

        }else{
            var startOfSubTour = euclideanSubTour[0];
            var newTour = new Array();

            for(var i = 0; i < euclideanTour.length; i++) {
                if(JSON.stringify(euclideanTour[i]) == JSON.stringify(startOfSubTour) && !replaced) {
                    for(var j = 0; j < euclideanSubTour.length; j++) {
                        /* if(euclideanSubTour[j].type == "edge") {
                            graph.edges[euclideanSubTour[j].id].setLayout("lineColor", tourColors[0]);
                        } */
                        newTour.push(euclideanSubTour[j]);
                    }
                    replaced = true;
                }else{
                    newTour.push(euclideanTour[i]);
                }
            }

            euclideanTour = newTour;

        }

        euclideanSubTour = new Array();

        if(debugConsole) console.log("Current Complete Euclidean Tour: ", euclideanTour);

        statusID = 7;

    };

    // Check ob Tour ein Euclidischer Zug ist
    // Anzahl Kanten in Tour gleich Anzahl Kanten im Graph
    // Wenn ja -> returnTour()
    // Wenn nein -> findNewStartingVertex()
    this.checkForEuclideanTour = function() {
        this.markPseudoCodeLine(4);
        $("#ta_div_statusErklaerung").html("<h3>Prüfe ob Tour ein Euclidischer Kreis/Tour ist</h3>");

        var numberOfEdgesInGraph = Object.keys(graph.edges).length;
        var numberOfEdgesInTour = 0;

        for(var i = 0; i < euclideanTour.length; i++) {
            if(euclideanTour[i].type == "edge") {
                numberOfEdgesInTour++;
            }
        }

        if(debugConsole) console.log("Edges in Graph:" + numberOfEdgesInGraph + ", Edges in Tour: " + numberOfEdgesInTour);

        if(numberOfEdgesInGraph == numberOfEdgesInTour) {
            statusID = 8;
            return true;
        }else{
            statusID = 9;
            return false;
        }

    };

    // Zeige Tour
    this.returnTour = function() {
        this.markPseudoCodeLine(11);
        $("#ta_div_statusErklaerung").html("<h3>Zeige Ergebnis</h3>");

        var output = "";

        for(var i = 0; i < euclideanTour.length; i++) {
            if(euclideanTour[i].type == "vertex") {
                output += "<li>"+graph.nodes[euclideanTour[i].id].getLabel()+"</li>";
            }
            if(euclideanTour[i].type == "edge") {
                output += "<li>{"+graph.nodes[graph.edges[euclideanTour[i].id].getSourceID()].getLabel()+", "+graph.nodes[graph.edges[euclideanTour[i].id].getTargetID()].getLabel()+"}</li>";
            }
        }

        if(semiEuclideanGraph) {
            if(debugConsole) console.log("Complete Euclidean Trail: ", euclideanTour);
            $("#ta_div_statusErklaerung").append("<p>Zug:<br /> <ul>" + output + "</ul></p>");
        }else{
            if(debugConsole) console.log("Complete Euclidean Circle: ", euclideanTour);
            $("#ta_div_statusErklaerung").append("<p>Kreis:<br /> <ul>" + output + "</ul></p>");
        }      

        if(fastForwardIntervalID != null) {
            this.stopFastForward();
        }
        $("#ta_button_1Schritt").button("option", "disabled", true);
        $("#ta_button_vorspulen").button("option", "disabled", true);
    };

    // Finde neuen Startpunkt in Tour
    // Erster Knoten, dessen Grad unbesuchter Kanten größer 0 ist -> findNextVertexForTour()
    this.findNewStartingVertex = function() {
        this.markPseudoCodeLine(5);
        $("#ta_div_statusErklaerung").html("<h3>Finde neuen Startpunkt für eine neue Subtour</h3>");

        euclideanSubTour = new Array();

        for(var i = 0; i < euclideanTour.length; i++) {
            
            if(euclideanTour[i].type == "vertex") {
                if(graph.nodes[euclideanTour[i].id].getUnvisitedDegree() > 0) {
                    tourStartVertex = euclideanTour[i].id;
                    graph.nodes[euclideanTour[i].id].setLayout("fillStyle", const_Colors.NodeFillingHighlight);
                    tourCurrentVertex = euclideanTour[i].id;

                    euclideanSubTour = new Array();
                    this.addVertexToTour(graph.nodes[euclideanTour[i].id], euclideanSubTour);

                    if(debugConsole) console.log("Subtour: ", euclideanSubTour);

                    this.needRedraw = true;
                    break;
                }
            }
        }

        statusID = 4;

    };

}

// Vererbung realisieren
BFAlgorithm.prototype = new CanvasDrawer;
BFAlgorithm.prototype.constructor = BFAlgorithm;