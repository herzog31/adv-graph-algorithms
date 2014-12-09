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
    //console.log(p_graph.getDescriptionAsString());
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
     * Hier die Variablen vom HK-Algo
     */
    /**
     * Enthaelt alle Kanten, die zu aktuellem Zeitpunkt zum Matching gehoeren.
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
    /*
    * Repraesentiert den Augmentierungsgraphen.
    * @type Object
    * */
    var bfsEdges = new Object();
    /*
     * Die Laenge des kuerzesten verbessernden Pfades in der aktuellen Iteration.
     * @type Number
     * */
    var shortestPathLength = 0;
    /*
    * Enthaelt die Matching-Partner der Knoten.
    * Keys: KnotenIDs Value: Knoten
    * @type Object
    * */
    var matched = new Object();
    /*
    * Enthaelt die disjunkten augmentierenden Pfade der aktuellen Iteration.
    * Die Pfade sehen wie folgt aus: v1,e1,v2,...,en-1,vn.
    * Dabei bezeichnen vi Knoten und ei Kanten
    * @type Array
    * */
    var disjointPaths = new Array();
    /*
    * Der Pfad, der aktuell bearbeitet wird.
    * @type Number
    * */
    var currentPath = 0;
    /*
    * Alle benoetigten Information zur Wiederherstellung der vorangegangenen Schritte werden hier gespeichert.
    * @type Array
    * */
    var history = new Array();
    /**
     * Zählt die Phasen / Runden.
     * @type Number
     */
    var iteration = 0;
    /**
     * Gibt an, ob der Algorithmus am Ende ist.
     * @type Boolean
     */
    var end = false;
    /**
     * Wird fuer die Anzeige des Matchings am Ende des Algorithmus benoetigt.
     * @type Boolean
     */
    var toggleMatchButton = true;
    /**
     * Gibt das Statusausgabefenster an.
     */
    var statusErklaerung = "#ta_div_statusErklaerung";
    /*
    * Hier werden die Statuskonstanten definiert
    * */
    const ALGOINIT = 0;
    const BEGIN_ITERATION = 1;
    const END_ITERATION = 2;
    const NEXT_AUGMENTING_PATH = 3;
    const UPDATE_MATCHING = 4;
    const GRAY_PATH = 5;
    const END_ALGORITHM = 6;

    /*
    * Hier wird das Aussehen der Kanten und Knoten bestimmt
    * */
    const MATCHED_EDGE_COLOR = "DarkBlue";
    const MATCHED_NODE_COLOR = const_Colors.NodeFillingHighlight;

/*    *//**
     * Aussehen einer Matching-Kante.
     * @type Object
     *//*
    var greyedEdge = {'arrowAngle' : Math.PI/8,	// Winkel des Pfeilkopfs relativ zum Pfeilkörper
        'arrowHeadLength' : 15,    // Länge des Pfeilkopfs
        'lineColor' : "blue",		// Farbe des Pfeils
        'lineWidth' : 2,		    // Dicke des Pfeils
        'font'	: 'Arial',		    // Schrifart
        'fontSize' : 14,		    // Schriftgrösse in Pixeln
        'isHighlighted': false     // Ob die Kante eine besondere Markierung haben soll
    };

    *//**
     * Aussehen eines Matching-Knotens.
     * @type Object
     *//*
    var greyedNode = {'fillStyle' : "#D8BFD8",    // Farbe der Füllung
        'nodeRadius' : 15,                         // Radius der Kreises
        'borderColor' : const_Colors.NodeBorder,   // Farbe des Rands (ohne Markierung)
        'borderWidth' : 2,                         // Breite des Rands
        'fontColor' : 'black',                     // Farbe der Schrift
        'font' : 'bold',                           // Schriftart
        'fontSize' : 14                            // Schriftgrösse in Pixeln
    };*/


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
        //$("#ta_p_l1").addClass("marked");
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
    this.nextStepChoice = function () {
        this.addReplayStep();
        switch (statusID) {
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
            case GRAY_PATH:
                this.grayPath()
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
        this.beginIteration();
        $("#ta_button_Zurueck").button("option", "disabled", false);
        //$(".marked").removeClass("marked");
        //$("#ta_p_l2").addClass("marked");
    };

    /*
    * Jede neue Iteration beginnt mit dieser Methode.
    * */
    this.beginIteration = function () {
        iteration++;
        disjointPaths = [];
        currentPath = 0;
        shortestPathLength = 0;
        this.bfs();
        this.dfs();
        if(shortestPathLength > 0){
            statusID = NEXT_AUGMENTING_PATH;
            $(statusErklaerung).html('<h3>'+iteration+'. '+LNG.K('textdb_text_iteration')+'</h3>'
                + "<h3> "+LNG.K('textdb_msg_begin_it')+"</h3>"
                + "<p>"+LNG.K('textdb_msg_path_shortest')+ shortestPathLength + "</p>"
                + "<p>"+LNG.K('textdb_msg_begin_it_1')+"<p>");
        }
        else{
            statusID = END_ALGORITHM;
            $(statusErklaerung).html("<h3> "+LNG.K('textdb_msg_end_algo')+"</h3>"
                + "<p>"+LNG.K('textdb_msg_end_algo_1')+"</p>");
        }
    };
    /*
    * Mit Hilfe der Breitensuche wird ein Augmentierungsgraph aufgebaut.
    * */
    this.bfs = function () {
        //Initialize
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
        //Iterate
        while (!freeNodeFound && !emptyLayer) {
            shortestPathLength++;
            for (n in evenLayer) {
                var node = evenLayer[n];
                examined[node.getNodeID()] = true;
                //find all adjacent edges
                var edges = node.getOutEdges();
/*                var inEdges = node.getInEdges();
                for (var e in inEdges) {edges[e] = inEdges[e];}*/
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
    * Mittels der Tiefensuche wird nach knotendisjunkten verbessernden Pfaden gesucht. Dabei wird der Augmentierungsgraph aus der Bfs-Phase verwendet.
    * @method
    * */
   this.dfs = function(){
       var dfsStack = [];
       for (var node in superNode) {
           var foundAugmentingPath = recursiveDfs(superNode[node], dfsStack);
           if (foundAugmentingPath){ //delete the edges of nodes in stack from the graph to ensure disjunct paths
               for (var i = 0; i < dfsStack.length; i=i+2) { //iterate only over the nodes in path
                   var curr = dfsStack[i];
                   var parents = curr.getInEdges();
                   for (var e in parents) {
                       var pid = parents[e].getSourceID();
                       delete bfsEdges[pid][curr.getNodeID()];
                   }
                   parents = curr.getOutEdges();
                   for (var e in parents) {
                       var pid = parents[e].getTargetID();
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
    * Rekursives Unterprogramm, das fuer die Tiefensuche benutzt wird.
    * @method
    * */
   var recursiveDfs = function (node, stack) {
        stack.push(node);
        if (!matched[node.getNodeID()] && stack.length>1) return true;
        else {
            var children = bfsEdges[node.getNodeID()];
            for (var c in children) {
                stack.push(children[c]);
                if (recursiveDfs(graph.nodes[c], stack)) {
                    return true;
                }
                stack.pop();
            }
        }
        stack.pop();
        return false;
    };

    /*
    * Methoden fuer die Visualisierung
    * */
    this.highlightPath = function(){
        //alle Kanten ein wenig in den Hintergrund
        for(var e in graph.edges) graph.edges[e].setLayout("lineWidth", global_Edgelayout.lineWidth * 0.9);

        //hervorheben des Augmentationsweges (einschliesslich Knoten und Kanten)
        var path = disjointPaths[currentPath];
        for(var n = 0; n < path.length; n=n+2){
            var node = path[n];
            node.setLayout('borderColor',"Navy");
            //node.setLayout('borderColor',const_Colors.NodeBorderHighlight);
            node.setLayout('borderWidth',global_NodeLayout.borderWidth*1.5);
            if(n < path.length - 1){
                var edge = path[n+1];
                edge.setLayout("lineWidth", global_Edgelayout.lineWidth*2.4);
            }
        }
        //die freien Knoten hervorheben(erster und letzter Knoten auf dem Weg)
        path[0].setLayout('fillStyle',"SteelBlue ");
        path[path.length-1].setLayout('fillStyle',"SteelBlue ");
        //statuserklaerung
        $(statusErklaerung).html('<h3>'+iteration+'. '+LNG.K('textdb_text_iteration')+'</h3>'
            + "<h3> "+LNG.K('textdb_msg_path_highlight')+"</h3>"
            + "<p> "+LNG.K('textdb_msg_path_highlight_1')+"<p>");
        statusID = UPDATE_MATCHING;
    };

    var setEdgeMatched = function(edge){
        edge.setLayout("lineColor", MATCHED_EDGE_COLOR);
        edge.setLayout("lineWidth", global_Edgelayout.lineWidth*1.3);
    };

    var setNodeMatched = function(node){
        node.setLayout('fillStyle',MATCHED_NODE_COLOR);
        node.setLayout('borderColor',global_NodeLayout.borderColor);
    };

    var setNodeGray = function(node){
        node.setLayout('fillStyle',"DarkGray");
        node.setLayout('borderWidth',global_NodeLayout.borderWidth);
        node.setLayout('borderColor',"Gray");
    };

    this.dfsUpdateMatching = function(){
        var path = disjointPaths[currentPath];
        //iterate over all edges in the path
        for (var i = 1; i < path.length-1; i = i + 2) {
            var edge = path[i];
            //if its matching edge then delete it from the matching
            if(matching[edge.getEdgeID()]){
                delete matching[edge.getEdgeID()];
                edge.setLayout("lineColor", "black"); //set the color to black
            }
            //else insert it
            else{
                matching[edge.getEdgeID()] = edge;
                matched[path[i-1].getNodeID()] =  path[i+1];
                matched[path[i+1].getNodeID()] =  path[i-1];
                edge.setLayout("lineColor", MATCHED_EDGE_COLOR); // set the matching color
            }
            setNodeMatched(path[i-1]);
        }
        setNodeMatched(path[path.length-1]);

        statusID = GRAY_PATH;
        $(statusErklaerung).html('<h3>'+iteration+'. '+LNG.K('textdb_text_iteration')+'</h3>'
            + "<h3> "+LNG.K('textdb_msg_update')+"</h3>"
            + "<p>"+LNG.K('textdb_msg_update_1')+ "</p>"
            + "<p>"+LNG.K('textdb_msg_update_2')+ "</p>");
    };

    this.grayPath = function(){
        var path = disjointPaths[currentPath];
        for (var i = 0; i < path.length; i = i + 2) {
            var node = path[i];
            setNodeGray(node);
            // gray out OutEdges
            var edges = node.getOutEdges();
            for(var e in edges){
              edges[e].setLayout("lineWidth", global_Edgelayout.lineWidth * 0.3);
            }
            // gray out InEdges
            edges = node.getInEdges();
            for(var e in edges){
                edges[e].setLayout("lineWidth", global_Edgelayout.lineWidth * 0.3);
            }
        }
        currentPath++;

        if(currentPath < disjointPaths.length){
            statusID = NEXT_AUGMENTING_PATH;
        }
        else statusID = END_ITERATION;
        // TODO Statusfenster
        $(statusErklaerung).html('<h3>'+iteration+'. '+LNG.K('textdb_text_iteration')+'</h3>'
            + "<h3> "+LNG.K('textdb_msg_gray')+"</h3>"
            + "<p>"+LNG.K('textdb_msg_gray_1')+ "</p>");
    };

    /*
    * Beende die Iteration
    * @method
    * */
    this.endIteration = function(){
        statusID = BEGIN_ITERATION;
        //restore Layouts
        for(var n in graph.nodes){
            var node = graph.nodes[n];
            if(matched[n])setNodeMatched(node);
        }
        for(var e in graph.edges){
            graph.edges[e].restoreLayout();
        }
        for(var e in matching){
            setEdgeMatched(graph.edges[e]);
        }
        $(statusErklaerung).html('<h3>'+iteration+'. '+LNG.K('textdb_text_iteration')+'</h3>'
            + "<h3> "+LNG.K('textdb_msg_end_it')+"</h3>"
            + "<p>"+LNG.K('textdb_msg_end_it_1')+"</p>");
    };

    
    /**
     * Zeigt Texte und Buttons zum Ende des Algorithmus
     * @method
     */
    this.endAlgorithm = function() {
        //Button, der das Matching anzeigt
        toggleMatchButton = true;
        $(statusErklaerung).append("<button id=ta_show_match>"+LNG.K('algorithm_btn_match')+"</button>");
        $("#ta_show_match").button();
        //$("#ta_button_1Schritt").on("click.HKAlgorithm",function() {algo.singleStepHandler();});
        $("#ta_show_match").click(function() {
            if(toggleMatchButton){
                //alle Nicht-Matching-Kanten in den Hintergrund
                for(var e in graph.edges) graph.edges[e].setLayout("lineWidth", global_Edgelayout.lineWidth * 0.3);
                $("#ta_show_match").button( "option", "label", LNG.K('algorithm_btn_match1') );
            }
            else{
                for(var e in graph.edges)  graph.edges[e].restoreLayout();
                $("#ta_show_match").button( "option", "label", LNG.K('algorithm_btn_match') );
            }
            //Matching-Kanten formatieren
            for(var e in matching) setEdgeMatched(matching[e]);
            toggleMatchButton = !toggleMatchButton;
            algo.needRedraw = true;
        });
        //Forschungsaufgabe und Erklaerung
        $(statusErklaerung).append("<p></p><h3>"+LNG.K('algorithm_msg_finish')+"</h3>");
        $(statusErklaerung).append("<button id=ta_button_gotoIdee>"+LNG.K('algorithm_btn_more')+"</button>");
        $(statusErklaerung).append("<h3>"+LNG.K('algorithm_msg_test')+"</h3>");
        $(statusErklaerung).append("<button id=ta_button_gotoFA1>"+LNG.K('algorithm_btn_exe1')+"</button>");
        $(statusErklaerung).append("<button id=ta_button_gotoFA2>"+LNG.K('algorithm_btn_exe2')+"</button>");
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
            nodeProperties[graph.nodes[key].getNodeID()] = {layout: JSON.stringify(graph.nodes[key].getLayout())};
        }
        var edgeProperties = {}
        for(var key in graph.edges) {
            edgeProperties[graph.edges[key].getEdgeID()] = {layout: JSON.stringify(graph.edges[key].getLayout())};
        }
        history.push({
            "previousStatusId": statusID,
            "nodeProperties": nodeProperties,
            "edgeProperties": edgeProperties,
            "matching": jQuery.extend({},matching),
            "bfsEdges": jQuery.extend({},bfsEdges),
            "shortestPathLength": shortestPathLength,
            "iteration": iteration,
            "superNode": jQuery.extend({},superNode),
            "matched": jQuery.extend({},matched),
            "disjointPaths": jQuery.extend([],disjointPaths),
            "currentPath": currentPath,
            "htmlSidebar": $(statusErklaerung).html()
        });
        //console.log("Current History Step: ", history[history.length-1]);
    };

    this.replayStep = function() {
        if(history.length > 0){
            var oldState = history.pop();
            //console.log("Replay Step", oldState);
            statusID = oldState.previousStatusId;
            matching = oldState.matching;
            bfsEdges = oldState.bfsEdges;
            shortestPathLength = oldState.shortestPathLength;
            iteration = oldState.iteration;
            superNode = oldState.superNode;
            matched = oldState.matched;
            disjointPaths = oldState.disjointPaths;
            currentPath = oldState.currentPath;
            $("#ta_div_statusErklaerung").html(oldState.htmlSidebar);
            for(var key in oldState.nodeProperties) {
                graph.nodes[key].setLayoutObject(JSON.parse(oldState.nodeProperties[key].layout));
                //graph.nodes[key].setLabel(oldState.nodeProperties[key].label);
            }
            for(var key in oldState.edgeProperties) {
                graph.edges[key].setLayoutObject(JSON.parse(oldState.edgeProperties[key].layout));
                //graph.edges[key].setAdditionalLabel(oldState.edgeProperties[key].label);
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

    this.setOutputFenster = function(fenster){
        statusErklaerung = fenster;
    }
    this.getShortestPathLength = function(){
        return shortestPathLength;
    }
}

// Vererbung realisieren
HKAlgorithm.prototype = Object.create(CanvasDrawer.prototype);
HKAlgorithm.prototype.constructor = HKAlgorithm;