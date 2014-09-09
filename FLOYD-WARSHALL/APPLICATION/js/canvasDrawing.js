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
CanvasDrawMethods.drawArrow = function(ctx, layout, source, target, label, additionalLabel) {
    // Linie zeichnen
    console.log(ctx.lineTo);
    CanvasDrawMethods.drawLine(ctx, layout, source, target);
    var arrowHeadColor = layout.lineColor;

    if (layout.isHighlighted) {
        arrowHeadColor = const_Colors.EdgeHighlight3;
    }

    // Pfeilkopf zeichnen
    ctx.beginPath();
    ctx.strokeStyle = arrowHeadColor;
    var center = {
        x : (target.x + source.x) / 2,
        y : (target.y + source.y) / 2
    };
    var edgeAngle = Math.atan2(target.y - source.y, target.x - source.x);
    var arrowStart = {
        x : center.x + Math.cos(edgeAngle) * layout.arrowHeadLength / 2,
        y : center.y + Math.sin(edgeAngle) * layout.arrowHeadLength / 2
    };
    var lineAngle1 = Math.atan2(target.y - source.y, target.x - source.x) + layout.arrowAngle + Math.PI;
    // Winkel des rechten Pfeilkopfs relativ zum Nullpunkt
    var lineAngle2 = Math.atan2(target.y - source.y, target.x - source.x) - layout.arrowAngle + Math.PI;
    // Winkel des linken Pfeilkopfs relativ zum Nullpunkt
    ctx.moveTo(arrowStart.x, arrowStart.y);
    ctx.lineTo(arrowStart.x + Math.cos(lineAngle1) * layout.arrowHeadLength, arrowStart.y + Math.sin(lineAngle1) * layout.arrowHeadLength);
    ctx.stroke();
    ctx.moveTo(arrowStart.x, arrowStart.y);
    ctx.lineTo(arrowStart.x + Math.cos(lineAngle2) * layout.arrowHeadLength, arrowStart.y + Math.sin(lineAngle2) * layout.arrowHeadLength);
    ctx.stroke();
    if (layout.isHighlighted) {
        var thirtyPercent = {
            x : 0.3 * target.x + 0.7 * source.x,
            y : 0.3 * target.y + 0.7 * source.y
        };
        CanvasDrawMethods.drawLine(ctx, {
            lineColor : arrowHeadColor,
            lineWidth : layout.lineWidth
        }, thirtyPercent, arrowStart);
    }
    if (label) {
        CanvasDrawMethods.drawTextOnLine(ctx, layout, source, target, label);
    }
    if (additionalLabel) {
        CanvasDrawMethods.drawAdditionalTextOnLine(ctx, layout, source, target, additionalLabel);
    }
};

/**
 * Zeichnet einen Linie in 2D
 * @param {Object} ctx           2dContext des Canvas
 * @param {Object} layout        Layout der Linie
 * @param {Object} source        Koordinaten des Ausgangspunkts
 * @param {Object} target        Koordinaten des Zielpunkts
 */
CanvasDrawMethods.drawLine = function(ctx, layout, source, target) {
    // Linie zeichnen
    ctx.beginPath();
    ctx.moveTo(source.x, source.y);
    ctx.lineTo(target.x, target.y);
    ctx.strokeStyle = layout.lineColor;
    ctx.lineWidth = layout.lineWidth;
    ctx.stroke();
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
CanvasDrawMethods.drawTextOnLine = function(ctx, layout, source, target, label) {
    ctx.save();
    // Aktuellen Zustand speichern (vor den Transformationen)
    ctx.font = layout.fontSize.toString() + "px " + layout.font;
    ctx.fillStyle = layout.labelColor;
    var arrowHeight = Math.sin(layout.arrowAngle) * layout.arrowHeadLength;
    var arrowWidth = Math.cos(layout.arrowAngle) * layout.arrowHeadLength;
    var labelMeasure = ctx.measureText(label);
    var alpha = Math.atan2(target.y - source.y, target.x - source.x);
    var center = {
        x : (target.x + source.x) / 2,
        y : (target.y + source.y) / 2
    };
    ctx.translate(center.x, center.y);
    ctx.rotate(alpha);
    if (Math.abs(alpha) > Math.PI / 2) {// Verhindere, dass Text auf dem Kopf angezeigt wird.
        ctx.translate(0, layout.fontSize / 2);
        // Gehe in die Mitte des Texts
        ctx.rotate(Math.PI);
        // Rotiere um 180 Grad
        ctx.fillText(label, -arrowWidth / 2, layout.fontSize + 3 + layout.lineWidth + arrowHeight);
        // Schreibe Text an Position
    } else {
        ctx.fillText(label, -labelMeasure.width / 2, -3 - arrowHeight);
        // Verschriebung um 3, um nicht zu nah am Pfeil zu sein.
    }
    ctx.restore();
    // Ursprünglichen Zustand wiederherstellen.
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
CanvasDrawMethods.drawAdditionalTextOnLine = function(ctx, layout, source, target, label) {
    ctx.save();
    // Aktuellen Zustand speichern (vor den Transformationen)
    ctx.font = layout.fontSize.toString() + "px " + layout.font;
    ctx.fillStyle = layout.labelColor;
    ctx.strokeStyle = layout.labelColor;
    var arrowHeight = Math.sin(layout.arrowAngle) * layout.arrowHeadLength;
    var arrowWidth = Math.cos(layout.arrowAngle) * layout.arrowHeadLength;
    var labelMeasure = ctx.measureText(label);
    var alpha = Math.atan2(target.y - source.y, target.x - source.x);
    var threefourth = {
        x : 0.75 * target.x + 0.25 * source.x,
        y : 0.75 * target.y + 0.25 * source.y
    };
    ctx.translate(threefourth.x, threefourth.y);
    ctx.rotate(alpha);
    if (Math.abs(alpha) > Math.PI / 2) {// Verhindere, dass Text auf dem Kopf angezeigt wird.
        ctx.translate(0, layout.fontSize / 2);
        // Gehe in die Mitte des Texts
        ctx.rotate(Math.PI);
        // Rotiere um 180 Grad
        ctx.fillText(label, -labelMeasure.width / 2, layout.fontSize + 3 + layout.lineWidth + arrowHeight);
        // Schreibe Text an Position
        ctx.beginPath();
        ctx.arc(0, layout.fontSize / 2 + 6 + layout.lineWidth + arrowHeight, 0.8 * layout.fontSize, 0, Math.PI * 2, true);
    } else {
        ctx.fillText(label, -labelMeasure.width / 2, -layout.fontSize + 12 - layout.lineWidth - arrowHeight);
        // Schreibe Text an Position
        ctx.beginPath();
        ctx.arc(0, -layout.fontSize / 2 - layout.lineWidth - arrowHeight, 0.8 * layout.fontSize, 0, Math.PI * 2, true);
    }
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.restore();
    // Ursprünglichen Zustand wiederherstellen.
};

/**
 * Zeichnet einen gefüllten Kreis an gegebener Position.
 * In den Kreis kann ein Text geschrieben werden.
 * @param {Object} ctx           2dContext des Canvas.
 * @param {Object} position      Ort, an dem der Knoten erstellt werden soll.
 * @param {Object} layout        Aussehen des Knotens.
 * @param {String} label         Beschriftung des Knotens.
 */

CanvasDrawMethods.drawDisk = function(ctx, position, layout, label) {
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

/**
 * Zeichnet eine gefüllte Ellipse an gegebener Position.
 * In die Ellipse kann ein Text geschrieben werden.
 * @param {Object} ctx
 * @param {Object} position
 * @param {Object} layout
 * @param {String} label
 */

CanvasDrawMethods.drawEllipse = function(ctx, position, layout, label) {
    // Scaling (benötigt für Ellipse) für alle folgenden Shapes
    ctx.save();
    ctx.scale(1, 0.75);
    ctx.beginPath();
    // Zeichne Füllung
    ctx.fillStyle = layout.fillStyle;
    // y-Wert mit Kehrwert des Skalierungsfaktors multiplizieren, um Position der Ellipse auch in unskalierter Umgebung richtig zu setzen
    ctx.arc(position.x, position.y * (4 / 3), layout.nodeRadius + 10, 0, Math.PI * 2, false);
    ctx.fill();
    // Zeichne Rand
    ctx.lineWidth = layout.borderWidth;
    ctx.strokeStyle = layout.borderColor;
    ctx.stroke();
    ctx.closePath();
    // Scaling wieder auf default setzen
    ctx.restore();
    // Zeichne NodeID in den Knoten
    ctx.fillStyle = layout.fontColor;
    ctx.font = layout.font + " " + layout.fontSize.toString() + "px sans-serif";
    // Text sollte maximal so breit sein, dass er in den Knoten passt.
    var labelMeasure = Math.min(ctx.measureText(label).width, layout.nodeRadius * 1.7);
    ctx.fillText(label, position.x - labelMeasure / 2, position.y + layout.nodeRadius - layout.borderWidth - layout.fontSize / 2, layout.nodeRadius * 1.7);
};

/**
 * Zeichnet den Inhalt der Priority Queue bzw. die ersten 10 Elemente
 * @param {Object} ctx
 * @param {PriorityQueue} pqueue
 */
CanvasDrawMethods.drawPQ = function(ctx, pqueue) {
    var j = 0;
    // Zeilenzähler
    ctx.beginPath();
    ctx.fillStyle = '#0096FF';
    ctx.strokeStyle = '#444444';

    ctx.font = "18px Arial";

    var startY = 8;
    // Y-Höhe ab der PQ gezeichnet wird
    var breadth = 30;
    // Kastenbreite der PQ-Elemente
    var height = 30;
    // Kastenhöhe der PQ-Elemente
    var row = height + 10;
    // Abstand für nächste Reihe
    var offset = 8;
    // Abstand Kasten zu Rand horizontal
    var margin = 6;
    // Abstand Text zu Rand vertikal
    var elemNumber = 9;
    // Anzahl der PQ-Elemente pro Zeile

    if (pqueue.length() > 0 && pqueue.queue[0].getValue().getName() == "Start") {
        ctx.moveTo(offset, startY);
        ctx.lineTo(offset, startY + height);
        ctx.lineTo(offset + 2 * breadth, startY + height);
        ctx.lineTo(offset + 2 * breadth, startY);
        ctx.lineTo(offset, startY);

        ctx.fillText(pqueue.queue[0].getValue().getName(), 2 * offset, startY + 0.5 * height + margin);

    } else {
        for (var i = 0; i < Math.min(18, pqueue.length()); i++) {

            ctx.moveTo(offset + (i - j * elemNumber) * breadth, startY + j * row);
            ctx.lineTo(offset + (i - j * elemNumber) * breadth, startY + height + j * row);
            ctx.lineTo((i - j * elemNumber) * breadth + (breadth + offset), startY + height + j * row);
            ctx.lineTo((i - j * elemNumber) * breadth + (breadth + offset), startY + j * row);
            ctx.lineTo(offset + (i - j * elemNumber) * breadth, startY + j * row);

            var content = pqueue.queue[i].getValue().getName();
            ctx.fillText(content, 2 * offset + (breadth * (i - j * elemNumber)), startY + 0.5 * height + margin + j * row);

            if (i == 8) {
                j++;
                // zweite Zeile
            } else if (i == 17) {
                ctx.font = "24px Arial";
                ctx.fillText("...", offset, startY + 0.5 * height + 2 * row);
                // mehr als 10 Elemente
            }
            ;

        };
    };

    ctx.stroke();
    ctx.closePath();
};
