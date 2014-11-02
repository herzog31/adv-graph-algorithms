/**
 * Created by Ruslan on 28.10.2014.
 */


this.dfsUpdateMatching = function(){
    var path = disjointPaths[currentPath];
    for(var n in path){
        var node = path[n];
        //node.restoreLayout();
    }
    for (var i = 0; i < path.length-3; i = i + 2) {
        var evenEdge = graph.edges[graph.getEdgeBetween(path[i],path[i+1])];
        var oddEdge = graph.edges[graph.getEdgeBetween(path[i+2],path[i+1])];
        if(matching.hasOwnProperty(oddEdge.getEdgeID())){
            delete matching[oddEdge.getEdgeID()];
            matching[evenEdge.getEdgeID()] = evenEdge;
            matched[path[i].getNodeID()] =  path[i+1];
            matched[path[i+1].getNodeID()] =  path[i];
            setEdgeMatched(evenEdge);
            oddEdge.restoreLayout();
            setNodeMatched(path[i]);
            setNodeMatched(path[i+1]);
        }
    }
    var lastEdge = graph.edges[graph.getEdgeBetween(path[path.length-2],path[path.length-1])];
    matching[lastEdge.getEdgeID()] = lastEdge;
    matched[path[path.length-2].getNodeID()] =  path[path.length-1];
    matched[path[path.length-1].getNodeID()] =  path[path.length-2];
    setNodeMatched(path[path.length-1]);
    setNodeMatched(path[path.length-2]);
    setEdgeMatched(lastEdge);

    statusID = GRAY_PATH;
//        TODO Statusfenster
    $("#ta_div_statusErklaerung").html("<h3> "+LNG.K('textdb_msg_update')+"</h3>"
    + "<p>"+LNG.K('textdb_msg_update_1')+ "</p>"
    + "<p>"+LNG.K('textdb_msg_update_2')+ "</p>");
};

/**
 * Setzt den zuletzt ausgeführten Update Schritt zurück
 * @param {Boolean} afterUpdate Zeigt an, ob das Update schon ausgeführt wurde.
 * @method
 */

this.reverseHighlight = function(){
    var path = disjointPaths[currentPath];
    for(var n = 0; n < path.length; n=n+2){
        var node = path[n];
        node.setLayout('borderColor',const_Colors.NodeBorder);
        node.setLayout('borderWidth',global_NodeLayout.borderWidth);
        if(n < path.length - 1){
            var edge = path[n+1];
            edge.setLayout("lineWidth", global_Edgelayout.lineWidth);
        }
    }
    // TODO Statusfenster
    $("#ta_div_statusErklaerung").html("<h3> "+LNG.K('textdb_msg_path_highlight')+"</h3>");
    statusID = UPDATE_MATCHING;
};

this.reverseLastUpdate = function(afterUpdate) {
    var path = disjointPaths[currentPath];
    //iterate over all edges in the path
    for (var i = 1; i < path.length-1; i = i + 2) {
        var edge = path[i];
        //if its matching edge then delete it from the matching
        if(matching[edge.getEdgeID()]){
            delete matching[edge.getEdgeID()];
            edge.setLayout("lineColor", "black"); //set the color to black
        }
        //else insert it
        else{
            matching[edge.getEdgeID()] = edge;
            matched[path[i-1].getNodeID()] =  path[i+1];
            matched[path[i+1].getNodeID()] =  path[i-1];
            edge.setLayout("lineColor", MATCHED_EDGE_COLOR); // set the matching color
        }
    }
    setNodeMatched(path[0]);
    setNodeMatched(path[path.length-1]);

    statusID = GRAY_PATH;
//        TODO Statusfenster
    $("#ta_div_statusErklaerung").html("<h3> "+LNG.K('textdb_msg_update')+"</h3>"
    + "<p>"+LNG.K('textdb_msg_update_1')+ "</p>"
    + "<p>"+LNG.K('textdb_msg_update_2')+ "</p>");
};


this.reverseGray = function() {

};