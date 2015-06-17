/**
 * Instanz der Ungarischen Methode, erweitert die Klasse CanvasDrawer
 * @constructor
 * @augments CanvasDrawer
 * @param {Graph} p_graph Graph, auf dem der Algorithmus ausgeführt wird
 * @param {Object} p_canvas jQuery Objekt des Canvas, in dem gezeichnet wird.
 * @param {Object} p_tab jQuery Objekt des aktuellen Tabs.
 */
function HungarianMethod(p_graph,p_canvas,p_tab) {
    CanvasDrawer.call(this,p_graph,p_canvas,p_tab);
    /**
     * Convenience Objekt, damit man den Graph ohne this ansprechen kann.
     * @type Graph
     */
    var graph = this.graph;
    /**
     * Convenience Objekt, damit man das Canvas ohne this ansprechen kann.
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
     * @type HungarianMethod
     */
    var algo = this;
    /**
     * Alle benoetigten Information zur Wiederherstellung der vorangegangenen Schritte werden hier gespeichert.
     * @type Array
     */
    var history = new Array();
    /**
     * Gibt an, ob der Algorithmus am Ende ist.
     * @type Boolean
     */
    var end = false;
    /**
     * Gibt das Statusausgabefenster an.
     */
    var statusErklaerung = "#ta_div_statusErklaerung";

    /**
     * Gibt das Pseudocodefenster an.
     */
    var pseudocode = "#ta_div_statusPseudocode";

    var currentDisplayStep = 0;
    /**
     * Hier werden die Statuskonstanten definiert
     */
    const BEGIN = 0;
    const READY_TO_START = 1;
    const AUGMENTING_PATH_FOUND = 3;
    const AUGMENTING_PATH_NOT_FOUND = 4;
    const READY_FOR_SEARCHING = 5;
    const LABELS_UPDATED = 6;
    const SHOW_NEW_EQUALITY_GRAPH = 7;
    const MATCHING_INCREASED = 8;
    const READY_TO_BUILD_TREE = 9;
    const READY_TO_BUILD_TREE_AFTER_RELABELING = 10;
    const FINISHED = 11;


    /**
     * Hier werden die Variablen der Ungarischen Methode definiert
     */
    var cost = new Array();
    this.cost = cost;


    var x, y, root, n, lx, ly, xy, yx, S, T, slack,
        slackx, prev, maxMatch, wr, rd, q;

    var goOn = false;
    var showedTerms = false;
    var delta = -1;

    /**
     * Vervollständige den Graph.
     * @method
     */
    this.completeGraph = function() {

        var uNodes = 0;
        var vNodes = 0;
        var maxKey;

        for(var i in graph.nodes) {
            graph.nodes[i].originalBorder = const_Colors.NodeBorder;
            graph.nodes[i].originalFill = const_Colors.NodeFilling;
            if (graph.nodes[i].getCoordinates().y == graph_constants.U_POSITION) {
                uNodes++;
            }else{
                vNodes++;
            }
        }
        if(uNodes > vNodes){
            for(var i = 0; i < uNodes - vNodes; i++){
                var node = graph.addNode(false);
                node.setLayout("fillStyle", const_Colors.grey);
                node.setLayout("borderColor", const_Colors.grey);
                node.originalFill = const_Colors.grey;
                node.originalBorder = const_Colors.grey;
            }
        }else if (vNodes > uNodes){
            for(var i = 0; i < vNodes - uNodes; i++){
                var node = graph.addNode(true);
                node.setLayout("fillStyle", const_Colors.grey);
                node.setLayout("borderColor", const_Colors.grey);
                node.originalFill = const_Colors.grey;
                node.originalBorder = const_Colors.grey;
            }
        }
        maxKey = maxKey + Math.abs(vNodes - uNodes);
        for(var edge in graph.edges) {
            graph.edges[edge].originalColor = "black";
            graph.edges[edge].originalDashed = false;
            graph.edges[edge].originalWidth = 2;
        }
        for(var i in graph.nodes) {
            if (graph.nodes[i].getCoordinates().y == graph_constants.U_POSITION) {
                var nodeArray = new Object();
                for(var j in graph.nodes[i].getOutEdges()){
                    nodeArray[graph.nodes[i].getOutEdges()[j].getTargetID()] = true;
                }
                for(var j in graph.nodes) {
                    if (graph.nodes[j].getCoordinates().y == graph_constants.V_POSITION && !nodeArray[graph.nodes[j].getNodeID()]) {
                        var e = graph.addEdge(graph.nodes[i], graph.nodes[j], 0);
                        e.setLayout("dashed", true);
                        e.setLayout("lineWidth", 1);
                        e.setLayout("lineColor", const_Colors.grey);
                        e.originalColor = const_Colors.grey;
                        e.originalWidth = 1;
                        e.originalDashed = true;
                    }
                }
            }
        }
        var cnt = graph.getNodeIDCounter();
        maxKey = graph.getNodeIDCounter() - 1;

        for(var i in graph.nodes) {
            if (graph.nodes[i].getCoordinates().y == graph_constants.U_POSITION){
                graph.nodes[cnt] = graph.nodes[i];
                delete graph.nodes[i];
                for(var edge in graph.edges){
                    if(graph.edges[edge].getSourceID() == i){
                        graph.edges[edge].setSourceID(cnt);
                    }
                    if(graph.edges[edge].getTargetID() == i){
                        graph.edges[edge].setTargetID(cnt);
                    }
                }
                cnt++;
            }
        }
        var upperNodes = cnt;
        for(var i in graph.nodes) {
            if (graph.nodes[i].getCoordinates().y == graph_constants.V_POSITION && cnt != i){
                graph.nodes[cnt] = graph.nodes[i];
                delete graph.nodes[i];
                for(var edge in graph.edges){
                    if(graph.edges[edge].getSourceID() == i){
                        graph.edges[edge].setSourceID(cnt);
                    }
                    if(graph.edges[edge].getTargetID() == i){
                        graph.edges[edge].setTargetID(cnt);
                    }
                }
                cnt++;
            }
        }
        for(var i in graph.nodes){
            graph.nodes[parseInt(i) - maxKey - 1] = graph.nodes[i];
            delete graph.nodes[i];
            for(var edge in graph.edges){
                if(graph.edges[edge].getSourceID() == i){
                    graph.edges[edge].setSourceID(parseInt(i) - maxKey - 1);
                }
                if(graph.edges[edge].getTargetID() == i){
                    graph.edges[edge].setTargetID(parseInt(i) - maxKey - 1);
                }
            }
        }
        for(var i in graph.nodes){
            if (!$.isEmptyObject(graph.nodes[i].getOutEdges())) {
                cost[i] = new Array();
                for (var j in graph.nodes) {
                    for (var edge in graph.edges) {
                        if (graph.edges[edge].getSourceID() == i && graph.edges[edge].getTargetID() == j) {
                            cost[i][j - Object.keys(graph.nodes).length/2] = graph.edges[edge].weight;
                        }
                    }
                }
            }
        }
        n = Object.keys(graph.nodes).length/2;
        lx = new Array(n);
        ly = new Array(n);
        xy = new Array(n);
        yx = new Array(n);
        S = new Array(n);
        T = new Array(n);
        slack = new Array(n);
        slackx = new Array(n);
        prev = new Array(n);
        maxMatch = 0;

        wr = 0; rd = 0;
        root = -1;
        q = new Array(n);

    };

    /**
     * Startet die Ausführung des Algorithmus.
     * @method
     */
    this.run = function() {
        this.completeGraph();
        this.initCanvasDrawer();
        this.addNamingLabels();
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
        $(".marked").removeClass("marked");
        $("#ta_p_l2").addClass("marked");
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
        var orgGraph = $("body").data("graphOrg");
        var orgGraph = new BipartiteGraph("text", canvas, orgGraph);
        $("body").data("graph", orgGraph);
        this.drawCanvas();
    };

    /**
     * Startet den Algorithmus von Anfang an.
     * @method
     */
    this.refresh = function() {
        currentDisplayStep = 0;
        this.replayStep(currentDisplayStep);
        this.needRedraw = true;
    };

    /**
     * Zeigt and, in welchem Zustand sich der Algorithmus im Moment befindet.
     * @returns {Number} StatusID des Algorithmus
     */
    this.getStatusID = function() {
        return statusID;
    };

    /**
     * Registriere die Eventhandler an Buttons und canvas.
     * @method
     */
    this.registerEventHandlers = function() {
        $("#ta_button_1Schritt").on("click.HungarianMethod",function() {algo.singleStepHandler();});
        $("#ta_button_vorspulen").on("click.HungarianMethod",function() {algo.fastForwardAlgorithm();});
        $("#ta_button_stoppVorspulen").on("click.HungarianMethod",function() {algo.stopFastForward();});
        $("#ta_tr_LegendeClickable").on("click.HungarianMethod",function() {algo.changeVorgaengerVisualization();});
        $("#ta_button_Zurueck").on("click.HungarianMethod",function() {algo.previousStepChoice();});
    };

    /**
     * Entferne die Eventhandler von Buttons und canvas.
     * @method
     */
    this.deregisterEventHandlers = function() {
        canvas.off(".HungarianMethod");
        $("#ta_button_1Schritt").off(".HungarianMethod");
        $("#ta_button_vorspulen").off(".HungarianMethod");
        $("#ta_button_stoppVorspulen").off(".HungarianMethod");
        $("#ta_tr_LegendeClickable").off(".HungarianMethod");
        $("#ta_button_Zurueck").off(".HungarianMethod");
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
     * Stoppt das automatische Abspielen des Algorithmus.
     * @method
     */
    this.stopFastForward = function() {
        $("#ta_button_vorspulen").show();
        $("#ta_button_stoppVorspulen").hide();
        if(statusID != FINISHED) {
            $("#ta_button_1Schritt").button("option", "disabled", false);
            $("#ta_button_vorspulen").button("option", "disabled", false);
        }else{
            $("#ta_button_vorspulen").button("option", "disabled", true);
            $("#ta_button_1Schritt").button("option", "disabled", true);
        }
        $("#ta_button_Zurueck").button("option", "disabled", false);
        window.clearInterval(fastForwardIntervalID);
        fastForwardIntervalID = null;
    };

    /**
     * In dieser Funktion wird der nächste Schritt des Algorithmus ausgewählt.
     *  @method
     */
    this.nextStepChoice = function () {
        if(currentDisplayStep < history.length){
            currentDisplayStep++;
            this.replayStep(currentDisplayStep);
            this.needRedraw = true;
            return;
        }
        $("#ta_div_statusErklaerung").text("");
        switch (statusID) {
            case BEGIN:
                if ($("#ta_button_Zurueck").button("option", "disabled") && fastForwardIntervalID == null) {
                    $("#ta_button_Zurueck").button("option", "disabled", false);
                }
                this.initLabels();
                break;
            case READY_FOR_SEARCHING:
                this.iterateX();
                break;
            case READY_TO_BUILD_TREE:
                this.buildAlternatingTree();
                break;
            case AUGMENTING_PATH_NOT_FOUND:
                this.update_labels();
                break;
            case SHOW_NEW_EQUALITY_GRAPH:
                this.newEqualityGraph();
                break;
            case LABELS_UPDATED:
                this.findAugmentPathAfterLabeling();
                break;
            case MATCHING_INCREASED:
                this.augment();
                break;
            case READY_TO_BUILD_TREE_AFTER_RELABELING:
                this.buildTreeAfterRelabeling();
                break;
            case READY_TO_START:
                this.augment();
                break;
            case AUGMENTING_PATH_FOUND:
                this.increaseMatching();
                break;
            default:
                console.log("Fehlerhafte StatusID.");
                break;
        }
        if(goOn){
            goOn = false;
            this.nextStepChoice();
        }else{
            currentDisplayStep++;
            this.needRedraw = true;
            this.addReplayStep();
        }
    };

    /**
     * Fügt die Labels hinzu.
     * @method
     */
    this.addNamingLabels = function() {
        var nodeCounter = 1;
        for(var knotenID in graph.nodes) {
            graph.nodes[knotenID].setOuterLabel(String.fromCharCode("a".charCodeAt(0)+nodeCounter-1));
            nodeCounter++;
        }
    };

    /**
     * Zeige S und T Mengen.
     * @method
     */
    this.displayST = function(S, T){

        var sField = [];
        var tField = [];

        S.map(function(node, i) {
            if(node) {
                if(graph.nodes[i].getLayout().fillStyle != const_Colors.NodeFillingHighlight) {
                    graph.nodes[i].setLayout("fillStyle", "green");
                }
                sField.push(graph.nodes[i].getOuterLabel());
            }
        });

        T.map(function(node, i) {
            if(node) {
            graph.nodes[(S.length+i)].setLayout("fillStyle", "green");
            tField.push(graph.nodes[i+Object.keys(graph.vnodes).length].getOuterLabel());
            }
        });

        $("#ta_div_statusErklaerung").html(
            "<h3>" + LNG.K("algorithm_augmenting_path") + "</h3>" +
            "<p>" + LNG.K("algorithm_construct_path") + "</p>" +
            "<p>" + LNG.K("algorithm_ST_sets") + "</p>" +
            "<p>" + LNG.K("algorithm_construction_stops") + "</p>");

        $("#ta_td_setS").html(sField.join(",") || "&#8709;");
        $("#ta_td_setT").html(tField.join(",") || "&#8709;");
    };

    /**
     * Initialisiert die ursprüngliche Labels.
     * @method
     */
    this.initLabels = function(){
        this.setAll(S, false);
        this.setAll(T, false);
        this.setAll(xy, -1);
        this.setAll(yx, -1);
        this.setAll(lx, 0);
        this.setAll(ly, 0);
        for (var x = 0; x < n; x++) {
            for (var y = 0; y < n; y++) {
                if(this.cost[x][y] > lx[x]){
                    lx[x] = cost[x][y];
                }
            }
        }
        showLabels(lx, ly);
        this.showEqualityGraph(lx, ly);
        statusID = READY_TO_START;
        $("#ta_div_statusErklaerung").html("<h3>" + LNG.K("algorithm_find_eq_graph") + "</h3>"
            + "<p>" + LNG.K("algorithm_equality_graph_definition") + "</p>"
            + "<p>" + LNG.K("algorithm_construct_eq_graph") + "</p>"
            + "<p>" + LNG.K("algorithm_labels_to_graph") + "</p>");
        $(".marked").removeClass("marked");
        $("#ta_p_l4").addClass("marked");
        return READY_TO_START;
    };

    /**
     * Sucht nach dem Augmentationsweg.
     * @method
     */
    this.augment = function() {
        if (maxMatch == cost.length) {
            statusID = FINISHED;
            this.end();
            $("#ta_button_1Schritt").button("option", "disabled", true);
            showCurrentMatching(xy, false);
            $(".marked").removeClass("marked");
            $("#ta_p_l13").addClass("marked");
            return FINISHED;
        }
        this.showEqualityGraph(lx, ly);
        x, y, root = -1;
        q = new Array(n);
        wr = 0, rd = 0;
        this.setAll(S, false);
        this.setAll(T, false);
        this.setAll(prev, -1);
        for (x = 0; x < n; x++) {
            if (xy[x] == -1) {
                q[wr++] = root = x;
                prev[x] = -2;
                S[x] = true;
                break;
            }
        }

        for (y = 0; y < n; y++) {
            slack[y] = lx[root] + ly[y] - cost[root][y];
            slackx[y] = root;
        }
        showTreeRoot(S);
        statusID = READY_FOR_SEARCHING;
        $("#ta_div_statusErklaerung").html();
        $("#ta_div_statusErklaerung").append("<h3>" + LNG.K("algorithm_augmenting_path") + "</h3>" +
            "<p>" + LNG.K("algorithm_need_augmenting_path") + "</p>");

        if(!showedTerms){
            $("#ta_div_statusErklaerung").append("<p>" + LNG.K("algorithm_definitions") + "</p>");
            showedTerms = true;
        }

        $("#ta_div_statusErklaerung").append("<h3>" + LNG.K("algorithm_find_root") + "</h3>" +
            "<p>" + LNG.K("algorithm_chooses_root") + "<span style='font-weight: bold; color: " + const_Colors.NodeFillingHighlight + ";'>" + LNG.K("aufgabe2_light_green") + "</span>.</p>");
        $(".marked").removeClass("marked");
        $("#ta_p_l6").addClass("marked");
        $("#ta_p_l7").addClass("marked");
        return READY_FOR_SEARCHING;
    };

    /**
     * Sucht die Wurzel des neuen Augmentationswegs.
     * @method
     */
    this.iterateX = function(){
        if(rd < wr){
            x = q[rd++];
            y = 0;
            if(history[history.length - 1].previousStatusId == READY_TO_BUILD_TREE
                || history[history.length - 1].previousStatusId == READY_TO_BUILD_TREE_AFTER_RELABELING){
                goOn = true;
            }else{
                this.displayST(S, T);
            }
            statusID = READY_TO_BUILD_TREE;
            $(".marked").removeClass("marked");
            $("#ta_p_l6").addClass("marked");
            $("#ta_p_l7").addClass("marked");
            return READY_TO_BUILD_TREE;
        }
        $("#ta_div_statusErklaerung").html(
            "<h3>" + LNG.K("algorithm_augmenting_path") + "</h3>" +
            "<p>" + LNG.K("algorithm_cannot_find_augmenting_path") + "(<span style='font-weight: bold; color: " + const_Colors.NodeFillingHighlight + ";'>" + LNG.K("aufgabe2_light_green") + "</span>)" + LNG.K("algorithm_in_current_graph") + "</p>"
        );
        statusID = AUGMENTING_PATH_NOT_FOUND;
        $(".marked").removeClass("marked");
        $("#ta_p_l8").addClass("marked");
        $("#ta_p_l9").addClass("marked");
        return AUGMENTING_PATH_NOT_FOUND;
    };

    /**
     * Bildet den alternierenden Baum.
     * @method
     */
    this.buildAlternatingTree = function(){
        if(y < n) {
            if (cost[x][y] == lx[x] + ly[y] && !T[y]) {
                if (yx[y] == -1) {
                    showAugmentingPath(x, y, prev, xy, yx);
                    $("#ta_div_statusErklaerung").html(
                        "<h3>" + LNG.K("algorithm_augmenting_path") + "</h3>" +
                        "<p>" + LNG.K("algorithm_augmenting_path_found") + "</p>"
                    );
                    statusID = AUGMENTING_PATH_FOUND;
                    $(".marked").removeClass("marked");
                    $("#ta_p_l11").addClass("marked");
                    return AUGMENTING_PATH_FOUND;
                }
                T[y] = true;
                q[wr++] = yx[y];
                this.add_to_tree(yx[y], x);
                this.displayST(S, T);
                goOn = false;
            }else{
                goOn = true;
            }
            y++;
            statusID = READY_TO_BUILD_TREE;
            $(".marked").removeClass("marked");
            $("#ta_p_l6").addClass("marked");
            $("#ta_p_l7").addClass("marked");
            return READY_TO_BUILD_TREE;
        }
        goOn = true;
        statusID = READY_FOR_SEARCHING;
        $(".marked").removeClass("marked");
        $("#ta_p_l6").addClass("marked");
        $("#ta_p_l7").addClass("marked");
        return READY_FOR_SEARCHING;
    };

    /**
     * Versucht den Augmentationsweg nach der Anpassung von Labels zu finden.
     * @method
     */
    this.findAugmentPathAfterLabeling = function(){
        wr = rd = 0;
        y = 0;
        this.displayST(S, T);
        statusID = READY_TO_BUILD_TREE_AFTER_RELABELING;
        $(".marked").removeClass("marked");
        $("#ta_p_l6").addClass("marked");
        $("#ta_p_l7").addClass("marked");
        return READY_TO_BUILD_TREE_AFTER_RELABELING;
    };

    /**
     * Bildet den alternierenden Baum nach der Anpassung von Labels.
     * @method
     */
    this.buildTreeAfterRelabeling = function(){
        if(y < n){
            if (!T[y] && slack[y] == 0) {
                if (yx[y] == -1) {
                    x = slackx[y];
                    showAugmentingPath(x, y, prev, xy, yx);
                    statusID = AUGMENTING_PATH_FOUND;
                    $("#ta_div_statusErklaerung").html(
                        "<h3>" + LNG.K("algorithm_augmenting_path") + "</h3>" +
                        "<p>" + LNG.K("algorithm_augmenting_path_found") + "</p>"
                    );
                    $(".marked").removeClass("marked");
                    $("#ta_p_l11").addClass("marked");
                    return AUGMENTING_PATH_FOUND;
                } else {
                    T[y] = true;
                    if (!S[yx[y]]) {
                        q[wr++] = yx[y];
                        this.add_to_tree(yx[y], slackx[y]);
                    }
                    this.displayST(S, T);
                }
            }else{
                goOn = true;
            }
            y++;
            statusID = READY_TO_BUILD_TREE_AFTER_RELABELING;
            $(".marked").removeClass("marked");
            $("#ta_p_l6").addClass("marked");
            $("#ta_p_l7").addClass("marked");
            return READY_TO_BUILD_TREE_AFTER_RELABELING;
        }
        statusID = READY_FOR_SEARCHING;
        goOn = true;
        $(".marked").removeClass("marked");
        $("#ta_p_l6").addClass("marked");
        $("#ta_p_l7").addClass("marked");
        return READY_FOR_SEARCHING;
    };

    /**
     * Erweitert das Matching.
     * @method
     */
    this.increaseMatching = function(){
        resetNodeLayout();
        this.showEqualityGraph(lx, ly);
        maxMatch++;
        for (var cx = x, cy = y, ty; cx != -2; cx = prev[cx], cy = ty) {
            ty = xy[cx];
            yx[cy] = cx;
            xy[cx] = cy;
        }
        showCurrentMatching(xy, true);
        statusID = MATCHING_INCREASED;
        $("#ta_div_statusErklaerung").html(
            "<h3>" + LNG.K("algorithm_increase_matching") + "</h3>" +
            "<p>" + LNG.K("algorithm_matching_can_be_increased") + "</p>" +
            "<p>" + LNG.K("algorithm_path_to_matching") + "</p>"
        );
        $(".marked").removeClass("marked");
        if(maxMatch == cost.length){
            $("#ta_p_l12").addClass("marked");
        }else {
            $("#ta_p_l4").addClass("marked");
        }
        $("#ta_td_setS").html("&#8709;");
        $("#ta_td_setT").html("&#8709;");
        return MATCHING_INCREASED;
    };

    /**
     * Zeigt den Gleichheitsgraph.
     * @method
     */
    this.showEqualityGraph = function (lx, ly){
        for (var edge in this.graph.edges) {
            if (lx[this.graph.edges[edge].getSourceID()] +
                ly[this.graph.edges[edge].getTargetID() - lx.length] == this.graph.edges[edge].weight) {

                if(this.graph.edges[edge].originalColor != "green"){
                    this.graph.edges[edge].originalColor = "black";
                }
                this.graph.edges[edge].setLayout("lineColor", $("body").data("graph").edges[edge].originalColor);
                this.graph.edges[edge].setLayout("lineWidth", 3);
            }else{
                this.graph.edges[edge].setLayout("lineColor", const_Colors.grey);
                this.graph.edges[edge].setLayout("lineWidth", 1);
            }
        }
    };

    /**
     * Zeigt den Gleichheitsgraph und den entsprechenden Text im Bereich rechts.
     * @method
     */
    this.newEqualityGraph = function(){
        this.showEqualityGraph(lx, ly);
        statusID = LABELS_UPDATED;
        $("#ta_div_statusErklaerung").html(
            "<h3>" + LNG.K("algorithm_new_graph_found") + "</h3>" +
            "<p>" + LNG.K("algorithm_labels_updated") + "</p>" +
            "<p>" + LNG.K("algorithm_formula") + "</p>" +
            "<p>\\(\\Delta = " + delta + "\\)</p>" +
            "<p>" + LNG.K("algorithm_new_graph_marked") + "</p>"
        );
        MathJax.Hub.Queue(["Typeset",MathJax.Hub,"ta_div_statusErklaerung"]);
        return LABELS_UPDATED;
    };

    /**
     * Füge den Knoten dem alternierenden Baum hinzu.
     * @method
     */
    this.add_to_tree = function (x, prevx){
        S[x] = true;
        prev[x] = prevx;
        for (var y = 0; y < n; y++) {
            if (lx[x] + ly[y] - cost[x][y] < slack[y]) {
                slack[y] = lx[x] + ly[y] - cost[x][y];
                slackx[y] = x;
            }
        }
    };

    /**
     * Passt die Markierungen an.
     * @method
     */
    this.update_labels = function() {
        var x, y;
        delta = -1;
        for (y = 0; y < n; y++) {
            if (!T[y] && (delta == -1 || slack[y] < delta)) {
                delta = slack[y];
            }
        }
        for (x = 0; x < n; x++) {
            if (S[x]) lx[x] -= delta;
        }
        for (y = 0; y < n; y++) {
            if (T[y]) ly[y] += delta;
        }
        for (y = 0; y < n; y++) {
            if (!T[y])
                slack[y] -= delta;
        }
        statusID = SHOW_NEW_EQUALITY_GRAPH;
        showLabels(lx, ly);
        $("#ta_div_statusErklaerung").html(
            "<h3>" + LNG.K("algorithm_find_new_eq_graph") + "</h3>" +
            "<p>" + LNG.K("algorithm_actualise_labels") + "</p>" +
            "<p>" + LNG.K("algorithm_delta_calculated") + "</p>"+
            "<p>" + LNG.K("algorithm_delta_equals") + delta + "\\)</p>" +
            "<p>" + LNG.K("algorithm_idea_delta") + "</p>" +
            "<p>" + LNG.K("algorithm_this_formula") + "</p>" +
            "<p>" + LNG.K("algorithm_formula") + "</p>"
        );
        MathJax.Hub.Queue(["Typeset",MathJax.Hub,"ta_div_statusErklaerung"]);
        $(".marked").removeClass("marked");
        $("#ta_p_l6").addClass("marked");
        $("#ta_p_l7").addClass("marked");
        return SHOW_NEW_EQUALITY_GRAPH;
    };

    /**
     * Initialisiert den Array mit Werten.
     * @method
     */
    this.setAll = function (arr, val) {
        var i, n = arr.length;
        for (i = 0; i < n; ++i) {
            arr[i] = val;
        }
    };

    /**
     * Zeigt Texte und Buttons zum Ende des Algorithmus
     * @method
     */
    this.end = function() {
        if (fastForwardIntervalID != null) {
            this.stopFastForward();
        }
        end = true;
        var ret = 0;
        for (var x = 0; x < n; x++) {
            ret += cost[x][xy[x]];
        }
        $("#ta_div_statusErklaerung").html(
            "<h3>" + LNG.K("algorithm_optimal_matching") + "</h3>" +
            "<p>" + LNG.K("algorithm_max_matching") + "</p>" +
            "<p>" + LNG.K("algorithm_total_weight") + "<strong>"+ret+"</strong>.</p>" +
            "<h3>" + LNG.K("algorithm_msg_finish") + "</h3>" +
            "<button id='ta_button_gotoIdee' class='ui-button ui-widget ui-state-default ui-corner-all ui-button-text-only' role='button'><span class='ui-button-text'>" + LNG.K("algorithm_btn_more") + "</span></button>" +
            "<h3>" + LNG.K("algorithm_msg_test") + "</h3>" +
            "<button id='ta_button_gotoFA1' class='ui-button ui-widget ui-state-default ui-corner-all ui-button-text-only' role='button'><span class='ui-button-text'>"+LNG.K('algorithm_btn_exe1')+"</span></button>" +
            "<button id='ta_button_gotoFA2' class='ui-button ui-widget ui-state-default ui-corner-all ui-button-text-only' role='button'><span class='ui-button-text'>"+LNG.K('algorithm_btn_exe2')+"</span></button>"
        );

        $("#ta_button_gotoIdee").click(function() {
            $("#tabs").tabs("option", "active", 3);
        });
        $("#ta_button_gotoFA1").click(function() {
            $("#tabs").tabs("option", "active", 4);
        });
        $("#ta_button_gotoFA2").click(function() {
            $("#tabs").tabs("option", "active", 5);
        });
    };

    /**
     * Ermittelt basierend auf der StatusID und anderen den vorherigen Schritt aus
     * und ruft die entsprechende Funktion auf.
     * @method
     */
    this.previousStepChoice = function() {
        currentDisplayStep--;
        $("#ta_button_1Schritt").button("option", "disabled", false);
        $("#ta_button_vorspulen").button("option", "disabled", false);
        this.replayStep(currentDisplayStep);
        this.needRedraw = true;
    };


    /**
     * Fügt den Replay-Schritt hinzu.
     * @method
     */
    this.addReplayStep = function() {
        var nodeProperties = {};
        for(var key in graph.nodes) {
            nodeProperties[key] = {edge: JSON.stringify(graph.nodes[key].getLayout()), label: graph.nodes[key].getLabel()};
        }
        var edgeProperties = {}
        for(var key in graph.edges) {
            edgeProperties[key] = {edge: JSON.stringify(graph.edges[key].getLayout()), hidden: graph.edges[key].hidden};
        }
        history.push({
            "previousStatusId": statusID,
            "nodeProperties": nodeProperties,
            "edgeProperties": edgeProperties,
            "htmlSidebar": $(statusErklaerung).html(),
            "pseudocode": $(pseudocode).html()
        });
    };

    /**
     * Spielt den Replay-Schritt ein.
     * @method
     */
    this.replayStep = function(current) {
        if(current > 0){
            var oldState = history[current - 1];
            statusID = oldState.previousStatusId;
            $(statusErklaerung).html(oldState.htmlSidebar);
            $(pseudocode).html(oldState.pseudocode);
            for(var key in oldState.nodeProperties) {
                graph.nodes[key].setLayoutObject(JSON.parse(oldState.nodeProperties[key].edge));
                graph.nodes[key].setLabel(oldState.nodeProperties[key].label);
            }
            for(var key in oldState.edgeProperties) {
                var obj = JSON.parse(oldState.edgeProperties[key].edge);
                graph.edges[key].setLayoutObject(obj);
                graph.edges[key].hidden = oldState.edgeProperties[key].hidden;
                //graph.edges[key].setAdditionalLabel(oldState.edgeProperties[key].label);
            }
            if(fastForwardIntervalID == null){
                $("#ta_button_Zurueck").button("option", "disabled", false);
                $("#ta_button_1Schritt").button("option", "disabled", false);
            }
        }else{
            $("#ta_button_Zurueck").button("option", "disabled", true);
            for(var key in graph.nodes) {
                graph.nodes[key].setLayout("fillStyle", graph.nodes[key].originalFill);
                graph.nodes[key].setLayout("borderColor", graph.nodes[key].originalBorder);
                graph.nodes[key].setLabel("");
            }
            for(var key in graph.edges) {
                if(graph.edges[key].originalDashed){
                    graph.edges[key].setLayout("lineColor", const_Colors.grey);
                    graph.edges[key].setLayout("lineWidth", 1);
                    graph.edges[key].setLayout("dashed", true);
                }else {
                    graph.edges[key].originalColor = "black";
                    graph.edges[key].originalWidth = 2;
                    graph.edges[key].setLayout("lineColor", graph.edges[key].originalColor);
                    graph.edges[key].setLayout("lineWidth", graph.edges[key].originalWidth);
                    graph.edges[key].setLayout("dashed", graph.edges[key].originalDashed);
                }
            }
            $("#ta_div_statusErklaerung").html("<h3>" + LNG.K("algorithm_hungarian_method") + "</h3>" +
                "<p>" + LNG.K("algorithm_click_next") + "</p>");
            $(".marked").removeClass("marked");
            $("#ta_p_l2").addClass("marked");
        }
        if(end && current == history.length){
            //end = false;
            this.stopFastForward();
            $("#ta_button_1Schritt").button("option", "disabled", true);
            $("#ta_button_vorspulen").button("option", "disabled", true);
        }

        MathJax.Hub.Queue(["Typeset",MathJax.Hub,"ta_div_statusErklaerung"]);
    };
}

// Vererbung realisieren
HungarianMethod.prototype = Object.create(CanvasDrawer.prototype);
HungarianMethod.prototype.constructor = HungarianMethod;