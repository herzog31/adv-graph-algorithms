/**
 * Instanz der Ungarischen Methode, erweitert die Klasse CanvasDrawer
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
     * @type HungarianMethod
     */
    var algo = this;

    /**
     * Hier die Variablen vom HK-Algo
     */

    /**
     * Hier die Variablen vom UM-Algo
     */

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
    var statusErklaerung = "#tf2_div_statusErklaerung";

    /**
     * Gibt das Pseudocodefenster an.
     */
    var pseudocode = "#tf2_div_statusPseudocode";

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
    const MATCHING_INCREASED = 7;
    const READY_TO_BUILD_TREE = 8;
    const READY_TO_BUILD_TREE_AFTER_RELABELING = 9;
    const FINISHED = 10;
    const SHOWED_EQUALITY_GRAPH = 11;
    const READY_TO_INCREASE_MATCHING = 12;

    var cost = new Array();
    this.cost = cost;

    var n;
    var lx, ly, xy, yx, S, T, slack, slackx, prev, maxMatch;

    var wr, rd;
    var x, y, root;
    var q;

    var goOn = false;

    var questions = [];
    var currentQuestion = 0;
    var currentQuestionType = false;
    var delta = -1, augmentingPathQuestions = 0, equalityGraphQuestions = 0;

    const EQUALITY_GRAPH_QUESTION = 1;
    const AUGMENTING_PATH_QUESTION = 2;

    /**
     * Vervollständigt den Graph, damit er komplett und mit der .
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
        $("#tf2_div_abspielbuttons").html("<button id=\"tf2_button_1Schritt\">"+LNG.K('algorithm_btn_next')+"</button><br>"
        +"<button id=\"tf2_button_vorspulen\">"+LNG.K('aufgabe1_btn_next_question')+"</button>"
        +"<button id=\"tf2_button_stoppVorspulen\">"+LNG.K('algorithm_btn_paus')+"</button>");
        $("#tf2_button_stoppVorspulen").hide();
        $("#tf2_button_1Schritt").button({icons:{primary: "ui-icon-seek-end"}, disabled: false});
        $("#tf2_button_vorspulen").button({icons:{primary: "ui-icon-seek-next"}, disabled: false});
        $("#tf2_button_stoppVorspulen").button({icons:{primary: "ui-icon-pause"}});
        $("#tf2_div_statusTabs").tabs();
        $(".marked").removeClass("marked");
        $("#tf2_tr_LegendeClickable").removeClass("greyedOutBackground");
        $(".marked").removeClass("marked");
        $("#tf2_p_l2").addClass("marked");
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
     * Startet den Algorithmus von Anfang an
     * @method
     */
    this.refresh = function() {
        this.destroy();
        var algo = new Forschungsaufgabe2($("body").data("graph"), $("#tf2_canvas_graph"), $("#tab_tf2"));
        $("#tab_tf2").data("algo", algo);
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
     * Nutzt den Event Namespace ".HungarianMethod"
     * @method
     */
    this.registerEventHandlers = function() {
        $("#tf2_button_1Schritt").on("click.HungarianMethod",function() {algo.singleStepHandler();});
        $("#tf2_button_vorspulen").on("click.HungarianMethod",function() {algo.fastForwardAlgorithm();});
        $("#tf2_button_stoppVorspulen").on("click.HungarianMethod",function() {algo.stopFastForward();});
        $("#tf2_tr_LegendeClickable").on("click.HungarianMethod",function() {algo.changeVorgaengerVisualization();});
    };

    /**
     * Entferne die Eventhandler von Buttons und canvas im Namespace ".HungarianMethod"
     * @method
     */
    this.deregisterEventHandlers = function() {
        canvas.off(".HungarianMethod");
        canvas.off("click.GraphDrawer");
        $("#tf2_button_1Schritt").off(".HungarianMethod");
        $("#tf2_button_vorspulen").off(".HungarianMethod");
        $("#tf2_button_stoppVorspulen").off(".HungarianMethod");
        $("#tf2_tr_LegendeClickable").off(".HungarianMethod");
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
        $("#tf2_button_vorspulen").hide();
        $("#tf2_button_stoppVorspulen").show();
        $("#tf2_button_1Schritt").button("option", "disabled", true);
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
        $("#tf2_button_vorspulen").show();
        $("#tf2_button_stoppVorspulen").hide();
        if(statusID != FINISHED) {
            $("#tf2_button_1Schritt").button("option", "disabled", false);
            $("#tf2_button_vorspulen").button("option", "disabled", false);
        }else{
            $("#tf2_button_vorspulen").button("option", "disabled", true);
            $("#tf2_button_1Schritt").button("option", "disabled", true);
        }
        window.clearInterval(fastForwardIntervalID);
        fastForwardIntervalID = null;
    };

    /**
     * In dieser Funktion wird der nächste Schritt des Algorithmus ausgewählt.
     * Welcher das ist, wird über die Variable "statusID" bestimmt.<br>
     * Mögliche Werte sind:<br>
     *  BEGIN: Initialisierung<br>
     *  READY_FOR_SEARCHING: Wähle den Wurzel des Augmentationsweges<br>
     *  READY_TO_BUILD_TREE: Konstruiere den alternierenden Baum<br>
     *  AUGMENTING_PATH_NOT_FOUND: Passe die Markierungen an<br>
     *  LABELS_UPDATED: Zeige den neuen Gleichheitsgraphen<br>
     *  SHOWED_EQUALITY_GRAPH: Nach der Anpassung von Markierungen beginne die Suche des neuen Augmentationsweges<br>
     *  MATCHING_INCREASED: Das Matching wurde vergrößert. Prüfe ob es perfekt ist und wenn nicht, dann rufe den Algorithmus noch mal auf.<br>
     *  READY_TO_BUILD_TREE_AFTER_RELABELING: Konstruiere einen alternierenden Baum nach der Anpassung von Markierungen. <br>
     *  READY_TO_START: Fange mit dem Algorithmus an. <br>
     *  AUGMENTING_PATH_FOUND: Zeige den Augmentationsweg. <br>
     *  READY_TO_INCREASE_MATCHING: Vergrößere das Matching. <br>
     *  @method
     */
    this.nextStepChoice = function () {
        if(currentDisplayStep < history.length){
            currentDisplayStep++;
            this.replayStep(currentDisplayStep);
            this.needRedraw = true;
            return;
        }
        $("#tf2_div_statusErklaerung").text("");

        switch (statusID) {
            case BEGIN:
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
            case LABELS_UPDATED:
                this.showNewEqualityGraph();
                break;
            case SHOWED_EQUALITY_GRAPH:
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
                this.markAugmentingPath();
                break;
            case READY_TO_INCREASE_MATCHING:
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
            currentQuestionType = this.askQuestion();
            if(currentQuestionType !== false) {
                switch (currentQuestionType){
                    case EQUALITY_GRAPH_QUESTION:
                        this.generateEqualityGraphQuestion();
                        break;
                    case AUGMENTING_PATH_QUESTION:
                        this.generateAugmentingPathQuestion();
                        break;
                    default:
                        console.log("Wrong question type.");
                        break;
                }
                this.showQuestionModal();
                this.stopFastForward();
                $("#tf2_button_1Schritt").button("option", "disabled", true);
                $("#tf2_button_vorspulen").button("option", "disabled", true);
            }
            this.needRedraw = true;
            this.addReplayStep();
        }
    };

    this.showNewEqualityGraph = function(){
        this.showEqualityGraph(lx, ly);
        $("#tf2_div_statusErklaerung").html(
            "<h3>" + LNG.K("aufgabe2_find_new_equality_graph") + "</h3>" +
            "<p>" + LNG.K("aufgabe2_must_find_labels") + "</p>" +
            "<p>" + LNG.K("aufgabe2_delta_set") + "</p>"+
            "<p>" + LNG.K("aufgabe2_min_delta") + " = " + delta + "\\)</p>" +
            "<p>" + LNG.K("aufgabe2_labels_actualised") + "</p>" +
            "<p>" + LNG.K("aufgabe2_label_update_formula1") + delta + LNG.K("aufgabe2_label_update_formula2") + delta + LNG.K("aufgabe2_label_update_formula3") + "</p>" +
            "<p>" + LNG.K("aufgabe2_new_graph_marked") + "</p>"
        );
        MathJax.Hub.Queue(["Typeset",MathJax.Hub,"tf2_div_statusErklaerung"]);
        $(".marked").removeClass("marked");
        $("#tf2_p_l6").addClass("marked");
        $("#tf2_p_l7").addClass("marked");
        statusID = SHOWED_EQUALITY_GRAPH;
    };


    /**
     * Fügt die Labels den Knoten hinzu.
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
     * Zeigt die Mengen S und T.
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

        $("#tf2_div_statusErklaerung").html(
            "<h3>" + LNG.K("aufgabe2_find_augmenting_path") + "</h3>" +
            "<p>" + LNG.K("aufgabe2_build_alt_path") + "</p>" +
            "<p>" + LNG.K("aufgabe2_build_stops") + "</p>");

        $("#tf2_td_setS").html(sField.join(",") || "&#8709;");
        $("#tf2_td_setT").html(tField.join(",") || "&#8709;");
    }

    /**
     * Berechnet die ursprüngliche Markierungen.
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
        this.showLabels(lx, ly);
        this.showEqualityGraph(lx, ly);
        statusID = READY_TO_START;
        $("#tf2_div_statusErklaerung").html("<h3>" + LNG.K("aufgabe2_find_equality_graph") + "</h3>"
        + "<p>" + LNG.K("aufgabe2_initial_labels") + "</p>"
        + "<p>" + LNG.K("aufgabe2_found_equality_graph") + "</p>");
        $(".marked").removeClass("marked");
        $("#tf2_p_l4").addClass("marked");
        return READY_TO_START;
    };

    /**
     * Fängt den Ablauf des Algorithmus an.
     * @method
     */
    this.augment = function() {
        if (maxMatch == cost.length) {
            statusID = FINISHED;
            this.end();
            this.showQuestionResults();
            $("#tf2_button_1Schritt").button("option", "disabled", true);
            $("#tf2_button_vorspulen").button("option", "disabled", true);
            showCurrentMatching(xy, false);
            $(".marked").removeClass("marked");
            $("#tf2_p_l13").addClass("marked");
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
        $("#tf2_div_statusErklaerung").html("<h3>" + LNG.K("aufgabe2_find_augmenting_path") + "</h3>" +
            "<h3>" + LNG.K("aufgabe2_find_root") + "</h3>" +
            "<p>" + LNG.K("aufgabe2_choose_root") + "<span style='font-weight: bold; color: " + const_Colors.NodeFillingHighlight + ";'>" + LNG.K("aufgabe2_light_green") + "</span>.</p>");
        $(".marked").removeClass("marked");
        $("#tf2_p_l6").addClass("marked");
        $("#tf2_p_l7").addClass("marked");
        return READY_FOR_SEARCHING;
    };

    /**
     * Wählt den Wurzel des Augmentationsweges aus.
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
            $("#tf2_p_l6").addClass("marked");
            $("#tf2_p_l7").addClass("marked");
            return READY_TO_BUILD_TREE;
        }
        $("#tf2_div_statusErklaerung").html(
            "<h3>" + LNG.K("aufgabe2_find_augmenting_path") + "</h3>" +
            "<p>" + LNG.K("aufgabe2_cannot_find") + " (<span style='font-weight: bold; color: " + const_Colors.NodeFillingHighlight + ";'>" + LNG.K("aufgabe2_light_green") + "</span>) " + LNG.K("aufgabe2_in_graph") + "</p>"
        );
        statusID = AUGMENTING_PATH_NOT_FOUND;
        $(".marked").removeClass("marked");
        $("#tf2_p_l8").addClass("marked");
        $("#tf2_p_l9").addClass("marked");
        return AUGMENTING_PATH_NOT_FOUND;
    };

    /**
     * Zeigt den Augmentationsweg.
     * @method
     */
    this.markAugmentingPath = function(){
        showAugmentingPath(x, y, prev, xy, yx);
        $("#tf2_div_statusErklaerung").html(
            "<h3>" + LNG.K("aufgabe2_find_augmenting_path") + "</h3>" +
            "<p>" + LNG.K("aufgabe2_found_augmenting_path") + "</p>"
        );
        statusID = READY_TO_INCREASE_MATCHING;
        return READY_TO_INCREASE_MATCHING;
    };

    /**
     * Konstruiert den alternierenden Baum.
     * @method
     */
    this.buildAlternatingTree = function(){
        if(y < n) {
            if (cost[x][y] == lx[x] + ly[y] && !T[y]) {
                if (yx[y] == -1) {
                    statusID = AUGMENTING_PATH_FOUND;
                    $(".marked").removeClass("marked");
                    $("#tf2_p_l11").addClass("marked");
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
            $("#tf2_p_l6").addClass("marked");
            $("#tf2_p_l7").addClass("marked");
            return READY_TO_BUILD_TREE;
        }
        goOn = true;
        statusID = READY_FOR_SEARCHING;
        $(".marked").removeClass("marked");
        $("#tf2_p_l6").addClass("marked");
        $("#tf2_p_l7").addClass("marked");
        return READY_FOR_SEARCHING;
    };

    /**
     * Sucht den Augmentationsweg nach der Anpassung von Markierungen.
     * @method
     */
    this.findAugmentPathAfterLabeling = function(){
        wr = rd = 0;
        y = 0;
        this.displayST(S, T);
        statusID = READY_TO_BUILD_TREE_AFTER_RELABELING;
        $(".marked").removeClass("marked");
        $("#tf2_p_l6").addClass("marked");
        $("#tf2_p_l7").addClass("marked");
        return READY_TO_BUILD_TREE_AFTER_RELABELING;
    };

    /**
     * Konstruiert den alternierenden Baum nach der Anpassung von Markierungen.
     * @method
     */
    this.buildTreeAfterRelabeling = function(){
        if(y < n){
            if (!T[y] && slack[y] == 0) {
                if (yx[y] == -1) {
                    x = slackx[y];
                    statusID = AUGMENTING_PATH_FOUND;
                    $(".marked").removeClass("marked");
                    $("#tf2_p_l11").addClass("marked");
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
            $("#tf2_p_l6").addClass("marked");
            $("#tf2_p_l7").addClass("marked");
            return READY_TO_BUILD_TREE_AFTER_RELABELING;
        }
        statusID = READY_FOR_SEARCHING;
        goOn = true;
        $(".marked").removeClass("marked");
        $("#tf2_p_l6").addClass("marked");
        $("#tf2_p_l7").addClass("marked");
        return READY_FOR_SEARCHING;
    };

    /**
     * Vergrößert das Matching.
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
        $("#tf2_div_statusErklaerung").html(
            "<h3>" + LNG.K("aufgabe2_increase_matching") + "</h3>" +
            "<p>" + LNG.K("aufgabe2_augment_matching") + "</p>"
        );
        $(".marked").removeClass("marked");
        if(maxMatch == cost.length){
            $("#tf2_p_l12").addClass("marked");
        }else {
            $("#tf2_p_l4").addClass("marked");
        }
        $("#tf2_td_setS").html("&#8709;");
        $("#tf2_td_setT").html("&#8709;");
        return MATCHING_INCREASED;
    };

    /**
     * Fügt den Knoten dem Baum hinzu.
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
        statusID = LABELS_UPDATED;
        this.showLabels(lx, ly);
        return LABELS_UPDATED;
    };

    /**
     * Legt die Werte des Arrays fest.
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

        $("#tf2_div_statusErklaerung").html(
            "<h3>" + LNG.K("aufgabe2_optimal_matching") + "</h3>" +
            "<p>" + LNG.K("aufgabe2_matching_found") + "</p>" +
            "<p>" + LNG.K("aufgabe2_total_weight") + " <strong>"+ret+"</strong>.</p>" +
            "<h3>" + LNG.K("algorithm_msg_finish") + "</h3>" +
            "<button id='tf2_button_gotoIdee' class='ui-button ui-widget ui-state-default ui-corner-all ui-button-text-only' role='button'><span class='ui-button-text'>" + LNG.K("algorithm_btn_more") + "</span></button>" +
            "<h3>" + LNG.K("aufgabe2_another_task") + "</h3>" +
            "<button id='tf2_button_gotoFA1' class='ui-button ui-widget ui-state-default ui-corner-all ui-button-text-only' role='button'><span class='ui-button-text'>" + LNG.K('algorithm_btn_exe1') + "</span></button>"
        );

        $("#tf2_button_gotoIdee").click(function() {
            $("#tabs").tabs("option", "active", 3);
        });
        $("#tf2_button_gotoFA1").click(function() {
            $("#tabs").tabs("option", "active", 4);
        });
        $("#tf2_button_gotoFA2").click(function() {
            $("#tabs").tabs("option", "active", 5);
        });
    };

    /**
     * Fügt den Wiederholungsschritt hinzu.
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
     * Wiederholt den Schritt.
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
            }
            if(fastForwardIntervalID == null){
                $("#tf2_button_1Schritt").button("option", "disabled", false);
            }
        }else{
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
            $("#tf2_div_statusErklaerung").html("<h3>" + LNG.K("aufgabe2_hungarian_method") + "</h3>" +
            "<p>" + LNG.K("aufgabe2_click_next") + "</p>");
            $(".marked").removeClass("marked");
            $("#tf2_p_l2").addClass("marked");
        }
        if(end && current == history.length){
            this.stopFastForward();
            $("#tf2_button_1Schritt").button("option", "disabled", true);
            $("#tf2_button_vorspulen").button("option", "disabled", true);
        }

        MathJax.Hub.Queue(["Typeset",MathJax.Hub,"tf2_div_statusErklaerung"]);
    };

    /**
     * Zeigt das Fragefenster.
     * @method
     */
    this.showQuestionModal = function() {
        $("#tf2_div_statusTabs").hide();
        $("#tf2_div_questionModal").show();
        $("#tf2_questionSolution").hide();
        $("#tf2_div_questionModal").find("form").submit( function( e ) {
            e.preventDefault();
            $("#tf2_button_questionClose2").click();
            $("#tf2_button_questionClose").click();
        });
    };

    /**
     * Schließt das Fragefenster.
     * @method
     */
    this.closeQuestionModal = function() {
        $("#tf2_div_statusTabs").show();
        $("#tf2_div_questionModal").hide();
        $("#tf2_button_questionClose").off();
        if(statusID !== FINISHED) {
            $("#tf2_button_1Schritt").button("option", "disabled", false);
            $("#tf2_button_vorspulen").button("option", "disabled", false);
        }else{
            $("#tf2_button_1Schritt").button("option", "disabled", true);
            $("#tf2_button_vorspulen").button("option", "disabled", true);
        }
    };

    /**
     * Erzeugt die Frage zum Gleichheitsgraph.
     * @method
     */
    this.generateEqualityGraphQuestion = function() {

        var edgeLayouts = {};
        for(var edge in graph.edges){
            edgeLayouts[edge] = [];
            edgeLayouts[edge][0] = graph.edges[edge].getLayout().lineColor;
            edgeLayouts[edge][1] = graph.edges[edge].getLayout().lineWidth;
        }

        var edgesInEqualityGraph = [];
        var correctAnswerForField = [];

        var inputs = "<table cellspacing='20' cellpadding='0'><tr><td>", source, target, edgeLabel;
        for(var i in graph.edges) {
            if(i === "8"){
                inputs += "</td><td>";
            }
            source = graph.edges[i].getSourceID();
            target = graph.edges[i].getTargetID();
            edgeLabel = '('+graph.nodes[source].getOuterLabel()+','+graph.nodes[target].getOuterLabel()+')';

            if(lx[source] + ly[(target - lx.length)] === graph.edges[i].weight) {
                edgesInEqualityGraph.push(parseInt(i));
                correctAnswerForField.push(edgeLabel);
            }

            inputs += '<input type="checkbox" id="tf2_input_question'+currentQuestion+'_'+i+'" data-answer-id="'+i+'" name="question'+currentQuestion+'_'+i+'" value="'+i+'" />\
            <label for="tf2_input_question'+currentQuestion+'_'+i+'">'+edgeLabel+'</label><br />';
        }
        inputs += "</td></tr></table>";

        questions[currentQuestion] = {type: currentQuestionType, rightAnswer: edgesInEqualityGraph};

        $("#tf2_div_questionModal").html('<div class="ui-helper-reset ui-helper-clearfix ui-widget-header ui-corner-all" style="padding: 7px;">Frage #'+(currentQuestion+1)+'</div>\
            <p>Der Algorithmus hat die Knotengewichte angepasst und wird im aktuellen Schritt einen neuen Gleichheitsgraph bestimmen. Bitte markiere alle Kanten des neuen Gleichheitsgraphs. Dafür kannst du entweder auf die Kanten im Graphen klicken oder entsprechenden Checkboxen markieren.</p>\
            <p><form id="question'+currentQuestion+'_form">'+inputs+'</form></p>\
            <p><button id="tf2_button_questionClose">Antworten</button></p>\
            <p id="tf2_questionSolution">\
            <button id="tf2_button_questionClose2">Weiter</button>\
            </p>');

        $('#question'+currentQuestion+'_form').find("input:checkbox").on("click", function(){
            var edgeId = $(this).attr("value");
            var edge = graph.edges[edgeId];
            if($(this).prop('checked') === true){
                graph.edges[$(this).attr("value")].setLayout("lineColor", "red");
                graph.edges[$(this).attr("value")].setLayout("lineWidth", 3);
            }else{
                graph.edges[$(this).attr("value")].setLayout("lineColor", edgeLayouts[edgeId][0]);
                graph.edges[$(this).attr("value")].setLayout("lineWidth", edgeLayouts[edgeId][1]);
            }
            algo.needRedraw = true;
        });

        MathJax.Hub.Queue(["Typeset", MathJax.Hub,"tf2_div_questionModal"]);

        $("#tf2_button_questionClose2").button({disabled: true}).on("click", function() {
            algo.closeQuestionModal();
            algo.nextStepChoice();
        });
        $("#tf2_button_questionClose").button({disabled: false}).on("click", function() { algo.saveAnswer(); });

        this.canvas.on("click.GraphDrawer", function(e){
            algo.edgeClickHandler(e, edgeLayouts);
        });
    };

    /**
     * Erzeugt die Frage zum Augmentationsweg.
     * @method
     */
    this.generateAugmentingPathQuestion = function(){
        var nodeLayouts = {};
        for(var node in graph.nodes){
            nodeLayouts[node] = graph.nodes[node].getLayout().fillStyle;
        }

        var augmentingPath = this.getAugmentingPath();
        questions[currentQuestion] = {type: currentQuestionType, rightAnswer: augmentingPath};

        var input = '<input type="text" id="tf2_input_question' + currentQuestion + '" name="question' + currentQuestion + '"/>';
        var startNodeLabel;
        for(var i = 0; i < S.length; i++){
            if(S[i]){
                startNodeLabel = graph.nodes[i].getOuterLabel();
            }
        }
        $("#tf2_div_questionModal").html('<div class="ui-helper-reset ui-helper-clearfix ui-widget-header ui-corner-all" style="padding: 7px;">Frage #'+(currentQuestion+1)+'</div>\
            <p>Im aktuellen Schritt wird der Algorithmus ausgehend vom <span style="font-weight: bold; color: ' + const_Colors.NodeFillingHighlight + ';">hell grün</span> markierten Knoten einen Augmentationsweg bestimmen. Bitte klicke beginnend bei Knoten <span style="font-weight: bold;">' + startNodeLabel + '</span> auf die Knoten des neuen Augmentationsweges.</p>\
            <p><form id="question'+currentQuestion+'_form">'+input+'</form></p>\
            <p><button id="tf2_button_questionClose">Antworten</button></p>\
            <p id="tf2_questionSolution">\
            <button id="tf2_button_questionClose2">Weiter</button>\
            </p>');

        MathJax.Hub.Queue(["Typeset", MathJax.Hub,"tf2_div_questionModal"]);

        $("#tf2_button_questionClose2").button({disabled: true}).on("click", function() {
            algo.closeQuestionModal();
            for(var node in graph.nodes){
                graph.nodes[node].setLayout("fillStyle", nodeLayouts[node]);
            }
            algo.needRedraw = true;
            algo.nextStepChoice();
        });
        $("#tf2_button_questionClose").button({disabled: false}).on("click", function() { algo.saveAnswer(); });
        $("#tf2_input_question" + currentQuestion).focusout(function(){
            var text = $(this).val().split(" ").join("");
            var nodeArray = text.split(",");
            for(var node in graph.nodes){
                graph.nodes[node].setLayout("fillStyle", nodeLayouts[node]);
            }
            for(var i = 0; i < nodeArray.length; i++){
                for(var node in graph.nodes){
                    if(graph.nodes[node].getOuterLabel() === nodeArray[i]){
                        graph.nodes[node].setLayout("fillStyle", "red");
                        break;
                    }
                }
            }
            algo.needRedraw = true;
        });

        this.canvas.on("click.GraphDrawer", function(e){
            algo.nodeClickHandler(e, nodeLayouts);
        });
    };

    /**
     * Reagiert auf den Klick auf Canvas um die Kanten zu markieren.
     * @method
     */
    this.edgeClickHandler = function(e, edgeLayouts) {
        for(var kantenID in graph.edges) {
            if (graph.edges[kantenID].contains(e.pageX - canvas.offset().left, e.pageY - canvas.offset().top,this.canvas[0].getContext("2d"))) {
                var sourceLabel = graph.nodes[graph.edges[kantenID].getSourceID()].getOuterLabel();
                var targetLabel = graph.nodes[graph.edges[kantenID].getTargetID()].getOuterLabel();
                $('#question'+currentQuestion+'_form').find('label').each(function(i) {
                    if(this.innerHTML === "(" + sourceLabel + ","+targetLabel+")"
                        || this.innerHTML === "(" + targetLabel + "," + sourceLabel + ")") {
                        var idSelector = "#" + $(this).attr("for");
                        var box = $(idSelector);
                        box.prop("checked", !box.prop("checked"));
                    }
                });
                if(graph.edges[kantenID].getLayout().lineColor !== "red"){
                    graph.edges[kantenID].setLayout("lineColor", "red");
                    graph.edges[kantenID].setLayout("lineWidth", 3);
                }else {
                    graph.edges[kantenID].setLayout("lineColor", edgeLayouts[kantenID][0]);
                    graph.edges[kantenID].setLayout("lineWidth", edgeLayouts[kantenID][1]);
                }
                this.needRedraw = true;
                break;
            }
        }
    };

    /**
     * Reagiert auf den Klick auf Canvas um die Knoten zu markieren.
     * @method
     */
    this.nodeClickHandler = function(e, nodeLayouts) {
        for(var node in graph.nodes){
            if(Math.abs(graph.nodes[node].getCoordinates().x - (e.pageX - this.canvas.offset().left)) <= 20
                && Math.abs(graph.nodes[node].getCoordinates().y - (e.pageY - this.canvas.offset().top)) <= 20){

                var text = $("#tf2_input_question" + currentQuestion).val();
                if(graph.nodes[node].getLayout().fillStyle !== "red") {
                    if (text.length > 0) {
                        $("#tf2_input_question" + currentQuestion).val(text + ", " + graph.nodes[node].getOuterLabel());
                    } else {
                        $("#tf2_input_question" + currentQuestion).val(graph.nodes[node].getOuterLabel());
                    }
                    graph.nodes[node].setLayout("fillStyle", "red");
                }else{
                    var nodeArray = text.split(" ").join("").split(",");
                    nodeArray.splice(nodeArray.indexOf(graph.nodes[node].getOuterLabel()), 1);
                    $("#tf2_input_question" + currentQuestion).val(nodeArray.join(", "));
                    graph.nodes[node].setLayout("fillStyle", nodeLayouts[node]);
                }
                this.needRedraw = true;
                break;
            }
        }
    };

    /**
     * Setzt die Markierungen von Knoten.
     * @method
     */
    this.showLabels = function() {
        for(var i = 0; i < lx.length; i++){
            graph.nodes[i].setLabel(lx[i]);
        }

        for(var i = 0; i < ly.length; i++){
            graph.nodes[lx.length + i].setLabel(ly[i]);
        }
    };

    /**
     * Zeigt den Gleichheitsgraph.
     * @method
     */
    this.showEqualityGraph = function(lx, ly){
        for (var edge in $("body").data("graph").edges) {
            if (lx[$("body").data("graph").edges[edge].getSourceID()] +
                ly[$("body").data("graph").edges[edge].getTargetID() - lx.length]
                == $("body").data("graph").edges[edge].weight) {

                if($("body").data("graph").edges[edge].originalColor != "green"){
                    $("body").data("graph").edges[edge].originalColor = "black";
                }
                $("body").data("graph").edges[edge].setLayout("lineColor", $("body").data("graph").edges[edge].originalColor);
                $("body").data("graph").edges[edge].setLayout("lineWidth", 3);
            }else{
                $("body").data("graph").edges[edge].setLayout("lineColor", const_Colors.grey);
                $("body").data("graph").edges[edge].setLayout("lineWidth", 1);
            }
        }
        statusID = SHOWED_EQUALITY_GRAPH;
    };

    /**
     * Speichert die eingegebene Antwort.
     * @method
     */
    this.saveAnswer = function() {
        var givenAnswer = "";

        if(currentQuestionType === EQUALITY_GRAPH_QUESTION) {
            givenAnswer = [];
            $('#question'+currentQuestion+'_form').find("input[type='checkbox']").each(function() {
                $(this).attr("disabled", true);
                var isChecked = $(this).prop('checked');
                var answerId = parseInt($(this).data("answerId"));
                if(isChecked) {
                    givenAnswer.push(answerId);
                }
            });
            this.needRedraw = true;
            $('#question'+currentQuestion+'_form').find('label').each(function(i) {
                if($.inArray(i, questions[currentQuestion].rightAnswer) > -1) {
                    $(this).css("color", "green");
                }else{
                    $(this).css("color", "red");
                }
            });
            if($(givenAnswer).not(questions[currentQuestion].rightAnswer).length === 0
                && $(questions[currentQuestion].rightAnswer).not(givenAnswer).length === 0){

                $("#tf2_questionSolution").css("color", "green");
                questions[currentQuestion].answeredCorrect = true;
            }else{
                $("#tf2_questionSolution").css("color", "red");
                questions[currentQuestion].answeredCorrect = false;
            }
            this.canvas.off("click.GraphDrawer");
        }else if(currentQuestionType === AUGMENTING_PATH_QUESTION){
            var givenAnswer = $("#tf2_input_question" + currentQuestion).val().split(" ").join("").split(",");
            if($(givenAnswer).not(questions[currentQuestion].rightAnswer).length === 0
                && $(questions[currentQuestion].rightAnswer).not(givenAnswer).length === 0){

                $("#tf2_input_question" + currentQuestion).after('<span class="answer" style="color: green;"> '+questions[currentQuestion].rightAnswer+'</span>');
                $("#tf2_questionSolution").css("color", "green");
                questions[currentQuestion].answeredCorrect = true;
            }else{
                $("#tf2_input_question" + currentQuestion).after('<span class="answer" style="color: red;"> '+questions[currentQuestion].rightAnswer+'</span>');
                $("#tf2_questionSolution").css("color", "red");
                questions[currentQuestion].answeredCorrect = false;
            }
            this.canvas.off("click.GraphDrawer");
        }

        currentQuestion++;

        $("#tf2_questionSolution").show();
        $("#tf2_button_questionClose").hide();
        $("#tf2_button_questionClose2").button("option", "disabled", false);
    };

    /**
     * Findet den Augmentationsweg.
     * @method
     */
    this.getAugmentingPath = function(){
        var result = [];
        var xyTemp = xy.slice();
        var yxTemp = yx.slice();
        var augmentingPath = new Array();
        for (var cx = x, cy = y, ty; cx != -2; cx = prev[cx], cy = ty) {
            ty = xyTemp[cx];
            yxTemp[cy] = cx;
            xyTemp[cx] = cy;
            augmentingPath[augmentingPath.length] = cy;
            augmentingPath[augmentingPath.length] = cx;
        }
        var even = true;
        for(var i = augmentingPath.length - 1; i >= 0; i--){
            if(even){
                result.push(graph.nodes[augmentingPath[i]].getOuterLabel());
            }else{
                result.push(graph.nodes[augmentingPath[i] + xy.length].getOuterLabel());
            }
            even = !even;
        }
        return result;
    };

    /**
     * Stellt die Frage.
     * @method
     */
    this.askQuestion = function() {

        var randomVariable = Math.random();

        if(equalityGraphQuestions < 3 && statusID === LABELS_UPDATED
            && (equalityGraphQuestions < 2 || randomVariable > 0.5)) {

            equalityGraphQuestions++;
            return EQUALITY_GRAPH_QUESTION;
        }else if(statusID === LABELS_UPDATED && (equalityGraphQuestions >= 3 || randomVariable <= 0.5)){
            this.nextStepChoice();
        }

        if(augmentingPathQuestions < 3 && statusID === AUGMENTING_PATH_FOUND
            && (augmentingPathQuestions < 1 || randomVariable > 0.5)){

            augmentingPathQuestions++;
            return AUGMENTING_PATH_QUESTION;
        }else if(statusID === AUGMENTING_PATH_FOUND && (augmentingPathQuestions >= 3 || randomVariable <= 0.5)){
            this.nextStepChoice();
        }

        return false;

    };

    /**
     * Zeigt die Ergebnisse.
     * @method
     */
    this.showQuestionResults = function() {

        var correctAnswers = 0;
        var totalQuestions = questions.length;
        var table = "";

        for(var i = 0; i < questions.length; i++) {
            table = table + '<td style="text-align: center;">#'+(i+1)+'</td>';
            if(questions[i].answeredCorrect) {
                table = table + '<td><span class="ui-icon ui-icon-plusthick"></span> Korrekt</td>';
                correctAnswers++;
            }else{
                table = table + '<td><span class="ui-icon ui-icon-minusthick"></span> Falsch</td>';
            }
            table = "<tr>"+table+"</tr>";
        }
        table = '<table class="quizTable"><thead><tr><th>Frage</th><th>Antwort</th></tr></thead><tbody>'+table+'</tbody></table>';

        $("#tf2_div_questionModal").html('<div class="ui-helper-reset ui-helper-clearfix ui-widget-header ui-corner-all" style="padding: 7px;">Ergebnisse</div>\
            <p>Von '+totalQuestions+' Fragen hast du '+correctAnswers+' korrekt beantwortet.</p>\
            <p>'+table+'</p>\
            <p></p>\
            <p><button id="tf2_button_questionClose">Schließen</button></p>');

        $("#tf2_button_questionClose").button().one("click", function() { algo.closeQuestionModal(); });

        this.showQuestionModal();

    };
}

// Vererbung realisieren
HungarianMethod.prototype = Object.create(CanvasDrawer.prototype);
HungarianMethod.prototype.constructor = HungarianMethod;