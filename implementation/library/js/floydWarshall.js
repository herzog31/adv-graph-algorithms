/**
 * Created by Ruslan on 14.02.2015.
 */

function shortestPaths(graph,distance,pred){
    var keys = Object.keys(graph.nodes);
    for(var k in keys){
        i = keys[k];
        distance[i] = {};
        pred[i]= {};
        for(var j in keys){
            distance[i][j] = "inf";
            pred[i][j] = null;
        }
        distance[i][i] = 0;
    }
    for (var e in graph.edges){
        var edge = graph.edges[e];
        distance[edge.getSourceID()][edge.getTargetID()] = edge.weight;
        pred[edge.getSourceID()][edge.getTargetID()] = edge;
    }
    for(var ind_k in keys){
        k = keys[ind_k];
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
