function showLabels(lx, ly){
    for(var i = 0; i < ly.length; i++){
        $("body").data("graph").nodes[i].setLabel(ly[i]);
    }

    for(var i = 0; i < lx.length; i++){
        $("body").data("graph").nodes[ly.length + i].setLabel(lx[i]);
    }
}

function showTreeRoot(S, offset){
    for(var i = 0; i < S.length; i++){
        if(S[i] == true) {
            $("body").data("graph").nodes[offset + i].setLayout("fillStyle", const_Colors.NodeFillingHighlight);
        }
    }
}