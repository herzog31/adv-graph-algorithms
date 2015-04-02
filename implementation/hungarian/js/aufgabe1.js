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

    const NEXT_STEP_QUESTION = 1;
    const DELTA_QUESTION = 2;
    const NEW_LABEL_QUESTION = 3;
    const EQUALITY_GRAPH_QUESTION = 4;
    const START_LABEL_QUESTION = 5;

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
    var delta = -1;

    var labeling = false;
    var augment = false;

    var statusArray = [ {"key": 0, "answer": "Den Graph vervollständigen."},
                        {"key": 1, "answer": "Initiale Markierungen bestimmen."},
                        {"key": 2, "answer": "Den initialen Gleichheitsgraph bestimmen."},
                        {"key": 3, "answer": "Der Algorithmus muss einen neuen Wurzelknoten für einen alternierenden Pfad bestimmen."},
                        {"key": 4, "answer": "Einen neuen alternierenden Pfad konstruieren."},
                        {"key": 5, "answer": "Es existiert kein kein augmentierender Pfad im Gleichheitsgraph."},
                        {"key": 6, "answer": "Markierungen verbessern."},
                        {"key": 7, "answer": "Gleichheitsgraph mittels neuer Markierungen verbessern."},
                        {"key": 8, "answer": "Es existiert ein augmentierender Pfad im Gleichheitsgraph."},
                        {"key": 9, "answer": "Matching verbessern."},
                        {"key": 10, "answer": "Auf ein perfektes Matching prüfen."},
                        {"key": 11, "answer": "Das Matching ist perfekt. Der Algorithmus kann das optimales Matching ausgeben."},];

    var statusArrayPast = [ {"key": 0, "answer": "Der Graph wurde vervollständigt."},
                            {"key": 1, "answer": "Die initialen Markierungen wurden bestimmt."},
                            {"key": 2, "answer": "Der initiale Gleichheitsgraph wurde bestimmt"},
                            {"key": 3, "answer": "Eine Wurzel für einen alternierenden Pfad wurde bestimmt."},
                            {"key": 4, "answer": "Es wurde versucht einen alternierenden Pfad zu konstruieren."},
                            {"key": 5, "answer": "Es konnte kein augmentierender Pfad gefunden werden."},
                            {"key": 6, "answer": "Die Markierungen wurden verbessert."},
                            {"key": 7, "answer": "Der Gleichheitsgraph wurde mittels neuer Markierungen verbessert."},
                            {"key": 8, "answer": "Es wurde ein augmentierender Pfad gefunden."},
                            {"key": 9, "answer": "Das Matching wurde verbessert."},
                            {"key": 10, "answer": "Das Algorithmus hat das aktuelle Matching auf Vollständigkeit (perfekt) geprüft."},
                            {"key": 11, "answer": "Das optimale Matching wurde gezeigt."}];

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
        currentQuestionType = this.askQuestion();

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

            switch(currentQuestionType) {
				case NEXT_STEP_QUESTION:
					this.generateNextStepQuestion();
					break;
				case DELTA_QUESTION:
					this.generateDeltaQuestion();
					break;
				case NEW_LABEL_QUESTION:
					this.generateNewLabelQuestion();
					break;
				case EQUALITY_GRAPH_QUESTION:
					this.generateEqualityGraphQuestion();
					break;
                case START_LABEL_QUESTION:
                    this.generateStartLabelQuestion();
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

        showTreeRoot(S);

        // -> 4 CONSTRUCT_ALTERNATING_PATH
        statusID = CONSTRUCT_ALTERNATING_PATH;
        augment = true;

    };

    this.constructAlternatingPath = function() {

        $("#tf1_div_statusErklaerung").html(
            "<h3>Augmentationsweg bestimmen</h3>" +
            "<p>Der Algorithmus versucht nun schrittweise einen alternierenden Pfad zu konstruieren.</p>" +
            "<p>Die Konstruktion stoppt, wenn der alternierende Pfad augmentierend wird oder es keine weiteren passenden Kanten mehr gibt.</p>");
        this.markPseudoCodeLine([6, 7]);

        if(rd < wr) {
            if(augment) {
                x = q[rd++];
            }

            if(!labeling) {

                for(y = 0; y < n; y++) {

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

                }

            }else{
                wr = 0;
                rd = 0;
                for(y = 0; y < n; y++) {

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

            }
    
        }

        // -> 5 NO_AUGMENT_PATH_FOUND
        statusID = NO_AUGMENT_PATH_FOUND;
        
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

        delta = -1;
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
        
        this.displayST();

        if(currentQuestionType !== DELTA_QUESTION && currentQuestionType !== NEW_LABEL_QUESTION) {
            this.showLabels();
        }

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

        if(currentQuestionType !== EQUALITY_GRAPH_QUESTION) {
            this.showEqualityGraph();
        }
        
        augment = false;
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
        // Question Type 1

        var answers = [];
        var statusArrayCopy = statusArray.slice();

        var contextQuestions = [];
        contextQuestions[CONSTRUCT_ALTERNATING_PATH] = [AUGMENT_PATH_FOUND, NO_AUGMENT_PATH_FOUND];
        contextQuestions[PERFECT_MATCHING_CHECK] = [SHOW_RESULT, FIND_ROOT];
        contextQuestions[IMPROVE_MATCHING] = [PERFECT_MATCHING_CHECK, FIND_ROOT, IMPROVE_LABELS];
        contextQuestions[NO_AUGMENT_PATH_FOUND] = [CONSTRUCT_ALTERNATING_PATH, FIND_ROOT, IMPROVE_LABELS];
        contextQuestions[AUGMENT_PATH_FOUND] = [CONSTRUCT_ALTERNATING_PATH, IMPROVE_LABELS, IMPROVE_MATCHING];

        if(previousStatusId in contextQuestions) {
            statusArrayCopy.map(function(x) {
                if($.inArray(x.key, contextQuestions[previousStatusId]) > -1) {
                    answers.push(x);
                }
            });
        }

        var previousStep = "";
        for (var i = 0; i < statusArrayPast.length; i++) {
            if(statusArrayPast[i].key === previousStatusId) {
                previousStep = statusArrayPast[i].answer;
            }
        };

        answers = Utilities.shuffleArray(answers);
        questions[currentQuestion] = {type: currentQuestionType, rightAnswer: statusID};

    	var form = "";
        for(var i = 0; i < answers.length; i++) {
            form += '<input type="radio" id="tf1_input_question'+currentQuestion+'_'+i+'" name="question'+currentQuestion+'" value="'+answers[i].key+'" />\
            <label for="tf1_input_question'+currentQuestion+'_'+i+'">'+answers[i].answer+'</label><br />';
        }
        form = '<form id="question'+currentQuestion+'_form">'+form+'</form>';

        $("#tf1_div_questionModal").html('<div class="ui-helper-reset ui-helper-clearfix ui-widget-header ui-corner-all" style="padding: 7px;">Frage #'+(currentQuestion+1)+'</div>\
            <p><em>Im aktuellen Schritt: '+previousStep+'</em></p>\
            <p>Welchen Schritt macht der Algorithmus als nächstes?</p>\
            <p>'+form+'</p>\
            <p><button id="tf1_button_questionClose">Antworten</button></p>\
            <p id="tf1_questionSolution">Korrekte Antwort:<br /><span class="answer"></span><br /><br />\
            <button id="tf1_button_questionClose2">Weiter</button>\
            </p>');

        $("#tf1_button_questionClose2").button({disabled: true}).on("click", function() { algo.closeQuestionModal(); });
        $("#tf1_button_questionClose").button({disabled: true}).on("click", function() { algo.saveAnswer(); });
        $("#question"+currentQuestion+"_form").find("input[type='radio']").one("change", function() { algo.activateAnswerButton(); });


    };

    this.generateDeltaQuestion = function() {
        
        questions[currentQuestion] = {type: currentQuestionType, rightAnswer: delta};

        $("#tf1_div_questionModal").html('<div class="ui-helper-reset ui-helper-clearfix ui-widget-header ui-corner-all" style="padding: 7px;">Frage #'+(currentQuestion+1)+'</div>\
            <p>Im aktuellen Schritt wird der Algorithmus die Markierungen verbessern. Dazu benötigt er ein \\(\\Delta\\), welches sich nach folgender Formel berechnet:</p>\
            <p style="text-align: center;">\\(\\Delta = \\min\\limits_{s \\in S\\ \\wedge\\ y \\in Y \\setminus T}\\{l(s) + l(y) - w(s,y)\\}\\)</p>\
            <p style="text-align: center;">\\(S = \\{'+$("#tf1_td_setS").html()+'\\},\\ T = \\{'+$("#tf1_td_setT").html()+'\\}\\)</p>\
            <p>Welchen Wert für \\(\\Delta\\) wird der Algorithmus ermitteln?</p>\
            <p><form id="question'+currentQuestion+'_form">\
            <input type="text" name="question'+currentQuestion+'" value="" placeholder="0" />\
            </form></p>\
            <p><button id="tf1_button_questionClose">Antworten</button></p>\
            <p id="tf1_questionSolution">Korrekte Antwort: <span class="answer"></span><br /><br />\
            <button id="tf1_button_questionClose2">Weiter</button>\
            </p>');

        MathJax.Hub.Queue(["Typeset", MathJax.Hub,"tf1_div_questionModal"]);

        $("#tf1_button_questionClose2").button({disabled: true}).on("click", function() { algo.closeQuestionModal(); });
        $("#tf1_button_questionClose").button({disabled: true}).on("click", function() { algo.saveAnswer(); });
        $("#question"+currentQuestion+"_form").find("input[type='text']").one("keyup", function() { algo.activateAnswerButton(); });

    };

    this.generateNewLabelQuestion = function() {

        var changedNodes = [];
        var correctAnswer = [];
        var currentValue = [];

        for(var i = 0; i < lx.length; i++) {
            if(parseInt(graph.nodes[i].getLabel()) !== lx[i]) {
                changedNodes.push(i);
                correctAnswer.push(lx[i]);
                currentValue.push(graph.nodes[i].getLabel());
            }
        }

        for(var i = 0; i < ly.length; i++) {
            if(parseInt(graph.nodes[(lx.length + i)].getLabel()) !== ly[i]) {
                changedNodes.push((lx.length + i));
                correctAnswer.push(ly[i]);
                currentValue.push(graph.nodes[(lx.length + i)].getLabel());
            }
        }

        var range = $.map($(Array(changedNodes.length)), function(val, i) { return i; });
        range = Utilities.shuffleArray(range);
        if(range.length > 4) {
            range = range.slice(0, 4);
        }
        range.sort();
        var changedNodesR = [];
        var correctAnswerR = [];
        var currentValueR = [];
        for(var i = 0; i < range.length; i++) {
            changedNodesR.push(changedNodes[range[i]]);
            correctAnswerR.push(correctAnswer[range[i]]);
            currentValueR.push(currentValue[range[i]]);
        }
        changedNodes = changedNodesR;
        correctAnswer = correctAnswerR;
        currentValue = currentValueR;

        var changedNodesOuter = changedNodes.map(function(i) {
            return graph.nodes[i].getOuterLabel();
        });

        correctAnswerJoin = correctAnswer.join(",");

        questions[currentQuestion] = {type: currentQuestionType, rightAnswer: correctAnswerJoin, rightAnswerField: correctAnswer};

        var form = "";
        for(var i = 0; i < changedNodes.length; i++) {
            form += '<label for="tf1_input_question'+currentQuestion+'_'+i+'" class="question_label_node">'+changedNodesOuter[i]+'</label>\
            <input type="text" id="tf1_input_question'+currentQuestion+'_'+i+'" name="question'+currentQuestion+'_'+i+'" value="" placeholder="'+currentValue[i]+'" class="question_input_node" /><br style="clear: both;" />';
        }
        form = '<form id="question'+currentQuestion+'_form">'+form+'</form>';

        $("#tf1_div_questionModal").html('<div class="ui-helper-reset ui-helper-clearfix ui-widget-header ui-corner-all" style="padding: 7px;">Frage #'+(currentQuestion+1)+'</div>\
            <p>Im aktuellen Schritt wird der Algorithmus die Markierungen verbessern. Dazu wurde bereits \\(\\Delta = '+delta+'\\) bestimmt.</p>\
            <p style="text-align: center;">\\(S = \\{'+$("#tf1_td_setS").html()+'\\},\\ T = \\{'+$("#tf1_td_setT").html()+'\\}\\)</p>\
            <p>Bitte berechne neue Markierungen nach der bekannten Formel für folgende Knoten:</p>\
            <p>'+form+'</p>\
            <p><button id="tf1_button_questionClose">Antworten</button></p>\
            <p id="tf1_questionSolution">\
            <button id="tf1_button_questionClose2">Weiter</button>\
            </p>');

        MathJax.Hub.Queue(["Typeset", MathJax.Hub,"tf1_div_questionModal"]);

        $("#tf1_button_questionClose2").button({disabled: true}).on("click", function() { algo.closeQuestionModal(); });
        $("#tf1_button_questionClose").button({disabled: true}).on("click", function() { algo.saveAnswer(); });
        $("#question"+currentQuestion+"_form").find("input[type='text']").one("keyup", function() { algo.activateAnswerButton(); });

    };

    this.generateEqualityGraphQuestion = function() {

        var allEdges = [];
        var edgesInEqualityGraph = [];
        var correctAnswerForField = [];

        var inputs = "", source, target, edgeLabel;
        for(var i in graph.edges) {
            source = graph.edges[i].getSourceID();
            target = graph.edges[i].getTargetID();
            edgeLabel = '('+graph.nodes[source].getOuterLabel()+','+graph.nodes[target].getOuterLabel()+')';

            if(lx[source] + ly[(target - lx.length)] === graph.edges[i].weight) {
                edgesInEqualityGraph.push(parseInt(i));
                correctAnswerForField.push(edgeLabel);
            }

            inputs += '<input type="checkbox" id="tf1_input_question'+currentQuestion+'_'+i+'" data-answer-id="'+i+'" name="question'+currentQuestion+'_'+i+'" value="'+i+'" />\
            <label for="tf1_input_question'+currentQuestion+'_'+i+'">'+edgeLabel+'</label><br />';
        }

        questions[currentQuestion] = {type: currentQuestionType, rightAnswer: edgesInEqualityGraph};

        $("#tf1_div_questionModal").html('<div class="ui-helper-reset ui-helper-clearfix ui-widget-header ui-corner-all" style="padding: 7px;">Frage #'+(currentQuestion+1)+'</div>\
            <p>Im aktuellen Schritt wird der Algorithmus einen neuen Gleichheitsgraph bestimmen. Bitte markiere alle Kanten des neuen Gleichheitsgraphs.</p>\
            <p><form id="question'+currentQuestion+'_form">'+inputs+'</form></p>\
            <p><button id="tf1_button_questionClose">Antworten</button></p>\
            <p id="tf1_questionSolution">\
            <button id="tf1_button_questionClose2">Weiter</button>\
            </p>');

        MathJax.Hub.Queue(["Typeset", MathJax.Hub,"tf1_div_questionModal"]);

        $("#tf1_button_questionClose2").button({disabled: true}).on("click", function() { algo.closeQuestionModal(); });
        $("#tf1_button_questionClose").button({disabled: false}).on("click", function() { algo.saveAnswer(); });

    };

    this.generateStartLabelQuestion = function() {

        var nodeKeys = Object.keys(graph.nodes);
        var randomKey = nodeKeys[nodeKeys.length * Math.random() << 0];
        var answer = 0;
        if(randomKey < lx.length) {
            answer = lx[randomKey];
        }else if (randomKey < ly.length) {
            answer = ly[randomKey];
        }
        var randomNode = graph.nodes[randomKey];

        randomNode.setLabel("?");
        this.needRedraw = true;

        questions[currentQuestion] = {type: currentQuestionType, rightAnswer: answer};

        var form = '<label for="tf1_input_question'+currentQuestion+'" class="question_label_node">'+randomNode.getOuterLabel()+'</label>\
            <input type="text" id="tf1_input_question'+currentQuestion+'" name="question'+currentQuestion+'" value="" class="question_input_node" /><br style="clear: both;" />';
        form = '<form id="question'+currentQuestion+'_form">'+form+'</form>';

        $("#tf1_div_questionModal").html('<div class="ui-helper-reset ui-helper-clearfix ui-widget-header ui-corner-all" style="padding: 7px;">Frage #'+(currentQuestion+1)+'</div>\
            <p>Im ersten Schritt bestimmt der Algorithmus die initialen Markierungen.</p>\
            <p>Bitte berechne die initiale Markierung für den Knoten <strong>'+randomNode.getOuterLabel()+'</strong>.</p>\
            <p>'+form+'</p>\
            <p><button id="tf1_button_questionClose">Antworten</button></p>\
            <p id="tf1_questionSolution">\
            <button id="tf1_button_questionClose2">Weiter</button>\
            </p>');

        MathJax.Hub.Queue(["Typeset", MathJax.Hub,"tf1_div_questionModal"]);

        $("#tf1_button_questionClose2").button({disabled: true}).on("click", function() { algo.closeQuestionModal(); });
        $("#tf1_button_questionClose").button({disabled: true}).on("click", function() { algo.saveAnswer(); });
        $("#question"+currentQuestion+"_form").find("input[type='text']").one("keyup", function() { algo.activateAnswerButton(); });

    };

    this.saveAnswer = function() {
        var givenAnswer = "";

        if(currentQuestionType === NEXT_STEP_QUESTION) {
            givenAnswer = $("#question"+currentQuestion+"_form").find("input[type='radio']:checked").val();
        }else if(currentQuestionType === DELTA_QUESTION) {
            givenAnswer = $("#question"+currentQuestion+"_form").find("input[type='text']").val();
            givenAnswer = parseInt(givenAnswer);
            this.showLabels();
            this.needRedraw = true;
        }else if(currentQuestionType === NEW_LABEL_QUESTION) {
            givenAnswer = [];
            $("#question"+currentQuestion+"_form").find("input[type='text']").each(function() {
                givenAnswer.push(parseInt($(this).val()));
            });
            givenAnswer = givenAnswer.join(",");
            this.showLabels();
            this.needRedraw = true;
        }else if(currentQuestionType === EQUALITY_GRAPH_QUESTION) {
            givenAnswer = [];
            $('#question'+currentQuestion+'_form').find("input[type='checkbox']").each(function() {
                $(this).attr("disabled", true);
                var isChecked = $(this).prop('checked');
                var answerId = parseInt($(this).data("answerId"));
                if(isChecked) {
                    givenAnswer.push(answerId);
                }
            });
            givenAnswer = givenAnswer.join(",");
            this.showEqualityGraph();
            this.needRedraw = true;
        }else if(currentQuestionType === START_LABEL_QUESTION) {
            var givenAnswer = parseInt($("#question"+currentQuestion+"_form").find("input[type='text']").val());
            this.showLabels();
            this.needRedraw = true;
        }

        if(questions[currentQuestion].type === NEXT_STEP_QUESTION) { // Next Step
            for (var i = 0; i < statusArray.length; i++) {
                if(statusArray[i].key == questions[currentQuestion].rightAnswer) {
                    $("#tf1_questionSolution").find(".answer").html(statusArray[i].answer);
                }
            }
        }else if(questions[currentQuestion].type === DELTA_QUESTION) {
            $("#tf1_questionSolution").find(".answer").html(questions[currentQuestion].rightAnswer);
        }else if(questions[currentQuestion].type === NEW_LABEL_QUESTION) {
            $(".question_input_node").each(function(i) {
                if(parseInt($(this).val()) === questions[currentQuestion].rightAnswerField[i]) {
                    $(this).after('<span class="answer" style="color: green;">'+questions[currentQuestion].rightAnswerField[i]+'</span>');
                }else{
                    $(this).after('<span class="answer" style="color: red;">'+questions[currentQuestion].rightAnswerField[i]+'</span>');
                }  
            });
        }else if(questions[currentQuestion].type === EQUALITY_GRAPH_QUESTION) {
            $('#question'+currentQuestion+'_form').find('label').each(function(i) {
                if($.inArray(i, questions[currentQuestion].rightAnswer) > -1) {
                    $(this).css("color", "green");
                }else{
                    $(this).css("color", "red");
                }
            });
            questions[currentQuestion].rightAnswer = questions[currentQuestion].rightAnswer.join(",");
        }else if(questions[currentQuestion].type === START_LABEL_QUESTION) {
            if(givenAnswer === questions[currentQuestion].rightAnswer) {
                $(".question_input_node").after('<span class="answer" style="color: green;">'+questions[currentQuestion].rightAnswer+'</span>');
            }else{
                $(".question_input_node").after('<span class="answer" style="color: red;">'+questions[currentQuestion].rightAnswer+'</span>');
            }
        }

        questions[currentQuestion].givenAnswer = givenAnswer;
        if(questions[currentQuestion].givenAnswer == questions[currentQuestion].rightAnswer) {
            $("#tf1_questionSolution").css("color", "green");
            if(debugConsole) if(debugConsole) console.log("Answer given ", givenAnswer, " was right!");
        }else{
            $("#tf1_questionSolution").css("color", "red");
            if(debugConsole) if(debugConsole) console.log("Answer given ", givenAnswer, " was wrong! Right answer was ", questions[currentQuestion].rightAnswer);
        }

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

        if(statusID === INITIAL_LABELS) {
            return START_LABEL_QUESTION;
        }

        if(statusID === NEW_EQUALITY_GRAPH) {
            if(randomVariable(0, 1) > 0.5) {
                return EQUALITY_GRAPH_QUESTION;
            }
        }
    
        if(statusID === IMPROVE_LABELS) {
            if(randomVariable(0, 1) > 0.7) {
                return DELTA_QUESTION;
            }else if(randomVariable(0, 1) > 0.4) {
                return NEW_LABEL_QUESTION;
            }
        }

        if($.inArray(statusID, [CONSTRUCT_ALTERNATING_PATH, PERFECT_MATCHING_CHECK, IMPROVE_MATCHING, NO_AUGMENT_PATH_FOUND, AUGMENT_PATH_FOUND]) > -1) {
            if(randomVariable(0, 1) > 0.8) {
                return NEXT_STEP_QUESTION;
            }
        }
        
        return false;

    };

}

// Vererbung realisieren
Forschungsaufgabe1.prototype = new CanvasDrawer;
Forschungsaufgabe1.prototype.constructor = Forschungsaufgabe1;