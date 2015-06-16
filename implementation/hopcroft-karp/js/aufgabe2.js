/**
 * @author Ruslan Zabrodin
 * Code für Forschungsaufgabe 2<br>
 */

/**
 * In Forschungsaufgabe 2 muss der Nutzer die Augmentationswege selber finden. <br>
 * Da auch diese Aufgabe wieder Dinge auf das Canvas zeichnet, erweitert diese Klasse
 * die Klasse CanvasDrawer. 
 * @constructor
 * @augments CanvasDrawer
 * @param {BipartiteGraph} p_graph Graph, auf dem der Algorithmus ausgeführt wird
 * @param {Object} p_canvas jQuery Objekt des Canvas, in dem gezeichnet wird.
 * @param {Object} p_tab jQuery Objekt des aktuellen Tabs.
 */
function Forschungsaufgabe2(p_graph,p_canvas,p_tab) {
    CanvasDrawer.call(this,p_graph,p_canvas,p_tab);
    /**
     * Convenience Objekt, damit man den Graph ohne this ansprechen kann.
     * @type BipartiteGraph
     */
    var graph = p_graph;
    /**
     * Convenience Objekt, damit man das Canvas ohne this. ansprechen kann.
     * @type Object
     */
    var canvas = p_canvas;
    /**
     * Closure Variable für dieses Objekt
     * @type Forschungsaufgabe2
     */
    var algo = this;
    /**
     * ID des Intervals, der für das "Vorspulen" genutzt wurde.
     * @type Number
     */
    var fastForwardIntervalID = null;
    /*
     * Das Objekt, das den Hopcroft-Karp-Algorithmus ausfuehrt
     * @type Object
     * */
    var hkAlgo;
    /*
     * Der Augmentationsweg, der vom Nutzer erstellt wird
     * @type Object
     * */
    var path = new Array();
    /*
     * Die Layouts von Knoten, damit das urspruengliche Layout sichergestellt werden kann
     * @type Object
     * */
    var layoutStack = new Array();
    /*
     * Maximale Anzahl von Wegen, die Nutzer finden soll
     * @type Number
     * */
    const MAX = 5;
    /*
     * Anzahl vom Nutzer erstellten Wege
     * @type Number
     * */
    var paths = 0;
    /**
     * Zeigt an, ob vor dem Verlassen des Tabs gewarnt werden soll.
     * @type Boolean
     */
    var warnBeforeLeave = false;
    /**
     * Zeigt an, eine Augmentations erfolgen soll
     * @type Boolean
     */
    var update = false;
    /**
     * Zeigt an, eine Augmentations erfolgt ist
     * @type Boolean
     */
    var afterUpdate = false;

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

    /**
     * Startet die Ausführung des Algorithmus.
     * @method
     */
    this.run = function() {
        this.initCanvasDrawer();
        hkAlgo = new HKAlgorithm(graph,canvas,p_tab);
        hkAlgo.deregisterEventHandlers();
        hkAlgo.setStatusWindow("dummy");
        // Die Buttons werden erst im Javascript erstellt, um Problemen bei der mehrfachen Initialisierung vorzubeugen.
        $("#tf2_div_abspielbuttons").append("<button id=\"tf2_button_1Schritt\">"+LNG.K('algorithm_btn_next')+"</button><br>");
        $("#tf2_button_1Schritt").on("click.Forschungsaufgabe1",function() {algo.nextStepChoice();});
        $("#tf2_button_1Schritt").button({icons:{primary: "ui-icon-seek-end"}, disabled: false});
        $("#tf2_button_1Schritt").show();
        $("#tf2_div_statusTabs").tabs();
        $(".marked").removeClass("marked");
        $("#tf2_tr_LegendeClickable").removeClass("greyedOutBackground");
        this.needRedraw = true;
    };
    
    /**
     * Beendet die Ausführung des Algorithmus.
     * @method
     */
    this.destroy = function() {
        this.removeAdditionalLabels();
        //hkAlgo.destroy();
        this.destroyCanvasDrawer();
        this.deregisterEventHandlers();
    };
    
    /**
     * Beendet den Tab und startet ihn neu
     * @method
     */
    this.refresh = function() {
        this.stopFastForward();
        this.destroy();
        var algo = new Forschungsaufgabe2($("body").data("graph"),$("#tf2_canvas_graph"),$("#tab_tf2"));
        $("#tab_tf2").data("algo",algo);
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
     * Registriere die Klick-Handler an Buttons und canvas<br>
     * Nutzt den Event Namespace ".Forschungsaufgabe2"
     * @method
     */
    this.registerClickHandlers = function() {
        canvas.on("click.Forschungsaufgabe2",function(e) {algo.canvasClickHandler(e);});
        canvas.on("contextmenu.Forschungsaufgabe2",function(e) {algo.rightClickHandler(e);});
    };
    /**
     * Entferne die Klick-Handler von Buttons und canvas im Namespace ".HKAlgorithm"
     * @method
     */
    this.deregisterClickHandlers = function() {
        canvas.off("click.Forschungsaufgabe2");
        canvas.off("contextmenu.Forschungsaufgabe2");
    };

    /**
     * Registriere die Eventhandler an Buttons und canvas<br>
     * Nutzt den Event Namespace ".Forschungsaufgabe2SN"
     * @method
     */
    this.registerEventHandlers = function() {
        //$("#tf2_select_aufgabeGraph").on("change",function() {algo.setGraphHandler();});
        //this.canvas.on("click.Forschungsaufgabe2SN",function(e) {algo.startNodeFinder(e);});
        $("#tf2_tr_LegendeClickable").on("click.Forschungsaufgabe2",function() {algo.changeVorgaengerVisualization();});
    };

    /**
     * Entferne die Eventhandler von Buttons und canvas im Namespace ".Forschungsaufgabe2"
     * und ".Forschungsaufgabe2SN"
     * @method
     */
    this.deregisterEventHandlers = function() {
        $("#tf1_select_aufgabeGraph").off("change");
        this.canvas.off(".Forschungsaufgabe2SN");
        this.canvas.off(".Forschungsaufgabe2");
        canvas.off("click.Forschungsaufgabe2");
        canvas.off("contextmenu.Forschungsaufgabe2");
        $("#tf2_tr_LegendeClickable").off(".Forschungsaufgabe2");
        $("#tf2_button_Zurueck").off(".Forschungsaufgabe2");
    };
    /**
     * "Spult vor", führt den Algorithmus mit hoher Geschwindigkeit aus.
     * @method
     */
    this.fastForwardAlgorithm = function() {
        //$("#tf2_button_vorspulen").hide();
        //$("#tf2_button_stoppVorspulen").show();
        $("#tf2_button_1Schritt").button("option", "disabled", true);
        if(fastForwardIntervalID == null){
            var geschwindigkeit = 200;	// Geschwindigkeit, mit der der Algorithmus ausgeführt wird in Millisekunden
            fastForwardIntervalID = window.setInterval(function(){algo.nextStepChoice();},geschwindigkeit);
        }
    };
    /**
     * Stoppt das automatische Abspielen des Algorithmus
     * @method
     */
    this.stopFastForward = function() {
        //$("#tf1_button_vorspulen").show();
        //$("#tf1_button_stoppVorspulen").hide();
        $("#tf2_button_1Schritt").button("option", "disabled", false);
        window.clearInterval(fastForwardIntervalID);
        fastForwardIntervalID = null;
    };
    /**
     * Zeigt and, in welchem Zustand sich der Algorithmus im Moment befindet.
     * @returns {Number} StatusID des Algorithmus
     */
    this.getStatusID = function() {
        return hkAlgo.getStatusID();
    };
    /**
     * In dieser Funktion wird der nächste Schritt des Algorithmus ausgewählt.
     * Welcher das ist, wird über die Variable "statusID" bestimmt.<br>
     *  @method
     */
    this.nextStepChoice = function() {
        if (update) {
            hkAlgo.augmentMatching(path);
            path = new Array();
            update = false;
            afterUpdate = true;
            $("#tf2_div_statusErklaerung").html("<h3> "+LNG.K('textdb_msg_update')+"</h3>" + "<p>"+LNG.K('aufgabe2_update')+"</p>");
        }
        else if(afterUpdate){
            afterUpdate = false;
            paths++;
            $("#tf2_button_1Schritt").button("option", "disabled", true);
            hkAlgo.startNewIteration();
            this.fastForwardAlgorithm();
        }
        else{
            var algoStatus = hkAlgo.getStatusID();
            if(algoStatus == END_ALGORITHM){
                this.showResult();
            }
            else if(algoStatus == BEGIN_ITERATION || algoStatus == ALGOINIT){
                hkAlgo.nextStepChoice();
                if(Math.random() < 0 && paths < MAX) { // mit bestimmter Wahrscheinlichkeit am Iterationsanfang Weg einzeichnen
                    this.stopFastForward();
                    this.drawPath();
                }
                else this.fastForwardAlgorithm();
            }
            else if(algoStatus == NEXT_AUGMENTING_PATH){
                if(Math.random() < 0.5 && paths < MAX){
                    this.stopFastForward();
                    hkAlgo.startNewIteration();
                    this.drawPath();
                }
                else hkAlgo.nextStepChoice();
            }
            else hkAlgo.nextStepChoice();
        }
        this.needRedraw = true;
    };
    /**
     * Der Nutzer wird aufgefordert ein Augmentatonsweg einzuzeichnen
     * @method
     */
    this.drawPath = function() {
        this.registerClickHandlers();
        $("#tf2_button_1Schritt").button("option", "disabled", true);
        $("#tf2_div_statusErklaerung").html("<h3>"+LNG.K('aufgabe2_header')+"</h3>" + "<p>"+LNG.K('aufgabe2_path')+"</p>" + "<p>"+LNG.K('aufgabe2_legend')+"</p>");
    };
    /**
     * Behandelt Klicks im Canvas<br>
     * @param {jQuery.Event} e jQuery Event Objekt, enthält insbes. die Koordinaten des Mauszeigers.
     * @method
     */
    this.canvasClickHandler = function(e){
        var node = getClickedNode(e);
        if(node!=null){
            var free = !(hkAlgo.isMatched(node));
            $("#tf2_div_statusErklaerung").html("<h3>"+LNG.K('aufgabe2_header')+"</h3>" + "<p>"+LNG.K('aufgabe2_path')+"</p>" + "<p>"+LNG.K('aufgabe2_legend')+"</p>");
            if(path.length == 0){
                if(!free) {
                    $("#tf2_div_statusErklaerung").append(getWarning(LNG.K('aufgabe2_warn_1')));
                }
                else{
                    $("#tf2_div_statusErklaerung").append("<p>"+LNG.K('aufgabe2_result_1')+"</p>");
                    path.push(node);
                    layoutStack.push(node.getLayout());
                    highlightNode(node);
                }
            }
            else{
                var used = false;
                for(var i in path){
                    if(path[i]==node) used = true;
                }
                var unconnected = false;
                var edge = graph.edges[graph.getEdgeBetween(node,path[path.length-1])];
                if(edge == undefined) unconnected = true;
                var notPartner = false;
                if(((path.length-1)/2)%2 == 1 && hkAlgo.getPartner(node)!= path[path.length-1]) notPartner=true;

                if(used){
                    $("#tf2_div_statusErklaerung").append(getWarning(LNG.K('aufgabe2_warn_2')));
                }
                else if(unconnected){
                    $("#tf2_div_statusErklaerung").append(getWarning(LNG.K('aufgabe2_warn_3')));
                }
                else if(notPartner){
                    $("#tf2_div_statusErklaerung").append(getWarning(LNG.K('aufgabe2_warn_4')));
                }
                else {
                    if(free){//end of the augmenting path
                        $("#tf2_div_statusErklaerung").html("<h3> "+LNG.K('aufgabe2_header')+"</h3>" + "<p>"+LNG.K('aufgabe2_found')+"</p>");
                        update = true;
                        $("#tf1_button_1Schritt").button({disabled: false});
                        $("#tf1_button_1Schritt").show();
                        this.stopFastForward();
                        this.deregisterClickHandlers();
                    }
                    else{//grow Path
                        $("#tf2_div_statusErklaerung").append("<p>"+LNG.K('aufgabe2_result_3')+"</p>");
                    }
                    path.push(edge);
                    path.push(node);
                    layoutStack.push(edge.getLayout());
                    layoutStack.push(node.getLayout());
                    highlightEdge(edge);
                    highlightNode(node);
                }
            }
        }
        this.needRedraw = true;
    };
    /**
     * Behandelt Klicks im Canvas<br>
     * @param {jQuery.Event} e jQuery Event Objekt, enthält insbes. die Koordinaten des Mauszeigers.
     * @return {Object} Der geklickte Knoten
     * @method
     */
    var getClickedNode = function(e){
        var mx = e.pageX - canvas.offset().left;
        var my = e.pageY - canvas.offset().top;
        for(var knotenID in graph.nodes) {
            if (graph.nodes[knotenID].contains(mx, my)) {
                return graph.nodes[knotenID];
            }
        }
        return null;
    };
    /*
     * Die Warnung wird hier konstruiert
     * @method
     * */
    var getWarning = function(string){
        return  '<div id ="tg_div_warning" class="ui-widget"> \
        <div class="ui-state-highlight ui-corner-all" style="padding: .7em;"> \
        <div class="ui-icon ui-icon-alert errorIcon"></div> \
        ' + string +'\
        </div> \
        </div>';
    };

    /*
     * Methoden fuer die Visualisierung.
     * Das Layout und Aussehen von Knoten und Kanten wird hier festgelegt.
     * */
    var highlightNode = function(node){
        node.setLayout('borderColor',"Navy");
        //node.setLayout('borderColor',const_Colors.NodeBorderHighlight);
        node.setLayout('borderWidth',global_NodeLayout.borderWidth*1.5);
    };
    var highlightEdge = function(edge){
        edge.setLayout("lineWidth", global_Edgelayout.lineWidth*2.9);
    };
    var setEdgeMatched = function (edge) {
        edge.setLayout("lineColor", MATCHED_EDGE_COLOR);
        edge.setLayout("lineWidth", global_Edgelayout.lineWidth * 1.3);
    };
    var setNodeMatched = function (node) {
        node.setLayout('fillStyle', MATCHED_NODE_COLOR);
        node.setLayout('borderWidth',global_NodeLayout.borderWidth);
        node.setLayout('borderColor', global_NodeLayout.borderColor);
    };
    var markNode = function(){
        var n1 = path[path.length-1];
        n1.setLayout('borderWidth',global_NodeLayout.borderWidth*1.3);
        if(path.length>1){
            var n2 = path[path.length-2];
            n2.setLayout('borderWidth',global_NodeLayout.borderWidth*1.3);
            graph.edges[graph.getEdgeBetween(n1,n2)].setLayout("lineWidth", global_Edgelayout.lineWidth*1.7);

        }
    };

    /**
     * Behandelt die Rechtsklicks im Canvas<br>
     * @param {jQuery.Event} e jQuery Event Objekt, enthält insbes. die Koordinaten des Mauszeigers.
     * @method
     */
    this.rightClickHandler = function(e) {
        e.preventDefault();
        if(path.length>0){
            var node = path.pop();
            var layout = layoutStack.pop();
            node.setLayoutObject(layout);
            if(path.length>0){
                var edge = path.pop();
                layout = layoutStack.pop();
                edge.setLayoutObject(layout);
            }
        }
        this.needRedraw = true;
    };
    /**
     * Wählt einen Graph um darauf die Forschungsaufgabe auszuführen
     * @method
     */
    this.setGraphHandler = function() {
        var selection = $("#tf2_select_aufgabeGraph>option:selected").val();
        switch(selection) {
            case "Selbsterstellter Graph":
                this.graph = $("body").data("graph");
                break;
            case "Standardbeispiel":
                this.graph = new BipartiteGraph("graphs/graph1.txt");
                break;
            default:
                //console.log("Auswahl im Dropdown Menü unbekannt, tue nichts.");
                
        }
        // Ändere auch die lokalen Variablen (und vermeide "div
        this.needRedraw = true;
    };
    
    /**
     * Initialisiere den Algorithmus, stelle die Felder auf ihre Startwerte.
     * @method
     */
    this.initializeAlgorithm = function() {
        $("#tf2_div_statusErklaerung").html("<h3>1 "+LNG.K('textdb_msg_case0_1')+"</h3>"
            + "<p>"+LNG.K('aufgabe2_msg_1')+"</p>");
        $("#tf2_div_statusErklaerung").append("<h3>"+LNG.K('aufgabe2_msg_2')+"</h3>");
    };
    /**
     * Zeigt die Resultate der Aufgabe an.
     * @method
     */
    this.showResult = function() {
        // Falls wir im "Vorspulen" Modus waren, daktiviere diesen
        if(fastForwardIntervalID != null) {
            this.stopFastForward();
        }
        $("#tf2_button_1Schritt").hide();
        $("#tf2_div_statusErklaerung").html("<h3> "+LNG.K('textdb_msg_end_algo')+"</h3>" + "<p>"+LNG.K('textdb_msg_end_algo_1')+"</p>");
        $("#tf2_div_statusErklaerung").append('<button id="tf2_button_gotoWeiteres">'+LNG.K('aufgabe2_btn_more')+'</button>');
        $("#tf2_button_gotoWeiteres").button().click(function() {$("#tabs").tabs("option","active", 6);});
        this.needRedraw = true;
        warnBeforeLeave = false;
    };

    /**
     * Entfernt die Zusatzlabels vom Graph (vor dem Beenden)
     * @method
     */
    this.removeAdditionalLabels = function() {
        for(var kantenID in this.graph.edges) {
            this.graph.edges[kantenID].additionalLabel = null;
        }
    };
}

// Vererbung realisieren
Forschungsaufgabe2.prototype = new CanvasDrawer;
Forschungsaufgabe2.prototype.constructor = Forschungsaufgabe2;