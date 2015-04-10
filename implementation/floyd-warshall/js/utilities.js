/**
 * @author Richard Stotz
 * Hier wird die Klasse Utilities definiert, die verschiedene 
 * statische Hilfsfunktionen beinhaltet.
 */

/**
 * Klasse mit Hilfunktionen
 * @class 
 */
function Utilities() {};

/**
 * Gibt alle Schlüssel eines assoziativen Arrays zurück
 * @param {Object} obj Assoziatives Array
 * @returns {Array} Die Schlüssel des assoziativen Arrays
 */
Utilities.arrayOfKeys = function(obj) {
    var keys = new Array();
    for (var key in obj) {
        if (obj.hasOwnProperty(key)) {
            keys.push(key);
        }
    }
    return keys;
};