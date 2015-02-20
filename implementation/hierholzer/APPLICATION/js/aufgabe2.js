/**
 * @author Richard Stotz
 * Code für Forschungsaufgabe 2<br>
 * Basiert auf dem Code für den normalen Algorithmus
 */

/**
 * Diese Klasse kapselt alle Informationen zu Forschungsaufgabe 2.<br>
 * In Forschungsaufgabe 2 muss der Nutzer die optimale Reihenfolge der Kanten 
 * finden.<br>
 * Da auch diese Aufgabe wieder Dinge auf das Canvas zeichnet, erweitert diese Klasse
 * die Klasse CanvasDrawer. 
 * @constructor
 * @augments CanvasDrawer
 * @param {Graph} p_graph Graph, auf dem der Algorithmus ausgeführt wird
 * @param {Object} p_canvas jQuery Objekt des Canvas, in dem gezeichnet wird.
 * @param {Object} p_tab jQuery Objekt des aktuellen Tabs.
 */
function Forschungsaufgabe2(p_graph,p_canvas,p_tab) {
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
    var semiEulerianGraph = false;
    var validGraph = false;
    var eulerianTour = new Array();
    var eulerianSubTour = new Array();
    var subtours = new Array();
    var currentPseudoCodeLine = 1;
    var tourColors = new Array("#0000cc", "#006600", "#990000", "#999900", "#cc6600", "#660099", "#330000");
    var tourColorIndex = 0;
    var tourAnimationIndex = 0; 
    var tourAnimation = null;
    
    /**
     * Startet die Ausführung des Algorithmus.
     * @method
     */
    this.run = function() {
        this.initCanvasDrawer();

        // Die Buttons werden erst im Javascript erstellt, um Problemen bei der mehrfachen Initialisierung vorzubeugen.
        $("#tf2_div_abspielbuttons").append("<button id=\"tf2_button_Zurueck\">"+LNG.K('algorithm_btn_prev')+"</button>"
                        +"<button id=\"tf2_button_1Schritt\">"+LNG.K('algorithm_btn_next')+"</button>"
                        +"<button id=\"tf2_button_vorspulen\">"+LNG.K('algorithm_btn_frwd')+"</button>"
                        +"<button id=\"tf2_button_stoppVorspulen\">"+LNG.K('algorithm_btn_paus')+"</button>");
        $("#tf2_button_stoppVorspulen").hide();
        $("#tf2_button_Zurueck").button({icons:{primary: "ui-icon-seek-start"}, disabled: true});
        $("#tf2_button_1Schritt").button({icons:{primary: "ui-icon-seek-end"}, disabled: false});
        $("#tf2_button_vorspulen").button({icons:{primary: "ui-icon-seek-next"}, disabled: false});
        $("#tf2_button_stoppVorspulen").button({icons:{primary: "ui-icon-pause"}});
        $("#tf2_div_statusTabs").tabs();
        $(".marked").removeClass("marked");
        $("#tf2_p_l1").addClass("marked");
        $("#tf2_tr_LegendeClickable").removeClass("greyedOutBackground");

        this.registerEventHandlers();
        this.needRedraw = true;
        this.minimizeLegend();
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
        // TODO
        var directedGraph = new Graph("graphs/gerichtet1.txt", null, true);
        var algo = new Forschungsaufgabe2(directedGraph, $("#tf2_canvas_graph"), $("#tab_tf2"));
        $("#tab_tf2").data("algo",algo);
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
     * Nutzt den Event Namespace ".Forschungsaufgabe2SN"
     * @method
     */
    this.registerEventHandlers = function() {
        $("#tf2_button_1Schritt").on("click.Forschungsaufgabe2",function() {algo.singleStepHandler();});
        $("#tf2_button_vorspulen").on("click.Forschungsaufgabe2",function() {algo.fastForwardAlgorithm();});
        $("#tf2_button_stoppVorspulen").on("click.Forschungsaufgabe2",function() {algo.stopFastForward();});
        $("#tf2_button_Zurueck").on("click.Forschungsaufgabe2",function() {algo.previousStepChoice();});
    };
    
    /**
     * Entferne die Eventhandler von Buttons und canvas im Namespace ".Forschungsaufgabe2"
     * und ".Forschungsaufgabe2SN"
     * @method
     */
    this.deregisterEventHandlers = function() {
        canvas.off(".Forschungsaufgabe2");
        $("#tf2_button_1Schritt").off(".Forschungsaufgabe2");
        $("#tf2_button_vorspulen").off(".Forschungsaufgabe2");
        $("#tf2_button_stoppVorspulen").off(".Forschungsaufgabe2");
        $("#tf2_tr_LegendeClickable").off(".Forschungsaufgabe2");
        $("#tf2_button_Zurueck").off(".Forschungsaufgabe2");
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
        $("#tf2_button_vorspulen").hide();
        $("#tf2_button_stoppVorspulen").show();
        $("#tf2_button_1Schritt").button("option", "disabled", true);
        $("#tf2_button_Zurueck").button("option", "disabled", true);
        var geschwindigkeit = 200;  // Geschwindigkeit, mit der der Algorithmus ausgeführt wird in Millisekunden

        fastForwardIntervalID = window.setInterval(function(){algo.nextStepChoice();},geschwindigkeit);
    };
    
    /**
     * Stoppt das automatische Abspielen des Algorithmus
     * @method
     */
    this.stopFastForward = function() {
        $("#tf2_button_vorspulen").show();
        $("#tf2_button_stoppVorspulen").hide();
        $("#tf2_button_1Schritt").button("option", "disabled", false);
        $("#tf2_button_Zurueck").button("option", "disabled", false);
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

        if(statusID == null) {
            statusID = 0;
        }
        if(debugConsole) console.log("Current State: " + statusID);

        this.addReplayStep();

        switch(statusID) {
        case 0:
            $("#tf2_button_Zurueck").button("option", "disabled", false);
            this.initializeGraph();
            break;
        case 1:
            $("#tf2_button_Zurueck").button("option", "disabled", false);
            this.checkGraph();
            break;
        case 2:
            $("#tf2_button_Zurueck").button("option", "disabled", true);
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
            this.checkForeulerianTour();
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
     * Ermittelt basierend auf der StatusID und anderen den vorherigen Schritt aus
     * und ruft die entsprechende Funktion auf.
     * @method
     */
    this.previousStepChoice = function() {

        this.replayStep();

        if(statusID == 0) {
            $("#tf2_button_Zurueck").button("option", "disabled", true);
        }

        if(statusID == 8) {
            $("#tf2_button_1Schritt").button("option", "disabled", false);
            $("#tf2_button_vorspulen").button("option", "disabled", false);
        }

       this.needRedraw = true;
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

        if(tourAnimationIndex > 0 && eulerianTour[(tourAnimationIndex - 1)].type == "vertex") {
            graph.nodes[eulerianTour[(tourAnimationIndex - 1)].id].setLayout("fillStyle", const_Colors.NodeFilling);
        }
        if(tourAnimationIndex > 0 && eulerianTour[(tourAnimationIndex - 1)].type == "edge") {
            graph.edges[eulerianTour[(tourAnimationIndex - 1)].id].setLayout("lineWidth", 3);
        }
        this.needRedraw = true;

        if(tourAnimationIndex >= eulerianTour.length) {
            this.animateTourStop(event);
            return;
        }

        if(eulerianTour[tourAnimationIndex].type == "vertex") {
            graph.nodes[eulerianTour[tourAnimationIndex].id].setLayout("fillStyle", const_Colors.NodeFillingHighlight);
        }
        if(eulerianTour[tourAnimationIndex].type == "edge") {
            graph.edges[eulerianTour[tourAnimationIndex].id].setLayout("lineWidth", 6);
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
        if(tourAnimationIndex > 0 && eulerianTour[(tourAnimationIndex - 1)].type == "vertex") {
            graph.nodes[eulerianTour[(tourAnimationIndex - 1)].id].setLayout("fillStyle", const_Colors.NodeFilling);
        }
        if(tourAnimationIndex > 0 && eulerianTour[(tourAnimationIndex - 1)].type == "edge") {
            graph.edges[eulerianTour[(tourAnimationIndex - 1)].id].setLayout("lineWidth", 3);
        }
        event.data.org.needRedraw = true;
        tourAnimationIndex = 0;
        window.clearInterval(tourAnimation);
        tourAnimation = null;
        $("#animateTour").button("option", "disabled", false);
        $("#animateTourStop").button("option", "disabled", true);
        return;
    };

    this.performStrongBFS = function() {

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
                if (visitedEdges.indexOf(kantenID) !== -1) continue;
                edges.push(kantenID);
                visitedEdges.push(kantenID);
            }

            for(var kantenID in inEdges) {
                if (visitedEdges.indexOf(kantenID) !== -1) continue;
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

        if(Object.keys(graph.nodes).length !== reachableVertices.length) {
            return false;
        }

        return true;

    };

    this.markPseudoCodeLine = function(line) {
        currentPseudoCodeLine = line;
        $(".marked").removeClass('marked');
        $("#tf2_p_l"+line).addClass('marked');
    };

    this.updatePseudoCodeValues = function() {
        if(tourStartVertex != null) {
            $("#tf2_td_tourStartVertex").html(graph.nodes[tourStartVertex].getLabel());
        }else{
            $("#tf2_td_tourStartVertex").html("-");
        }
        if(tourCurrentVertex != null) {
            $("#tf2_td_tourCurrentVertex").html(graph.nodes[tourCurrentVertex].getLabel());
        }else{
            $("#tf2_td_tourCurrentVertex").html("-");
        }
        if(eulerianSubTour.length == 0) {
            $("#tf2_td_eulerianSubTour").html("&#8709;");
        }else{
            var subtour = new Array();
            for(var i = 0; i < eulerianSubTour.length; i++) {
                if(eulerianSubTour[i].type == "vertex") {
                    subtour.push(graph.nodes[eulerianSubTour[i].id].getLabel());
                }
            }
            $("#tf2_td_eulerianSubTour").html("{" + subtour.join(',') + "}");
        }
        if(eulerianTour.length == 0) {
            $("#tf2_td_eulerianTour").html("&#8709;");
        }else{
            var tour = new Array();
            for(var i = 0; i < eulerianTour.length; i++) {
                if(eulerianTour[i].type == "vertex") {
                    tour.push(graph.nodes[eulerianTour[i].id].getLabel());
                }
            }
            $("#tf2_td_eulerianTour").html("{" + tour.join(',') + "}");
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
            "semiEulerianGraph": semiEulerianGraph,
            "validGraph": validGraph,
            "tourColorIndex": tourColorIndex,
            "htmlSidebar": $("#tf2_div_statusErklaerung").html(),
            "eulerianTour": JSON.stringify(eulerianTour),
            "eulerianSubTour": JSON.stringify(eulerianSubTour),
            "legende": $("#tab_tf2").find(".LegendeText").html(),
            "pseudoCodeLine" : currentPseudoCodeLine,
            "pseudo_start" : $("#tf2_td_tourStartVertex").html(),
            "pseudo_cur" : $("#tf2_td_tourCurrentVertex").html(),
            "pseudo_subtour" : $("#tf2_td_eulerianSubTour").html(),
            "pseudo_tour" : $("#tf2_td_eulerianTour").html(),
            "subtours" : JSON.stringify(subtours)
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
        semiEulerianGraph = oldState.semiEulerianGraph;
        validGraph = oldState.validGraph;
        tourColorIndex = oldState.tourColorIndex;
        subtours = JSON.parse(oldState.subtours);
        $("#tf2_div_statusErklaerung").html(oldState.htmlSidebar);
        eulerianTour = JSON.parse(oldState.eulerianTour);
        eulerianSubTour = JSON.parse(oldState.eulerianSubTour);
        $("#tab_tf2").find(".LegendeText").html(oldState.legende);
        currentPseudoCodeLine = oldState.pseudoCodeLine;
        this.markPseudoCodeLine(currentPseudoCodeLine);
        $("#tf2_td_tourStartVertex").html(oldState.pseudo_start);
        $("#tf2_td_tourCurrentVertex").html(oldState.pseudo_cur);
        $("#tf2_td_eulerianSubTour").html(oldState.pseudo_subtour);
        $("#tf2_td_eulerianTour").html(oldState.pseudo_tour);

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

    };

    // Edge visited = false
    // Benennung v1, v2, ... & e1, e2, ...
    this.initializeGraph = function() {
        this.markPseudoCodeLine(1);

        $("#tf2_div_statusErklaerung").html('<h3>1 '+LNG.K('algorithm_status1_head')+'</h3>\
            <p>'+LNG.K('aufgabe2_status1_desc')+'</p>');

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

    // Check ob Graph eulersch oder semi eulersch ist
    this.checkGraph = function() {
        this.markPseudoCodeLine(2);
        $("#tf2_div_statusErklaerung").html('<h3>2 '+LNG.K('algorithm_status2_head')+'</h3>\
            <p>'+LNG.K('aufgabe2_status2_desc1')+'</p>\
            <ul>\
            <li><strong>'+LNG.K('aufgabe2_status2_desc2')+'</strong></li>\
            <li><strong>'+LNG.K('aufgabe2_status2_desc3')+'</strong><br />'+LNG.K('aufgabe2_status2_desc4')+'</li>\
            <li><strong>'+LNG.K('aufgabe2_status2_desc5')+'</strong><br />'+LNG.K('aufgabe2_status2_desc6')+'</li>\
            </ul>');
        $("#tab_tf2").find(".LegendeText").html('<table><tr><td class="LegendeTabelle"><img src="img/knoten_even_gerichtet.png" alt="Knoten" class="LegendeIcon"></td><td><span>'+LNG.K('aufgabe2_legende_ingradausgrad')+'</span></td></tr><tr><td class="LegendeTabelle"><img src="img/knoten_odd_gerichtet.png" alt="Knoten" class="LegendeIcon"></td><td><span>'+LNG.K('aufgabe2_legende_ingradgausgrad')+'</span></td></tr></table>');

        var numberOfOddVertices = 0;
        var firstOddVertex = null;

        this.needRedraw = true;

        if(Object.keys(graph.nodes).length < 2) {       // Graph too small
            statusID = 2;
            validGraph = false;
            if(debugConsole) console.log("Invalid graph: Graph too small");
            return false;
        }

        // Graph strongly connected
        var result = this.performStrongBFS();
        console.log("BFS result", result);
        if(!result) {
            statusID = 2;
            validGraph = false;
            if(debugConsole) console.log("Invalid graph: Unconnected graph detected");
            return false;  
        }


        for(var knotenID in graph.nodes) {

            var inDegree = graph.nodes[knotenID].getInDegree();
            var outDegree = graph.nodes[knotenID].getOutDegree();

            if(inDegree === outDegree) {
                graph.nodes[knotenID].setLayout("borderColor", "green");
            }else{
                graph.nodes[knotenID].setLayout("borderColor", "red");
                graph.nodes[knotenID].setLayout("borderWidth", 3);
                numberOfOddVertices++;
                if(firstOddVertex === null) {
                    firstOddVertex = knotenID;
                }
            }
            graph.nodes[knotenID].setLabel(inDegree + "/" + outDegree);
        }

        if(numberOfOddVertices === 0) {              // eulerian Graph
            validGraph = true;
            statusID = 3;
            semiEulerianGraph = false;
            return true;

        /* }else if(numberOfOddVertices === 2) {        // Semi eulerian Graph
            validGraph = true;
            statusID = 3;
            semiEulerianGraph = true;
            tourStartOddVertex = firstOddVertex;
            return true; */

        }else{                                       // Invalid Graph
            statusID = 2;
            validGraph = false;
            if(debugConsole) console.log("Invalid graph: Graph is not eulerian");
            return false;
        }

    };

    // State wenn Graph invalid ist
    this.invalidGraph = function() {
        $("#tf2_div_statusErklaerung").html('<h3 style="color: white;">2 '+LNG.K('algorithm_status2_head')+'</h3>\
            <p style="color: white;">'+LNG.K('aufgabe2_status2_desc7')+'</p>\
            <ul style="color: white;">\
            <li>'+LNG.K('aufgabe2_status2_desc2')+'</li>\
            <li>'+LNG.K('aufgabe2_status2_desc3')+'</li>\
            <li>'+LNG.K('aufgabe2_status2_desc5')+'</li>\
            </ul>').addClass("ui-state-error");

        if(fastForwardIntervalID != null) {
            this.stopFastForward();
        }

        $("#tf2_button_1Schritt").button("option", "disabled", true);
        $("#tf2_button_vorspulen").button("option", "disabled", true);
        $("#tf2_button_Zurueck").button("option", "disabled", true);

        return true;

    };

    // Selectiere Start Vertice, entweder #1 (Eulerisch) oder #1 mit ungeradem Grad (Semi Eulerisch)
    this.findStartingVertex = function() {
        this.markPseudoCodeLine(3);
        $("#tf2_div_statusErklaerung").html('<h3>3 '+LNG.K('algorithm_status3_head')+'</h3>\
            <h3>3.1a '+LNG.K('algorithm_status31A_head')+'</h3>\
            <p>'+LNG.K('aufgabe2_status31A_desc1')+'</p>\
            <p>'+LNG.K('aufgabe2_status31A_desc2')+'</p>\
            <p>'+LNG.K('aufgabe2_status31A_desc3')+'</p>\
            <p>'+LNG.K('aufgabe2_status31A_desc4')+'</p>');
        $("#tab_tf2").find(".LegendeText").html('<table><tr><td class="LegendeTabelle"><img src="img/startknoten.png" alt="Knoten" class="LegendeIcon"></td><td><span>'+LNG.K('algorithm_legende_start')+'</span></td></tr><tr><td class="LegendeTabelle"><img src="img/pfad_gerichtet.png" alt="Kante" class="LegendeIcon"></td><td><span>'+LNG.K('algorithm_legende_edgecolor')+'</span></td></tr></table>');

        // Restore Naming
        this.addNamingLabels();

        // Set Starting & Current Vertex
        for (var knotenID in graph.nodes) {
            tourStartVertex = knotenID;
            break;
        };

        graph.nodes[tourStartVertex].setLayout("fillStyle", const_Colors.NodeFillingHighlight);
        tourCurrentVertex = tourStartVertex;

        eulerianSubTour = new Array();
        this.addVertexToTour(graph.nodes[tourCurrentVertex], eulerianSubTour);
        if(debugConsole) console.log("Subtour: ", eulerianSubTour);

        this.needRedraw = true;

        statusID = 4;

        return true;

    };

    // Finde nächsten Vertice über unbesuchte Kante
    // Wenn keiner gefunden -> mergeTour()
    // Wenn gefunden -> findNextVertexForTour()
    this.findNextVertexForTour = function() {
        this.markPseudoCodeLine(7);
        $("#tf2_div_statusErklaerung").html('<h3>3 '+LNG.K('algorithm_status3_head')+'</h3>\
            <h3>3.2 '+LNG.K('algorithm_status32_head')+'</h3>\
            <p>'+LNG.K('aufgabe2_status32_desc1')+'</p>\
            <p>'+LNG.K('aufgabe2_status32_desc2')+'(<span style="font-weight: bold; color: '+tourColors[tourColorIndex]+';">'+LNG.K('aufgabe2_status32_desc3')+'</span>)'+LNG.K('aufgabe2_status32_desc4')+'</p>\
            <p>'+LNG.K('aufgabe2_status32_desc5')+'</p>');

        graph.nodes[tourStartVertex].setLayout("fillStyle", const_Colors.NodeFilling);

        var outEdges = graph.nodes[tourCurrentVertex].getOutEdges();
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

        this.needRedraw = true;

        // Merge Tour if stuck
        if(nextEdge === null) {
            statusID = 6;
            return false;
        }

        this.addEdgeToTour(graph.edges[nextEdge], eulerianSubTour);
        if(debugConsole) console.log("Subtour: ", eulerianSubTour);

        graph.nodes[tourCurrentVertex].setLayout("fillStyle", const_Colors.NodeFilling);

        // Get other Vertex
        tourCurrentVertex = graph.edges[nextEdge].getTargetID();

        this.addVertexToTour(graph.nodes[tourCurrentVertex], eulerianSubTour);
        if(debugConsole) console.log("Subtour: ", eulerianSubTour);

        graph.nodes[tourCurrentVertex].setLayout("fillStyle", const_Colors.NodeFillingHighlight);

        statusID = 5;

        return true;

    };

    // Vergleiche nächsten Vertex mit ursprünglichem Start Vertex
    // Wenn gleich -> mergeTour()
    // Wenn ungleich -> findNextVertexForTour()
    this.compareVertexWithStart = function() {
        this.markPseudoCodeLine(9);
        $("#tf2_div_statusErklaerung").html('<h3>3 '+LNG.K('algorithm_status3_head')+'</h3>\
            <h3>3.3 '+LNG.K('algorithm_status33_head')+'</h3>\
            <p>'+LNG.K('aufgabe2_status33_desc1')+'</p>\
            <h3>3.3.1 '+LNG.K('aufgabe2_status33_desc2')+'</h3>\
            <p>'+LNG.K('aufgabe2_status33_desc3')+'</p>\
            <h3>3.3.2 '+LNG.K('aufgabe2_status33_desc4')+'</h3>\
            <p>'+LNG.K('aufgabe2_status33_desc5')+'</p>');

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
    this.mergeTour = function() {
        this.markPseudoCodeLine(10);
        $("#tf2_div_statusErklaerung").html('<h3>4 '+LNG.K('algorithm_status4_head')+'</h3>\
            <h3>4.1 '+LNG.K('algorithm_status41_head')+'</h3>\
            <p>'+LNG.K('aufgabe2_status41_desc1')+'</p>\
            <h3>4.1.1 '+LNG.K('aufgabe2_status41_desc2')+'</h3>\
            <p>'+LNG.K('aufgabe2_status41_desc3')+'</p>\
            <h3>4.1.2 '+LNG.K('aufgabe2_status41_desc4')+'</h3>\
            <p>'+LNG.K('aufgabe2_status41_desc5')+'</p>');

        subtours.push({color: tourColorIndex, tour: eulerianSubTour});
        if(debugConsole) console.log("Subtours", subtours);

        tourColorIndex++;
        tourColorIndex = tourColorIndex % tourColors.length;

        graph.nodes[tourStartVertex].setLayout("fillStyle", const_Colors.NodeFilling);
        graph.nodes[tourCurrentVertex].setLayout("fillStyle", const_Colors.NodeFilling);

        var replaced = false;

        if(eulerianTour.length === 0) {
            eulerianTour = eulerianSubTour;          
        }else{
            var startOfSubTour = eulerianSubTour[0];
            var newTour = new Array();

            for(var i = 0; i < eulerianTour.length; i++) {
                if(JSON.stringify(eulerianTour[i]) == JSON.stringify(startOfSubTour) && !replaced) {
                    for(var j = 0; j < eulerianSubTour.length; j++) {
                        newTour.push(eulerianSubTour[j]);
                    }
                    replaced = true;
                }else{
                    newTour.push(eulerianTour[i]);
                }
            }

            eulerianTour = newTour;

        }

        eulerianSubTour = new Array();

        if(debugConsole) console.log("Current Complete Eulerian Tour: ", eulerianTour);

        statusID = 7;

    };

    // Check ob Tour eine Eulertour ist
    // Anzahl Kanten in Tour gleich Anzahl Kanten im Graph
    // Wenn ja -> returnTour()
    // Wenn nein -> findNewStartingVertex()
    this.checkForeulerianTour = function() {
        this.markPseudoCodeLine(12);
        $("#tf2_div_statusErklaerung").html('<h3>4 '+LNG.K('algorithm_status4_head')+'</h3>\
            <h3>4.2 '+LNG.K('algorithm_status42_head')+'</h3>\
            <p>'+LNG.K('aufgabe2_status42_desc1')+'</p>\
            <p>'+LNG.K('aufgabe2_status42_desc2')+'</p>\
            <p>'+LNG.K('aufgabe2_status42_desc3')+'</p>\
            <p>'+LNG.K('aufgabe2_status42_desc4')+'</p>');

        var numberOfEdgesInGraph = Object.keys(graph.edges).length;
        var numberOfEdgesInTour = 0;

        for(var i = 0; i < eulerianTour.length; i++) {
            if(eulerianTour[i].type == "edge") {
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
        this.markPseudoCodeLine(13);
        /* if(semiEulerianGraph) {
            $("#tf2_div_statusErklaerung").html('<h3>5 '+LNG.K('algorithm_status5_head')+'</h3>\
            <p>'+LNG.K('aufgabe2_status5_desc1a')+'</p>');
        }else{ */
           $("#tf2_div_statusErklaerung").html('<h3>5 '+LNG.K('algorithm_status5_head')+'</h3>\
            <p>'+LNG.K('aufgabe2_status5_desc1b')+'</p>'); 
        //}

        var output = "";

        for(var i = 0; i < eulerianTour.length; i++) {
            if(eulerianTour[i].type == "vertex") {
                output += graph.nodes[eulerianTour[i].id].getLabel();
            }
            if(eulerianTour[i].type == "edge") {
                var layout = graph.edges[eulerianTour[i].id].getLayout();
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


        /* if(semiEulerianGraph) {
            if(debugConsole) console.log("Complete Eulerian Trail: ", eulerianTour);

            $("#tf2_div_statusErklaerung").append('<h3>5.1 '+LNG.K('algorithm_status51a_head')+'</h3>\
            <p class="result_euleriantour">' + output + '</p>\
            <p>'+LNG.K('aufgabe2_status51a_desc1')+'</p>\
            <p><button id="animateTour">'+LNG.K('aufgabe2_status51a_desc2')+'</button><button id="animateTourStop">'+LNG.K('aufgabe2_status51a_desc3')+'</button></p>\
            <p>'+LNG.K('aufgabe2_status51a_desc4')+'</p>\
            <h3>5.2 '+LNG.K('algorithm_status2_head')+'</h3>\
            <ul class="subtourList result_subtour">'+output_subtours+'</ul>\
            <p>'+LNG.K('aufgabe2_status52_desc1')+'</p>\
            <p></p><h3>'+LNG.K('algorithm_msg_finish')+'</h3>\
            <button id="tf2_button_gotoIdee">'+LNG.K('algorithm_btn_more')+'</button>\
            <h3>'+LNG.K('algorithm_msg_test')+'</h3>\
            <button id="tf2_button_gotoFA1">'+LNG.K('algorithm_btn_exe1')+'</button>');

        }else{ */
            if(debugConsole) console.log("Complete Eulerian Circle: ", eulerianTour);

            $("#tf2_div_statusErklaerung").append('<h3>5.1 '+LNG.K('algorithm_status51b_head')+'</h3>\
            <p class="result_euleriantour">' + output + '</p>\
            <p>'+LNG.K('aufgabe2_status51b_desc1')+'</p>\
            <p><button id="animateTour">'+LNG.K('aufgabe2_status51b_desc2')+'</button><button id="animateTourStop">'+LNG.K('aufgabe2_status51b_desc3')+'</button></p>\
            <p>'+LNG.K('aufgabe2_status51b_desc4')+'</p>\
            <h3>5.2 '+LNG.K('algorithm_status2_head')+'</h3>\
            <ul class="subtourList result_subtour">'+output_subtours+'</ul>\
            <p>'+LNG.K('aufgabe2_status52_desc1')+'</p>\
            <p></p><h3>'+LNG.K('algorithm_msg_finish')+'</h3>\
            <button id="tf2_button_gotoIdee">'+LNG.K('algorithm_btn_more')+'</button>\
            <h3>'+LNG.K('algorithm_msg_test')+'</h3>\
            <button id="tf2_button_gotoFA1">'+LNG.K('algorithm_btn_exe1')+'</button>');
        //}  

        if(fastForwardIntervalID != null) {
            this.stopFastForward();
        }

        $("#tf2_button_gotoIdee").button();
        $("#tf2_button_gotoFA1").button();
        $("#tf2_button_gotoIdee").click(function() {$("#tabs").tabs("option", "active", 3);});
        $("#tf2_button_gotoFA1").click(function() {$("#tabs").tabs("option", "active", 4);});
        $("#tf2_button_1Schritt").button("option", "disabled", true);
        $("#tf2_button_vorspulen").button("option", "disabled", true);
        $(".subtourList").on("mouseenter", "li.subtour_hover", {org: this}, this.hoverSubtour).on("mouseleave", "li.subtour_hover", {org: this}, this.dehoverSubtour);
        $("#animateTour").button({icons:{primary: "ui-icon-play"}}).click({org: this}, this.animateTour);
        $("#animateTourStop").button({icons:{primary: "ui-icon-stop"}, disabled: true}).click({org: this}, this.animateTourStop);
    };

    // Finde neuen Startpunkt in Tour
    // Erster Knoten, dessen Grad unbesuchter Kanten größer 0 ist -> findNextVertexForTour()
    this.findNewStartingVertex = function() {
        this.markPseudoCodeLine(11);
        $("#tf2_div_statusErklaerung").html('<h3>3 '+LNG.K('algorithm_status3_head')+'</h3>\
            <h3>3.1b '+LNG.K('algorithm_status31B_head')+'</h3>\
            <p>'+LNG.K('aufgabe2_status31B_desc1')+'</p>\
            <p>'+LNG.K('aufgabe2_status31B_desc2')+'</p>');

        eulerianSubTour = new Array();

        for(var i = 0; i < eulerianTour.length; i++) {
            
            if(eulerianTour[i].type == "vertex") {
                if(graph.nodes[eulerianTour[i].id].getUnvisitedDegree() > 0) {
                    tourStartVertex = eulerianTour[i].id;
                    graph.nodes[eulerianTour[i].id].setLayout("fillStyle", const_Colors.NodeFillingHighlight);
                    tourCurrentVertex = eulerianTour[i].id;

                    eulerianSubTour = new Array();
                    this.addVertexToTour(graph.nodes[eulerianTour[i].id], eulerianSubTour);

                    if(debugConsole) console.log("Subtour: ", eulerianSubTour);

                    this.needRedraw = true;
                    break;
                }
            }
        }

        statusID = 4;

    };
    

}

// Vererbung realisieren
Forschungsaufgabe2.prototype = new CanvasDrawer;
Forschungsaufgabe2.prototype.constructor = Forschungsaufgabe2;