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
            if(!maxKey || parseInt(i) > maxKey){
                maxKey = parseInt(i);
            }
            if (graph.nodes[i].getCoordinates().y == graph_constants.U_POSITION) {
                uNodes++;
            }else{
                vNodes++;
            }
        }
        if(uNodes > vNodes){
            for(var i = 0; i < uNodes - vNodes; i++){
                var node = graph.addNode(false);
                node.setLayout("fillStyle", "grey");
                node.setLayout("borderColor", "grey");
                node.originalFill = "grey";
                node.originalBorder = "grey";
            }
        }else if (vNodes > uNodes){
            for(var i = 0; i < vNodes - uNodes; i++){
                var node = graph.addNode(true);
                node.setLayout("fillStyle", "grey");
                node.setLayout("borderColor", "grey");
                node.originalFill = "grey";
                node.originalBorder = "grey";
            }
        }
        maxKey = maxKey + Math.abs(vNodes - uNodes);
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
                        e.setLayout("lineColor", "grey");
                        e.originalColor = "grey";
                        e.originalDashed = true;
                        e.originalWidth = 1;
                    }
                }
            }
        }
        var cnt = maxKey + 1;
        for(var i in graph.nodes) {
            if (graph.nodes[i].getCoordinates().y == graph_constants.U_POSITION){
                graph.nodes[cnt] = graph.nodes[i];
                delete graph.nodes[i];
                for(var edge in graph.edges){
                    if(!graph.edges[edge].originalColor) {
                        graph.edges[edge].originalColor = "black";
                        graph.edges[edge].originalDashed = false;
                        graph.edges[edge].originalWidth = 2;
                    }
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
        var algo = new HungarianMethod($("body").data("graph"),$("#ta_canvas_graph"),$("#tab_ta"));
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
        $("#ta_div_statusErklaerung").text("Ursprungliche Markierungen sowie Gleichheitsgraph wurden bestimmt.");
        return READY_TO_START;
    };

    this.augment = function() {
        if (maxMatch == cost.length) {
            statusID = FINISHED;
            console.log("FINISHED");
            $("#ta_div_statusErklaerung").text("Der Algorithmus ist fertig.");
            $("#ta_button_1Schritt").button("option", "disabled", true);
            this.end();
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
        $("#ta_div_statusErklaerung").text("Die Wurzel des alternierenden Baums wurde bestimmt.");
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
                displayST(S, T);
            }
            statusID = READY_TO_BUILD_TREE;
            return READY_TO_BUILD_TREE;
        }
        console.log("AUGMENTING_PATH_NOT_FOUND");
        $("#ta_div_statusErklaerung").text("Augmentationsweg wurde nicht gefunden.");
        statusID = AUGMENTING_PATH_NOT_FOUND;
        return AUGMENTING_PATH_NOT_FOUND;
    };

    this.buildAlternatingTree = function(){
        if(y < n) {
            if (cost[x][y] == lx[x] + ly[y] && !T[y]) {
                if (yx[y] == -1) {
                    showAugmentingPath(x, y, prev, xy, yx);
                    console.log("AUGMENTING_PATH_FOUND");
                    $("#ta_div_statusErklaerung").text("Augmentationsweg wurde gefunden.");
                    statusID = AUGMENTING_PATH_FOUND;
                    return AUGMENTING_PATH_FOUND;
                }
                T[y] = true;
                q[wr++] = yx[y];
                this.add_to_tree(yx[y], x);
                displayST(S, T);
                goOn = false;
            }else{
                goOn = true;
            }
            y++;
            console.log("buildAlternatingTree: READY_TO_BUILD_TREE");
            statusID = READY_TO_BUILD_TREE;
            return READY_TO_BUILD_TREE;
        }
        goOn = true;
        console.log("READY_FOR_SEARCHING");
        statusID = READY_FOR_SEARCHING;
        return READY_FOR_SEARCHING;
    };

    this.findAugmentPathAfterLabeling = function(){
        wr = rd = 0;
        y = 0;
        console.log("READY_TO_BUILD_TREE_AFTER_RELABELING");
        displayST(S, T);
        statusID = READY_TO_BUILD_TREE_AFTER_RELABELING;
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
                    $("#ta_div_statusErklaerung").text("Augmentationsweg wurde gefunden.");
                    return AUGMENTING_PATH_FOUND;
                } else {
                    T[y] = true;
                    if (!S[yx[y]]) {
                        q[wr++] = yx[y];
                        this.add_to_tree(yx[y], slackx[y]);
                    }
                    displayST(S, T);
                }
            }else{
                goOn = true;
            }
            y++;
            console.log("READY_TO_BUILD_TREE_AFTER_RELABELING");
            statusID = READY_TO_BUILD_TREE_AFTER_RELABELING;
            return READY_TO_BUILD_TREE_AFTER_RELABELING;
        }
        statusID = READY_FOR_SEARCHING;
        console.log("READY_FOR_SEARCHING");
        goOn = true;
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
        showCurrentMatching(xy);
        statusID = MATCHING_INCREASED;
        console.log("MATCHING_INCREASED");
        $("#ta_div_statusErklaerung").text("Matching wurde vergrößert.");
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
        $("#ta_div_statusErklaerung").text("Markierungen sowie Gleichheitsgraph wurden aktualisiert.");
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
        this.stopFastForward();
        end = true;
        var ret = 0;
        for (var x = 0; x < n; x++) {
            ret += cost[x][xy[x]];
        }
        console.log("otvet: "  + ret);
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
            edgeProperties[key] = {edge: JSON.stringify(graph.edges[key].getLayout())};
        }
        history.push({
            "previousStatusId": statusID,
            "nodeProperties": nodeProperties,
            "edgeProperties": edgeProperties,
            "htmlSidebar": $(statusErklaerung).html()
        });
    };

    this.replayStep = function(current) {
        if(current > 0){
            var oldState = history[current - 1];
            statusID = oldState.previousStatusId;
            $("#ta_div_statusErklaerung").html(oldState.htmlSidebar);
            for(var key in oldState.nodeProperties) {
                graph.nodes[key].setLayoutObject(JSON.parse(oldState.nodeProperties[key].edge));
                graph.nodes[key].setLabel(oldState.nodeProperties[key].label);
            }
            for(var key in oldState.edgeProperties) {
                graph.edges[key].setLayoutObject(JSON.parse(oldState.edgeProperties[key].edge));
                //graph.edges[key].setAdditionalLabel(oldState.edgeProperties[key].label);
            }
            if(fastForwardIntervalID == null){
                $("#ta_button_Zurueck").button("option", "disabled", false);
                $("#ta_button_1Schritt").button("option", "disabled", false);
            }
        }else{
            $("#ta_button_Zurueck").button("option", "disabled", true);
            for(var key in graph.nodes) {
                graph.nodes[key].setLayout("fillStyle", const_Colors.NodeFilling);
                graph.nodes[key].setLabel("");
            }
            for(var key in graph.edges) {
                graph.edges[key].setLayout("lineColor", "black");
                graph.edges[key].setLayout("lineWidth", 2);
            }
            $("#ta_div_statusErklaerung").html("<h3>Initialisierung des Algorithmus.</h3>"
                + "<p>Am Anfang des Algorithmus besitzt kein Knoten einen Matching-Partner. Die Menge des Kanten im Matching M ist dementsprechend leer.</p>"
                + "<p>In jeder Iteration suchen wir eine maximale Menge an kürzesten knotendisjunkten Augmentationswegen.</p>"
                + "<p>Maximal heißt hier, dass es zusätzlich zu den gefundenen Pfaden keinen anderen kürzesten knotendisjunkten Augmentationsweg gibt.</p>"
                + "<p>Ein Augmentationsweg ist ein Weg, der mit einem freien Knoten anfängt, mit einem freien Knoten endet und alternierend Matching-Kanten und Nicht-Matching-Kanten benutzt.</p>");
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