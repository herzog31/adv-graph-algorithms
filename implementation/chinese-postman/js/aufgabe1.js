/**
 * @author Richard Stotz
 * Code für Forschungsaufgabe 1<br>
 * Basiert auf dem Code für den normalen Algorithmus
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
    var canvas = this.canvas;
    /**
     * ID des Intervals, der für das "Vorspulen" genutzt wurde.
     * @type Number
     */
    var fastForwardIntervalID = null;
    /*
     * Das Objekt, das den Hopcroft-Karp-Algorithmus ausfuehrt
     * */
    var cpAlgo;
    /**
     * Der Algorithmus kann in verschiedenen Zuständen sein, diese Variable 
     * speichert die ID des aktuellen Zustands.<br>
     * Siehe Dokumentation bei der Funktion nextStepChoice
     * @type Number
     */
    var statusID = null;
    /**
     * Closure Variable für dieses Objekt
     * @type Forschungsaufgabe1
     */
    var algo = this;
    /**
     * Status der Frage.<br>
     * Keys: aktiv, warAktiv
     * Values: Boolean
     * @type Object
     */
    var frageStatus = new Object();
    /**
     * Parameter der aktuellen Frage (wird dann für die Antwort verwendet)<br>
     * frageKnoten: Knoten, zu dem die Frage gestellt wurde<br>
     * Antwort : String der richtigen Antwort<br>
     * AntwortGrund: Begründung der richtigen Antwort<br>
     * newNodeLabel: Label den der Knoten nach der richtigen Beantwortung bekommt (neuer Abstandswert)<br>
     * gewusst: Ob die Antwort bereits beim ersten Versuch korrekt gegeben wurd<br>
     * @type Object
     */
    this.frageParam = new Object();
    /**
     * Welcher Tab (Erklärung oder Pseudocode) angezeigt wurde, bevor die Frage kam.
     * Dieser Tag wird nach der Frage wieder eingeblendet.
     * @type Boolean
     */
    var tabVorFrage = null;
    /**
     * Statistiken zu den Fragen
     * @type Object
     */
    var frageStats = {
        richtig: 0,
        falsch: 0,
        gestellt:0
    };
    /**
     * Gibt das Statusausgabefenster an.
     */
    var statusErklaerung = "#tf1_div_statusErklaerung";//statusErklaerung
    /*
     * Hier werden die Statuskonstanten definiert
     * */
    var FEASIBILITY = 0;
    var SHOW_UNBALANCED_NODES = 3;
    var SHORTEST_PATHS = 7;
    var ADD_PATHS = 11;
    var MATCHING = 4;
    var START_ADDING_PATHS = 6;
    var START_TOUR = 16;
    var SHOW_TOUR = 15;
    var END = 10;
    /**
     * Startet die Ausführung des Algorithmus.
     * @method
     */
    this.run = function () {
        this.initCanvasDrawer();
        cpAlgo = new algorithm(graph,canvas,p_tab);
        cpAlgo.deregisterEventHandlers();
        cpAlgo.setOutputFenster("#tf1_div_statusErklaerung");
        // Die Buttons werden erst im Javascript erstellt, um Problemen bei der mehrfachen Initialisierung vorzubeugen.
        $("#tf1_div_abspielbuttons").append("<button id=\"tf1_button_1Schritt\">"+LNG.K('algorithm_btn_next')+"</button><br>"
        +"<button id=\"tf1_button_vorspulen\">"+LNG.K('aufgabe1_btn_next_question')+"</button>"
        +"<button id=\"tf1_button_stoppVorspulen\">"+LNG.K('algorithm_btn_paus')+"</button>");
        $("#tf1_button_stoppVorspulen").hide();
        $("#tf1_button_1Schritt").button({icons:{primary: "ui-icon-seek-end"}, disabled: false});
        $("#tf1_button_vorspulen").button({icons:{primary: "ui-icon-seek-next"}, disabled: false});
        $("#tf1_button_stoppVorspulen").button({icons:{primary: "ui-icon-pause"}});
        this.registerEventHandlers();
        this.needRedraw = true;
        $("#tf1_button_1Schritt").show();
        $("#tf1_button_stoppVorspulen").hide();
        $("#tf1_button_vorspulen").show();
        $("#tf1_div_statusTabs").tabs();
        $(".marked").removeClass("marked");
        $("#tf1_tr_LegendeClickable").removeClass("greyedOutBackground");
    };
    /**
     * Beendet die Ausführung des Algorithmus.
     * @method
     */
    this.destroy = function () {
        //stop animations
        //clearInterval(animationId);
        //delete all inserted edges
/*        for (var e in graph.edges) {
            if (graph.edges[e].getLayout().dashed || !graph.edges[e].getDirected()) {
                graph.removeEdge(e);
            }
        }*/
        this.stopFastForward();
        this.destroyCanvasDrawer();
        this.deregisterEventHandlers();

    };

    /**
     * Beendet den Tab und startet ihn neu
     * @method
     */
    this.refresh = function () {
        this.destroy();
        var algo = new Forschungsaufgabe1($("body").data("graph"), $("#tf1_canvas_graph"), $("#tab_tf1"));
        $("#tab_tf1").data("algo", algo);
        algo.run();
    };

    /**
     * Zeigt and, in welchem Zustand sich der Algorithmus im Moment befindet.
     * @returns {Number} StatusID des Algorithmus
     */
    this.getStatusID = function () {
        return statusID;
    };

    /**
     * Registriere die Eventhandler an Buttons und canvas<br>
     * Nutzt den Event Namespace ".algorithm"
     * @method
     */
    this.registerEventHandlers = function () {
        $("#tf1_button_1Schritt").on("click.algorithm", function () {
            algo.singleStepHandler();
        });
        $("#tf1_button_vorspulen").on("click.algorithm", function () {
            algo.fastForwardAlgorithm();
        });
        $("#tf1_button_stoppVorspulen").on("click.algorithm", function () {
            algo.stopFastForward();
        });
    };

    /**
     * Entferne die Eventhandler von Buttons und canvas im Namespace ".algorithm"
     * @method
     */
    this.deregisterEventHandlers = function () {
        canvas.off(".Forschungsaufgabe1");
        $("#tf1_button_1Schritt").off(".Forschungsaufgabe1");
        $("#tf1_button_vorspulen").off(".Forschungsaufgabe1");
        $("#tf1_button_stoppVorspulen").off(".Forschungsaufgabe1");
        $("#tf1_tr_LegendeClickable").off(".Forschungsaufgabe1");
        $("#tf1_button_Zurueck").off(".Forschungsaufgabe1");
    };

    /**
     * Wird aufgerufen, wenn der "1 Schritt" Button gedrückt wird.
     * @method
     */
    this.singleStepHandler = function () {
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
        fastForwardIntervalID = window.setInterval(function(){algo.nextStepChoice();},geschwindigkeit);
    };

    /**
     * Stoppt das automatische Abspielen des Algorithmus
     * @method
     */
    this.stopFastForward = function() {
        $("#tf1_button_vorspulen").show();
        $("#tf1_button_stoppVorspulen").hide();
        if(!frageStatus || !frageStatus.aktiv) {
            $("#tf1_button_1Schritt").button("option", "disabled", false);
        }
        window.clearInterval(fastForwardIntervalID);
        fastForwardIntervalID = null;
    };

    /**
     * In dieser Funktion wird der nächste Schritt des Algorithmus ausgewählt.
     * Welcher das ist, wird über die Variable "statusID" bestimmt.<br>
     *  @method
     */
    this.nextStepChoice = function() {
        cpAlgo.nextStepChoice();
       /* if(frageStatus.aktiv) {
            this.stopFastForward();
        }
        if(!frageStatus.aktiv) {
            if(frageStatus.warAktiv) {
                this.removeFrageTab();
                frageStatus.warAktiv = false;
            }
            var algoStatus = cpAlgo.getStatusID();
            if(algoStatus == END){
                this.endAlgorithm();
            }
            else if(algoStatus == SHOW_UNBALANCED_NODES){
                //cpAlgo.nextStepChoice();
                this.askQuestion1();
            }
            else if(algoStatus == SHORTEST_PATHS){
                cpAlgo.nextStepChoice();
                this.askQuestion1();
            }
            else if(algoStatus == MATCHING){
                cpAlgo.nextStepChoice();
                this.askQuestion1();
            }
            else if(algoStatus == ADD_PATHS){
                this.askQuestion1();
            }
            else cpAlgo.nextStepChoice();
        }*/
        this.needRedraw = true;
    };

    /**
     * Zeigt Texte und Buttons zum Ende des Algorithmus
     * @method
     */
    this.endAlgorithm = function() {
        // Falls wir im "Vorspulen" Modus waren, daktiviere diesen
        if(fastForwardIntervalID != null) {
            this.stopFastForward();
        }
        $("#tf1_button_1Schritt").button("option", "disabled", true);
        $("#tf1_button_vorspulen").button("option", "disabled", true);
        this.showResults();
    };

    /**
     * Fügt einen Tab für die Frage hinzu.<br>
     * Deaktiviert außerdem die Buttons zum weitermachen
     * @method
     */
    this.addFrageTab = function() {
        var li = "<li id='tf1_li_FrageTab'><a href='#tf1_div_FrageTab'>"+LNG.K('aufgabe1_text_question')+"</a></li>", id= "tf1_div_FrageTab";
        $("#tf1_div_statusTabs").find(".ui-tabs-nav").append(li);
        $("#tf1_div_statusTabs").append("<div id='" + id + "'><div id='tf1_div_Frage'></div><div id='tf1_div_Antworten'></div></div>");
        $("#tf1_div_statusTabs").tabs("refresh");
        tabVorFrage = $("#tf1_div_statusTabs").tabs("option","active");
        $("#tf1_div_statusTabs").tabs("option","active",2);
        $("#tf1_button_1Schritt").button("option", "disabled", true);
        $("#tf1_button_vorspulen").button("option", "disabled", true);
    };

    /**
     * Entfernt den Tab für die Frage und aktiviert den vorherigen Tab.
     * @method
     */
    this.removeFrageTab = function() {
        if($("#tf1_div_statusTabs").tabs("option","active") == 2){
            $("#tf1_div_statusTabs").tabs("option","active",tabVorFrage);
        }
        $("#tf1_li_FrageTab").remove().attr("aria-controls");
        $("#tf1_div_FrageTab").remove();
        $("#tf1_div_statusTabs").tabs( "refresh" );
    };

    /**
     * Zeigt - in eigenem Tab - die Resultate der Aufgabe an.
     * @method
     */
    this.showResults = function() {
        var li = "<li id='tf1_li_ErgebnisseTab'><a href='#tf1_div_ErgebnisseTab'>"+LNG.K('aufgabe1_text_results')+"</a></li>", id= "tf1_div_ErgebnisseTab";
        $("#tf1_div_statusTabs").find(".ui-tabs-nav").append(li);
        $("#tf1_div_statusTabs").append("<div id='" + id + "'></div>");
        $("#tf1_div_statusTabs").tabs("refresh");
        $("#tf1_div_statusTabs").tabs("option","active",2);
        if(frageStats.gestellt == frageStats.richtig) {
            $("#tf1_div_ErgebnisseTab").append("<h2>"+LNG.K('aufgabe1_result1')+"</h2>");
            $("#tf1_div_ErgebnisseTab").append("<p>"+LNG.K('aufgabe1_result2')+"</p>");
        }
        else {
            $("#tf1_div_ErgebnisseTab").append("<h2>"+LNG.K('aufgabe1_result3')+"</h2>");
            $("#tf1_div_ErgebnisseTab").append("<p>"+LNG.K('aufgabe1_result4')+" " +frageStats.gestellt + "</p>");
            $("#tf1_div_ErgebnisseTab").append("<p>"+LNG.K('aufgabe1_result5')+" " +frageStats.richtig + "</p>");
            $("#tf1_div_ErgebnisseTab").append("<p>"+LNG.K('aufgabe1_result6')+" " +frageStats.falsch + "</p>");
            $("#tf1_div_ErgebnisseTab").append('<button id="tf1_button_Retry">'+LNG.K('aufgabe1_btn_retry')+'</button>');
            $("#tf1_button_Retry").button().click(function() {algo.refresh();});
        }
        $("#tf1_div_ErgebnisseTab").append("<h3>"+LNG.K('aufgabe1_btn_exe2')+"</h3>");
        $("#tf1_div_ErgebnisseTab").append('<button id="tf1_button_gotoFA2">'+LNG.K('algorithm_btn_exe2')+'</button>');
        $("#tf1_button_gotoFA2").button().click(function() {$("#tabs").tabs("option","active", 5);});
    };

    /**
     * Zeigt Texte und Buttons zum Ende des Algorithmus
     * @method
     */
    this.endAlgorithm = function() {
        //this.showVariableStatusField(null,null);
        // Falls wir im "Vorspulen" Modus waren, daktiviere diesen
        if(fastForwardIntervalID != null) {
            this.stopFastForward();
        }
        $("#tf1_button_1Schritt").button("option", "disabled", true);
        $("#tf1_button_vorspulen").button("option", "disabled", true);
        this.showResults();
    };

    /**
     * Wird aufgerufen, wenn die richtige Antwort auf eine Frage gegeben wurde.
     * Aktiviert die Buttons zum Weitermachen wieder und entfernt die Markierungen im Graph.
     * @method
     */
    this.handleCorrectAnswer = function() {
        $("#tf1_button_1Schritt").button("option", "disabled", false);
        $("#tf1_button_vorspulen").button("option", "disabled", false);
        $("p.frage").css("color",const_Colors.GreenText);
        $("#tf1_div_Antworten").html("<h2>"+LNG.K('aufgabe1_text_right_answer')+" " +this.frageParam.Antwort +"</h2>");
        $("#tf1_div_Antworten").append(this.frageParam.AntwortGrund);
        if(this.frageParam.gewusst) {
            frageStats.richtig++;
        }
        else {
            frageStats.falsch++;
        }
        if(this.frageParam.qid == 1) {
            this.frageParam.node.setLayoutObject(this.frageParam.layout);
        }
        frageStatus = {"aktiv" :false, "warAktiv": true};
        cpAlgo.nextStepChoice();// Hier wird der nächste Schritt des Algorithmus ausgefuehrt
        this.needRedraw = true;
    };

    this.askQuestion1 = function () {
        var node = chooseNode();
        var delta = Object.keys(node.getOutEdges()).length - Object.keys(node.getInEdges()).length;
        var correctAnswer;
        var AntwortGrund;
        if(delta == 0){
            correctAnswer = "ja";
            AntwortGrund = "<p>" + LNG.K('aufgabe1_answer1_reason1') + "</p>";
        }
        else {
            correctAnswer = "nein";
            AntwortGrund = "<p>" + LNG.K('aufgabe1_answer1_reason2') + "</p>";
        }
        this.addFrageTab();
        frageStatus = {"aktiv": true, "warAktiv": false};
        this.frageParam = {
            qid: 3,
            "Antwort": correctAnswer,
            "AntwortGrund": AntwortGrund,
            gewusst: true,
            "node": node,
            "layout": node.getLayout()
        };
        //Knoten hervorheben
        node.setLayout("borderColor", const_Colors.NodeBorderHighlight);
        //stelle die Frage
        $("#tf1_div_Frage").html(LNG.K('aufgabe1_text_question') + " " + (++frageStats.gestellt));
        $("#tf1_div_Frage").append("<p class=\"frage\">" + LNG.K('aufgabe1_question1') + "</p>");
        $("#tf1_div_Antworten").append("<input type=\"radio\" id=\"tf1_input_frage1_0\" name=\"frage1\"/><label id=\"tf1_label_frage1_0\" for=\"tf1_input_frage1_0\"> ja </label><br>");
        $("#tf1_div_Antworten").append("<input type=\"radio\" id=\"tf1_input_frage1_1\" name=\"frage1\"/><label id=\"tf1_label_frage1_1\" for=\"tf1_input_frage1_1\"> nein </label><br>");
        var pos = 0;
        if(correctAnswer == "nein") pos = 1;
        $("#tf1_input_frage1_" + pos).click(function () { algo.handleCorrectAnswer(); });
        $("#tf1_input_frage1_" + (1-pos)).click(function () {
            $("#tf1_label_frage1_" + (1-pos)).addClass("ui-state-error"); algo.frageParam.gewusst = false;
        });
    };
    var chooseNode = function(){
        var keys = Object.keys(graph.nodes);
        var rand = Math.floor(Math.random()*keys.length);
        return graph.nodes[keys[rand]];
    };

    /**
     * Generiert eine zufällige Permutation von [0,1,2]<br>
     * Könnte man mal allgemeiner mit Fisher-Yates machen.
     * @returns {Array} zufällige Permutation von [0,1,2]
     * @method
     */
    this.generateRandomOrder = function() {
        var randomParameter = Math.floor(Math.random()*6);
        switch(randomParameter) {
            case 0: return [0,1,2];
            case 1: return [0,2,1];
            case 2: return [1,0,2];
            case 3: return [1,2,0];
            case 4: return [2,0,1];
            case 5: return [2,1,0];
        }
        return [0,1,2];
    };
    
    /**
     * Fügt einen Tab für die Frage hinzu.<br>
     * Deaktiviert außerdem die Buttons zum weitermachen
     * @method
     */
    this.addFrageTab = function() {
        var li = "<li id='tf1_li_FrageTab'><a href='#tf1_div_FrageTab'>"+LNG.K('aufgabe1_text_question')+"</a></li>", id= "tf1_div_FrageTab";
        $("#tf1_div_statusTabs").find(".ui-tabs-nav").append(li);
        $("#tf1_div_statusTabs").append("<div id='" + id + "'><div id='tf1_div_Frage'></div><div id='tf1_div_Antworten'></div></div>");
        $("#tf1_div_statusTabs").tabs("refresh");
        tabVorFrage = $("#tf1_div_statusTabs").tabs("option","active");
        $("#tf1_div_statusTabs").tabs("option","active",2);
        $("#tf1_button_1Schritt").button("option", "disabled", true);
        $("#tf1_button_vorspulen").button("option", "disabled", true);
    };
    
    /**
     * Entfernt den Tab für die Frage und aktiviert den vorherigen Tab.
     * @method
     */
    this.removeFrageTab = function() {
        if($("#tf1_div_statusTabs").tabs("option","active") == 2){
            $("#tf1_div_statusTabs").tabs("option","active",tabVorFrage);
        }
        $("#tf1_li_FrageTab").remove().attr("aria-controls");
        $("#tf1_div_FrageTab").remove();
        $("#tf1_div_statusTabs").tabs( "refresh" );
    };
    
    /**
     * Zeigt - in eigenem Tab - die Resultate der Aufgabe an.
     * @method
     */
    this.showResults = function() {
        var li = "<li id='tf1_li_ErgebnisseTab'><a href='#tf1_div_ErgebnisseTab'>"+LNG.K('aufgabe1_text_results')+"</a></li>", id= "tf1_div_ErgebnisseTab";
        $("#tf1_div_statusTabs").find(".ui-tabs-nav").append(li);
        $("#tf1_div_statusTabs").append("<div id='" + id + "'></div>");
        $("#tf1_div_statusTabs").tabs("refresh");
        $("#tf1_div_statusTabs").tabs("option","active",2);
        if(frageStats.anzahlFragen == frageStats.richtig) {
            $("#tf1_div_ErgebnisseTab").append("<h2>"+LNG.K('aufgabe1_result1')+"</h2>");
            $("#tf1_div_ErgebnisseTab").append("<p>"+LNG.K('aufgabe1_result2')+"</p>");
        }
        else {
            $("#tf1_div_ErgebnisseTab").append("<h2>"+LNG.K('aufgabe1_result3')+"</h2>");
            $("#tf1_div_ErgebnisseTab").append("<p>"+LNG.K('aufgabe1_result4')+" " +frageStats.anzahlFragen + "</p>");
            $("#tf1_div_ErgebnisseTab").append("<p>"+LNG.K('aufgabe1_result5')+" " +frageStats.richtig + "</p>");
            $("#tf1_div_ErgebnisseTab").append("<p>"+LNG.K('aufgabe1_result6')+" " +frageStats.falsch + "</p>");
            $("#tf1_div_ErgebnisseTab").append('<button id="tf1_button_Retry">'+LNG.K('aufgabe1_btn_retry')+'</button>');
            $("#tf1_button_Retry").button().click(function() {algo.refresh();});
        }
        $("#tf1_div_ErgebnisseTab").append("<h3>"+LNG.K('aufgabe1_btn_exe2')+"</h3>");
        $("#tf1_div_ErgebnisseTab").append('<button id="tf1_button_gotoFA2">'+LNG.K('algorithm_btn_exe2')+'</button>');
        $("#tf1_button_gotoFA2").button().click(function() {$("#tabs").tabs("option","active", 5);});
    };
}

// Vererbung realisieren
Forschungsaufgabe1.prototype = new CanvasDrawer;
Forschungsaufgabe1.prototype.constructor = Forschungsaufgabe1;