/**
 * @author Lisa Velden
 * Text Management
 */

/********************************************** Erklärungstext / Anzeige in Pseudocode **********************************************/

/**
 * Passe Text in Erklärungs- und Pseudocodebereich an.
 * @method
 * @param {Object} distance
 */
function changeText(distance, tabprefix, contextNew, nodes, statusID) {
    switch(statusID) {
        case 1:
            if (tabprefix === "ta") {
                $("#" + tabprefix + "_div_statusText").html("<h3>Jetzt kann der Algorithmus beginnen!</h3><h3>Die Originalmatrix sieht so aus:</h3>");
                var table = displayMatrix(distance, contextNew, nodes, false);
                $("#ta_div_statusText").append(table);
            };
            break;

        case 2:
            var table = displayMatrix(distance, contextNew, nodes,  true);
            var formula = "<p>" + contextNew.formula + "</p>";
            $("#" + tabprefix + "_div_statusText").html(table);
            $("#" + tabprefix + "_div_statusText").append(formula);
            break;

        case 3:
            $("#" + tabprefix + "_div_statusText").html("<h3>Ende des Algorithmus</h3>");
            if (tabprefix === "ta") {
                $("#ta_div_statusText").append("<p>Nun wurden alle kürzesten beziehungsweise günstigsten Wege berechnet.</p><h3>Die Endmatrix sieht so aus:</h3>");
                var table = displayMatrix(distance, contextNew, nodes, false);
                $("#ta_div_statusText").append(table);
            };
            break;

        default:
            console.log("Fehlerhafte StatusID.");
    }

    /*if(distance && contextNew){
        var table = displayMatrix(distance, true);
        $("#" + tabprefix + "_div_statusText").html(table);
    }else if(contextNew){
        $("#" + tabprefix + "_div_statusText").html("<h3>Jetzt kann der Algorithmus beginnen!</h3>");
    }else{
        $("#" + tabprefix + "_div_statusText").html("<h3>Ende des Algorithmus</h3>");
        if (tabprefix === "ta") {
            $("#ta_div_statusText").append("<p>Nun wurden alle kürzesten beziehungsweise günstigsten Wege berechnet.</p><p>Die Endmatrix sieht so aus:</p>");
            var table = displayMatrix(distance, false);
            $("#ta_div_statusText").append(table);
        };
    }*/
};

function displayMatrix(distance, contextNew, nodes, markChanged){
    // var table = "<table><tr><td></td>";
    // for(var key in nodes){
    //     table += "<td class='node_label'>" + nodes[key].getLabel() + "</td>";
    // }
    // table += "</tr>";
    // for(var i = 0; i < distance.length; i++){
    //     table += "<tr><td class='node_label'>" + nodes[i].getLabel() + "</td>";
    //     for(var j = 0; j < distance.length; j++){
    //         if(contextNew && markChanged && i == contextNew.changedRow && j == contextNew.changedColumn){
    //             table += "<th class='path-cell' i=" + i + " j=" + j + 
    //                 " onmouseover='markPath(this)' onmouseout='unmarkPath(this)'><font color='red'>" + distance[i][j] + "</font></th>";
    //         }else{
    //             table += "<td class='path-cell' i=" + i + " j=" + j + 
    //                 " onmouseover='markPath(this)' onmouseout='unmarkPath(this)'>" + distance[i][j] + "</td>";
    //         }
    //     }
    //     table += "</tr>";
    // }
    // table += "</table>";
    var table = '<table cellspacing="0" cellpadding="0" border="0" ><tr><td id="firstTd"></td><td>' + 
        '<div id="divHeader" style="overflow:hidden;width:284px;"><table id="upperRowTable" cellspacing="0" cellpadding="0"><tr>';
    for(var key in nodes){
        table += '<td><div class="tableHeader">' + nodes[key].getLabel() + '</div></td>';
    }
    table += '</tr></table></div></td></tr><tr><td valign="top"><div id="firstcol" style="overflow: hidden;height:80px">' + 
        '<table cellspacing="0" cellpadding="0">';
    for(var key in nodes){
        table += '<tr><td class="tableFirstCol">' + nodes[key].getLabel() + '</td></tr>';
    }
    table += '</table></div></td><td valign="top">' + 
        '<div id="table_div" style="overflow: auto;width:300px;height:100px;position:relative" onscroll="fnScroll()" >' + 
        '<table style="table-layout: fixed;" width="0px" cellspacing="0" cellpadding="0">';

    for(var i = 0; i < distance.length; i++){
        table += '<tr>';
        for(var j = 0; j < distance.length; j++){
            if (contextNew && markChanged && i == contextNew.changedRow && j == contextNew.changedColumn){
                table += "<th class='path-cell' i=" + i + " j=" + j + 
                    " onmouseover='markPath(this)' onmouseout='unmarkPath(this)'><font color='red'>" + distance[i][j] + "</font></th>";
            } else{
                table += "<td class='path-cell' i=" + i + " j=" + j + 
                    " onmouseover='markPath(this)' onmouseout='unmarkPath(this)'>" + distance[i][j] + "</td>";
            }
        }
        table += '</tr>';
    }
    table += '</table></div></td></tr></table>';
    return table;
};

function markPath(object){
    $(object).css("background-color", "rgb(0, 255, 0)");
    if(algo.paths[$(object).attr("i")][$(object).attr("j")]){
        var edges = algo.paths[$(object).attr("i")][$(object).attr("j")].split(",");
        for(var i = 0; i < edges.length; i++){
            algo.graph.edges[edges[i]].setLayout("lineColor", "red");
        }
        algo.needRedraw = true;
    }
};

function unmarkPath(object){
    $(object).css("background-color", "");
    for(var edge in algo.graph.edges){
        algo.graph.edges[edge].setLayout("lineColor", "black");
    }
    algo.needRedraw = true;
};

//function to support scrolling of title and first column
fnScroll = function(){
    $('#divHeader').scrollLeft($('#table_div').scrollLeft());
    $('#firstcol').scrollTop($('#table_div').scrollTop());
};
// onmouseover='markPath(" + i + ", + " + j + ")'