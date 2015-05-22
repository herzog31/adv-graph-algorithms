/**
 * @author Mark J. Becker
 * Hier wird der Graph und alle zugehörigen Fuktionen definiert.
 * Außerdem wird die Klasse GraphDrawer definiert, die es ermöglicht auf das Canvas zu zeichnen
 * Schließich werden einige globale Objekte definiert.
 */

/**
 * Die Farben, die im Projekt genutzt werden.
 * Aus dem TUM Styleguide.
 * @type Object 
 */
var const_Colors = {NodeFilling:            "#98C6EA",  // Pantone 283, 100%
                    NodeBorder:             "#0065BD",  // Pantone 300, 100%, "TUM-Blau"
                    NodeBorderHighlight:    "#C4071B",  // Helles Rot 100% aus TUM Styleguide
                    NodeFillingHighlight:   "#73B78D",  // Dunkelgrün 55 % aus TUM Styleguide
                    NodeFillingLight:       "#00c532",  // Dunkelgrün 55 % aus TUM Styleguide
                    NodeFillingQuestion:    "#C4071B",  // Helles Rot 100% aus TUM Styleguide
                    EdgeHighlight1:         "#C4071B",  // Helles Rot 100% aus TUM Styleguide
                    EdgeHighlight2:         "#73B78D",  // Dunkelgrün 55 % aus TUM Styleguide
                    EdgeHighlight3:         "#73B78D",  // Dunkelgrün 55 % aus TUM Styleguide
                    EdgeHighlight4:         "#007C30",  // Dunkelgrün 100 % aus TUM Styleguide
                    RedText:                "#C4071B",  // Helles Rot 100% aus TUM Styleguide
                    GreenText:              "#007C30"   // Dunkelgrün 100 % aus TUM Styleguide
                    };

/**
 * Standardgröße eines Knotens
 * @type Number
 */
var global_KnotenRadius = 15;                           // Radius der Knoten
/**
 * Standardaussehen einer Kante.
 * @type Object
 */
var global_Edgelayout = {'arrowAngle' : Math.PI/8,	         // Winkel des Pfeilkopfs relativ zum Pfeilkörper
			             'arrowHeadLength' : 15,             // Länge des Pfeilkopfs
                         'lineColor' : "black",		         // Farbe des Pfeils
			             'lineWidth' : 2,		             // Dicke des Pfeils
                         'font'	: 'Arial',		             // Schrifart 
                         'fontSize' : 14,		             // Schriftgrösse in Pixeln
                         'isHighlighted': false,             // Ob die Kante eine besondere Markierung haben soll
                         'progressArrow': false,             // Zusätzlicher Animationspfeil 
                         'progressArrowPosition': 0.0,       // Position des Animationspfeils
                         'progressArrowSource': null,        // Animationspfeil Source Knoten
                         'progressArrowTarget': null         // Animationspfeil Target Knoten
			};
                        
/**
 * Standardaussehen eines Knotens.
 * @type Object
 */
var global_NodeLayout = {'fillStyle' : const_Colors.NodeFilling,    // Farbe der Füllung
                         'nodeRadius' : 15,                         // Radius der Kreises
                         'borderColor' : const_Colors.NodeBorder,   // Farbe des Rands (ohne Markierung)
                         'borderWidth' : 2,                         // Breite des Rands
                         'fontColor' : 'black',                     // Farbe der Schrift
                         'font' : 'bold',                           // Schriftart
                         'fontSize' : 14                            // Schriftgrösse in Pixeln
                        };

/**
 * Knoten des Graphs.
 * 
 * @constructor
 * @param {Object} coordinates			Koordinaten des Knotens
 * @param {Number} nodeID			Eindeutige ID des Knotens (wird vom Graph vergeben).
 * @this {GraphNode}
 */
function GraphNode(coordinates,nodeID) {
    /**
     * Eindeutige ID des Knotens. Jeder ID kommt im Graph nur einmal vor
     * und ist der Schlüssel für das assoziative Array.
     * @type Number
     */
    var id = nodeID;
    /**
     * Die Koordinaten des Knotens
     * @type Object
     */
    var nodeC = coordinates;
    /**
     * Assoziatives Array der Kanten, die den Knoten verlassen.
     * Keys: IDs der ausgehenden Kanten
     * Values: (Pointer zu den) ausgehenden Kanten
     * @type Object
     */
    var outEdges = new Object();
    /**
     * Assoziatives Array der Kanten, die in den Knoten gehen.
     * Keys: IDs der eigehenden Kanten
     * Values: (Pointer zu den) eingehenden Kanten
     * @type Object
     */
    var inEdges = new Object();
    /**
     * Das Layout des Knotens, Standardmäßig eine Kopie des
     * Standardlayouts.
     * @type Object
     */
    var layout = jQuery.extend({}, global_NodeLayout);      // Kopie
    /**
     * Text im Knoten.
     * @type String
     */
    var label = null;


    this.getDegree = function() {
        return this.getInDegree() + this.getOutDegree();
    };

    this.getInDegree = function() {
        return Object.keys(inEdges).length;
    };

    this.getOutDegree = function() {
        return Object.keys(outEdges).length;
    };

    this.getUnvisitedDegree = function() {
        var degree = 0;

        for(var kantenID in inEdges) {
            if(!inEdges[kantenID].getVisited()) {
                degree++;
            }
        }

        for(var kantenID in outEdges) {
            if(!outEdges[kantenID].getVisited()) {
                degree++;
            }
        }

        return degree;

    };

    /**
    * @method
    * @return {Number} Gibt die NodeID zurück.
    */
    this.getNodeID = function() {
        return id;
    };
    /**
    * @method
    * @return {Object} Gibt die Koordinaten des Knotens zurück.
    */
    this.getCoordinates = function() {
        return nodeC;
    };
    /**
    * @method
    * @param {Object} coordinates Setzt die Koordinaten des Knotens.
    */
    this.setCoordinates = function(coordinates) {
        nodeC = coordinates;
        for(var kantenID in outEdges) {
            outEdges[kantenID].setSourceNodeCoordinates(nodeC);
        }
        for(var kantenID in inEdges) {
            inEdges[kantenID].setTargetNodeCoordinates(nodeC);
        }
    };
    /**
    * @method
    * @return {Object} Liste der Kanten, die von diesem Knoten ausgehen.
    */
    this.getOutEdges = function() {
        return outEdges;
    };
    /**
    * @method
    * @return {Object} Liste der Kanten, die zu diesem Knoten führen.
    */
    this.getInEdges = function() {
        return inEdges;
    };
    /**
    * Füge eine eingehende Kante hinzu.
    * @method
    * @param {Edge} edge Neue eingehende Kante.
    */
    this.addInEdge = function(edge) {
        inEdges[edge.getEdgeID()] = edge;
    };
    /**
    * Füge eine ausgehende Kante hinzu.
    * @method
    * @param {Edge} edge Neue ausgehende Kante.
    */
    this.addOutEdge = function(edge) {
        outEdges[edge.getEdgeID()] = edge;
    };
    /**
    * Entfernt eine eingehende Kante
    * @method
    * @param {number} edgeID ID der zu entfernenden Kante.
    */
    this.removeInEdge = function(edgeID) {
        delete inEdges[edgeID];
    };
    /**
    * Entfernt eine ausgehende Kante
    * @method
    * @param {number} edgeID ID der zu entfernenden Kante.
    */
    this.removeOutEdge = function(edgeID) {
        delete outEdges[edgeID];
    };

    /**
     * Gibt das Layout des Knotens zurück. 
     * Falls dieses nicht gesondert definiert wurde, ist es das Standardlayout
     * @method
     * @returns {Object} Layout des Knotens
     */
    this.getLayout = function() {
        return jQuery.extend(true, {},layout);
    };

    /**
     * Verändert das Aussehen des Knotens
     * @method
     * @param {String} parameter Parameter des Layouts, der verändert werden soll
     * @param {Object} newValue Neuer Wert für den Parameter
     */
    this.setLayout = function(parameter,newValue) {
        layout[parameter] = newValue;
    };

    this.setLayoutObject = function(layoutObject) {
        layout = layoutObject;
    };

    /**
     * Gibt den Namen des Knotens zurück.
     * Falls dieser nicht gesetzt wurde, wird die ID der Knotens zurückgegeben.
     * @method
     * @returns {String} Name des Knotens
     */
    this.getLabel = function() {
        if(label == null) {
            return "";
        }
        return label;
    };

    /**
     * Setzt einen Namen für den Knoten
     * @method
     * @param {String} newLabel Neuer Name des Knotens.
     */
    this.setLabel = function(newLabel) {
        label = newLabel;
    };

    /**
     * Setzt das Layout auf die Standardwerte zurück
     * @method
     */
    this.restoreLayout = function() {
        layout = jQuery.extend({}, global_NodeLayout);
    };
}

/**
 *  Zeichnet den Knoten in einem Kontext
 * 
 * @method
 * @param {Object} ctx					2DContext des Canvas
 * @this {GraphNode}
 */
GraphNode.prototype.draw = function(ctx) {
    CanvasDrawMethods.drawDisk(ctx,this.getCoordinates(),this.getLayout(),this.getLabel().toString());
};

/**
 * Zeigt, ob sich die gegebenen Koordinaten auf der Kante befinden.
 * @method
 * @param {Number} mx				x-Koordinate
 * @param {Number} my				y-Koordinate
 * @this {GraphNode}
 * @return {Boolean}
 */
GraphNode.prototype.contains = function(mx, my) {
    var coord = this.getCoordinates();
    var radius = this.getLayout().nodeRadius;
    return (mx-coord.x)*(mx-coord.x) + (my-coord.y)*(my-coord.y)<radius*radius;
};

/**
 * Kante des Graphen
 * @constructor
 * @param {GraphNode} sourceNode		Ausgangsknoten der Kante.
 * @param {GraphNode} targetNode		Zielknoten der Kante.
 * @param {Number} weight			Gewicht der Kante.
 * @param {Number} edgeID			Eindeutige ID der Kante (wird vom Graph vergeben).
 * @param {Boolean} directedEdge		Zeigt, ob die Kante gerichtet ist.
 * @this {Edge}
 */
function Edge(sourceNode,targetNode,weight,edgeID,directedEdge) {
    /**
     * Eindeutige ID der Kante. Jeder ID kommt im Graph nur einmal vor
     * und ist der Schlüssel für das assoziative Array der Kanten.
     * @type Number
     */
    var id = edgeID;
    /**
     * Zeigt an, ob die Kante gerichtet ist.
     * @type Boolean
     */
    var directed = directedEdge;
    /**
     * Pointer auf die Kante in entgegengesetzter Richtung
     * @type Number
     */
    var oppositeEdge = null;
    /**
     * ID des Quellknotens der Kante
     * @type Number
     */
    var sourceID = sourceNode.getNodeID();
    /**
     * ID des Zielknotens der Kante
     * @type Number
     */
    var targetID = targetNode.getNodeID();
    /**
     * Koordinaten des Quellknotens
     * @type Object
     */
    var sourceNodeCoordinates = sourceNode.getCoordinates();
    /**
     * Koordinaten des Zielknotens
     * @type Object
     */
    var targetNodeCoordinates = targetNode.getCoordinates();
    /**
     * Koordinaten des Anfangspunkts der Kante.
     * Falls für die Kante keine Kante in entgegengesetzter Richtung existiert,
     * so sind dies die Koordinaten des Quellknotens
     * @type Object
     */
    var sourceCoordinates = sourceNode.getCoordinates();
    /**
     * Koordinaten des Zielknotens der Kante.
     * Falls für die Kante keine Kante in entgegengesetzter Richtung existiert,
     * so sind dies die Koordinaten des Zielknotens
     * @type Object
     */
    var targetCoordinates = targetNode.getCoordinates();
    /**
     * Layout der Kante.
     * Standardmäßig eine Kopie des Standardlayouts
     * @type Object
     */
    var layout = jQuery.extend(true, {}, global_Edgelayout);

    /**
     * Wurde Kante schon besucht
     * @type {Boolean}
     */
    var visited = false;

    /**
     * Zusätzliches Label
     * @type {String}
     */
    var additionalLabel = false;

    /**
     * Gewicht der Kante.
     * @type Number
     */
    this.weight = weight;

    /**
     * @method
     * @param {Boolean} bool Setze Kante auf Besucht
     */
    this.setVisited = function(bool) {
        visited = bool;
    };

    /**
     * @method
     * @return {Boolean} Prüfe ob Kante besucht oder unbesucht
     */
    this.getVisited = function() {
        return visited;
    };

    /**
     * @method
     * @returns {Number} ID der Kante
     */
    this.getEdgeID = function() {
        return id;
    };
    /**
     * @method
     * @returns {Boolean} Zeigt, ob die Kante gerichtet ist.
     */
    this.getDirected = function() {
        return directed;
    };
    /**
     * @method
     * @returns {Number} ID des Ausgangsknotens
     */
    this.getSourceID = function() {
        return sourceID;
    };
    /**
     * @method
     * @returns {Number} ID des Zielknotens
     */
    this.getTargetID = function() {
        return targetID;
    };
    /**
     * @method
     * @returns {Number} ID der entgegengesetzten Kante
     */
    this.getOppositeEdgeID = function() {
        return oppositeEdge;
    };
    /**
     * Trage eine Kante als entgegengesetzte Kante ein.
     * @method
     * @param {Number} edgeID ID der entgegengesetzten Kante
     */
    this.setOppositeEdgeID = function(edgeID) {
        oppositeEdge = edgeID;
    };
    /**
     * Setze die Koordinaten des Anfangs der Kante
     * @method
     * @param {Object} coord Koordinaten des Anfangs der Kante
     * @param {Boolean} noShift Ob die Koordinaten verschoben werden sollen,
     * damit Kanten nicht überlappen
     */
    this.setSourceCoordinates = function(coord,noShift) {
        sourceCoordinates = coord;
        if(oppositeEdge && !noShift) {
            this.shift();
        }
    };
    /**
     * Setze die Koordinaten des Ziels der Kante
     * @method
     * @param {Object} coord Koordinaten des Ziels der Kante
     * @param {Boolean} noShift Ob die Koordinaten verschoben werden sollen,
     */
    this.setTargetCoordinates = function(coord,noShift) {
        targetCoordinates = coord;
        if(oppositeEdge && !noShift) {
            this.shift();
        }
    };
    /**
     * @method
     * @return {Object} sourceCoordinates Koordinaten des Anfangs der Kante
     */
    this.getSourceCoordinates = function() {
        return sourceCoordinates;
    };
    /**
     * @method
     * @return {Object} Koordinaten des Ziels der Kante
     */
    this.getTargetCoordinates = function() {
        return targetCoordinates;
    };
    /**
     * Setze die Koordinaten des Startknotens
     * @method
     * @param {Object} coord Koordinaten des Startknotens
     */
    this.setSourceNodeCoordinates = function(coord) {
        sourceNodeCoordinates = coord;
        this.setSourceCoordinates(coord);
    };
    /**
     * Setze die Koordinaten des Zielknotens
     * @method
     * @param {Object} coord Koordinaten des Zielknotens
     */
    this.setTargetNodeCoordinates = function(coord) {
        targetNodeCoordinates = coord;
        this.setTargetCoordinates(coord);
    };
    /**
     * @method
     * @return {Object} Koordinaten des Anfangs der Kante
     */
    this.getSourceNodeCoordinates = function() {
        return sourceNodeCoordinates;
    };
    /**
     * @method
     * @return {Object} Koordinaten des Ziels der Kante
     */
    this.getTargetNodeCoordinates = function() {
        return targetNodeCoordinates;
    };

    /**
     * @method
     * @param {String} label Zusätzliches Labek
     */
    this.setAdditionalLabel = function(label) {
        additionalLabel = label;
    };

    /**
     * @method
     * @return {String} Zusätzliches Label
     */
    this.getAdditionalLabel = function() {
        return additionalLabel;
    };

    /**
     * Gibt das Layout des Knotens zurück. 
     * Falls dieses nicht gesondert definiert wurde, ist es das Standardlayout
     * @returns {Object} Layout des Knotens
     */
    this.getLayout = function() {
        return jQuery.extend(true, {},layout);
    };

    this.setLayoutObject = function(layoutObject) {
        layout = layoutObject;
    };

    /**
     * Verändert das Aussehen des Knotens
     * @param {String} parameter Parameter des Layouts, der verändert werden soll
     * @param {Object} newValue Neuer Wert für den Parameter
     */
    this.setLayout = function(parameter,newValue) {
        layout[parameter] = newValue;
    };

    /**
     * Gibt den Status des Felds "isHighlighted" an, der z.B. für die 
     * Markierung der Vorgängerkanten genutzt werden kann.
     * @method
     * @returns {Boolean} Zeigt an, ob die Kante besonders markiert ist.
     */
    this.isHightlighted = function(){
        return layout.isHighlighted;
    };

    /**
     * Setzt das Feld "isHighlighted" auf einen boolschen Wert.
     * @param {Boolean} bool Neuer Wert für das Feld isHighlighted
     * @method
     */
    this.setHighlighted = function(bool){
        layout.isHighlighted = bool;
    };

    /**
     * Setzt das Layout auf die Standardwerte zurück
     * @method
     */
    this.restoreLayout = function() {
        layout = jQuery.extend({}, global_Edgelayout);
    };
}

/**
 * Zeichnet die Kante in den gegebenen Kontext.
 * @param {Object} ctx				2dContext des Canvas.
 * @this {Edge}
 * @method
 */
Edge.prototype.draw = function(ctx) {
    if(this.getDirected()) {
        CanvasDrawMethods.drawArrow(ctx, this.getLayout(), this.getSourceCoordinates(), this.getTargetCoordinates());
        if(this.getAdditionalLabel() !== false) {
            CanvasDrawMethods.drawTextOnLine(ctx, this.getLayout(), this.getSourceCoordinates(), this.getTargetCoordinates(), this.getAdditionalLabel());
        }
    }else{
        CanvasDrawMethods.drawLine(ctx, this.getLayout(), this.getSourceCoordinates(), this.getTargetCoordinates());
        if(this.getAdditionalLabel() !== false) {
            CanvasDrawMethods.drawTextOnLine(ctx, this.getLayout(), this.getSourceCoordinates(), this.getTargetCoordinates(), this.getAdditionalLabel());
        }
    }
    if(this.getLayout()['progressArrow']) {
        CanvasDrawMethods.drawArrowAtPosition(ctx, this.getLayout(), this.getLayout()['progressArrowSource'], this.getLayout()['progressArrowTarget']);
    }
};

/**
 * Zeigt, ob sich die gegebenen Koordinaten auf der Kante befinden.
 * Es wird geprüft ob der Mausklick nah genug (innerhalb einer Toleranz) an der Kante war.
 * @param {Number} mx				x-Koordinate
 * @param {Number} my				y-Koordinate
 * @param {Object} ctx				Kontext des aktuellen Canvas
 * @this {Edge}
 * @returns {Boolean}
 * @method
 */
Edge.prototype.contains = function(mx,my,ctx) {
    var toleranz = 7;									// Wie viele Punkte entfernt von der Kante darf man klicken?
    var sourceC = this.getSourceCoordinates();
    var targetC = this.getTargetCoordinates();
    var alpha = Math.atan2(targetC.y-sourceC.y,targetC.x-sourceC.x);
    // Ist der Mauszeiger auf der Kante?

    var MouseShift = {x:mx-sourceC.x,y:my-sourceC.y};
    var MouseShiftRot = {x: MouseShift.x*Math.cos(-alpha) - MouseShift.y*Math.sin(-alpha),
                y: MouseShift.x*Math.sin(-alpha) + MouseShift.y*Math.cos(-alpha)};
    var targetShift = {x:targetC.x-sourceC.x,y:targetC.y-sourceC.y};
    var targetShiftRot = {x:targetShift.x*Math.cos(-alpha) - targetShift.y*Math.sin(-alpha),
                y:targetShift.x*Math.sin(-alpha) + targetShift.y*Math.cos(-alpha)};
    if(MouseShiftRot.x>=0 && MouseShiftRot.x<=targetShiftRot.x && Math.abs(MouseShiftRot.y)<=toleranz) {
        return true;
    }
    
    // Ist der Mauszeiger auf dem Text?
    var center = {x: (targetC.x+sourceC.x)/2, y:(targetC.y+sourceC.y)/2};
    var labelWidth = ctx.measureText(this.weight.toString()).width;
    var arrowHeight = Math.sin(this.getLayout().arrowAngle)*this.getLayout().arrowHeadLength;
    var c0 = {x:center.x+Math.cos(alpha)*labelWidth/2,
        y:center.y+Math.sin(alpha)*labelWidth/2};
    var c1 = {x:center.x-Math.cos(alpha)*labelWidth/2,
        y:center.y-Math.sin(alpha)*labelWidth/2};
    var c11 = {x:c1.x + Math.cos(alpha + Math.PI/2)*(-3-arrowHeight-this.getLayout().fontSize),
                y:c1.y + Math.sin(alpha + Math.PI/2)*(-3-arrowHeight-this.getLayout().fontSize)};
    var upperCornerOld = {x:c11.x-c0.x,y:c11.y-c0.y};
    var upperCorner = {x:upperCornerOld.x*Math.cos(-alpha) - upperCornerOld.y*Math.sin(-alpha),
                y:upperCornerOld.x*Math.sin(-alpha) + upperCornerOld.y*Math.cos(-alpha)};

    var rotatedMouseOld = {x:mx-c0.x,y:my-c0.y};
    var rotatedMouse = {x: rotatedMouseOld.x*Math.cos(-alpha) - rotatedMouseOld.y*Math.sin(-alpha),
                y: rotatedMouseOld.x*Math.sin(-alpha) + rotatedMouseOld.y*Math.cos(-alpha)};
    if(rotatedMouse.x<=0 && rotatedMouse.x>= upperCorner.x && rotatedMouse.y<=0 && rotatedMouse.y>= upperCorner.y) {
        return true;
    }
    return false;
};

/**
 * Verschiebt die Kante um 10 Punkte (positiv / negativ) um Überlappung
 * bei Doppelkanten zu verhindern.
 * @this {Edge}
 * @method
 */
Edge.prototype.shift = function() {
    var sourceC = this.getSourceNodeCoordinates();
    var targetC = this.getTargetNodeCoordinates();
    var alpha = Math.atan2(targetC.y-sourceC.y,targetC.x-sourceC.x);			// Winkel der aktuellen Kante
    this.setSourceCoordinates({x:sourceC.x - 6*Math.cos(alpha+Math.PI/2),y:sourceC.y - 6*Math.sin(alpha+Math.PI/2)},true);
    this.setTargetCoordinates({x:targetC.x - 6*Math.cos(alpha+Math.PI/2),y:targetC.y - 6*Math.sin(alpha+Math.PI/2)},true);
};

/**
 * Nimmt die Verschiebung zurück
 * @this {Edge}
 * @method
 */
Edge.prototype.unshift = function() {
    var sourceC = this.getSourceNodeCoordinates();
    var targetC = this.getTargetNodeCoordinates();
    this.setSourceCoordinates({x:sourceC.x,y:sourceC.y});
    this.setTargetCoordinates({x:targetC.x,y:targetC.y});
};

/**
 * Datenstruktur für ein Graph.
 * Ein Graph besteht aus einer Liste (assoziatives Array) von Kanten
 * und einer Liste (assoziatives Array) von Knoten
 * @constructor
 * @argument {String} [filename] Parse Graph aus der gegebenen Datei, oder Angabe "random" 
 * @argument {Object} [canvas] jQuery Handler zum Canvas in den gezeichnet werden soll, für Zufallsgraph.
 * @this {Graph}
 */
function Graph(filename, canvas, directed) {
    /** 
     * Zähler für die Knoten des Graphen 
     * @type Number
     */
    var nodeIDCounter = 0;
    /** 
     * Zähler für die KantenIDs des Graphen 
     * @type Number
     */
    var edgeIDCounter = 0;
    /** 
     * Für zukünftige Nutzung, gerichtete Graphen
     *  @type Boolean 
     */
    var directed = directed;
    /**
     *  Knoten des Graphen, assoziatives Array mit den KnotenIDs als Schlüssel
     *  und den Knoten als Wert.
     *  @type Object 
     */
    this.nodes = new Object();
    /**
     *  Kanten des Graphen, assoziatives Array mit den KantenIDs als Schlüssel
     *  und den Knoten als Wert.
     *  @type Object 
     */
    this.edges = new Object();
    /**
     * Closure Objekt für den Graph
     * @type Graph
     */
    var closure_graph = this;

    /**
     * Fügt dem Graph einen Knoten hinzu
     * @method 
     * @param {Number} xC X-Koordinate des Knotens
     * @param {Number} yC X-Koordinate des Knotens
     * @return {GraphNode}
     */
    this.addNode = function(xC,yC) {
        var node = new GraphNode({x:xC, y:yC},nodeIDCounter);
        this.nodes[nodeIDCounter] = node;
        nodeIDCounter++;
        return node;
    };
    /**
     * Entfernt den angegebenen Knoten aus dem Graph
     * @method 
     * @param {Number} nodeID ID des zu löschenden Knoten.
     */
    this.removeNode = function(nodeID) {
        for(var edgeID in this.nodes[nodeID].getInEdges()) {
            this.removeEdge(edgeID);
        }
        for(var edgeID in this.nodes[nodeID].getOutEdges()) {
            this.removeEdge(edgeID);
        }
        delete this.nodes[nodeID];
    };
    
    /**
     * Fügt dem Graph eine Kante hinzu
     * @method 
     * @param {GraphNode} source   Anfangsknoten der Kante.
     * @param {GraphNode} target   Endknoten der Kante.
     * @param {Number} weight Gewicht der Kante.
     * @return {Edge}
     */
    this.addEdge = function(source,target,weight) {
        if(this.getEdgeBetween(source,target) != null) {
            return null;
        }
        if(!directed) {
            if(this.getEdgeBetween(target,source) != null) {
                return null;
            }
        }
        /* if(weight == null) {
            weight = Math.round(Math.random()*200 -100);			// Zufälliges Gewicht zwischen -100 und 100
        } */
        weight = 0;
        var edge = new Edge(source,target,weight,edgeIDCounter,directed);
        this.edges[edgeIDCounter] = edge;
        edgeIDCounter++;
        if(directed) {
            var opposite = this.getEdgeBetween(target,source);
            if(opposite != null) {
                edge.setOppositeEdgeID(opposite);
                this.edges[opposite].setOppositeEdgeID(edge.getEdgeID());
                edge.shift();
                this.edges[opposite].shift();
            }
        }
        source.addOutEdge(edge);
        target.addInEdge(edge);
        return edge;
    };
    
    /**
     * Entfernt die angegebenene Kante aus dem Graph
     * @method 
     * @param {Number} edgeID ID der zu löschenden Kante.
     */
    this.removeEdge = function(edgeID) {
        var sourceID = this.edges[edgeID].getSourceID();
        var targetID = this.edges[edgeID].getTargetID();
        this.nodes[sourceID].removeOutEdge(edgeID);
        this.nodes[targetID].removeInEdge(edgeID);
        if(directed) {
            var opposite = this.getEdgeBetween(this.nodes[targetID],this.nodes[sourceID]);
            if(opposite != null) {
                this.edges[opposite].setOppositeEdgeID(null);
                this.edges[opposite].unshift();
            }
        }
        delete this.edges[edgeID];
    };
    
    /**
     * Setzt das Layout aller Knoten und Kanten zurück.
     * @method
     * @returns {Object} Objekt, in dem das bisherige Layout gespeichert wird.
     */
    this.restoreLayout = function() {
        var oldLayout = {};
        for(var edgeID in this.edges) {
            oldLayout["e_" +edgeID] = this.edges[edgeID].getLayout();
            this.edges[edgeID].restoreLayout();
        }
        for(var nodeID in this.nodes) {
            oldLayout["n_" +nodeID] = this.nodes[nodeID].getLayout();
            oldLayout["nLabel_" +nodeID] = this.nodes[nodeID].getLayout();
            this.nodes[nodeID].restoreLayout();
            this.nodes[nodeID].setLabel("");
        }
        return oldLayout;
    };
    
    /**
     * Liest den Graph aus einer externen Datei ein.<br>
     * Graphen werden in Textdateien gespeichert und folgen einem einfachen Format:<br>
     * Die Datei wird zeilenweise gelesen <br>
     * Zeilen die mit % beginnen sind Kommentare<br>
     * Zeilen der Form n Zahl1 Zahl2 beschreiben einen Knoten mit den Koordinaten (x,y) = (Zahl1,Zahl2)<br>
     * Zeilen der Form e id1 id2 g beschreiben eine Kante zwischen den Knoten mit IDs id1 und id2
     * mit Gewicht g.<br><br>
     * 
     * Siehe auch Beispiele im Ordner graphs.
     * @param {String} file Dateiname
     * @private
     * @method
     */
    function parseGraphfromFile(file) {
        var request = $.ajax({
            url: file,
            async: false,
            dataType: "text"
        });
            
        request.done(function(text) {
            var lines=text.split("\n");                     // Nach Zeilen aufteilen
            for(var line in lines) {
                var parameter = lines[line].split(" ");     // Nach Parametern aufteilen
                if(parameter[0] == "%") {
                    continue;
                }
                if(parameter[0] == "n") {
                    if(!isNaN(parseFloat(parameter[1])) && !isNaN(parseFloat(parameter[2]))) {
                        closure_graph.addNode(parseFloat(parameter[1]),parseFloat(parameter[2]));
                    }
                }
                if(parameter[0] == "e") {
                    if(!isNaN(parseInt(parameter[1])) && !isNaN(parseInt(parameter[2])) && !isNaN(parseFloat(parameter[3]))) {
                        var sourceId = parseInt(parameter[1]);
                        var targetId = parseInt(parameter[2]);
                        var weight = parseFloat(parameter[3]);
                        closure_graph.addEdge(closure_graph.nodes[sourceId],closure_graph.nodes[targetId],weight);
                    }
                }
            }
        });
    };
    
    /**
     * Generiert einen Zufallsgraph.
     * @param {Object} canvas jQuery Handler zum Canvas, auf das der Graph gezeichnet wird
     * @method
     * @private
     */
    function generateRandomGraph(canvas) {
    	var NumberOfNodes = 7;
    	
    	// Knoten erstellen
    	for(var i = 0;i<NumberOfNodes;i++) {
                var x = Math.random()*(canvas.width()-100) +50;     // Knoten nicht zu nah am Rand
                var y = Math.random()*(canvas.height()-100) +50;
                x = Math.round(x/10)*10;                            // Knoten ein bisschen gleichmäßiger verteilt.
                y = Math.round(y/10)*10;
                closure_graph.addNode(x,y);
    	}
    	
    	// Kanten erstellen, mit WSKeit 30 %
    	for(var i = 0;i<NumberOfNodes;i++) {
                for(var j = 0;j<NumberOfNodes;j++) {
                    if(i != j && Math.random() < 0.3) {
                        closure_graph.addEdge(closure_graph.nodes[i],closure_graph.nodes[j],null);
                    }
                }
    	}
    }
    
    /**
     * Für Debugging / erstellen neuer Beispiele:
     * Gibt eine String Repräsentation nach dem Schema, das in den Beispielgraphen genutzt wird,
     * vom aktuellen Graph.
     * @returns {String} Repräsentation als String
     */
    this.getDescriptionAsString = function() {
        var graphDescription = "";
        graphDescription += "% Automatisch generiert um " +(new Date).toGMTString() + "\n";
        var nodeArray = Utilities.arrayOfKeys(this.nodes);
        for(var i=0;i<nodeArray.length;i++) {
            graphDescription += "n " +this.nodes[nodeArray[i]].getCoordinates().x + " " +this.nodes[nodeArray[i]].getCoordinates().y + "\n";
        }
        for(var edgeID in this.edges) {
            var u = nodeArray.indexOf(this.edges[edgeID].getSourceID().toString());
            var v = nodeArray.indexOf(this.edges[edgeID].getTargetID().toString());
            graphDescription += "e " +u + " " +v + " "+ this.edges[edgeID].weight + "\n";
        }
        return graphDescription;
    };

    // Falls ein Dateiname angegeben wurde, parse den entsprechenden Graph
    // Falls das Canvas angegeben wurde, erstelle Zufallsgraph
    if(canvas != null) {
        generateRandomGraph(canvas);
    }
    if(canvas == null && filename != null) {
        parseGraphfromFile(filename);
    }
}

/**
 * Zeigt, ob ein Kante zwischen den beiden Knoten existiert
 * @method 
 * @param {GraphNode} source   Anfangsknoten der Kante.
 * @param {GraphNode} target   Endknoten der Kante.
 * @return {Number}
 * @this {Graph}
 */
Graph.prototype.getEdgeBetween= function(source,target) {
    for(var edgeID in this.edges) {
        if(this.edges[edgeID].getSourceID() == source.getNodeID() 
                && this.edges[edgeID].getTargetID() == target.getNodeID()) {
            return edgeID;
        }
    }
    return null;
};

/**
 * Kapselt die Funktionalität um einen Graph auf das Canvas zu zeichnen
 * @constructor
 * @augments CanvasDrawer
 * @param {Graph} p_graph Graph, auf dem der Algorithmus ausgeführt wird.
 * @param {Object} p_canvas jQuery Objekt des Canvas, in dem gezeichnet wird.
 * @param {Object} p_tab jQuery Objekt des aktuellen Tabs.
 */
function GraphDrawer(p_graph,p_canvas,p_tab) {
    CanvasDrawer.call(this,p_graph,p_canvas,p_tab);
    /**
     * Pointer auf den Graph, damit man nicht immer this.graph schreiben muss
     * @type Graph
     */
    var graph = p_graph;
    /**
     * Pointer auf den Canvas, damit man nicht immer this.canvas schreiben muss
     * @type Object
     */
    var canvas = p_canvas;
    /**
     * Closure für dieses Objekt
     * @type GraphDrawer
     */
    var algo = this;
    
    /**
     * Zeigt an, ob wir im Moment die Maus bei gedrücktem Mauszeiger verschieben
     * (Drag and Drop)
     * @type Boolean
     */
    var dragging = false;
    /**
     * Zeigt an, ob wir beim letzten Event noch verschoben haben
     * (dann wir der aktuell ausgewählte Knoten abgewählt)
     * @type Boolean
     */
    var hasDragged = false;
    /**
     * Der aktuell ausgewählte Knoten
     * @type GraphNode
     */
    var selectedNode = null;
    /**
     * Die aktuell ausgewählte Kante
     * @type Edge
     */
    var selectedEdge = null;
    
    /**
     * Initialisiert das Zeichenfeld
     * @method
     */
    this.run = function() {
        this.initCanvasDrawer();
        this.registerEventHandlers();
        this.needRedraw = true;
        this.minimizeLegend();
        $("#tg_button_gotoAlgorithmTab").click(function() {
            $("#tabs").tabs("option","active",2);
        });
    };
    
    /**
     * Beendet das Zeichnen,
     * speichert das Ergebnis im .data() Feld von body
     * @method
     */
    this.destroy = function() {
        // Rette den Graph
        $("body").data("graph",this.graph);
        this.canvas.css("background","");
        $("#tg_p_bildlizenz").remove();
        this.destroyCanvasDrawer();
        this.deregisterEventHandlers();
    };
    
    /**
     * Beendet den Tab und startet ihn neu
     * @method
     */
    this.refresh = function() {
        this.destroy();
        var algo = new GraphDrawer($("body").data("graph"),$("#tg_canvas_graph"),$("#tab_tg"));
        $("#tab_tg").data("algo",algo);
        algo.run();
    };
    
    /**
     * Registriere Eventhandler im Event Namespace .GraphDrawer
     * @method
     */
    this.registerEventHandlers = function() {
        canvas.on("mouseup.GraphDrawer",function() {algo.mouseUpHandler();});           // Mouseup
        canvas.on("mousemove.GraphDrawer",function(e) {algo.mouseMoveHandler(e);});     // Mousemove
        canvas.on("dblclick.GraphDrawer",function(e) {algo.dblClickHandler(e);});       // Doppelklick
        canvas.on("contextmenu.GraphDrawer",function(e) {algo.rightClickHandler(e);});  // Rechtklick
        canvas.on("mousedown.GraphDrawer",function(e) {algo.mouseDownHandler(e);});     // Linksklick
        $("#tg_select_GraphSelector").on("change.GraphDrawer",function() {algo.setGraphHandler();});     // Beispielgraph auswählen
    };
    
    /**
     * Entfernt die Eventhandler im Event Namespace .Graphdrawer
     * @method
     */
    this.deregisterEventHandlers = function() {
        canvas.off(".GraphDrawer");
        $("#tg_select_GraphSelector").off(".GraphDrawer");
    };
    
    /**
     * Behandelt das Ende eines Mausklicks
     * @method
     */
    this.mouseUpHandler = function() {
        dragging = false;
        if(hasDragged) {
            this.deselectNode();
        }
        hasDragged = false;
        this.needRedraw = true;
    };
    
    /**
     * Behandelt Mausbewegungen im Canvas<br>
     * Falls ein Knoten ausgewählt ist und die Maus gezogen wird, wird er verschoben
     * Falls ein Knoten ausgewählt ist und die Maus nicht gedrückt, so wird eine neue Kante gezeichnet
     * @param {jQuery.Event} e jQuery Event Objekt, enthält insbes. die Koordinaten des Mauszeigers.
     * @method
     */
    this.mouseMoveHandler = function(e) {
        if(selectedNode != null) {
            if (dragging) {
                selectedNode.setCoordinates({x: e.pageX - canvas.offset().left,y: e.pageY - canvas.offset().top});
                this.unfinishedEdge.active = false;
                this.needRedraw = true;
                hasDragged = true;
            }
            else {
                this.unfinishedEdge.to = {x: e.pageX - canvas.offset().left,y: e.pageY - canvas.offset().top};
                this.unfinishedEdge.active = true;
                this.needRedraw = true;
            }
        }
    };
    
    /**
     * Behandelt Doppelklicks im Canvas<br>
     * Bei einem Doppelklick auf eine Kante kann deren Gewicht verändert werden,
     * bei einem Doppelklick in die freie Landschaft wird ein neuer Knoten erstellt.
     * @param {jQuery.Event} e jQuery Event Objekt, enthält insbes. die Koordinaten des Mauszeigers.
     * @method
     */
    this.dblClickHandler = function(e) {
        // Kantengewichte entfernt
        /* if(selectedNode == null) {
            for(var kantenID in graph.edges) {
                if (graph.edges[kantenID].contains(e.pageX - canvas.offset().left, e.pageY - canvas.offset().top,this.canvas[0].getContext("2d"))) {
                    selectedEdge = graph.edges[kantenID];
                    this.showWeightChangeField(e,kantenID);		// Zeige Feld zum Verändern des Gewichts
                    this.needRedraw = true;
                    return;
                }
            }
        } */
        graph.addNode(e.pageX - canvas.offset().left, e.pageY - canvas.offset().top);
        this.needRedraw = true;
    };
    
    /**
     * Behandelt Rechtsklicks im Canvas<br>
     * Bei einem Rechtsklick auf einen Knoten oder eine Kante wird diese gelöscht.
     * @param {jQuery.Event} e jQuery Event Objekt, enthält insbes. die Koordinaten des Mauszeigers.
     * @method
     */
    this.rightClickHandler = function(e) {
        e.preventDefault();                                 // Kein Kontextmenü
        this.deselectNode();                                // In jedem Fall erstmal den aktuellen Knoten abwählen...
        var mx = e.pageX - canvas.offset().left;
        var my = e.pageY - canvas.offset().top;
        for(var knotenID in graph.nodes) {
            if (graph.nodes[knotenID].contains(mx, my)) {
                for(var kantenID in graph.nodes[knotenID].getInEdges()) {
                    $("#WeightChangePopup_" +kantenID.toString()).remove();
                }
                for(var kantenID in graph.nodes[knotenID].getOutEdges()) {
                    $("#WeightChangePopup_" +kantenID.toString()).remove();
                }
                graph.removeNode(knotenID);
                this.needRedraw = true;
                return;                                     // Immer nur einen Knoten löschen
            }
        }
        for(var kantenID in graph.edges) {
            if (graph.edges[kantenID].contains(mx, my,this.canvas[0].getContext("2d"))) {
                graph.removeEdge(kantenID);
                $("#WeightChangePopup_" +kantenID.toString()).remove();
                this.needRedraw = true;
                return;                                     // Immer nur eine Kante löschen
            }
        }
    };
    
    /**
     * Behandelt Linksklicks im Canvas<br>
     * Es wird entweder ein Knoten ausgewählt, oder ein neuer erstellt, oder eine Kante zwischen Knoten erstellt.
     * @param {jQuery.Event} e jQuery Event Objekt, enthält insbes. die Koordinaten des Mauszeigers.
     * @method
     */
    this.mouseDownHandler = function(e) {
        $("#tg_select_GraphSelector>option:selected").attr("selected", false);
        $("#tg_selectoption_empty").attr("selected", true);
        var mx = e.pageX - canvas.offset().left;
        var my = e.pageY - canvas.offset().top;
        this.needRedraw = true;
        for(var knotenID in graph.nodes) {
            if (graph.nodes[knotenID].contains(mx, my)) {
                /**@type GraphNode */
                var mySel = graph.nodes[knotenID];
                // Falls wir wieder auf den selben Knoten geklickt haben, hebe Auswahl auf.
                if(selectedNode == mySel) {				
                    this.deselectNode();
                }
                else {
                    // Falls wir nichts ausgewählt hatten, wähle den Knoten aus
                    if(selectedNode == null) {
                        dragging = true;
                        this.selectNode(mySel);
                        this.unfinishedEdge = {from: mySel, to:{x:mx, y:my}, active:false};
                    }
                    else {				// Füge Kante hinzu
                        graph.addEdge(selectedNode,mySel,null);
                        this.deselectNode();
                    }
                }
                return;
            }
        }
	// Wir haben nicht auf einem Knoten gestoppt 
	// -> Falls etwas ausgewählt war, erstelle Knoten und zeichne Kante
	if (selectedNode) {
            var newNode = graph.addNode(mx, my);
            graph.addEdge(selectedNode,newNode,null);
            this.deselectNode();
	}
    };
    
    /**
     * Entfernt die Auswahl eines Knotens und setzt alle entsprechenden Parameter und Layouts
     */
    this.deselectNode = function() {
        // entferne roten Kreis um Auswahl
        if(selectedNode != null) {
            selectedNode.restoreLayout();
            selectedNode = null;
        }
        this.unfinishedEdge = null;
    };
    
    /**
     * Wählt einen Knoten aus und setzt die notwendigen Parameter
     * @param {GraphNode} selection Der ausgewählte Knoten
     */
    this.selectNode = function(selection) {
        selectedNode = selection;
        selectedNode.setLayout("borderColor",const_Colors.NodeBorderHighlight);
    };
    
    /**
     * Setzt den Graph auf einen der Beispielgraphen. Fügt auch die 
     * Hintergrundbilder per CSS hinzu.
     */
    this.setGraphHandler = function() {
        var selection = $("#tg_select_GraphSelector>option:selected").val();
        switch(selection) {
            case "Viele Touren":
                this.canvas.css("background-image","");
                $("#tg_p_bildlizenz").remove();
                this.graph = new Graph("graphs/vieleTouren.txt", null, false);
                break;
            case "Eine Tour":
                this.canvas.css("background-image","");
                $("#tg_p_bildlizenz").remove();
                this.graph = new Graph("graphs/eulerschEineTour.txt", null, false);
                break;
            case "Semi Eulerscher Graph":
                this.canvas.css("background-image","");
                $("#tg_p_bildlizenz").remove();
                this.graph = new Graph("graphs/semiEulersch.txt", null, false);
                break;
            case "Blume":
                this.canvas.css("background-image","");
                $("#tg_p_bildlizenz").remove();
                this.graph = new Graph("graphs/gerichtet1.txt", null, false);
                break;
            case "Haus vom Nikolaus":
                this.canvas.css("background-image","");
                $("#tg_p_bildlizenz").remove();
                this.graph = new Graph("graphs/nikolaus.txt", null, false);
                break;
            case "Königsberger Brücken":
                this.canvas.css("background-image", "url(img/koenigsberg_bg.png)");
                $("#tg_p_bildlizenz").remove();
                this.graph = new Graph("graphs/koenigsberg.txt", null, false);
                break;
            case "Zufallsgraph":
                this.canvas.css("background-image","");
                $("#tg_p_bildlizenz").remove();
                this.graph = new Graph("random", canvas, false);
                break;
            case "Selbsterstellter Graph":
                break;
            default:
                //console.log("Auswahl im Dropdown Menü unbekannt, tue nichts.");
                
        }
        // Ändere auch die lokalen Variablen (und vermeide "div
        graph = this.graph;
        canvas = this.canvas;
        this.needRedraw = true;
        dragging = false;
        hasDragged = false;
        selectedNode = null;
        selectedEdge = null;
        this.unfinishedEdge = null;
    };
}

// Vererbung realisieren
GraphDrawer.prototype = new CanvasDrawer;
GraphDrawer.prototype.constructor = GraphDrawer;