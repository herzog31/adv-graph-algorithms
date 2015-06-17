/**
 * @author Aleksejs Voroncovs
 * Text Management
 */

/********************************************** Erklärungstext / Anzeige in Pseudocode **********************************************/

/**
 * HTML Darstellung der Tabelle.
 * @type String
 */
var table;

/**
 * Lokale Kopie der Abstandsmatrix.
 * @type String
 */
var distanceMatrix;

/**
 * Lokale Kopie des Tabprefixes.
 * @type String
 */
var prefix;

/**
 * Zeige die Abstandsmatrix und passe Text in Erklärungs- und Pseudocodebereich an.
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
            $("#" + tabprefix + "_div_statusText").html("<p>" + LNG.K("textdb_msg_the") + " <strong>" + distance.length + "×"
                + distance.length + "</strong> " + LNG.K('textdb_msg_can_start') + "</p><p> " + LNG.K("textdb_msg_hover") + "</p>");
            table = displayMatrix(distance, contextNew, nodes, false);
            if(distance.length > 11){
                tableSmall = displayMatrixCorner(distance, contextNew, nodes, false, 0, 0, 10, true);
                $("#" + tabprefix + "_div_statusText").append(LNG.K('textdb_msg_original_matrix_big') + "<h3>" + LNG.K('textdb_msg_original_matrix') + "</h3><table id='matrix'>" + tableSmall + "</table>");
                $("#tg_button_showMatrix").show();
            }else{
                $("#tg_button_showMatrix").hide();
                $("#" + tabprefix + "_div_statusText").append("<h3>" + LNG.K('textdb_msg_original_matrix') + "</h3><table id='matrix'>" + table + "</table>");
            }
            $(".marked").removeClass("marked");
            $("#" + tabprefix + "_p_l2").addClass("marked");
            $("#" + tabprefix + "_p_l3").addClass("marked");
            $("#" + tabprefix + "_p_l4").addClass("marked");
            $("#" + tabprefix + "_p_l5").addClass("marked");
            break;

        case 2:
            table = displayMatrix(distance, contextNew, nodes,  true);
            var formula = "<p id='formula'>" + contextNew.formula + "</p>";
            $("#" + tabprefix + "_div_statusText").html("");
            if(algo.contextStack.length === 0){
                $("#" + tabprefix + "_div_statusText").append("<p>" + LNG.K("textdb_msg_first_step") + "</p>");
            }
            $("#" + tabprefix + "_div_statusText").append("<p>" + LNG.K("textdb_msg_path_length") + "<strong>(" + nodes[contextNew.i].getLabel() + ", " + nodes[contextNew.j].getLabel()
                + ")</strong>" + LNG.K("textdb_msg_minimal_value") + "<strong>(" + nodes[contextNew.i].getLabel() + ", " + nodes[contextNew.k].getLabel() + ")</strong>" + LNG.K("textdb_msg_and")
                + "<strong>(" + nodes[contextNew.k].getLabel() + ", " + nodes[contextNew.j].getLabel() + ")</strong>" + LNG.K("textdb_msg_calculated") + "</p>");
            $("#" + tabprefix + "_div_statusText").append(formula);
            $("#" + tabprefix + "_div_statusText").append("<p>" + LNG.K("textdb_msg_this_step") + "<strong>" + nodes[contextNew.i].getLabel() + "</strong> "
                + LNG.K("textdb_msg_and") + "<strong>" + nodes[contextNew.j].getLabel() + "</strong>" + LNG.K("textdb_msg_improved")
                + LNG.K("textdb_msg_new_path") + "<strong>(" + nodes[contextNew.i].getLabel() + ", " + nodes[contextNew.k].getLabel() + ")</strong>"
                + LNG.K("textdb_msg_and") + "<strong>(" + nodes[contextNew.k].getLabel() + ", " + nodes[contextNew.j].getLabel() + ")</strong>" + LNG.K("textdb_msg_cheaper")
                + "<strong>(" + nodes[contextNew.i].getLabel() + ", " + nodes[contextNew.j].getLabel() + ")</strong>." + "</p>");

            $("#" + tabprefix + "_div_statusText").append("<p>" + LNG.K("textdb_msg_hover") + "</p>");
            if(distance.length > 11){
                tableSmall = displayMatrixSmall(distance, contextNew, nodes,  true);
                $("#" + tabprefix + "_div_statusText").append("<table id='matrix'>" + tableSmall + "</table>");
            }else{
                $("#" + tabprefix + "_div_statusText").append("<table id='matrix'>" + table + "</table>");
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
                tableSmall = displayMatrixCorner(distance, contextNew, nodes, false, algo.startVertical, algo.startHorizontal, 10, false);
                $("#" + tabprefix + "_div_statusText").append("<table id='tableWrapper' style='margin-left: -20px;'><tr><td></td><td align='center'><div id='up' style='background-image: url(img/up.png);width: 60px;height: 30px;'></div></td><td></td></tr><tr><td><div id='left' style='background-image: url(img/left.png);width: 30px;height: 60px;'></div></td><td><table id='matrix'>" + tableSmall + "</table></td><td><div id='right' style='background-image: url(img/right.png); width: 30px; height: 60px'></div></td></tr><tr><td></td><td align='center'><div id='down' style='background-image: url(img/down.png);width: 60px;height: 30px;'></div></td><td></td></tr></table>");
                $("#tg_button_showMatrix").hide();
            }else{
                $("#" + tabprefix + "_div_statusText").append("<h3>" + LNG.K('textdb_msg_endmatrix') + "</h3><table id='matrix'>" + table + "</table>");
            }
            $("#table_div").scrollLeft(0);
            $("#table_div").scrollTop(0);
            $(".marked").removeClass("marked");
            $("#" + tabprefix + "_p_l13").addClass("marked");
            $("#" + tabprefix + "_td_i").html(distance.length);
            $("#" + tabprefix + "_td_j").html(distance.length);
            $("#" + tabprefix + "_td_k").html(distance.length);
            $("#right").on("click", function(){
                if(algo.startHorizontal + 20 < algo.distance.length) {
                    algo.startHorizontal += 10;
                }else{
                    algo.startHorizontal = algo.distance.length - 10;
                }
                tableSmall = displayMatrixCorner(distance, contextNew, nodes, false, algo.startVertical, algo.startHorizontal, 10, false);
                $("#matrix").html(tableSmall);
            });
            $("#left").on("click", function(){
                if(algo.startHorizontal - 10 >= 0) {
                    algo.startHorizontal -= 10;
                }else{
                    algo.startHorizontal = 0;
                }
                tableSmall = displayMatrixCorner(distance, contextNew, nodes, false, algo.startVertical, algo.startHorizontal, 10, false);
                console.log(tableSmall);
                $("#matrix").html(tableSmall);
            });
            $("#down").on("click", function(){
                if(algo.startVertical + 20 < algo.distance.length) {
                    algo.startVertical += 10;
                }else{
                    algo.startVertical = algo.distance.length - 10;
                }
                tableSmall = displayMatrixCorner(distance, contextNew, nodes, false, algo.startVertical, algo.startHorizontal, 10, false);
                $("#matrix").html(tableSmall);
            });
            $("#up").on("click", function(){
                if(algo.startVertical - 10 >= 0) {
                    algo.startVertical -= 10;
                }else{
                    algo.startVertical = 0;
                }
                tableSmall = displayMatrixCorner(distance, contextNew, nodes, false, algo.startVertical, algo.startHorizontal, 10, false);
                $("#matrix").html(tableSmall);
            });
            break;

        default:
            console.log("Fehlerhafte StatusID.");
    }

    if(contextNew) {
        $("#" + tabprefix + "_td_i").html(contextNew.i + 1);
        $("#" + tabprefix + "_td_j").html(contextNew.j + 1);
        $("#" + tabprefix + "_td_k  ").html(contextNew.k + 1);
    }
}

/**
 * Erstelle den HTML-Code der abgebildeten Tabelle.
 * @method
 * @param {Object} distance
 * @param {Object} contextNew
 * @param {Object} nodes
 * @param {Boolean} markChanged
 */
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
}


function displayMatrixCorner(distance, contextNew, nodes, markChanged, startVertical,
                             startHorizontal, limit, displayDots){
    var table = "<tr><td></td>";
    for(var key = startHorizontal; key < startHorizontal + limit; key++){
        table += "<td class='node_label unimportant-cell'>" + nodes[key].getLabel() + "</td>";
    }
    if(displayDots){
        table += "<td>...</td>";
    }
    table += "</tr>";
    var finalI, finalJ;
    for(var i = startVertical; i < startVertical + limit; i++){
        var trContent = "<td class='node_label unimportant-cell'>" + nodes[i].getLabel() + "</td>";
        for(var j = startHorizontal; j < startHorizontal + limit; j++){
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
        table += "<tr class='table-row'>" + trContent;
        if(displayDots){
            table += "<td>...</td>";
        }
        table += "</tr>";
    }
    if(displayDots) {
        table += "<tr class='table-row'>";
        for (var i = 0; i < limit + 1; i++) {
            table += "<td>...</td>";
        }
        table += "</tr>";
    }

    return table;
}

/**
 * Erstelle den HTML-Code der Ecke der abgebildeten Tabelle am Anfang des Algorithmus.
 * @method
 * @param {Object} distance
 * @param {Object} contextNew
 * @param {Object} nodes
 * @param {Boolean} markChanged
 */
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
                table += "<td onmouseover='markPath(this)' onmouseout='unmarkPath(this)' i='" + i + "' j='" + j + "' class='";
                if(contextNew.preliminary){
                    table += "updated-cell";
                }else{
                    table += "candidate-cell";
                }
                table += "'>" + distance[rows[i]][cols[j]] + "</td>";
            }else if(contextNew && ((rows[i] == contextNew.i && cols[j] == contextNew.k) 
                || (rows[i] == contextNew.k && cols[j] == contextNew.j))){
                table += "<td onmouseover='markPath(this)' onmouseout='unmarkPath(this)' i='" + i + "' j='" + j + "' class='";
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
}

/**
 * Markiere den aktuellen Pfad beim Hover-Event.
 * @method
 * @param {Object} object
 */
function markPath(object){
    var sourceNode = algo.graph.nodes[$(object).attr("i")],
        targetNode = algo.graph.nodes[$(object).attr("j")];
    sourceNode.setLayout("borderColor", "green");
    sourceNode.setLayout("borderWidth", 5);
    targetNode.setLayout("borderColor", "green");
    targetNode.setLayout("borderWidth", 5);
    $(object).css("background-color", "#007C30");
    if(algo.paths[$(object).attr("i")][$(object).attr("j")]){
        var edges = algo.paths[$(object).attr("i")][$(object).attr("j")].split(",");
        for(var i = 0; i < edges.length; i++){
            algo.graph.edges[edges[i]].setLayout("lineColor", "#007C30");
        }
        algo.needRedraw = true;
    }
}

/**
 * Lösche die Markierung des aktuellen Pfads.
 * @method
 * @param {Object} object
 */
function unmarkPath(object){
    var sourceNode = algo.graph.nodes[$(object).attr("i")],
        targetNode = algo.graph.nodes[$(object).attr("j")];
    sourceNode.setLayout("borderColor", const_Colors.NodeBorder);
    sourceNode.setLayout("borderWidth", 3);
    targetNode.setLayout("borderColor", const_Colors.NodeBorder);
    targetNode.setLayout("borderWidth", 3);
    $(object).css("background-color", "");
    for(var edge in algo.graph.edges){
        algo.graph.edges[edge].setLayout("lineColor", "black");
    }
    algo.needRedraw = true;
}

/**
 * Zeige die komplette Matrix im separaten Fenster.
 * @method
 */
function showMatrixPopup(){
    algo.stopFastForward();
    $("#" + prefix + "_div_completeMatrix").dialog("open");
    $("#" + prefix + "_div_completeMatrix").html("<table id='matrix-display'>" + table + "</table>");
    $("#" + prefix + "_div_completeMatrix").css("width", (distanceMatrix.length + 1)*18 + "px");
    $( "[aria-describedby='ta_div_completeMatrix']").resizable({ handles: 'w, s' });
    $("[aria-describedby='ta_div_completeMatrix']").css("overflow", "auto");
    $("[aria-describedby='ta_div_completeMatrix']").css("width", (44+(distanceMatrix.length + 1)*18) + "px");
    $("[aria-describedby='ta_div_completeMatrix']").css("left", $( document ).width()-(64+(distanceMatrix.length + 1)*18) + "px");
    $("[aria-describedby='ta_div_completeMatrix']").css("top", "20px");
    $("#matrix-display td").removeAttr("onmouseover onmouseout").removeClass("not-number-cell candidate-cell summand-cell updated-cell");
    $(window).scrollTop(0);
    return;
}