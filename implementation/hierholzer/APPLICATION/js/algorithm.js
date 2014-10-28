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
     * @type BFAlgorithm
     */
    var algo = this;
    /**
     * Assoziatives Array mit den Abstandswerten aller Knoten<br>
     * Keys: KnotenIDs Value: Abstandswert
     * @type Object
     */
    var distanz = new Object();
    /**
     * Assoziatives Array mit den Vorgängerkanten aller Knoten<br>
     * Keys: KnotenIDs Value: KantenID
     * @type Object
     */
    var vorgaenger = new Object();
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
     * Zeigt an, ob ein negativer Kreis gefunden wurde oder nicht
     * @type Boolean
     */
    var negativeCycleFound = false;
    
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

    var debugConsole = true;

    var tourStartVertex = null;
    var tourStartOddVertex = null;
    var tourCurrentVertex = null;
    var semiEuclideanGraph = false;
    var validGraph = false;
    var euclideanTour = new Array();
    var euclideanSubTour = new Array();

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
        //canvas.on("click.BFAlgorithm",function(e) {algo.canvasClickHandler(e);});
        //canvas.on("mousemove.BFAlgorithm",function(e) {algo.canvasMouseMoveHandler(e);});
        $("#ta_button_1Schritt").on("click.BFAlgorithm",function() {algo.singleStepHandler();});
        $("#ta_button_vorspulen").on("click.BFAlgorithm",function() {algo.fastForwardAlgorithm();});
        $("#ta_button_stoppVorspulen").on("click.BFAlgorithm",function() {algo.stopFastForward();});
        // TODO $("#ta_tr_LegendeClickable").on("click.BFAlgorithm",function() {algo.changeVorgaengerVisualization();});
        // TODO $("#ta_button_Zurueck").on("click.BFAlgorithm",function() {algo.previousStepChoice();});
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
        // $("#ta_tr_LegendeClickable").off(".BFAlgorithm");
        // $("#ta_button_Zurueck").off(".BFAlgorithm");
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
            break;
        case 9:
            this.findNewStartingVertex();
            break;
        default:
            console.log("Fehlerhafter State");
            break;
       }
       this.needRedraw = true;
   };
   
   /**
     * Initialisiere den Algorithmus, stelle die Felder auf ihre Startwerte.
     */
   /* this.initializeAlgorithm = function() {
        distanz[startNode.getNodeID()] = 0;
        graph.nodes[startNode.getNodeID()].setLabel("0");
        for(var knotenID in graph.nodes) {
            if(knotenID != startNode.getNodeID()) {
                distanz[knotenID] = "inf";
                graph.nodes[knotenID].setLabel(String.fromCharCode(8734));   // Unendlich
            }
            vorgaenger[knotenID] = null;
        }
        statusID = 1;

        // Erklärung im Statusfenster
        $("#ta_div_statusErklaerung").html("<h3>1 "+LNG.K('textdb_msg_case0_1')+"</h3>"
            + "<p>"+LNG.K('textdb_msg_case0_2')+"</p>"
            + "<p>"+LNG.K('textdb_msg_case0_3')+"</p>"
            + "<p>"+LNG.K('textdb_msg_case0_4')+"</p>");
        this.showVariableStatusField(null,null);
        $(".marked").removeClass("marked");
        $("#ta_p_l2").addClass("marked");
        $("#ta_p_l3").addClass("marked");
        $("#ta_p_l4").addClass("marked");
   }; */
    
    /**
     * Geht in die nächste Runde und prüft, ob wir fertig sind.
     * @method
     */
    /* this.updateWeightsInitialisation = function() {
        if($("#ta_button_Zurueck").button("option","disabled") && fastForwardIntervalID == null) {
            $("#ta_button_Zurueck").button("option", "disabled", false);
        }
        weightUpdates++;
        nextKantenID = 0;
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
        if(weightUpdates > Utilities.objectSize(graph.nodes) - 1) {
            // Neuer Status -> Algorithmus fertig
            statusID = 4;
            // Erklärung im Statusfenster
            $("#ta_div_statusErklaerung").html("<h3>3 "+LNG.K('textdb_msg_case2_1')+"</h3>"
                + "<p>"+LNG.K('textdb_msg_case2_2_a')+wum1String +LNG.K('textdb_msg_case2_2_b')+"</p>"
                + "<p>"+LNG.K('textdb_msg_case2_3_a')+ weightUpdates +" "+LNG.K('textdb_msg_case2_3_b')+"</p>"
                + "<p>"+LNG.K('textdb_msg_case2_4')+"</p>");
            $(".marked").removeClass("marked");
            $("#ta_p_l8").addClass("marked");
            this.showVariableStatusField(null,null);
            return;
        }
        else {
            // Erklärung im Statusfenster
            $("#ta_div_statusErklaerung").html("<h3 class=\"greyedOut\">2 "+LNG.K('textdb_msg_case1_1')+"</h3>"
                + "<h3> 2." + weightUpdates.toString() + " " + LNG.K('textdb_text_phase') + " " + weightUpdates.toString() + " " + LNG.K('textdb_text_of') + " " + (Utilities.objectSize(graph.nodes)-1) + "</h3>"
                + "<p>"+LNG.K('textdb_msg_case2_2_a')+wum1String + " " +LNG.K('textdb_msg_case2_2_b')+"</p>"
                + "<p>"+LNG.K('textdb_msg_case1_5_a')+wuString+ " "+LNG.K('textdb_msg_case2_2_b')+"</p>");
            $("#ta_div_statusErklaerung").append("<p>"+LNG.K('textdb_msg_case1_6')+"</p>");
            $(".marked").removeClass("marked");
            $("#ta_p_l5").addClass("marked");
            $("#ta_p_l6").addClass("marked");
            this.showVariableStatusField(weightUpdates,null);
            // Neuer Status -> checkEdgeForUpdate
            statusID = 2;
        }
    }; */
    
    /**
     * Prüft, ob die aktuelle Kante ein Update benötigt
     * @method
     */
    /* this.checkEdgeForUpdate = function() {
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
    }; */
    
    /**
     * Aktualisiert, falls nötig, den Entfernungswert des aktuellen Knotens.
     * @method
     */
    /* this.updateSingleNode = function() {
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
    }; */
    
    /**
     * Prüft die nächste Kante, ob sie Teil eines negativen Zyklus ist.
     * @method
     */
    /* this.checkNextEdgeForNegativeCycle = function() {
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
    }; */

    /**
     * Markiere den negativen Kreis, der gefunden wurde.
     * @method
     */
    /* this.backtrackNegativeCycle = function() {
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
    }; */

    /**
     * Wird aufgerufen, wenn der Algorithmus erfolgreich geendet hat.
     * @method
     */
    /* this.showNoNegativeCycle = function() {
        // Erklärung im Statusfenster
        $("#ta_div_statusErklaerung").html("<h3>4 "+LNG.K('textdb_msg_case4_1')+"</h3>"
            + "<p>"+LNG.K('textdb_msg_case4_2')+"</p>"
            + "<h3>"+LNG.K('textdb_msg_case4_3')+"</h3>");
        $(".marked").removeClass("marked");
        $("#ta_p_l11").addClass("marked");
        this.endAlgorithm();
    }; */
    
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
    /* this.canvasMouseMoveHandler = function(e) {
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
    }; */
    
    /**
     * Blendet die Vorgängerkanten ein und aus.
     * @method
     */
    /* this.changeVorgaengerVisualization = function() {
        showVorgaenger = !showVorgaenger;
        for(var knotenID in vorgaenger) {
            if(vorgaenger[knotenID] != null) {
                graph.edges[vorgaenger[knotenID]].setHighlighted(showVorgaenger);
            }
        }
        $("#ta_tr_LegendeClickable").toggleClass("greyedOutBackground");
        this.needRedraw = true;
    }; */
    
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
    /* this.reverseLastUpdate = function(afterUpdate) {
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
    }; */
    
    /**
     * Setzt den zuletzt ausgeführten Negative Cyclce Check Schritt zurück
     * @method
     */
    /* this.reverseNegativeCycleCheck = function() {
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
    }; */
    
    /* this.reverseBacktrack = function() {
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
    }; */
    
    /* this.reverseSuccessEnding = function() {
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
        
    }; */
    
    /**
     * Trägt den Status der Variablen in die entsprechenden Felder im Pseudocode
     * Tab ein.
     * @param {Number} i    Laufvariable
     * @param {Edge} kante  Aktuell betrachtete Kante
     * @method
     */
    /* this.showVariableStatusField = function(i,kante) {
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
    }; */

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
    this.checkGraph = function() {
        $("#ta_div_statusErklaerung").html("<h3>Prüfe ob Graph euclidisch oder semi-euclidisch ist</h3>");

        var numberOfOddVertices = 0;
        var firstOddVertex = null;

        this.needRedraw = true;

        
        if(Object.keys(graph.nodes).length < 2) {       // Graph too small
            statusID = 2;
            validGraph = false;
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

        return true;

    };

    // Selectiere Start Vertice, entweder #1 (Euclidisch) oder #1 mit ungeradem Grad (Semi Euclidisch)
    this.findStartingVertex = function() {
        $("#ta_div_statusErklaerung").html("<h3>Finde Start Knoten</h3>");

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
    this.mergeTour = function() {
        $("#ta_div_statusErklaerung").html("<h3>Integriere Tour in Gesamttour</h3>");

        tourColorIndex++;
        tourColorIndex = tourColorIndex % tourColors.length;

        graph.nodes[tourStartVertex].setLayout("fillStyle", const_Colors.NodeFilling);

        var replaced = false;

        if(euclideanTour.length === 0) {
            euclideanTour = euclideanSubTour;
            euclideanSubTour = new Array();
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
                        if(euclideanSubTour[j].type == "edge") {
                            graph.edges[euclideanSubTour[j].id].setLayout("lineColor", tourColors[0]);
                        }
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
                        if(euclideanSubTour[j].type == "edge") {
                            graph.edges[euclideanSubTour[j].id].setLayout("lineColor", tourColors[0]);
                        }
                        newTour.push(euclideanSubTour[j]);
                    }
                    replaced = true;
                }else{
                    newTour.push(euclideanTour[i]);
                }
            }

            euclideanTour = newTour;

        }

        if(debugConsole) console.log("Current Complete Euclidean Tour: ", euclideanTour);

        statusID = 7;

    };

    // Check ob Tour ein Euclidischer Zug ist
    // Anzahl Kanten in Tour gleich Anzahl Kanten im Graph
    // Wenn ja -> returnTour()
    // Wenn nein -> findNewStartingVertex()
    this.checkForEuclideanTour = function() {
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