function showLabels(lx, ly){
    for(var i = 0; i < lx.length; i++){
        $("body").data("graph").nodes[i].setLabel(lx[i]);
    }

    for(var i = 0; i < ly.length; i++){
        $("body").data("graph").nodes[lx.length + i].setLabel(ly[i]);
    }

    showEqualityGraph(lx, ly);
}

function showEqualityGraph(lx, ly){
    for (var edge in $("body").data("graph").edges) {
        if (lx[$("body").data("graph").edges[edge].getSourceID()] +
            ly[$("body").data("graph").edges[edge].getTargetID() - lx.length]
            == $("body").data("graph").edges[edge].weight) {

            if($("body").data("graph").edges[edge].originalColor != "green"){
                $("body").data("graph").edges[edge].originalColor = "black";
            }
            $("body").data("graph").edges[edge].setLayout("lineColor", $("body").data("graph").edges[edge].originalColor);
            $("body").data("graph").edges[edge].setLayout("lineWidth", 3);
        }else{
            $("body").data("graph").edges[edge].setLayout("lineColor", "grey");
            $("body").data("graph").edges[edge].setLayout("lineWidth", 1);
        }
    }
}

function showTreeRoot(S){
    resetNodeLayout();
    for(var i = 0; i < S.length; i++){
        if(S[i] == true) {
            $("body").data("graph").nodes[i].setLayout("fillStyle", const_Colors.NodeFillingHighlight);
        }
    }

}

function showAugmentingPath(x, y, prev, xy, yx){
    var xyTemp = xy.slice();
    var yxTemp = yx.slice();
    var augmentingPath = new Array();
    for (var cx = x, cy = y, ty; cx != -2; cx = prev[cx], cy = ty) {
        ty = xyTemp[cx];
        yxTemp[cy] = cx;
        xyTemp[cx] = cy;
        augmentingPath[augmentingPath.length] = cy;
        augmentingPath[augmentingPath.length] = cx;
    }
    for(var i = 1; i < augmentingPath.length; i++){
        for(var edge in $("body").data("graph").edges){
            if((($("body").data("graph").edges[edge].getSourceID() == augmentingPath[i]
                && $("body").data("graph").edges[edge].getTargetID()-xy.length == augmentingPath[i-1]) && i%2==1) ||
                (($("body").data("graph").edges[edge].getSourceID() == augmentingPath[i-1]
                && $("body").data("graph").edges[edge].getTargetID()-xy.length == augmentingPath[i]) && i%2==0)){

                $("body").data("graph").edges[edge].setLayout("lineColor", const_Colors.EdgeHighlight1);
                $("body").data("graph").edges[edge].setLayout("lineWidth", 3);
            }
        }
    }
}

function resetEdgeLayout(){
    for(var edge in $("body").data("graph").edges){
        $("body").data("graph").edges[edge].setLayout("lineColor", $("body").data("graph").edges[edge].originalColor);
        $("body").data("graph").edges[edge].setLayout("dashed", $("body").data("graph").edges[edge].originalDashed);
        $("body").data("graph").edges[edge].setLayout("lineWidth", $("body").data("graph").edges[edge].originalWidth);
    }
}

function resetNodeLayout(){
    for(var i in $("body").data("graph").nodes){
        $("body").data("graph").nodes[i].setLayout("fillStyle", $("body").data("graph").nodes[i].originalFill);
        $("body").data("graph").nodes[i].setLayout("borderColor", $("body").data("graph").nodes[i].originalBorder);
    }
}

function showCurrentMatching(xy){
    for(var i in xy){
        for(var edge in $("body").data("graph").edges){
            if($("body").data("graph").edges[edge].getSourceID() == i
                && $("body").data("graph").edges[edge].getTargetID()-xy.length == xy[i]) {
                $("body").data("graph").edges[edge].setLayout("lineColor", "green");
                $("body").data("graph").edges[edge].originalColor = "green";
                $("body").data("graph").edges[edge].setLayout("lineWidth", 4);
            }else if(($("body").data("graph").edges[edge].getSourceID() == i
                || $("body").data("graph").edges[edge].getTargetID()-xy.length == xy[i])
                && $("body").data("graph").edges[edge].originalColor == "green"){
                $("body").data("graph").edges[edge].originalColor = "black";
                $("body").data("graph").edges[edge].setLayout("lineColor", "black");
            }
        }
    }
}

function displayST(S, T){
    var text = "S=[";
    var first = true;
    for(var i in S){
        if(S[i] == true) {
            $("body").data("graph").nodes[i].setLayout("borderColor", const_Colors.NodeBorderHighlight);
            if(first){
                first = false;
            }else{
                text += ", ";
            }
            text += (parseInt(i)+1);
        }
    }
    first = true;
    text += "], T=[";
    for(var i in T){
        if(T[i] == true){
            $("body").data("graph").nodes[S.length + parseInt(i)].setLayout("borderColor", const_Colors.NodeBorderHighlight);
            if(first){
                first = false;
            }else{
                text += ", ";
            }
            text += (parseInt(i)+1);
        }
    }
    text += "]";
    $("#ta_div_statusErklaerung").text(text);
    //TODO node borders
}