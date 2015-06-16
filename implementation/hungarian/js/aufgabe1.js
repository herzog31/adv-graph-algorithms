/**
 * @author Mark J. Becker
 * Forschungsaufgabe 1
 */

/**
 * Instanz der Forschungsaufgabe 1
 * @constructor
 * @param {Graph} p_graph Graph, auf dem der Algorithmus ausgeführt wird
 * @param {Object} p_canvas jQuery Objekt des Canvas, in dem gezeichnet wird.
 * @param {Object} p_tab jQuery Objekt des aktuellen Tabs.
 * @augments CanvasDrawer
 */
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
    /**
     * Index der aktuellen Frage
     * @type {Number}
     */
    var currentQuestion = 0;
    /**
     * Typ der aktuellen Frage
     * @type {Number}
     */
    var currentQuestionType = false;
    /**
     * Array mit allen Fragen
     * @type {Array}
     */
    var questions = new Array();
    /**
     * Zeige Debug Informationen in der Console an
     * @type {Boolean}
     */
    var debugConsole = false;
    /**
     * Index des vorherigen Algorithmenschritts
     * @type {Number}
     */
    var previousStatusId = 0;
    /**
     * Liste der aktuell markierten Zeilen im Pseudocode
     * @type {Array}
     */
    var currentPseudoCodeLine = [1];

    /**
     * Algorithmen Status Konstanten
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
    /**
     * Fragetyp Konstanten
     */
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

    /**
     * Array mit Gegenwartsbeschreibungen aller Algorithmenschritte
     * @type {Array}
     */
    var statusArray = [ {"key": 0, "answer": LNG.K('aufgabe1_status0')},
                        {"key": 1, "answer": LNG.K('aufgabe1_status1')},
                        {"key": 2, "answer": LNG.K('aufgabe1_status2')},
                        {"key": 3, "answer": LNG.K('aufgabe1_status3')},
                        {"key": 4, "answer": LNG.K('aufgabe1_status4')},
                        {"key": 5, "answer": LNG.K('aufgabe1_status5')},
                        {"key": 6, "answer": LNG.K('aufgabe1_status6')},
                        {"key": 7, "answer": LNG.K('aufgabe1_status7')},
                        {"key": 8, "answer": LNG.K('aufgabe1_status8')},
                        {"key": 9, "answer": LNG.K('aufgabe1_status9')},
                        {"key": 10, "answer": LNG.K('aufgabe1_status10')},
                        {"key": 11, "answer": LNG.K('aufgabe1_status11')}];

    /**
     * Array mit Vergangenheitsbeschreibungen aller Algorithmenschritte
     * @type {Array}
     */
    var statusArrayPast = [ {"key": 0, "answer": LNG.K('aufgabe1_statuspast0')},
                            {"key": 1, "answer": LNG.K('aufgabe1_statuspast1')},
                            {"key": 2, "answer": LNG.K('aufgabe1_statuspast2')},
                            {"key": 3, "answer": LNG.K('aufgabe1_statuspast3')},
                            {"key": 4, "answer": LNG.K('aufgabe1_statuspast4')},
                            {"key": 5, "answer": LNG.K('aufgabe1_statuspast5')},
                            {"key": 6, "answer": LNG.K('aufgabe1_statuspast6')},
                            {"key": 7, "answer": LNG.K('aufgabe1_statuspast7')},
                            {"key": 8, "answer": LNG.K('aufgabe1_statuspast8')},
                            {"key": 9, "answer": LNG.K('aufgabe1_statuspast9')},
                            {"key": 10, "answer": LNG.K('aufgabe1_statuspast10')},
                            {"key": 11, "answer": LNG.K('aufgabe1_statuspast11')}];

    /**
     * Startet die Ausführung des Algorithmus.
     * @method
     */
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
     * Führt den nächsten Algorithmenschritt aus, prüft ob eine Frage gestellt wird und zeigt die Frage an
     * @method
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

    /**
     * Bestimme initiale Markierungen
     * @method
     */
    this.initialLabels = function() {

        $("#tf1_div_statusErklaerung").html("<h3>"+LNG.K('aufgabe1_initial_h')+"</h3>"
            + "<p>"+LNG.K('aufgabe1_initial_t1')+"</p>");
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

    /**
     * Bestimme Gleichheitsgraph
     * @method
     */
    this.equalityGraph = function() {

        $("#tf1_div_statusErklaerung").html("<h3>"+LNG.K('aufgabe1_equal_h')+"</h3>"
            + "<p>"+LNG.K('aufgabe1_equal_t1')+"</p>");
        this.markPseudoCodeLine([2]);

        this.showEqualityGraph();

        // -> 3 FIND_ROOT
        statusID = FIND_ROOT;
    };

    /**
     * Bestimme Wurzelknoten
     * @method
     */
    this.findRoot = function() {

        $("#tf1_div_statusErklaerung").html("<h3>"+LNG.K('aufgabe1_augment_h')+"</h3>" +
            "<h3>"+LNG.K('aufgabe1_augment_t1')+"</h3>" + 
            "<p>"+LNG.K('aufgabe1_augment_t2')+"<span style='font-weight: bold; color: " + const_Colors.NodeFillingHighlight + ";'>"+LNG.K('aufgabe1_augment_t3')+"</span>.</p>");
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

    /**
     * Konstruiere alternierenden Pfad
     * @method
     */
    this.constructAlternatingPath = function() {

        $("#tf1_div_statusErklaerung").html(
            "<h3>"+LNG.K('aufgabe1_augment_h')+"</h3>" +
            "<p>"+LNG.K('aufgabe1_augment_t4')+"</p>" +
            "<p>"+LNG.K('aufgabe1_augment_t5')+"</p>");
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

    /**
     * Status wenn kein augmentierender Pfad gefunden wurde
     * @method
     */
    this.noAugmentPathFound = function() {

        $("#tf1_div_statusErklaerung").html(
            "<h3>"+LNG.K('aufgabe1_augment_h')+"</h3>" +
            "<p>"+LNG.K('aufgabe1_augment_t6')+"<span style='font-weight: bold; color: " + const_Colors.NodeFillingHighlight + ";'>"+LNG.K('aufgabe1_augment_t7')+"</span>"+LNG.K('aufgabe1_augment_t8')+"</p>"
        );
        this.markPseudoCodeLine([8]);

        // -> 6 IMPROVE_LABELS
        statusID = IMPROVE_LABELS;

    };

    /**
     * Berechne neue Markierungen
     * @method
     */
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
            "<h3>"+LNG.K('aufgabe1_label_h')+"</h3>" +
            "<p>"+LNG.K('aufgabe1_label_t1')+"</p>" + 
            "<p>"+LNG.K('aufgabe1_label_t2')+"</p>"+
            "<p>"+LNG.K('aufgabe1_label_t3')+delta+LNG.K('aufgabe1_label_t4')+"</p>" +
            "<p>"+LNG.K('aufgabe1_label_t5')+"</p>" + 
            "<p>"+LNG.K('aufgabe1_label_t6')+delta+LNG.K('aufgabe1_label_t7')+delta+LNG.K('aufgabe1_label_t8')+"</p>"
        );
        MathJax.Hub.Queue(["Typeset", MathJax.Hub,"tf1_div_statusErklaerung"]);
        this.markPseudoCodeLine([9]);

        labeling = true;

        // -> 7 NEW_EQUALITY_GRAPH
        statusID = NEW_EQUALITY_GRAPH;

    };

    /**
     * Bestimme neuen Gleichheitsgraph
     * @method
     */
    this.newEqualityGraph = function() {

        $("#tf1_div_statusErklaerung").html("<h3>"+LNG.K('aufgabe1_equal_h')+"</h3>"
            + "<p>"+LNG.K('aufgabe1_equal_t2')+"</p>");
        this.markPseudoCodeLine([9]);

        if(currentQuestionType !== EQUALITY_GRAPH_QUESTION) {
            this.showEqualityGraph();
        }
        
        augment = false;
        // -> 4 CONSTRUCT_ALTERNATING_PATH
        statusID = CONSTRUCT_ALTERNATING_PATH;
    };

    /**
     * Status wenn ein augmentierender Pfad gefunden wurde
     * @method
     */
    this.augmentPathFound = function() {

        $("#tf1_div_statusErklaerung").html(
            "<h3>"+LNG.K('aufgabe1_augment_h')+"</h3>" +
            "<p>"+LNG.K('aufgabe1_augment_t9')+"</p>"
        );
        this.markPseudoCodeLine([10]);

        this.showAugmentingPath();

        // -> 9 IMPROVE_MATCHING
        statusID = IMPROVE_MATCHING;
    };

    /**
     * Verbessere Matching mit augmentierendem Graph
     * @method
     */
    this.improveMatching = function() {

        $("#tf1_div_statusErklaerung").html(
            "<h3>"+LNG.K('aufgabe1_matchinc_h')+"</h3>" +
            "<p>"+LNG.K('aufgabe1_matchinc_t1')+"</p>"
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

    /**
     * Prüfe ob ein perfektes Matching vorliegt
     * @method
     */
    this.perfectMatchingCheck = function() {

        if (maxMatch == cost.length) {

            $("#tf1_div_statusErklaerung").html(
                "<h3>"+LNG.K('aufgabe1_matchchk_h')+"</h3>" +
                "<p>"+LNG.K('aufgabe1_matchchk_t1')+"</p>");

            // -> 11 SHOW_RESULT
            statusID = SHOW_RESULT;
        }else{

            $("#tf1_div_statusErklaerung").html(
                "<h3>"+LNG.K('aufgabe1_matchchk_h')+"</h3>" +
                "<p>"+LNG.K('aufgabe1_matchchk_t2')+"</p>");

            // -> 3 FIND_ROOT
            statusID = FIND_ROOT;
        }
        
        
    };

    /**
     * Zeige perfektes Matchon
     * @method
     */
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
            "<h3>"+LNG.K('aufgabe1_result_h')+"</h3>" +
            "<p>"+LNG.K('aufgabe1_result_t1')+"</p>" +
            "<p>"+LNG.K('aufgabe1_result_t2')+ret+LNG.K('aufgabe1_result_t3')+"</p>" +
            "<h3>"+LNG.K('algorithm_msg_finish')+"</h3>" +
            "<button id='tf1_button_gotoIdee' class='ui-button ui-widget ui-state-default ui-corner-all ui-button-text-only' role='button'><span class='ui-button-text'>"+LNG.K('algorithm_btn_more')+"</span></button>" +
            "<h3>"+LNG.K('algorithm_msg_test')+"</h3>" +
            "<button id='tf1_button_gotoFA2' class='ui-button ui-widget ui-state-default ui-corner-all ui-button-text-only' role='button'><span class='ui-button-text'>"+LNG.K('algorithm_btn_exe2')+"</span></button>"
        );

        $("#tf1_button_gotoIdee").click(function() {
            $("#tabs").tabs("option", "active", 3);
        });
        $("#tf1_button_gotoFA2").click(function() {
            $("#tabs").tabs("option", "active", 5);
        });

    };

    /**
     * Vervollständige Graphen mit Dummyknoten und -kanten
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
        q = new Array(n);

    };

    /**
     * Markiere Zeilen im Pseudocode
     * @method
     * @param  {Array} lineArray Liste der zu markierenden Linien
     */
    this.markPseudoCodeLine = function(lineArray) {
        currentPseudoCodeLine = lineArray;
        $(".marked").removeClass('marked');
        for(var i = 0; i < lineArray.length; i++) {
            $("#tf1_p_l"+lineArray[i]).addClass('marked');
        }
    };

    /**
     * Erzeuge Namen (Buchstaben) für alle Knoten
     * @method
     */
    this.addNamingLabels = function() {

        var nodeCounter = 1;

        for(var knotenID in graph.nodes) {
            graph.nodes[knotenID].setOuterLabel(String.fromCharCode("a".charCodeAt(0)+nodeCounter-1));
            nodeCounter++;
        };

    };

    /**
     * Aktualisiere S und T Werte in der Statustabelle
     * @method
     */
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

    /**
     * Setze alle Elemente eines Arrays auf gegebenen Wert
     * @param {Array} arr Array
     * @param {Object} val Wert
     */
    this.setAll = function (arr, val) {
        var i, n = arr.length;
        for (i = 0; i < n; ++i) {
            arr[i] = val;
        }
    };

    /**
     * Zeige die Markierungen als Label der Knoten an
     * @method
     */
    this.showLabels = function() {
        for(var i = 0; i < lx.length; i++){
            graph.nodes[i].setLabel(lx[i]);
        }

        for(var i = 0; i < ly.length; i++){
            graph.nodes[lx.length + i].setLabel(ly[i]);
        }
    }

    /**
     * Hebe Gleichheitsgraph hervor
     * @method
     */
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

    /**
     * Hebe augmentierenden Pfad hervor
     * @method
     */
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

    /**
     * Zeige Frage
     * @method
     */
    this.showQuestionModal = function() {
        $("#tf1_div_statusTabs").hide();
        $("#tf1_div_questionModal").show();
        $("#tf1_questionSolution").hide();
    };

    /**
     * Schließe Frage
     * @method
     */
    this.closeQuestionModal = function() {
        $("#tf1_div_statusTabs").show();
        $("#tf1_div_questionModal").hide();
        $("#tf1_button_questionClose").off();
        $("#tf1_button_1Schritt").button("option", "disabled", false);
        $("#tf1_button_vorspulen").button("option", "disabled", false);
        $("#tf1_div_questionModal").off("keyup");
    };

    /**
     * Generiere Frage zum nächsten Algorithmenschritt
     * @method
     */
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

        $("#tf1_div_questionModal").html('<div class="ui-helper-reset ui-helper-clearfix ui-widget-header ui-corner-all" style="padding: 7px;">'+LNG.K('aufgabe1_question')+' #'+(currentQuestion+1)+'</div>\
            <p><em>'+LNG.K('aufgabe1_currentstep')+' '+previousStep+'</em></p>\
            <p>'+LNG.K('aufgabe1_qns_1')+'</p>\
            <form id="question'+currentQuestion+'_form" onsubmit="return false">\
            <p>'+form+'</p>\
            <p><button id="tf1_button_questionClose">'+LNG.K('aufgabe1_vanswer')+'</button></p>\
            <p id="tf1_questionSolution">'+LNG.K('aufgabe1_correctanswer')+'<br /><span class="answer"></span><br /><br />\
            <button id="tf1_button_questionClose2">'+LNG.K('aufgabe1_next')+'</button>\
            </p>\
            </form>');

        $("#tf1_button_questionClose2").button({disabled: true}).on("click", function() { algo.closeQuestionModal(); });
        $("#tf1_button_questionClose").button({disabled: true}).on("click", function() { algo.saveAnswer(); });
        $("#question"+currentQuestion+"_form").find("input[type='radio']").one("change", function() { algo.activateAnswerButton(); });


    };

    /**
     * Generiere Frage zur Berechnung des Delta
     * @method
     */
    this.generateDeltaQuestion = function() {
        
        questions[currentQuestion] = {type: currentQuestionType, rightAnswer: delta};

        $("#tf1_div_questionModal").html('<div class="ui-helper-reset ui-helper-clearfix ui-widget-header ui-corner-all" style="padding: 7px;">'+LNG.K('aufgabe1_question')+' #'+(currentQuestion+1)+'</div>\
            <p>'+LNG.K('aufgabe1_qd_1')+'</p>\
            <p style="text-align: center;">'+LNG.K('aufgabe1_qd_2')+'</p>\
            <p style="text-align: center;">'+LNG.K('aufgabe1_qd_3')+$("#tf1_td_setS").html()+LNG.K('aufgabe1_qd_4')+$("#tf1_td_setT").html()+LNG.K('aufgabe1_qd_5')+'</p>\
            <p>'+LNG.K('aufgabe1_qd_6')+'</p>\
            <p><form id="question'+currentQuestion+'_form" onsubmit="return false">\
            <input type="text" name="question'+currentQuestion+'" value="" placeholder="0" />\
            </p>\
            <p><button id="tf1_button_questionClose">'+LNG.K('aufgabe1_vanswer')+'</button></p>\
            <p id="tf1_questionSolution">'+LNG.K('aufgabe1_correctanswer')+' <span class="answer"></span><br /><br />\
            <button id="tf1_button_questionClose2">'+LNG.K('aufgabe1_next')+'</button>\
            </p>\
            </form>');

        MathJax.Hub.Queue(["Typeset", MathJax.Hub,"tf1_div_questionModal"]);

        $("#tf1_button_questionClose2").button({disabled: true}).on("click", function() { algo.closeQuestionModal(); });
        $("#tf1_button_questionClose").button({disabled: true}).on("click", function() { algo.saveAnswer(); });
        $("#question"+currentQuestion+"_form").find("input[type='text']").one("keyup", function() { algo.activateAnswerButton(); });

    };

    /**
     * Generiere Frage zur Berechnung neuer Markierungen
     * @method
     */
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

        $("#tf1_div_questionModal").html('<div class="ui-helper-reset ui-helper-clearfix ui-widget-header ui-corner-all" style="padding: 7px;">'+LNG.K('aufgabe1_question')+' #'+(currentQuestion+1)+'</div>\
            <p>'+LNG.K('aufgabe1_qnl_1')+delta+LNG.K('aufgabe1_qnl_2')+'</p>\
            <p style="text-align: center;">'+LNG.K('aufgabe1_qnl_3')+$("#tf1_td_setS").html()+LNG.K('aufgabe1_qnl_4')+$("#tf1_td_setT").html()+LNG.K('aufgabe1_qnl_5')+'</p>\
            <p>'+LNG.K('aufgabe1_qnl_6')+'</p>\
            <form id="question'+currentQuestion+'_form" onsubmit="return false">\
            <p>'+form+'</p>\
            <p><button id="tf1_button_questionClose">'+LNG.K('aufgabe1_vanswer')+'</button></p>\
            <p id="tf1_questionSolution">\
            <button id="tf1_button_questionClose2">'+LNG.K('aufgabe1_next')+'</button>\
            </p>\
            </form>');

        MathJax.Hub.Queue(["Typeset", MathJax.Hub,"tf1_div_questionModal"]);

        $("#tf1_button_questionClose2").button({disabled: true}).on("click", function() { algo.closeQuestionModal(); });
        $("#tf1_button_questionClose").button({disabled: true}).on("click", function() { algo.saveAnswer(); });
        $("#question"+currentQuestion+"_form").find("input[type='text']").one("keyup", function() { algo.activateAnswerButton(); });

    };

    /**
     * Generiere Frage zur Bestimmung des Gleichheitsgraphs
     * @method
     */
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

        $("#tf1_div_questionModal").html('<div class="ui-helper-reset ui-helper-clearfix ui-widget-header ui-corner-all" style="padding: 7px;">'+LNG.K('aufgabe1_question')+' #'+(currentQuestion+1)+'</div>\
            <p>'+LNG.K('aufgabe1_qeg_1')+'</p>\
            <p><form id="question'+currentQuestion+'_form" onsubmit="return false">'+inputs+'</p>\
            <p><button id="tf1_button_questionClose">'+LNG.K('aufgabe1_vanswer')+'</button></p>\
            <p id="tf1_questionSolution">\
            <button id="tf1_button_questionClose2">'+LNG.K('aufgabe1_next')+'</button>\
            </p>\
            </form>');

        MathJax.Hub.Queue(["Typeset", MathJax.Hub,"tf1_div_questionModal"]);

        $("#tf1_button_questionClose2").button({disabled: true}).on("click", function() { algo.closeQuestionModal(); });
        $("#tf1_button_questionClose").button({disabled: false}).on("click", function() { algo.saveAnswer(); });

    };

    /**
     * Generiere Frage zur Bestimmung der initialen Markierungen
     * @method
     */
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
        randomNode.setLayout("fillStyle", const_Colors.NodeFillingHighlight);
        this.needRedraw = true;

        questions[currentQuestion] = {type: currentQuestionType, rightAnswer: answer};

        var form = '<label for="tf1_input_question'+currentQuestion+'" class="question_label_node">'+randomNode.getOuterLabel()+'</label>\
            <input type="text" id="tf1_input_question'+currentQuestion+'" name="question'+currentQuestion+'" value="" class="question_input_node" /><br style="clear: both;" />';

        $("#tf1_div_questionModal").html('<div class="ui-helper-reset ui-helper-clearfix ui-widget-header ui-corner-all" style="padding: 7px;">'+LNG.K('aufgabe1_question')+' #'+(currentQuestion+1)+'</div>\
            <p>'+LNG.K('aufgabe1_qsl_1')+'</p>\
            <p>'+LNG.K('aufgabe1_qsl_2')+'<strong>'+randomNode.getOuterLabel()+'</strong>.</p>\
            <form id="question'+currentQuestion+'_form" onsubmit="return false">\
            <p>'+form+'</p>\
            <p><button id="tf1_button_questionClose">'+LNG.K('aufgabe1_vanswer')+'</button></p>\
            <p id="tf1_questionSolution">\
            <button id="tf1_button_questionClose2">'+LNG.K('aufgabe1_next')+'</button>\
            </p>\
            </form>');

        MathJax.Hub.Queue(["Typeset", MathJax.Hub,"tf1_div_questionModal"]);

        $("#tf1_button_questionClose2").button({disabled: true}).on("click", function() { algo.closeQuestionModal(); algo.setNodeColorToNormal(algo, randomNode); });
        $("#tf1_button_questionClose").button({disabled: true}).on("click", function() { algo.saveAnswer(); });
        $("#question"+currentQuestion+"_form").find("input[type='text']").one("keyup", function() { algo.activateAnswerButton(); });

    };

    /**
     * Setze Formatierung der Knotens zurück
     * @param {Forschungsaufgabe1} algo FA2 Klasse
     * @param {Graph.GraphNode} node Knoten
     */
    this.setNodeColorToNormal = function(algo, node) {
        node.setLayout("fillStyle", const_Colors.NodeFilling);
        algo.needRedraw = true;
    };

    /**
     * Speichere Antwort und zeige Lösung an
     * @method
     */
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
        $("#tf1_button_questionClose2").focus();

    };

    /**
     * Aktiviere Antworten Button
     * @method
     */
    this.activateAnswerButton = function() {
        $("#tf1_button_questionClose").button("option", "disabled", false);
    };

    /**
     * Zeige Ergebnistabelle
     * @method
     */
    this.showQuestionResults = function() {

        var correctAnswers = 0;
        var totalQuestions = questions.length;
        var table = "";

        for(var i = 0; i < questions.length; i++) {
            table = table + '<td style="text-align: center;">#'+(i+1)+'</td>';
            if(questions[i].rightAnswer == questions[i].givenAnswer) {
                table = table + '<td><span class="ui-icon ui-icon-plusthick"></span> '+LNG.K('aufgabe1_results_correct')+'</td>';
                correctAnswers++;
            }else{
                table = table + '<td><span class="ui-icon ui-icon-minusthick"></span> '+LNG.K('aufgabe1_results_wrong')+'</td>';
            }
            table = "<tr>"+table+"</tr>";
        }
        table = '<table class="quizTable"><thead><tr><th>'+LNG.K('aufgabe1_question')+'</th><th>'+LNG.K('aufgabe1_answer')+'</th></tr></thead><tbody>'+table+'</tbody></table>';

        $("#tf1_div_questionModal").html('<div class="ui-helper-reset ui-helper-clearfix ui-widget-header ui-corner-all" style="padding: 7px;">'+LNG.K('aufgabe1_results')+'</div>\
            <p>'+LNG.K('aufgabe1_qresult_1')+totalQuestions+LNG.K('aufgabe1_qresult_2')+correctAnswers+LNG.K('aufgabe1_qresult_3')+'</p>\
            <p>'+table+'</p>\
            <p></p>\
            <p><button id="tf1_button_questionClose">'+LNG.K('aufgabe1_close')+'</button></p>');

        $("#tf1_button_questionClose").button().one("click", function() { algo.closeQuestionModal(); });

        this.showQuestionModal();

    };

    /**
     * Bestimme ob eine Frage gestellt wird
     * @return {Number} Index des Fragetyps oder false
     */
    this.askQuestion = function() {

        var randomVariable = function(min, max) {
            return Math.random() * (max - min) + min;
        };

        if(statusID === INITIAL_LABELS) {
            return START_LABEL_QUESTION;
        }

        /* if(statusID === NEW_EQUALITY_GRAPH) {
            if(randomVariable(0, 1) > 0.5) {
                return EQUALITY_GRAPH_QUESTION;
            }
        } */
    
        if(statusID === IMPROVE_LABELS) {
            if(randomVariable(0, 1) > 0.5) {
                return DELTA_QUESTION;
            }else{
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