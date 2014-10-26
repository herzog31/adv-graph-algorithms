/**
 * Instanz des Hopcroft-Karp Algorithmus, erweitert die Klasse CanvasDrawer
 * @constructor
 * @augments CanvasDrawer
 * @param {Graph} p_graph Graph, auf dem der Algorithmus ausgeführt wird
 * @param {Object} p_canvas jQuery Objekt des Canvas, in dem gezeichnet wird.
 * @param {Object} p_tab jQuery Objekt des aktuellen Tabs.
 */
function HKAlgorithm(p_graph,p_canvas,p_tab) {
    CanvasDrawer.call(this,p_graph,p_canvas,p_tab); 
    console.log(p_graph.getDescriptionAsString());
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
     * @type HKAlgorithm
     */
    var algo = this;
    /**
     * Zählt die Phasen / Runden.
     * @type Number
     */
    var weightUpdates = 0;
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
     * Sammelt Information über den aktuellen Weg zum Startknoten, der angezeigt wird<br>
     * Felder: modifiedEdges: Information über die Kanten, deren Layout verändert wurde, altes Layout und ID<br>
     *         nodeID: Id des Knotens, der grade verändert wird.
     * @type Object
     */
    var showWayOfNode = null;
    /**
     * Zeigt an, ob die Vorgängerkanten markiert werden sollen oder nicht.
     * @type Boolean
     */
    var showVorgaenger = true;

    /**
     * Die Distanzwerte der Knoten werden nach und nach auf diesen Stack gepusht.<br>
     * Wird für den "Zurück" Button benötigt.
     * @type Number[]
     */
    var nodeUpdateStack = new Array();
    
    /**
     * Die VorgänerIDs der Knoten werden nach und nach auf diesen Stack gepusht.<br>
     * Wird für den "Zurück" Button benötigt.
     * @type Number[]
     */
    var vorgaengerIDUpdateStack = new Array();

    /**
     * Hier die Variablen vom HK-Algo
     */

    /**
     * Keys: KantenIDs Value: Kanten
     * @type Object
     */
    var matching = new Object();
    
    /**
     * Enthaelt alle freien Knoten (derzeit) der linken Seite
     * Wird als Ausgangspunkt fuer die Erstellung des alternierenden Graphen benutzt.
     * Keys: KnotenIDs Value: Knoten
     * @type Object
     */
    var superNode = new Object();

    var bfsEdges = new Object();

    var shortestPathLength = 0;

    var matched = new Object();

    var disjointPaths = new Array();

    var currentPath = 0;

    /*
    * Hier werden die Statuskonstanten definiert
    * */
    const ALGOINIT = 0;
    const BEGIN_ITERATION = 1;
    const END_ITERATION = 2;
    const NEXT_AUGMENTING_PATH = 3;
    const UPDATE_MATCHING = 4;
    const END_ALGORITHM = 5;

    const MATCHED_EDGE_COLOR = "DarkBlue";
    const MATCHED_NODE_COLOR = const_Colors.NodeFillingHighlight;

    /**
     * Aussehen einer Matching-Kante.
     * @type Object
     */
    var matchedEdge = {'arrowAngle' : Math.PI/8,	// Winkel des Pfeilkopfs relativ zum Pfeilkörper
        'arrowHeadLength' : 15,    // Länge des Pfeilkopfs
        'lineColor' : "blue",		// Farbe des Pfeils
        'lineWidth' : 2,		    // Dicke des Pfeils
        'font'	: 'Arial',		    // Schrifart
        'fontSize' : 14,		    // Schriftgrösse in Pixeln
        'isHighlighted': false     // Ob die Kante eine besondere Markierung haben soll
    };

    /**
     * Aussehen eines Matching-Knotens.
     * @type Object
     */
    var matchedNode = {'fillStyle' : "#D8BFD8",    // Farbe der Füllung
        'nodeRadius' : 15,                         // Radius der Kreises
        'borderColor' : const_Colors.NodeBorder,   // Farbe des Rands (ohne Markierung)
        'borderWidth' : 2,                         // Breite des Rands
        'fontColor' : 'black',                     // Farbe der Schrift
        'font' : 'bold',                           // Schriftart
        'fontSize' : 14                            // Schriftgrösse in Pixeln
    };


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
        var algo = new HKAlgorithm($("body").data("graph"),$("#ta_canvas_graph"),$("#tab_ta"));
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
     * Nutzt den Event Namespace ".HKAlgorithm"
     * @method
     */
    this.registerEventHandlers = function() {
//        canvas.on("click.HKAlgorithm",function(e) {algo.canvasClickHandler(e);});
//        canvas.on("mousemove.HKAlgorithm",function(e) {algo.canvasMouseMoveHandler(e);});
        $("#ta_button_1Schritt").on("click.HKAlgorithm",function() {algo.singleStepHandler();});
        $("#ta_button_vorspulen").on("click.HKAlgorithm",function() {algo.fastForwardAlgorithm();});
        $("#ta_button_stoppVorspulen").on("click.HKAlgorithm",function() {algo.stopFastForward();});
        $("#ta_tr_LegendeClickable").on("click.HKAlgorithm",function() {algo.changeVorgaengerVisualization();});
        $("#ta_button_Zurueck").on("click.HKAlgorithm",function() {algo.previousStepChoice();});
    };
    
    /**
     * Entferne die Eventhandler von Buttons und canvas im Namespace ".HKAlgorithm"
     * @method
     */
    this.deregisterEventHandlers = function() {
        canvas.off(".HKAlgorithm");
        $("#ta_button_1Schritt").off(".HKAlgorithm");
        $("#ta_button_vorspulen").off(".HKAlgorithm");
        $("#ta_button_stoppVorspulen").off(".HKAlgorithm");
        $("#ta_tr_LegendeClickable").off(".HKAlgorithm");
        $("#ta_button_Zurueck").off(".HKAlgorithm");
    };
    
    /**
     * Wird aufgerufen, sobald auf das Canvas geklickt wird. 
     * @param {jQuery.Event} e jQuery Event Objekt, gibt Koordinaten
     */
    this.canvasClickHandler = function(e) {
        if(startNode == null) {
            var mx = e.pageX - canvas.offset().left;
            var my = e.pageY - canvas.offset().top;
            for(var knotenID in graph.nodes) {
                if (graph.nodes[knotenID].contains(mx, my)) {
                    graph.nodes[knotenID].setLayout("fillStyle",const_Colors.NodeFillingHighlight); 
                    graph.nodes[knotenID].setLabel("S");
                    startNode = graph.nodes[knotenID];
                    this.needRedraw = true;
                    $("#ta_div_statusErklaerung").removeClass("ui-state-error");
                    $("#ta_div_statusErklaerung").html("<h3>"+LNG.K('textdb_msg_case5_1')+"</h3>");
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
    this.singleStepHandler = function() {
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
           switch(statusID) {
       case ALGOINIT:
           this.initialize();
           break;
       case BEGIN_ITERATION:
           this.beginIteration();
           break;
       case END_ITERATION:
           this.endIteration();
           break;
       case NEXT_AUGMENTING_PATH:
           this.highlightPath()
           break;
       case UPDATE_MATCHING:
           this.dfsUpdateMatching()
           break;
       case END_ALGORITHM:
           this.endAlgorithm();
           break;
       default:
           //console.log("Fehlerhafte StatusID.");
           break;
       }
       this.needRedraw = true;
   };

    /**
     * Initialisiere den Algorithmus.
     */
    this.initialize = function () {
        for (var knotenID in graph.unodes) {
            superNode[knotenID] = graph.unodes[knotenID];
        }
        statusID = BEGIN_ITERATION;
        // Erklärung im Statusfenster
        $("#ta_div_statusErklaerung").html("<h3>1 "+LNG.K('textdb_msg_init')+"</h3>"
            + "<p>"+LNG.K('textdb_msg_init_1')+"</p>"
            + "<p>"+LNG.K('textdb_msg_init_2')+"</p>"
            + "<p>"+LNG.K('textdb_msg_init_3')+"</p>");
        $(".marked").removeClass("marked");
        $("#ta_p_l2").addClass("marked");
    };

    this.beginIteration = function () {
        disjointPaths = [];
        currentPath = 0;
        shortestPathLength = 0;
        this.bfs();
        this.dfs();
        if(shortestPathLength > 0){
            statusID = NEXT_AUGMENTING_PATH;
            $("#ta_div_statusErklaerung").html("<h3> "+LNG.K('textdb_msg_begin_it')+"</h3>"
                + "<p>"+LNG.K('textdb_msg_path_shortest')+ shortestPathLength + "</p>");
        }
        else{
            statusID = END_ALGORITHM;
            $("#ta_div_statusErklaerung").html("<h3> "+LNG.K('textdb_msg_end_algo')+"</h3>"
                + "<p>"+LNG.K('textdb_msg_end_algo_1')+"</p>");
        }
    };

    this.bfs = function () {
//      Initialize
        var freeNodeFound = false;
        var emptyLayer = false;
        var evenLayer = {};
        var oddLayer = {};
        var examined = {};
        shortestPathLength = 0;
        for (var knotenID in graph.nodes) {
            examined[knotenID] = false;
            bfsEdges[knotenID] = {};
        }
        for (var free in superNode) {
            evenLayer[free] = superNode[free];
        }
//      Iterate
        while (!freeNodeFound && !emptyLayer) {
            shortestPathLength++;
            for (n in evenLayer) {
                var node = evenLayer[n];
                examined[node.getNodeID()] = true;
                //find all adjacent edges
                var edges = node.getOutEdges();
                var inEdges = node.getInEdges();
                for (var e in inEdges) {edges[e] = inEdges[e]; }
                //try all the found edges
                for (var e in edges) {
                    var edge = edges[e];
                    var adj = edge.getTargetID();
                    if (!examined[adj]) {
                        bfsEdges[node.getNodeID()][adj] = edge;
                        if(!oddLayer.hasOwnProperty(adj)) oddLayer[adj] = graph.nodes[adj]; //if not already in the oddLayer then insert
                        if (!matched[adj]) freeNodeFound = true; // if unmatched we found the shortest path
                    }
                }
            }
            if (freeNodeFound) {
                for (var ind in evenLayer) {
                    var node = evenLayer[ind];
                    var children = bfsEdges[node.getNodeID()];
                    for (n in children) {
                        if (matched[n]) {
                            delete children[n];
                        }
                    }
                }
            }
            else if (!Object.keys(oddLayer).length) { // oddLayer is empty
                emptyLayer = true;
                shortestPathLength = 0;
            }
            else {
                evenLayer = {};
                for(var n in oddLayer){
                    var node = oddLayer[n];
                    var partner = matched[node.getNodeID()];
                    var edge = graph.edges[graph.getEdgeBetween(partner,node)];
                    bfsEdges[node.getNodeID()][partner.getNodeID()] = edge;
                    evenLayer[partner.getNodeID()] = partner;
                    examined[node.getNodeID()] = true;
                }
                oddLayer = {};
                shortestPathLength++;
            }
        }
    };

    /*
    * In dieser Funktion wird mittels Tiefensuche nach knotendisjunkten verbessernden Pfaden gesucht
    * @method
    * */
   this.dfs = function(){
       var dfsStack = [];
       for (var node in superNode) {
           var foundAugmentingPath = this.recursiveDfs(superNode[node], dfsStack);
           if (foundAugmentingPath){ //delete the edges in stack from the graph to ensure disjunct paths
               for (var i = 0; i < dfsStack.length-1; i=i+2) {
                   var prev = dfsStack[i];
                   var curr = dfsStack[i+1];
                   var parents = curr.getInEdges();
                   for (e in parents) {
                       var pid = parents[e].getSourceID();
                       delete bfsEdges[pid][curr.getNodeID()];
                   }
               }
               delete superNode[node];
               disjointPaths.push(dfsStack);
           }
           dfsStack = [];
       }
   };
    /*
    * Rekursives Unterprogramm, das fuer die Tiefensuche benutzt wird
    * @method
    * */
   this.recursiveDfs = function (node, stack) {
        stack.push(node);
        if (!matched[node.getNodeID()] && stack.length>1) return true;
        else {
            var children = bfsEdges[node.getNodeID()];
            for (var c in children) {
                if (this.recursiveDfs(graph.nodes[c], stack)) {
                    return true;
                }
            }
        }
        stack.pop();
        return false;
    };

    this.highlightPath = function(){
        var path = disjointPaths[currentPath];
        for(var n in path){
            var node = path[n];
            node.setLayout('borderColor',const_Colors.NodeBorderHighlight);
            node.setLayout('borderWidth',global_NodeLayout.borderWidth*2);
        }
        // TODO Statusfenster
        $("#ta_div_statusErklaerung").html("<h3> "+LNG.K('textdb_msg_path_highlight')+"</h3>");
        statusID = UPDATE_MATCHING;
    };

    var setEdgeMatched = function(edge){
        edge.setLayout("lineColor", MATCHED_EDGE_COLOR);
        edge.setLayout("lineWidth", global_Edgelayout.lineWidth*1.5);
    };

    var setNodeMatched = function(node){
        node.setLayout('fillStyle',MATCHED_NODE_COLOR);
    };

    this.dfsUpdateMatching = function(){
        var path = disjointPaths[currentPath];
        for(var n in path){
            var node = path[n];
            node.restoreLayout();
        }
        for (var i = 0; i < path.length-3; i = i + 2) {
            var evenEdge = graph.edges[graph.getEdgeBetween(path[i],path[i+1])];
            var oddEdge = graph.edges[graph.getEdgeBetween(path[i+2],path[i+1])];
            if(matching.hasOwnProperty(oddEdge.getEdgeID())){
                delete matching[oddEdge.getEdgeID()];
                matching[evenEdge.getEdgeID()] = evenEdge;
                matched[path[i].getNodeID()] =  path[i+1];
                matched[path[i+1].getNodeID()] =  path[i];
                setEdgeMatched(evenEdge);
                oddEdge.restoreLayout();
                setNodeMatched(path[i]);
                setNodeMatched(path[i+1]);
            }
        }
        var lastEdge = graph.edges[graph.getEdgeBetween(path[path.length-2],path[path.length-1])];
        matching[lastEdge.getEdgeID()] = lastEdge;
        matched[path[path.length-2].getNodeID()] =  path[path.length-1];
        matched[path[path.length-1].getNodeID()] =  path[path.length-2];
        setNodeMatched(path[path.length-1]);
        setNodeMatched(path[path.length-2]);
        setEdgeMatched(lastEdge);

        currentPath++;
        if(currentPath < disjointPaths.length){
            statusID = NEXT_AUGMENTING_PATH;
        }
        else statusID = END_ITERATION;
//        TODO Statusfenster
        $("#ta_div_statusErklaerung").html("<h3> "+LNG.K('textdb_msg_update')+"</h3>"
            + "<p>"+LNG.K('textdb_msg_update_1')+ "</p>"
            + "<p>"+LNG.K('textdb_msg_update_2')+ "</p>");
    };


    this.endIteration = function(){
        statusID = BEGIN_ITERATION;
        $("#ta_div_statusErklaerung").html("<h3> "+LNG.K('textdb_msg_end_it')+"</h3>"
            + "<p>"+LNG.K('textdb_msg_end_it_1')+"</p>");
    };

    /**
     * Prüft, ob die aktuelle Kante ein Update benötigt
     * @method
     */
    this.checkEdgeForUpdate = function() {
        if(kantenIDs.length <= nextKantenID) {
            // Alle Kanten betrachtet, beginne nächste Runde
            this.updateWeightsInitialisation();
            return;
        }

        var aktKante = graph.edges[kantenIDs[nextKantenID]];
        // Animation
        aktKante.setLayout("lineColor",const_Colors.EdgeHighlight1);
        aktKante.setLayout("lineWidth",3);
        // Neuer Status -> UpdateSingleNode
        statusID = 3;
        // Erklärung im Statusfenster
        $("#ta_div_statusErklaerung").html("<h3 class=\"greyedOut\">2 "+LNG.K('textdb_msg_case1_1')+"</h3>"
            + "<h3 class=\"greyedOut\"> 2." + weightUpdates.toString() + " " + LNG.K('textdb_text_phase') + " " + weightUpdates.toString() + " " + LNG.K('textdb_text_of') + " " + (Utilities.objectSize(graph.nodes)-1) + "</h3>"
            + "<h3> 2." + weightUpdates.toString() + "." + (nextKantenID+1) + " " +LNG.K('textdb_msg_case1_2')+"</h3>"
            + "<p>"+LNG.K('textdb_msg_case1_3')+"</p>"
            + "<p>"+LNG.K('textdb_msg_case1_4')+"</p>");
        $(".marked").removeClass("marked");
        $("#ta_p_l7").addClass("marked");
        this.showVariableStatusField(weightUpdates,aktKante);
    };
    
    /**
     * Aktualisiert, falls nötig, den Entfernungswert des aktuellen Knotens.
     * @method
     */
    this.updateSingleNode = function() {
        var aktKante = graph.edges[kantenIDs[nextKantenID]];
        // Animation -> Zurück auf Normal
        aktKante.setLayout("lineColor","black");
        aktKante.setLayout("lineWidth",2);
        var u = aktKante.getSourceID();
        var v = aktKante.getTargetID();
        nodeUpdateStack.push(distanz[v]);
        vorgaengerIDUpdateStack.push(vorgaenger[v]);
        if(distanz[u] != "inf" && (distanz[v] == "inf" || distanz[u] + aktKante.weight < distanz[v])) {
            distanz[v] = distanz[u] + aktKante.weight;
            graph.nodes[v].setLabel(distanz[v].toString());
            if(vorgaenger[v] != null) {
                graph.edges[vorgaenger[v]].setHighlighted(false);
            }
            vorgaenger[v] = kantenIDs[nextKantenID];
            if(showVorgaenger) {
                aktKante.setHighlighted(true);
            }
        }

        nextKantenID++;

        this.checkEdgeForUpdate();
    };
    
    /**
     * Prüft die nächste Kante, ob sie Teil eines negativen Zyklus ist.
     * @method
     */
    this.checkNextEdgeForNegativeCycle = function() {
        // Animation
        if(nextKantenID>0) {
            var vorherigeKante = graph.edges[kantenIDs[nextKantenID-1]];
            vorherigeKante.setLayout("lineColor","black");
            vorherigeKante.setLayout("lineWidth",2);
        }
        if(kantenIDs.length <= nextKantenID) {
            // Alle Kanten betrachtet, kein negativer Kreis gefunden, Ende
            statusID = 6;
            this.showNoNegativeCycle();
            return;
        }

        var aktKante = graph.edges[kantenIDs[nextKantenID]];
        aktKante.setLayout("lineColor",const_Colors.EdgeHighlight1);
        aktKante.setLayout("lineWidth",3);
        // Erklärung im Statusfenster
        $("#ta_div_statusErklaerung").html("<h3 class=\"greyedOut\">3 "+LNG.K('textdb_msg_case2_1')+"</h3>"
            + "<h3>3." +(nextKantenID+1) +" " +LNG.K('textdb_msg_case2_5')+"</h3>"
            + "<p>"+LNG.K('textdb_msg_case2_6')+"</p>"
            + "<p>"+LNG.K('textdb_msg_case2_7')+"</p>"
            + "<p>"+LNG.K('textdb_msg_case2_8')+"</p>");
        $(".marked").removeClass("marked");
        $("#ta_p_l9").addClass("marked");
        this.showVariableStatusField(null,aktKante);
        if(distanz[aktKante.getSourceID()]+ aktKante.weight < distanz[aktKante.getTargetID()]) {
            // Kante ist Teil eines negativen Kreises
            statusID = 5;
        }
        else {
            nextKantenID++;
        }
    };

    /**
     * Markiere den negativen Kreis, der gefunden wurde.
     * @method
     */
    this.backtrackNegativeCycle = function() {
        negativeCycleFound = true;
        var aktKante = graph.edges[kantenIDs[nextKantenID]];
        aktKante.setLayout("lineColor","black");
        aktKante.setLayout("lineWidth",2);
        var backtrackFirstID = aktKante.getTargetID();
        var visitedNodes = new Object();
        visitedNodes[backtrackFirstID] = true;
        var backtrackKante = graph.edges[vorgaenger[backtrackFirstID]];
        while(visitedNodes[backtrackKante.getSourceID()] != true) {
            visitedNodes[backtrackKante.getSourceID()] = true;
            backtrackKante = graph.edges[vorgaenger[backtrackKante.getSourceID()]];
        }
        backtrackFirstID = backtrackKante.getSourceID();
        backtrackKante = graph.edges[vorgaenger[backtrackFirstID]];
        backtrackKante.setLayout("lineColor","LightCoral");
        backtrackKante.setLayout("lineWidth",3);
        while(backtrackKante.getSourceID() != backtrackFirstID) {
            backtrackKante = graph.edges[vorgaenger[backtrackKante.getSourceID()]];
            backtrackKante.setLayout("lineColor","LightCoral");
            backtrackKante.setLayout("lineWidth",3);
        }
        // Erklärung im Statusfenster
        $("#ta_div_statusErklaerung").html("<h3>4 "+LNG.K('textdb_msg_case3_1')+"</h3>"
            + "<p>"+LNG.K('textdb_msg_case3_2')+"</p>"
            + "<p>"+LNG.K('textdb_msg_case3_3')+"</p>");
        $(".marked").removeClass("marked");
        $("#ta_p_l10").addClass("marked");
        this.endAlgorithm();
    };

    /**
     * Wird aufgerufen, wenn der Algorithmus erfolgreich geendet hat.
     * @method
     */
    this.showNoNegativeCycle = function() {
        // Erklärung im Statusfenster
        $("#ta_div_statusErklaerung").html("<h3>4 "+LNG.K('textdb_msg_case4_1')+"</h3>"
            + "<p>"+LNG.K('textdb_msg_case4_2')+"</p>"
            + "<h3>"+LNG.K('textdb_msg_case4_3')+"</h3>");
        $(".marked").removeClass("marked");
        $("#ta_p_l11").addClass("marked");
        this.endAlgorithm();
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
     * Handler für Mausbewegungen im Algorithmus Tab.<br>
     * Wenn mit der Maus über einen Knoten gefahren wird, wird der kürzeste Weg
     * vom Startknoten zu diesem Knoten grün markiert. <br>
     * Die Markierung wird wieder entfernt, sobald die Maus den Knoten wieder verlässt
     * @param {jQuery.Event} e
     * @returns {void}
     */
    this.canvasMouseMoveHandler = function(e) {
        if(statusID != 6) {
            // Algorithmus noch nicht beendet
            return;
        }
        var mouseInNode = false;
        var mx = e.pageX - canvas.offset().left;
        var my = e.pageY - canvas.offset().top;
        for(var knotenID in graph.nodes) {
            if (graph.nodes[knotenID].contains(mx, my)) {
                if(showWayOfNode != null) {
                    if(showWayOfNode.nodeID == knotenID) {
                        return;
                    }
                    else {
                        var showWayOfNodeOld = showWayOfNode;
                        showWayOfNode = null;
                        this.needRedraw = true;
                        // Layout zurücksetzen
                        for (var i = 0; i < showWayOfNodeOld.modifiedEdges.length; ++i) {
                            graph.edges[showWayOfNodeOld.modifiedEdges[i].id].setLayout("lineWidth",showWayOfNodeOld.modifiedEdges[i].lineWidth);
                            graph.edges[showWayOfNodeOld.modifiedEdges[i].id].setLayout("lineColor",showWayOfNodeOld.modifiedEdges[i].lineColor);
                        }
                    }
                }
                mouseInNode = true;
                showWayOfNode = new Object();
                showWayOfNode.nodeID = knotenID;
                var visitedNodes = new Object();
                var currentNode = knotenID;
                var currentEdge = null;
                var modifiedEdges = new Array();
                while(vorgaenger[currentNode] != null && visitedNodes[currentNode] == null) {
                    visitedNodes[currentNode] = true;
                    currentEdge = graph.edges[vorgaenger[currentNode]];
                    currentNode = currentEdge.getSourceID();
                    // Layout
                    modifiedEdges.push({id: currentEdge.getEdgeID(),
                                        lineWidth: currentEdge.getLayout().lineWidth,
                                        lineColor: currentEdge.getLayout().lineColor});
                    currentEdge.setLayout("lineWidth",3);
                    currentEdge.setLayout("lineColor",const_Colors.EdgeHighlight4);
                }
                showWayOfNode.modifiedEdges = modifiedEdges;
                this.needRedraw = true;
            }
        }

        if(!mouseInNode && showWayOfNode != null) {
            this.needRedraw = true;
            // Layout zurücksetzen
            for (var i = 0; i < showWayOfNode.modifiedEdges.length; ++i) {
                if(graph.edges[showWayOfNode.modifiedEdges[i].id].getLayout().lineColor == const_Colors.EdgeHighlight4 &&
                    graph.edges[showWayOfNode.modifiedEdges[i].id].getLayout().lineWidth == 3) {
                    graph.edges[showWayOfNode.modifiedEdges[i].id].setLayout("lineWidth",showWayOfNode.modifiedEdges[i].lineWidth);
                    graph.edges[showWayOfNode.modifiedEdges[i].id].setLayout("lineColor",showWayOfNode.modifiedEdges[i].lineColor);
                }
            }
            showWayOfNode = null;
        }
    };
    
    /**
     * Blendet die Vorgängerkanten ein und aus.
     * @method
     */
    this.changeVorgaengerVisualization = function() {
        showVorgaenger = !showVorgaenger;
        for(var knotenID in vorgaenger) {
            if(vorgaenger[knotenID] != null) {
                graph.edges[vorgaenger[knotenID]].setHighlighted(showVorgaenger);
            }
        }
        $("#ta_tr_LegendeClickable").toggleClass("greyedOutBackground");
        this.needRedraw = true;
    };
    
    /**
     * Ermittelt basierend auf der StatusID und anderen den vorherigen Schritt aus
     * und ruft die entsprechende Funktion auf.
     * @method
     */
    this.previousStepChoice = function() {
        switch(statusID) {
            case 2:
               this.reverseLastUpdate(true);
               break;
            case 3:
               this.reverseLastUpdate(false);
               break;
            case 4:
               this.reverseNegativeCycleCheck();
               break;
            case 5:
               this.reverseBacktrack();
               break;
            case 6:
               this.reverseSuccessEnding();
               break;
            default:
               //console.log("Fehlerhafte StatusID für Rückschritt.");
               break;
       }
       this.needRedraw = true;
    };
    
    /**
     * Setzt den zuletzt ausgeführten Update Schritt zurück
     * @param {Boolean} afterUpdate Zeigt an, ob das Update schon ausgeführt wurde.
     * @method
     */
    this.reverseLastUpdate = function(afterUpdate) {
        var aktKante = graph.edges[kantenIDs[nextKantenID]];
        if(afterUpdate) {
            weightUpdates--;
            if(weightUpdates == 0) {
                // Zurück zur Initialisierung
                $("#ta_button_Zurueck").button("option", "disabled", true);
                $("#ta_div_statusErklaerung").html("<h3>1 "+LNG.K('textdb_msg_case0_1')+"</h3>"
                    + "<p>"+LNG.K('textdb_msg_case0_2')+"</p>"
                    + "<p>"+LNG.K('textdb_msg_case0_3')+"</p>"
                    + "<p>"+LNG.K('textdb_msg_case0_4')+"</p>");
                this.showVariableStatusField(null,null);
                $(".marked").removeClass("marked");
                $("#ta_p_l2").addClass("marked");
                $("#ta_p_l3").addClass("marked");
                $("#ta_p_l4").addClass("marked");
                statusID = 1;
            }
            else {
                nextKantenID = kantenIDs.length-1;
                aktKante = graph.edges[kantenIDs[nextKantenID]];
                var v = aktKante.getTargetID();
                distanz[v] = nodeUpdateStack.pop();
                vorgaenger[v] = vorgaengerIDUpdateStack.pop();
                aktKante.setHighlighted(false);
                if(showVorgaenger) {
                    if(vorgaenger[v]) {
                        graph.edges[vorgaenger[v]].setHighlighted(true);
                    }
                }
                if(distanz[v] == "inf") {
                    graph.nodes[v].setLabel(String.fromCharCode(8734));
                }
                else {
                    graph.nodes[v].setLabel(distanz[v].toString());
                }
                aktKante.setLayout("lineColor",const_Colors.EdgeHighlight1);
                aktKante.setLayout("lineWidth",3);
                statusID = 3;
                // Erklärung im Statusfenster
                $("#ta_div_statusErklaerung").html("<h3 class=\"greyedOut\">2 "+LNG.K('textdb_msg_case1_1')+"</h3>"
                    + "<h3 class=\"greyedOut\"> 2." + weightUpdates.toString() + " "+LNG.K('textdb_text_phase')+ " " + weightUpdates.toString() + " "+LNG.K('textdb_text_of')+ " " + (Utilities.objectSize(graph.nodes)-1) + "</h3>"
                    + "<h3> 2." + weightUpdates.toString() + "." + (nextKantenID+1) +" "+LNG.K('textdb_msg_case1_2')+"</h3>"
                    + "<p>"+LNG.K('textdb_msg_case1_3')+"</p>"
                    + "<p>"+LNG.K('textdb_msg_case1_4')+"</p>");
                $(".marked").removeClass("marked");
                $("#ta_p_l7").addClass("marked");
                this.showVariableStatusField(weightUpdates,aktKante);
            }
        }
        else {
            if(nextKantenID == 0) {
                var wuString = "";
                if(weightUpdates == 1) {
                    wuString = LNG.K('textdb_text_oneedge');
                } else {
                    wuString = weightUpdates.toString() + " " + LNG.K('textdb_text_edges');
                }
                var wum1String = "";
                if(weightUpdates == 2) {
                    wum1String = LNG.K('textdb_text_oneedge');
                } else {
                    wum1String = (weightUpdates-1).toString() + " " + LNG.K('textdb_text_edges');
                }
                $("#ta_div_statusErklaerung").html("<h3 class=\"greyedOut\">2  "+LNG.K('textdb_msg_case1_1')+"</h3>"
                    + "<h3> 2." + weightUpdates.toString() + " "+LNG.K('textdb_text_phase')+ weightUpdates.toString() + " "+LNG.K('textdb_text_of')+ (Utilities.objectSize(graph.nodes)-1) + "</h3>"
                    + "<p>"+LNG.K('textdb_msg_case2_2_a')+wum1String + " " +LNG.K('textdb_msg_case2_2_b')+"</p>"
                    + "<p>"+LNG.K('textdb_msg_case1_5_a')+wuString+ " "+LNG.K('textdb_msg_case2_2_b')+"</p>");
                $("#ta_div_statusErklaerung").append("<p>"+LNG.K('textdb_msg_case1_6')+"</p>");
                $(".marked").removeClass("marked");
                $("#ta_p_l5").addClass("marked");
                $("#ta_p_l6").addClass("marked");
                this.showVariableStatusField(weightUpdates,null);
                statusID = 2;
                aktKante.setLayout("lineColor","black");
                aktKante.setLayout("lineWidth",2);
            }
            else {
                aktKante.setLayout("lineColor","black");
                aktKante.setLayout("lineWidth",2);
                nextKantenID--;
                aktKante = graph.edges[kantenIDs[nextKantenID]];
                var v = aktKante.getTargetID();
                distanz[v] = nodeUpdateStack.pop();
                vorgaenger[v] = vorgaengerIDUpdateStack.pop();
                aktKante.setHighlighted(false);
                if(showVorgaenger) {
                    if(vorgaenger[v]) {
                        graph.edges[vorgaenger[v]].setHighlighted(true);
                    }
                }
                if(distanz[v] == "inf") {
                    graph.nodes[v].setLabel(String.fromCharCode(8734));
                }
                else {
                    graph.nodes[v].setLabel(distanz[v].toString());
                }
                aktKante.setLayout("lineColor",const_Colors.EdgeHighlight1);
                aktKante.setLayout("lineWidth",3);
                statusID = 3;
                // Erklärung im Statusfenster
                $("#ta_div_statusErklaerung").html("<h3 class=\"greyedOut\">2 "+LNG.K('textdb_msg_case1_1')+"</h3>"
                    + "<h3 class=\"greyedOut\"> 2." + weightUpdates.toString() + " "+LNG.K('textdb_text_phase')+ " " + weightUpdates.toString() + " "+LNG.K('textdb_text_of')+ " " + (Utilities.objectSize(graph.nodes)-1) + "</h3>"
                    + "<h3> 2." + weightUpdates.toString() + "." + (nextKantenID+1) + " " +LNG.K('textdb_msg_case1_2')+"</h3>"
                    + "<p>"+LNG.K('textdb_msg_case1_3')+"</p>"
                    + "<p>"+LNG.K('textdb_msg_case1_4')+"</p>");
                $(".marked").removeClass("marked");
                $("#ta_p_l7").addClass("marked");
                this.showVariableStatusField(weightUpdates,aktKante);
            }
        }
    };
    
    /**
     * Setzt den zuletzt ausgeführten Negative Cyclce Check Schritt zurück
     * @method
     */
    this.reverseNegativeCycleCheck = function() {
        if(nextKantenID == 0) {
            // War bei der Eingangsmeldung vom negative Kreise suchen
            this.reverseLastUpdate(true);
            return;
        }
        else {
            nextKantenID--; 
            var aktKante = graph.edges[kantenIDs[nextKantenID]];
            aktKante.setLayout("lineColor","black");
            aktKante.setLayout("lineWidth",2);
            if(nextKantenID>0) {
                var vorherigeKante = graph.edges[kantenIDs[nextKantenID-1]];
                vorherigeKante.setLayout("lineColor",const_Colors.EdgeHighlight1);
                vorherigeKante.setLayout("lineWidth",3);
                // Erklärung im Statusfenster
                $("#ta_div_statusErklaerung").html("<h3 class=\"greyedOut\"> 3  "+LNG.K('textdb_msg_case2_1')+"</h3>"
                    + "<h3>3." +(nextKantenID) +" " + LNG.K('textdb_msg_case2_5')+"</h3>"
                    + "<p>"+LNG.K('textdb_msg_case2_6')+"</p>"
                    + "<p>"+LNG.K('textdb_msg_case2_7')+"</p>"
                    + "<p>"+LNG.K('textdb_msg_case2_8')+"</p>");
                $(".marked").removeClass("marked");
                $("#ta_p_l9").addClass("marked");
                this.showVariableStatusField(null,vorherigeKante);
            }
            else {
                var wuString = "";
                if(weightUpdates == 1) {
                    wuString = LNG.K('textdb_text_oneedge');
                } else {
                    wuString = weightUpdates.toString() + " " + LNG.K('textdb_text_edges');
                }
                var wum1String = "";
                if(weightUpdates == 2) {
                    wum1String = LNG.K('textdb_text_oneedge');
                } else {
                    wum1String = (weightUpdates-1).toString() + " " + LNG.K('textdb_text_edges');
                }
                $("#ta_div_statusErklaerung").html("<h3> 3  "+LNG.K('textdb_msg_case2_1')+"</h3>"
                    + "<p>"+LNG.K('textdb_msg_case2_2_a') +wum1String+ " "+LNG.K('textdb_msg_case2_2_b')+"</p>"
                    + "<p>"+LNG.K('textdb_msg_case2_3_a')+ weightUpdates + " " + LNG.K('textdb_msg_case2_3_b')+"</p>"
                    + "<p>"+LNG.K('textdb_msg_case2_4')+"</p>");
                $(".marked").removeClass("marked");
                $("#ta_p_l8").addClass("marked");
                this.showVariableStatusField(null,null);
            }
        }
    };
    
    this.reverseBacktrack = function() {
        if(!negativeCycleFound) {
            // Algorithmus hätte im nächsten Schritt negativen Zyklus gezeigt
            statusID = 4;
            var aktKante = graph.edges[kantenIDs[nextKantenID]];
            aktKante.setLayout("lineColor","black");
            aktKante.setLayout("lineWidth",2);
            if(nextKantenID>0) {
                var vorherigeKante = graph.edges[kantenIDs[nextKantenID-1]];
                vorherigeKante.setLayout("lineColor",const_Colors.EdgeHighlight1);
                vorherigeKante.setLayout("lineWidth",3);
                $("#ta_div_statusErklaerung").html("<h3 class=\"greyedOut\"> 3  "+LNG.K('textdb_msg_case2_1')+"</h3>"
                    + "<h3>3." +(nextKantenID) +" " +LNG.K('textdb_msg_case2_5')+"</h3>"
                    + "<p>"+LNG.K('textdb_msg_case2_6')+"</p>"
                    + "<p>"+LNG.K('textdb_msg_case2_7')+"</p>"
                    + "<p>"+LNG.K('textdb_msg_case2_8')+"</p>");
                $(".marked").removeClass("marked");
                $("#ta_p_l9").addClass("marked");
                this.showVariableStatusField(null,vorherigeKante);
            }
            else {
                var wuString = "";
                if(weightUpdates == 1) {
                    wuString = LNG.K('textdb_text_oneedge');
                } else {
                    wuString = weightUpdates.toString() + " " + LNG.K('textdb_text_edges');
                }
                var wum1String = "";
                if(weightUpdates == 2) {
                    wum1String = LNG.K('textdb_text_oneedge');
                } else {
                    wum1String = (weightUpdates-1).toString() + " " + LNG.K('textdb_text_edges');
                }
                $("#ta_div_statusErklaerung").html("<h3> 3  "+LNG.K('textdb_msg_case2_1')+"</h3>"
                    + "<p>"+LNG.K('textdb_msg_case2_2_a') +wum1String+ " "+LNG.K('textdb_msg_case2_2_b')+"</p>"
                    + "<p>"+LNG.K('textdb_msg_case2_3_a')+ weightUpdates + " " + LNG.K('textdb_msg_case2_3_b')+"</p>"
                    + "<p>"+LNG.K('textdb_msg_case2_4')+"</p>");
                $(".marked").removeClass("marked");
                $("#ta_p_l8").addClass("marked");
                this.showVariableStatusField(null,null);
            }
        }
        else {
            // Algorithmus war komplett beendet
            $("#ta_button_1Schritt").button("option", "disabled", false);
            $("#ta_button_vorspulen").button("option", "disabled", false);
            negativeCycleFound = false;
            for(var kantenID in graph.edges) {
                graph.edges[kantenID].setLayout("lineColor","black");
                graph.edges[kantenID].setLayout("lineWidth",2);
            }
            var aktKante = graph.edges[kantenIDs[nextKantenID]];
            aktKante.setLayout("lineColor",const_Colors.EdgeHighlight1);
            aktKante.setLayout("lineWidth",3);
            $("#ta_div_statusErklaerung").html("<h3 class=\"greyedOut\"> 3  "+LNG.K('textdb_msg_case2_1')+"</h3>"
                    + "<h3>3." +(nextKantenID) +" " +LNG.K('textdb_msg_case2_5')+"</h3>"
                    + "<p>"+LNG.K('textdb_msg_case2_6')+"</p>"
                    + "<p>"+LNG.K('textdb_msg_case2_7')+"</p>"
                    + "<p>"+LNG.K('textdb_msg_case2_8')+"</p>");
            $(".marked").removeClass("marked");
            $("#ta_p_l9").addClass("marked");
            this.showVariableStatusField(null,aktKante);
        }
    };
    
    this.reverseSuccessEnding = function() {
        $("#ta_button_1Schritt").button("option", "disabled", false);
        $("#ta_button_vorspulen").button("option", "disabled", false);
        statusID = 4;
        // Animation
        if(nextKantenID>0) {
            var vorherigeKante = graph.edges[kantenIDs[nextKantenID-1]];
            vorherigeKante.setLayout("lineColor",const_Colors.EdgeHighlight1);
            vorherigeKante.setLayout("lineWidth",3);
        }
        if(kantenIDs.length > 0){
            $("#ta_div_statusErklaerung").html("<h3 class=\"greyedOut\"> 3  "+LNG.K('textdb_msg_case2_1')+"</h3>"
                    + "<h3>3." +(nextKantenID) +" " +LNG.K('textdb_msg_case2_5')+"</h3>"
                    + "<p>"+LNG.K('textdb_msg_case2_6')+"</p>"
                    + "<p>"+LNG.K('textdb_msg_case2_7')+"</p>"
                    + "<p>"+LNG.K('textdb_msg_case2_8')+"</p>");
            $(".marked").removeClass("marked");
            $("#ta_p_l9").addClass("marked");
            this.showVariableStatusField(null,vorherigeKante);
        }
        else {
            var wuString = "";
            if(weightUpdates == 1) {
                wuString = LNG.K('textdb_text_oneedge');
            } else {
                wuString = weightUpdates.toString() + " " + LNG.K('textdb_text_edges');
            }
            var wum1String = "";
            if(weightUpdates == 2) {
                wum1String = LNG.K('textdb_text_oneedge');
            } else {
                wum1String = (weightUpdates-1).toString() + " " + LNG.K('textdb_text_edges');
            }
            $("#ta_div_statusErklaerung").html("<h3> 3  "+LNG.K('textdb_msg_case2_1')+"</h3>"
                + "<p>"+LNG.K('textdb_msg_case2_2_a') +wum1String+ " " +LNG.K('textdb_msg_case2_2_b')+"</p>"
                + "<p>"+LNG.K('textdb_msg_case2_3_a')+ weightUpdates + " " + LNG.K('textdb_msg_case2_3_b')+"</p>"
                + "<p>"+LNG.K('textdb_msg_case2_4')+"</p>");
            $(".marked").removeClass("marked");
            $("#ta_p_l8").addClass("marked");
            this.showVariableStatusField(null,null);
        }
        
    };
    
    /**
     * Trägt den Status der Variablen in die entsprechenden Felder im Pseudocode
     * Tab ein.
     * @param {Number} i    Laufvariable
     * @param {Edge} kante  Aktuell betrachtete Kante
     * @method
     */
    this.showVariableStatusField = function(i,kante) {
        if(i == null) {
            $("#ta_td_vari").html("");
        }
        else {
            $("#ta_td_vari").html(i.toString());
        }
        if(kante == null) {
            $("#ta_td_vardu").html("");
            $("#ta_td_vardv").html("");
            $("#ta_td_varluv").html("");
            return;
        }
        $("#ta_td_varluv").html(kante.weight.toString());
        if(distanz[kante.getSourceID()] == "inf") {
            $("#ta_td_vardu").html(String.fromCharCode(8734));
            $("#ta_div_statusErklaerung").append("<p><strong>"+LNG.K('algorithm_status1') +String.fromCharCode(8734) + "</strong></p>");
        }
        else {
            $("#ta_td_vardu").html(distanz[kante.getSourceID()].toString());
            $("#ta_div_statusErklaerung").append("<p><strong>"+LNG.K('algorithm_status1') +distanz[kante.getSourceID()].toString() + "</strong></p>");
        }
        $("#ta_div_statusErklaerung").append("<p><strong>"+LNG.K('algorithm_status2') +kante.weight.toString() + "</strong></p>");
        if(distanz[kante.getTargetID()] == "inf") {
            $("#ta_td_vardv").html(String.fromCharCode(8734));
            $("#ta_div_statusErklaerung").append("<p><strong"+LNG.K('algorithm_status3') +String.fromCharCode(8734) + "</strong></p>");
        }
        else {
            $("#ta_td_vardv").html(distanz[kante.getTargetID()].toString());
            $("#ta_div_statusErklaerung").append("<p><strong>"+LNG.K('algorithm_status3') +distanz[kante.getTargetID()].toString() + "</strong></p>");
        }
        var u = kante.getSourceID();
        var v = kante.getTargetID();
        if(distanz[u] != "inf" && (distanz[v] == "inf" || distanz[u] + kante.weight < distanz[v])) {
            $("#ta_div_statusErklaerung").append("<p><strong>"+LNG.K('algorithm_status4')+"</strong></p>");
        }
        else {
            $("#ta_div_statusErklaerung").append("<p><strong>"+LNG.K('algorithm_status5')+"</strong></p>");
        }
    };
}

// Vererbung realisieren
HKAlgorithm.prototype = new CanvasDrawer;
HKAlgorithm.prototype.constructor = HKAlgorithm;