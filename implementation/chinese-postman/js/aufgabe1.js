/**
 * @author Ruslan Zabrodin
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
    algorithm.call(this,p_graph,p_canvas,p_tab);
    /**
     * Convenience Objekt, damit man den Graph ohne this ansprechen kann.
     * @type Graph
     */
    var graph = this.graph;

    /**
     * Closure Variable für dieses Objekt
     * @type Forschungsaufgabe1
     */
    var algo = this;

    this.algoNext = this.nextStepChoice;

    //this.base_destroy = this.destroy;

    //this.base_stopFastForward = this.stopFastForward;

    this.base_run = this.run;
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
     * Statistiken zu den Fragen
     * @type Object
     */
    var frageStats = {
        richtig: 0,
        falsch: 0,
        gestellt: 0
    };
    /**
     * Gibt das Statusausgabefenster an.
     */
    var statusErklaerung = "#tf1_div_statusErklaerung";//statusErklaerung
    /*
     * Statuskonstanten
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
        this.setStatusWindow("tf1");
        this.base_run();
        $("#tf1_button_Zurueck").hide();
        $("#tf1_button_vorspulen").button( "option", "label", LNG.K('aufgabe1_btn_next_question'));
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
     * Wird aufgerufen, wenn der "1 Schritt" Button gedrückt wird.
     * @method
     */
    this.singleStepHandler = function () {
        this.nextStepChoice();
    };
    /**
     * In dieser Funktion wird der nächste Schritt des Algorithmus ausgewählt.
     * Welcher das ist, wird über die Variable "statusID" bestimmt.<br>
     *  @method
     */
    this.nextStepChoice = function() {
        var algoStatus = this.getStatusID();
        switch (algoStatus) {
            case SHOW_UNBALANCED_NODES:
                this.askQuestion1();
                break;
            case MATCHING:
                this.askQuestion2();
                break;
            case START_ADDING_PATHS:
                this.algoNext();
                this.askQuestion3();
                break;
            case END:
                this.endAlgorithm();
                break;
            default:
                this.algoNext();
                break;
        }
        this.needRedraw = true;
    };
    /**
     * Entfernt den Tab für die Frage und aktiviert den vorherigen Tab.
     * @method
     */
    this.removeFrageTab = function() {
        $("#tf1_div_statusTabs").show();
        $("#tf1_div_questionModal").hide();
        $("#tf1_button_questionClose").off();
        $("#tf1_div_questionModal").off();
        $("#tf1_button_1Schritt").button("option", "disabled", false);
        $("#tf1_button_vorspulen").button("option", "disabled", false);
    };
    /**
     * Fügt einen Tab für die Frage hinzu.<br>
     * Deaktiviert außerdem die Buttons zum weitermachen
     * @method
     */
    this.addFrageTab = function() {
        this.stopFastForward();
        $("#tf1_button_1Schritt").button("option", "disabled", true);
        $("#tf1_button_vorspulen").button("option", "disabled", true);
        ++frageStats.gestellt;
        //erstelle das Grundgeruest
        $("#tf1_div_questionModal").html("<div class='ui-helper-reset ui-helper-clearfix ui-widget-header ui-corner-all' style='padding: 7px;'>" +
            LNG.K('aufgabe1_text_question') + ' #'+(frageStats.gestellt) + '</div>' +
            '<p id="tf1_question" class="frage"></p>' +
            '<form id="tf1_question_form" onsubmit="return false"></form>' +
            '<p><button id="tf1_button_questionClose">'+LNG.K('aufgabe1_qst_answer')+'</button></p>' +
            '<p id="tf1_questionSolution">'+LNG.K('aufgabe1_qst_correctanswer')+
            '<span id="tf1_question_answer" class="answer"></span><br /><br />' + '<span id="tf1_question_explanation" class="answer"></span><br /><br />' +
            '<button id="tf1_button_modalClose">'+LNG.K('aufgabe1_qst_continue')+'</button></p>');
        //erstelle die buttons und handlers
        $("#tf1_button_modalClose").button({disabled: true}).on("click", function() { algo.removeFrageTab(); });
        $("#tf1_button_questionClose").button({disabled: true}).on("click", function() {algo.handleAnswer(); });
        $("#tf1_div_questionModal").find("form").on("keyup", function (event) { //enter-button handler
            if (event.which == 13) {
                $("#tf1_button_questionClose").click();
            }
        });
        //verstecke AlgoStatusTab und zeige das Frage-Fenster
        $("#tf1_div_statusTabs").hide();
        $("#tf1_div_questionModal").show();
        $("#tf1_questionSolution").hide();
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
        // Falls wir im "Vorspulen" Modus waren, deaktiviere diesen
        this.stopFastForward();
        $("#tf1_button_1Schritt").button("option", "disabled", true);
        $("#tf1_button_vorspulen").button("option", "disabled", true);
        this.showResults();
    };
    /**
     * Wird aufgerufen, wenn eine Antwort auf eine Frage gegeben wurde.
     * Aktiviert die Buttons zum Weitermachen wieder und entfernt die Markierungen im Graph.
     * @method
     */
    this.handleAnswer = function() {
        //gebe richtige Antwort und Erklaerung aus
        $("#tf1_questionSolution").find("#tf1_question_answer").html(this.frageParam.Antwort);
        $("#tf1_questionSolution").find("#tf1_question_explanation").html(this.frageParam.AntwortGrund);
        //finde die gegebene Antwort
        var answer;
        if(this.frageParam.qid == 1){
            answer = $("#tf1_question_form").find("input[type='radio']:checked").val();
        }
        else if (this.frageParam.qid == 2 || this.frageParam.qid == 3){
            answer = $("#tf1_question_form").find("input[type='text']").val();
        }
        //pruefe ob die gegebene Antwort korrekt war
        if(answer == this.frageParam.Antwort) {
            frageStats.richtig++;
            $("#tf1_questionSolution").css("color", "green");
        }
        else {
            frageStats.falsch++;
            $("#tf1_questionSolution").css("color", "red");
        }
        //falls notwendig stelle das Layout wieder her
        if(this.frageParam.qid == 1 || this.frageParam.qid == 2) {
            this.frageParam.node.setLayoutObject(this.frageParam.layout);
        }
        else if(this.frageParam.qid == 3){
            this.frageParam.node1.setLayoutObject(this.frageParam.layout1);
            this.frageParam.node2.setLayoutObject(this.frageParam.layout2);
        }
        this.algoNext();// Hier wird der nächste Schritt des Algorithmus ausgefuehrt
        this.needRedraw = true;
        $("#tf1_questionSolution").show();
        $("#tf1_button_questionClose").hide();
        $("#tf1_button_modalClose").button("option", "disabled", false);
        $("#tf1_button_modalClose").focus();
        $("#tf1_div_questionModal").find("form").one("keyup", function(event) {//enter button handler
            if (event.which == 13) {
                $("#tf1_button_modalClose").click();
            }
        });
    };

    this.askQuestion1 = function () {
        //waehle den Knoten aus
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
        this.frageParam = {
            qid: 1,
            Antwort: correctAnswer,
            AntwortGrund: AntwortGrund,
            gewusst: true,
            "node": node,
            "layout": node.getLayout()
        };
        //Knoten hervorheben
        node.setLayout("borderColor", const_Colors.NodeBorderHighlight);
        node.setLayout("fillStyle", const_Colors.NodeFillingHighlight);
        //stelle die Frage
        $("#tf1_question").html(LNG.K('aufgabe1_question1'));
        $("#tf1_question_form").html('<input type="radio" id="tf1_input_frage1_0" name="frage1" value="ja"/><label id="tf1_label_frage1_0" for="tf1_input_frage1_0"> ja </label><br>' +
            '<input type="radio" id="tf1_input_frage1_1" name="frage1" value="nein"/><label id="tf1_label_frage1_1" for="tf1_input_frage1_1"> nein </label><br>');
        $("#tf1_question_form").find("input[type='radio']").one("change", function() { $("#tf1_button_questionClose").button("option", "disabled", false); });
    };

    var chooseNode = function(){
        var keys = Object.keys(algo.graph.nodes);
        var rand = Math.floor(Math.random()*keys.length);
        return algo.graph.nodes[keys[rand]];
    };

    this.askQuestion2 = function () {
        var node = chooseNode();
        var delta = node.getLabel();
        var correctAnswer  = Math.abs(delta);
        var AntwortGrund = "<p>" + LNG.K('aufgabe1_answer2_reason1') + "</p>";
        this.addFrageTab();
        this.frageParam = {
            qid: 2,
            "Antwort": correctAnswer,
            "AntwortGrund": AntwortGrund,
            gewusst: true,
            "node": node,
            "layout": node.getLayout()
        };
        //Knoten hervorheben
        node.setLayout("borderColor", const_Colors.NodeBorderHighlight);
        //stelle die Frage
        $("#tf1_question").html(LNG.K('aufgabe1_question2'));
        $("#tf1_question_form").html('<input type="text" id="tf1_input_frage2" name="frage2" value="" /><br>');
        $("#tf1_input_frage2").one("keyup", function() { $("#tf1_button_questionClose").button("option", "disabled", false); });
    };

    this.askQuestion3 = function () {
        //waehle die Matchingkante
        var match = this.getMatching();
        var dist = this.getDistance();
        var rand = Math.floor(Math.random()*match.length);
        var m = match[rand];
        for(var i = 0; i <=rand; i++){
            this.algoNext();
        }
        this.previousStepChoice();
        var correctAnswer  = dist[m.s][m.d];
        var AntwortGrund = "<p>" + LNG.K('aufgabe1_answer3_reason1') + "</p>";
        this.addFrageTab();
        this.frageParam = {
            qid: 3,
            "Antwort": correctAnswer,
            "AntwortGrund": AntwortGrund,
            gewusst: true,
            "node1": graph.nodes[m.s],
            "layout1": graph.nodes[m.s].getLayout(),
            "node2": graph.nodes[m.d],
            "layout2": graph.nodes[m.d].getLayout()
        };
        //Knoten und Kante hervorheben
        graph.nodes[m.s].setLayout("borderColor", const_Colors.NodeBorderHighlight);
        graph.nodes[m.d].setLayout("borderColor", const_Colors.NodeBorderHighlight);
        m.edge.setLayout("lineColor", const_Colors.EdgeHighlight1);
        //stelle die Frage
        $("#tf1_question").html(LNG.K('aufgabe1_question3'));
        $("#tf1_question_form").html('<input type="text" id="tf1_input_frage3" name="frage3" value="" /><br>');
        $("#tf1_input_frage3").one("keyup", function() { $("#tf1_button_questionClose").button("option", "disabled", false); });
    };
}
// Vererbung realisieren
Forschungsaufgabe1.prototype = new CanvasDrawer;
Forschungsaufgabe1.prototype.constructor = Forschungsaufgabe1;