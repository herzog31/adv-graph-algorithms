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
     * */
    var cpAlgo;
    /**
     * Die Kosten der vom Nutzer erstellten Tour
     * @type {number}
     */
    var cost = 0;
    /**
     * Startknoten des Rundgangs
     * @type {Object}
     */
    var start = null;
    /**
     * Schon benutzte Knoten
     * @type {Object}
     */
    var used = {};
    /**
     * Die vom Nutzer erstellte Tour
     * @type {Object}
     */
    var tour = [];
    /**
     * Wird fuer die Animation gebraucht
     */
    var animationId = null;
    /**
     * Wird fuer die Animation gebraucht
     * @type number
     */
    var tourAnimationIndex = 0;
    /**
     * Zeigt an, ob vor dem Verlassen des Tabs gewarnt werden soll.
     * @type Boolean
     */
    var warnBeforeLeave = true;
    /*
     * Alle benoetigten Information zur Wiederherstellung der vorangegangenen Schritte werden hier gespeichert.
     * @type Array
     * */
    var history = new Array();

    /*
     * Hier wird das Aussehen der Kanten und Knoten bestimmt
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

    /**
     * Startet die Ausführung des Algorithmus.
     * @method
     */
    this.run = function() {
        this.initCanvasDrawer();
        cpAlgo = new algorithm(graph,canvas,p_tab);
        cpAlgo.setStatusWindow('dummy');
        cpAlgo.deleteIsolatedNodes();
        cpAlgo.nextStepChoice();//check if feasible
        if(!cpAlgo.isFeasible()){
            $("#tf2_div_statusErklaerung").html("<h3>"+LNG.K('aufgabe2_header')+"</h3>" + "<p>"+LNG.K('aufgabe2_not_feasible')+"</p>");
            warnBeforeLeave = false;
        }
        else{
            while (cpAlgo.getStatusID() != SHOW_TOUR){
                cpAlgo.nextStepChoice();
            }
            cpAlgo.deleteInsertedEdges();
            this.registerEventHandlers();
        }
        this.needRedraw = true;
    };

    /**
     * Beendet die Ausführung des Algorithmus.
     * @method
     */
    this.destroy = function() {
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
     * Registriere die Klickhandler an canvas<br>
     * Nutzt den Event Namespace ".Forschungsaufgabe2"
     * @method
     */
    this.registerClickHandlers = function() {
        canvas.on("click.Forschungsaufgabe2",function(e) {algo.canvasClickHandler(e);});
        canvas.on("contextmenu.Forschungsaufgabe2",function(e) {algo.rightClickHandler(e);});
    };
    /**
     * Entferne die Klickhandler vom canvas<br>
     * Nutzt den Event Namespace ".Forschungsaufgabe2"
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
        canvas.on("click.Forschungsaufgabe2",function(e) {algo.canvasClickHandler(e);});
        canvas.on("contextmenu.Forschungsaufgabe2",function(e) {algo.rightClickHandler(e);});
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
        return cpAlgo.getStatusID();
    };
    /**
     * Prueft ob die ausgewaehlte Kante den Weg fortsetzen kann
     * @param edge
     * @returns {boolean}
     */
    var next = function(edge){
        if(tour.length == 0) return true;
        var prev = tour[tour.length-1];
        if(prev.id == edge.getSourceID()) return true;
        else return false;
    };
    /**
     * Gibt zurueck, ob die Tour komplett ist
     * @returns {boolean}
     */
    var completed = function(){
        if(tour.length == 0) return false;
        var all_edges_used = (Object.keys(used).length == Object.keys(graph.edges).length);
        var back_to_start = (tour[0].id == tour[tour.length-1].id);
        return all_edges_used && back_to_start;
    };
    /**
     * Methoden fuer die Visualisierung von Kanten und Knoten
     */
    var highlight = function(edge){
        edge.setLayout("lineColor", "green");
        edge.setLayout("lineWidth", global_Edgelayout.lineWidth*3);
        var node = algo.graph.nodes[edge.getTargetID()];
        node.setLayout("borderColor", const_Colors.NodeBorderHighlight);
        node.setLayout("borderWidth", global_NodeLayout.borderWidth*2);
    };
    var unhighlight = function(edge){
        //edge.setLayout("lineColor", global_Edgelayout.lineColor);
        edge.setLayout("lineWidth", global_Edgelayout.lineWidth);
        var node = algo.graph.nodes[edge.getTargetID()];
        node.setLayout("borderColor", const_Colors.NodeBorder);
        node.setLayout("borderWidth", global_NodeLayout.borderWidth);
    };
    var setNodeStart = function(node){
        node.setLayout("fillStyle", 'green');
        //node.setLabel('s');
    };
    /**
     * Findet die angeklickte Kante
     * @param e
     * @returns {Object|null}
     */
    var getClickedEdge = function(e){
        for(var kantenID in graph.edges) {
            if (graph.edges[kantenID].contains(e.pageX - canvas.offset().left, e.pageY - canvas.offset().top,algo.canvas[0].getContext("2d"))) {
                return graph.edges[kantenID];
            }
        }
        return null;
    };
    /**
     * Behandelt Klicks im Canvas<br>
     * @param {jQuery.Event} e jQuery Event Objekt, enthält insbes. die Koordinaten des Mauszeigers.
     * @method
     */
    this.canvasClickHandler = function(e){
        var edge = getClickedEdge(e);
        if(edge && next(edge)){
            this.addReplayStep();
            $("#tf2_div_statusErklaerung").html("<h3>"+LNG.K('aufgabe2_header')+"</h3>" + "<p>"+LNG.K('aufgabe2_path')+"</p>" + "<p>"+LNG.K('aufgabe2_legend')+"</p>");
            if(tour.length == 0){//first edge
                start = graph.nodes[edge.getSourceID()];
                tour.push({type: "vertex", id: edge.getSourceID()});
                setNodeStart(start);
            }
            else{
                unhighlight(graph.edges[tour[tour.length-2].id]);
            }
            tour.push({type: "edge", id: edge.getEdgeID()});
            tour.push({type: "vertex", id: edge.getTargetID()});
            if(used[edge.getEdgeID()]) used[edge.getEdgeID()] += 1;
            else used[edge.getEdgeID()] = 1;
            cost += edge.weight;
            highlight(edge);
            if (completed()){
                this.deregisterEventHandlers();
                unhighlight(edge);
                this.showCreatedTour();
            }
        }
        this.needRedraw = true;
    };
    /**
     * Behandelt die Rechtsklicks im Canvas<br>
     * @param {jQuery.Event} e jQuery Event Objekt, enthält insbes. die Koordinaten des Mauszeigers.
     * @method
     */
    this.rightClickHandler = function(e) {
        e.preventDefault();
        if(tour.length > 0){
            tour.pop();
            var edge = tour.pop();
            used[edge.id] -= 1;
            if(used[edge.id] == 0) delete used[edge.id];
            cost -= graph.edges[edge.id].weight;
            if(tour.length == 1) tour.pop();
            this.replayStep();
        }
        this.needRedraw = true;
    };
    /**
     * Die erstellte Tour wird angezeigt.
     * Das Ablaufen der Tour kann durch eine Animation angeschaut werden.
     */
    this.showCreatedTour = function(){
        $("#tf2_div_statusErklaerung").html("<h3>"+LNG.K('aufgabe2_header')+"</h3>" + "<p>"+LNG.K('aufgabe2_tour_completed')+"</p>"
        + "<p>"+LNG.K('aufgabe2_cost') + cost + "</p>"
        + "<p>"+LNG.K('aufgabe2_optimal_cost')+ cpAlgo.getCost() + "</p>");

        $("#tf2_div_statusErklaerung").append(' <p><button id="tf2_animateTour">' + LNG.K('aufgabe2_btn_animation') +
        '</button><button id="tf2_animateTourStop">' + LNG.K('algorithm_status51b_desc3') + '</button></p>\
            <p>' + LNG.K('aufgabe2_animation') + '</p>');
        $("#tf2_animateTour").button({icons: {primary: "ui-icon-play"}}).click({org: this}, this.animateTour);
        $("#tf2_animateTourStop").button({
            icons: {primary: "ui-icon-stop"},
            disabled: true
        }).click({org: this}, this.animateTourStop);
        $("#tf2_div_statusErklaerung").append(' <p><button id="tf2_button_gotoExecution">' + LNG.K('aufgabe2_btn_execution') +
            '</button><p>' + LNG.K('aufgabe2_execution') + '</p>' +
            '<button id="tf2_button_gotoWeiteres">'+LNG.K('aufgabe2_btn_more')+'</button>');
        $("#tf2_button_gotoWeiteres").button().click(function() {$("#tabs").tabs("option","active", 6);});
        $("#tf2_button_gotoExecution").button().click(function() {$("#tabs").tabs("option","active", 2);});
        warnBeforeLeave = false;
        this.needRedraw;
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
            //graph.edges[tour[currentEdge].id].setLayout("lineColor", tourColors[color[tour[currentEdge].id]]);
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
        $("#tf2_animateTour").button("option", "disabled", true);
        $("#tf2_animateTourStop").button("option", "disabled", false);
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
        $("#tf2_animateTour").button("option", "disabled", false);
        $("#tf2_animateTourStop").button("option", "disabled", true);
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
        var edgeProperties = {};
        for (var key in graph.edges) {
            edgeProperties[graph.edges[key].getEdgeID()] = {
                layout: JSON.stringify(graph.edges[key].getLayout()),
                label: graph.edges[key].getAdditionalLabel()
            };
        }
        history.push({
            "nodeProperties": nodeProperties,
            "edgeProperties": edgeProperties,
            "htmlSidebar": $("#tf2_div_statusErklaerung").html()
        });
    };
    /**
     * Stelle letzten Schritt auf dem Replay Stack wieder her
     * @method
     */
    this.replayStep = function () {
        if (history.length > 0) {
            var oldState = history.pop();
            $("#tf2_div_statusErklaerung").html(oldState.htmlSidebar);
            for (var key in oldState.nodeProperties) {
                if (graph.nodes[key]) {
                    graph.nodes[key].setLayoutObject(JSON.parse(oldState.nodeProperties[key].layout));
                    graph.nodes[key].setLabel(oldState.nodeProperties[key].label);}
            }
            for (var key in oldState.edgeProperties) {
                if (graph.edges[key]) {
                    graph.edges[key].setLayoutObject(JSON.parse(oldState.edgeProperties[key].layout));
                    //graph.edges[key].setAdditionalLabel(oldState.edgeProperties[key].label);
                }
            }
        }
    };
}

// Vererbung realisieren
Forschungsaufgabe2.prototype = new CanvasDrawer;
Forschungsaufgabe2.prototype.constructor = Forschungsaufgabe2;