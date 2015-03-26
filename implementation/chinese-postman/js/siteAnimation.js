/**
 * @author Richard Stotz
 * Allgemeine Animationen der Seite, Initialisierungscode<br>
 * Es wird auch die Oberklasse CanvasDrawer definiert, von der alle Klassen erben, die 
 * mit dem Canvas arbeiten.
 */

/**
 * Initialisiere Layout der Seite
 * Tabs, Buttons, ersten Tab<br>
 * Wenn ein Dialog vor dem Tabwechsel aufgerufen wird, z.B. weil der Algorithmus
 * durch Tabwechsel abgebrochen würde, so muss der Tabwechsel zunächst abgefangen werden.
 * Das Ergebnis des Dialogs wird gespeichert und ein Tabwechsel wird ausgelöst.
 */
function initializeSiteLayout() {
    $("#tabs").tabs();
    if(window.location.hash) {
        $("#tabs").tabs( "option", "active", 0 );
    }
    $("button").button();
    $("#te_button_gotoDrawGraph").click(function() {$("#tabs").tabs( "option", "active", 1 );});
    $("#te_button_gotoIdee").click(function() {$("#tabs").tabs( "option", "active", 3);});
    $("#ti_button_gotoDrawGraph").click(function() {$("#tabs").tabs( "option", "active", 1);});
    $("#ti_button_gotoAlgorithm").click(function() {$("#tabs").tabs( "option", "active", 2);});
    $("#ti_button_gotoFA1").click(function() {$("#tabs").tabs( "option", "active", 4);});
    $("#ti_button_gotoFA2").click(function() {$("#tabs").tabs( "option", "active", 5);});
    $("#tw_Accordion").accordion({heightStyle: "content"});
    $( "#tabs" ).tabs({
        beforeActivate: function( event, ui ) {
            if(ui.oldPanel[0].id == "tab_tg") {
                $("#tab_tg").data("algo").destroy();
            }
            if(ui.oldPanel[0].id == "tab_ta") {
                if($("#tab_ta").data("algo").getStatusID() != null && $("#tab_ta").data("algo").getStatusID() < 5) {
                    if($("#tabs").data("tabChangeDialogOpen") == null) {
                        event.preventDefault();
                        $( "#tabs" ).data("requestedTab",$("#" +ui.newPanel.attr("id")).index()-1);
                        $("#tabs").data("tabChangeDialogOpen",true);
                        $( "#ta_div_confirmTabChange" ).dialog("open");
                    }
                    else {
                        $("#tab_ta").data("algo").destroy();
                    }
                }
                else {
                    $("#tab_ta").data("algo").destroy();
                }
            }
            if(ui.oldPanel[0].id == "tab_tf1") {
                if($("#tab_tf1").data("algo").getStatusID() != null && $("#tab_tf1").data("algo").getStatusID() < 5) {
                    if($("#tabs").data("tabChangeDialogOpen") == null) {
                        event.preventDefault();
                        $( "#tabs" ).data("requestedTab",$("#" +ui.newPanel.attr("id")).index()-1);
                        $("#tabs").data("tabChangeDialogOpen",true);
                        $( "#tf1_div_confirmTabChange" ).dialog("open");
                    }
                    else {
                        $("#tab_tf1").data("algo").destroy();
                    }
                }
                else {
                    $("#tab_tf1").data("algo").destroy();
                }
            }
            if(ui.oldPanel[0].id == "tab_tf2") {
                if($("#tabs").data("tabChangeDialogOpen") == null && $("#tab_tf2").data("algo").getWarnBeforeLeave()) {
                    event.preventDefault();
                    $( "#tabs" ).data("requestedTab",$("#" +ui.newPanel.attr("id")).index()-1);
                    $("#tabs").data("tabChangeDialogOpen",true);
                    $( "#tf2_div_confirmTabChange" ).dialog("open");
                }
                else {
                    $("#tab_tf2").data("algo").destroy();
                }
            }
        },
        activate: function(event, ui) {
            var algo;
            if(ui.newPanel[0].id == "tab_tg") {
                algo = new GraphDrawer($("body").data("graph"),$("#tg_canvas_graph"),$("#tab_tg"));
                $("#tab_tg").data("algo",algo);
            }
            if(ui.newPanel[0].id == "tab_ta") {
                algo = new algorithm($("body").data("graph"),$("#ta_canvas_graph"),$("#tab_ta"));
                $("#tab_ta").data("algo",algo);
            }
            if(ui.newPanel[0].id == "tab_tf1") {
                algo = new Forschungsaufgabe1($("body").data("graph"),$("#tf1_canvas_graph"),$("#tab_tf1"));
                $("#tab_tf1").data("algo",algo);
            }
            if(ui.newPanel[0].id == "tab_tf2") {
                algo = new Forschungsaufgabe2($("body").data("graph"),$("#tf2_canvas_graph"),$("#tab_tf2"));
                $("#tab_tf2").data("algo",algo);
            }
            if(algo) {
                algo.run();
            }
        }
    });
    $("body").data("graph",new Graph("graphs/connected.txt"));
}

/**
 * Oberklasse für alle Klassen, die einen Graph auf das Canvas zeichnen.<br>
 * Zeichnet Graph und Canvas regelmäßig, animiert die Legende und den Eingangsdialog.
 * @param {Graph} p_graph Der Graph, der gezeichnet werden soll.
 * @param {Object} p_canvas jQuery Handler auf das Canvas, auf das gezeichnet wird.
 * @param {Object} p_tab jQuery Objekt des aktuellen Tabs.
 * @constructor
 */
function CanvasDrawer(p_graph,p_canvas,p_tab) {
    /**
     * Pointer auf den Graph
     * @type Graph
     */
    this.graph = p_graph;
    /**
     * Pointer auf den Canvas
     * @type Object
     */
    this.canvas = p_canvas;
    /**
     * jQuery Objekt des aktuellen Tabs
     * @type Object
     */
    this.tab = p_tab;
    /**
     * Variable die anzeigt, ob ein neuzeichnen des Canvas notwendig ist.
     * @type Boolean
     */
    this.needRedraw = false;
    /**
     * Closure Zeiger auf das aktuelle Objekt
     * @type CanvasDrawer
     */
    var algo = this;
    /**
     * ID des Intervalls für das neuzeichnen auf dem Canvas
     * @type Number
     */
    this.drawIntervalID = null;
    /**
     * HTML des Tabs vor dem Öffnen des Tabs
     * @type String
     */
    this.statusBackup = null;
    /**
     * Zeigt an, ob der Tab z.Zt. aktiv ist (ungenutzt)
     * @type Boolean
     */
    this.active = false;
    
    /**
     * Objekt mit Quell- und Zielkoordinaten einer nicht beendeten Kante
     * (from und to sind die Schlüssel)
     * @type Object
     */
    this.unfinishedEdge = null;
    /**
     * jQuery Objekt der maximierten Legende
     * @type Object
     */
    var legendeMax;
    /**
     * jQuery Objekt der minimierten Legende
     * @type Object
     */
    var legendeMin;
    /**
     * jQuery Objekt des "Maximieren" Buttons de Legende im aktuellen Tab
     * @type Object
     */
    var legendeMaxButton;
    /**
     * jQuery Objekt des "Minimieren" Buttons de Legende im aktuellen Tab
     * @type Object
     */
    var legendeMinButton;
    /**
     * jQuery Objekt des Dialogs, der zu Beginn des Tabs gezeigt wird.
     * @type Object
     */
    var tabIntroDialog;
    /**
     * jQuery Objekt des Dialogs, der zu Beginn des Tabs gezeigt wird.
     * @type Object
     */
    var tabChangeWarningDialog;
    /**
     * jQuery Objekt des statusFensters des Tabs
     * @type Object
     */
    var statusWindow;
    
    /**
     * Initialisiert Intervalle und Event Handler für die den Canvas Drawer
     * @method
     */
    this.initCanvasDrawer = function() {
        legendeMax = this.tab.find(".Legende");
        legendeMin = this.tab.find(".LegendeMinimized");
        legendeMaxButton = legendeMax.find(".LegendeMin");
        legendeMinButton = legendeMin.find(".LegendeMin");
        tabIntroDialog = this.tab.find(".tabIntroDialog");
        tabChangeWarningDialog = this.tab.find(".tabChangeWarningDialog");
        statusWindow = this.tab.find(".statusWindow");
        this.statusBackup = statusWindow.html();
        this.animateLegende();
        this.canvas.css('user-select','none').attr('unselectable','on').on("selectstart.CanvasDrawer",false);
        this.drawIntervalID = setInterval(function() { algo.drawCanvas(); }, 20);
        this.needRedraw = true;
        this.openDialogs();
        this.addRefreshToTabbar();
    };
    
    /**
     * Diese Funktion wird regelmäßig aufgerufen und zeichnet alle Elemente aufs Canvas
     * @method
     */
    this.drawCanvas = function() {
        if(this.needRedraw) {
            var ctx = this.canvas[0].getContext("2d");
            ctx.clearRect(0, 0, this.canvas.width(), this.canvas.height());

            // Zeichne unfertige Kante
            if(this.unfinishedEdge != null && this.unfinishedEdge.active) {
                CanvasDrawMethods.drawLine(ctx,global_Edgelayout,this.unfinishedEdge.from.getCoordinates(),this.unfinishedEdge.to);
            }
            
            // Zeichne alle Elemente des Graph
            for(var kantenID in this.graph.edges) {
                this.graph.edges[kantenID].draw(ctx);
            }
            for(var knotenID in this.graph.nodes) {
                this.graph.nodes[knotenID].draw(ctx);
            }
            this.needRedraw = false;
        }
    };
    
    /**
     * Entfernt Intervalle und Event Handler für die den Canvas Drawer
     * @method
     */
    this.destroyCanvasDrawer = function() {
        legendeMaxButton.off("click.CanvasDrawer");
        legendeMinButton.off("click.CanvasDrawer");
        this.canvas.off("selectstart.CanvasDrawer");
        window.clearInterval(this.drawIntervalID);
        tabIntroDialog.dialog("destroy");
        if($("body").data("graph")) {
            $("body").data("graph").restoreLayout();
        }
        this.tab.find(".statusWindow").html(this.statusBackup);
        this.removeRefreshFromTabbar();
    };

    /**
     * Minimiert die Legende und positioniert sie korrekt.
     * @method
     */
    this.minimizeLegend = function() {
        legendeMax.hide();
        legendeMin.show();
        var parentPosition = this.canvas.offset();
        // Ziehe 1 ab wegen Breite des Rands des Canvas
        legendeMin.offset({
            top: (parentPosition.top + this.canvas.height() - legendeMin.height()-1),
            left: (parentPosition.left + this.canvas.width() - legendeMin.width()-1)
        });
    };

    /**
     * Maximiert die Legende und positioniert sie korrekt.
     * @method
     */
    this.maximizeLegend = function() {
        legendeMax.show();
        legendeMin.hide();
        var parentPosition = this.canvas.offset();
        // Ziehe 1 ab wegen Breite des Rands des Canvas
        legendeMax.offset({
            top: (parentPosition.top + this.canvas.height() - legendeMax.height()-1),
            left: (parentPosition.left + this.canvas.width() - legendeMax.width()-1)
        });
    };
    
    /**
     * Öffnet die Dialoge, die zu dem Tab gehören: Eingangsdialog und mglw. 
     * Abfrage, ob man den Tab wirklich verlassen möchte.
     * @method
     */
    this.openDialogs = function() {
        var currentTab = this.tab;      // Closure
        var minW = 150;
        if(this.tab.attr("id") == "tab_tf2") {
            minW = 570;
        }
        $(function() {
            tabIntroDialog.dialog({
                dialogClass: "shadow",
                resizable: false,
                draggable: false,
                minWidth: minW,
                position: { my: "center center", at: "center center", of: currentTab},
                modal: false,
                autoOpen: false,
                beforeClose: function(event, ui) {
                    tabIntroDialog.effect('transfer', {
                        to: statusWindow
                    }, 500, null);
                    return true;
                },
                buttons: {
                    Ok: function() {$(this).dialog( "close" );}
                }
            });
        });

        if(!tabIntroDialog.data("wasOpen")) {
            tabIntroDialog.dialog("open");
            tabIntroDialog.data("wasOpen",true);
        }
        // Tabwechsel Warndialog
        if(tabChangeWarningDialog) {
            $(function() {
                tabChangeWarningDialog.dialog({
                    autoOpen: false,
                    resizable: false,
                    modal: true,
                    buttons: {
                        "In diesem Tab bleiben": function() {
                            $("#tabs").removeData("requestedTab");
                            $("#tabs").removeData("tabChangeDialogOpen");
                            $(this).dialog( "close" );
                        },
                        "Tab wechseln": function() {
                            $(this).dialog( "close" );
                            var newTabID =$("#tabs").data("requestedTab");
                            $("#tabs").removeData("requestedTab");
                            $("#tabs").tabs("option", "active", newTabID);
                            $("#tabs").removeData("tabChangeDialogOpen");
                        }   
                    }
                });
            });
        }
    };
    
    /**
     * Animiert die Legende: Buttons zum maximieren / minimieren, Icons in den
     * Buttons, Tooltipp für Vorgängerkante
     * @method
     */
    this.animateLegende = function() {
        legendeMaxButton.button({icons: {primary: "ui-icon-minus"},text: false});
        legendeMinButton.button({icons: {primary: "ui-icon-plus"},text: false});
        this.maximizeLegend();
        legendeMaxButton.on("click.CanvasDrawer",function() {algo.minimizeLegend();});
        legendeMinButton.on("click.CanvasDrawer",function() {algo.maximizeLegend();});
        $("tr.LegendeZeileClickable").tooltip();
    };
    
    /**
     * Fügt ein "Neu laden" Icon zum Tab hinzu, aktiviert es
     * @method
     */
    this.addRefreshToTabbar = function() {
        $("#tabs").find(".ui-tabs-active").append('<span class="ui-icon ui-icon-refresh" style="display:inline-block">Klicke auf den Titel des Tabs, um ihn zurückzusetzen.</span>');
        $("#tabs").find(".ui-tabs-active").attr("title","Klicke auf den Titel des Tabs, um ihn zurückzusetzen.").tooltip();
        $("#tabs").tabs("refresh");
        $("#tabs").find(".ui-tabs-active").find("span").on("click.Refresh",function(e) {
            e.stopPropagation();
            algo.refresh();
        });
    };
    
    /**
     * Entfernt das neu laden Icon und die Funktionalität
     * @method
     */
    this.removeRefreshFromTabbar = function() {
        $("#tabs").find(".ui-tabs-active").tooltip().tooltip("destroy");
        $("#tabs").find(".ui-tabs-active").find("span").off(".Refresh");
        $("#tabs").find(".ui-icon-refresh").remove();
        $("#tabs").tabs("refresh");
    };
}