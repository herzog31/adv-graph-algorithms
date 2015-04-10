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
     * Anfangsknoten, von dem aus die Entfernungen berechnet werden.
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
     * @type Forschungsaufgabe1
     */
    var algo = this;
    
    /**
     * Assoziatives Array mit den Kanten, an denen der Algorithmus eine Frage stellt
     * Für die Fragen innerhalb der Updates:
     * Key: Cantorpaar aus Runde und Nummer der KantenID im Array KantenIDs
     * Value: true;
     * Für die Frage beim Check auf Updates:
     * Key: "neg"
     * Value: Nummer der KantenID im Array KantenIDs
     * @type Object
     */
    var stoppKanten = new Object();
    /**
     * Status der Frage.<br>
     * Keys: aktiv, warAktiv
     * Values: Boolean
     * @type Object
     */
    var frageStatus = new Object();
    /**
     * Parameter der aktuellen Frage (wird dann für die Antwort verwendet)<br>
     * frageKnoten: Knoten, zu dem die Frage gestellt wurde<br>
     * Antwort : String der richtigen Antwort<br>
     * AntwortGrund: Begründung der richtigen Antwort<br>
     * newNodeLabel: Label den der Knoten nach der richtigen Beantwortung bekommt (neuer Abstandswert)<br>
     * gewusst: Ob die Antwort bereits beim ersten Versuch korrekt gegeben wurd<br>
     * @type Object
     */
    this.frageParam = new Object();
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
     * Welcher Tab (Erklärung oder Pseudocode) angezeigt wurde, bevor die Frage kam.
     * Dieser Tag wird nach der Frage wieder eingeblendet.
     * @type Boolean
     */
    var tabVorFrage = null;
    /**
     * Statistiken zu den Fragen
     * @type Object
     */
    var frageStats = {
        anzahlFragen: 5,
        richtig: 0,
        falsch: 0,
        gestellt:0
    };
    
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
        $("#tf1_button_1Schritt").button({icons:{primary: "ui-icon-seek-end"}, disabled: true});
        $("#tf1_button_vorspulen").button({icons:{primary: "ui-icon-seek-next"}, disabled: true});
        $("#tf1_button_stoppVorspulen").button({icons:{primary: "ui-icon-pause"}});
        this.registerEventHandlers();
        this.needRedraw = true;
        $("#tf1_button_1Schritt").hide();
        $("#tf1_button_stoppVorspulen").hide();
        $("#tf1_button_vorspulen").hide();
        $("#tf1_div_statusTabs").tabs();
        $(".marked").removeClass("marked");
        $("#tf1_p_l1").addClass("marked");
        $("#tf1_tr_LegendeClickable").removeClass("greyedOutBackground");
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
        $("#tf1_select_aufgabeGraph").on("change",function() {algo.setGraphHandler();});
        canvas.on("click.Forschungsaufgabe1",function(e) {algo.canvasClickHandler(e);});
        $("#tf1_button_1Schritt").on("click.Forschungsaufgabe1",function() {algo.nextStepChoice();});
        canvas.on("mousemove.Forschungsaufgabe1",function(e) {algo.canvasMouseMoveHandler(e);});
        $("#tf1_button_vorspulen").on("click.Forschungsaufgabe1",function() {algo.fastForwardAlgorithm();});
        $("#tf1_button_stoppVorspulen").on("click.Forschungsaufgabe1",function() {algo.stopFastForward();});
        $("#tf1_tr_LegendeClickable").on("click.Forschungsaufgabe1",function() {algo.changeVorgaengerVisualization();});
    };
    
    /**
     * Entferne die Eventhandler von Buttons und canvas im Namespace ".Forschungsaufgabe1"
     * @method
     */
    this.deregisterEventHandlers = function() {
        canvas.off(".Forschungsaufgabe1");
        $("#tf1_select_aufgabeGraph").off("change");
        $("#tf1_button_1Schritt").off(".Forschungsaufgabe1");
        $("#tf1_button_vorspulen").off(".Forschungsaufgabe1");
        $("#tf1_button_stoppVorspulen").off(".Forschungsaufgabe1");
        $("#tf1_tr_LegendeClickable").off(".Forschungsaufgabe1");
    };
    
    /**
     * Wählt einen Graph um darauf die Forschungsaufgabe auszuführen
     * @method
     */
    this.setGraphHandler = function() {
        var selection = $("#tf1_select_aufgabeGraph>option:selected").val();
        switch(selection) {
            case "Selbsterstellter Graph":
                this.graph = $("body").data("graph");
                break;
            case "Standardbeispiel":
                this.graph = new Graph("graphs/graph1.txt");
                break;
            case "Negativer Kreis":
                this.graph = new Graph("graphs/graph2.txt");
                break;
            case "Positiver Kreis":
                this.graph = new Graph("graphs/graph7.txt");
                break;
            default:
                //console.log("Auswahl im Dropdown Menü unbekannt, tue nichts.");
                
        }
        // Ändere auch die lokalen Variablen (und vermeide "div
        graph = this.graph;
        canvas = this.canvas;
        kantenIDs = Utilities.arrayOfKeys(graph.edges);
        this.needRedraw = true;
    };
    
    /**
     * Wird aufgerufen, sobald auf das Canvas geklickt wird. 
     * @param {jQuery.Event} e jQuery Event Objekt, gibt Koordinaten
     * @method
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
                    $("#tf1_select_aufgabeGraph").hide();
                    $("#tf1_button_1Schritt").show();
                    $("#tf1_button_vorspulen").show();
                    $("#tf1_div_statusErklaerung").html("<h3>"+LNG.K('textdb_msg_case5_1')+"</h3>");
                    $("#tf1_button_1Schritt").button("option", "disabled", false);
                    $("#tf1_button_vorspulen").button("option", "disabled", false);
                    statusID = 0;
                    this.setFragePunkte();
                    break;                   // Maximal einen Knoten auswählen
                }
            }
        }
    };
    
    /**
     * Ermittelt zufällig zwei Kanten in 2 verschiedenen Runden, an denen der Algorithmus für
     * Fragen gestoppt wird.<br>
     * Nutzt die Cantorsche Paarungsfunktion um einfacher in den Array zu schreiben.
     * @method
     */
    this.setFragePunkte = function() {
        var anzahlRunden = (Utilities.objectSize(graph.nodes)-1);
        var anzahlKanten = Utilities.objectSize(graph.edges);
        var anzahlFragen = Math.min(frageStats.anzahlFragen-2,anzahlRunden*anzahlKanten);
        var fragePunkte = [];
        while(fragePunkte.length < anzahlFragen) {
            var knotenRandom = Math.ceil(Math.random()*anzahlRunden);
            var kantenRandom = Math.floor(Math.random()*anzahlKanten);
            var paar = Utilities.cantorPaar(knotenRandom,kantenRandom);
            if($.inArray(paar,fragePunkte) ==-1) {
                fragePunkte[fragePunkte.length]=paar;
            }
        }
        var stoppKanteNeg = kantenIDs[Math.floor(Math.random()*anzahlKanten)];

        for(var i = 0;i< anzahlFragen;i++) {
            stoppKanten[fragePunkte[i]] = true;
        }
        stoppKanten["neg"] = stoppKanteNeg;
        //console.log("Stopp bei Suche nach Inkonsitenzen, Kante " +stoppKanteNeg);
        frageStatus = {"aktiv" :false, "warAktiv": false};
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
        if(!frageStatus || !frageStatus.aktiv) {
            $("#tf1_button_1Schritt").button("option", "disabled", false);
        }
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
        if(frageStatus.aktiv) {
            this.stopFastForward();
        }
        if(!frageStatus.aktiv) {
            if(frageStatus.warAktiv) {
                this.removeFrageTab();
                frageStatus.warAktiv = false;
            }
            switch(statusID) {
                case 0:
                    this.initializeAlgorithm();
                    break;
                case 1:
                    this.updateWeightsInitialisation();
                    break;
                case 2:
                    this.checkEdgeForUpdate();
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
        }
   };
   
   /**
     * Initialisiere den Algorithmus, stelle die Felder auf ihre Startwerte.
     * @method
     */
   this.initializeAlgorithm = function() {
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
        $("#tf1_div_statusErklaerung").html("<h3>1 "+LNG.K('textdb_msg_case0_1')+"</h3>"
            + "<p>"+LNG.K('textdb_msg_case0_2')+"</p>"
            + "<p>"+LNG.K('textdb_msg_case0_3')+"</p>"
            + "<p>"+LNG.K('textdb_msg_case0_4')+"</p>");
        this.showVariableStatusField(null,null);
        $(".marked").removeClass("marked");
        $("#tf1_p_l2").addClass("marked");
        $("#tf1_p_l3").addClass("marked");
        $("#tf1_p_l4").addClass("marked");
        
        // Frage stellen
        this.addFrageTab();
        var knotenIDs = Utilities.arrayOfKeys(graph.nodes);
        if(knotenIDs.length <= 1) {
            statusID = 6;
            this.needRedraw = true;
            return;
        }
        var frageID = Math.floor(Math.random()*knotenIDs.length);
        while(knotenIDs[frageID] == startNode.getNodeID()) {
            frageID = Math.floor(Math.random()*knotenIDs.length);
        }
        frageStatus = {"aktiv" :true, "warAktiv": false};
        this.frageParam = {frageKnoten: graph.nodes[knotenIDs[frageID]],
                    Antwort : LNG.K('aufgabe1_answer1'),
                    AntwortGrund: "<p>"+LNG.K('aufgabe1_answer1_reason')+"</p>",
                    newNodeLabel: String.fromCharCode(8734),
                    gewusst: true
        };
        var antwortReihenfolge = this.generateRandomOrder();
        var Antworten = [LNG.K('aufgabe1_text_infinity'), this.getWeightOfInEdge(this.frageParam.frageKnoten.getNodeID(),[0]), "0"];
        this.frageParam.frageKnoten.setLayout("fillStyle",const_Colors.NodeFillingQuestion);
        this.frageParam.frageKnoten.setLabel("");
        $("#tf1_div_Frage").html(LNG.K('aufgabe1_text_question')+" " + ++frageStats.gestellt +" "+LNG.K('textdb_text_of')+" " +frageStats.anzahlFragen);
        $("#tf1_div_Frage").append("<p class=\"frage\">"+LNG.K('aufgabe1_question1')+"</p>");
        for(var i=0;i<antwortReihenfolge.length;i++) {
            $("#tf1_div_Antworten").append("<input type=\"radio\" id=\"tf1_input_frage1_"+antwortReihenfolge[i].toString() + "\" name=\"frage1\"/>"
                + "<label id=\"tf1_label_frage1_"+antwortReihenfolge[i].toString() +"\" for=\"tf1_input_frage1_"+antwortReihenfolge[i].toString()
                + "\">"+ Antworten[antwortReihenfolge[i]]+"</label><br>");
        }

        $("#tf1_input_frage1_1").click(function() {$("#tf1_label_frage1_1").addClass("ui-state-error");algo.frageParam.gewusst = false;});
        $("#tf1_input_frage1_2").click(function() {$("#tf1_label_frage1_2").addClass("ui-state-error");algo.frageParam.gewusst = false;});
        $("#tf1_input_frage1_0").click(function() {algo.handleCorrectAnswer();});
        this.needRedraw = true;
   };
    
    /**
     * Geht in die nächste Runde und prüft, ob wir fertig sind.
     * @method
     */
    this.updateWeightsInitialisation = function() {
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
        if(weightUpdates > (Utilities.objectSize(graph.nodes)-1)) {
            // Neuer Status -> Algorithmus fertig
            statusID = 4;
            $("#tf1_div_statusErklaerung").html("<h3>3 "+LNG.K('textdb_msg_case2_1')+"</h3>"
                + "<p>"+LNG.K('textdb_msg_case2_2_a')+wum1String +LNG.K('textdb_msg_case2_2_b')+"</p>"
                + "<p>"+LNG.K('textdb_msg_case2_3_a')+ weightUpdates +" "+LNG.K('textdb_msg_case2_3_b')+"</p>"
                + "<p>"+LNG.K('textdb_msg_case2_4')+"</p>");
            $(".marked").removeClass("marked");
            $("#tf1_p_l8").addClass("marked");
            this.showVariableStatusField(null,null);
            return;
        }
        else {
            // Erklärung im Statusfenster
            $("#tf1_div_statusErklaerung").html("<h3 class=\"greyedOut\">2 "+LNG.K('textdb_msg_case1_1')+"</h3>"
                + "<h3> 2." + weightUpdates.toString() + " " + LNG.K('textdb_text_phase') + " " + weightUpdates.toString() + " " + LNG.K('textdb_text_of') + " " + (Utilities.objectSize(graph.nodes)-1) + "</h3>"
                + "<p>"+LNG.K('textdb_msg_case2_2_a')+wum1String + " " +LNG.K('textdb_msg_case2_2_b')+"</p>"
                + "<p>"+LNG.K('textdb_msg_case1_5_a')+wuString+ " "+LNG.K('textdb_msg_case2_2_b')+"</p>");
            $("#tf1_div_statusErklaerung").append("<p>"+LNG.K('textdb_msg_case1_6')+"</p>");
            $(".marked").removeClass("marked");
            $("#tf1_p_l5").addClass("marked");
            $("#tf1_p_l6").addClass("marked");
            this.showVariableStatusField(weightUpdates,null);
            // Neuer Status -> checkEdgeForUpdate
            statusID = 2;
        }
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
        $("#tf1_div_statusErklaerung").html("<h3 class=\"greyedOut\">2 "+LNG.K('textdb_msg_case1_1')+"</h3>"
            + "<h3 class=\"greyedOut\"> 2." + weightUpdates.toString() + " " + LNG.K('textdb_text_phase') + " " + weightUpdates.toString() + " " + LNG.K('textdb_text_of') + " " + (Utilities.objectSize(graph.nodes)-1) + "</h3>"
            + "<h3> 2." + weightUpdates.toString() + "." + (nextKantenID+1) + " " +LNG.K('textdb_msg_case1_2')+"</h3>"
            + "<p>"+LNG.K('textdb_msg_case1_3')+"</p>"
            + "<p>"+LNG.K('textdb_msg_case1_4')+"</p>");
        $(".marked").removeClass("marked");
        $("#tf1_p_l7").addClass("marked");
        this.showVariableStatusField(weightUpdates,aktKante);
    };
    
    /**
     * Aktualisiert, falls nötig, den Entfernungswert des aktuellen Knotens.
     * @method
     */
    this.updateSingleNode = function() {
        var aktKante = graph.edges[kantenIDs[nextKantenID]];
        var u = aktKante.getSourceID();
        var v = aktKante.getTargetID();
        var oldWeight = null;
        var oldVorgaengerId = null;
        if(distanz[u] != "inf" && (distanz[v] == "inf" || distanz[u] + aktKante.weight < distanz[v])) {
            oldWeight = distanz[v];
            distanz[v] = distanz[u] + aktKante.weight;
            oldVorgaengerId = vorgaenger[v];
//            if(vorgaenger[v] != null) {
//                graph.edges[vorgaenger[v]].setHighlighted(false);
//            }
            vorgaenger[v] = kantenIDs[nextKantenID];
//            aktKante.setHighlighted(true);
        }
        
        // Prüfe, ob eine Frage gestellt wird.
        var updateID = Utilities.cantorPaar(weightUpdates,nextKantenID);
        nextKantenID++;
        if(stoppKanten[updateID]) {
            // Neuer Status -> checkEdgeForUpdate
            statusID = 2;
            var Antworten = this.generateAnswers1(aktKante,oldWeight);
            var AntwortGrund = "";
            if(oldWeight != null) {
                AntwortGrund = "<p>"+LNG.K('aufgabe1_answer2_reason1')+"</p>"
                                + "<p>"+LNG.K('aufgabe1_answer2_reason2')+" " + distanz[u].toString() + " + " + aktKante.weight.toString() + " < " + oldWeight.toString() + "</p>";
            }
            else {
                AntwortGrund = "<p>"+LNG.K('aufgabe1_answer2_reason3')+"</p>";
            }
            var newNodeLabel = distanz[v];
            if(newNodeLabel == "inf") {
                newNodeLabel = String.fromCharCode(8734);
            }
            this.addFrageTab();
            frageStatus = {"aktiv" :true, "warAktiv": false};
            this.frageParam = {"frageKnoten": graph.nodes[v],
                        "Antwort" : Antworten[0],
                        "AntwortGrund": AntwortGrund,
                        "newNodeLabel": newNodeLabel,
                        "frageKante": aktKante,
                        "oldVorgaenger": oldVorgaengerId,
                        gewusst: true
            };
            var antwortReihenfolge = this.generateRandomOrder();
            this.frageParam.frageKnoten.setLayout("fillStyle",const_Colors.NodeFillingQuestion);
            $("#tf1_div_Frage").html(LNG.K('aufgabe1_text_question')+" " + ++frageStats.gestellt +" "+LNG.K('textdb_text_of')+" " +frageStats.anzahlFragen);
            $("#tf1_div_Frage").append("<p class=\"frage\">"+LNG.K('aufgabe1_question1')+"</p>");
            for(var i=0;i<antwortReihenfolge.length;i++) {
                $("#tf1_div_Antworten").append("<input type=\"radio\" id=\"tf1_input_frage1_"+antwortReihenfolge[i].toString() + "\" name=\"frage1\"/>"
                    + "<label id=\"tf1_label_frage1_"+antwortReihenfolge[i].toString() +"\" for=\"tf1_input_frage1_"+antwortReihenfolge[i].toString()
                    + "\">"+ Antworten[antwortReihenfolge[i]]+"</label><br>");
            }
            $("#tf1_input_frage1_1").click(function() {$("#tf1_label_frage1_1").addClass("ui-state-error");algo.frageParam.gewusst = false;});
            $("#tf1_input_frage1_2").click(function() {$("#tf1_label_frage1_2").addClass("ui-state-error");algo.frageParam.gewusst = false;});
            $("#tf1_input_frage1_0").click(function() {algo.handleCorrectAnswer();});
            this.needRedraw = true;
        }
        else {
            // Animation -> Zurück auf Normal
            aktKante.setLayout("lineColor","black");
            aktKante.setLayout("lineWidth",2);
            if(oldWeight != null) {
                graph.nodes[v].setLabel(distanz[v].toString());
                if(oldVorgaengerId != null) {
                    graph.edges[oldVorgaengerId].setHighlighted(false);
                }
                aktKante.setHighlighted(true);
            }
            this.checkEdgeForUpdate();
        }
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
        $("#tf1_div_statusErklaerung").html("<h3 class=\"greyedOut\">3 "+LNG.K('textdb_msg_case2_1')+"</h3>"
            + "<h3>3." +(nextKantenID+1) +" " +LNG.K('textdb_msg_case2_5')+"</h3>"
            + "<p>"+LNG.K('textdb_msg_case2_6')+"</p>"
            + "<p>"+LNG.K('textdb_msg_case2_7')+"</p>"
            + "<p>"+LNG.K('textdb_msg_case2_8')+"</p>");
        $(".marked").removeClass("marked");
        $("#tf1_p_l9").addClass("marked");
        this.showVariableStatusField(null,aktKante);
        var isNeg = false;
        if(distanz[aktKante.getSourceID()]+ aktKante.weight < distanz[aktKante.getTargetID()]) {
            // Kante ist Teil eines negativen Kreises
            statusID = 5;
            isNeg = true;
        }
        
        // Frage:
        if(kantenIDs[nextKantenID] == stoppKanten.neg || (isNeg && frageStats.gestellt <frageStats.anzahlFragen)) {
            this.addFrageTab();
            $("#tf1_div_Frage").html(LNG.K('aufgabe1_text_question')+" " + ++frageStats.gestellt +" "+LNG.K('textdb_text_of')+" " +frageStats.anzahlFragen);
            $("#tf1_div_Frage").append("<p class=\"frage\">"+LNG.K('aufgabe1_question3')+"</p>");
            $("#tf1_div_Antworten").append("<input type=\"radio\" id=\"tf1_input_frage1_0\" name=\"frage1\"/>"
                    + "<label id=\"tf1_label_frage1_0\" for=\"tf1_input_frage1_0\">Ja</label><br>");
            $("#tf1_div_Antworten").append("<input type=\"radio\" id=\"tf1_input_frage1_1\" name=\"frage1\"/>"
                    + "<label id=\"tf1_label_frage1_1\" for=\"tf1_input_frage1_1\">Nein</label><br>");
            var AntwortGrund = "";
            var Antwort = "";
            this.frageParam = {frageKante: aktKante,
                          Antwort:Antwort,
                          AntwortGrund:AntwortGrund,
                          gewusst: true};
            if(isNeg) {
                $("#tf1_input_frage1_1").click(function() {$("#tf1_label_frage1_1").addClass("ui-state-error");algo.frageParam.gewusst = false;});
                $("#tf1_input_frage1_0").click(function() {algo.handleCorrectAnswer();});
                this.frageParam.Antwort = LNG.K('aufgabe1_text_yes');
                this.frageParam.AntwortGrund  = "<p>"+LNG.K('aufgabe1_answer3_reason1')+"</p>"
                                + LNG.K('aufgabe1_answer3_reason2')+" " + distanz[aktKante.getSourceID()] +" + " +aktKante.weight + " < " + distanz[aktKante.getTargetID()];
            }
            else {
                $("#tf1_input_frage1_0").click(function() {$("#tf1_label_frage1_0").addClass("ui-state-error");algo.frageParam.gewusst = false;});
                $("#tf1_input_frage1_1").click(function() {algo.handleCorrectAnswer();});
                this.frageParam.Antwort = LNG.K('aufgabe1_text_no');
                this.frageParam.AntwortGrund  = "<p>"+LNG.K('aufgabe1_answer3_reason3')+"</p>"
                                + LNG.K('aufgabe1_answer3_reason2')+" " + distanz[aktKante.getSourceID()] +" + " +aktKante.weight + " &ge; " + distanz[aktKante.getTargetID()];
            }
            frageStatus = {"aktiv" :true, "warAktiv": false};
        }
        this.needRedraw = true;
        nextKantenID++;
    };

    /**
     * Markiere den negativen Kreis, der gefunden wurde.
     * @method
     */
    this.backtrackNegativeCycle = function() {
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
        $("#tf1_div_statusErklaerung").html("<h3>4 "+LNG.K('textdb_msg_case3_1')+"</h3>"
            + "<p>"+LNG.K('textdb_msg_case3_2')+"</p>"
            + "<p>"+LNG.K('aufgabe1_msg_case3_4')+"</p>");
        $(".marked").removeClass("marked");
        $("#tf1_p_l10").addClass("marked");
        this.endAlgorithm();
    };

    /**
     * Wird aufgerufen, wenn der Algorithmus erfolgreich geendet hat.
     * @method
     */
    this.showNoNegativeCycle = function() {
        // Erklärung im Statusfenster
        $("#tf1_div_statusErklaerung").html("<h3>4 "+LNG.K('textdb_msg_case4_1')+"</h3>"
            + "<p>"+LNG.K('textdb_msg_case4_2')+"</p>"
            + "<h3>"+LNG.K('textdb_msg_case4_3')+"</h3>");
        $(".marked").removeClass("marked");
        $("#tf1_p_l11").addClass("marked");
        this.endAlgorithm();
    };
    
    /**
     * Zeigt Texte und Buttons zum Ende des Algorithmus
     * @method
     */
    this.endAlgorithm = function() {
        this.showVariableStatusField(null,null);
        // Falls wir im "Vorspulen" Modus waren, daktiviere diesen
        if(fastForwardIntervalID != null) {
            this.stopFastForward();
        }
        $("#tf1_button_1Schritt").button("option", "disabled", true);
        $("#tf1_button_vorspulen").button("option", "disabled", true);
        this.showResults();
    };

    /**
     * Handler für Mausbewegungen im Algorithmus Tab.<br>
     * Wenn mit der Maus über einen Knoten gefahren wird, wird der kürzeste Weg
     * vom Startknoten zu diesem Knoten grün markiert. <br>
     * Die Markierung wird wieder entfernt, sobald die Maus den Knoten wieder verlässt
     * @param {jQuery.Event} e
     * @method
     */
    this.canvasMouseMoveHandler = function(e) {
        if(statusID != 6) {
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
     * Wird aufgerufen, wenn die richtige Antwort auf eine Frage gegeben wurde.
     * Aktiviert die Buttons zum Weitermachen wieder und entfernt die Markierungen im Graph.
     * @method
     */
    this.handleCorrectAnswer = function() {
        $("#tf1_button_1Schritt").button("option", "disabled", false);
        $("#tf1_button_vorspulen").button("option", "disabled", false);
        $("p.frage").css("color",const_Colors.GreenText);
        $("#tf1_div_Antworten").html("<h2>"+LNG.K('aufgabe1_text_right_answer')+" " +this.frageParam.Antwort +"</h2>");
        $("#tf1_div_Antworten").append(this.frageParam.AntwortGrund);
        if(this.frageParam.frageKnoten) {
            if(this.frageParam.frageKnoten != startNode) {
                this.frageParam.frageKnoten.restoreLayout();
            }
            else {
                startNode.setLayout("fillStyle",const_Colors.NodeFillingHighlight);
            }
            this.frageParam.frageKnoten.setLabel(this.frageParam.newNodeLabel);
        }
        if(this.frageParam.frageKante) {
            this.frageParam.frageKante.setLayout("lineColor","black");
            this.frageParam.frageKante.setLayout("lineWidth",2);
        }
        if(showVorgaenger) {
            if(this.frageParam.oldVorgaenger != null) {
                graph.edges[this.frageParam.oldVorgaenger].setHighlighted(false);
            }
            if(this.frageParam.frageKnoten && vorgaenger) {
                if(vorgaenger[this.frageParam.frageKnoten.getNodeID()] != null)    {
                    graph.edges[vorgaenger[this.frageParam.frageKnoten.getNodeID()]].setHighlighted(true);
                }
            }
        }
        if(this.frageParam.gewusst) {
            frageStats.richtig++;
        }
        else {
            frageStats.falsch++;
        }
        this.needRedraw = true;
        frageStatus = {"aktiv" :false, "warAktiv": true};
    };
    
    /**
     * Generiert Antwortmöglichkeiten für Fragen zu Knotenupdates.
     * Das erste Element des Rückgabewerts ist stets die richtige Antwort
     * @param {Object} aktKante  Kante, die Grade überprüft wird. 
     * @param {Number} oldWeight null, falls kein Update stattfand, sonst der Wert des Knotens vor dem Update
     * @returns {Array} 3 Antwortmöglichkeiten, wobei die erste korrekt ist.
     * @method
     */
    this.generateAnswers1 = function(aktKante,oldWeight) {
        if(oldWeight == "inf") {
            oldWeight = LNG.K('aufgabe1_text_infinity');
        }
        var u = aktKante.getSourceID();
        var v = aktKante.getTargetID();
        var aktWeight = aktKante.weight;
        while(aktWeight == 0) {
            aktWeight = Math.ceil(Math.random()*50)-25;
        }
        if(distanz[u] == "inf" && distanz[v] == "inf") {
            return [LNG.K('aufgabe1_text_infinity'),"0",aktWeight.toString()];
        }
        if(distanz[u] == "inf") {
            return [distanz[v].toString(),LNG.K('aufgabe1_text_infinity'),(aktWeight + distanz[v]).toString()];
        }
        if(oldWeight != null) { // Update
            return [distanz[v].toString(),oldWeight.toString(),(distanz[v]-aktWeight-aktWeight).toString()];
        }
        if(distanz[v] == distanz[u] + aktWeight) {
            return [distanz[v].toString(),(distanz[u]-aktWeight).toString(),distanz[u].toString()];
        }
        if(distanz[v] != distanz[u]-aktWeight) {
            return [distanz[v].toString(),(distanz[u]+aktWeight).toString(),(distanz[u]-aktWeight).toString()];
        }
        return [distanz[v].toString(),(distanz[u]+aktWeight).toString(),distanz[u].toString()];
    };
    
    /**
     * Gibt das Gewicht einer eingehenden Kante zum angegebenen Knoten zurück,
     * dass nicht eine der verbotenen Zahlen ist.
     * @param {Number} nodeID
     * @param {Array} forbiddenNumbers
     * @returns {Number}
     * @method
     */
    this.getWeightOfInEdge = function(nodeID,forbiddenNumbers) {
        var inEdges = graph.nodes[nodeID].getInEdges();
        var retWeight = null;
        for(var kantenID in inEdges) {
            retWeight = graph.edges[kantenID].weight;
            // Prüfe, ob der Wert verboten ist
            for(var i=0;i<forbiddenNumbers.length;i++) {
                if(forbiddenNumbers[i] == retWeight) {
                    retWeight = null;
                }
            }
        }
        if(retWeight == null) {
            while(retWeight == null) {
                retWeight = Math.floor(Math.random()*100)-50;
                // Prüfe, ob der Wert verboten ist
                for(var i=0;i<forbiddenNumbers.length;i++) {
                    if(forbiddenNumbers[i] == retWeight) {
                        retWeight = null;
                    }
                }
            }
        }
        return retWeight;
    };

    /**
     * Generiert eine zufällige Permutation von [0,1,2]<br>
     * Könnte man mal allgemeiner mit Fisher-Yates machen.
     * @returns {Array} zufällige Permutation von [0,1,2]
     * @method
     */
    this.generateRandomOrder = function() {
        var randomParameter = Math.floor(Math.random()*6);
        switch(randomParameter) {
            case 0: return [0,1,2];
            case 1: return [0,2,1];
            case 2: return [1,0,2];
            case 3: return [1,2,0];
            case 4: return [2,0,1];
            case 5: return [2,1,0];
        }
        return [0,1,2];
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
        $("#tf1_tr_LegendeClickable").toggleClass("greyedOutBackground");
        this.needRedraw = true;
    };
    
    /**
     * Fügt einen Tab für die Frage hinzu.<br>
     * Deaktiviert außerdem die Buttons zum weitermachen
     * @method
     */
    this.addFrageTab = function() {
        var li = "<li id='tf1_li_FrageTab'><a href='#tf1_div_FrageTab'>"+LNG.K('aufgabe1_text_question')+"</a></li>", id= "tf1_div_FrageTab";
        $("#tf1_div_statusTabs").find(".ui-tabs-nav").append(li);
        $("#tf1_div_statusTabs").append("<div id='" + id + "'><div id='tf1_div_Frage'></div><div id='tf1_div_Antworten'></div></div>");
        $("#tf1_div_statusTabs").tabs("refresh");
        tabVorFrage = $("#tf1_div_statusTabs").tabs("option","active");
        $("#tf1_div_statusTabs").tabs("option","active",2);
        $("#tf1_button_1Schritt").button("option", "disabled", true);
        $("#tf1_button_vorspulen").button("option", "disabled", true);
    };
    
    /**
     * Entfernt den Tab für die Frage und aktiviert den vorherigen Tab.
     * @method
     */
    this.removeFrageTab = function() {
        if($("#tf1_div_statusTabs").tabs("option","active") == 2){
            $("#tf1_div_statusTabs").tabs("option","active",tabVorFrage);
        }
        $("#tf1_li_FrageTab").remove().attr("aria-controls");
        $("#tf1_div_FrageTab").remove();
        $("#tf1_div_statusTabs").tabs( "refresh" );
    };
    
    /**
     * Zeigt - in eigenem Tab - die Resultate der Aufgabe an.
     * @method
     */
    this.showResults = function() {
        var li = "<li id='tf1_li_ErgebnisseTab'><a href='#tf1_div_ErgebnisseTab'>"+LNG.K('aufgabe1_text_results')+"</a></li>", id= "tf1_div_ErgebnisseTab";
        $("#tf1_div_statusTabs").find(".ui-tabs-nav").append(li);
        $("#tf1_div_statusTabs").append("<div id='" + id + "'></div>");
        $("#tf1_div_statusTabs").tabs("refresh");
        $("#tf1_div_statusTabs").tabs("option","active",2);
        if(frageStats.anzahlFragen == frageStats.richtig) {
            $("#tf1_div_ErgebnisseTab").append("<h2>"+LNG.K('aufgabe1_result1')+"</h2>");
            $("#tf1_div_ErgebnisseTab").append("<p>"+LNG.K('aufgabe1_result2')+"</p>");
        }
        else {
            $("#tf1_div_ErgebnisseTab").append("<h2>"+LNG.K('aufgabe1_result3')+"</h2>");
            $("#tf1_div_ErgebnisseTab").append("<p>"+LNG.K('aufgabe1_result4')+" " +frageStats.anzahlFragen + "</p>");
            $("#tf1_div_ErgebnisseTab").append("<p>"+LNG.K('aufgabe1_result5')+" " +frageStats.richtig + "</p>");
            $("#tf1_div_ErgebnisseTab").append("<p>"+LNG.K('aufgabe1_result6')+" " +frageStats.falsch + "</p>");
            $("#tf1_div_ErgebnisseTab").append('<button id="tf1_button_Retry">'+LNG.K('aufgabe1_btn_retry')+'</button>');
            $("#tf1_button_Retry").button().click(function() {algo.refresh();});
        }
        $("#tf1_div_ErgebnisseTab").append("<h3>"+LNG.K('aufgabe1_btn_exe2')+"</h3>");
        $("#tf1_div_ErgebnisseTab").append('<button id="tf1_button_gotoFA2">'+LNG.K('algorithm_btn_exe2')+'</button>');
        $("#tf1_button_gotoFA2").button().click(function() {$("#tabs").tabs("option","active", 5);});
    };
}

// Vererbung realisieren
Forschungsaufgabe1.prototype = new CanvasDrawer;
Forschungsaufgabe1.prototype.constructor = Forschungsaufgabe1;