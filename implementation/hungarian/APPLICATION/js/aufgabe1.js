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
    var pseudocode = "#tf1_div_statusPseudocode";


    var currentQuestion = 0;
    var currentQuestionType = 0;
    var questions = new Array();
    var debugConsole = true;
    var previousStatusId = 0;
    var currentPseudoCodeLine = [1];

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

    this.markPseudoCodeLine = function(lineArray) {
        currentPseudoCodeLine = lineArray;
        $(".marked").removeClass('marked');
        for(var i = 0; i < lineArray.length; i++) {
            $("#tf1_p_l"+lineArray[i]).addClass('marked');
        }
    };

    this.run = function() {
    	this.completeGraph();
        this.initCanvasDrawer();
        this.addNamingLabels();

        $("#tf1_div_abspielbuttons").append("<button id=\"tf1_button_1Schritt\">"+LNG.K('algorithm_btn_next')+"</button><br>"
                        +"<button id=\"tf1_button_vorspulen\">"+LNG.K('aufgabe1_btn_next_question')+"</button>"
                        +"<button id=\"tf1_button_stoppVorspulen\">"+LNG.K('algorithm_btn_paus')+"</button>");
        $("#tf1_button_stoppVorspulen").hide();
        $("#tf1_button_1Schritt").button({icons:{primary: "ui-icon-seek-end"}, disabled: false});
        $("#tf1_button_vorspulen").button({icons:{primary: "ui-icon-seek-next"}, disabled: false});
        $("#tf1_button_stoppVorspulen").button({icons:{primary: "ui-icon-pause"}});
        $("#tf1_div_statusTabs").tabs();
        this.markPseudoCodeLine([1]);
        $("#tf1_tr_LegendeClickable").removeClass("greyedOutBackground");

        this.registerEventHandlers();
        this.needRedraw = true;
        this.minimizeLegend();

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
     * Beendet den Tab und startet ihn neu
     * @method
     */
    this.refresh = function() {
        this.destroy();
        var algo = new Forschungsaufgabe1($("body").data("graph"), $("#tf1_canvas_graph"), $("#tab_tf1"));
        $("#tab_tf1").data("algo", algo);
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
        $("#tf1_button_1Schritt").on("click.Forschungsaufgabe1",function() {algo.singleStepHandler();});
        $("#tf1_button_vorspulen").on("click.Forschungsaufgabe1",function() {algo.fastForwardAlgorithm();});
        $("#tf1_button_stoppVorspulen").on("click.Forschungsaufgabe1",function() {algo.stopFastForward();});
    };
    
    /**
     * Entferne die Eventhandler von Buttons und canvas im Namespace ".Forschungsaufgabe1"
     * @method
     */
    this.deregisterEventHandlers = function() {
        canvas.off(".Forschungsaufgabe1");
        $("#tf1_button_1Schritt").off(".Forschungsaufgabe1");
        $("#tf1_button_vorspulen").off(".Forschungsaufgabe1");
        $("#tf1_button_stoppVorspulen").off(".Forschungsaufgabe1");
        $("#tf1_tr_LegendeClickable").off(".Forschungsaufgabe1");
    };

    this.singleStepHandler = function() {
        this.nextStepChoice();
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

        fastForwardIntervalID = window.setInterval(function(){ algo.nextStepChoice(); }, geschwindigkeit);
    };
    
    /**
     * Stoppt das automatische Abspielen des Algorithmus
     * @method
     */
    this.stopFastForward = function() {
        $("#tf1_button_vorspulen").show();
        $("#tf1_button_stoppVorspulen").hide();
        $("#tf1_button_1Schritt").button("option", "disabled", false);
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

        if(statusID == null) {
            statusID = 0;
            previousStatusId = 0;
        }
        if(debugConsole) if(debugConsole) console.log("Current State: " + statusID);

        previousStatusId = statusID;
        currentQuestionType = this.askQuestion();

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
            // TODO add step
            case FINISHED:
                this.end();
                this.showQuestionResults();
                break;
            default:
                if(debugConsole) console.log("Fehlerhafte StatusID.");
                break;
        }

        if(currentQuestionType !== false) {

        	// TODO 
            /* if(currentQuestionType === 1) {
                this.generateNextStepQuestion(previousStatusId);
            }else if(currentQuestionType === 2) {
                this.generateSubtourQuestion();
            }else if(currentQuestionType === 3) {
                this.generateTourQuestion(previousTour, previousSubtour);
            }else if(currentQuestionType === 4) {
                this.generateDegreeQuestion();
            } */
            this.showQuestionModal();
            this.stopFastForward();
            $("#tf1_button_1Schritt").button("option", "disabled", true);
            $("#tf1_button_vorspulen").button("option", "disabled", true); 
        }

        this.needRedraw = true;

    };

    this.addNamingLabels = function() {

        var nodeCounter = 1;

        for(var knotenID in graph.nodes) {
            graph.nodes[knotenID].setOuterLabel(String.fromCharCode("a".charCodeAt(0)+nodeCounter-1));
            nodeCounter++;
        };

    };

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

        $("#tf1_div_statusErklaerung").html(
            "<h3>Augmentationsweg bestimmen</h3>" +
            "<p>Der Algorithmus versucht nun schrittweise einen alternierenden Pfad zu konstruieren.</p>" +
            "<p>Die Konstruktion stoppt, wenn der alternierende Pfad augmentierend wird oder es keine weiteren passenden Kanten mehr gibt.</p>");

        $("#tf1_td_setS").html(sField.join(",") || "&#8709;");
        $("#tf1_td_setT").html(tField.join(",") || "&#8709;");
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
        if(debugConsole) console.log("READY_TO_START");
        $("#tf1_div_statusErklaerung").html("<h3>Gleichheitsgraph bestimmen</h3>"
            + "<p>Der Algorithmus bestimmt zuerst eine initiale Markierung für jeden Knoten.</p>"
            + "<p>Anhand der Markierungen wird der Gleichheitsgraph ermittelt (<strong>schwarz</strong>).</p>");
        this.markPseudoCodeLine([4]);
        return READY_TO_START;
    };

    this.augment = function() {
        if (maxMatch == cost.length) {
            statusID = FINISHED;
            this.nextStepChoice();
            return;
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
        if(debugConsole) console.log("READY_FOR_SEARCHING");
        $("#tf1_div_statusErklaerung").html("<h3>Augmentationsweg bestimmen</h3>" +
            "<h3>Wurzel eines alternierenden Pfades finden</h3>" + 
            "<p>Der Algorithmus wählt als Wurzel einen Knoten, der noch nicht im Matching vorhanden ist und markiert ihn <span style='font-weight: bold; color: " + const_Colors.NodeFillingHighlight + ";'>hell grün</span>.</p>");
		this.markPseudoCodeLine([6, 7]);
    };

    this.iterateX = function(){
        if(rd < wr){
            x = q[rd++];
            y = 0;
            if(debugConsole) console.log("iterateX: READY_TO_BUILD_TREE");

            if(previousStatusId !== READY_TO_BUILD_TREE && previousStatusId !== READY_TO_BUILD_TREE_AFTER_RELABELING) {
                this.displayST(S, T);
            }

            statusID = READY_TO_BUILD_TREE;
            this.markPseudoCodeLine([6, 7]);

            this.nextStepChoice();
            return;
        }

        if(debugConsole) console.log("AUGMENTING_PATH_NOT_FOUND");
        $("#tf1_div_statusErklaerung").html(
            "<h3>Augmentationsweg bestimmen</h3>" +
            "<p>Der Algorithmus konnte keinen Augmentationsweg mit der gewählten Wurzel (<span style='font-weight: bold; color: " + const_Colors.NodeFillingHighlight + ";'>hell grün</span>) im aktuellen Gleichheitsgraph finden.</p>"
        );
        statusID = AUGMENTING_PATH_NOT_FOUND;
        this.markPseudoCodeLine([8, 9]);
        return AUGMENTING_PATH_NOT_FOUND;
    };

    this.buildAlternatingTree = function(){
        if(y < n) {
            if (cost[x][y] == lx[x] + ly[y] && !T[y]) {
                if (yx[y] == -1) {
                    showAugmentingPath(x, y, prev, xy, yx);
                    if(debugConsole) console.log("AUGMENTING_PATH_FOUND");
                    $("#tf1_div_statusErklaerung").html(
                        "<h3>Augmentationsweg bestimmen</h3>" +
                        "<p>Es wurde ein Augmentationsweg (<span style='font-weight: bold; color: red;'>rot</span>) gefunden.</p>"
                    );
                    statusID = AUGMENTING_PATH_FOUND;
                    this.markPseudoCodeLine([11]);
                    return;
                }

                T[y] = true;
                q[wr++] = yx[y];
                this.add_to_tree(yx[y], x);
                this.displayST(S, T);

            }else{
                var skip = true;
            }

            y++;
            if(debugConsole) console.log("buildAlternatingTree: READY_TO_BUILD_TREE");
            statusID = READY_TO_BUILD_TREE;
            this.markPseudoCodeLine([6, 7]);
            if (skip) this.nextStepChoice();
            return;
        }
        
        if(debugConsole) console.log("READY_FOR_SEARCHING");
        statusID = READY_FOR_SEARCHING;
        this.markPseudoCodeLine([6, 7]);
        this.nextStepChoice();
    };

    this.findAugmentPathAfterLabeling = function() {
        wr = rd = 0;
        y = 0;
        if(debugConsole) console.log("READY_TO_BUILD_TREE_AFTER_RELABELING");
        this.displayST(S, T);
        statusID = READY_TO_BUILD_TREE_AFTER_RELABELING;
        this.markPseudoCodeLine([6, 7]);
        return READY_TO_BUILD_TREE_AFTER_RELABELING;
    };

    this.buildTreeAfterRelabeling = function(){
        if(y < n) {
            if (!T[y] && slack[y] == 0) {
                if (yx[y] == -1) {
                    x = slackx[y];
                    showAugmentingPath(x, y, prev, xy, yx);
                    statusID = AUGMENTING_PATH_FOUND;
                    if(debugConsole) console.log("AUGMENTING_PATH_FOUND");
                    $("#tf1_div_statusErklaerung").html(
                        "<h3>Augmentationsweg bestimmen</h3>" +
                        "<p>Es wurde ein Augmentationsweg (<span style='font-weight: bold; color: red;'>rot</span>) gefunden.</p>"
                    );
                    this.markPseudoCodeLine([11]);
                    return;
                }

                T[y] = true;
                if (!S[yx[y]]) {
                    q[wr++] = yx[y];
                    this.add_to_tree(yx[y], slackx[y]);
                }
                this.displayST(S, T);
                
            }else{
                var skip = true;
            }
            y++;
            if(debugConsole) console.log("READY_TO_BUILD_TREE_AFTER_RELABELING");
            statusID = READY_TO_BUILD_TREE_AFTER_RELABELING;
            this.markPseudoCodeLine([6, 7]);
            if (skip) this.nextStepChoice();
            return;
        }

        statusID = READY_FOR_SEARCHING;
        if(debugConsole) console.log("READY_FOR_SEARCHING");
        this.markPseudoCodeLine([6, 7]);
        this.nextStepChoice();
        return;
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
        if(debugConsole) console.log("MATCHING_INCREASED");
        $("#tf1_div_statusErklaerung").html(
            "<h3>Matching vergrößern</h3>" +
            "<p>Mittels des gefundenen Augmentationsweges konnte das Matching (<span style='font-weight: bold; color: green;'>grün</span>) ergänzt werden.</p>"
        );
        if(maxMatch == cost.length){
            this.markPseudoCodeLine([12]);
        }else {
            this.markPseudoCodeLine([4]);
        }
        $("#tf1_td_setS").html("&#8709;");
        $("#tf1_td_setT").html("&#8709;");
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

    this.update_labels = function() {
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
        if(debugConsole) console.log("LABELS_UPDATED");
        $("#tf1_div_statusErklaerung").html(
            "<h3>Neuen Gleichheitsgraph bestimmen</h3>" +
            "<p>Zur Bestimmung eines neuen Gleichheitsgraph muss der Algorithmus zunächst die Markierungen aktualisieren.</p>" + 
            "<p>Dazu wird ein \\(\\Delta\\) wie folgt bestimmt:</p>"+
            "<p>\\(\\Delta = \\min\\limits_{s \\in S\\ \\wedge\\ y \\in Y \\setminus T}\\{l(s) + l(y) - w(s,y)\\} = "+delta+"\\)</p>" +
            "<p>Die Markierungen werden dann nach folgender Formel aktualisiert:</p>" + 
            "<p>\\(\\begin{equation}l^\\prime(v) =\\begin{cases}l(v) - "+delta+" & v \\in S\\\\l(v) + "+delta+" & v \\in T\\\\l(v) & sonst\\end{cases}\\end{equation}\\)</p>" + 
            "<p>Der neue Gleichheitsgraph wurde vom Algorithmus markiert (<strong style='font-weight: bold; color: green;'>grün</strong> und <strong>schwarz</strong>).</p>"
        );
        MathJax.Hub.Queue(["Typeset",MathJax.Hub,"ta_div_statusErklaerung"]);
        this.markPseudoCodeLine([6, 7]);
        return LABELS_UPDATED;
    };

    this.setAll = function (arr, val) {
        var i, n = arr.length;
        for (i = 0; i < n; ++i) {
            arr[i] = val;
        }
    };

    this.end = function() {

        if(debugConsole) console.log("FINISHED");
        $("#tf1_button_1Schritt").button("option", "disabled", true);
        showCurrentMatching(xy, false);
        this.markPseudoCodeLine([13]);

        if (fastForwardIntervalID != null) {
            this.stopFastForward();
        }

        end = true;
        var ret = 0;
        for (var x = 0; x < n; x++) {
            ret += cost[x][xy[x]];
        }

        $("#tf1_div_statusErklaerung").html(
            "<h3>Optimales Matching</h3>" +
            "<p>Die Ungarische Methode hat erfolgreich ein maximales Matching bestimmt.</p>" +
            "<p>Das Gesamtgewicht beträgt <strong>"+ret+"</strong>.</p>" +
            "<h3>Was nun?</h3>" +
            "<button id='ta_button_gotoIdee' class='ui-button ui-widget ui-state-default ui-corner-all ui-button-text-only' role='button'><span class='ui-button-text'>Beschreibung des Algorithmus lesen</span></button>" +
            "<h3>Weitere Forschungsaufgabe ausprobieren:</h3>" +
            "<button id='ta_button_gotoFA2' class='ui-button ui-widget ui-state-default ui-corner-all ui-button-text-only' role='button'><span class='ui-button-text'>FA2</span></button>"
        );

        $("#tf1_button_gotoIdee").click(function() {
            $("#tabs").tabs("option", "active", 3);
        });
        $("#tf1_button_gotoFA2").click(function() {
            $("#tabs").tabs("option", "active", 5);
        });
    };

    this.showQuestionModal = function() {
        $("#tf1_div_statusTabs").hide();
        $("#tf1_div_questionModal").show();
        $("#tf1_questionSolution").hide();
    };

    this.closeQuestionModal = function() {
        $("#tf1_div_statusTabs").show();
        $("#tf1_div_questionModal").hide();
        $("#tf1_button_questionClose").off();
        $("#tf1_button_1Schritt").button("option", "disabled", false);
        $("#tf1_button_vorspulen").button("option", "disabled", false);
    };

    this.saveAnswer = function() {
        var givenAnswer = "";

        // TODO

        /* if(currentQuestionType === 1 || currentQuestionType === 3 || currentQuestionType === 4) {
            givenAnswer = $("#question"+currentQuestion+"_form").find("input[type='radio']:checked").val();
        }else if(currentQuestionType === 2) {
            givenAnswer = $("#question"+currentQuestion+"_form").find("input[type='text']").val();
            givenAnswer = givenAnswer.replace(/(\s|\,)+/g,'');
        }

        if(questions[currentQuestion].type === 1) { // Next Step
            for (var i = 0; i < statusArray.length; i++) {
                if(statusArray[i].key == questions[currentQuestion].rightAnswer) {
                    $("#tf1_questionSolution").find(".answer").html(statusArray[i].answer);
                }
            }
        }else if(questions[currentQuestion].type === 2) { // Subtour
            $("#tf1_questionSolution").find(".answer").html(questions[currentQuestion].rightAnswer.split("").join(","));
        }else if(questions[currentQuestion].type === 3) { // Tour
            $("#tf1_questionSolution").find(".answer").html(questions[currentQuestion].rightAnswer);
        }else if(questions[currentQuestion].type === 4) { // Degree
            $("#tf1_questionSolution").find(".answer").html(questions[currentQuestion].rightAnswer);
        }

        questions[currentQuestion].givenAnswer = givenAnswer;
        if(questions[currentQuestion].givenAnswer == questions[currentQuestion].rightAnswer) {
            $("#tf1_questionSolution").css("color", "green");
            if(debugConsole) if(debugConsole) console.log("Answer given ", givenAnswer, " was right!");
        }else{
            $("#tf1_questionSolution").css("color", "red");
            if(debugConsole) if(debugConsole) console.log("Answer given ", givenAnswer, " was wrong! Right answer was ", questions[currentQuestion].rightAnswer);
        } */

        currentQuestion++;

        $("#tf1_questionSolution").show();
        $("#tf1_button_questionClose").hide();
        $("#tf1_button_questionClose2").button("option", "disabled", false);
    };

    this.activateAnswerButton = function() {
        $("#tf1_button_questionClose").button("option", "disabled", false);
    };

    this.showQuestionResults = function() {

        var correctAnswers = 0;
        var totalQuestions = questions.length;
        var table = "";

        for(var i = 0; i < questions.length; i++) {
            table = table + '<td style="text-align: center;">#'+(i+1)+'</td>';
            if(questions[i].rightAnswer == questions[i].givenAnswer) {
                table = table + '<td><span class="ui-icon ui-icon-plusthick"></span> Korrekt</td>';
                correctAnswers++;
            }else{
                table = table + '<td><span class="ui-icon ui-icon-minusthick"></span> Falsch</td>';
            }
            table = "<tr>"+table+"</tr>";
        }
        table = '<table class="quizTable"><thead><tr><th>Frage</th><th>Antwort</th></tr></thead><tbody>'+table+'</tbody></table>';

        $("#tf1_div_questionModal").html('<div class="ui-helper-reset ui-helper-clearfix ui-widget-header ui-corner-all" style="padding: 7px;">Ergebnisse</div>\
            <p>Von '+totalQuestions+' Fragen hast du '+correctAnswers+' korrekt beantwortet.</p>\
            <p>'+table+'</p>\
            <p></p>\
            <p><button id="tf1_button_questionClose">Schließen</button></p>');

        $("#tf1_button_questionClose").button().one("click", function() { algo.closeQuestionModal(); });

        this.showQuestionModal();

    };

    this.askQuestion = function() {

        var randomVariable = function(min, max) {
            return Math.random() * (max - min) + min;
        };

        // TODO

        /* if(statusID == 1) {
            // Frage zum Grad (100%)
            return 4;
        }else if(statusID == 6 && !eulerianTourEmpty) {
            // Frage zum Mergeergebnis (50%)
            if(randomVariable(0, 1) > 0.5) {
                return 3;
            }
        }else if(statusID == 5) {
            // Frage zur Subtour (20%)
            if(randomVariable(0, 1) > 0.8) {
                return 2;
            }
        }else if(statusID !== 2 && statusID !== 8) {
            // Frage zum nächsten Schritt (10%)
            if(randomVariable(1, 10) > 9) {
                return 1;
            }
        } */

        return false;

    };

}

// Vererbung realisieren
Forschungsaufgabe1.prototype = new CanvasDrawer;
Forschungsaufgabe1.prototype.constructor = Forschungsaufgabe1;