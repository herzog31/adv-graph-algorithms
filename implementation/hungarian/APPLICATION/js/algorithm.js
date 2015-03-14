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
    const MATCHING_INCREASED = 7;
    const READY_TO_BUILD_TREE = 8;
    const READY_TO_BUILD_TREE_AFTER_RELABELING = 9;
    const FINISHED = 10;

    var cost = new Array();
    this.cost = cost;

    var n;
    var lx, ly, xy, yx, S, T, slack, slackx, prev, maxMatch;

    var wr, rd;
    var x, y, root;
    var q;

    var goOn = false;
    /**
     * Startet die Ausführung des Algorithmus.
     * @method
     */
    this.run = function() {
        //TODO move to separate function
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
     * Startet den Algorithmus von Anfang an
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
     * Registriere die Eventhandler an Buttons und canvas<br>
     * Nutzt den Event Namespace ".HungarianMethod"
     * @method
     */
    this.registerEventHandlers = function() {
//        canvas.on("mousemove.HungarianMethod",function(e) {algo.canvasMouseMoveHandler(e);});
        $("#ta_button_1Schritt").on("click.HungarianMethod",function() {algo.singleStepHandler();});
        $("#ta_button_vorspulen").on("click.HungarianMethod",function() {algo.fastForwardAlgorithm();});
        $("#ta_button_stoppVorspulen").on("click.HungarianMethod",function() {algo.stopFastForward();});
        $("#ta_tr_LegendeClickable").on("click.HungarianMethod",function() {algo.changeVorgaengerVisualization();});
        $("#ta_button_Zurueck").on("click.HungarianMethod",function() {algo.previousStepChoice();});
    };

    /**
     * Entferne die Eventhandler von Buttons und canvas im Namespace ".HungarianMethod"
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
     * Stoppt das automatische Abspielen des Algorithmus
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
            //case FINISHED:
            //    this.end();
            //    break;
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
            console.log(history);
        }
    };

    this.displayST = function(S, T){

        var sField = S.filter(function(element) {
            return element;
        });
        sField = sField.map(function(node, i) {
            if($("body").data("graph").nodes[i].getLayout().fillStyle != const_Colors.NodeFillingHighlight) {
                $("body").data("graph").nodes[i].setLayout("fillStyle", "green");
            }
            return i+1;
        });

        var tField = T.filter(function(element) {
            return element;
        });
        tField = tField.map(function(node, i) {
            $("body").data("graph").nodes[(S.length+i)].setLayout("fillStyle", "green");
            return i+1;
        });

        $("#ta_div_statusErklaerung").html(
            "<h3>Augmentationsweg bestimmen</h3>" +
            "<p>Der Algorithmus versucht nun schrittweise einen alternierenden Pfad zu konstruieren.</p>" +
            "<p>Die Konstruktion stoppt, wenn der alternierende Pfad augmentierend wird oder es keine weiteren passenden Kanten mehr gibt.</p>");

        $("#ta_td_setS").html(sField.join(",") || "&#8709;");
        $("#ta_td_setT").html(tField.join(",") || "&#8709;");
        //TODO node borders
    }

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
        statusID = READY_TO_START;
        console.log("READY_TO_START");
        $("#ta_div_statusErklaerung").html("<h3>Gleichheitsgraph bestimmen</h3>"
            + "<p>Der Algorithmus bestimmt zuerst eine initiale Markierung für jeden Knoten.</p>"
            + "<p>Anhand der Markierungen wird der Gleichheitsgraph ermittelt (<strong>schwarz</strong>).</p>");
        $(".marked").removeClass("marked");
        $("#ta_p_l4").addClass("marked");
        return READY_TO_START;
    };

    this.augment = function() {
        if (maxMatch == cost.length) {
            statusID = FINISHED;
            console.log("FINISHED");
            this.end();
            $("#ta_button_1Schritt").button("option", "disabled", true);
            showCurrentMatching(xy, false);
            //TODO show answer
            $(".marked").removeClass("marked");
            $("#ta_p_l13").addClass("marked");
            return FINISHED;
        }
        showEqualityGraph(lx, ly);
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
        console.log("READY_FOR_SEARCHING");
        $("#ta_div_statusErklaerung").html("<h3>Augmentationsweg bestimmen</h3>" +
            "<h3>Wurzel eines alternierenden Pfades finden</h3>" + 
            "<p>Der Algorithmus wählt als Wurzel einen Knoten, der noch nicht im Matching vorhanden ist und markiert ihn <span style='font-weight: bold; color: " + const_Colors.NodeFillingHighlight + ";'>hell grün</span>.</p>");
        $(".marked").removeClass("marked");
        $("#ta_p_l6").addClass("marked");
        $("#ta_p_l7").addClass("marked");
        return READY_FOR_SEARCHING;
    };

    this.iterateX = function(){
        if(rd < wr){
            x = q[rd++];
            y = 0;
            console.log("iterateX: READY_TO_BUILD_TREE");
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
        console.log("AUGMENTING_PATH_NOT_FOUND");
        $("#ta_div_statusErklaerung").html(
            "<h3>Augmentationsweg bestimmen</h3>" +
            "<p>Der Algorithmus konnte keinen Augmentationsweg mit der gewählten Wurzel (<span style='font-weight: bold; color: " + const_Colors.NodeFillingHighlight + ";'>hell grün</span>) im aktuellen Gleichheitsgraph finden.</p>"
            //TODO the algorithm howto anpassen
        );
        statusID = AUGMENTING_PATH_NOT_FOUND;
        $(".marked").removeClass("marked");
        $("#ta_p_l8").addClass("marked");
        $("#ta_p_l9").addClass("marked");
        return AUGMENTING_PATH_NOT_FOUND;
    };

    this.buildAlternatingTree = function(){
        if(y < n) {
            if (cost[x][y] == lx[x] + ly[y] && !T[y]) {
                if (yx[y] == -1) {
                    showAugmentingPath(x, y, prev, xy, yx);
                    console.log("AUGMENTING_PATH_FOUND");
                    $("#ta_div_statusErklaerung").html(
                        "<h3>Augmentationsweg bestimmen</h3>" +
                        "<p>Es wurde ein Augmentationsweg (<span style='font-weight: bold; color: red;'>rot</span>) gefunden.</p>"
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
            console.log("buildAlternatingTree: READY_TO_BUILD_TREE");
            statusID = READY_TO_BUILD_TREE;
            $(".marked").removeClass("marked");
            $("#ta_p_l6").addClass("marked");
            $("#ta_p_l7").addClass("marked");
            return READY_TO_BUILD_TREE;
        }
        goOn = true;
        console.log("READY_FOR_SEARCHING");
        statusID = READY_FOR_SEARCHING;
        $(".marked").removeClass("marked");
        $("#ta_p_l6").addClass("marked");
        $("#ta_p_l7").addClass("marked");
        return READY_FOR_SEARCHING;
    };

    this.findAugmentPathAfterLabeling = function(){
        wr = rd = 0;
        y = 0;
        console.log("READY_TO_BUILD_TREE_AFTER_RELABELING");
        this.displayST(S, T);
        statusID = READY_TO_BUILD_TREE_AFTER_RELABELING;
        $(".marked").removeClass("marked");
        $("#ta_p_l6").addClass("marked");
        $("#ta_p_l7").addClass("marked");
        return READY_TO_BUILD_TREE_AFTER_RELABELING;
    };

    this.buildTreeAfterRelabeling = function(){
        if(y < n){
            if (!T[y] && slack[y] == 0) {
                if (yx[y] == -1) {
                    x = slackx[y];
                    showAugmentingPath(x, y, prev, xy, yx);
                    statusID = AUGMENTING_PATH_FOUND;
                    console.log("AUGMENTING_PATH_FOUND");
                    $("#ta_div_statusErklaerung").html(
                        "<h3>Augmentationsweg bestimmen</h3>" +
                        "<p>Es wurde ein Augmentationsweg (<span style='font-weight: bold; color: red;'>rot</span>) gefunden.</p>"
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
            console.log("READY_TO_BUILD_TREE_AFTER_RELABELING");
            statusID = READY_TO_BUILD_TREE_AFTER_RELABELING;
            $(".marked").removeClass("marked");
            $("#ta_p_l6").addClass("marked");
            $("#ta_p_l7").addClass("marked");
            return READY_TO_BUILD_TREE_AFTER_RELABELING;
        }
        statusID = READY_FOR_SEARCHING;
        console.log("READY_FOR_SEARCHING");
        goOn = true;
        $(".marked").removeClass("marked");
        $("#ta_p_l6").addClass("marked");
        $("#ta_p_l7").addClass("marked");
        return READY_FOR_SEARCHING;
    };

    this.increaseMatching = function(){
        resetNodeLayout();
        showEqualityGraph(lx, ly);
        maxMatch++;
        for (var cx = x, cy = y, ty; cx != -2; cx = prev[cx], cy = ty) {
            ty = xy[cx];
            yx[cy] = cx;
            xy[cx] = cy;
        }
        showCurrentMatching(xy, true);
        statusID = MATCHING_INCREASED;
        console.log("MATCHING_INCREASED");
        $("#ta_div_statusErklaerung").html(
            "<h3>Matching vergrößern</h3>" +
            "<p>Mittels des gefundenen Augmentationsweges konnte das Matching (<span style='font-weight: bold; color: green;'>grün</span>) ergänzt werden.</p>"
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

    this.update_labels = function(){
        var x, y, delta = -1;
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
        showLabels(lx, ly);
        console.log("LABELS_UPDATED");
        $("#ta_div_statusErklaerung").html(
            "<h3>Neuen Gleichheitsgraph bestimmen</h3>" +
            "<p>Zur Bestimmung eines neuen Gleichheitsgraph muss der Algorithmus zunächst die Markierungen aktualisieren.</p>" + 
            "<p>Dazu wird ein \\(\\Delta\\) wie folgt bestimmt:</p>"+
            "<p>\\(\\Delta = \\min\\limits_{s \\in S\\ \\wedge\\ y \\in Y \\setminus T}\\{l(s) + l(y) - w(s,y)\\} = "+delta+"\\)</p>" +
            "<p>Die Markierungen werden dann nach folgender Formel aktualisiert:</p>" + 
            "<p>\\(\\begin{equation}l^\\prime(v) =\\begin{cases}l(v) - "+delta+" & v \\in S\\\\l(v) + "+delta+" & v \\in T\\\\l(v) & sonst\\end{cases}\\end{equation}\\)</p>" + 
            "<p>Der neue Gleichheitsgraph wurde vom Algorithmus markiert (<strong style='font-weight: bold; color: green;'>grün</strong> und <strong>schwarz</strong>).</p>"
        );
        MathJax.Hub.Queue(["Typeset",MathJax.Hub,"ta_div_statusErklaerung"]);
        $(".marked").removeClass("marked");
        $("#ta_p_l6").addClass("marked");
        $("#ta_p_l7").addClass("marked");
        return LABELS_UPDATED;
    };

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
        //answer = 0;
        //for (var x = 0; x < n; x++) {
        //    answer += cost[x][xy[x]];
        //}
        $("#ta_div_statusErklaerung").html(
            "<h3>Optimales Matching</h3>" +
            "<p>Die Ungarische Methode hat erfolgreich ein maximales Matching bestimmt.</p>" +
            "<p>Das Gesamtgewicht beträgt <strong>"+ret+"</strong>.</p>" +
            "<h3>Was nun?</h3>" +
            "<button id='ta_button_gotoIdee' class='ui-button ui-widget ui-state-default ui-corner-all ui-button-text-only' role='button'><span class='ui-button-text'>Beschreibung des Algorithmus lesen</span></button>" +
            "<h3>Forschungsaufgaben ausprobieren:</h3>" +
            "<button id='ta_button_gotoFA1' class='ui-button ui-widget ui-state-default ui-corner-all ui-button-text-only' role='button'><span class='ui-button-text'>FA1</span></button>" +
            "<button id='ta_button_gotoFA2' class='ui-button ui-widget ui-state-default ui-corner-all ui-button-text-only' role='button'><span class='ui-button-text'>FA2</span></button>"
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
            $("#ta_div_statusErklaerung").html("<h3>Die Ungarische Methode</h3>" + 
                "<p>Klicke auf <strong>Nächster Schritt</strong>, um den Algorithmus zu starten.</p>");
            $(".marked").removeClass("marked");
            $("#ta_p_l2").addClass("marked");
        }
        if(end && current == history.length){
            //end = false;
            this.stopFastForward();
            $("#ta_button_1Schritt").button("option", "disabled", true);
            $("#ta_button_vorspulen").button("option", "disabled", true);
        }
    };
}

// Vererbung realisieren
HungarianMethod.prototype = Object.create(CanvasDrawer.prototype);
HungarianMethod.prototype.constructor = HungarianMethod;