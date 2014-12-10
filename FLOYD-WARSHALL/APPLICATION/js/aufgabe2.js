/**
 * @author Lisa Velden
 * Forschungsaufgabe 2
 */"use strict";

/**
 * Diese Klasse kapselt alle Informationen zu Forschungsaufgabe 2.<br>
 * In Forschungsaufgabe 2 muss der Nutzer eine mögliche Abarbeitungsreihenfolge der Knoten finden.<br>
 * Da auch diese Aufgabe wieder Dinge auf das Canvas zeichnet, erweitert diese Klasse
 * die Klasse CanvasDrawer.
 * @constructor
 * @augments CanvasDrawer
 * @param {Graph} p_graph Graph, auf dem der Algorithmus ausgeführt wird
 * @param {Object} p_canvas jQuery Objekt des Canvas, in dem gezeichnet wird.
 * @param {Object} p_tab jQuery Objekt des aktuellen Tabs.
 */
function Forschungsaufgabe2(p_graph, p_canvas, p_tab) {
    CanvasDrawer.call(this, p_graph, p_canvas, p_tab);
    /**
     * Closure Variable für dieses Objekt
     * @type Forschungsaufgabe2
     */
    var algo = this;

    /**
     * Zeigt an, ob vor dem Verlassen des Tabs gewarnt werden soll.
     * @type Boolean
     */
    var warnBeforeLeave = false;

    /**
     * Startet die Ausführung des Algorithmus.
     * @method
     */
    this.run = function() {
        this.graph = new Graph(1);
        this.initCanvasDrawer();
        this.registerEventHandlers();
        $("#tf2_tr_LegendeClickable").removeClass("greyedOutBackground");
        this.needRedraw = true;
    };

    /**
     * Beendet die Ausführung des Algorithmus.
     * @method
     */
    this.destroy = function() {
        this.destroyCanvasDrawer();
        this.deregisterEventHandlers();
    };

    /**
     * Beendet den Tab und startet ihn neu
     * @method
     */
    this.refresh = function() {
        this.destroy();
        var algo = new Forschungsaufgabe2($("body").data("graph"), $("#tf2_canvas_graph"), $("#tab_tf2"));
        $("#tab_tf2").data("algo", algo);
        algo.run();
    };

    /**
     * Zeigt and, ob vor dem Verlassen des Tabs gewarnt werden soll.
     * @returns {Boolean}
     */
    this.getWarnBeforeLeave = function() {
        return warnBeforeLeave;
    };

    /**
     * Registriere die Eventhandler an Buttons und canvas<br>
     * Nutzt den Event Namespace ".Forschungsaufgabe2SN"
     * @method
     */
    this.registerEventHandlers = function() {
        $("#tf2_select_aufgabeGraph").on("change", function() {
            algo.setGraphHandler();
        });
        this.canvas.on("dblclick.GraphDrawer", function(e) {
            algo.dblClickHandler(e);
        });
    };

    /**
     * Entferne die Eventhandler von Buttons und canvas im Namespace ".Forschungsaufgabe2"
     * und ".Forschungsaufgabe2SN"
     * @method
     */
    this.deregisterEventHandlers = function() {
        $("#tf2_select_aufgabeGraph").off("change");
        this.canvas.off(".Forschungsaufgabe2SN");
        this.canvas.off(".Forschungsaufgabe2");
    };

    /**
     * Behandelt Doppelklicks im Canvas<br>
     * Bei einem Doppelklick auf eine Kante kann deren Gewicht verändert werden,
     * bei einem Doppelklick in die freie Landschaft wird ein neuer Knoten erstellt.
     * @param {jQuery.Event} e jQuery Event Objekt, enthält insbes. die Koordinaten des Mauszeigers.
     * @method
     */
    this.dblClickHandler = function(e) {
        for (var edgeID in this.graph.edges) {
            // Kante c -> d hat fix den Wert 3 und soll nicht geändert werden können, ebenso f -> g mit Wert 1
            if (this.graph.edges[edgeID].contains(e.pageX - this.canvas.offset().left, e.pageY - this.canvas.offset().top, this.canvas[0].getContext("2d"))) {
                this.showWeightChangeField(e, edgeID);
                this.needRedraw = true;
                break;
            };
        };
    };

    /**
     * Gibt die korrekten Kosten einer einzelnen Kante zurück.
     * @method
     * @param {Number} edgeID
     * @returns {Number}
     */
    this.getWeight = function(edgeID) {
        switch (edgeID) {
            case "0":
                return 13;
            case "1":
                return 3;
            case "2":
                return 4;
            case "3":
                return 9;
            case "4":
                return 9;
            case "5":
                return 5;
            case "6":
                return 4;
            case "7":
                return 10;
            case "8":
                return 8;
            case "9":
                return 2;
            case "10":
                return 4;
            case "11":
                return 3;
            case "12":
                return 6;
            case "13":
                return 8;
            case "14":
                return 5;
            case "15":
                return 1;
            case "16":
                return 11;
            case "17":      
                return 2;
        };
    };

    /**
     * Prüft, ob die angegebenen Kantenkosten eine Lösung sind
     * @method
     * @returns {Boolean}
     */
    this.checkSolution = function() {
        warnBeforeLeave = true;
        var finished = true;
        var correct = true;
        for (var edgeID in this.graph.edges) {
            if (this.graph.edges[edgeID].weight == "?") {
                finished = false;
            } else if (algo.graph.edges[edgeID].weight != this.getWeight(edgeID)) {
                correct = false;
                finished = false;
                break;
            }
            ;
        };
        if (finished) {
            this.end();
        };
        if (correct) {
            return true;
        };
        return false;
    };

    /**
     * Zeigt Buttons am Ende des Algorithmus an
     * @method
     */
    this.end = function() {
        $("#tf2_div_statusErklaerung").html("<h3><font color=green>Herzlichen Glückwunsch! </font> Du hast alle Kantenkosten richtig bestimmt.</h3><p>Was m&ouml;chtest du nun tun?</p>");
        $("#tf2_div_statusErklaerung").append('<button id="tf2_button_gotoWeiteres">Weitere Informationen über den Algorithmus</button>');
        $("#tf2_div_statusErklaerung").append('<button id="tf2_button_gotoFA3">Forschungsaufgabe: Negative Kantenkosten</button>');
        $("#tf2_button_gotoWeiteres").button().click(function() {
            $("#tabs").tabs("option", "active", 7);
        });
        $("#tf2_button_gotoFA3").button().click(function() {
            $("#tabs").tabs("option", "active", 6);
        });
        warnBeforeLeave = false;
    };

    /**
     * Zeigt ein Fenster zum Verändern des Gewichts der ausgewählten Kante
     * @param {Object} event Event, von dem die Änderung ausging
     * @param {Number} edgeID ID der Kante, deren Gewicht geändert wird.
     * @method
     */

    this.showWeightChangeField = function(event, edgeID) {

        var addRightFalse = function() {
            var newWeightString = $("#WeightInput_" +edgeID.toString())[0].value.replace(",", ".");
            // Deutsches Eingabeformat
            var newWeight = parseFloat(newWeightString);
            if (!isNaN(newWeight) && (newWeight > 0)) {
                algo.graph.edges[edgeID].weight = newWeight;
                // Farben und zusätzliche Labels setzen
                if (algo.graph.edges[edgeID].weight == algo.getWeight(edgeID)) {
                    algo.graph.edges[edgeID].setLayout("labelColor", const_Colors.GreenText);
                    algo.graph.edges[edgeID].additionalLabel = String.fromCharCode(10004);
                    // Haken für richtig
                } else {
                    algo.graph.edges[edgeID].setLayout("labelColor", const_Colors.RedText);
                    algo.graph.edges[edgeID].additionalLabel = String.fromCharCode(10008);
                    // X für falsch
                };
                algo.checkSolution();
            };

            algo.needRedraw = true;

            $("#WeightChangePopup_" + edgeID.toString()).remove();
        };

        $("#WeightChangePopup_" + edgeID.toString()).remove();
        $("body").append("<div id=\"WeightChangePopup_" + edgeID.toString() + "\"></div>");
        $("#WeightChangePopup_" + edgeID.toString()).append("<input id=\"WeightInput_" + edgeID.toString() + "\" value=" + algo.graph.edges[edgeID].weight.toString() + "></input>");
        $("#WeightChangePopup_" + edgeID.toString()).append("<button id=\"WeightSave_" + edgeID.toString() + "\">speichern</button>");
        $("#WeightInput_" + edgeID.toString()).spinner({
            culture : "de",
            min : 1
        });
        $("#WeightInput_" + edgeID.toString()).keydown(function(event) {
            if (event.which == $.ui.keyCode.ENTER) {
                addRightFalse();
            }
        });
        $("#WeightSave_" + edgeID.toString()).button();
        $("#WeightSave_" + edgeID.toString()).click(addRightFalse);
        $("#WeightChangePopup_" + edgeID.toString()).position({
            my : "left bottom",
            of : event,
            collision : "none"
        });
        $("#WeightInput_" + edgeID.toString()).focus();
        $("#WeightInput_" + edgeID.toString()).on("focusout", function() {
            $("#WeightSave_" + edgeID.toString()).trigger('click');
        });
        $("#WeightInput_" + edgeID.toString()).select();
    };

};

// Vererbung realisieren
Forschungsaufgabe2.prototype = new CanvasDrawer;
Forschungsaufgabe2.prototype.constructor = Forschungsaufgabe2;
