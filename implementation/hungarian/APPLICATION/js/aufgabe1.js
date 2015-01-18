/**
 * Created by Ruslan on 15.11.2014.
 */
/**
 * @author Ruslan Zabrodin
 * Code fuer Forschungsaufgabe 1<br>
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
    var canvas = p_canvas;
    /**
     * ID des Intervals, der für das "Vorspulen" genutzt wurde.
     * @type Number
     */
    var fastForwardIntervalID = null;
    /*
    * Das Objekt, das den Hopcroft-Karp-Algorithmus ausfuehrt
    * */
    var hkAlgo;
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
    /*
     * Hier werden die Statuskonstanten definiert
     * */
    const ALGOINIT = 0;
    const BEGIN_ITERATION = 1;
    const END_ITERATION = 2;
    const NEXT_AUGMENTING_PATH = 3;
    const UPDATE_MATCHING = 4;
    const GRAY_PATH = 5;
    const END_ALGORITHM = 6;
    /**
     * Startet die Ausführung des Algorithmus.
     * @method
     */
    this.run = function() {
        this.initCanvasDrawer();
        hkAlgo = new HungarianMethod(graph,canvas,p_tab);
        hkAlgo.deregisterEventHandlers();
        hkAlgo.setOutputFenster("#tf1_div_statusErklaerung");
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
        var algo = new Forschungsaufgabe1($("body").data("graph"),$("#tf1_canvas_graph"),$("#tab_tf1"));
        $("#tab_tf1").data("algo",algo);
        algo.run();
    };

    /**
     * Zeigt and, in welchem Zustand sich der Algorithmus im Moment befindet.
     * @returns {Number} StatusID des Algorithmus
     */
    this.getStatusID = function() {
        return hkAlgo.getStatusID();
    };

    /**
     * Registriere die Eventhandler an Buttons und canvas<br>
     * Nutzt den Event Namespace ".Forschungsaufgabe1"
     * @method
     */
    this.registerEventHandlers = function() {
        $("#tf1_select_aufgabeGraph").on("change",function() {algo.setGraphHandler();});
        //canvas.on("click.Forschungsaufgabe1",function(e) {algo.canvasClickHandler(e);});
        $("#tf1_button_1Schritt").on("click.Forschungsaufgabe1",function() {algo.nextStepChoice();});
        //canvas.on("mousemove.Forschungsaufgabe1",function(e) {algo.canvasMouseMoveHandler(e);});
        $("#tf1_button_vorspulen").on("click.Forschungsaufgabe1",function() {algo.fastForwardAlgorithm();});
        $("#tf1_button_stoppVorspulen").on("click.Forschungsaufgabe1",function() {algo.stopFastForward();});
        //$("#tf1_tr_LegendeClickable").on("click.Forschungsaufgabe1",function() {algo.changeVorgaengerVisualization();});
    };

    /**
     * Entferne die Eventhandler von Buttons und canvas im Namespace ".Forschungsaufgabe1"
     * @method
     */
    this.deregisterEventHandlers = function() {
        canvas.off(".Forschungsaufgabe1");
        $("#tf1_select_aufgabeGraph").off("change");
        $("#tf1_button_1Schritt").off(".Forschungsaufgabe1");
        $("#tf1_button_vorspulen").off(".Forschungsaufgabe1");
        $("#tf1_button_stoppVorspulen").off(".Forschungsaufgabe1");
        $("#tf1_tr_LegendeClickable").off(".Forschungsaufgabe1");
    };

    /**
     * Wählt einen Graph um darauf die Forschungsaufgabe auszuführen
     * @method
     */
    this.setGraphHandler = function() {
        var selection = $("#tf1_select_aufgabeGraph>option:selected").val();
        switch(selection) {
            case "Selbsterstellter Graph":
                this.graph = $("body").data("graph");
                break;
            case "Standardbeispiel":
                this.graph = new Graph("graphs/graph1.txt");
                break;
            default:
            //console.log("Auswahl im Dropdown Menü unbekannt, tue nichts.");
        }
        // Ändere auch die lokalen Variablen
        graph = this.graph;
        canvas = this.canvas;
        this.needRedraw = true;
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
     * Mögliche Werte sind:<br>
     *  @method
     */
    this.nextStepChoice = function() {
        if(frageStatus.aktiv) {
            this.stopFastForward();
        }
        if(!frageStatus.aktiv) {
            if(frageStatus.warAktiv) {
                this.removeFrageTab();
                frageStatus.warAktiv = false;
            }
            var algoStatus = hkAlgo.getStatusID();
            if(algoStatus == END_ALGORITHM){
                this.endAlgorithm();
            }
            else if(algoStatus == BEGIN_ITERATION || algoStatus == ALGOINIT){
                hkAlgo.nextStepChoice();
                if(Math.random() < 0.6) this.askQuestion1();
            }
            else if(algoStatus == UPDATE_MATCHING){
                if(Math.random() < 1.4){ //standard 0.4
                    if(Math.random() < 0.0) this.askQuestion2();//standard 0.5
                    else this.askQuestion3();
                }
                else hkAlgo.nextStepChoice();
            }
            else hkAlgo.nextStepChoice();
        }
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
        if(frageStats.anzahlFragen == frageStats.richtig) {
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
        if(this.frageParam.qid == 3) this.frageParam.edge.setLayout("dashed",false);
        frageStatus = {"aktiv" :false, "warAktiv": true};
        hkAlgo.nextStepChoice();// Hier wird der nächste Schritt des Algorithmus ausgefuehrt
        this.needRedraw = true;
    };

    this.askQuestion1 = function () {
        var NUMBER_OF_ANSWERS = 5;
        var sp = hkAlgo.getShortestPathLength();
        var Antworten = this.generateAnswers1(NUMBER_OF_ANSWERS);
        var AntwortGrund = "";
        if (sp==0) {
            AntwortGrund = "<p>" + LNG.K('aufgabe1_answer1_reason0') + "</p>";
        }
        else if(sp==1){
            AntwortGrund = "<p>" + LNG.K('aufgabe1_answer1_reason1') + "</p>";
        }
        else {
            AntwortGrund = "<p>" + LNG.K('aufgabe1_answer1_reason2') + "</p>";
        }
        this.addFrageTab();
        frageStatus = {"aktiv": true, "warAktiv": false};
        this.frageParam = {
            qid: 1,
            "Antwort": sp,
            "AntwortGrund": AntwortGrund,
            gewusst: true
        };
        var antwortReihenfolge = this.generateRandomOrder(NUMBER_OF_ANSWERS);
        $("#tf1_div_Frage").html(LNG.K('aufgabe1_text_question') + " " + ++frageStats.gestellt);
        $("#tf1_div_Frage").append("<p class=\"frage\">" + LNG.K('aufgabe1_question1') + "</p>");
        for (var i = 0; i < antwortReihenfolge.length; i++) {
            $("#tf1_div_Antworten").append("<input type=\"radio\" id=\"tf1_input_frage1_" + antwortReihenfolge[i] + "\" name=\"frage1\"/>"
            + "<label id=\"tf1_label_frage1_" + antwortReihenfolge[i] + "\" for=\"tf1_input_frage1_" + antwortReihenfolge[i]
            + "\">" + Antworten[antwortReihenfolge[i]] + "</label><br>");
        }
        $("#tf1_input_frage1_1").click(function() {$("#tf1_label_frage1_1").addClass("ui-state-error");algo.frageParam.gewusst = false;});
        $("#tf1_input_frage1_2").click(function() {$("#tf1_label_frage1_2").addClass("ui-state-error");algo.frageParam.gewusst = false;});
        $("#tf1_input_frage1_3").click(function() {$("#tf1_label_frage1_3").addClass("ui-state-error");algo.frageParam.gewusst = false;});
        $("#tf1_input_frage1_4").click(function() {$("#tf1_label_frage1_4").addClass("ui-state-error");algo.frageParam.gewusst = false;});
        $("#tf1_input_frage1_0").click(function () {
            algo.handleCorrectAnswer();
        });
    };
    /**
     * Generiert Antwortmöglichkeiten fuer die erste Frage
     * Das erste Element des Rückgabewerts ist stets die richtige Antwort
     * @param {Number} Anzahl von Antwortmöglichkeiten.
     * @returns {Array} Antwortmöglichkeiten, wobei die erste korrekt ist.
     * @method
     */
    this.generateAnswers1 = function(number) {
        var answers = new Array();
        var sp = hkAlgo.getShortestPathLength();
        if(sp!=0) answers.push(sp);
        answers.push("Es gibt keinen Augmentationspfad");
        var values = [sp-8,sp-6,sp-4,sp-2,sp+2,sp+4,sp+6,sp+8,sp+10];
        var count = answers.length;
        while(count<5){
            var a = Math.floor((Math.random()*values.length));
            if(values[a]>0){
                answers.push((values[a]));
                count++;
            }
            values.splice(a,1);
        }
        return answers;
    };

    this.askQuestion2 = function () {
        var NUMBER_OF_ANSWERS = 5;
        var mc = Object.keys(hkAlgo.getMatching()).length +1;
        var Antworten = this.generateAnswers2(NUMBER_OF_ANSWERS, mc);
        var AntwortGrund = "<p>" + LNG.K('aufgabe1_answer2_reason0') + "</p>";
        this.addFrageTab();
        frageStatus = {"aktiv": true, "warAktiv": false};
        this.frageParam = {
            qid: 2,
            "Antwort": mc,
            "AntwortGrund": AntwortGrund,
            gewusst: true
        };
        var antwortReihenfolge = this.generateRandomOrder(NUMBER_OF_ANSWERS);
        $("#tf1_div_Frage").html(LNG.K('aufgabe1_text_question') + " " + (++frageStats.gestellt));
        $("#tf1_div_Frage").append("<p class=\"frage\">" + LNG.K('aufgabe1_question2') + "</p>");
        for (var i = 0; i < antwortReihenfolge.length; i++) {
            $("#tf1_div_Antworten").append("<input type=\"radio\" id=\"tf1_input_frage2_" + antwortReihenfolge[i] + "\" name=\"frage2\"/>"
                                         + "<label id=\"tf1_label_frage2_" + antwortReihenfolge[i] + "\" for=\"tf1_input_frage2_" + antwortReihenfolge[i] + "\">" + Antworten[antwortReihenfolge[i]] + "</label><br>");
        }
        $("#tf1_input_frage2_1").click(function() {$("#tf1_label_frage2_1").addClass("ui-state-error");algo.frageParam.gewusst = false;});
        $("#tf1_input_frage2_2").click(function() {$("#tf1_label_frage2_2").addClass("ui-state-error");algo.frageParam.gewusst = false;});
        $("#tf1_input_frage2_3").click(function() {$("#tf1_label_frage2_3").addClass("ui-state-error");algo.frageParam.gewusst = false;});
        $("#tf1_input_frage2_4").click(function() {$("#tf1_label_frage2_4").addClass("ui-state-error");algo.frageParam.gewusst = false;});
/*        for(var i = 1;i<NUMBER_OF_ANSWERS;i++){
            $("#tf1_input_frage2_"+i).click(function (e) {
                $(e.target).addClass("ui-state-error"); algo.frageParam.gewusst = false;
            });
        }*/
        $("#tf1_input_frage2_0").click(function () {
            algo.handleCorrectAnswer();
        });
    };
    /**
     * Generiert Antwortmöglichkeiten fuer die zweite Frage
     * Das erste Element des Rückgabewerts ist stets die richtige Antwort
     * @param {Number} Anzahl von Antwortmöglichkeiten.
     * @param {Number} Richtige Antwort.
     * @returns {Array} Antwortmöglichkeiten, wobei die erste korrekt ist.
     * @method
     */
    this.generateAnswers2 = function(number,correctAnswer) {
        var answers = new Array();
        answers.push(correctAnswer);
        var values = [correctAnswer-1,correctAnswer+1,correctAnswer-2,correctAnswer+2,correctAnswer-3,correctAnswer+3,correctAnswer-4,correctAnswer+4,correctAnswer-5,correctAnswer+5];
        var count = answers.length;
        while(count<5){
            var a = Math.floor((Math.random()*values.length));
            if(values[a]>=0){
                answers.push((values[a]));
                count++;
            }
            values.splice(a,1);
        }
        return answers;
    };

    this.askQuestion3 = function () {
        var answer = chooseEdge();
        var onPath = answer[0];
        var inMatching = answer[1];
        var correctAnswer;
        var AntwortGrund;
        if(onPath == true){
            if(inMatching == true){
                correctAnswer = "nein";
                AntwortGrund = "<p>" + LNG.K('aufgabe1_answer3_reason0') + "</p>";
            }
            else{
                correctAnswer = "ja";
                AntwortGrund = "<p>" + LNG.K('aufgabe1_answer3_reason1') + "</p>";
            }
        }
        else {
            if(inMatching == true){
                correctAnswer = "ja";
                AntwortGrund = "<p>" + LNG.K('aufgabe1_answer3_reason2') + "</p>";
            }
            else{
                correctAnswer = "nein";
                AntwortGrund = "<p>" + LNG.K('aufgabe1_answer3_reason2') + "</p>";
            }
        }
        this.addFrageTab();
        frageStatus = {"aktiv": true, "warAktiv": false};
        this.frageParam = {
            qid: 3,
            "Antwort": correctAnswer,
            "AntwortGrund": AntwortGrund,
            gewusst: true,
            edge: answer[2]
        };
        $("#tf1_div_Frage").html(LNG.K('aufgabe1_text_question') + " " + (++frageStats.gestellt));
        $("#tf1_div_Frage").append("<p class=\"frage\">" + LNG.K('aufgabe1_question3') + "</p>");
        $("#tf1_div_Antworten").append("<input type=\"radio\" id=\"tf1_input_frage3_0\" name=\"frage1\"/><label id=\"tf1_label_frage3_0\" for=\"tf1_input_frage3_0\"> ja </label><br>");
        $("#tf1_div_Antworten").append("<input type=\"radio\" id=\"tf1_input_frage3_1\" name=\"frage1\"/><label id=\"tf1_label_frage3_1\" for=\"tf1_input_frage3_1\"> nein </label><br>");
        var pos = 0;
        if(correctAnswer == "nein") pos = 1;
        $("#tf1_input_frage3_" + pos).click(function () { algo.handleCorrectAnswer(); });
        $("#tf1_input_frage3_" + (1-pos)).click(function () {
            $("#tf1_label_frage3_" + (1-pos)).addClass("ui-state-error"); algo.frageParam.gewusst = false;
        });
    };

    var chooseEdge = function(){
        var matching = hkAlgo.getMatching();
        var path = hkAlgo.getPath();
        var tradeoff = 0.5;
        var edge;
        if(Math.random()<tradeoff){
            var rand = Math.floor(Math.random()*path.length);
            rand = Math.max(1,rand - (rand+1)%2);
            edge = path[rand];
        }
        else{
            var keys = Object.keys(hkAlgo.getGraph().edges);
            var rand = Math.floor(Math.random()*keys.length);
            edge = hkAlgo.getGraph().edges[keys[rand]];
        }
        var onPath = false;
        for (var i = 1; i < path.length-1; i = i + 2) {
            if (edge === path[i]){
                onPath = true;
                break;
            }
        }
        var inMatching = matching.hasOwnProperty(edge.getEdgeID());
        //edge.setLayout("lineWidth", global_Edgelayout.lineWidth*2);
        edge.setLayout("dashed", true);
        return [onPath,inMatching,edge];
    };

    var drawDasheLine = function(ctx,edge){
        CanvasDrawMethods.drawLine(ctx,edge.getLayout(),edge.getSourceCoordinates(),edge.getTargetCoordinates());
    };
    /**
     * Generiert eine zufällige Permutation von einem Array<br>
     * @param {Number} Anzahl von Elementen der Permutation
     * @returns {Array} zufällige Permutation
     * @method
     */
    this.generateRandomOrder = function(l) {
        var array = new Array();
        for(var i = 0;i<l;i++) array.push(i);
        for(var i = l-1;i>=0;i--){
            var random = Math.floor(Math.random()*(i+1));
            var tmp = array[i];
            array[i] = array[random];
            array[random] = tmp;
        }
        return array;
    };

}
// Vererbung realisieren
Forschungsaufgabe1.prototype = Object.create(CanvasDrawer.prototype);
Forschungsaufgabe1.prototype.constructor = Forschungsaufgabe1;