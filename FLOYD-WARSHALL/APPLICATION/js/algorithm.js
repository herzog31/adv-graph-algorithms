/**
 * @author Aleksejs Voroncovs
 * Animation des Floyd-Warshall-Algorithmus
 */"use strict";

/**
 * Instanz des Floyd-Warshall-Algorithmus, erweitert die Klasse CanvasDrawer
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
     * @type FloydWarshallAlgorithm
     */
    var algo = this;
    /**
     * ID des Intervalls, der für das "Vorspulen" genutzt wurde.
     * @type Number
     */
    var fastForwardIntervalID = null;

    var keyToIndex = new Array();

	var distance = new Array();

	var paths = new Array();

	this.distance = distance;
	this.paths = paths;

	this.finished = false;

    var actualContext;

    /**
     * Zeigt an, ob der Algorithmus beendet hat.
     * @returns {Boolean}
     */
    this.isFinished = function() {
        if (contextStack.length === 0) {
            return false;
        };
        return this.finished;
    };

	/**
     * Startet die Ausführung des Algorithmus.
     * @method
     */
    this.run = function() {
        this.initCanvasDrawer();
        // Die Buttons werden erst im Javascript erstellt, um Problemen bei der mehrfachen Initialisierung vorzubeugen.
        $("#ta_div_abspielbuttons").append("<button id=\"ta_button_Zurueck\">" + LNG.K('algorithm_btn_prev') + "</button>" + "<button id=\"ta_button_1Schritt\">" + LNG.K('algorithm_btn_next') + "</button>" + "<button id=\"ta_button_vorspulen\">" + LNG.K('algorithm_btn_frwd') + "</button>" + "<button id=\"ta_button_stoppVorspulen\">" + LNG.K('algorithm_btn_paus') + "</button>");
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
        $("#ta_p_l2").addClass("marked");
        $("#ta_p_l3").addClass("marked");
        $("#ta_p_l4").addClass("marked");
        $("#ta_p_l5").addClass("marked");
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
     * Beendet den Tab und startet ihn neu
     * @method
     */
    this.refresh = function() {
        this.destroy();
        var algo = new FloydWarshallAlgorithm($("body").data("graph"), $("#ta_canvas_graph"), $("#tab_ta"));
        $("#tab_ta").data("algo", algo);
        algo.initializeAlgorithm();
        algo.run();
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

	this.nextStepChoice = function(){
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
    	}

		changeText(distance, "ta", contextNew, graph.nodes, status);
        return algo.finished;
	};

	this.backStep = function(){
		var status;
		var lastStep = contextStack.pop();
		if(lastStep){
			distance[lastStep.changedRow][lastStep.changedColumn] = lastStep.changedTo;
			$("#ta_button_Zurueck").button("option", "disabled", false);
			$("#ta_button_1Schritt").button("option", "disabled", false);
			$("#ta_button_vorspulen").button("option", "disabled", false);
            actualContext = lastStep;
			status = 2;
		}else{
			$("#ta_button_Zurueck").button("option", "disabled", true);
			$("#ta_button_1Schritt").button("option", "disabled", false);
			$("#ta_button_vorspulen").button("option", "disabled", false);
            actualContext = null;
			status = 1;
		}
		changeText(distance, "ta", lastStep, graph.nodes, status);
		return;
	};

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

		changeText(distance, "ta", null, graph.nodes, 1);
	};

	this.end = function(context) {
        algo.finished = true;

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

/***************************************************************************************************************************/

// Vererbung realisieren
FloydWarshallAlgorithm.prototype = new CanvasDrawer;
FloydWarshallAlgorithm.prototype.constructor = FloydWarshallAlgorithm;