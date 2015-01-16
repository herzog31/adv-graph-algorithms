/**
 * @author Aleksejs Voroncovs
 * Forschungsaufgabe 1
 */

/**
 * Instanz der Forschungsaufgabe 3
 * @constructor
 * @param {Graph} p_graph Graph, auf dem der Algorithmus ausgeführt wird
 * @param {Object} p_canvas jQuery Objekt des Canvas, in dem gezeichnet wird.
 * @param {Object} p_tab jQuery Objekt des aktuellen Tabs.
 * @augments CanvasDrawer
 */
function Forschungsaufgabe1(p_graph, p_canvas, p_tab) {

    CanvasDrawer.call(this, p_graph, p_canvas, p_tab);

    /******************************************************************************************************************************************/
    /******************************************************* Globale Variablen ****************************************************************/
    /******************************************************************************************************************************************/

    /**
     * Convenience Objekt, damit man den Graph ohne this ansprechen kann.
     * @type Graph
     */
    var graph = new Graph(7);
    /**
     * Convenience Objekt, damit man das Canvas ohne this. ansprechen kann.
     * @type Object
     */
    var canvas = this.canvas;
    /**
     * ID des Intervals, der für das "Vorspulen" genutzt wurde.
     * @type Number
     */
    var fastForwardIntervalID = null;
    /**
     * Anfangsknoten, von dem aus die Entfernungen berechnet werden.
     * @type GraphNode
     */
    var startNode = null;

    /**
     * Closure Variable für dieses Objekt
     * @type Forschungsaufgabe1
     */
    var algo = this;

    /**
     * Der Zustand des Algorithmus wird nach und nach auf Stack gepusht.<br>
     * Wird für den "Zurück" Button benötigt.
     * @type Object
     */
    var contextStack = new Array();

    /**
     * Status der Frage.<br>
     * Keys: aktiv, warAktiv
     * Values: Boolean
     * @type Object
     */
    var questionStatus = new Object();

    /**
     * Assoziatives Array mit den Vorgängerkanten aller Knoten<br>
     * Keys: KnotenIDs Value: KantenID
     * @type Object
     */
    var parent = new Object();

    /**
     * Sammelt Information über den aktuellen Weg zum Startknoten, der angezeigt wird<br>
     * Felder: modifiedEdges: Information über die Kanten, deren Layout verändert wurde, altes Layout und ID<br>
     *         nodeID: Id des Knotens, der grade verändert wird.
     * @type Object
     */
    var showWayOfNode = null;

    /**
     * Zeigt an, ob vor dem Verlassen des Tabs gewarnt werden soll.
     * @type Boolean
     */
    var warnBeforeLeave = false;

    /**
     * Welcher Tab (Erklärung oder Pseudocode) angezeigt wurde, bevor die Frage kam.
     * Dieser Tag wird nach der Frage wieder eingeblendet.
     * @type Boolean
     */
    var tabBeforeQuestion = null;

    /**
     * Statistiken zu den Fragen
     * @type Object
     */
    var questionStats = {
        numQuestions : 6,
        correct : 0,
        wrong : 0,
        gestellt : 0
    };

    var actualContext;

    var distance = new Array();

    var paths = new Array();

    var keyToIndex = new Array();

    this.finished = false;

    this.paths = paths;

    /******************************************************************************************************************************************/
    /***************************************************** Funktionen aller Tabs **************************************************************/
    /******************************************************************************************************************************************/

    /**
     * Startet die Ausführung des Algorithmus.
     * @method
     */
    this.run = function() {
        this.initCanvasDrawer();
        // Die Buttons werden erst im Javascript erstellt, um Problemen bei der mehrfachen Initialisierung vorzubeugen.
        $("#tf1_div_abspielbuttons").append("<button id=\"tf1_button_1Schritt\">" + LNG.K('algorithm_btn_next') + "</button><br>" + "<button id=\"tf1_button_vorspulen\">" + LNG.K('aufgabe1_btn_next_question') + "</button>" + "<button id=\"tf1_button_stoppVorspulen\">" + LNG.K('algorithm_btn_paus') + "</button>");
        $("#tf1_button_stoppVorspulen").hide();
        $("#tf1_button_1Schritt").button({
            icons : {
                primary : "ui-icon-seek-end"
            },
            disabled : true
        });
        $("#tf1_button_vorspulen").button({
            icons : {
                primary : "ui-icon-seek-next"
            },
            disabled : true
        });
        $("#tf1_button_stoppVorspulen").button({
            icons : {
                primary : "ui-icon-pause"
            }
        });
        this.registerEventHandlers();
        // Graph für Forschungsaufgabe 3 ist fix
        this.graph = new Graph(7);
        // Ändere auch die lokalen Variablen
        graph = this.graph;
        canvas = this.canvas;
        startNode = this.graph.nodes[0];
        $("#tf1_button_1Schritt").hide();
        $("#tf1_button_stoppVorspulen").hide();
        $("#tf1_button_vorspulen").hide();
        $("#tf1_div_statusTabs").tabs();
        $(".marked").removeClass("marked");
        $(".marked").removeClass("marked");
        $("#tf1_p_l2").addClass("marked");
        $("#tf1_p_l3").addClass("marked");
        $("#tf1_p_l4").addClass("marked");
        $("#tf1_p_l5").addClass("marked");
        $("#tf1_tr_LegendeClickable").removeClass("greyedOutBackground");
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
        var algo = new Forschungsaufgabe1($("body").data("graph"), $("#tf1_canvas_graph"), $("#tab_tf1"));
        $("#tab_tf1").data("algo", algo);
        algo.initializeAlgorithm();
        algo.run();
    };

    /**
     * Registriere die Eventhandler an Buttons und canvas<br>
     * Nutzt den Event Namespace ".Forschungsaufgabe1"
     * @method
     */
    this.registerEventHandlers = function() {
        $("#tf1_button_start").on("click.Forschungsaufgabe1", function() {
            $("#tf1_div_statusErklaerung").removeClass("ui-state-error");
            $("#tf1_button_1Schritt").show();
            $("#tf1_button_vorspulen").show();
            $("#tf1_button_1Schritt").button("option", "disabled", false);
            $("#tf1_button_vorspulen").button("option", "disabled", false);
            algo.nextStepChoice();
        });
        $("#tf1_button_1Schritt").on("click.Forschungsaufgabe1", function() {
            algo.nextStepChoice();
        });
        canvas.on("mousemove.Forschungsaufgabe1", function(e) {
            algo.canvasMouseMoveHandler(e);
        });
        $("#tf1_button_vorspulen").on("click.Forschungsaufgabe1", function() {
            algo.fastForwardAlgorithm();
        });
        $("#tf1_button_stoppVorspulen").on("click.Forschungsaufgabe1", function() {
            algo.stopFastForward();
        });
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
     * "Spult vor", führt den Algorithmus mit hoher Geschwindigkeit aus.
     * @method
     */
    this.fastForwardAlgorithm = function() {
        $("#tf1_button_vorspulen").hide();
        $("#tf1_button_stoppVorspulen").show();
        $("#tf1_button_1Schritt").button("option", "disabled", true);
        var geschwindigkeit = 200;
        // Geschwindigkeit, mit der der Algorithmus ausgeführt wird in Millisekunden

        fastForwardIntervalID = window.setInterval(function() {
            algo.nextStepChoice();
        }, geschwindigkeit);
    };

    /**
     * Stoppt das automatische Abspielen des Algorithmus
     * @method
     */
    this.stopFastForward = function() {
        $("#tf1_button_vorspulen").show();
        $("#tf1_button_stoppVorspulen").hide();
        if (!questionStatus || !questionStatus.aktiv) {
            $("#tf1_button_1Schritt").button("option", "disabled", false);
        }
        window.clearInterval(fastForwardIntervalID);
        fastForwardIntervalID = null;
    };

    /******************************************************************************************************************************************/
    /************************************************* Floyd-Warshall spezifische Funktionen ***************************************************/
    /******************************************************************************************************************************************/

    /**
     * In dieser Funktion wird der nächste Schritt des Algorithmus ausgewählt.
     * Welcher das ist, wird über die Variable "context.statusID" bestimmt.<br>
     * Mögliche Werte sind:<br>
     *  0: Initialisierung<br>
     *  1: Minimales Element aus der Priority Queue herauslöschen<br>
     *  2: Über ausgehende Kanten/Nachbarknoten iterieren und prüfen, ob ein Update vorgenommen werden soll<br>
     *  3: Priortät bereits besuchter Knoten verringern<br>
     *  4: Neuen Knoten in die Priority Queue einfügen<br>
     *  5: Bereits abgearbeiten Knoten markieren<br>
     *  6: Algorithmus ist zu ende, da die Priority Queue nun leer ist
     *  @method
     */
    this.nextStepChoice = function(){
        $("#questionDiv").remove();
        var c;
        var contextNew;
        if(actualContext){
            c = jQuery.extend(true, {}, actualContext);
            contextStack.push(actualContext);
        }else{
            c = new Object();
            c.k = 0;
            c.i = 0;
            c.j = 0;
            c.preliminary = true;
        }

        var isStepMade = algo.findShortestPaths(c);
        if(isStepMade){
            contextNew = jQuery.extend(true, {}, c);
            contextNew.preliminary = !c.preliminary;
            actualContext = contextNew;
        }

        //TODO comment
        var status;
        if(isStepMade){
            $("#ta_button_Zurueck").button("option", "disabled", false);
            $("#ta_button_1Schritt").button("option", "disabled", false);
            $("#ta_button_vorspulen").button("option", "disabled", false);
            status = 2;
        }else{
            this.end();
            status = 3;
            this.showResults();
        }

        changeText(distance, "tf1", contextNew, graph.nodes, status);

        if(contextStack.length == 4){
            this.poseQuestion(0);
        }else if(contextStack.length == 10){
            this.poseQuestion(1);
        }else if(contextStack.length == 35){
            this.poseQuestion(2);
        }else if(contextStack.length == 20){
            this.poseQuestion(3);
        }else if(contextStack.length == 2){
            this.poseQuestion(4);
        }else if(contextStack.length == 28){
            this.poseQuestion(5);
        }

        if (questionStatus.aktiv) {
            this.stopFastForward();
        }else if (questionStatus.warAktiv) {
            if(!algo.finished) {
                this.removeQuestionTab();
            }
            questionStatus.warAktiv = false;
        }
        return algo.finished;
    };

    /**
     * Kopiert den Zustand des Algorithmus
     * @method
     * @param {Context} oldState
     * @returns {Context} newState
     */
    this.copyAlgorithmState = function(oldState) {
        var newState = jQuery.extend(true, {}, oldState);
        var newPQueue = oldState.pqueue.clone();
        newState.pqueue = newPQueue;
        return newState;
    };

    /**
     * Setzt Farben und Texte des Graphen für Visualisierung
     * @method
     * @param {Context} context
     */
    this.visualise = function(context) {
        // for (var nID in graph.nodes) {
        //     graph.nodes[nID].setLabel(context.nodeLabels[nID]);
        //     graph.nodes[nID].setLayout("fillStyle", context.nodeColors[nID]);
        // }

        for (var eID in graph.edges) {
            if (context.edgeColors[eID] == const_Colors.ShortestPathColor) {
                // use small arrows for shortest path
                graph.edges[eID].setLayout("lineColor", const_Colors.NormalEdgeColor);
                graph.edges[eID].setHighlighted(true);
            } else {
                graph.edges[eID].setLayout("lineColor", context.edgeColors[eID]);
                graph.edges[eID].setHighlighted(false);
            }
        }

        this.needRedraw = true;
    };

    /******************************************************** Ausführung des Algorithmus ********************************************************/

    /**
     * Initialisiere den Algorithmus, stelle die Felder auf ihre Startwerte.
     * @method
     * @param {Context} context
     * @returns {Context} context
     */
    this.initializeAlgorithm = function(){
        var i = 0;
        var keyDictionary = new Object();
        for(var key in graph.nodes){
            keyDictionary[key] = i;
            graph.nodes[i] = graph.nodes[key];
            graph.nodes[i].setNodeID(i);
            if(i != key){
                delete graph.nodes[key];
            }
            i++;
        }
        for(var key in graph.edges){
            var sourceID = keyDictionary[graph.edges[key].getSourceID()];
            var targetID = keyDictionary[graph.edges[key].getTargetID()];
            graph.edges[key].setSourceID(sourceID);
            graph.edges[key].setTargetID(targetID);
        }

        for(var i = 0; i < Object.keys(graph.nodes).length; i++){
            distance[i] = new Array();
            paths[i] = new Array();
            for(var j = 0; j < Object.keys(graph.nodes).length; j++){
                if(i != j){
                    distance[i][j] = "∞";
                }else{
                    distance[i][j] = 0;
                }
            }
            keyToIndex[Object.keys(graph.nodes)[i]] = i;
        }

        for(var key in graph.edges){
            distance[keyToIndex[graph.edges[key].getSourceID()]][keyToIndex[graph.edges[key].getTargetID()]] = graph.edges[key].weight;
            paths[keyToIndex[graph.edges[key].getSourceID()]][keyToIndex[graph.edges[key].getTargetID()]] = "" + key;
        }

    };

    /******************************************************** Ende des Algorithmus ********************************************************/
    
    /**
     * Behandelt das Ende des Algorithmus.
     * @method
     * @param {Context} context
     * @returns {Context} context
     */
    this.end = function() {
        algo.finished = true;

        // Falls wir im "Vorspulen" Modus waren, daktiviere diesen
        if (fastForwardIntervalID != null) {
            this.stopFastForward();
        }
        
        // Ausführung nicht mehr erlauben
        $("#tf1_button_Zurueck").button("option", "disabled", false);
        $("#tf1_button_1Schritt").button("option", "disabled", true);
        $("#tf1_button_vorspulen").button("option", "disabled", true);
        return;
    };

    /******************************************************************************************************************************************************/
    /********************************************************************  Sonstiges  *********************************************************************/
    /******************************************************************************************************************************************************/

    /**
     * Handler für Mausbewegungen im Algorithmus Tab.<br>
     * Wenn mit der Maus über einen Knoten gefahren wird, wird der kürzeste Weg
     * vom Startknoten zu diesem Knoten grün markiert. <br>
     * Die Markierung wird wieder entfernt, sobald die Maus den Knoten wieder verlässt
     * @param {jQuery.Event} e
     * @method
     */
    this.canvasMouseMoveHandler = function(e) {
        if (contextStack.length === 0) {
            // Algorithmus noch nicht gestartet
            return;
        };
        if (contextStack[contextStack.length - 1].statusID != 7) {
            // Algorithmus noch nicht beendet
            return;
        };
        var mouseInNode = false;
        var mx = e.pageX - canvas.offset().left;
        var my = e.pageY - canvas.offset().top;
        for (var nodeID in graph.nodes) {
            if (graph.nodes[nodeID].contains(mx, my)) {
                if (showWayOfNode != null) {
                    if (showWayOfNode.nodeID == nodeID) {
                        return;
                    } else {
                        var showWayOfNodeOld = showWayOfNode;
                        showWayOfNode = null;
                        this.needRedraw = true;
                        // Layout zurücksetzen
                        for (var i = 0; i < showWayOfNodeOld.modifiedEdges.length; ++i) {
                            graph.edges[showWayOfNodeOld.modifiedEdges[i].id].setLayout("lineWidth", showWayOfNodeOld.modifiedEdges[i].lineWidth);
                            graph.edges[showWayOfNodeOld.modifiedEdges[i].id].setLayout("lineColor", showWayOfNodeOld.modifiedEdges[i].lineColor);
                        }
                    }
                }
                mouseInNode = true;
                showWayOfNode = new Object();
                showWayOfNode.nodeID = nodeID;
                var visitedNodes = new Object();
                var currentNode = nodeID;
                var currentEdge = null;
                var modifiedEdges = new Array();
                while (parent[currentNode] != null && visitedNodes[currentNode] == null) {
                    visitedNodes[currentNode] = true;
                    currentEdge = graph.edges[parent[currentNode]];
                    currentNode = currentEdge.getSourceID();
                    // Layout
                    modifiedEdges.push({
                        id : currentEdge.getEdgeID(),
                        lineWidth : currentEdge.getLayout().lineWidth,
                        lineColor : currentEdge.getLayout().lineColor
                    });
                    currentEdge.setLayout("lineWidth", 3);
                    currentEdge.setLayout("lineColor", const_Colors.EdgeHighlight4);
                }
                showWayOfNode.modifiedEdges = modifiedEdges;
                this.needRedraw = true;
            }
        }

        if (!mouseInNode && showWayOfNode != null) {
            this.needRedraw = true;
            // Layout zurücksetzen
            for (var i = 0; i < showWayOfNode.modifiedEdges.length; ++i) {
                if (graph.edges[showWayOfNode.modifiedEdges[i].id].getLayout().lineColor == const_Colors.EdgeHighlight4 && graph.edges[showWayOfNode.modifiedEdges[i].id].getLayout().lineWidth == 3) {
                    graph.edges[showWayOfNode.modifiedEdges[i].id].setLayout("lineWidth", showWayOfNode.modifiedEdges[i].lineWidth);
                    graph.edges[showWayOfNode.modifiedEdges[i].id].setLayout("lineColor", showWayOfNode.modifiedEdges[i].lineColor);
                }
            }
            showWayOfNode = null;
        }
    };
    
    /********************************************************************  Für die Fragen  *********************************************************************/

    /**
     * Läd die Frage aus dem entsprechenden JSON-File und zeigt sie an.
     * @method
     * @param {String} questionURL
     */
    this.poseQuestion = function(questionID) {

        this.addQuestionTab();

        var question = questions[questionID];

        questionStats.gestellt++;

        $("#tf1_div_Frage").html("Frage " + questionStats.gestellt + " von " + questionStats.numQuestions);
        $("#tf1_div_Frage").append("<p class=\"question\">" + question.question + "</p>");

        var firstTry = true;

        for (var i = 0; i < question.answers.length; i++) {
            var answer = question.answers[i];

            var idInput = 'answer_' + i;
            var idLabel = 'answer_' + i + '_label';

            var inputHTML = '<input type="radio" id="' + idInput + '" name="group1"/>';
            var labelHTML = '<label id="' + idLabel + '" for="' + idInput + '">' + answer.answer + '</label>';

            $("#tf1_div_Antworten").append(inputHTML + labelHTML + '<br>');

            if (i === question.correctAnswerIndex) {
                var ans = answer.answer;
                var exp = answer.explanation;

                $("#" + idInput).click(function() {
                    $("#tf1_button_1Schritt").button("option", "disabled", false);
                    $("#tf1_button_vorspulen").button("option", "disabled", false);

                    $("p.question").css("color", const_Colors.GreenText);

                    $("#tf1_div_Antworten").html("<h2>"+LNG.K('aufgabe1_text_right_answer')+" " + ans + "</h2>");
                    $("#tf1_div_Antworten").append(exp);

                    if (firstTry) {
                        questionStats.correct++;
                    } else {
                        questionStats.wrong++;
                    }

                    algo.needRedraw = true;
                    questionStatus = {
                        "aktiv" : false,
                        "warAktiv" : true
                    };

                });
            } else {
                // Closure durch Funktion, um lokale Variablen zu schützen
                var f = function(id, label) {
                    $("#" + id).click(function() {
                        $("#" + label).addClass("ui-state-error");
                        firstTry = false;
                    });
                };
                f(idInput, idLabel);
            };
        };

        questionStatus = {
            "aktiv" : true,
            "warAktiv" : false
        };
    };

    /**
     * Fügt einen Tab für die Frage hinzu.<br>
     * Deaktiviert außerdem die Buttons zum weitermachen
     * @method
     */
    this.addQuestionTab = function() {
        $("#tf1_div_statusErklaerung").append("<div id='questionDiv'></div>");
        $("#questionDiv").append("<div id='tf1_div_Frage'></div><div id='tf1_div_Antworten'></div>");
        $("#tf1_button_1Schritt").button("option", "disabled", true);
        $("#tf1_button_vorspulen").button("option", "disabled", true);
    };

    /**
     * Entfernt den Tab für die Frage und aktiviert den vorherigen Tab.
     * @method
     */
    this.removeQuestionTab = function() {
        if ($("#tf1_div_statusTabs").tabs("option", "active") == 2) {
            $("#tf1_div_statusTabs").tabs("option", "active", tabBeforeQuestion);
        }
        $("#tf1_li_FrageTab").remove().attr("aria-controls");
        $("#tf1_div_FrageTab").remove();
        $("#tf1_div_statusTabs").tabs("refresh");
    };

    /**
     * Zeigt - in eigenem Tab - die Resultate der Aufgabe an.
     * @method
     */
    this.showResults = function() {
        warnBeforeLeave = false;
        var li = "<li id='tf1_li_ErgebnisseTab'><a href='#tf1_div_ErgebnisseTab'>"+LNG.K('aufgabe1_text_results')+"</a></li>", id = "tf1_div_ErgebnisseTab";
        $("#tf1_div_statusTabs").find(".ui-tabs-nav").append(li);
        $("#tf1_div_statusTabs").append("<div id='" + id + "'></div>");
        $("#tf1_div_statusTabs").tabs("refresh");
        $("#tf1_div_statusTabs").tabs("option", "active", 2);
        if (questionStats.numQuestions == questionStats.correct) {
            $("#tf1_div_ErgebnisseTab").append("<h2>"+LNG.K('aufgabe1_result1')+"</h2>");
            $("#tf1_div_ErgebnisseTab").append("<p>"+LNG.K('aufgabe1_result2')+"</p>");
        } else {
            $("#tf1_div_ErgebnisseTab").append("<h2>"+LNG.K('aufgabe1_result3')+"</h2>");
            $("#tf1_div_ErgebnisseTab").append("<p>"+LNG.K('aufgabe1_result4')+" " + questionStats.numQuestions + "</p>");
            $("#tf1_div_ErgebnisseTab").append("<p>"+LNG.K('aufgabe1_result5')+" " + questionStats.correct + "</p>");
            $("#tf1_div_ErgebnisseTab").append("<p>"+LNG.K('aufgabe1_result6')+" " + questionStats.wrong + "</p>");
            $("#tf1_div_ErgebnisseTab").append("<button id='tf1_button_Retry'>"+LNG.K('aufgabe1_btn_retry')+"</button>");
            $("#tf1_button_Retry").button().click(function() {
                algo.refresh();
            });
        }
        $("#tf1_div_ErgebnisseTab").append("<h3>"+LNG.K('aufgabe1_btn_exe2')+"</h3>");
        $("#tf1_div_ErgebnisseTab").append('<button id="tf1_button_gotoFA2">'+LNG.K('algorithm_btn_exe2')+'</button>');
        $("#tf1_button_gotoFA2").button().click(function() {
            $("#tabs").tabs("option", "active", 5);
            $("#tw_Accordion").accordion("option", "active", 3);
        });
    };

    /**
     * Zeigt and, ob vor dem Verlassen des Tabs gewarnt werden soll.
     * @returns {Boolean}
     */
    this.getWarnBeforeLeave = function() {
        return warnBeforeLeave;
    };

    this.findShortestPaths = function(context){
        var isStepMade = false;
        while(!isStepMade && (context.i < distance.length - 1 || context.j < distance.length - 1 
            || context.k < distance.length - 1)){
            
            if(distance[context.i][context.k] != "∞" && distance[context.k][context.j] != "∞" 
                    && (distance[context.i][context.j] == "∞" 
                    || distance[context.i][context.j] > distance[context.i][context.k] + distance[context.k][context.j])){
                context.changedFrom = distance[context.i][context.j];
                if(!context.preliminary){
                    context.changedTo = distance[context.i][context.k] + distance[context.k][context.j];
                }else{
                    context.changedTo = distance[context.i][context.j];
                }
                context.changedRow = context.i;
                context.changedColumn = context.j;
                if(!context.preliminary){
                    distance[context.i][context.j] = distance[context.i][context.k] + distance[context.k][context.j];
                    paths[context.i][context.j] = paths[context.i][context.k] + "," + paths[context.k][context.j];
                }
                if(context.preliminary) {
                    context.formula = "d(" + graph.nodes[context.i].getLabel() + ", " + graph.nodes[context.j].getLabel() + ") = "
                        + "min{d(" + graph.nodes[context.i].getLabel() + ", " + graph.nodes[context.j].getLabel() + "), "
                        + "d(" + graph.nodes[context.i].getLabel() + ", " + graph.nodes[context.k].getLabel() + ") + "
                        + "d(" + graph.nodes[context.k].getLabel() + ", " + graph.nodes[context.j].getLabel() + ")}";
                }else{
                    context.formula = "d(" + graph.nodes[context.i].getLabel() + ", " + graph.nodes[context.j].getLabel() + ") = "
                        + "min{<span style='background-color:#0072bd'>d(" + graph.nodes[context.i].getLabel() + ", " + graph.nodes[context.j].getLabel() + ")</span>, "
                        + "<span style='background-color:#98C6EA'>d(" + graph.nodes[context.i].getLabel() + ", " + graph.nodes[context.k].getLabel() + ")</span> + "
                        + "<span style='background-color:#98C6EA'>d(" + graph.nodes[context.k].getLabel() + ", " + graph.nodes[context.j].getLabel() + ")</span>}";
                }
                isStepMade = true;
                break;
            }

            if(context.j < distance.length - 1){
                context.j++;
            }else if(context.i < distance.length - 1){
                context.i++;
                context.j = 0;
            }else if(context.k < distance.length - 1){
                context.k++;
                context.i = 0;
                context.j = 0;
            }
        }
        return isStepMade;
    };
}

// Vererbung realisieren
Forschungsaufgabe1.prototype = new CanvasDrawer;
Forschungsaufgabe1.prototype.constructor = Forschungsaufgabe1;
