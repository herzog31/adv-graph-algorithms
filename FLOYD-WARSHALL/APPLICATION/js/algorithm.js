/**
 * @author Lisa Velden
 * Animation des Dijkstra-Algorithmus
 */"use strict";

/**
 * Instanz des Dijkstra-Algorithmus, erweitert die Klasse CanvasDrawer
 * @constructor
 * @extends CanvasDrawer
 * @param {Graph} p_graph Graph, auf dem der Algorithmus ausgeführt wird
 * @param {Object} p_canvas jQuery Objekt des Canvas, in dem gezeichnet wird.
 * @param {Object} p_tab jQuery Objekt des aktuellen Tabs.
 */
function FloydWarshallAlgorithm(p_graph, p_canvas, p_tab){
	CanvasDrawer.call(this, p_graph, p_canvas, p_tab);

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
     * Der Zustand des Algorithmus wird nach und nach auf Stack gepusht.<br>
     * Wird für den "Zurück" Button benötigt.
     * @type Object
     */
	var contextStack = new Array();
	/**
     * Closure Variable für dieses Objekt
     * @type DijkstraAlgorithm
     */
    var algo = this;
    /**
     * ID des Intervalls, der für das "Vorspulen" genutzt wurde.
     * @type Number
     */
    var fastForwardIntervalID = null;

    var keyToIndex = new Array();

	var distance = new Array();

	this.distance = distance;

	this.isFinished = false;

	/**
     * Startet die Ausführung des Algorithmus.
     * @method
     */
    this.run = function() {
        algo.initCanvasDrawer();
        // Die Buttons werden erst im Javascript erstellt, um Problemen bei der mehrfachen Initialisierung vorzubeugen.
        $("#ta_div_abspielbuttons").append("<button id=\"ta_button_Zurueck\">Zur&uumlck</button>" + "<button id=\"ta_button_1Schritt\">N&aumlchster Schritt</button>" + "<button id=\"ta_button_vorspulen\">Vorspulen</button>" + "<button id=\"ta_button_stoppVorspulen\">Pause</button>");
        $("#ta_button_stoppVorspulen").hide();
        $("#ta_button_Zurueck").button({
            icons : {
                primary : "ui-icon-seek-start"
            },
            disabled : true
        });
        $("#ta_button_1Schritt").button({
            icons : {
                primary : "ui-icon-seek-end"
            },
            disabled : true
        });
        $("#ta_button_vorspulen").button({
            icons : {
                primary : "ui-icon-seek-next"
            },
            disabled : true
        });
        $("#ta_button_stoppVorspulen").button({
            icons : {
                primary : "ui-icon-pause"
            }
        });
        $("#ta_div_statusTabs").tabs();
        $(".marked").removeClass("marked");
        $("#ta_p_l1").addClass("marked");
        $("#ta_tr_LegendeClickable").removeClass("greyedOutBackground");

        $("#ta_button_vorspulen").button("option", "disabled", false);
        $("#ta_button_1Schritt").button("option", "disabled", false);

        // Stellt sicher, dass alle Namen der Knoten zu Beginn zum Zeichnen gesetzt sind
        for (var nID in graph.nodes) {
            graph.nodes[nID].setLabel(graph.nodes[nID].getName());
        }

        algo.registerEventHandlers();
        algo.needRedraw = true;
    };

    /**
     * Registriere die Eventhandler an Buttons und canvas<br>
     * Nutzt den Event Namespace ".Dijkstra"
     * @method
     */
    this.registerEventHandlers = function() {
        $("#ta_button_1Schritt").on("click.FloydWarshall", function() {
            algo.nextStepChoice();
        });
        $("#ta_button_vorspulen").on("click.FloydWarshall", function() {
            algo.fastForwardAlgorithm();
        });
        $("#ta_button_stoppVorspulen").on("click.FloydWarshall", function() {
            algo.stopFastForward();
        });
        $("#ta_button_Zurueck").on("click.FloydWarshall", function() {
            algo.backStep();
        });
    };

    /**
     * "Spult vor", führt den Algorithmus mit hoher Geschwindigkeit aus.
     * @method
     */
    this.fastForwardAlgorithm = function() {
        $("#ta_button_vorspulen").hide();
        $("#ta_button_stoppVorspulen").show();
        $("#ta_button_1Schritt").button("option", "disabled", true);
        $("#ta_button_Zurueck").button("option", "disabled", true);
        var geschwindigkeit = 200;
        // Geschwindigkeit, mit der der Algorithmus ausgeführt wird in Millisekunden

        fastForwardIntervalID = window.setInterval(function() {
            algo.nextStepChoice();
        }, geschwindigkeit);
    };

    /**
     * Entferne die Eventhandler von Buttons und canvas im Namespace ".Dijkstra"
     * @method
     */
    this.deregisterEventHandlers = function() {
        canvas.off(".Dijkstra");
        $("#ta_button_1Schritt").off(".Dijkstra");
        $("#ta_button_vorspulen").off(".Dijkstra");
        $("#ta_button_stoppVorspulen").off(".Dijkstra");
        $("#ta_tr_LegendeClickable").off(".Dijkstra");
        $("#ta_button_Zurueck").off(".Dijkstra");
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

	this.isFinished = function() {
        if (contextStack.length === 0) {
            return false;
        };
        if (!algo.isFinished) {
            return false;
        }
        return true;
    };

	this.findShortestPaths = function(context){
		var isStepMade = false;
		while(!isStepMade && (context.i < distance.length - 1 || context.j < distance.length - 1 
			|| context.k < distance.length - 1)){
			
			if(distance[context.i][context.k] != "inf" && distance[context.k][context.j] != "inf" 
					&& (distance[context.i][context.j] == "inf" 
					|| distance[context.i][context.j] > distance[context.i][context.k] + distance[context.k][context.j])){
				context.changedFrom = distance[context.i][context.j];
				context.changedTo = distance[context.i][context.k] + distance[context.k][context.j];
				context.changedRow = context.i;
				context.changedColumn = context.j;
				distance[context.i][context.j] = distance[context.i][context.k] + distance[context.k][context.j];
				isStepMade = true;
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
		/*for(context.k = 0; k < distance.length; k++){
			for(context.i = 0; i < distance.length; i++){
				for(context.j = 0; j < distance.length; j++){
					if(distance[i][k] != "inf" && distance[k][j] != "inf" 
							&& (distance[i][j] == "inf" || distance[i][j] > distance[i][k] + distance[k][j])){
						distance[i][j] = distance[i][k] + distance[k][j];
					}
				}
			}
		}*/
	};

	this.nextStepChoice = function(){
		var contextOld = contextStack.pop();
		var c;
		var contextNew;
		if(contextOld){
	        c = jQuery.extend(true, {}, contextOld);
	        contextStack.push(contextOld);
    	}else{
    		c = new Object();
			c.k = 0;
			c.i = 0;
			c.j = 0;
    	}

        var isStepMade = algo.findShortestPaths(c);
        if(isStepMade){
	        contextNew = jQuery.extend(true, {}, c);
	        contextStack.push(contextNew);
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
    	}

		changeText(distance, "ta", contextNew, status);
		console.log("now context is ");
		console.log(contextStack);
        return algo.isFinished;
	};

	this.backStep = function(){
		var status;
		console.log("before backStep: ");
		console.log(contextStack);
		var lastStep = contextStack.pop();
		if(lastStep){
			console.log("lastStep:");
			console.log(lastStep);
			distance[lastStep.changedRow][lastStep.changedColumn] = lastStep.changedFrom;
			$("#ta_button_Zurueck").button("option", "disabled", false);
			$("#ta_button_1Schritt").button("option", "disabled", false);
			$("#ta_button_vorspulen").button("option", "disabled", false);
			status = 2;
		}else{
			$("#ta_button_Zurueck").button("option", "disabled", true);
			$("#ta_button_1Schritt").button("option", "disabled", false);
			$("#ta_button_vorspulen").button("option", "disabled", false);
			status = 1;
		}
		changeText(distance, "ta", lastStep, status);
		return;
	};

	this.initializeAlgorithm = function(){
		var i = 0;
		var keyDictionary = new Object();
		for(var key in graph.nodes){
			keyDictionary[key] = i;
			// console.log("key = " + key + " i = " + i);
			// console.log(graph.nodes);
			graph.nodes[i] = graph.nodes[key];
			graph.nodes[i].setNodeID(i);
			if(i != key){
				delete graph.nodes[key];
			}
			// console.log(graph.nodes);
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
			for(var j = 0; j < Object.keys(graph.nodes).length; j++){
				distance[i][j] = "inf";
			}
			keyToIndex[Object.keys(graph.nodes)[i]] = i;
		}

		for(var key in graph.edges){
			distance[keyToIndex[graph.edges[key].getSourceID()]][keyToIndex[graph.edges[key].getTargetID()]] = graph.edges[key].weight;
		}

		changeText(distance, "ta", null, 1);
	};

	this.visualize = function(){
		for(var i = 0; i < distance.length; i++){
			var str = "";
			for(var j = 0; j < distance.length; j++){
				str += " " + distance[i][j];
			}
			console.log(str);
		}
		console.log("");
	};

	this.end = function(context) {
        algo.isFinished = true;

        // Falls wir im "Vorspulen" Modus waren, daktiviere diesen
        if (fastForwardIntervalID != null) {
            this.stopFastForward();
        }
        
        // Ausführung nicht mehr erlauben
		$("#ta_button_Zurueck").button("option", "disabled", false);
        $("#ta_button_1Schritt").button("option", "disabled", true);
        $("#ta_button_vorspulen").button("option", "disabled", true);

        return;
    };

};

// var matrix = [[0, "inf", -2, "inf"], [4, 0, 3, "inf"], ["inf", "inf", 0, 2], ["inf", -1, "inf", 0]];
// var algo = new FloydWarshallAlgorithm(matrix);
// algo.initializeAlgorithm();
// while(!algo.nextStepChoice()){
// 	algo.visualize();
// }