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
function CanvasDrawMethods() {
};

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
CanvasDrawMethods.drawArrow = function (ctx, layout, source, target, control, label, additionalLabel, dashed) {
    if (dashed) {
        ctx.setLineDash([10]);
    }
    // Linie zeichnen
    if (control != null) CanvasDrawMethods.drawCurve(ctx, layout, source, target, control);
    else CanvasDrawMethods.drawLine(ctx, layout, source, target);
    var arrowHeadColor = layout.lineColor;

    if (layout.isHighlighted) {
        arrowHeadColor = const_Colors.EdgeHighlight3;
    }
    ctx.setLineDash([0]);
    // Pfeilkopf zeichnen
    ctx.beginPath();
    ctx.strokeStyle = arrowHeadColor;
    var center;
    if (control == null) center = {x: (target.x + source.x) / 2, y: (target.y + source.y) / 2};
    else center = this.getQuadraticCurvePoint(source.x, source.y, control.x, control.y, target.x, target.y, 0.5);
    var edgeAngle = Math.atan2(target.y - source.y, target.x - source.x);
    var arrowStart = {
        x: center.x + Math.cos(edgeAngle) * layout.arrowHeadLength / 2,
        y: center.y + Math.sin(edgeAngle) * layout.arrowHeadLength / 2
    };
    var lineAngle1 = Math.atan2(target.y - source.y, target.x - source.x)
        + layout.arrowAngle + Math.PI;	// Winkel des rechten Pfeilkopfs relativ zum Nullpunkt
    var lineAngle2 = Math.atan2(target.y - source.y, target.x - source.x)
        - layout.arrowAngle + Math.PI;	// Winkel des linken Pfeilkopfs relativ zum Nullpunkt
    ctx.moveTo(arrowStart.x, arrowStart.y);
    ctx.lineTo(arrowStart.x + Math.cos(lineAngle1) * layout.arrowHeadLength, arrowStart.y + Math.sin(lineAngle1) * layout.arrowHeadLength);
    ctx.stroke();
    ctx.moveTo(arrowStart.x, arrowStart.y);
    ctx.lineTo(arrowStart.x + Math.cos(lineAngle2) * layout.arrowHeadLength, arrowStart.y + Math.sin(lineAngle2) * layout.arrowHeadLength);
    ctx.stroke();
    if (layout.isHighlighted) {
        var thirtyPercent = {
            x: 0.3 * target.x + 0.7 * source.x,
            y: 0.3 * target.y + 0.7 * source.y
        };
        CanvasDrawMethods.drawLine(ctx, {
            lineColor: arrowHeadColor,
            lineWidth: layout.lineWidth
        }, thirtyPercent, arrowStart);
    }
    if (label) {
        if (control == null) {
            if (source.x * target.y - target.x * source.y >= 0) {
                CanvasDrawMethods.drawTextOnLine(ctx, layout, target, source, label);
            }
            else CanvasDrawMethods.drawTextOnLine(ctx, layout, source, target, label);
        }
        else {
            //finde zwei Punkte auf der Kante nahe dem Mittelpunkt
            var p1 = this.getQuadraticCurvePoint(source.x, source.y, control.x, control.y, target.x, target.y, 0.45);
            var p2 = this.getQuadraticCurvePoint(source.x, source.y, control.x, control.y, target.x, target.y, 0.55);
            //pruefe Orientierung, schreibe den Text nur ueber die Kante und nicht darunter
            if (source.x * target.y - target.x * source.y >= 0) { //ausnutzung von Kreuzprodukt-Eigenschaften
                var tmp = p1;
                p1 = p2;
                p2 = tmp;
            }
            CanvasDrawMethods.drawTextOnLine(ctx, layout, p1, p2, label);
        }
    }
    if (additionalLabel) {
        //finde zwei Punkte auf der Kante nahe dem Mittelpunkt
        var p1 = this.getQuadraticCurvePoint(source.x, source.y, control.x, control.y, target.x, target.y, 0.45);
        var p2 = this.getQuadraticCurvePoint(source.x, source.y, control.x, control.y, target.x, target.y, 0.55);
        CanvasDrawMethods.drawAdditionalTextOnLine(ctx, layout, p1, p2, additionalLabel);
    }
};

CanvasDrawMethods.drawDashedArrow = function (ctx, layout, source, target, control, label, additionalLabel) {
    ctx.setLineDash([10]);
    this.drawArrow(ctx, layout, source, target, control, label, additionalLabel);
    ctx.setLineDash([0]);
};


/**
 * Zeichnet einen Linie in 2D
 * @param {Object} ctx           2dContext des Canvas
 * @param {Object} layout        Layout der Linie
 * @param {Object} source        Koordinaten des Ausgangspunkts
 * @param {Object} target        Koordinaten des Zielpunkts
 */
CanvasDrawMethods.drawCurve = function (ctx, layout, source, target, control, dashed) {
    if (dashed) {
        ctx.setLineDash([10]);
    }
    if(control == null){
        this.drawLine(ctx, layout, source, target, control, dashed);
    }
    else{
        // Linie zeichnen
        ctx.beginPath();
        ctx.moveTo(source.x, source.y);
        ctx.quadraticCurveTo(control.x, control.y, target.x, target.y);
        ctx.lineTo(target.x, target.y);
        ctx.strokeStyle = layout.lineColor;
        ctx.lineWidth = layout.lineWidth;
        ctx.stroke();
    }
    ctx.setLineDash([0]);

};
CanvasDrawMethods.drawLine = function (ctx, layout, source, target, dashed) {
    if (dashed) {
        ctx.setLineDash([10]);
    }
    // Linie zeichnen
    ctx.beginPath();
    ctx.moveTo(source.x, source.y);
    ctx.lineTo(target.x, target.y);
    ctx.strokeStyle = layout.lineColor;
    ctx.lineWidth = layout.lineWidth;
    ctx.stroke();
    ctx.setLineDash([0]);
};

CanvasDrawMethods.drawDashedLine = function (ctx, layout, source, target) {
    ctx.setLineDash([10]);
    this.drawLine(ctx, layout, source, target);
    ctx.setLineDash([0]);
};
CanvasDrawMethods.drawDashedCurve = function (ctx, layout, source, target, control) {
    ctx.setLineDash([10]);
    this.drawCurve(ctx, layout, source, target, control);
    ctx.setLineDash([0]);
};

function getQBezierValue(t, p1, p2, p3) {
    var iT = 1 - t;
    return iT * iT * p1 + 2 * iT * t * p2 + t * t * p3;
}

CanvasDrawMethods.getQuadraticCurvePoint = function (startX, startY, cpX, cpY, endX, endY, position) {
    return {
        x: getQBezierValue(position, startX, cpX, endX),
        y: getQBezierValue(position, startY, cpY, endY)
    };
}

/**
 * Zeichnet einen Text auf eine Linie.
 * Der Text wird ensprechend gedreht.
 * @param {Object} ctx           2dContext des Canvas
 * @param {Object} layout        Layout des Pfeils
 * @param {Object} source        Koordinaten des Ausgangspunkts
 * @param {Object} target        Koordinaten des Zielpunkts
 * @param {String} label         Text
 */
CanvasDrawMethods.drawTextOnLine = function (ctx, layout, source, target, label) {
    ctx.save();								// Aktuellen Zustand speichern (vor den Transformationen)
    ctx.font = layout.fontSize.toString() + "px " + layout.font;
    var arrowHeight = Math.sin(layout.arrowAngle) * layout.arrowHeadLength;
    var arrowWidth = Math.cos(layout.arrowAngle) * layout.arrowHeadLength;
    var labelMeasure = ctx.measureText(label);
    var alpha = Math.atan2(target.y - source.y, target.x - source.x);
    var center = {x: (target.x + source.x) / 2, y: (target.y + source.y) / 2};
    ctx.translate(center.x, center.y);
    ctx.rotate(alpha);
    if (Math.abs(alpha) > Math.PI / 2) {					// Verhindere, dass Text auf dem Kopf angezeigt wird.
        ctx.translate(0, layout.fontSize / 2);				// Gehe in die Mitte des Texts
        ctx.rotate(Math.PI);				// Rotiere um 180 Grad
        ctx.fillText(label, -arrowWidth / 2, layout.fontSize + 3 + layout.lineWidth + arrowHeight);		// Schreibe Text an Position
    }
    else {
        ctx.fillText(label, -labelMeasure.width / 2, -3 - arrowHeight);									// Verschriebung um 3, um nicht zu nah am Pfeil zu sein.
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
CanvasDrawMethods.drawAdditionalTextOnLine = function (ctx, layout, source, target, label) {
    ctx.save();								// Aktuellen Zustand speichern (vor den Transformationen)
    ctx.font = layout.fontSize.toString() + "px " + layout.font;
    ctx.fillStyle = layout.lineColor;
    ctx.strokeStyle = layout.lineColor;
    var arrowHeight = Math.sin(layout.arrowAngle) * layout.arrowHeadLength;
    var arrowWidth = Math.cos(layout.arrowAngle) * layout.arrowHeadLength;
    var labelMeasure = ctx.measureText(label);
    var alpha = Math.atan2(target.y - source.y, target.x - source.x);
    var viertel = {x: 0.25 * target.x + 0.75 * source.x, y: 0.25 * target.y + 0.75 * source.y};
    ctx.translate(viertel.x, viertel.y);
    ctx.rotate(alpha);
    if (Math.abs(alpha) > Math.PI / 2) {			// Verhindere, dass Text auf dem Kopf angezeigt wird.
        ctx.translate(0, layout.fontSize / 2);		// Gehe in die Mitte des Texts
        ctx.rotate(Math.PI);				// Rotiere um 180 Grad
        ctx.fillText(label, -labelMeasure.width / 2, layout.fontSize + 3 + layout.lineWidth + arrowHeight);		// Schreibe Text an Position
        ctx.beginPath();
        ctx.arc(0, layout.fontSize / 2 + 6 + layout.lineWidth + arrowHeight, 0.8 * layout.fontSize, 0, Math.PI * 2, true);
    }
    else {
        ctx.fillText(label, -labelMeasure.width / 2, -layout.fontSize + 12 - layout.lineWidth - arrowHeight);		// Schreibe Text an Position
        ctx.beginPath();
        ctx.arc(0, -layout.fontSize / 2 - layout.lineWidth - arrowHeight, 0.8 * layout.fontSize, 0, Math.PI * 2, true);
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

CanvasDrawMethods.drawDisk = function (ctx, position, layout, label) {
    ctx.beginPath();
    // Zeichne Füllung
    ctx.fillStyle = layout.fillStyle;
    ctx.arc(position.x, position.y, layout.nodeRadius, 0, Math.PI * 2, true);
    ctx.fill();
    // Zeichne Rand
    ctx.lineWidth = layout.borderWidth;
    ctx.strokeStyle = layout.borderColor;
    ctx.stroke();
    // Zeichne NodeID in den Knoten
    ctx.fillStyle = layout.fontColor;
    ctx.font = layout.font + " " + layout.fontSize.toString() + "px sans-serif";
    // Text sollte maximal so breit sein, dass er in den Knoten passt.
    var labelMeasure = Math.min(ctx.measureText(label).width, layout.nodeRadius * 1.7);
    ctx.fillText(label, position.x - labelMeasure / 2, position.y + layout.nodeRadius - layout.borderWidth - layout.fontSize / 2, layout.nodeRadius * 1.7);
};