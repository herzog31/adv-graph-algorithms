/**
 * Created by Ruslan on 06.10.2014.
 */

var graph_constants = {
    U_X_POSITION : 100,
    V_X_POSITION : 400,
    TOP_Y_POSITION : 80,
    Y_DIFF: 60
};

function BipartiteGraph(filename,canvas){
    Graph.call(this);
    this.directed = false;

    this.unodes = new Object();
    this.vnodes = new Object();

    /**
     * Closure Objekt für den Graph
     * @type Graph
     */
    var closure_graph = this;

    this.base_addNode = this.addNode;
    this.base_addEdge = this.addEdge;
    this.base_removeNode = this.removeNode;

    this.reorderNodes = function(){
        var numberOfNodes = Object.keys(this.nodes).length/2;
        var diff = graph_constants.Y_DIFF;
        //diff = (canvas.height()-50)/numberOfNodes;
        var i = 0;
        for(n in this.unodes){
            var node = this.unodes[n];
            node.setCoordinates({x: graph_constants.U_X_POSITION, y: graph_constants.TOP_Y_POSITION + (i++*diff)});
        }
        i = 0;
        for(n in this.vnodes){
            var node = this.vnodes[n];
            node.setCoordinates({x: graph_constants.V_X_POSITION, y: graph_constants.TOP_Y_POSITION + (i++*diff)});
        }
    };

    this.addNode = function (isInU) {
        var node = this.base_addNode(0,0);
        if(isInU) {
            this.unodes[node.getNodeID()] = node;
        }
        else{
            this.vnodes[node.getNodeID()] = node;
        }
        this.reorderNodes();
        return node;
    };

    this.removeNode = function(nodeID) {
        this.base_removeNode(nodeID);
        delete this.unodes[nodeID];
        delete this.vnodes[nodeID];
        this.reorderNodes();
    };

    this.addEdge = function(source,target,weight) {
        //check first if its bipartite
        if ((this.unodes[source.getNodeID()] === source && this.unodes[target.getNodeID()] === target) ||
            (this.vnodes[source.getNodeID()] === source && this.vnodes[target.getNodeID()] === target)) {
            return null;
        }
        if(this.unodes[source.getNodeID()]) this.base_addEdge(source,target,weight);
        else this.base_addEdge(target,source,weight);
    };

    function parseGraphfromFile(file) {
        var request = $.ajax({
            url: file,
            async: false,
            dataType: "text"
        });

        request.done(function(text) {
            var lines=text.split("\n");                     // Nach Zeilen aufteilen
            var ucard = 0;
            var vcard = 0;
            var i;
            for(i = 0; i < lines.length; i++) {
                var parameter = lines[i].split(" ");
                if(!isNaN(parseInt(parameter[0]))){
                    ucard = parseInt(parameter[0]);
                    vcard = parseInt(parameter[1]);
                    for(var j = 0; j < ucard; j++) closure_graph.addNode(true);
                    for(var j = 0; j < vcard; j++) closure_graph.addNode(false);
                    i++;
                    break;
                }
            }
            for(; i < lines.length; i++) {
                var parameter = lines[i].split(" ");     // Nach Parametern aufteilen
                if(parameter[0] == "e") {
                    if(!isNaN(parseInt(parameter[1])) && !isNaN(parseInt(parameter[2])) && !isNaN(parseFloat(parameter[3]))) {
                        var sourceId = parseInt(parameter[1]);
                        var targetId = parseInt(parameter[2]);
                        var weight = parseFloat(parameter[3]);
                        //check if bipartite here
                        closure_graph.addEdge(closure_graph.nodes[sourceId],closure_graph.nodes[targetId],weight);
                    }
                }
            }
        });
    };

    function generateRandomGraph(canvas) {
        var NumberOfNodes = 7;
        var diff = (canvas.height()-50)/NumberOfNodes;
        // Knoten erstellen
        for(var i = 0;i<NumberOfNodes;i++) {
            closure_graph.addNode(true);
            closure_graph.addNode(false);
        }

        // Kanten erstellen, mit WSKeit 30 %
        for(var i in closure_graph.unodes) {
            for(var j in closure_graph.vnodes) {
                if(Math.random() < 0.3) {
                    closure_graph.addEdge(closure_graph.unodes[i],closure_graph.vnodes[j],1);
                }
            }
        }
    }


    this.nodes = new Object();
    this.edges = new Object();
    // Falls ein Dateiname angegeben wurde, parse den entsprechenden Graph
    // Falls das Canvas angegeben wurde, erstelle Zufallsgraph
    if(filename === "random") {
        generateRandomGraph(canvas);
    }
    else {
        parseGraphfromFile(filename);
    }
}

// Vererbung realisieren
BipartiteGraph.prototype = Object.create(Graph.prototype);
BipartiteGraph.prototype.constructor = BipartiteGraph;

function BipartiteGraphDrawer(p_graph,p_canvas,p_tab) {
    GraphDrawer.call(this,p_graph,p_canvas,p_tab);
    var graph = p_graph;
    var canvas = p_canvas;

    this.dblClickHandler = function(e) {
        var isInU = e.pageX - canvas.offset().left < 0.5 * (graph_constants.V_X_POSITION + graph_constants.U_X_POSITION);
        graph.addNode(isInU);
        this.needRedraw = true;
    };

    //this.mouseMoveHandler = function(e) {};

    /**
     * Beendet den Tab und startet ihn neu
     * @method
     */
    this.refresh = function() {
        this.destroy();
        var algo = new BipartiteGraphDrawer($("body").data("graph"),$("#tg_canvas_graph"),$("#tab_tg"));
        $("#tab_tg").data("algo",algo);
        algo.run();
    };

    this.setGraphHandler = function() {
        var selection = $("#tg_select_GraphSelector>option:selected").val();
        switch(selection) {
            case "Standardbeispiel":
                this.canvas.css("background","");
                //$("#tg_p_bildlizenz").remove();
                //this.graph = new BipartiteGraph("graphs/graph1.txt",canvas);
                $("body").data("graph",new BipartiteGraph("graphs/graph2.txt",canvas));
                this.graph = new BipartiteGraph("graphs/graph2.txt");
                this.refresh();
                break;
            case "Zufallsgraph":
                this.canvas.css("background","");
                //$("#tg_p_bildlizenz").remove();
                this.graph = new BipartiteGraph("random",canvas);
                $("body").data("graph",this.graph);
                this.refresh();
                break;
            case "Selbsterstellter Graph":
                break;
            default:
            //console.log("Auswahl im Dropdown Menü unbekannt, tue nichts.");
        }
    };
}
BipartiteGraph.prototype.getEdgeBetween= function(source,target) {
    for(var edgeID in this.edges) {
        if((this.edges[edgeID].getSourceID() == source.getNodeID()
            && this.edges[edgeID].getTargetID() == target.getNodeID()) ||
            (this.edges[edgeID].getTargetID() == source.getNodeID()
            && this.edges[edgeID].getSourceID() == target.getNodeID())) {
            return edgeID;
        }
    }
    return null;
};

BipartiteGraphDrawer.prototype = Object.create(GraphDrawer.prototype);
BipartiteGraphDrawer.prototype.constructor = BipartiteGraphDrawer;