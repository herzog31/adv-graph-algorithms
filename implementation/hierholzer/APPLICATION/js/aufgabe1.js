/**
 * @author Richard Stotz
 * Code für Forschungsaufgabe 1<br>
 * Basiert auf dem Code für den normalen Algorithmus
 */

/**
 * Instanz der Forschungsaufgabe 1
 * @constructor
 * @param {Graph} p_graph Graph, auf dem der Algorithmus ausgeführt wird
 * @param {Object} p_canvas jQuery Objekt des Canvas, in dem gezeichnet wird.
 * @param {Object} p_tab jQuery Objekt des aktuellen Tabs.
 * @augments CanvasDrawer
 */
function Forschungsaufgabe1(p_graph,p_canvas,p_tab) {
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
    var canvas = this.canvas;
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
     * @type Forschungsaufgabe1
     */
    var algo = this;
    
    var debugConsole = true;
    var tourStartVertex = null;
    var tourStartOddVertex = null;
    var tourCurrentVertex = null;
    var semiEuclideanGraph = false;
    var validGraph = false;
    var euclideanTour = new Array();
    var euclideanTourEmpty = true;
    var euclideanSubTour = new Array();
    var subtours = new Array();
    var currentPseudoCodeLine = 1;
    var tourColors = new Array("#0000cc", "#006600", "#990000", "#999900", "#cc6600", "#660099", "#330000");
    var tourColorIndex = 0;
    var tourAnimationIndex = 0; 
    var tourAnimation = null;

    var algorithmStatusCache = null;
    var currentQuestion = 0;
    var currentQuestionType = 0;
    var questions = new Array();

    var statusArray = [ {"key": 0, "answer": "1 Initialisierung"},
                        {"key": 1, "answer": "2 Graph prüfen"},
                        {"key": 2, "answer": "Graph ist ungültig"},
                        {"key": 3, "answer": "3.1a Ersten Startknoten finden"},
                        {"key": 4, "answer": "3.2 Unbesuchten Nachbarn finden"},
                        {"key": 5, "answer": "3.3 Auf Kreis prüfen"},
                        {"key": 6, "answer": "4.1 Integriere Subtour in Gesamttour"},
                        {"key": 7, "answer": "4.2 Gesamttour auf Vollständigkeit prüfen"},
                        {"key": 8, "answer": "5 Ergebnis anzeigen"},
                        {"key": 9, "answer": "3.1b Neuen Startknoten finden"}];
    
    /**
     * Startet die Ausführung des Algorithmus.
     * @method
     */
    this.run = function() {
        this.initCanvasDrawer();
        // Die Buttons werden erst im Javascript erstellt, um Problemen bei der mehrfachen Initialisierung vorzubeugen.
        $("#tf1_div_abspielbuttons").append("<button id=\"tf1_button_1Schritt\">"+LNG.K('algorithm_btn_next')+"</button><br>"
                        +"<button id=\"tf1_button_vorspulen\">"+LNG.K('aufgabe1_btn_next_question')+"</button>"
                        +"<button id=\"tf1_button_stoppVorspulen\">"+LNG.K('algorithm_btn_paus')+"</button>");
        $("#tf1_button_stoppVorspulen").hide();
        $("#tf1_button_1Schritt").button({icons:{primary: "ui-icon-seek-end"}, disabled: false});
        $("#tf1_button_vorspulen").button({icons:{primary: "ui-icon-seek-next"}, disabled: false});
        $("#tf1_button_stoppVorspulen").button({icons:{primary: "ui-icon-pause"}});
        $("#tf1_div_statusTabs").tabs();
        $(".marked").removeClass("marked");
        $("#tf1_p_l1").addClass("marked");
        $("#tf1_tr_LegendeClickable").removeClass("greyedOutBackground");

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
        var algo = new Forschungsaufgabe1($("body").data("graph"),$("#tf1_canvas_graph"),$("#tab_tf1"));
        $("#tab_tf1").data("algo",algo);
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
     * Nutzt den Event Namespace ".Forschungsaufgabe1"
     * @method
     */
    this.registerEventHandlers = function() {
        $("#tf1_button_1Schritt").on("click.Forschungsaufgabe1",function() {algo.singleStepHandler();});
        $("#tf1_button_vorspulen").on("click.Forschungsaufgabe1",function() {algo.fastForwardAlgorithm();});
        $("#tf1_button_stoppVorspulen").on("click.Forschungsaufgabe1",function() {algo.stopFastForward();});
    };
    
    /**
     * Entferne die Eventhandler von Buttons und canvas im Namespace ".Forschungsaufgabe1"
     * @method
     */
    this.deregisterEventHandlers = function() {
        canvas.off(".Forschungsaufgabe1");
        $("#tf1_button_1Schritt").off(".Forschungsaufgabe1");
        $("#tf1_button_vorspulen").off(".Forschungsaufgabe1");
        $("#tf1_button_stoppVorspulen").off(".Forschungsaufgabe1");
        $("#tf1_tr_LegendeClickable").off(".Forschungsaufgabe1");
    };

    this.singleStepHandler = function() {
        this.nextStepChoice();
    };

    /**
     * "Spult vor", führt den Algorithmus mit hoher Geschwindigkeit aus.
     * @method
     */
    this.fastForwardAlgorithm = function() {
        $("#tf1_button_vorspulen").hide();
        $("#tf1_button_stoppVorspulen").show();
        $("#tf1_button_1Schritt").button("option", "disabled", true);
        var geschwindigkeit = 200;	// Geschwindigkeit, mit der der Algorithmus ausgeführt wird in Millisekunden

        fastForwardIntervalID = window.setInterval(function(){algo.nextStepChoice();},geschwindigkeit);
    };
    
    /**
     * Stoppt das automatische Abspielen des Algorithmus
     * @method
     */
    this.stopFastForward = function() {
        $("#tf1_button_vorspulen").show();
        $("#tf1_button_stoppVorspulen").hide();
        $("#tf1_button_1Schritt").button("option", "disabled", false);
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

        var previousStatusId = statusID;
        var previousTour = euclideanTour;
        var previousSubtour = euclideanSubTour;
        currentQuestionType = this.askQuestion();

        switch(statusID) {
        case 0:
            this.initializeGraph();
            break;
        case 1:
            this.checkGraph();
            break;
        case 2:
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
            this.showQuestionResults();
            break;
        case 9:
            this.findNewStartingVertex();
            break;
        default:
            console.log("Fehlerhafter State");
            break;
        }

        if(currentQuestionType !== false) {
            if(currentQuestionType === 1) {
                this.generateNextStepQuestion(previousStatusId);
            }else if(currentQuestionType === 2) {
                this.generateSubtourQuestion();
            }else if(currentQuestionType === 3) {
                this.generateTourQuestion(previousTour, previousSubtour);
            }else if(currentQuestionType === 4) {
                this.generateDegreeQuestion();
            }
            this.showQuestionModal();
            this.stopFastForward();
            $("#tf1_button_1Schritt").button("option", "disabled", true);
            $("#tf1_button_vorspulen").button("option", "disabled", true);
            
        }

        this.updatePseudoCodeValues();
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

        if(tourAnimationIndex > 0 && euclideanTour[(tourAnimationIndex - 1)].type == "vertex") {
            graph.nodes[euclideanTour[(tourAnimationIndex - 1)].id].setLayout("fillStyle", const_Colors.NodeFilling);
        }
        if(tourAnimationIndex > 0 && euclideanTour[(tourAnimationIndex - 1)].type == "edge") {
            graph.edges[euclideanTour[(tourAnimationIndex - 1)].id].setLayout("lineWidth", 3);
        }
        this.needRedraw = true;

        if(tourAnimationIndex >= euclideanTour.length) {
            this.animateTourStop(event);
            return;
        }

        if(euclideanTour[tourAnimationIndex].type == "vertex") {
            graph.nodes[euclideanTour[tourAnimationIndex].id].setLayout("fillStyle", const_Colors.NodeFillingHighlight);
        }
        if(euclideanTour[tourAnimationIndex].type == "edge") {
            graph.edges[euclideanTour[tourAnimationIndex].id].setLayout("lineWidth", 6);
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
        if(tourAnimationIndex > 0 && euclideanTour[(tourAnimationIndex - 1)].type == "vertex") {
            graph.nodes[euclideanTour[(tourAnimationIndex - 1)].id].setLayout("fillStyle", const_Colors.NodeFilling);
        }
        if(tourAnimationIndex > 0 && euclideanTour[(tourAnimationIndex - 1)].type == "edge") {
            graph.edges[euclideanTour[(tourAnimationIndex - 1)].id].setLayout("lineWidth", 3);
        }
        event.data.org.needRedraw = true;
        tourAnimationIndex = 0;
        window.clearInterval(tourAnimation);
        tourAnimation = null;
        $("#animateTour").button("option", "disabled", false);
        $("#animateTourStop").button("option", "disabled", true);
        return;
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
        $("#tf1_p_l"+line).addClass('marked');
    };

    this.updatePseudoCodeValues = function() {
        if(tourStartVertex != null) {
            $("#tf1_td_tourStartVertex").html(graph.nodes[tourStartVertex].getLabel());
        }else{
            $("#tf1_td_tourStartVertex").html("-");
        }
        if(tourCurrentVertex != null) {
            $("#tf1_td_tourCurrentVertex").html(graph.nodes[tourCurrentVertex].getLabel());
        }else{
            $("#tf1_td_tourCurrentVertex").html("-");
        }
        if(euclideanSubTour.length == 0) {
            $("#tf1_td_euclideanSubtour").html("&#8709;");
        }else{
            var subtour = new Array();
            for(var i = 0; i < euclideanSubTour.length; i++) {
                if(euclideanSubTour[i].type == "vertex") {
                    subtour.push(graph.nodes[euclideanSubTour[i].id].getLabel());
                }
            }
            $("#tf1_td_euclideanSubtour").html("{" + subtour.join(',') + "}");
        }
        if(euclideanTour.length == 0) {
            $("#tf1_td_euclideanTour").html("&#8709;");
        }else{
            var tour = new Array();
            for(var i = 0; i < euclideanTour.length; i++) {
                if(euclideanTour[i].type == "vertex") {
                    tour.push(graph.nodes[euclideanTour[i].id].getLabel());
                }
            }
            $("#tf1_td_euclideanTour").html("{" + tour.join(',') + "}");
        }
        

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

        $("#tf1_div_statusErklaerung").html('<h3>1 Initialisierung</h3>\
            <p>Um besser mit dem Graphen arbeiten können, haben wir seine Knoten mittels Buchstaben beschriftet.</p>\
            <p>Der Algorithmus muss bei der Ausführung prüfen können, welche Kanten er schon besucht hat. Wir benutzen dafür die derzeitig noch leere Menge besuchter Kanten (vgl. Pseudocode).</p>');

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
    this.checkGraph = function() {
        this.markPseudoCodeLine(3);
        $("#tf1_div_statusErklaerung").html('<h3>2 Graph prüfen</h3>\
            <p>Nur wenn unser Graph die folgenden Eigenschaften aufweist, kann der Hierholzer Algorithmus funktionieren:</p>\
            <h3>2.1 Anzahl der Knoten</h3>\
            <p>Damit ein Kantenweg im Graph existieren kann, muss dieser mindestens <em>zwei</em> zusammenhängende Knoten besitzen.</p>\
            <h3>2.2 Zusammenhängend</h3>\
            <p>Um einen Kantenweg über alle Kanten im Graph zu ermitteln, muss man natürlich auch alle Kanten im Graph erreichen können. Dazu muss dieser zusammenhängend sein. Diese Eigenschaft prüft man bspw. mit einer Breitensuche.</p>\
            <h3>2.3 Grad</h3>\
            <p>Der Hierholzer Algorithmus stellt strenge Voraussetzungen an den Grad der Knoten. Der Grad eines Knoten beschreibt die Anzahl seiner Kanten. Zur Veranschaulichung haben wir jeden Knoten mit seinem Grad beschriftet. Ein <span style="font-weight: bold; color: green;">grüner</span> Rahmen bedeutet, dass der Grad gerade ist, während ein <span style="font-weight: bold; color: red;">roter</span> Rahmen auf einen ungeraden Grad hinweist.</p>\
            <p>Ein Graph dessen Knoten alle einen geraden Grad aufweisen, nennt man <em>eulersch</em>. Trifft dies auf alle außer exakt zwei Knoten zu, so spricht man von einem <em>semi-eulerschen</em> Graph.</p>\
            <p>Damit der Hierholzer Algorithmus funktioniert muss der Graph entweder eulersch oder semi-eulersch sein.</p>');
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

        var reachableVertices = this.performBFS();      // Graph connected
        if(Utilities.objectSize(graph.nodes) != reachableVertices.length) {
            statusID = 2;
            validGraph = false;
            if(debugConsole) console.log("Invalid graph: Unconnected graph detected");
            return false;
            
        }

        for(var knotenID in graph.nodes) {
            var degree = graph.nodes[knotenID].getDegree();
            //graph.nodes[knotenID].setLabel(degree);
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
        $("#tf1_div_statusErklaerung").html('<h3 style="color: white;">2 Graph prüfen</h3>\
            <p style="color: white;">Dein Graph erfüllt mindestens eine der folgenden Eigenschaften nicht:</p>\
            <ul style="color: white;">\
            <li>mind. 2 Knoten</li>\
            <li>zusammenhängend</li>\
            <li>eulersch oder semi-eulersch</li>\
            </ul>').addClass("ui-state-error");

        if(fastForwardIntervalID != null) {
            this.stopFastForward();
        }

        $("#tf1_button_1Schritt").button("option", "disabled", true);
        $("#tf1_button_vorspulen").button("option", "disabled", true);

        return true;

    };

    // Selectiere Start Vertice, entweder #1 (Euclidisch) oder #1 mit ungeradem Grad (Semi Euclidisch)
    this.findStartingVertex = function() {
        this.markPseudoCodeLine(5);
        $("#tf1_div_statusErklaerung").html('<h3>3 Subtour bestimmen</h3>\
            <h3>3.1a Ersten Startknoten finden</h3>\
            <p>Damit der Algorithmus mit der ersten Subtour starten kann, benötigt er einen Startknoten. Hierfür unterscheidet man zwei Fälle:</p>\
            <p><strong>Eulerscher Graph:</strong> Wähle beliebigen Knoten.</p>\
            <p><strong>Semi-eulerscher Graph:</strong> Wähle einen der beiden Knoten mit ungeradem Grad.</p>\
            <p>Der ausgewählte und damit aktive Knoten wurde <span style="font-weight: bold; color: green;">grün</span> markiert.</p>');
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
        this.markPseudoCodeLine(7);
        $("#tf1_div_statusErklaerung").html('<h3>3 Subtour bestimmen</h3>\
            <h3>3.2 Unbesuchten Nachbarn finden</h3>\
            <p>Um die nächste Kante in unserer Subtour zu bestimmen, betrachten wir zunächst alle Kanten des zuletzt aktiven Knotens.</p>\
            <p>Aus dieser Kantenmenge wählen wir nun die Kanten aus, die wir noch nicht besucht haben. Aus dieser Restmenge bestimmen wir eine zufällige Kante (<span style="font-weight: bold; color: '+tourColors[tourColorIndex]+';">farblich markiert</span>).</p>\
            <p>Wir fügen diese Kante zu unserer Subtour hinzu sowie zur Menge der besuchten Kanten hinzu. Wir folgen der Kante und erhalten unseren nächsten aktiven Knoten (<span style="font-weight: bold; color: green;">grün</span>).</p>\
            <h3>3.2.1 Sonderfall</h3>\
            <p>Bei semi-eulerschen Graphen kann es zu dem Sonderfall kommen, dass der aktive Knoten keine weiteren unbesuchten Kanten besitzt. In diesem Fall springen wir direkt zu <em>Schritt 4.1</em>.</p>');

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
        this.markPseudoCodeLine(8);
        $("#tf1_div_statusErklaerung").html('<h3>3 Subtour bestimmen</h3>\
            <h3>3.3 Kreis entdecken</h3>\
            <p>Um zu prüfen, ob unsere Subtour abgeschlossen ist (d.h. sie bildet einen Kreis), vergleichen wir den aktiven Knoten mit dem ersten Knoten der Subtour. Beide sind <span style="font-weight: bold; color: green;">grün</span> markiert.</p>\
            <h3>3.3.1 Abgeschlossen</h3>\
            <p>Handelt es sich bei beiden um den selben Knoten, ist unsere Subtour abgeschlossen und wir fahren mit <em>Schritt 4</em> fort.</p>\
            <h3>3.3.2 Nicht abgeschlossen</h3>\
            <p>Handelt es sich um zwei verschiedene Knoten, ist unsere Subtour unvollständig und wir springen zurück zu <em>Schritt 3.2</em>.</p>');

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
        this.markPseudoCodeLine(9);
        $("#tf1_div_statusErklaerung").html('<h3>4 Gesamttour bestimmen</h3>\
            <h3>4.1 Integriere Subtour in Gesamttour</h3>\
            <p>Damit der Hierholzer Algorithmus am Ende eine Eulertour bzw. einen Eulerkreis liefert, müssen wir sämtliche Subtouren passend aneinanderhängen. Wir unterscheiden hier drei Fälle:</p>\
            <h3>4.1.1 Erste Subtour</h3>\
            <p>Im einfachsten Fall integrieren wir die letzte Subtour einfach in die noch leere Gesamttour.</p>\
            <h3>4.1.2 Zyklische Subtour</h3>\
            <p>In diesem Fall bildet unsere Subtour einen Kreis. Zum Integrieren, suchen wir den Start- & Endknoten der Subtour in der Gesamttour und ersetzen diesen mit unserer Subtour.</p>\
            <h3>4.1.3 Azyklische Subtour</h3>\
            <p>Dieser Fall tritt nur einmal in einem semi-eulerschen Graph auf. Es handelt sich hierbei um die Subtour, die mit einem Knoten ungeraden Grads beginnt und bei dem zweiten Knoten mit ungeradem Grad endet. Diese Subtour muss so integriert werden, dass der ungerade Knoten, welcher nicht den Anfang der Gesamttour bildet, den Schluss der Gesamttour bildet.</p>');

        subtours.push({color: tourColorIndex, tour: euclideanSubTour});
        if(debugConsole) console.log("Subtours", subtours);

        tourColorIndex++;
        tourColorIndex = tourColorIndex % tourColors.length;

        graph.nodes[tourStartVertex].setLayout("fillStyle", const_Colors.NodeFilling);
        graph.nodes[tourCurrentVertex].setLayout("fillStyle", const_Colors.NodeFilling);

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
        euclideanTourEmpty = false;

        if(debugConsole) console.log("Current Complete Euclidean Tour: ", euclideanTour);

        statusID = 7;

    };

    // Check ob Tour ein Euclidischer Zug ist
    // Anzahl Kanten in Tour gleich Anzahl Kanten im Graph
    // Wenn ja -> returnTour()
    // Wenn nein -> findNewStartingVertex()
    this.checkForEuclideanTour = function() {
        this.markPseudoCodeLine(4);
        $("#tf1_div_statusErklaerung").html('<h3>4 Gesamttour bestimmen</h3>\
            <h3>4.2 Auf Vollständigkeit prüfen</h3>\
            <p>Nach jeder Integration einer Subtour in die Gesamttour müssen wir prüfen, ob unsere Gesamttour vollständig ist und der Algorithmus terminieren kann.</p>\
            <p>Dazu vergleicht man bspw. die Anzahl der Kanten im Graph mit der Anzahl der Kanten in der Gesamttour.</p>\
            <p>Bei Gleichheit terminiert der Algorithmus und gibt die Gesamttour in <em>Schritt 5</em> zurück.</p>\
            <p>Bei Ungleichheit existiert eine weitere Subtour, die gefunden werden muss. Wir springen zurück zu <em>Schritt 3</em>.</p>');

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
        this.markPseudoCodeLine(10);
        $("#tf1_div_statusErklaerung").html('<h3>5 Ergebnis</h3>\
            <p>Der Algorithmus konnte erfolgreich eine Eulertour bzw. einen Eulerkreis bestimmen.</p>');

        var output = "";

        for(var i = 0; i < euclideanTour.length; i++) {
            if(euclideanTour[i].type == "vertex") {
                output += graph.nodes[euclideanTour[i].id].getLabel();
            }
            if(euclideanTour[i].type == "edge") {
                var layout = graph.edges[euclideanTour[i].id].getLayout();
                //output += "<li>{"+graph.nodes[graph.edges[euclideanTour[i].id].getSourceID()].getLabel()+", "+graph.nodes[graph.edges[euclideanTour[i].id].getTargetID()].getLabel()+"}</li>";
                output += ' <span style="color: '+layout.lineColor+';">&#8211;</span> ';
            }
        }

        //output = output.slice(0,-3);

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

        if(semiEuclideanGraph) {
            if(debugConsole) console.log("Complete Euclidean Trail: ", euclideanTour);
        }else{
            if(debugConsole) console.log("Complete Euclidean Circle: ", euclideanTour);
        }  

        $("#tf1_div_statusErklaerung").append('<h3>5.1 Eulertour:</h3>\
            <p class="result_euleriantour">' + output + '</p>\
            <p>Die Eulertour wird hier dargestellt als Folge der Knoten.</p>\
            <p><button id="animateTour">Animiere Eulertour</button><button id="animateTourStop">Stop</button></p>\
            <p>Klicke auf <strong>Animiere Eulertour</strong> um die komplette Eulertour abzulaufen und alle Knoten und Kanten auf dem Weg hervorzuheben.</p>\
            <h3>5.2 Subtouren:</h3>\
            <ul class="subtourList result_subtour">'+output_subtours+'</ul>\
            <p>Bewege deinen Mauszeiger über eine der Subtouren, um sie im Graph hervorzuheben.</p>');

        if(fastForwardIntervalID != null) {
            this.stopFastForward();
        }
        $("#tf1_button_1Schritt").button("option", "disabled", true);
        $("#tf1_button_vorspulen").button("option", "disabled", true);
        $(".subtourList").on("mouseenter", "li.subtour_hover", {org: this}, this.hoverSubtour).on("mouseleave", "li.subtour_hover", {org: this}, this.dehoverSubtour);
        $("#animateTour").button({icons:{primary: "ui-icon-play"}}).click({org: this}, this.animateTour);
        $("#animateTourStop").button({icons:{primary: "ui-icon-stop"}, disabled: true}).click({org: this}, this.animateTourStop);
    };

    // Finde neuen Startpunkt in Tour
    // Erster Knoten, dessen Grad unbesuchter Kanten größer 0 ist -> findNextVertexForTour()
    this.findNewStartingVertex = function() {
        this.markPseudoCodeLine(5);
        $("#tf1_div_statusErklaerung").html('<h3>3 Subtour bestimmen</h3>\
            <h3>3.1b Neuen Startknoten finden</h3>\
            <p>Im Gegensatz zum Finden eines Startknotens für die erste Subtour, gibt es nun keine Fallunterscheidung mehr.</p>\
            <p>Wir können einen beliebigen Knoten wählen, der an unbesuchte Kanten grenzt.</p>\
            <p>Dieser Knoten bildet den Start der neuen Subtour und wurde <span style="font-weight: bold; color: green;">grün</span> markiert.</p>');

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

    this.showQuestionModal = function() {
        $("#tf1_div_statusTabs").hide();
        $("#tf1_div_questionModal").show();
        $("#tf1_questionSolution").hide();
    };

    this.closeQuestionModal = function() {
        $("#tf1_div_statusTabs").show();
        $("#tf1_div_questionModal").hide();
        $("#tf1_button_questionClose").off();
        $("#tf1_button_1Schritt").button("option", "disabled", false);
        $("#tf1_button_vorspulen").button("option", "disabled", false);
    };

    this.saveAnswer = function() {
        var givenAnswer = "";
        if(currentQuestionType === 1 || currentQuestionType === 3 || currentQuestionType === 4) {
            givenAnswer = $("#question"+currentQuestion+"_form").find("input[type='radio']:checked").val();
        }else if(currentQuestionType === 2) {
            givenAnswer = $("#question"+currentQuestion+"_form").find("input[type='text']").val();
            givenAnswer = givenAnswer.replace(/(\s|\,)+/g,'');
        }

        if(questions[currentQuestion].type === 1) { // Next Step
            for (var i = 0; i < statusArray.length; i++) {
                if(statusArray[i].key == questions[currentQuestion].rightAnswer) {
                    $("#tf1_questionSolution").find(".answer").html(statusArray[i].answer);
                }
            }
        }else if(questions[currentQuestion].type === 2) { // Subtour
            $("#tf1_questionSolution").find(".answer").html(questions[currentQuestion].rightAnswer.split("").join(","));
        }else if(questions[currentQuestion].type === 3) { // Tour
            $("#tf1_questionSolution").find(".answer").html(questions[currentQuestion].rightAnswer);
        }else if(questions[currentQuestion].type === 4) { // Degree
            $("#tf1_questionSolution").find(".answer").html(questions[currentQuestion].rightAnswer);
        }

        questions[currentQuestion].givenAnswer = givenAnswer;
        if(questions[currentQuestion].givenAnswer == questions[currentQuestion].rightAnswer) {
            if(debugConsole) console.log("Answer given ", givenAnswer, " was right!");
        }else{
            if(debugConsole) console.log("Answer given ", givenAnswer, " was wrong! Right answer was ", questions[currentQuestion].rightAnswer);
        }
        currentQuestion++;

        $("#tf1_questionSolution").show();
        $("#tf1_button_questionClose").hide();
        $("#tf1_button_questionClose2").button("option", "disabled", false);
    };

    this.activateAnswerButton = function() {
        console.log("activate");
        $("#tf1_button_questionClose").button("option", "disabled", false);
    };

    this.generateDegreeQuestion = function() {

        var answers = new Array();
        var nodeKeys = Object.keys(graph.nodes);
        var randomNode = graph.nodes[nodeKeys[nodeKeys.length * Math.random() << 0]];
        var answer = randomNode.getDegree();
        questions[currentQuestion] = {type: currentQuestionType, rightAnswer: answer};
        answers.push(answer);
        var randomAnswers = Array.apply(null, {length: 10}).map(Number.call, Number);
        var answerIndex = randomAnswers.indexOf(answer);
        if (answerIndex > -1) {
            randomAnswers.splice(answerIndex, 1);
        }
        randomAnswers = Utilities.shuffleArray(randomAnswers);
        randomAnswers = randomAnswers.slice(1, 4);
        answers = answers.concat(randomAnswers);
        answers = Utilities.shuffleArray(answers);

        var form = "";
        for(var i = 0; i < answers.length; i++) {
            form += '<input type="radio" id="tf1_input_question'+currentQuestion+'_'+i+'" name="question'+currentQuestion+'" value="'+answers[i]+'" />\
            <label for="tf1_input_question'+currentQuestion+'_'+i+'">'+answers[i]+'</label><br />';
        }
        form = '<form id="question'+currentQuestion+'_form">'+form+'</form>';

        $("#tf1_div_questionModal").html('<div class="ui-helper-reset ui-helper-clearfix ui-widget-header ui-corner-all" style="padding: 7px;">Frage #'+(currentQuestion+1)+'</div>\
            <p>Welchen Grad hat der Knoten <strong>'+randomNode.getLabel()+'</strong>?</p>\
            <p>'+form+'</p>\
            <button id="tf1_button_questionClose">Antworten</button>\
            <p id="tf1_questionSolution">Die korrekte Antwort ist: <span class="answer"></span><br /><br />\
            <button id="tf1_button_questionClose2">Weiter</button>\
            </p>');

        $("#tf1_button_questionClose2").button({disabled: true}).on("click", function() { algo.closeQuestionModal(); });
        $("#tf1_button_questionClose").button({disabled: true}).on("click", function() { algo.saveAnswer(); });
        $("#question"+currentQuestion+"_form").find("input[type='radio']").one("change", function() { algo.activateAnswerButton(); });

    };

    this.generateNextStepQuestion = function(previousStatusId) {

        var answers = [];

        // Create copy of status array
        var statusArrayCopy = $.extend(true, [], statusArray);

        for (var i = 0; i < statusArrayCopy.length; i++) {
            if(statusArrayCopy[i].key == statusID) {
                answers.push(statusArrayCopy[i]);
                statusArrayCopy.splice(i, 1);
            }
        };

        statusArrayCopy = Utilities.shuffleArray(statusArray);
        statusArrayCopy = statusArrayCopy.slice(1, 4);
        answers = answers.concat(statusArrayCopy);
        answers = Utilities.shuffleArray(answers);
        questions[currentQuestion] = {type: currentQuestionType, rightAnswer: statusID};

        var form = "";
        for(var i = 0; i < answers.length; i++) {
            form += '<input type="radio" id="tf1_input_question'+currentQuestion+'_'+i+'" name="question'+currentQuestion+'" value="'+answers[i].key+'" />\
            <label for="tf1_input_question'+currentQuestion+'_'+i+'">'+answers[i].answer+'</label><br />';
        }
        form = '<form id="question'+currentQuestion+'_form">'+form+'</form>';

        $("#tf1_div_questionModal").html('<div class="ui-helper-reset ui-helper-clearfix ui-widget-header ui-corner-all" style="padding: 7px;">Frage #'+(currentQuestion+1)+'</div>\
            <p>Welchen Schritt macht der Algorithmus als nächstes?</p>\
            <p>'+form+'</p>\
            <button id="tf1_button_questionClose">Antworten</button>\
            <p id="tf1_questionSolution">Die korrekte Antwort ist: <span class="answer"></span><br /><br />\
            <button id="tf1_button_questionClose2">Weiter</button>\
            </p>');

        $("#tf1_button_questionClose2").button({disabled: true}).on("click", function() { algo.closeQuestionModal(); });
        $("#tf1_button_questionClose").button({disabled: true}).on("click", function() { algo.saveAnswer(); });
        $("#question"+currentQuestion+"_form").find("input[type='radio']").one("change", function() { algo.activateAnswerButton(); });

    };

    this.generateSubtourQuestion = function() {
        $("#tf1_div_questionModal").html('<div class="ui-helper-reset ui-helper-clearfix ui-widget-header ui-corner-all" style="padding: 7px;">Frage #'+(currentQuestion+1)+'</div>\
            <p>Welche Knoten befinden sich der der aktuellen <strong style="color: '+tourColors[tourColorIndex]+';">Subtour</strong>?<br />\
            Antworte in der Form <em>x,y,z</em> und beachte die Reihenfolge.</p>\
            <p><form id="question'+currentQuestion+'_form">\
            <input type="text" name="question'+currentQuestion+'" value="" placeholder="x,y,z" />\
            </form>\
            </p>\
            <button id="tf1_button_questionClose">Antworten</button>\
            <p id="tf1_questionSolution">Die korrekte Antwort ist: <span class="answer"></span><br /><br />\
            <button id="tf1_button_questionClose2">Weiter</button>\
            </p>');

        var result = "";
        for(var i = 0; i < euclideanSubTour.length; i++) {
            if(euclideanSubTour[i].type == "vertex") {
                result = result+graph.nodes[euclideanSubTour[i].id].getLabel();
            }
        }
        result = result.replace(/(\s|\,)+/g,'');
        questions[currentQuestion] = {type: currentQuestionType, rightAnswer: result};

        $("#tf1_button_questionClose2").button({disabled: true}).on("click", function() { algo.closeQuestionModal(); });
        $("#tf1_button_questionClose").button({disabled: true}).on("click", function() { algo.saveAnswer(); });
        $("#question"+currentQuestion+"_form").find("input[type='text']").one("keyup", function() { algo.activateAnswerButton(); });

    };

    this.generateTourQuestion = function(previousTour, previousSubtour) {

        var prevSubtour = "";
        for(var i = 0; i < previousSubtour.length; i++) {
            if(previousSubtour[i].type == "vertex") {
                prevSubtour = prevSubtour+","+graph.nodes[previousSubtour[i].id].getLabel();
            }
        }
        prevSubtour = prevSubtour.substr(1);

        var prevTour = "";
        for(var i = 0; i < previousTour.length; i++) {
            if(previousTour[i].type == "vertex") {
                prevTour = prevTour+","+graph.nodes[previousTour[i].id].getLabel();
            }
        }
        prevTour = prevTour.substr(1);

        var currentTour = "";
        for(var i = 0; i < euclideanTour.length; i++) {
            if(euclideanTour[i].type == "vertex") {
                currentTour = currentTour+","+graph.nodes[euclideanTour[i].id].getLabel();
            }
        }
        currentTour = currentTour.substr(1);

        var answers = [];
        answers.push(currentTour);
        answers.push(prevSubtour+","+prevTour);
        answers.push(prevTour+","+prevSubtour);

        var wrongSolution = prevTour.split(",");
        var wrongSubSolution = prevSubtour.split(",");
        var replaced = false;
        for(var i = 0; i < wrongSolution.length; i++) {
            if(!replaced && wrongSolution[i] != wrongSubSolution[0] && wrongSolution[i] != wrongSubSolution[(wrongSubSolution.length - 1)]) {
                wrongSolution[i] = prevSubtour;
                replaced = true;
            }
        }
        wrongSolution = wrongSolution.join(",");
        answers.push(wrongSolution);
        answers = Utilities.shuffleArray(answers);

        var form = "";
        for(var i = 0; i < answers.length; i++) {
            form += '<input type="radio" id="tf1_input_question'+currentQuestion+'_'+i+'" name="question'+currentQuestion+'" value="'+answers[i]+'" />\
            <label for="tf1_input_question'+currentQuestion+'_'+i+'">'+answers[i]+'</label><br />';
        }
        form = '<form id="question'+currentQuestion+'_form">'+form+'</form>';

        questions[currentQuestion] = {type: currentQuestionType, rightAnswer: currentTour};

        $("#tf1_div_questionModal").html('<div class="ui-helper-reset ui-helper-clearfix ui-widget-header ui-corner-all" style="padding: 7px;">Frage #'+(currentQuestion+1)+'</div>\
            <p>In diesem Schritt wird die Subtour ('+prevSubtour+') in die Gesamttour ('+prevTour+') integriert. Wie sieht das Ergebnis aus?</p>\
            <p><em>Hinweis: Es gibt u.U. mehrere Lösungsmöglichkeiten, es ist allerdings nur eine der gegebenen Antwortmöglichkeit korrekt.</em></p>\
            <p>'+form+'</p>\
            <button id="tf1_button_questionClose">Antworten</button>\
            <p id="tf1_questionSolution">Die korrekte Antwort ist: <span class="answer"></span><br /><br />\
            <button id="tf1_button_questionClose2">Weiter</button>\
            </p>');

        $("#tf1_button_questionClose2").button({disabled: true}).on("click", function() { algo.closeQuestionModal(); });
        $("#tf1_button_questionClose").button({disabled: true}).on("click", function() { algo.saveAnswer(); });
        $("#question"+currentQuestion+"_form").find("input[type='radio']").one("change", function() { algo.activateAnswerButton(); });

    };

    this.showQuestionResults = function() {

        var correctAnswers = 0;
        var totalQuestions = questions.length;
        var table = "";

        for(var i = 0; i < questions.length; i++) {
            table = table + '<td style="text-align: center;">#'+(i+1)+'</td>';
            if(questions[i].rightAnswer == questions[i].givenAnswer) {
                table = table + '<td><span class="ui-icon ui-icon-plusthick"></span> korrekt</td>';
                correctAnswers++;
            }else{
                table = table + '<td><span class="ui-icon ui-icon-minusthick"></span> falsch</td>';
            }
            table = "<tr>"+table+"</tr>";
        }
        table = '<table class="quizTable"><thead><tr><th>Frage</th><th>Lösung</th></tr></thead><tbody>'+table+'</tbody></table>';

        $("#tf1_div_questionModal").html('<div class="ui-helper-reset ui-helper-clearfix ui-widget-header ui-corner-all" style="padding: 7px;">Ergebnisse</div>\
            <p>Von insgesamt '+totalQuestions+' Fragen hast du '+correctAnswers+' richtig beantwortet!</p>\
            <p>'+table+'</p>\
            <p></p>\
            <button id="tf1_button_questionClose">Schließen</button>');

        $("#tf1_button_questionClose").button().one("click", function() { algo.closeQuestionModal(); });

        this.showQuestionModal();

    };

    this.askQuestion = function() {

        var randomVariable = function(min, max) {
            return Math.random() * (max - min) + min;
        };

        if(statusID == 1) {
            // Frage zum Grad (100%)
            return 4;
        }else if(statusID == 6 && !euclideanTourEmpty) {
            // Frage zum Mergeergebnis (50%)
            if(randomVariable(0, 1) > 0.5) {
                return 3;
            }
        }else if(statusID == 5) {
            // Frage zur Subtour (20%)
            if(randomVariable(0, 1) > 0.8) {
                return 2;
            }
        }else if(statusID !== 2 && statusID !== 8) {
            // Frage zum nächsten Schritt (10%)
            if(randomVariable(1, 10) > 9) {
                return 1;
            }
        }
        return false;

    };

}

// Vererbung realisieren
Forschungsaufgabe1.prototype = new CanvasDrawer;
Forschungsaufgabe1.prototype.constructor = Forschungsaufgabe1;