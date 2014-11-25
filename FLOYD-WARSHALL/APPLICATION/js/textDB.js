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
                if(distance.length > 13){
                    tableSmall = displayMatrixCorner(distance, contextNew, nodes, false, 10);
                    $("#ta_div_statusText").append("<table id='matrix'>" + tableSmall + "</table>");
                }else{
                    $("#tg_button_showMatrix").hide();
                    $("#ta_div_statusText").append("<h3>Die Originalmatrix sieht so aus:</h3><table id='matrix'>" + table + "</table>");
                }
            };
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
            if(distance.length > 13){
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
            $("#" + tabprefix + "_div_statusText").html("<h3>Ende des Algorithmus</h3>");
            if (tabprefix === "ta") {
                $("#ta_div_statusText").append("<p>Nun wurden alle kürzesten beziehungsweise günstigsten Wege berechnet.</p>");
                table = displayMatrix(distance, contextNew, nodes, false);
                if(distance.length > 13){
                    tableSmall = displayMatrixCorner(distance, contextNew, nodes, false, 10);
                    $("#ta_div_statusText").append("<table id='matrix'>" + tableSmall + "</table>");
                }else{
                    $("#ta_div_statusText").append("<h3>Die Endmatrix sieht so aus:</h3><table id='matrix'>" + table + "</table>");
                }
                $("#table_div").scrollLeft(0);
                $("#table_div").scrollTop(0);
                $(".not-number-cell").css("color", "black");
            };
            $(".marked").removeClass("marked");
            $("#" + tabprefix + "_p_l13").addClass("marked");
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
                table += "<th class='matrix-cell' i=" + i + " j=" + j + 
                    " onmouseover='markPath(this)' onmouseout='unmarkPath(this)'><font color='red'>" + distance[i][j] + "</font></th>";
                scrollPositionI = i;
                scrollPositionJ = j;
            } else{
                table += "<td class='matrix-cell' i=" + i + " j=" + j + 
                    " onmouseover='markPath(this)' onmouseout='unmarkPath(this)'>" + distance[i][j] + "</td>";
            }
        }
        table += '</tr>';
    }
    table += '</table></div></td></tr></table>';*/

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
        var displayNeeded = false;
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
    console.log(rows);
    console.log(cols);
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

function adjustTable(matrixLength){
    var rows = new Array();
    var cols = new Array();
    var spacingVertical = 0;
    var spacingHorizontal = 0;
    $(".important-cell").each(function(){
        var col = $(this).parent().children().index($(this));
        var row = $(this).parent().parent().children().index($(this).parent());
        
        cols.push(col);
        if(col - 1 < 1){
            cols.push(col + 2);
        }else{
            cols.push(col - 1);
        }
        if(col + 1 > matrixLength){
            cols.push(col - 2);
        }else{
            cols.push(col + 1);
        }

        rows.push(row);
        if(row - 1 < 1){
            rows.push(row + 2);
        }else{
            rows.push(row - 1);
        }
        if(row + 1 > matrixLength){
            rows.push(row - 2);
        }else{
            rows.push(row + 1);
        }
        // $("#matrix tr:eq(0) td:eq(" + (col) + ")").removeClass("unimportant-cell").addClass("important-cell");
        // $("#matrix tr:eq(" + row + ") td:eq(0)").removeClass("unimportant-cell").addClass("important-cell");
        // $("#matrix tr:eq(" + row + ")").removeClass("table-row");
        // console.log("row="+row+"col="+col);    
    });
    console.log("rows");
    console.log(rows);
    console.log("cols");
    console.log(cols);

    if(Math.abs(rows[1] - rows[0]) > Math.abs(rows[2] - rows[1])){
        spacingVertical = Math.abs(rows[1] - rows[0]);
    }else{
        spacingVertical = Math.abs(rows[2] - rows[1]);
    }

    if(Math.abs(cols[1] - cols[0]) > Math.abs(cols[2] - cols[1])){
        spacingHorizontal = Math.abs(cols[1] - cols[0]);
    }else{
        spacingHorizontal = Math.abs(cols[2] - cols[1]);
    }



    for(var i in rows){
        $("#matrix tr:eq(" + rows[i] + ") td:eq(0)").removeClass("unimportant-cell").addClass("important-cell");
        $("#matrix tr:eq(" + rows[i] + ")").removeClass("table-row");
        for(var j in cols){
            $("#matrix tr:eq(0) td:eq(" + (cols[j]) + ")").removeClass("unimportant-cell").addClass("important-cell");
            $("#matrix tr:eq(" + rows[i] + ") td:eq(" + cols[j] + ")").removeClass("unimportant-cell").addClass("important-cell");
            // if(rows[i] - 1 < 1){
            //     $("#matrix tr:eq(" + (rows[i] + 2) + ") td:eq(" + cols[j] + ")").removeClass("unimportant-cell").addClass("important-cell");
            // }else{
            //     $("#matrix tr:eq(" + (rows[i] - 1) + ") td:eq(" + cols[j] + ")").removeClass("unimportant-cell").addClass("important-cell");
            // }
            // if(rows[i] + 1 > matrixLength){
            //     $("#matrix tr:eq(" + (rows[i] - 2) + ") td:eq(" + cols[j] + ")").removeClass("unimportant-cell").addClass("important-cell");
            // }else{
            //     $("#matrix tr:eq(" + (rows[i] - 1) + ") td:eq(" + cols[j] + ")").removeClass("unimportant-cell").addClass("important-cell");
            // }

            // if(cols[j] - 1 < 1){
            //     $("#matrix tr:eq(" + rows[i] + ") td:eq(" + (cols[j] + 2) + ")").removeClass("unimportant-cell").addClass("important-cell");
            // }else{
            //     $("#matrix tr:eq(" + rows[i] + ") td:eq(" + (cols[j] - 1) + ")").removeClass("unimportant-cell").addClass("important-cell");
            // }
            // if(cols[j] + 1 > matrixLength){
            //     $("#matrix tr:eq(" + rows[i] + ") td:eq(" + (cols[j] - 2) + ")").removeClass("unimportant-cell").addClass("important-cell");
            // }else{
            //     $("#matrix tr:eq(" + rows[i] + ") td:eq(" + (cols[j] - 1) + ")").removeClass("unimportant-cell").addClass("important-cell");
            // }
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
    // $("#matrix-overlay").css("display", "block");
    // $("#matrix-container").html("<table id='matrix-display'>" + table + "</table>");
    // $("#matrix-display td").removeAttr("onmouseover");
    // $("#matrix-display td").removeAttr("onmouseout");
    $("#ta_div_completeMatrix").dialog("open");
    $("#ta_div_completeMatrix").html("<table id='matrix-display'>" + table + "</table>");
    $("#ta_div_completeMatrix").css("width", (distanceMatrix.length + 1)*18 + "px");
    $("#ta_div_completeMatrix").css("max-width", "476px");
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

// function hideMatrixPopup(){
//     $("#matrix-container").html();
//     $("#matrix-overlay").css("display", "none");
//     return;
// };