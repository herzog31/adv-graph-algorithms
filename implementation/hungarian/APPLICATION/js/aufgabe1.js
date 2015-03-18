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
    var currentQuestionType = false;
    var questions = new Array();
    var debugConsole = true;
    var previousStatusId = 0;
    var currentPseudoCodeLine = [1];

    /**
     * Hier werden die Statuskonstanten definiert
     */
    const START = 0;
    const INITIAL_LABELS = 1;
    const EQUALITY_GRAPH = 2;
    const FIND_ROOT = 3;
    const CONSTRUCT_ALTERNATING_PATH = 4;
    const NO_AUGMENT_PATH_FOUND = 5;
    const IMPROVE_LABELS = 6;
    const NEW_EQUALITY_GRAPH = 7;
    const AUGMENT_PATH_FOUND = 8;
    const IMPROVE_MATCHING = 9;
    const PERFECT_MATCHING_CHECK = 10;
    const SHOW_RESULT = 11;

    // Array with edge costs
    var cost = [];
    // Number of nodes per partition
    var n = 0;
    // Labels for nodes in partition X and Y
    var lx, ly;
    // Matching partner of nodes in partition X (xy) and Y (yx)
    var xy, yx;
    // Arrays for visited nodes in partition X (S) and Y (T) for current iteration
    var S, T;
    // Slack arrays for efficient calculation of delta
    var slack, slackx;
    // Store for current alternating path
    var prev;
    // number of edges in current matching
    var maxMatch = 0;
    // Counters
    var x = 0;
    var y = 0;
    // Root of alternating path
    var root = -1;
    // Queue for BFS
    var q = [];
    // Write (wr) and read (rd) pointers for queue
    var wr = 0;
    var rd = 0;

    var labeling = false;

    this.run = function() {

        this.completeGraph();
        this.initCanvasDrawer();

        $("#tf1_div_abspielbuttons").html("<button id=\"tf1_button_1Schritt\">"+LNG.K('algorithm_btn_next')+"</button><br>"
            +"<button id=\"tf1_button_vorspulen\">"+LNG.K('aufgabe1_btn_next_question')+"</button>"
            +"<button id=\"tf1_button_stoppVorspulen\">"+LNG.K('algorithm_btn_paus')+"</button>");
        $("#tf1_button_stoppVorspulen").hide();
        $("#tf1_button_1Schritt").button({icons:{primary: "ui-icon-seek-end"}, disabled: false});
        $("#tf1_button_vorspulen").button({icons:{primary: "ui-icon-seek-next"}, disabled: false});
        $("#tf1_button_stoppVorspulen").button({icons:{primary: "ui-icon-pause"}});
        $("#tf1_div_statusTabs").tabs();
        $("#tf1_tr_LegendeClickable").removeClass("greyedOutBackground");

        this.registerEventHandlers();
        this.minimizeLegend();
        this.markPseudoCodeLine([1]);
        this.addNamingLabels();

        this.needRedraw = true;
        
        statusID = INITIAL_LABELS;
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
        $("#tf1_button_1Schritt").on("click.Forschungsaufgabe1", function() { algo.singleStepHandler(); });
        $("#tf1_button_vorspulen").on("click.Forschungsaufgabe1", function() { algo.fastForwardAlgorithm(); });
        $("#tf1_button_stoppVorspulen").on("click.Forschungsaufgabe1", function() { algo.stopFastForward(); });
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


    this.nextStepChoice = function() {

        if(statusID == null) {
            statusID = 0;
            previousStatusId = 0;
        }
        if(debugConsole) if(debugConsole) console.log("Current State: " + statusID);

        previousStatusId = statusID;
        //currentQuestionType = this.askQuestion();

        switch (statusID) {
            case INITIAL_LABELS:
                this.initialLabels();
                break;
            case EQUALITY_GRAPH:
                this.equalityGraph();
                break;
            case FIND_ROOT:
                this.findRoot();
                break;
            case CONSTRUCT_ALTERNATING_PATH:
                this.constructAlternatingPath();
                break;
            case NO_AUGMENT_PATH_FOUND:
                this.noAugmentPathFound();
                break;
            case IMPROVE_LABELS:
                this.improveLabels();
                break;
            case NEW_EQUALITY_GRAPH:
                this.newEqualityGraph();
                break;
            case AUGMENT_PATH_FOUND:
                this.augmentPathFound();
                break;
            case IMPROVE_MATCHING:
                this.improveMatching();
                break;
            case PERFECT_MATCHING_CHECK:
                this.perfectMatchingCheck();
                break;
            case SHOW_RESULT:
                this.showResult();
                this.showQuestionResults();
                break;
            default:
                if(debugConsole) console.log("Wrong statusID");
                break;
        }

        if(currentQuestionType !== false) {

        	/* 
        	Frage Typen:

			- Nächster Schritt
			- Delta berechnen
			- Neue Markierungen berechnen (für bspw 4 Knoten)
			- Gleichgewichtsgraph bestimmen, bzw Kanten markieren die im Gleichgewichtsgraph vorkommen (für bspw 4 Kanten)

        	*/

            switch(currentQuestionType) {
				case 1:
					this.generateNextStepQuestion();
					break;
				case 2:
					this.generateDeltaQuestion();
					break;
				case 3:
					this.generateNewLabelQuestion();
					break;
				case 4:
					this.generateEqualityGraphQuestion();
					break;
			}

            this.showQuestionModal();
            this.stopFastForward();
            $("#tf1_button_1Schritt").button("option", "disabled", true);
            $("#tf1_button_vorspulen").button("option", "disabled", true); 
        }

        this.needRedraw = true;

    };

    /*
     * Steps
     */
    this.initialLabels = function() {

        $("#tf1_div_statusErklaerung").html("<h3>Initiale Markierungen</h3>"
            + "<p>Der Algorithmus bestimmt zuerst eine initiale Markierung für jeden Knoten.</p>");
        this.markPseudoCodeLine([2]);

        this.setAll(xy, -1);
        this.setAll(yx, -1);
        this.setAll(lx, 0);
        this.setAll(ly, 0);

        for (var x = 0; x < n; x++) {
            for (var y = 0; y < n; y++) {
                if(cost[x][y] > lx[x]){
                    lx[x] = cost[x][y];
                }
            }
        }

        this.showLabels();

        // -> 2 EQUALITY_GRAPH
        statusID = EQUALITY_GRAPH;
        
    };

    this.equalityGraph = function() {

        $("#tf1_div_statusErklaerung").html("<h3>Gleichheitsgraph</h3>"
            + "<p>Mittels der Markierungen kann der Gleichheitsgraph (<strong>schwarz</strong>) bestimmt werden.</p>");
        this.markPseudoCodeLine([2]);

        this.showEqualityGraph();

        // -> 3 FIND_ROOT
        statusID = FIND_ROOT;
    };

    this.findRoot = function() {

        $("#tf1_div_statusErklaerung").html("<h3>Augmentationsweg bestimmen</h3>" +
            "<h3>Wurzel eines alternierenden Pfades finden</h3>" + 
            "<p>Der Algorithmus wählt als Wurzel einen Knoten, der noch nicht im Matching vorhanden ist und markiert ihn <span style='font-weight: bold; color: " + const_Colors.NodeFillingHighlight + ";'>hell grün</span>.</p>");
        this.markPseudoCodeLine([4]);

        x, y, root = -1;
        q = new Array(n);
        wr = 0;
        rd = 0;
        labeling = false;
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
        y = 0;

        showTreeRoot(S);

        // -> 4 CONSTRUCT_ALTERNATING_PATH
        statusID = CONSTRUCT_ALTERNATING_PATH;

    };

    this.constructAlternatingPath = function() {

        $("#tf1_div_statusErklaerung").html(
            "<h3>Augmentationsweg bestimmen</h3>" +
            "<p>Der Algorithmus versucht nun schrittweise einen alternierenden Pfad zu konstruieren.</p>" +
            "<p>Die Konstruktion stoppt, wenn der alternierende Pfad augmentierend wird oder es keine weiteren passenden Kanten mehr gibt.</p>");
        this.markPseudoCodeLine([6, 7]);

        if(rd < wr) {

            if(!labeling) {

                x = q[rd++];
                if (cost[x][y] == lx[x] + ly[y] && !T[y]) {
                    if (yx[y] == -1) {
                        // -> 8 AUGMENT_PATH_FOUND
                        statusID = AUGMENT_PATH_FOUND;
                        this.displayST();
                        return;
                    }

                    T[y] = true;
                    q[wr++] = yx[y];
                    this.add_to_tree(yx[y], x);

                }

            }else{

                if (!T[y] && slack[y] == 0) {
                    if (yx[y] == -1) {
                        x = slackx[y];
                        // -> 8 AUGMENT_PATH_FOUND
                        statusID = AUGMENT_PATH_FOUND;
                        this.displayST();
                        return;
                    }

                    T[y] = true;
                    if (!S[yx[y]]) {
                        q[wr++] = yx[y];
                        this.add_to_tree(yx[y], slackx[y]);
                    }
                }

            }

            this.displayST();
            y++;

            // -> 4 CONSTRUCT_ALTERNATING_PATH
            statusID = CONSTRUCT_ALTERNATING_PATH;

        }else{
            // -> 5 NO_AUGMENT_PATH_FOUND
            statusID = NO_AUGMENT_PATH_FOUND;
        }        
        
    };

    this.noAugmentPathFound = function() {

        $("#tf1_div_statusErklaerung").html(
            "<h3>Augmentationsweg bestimmen</h3>" +
            "<p>Der Algorithmus konnte keinen Augmentationsweg mit der gewählten Wurzel (<span style='font-weight: bold; color: " + const_Colors.NodeFillingHighlight + ";'>hell grün</span>) im aktuellen Gleichheitsgraph finden.</p>"
        );
        this.markPseudoCodeLine([8]);

        // -> 6 IMPROVE_LABELS
        statusID = IMPROVE_LABELS;

    };

    this.improveLabels = function() {

        var delta = -1;
        for (var y = 0; y < n; y++) {
            if (!T[y] && (delta == -1 || slack[y] < delta)) {
                delta = slack[y];
            }
        }
        for (var x = 0; x < n; x++) {
            if (S[x]) lx[x] -= delta;
        }
        for (var y = 0; y < n; y++) {
            if (T[y]) ly[y] += delta;
        }
        for (var y = 0; y < n; y++) {
            if (!T[y])
                slack[y] -= delta;
        }
        
        showLabels(lx, ly);

        $("#tf1_div_statusErklaerung").html(
            "<h3>Markierungen verbessern</h3>" +
            "<p>Zur Bestimmung eines neuen Gleichheitsgraph muss der Algorithmus zunächst die Markierungen verbessern.</p>" + 
            "<p>Dazu wird ein \\(\\Delta\\) wie folgt bestimmt:</p>"+
            "<p>\\(\\Delta = \\min\\limits_{s \\in S\\ \\wedge\\ y \\in Y \\setminus T}\\{l(s) + l(y) - w(s,y)\\} = "+delta+"\\)</p>" +
            "<p>Die Markierungen werden dann nach folgender Formel aktualisiert:</p>" + 
            "<p>\\(\\begin{equation}l^\\prime(v) =\\begin{cases}l(v) - "+delta+" & v \\in S\\\\l(v) + "+delta+" & v \\in T\\\\l(v) & sonst\\end{cases}\\end{equation}\\)</p>"
        );
        MathJax.Hub.Queue(["Typeset", MathJax.Hub,"tf1_div_statusErklaerung"]);
        this.markPseudoCodeLine([9]);

        labeling = true;

        // -> 7 NEW_EQUALITY_GRAPH
        statusID = NEW_EQUALITY_GRAPH;

    };

    this.newEqualityGraph = function() {

        $("#tf1_div_statusErklaerung").html("<h3>Gleichheitsgraph</h3>"
            + "<p>Mittels der verbesserten Markierungen kann der Gleichheitsgraph (<strong>schwarz</strong>) erweitert werden.</p>");
        this.markPseudoCodeLine([9]);

        this.showEqualityGraph();

        wr = 0;
        rd = 0;
        y = 0;

        // -> 4 CONSTRUCT_ALTERNATING_PATH
        statusID = CONSTRUCT_ALTERNATING_PATH;
    };

    this.augmentPathFound = function() {

        $("#tf1_div_statusErklaerung").html(
            "<h3>Augmentationsweg bestimmen</h3>" +
            "<p>Es wurde ein Augmentationsweg (<span style='font-weight: bold; color: red;'>rot</span>) gefunden.</p>"
        );
        this.markPseudoCodeLine([10]);

        this.showAugmentingPath();

        // -> 9 IMPROVE_MATCHING
        statusID = IMPROVE_MATCHING;
    };

    this.improveMatching = function() {

        $("#tf1_div_statusErklaerung").html(
            "<h3>Matching vergrößern</h3>" +
            "<p>Mittels des gefundenen Augmentationsweges konnte das Matching (<span style='font-weight: bold; color: green;'>grün</span>) ergänzt werden.</p>"
        );
        this.markPseudoCodeLine([11]);

        resetNodeLayout();
        this.showEqualityGraph();
        maxMatch++;
        for (var cx = x, cy = y, ty; cx != -2; cx = prev[cx], cy = ty) {
            ty = xy[cx];
            yx[cy] = cx;
            xy[cx] = cy;
        }
        showCurrentMatching(xy, true);

        // -> 10 PERFECT_MATCHING_CHECK
        statusID = PERFECT_MATCHING_CHECK;
    };

    this.perfectMatchingCheck = function() {

        if (maxMatch == cost.length) {

            $("#tf1_div_statusErklaerung").html(
                "<h3>Auf perfektes Matching prüfen</h3>" +
                "<p>Der Algorithmus prüft nun das erweiterte Matching. Es ist vollständig und damit perfekt.</p>");

            // -> 11 SHOW_RESULT
            statusID = SHOW_RESULT;
        }else{

            $("#tf1_div_statusErklaerung").html(
                "<h3>Auf perfektes Matching prüfen</h3>" +
                "<p>Der Algorithmus prüft nun das erweiterte Matching. Es ist noch nicht vollständig.</p>");

            // -> 3 FIND_ROOT
            statusID = FIND_ROOT;
        }
        
        
    };

    this.showResult = function() {

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


    /*
     * Helper functions
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
        q = new Array(n);

    };

    this.markPseudoCodeLine = function(lineArray) {
        currentPseudoCodeLine = lineArray;
        $(".marked").removeClass('marked');
        for(var i = 0; i < lineArray.length; i++) {
            $("#tf1_p_l"+lineArray[i]).addClass('marked');
        }
    };

    this.addNamingLabels = function() {

        var nodeCounter = 1;

        for(var knotenID in graph.nodes) {
            graph.nodes[knotenID].setOuterLabel(String.fromCharCode("a".charCodeAt(0)+nodeCounter-1));
            nodeCounter++;
        };

    };

    this.displayST = function(){

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

        $("#tf1_td_setS").html(sField.join(",") || "&#8709;");
        $("#tf1_td_setT").html(tField.join(",") || "&#8709;");
    }

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

    this.setAll = function (arr, val) {
        var i, n = arr.length;
        for (i = 0; i < n; ++i) {
            arr[i] = val;
        }
    };

    this.showLabels = function() {
        for(var i = 0; i < lx.length; i++){
            graph.nodes[i].setLabel(lx[i]);
        }

        for(var i = 0; i < ly.length; i++){
            graph.nodes[lx.length + i].setLabel(ly[i]);
        }
    }

    this.showEqualityGraph = function() {
        for(var edge in graph.edges) {
            if(lx[graph.edges[edge].getSourceID()] + ly[(graph.edges[edge].getTargetID() - lx.length)] == graph.edges[edge].weight) {
                if(graph.edges[edge].originalColor != "green") {
                    graph.edges[edge].originalColor = "black";
                }
                graph.edges[edge].setLayout("lineColor", graph.edges[edge].originalColor);
                graph.edges[edge].setLayout("lineWidth", 3);
            }else{
                graph.edges[edge].setLayout("lineColor", const_Colors.grey);
                graph.edges[edge].setLayout("lineWidth", 1);
            }
        }
    }

    this.showAugmentingPath = function() {
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
        for(var i = 1; i < augmentingPath.length; i++){
            for(var edge in graph.edges){
                if(((graph.edges[edge].getSourceID() == augmentingPath[i] && graph.edges[edge].getTargetID()-xy.length == augmentingPath[i-1]) && i%2==1) 
                    || ((graph.edges[edge].getSourceID() == augmentingPath[i-1] && graph.edges[edge].getTargetID()-xy.length == augmentingPath[i]) && i%2==0)) {

                    graph.edges[edge].setLayout("lineColor", const_Colors.EdgeHighlight1);
                    graph.edges[edge].setLayout("lineWidth", 3);
                }
            }
        }
    }


    /*
     * Questions
     */

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


    this.generateNextStepQuestion = function() {

    	/* var form = "";
        for(var i = 0; i < answers.length; i++) {
            form += '<input type="radio" id="tf1_input_question'+currentQuestion+'_'+i+'" name="question'+currentQuestion+'" value="'+answers[i].key+'" />\
            <label for="tf1_input_question'+currentQuestion+'_'+i+'">'+answers[i].answer+'</label><br />';
        }
        form = '<form id="question'+currentQuestion+'_form">'+form+'</form>'; */

        $("#tf1_div_questionModal").html('<div class="ui-helper-reset ui-helper-clearfix ui-widget-header ui-corner-all" style="padding: 7px;">Frage #'+(currentQuestion+1)+'</div>\
            <p><em>Im aktuellen Schritt: '+previousStatusId+'</em></p>\
            <p>...</p>\
            <p>...</p>\
            <p><button id="tf1_button_questionClose">Antworten</button></p>\
            <p id="tf1_questionSolution">Korrekte Antwort:<br /><span class="answer"></span><br /><br />\
            <button id="tf1_button_questionClose2">Weiter</button>\
            </p>');

		console.log("Aktueller Status: " + statusID, "Vorheriger Status: " + previousStatusId);

        $("#tf1_button_questionClose2").button({disabled: true}).on("click", function() { algo.closeQuestionModal(); });
        $("#tf1_button_questionClose").button({disabled: true}).on("click", function() { algo.saveAnswer(); });
        this.activateAnswerButton();
        //$("#question"+currentQuestion+"_form").find("input[type='radio']").one("change", function() { algo.activateAnswerButton(); });


    };

    this.generateDeltaQuestion = function() {


    };

    this.generateNewLabelQuestion = function() {

    };

    this.generateEqualityGraphQuestion = function() {


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

        //return false;

        return 1;

    };

}

// Vererbung realisieren
Forschungsaufgabe1.prototype = new CanvasDrawer;
Forschungsaufgabe1.prototype.constructor = Forschungsaufgabe1;