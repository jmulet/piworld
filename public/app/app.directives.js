(function (app, angular) {
    'use strict';
  
    app.directive('whenScrollEnds', function() {
        return {
            restrict: "A",
            link: function(scope, element, attrs) {
                var visibleHeight = element.height();
                var threshold = 100;

                element.scroll(function() {
                    var scrollableHeight = element.prop('scrollHeight');
                    var hiddenContentHeight = scrollableHeight - visibleHeight;
                    //console.log(hiddenContentHeight - element.scrollTop());
                    if (hiddenContentHeight - element.scrollTop() <= threshold) {
                        // Scroll is almost at the bottom. Loading more rows
                        scope.$apply(attrs.whenScrollEnds);
                    }
                });
            }
        };
    });
    
//Handles brokes images with a fallback src
app.directive('errSrc', function() {
  return {
    restrict: 'A',
    link: function(scope, element, attrs) {

      var unwatch = scope.$watch(function() {
          return attrs['ngSrc'];
        }, function (value) {
          if (!value) {
            element.attr('src', attrs.errSrc);  
          }
      });

      element.bind('error', function() {
        element.attr('src', attrs.errSrc);
      });
      
      scope.$on("$destroy", function(){
          unwatch();
      });
    }
  };
});
    
//Handles css sheet addition from templates    
    app.directive('lazyStyle', ['Session', function (Session) {
            return {
                restrict: 'E',
                link: function (scope, element, attrs)
                {
                    attrs.$observe('href', function (value) {
                        Session.addCss(value);
                    });
                }
            };
        }]);

    app.directive('loadingContainer', function () {
        return {
            restrict: 'A',
            scope: false,
            link: function (scope, element, attrs) {
                var loadingLayer = angular.element('<div class="loading"></div>');
                element.append(loadingLayer);
                element.addClass('loading-container');
                var unwatch = scope.$watch(attrs.loadingContainer, function (value) {
                    loadingLayer.toggleClass('ng-hide', !value);
                });

                scope.$on('$destroy', function () {
                    loadingLayer.toggleClass('ng-hide', true);
                    unwatch();
                });
            }
        };
    });
    
    app.directive('scrollBottom', ['$timeout', function ($timeout) {
        return {
            scope: {
                scrollBottom: "="
            },
            link: function (scope, element) {
                var unbindWatcher = scope.$watchCollection('scrollBottom', function (newValue) {
                    if (newValue)
                    {
                        $timeout(function(){
                            $(element).scrollTop($(element)[0].scrollHeight+10);
                        }, 600);
                    }
                });
                
               scope.$on('$destroy', unbindWatcher);
            }
        };
    }]);

 


 
var katexServerDir = function(Session, $http, $compile){
     return {
            scope:{
                katexServer: '<',
                kts: '<'
            },
            restrict: 'A',                
            link: function (scope, element, attrs) {
                
                var contents;
                var unwatch;
                Session.addCss("https://cdnjs.cloudflare.com/ajax/libs/KaTeX/0.8.3/katex.min.css");
                 
                var prerender = function(contents){
                    contents = contents.replace(/katex-server=""/g, '').replace(/ng-cloak/g,'');
                    $http.post("/rest/misc/latex2", {html: contents, alone: attrs.alone, dollar2: attrs.doubleDollar}).then(function(d){
                        element.empty().append(d.data);
                        if(!attrs.noCompile){
                            $compile(element.contents())(scope);                        
                        }                                      
                    });
                };
                
                var watch = function (name) {
                    return scope.$watch(name, function(newValue, oldValue) {
                        var text = newValue || ""; 
                        prerender(text);
                    });
                };
                
                if(attrs.katexServer){
                    if(attrs.compileOnce){
                        prerender(scope.katexServer);
                        element.removeAttr("katexServer");
                    } else {
                        unwatch = watch('katexServer');
                    }
                } else if(attrs.kts){
                    if(attrs.compileOnce){
                        prerender(scope.kts);
                        element.removeAttr("kts"); 
                    }
                    else {
                      unwatch = watch('kts');
                    }
                        
                } else {
                    prerender(element.html());
                    element.removeAttr("kts");      //This is to prevent double compilations in static elements
                    element.removeAttr("katexServer");
                }
                
                scope.$on("$destroy", function(){
                    unwatch && unwatch();
                });
                
            }
        };
};
 
app.directive('katexServer', ['Session', '$http', '$compile', katexServerDir]);
app.directive('kts', ['Session', '$http', '$compile', katexServerDir]);

var katexMacros = {
    "\\Re": "\\mathbb{R}",
    "\\alf": "\\alpha",
    "\\tg":  "\\mathrm{tg}\\,",
    "\\arctg": "\\mathrm{arctg}\\,",
    "\\cotg": "\\mathrm{cotg}\\,",    
    "\\cosec": "\\mathrm{cosec}\\,"
    //,"\\limx":  "\\mathop{lim}\\limits_{#1\\to #2}"   //not yet supported
};

var katexDir = function(Session) {
 
        function displayError(text, Ex, element){
                element.empty().append(text);
                element.css({"color": "red", "font-style": "italic"});    
                pw.DEBUG && console.log(Ex);
        }
 
        function prerender(text, element) {
            var displayMode = false;
            if (element[0].tagName.toLowerCase() === 'div') {
                text = '\\displaystyle {' + text + '}';
                element.addClass('katex-outer');
                displayMode =true;
            }
           
                if(!window.katex){
                    require(['katex'], function(katex){
                     try { 
                        window.katex = katex;
                        katex.render(text, element[0], {displayMode: displayMode, macros: katexMacros});
                    } catch(Ex){
                        displayError(text, Ex, element);
                    }
                    });
                } else {
                    try{
                        window.katex.render(text, element[0], {displayMode: displayMode, macros: katexMacros});
                    } catch(Ex){
                        displayError(text, Ex, element);
                    }
                }
            }
              

        return {
            scope:{
                expr: "<",
                katex: "<",
                kt: "<"
            },
            restrict: 'AE',

            link: function (scope, element, attrs) {
                Session.addCss(pw.KATEXCSS);
                var unwatch;
                var watch = function (name) {
                    return scope.$watch(name, function (newValue, oldValue) {

                        text = newValue || "";

                        if (text.indexOf('Error') >= 0)
                        {
                            text = "?";
                        }
                        prerender(text, element);

                        });
                };
                
                var text = "";
                if(attrs.katex)
                {
                    if(attrs.compileOnce){
                        prerender(scope.katex, element);
                    } 
                    else {
                       unwatch = watch('katex');
                    }
                   
                }  
                else if(attrs.kt)
                {
                    if(attrs.compileOnce){
                        prerender(scope.kts, element);
                    } 
                    else {
                        unwatch = watch('kt');
                    }
                    
                }
                else if (attrs.expr)
                {
                    if(attrs.compileOnce){
                        prerender(scope.expr, element);
                    } 
                    else {
                        unwatch = watch('expr');
                    }
                    
                }
                else {
                    //This is static and nothing to watch
                    text = element.html();
                    prerender(text, element);
                }


                 
                scope.$on("$destroy", function(){
                    unwatch && unwatch();
                });

            }
        };
};   
   
app.directive('katex', ['Session', katexDir]);
app.directive('kt', ['Session', katexDir]);
    
 


app.directive('geogebra', ['$translate', function ($translate) {

            return {
                restrict: 'A',
                replace: false,
                scope: {model: "=ngModel", geogebra: "@geogebra"},
                link: function (scope, element, attrs) {

                    element.html("<h2>Geogebra loading ...</h2>"); 

                    require(['geogebra'], function () {

                        var text = element.text().trim();
                        element.text('');

                        var perspective = attrs.perspective || 2;

                        var app = attrs.app && attrs.app === 'true';

                        var currentLang = $translate.proposedLanguage() || $translate.use();
                        //Start with an empty scene
                        var base64 = "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";
                        //"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";
                        if (app)
                        {
                            base64 = null;
                        }

                        if (scope.model && scope.model.base64) {
                            base64 = scope.model.base64;
                        }
                       

                        var rnd = Math.floor(Math.random() * 1000000);
                        var appletID = "ggbApplet" + rnd;

                        var width = 0;
                        var height = 0;

                        if (attrs.width)
                        {
                            width = attrs.width;
                        }

                        if (attrs.height)
                        {
                            height = attrs.height;
                        }
                        
                          
                        var containerID = element.attr('id');                        
                        if (!containerID)
                        {
                            containerID = "ggbContainer" + rnd;                           
                        }
                        var spinnerID =  "ggbSpinner" + rnd;
                        
                        element.html("<div id='"+spinnerID+"'><center><h2>GeoGebra <img src='assets/img/ajax-loader0.gif'/></h2></center></div><div id='"+containerID+"'></div>");



                        var parameters = {"id": appletID, "showToolBar": app, "showMenuBar": app, "showAlgebraInput": app,
                            "showResetIcon": false, "enableLabelDrags": true, "enableShiftDragZoom": true, "enableRightClick": app, "showToolBarHelp": false,
                            "errorDialogsActive": true, "useBrowserForJS": false, "language": currentLang, "isPreloader": false,
                            "screenshotGenerator": false, "preventFocus": false, "fixApplet": false, "prerelease": false
                            , "lf": "modern", "app": true, "perspective": perspective};
                        
                        if(width){
                            parameters.width = width;
                        }
                        if(height){
                            parameters.height = height;
                        }

                        if (base64)
                        {
                            parameters.ggbBase64 = base64;
                        }

                        //Override parameters with parameters attribute
                        if (attrs.parameters)
                        {
                            try {
                                var parametersJSON = JSON.parse(attrs.parameters);
                                for (var e in parametersJSON)
                                {
                                    parameters[e] = parametersJSON[e];
                                }
                            }
                            catch (e)
                            {
                                window.pw.app.DEBUG && console.log("Geogebra directive parse error: " + e);
                            }

                        }

                        //Override parameters with those from model  
                        if (scope.model && scope.model.parameters)
                        {
                            for (var key in scope.model.parameters)
                            {
                                parameters[key] = scope.model.parameters[key];
                            }
                        }


                        parameters.appletOnLoad = function () {
                            //HIDE SPINNER
                            jQuery('#'+spinnerID).hide();
                            
                            var ggbApplet = document[appletID];
                            
                            if (parameters.perspective === 2)
                            {
                                ggbApplet.evalCommand("ZoomIn[-10,-10,10,10]");
                                ggbApplet.setGridVisible(true);
                                ggbApplet.setAxesVisible(true, true);
                                ggbApplet.refreshViews();
                            }

                            //Not base64
                            if (text && !text.trim().endsWith("=="))
                            {

                                var lines = text.split(";");
                                jQuery.each(lines, function (indx, l) {
                                    l = l.trim();
                                    var id0 = l.indexOf("(");
                                    if (l && id0 >= 0)
                                    {
                                        var cmd = l.slice(0, id0);
                                        if (!cmd)
                                        {
                                            cmd = "evalCommand";
                                        }
                                        var method = ggbApplet[cmd];
                                        if (method)
                                        {
                                            var txt = "[" + l.slice(id0 + 1, -1) + "]";
                                            var args = [];
                                            try {
                                                args = JSON.parse(txt);
                                            }
                                            catch (e)
                                            {
                                                window.pw.app.DEBUG && console.log(e);
                                            }

                                            method.apply(ggbApplet, args);
                                        }
                                        else
                                        {
                                            window.pw.app.DEBUG && console.log("geogebra: unknown cmd " + cmd);
                                        }
                                    }
                                });
                            }

                            if (scope.model && scope.model.onLoad)
                            {
                                scope.model.onLoad(ggbApplet);
                            }


                            if (typeof $ === "function" && window.GGBT_wsf_view !== undefined) {
                                var container = $("#ggbContainer" + rnd);
                                window.GGBT_wsf_view.postProcessApplet(container);
                            }

                        };


                        /** is3D=is 3D applet using 3D view, AV=Algebra View, SV=Spreadsheet View, CV=CAS View, EV2=Graphics View 2, CP=Construction Protocol,
                         *   PC=Probability Calculator, DA=Data Analysis, FI=Function Inspector, PV=Python, macro=Macro View */
                        var views = {"is3D": false, "AV": false, "SV": false, "CV": false, "EV2": false, "CP": true, "PC": false,
                            "DA": false, "FI": false, "PV": false, "macro": false};


                        //Override views with parameters attribute
                        if (attrs.views)
                        {
                            try {
                                var viewsJSON = JSON.parse(attrs.views);
                                for (var e in viewsJSON)
                                {
                                    views[e] = viewsJSON[e];
                                }
                            }
                            catch (e)
                            {
                                window.pw.app.DEBUG && console.log("Geogebra directive parse error: " + e);
                            }

                        }

                        if (scope.model && scope.model.views)
                        {
                            for (var key in scope.model.views)
                            {
                                views[key] = scope.model.views[key];
                            }
                        }


                        var applet;
                        
                        if(scope.geogebra) {
                            var params = {material_id: scope.geogebra};
                            params.appletOnLoad = function(){
                                jQuery('#'+spinnerID).hide();
                            };                                
                            applet = new GGBApplet(params, true);
                            applet.setPreviewImage('https://tube.geogebra.org/images/GeoGebra_loading.png?v='+scope.geogebra);                           
                        } else {
                            applet = new GGBApplet('5.0', parameters, views);
                            applet.setHTML5Codebase('https://www.geogebra.org/web/5.0/web/', true);      //or web3d
                            applet.setJNLPBaseDir('https://tube.geogebra.org/webstart/');
                            applet.setGiacJSURL('https://tube.geogebra.org/webstart/4.4/giac.js');

//                        var version = "5.0" ;
//                        var applet = new GGBApplet(version, parameters, views);
//                        
//                        applet.setJavaCodebaseVersion(version);
//                        applet.setHTML5CodebaseVersion(version);
//                        applet.setHTML5Codebase('http://www.geogebra.org/web/'+version+'/web3d/', true);      //or web3d
//                        //applet.setJNLPFile('www.geogebratube.org/webstart/"+version+"/applet50_web.jnlp');
//                        applet.setJNLPBaseDir('https://tube.geogebra.org/webstart/');
//                        //applet.setPreviewImage('https://tube.geogebra.org/files/00/00/58/14/material-581411.png?v=1427959990', 
//                        //                      'https://tube.geogebra.org/images/GeoGebra_loading.png?v=1427976809');
//                        applet.setGiacJSURL('https://tube.geogebra.org/webstart/4.4/giac.js');

                        }
                        
                      
                        element.ready(function () {
                            applet.inject(containerID, 'auto');
                             console.log(applet);
                              console.log(applet.getAppletObject());
                        });



                        element.on('$destroy', function () {
                            //container has been removed from DOM, get rid of applet
                            applet.removeExistingApplet(containerID, false);
                            applet = null;
                        });

                    });

                }};

        }]);


    app.directive('activityEmbed', function (){
            return {
                restrict: 'E',
                scope: {                    
                    activity: '<'
                },
                link: function (scope, element, attrs) {
                    
                    console.log(scope);
                    
                    var opts = "?idAssignment="+(scope.activity.idAssignment || 0);
                    if(scope.autoplay || attrs.autoplay){
                        opts += "&auto=1";
                    }
                    if(scope.debug || attrs.debug){
                        opts += "&debug=1";
                    }
                    if(scope.guest || attrs.guest){
                        opts += "&guest=1";
                    }
                    if(scope.test || attrs.test){
                        opts += "&test=1";
                    }
                    
                    element.addClass("activity-embed embed-responsive embed-responsive-16by9");
                    var src = '/activities/'+scope.activity.id+'/index.html'+opts;
                    
                    var iframe = $('<iframe class="embed-responsive-item" src="'+src+'"></iframe>');
                    element.append(iframe);                  
                    var btnContainer = jQuery('<div class="btn-fullscreen"><button class="btn btn-default glyphicon glyphicon-glyphicon glyphicon-resize-full"></button></div>');
                    element.append(btnContainer);
                    var btnNewWindow = jQuery('<div class="pull-right" style="font-size:12px; font-family: sans-serif"><a href="'+src+'" target="_blank"><span class="glyphicon glyphicon-link"></span>Obrir en una finestra nova.</a></div>');
                    btnNewWindow.insertAfter(element);
                  
                    var btn =  btnContainer.find("button");
                    btn.on("click", function(evt){
                        window.pw.FScreen.toggleFullscreen(element, btn);                        
                    });
                    
                    
                    window.pw.FScreen.setOnfullscreenchange(function(evt){
                        if(!window.pw.FScreen.fullscreenElement()){
                            window.pw.FScreen.exitFullscreen();
                        }
                     });
                    
                    
                    pw.iframeAPI.attachListener(function(evtName, msg){
                        if(attrs.onplay === "fullscreen" || scope.activity.onplay === "fullscreen"){         
                                if(evtName==="onPlay"){
                                  window.pw.FScreen.requestFullscreen(element, btn);
                                }
                                if(evtName==="onEnd"){
                                  window.pw.FScreen.exitFullscreen(element, btn);
                                }
                        }
                    });
                                         
                    
                    scope.$on('$destroy', function () {
                        btn.off();
                        pw.iframeAPI.destroy();
                        iframe.attr("src", "about:blank");
                        window.pw.FScreen.setOnfullscreenchange(null);                        
                    });
            }
        };
    });
    
    app.directive('compile', ['$compile', function ($compile) {
            return {
                restrict: 'A',
                scope: {
                    compile: '<'
                },
                link: function (scope, element, attrs) {
                    var unwatch;
                    var doCompile = function (value) {
                        element.html(value);
                        $compile(element.contents())(scope);
                    };

                    if (attrs.compileOnce) {
                        doCompile(scope.compile);
                    } else {
                        unwatch = scope.$watch("compile", doCompile);
                    }
 
                    scope.$on('$destroy', function () {
                        unwatch && unwatch();
                    });
            }
        };
    }]);
 

    app.directive('beanEditor', ['$compile', function($compile){
            return {
                restrict: 'E',
                scope: {ngModel: "=ngModel", ngDisabled: "=ngDisabled", beanOpts: "=beanOpts"},                 
                link: function (scope, element, attrs) {
                    
                    scope.tgs = {}; //toggles object
                    scope.beanOpts = scope.beanOpts || {canAdd: false, canDel: false, readonly: {}, hide: {}};
                    //
                    scope.delProp = function(key, id, id2){
                        var obj = scope.ngModel;
                        var par = obj;
                        key.substring(1).split(".").forEach(function(e){
                            par = obj;
                            obj = obj[e];                            
                            key = e;
                        });
                        delete par[key];
                        
                        var myEl = angular.element( jQuery( '#'+id ) );
                        if(myEl){
                            myEl.html('');
                            myEl.remove();
                        }
                        if(id2){
                           var myEl = angular.element( jQuery( '#'+id2 ) );
                           if(myEl){
                               myEl.html('');
                               myEl.remove();
                           }   
                        }
                    };
                    //
                    scope.addProp = function(key, id){
                        var obj = scope.ngModel;                        
                        key.substring(1).split(".").forEach(function(e){                            
                            obj = obj[e];                                                       
                        });                       
                    };
                    
                    //Recursive parsing of object
                    var parseObj = function(object, parentKey){
                        var html = "";                       
                        parentKey = parentKey || ".";
                        
                        Object.keys(object).forEach(function (key) {
                            var id = Math.random().toString(36).slice(2);
                            html += "<tr id='"+id+"' ng-if='!beanOpts.hide" +parentKey + key + "'>";
                            var obj = object[key];
                            
                            var type = typeof (obj);
                            var delButton = "<button class='btn btn-xs btn-danger' title='Delete property' ng-if='beanOpts.canDel' ng-click='delProp(\""+parentKey+key+"\", \""+id+"\")'>x</button> ";
                            var addButton = "<button class='btn btn-xs btn-success' title='Add property' ng-if='beanOpts.canAdd' ng-click='addProp(\""+parentKey+key+"\", \""+id+"\")'>+</button> ";
                            
                            if (type === "string") {
                                html += "<td> " + delButton + key + "</td><td> <input type='text' ng-disabled='ngDisabled || beanOpts.readonly" +parentKey + key + " ' ng-model='ngModel" +parentKey + key + "'/></td>";
                            } else if (type === "number") {
                                html += "<td>" + delButton + key + "</td><td> <input type='number' ng-disabled='ngDisabled || beanOpts.readonly" +parentKey + key + " ' ng-model='ngModel" + parentKey+ key + "'/></td>";
                            } else if (type === "boolean") {
                                html += "<td>" + delButton + key + "</td><td> <input type='checkbox' ng-disabled='ngDisabled || beanOpts.readonly" +parentKey + key + " ' ng-model='ngModel" + parentKey+key + "'/></td>";
                            } else if (type === "object") {
                                var key2 = (parentKey+key).replace(/\./g, '_');
                                var id2 = Math.random().toString(36).slice(2);
                                var delButton2 = "<button class='btn btn-xs btn-danger' title='Delete' ng-if='beanOpts.canDel' ng-click='delProp(\""+parentKey+key+"\", \""+id+"\", \""+id2+"\")'>x</button> ";
                                
                                html += "<td colspan='2'><button class='btn btn-xs btn-default' ng-click='tgs."+key2+"=!tgs."+key2+"'><span ng-if='!tgs."+key2+
                                        "'>-</span><span ng-if='tgs."+key2+"'>+</span></button>  <b>" + delButton2 + key + 
                                        "</b>  "+addButton+"</td>";
                                
                                html += "<tr id='"+id2+"'><td></td><td><table ng-if='!tgs."+key2+"'>";
                                html += parseObj(obj, parentKey+key+".");
                                html += "</td></table></tr>";
                            } else {
                                html += "<td>" + key + "</td><td> <span ng-bind='ngModel" + parentKey+key + "'></span></td>";
                            }                            
                            html += "</tr>";
                        });                        
                        return html;
                    };
                    
                    var html =  "<table>";
                    if(scope.ngModel){
                        html += parseObj(scope.ngModel);
                    }
                    html+="</table>";
                    element.html(html);
                    $compile(element.contents())(scope);
                }
            };
    }]);
    
 
}(window.pw.app, angular));
