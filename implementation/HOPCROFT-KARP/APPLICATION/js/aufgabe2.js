/**
 * @author Richard Stotz
 * Code für Forschungsaufgabe 2<br>
 * Basiert auf dem Code für den normalen Algorithmus
 */

/**
 * Diese Klasse kapselt alle Informationen zu Forschungsaufgabe 2.<br>
 * In Forschungsaufgabe 2 muss der Nutzer die optimale Reihenfolge der Kanten 
 * finden.<br>
 * Da auch diese Aufgabe wieder Dinge auf das Canvas zeichnet, erweitert diese Klasse
 * die Klasse CanvasDrawer. 
 * @constructor
 * @augments CanvasDrawer
 * @param {Graph} p_graph Graph, auf dem der Algorithmus ausgeführt wird
 * @param {Object} p_canvas jQuery Objekt des Canvas, in dem gezeichnet wird.
 * @param {Object} p_tab jQuery Objekt des aktuellen Tabs.
 */
function Forschungsaufgabe2(p_graph,p_canvas,p_tab) {
    CanvasDrawer.call(this,p_graph,p_canvas,p_tab);
    /**
     * Convenience Objekt, damit man den Graph ohne this ansprechen kann.
     * @type Graph
     */
    var graph = p_graph;
    /**
     * Convenience Objekt, damit man das Canvas ohne this. ansprechen kann.
     * @type Object
     */
    var canvas = p_canvas;
    /**
     * Closure Variable für dieses Objekt
     * @type Forschungsaufgabe2
     */
    var algo = this;

    var stack = new Array();

    var matching = new Object();

    var matched = new Object();

    /**
     * Zeigt an, ob vor dem Verlassen des Tabs gewarnt werden soll.
     * @type Boolean
     */
    var warnBeforeLeave = false;
    var update = false;
    /*
     * Hier wird das Aussehen der Kanten und Knoten bestimmt
     * */
    const MATCHED_EDGE_COLOR = "DarkBlue";
    const MATCHED_NODE_COLOR = const_Colors.NodeFillingHighlight;

    /**
     * Startet die Ausführung des Algorithmus.
     * @method
     */
    this.run = function() {
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
        this.removeAdditionalLabels();
        this.destroyCanvasDrawer();
        this.deregisterEventHandlers();
    };
    
    /**
     * Beendet den Tab und startet ihn neu
     * @method
     */
    this.refresh = function() {
        this.destroy();
        var algo = new Forschungsaufgabe2($("body").data("graph"),$("#tf2_canvas_graph"),$("#tab_tf2"));
        $("#tab_tf2").data("algo",algo);
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
        canvas.on("click.Forschungsaufgabe1",function(e) {algo.canvasClickHandler(e);});
        canvas.on("contextmenu.Forschungsaufgabe1",function(e) {algo.rightClickHandler(e);});
        $("#tf2_select_aufgabeGraph").on("change",function() {algo.setGraphHandler();});
        //this.canvas.on("click.Forschungsaufgabe2SN",function(e) {algo.startNodeFinder(e);});
        //$("#tf2_tr_LegendeClickable").on("click.Forschungsaufgabe2",function() {algo.changeVorgaengerVisualization();});
    };
    
    /**
     * Entferne die Eventhandler von Buttons und canvas im Namespace ".Forschungsaufgabe2"
     * und ".Forschungsaufgabe2SN"
     * @method
     */
    this.deregisterEventHandlers = function() {
        $("#tf1_select_aufgabeGraph").off("change");
        this.canvas.off(".Forschungsaufgabe2SN");
        this.canvas.off(".Forschungsaufgabe2");
        $("#tf2_tr_LegendeClickable").off(".Forschungsaufgabe2");
        $("#tf2_button_Zurueck").off(".Forschungsaufgabe2");
    };

    this.canvasClickHandler = function(e){
        var node = getClickedNode(e);
        if(update){
            augmentMatching();
            stack = new Array();
            update = false;
        }
        else if(node!=null){
            var free = matched[node.getNodeID()] == null;
            if(stack.length == 0){
                if(!free) {
                    $("#tf2_div_statusErklaerung").html("<h3>1 "+LNG.K('aufgabe2_header')+"</h3>"
                    + "<p>"+LNG.K('aufgabe2_msg_1')+"</p>");
                }
                else{
                    $("#tf2_div_statusErklaerung").html("<h3>1 "+LNG.K('aufgabe2_header')+"</h3>"
                    + "<p>"+LNG.K('aufgabe2_result_1')+"</p>");
                    stack.push(node);
                    markNode();
                }
            }
            else{
                var inStack = false;
                for(var i in stack){
                    if(stack[i]==node) inStack = true;
                }
                var notConnected = false;
                var e = graph.getEdgeBetween(node,stack[stack.length-1]);
                if(e === null) notConnected = true;
                var notPartner = false;
                if(stack.length%2==0 && matched[node.getNodeID()]!=stack[stack.length-1])notPartner=true;

                if(inStack){
                    $("#tf2_div_statusErklaerung").html("<h3> "+LNG.K('aufgabe2_header')+"</h3>"
                    + "<p>"+LNG.K('aufgabe2_msg_2')+"</p>");
                }
                else if(notConnected){
                    $("#tf2_div_statusErklaerung").html("<h3> "+LNG.K('aufgabe2_header')+"</h3>"
                    + "<p>"+LNG.K('aufgabe2_msg_3')+"</p>");
                }
                else if(notPartner){
                    $("#tf2_div_statusErklaerung").html("<h3> "+LNG.K('aufgabe2_header')+"</h3>"
                    + "<p>"+LNG.K('aufgabe2_msg_4')+"</p>");
                }
                else {
                    if(free){
                        $("#tf2_div_statusErklaerung").html("<h3> "+LNG.K('aufgabe2_header')+"</h3>"
                        + "<p>"+LNG.K('aufgabe2_result_2')+"</p>");
                        update = true;
                    }
                    else{//grow Path
                        $("#tf2_div_statusErklaerung").html("<h3> "+LNG.K('aufgabe2_header')+"</h3>"
                        + "<p>"+LNG.K('aufgabe2_result_3')+"</p>");
                    }
                    stack.push(node);
                    markNode();
                }
            }
        }
        this.needRedraw = true;
    };
    var getClickedNode = function(e){
        var mx = e.pageX - canvas.offset().left;
        var my = e.pageY - canvas.offset().top;
        for(var knotenID in graph.nodes) {
            if (graph.nodes[knotenID].contains(mx, my)) {
                return graph.nodes[knotenID];
            }
        }
        return null;
    };
    var augmentMatching = function () {
        var path = stack;
        setNodeMatched(path[0]);
        //iterate over all edges in the path
        for (var i = 1; i < path.length; i++) {
            var edge = graph.edges[graph.getEdgeBetween(path[i-1],path[i])];
            //if its matching edge then delete it from the matching
            if (matching[edge.getEdgeID()]) {
                delete matching[edge.getEdgeID()];
                edge.setLayout("lineColor", "black"); //set the color to black
            }
            //else insert it
            else {
                matching[edge.getEdgeID()] = edge;
                edge.setLayout("lineColor", MATCHED_EDGE_COLOR); // set the matching color
                if(i%2==1){
                    matched[path[i - 1].getNodeID()] = path[i];
                    matched[path[i].getNodeID()] = path[i - 1];
                }
            }
            setNodeMatched(path[i]);
        }
    };
    var setEdgeMatched = function (edge) {
        edge.setLayout("lineColor", MATCHED_EDGE_COLOR);
        edge.setLayout("lineWidth", global_Edgelayout.lineWidth * 1.3);
    };

    var setNodeMatched = function (node) {
        node.setLayout('fillStyle', MATCHED_NODE_COLOR);
        node.setLayout('borderWidth',global_NodeLayout.borderWidth);
        node.setLayout('borderColor', global_NodeLayout.borderColor);
    };
    var markNode = function(){
        var n1 = stack[stack.length-1];
        n1.setLayout('borderWidth',global_NodeLayout.borderWidth*1.3);
        if(stack.length>1){
            var n2 = stack[stack.length-2];
            n2.setLayout('borderWidth',global_NodeLayout.borderWidth*1.3);
            graph.edges[graph.getEdgeBetween(n1,n2)].setLayout("lineWidth", global_Edgelayout.lineWidth*1.7);

        }
    };
    this.rightClickHandler = function(e) {
        e.preventDefault();
        if(stack.length>0){
            var node = stack.pop();
            if(matched[node.getNodeID()]!=null)setNodeMatched(node);
            else node.restoreLayout();
            if(stack.length>0){
                var e = graph.getEdgeBetween(node,stack[stack.length-1]);
                if(matching[e]!=null)setEdgeMatched(graph.edges[e]);
                else graph.edges[e].restoreLayout();
            }
        }
        this.needRedraw = true;
    };
    /**
     * Wählt einen Graph um darauf die Forschungsaufgabe auszuführen
     * @method
     */
    this.setGraphHandler = function() {
        var selection = $("#tf2_select_aufgabeGraph>option:selected").val();
        switch(selection) {
            case "Selbsterstellter Graph":
                this.graph = $("body").data("graph");
                break;
            case "Standardbeispiel":
                this.graph = new BipartiteGraph("graphs/graph1.txt");
                break;
            default:
                //console.log("Auswahl im Dropdown Menü unbekannt, tue nichts.");
                
        }
        // Ändere auch die lokalen Variablen (und vermeide "div
        this.needRedraw = true;
    };
    
    /**
     * Wird aufgerufen, sobald auf das Canvas geklickt wird. 
     * @param {jQuery.Event} e jQuery Event Objekt, gibt Koordinaten
     */
    this.startNodeFinder = function(e) {
        if(startNode == null) {
            var mx = e.pageX - this.canvas.offset().left;
            var my = e.pageY - this.canvas.offset().top;
            for(var knotenID in this.graph.nodes) {
                if (this.graph.nodes[knotenID].contains(mx, my)) {
                    this.graph.nodes[knotenID].setLayout("fillStyle",const_Colors.NodeFillingHighlight);
                    startNode = this.graph.nodes[knotenID];
                    this.needRedraw = true;
                    $("#tf2_select_aufgabeGraph").hide();
                    $("#tf2_div_Abspielbuttons").append('<button id="tf2_button_Zurueck">'+LNG.K('aufgabe2_btn_rev')+'</button>');
                    $("#tf2_button_Zurueck").button({icons:{primary: "ui-icon-seek-start"}, disabled: true});
                    this.canvas.off(".Forschungsaufgabe2SN");
                    this.canvas.on("click.Forschungsaufgabe2",function(e) {algo.setNextEdge(e);});
                    this.canvas.on("mousemove.Forschungsaufgabe2",function(e) {algo.hoverOverEdge(e);});
                    $("#tf2_button_Zurueck").on("click.Forschungsaufgabe2",function() {algo.reverseLastStep();})
                    warnBeforeLeave = true;
                    this.initializeAlgorithm();
                    break;                   // Maximal einen Knoten auswählen
                }
            }
        }
    };
    
    /**
     * Initialisiere den Algorithmus, stelle die Felder auf ihre Startwerte.
     */
    this.initializeAlgorithm = function() {
        $("#tf2_div_statusErklaerung").html("<h3>1 "+LNG.K('textdb_msg_case0_1')+"</h3>"
            + "<p>"+LNG.K('aufgabe2_msg_1')+"</p>");
        $("#tf2_div_statusErklaerung").append("<h3>"+LNG.K('aufgabe2_msg_2')+"</h3>");
    };
    
    this.hoverOverEdge = function(e) {
        var mx = e.pageX - this.canvas.offset().left;
        var my = e.pageY - this.canvas.offset().top;
        var edgeFound = false;
        for(var kantenID in this.graph.edges) {
            if (this.graph.edges[kantenID].contains(mx, my,this.canvas[0].getContext("2d")) && edgeOrder.indexOf(kantenID) == -1) {
                edgeFound = true;
                this.canvas.css( 'cursor', 'pointer' );
                break;                   // Maximal einen Knoten auswählen
            }
        }
        if(!edgeFound) {
            this.canvas.css( 'cursor', 'default' );
        }
    };
    
    /**
     * Definiert die ausgewählte Kante als nächste Kante, die der Algorithmus ausgewählt hat
     * @param {jQuery.Event} e jQuery Event Objekt, gibt Koordinaten
     * @method
     */
    this.setNextEdge = function(e) {
        var mx = e.pageX - this.canvas.offset().left;
        var my = e.pageY - this.canvas.offset().top;
        for(var kantenID in this.graph.edges) {
            if (this.graph.edges[kantenID].contains(mx, my,this.canvas[0].getContext("2d")) && edgeOrder.indexOf(kantenID) == -1) {
                this.updateOnEdge(kantenID);
                break;                   // Maximal einen Knoten auswählen
            }
        }
    };
    
    /**
     * Updated auf der ausgewählten Kante, macht entsprechende Animation
     * @param {Number} kantenID ID der ausgewählten Kante
     */
    this.updateOnEdge = function(kantenID) {
        if(edgeOrder.length == 0) {
            $("#tf2_button_Zurueck").button("option", "disabled", false);
        }
        var aktKante = this.graph.edges[kantenID];
        edgeOrder.push(kantenID);
        aktKante.setLayout("lineColor",const_Colors.EdgeHighlight1);
        aktKante.setLayout("lineWidth",3);
        aktKante.additionalLabel = (edgeOrder.length).toString();
        if(previousEdge != null) {
            this.graph.edges[previousEdge].setLayout("lineColor",const_Colors.EdgeHighlight4);
            this.graph.edges[previousEdge].setLayout("lineWidth",2);
        }
        previousEdge = kantenID;
        var u = aktKante.getSourceID();
        var v = aktKante.getTargetID();
        nodeUpdateStack.push(distanz[v]);
        vorgaengerIDUpdateStack.push(vorgaenger[v]);
        if(distanz[u] != "inf" && (distanz[v] == "inf" || distanz[u] + aktKante.weight < distanz[v])) {
            distanz[v] = distanz[u] + aktKante.weight;
            this.graph.nodes[v].setLabel(distanz[v].toString());
            if(vorgaenger[v] != null) {
                this.graph.edges[vorgaenger[v]].setHighlighted(false);
            }
            vorgaenger[v] = kantenID;
            aktKante.setHighlighted(true);
        }
        this.needRedraw = true;
        // Prüfe ob wir fertig sind
        if(edgeOrder.length<Utilities.objectSize(this.graph.edges)) {
            // Erklärung im Statusfenster
            $("#tf2_div_statusErklaerung").html("<h3>"+LNG.K('aufgabe2_msg_3')+"</h3>"
                + "<p>"+LNG.K('aufgabe2_msg_4')+"</p>");
            $("#tf2_div_statusErklaerung").append("<h3>"+LNG.K('aufgabe2_msg_5')+"</h3>");
        }
        else {
            this.showResult();
        }
    };
    
    this.showResult = function() {
        this.graph.edges[previousEdge].setLayout("lineColor",const_Colors.EdgeHighlight4);
        this.graph.edges[previousEdge].setLayout("lineWidth",2);
        /** @type Edge*/
        var aktKante = null;
        var notOptimal = null;
        
        for(var kantenID in this.graph.edges) {
            aktKante = this.graph.edges[kantenID];
            var u = aktKante.getSourceID();
            var v = aktKante.getTargetID();
            if(distanz[u] != "inf" && (distanz[v] == "inf" || distanz[u] + aktKante.weight < distanz[v])) {
                notOptimal = aktKante;
                break;
            }
        }
        var numberOfPhases = this.computeNumberOfBFPhases();
        // Keine Verbesserung gefunden
        if(numberOfPhases == 1) {
            $("#tf2_div_statusErklaerung").html("<h3>"+LNG.K('aufgabe1_result1')+"</h3>");
            $("#tf2_div_statusErklaerung").append("<p>"+LNG.K('aufgabe2_result_2')+"</p>");
        }
        else {
            notOptimal.setLayout("lineColor",const_Colors.EdgeHighlight1);
            notOptimal.setLayout("lineWidth",3);
            if(numberOfPhases == -1) {
                $("#tf2_div_statusErklaerung").html("<h3>"+LNG.K('aufgabe2_result_3')+"</h3>");
                $("#tf2_div_statusErklaerung").append("<p>"+LNG.K('aufgabe2_result_4_a')+" <strong>"+(Utilities.objectSize(this.graph.nodes)-1) +" "+LNG.K('aufgabe2_result_4_b')+" </strong> "+LNG.K('aufgabe2_result_4_c')+"</p>");
            }
            else {
                $("#tf2_div_statusErklaerung").html("<h3>"+LNG.K('aufgabe2_result_3')+"</h3>");
                $("#tf2_div_statusErklaerung").append("<p>"+LNG.K('aufgabe2_result_5_a')+"<strong> "+numberOfPhases +" "+LNG.K('aufgabe2_result_4_b')+" </strong> "+LNG.K('aufgabe2_result_5_b')+"</p>");
                $("#tf2_div_statusErklaerung").append('<button id="tf2_button_neuerVersuch">'+LNG.K('aufgabe1_btn_retry')+'</button>');
                $("#tf2_button_neuerVersuch").button().click(function() {algo.retry();});
            }
        }
        $("#tf2_div_statusErklaerung").append("<h3>"+LNG.K('aufgabe2_explan1')+"</h3>");
        $("#tf2_div_statusErklaerung").append("<p>"+LNG.K('aufgabe2_explan2')+"</p>");
        $("#tf2_div_statusErklaerung").append("<h3>"+LNG.K('aufgabe2_explan3')+"</h3>");
        $("#tf2_div_statusErklaerung").append("<p>"+LNG.K('aufgabe2_explan4')+"</p>");
        $("#tf2_div_statusErklaerung").append("<p>"+LNG.K('aufgabe2_explan5')+"</p>");
        $("#tf2_div_statusErklaerung").append('<button id="tf2_button_gotoWeiteres">'+LNG.K('aufgabe2_btn_more')+'</button>');
        $("#tf2_button_gotoWeiteres").button().click(function() {$("#tabs").tabs("option","active", 6);});
        this.needRedraw = true;
        warnBeforeLeave = false;
    };
    
    /**
     * Berechnet die Anzahl Phasen, die der Bellman-Ford-Algorithmus auf dem gegebenen Graph mit der
     * gegebenen Sortierung benötigen würde.<br>
     * Beginnt erst mit der Berechnung ab Runde 2.
     * @method
     * @returns {Number} Die Anzahl Phasen, die der Bellman-Ford-Algorithmus auf diesem Graph benötigen würde, -1 bei negativem Kreis
     */
    this.computeNumberOfBFPhases = function() {
        var numberOfPhases = 1;
        for(var i = 2;i<Utilities.objectSize(this.graph.nodes);i++) {
            var changed = false;
            for(var j = 0;j<edgeOrder.length;j++) {
                var aktKante = this.graph.edges[edgeOrder[j]];
                var u = aktKante.getSourceID();
                var v = aktKante.getTargetID();
                if(distanz[u] != "inf" && (distanz[v] == "inf" || distanz[u] + aktKante.weight < distanz[v])) {
                    distanz[v] = distanz[u] + aktKante.weight;
                    changed = true;
                }
            }
            if(!changed) {
                numberOfPhases = i-1;
                break;
            }
        }
        for(var j = 0;j<edgeOrder.length;j++) {
            var aktKante = this.graph.edges[edgeOrder[j]];
            var u = aktKante.getSourceID();
            var v = aktKante.getTargetID();
            if(distanz[u] != "inf" && (distanz[v] == "inf" || distanz[u] + aktKante.weight < distanz[v])) {
                // Negativer Kreis
                numberOfPhases = -1;
            }
        }
        return numberOfPhases;
    };
    
    /**
     * Blendet die Vorgängerkanten ein und aus.
     * @method
     */
    this.changeVorgaengerVisualization = function() {
        showVorgaenger = !showVorgaenger;
        for(var knotenID in vorgaenger) {
            if(vorgaenger[knotenID] != null) {
                this.graph.edges[vorgaenger[knotenID]].setHighlighted(showVorgaenger);
            }
        }
        $("#tf2_tr_LegendeClickable").toggleClass("greyedOutBackground");
        this.needRedraw = true;
    };
    
    /**
     * Entfernt die Zusatzlabels vom Graph (vor dem Beenden)
     * @method
     */
    this.removeAdditionalLabels = function() {
        for(var kantenID in this.graph.edges) {
            this.graph.edges[kantenID].additionalLabel = null;
        }
    };
    
    /**
     * 
     * Nimmt an, dass bereits eine Kante geklickt wurde.
     * @method
     */
    this.reverseLastStep = function() {
        if(edgeOrder.length == 1) {
            $("#tf2_button_Zurueck").button("option", "disabled", true);// Erklärung im Statusfenster
            $("#tf2_div_statusErklaerung").html("<h3>1 "+LNG.K('textdb_msg_case0_1')+"</h3>"
                + "<p>"+LNG.K('aufgabe2_msg_1')+"</p>");
            $("#tf2_div_statusErklaerung").append("<h3>"+LNG.K('aufgabe2_msg_2')+"</h3>");
            var aktKante = this.graph.edges[edgeOrder.pop()];
            var v = aktKante.getTargetID();
            distanz[v] = nodeUpdateStack.pop();
            vorgaenger[v] = vorgaengerIDUpdateStack.pop();
            aktKante.setLayout("lineColor","black");
            aktKante.setLayout("lineWidth",2);
            aktKante.additionalLabel = null;
            aktKante.setHighlighted(false);
            if(showVorgaenger) {
                if(vorgaenger[v]) {
                    this.graph.edges[vorgaenger[v]].setHighlighted(true);
                }
            }
            if(distanz[v] == "inf") {
                this.graph.nodes[v].setLabel(String.fromCharCode(8734));
            }
            else {
                this.graph.nodes[v].setLabel(distanz[v].toString());
            }
            previousEdge = null;
            if(edgeOrder.length == Utilities.objectSize(this.graph.edges)) {
                warnBeforeLeave = true;
            }
        }
        else {
            $("#tf2_div_statusErklaerung").html("<h3>"+LNG.K('aufgabe2_msg_3')+"</h3>"
                + "<p>"+LNG.K('aufgabe2_msg_4')+"</p>");
            $("#tf2_div_statusErklaerung").append("<h3>"+LNG.K('aufgabe2_msg_5')+"</h3>");
            var aktKante = this.graph.edges[edgeOrder.pop()];
            var v = aktKante.getTargetID();
            distanz[v] = nodeUpdateStack.pop();
            vorgaenger[v] = vorgaengerIDUpdateStack.pop();
            aktKante.setLayout("lineColor","black");
            aktKante.setLayout("lineWidth",2);
            aktKante.additionalLabel = null;
            aktKante.setHighlighted(false);
            if(showVorgaenger) {
                if(vorgaenger[v]) {
                    this.graph.edges[vorgaenger[v]].setHighlighted(true);
                }
            }
            if(distanz[v] == "inf") {
                this.graph.nodes[v].setLabel(String.fromCharCode(8734));
            }
            else {
                this.graph.nodes[v].setLabel(distanz[v].toString());
            }
            aktKante = this.graph.edges[edgeOrder[edgeOrder.length-1]];
            aktKante.setLayout("lineColor",const_Colors.EdgeHighlight1);
            aktKante.setLayout("lineWidth",3);
            previousEdge = aktKante.getEdgeID();
            
            if(edgeOrder.length == Utilities.objectSize(this.graph.edges)) {
                warnBeforeLeave = true;
            }
        }
        this.needRedraw = true;
    };
    
    /**
     * Setzt die Kantenauswahl zurück.
     * @method
     */
    this.retry = function() {
        while(edgeOrder.length>0) {
            this.reverseLastStep();
        }
    };
}

// Vererbung realisieren
Forschungsaufgabe2.prototype = new CanvasDrawer;
Forschungsaufgabe2.prototype.constructor = Forschungsaufgabe2;