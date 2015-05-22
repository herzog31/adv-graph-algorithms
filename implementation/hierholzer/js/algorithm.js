/**
 * @author Mark J. Becker
 * Darstellung des Hierholzer Algorithmus
 */

/**
 * Instanz des Hierholzer Algorithmus, erweitert die Klasse CanvasDrawer
 * @constructor
 * @augments CanvasDrawer
 * @param {Graph} p_graph Graph, auf dem der Algorithmus ausgeführt wird
 * @param {Object} p_canvas jQuery Objekt des Canvas, in dem gezeichnet wird.
 * @param {Object} p_tab jQuery Objekt des aktuellen Tabs.
 */
function HAlgorithm(p_graph,p_canvas,p_tab) {
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
     * @type HAlgorithm
     */
    var algo = this;
    /**
     * Replay Stack, speichert alle Schritte des Ablaufs für Zurück Button
     * @type {Array}
     */
    var replayHistory = new Array();
    /**
     * Zeige Debug Informationen in der Console an
     * @type {Boolean}
     */
    var debugConsole = false;
    /**
     * ID des Startknoten der Tour bei eulerschem Graph
     * @type {Number}
     */
    var tourStartVertex = null;
    /**
     * ID des Startknoten der Tour bei semieulerschem Graph
     * @type {Number}
     */
    var tourStartOddVertex = null;
    /**
     * ID des aktuellen Knotens
     * @type {Number}
     */
    var tourCurrentVertex = null;
    /**
     * Boolean ob Graph semieulersch ist
     * @type {Boolean}
     */
    var semiEulerianGraph = false;
    /**
     * Boolean ob Graph gültig ist
     * @type {Boolean}
     */
    var validGraph = false;
    /**
     * Aktueller Stand der Eulertour
     * @type {Array}
     */
    var eulerianTour = new Array();
    /**
     * Aktueller Stand der Subtour
     * @type {Array}
     */
    var eulerianSubTour = new Array();
    /**
     * Array mit allen Subtouren
     * @type {Array}
     */
    var subtours = new Array();
    /**
     * Liste der aktuell markierten Zeilen im Pseudocode
     * @type {Array}
     */
    var currentPseudoCodeLine = [1];
    /**
     * Array mit Farbcodes für farbliche Hervorhebung der Subtouren
     * @type {Array}
     */
    var tourColors = new Array("#0000cc", "#990000", "#999900", "#cc6600", "#660099", "#330000");
    /**
     * Aktuelle Farbe zur farblichen Hervorhebung der Subtour
     * @type {Number}
     */
    var tourColorIndex = 0;
    /**
     * Index (FPS) für Tour Animation
     * @type {Number}
     */
    var tourAnimationIndex = 0; 
    /**
     * Animation Object der Animation zur Visualisierung der Eulertour
     * @type {Object}
     */
    var tourAnimation = null;
    
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
        $("#ta_button_1Schritt").button({icons:{primary: "ui-icon-seek-end"}, disabled: false});
        $("#ta_button_vorspulen").button({icons:{primary: "ui-icon-seek-next"}, disabled: false});
        $("#ta_button_stoppVorspulen").button({icons:{primary: "ui-icon-pause"}});
        $("#ta_div_statusTabs").tabs();
        $(".marked").removeClass("marked");
        $("#ta_p_l1").addClass("marked");
        $("#ta_tr_LegendeClickable").removeClass("greyedOutBackground");

        this.registerEventHandlers();
        this.needRedraw = true;
        

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
        var algo = new HAlgorithm($("body").data("graph"),$("#ta_canvas_graph"),$("#tab_ta"));
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
     * Nutzt den Event Namespace ".HAlgorithm"
     * @method
     */
    this.registerEventHandlers = function() {
        $("#ta_button_1Schritt").on("click.HAlgorithm", function() { algo.singleStepHandler(); });
        $("#ta_button_vorspulen").on("click.HAlgorithm", function() { algo.fastForwardAlgorithm(); });
        $("#ta_button_stoppVorspulen").on("click.HAlgorithm", function() { algo.stopFastForward(); });
        $("#ta_button_Zurueck").on("click.HAlgorithm", function() { algo.previousStepChoice(); });
    };
    
    /**
     * Entferne die Eventhandler von Buttons und canvas im Namespace ".HAlgorithm"
     * @method
     */
    this.deregisterEventHandlers = function() {
        canvas.off(".HAlgorithm");
        $("#ta_button_1Schritt").off(".HAlgorithm");
        $("#ta_button_vorspulen").off(".HAlgorithm");
        $("#ta_button_stoppVorspulen").off(".HAlgorithm");
        $("#ta_tr_LegendeClickable").off(".HAlgorithm");
        $("#ta_button_Zurueck").off(".HAlgorithm");
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
     * Führt den nächsten Algorithmenschritt aus
     * @method
     */
    this.nextStepChoice = function() {

        if(statusID == null) {
            statusID = 0;
        }
        if(debugConsole) console.log("Current State: " + statusID);

        // Speichere aktuellen Schritt im Stack
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

        // Aktualisiere Markierungen im Pseudocode
        this.updatePseudoCodeValues();
        this.fixPositionLegend();
        this.needRedraw = true;
    };
    
    /**
     * Ermittelt basierend auf der StatusID und anderen den vorherigen Schritt aus
     * und ruft die entsprechende Funktion auf.
     * @method
     */
    this.previousStepChoice = function() {

        // Stelle letzten Schritt aus Stack wieder her
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

    /**
     * Hebe Subtour Fett hervor
     * @method
     * @param  {jQuery.Event} event Hover Event
     */
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

    /**
     * Macht die Hervorhebung rückgängig
     * @method
     * @param  {jQuery.Event} event Hover Event
     */
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

        if(tourAnimationIndex >= (eulerianTour.length*30)) {
            this.animateTourStop(event);
            return;
        }

        if(tourAnimationIndex > 0 && eulerianTour[previousEdge].type === "edge") {
            graph.edges[eulerianTour[previousEdge].id].setLayout("progressArrow", false);
        }
        this.needRedraw = true;

        
        if(eulerianTour[currentEdge].type === "vertex") {
            tourAnimationIndex = tourAnimationIndex + 29;
        }

        if(eulerianTour[currentEdge].type === "edge") {
            graph.edges[eulerianTour[currentEdge].id].setLayout("progressArrow", true);
            graph.edges[eulerianTour[currentEdge].id].setLayout("progressArrowPosition", currentArrowPosition);
        }

        this.needRedraw = true;
        tourAnimationIndex++;
    };

    /**
     * Starte Eulertour Animation
     * @method
     * @param  {jQuery.Event} event
     */
    this.animateTour = function(event) {
        $("#animateTour").button("option", "disabled", true);
        $("#animateTourStop").button("option", "disabled", false);
        for(var i = 0; i < eulerianTour.length; i++) {
            if(eulerianTour[i].type === "edge") {
                var sourceNode = null;
                var targetNode = null;
                if(eulerianTour[(i - 1) % eulerianTour.length].type === "vertex") {
                    sourceNode = graph.nodes[eulerianTour[(i - 1) % eulerianTour.length].id].getCoordinates();
                }
                if(eulerianTour[(i + 1) % eulerianTour.length].type === "vertex") {
                    targetNode = graph.nodes[eulerianTour[(i + 1) % eulerianTour.length].id].getCoordinates();
                } 
                graph.edges[eulerianTour[i].id].setLayout("progressArrowSource", sourceNode);
                graph.edges[eulerianTour[i].id].setLayout("progressArrowTarget", targetNode);
            }
        }
        tourAnimationIndex = 0;
        var self = event.data.org;
        tourAnimation = window.setInterval(function() {self.animateTourStep(event); }, 1500.0/30);
    };

    /**
     * Stoppe Eulertour Animation
     * @method
     * @param  {jQuery.Event} event
     */
    this.animateTourStop = function(event) {
        var previousEdge = Math.floor((tourAnimationIndex - 1)/30);
        if(tourAnimationIndex > 0 && eulerianTour[previousEdge].type === "edge") {
            graph.edges[eulerianTour[previousEdge].id].setLayout("progressArrow", false);
        }
        event.data.org.needRedraw = true;
        tourAnimationIndex = 0;
        window.clearInterval(tourAnimation);
        tourAnimation = null;
        $("#animateTour").button("option", "disabled", false);
        $("#animateTourStop").button("option", "disabled", true);
        return;
    };

    /**
     * Führt eine Breitensuche vom ersten Knoten im Graph aus
     * @return {Array} Array der IDs der erreichbaren Knoten
     */
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

    /**
     * Markiere Zeilen im Pseudocode
     * @method
     * @param  {Array} lineArray Liste der zu markierenden Linien
     */
    this.markPseudoCodeLine = function(lineArray) {
        currentPseudoCodeLine = lineArray;
        $(".marked").removeClass('marked');
        for(var i = 0; i < lineArray.length; i++) {
            $("#ta_p_l"+lineArray[i]).addClass('marked');
        }
    };

    /**
     * Aktualisiere Werte in der Statustablle im Pseudocode
     * @method
     */
    this.updatePseudoCodeValues = function() {
        // Startknoten
        if(tourStartVertex != null) {
            $("#ta_td_tourStartVertex").html(graph.nodes[tourStartVertex].getLabel());
        }else{
            $("#ta_td_tourStartVertex").html("-");
        }
        // Aktueller Knoten
        if(tourCurrentVertex != null) {
            $("#ta_td_tourCurrentVertex").html(graph.nodes[tourCurrentVertex].getLabel());
        }else{
            $("#ta_td_tourCurrentVertex").html("-");
        }
        // Subtour
        if(eulerianSubTour.length == 0) {
            $("#ta_td_eulerianSubTour").html("&#8709;");
        }else{
            var subtour = new Array();
            for(var i = 0; i < eulerianSubTour.length; i++) {
                if(eulerianSubTour[i].type == "vertex") {
                    subtour.push(graph.nodes[eulerianSubTour[i].id].getLabel());
                }
            }
            $("#ta_td_eulerianSubTour").html("{" + subtour.join(',') + "}");
        }
        // Eulertour
        if(eulerianTour.length == 0) {
            $("#ta_td_eulerianTour").html("&#8709;");
        }else{
            var tour = new Array();
            for(var i = 0; i < eulerianTour.length; i++) {
                if(eulerianTour[i].type == "vertex") {
                    tour.push(graph.nodes[eulerianTour[i].id].getLabel());
                }
            }
            $("#ta_td_eulerianTour").html("{" + tour.join(',') + "}");
        }
        

    };

    /**
     * Füge Schritt zum Replay Stack hinzu
     * @method
     */
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
            "htmlSidebar": $("#ta_div_statusErklaerung").html(),
            "eulerianTour": JSON.stringify(eulerianTour),
            "eulerianSubTour": JSON.stringify(eulerianSubTour),
            "legende": $("#tab_ta").find(".LegendeText").html(),
            "pseudoCodeLine" : currentPseudoCodeLine,
            "pseudo_start" : $("#ta_td_tourStartVertex").html(),
            "pseudo_cur" : $("#ta_td_tourCurrentVertex").html(),
            "pseudo_subtour" : $("#ta_td_eulerianSubTour").html(),
            "pseudo_tour" : $("#ta_td_eulerianTour").html(),
            "subtours" : JSON.stringify(subtours)
        });

        if(debugConsole) console.log("Current History Step: ", replayHistory[replayHistory.length-1]);

    };

    /**
     * Stelle letzten Schritt auf dem Replay Stack wieder her
     * @method
     */
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
        $("#ta_div_statusErklaerung").html(oldState.htmlSidebar);
        eulerianTour = JSON.parse(oldState.eulerianTour);
        eulerianSubTour = JSON.parse(oldState.eulerianSubTour);
        $("#tab_ta").find(".LegendeText").html(oldState.legende);
        this.fixPositionLegend();
        currentPseudoCodeLine = oldState.pseudoCodeLine;
        this.markPseudoCodeLine(currentPseudoCodeLine);
        $("#ta_td_tourStartVertex").html(oldState.pseudo_start);
        $("#ta_td_tourCurrentVertex").html(oldState.pseudo_cur);
        $("#ta_td_eulerianSubTour").html(oldState.pseudo_subtour);
        $("#ta_td_eulerianTour").html(oldState.pseudo_tour);

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

    /**
     * Füge Knoten zurTour hinzu
     * @method
     * @param {Graph.GraphNode} vertex Knoten
     * @param {Array} tour   Tour
     */
    this.addVertexToTour = function(vertex, tour) {
        tour.push({type: "vertex", id: vertex.getNodeID()});
    };

    /**
     * Füge Kante zu Tour hinzu
     * @method
     * @param {Graph.Edge} edge Kante
     * @param {Array} tour Tour
     */
    this.addEdgeToTour = function(edge, tour) {
        tour.push({type: "edge", id: edge.getEdgeID()});
    };

    /**
     * Erzeuge Namen (Buchstaben) für alle Knoten
     * @method
     */
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

    /**
     * Initialisiere Graph
     * StatusID: 0
     * @method
     */
    this.initializeGraph = function() {
        this.markPseudoCodeLine([1]);

        $("#ta_div_statusErklaerung").html('<h3>1 '+LNG.K('algorithm_status1_head')+'</h3>\
            <p>'+LNG.K('algorithm_status1_desc')+'</p>');

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

    /**
     * Prüfe ob Graph gültig ist
     * StatusID 1
     * @method
     */
    this.checkGraph = function() {
        this.markPseudoCodeLine([2]);
        $("#ta_div_statusErklaerung").html('<h3>2 '+LNG.K('algorithm_status2_head')+'</h3>\
            <p>'+LNG.K('algorithm_status2_desc1')+'</p>\
            <ul>\
            <li><strong>'+LNG.K('algorithm_status2_desc2')+'</strong></li>\
            <li><strong>'+LNG.K('algorithm_status2_desc3')+'</strong></li>\
            <li><strong>'+LNG.K('algorithm_status2_desc4')+'</strong><br />'+LNG.K('algorithm_status2_desc5')+'</li>\
            </ul>');
        $("#tab_ta").find(".LegendeText").html('<table><tr><td class="LegendeTabelle"><img src="img/knoten_even.png" alt="Knoten" class="LegendeIcon" width="22" height="22"></td><td><span>'+LNG.K('algorithm_legende_degree2')+'</span></td></tr><tr><td class="LegendeTabelle"><img src="img/knoten_odd.png" alt="Knoten" class="LegendeIcon" width="22" height="22"></td><td><span>'+LNG.K('algorithm_legende_degree3')+'</span></td></tr></table>');

        var numberOfOddVertices = 0;
        var firstOddVertex = null;

        this.needRedraw = true;

        // Mindestgröße
        if(Object.keys(graph.nodes).length < 2) {
            statusID = 2;
            validGraph = false;
            if(debugConsole) console.log("Invalid graph: Graph too small");
            return false;
        }

        // Zusammenhängend
        var reachableVertices = this.performBFS();
        if(Utilities.objectSize(graph.nodes) != reachableVertices.length) {
            statusID = 2;
            validGraph = false;
            if(debugConsole) console.log("Invalid graph: Unconnected graph detected");
            return false;
            
        }

        // Knotengrade
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

        // Eulerscher Graph
        if(numberOfOddVertices === 0) {              
            validGraph = true;
            statusID = 3;
            semiEulerianGraph = false;
            return true;

        // Semieulerscher Graph
        }else if(numberOfOddVertices === 2) {        
            validGraph = true;
            statusID = 3;
            semiEulerianGraph = true;
            tourStartOddVertex = firstOddVertex;
            return true;

        // Ungültiger Graph
        }else{                                       
            statusID = 2;
            validGraph = false;
            if(debugConsole) console.log("Invalid graph: Graph is not eulerian or semi eulerian");
            return false;
        }

    };

    /**
     * Zeige Fehlermeldung bei ungültigem Graph an
     * StatusID: 2
     * @method
     */
    this.invalidGraph = function() {
        this.markPseudoCodeLine([15]);
        $("#ta_div_statusErklaerung").html('<h3 style="color: white;">2 '+LNG.K('algorithm_status2_head')+'</h3>\
            <p style="color: white;">'+LNG.K('algorithm_status2_desc6')+'</p>\
            <ul style="color: white;">\
            <li>'+LNG.K('algorithm_status2_desc2')+'</li>\
            <li>'+LNG.K('algorithm_status2_desc3')+'</li>\
            <li>'+LNG.K('algorithm_status2_desc4')+'</li>\
            </ul>').addClass("ui-state-error");

        if(fastForwardIntervalID != null) {
            this.stopFastForward();
        }

        $("#ta_button_1Schritt").button("option", "disabled", true);
        $("#ta_button_vorspulen").button("option", "disabled", true);
        $("#ta_button_Zurueck").button("option", "disabled", true);

        return true;

    };

    /**
     * Klick Handler zur Auswahl des Startknotens
     * @method
     * @param  {jQuery.Event} e jQuery Click Event
     */
    this.canvasClickHandler = function(e) {
        if(semiEulerianGraph) {
            return;
        }
        var mx = e.pageX - canvas.offset().left;
        var my = e.pageY - canvas.offset().top;
        for(var knotenID in graph.nodes) {
            if (graph.nodes[knotenID].contains(mx, my)) {
                if(tourStartVertex != null) {
                    graph.nodes[tourStartVertex].setLayout("fillStyle", const_Colors.NodeFilling);
                }
                this.selectStartVertex(knotenID);
                break;
            }
        }
    };

    /**
     * Wähle neuen Startknoten
     * @method
     * @param  {Number} knotenID ID des Startknotens
     */
    this.selectStartVertex = function(knotenID) {
        tourStartVertex = knotenID;
        graph.nodes[knotenID].setLayout("fillStyle", const_Colors.NodeFillingLight);
        tourCurrentVertex = tourStartVertex;

        eulerianSubTour = new Array();
        this.addVertexToTour(graph.nodes[tourCurrentVertex], eulerianSubTour);
        if(debugConsole) console.log("Subtour: ", eulerianSubTour);

        eulerianTour = new Array();
        this.addVertexToTour(graph.nodes[tourCurrentVertex], eulerianTour);
        if(debugConsole) console.log("Tour: ", eulerianTour);

        this.needRedraw = true;
        this.updatePseudoCodeValues();
    };

    /**
     * Finde Startknoten für neue Subtour
     * StatusID 3
     * @method
     */
    this.findStartingVertex = function() {
        this.markPseudoCodeLine([3, 4, 6, 7]);
        if(!semiEulerianGraph) {
            $("#ta_div_statusErklaerung").html('<h3>3 '+LNG.K('algorithm_status3_head')+'</h3>\
            <h3>3.1a '+LNG.K('algorithm_status31A_head')+'</h3>\
            <p>'+LNG.K('algorithm_status31A_desc1')+'</p>\
            <p>'+LNG.K('algorithm_status31A_desc2')+'</p>\
            <p>'+LNG.K('algorithm_status31A_desc4')+'</p>');

            // Erlaube Auswahl der Startknotens im eulerschen Fall
            canvas.on("click.HAlgorithm", function(e) { algo.canvasClickHandler(e); });
        }else{
            $("#ta_div_statusErklaerung").html('<h3>3 '+LNG.K('algorithm_status3_head')+'</h3>\
            <h3>3.1a '+LNG.K('algorithm_status31A_head')+'</h3>\
            <p>'+LNG.K('algorithm_status31A_desc1')+'</p>\
            <p>'+LNG.K('algorithm_status31A_desc3')+'</p>\
            <p>'+LNG.K('algorithm_status31A_desc5')+'</p>');  
        }

        $("#tab_ta").find(".LegendeText").html('<table>\
            <tr><td class="LegendeTabelle"><img src="img/startknoten2.png" alt="Knoten" class="LegendeIcon" width="22" height="22"></td><td><span>'+LNG.K('algorithm_legende_start2')+'</span></td></tr>\
            <tr><td class="LegendeTabelle"><img src="img/startknoten.png" alt="Knoten" class="LegendeIcon" width="22" height="22"></td><td><span>'+LNG.K('algorithm_legende_start')+'</span></td></tr>\
            <tr><td class="LegendeTabelle"><div class="legendePath" style="background-color:'+tourColors[tourColorIndex]+'"></div></td><td><span>'+LNG.K('algorithm_legende_edgecolor')+'</span></td></tr>\
        </table>');

        // Setze Knotennamen
        this.addNamingLabels();

        // Setze Startknoten und aktuellen Knoten
        if(semiEulerianGraph) {
            tourStartVertex = tourStartOddVertex;
            this.selectStartVertex(tourStartOddVertex);
        }else{
            for (var knotenID in graph.nodes) {
                this.selectStartVertex(knotenID);
                break;
            };
        }

        statusID = 4;

        return true;

    };

    /**
     * Finde nächsten Knoten in Subtour
     * StatusID: 4
     * @method
     */
    this.findNextVertexForTour = function() {
        this.markPseudoCodeLine([9, 10, 11]);
        canvas.off(".HAlgorithm");

        $("#ta_div_statusErklaerung").html('<h3>3 '+LNG.K('algorithm_status3_head')+'</h3>\
            <h3>3.2 '+LNG.K('algorithm_status32_head')+'</h3>\
            <p>'+LNG.K('algorithm_status32_desc1')+'</p>\
            <p>'+LNG.K('algorithm_status32_desc2')+'(<span style="font-weight: bold; color: '+tourColors[tourColorIndex]+';">'+LNG.K('algorithm_status32_desc3')+'</span>)'+LNG.K('algorithm_status32_desc4')+'</p>\
            <p>'+LNG.K('algorithm_status32_desc5')+'</p>');

        var outEdges = graph.nodes[tourCurrentVertex].getOutEdges();
        var inEdges = graph.nodes[tourCurrentVertex].getInEdges();

        var nextEdge = null;

        // Finde erste unbesuchte Kante
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

        // Springe zu Merge, wenn es keine unbesuchte Kante mehr gibt
        if(nextEdge === null) {
            statusID = 6;
            return false;
        }

        this.addEdgeToTour(graph.edges[nextEdge], eulerianSubTour);
        if(debugConsole) console.log("Subtour: ", eulerianSubTour);

        if(tourCurrentVertex !== tourStartVertex) {
            graph.nodes[tourCurrentVertex].setLayout("fillStyle", const_Colors.NodeFilling);
        }

        // Finde Knoten am anderen Ende der Kante
        if(graph.edges[nextEdge].getSourceID() == tourCurrentVertex) {
            tourCurrentVertex = graph.edges[nextEdge].getTargetID();
        }else{
            tourCurrentVertex = graph.edges[nextEdge].getSourceID();
        }

        this.addVertexToTour(graph.nodes[tourCurrentVertex], eulerianSubTour);
        if(debugConsole) console.log("Subtour: ", eulerianSubTour);

        graph.nodes[tourCurrentVertex].setLayout("fillStyle", const_Colors.NodeFillingHighlight);

        statusID = 5;

        return true;

    };

    /**
     * Prüfe ob aktuelle Subtour einen Kreis bildet
     * StatusID: 5
     * @method
     */
    this.compareVertexWithStart = function() {
        this.markPseudoCodeLine([12]);

        if(tourStartVertex == tourCurrentVertex) {
            $("#ta_div_statusErklaerung").html('<h3>3 '+LNG.K('algorithm_status3_head')+'</h3>\
            <h3>3.3 '+LNG.K('algorithm_status33_head')+'</h3>\
            <p>'+LNG.K('algorithm_status33_desc1')+'</p>\
            <h3>3.3.1 '+LNG.K('algorithm_status33_desc2')+'</h3>\
            <p>'+LNG.K('algorithm_status33_desc3')+'</p>');
        }else{
            $("#ta_div_statusErklaerung").html('<h3>3 '+LNG.K('algorithm_status3_head')+'</h3>\
            <h3>3.3 '+LNG.K('algorithm_status33_head')+'</h3>\
            <p>'+LNG.K('algorithm_status33_desc1')+'</p>\
            <h3>3.3.2 '+LNG.K('algorithm_status33_desc4')+'</h3>\
            <p>'+LNG.K('algorithm_status33_desc5')+'</p>');
        }

        //graph.nodes[tourStartVertex].setLayout("fillStyle", const_Colors.NodeFillingHighlight);

        if(debugConsole) console.log("Start: " + tourStartVertex + ", Current: "+ tourCurrentVertex);

        if(tourStartVertex == tourCurrentVertex) {
            statusID = 6;
            return true;
        }else{
            statusID = 4;
            return false;
        }

    };

    /**
     * Integriere Subtour in die Gesamttour
     * StatusID: 6
     * @method
     */
    this.mergeTour = function() {
        this.markPseudoCodeLine([13]);

        if(JSON.stringify(eulerianSubTour[0]) !== JSON.stringify(eulerianSubTour[(eulerianSubTour.length - 1)])) {
            // Subweg
            $("#ta_div_statusErklaerung").html('<h3>4 '+LNG.K('algorithm_status4_head')+'</h3>\
            <h3>4.1 '+LNG.K('algorithm_status41_head')+'</h3>\
            <p>'+LNG.K('algorithm_status41_desc1')+'</p>\
            <h3>4.1.2 '+LNG.K('algorithm_status41_desc4')+'</h3>\
            <p>'+LNG.K('algorithm_status41_desc5')+'</p>');
        }else{
            // Subtour
            $("#ta_div_statusErklaerung").html('<h3>4 '+LNG.K('algorithm_status4_head')+'</h3>\
            <h3>4.1 '+LNG.K('algorithm_status41_head')+'</h3>\
            <p>'+LNG.K('algorithm_status41_desc1')+'</p>\
            <h3>4.1.1 '+LNG.K('algorithm_status41_desc2')+'</h3>\
            <p>'+LNG.K('algorithm_status41_desc3')+'</p>');
        }

        // Füge fertige Subtour in die Liste der Subtouren ein
        subtours.push({color: tourColorIndex, tour: eulerianSubTour});
        if(debugConsole) console.log("Subtours", subtours);

        // Wähle nächste Subtourfarbe
        tourColorIndex++;
        tourColorIndex = tourColorIndex % tourColors.length;

        graph.nodes[tourStartVertex].setLayout("fillStyle", const_Colors.NodeFilling);
        graph.nodes[tourCurrentVertex].setLayout("fillStyle", const_Colors.NodeFilling);

        var replaced = false;

        // Merge bei leerer Eulertour
        if(eulerianTour.length === 0) {
            eulerianTour = eulerianSubTour;   
        // Merge im semieulerschen Graph, wenn Subtour kein Kreis       
        }else if(JSON.stringify(eulerianSubTour[0]) !== JSON.stringify(eulerianSubTour[(eulerianSubTour.length - 1)])) {
            if(debugConsole) console.log("Spezialfall mit 2 Odd Vertices");

            var startOfSubTour = eulerianSubTour[0];
            var newTour = new Array();
            var specialLast = null;

            for(var i = 0; i < eulerianTour.length; i++) {
                if(JSON.stringify(eulerianTour[i]) === JSON.stringify(startOfSubTour)) {
                    specialLast = i;
                }
            }

            for(var i = 0; i < eulerianTour.length; i++) {
                if(specialLast == i) {
                    for(var j = 0; j < eulerianSubTour.length; j++) {
                        newTour.push(eulerianSubTour[j]);
                    }
                    replaced = true;
                }else{
                    newTour.push(eulerianTour[i]);
                }
            }

            eulerianTour = newTour;

        // Regulärer Merge
        }else{
            var startOfSubTour = eulerianSubTour[0];
            var newTour = new Array();

            for(var i = 0; i < eulerianTour.length; i++) {
                if(JSON.stringify(eulerianTour[i]) == JSON.stringify(startOfSubTour) && !replaced) {
                    for(var j = 0; j < eulerianSubTour.length; j++) {
                        /* if(eulerianSubTour[j].type == "edge") {
                            graph.edges[eulerianSubTour[j].id].setLayout("lineColor", tourColors[0]);
                        } */
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

    /**
     * Prüfe ob Eulertour vollständig ist
     * StatusID: 7
     * @method
     */
    this.checkForeulerianTour = function() {
        this.markPseudoCodeLine([14]);
        $("#ta_div_statusErklaerung").html('<h3>4 '+LNG.K('algorithm_status4_head')+'</h3>\
            <h3>4.2 '+LNG.K('algorithm_status42_head')+'</h3>\
            <p>'+LNG.K('algorithm_status42_desc1')+'</p>\
            <p>'+LNG.K('algorithm_status42_desc2')+'</p>\
            <p>'+LNG.K('algorithm_status42_desc3')+'</p>\
            <p>'+LNG.K('algorithm_status42_desc4')+'</p>');
        $("#tab_ta").find(".LegendeText").html('<table>\
            <tr><td class="LegendeTabelle"><img src="img/startknoten2.png" alt="Knoten" class="LegendeIcon" width="22" height="22"></td><td><span>'+LNG.K('algorithm_legende_start2')+'</span></td></tr>\
            <tr><td class="LegendeTabelle"><img src="img/startknoten.png" alt="Knoten" class="LegendeIcon" width="22" height="22"></td><td><span>'+LNG.K('algorithm_legende_start')+'</span></td></tr>\
            <tr><td class="LegendeTabelle"><div class="legendePath" style="background-color:'+tourColors[tourColorIndex]+'"></div></td><td><span>'+LNG.K('algorithm_legende_edgecolor')+'</span></td></tr>\
        </table>');

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

    /**
     * Zeige Ergebnisseite mit vollständiger Eulertour an
     * StatusID: 8
     * @method
     */
    this.returnTour = function() {
        this.markPseudoCodeLine([15]);
        if(semiEulerianGraph) {
            $("#ta_div_statusErklaerung").html('<h3>5 '+LNG.K('algorithm_status5_head')+'</h3>\
            <p>'+LNG.K('algorithm_status5_desc1a')+'</p>');
        }else{
           $("#ta_div_statusErklaerung").html('<h3>5 '+LNG.K('algorithm_status5_head')+'</h3>\
            <p>'+LNG.K('algorithm_status5_desc1b')+'</p>'); 
        }

        var output = "";

        for(var i = 0; i < eulerianTour.length; i++) {
            if(eulerianTour[i].type == "vertex") {
                output += graph.nodes[eulerianTour[i].id].getLabel();
            }
            if(eulerianTour[i].type == "edge") {
                var layout = graph.edges[eulerianTour[i].id].getLayout();
                output += ' <span style="color: '+layout.lineColor+';">&#8211;</span> ';
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
                    output_subtours += "&#8211;"+graph.nodes[cur['tour'][j].id].getLabel();
                }
            }
            output_subtours += '</li>';
        }

        if(semiEulerianGraph) {
            if(debugConsole) console.log("Complete Eulerian Trail: ", eulerianTour);

            $("#ta_div_statusErklaerung").append('<h3>5.1 '+LNG.K('algorithm_status51a_head')+'</h3>\
            <p class="result_euleriantour">' + output + '</p>\
            <p>'+LNG.K('algorithm_status51a_desc1')+'</p>\
            <p><button id="animateTour">'+LNG.K('algorithm_status51a_desc2')+'</button><button id="animateTourStop">'+LNG.K('algorithm_status51a_desc3')+'</button></p>\
            <p>'+LNG.K('algorithm_status51a_desc4')+'</p>\
            <h3>5.2 '+LNG.K('algorithm_status52_head')+'</h3>\
            <ul class="subtourList result_subtour">'+output_subtours+'</ul>\
            <p>'+LNG.K('algorithm_status52_desc1')+'</p>\
            <p></p><h3>'+LNG.K('algorithm_msg_finish')+'</h3>\
            <button id="ta_button_gotoIdee">'+LNG.K('algorithm_btn_more')+'</button>\
            <h3>'+LNG.K('algorithm_msg_test')+'</h3>\
            <button id="ta_button_gotoFA1">'+LNG.K('algorithm_btn_exe1')+'</button>\
            <button id="ta_button_gotoFA2">'+LNG.K('algorithm_btn_exe2')+'</button>');

        }else{
            if(debugConsole) console.log("Complete Eulerian Circle: ", eulerianTour);

            $("#ta_div_statusErklaerung").append('<h3>5.1 '+LNG.K('algorithm_status51b_head')+'</h3>\
            <p class="result_euleriantour">' + output + '</p>\
            <p>'+LNG.K('algorithm_status51b_desc1')+'</p>\
            <p><button id="animateTour">'+LNG.K('algorithm_status51b_desc2')+'</button><button id="animateTourStop">'+LNG.K('algorithm_status51b_desc3')+'</button></p>\
            <p>'+LNG.K('algorithm_status51b_desc4')+'</p>\
            <h3>5.2 '+LNG.K('algorithm_status52_head')+'</h3>\
            <ul class="subtourList result_subtour">'+output_subtours+'</ul>\
            <p>'+LNG.K('algorithm_status52_desc1')+'</p>\
            <p></p><h3>'+LNG.K('algorithm_msg_finish')+'</h3>\
            <button id="ta_button_gotoIdee">'+LNG.K('algorithm_btn_more')+'</button>\
            <h3>'+LNG.K('algorithm_msg_test')+'</h3>\
            <button id="ta_button_gotoFA1">'+LNG.K('algorithm_btn_exe1')+'</button>\
            <button id="ta_button_gotoFA2">'+LNG.K('algorithm_btn_exe2')+'</button>');
        }  


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
     * Fine neuen Startknoten für nöchste Subtour
     * StatusID: 9
     * @method
     */
    this.findNewStartingVertex = function() {
        this.markPseudoCodeLine([6, 7]);
        $("#ta_div_statusErklaerung").html('<h3>3 '+LNG.K('algorithm_status3_head')+'</h3>\
            <h3>3.1b '+LNG.K('algorithm_status31B_head')+'</h3>\
            <p>'+LNG.K('algorithm_status31B_desc1')+'</p>\
            <p>'+LNG.K('algorithm_status31B_desc2')+'</p>');

        eulerianSubTour = new Array();

        for(var i = 0; i < eulerianTour.length; i++) {
            
            if(eulerianTour[i].type == "vertex") {
                if(graph.nodes[eulerianTour[i].id].getUnvisitedDegree() > 0) {
                    tourStartVertex = eulerianTour[i].id;
                    graph.nodes[eulerianTour[i].id].setLayout("fillStyle", const_Colors.NodeFillingLight);
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
HAlgorithm.prototype = new CanvasDrawer;
HAlgorithm.prototype.constructor = HAlgorithm;