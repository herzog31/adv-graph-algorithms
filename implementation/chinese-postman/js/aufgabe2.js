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

    var feasible = false;

    var cost = 0;

    var start = null;

    var used = {};

    var tour = [];

    var animationId = null;

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

    this.registerClickHandlers = function() {
        canvas.on("click.Forschungsaufgabe2",function(e) {algo.canvasClickHandler(e);});
        canvas.on("contextmenu.Forschungsaufgabe2",function(e) {algo.rightClickHandler(e);});
    };
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

    var next = function(edge){
        if(tour.length == 0) return true;
        var prev = tour[tour.length-1];
        if(prev.id == edge.getSourceID()) return true;
        else return false;
    };

    var completed = function(){
        if(tour.length == 0) return false;
        var all_edges_used = (Object.keys(used).length == Object.keys(graph.edges).length);
        var back_to_start = (tour[0].id == tour[tour.length-1].id);
        return all_edges_used && back_to_start;
    };

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

    var getClickedEdge = function(e){
        for(var kantenID in graph.edges) {
            if (graph.edges[kantenID].contains(e.pageX - canvas.offset().left, e.pageY - canvas.offset().top,algo.canvas[0].getContext("2d"))) {
                return graph.edges[kantenID];
            }
        }
        return null;
    };

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

    this.showCreatedTour = function(){
        $("#tf2_div_statusErklaerung").html("<h3>"+LNG.K('aufgabe2_header')+"</h3>" + "<p>"+LNG.K('aufgabe2_tour_completed')+"</p>"
        + "<p>"+LNG.K('aufgabe2_cost') + cost + "</p>"
        + "<p>"+LNG.K('aufgabe2_optimal_cost')+ cpAlgo.getCost() + "</p>");

        $("#tf2_div_statusErklaerung").append(' <p><button id="tf2_animateTour">' + LNG.K('algorithm_status51b_desc2') +
        '</button><button id="tf2_animateTourStop">' + LNG.K('algorithm_status51b_desc3') + '</button></p>\
            <p>' + LNG.K('algorithm_status51b_desc4') + '</p>');
        $("#tf2_animateTour").button({icons: {primary: "ui-icon-play"}}).click({org: this}, this.animateTour);
        $("#tf2_animateTourStop").button({
            icons: {primary: "ui-icon-stop"},
            disabled: true
        }).click({org: this}, this.animateTourStop);
        $("#tf2_div_statusErklaerung").append('<button id="tf2_button_gotoWeiteres">'+LNG.K('aufgabe2_btn_more')+'</button>');//button
        $("#tf2_button_gotoWeiteres").button().click(function() {$("#tabs").tabs("option","active", 6);});
        warnBeforeLeave = false;
        this.needRedraw;
    };

    this.animateTourStep = function (event) {
        if (tourAnimationIndex > 0 && tour[(tourAnimationIndex - 1)].type == "vertex") {
            graph.nodes[tour[(tourAnimationIndex - 1)].id].setLayout("fillStyle", const_Colors.NodeFilling);
        }
        if (tourAnimationIndex > 0 && tour[(tourAnimationIndex - 1)].type == "edge") {
            //graph.edges[tour[(tourAnimationIndex - 1)].id].setLayout("lineColor", tourColors[color[tour[(tourAnimationIndex - 1)].id]]);
            graph.edges[tour[(tourAnimationIndex - 1)].id].setLayout("lineWidth", 3);
        }
        this.needRedraw = true;
        if (tourAnimationIndex >= tour.length) {
            this.animateTourStop(event);
            return;
        }
        if (tour[tourAnimationIndex].type == "vertex") {
            graph.nodes[tour[tourAnimationIndex].id].setLayout("fillStyle", const_Colors.NodeFillingHighlight);
        }
        if (tour[tourAnimationIndex].type == "edge") {
            //graph.edges[tour[tourAnimationIndex].id].setLayout("lineColor", tourColors[color[tour[tourAnimationIndex].id]]);
            graph.edges[tour[tourAnimationIndex].id].setLayout("lineWidth", 6);
        }
        tourAnimationIndex++;
    };

    this.animateTour = function (event) {
        $("#tf2_animateTour").button("option", "disabled", true);
        $("#tf2_animateTourStop").button("option", "disabled", false);
        tourAnimationIndex = 0;
        var self = event.data.org;
        animationId = window.setInterval(function () {
            self.animateTourStep(event);
        }, 250);
    };

    this.animateTourStop = function (event) {
        if (tourAnimationIndex > 0 && tour[(tourAnimationIndex - 1)].type == "vertex") {
            graph.nodes[tour[(tourAnimationIndex - 1)].id].setLayout("fillStyle", const_Colors.NodeFilling);
        }
        if (tourAnimationIndex > 0 && tour[(tourAnimationIndex - 1)].type == "edge") {
            graph.edges[tour[(tourAnimationIndex - 1)].id].setLayout("lineWidth", 3);
        }
        event.data.org.needRedraw = true;
        tourAnimationIndex = 0;
        window.clearInterval(animationId);
        animationId = null;
        $("#tf2_animateTour").button("option", "disabled", false);
        $("#tf2_animateTourStop").button("option", "disabled", true);
        return;
    };

    var getWarning = function(string){
        return  '<div id ="tg_div_warning" class="ui-widget"> \
        <div class="ui-state-highlight ui-corner-all" style="padding: .7em;"> \
        <div class="ui-icon ui-icon-alert errorIcon"></div> \
        ' + string +'\
        </div> \
        </div>';
    };

    this.showResult = function() {
        $("#tf2_div_statusErklaerung").html("<h3> "+LNG.K('textdb_msg_end_algo')+"</h3>" + "<p>"+LNG.K('textdb_msg_end_algo_1')+"</p>");
        $("#tf2_div_statusErklaerung").append('<button id="tf2_button_gotoWeiteres">'+LNG.K('aufgabe2_btn_more')+'</button>');
        $("#tf2_button_gotoWeiteres").button().click(function() {$("#tabs").tabs("option","active", 6);});
        this.needRedraw = true;
        warnBeforeLeave = false;
    };

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
                    graph.edges[key].setAdditionalLabel(oldState.edgeProperties[key].label);
                }
            }
        }
    };
}

// Vererbung realisieren
Forschungsaufgabe2.prototype = new CanvasDrawer;
Forschungsaufgabe2.prototype.constructor = Forschungsaufgabe2;