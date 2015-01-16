/**
 * @author Aleksejs Voroncovs
 * Text Management
 */

/********************************************** Erklärungstext / Anzeige in Pseudocode **********************************************/

var table;
var distanceMatrix;
var prefix;

/**
 * Passe Text in Erklärungs- und Pseudocodebereich an.
 * @method
 * @param {Object} distance
 * @param {String} tabprefix
 * @param {Object} contextNew
 * @param {Object} nodes
 * @param {Integer} statusID
 */
function changeText(distance, tabprefix, contextNew, nodes, statusID) {
    prefix = tabprefix;
    distanceMatrix = distance;
    switch(statusID) {
        case 1:
            $("#" + tabprefix + "_div_statusText").html("<h3>" + LNG.K('textdb_msg_can_start') + "</h3>");
            table = displayMatrix(distance, contextNew, nodes, false);
            if(distance.length > 11){
                tableSmall = displayMatrixCorner(distance, contextNew, nodes, false, 10);
                $("#" + tabprefix + "_div_statusText").append("<table id='matrix'>" + tableSmall + "</table>");
                $("#tg_button_showMatrix").show();
            }else{
                $("#tg_button_showMatrix").hide();
                $("#" + tabprefix + "_div_statusText").append("<h3>" + LNG.K('textdb_msg_original_matrix') + "</h3><table id='matrix'>" + table + "</table>");
            }
            $(".not-number-cell").css("color", "black");
            $(".marked").removeClass("marked");
            $("#" + tabprefix + "_p_l2").addClass("marked");
            $("#" + tabprefix + "_p_l3").addClass("marked");
            $("#" + tabprefix + "_p_l4").addClass("marked");
            $("#" + tabprefix + "_p_l5").addClass("marked");
            break;

        case 2:
            table = displayMatrix(distance, contextNew, nodes,  true);
            var formula = "<p>" + contextNew.formula + "</p>";
            if(distance.length > 11){
                tableSmall = displayMatrixSmall(distance, contextNew, nodes,  true);
                $("#" + tabprefix + "_div_statusText").html("<table id='matrix'>" + tableSmall + "</table>");
                $("#" + tabprefix + "_div_statusText").append(formula);
            }else{
                $("#" + tabprefix + "_div_statusText").html("<table id='matrix'>" + table + "</table>");
                $("#" + tabprefix + "_div_statusText").append(formula);
            }
            $(".marked").removeClass("marked");
            $("#" + tabprefix + "_p_l6").addClass("marked");
            $("#" + tabprefix + "_p_l7").addClass("marked");
            $("#" + tabprefix + "_p_l8").addClass("marked");
            $("#" + tabprefix + "_p_l9").addClass("marked");
            $("#" + tabprefix + "_p_l10").addClass("marked");
            $("#" + tabprefix + "_p_l11").addClass("marked");
            $("#" + tabprefix + "_p_l12").addClass("marked");
            break;

        case 3:
            $("#" + tabprefix + "_div_statusText").html("<h3>" + LNG.K('textdb_msg_algo_end') + "</h3>");
                $("#" + tabprefix + "_div_statusText").append("<p>" + LNG.K('textdb_msg_paths_computed') + "</p>");
                table = displayMatrix(distance, contextNew, nodes, false);
                if(distance.length > 11){
                    tableSmall = displayMatrixCorner(distance, contextNew, nodes, false, 10);
                    $("#" + tabprefix + "_div_statusText").append("<table id='matrix'>" + tableSmall + "</table>");
                }else{
                    $("#" + tabprefix + "_div_statusText").append("<h3>" + LNG.K('textdb_msg_endmatrix') + "</h3><table id='matrix'>" + table + "</table>");
                }
                $("#table_div").scrollLeft(0);
                $("#table_div").scrollTop(0);
                $(".not-number-cell").css("color", "black");
            $(".marked").removeClass("marked");
            $("#" + tabprefix + "_p_l13").addClass("marked");
            break;

        default:
            console.log("Fehlerhafte StatusID.");
    }
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
        for(var j = 0; j < distance.length; j++){
            if(contextNew && markChanged && i == contextNew.changedRow && j == contextNew.changedColumn){
                finalJ = j; finalI = i;
                trContent += "<td class='";
                if(contextNew.preliminary){
                    trContent += "updated-cell";
                }else{
                    trContent += "candidate-cell";
                }
                trContent += " important-cell' i=" + i + " j=" + j + 
                    " onmouseover='markPath(this)' onmouseout='unmarkPath(this)'>" + distance[i][j] + "</th>";
            }else if(contextNew && ((i == contextNew.i && j == contextNew.k) || (i == contextNew.k && j == contextNew.j))){
                trContent += "<td class='";
                if(contextNew.preliminary){
                    trContent += "summand-cell";
                }else{
                    trContent += "candidate-cell";
                }
                trContent += " important-cell' i=" + i + " j=" + j + 
                    " onmouseover='markPath(this)' onmouseout='unmarkPath(this)'>" + distance[i][j] + "</th>";
            }else{
                trContent += "<td class='";
                if(i != j && distance[i][j] != "∞"){
                    trContent += " number-cell ";
                } else{
                    trContent += " not-number-cell ";
                }
                trContent += " matrix-cell unimportant-cell' i=" + i + " j=" + j + 
                    " onmouseover='markPath(this)' onmouseout='unmarkPath(this)'>" + distance[i][j] + "</td>";
            }
        }
        table += "<tr class='table-row'>" + trContent + "</tr>";
    }

    return table;
};

function displayMatrixCorner(distance, contextNew, nodes, markChanged, limit){
    var table = "<tr><td></td>";
    for(var key = 0; key < limit; key++){
        table += "<td class='node_label unimportant-cell'>" + nodes[key].getLabel() + "</td>";
    }
    table += "<td>...</td></tr>";
    var finalI, finalJ;
    for(var i = 0; i < limit; i++){
        var trContent = "<td class='node_label unimportant-cell'>" + nodes[i].getLabel() + "</td>";
        for(var j = 0; j < limit; j++){
            if(contextNew && markChanged && i == contextNew.changedRow && j == contextNew.changedColumn){
                finalJ = j; finalI = i;
                trContent += "<td class='";
                if(contextNew.preliminary){
                    trContent += "updated-cell";
                }else{
                    trContent += "candidate-cell";
                }
                trContent += " important-cell' i=" + i + " j=" + j + 
                    " onmouseover='markPath(this)' onmouseout='unmarkPath(this)'>" + distance[i][j] + "</th>";
            }else if(contextNew && ((i == contextNew.i && j == contextNew.k) || (i == contextNew.k && j == contextNew.j))){
                trContent += "<td class='";
                if(contextNew.preliminary){
                    trContent += "summand-cell";
                }else{
                    trContent += "candidate-cell";
                }
                trContent += " important-cell' i=" + i + " j=" + j + 
                    " onmouseover='markPath(this)' onmouseout='unmarkPath(this)'>" + distance[i][j] + "</th>";
            }else{
                trContent += "<td class='";
                if(i != j && distance[i][j] != "∞"){
                    trContent += " number-cell ";
                } else{
                    trContent += " not-number-cell ";
                }
                trContent += " matrix-cell unimportant-cell' i=" + i + " j=" + j + 
                    " onmouseover='markPath(this)' onmouseout='unmarkPath(this)'>" + distance[i][j] + "</td>";
            }
        }
        table += "<tr class='table-row'>" + trContent + "<td>...</td></tr>";
    }
    table += "<tr class='table-row'>";
    for(var i = 0; i < limit + 1; i++){
        table += "<td>...</td>";
    }
    table += "</tr>";

    return table;
};

function displayMatrixSmall(distance, contextNew, nodes, markChanged){
    var cols = new Array();
    var rows = new Array();
    rows.push(contextNew.i);
    rows.push(contextNew.k);
    cols.push(contextNew.k);
    cols.push(contextNew.j);
    if(contextNew.i - 1 >= 0 && rows.indexOf(contextNew.i - 1) == -1){
        rows.push(contextNew.i - 1);
    }
    if(contextNew.i + 1 < distance.length && rows.indexOf(contextNew.i + 1) == -1){
        rows.push(contextNew.i + 1);
    }

    if(contextNew.k - 1 >= 0 && rows.indexOf(contextNew.k - 1) == -1){
        rows.push(contextNew.k - 1);
    }
    if(contextNew.k + 1 < distance.length && rows.indexOf(contextNew.k + 1) == -1){
        rows.push(contextNew.k + 1);
    }

    if(contextNew.j - 1 >= 0 && cols.indexOf(contextNew.j - 1) == -1){
        cols.push(contextNew.j - 1);
    }
    if(contextNew.j + 1 < distance.length && cols.indexOf(contextNew.j + 1) == -1){
        cols.push(contextNew.j + 1);
    }

    if(contextNew.k - 1 >= 0 && cols.indexOf(contextNew.k - 1) == -1){
        cols.push(contextNew.k - 1);
    }
    if(contextNew.k + 1 < distance.length && cols.indexOf(contextNew.k + 1) == -1){
        cols.push(contextNew.k + 1);
    }
    cols = cols.sort(function(a,b){return a - b});
    rows = rows.sort(function(a,b){return a - b});
    var rowCount = 1;
    var columnCount = 1;

    for(var i = 1; i < rows.length; i++){
        if(rows[i] - rows[i-1] > 1){
            rowCount++;
        }
        rowCount++;
    }
    for(var j = 1; j < cols.length; j++){
        if(cols[j] - cols[j-1] > 1){
            columnCount++;
        }
        columnCount++;
    }
    var table = "";
    var prevoiusRow = -1;
    var prevoiusCol = -1;
    table += "<tr><td></td>";
    for(var j = 0; j < cols.length; j++){
        if(cols[j] - prevoiusCol > 1){
            table += "<td>...</td>";
        }
        table += "<td class='node_label'>" + nodes[cols[j]].getLabel() + "</td>";
        prevoiusCol = cols[j];
    }
    if(cols[cols.length - 1] < distance.length - 1){
        table += "<td>...</td>";
    }
    table += "</tr>";
    for(var i = 0; i < rows.length; i++){
        if(rows[i] - prevoiusRow > 1){
            table += "<tr>"
            if(cols[0] > 0){
                table += "<td>...</td>"
            }
            for(var k = 0; k <= columnCount; k++){
                table += "<td>...</td>"
            }
            if(cols[cols.length - 1] < distance.length - 1){
                table += "<td>...</td>"
            }
            table += "</tr>";
        }

        prevoiusCol = -1;
        table += "<tr><td class='node_label'>" + nodes[rows[i]].getLabel() + "</td>";
        for(var j = 0; j < cols.length; j++){
            if(cols[j] - prevoiusCol > 1){
                table += "<td>...</td>";
            }
            if(contextNew && markChanged && rows[i] == contextNew.changedRow && cols[j] == contextNew.changedColumn){
                table += "<td class='";
                if(contextNew.preliminary){
                    table += "updated-cell";
                }else{
                    table += "candidate-cell";
                }
                table += "'>" + distance[rows[i]][cols[j]] + "</td>";
            }else if(contextNew && ((rows[i] == contextNew.i && cols[j] == contextNew.k) 
                || (rows[i] == contextNew.k && cols[j] == contextNew.j))){
                table += "<td class='";
                if(contextNew.preliminary){
                    table += "summand-cell";
                }else{
                    table += "candidate-cell";
                }
                table += "'>" + distance[rows[i]][cols[j]] + "</td>";
            }else{
                table += "<td"
                if(rows[i] != cols[j] && distance[rows[i]][cols[j]] != "∞"){
                    table += " class='number-cell'>";
                } else{
                    table += " class='not-number-cell'>";
                }
                table += distance[rows[i]][cols[j]] + "</td>";
            }
            prevoiusCol = cols[j];
        }
        if(cols[cols.length - 1] < distance.length - 1){
            table += "<td>...</td>";
        }
        table += "</tr>";
        prevoiusRow = rows[i];
    }
    prevoiusCol = -1;
    table += "<tr>";
    if(rows[rows.length - 1] < distance.length - 1){
        for(var j = 0; j < cols.length; j++){
            if(cols[j] - prevoiusCol > 1){
                table += "<td>...</td>";
            }
            table += "<td>...</td>";
            prevoiusCol = cols[j];
        }
        if(cols[cols.length - 1] < distance.length - 1){
            table += "<td>...</td>";
        }
    }
    if(cols[cols.length - 1] < distance.length - 1){
        table += "<td>...</td>";
    }
    table += "</tr>";
    return table;
};

function markPath(object){
    $(object).css("background-color", "#007C30");
    if(algo.paths[$(object).attr("i")][$(object).attr("j")]){
        var edges = algo.paths[$(object).attr("i")][$(object).attr("j")].split(",");
        for(var i = 0; i < edges.length; i++){
            algo.graph.edges[edges[i]].setLayout("lineColor", "#007C30");
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

function showMatrixPopup(){
    $("#" + prefix + "_div_completeMatrix").dialog("open");
    $("#" + prefix + "_div_completeMatrix").html("<table id='matrix-display'>" + table + "</table>");
    $("#" + prefix + "_div_completeMatrix").css("width", (distanceMatrix.length + 1)*18 + "px");
    $("#" + prefix + "_div_completeMatrix").css("max-width", "476px");
    $("#" + prefix + "_div_completeMatrix").css("margin-bottom", "-10px");
    $("#matrix-display").css("width", (distanceMatrix.length + 1)*18 + "px");
    $("#matrix-display").css("max-width", "476px");
    $("[aria-describedby='ta_div_completeMatrix']").css("width", (24+(distanceMatrix.length + 1)*18) + "px");
    $("[aria-describedby='ta_div_completeMatrix']").css("height", (106+(distanceMatrix.length + 1)*18) + "px");
    $("[aria-describedby='ta_div_completeMatrix']").css("max-width", "500px");
    if((distanceMatrix.length + 1)*18 < 500){
        $("[aria-describedby='ta_div_completeMatrix']").css("left", $( document ).width()-(24+(distanceMatrix.length + 1)*18) + "px");
    }else{
        $("[aria-describedby='ta_div_completeMatrix']").css("left", $( document ).width()-500 + "px");
    }
    $("[aria-describedby='ta_div_completeMatrix']").css("top", "0px");
    $("#matrix-display td").removeAttr("onmouseover onmouseout").removeClass("not-number-cell candidate-cell summand-cell updated-cell");
    $(window).scrollTop(0);
    return;
};