/**
 * @author Richard Stotz
 * Funktionen in dieser Datei werden dazu genutzt,
 * Formen auf das Canvas zu zeichnen
 */

/**
 * Klasse mit Funktionen, um den Graph auf das Canvas zu zeichnen.
 * Die Funktionen in dieser Klasse sind allesamt statisch
 * @class 
 */
function CanvasDrawMethods() {};

/**
 * Zeichnet einen Pfeil, wobei die Pfeilspitze in der Mitte ist.<br>
 * Falls der Pfeil als "Highlighted" gekennzeichnet ist wird, so wird ein kleinerer
 * Pfeil auf den großen Pfeil in anderer Farbe gezeichnet.
 * @param {Object} ctx              2dContext des Canvas
 * @param {Object} layout           Layout des Pfeils
 * @param {Object} source           Koordinaten des Ausgangspunkts
 * @param {Object} target           Koordinaten des Zielpunkts
 * @param {String} label            Text auf dem Pfeil
 * @param {String} additionalLabel  Zusatztext zu dem Pfeil
 */
CanvasDrawMethods.drawArrow = function(ctx,layout,source,target,label,additionalLabel) {
    // Linie zeichnen
    CanvasDrawMethods.drawLine(ctx,layout,source,target);
    var arrowHeadColor = layout.lineColor;

    if(layout.isHighlighted) {
        arrowHeadColor = const_Colors.EdgeHighlight3;
    }

    // Pfeilkopf zeichnen
    ctx.beginPath();
    ctx.strokeStyle = arrowHeadColor;
    var center = {x: (target.x+source.x)/2, y:(target.y+source.y)/2};
    var edgeAngle = Math.atan2(target.y-source.y,target.x-source.x);
    var arrowStart = {x:center.x+ Math.cos(edgeAngle)* layout.arrowHeadLength/2,y:center.y+ Math.sin(edgeAngle)* layout.arrowHeadLength/2};
    var lineAngle1 = Math.atan2(target.y-source.y,target.x-source.x)
            + layout.arrowAngle + Math.PI;	// Winkel des rechten Pfeilkopfs relativ zum Nullpunkt
    var lineAngle2 = Math.atan2(target.y-source.y,target.x-source.x)
            - layout.arrowAngle + Math.PI;	// Winkel des linken Pfeilkopfs relativ zum Nullpunkt
    ctx.moveTo(arrowStart.x, arrowStart.y);
    ctx.lineTo(arrowStart.x + Math.cos(lineAngle1) * layout.arrowHeadLength,arrowStart.y + Math.sin(lineAngle1) * layout.arrowHeadLength);
    ctx.stroke();
    ctx.moveTo(arrowStart.x, arrowStart.y);
    ctx.lineTo(arrowStart.x + Math.cos(lineAngle2) * layout.arrowHeadLength,arrowStart.y + Math.sin(lineAngle2) * layout.arrowHeadLength);
    ctx.stroke();
    if(layout.isHighlighted) {
        var thirtyPercent = {x: 0.3*target.x + 0.7*source.x,
                             y: 0.3*target.y + 0.7*source.y};
        CanvasDrawMethods.drawLine(ctx,{lineColor:arrowHeadColor, lineWidth:layout.lineWidth},thirtyPercent,arrowStart);
    }
    if(label) {
        CanvasDrawMethods.drawTextOnLine(ctx,layout,source,target,label);
    }
    if(additionalLabel) {
        CanvasDrawMethods.drawAdditionalTextOnLine(ctx,layout,source,target,additionalLabel);
    }
};

/**
 * Zeichnet einen Linie in 2D
 * @param {Object} ctx           2dContext des Canvas
 * @param {Object} layout        Layout der Linie
 * @param {Object} source        Koordinaten des Ausgangspunkts
 * @param {Object} target        Koordinaten des Zielpunkts
 */
CanvasDrawMethods.drawLine = function(ctx,layout,source,target) {
    // Linie zeichnen
    ctx.beginPath();
    ctx.moveTo(source.x, source.y);
    ctx.lineTo(target.x,target.y);
    ctx.strokeStyle = layout.lineColor;
    ctx.lineWidth = layout.lineWidth;
    ctx.stroke();
};

CanvasDrawMethods.drawDashedLine = function(ctx,layout,source,target) {
    ctx.setLineDash([10]);
    this.drawLine(ctx,layout,source,target);
    ctx.setLineDash([0]);
};
/**
 * Zeichnet einen Text auf eine Linie.
 * Der Text wird ensprechend gedreht.
 * @param {Object} ctx           2dContext des Canvas
 * @param {Object} layout        Layout des Pfeils
 * @param {Object} source        Koordinaten des Ausgangspunkts
 * @param {Object} target        Koordinaten des Zielpunkts
 * @param {String} label         Text
 */
CanvasDrawMethods.drawTextOnLine = function(ctx,layout,source,target,label,even,nodeCount,sourceNode) {
    ctx.save();								// Aktuellen Zustand speichern (vor den Transformationen)
    ctx.font = layout.fontSize.toString() +"px " +layout.font;
    if(layout.lineColor == const_Colors.grey){
        ctx.fillStyle = const_Colors.grey;
    }else{
        ctx.fillStyle = "black";
    }
    var labelMeasure = ctx.measureText(label);
    var alpha = Math.atan2(target.y-source.y,target.x-source.x);
    var center;
    var coefficient = sourceNode % 2 == 0 ? -(sourceNode/2) : (sourceNode+1)/2;
    if(sourceNode == 0) {
        coefficient = 0;
    }else if(sourceNode == 1){
        coefficient = 1;
    }
    var offset;
    //if((graph_constants.V_POSITION - graph_constants.U_POSITION - global_NodeLayout.nodeRadius*2)/nodeCount > 45){
    //    offset = 45;
    //}else{
        offset = (graph_constants.V_POSITION - graph_constants.U_POSITION - global_NodeLayout.nodeRadius*2)/(nodeCount*2);
    //}
    if(source.x > target.x){
        center ={
            x: source.x - (0.5*(source.x - target.x) + coefficient*offset/Math.abs(Math.tan(alpha))),
            y: source.y + (0.5*(target.y - source.y) + coefficient*offset)
        };
    }else{
        center ={
            x: source.x + (0.5*(target.x - source.x) + coefficient*offset/(Math.tan(alpha))),
            y: source.y + (0.5*(target.y - source.y) + coefficient*offset)
        };
    }
    ctx.translate(center.x, center.y);
    ctx.rotate(alpha - Math.PI / 2);
    if(Math.abs(alpha)>Math.PI/2) {
        ctx.fillText(label, 3, -layout.fontSize * Math.sin(Math.abs(alpha - Math.PI / 2)));
    }else{
        ctx.fillText(label, 3, 0);
    }
    ctx.restore();							// Ursprünglichen Zustand wiederherstellen.
};

/**
 * Zeichnet einen Zusatztext auf eine Linie.<br>
 * Der Text wird ensprechend gedreht und umkreist.
 * @param {Object} ctx           2dContext des Canvas
 * @param {Object} layout        Layout des Pfeils
 * @param {Object} source        Koordinaten des Ausgangspunkts
 * @param {Object} target        Koordinaten des Zielpunkts
 * @param {String} label         Text
 */
CanvasDrawMethods.drawAdditionalTextOnLine = function(ctx,layout,source,target,label) {
    ctx.save();								// Aktuellen Zustand speichern (vor den Transformationen)
    ctx.font = layout.fontSize.toString() +"px " +layout.font;
    ctx.fillStyle = layout.lineColor;
    ctx.strokeStyle = layout.lineColor;
    var arrowHeight = Math.sin(layout.arrowAngle)*layout.arrowHeadLength;
    var arrowWidth = Math.cos(layout.arrowAngle)*layout.arrowHeadLength;
    var labelMeasure = ctx.measureText(label);
    var alpha = Math.atan2(target.y-source.y,target.x-source.x);
    var viertel = {x: 0.25*target.x+0.75*source.x, y:0.25*target.y+0.75*source.y};
    ctx.translate(viertel.x, viertel.y);
    ctx.rotate(alpha);
    if(Math.abs(alpha)>Math.PI/2) {			// Verhindere, dass Text auf dem Kopf angezeigt wird.
        ctx.translate(0, layout.fontSize/2);		// Gehe in die Mitte des Texts 
        ctx.rotate(Math.PI);				// Rotiere um 180 Grad
        ctx.fillText(label, -labelMeasure.width/2, layout.fontSize+3+layout.lineWidth +arrowHeight);		// Schreibe Text an Position 
        ctx.beginPath();
        ctx.arc(0,layout.fontSize/2+6+layout.lineWidth +arrowHeight, 0.8*layout.fontSize, 0, Math.PI*2, true); 
    }
    else {
        ctx.fillText(label, -labelMeasure.width/2, -layout.fontSize+12-layout.lineWidth -arrowHeight);		// Schreibe Text an Position 
        ctx.beginPath();
        ctx.arc(0,-layout.fontSize/2-layout.lineWidth -arrowHeight, 0.8*layout.fontSize, 0, Math.PI*2, true); 
    }
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.restore();							// Ursprünglichen Zustand wiederherstellen.
};

/**
 * Zeichnet eine gefüllten Kreis an gegebener Position.
 * In den Kreis kann ein Text geschrieben werden.
 * @param {Object} ctx           2dContext des Canvas.
 * @param {Object} position      Ort, an dem der Knoten erstellt werden soll.
 * @param {Object} layout        Aussehen des Knotens.
 * @param {String} label         Beschriftung des Knotens.
 */

CanvasDrawMethods.drawDisk = function(ctx,position,layout,label) {
    ctx.beginPath();
    // Zeichne Füllung
    ctx.fillStyle =  layout.fillStyle;
    ctx.arc(position.x, position.y, layout.nodeRadius, 0, Math.PI*2, true); 
    ctx.fill();
    // Zeichne Rand
    ctx.lineWidth = layout.borderWidth;
    ctx.strokeStyle = layout.borderColor; 
    ctx.stroke();
    // Zeichne NodeID in den Knoten
    ctx.fillStyle = layout.fontColor; 
    ctx.font = layout.font + " " +layout.fontSize.toString() + "px sans-serif"; 
    // Text sollte maximal so breit sein, dass er in den Knoten passt.
    var labelMeasure = Math.min(ctx.measureText(label).width,layout.nodeRadius*1.7);
    ctx.fillText(label, position.x-labelMeasure/2, position.y+layout.nodeRadius-layout.borderWidth-layout.fontSize/2,layout.nodeRadius*1.7);
};

CanvasDrawMethods.drawDiskOuter = function(ctx,position,layout,label,outerLabel) {
    ctx.beginPath();
    // Zeichne Füllung
    ctx.fillStyle =  layout.fillStyle;
    ctx.arc(position.x, position.y, layout.nodeRadius, 0, Math.PI*2, true); 
    ctx.fill();
    // Zeichne Rand
    ctx.lineWidth = layout.borderWidth;
    ctx.strokeStyle = layout.borderColor; 
    ctx.stroke();
    // Zeichne NodeID in den Knoten
    ctx.fillStyle = layout.fontColor; 
    ctx.font = layout.font + " " +layout.fontSize.toString() + "px sans-serif"; 
    // Text sollte maximal so breit sein, dass er in den Knoten passt.
    var labelMeasure = Math.min(ctx.measureText(label).width,layout.nodeRadius*1.7);
    ctx.fillText(label, position.x-labelMeasure/2, position.y+layout.nodeRadius-layout.borderWidth-layout.fontSize/2,layout.nodeRadius*1.7);
    ctx.fillStyle = layout.borderColor; 
    var previousValue = ctx.textAlign;
    ctx.textAlign="center"; 
    if(position.y == graph_constants.U_POSITION) {
        ctx.fillText(outerLabel, position.x, position.y - (1.5 * layout.nodeRadius));
    }else{
        ctx.fillText(outerLabel, position.x, position.y + (2.1 *layout.nodeRadius));
    }
    ctx.textAlign = previousValue;
    

};