/**
 * Created by Ruslan on 14.02.2015.
 */

function shortestPaths(graph,distance,pred){
    var keys = Object.keys(graph.nodes);
    for(var k1 in keys){
        var i = keys[k1];
        distance[i] = {};
        pred[i]= {};
        for(var k2 in keys){
            var j = keys[k2];
            distance[i][j] = "inf";
            pred[i][j] = null;
        }
        distance[i][i] = 0;
    }
    for (var e in graph.edges){
        var edge = graph.edges[e];
        if(distance[edge.getSourceID()][edge.getTargetID()] == "inf" || distance[edge.getSourceID()][edge.getTargetID()] > edge.weight ){
            distance[edge.getSourceID()][edge.getTargetID()] = edge.weight;
            pred[edge.getSourceID()][edge.getTargetID()] = edge;
        }
    }
    for(var ind_k in keys){
        var k = keys[ind_k];
        for(var ind_i in keys){
            i = keys[ind_i];
            for(var ind_j in keys){
                j = keys[ind_j];
                if(distance[i][k] != "inf" && distance[k][j] != "inf"
                    && (distance[i][j] == "inf" || distance[i][j] > distance[i][k] + distance[k][j])){
                    distance[i][j] = distance[i][k] + distance[k][j];
                    pred[i][j] = pred[k][j]
                }
            }
        }
    }
}
function constructPath(pred,u,v){
    if(pred[u][v] == null) return [];
    else{
        var path = [];
        while (u != v){
            var e = pred[u][v];
            path.push(e);
            v = e.getSourceID();
        }
        return path.reverse();
    }
}
