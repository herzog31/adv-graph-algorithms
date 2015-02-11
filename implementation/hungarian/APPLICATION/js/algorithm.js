function setAll(arr, val) {
    var i, n = arr.length;
    for (i = 0; i < n; ++i) {
        arr[i] = val;
    }
}
//
//function initLabels(){
//    for (var x = 0; x < n; x++) {
//        for (var y = 0; y < n; y++) {
//            if(cost[x][y] > lx[x]){
//                lx[x] = cost[x][y];
//            }
//        }
//    }
//}
//
//function augment(){
//    if(maxMatch == cost.length) return;
//    var x, y, root = -1;
//    var q = new Array(n);
//    var wr = 0, rd = 0;
//    setAll(S, false);
//    setAll(T, false);
//    setAll(prev, -1);
//    for (x = 0; x < n; x++) {
//        if (xy[x] == -1) {
//            q[wr++] = root = x;
//            prev[x] = -2;
//            S[x] = true;
//            break;
//        }
//    }
//
//    for (y = 0; y < n; y++) {
//        slack[y] = lx[root] + ly[y] - cost[root][y];
//        slackx[y] = root;
//    }
//
//    while (true){
//        while (rd < wr) {
//            x = q[rd++];
//            for (y = 0; y < n; y++) {
//                if (cost[x][y] == lx[x] + ly[y] && !T[y]) {
//                    if (yx[y] == -1) break;
//                    T[y] = true;
//                    q[wr++] = yx[y];
//                    add_to_tree(yx[y], x);
//                }
//            }
//            if (y < n) break;
//        }
//        if (y < n) break;
//
//        update_labels();
//        wr = rd = 0;
//        for (y = 0; y < n; y++)
//            if (!T[y] &&  slack[y] == 0) {
//                if (yx[y] == -1) {
//                    x = slackx[y];
//                    break;
//                }else {
//                    T[y] = true;
//                    if (!S[yx[y]]) {
//                        q[wr++] = yx[y];
//                        add_to_tree(yx[y], slackx[y]);
//                    }
//                }
//            }
//        if (y < n) break;
//    }
//
//    if (y < n){
//        maxMatch++;
//        for (var cx = x, cy = y, ty; cx != -2; cx = prev[cx], cy = ty){
//            ty = xy[cx];
//            yx[cy] = cx;
//            xy[cx] = cy;
//        }
//        augment();
//    }
//}
//
//function update_labels(){
//    var x, y, delta = -1;
//    for (y = 0; y < n; y++) {
//        if (!T[y] && (delta == -1 || slack[y] < delta)) {
//            delta = slack[y];
//        }
//    }
//    for (x = 0; x < n; x++) {
//        if (S[x]) lx[x] -= delta;
//    }
//    for (y = 0; y < n; y++) {
//        if (T[y]) ly[y] += delta;
//    }
//    for (y = 0; y < n; y++) {
//        if (!T[y])
//            slack[y] -= delta;
//    }
//}
//
//
//function add_to_tree(x, prevx){
//    S[x] = true;
//    prev[x] = prevx;
//    for (var y = 0; y < n; y++) {
//        if (lx[x] + ly[y] - cost[x][y] < slack[y]) {
//            slack[y] = lx[x] + ly[y] - cost[x][y];
//            slackx[y] = x;
//        }
//    }
//}
//
//function hungarianMethod(){
//    var ret = 0;
//    initLabels();
//    augment();
//    for (var x = 0; x < n; x++)
//    ret += cost[x][xy[x]];
//    alert(ret);
//    return ret;
//}
//
//var cost = [[7,4,3],[3,1,2],[3,0,0]];
//
//var lx = new Array(cost.length),
//    ly = new Array(cost.length),
//    xy = new Array(cost.length),
//    yx = new Array(cost.length),
//    S = new Array(cost.length),
//    T = new Array(cost.length),
//    slack = new Array(cost.length),
//    slackx = new Array(cost.length),
//    prev = new Array(cost.length),
//    maxMatch = 0;
//var n = cost.length;
//setAll(S, false);
//setAll(T, false);
//setAll(xy, -1);
//setAll(yx, -1);
//setAll(lx, 0);
//setAll(ly, 0);
//
//
//hungarianMethod();

/**
 * Instanz des Hopcroft-Karp Algorithmus, erweitert die Klasse CanvasDrawer
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
     * Enthaelt alle Kanten, die zu aktuellem Zeitpunkt zum Matching gehoeren.
     * Keys: KantenIDs Value: Kanten
     * @type Object
     */
    var matching = new Object();
    /*    *//**
     * Enthaelt alle freien Knoten (derzeit) der linken Seite
     * Wird als Ausgangspunkt fuer die Erstellung des alternierenden Graphen benutzt.
     * Keys: KnotenIDs Value: Knoten
     * @type Object
     *//*
     var superNode = new Object();*/
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
    //const ALGOINIT = 0;
    //const BEGIN_ITERATION = 1;
    //const END_ITERATION = 2;
    //const NEXT_AUGMENTING_PATH = 3;
    //const UPDATE_MATCHING = 4;
    //const GRAY_PATH = 5;
    //const END_ALGORITHM = 6;
    const BEGIN = 0;
    const READY_TO_START = 1;
    const AUGMENTING_PATH_FOUND = 3;
    const AUGMENTING_PATH_NOT_FOUND = 4;
    const READY_FOR_SEARCHING = 5;
    const LABELS_UPDATED = 6;
    const MATCHING_INCREASED = 7;
    const FINISHED = 8;

    //var cost = [[7,4,3],[6,8,5],[9,4,4]];
    var cost = new Array();
    this.cost = cost;

    var currentAugmPath = new Array();

    var n = Object.keys(graph.nodes).length/2;
    var lx = new Array(n),
        ly = new Array(n),
        xy = new Array(n),
        yx = new Array(n),
        S = new Array(n),
        T = new Array(n),
        slack = new Array(n),
        slackx = new Array(n),
        prev = new Array(n),
        maxMatch = 0;

    var wr = 0, rd = 0;
    var x, y, root = -1;
    var q = new Array(n);

    /**
     * Startet die Ausführung des Algorithmus.
     * @method
     */
    this.run = function() {
        var iCounter = 0;
        for(var i in graph.nodes){
            if(!$.isEmptyObject(graph.nodes[i].getOutEdges())) {
                cost[iCounter] = new Array();
                var jCounter = 0;
                for (var j in graph.nodes[i].getOutEdges()) {
                    cost[iCounter][jCounter] = graph.nodes[i].getOutEdges()[j].weight;
                    jCounter++;
                }
                iCounter++;
            }
        }
        console.log(cost);
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
        //$("#ta_button_vorspulen").hide();
        //$("#ta_button_stoppVorspulen").show();
        //$("#ta_button_1Schritt").button("option", "disabled", true);
        //$("#ta_button_Zurueck").button("option", "disabled", true);
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
        console.log(statusID);
        $("#ta_div_statusErklaerung").text("");
        switch (statusID) {
            case BEGIN:
                this.initLabels();
                break;
            case READY_FOR_SEARCHING:
                this.tryToFindAugmentingPath();
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
            case READY_TO_START:
                this.augment();
                break;
            case AUGMENTING_PATH_FOUND:
                this.increaseMatching();
                break;
            case FINISHED:
                this.end();
                break;
            default:
                console.log("Fehlerhafte StatusID.");
                break;
        }
        this.needRedraw = true;
    };

    this.initLabels = function(){
        setAll(S, false);
        setAll(T, false);
        setAll(xy, -1);
        setAll(yx, -1);
        setAll(lx, 0);
        setAll(ly, 0);
        for (var x = 0; x < n; x++) {
            for (var y = 0; y < n; y++) {
                if(this.cost[x][y] > lx[x]){
                    lx[x] = cost[x][y];
                }
            }
        }
        showLabels(lx, ly);
        //console.log(lx);
        //console.log(ly);
        statusID = READY_TO_START;
        console.log("READY_TO_START");
        $("#ta_div_statusErklaerung").text("Ursprungliche Markierungen sowie Gleichheitsgraph wurden bestimmt.");
        return READY_TO_START;
    };

    this.augment = function() {
        //resetEdgeLayout();
        if (maxMatch == cost.length) {
            statusID = FINISHED;
            console.log("FINISHED");
            $("#ta_div_statusErklaerung").text("Der Algorithmus ist fertig.");
            $("#ta_button_1Schritt").button("option", "disabled", true);
            return FINISHED;
        }
        showEqualityGraph(lx, ly);
        x, y, root = -1;
        q = new Array(n);
        wr = 0, rd = 0;
        setAll(S, false);
        setAll(T, false);
        setAll(prev, -1);
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
        showTreeRoot(S, lx.length);
        statusID = READY_FOR_SEARCHING;
        console.log("READY_FOR_SEARCHING");
        $("#ta_div_statusErklaerung").text("Die Wurzel des alternierenden Baums wurde bestimmt.");
        return READY_FOR_SEARCHING;
        //while (true) {
        //    if(this.buildTree()){
        //        return AUGMENTING_PATH_FOUND;
        //    }
        //    return AUGMENTING_PATH_NOT_FOUND;
            //this.update_labels();
            //this.findAugmentPathAfterLabeling();
                        //wr = rd = 0;
                        //for (y = 0; y < n; y++)
                        //    if (!T[y] && slack[y] == 0) {
                        //        if (yx[y] == -1) {
                        //            x = slackx[y];
                        //            break;
                        //        } else {
                        //            T[y] = true;
                        //            if (!S[yx[y]]) {
                        //                q[wr++] = yx[y];
                        //                this.add_to_tree(yx[y], slackx[y]);
                        //            }
                        //        }
                        //    }
                        //if (y < n) break;
        //}
        //this.increaseMatching();
            //if (y < n) {
            //    maxMatch++;
            //    for (var cx = x, cy = y, ty; cx != -2; cx = prev[cx], cy = ty) {
            //        ty = xy[cx];
            //        yx[cy] = cx;
            //        xy[cx] = cy;
            //    }
            //    return MATCHING_INCREASED;//this.augment();
            //}
    };

    this.increaseMatching = function(){
        //if (y < n) {
        //    resetEdgeLayout();
        resetNodeLayout();
        showEqualityGraph(lx, ly);
        maxMatch++;
        for (var cx = x, cy = y, ty; cx != -2; cx = prev[cx], cy = ty) {
            ty = xy[cx];
            yx[cy] = cx;
            xy[cx] = cy;
        }
        console.log(xy);
        showCurrentMatching(xy);
        statusID = MATCHING_INCREASED;
        console.log("MATCHING_INCREASED");
        $("#ta_div_statusErklaerung").text("Matching wurde vergrößert.");
        return MATCHING_INCREASED;//this.augment();
        //}
        //return -1;
    };

    this.tryToFindAugmentingPath = function(){
        if(this.buildTree()){
            statusID = AUGMENTING_PATH_FOUND;
            showAugmentingPath(x, y, prev, xy, yx);
            console.log("AUGMENTING_PATH_FOUND");
            $("#ta_div_statusErklaerung").text("Augmentationsweg wurde gefunden.");
            return AUGMENTING_PATH_FOUND;
        }
        //resetNodeLayout();
        statusID = AUGMENTING_PATH_NOT_FOUND;
        console.log("AUGMENTING_PATH_NOT_FOUND");
        $("#ta_div_statusErklaerung").text("Augmentationsweg wurde nicht gefunden.");
        return AUGMENTING_PATH_NOT_FOUND;
    };

    this.buildTree = function(){
        while (rd < wr) {
            x = q[rd++];
            for (y = 0; y < n; y++) {
                if (cost[x][y] == lx[x] + ly[y] && !T[y]) {
                    if (yx[y] == -1) break;
                    T[y] = true;
                    q[wr++] = yx[y];
                    this.add_to_tree(yx[y], x);
                }
            }
            if (y < n) {
                //currentAugmPath[currentAugmPath.length] = x;
                //currentAugmPath[currentAugmPath.length] = y;
                //console.log(currentAugmPath);
                return true;
            } //augmenting path found
        }
        return false; //augmenting path not found
    };

    this.findAugmentPathAfterLabeling = function(){
        //resetNodeLayout();
        wr = rd = 0;
        for (y = 0; y < n; y++)
            if (!T[y] && slack[y] == 0) {
                if (yx[y] == -1) {
                    x = slackx[y];
                    break;
                } else {
                    T[y] = true;
                    if (!S[yx[y]]) {
                        q[wr++] = yx[y];
                        this.add_to_tree(yx[y], slackx[y]);
                    }
                }
            }
        if (y < n){
            //currentAugmPath[currentAugmPath.length] = x;
            //currentAugmPath[currentAugmPath.length] = y;
            showAugmentingPath(x, y, prev, xy, yx);
            //console.log(currentAugmPath);
            statusID = AUGMENTING_PATH_FOUND;
            console.log("AUGMENTING_PATH_FOUND");
            $("#ta_div_statusErklaerung").text("Augmentationsweg wurde gefunden.");
            return AUGMENTING_PATH_FOUND;
        }

        statusID = READY_FOR_SEARCHING;
        console.log("READY_FOR_SEARCHING");
        $("#ta_div_statusErklaerung").text("Augmentationsweg wurde nicht gefunden.");
        return READY_FOR_SEARCHING;
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
        //resetNodeLayout();
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
    /*
     * Methoden fuer die Visualisierung.
     * */
    var setEdgeMatched = function(edge){
        var MATCHED_EDGE_COLOR = "DarkBlue";
        edge.setLayout("lineColor", MATCHED_EDGE_COLOR);
        edge.setLayout("lineWidth", global_Edgelayout.lineWidth*1.3);
    };
    var setEdgeNotMatched = function(edge){
        edge.setLayout("lineColor", global_Edgelayout.lineColor);
        edge.setLayout("lineWidth", global_Edgelayout.lineWidth);
    };
    var setNodeMatched = function(node){
        var MATCHED_NODE_COLOR = const_Colors.NodeFillingHighlight;
        node.setLayout('fillStyle',MATCHED_NODE_COLOR);
        node.setLayout('borderColor',global_NodeLayout.borderColor);
    };
    var setNodeNotMatched = function(node){
        node.restoreLayout();
    };
    var highlightNode = function(node){
        node.setLayout('borderColor',"Navy");
        //node.setLayout('borderColor',const_Colors.NodeBorderHighlight);
        node.setLayout('borderWidth',global_NodeLayout.borderWidth*1.5);
    };
    var highlightEdge = function(edge){
        edge.setLayout("lineWidth", global_Edgelayout.lineWidth*2.4);
    };
    var highlightFreeNode = function(node){
        node.setLayout('borderWidth',global_NodeLayout.borderWidth * 2);
        node.setLayout('fillStyle',"SteelBlue ");
    };
    var hideEdge = function(edge) {
        edge.setLayout("lineWidth", global_Edgelayout.lineWidth * 0.3);
    };
    var hideNode = function(node){
        node.setLayout('fillStyle',"DarkGray");
        node.setLayout('borderWidth',global_NodeLayout.borderWidth);
        node.setLayout('borderColor',"Gray");
    };

    /*
     * Hebt den Augmentationsweg hervor.
     * @method
     * */
    this.highlightPath = function(path){
        //alle Kanten ein wenig in den Hintergrund
        //for(var e in graph.edges) graph.edges[e].setLayout("lineWidth", global_Edgelayout.lineWidth * 0.9);
        //hervorheben des Augmentationsweges(Knoten und Kanten)
        for(var n = 0; n < path.length; n=n+2){
            var node = path[n];
            highlightNode(node);
            if(n < path.length - 1){
                var edge = path[n+1];
                highlightEdge(edge);
            }
        }
        //die freien Knoten hervorheben(erster und letzter Knoten auf dem Weg)
        highlightFreeNode(path[0]);
        highlightFreeNode(path[path.length-1]);

        //statuserklaerung
        $(statusErklaerung).html('<h3>'+iteration+'. '+LNG.K('textdb_text_iteration')+'</h3>'
        + "<h3> "+LNG.K('textdb_msg_path_highlight')+"</h3>"
        + "<p> "+LNG.K('textdb_msg_path_highlight_1')+"<p>");
        statusID = UPDATE_MATCHING;
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
        this.replayStep();
        this.needRedraw = true;
    };


    this.addReplayStep = function() {
        var nodeProperties = {};
        for(var key in graph.nodes) {
            nodeProperties[graph.nodes[key].getNodeID()] = {edge: JSON.stringify(graph.nodes[key].getLayout())};
        }
        var edgeProperties = {}
        for(var key in graph.edges) {
            edgeProperties[graph.edges[key].getEdgeID()] = {edge: JSON.stringify(graph.edges[key].getLayout())};
        }
        history.push({
            "previousStatusId": statusID,
            "nodeProperties": nodeProperties,
            "edgeProperties": edgeProperties,
            "matching": jQuery.extend({},matching),
            "bfsEdges": jQuery.extend({},bfsEdges),
            "shortestPathLength": shortestPathLength,
            "iteration": iteration,
            //"superNode": jQuery.extend({},superNode),
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
            //superNode = oldState.superNode;
            matched = oldState.matched;
            disjointPaths = oldState.disjointPaths;
            currentPath = oldState.currentPath;
            $("#ta_div_statusErklaerung").html(oldState.htmlSidebar);
            for(var key in oldState.nodeProperties) {
                graph.nodes[key].setLayoutObject(JSON.parse(oldState.nodeProperties[key].edge));
                //graph.nodes[key].setLabel(oldState.nodeProperties[key].label);
            }
            for(var key in oldState.edgeProperties) {
                graph.edges[key].setLayoutObject(JSON.parse(oldState.edgeProperties[key].edge));
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
    };
    this.getShortestPathLength = function(){
        return shortestPathLength;
    };
    this.isMatched = function (node){
        return (matched[node.getNodeID()] != null);
    };
    this.getPartner = function (node){
        return matched[node.getNodeID()];
    };
    this.getMatching = function(){return matching};
    this.getPath = function () {return disjointPaths[currentPath];};
    this.getGraph = function () {return graph;};
    this.startNewIteration = function() {
        this.endIteration();
        this.nextStepChoice();
    };
}

// Vererbung realisieren
HungarianMethod.prototype = Object.create(CanvasDrawer.prototype);
HungarianMethod.prototype.constructor = HungarianMethod;