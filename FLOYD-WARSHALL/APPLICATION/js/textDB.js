/**
 * @author Lisa Velden
 * Text Management
 */

/********************************************** Erklärungstext / Anzeige in Pseudocode **********************************************/

var scrollPositionI = 0;
var scrollPositionJ = 0;
var table;
var distanceMatrix;

/**
 * Passe Text in Erklärungs- und Pseudocodebereich an.
 * @method
 * @param {Object} distance
 */
function changeText(distance, tabprefix, contextNew, nodes, statusID) {
    distanceMatrix = distance;
    switch(statusID) {
        case 1:
            if (tabprefix === "ta") {
                $("#" + tabprefix + "_div_statusText").html("<h3>Jetzt kann der Algorithmus beginnen!</h3>");
                table = displayMatrix(distance, contextNew, nodes, false);
                if(distance.length > 16){
                    tableSmall = displayMatrixSmall(distance, contextNew, nodes, false);
                    $("#ta_div_statusText").append("<table id='matrix'>" + tableSmall + "</table>");
                    $("#ta_div_statusText").append("<button id='tg_button_trol' onclick='showMatrixPopup();' class='ui-button ui-widget ui-state-default"
                    + "ui-corner-all ui-button-text-only' role='button' aria-disabled='false'><span class='ui-button-text'>"
                    + "Komplette Matrix zeigen</span></button>");
                }else{
                    $("#ta_div_statusText").append("<h3>Die Originalmatrix sieht so aus:</h3><table id='matrix'>" + table + "</table>");
                }
            };
            break;

        case 2:
            table = displayMatrix(distance, contextNew, nodes,  true);
            var formula = "<p>" + contextNew.formula + "</p>";
            $("#" + tabprefix + "_div_statusText").html("<table id='matrix'>" + table + "</table>");
            $("#" + tabprefix + "_div_statusText").append(formula);
            $("#table_div").scrollLeft((scrollPositionJ - 2) * 16);
            $("#table_div").scrollTop((scrollPositionI - 2) * 16);
            break;

        case 3:
            $("#" + tabprefix + "_div_statusText").html("<h3>Ende des Algorithmus</h3>");
            if (tabprefix === "ta") {
                $("#ta_div_statusText").append("<p>Nun wurden alle kürzesten beziehungsweise günstigsten Wege berechnet.</p>");
                table = displayMatrix(distance, contextNew, nodes, false);
                if(distance.length > 13){
                    tableSmall = displayMatrixSmall(distance, contextNew, nodes, false);
                    $("#ta_div_statusText").append("<table id='matrix'>" + tableSmall + "</table>");
                    $("#ta_div_statusText").append("<button id='tg_button_trol' onclick='showMatrixPopup();' class='ui-button ui-widget ui-state-default"
                        + "ui-corner-all ui-button-text-only' role='button' aria-disabled='false'><span class='ui-button-text'>"
                        + "Komplette Matrix zeigen</span></button>");
                }else{
                    $("#ta_div_statusText").append("<h3>Die Endmatrix sieht so aus:</h3><table id='matrix'>" + table + "</table>");
                }
                $("#table_div").scrollLeft(0);
                $("#table_div").scrollTop(0);
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
    var table = "<tr><td></td>";
    for(var key in nodes){
        table += "<td class='node_label unimportant-cell'>" + nodes[key].getLabel() + "</td>";
    }
    table += "</tr>";
    var finalI, finalJ;
    for(var i = 0; i < distance.length; i++){
        var trContent = "<td class='node_label unimportant-cell'>" + nodes[i].getLabel() + "</td>";
        var displayNeeded = false;
        for(var j = 0; j < distance.length; j++){
            // if(distance[i][j] != "inf" && i != j){
            //     displayNeeded = true;
            // }
            if(contextNew && markChanged && i == contextNew.changedRow && j == contextNew.changedColumn){
                finalJ = j; finalI = i;
                trContent += "<td class='updated-cell important-cell' i=" + i + " j=" + j + 
                    " onmouseover='markPath(this)' onmouseout='unmarkPath(this)'><font color='red'>" + distance[i][j] + "</font></th>";
            }else if(contextNew && ((i == contextNew.i && j == contextNew.k) || (i == contextNew.k && j == contextNew.j))){
                trContent += "<td class='summand-cell important-cell' i=" + i + " j=" + j + 
                    " onmouseover='markPath(this)' onmouseout='unmarkPath(this)'><font color='red'>" + distance[i][j] + "</font></th>";
            }else{
                trContent += "<td class='path-cell unimportant-cell' i=" + i + " j=" + j + 
                    " onmouseover='markPath(this)' onmouseout='unmarkPath(this)'>" + distance[i][j] + "</td>";
            }
        }
        // table += "</tr>";
        // if(displayNeeded){
        table += "<tr class='table-row'>" + trContent + "</tr>";
        // }else{
        //     table += "<tr style='display: none'>" + trContent + "</tr>";
        // }
    }
    //table += "</table>";
    /*var table = '<table cellspacing="0" cellpadding="0" border="0" ><tr><td id="firstTd"></td><td>' + 
        '<div id="divHeader" style="overflow:hidden;width:284px;"><table id="upperRowTable" cellspacing="0" cellpadding="0"><tr>';
    for(var key in nodes){
        table += '<td><div class="tableHeader">' + nodes[key].getLabel() + '</div></td>';
    }
    table += '</tr></table></div></td></tr><tr><td valign="top"><div id="firstcol" style="overflow: hidden;height:85px">' + 
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
                scrollPositionI = i;
                scrollPositionJ = j;
            } else{
                table += "<td class='path-cell' i=" + i + " j=" + j + 
                    " onmouseover='markPath(this)' onmouseout='unmarkPath(this)'>" + distance[i][j] + "</td>";
            }
        }
        table += '</tr>';
    }
    table += '</table></div></td></tr></table>';*/

    return table;
};

function displayMatrixSmall(distance, contextNew, nodes, markChanged){
    var table = "<tr><td></td>";
    for(var i = 0; i < 13; i++){
        table += "<td class='node_label unimportant-cell'>" + nodes[i].getLabel() + "</td>";
    }
    table += "<td class='unimportant-cell'>...</td></tr>";
    var finalI, finalJ;
    for(var i = 0; i < 13; i++){
        var trContent = "<td class='node_label unimportant-cell'>" + nodes[i].getLabel() + "</td>";
        var displayNeeded = false;
        for(var j = 0; j < 13; j++){
            if(contextNew && markChanged && i == contextNew.changedRow && j == contextNew.changedColumn){
                finalJ = j; finalI = i;
                trContent += "<td class='updated-cell important-cell' i=" + i + " j=" + j + 
                    " onmouseover='markPath(this)' onmouseout='unmarkPath(this)'><font color='red'>" + distance[i][j] + "</font></th>";
            }else if(contextNew && ((i == contextNew.i && j == contextNew.k) || (i == contextNew.k && j == contextNew.j))){
                trContent += "<td class='summand-cell important-cell' i=" + i + " j=" + j + 
                    " onmouseover='markPath(this)' onmouseout='unmarkPath(this)'><font color='red'>" + distance[i][j] + "</font></th>";
            }else{
                trContent += "<td class='path-cell unimportant-cell' i=" + i + " j=" + j + 
                    " onmouseover='markPath(this)' onmouseout='unmarkPath(this)'>" + distance[i][j] + "</td>";
            }
        }
        table += "<tr class='table-row'>" + trContent + "<td class='unimportant-cell'>...</td></tr>";
    }
    var trContent = "<td class='node_label unimportant-cell'>...</td>";
    for(var j = 0; j < 13; j++){
        trContent += "<td class='unimportant-cell'>...</td>";
    }
    table += "<tr class='table-row'>" + trContent + "<td class='unimportant-cell'>...</td></tr>";

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

function adjustTable(){
    var rows = new Array();
    var cols = new Array();
    $(".important-cell").each(function(){
        var col = $(this).parent().children().index($(this));
        var row = $(this).parent().parent().children().index($(this).parent());
        cols.push(col);
        rows.push(row);
        $("#matrix tr:eq(0) td:eq(" + (col) + ")").removeClass("unimportant-cell").addClass("important-cell");
        $("#matrix tr:eq(" + row + ") td:eq(0)").removeClass("unimportant-cell").addClass("important-cell");
        $("#matrix tr:eq(" + row + ")").removeClass("table-row");
        // console.log("row="+row+"col="+col);    
    });
    console.log("rows");
    console.log(rows);
    console.log("cols");
    console.log(cols);
    for(var i in rows){
        for(var j in cols){
            // console.log("rows[i]=" + rows[i] + " cols[j]=" + cols[j]);
            $("#matrix tr:eq(" + rows[i] + ") td:eq(" + cols[j] + ")").removeClass("unimportant-cell").addClass("important-cell");
        }
    }

    $(".table-row").css("display", "none");
    $(".unimportant-cell").css("display", "none");
    $(".important-cell").css("display", "table-cell");
    // var col = $(".important-cell").parent().children().index($(".important-cell"));
    // var row = $(".important-cell").parent().parent().children().index($(".important-cell").parent());
    // console.log("row="+row+"col="+col);
    // $("#matrix tr:eq(0) td:eq(" + (col - 1) + ")").removeClass("unimportant-cell").addClass("important-cell");
    // $("#matrix tr:eq(" + row + ") td:eq(0)").removeClass("unimportant-cell").addClass("important-cell");
    // $("#matrix tr:eq(" + row + ")").removeClass("table-row");

    // $(".table-row").css("display", "none");
    // $(".unimportant-cell").css("display", "none");
    // $("#matrix").find("[i=" + (row - 1) + "][j=0]").css("display", "table-row");
    // $("#matrix").find("[i=0][j=" + (col - 1) + "]").css("display", "table-row");
};

//function to support scrolling of title and first column
fnScroll = function(){
    $('#divHeader').scrollLeft($('#table_div').scrollLeft());
    $('#firstcol').scrollTop($('#table_div').scrollTop());
};
// onmouseover='markPath(" + i + ", + " + j + ")'

function showMatrixPopup(){
    $("#matrix-overlay").css("display", "block");
    $("#matrix-container").html("<table id='matrix-display'>" + table + "</table>");
    $("#matrix-display td").removeAttr("onmouseover");
    $("#matrix-display td").removeAttr("onmouseout");
    return;
};

function hideMatrixPopup(){
    $("#matrix-container").html();
    $("#matrix-overlay").css("display", "none");
    return;
};