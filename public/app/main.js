//tracks the registered modules in require and bootstraps application
//
// 'assets/libs/Geogebra/' for local geogebra.
window.pw = window.pw || {};

//window.pw.DEBUG = true;  //Set this value in index.tpl.html

window.pw.GEOGEBRA_ROOT = 'https://www.geogebratube.org/';
window.pw.KATEXCSS = "https://cdnjs.cloudflare.com/ajax/libs/KaTeX/0.8.3/katex.min.css";

//Removed dependency on bootstrap of uibootstrap
//Removed automatic loading of creatine
//Now createjs is load separately, only soundjs is loaded on bootstrap

require.config({

    urlArgs: "bust=" + window.pw.PW_VERSION,
    paths: {
        underscore: 'https://cdnjs.cloudflare.com/ajax/libs/underscore.js/1.8.3/underscore-min',
        text: 'assets/libs/requirejs/require-text',
        css: 'assets/libs/requirejs/require-css',
        async: 'assets/libs/requirejs/require-async',
        font: 'assets/libs/requirejs/require-font',
        image: 'assets/libs/requirejs/require-image',
        json: 'assets/libs/requirejs/require-json',
        noext: 'assets/libs/requirejs/require-noext',
        mathjs: 'activities/libs/math/mathjs',
        fraction: 'activities/libs/math/fraction',
        KAS: 'activities/libs/math/KAS',
        canvaspaint: 'activities/libs/math/mathinput/canvas-painter',
        mathquill: 'activities/libs/math/mathinput/mathquill/mathquill',
        mathquilleditor: 'activities/libs/math/mathinput/mathquill-editor',
        mathpaint: 'activities/libs/math/mathinput/mathpaint',
        mathinput: 'activities/libs/math/mathinput/mathinput',
        mathblanks: 'activities/libs/math/mathinput/mathblanks',

        'activity-quizz': 'activities/libs/activity-quizz',
        'activity-bakejson': 'activities/libs/activity-bakejson',
        'quizzrenderer-input': 'activities/libs/quizzrenderer-input',
        'quizzrenderer-blanks': 'activities/libs/quizzrenderer-blanks',
        'quizzrenderer-checkbox': 'activities/libs/quizzrenderer-checkbox',
        'quizzrenderer-kahoot': 'activities/libs/quizzrenderer-kahoot',
        'quizzrenderer-mathinput': 'activities/libs/quizzrenderer-mathinput',
        'quizzrenderer-radio': 'activities/libs/quizzrenderer-radio',
        'quizzrenderer-roots': 'activities/libs/quizzrenderer-roots',

        mqEdtPalette: 'activities/libs/math/mathinput/mathquill-editor-palette.html',
        mqEdtCss: 'activities/libs/math/mathinput/mathquill-editor',
        'jquery-draggable': "assets/libs/jquery/jquery-draggable",
        'mobile-dnd': "assets/libs/DragDropTouch",
        rateyo: 'assets/libs/jquery/jquery.rateyo.min',
        katex: "https://cdnjs.cloudflare.com/ajax/libs/KaTeX/0.8.2/katex.min",
        katexauto: "https://cdnjs.cloudflare.com/ajax/libs/KaTeX/0.8.2/contrib/auto-render.min",
        jsxgraph: "https://cdnjs.cloudflare.com/ajax/libs/jsxgraph/0.99.6/jsxgraphcore",
        jsxgraphcore: "https://cdnjs.cloudflare.com/ajax/libs/jsxgraph/0.99.6/jsxgraphcore",

        'appmin': 'app.min',
        'angular': 'assets/libs/angular/angular.min',
        'angular-print': 'assets/libs/angular-print/angularPrint',
        'uirouter': "https://cdnjs.cloudflare.com/ajax/libs/angular-ui-router/1.0.3/angular-ui-router.min",
        'uibootstrap': ['https://cdnjs.cloudflare.com/ajax/libs/angular-ui-bootstrap/2.3.2/ui-bootstrap-tpls.min', 'assets/libs/angular-ui-bootstrap/ui-bootstrap-tpls-2.3.2.min'],
        'bootstrap': ['https://maxcdn.bootstrapcdn.com/bootstrap/3.3.7/js/bootstrap.min', 'assets/libs/bootstrap-3.3.7/js/bootstrap.min'],
        'oclazyload': ['https://cdnjs.cloudflare.com/ajax/libs/oclazyload/1.1.0/ocLazyLoad.require.min', 'assets/libs/ocLazyLoad-require.min'],
        'ngcookies': ['https://ajax.googleapis.com/ajax/libs/angularjs/1.6.1/angular-cookies.min', 'assets/libs/angular-1.6.1/angular-cookies'],
        'ngsanitize': ['https://ajax.googleapis.com/ajax/libs/angularjs/1.6.1/angular-sanitize.min', 'assets/libs/angular-1.6.1/angular-sanitize.min'],
        'translate': 'assets/libs/angular-translate/angular-translate.min',
        'translate_cookies': 'assets/libs/angular-translate-storage-cookie/angular-translate-storage-cookie.min',
        'translate_url': 'assets/libs/angular-translate-loader-url/angular-translate-loader-url.min',

        'angulargrowl': 'assets/js/angular-growl/angular-growl.min',
        'jsonh': 'assets/js/jsonh',
        'socketio': ['https://cdnjs.cloudflare.com/ajax/libs/socket.io/2.0.3/socket.io', 'assets/libs/socket.io/lib/client.js'],
        'ace': 'https://cdnjs.cloudflare.com/ajax/libs/ace/1.2.3/ace',
        'uiace': 'assets/libs/angular-ui-ace/ui-ace.min',
        'angulartouch': 'assets/libs/angular-touch/angular-touch.min',
        'angularSortable': ['https://cdnjs.cloudflare.com/ajax/libs/angular-sortable-view/0.0.15/angular-sortable-view.min', 'assets/libs/angular-sortable-view.min'],
        'angularanimate': 'assets/libs/angular-animate/angular-animate.min',
        'datetimepicker': 'assets/libs/angular-ui-bootstrap-datetimepicker/datetimepicker',
        'moment': 'assets/libs/bootstrap-datetimepicker/moment-with-locales.min',
        'fxpicklist': 'assets/libs/picklist', //***
        'multiple_select': 'assets/libs/multiple-select/multiple-select.min', //***
        'angular_tree': 'assets/libs/angular-ui-tree/angular-ui-tree.min',
        'angular-split-pane': 'app/shared/split-pane/angular-split-pane', //??
        'nztoggle': 'assets/libs/nz-toggle/nz-toggle.min',
        'fileupload': 'assets/libs/ng-file-upload/ng-file-upload.min',
        'ngJSPanel': 'assets/libs/jsPanel/angular-jspanel',
        'jqJSPanel': 'assets/libs/jsPanel/jquery.jspanel.min',
        'jqui': 'https://ajax.googleapis.com/ajax/libs/jqueryui/1.9.2/jquery-ui.min',
        'mobile_detect': 'assets/libs/mobile-detect.min',

        'app': 'app/app',
        'routes': 'app/app.routes',
        'directives': 'app/app.directives',
        'factories': 'app/app.factories',
        'controllers': 'app/app.controllers',
        'filters': 'app/app.filters',
        'homeCtrl': 'app/components/home/home',
        'groupsCtrl': 'app/components/groups/groups',
        'studentsCtrl': 'app/components/students/students',
        'progressController': 'app/components/students/progressController',
        'activityReviewCtrl': 'app/components/activity/activityReview',
        'activitySimpleCtrl': 'app/components/activity/activitySimpleCtrl',
        'activitySheetCtrl': 'app/components/activity/activitySheet',
        'activityEditCtrl': 'app/components/activity/activityEditCtrl',
        'activityIdeCtrl': 'app/components/ide/activityIdeCtrl',
        'assignCtrl': 'app/components/assign/assignCtrl',
        'assignmentsCtrl': 'app/components/assign/assignmentsCtrl',


        'mathjax': ['https://cdn.mathjax.org/mathjax/latest/MathJax.js?config=TeX-AMS-MML_HTMLorMML?noext', 'assets/libs/MathJax/MathJax.js?config=TeX-AMS-MML_HTMLorMML'],
        'mathlex': 'assets/libs/mathlex/mathlex.min',
        'mathwrapper': 'assets/libs/mathquill-0.10.1/mathwrapper',

        //Geogebra includes
        'geogebra': window.pw.GEOGEBRA_ROOT + 'scripts/worksheet/general',
        'geogebra2': window.pw.GEOGEBRA_ROOT + 'scripts/deployggb',
        'geogebra3': window.pw.GEOGEBRA_ROOT + 'files/appComp/shared/min',
        'geogebra4': window.pw.GEOGEBRA_ROOT + 'files/appComp/shared/mathquillggb',

        //youtube:: Obsolte ->Replaced by videojs
        //'youtube_api': ['https://www.youtube.com/iframe_api?noext', 'assets/libs/iframe-api'],
        //'youtube_embed': 'assets/libs/video/angular-youtube-embed.min',

        //Videojs
        'videojs_core': ['assets/js/video.js/5.14/video.min', 'https://vjs.zencdn.net/5.14/video'],  
        'videojs': 'assets/js/video.js/5.14/videojs-plugins-all.min',
        'video_embed': 'assets/js/video.js/ng-video-embed.min',

        'tinymce': 'assets/libs/tinymce/tinymce.min',
        'ng_tinymce': 'assets/libs/angular-ui-tinymce/dist/tinymce.min', //'assets/libs/tinymce/ng-tinymce.min',

        'highlight': 'assets/libs/angular-highlight/highlight.pack',
        'ng_highlight': 'assets/libs/angular-highlight/angular-highlight',

        'easeljs': ['https://code.createjs.com/easeljs-0.8.2.min', 'assets/libs/createjs/easeljs-0.8.2.min'],
        'tweenjs': 'https://code.createjs.com/tweenjs-0.6.2.min',
        'soundjs': 'https://code.createjs.com/soundjs-0.6.2.min',
        'preloadjs': 'https://code.createjs.com/preloadjs-0.6.2.min',
        'createjs': ['https://code.createjs.com/createjs-2015.11.26.min', 'assets/libs/createjs/createjs-2015.11.26.min'], //This is the whole packet
        'creatine': 'assets/libs/createjs/creatine-1.0.0.min',

        'filesaver': 'assets/js/FileSaver.min',
        'markermanager': 'assets/libs/markermanager.min',
        'gmaps': 'https://maps.googleapis.com/maps/api/js?key=AIzaSyBQpymLIcE26vpzgp3u6w90OO_aVT1d1R8&noext' 

    },
    shim: {
        mathjax: {
            exports: 'MathJax',
            init: function () {
                MathJax.Hub.Config({
                    //skipStartupTypeset: true,
                    messageStyle: "none",
                    tex2jax: { inlineMath: [['$', '$'], ['\\(', '\\)']] },
                    "HTML-CSS": {
                        showMathMenu: false
                    }
                });
                MathJax.Hub.Configured();
                MathJax.Hub.Startup.onload();
                return MathJax;
            }
        },
        underscorestring: {
            deps: ['underscore'],
            exports: '_'
        },
        // uibootstrap:{
        //    deps: ['bootstrap']  
        // }, 
        uiace: {
            deps: ['ace']
        },
        geogebra: {
            deps: ['geogebra2', 'geogebra3', 'geogebra4']
        },
        jsxgraph: {
            deps: ['css!https://cdnjs.cloudflare.com/ajax/libs/jsxgraph/0.99.6/jsxgraph.css']
        },
        jsxgraphcore: {
            deps: ['css!https://cdnjs.cloudflare.com/ajax/libs/jsxgraph/0.99.6/jsxgraph.css']
        },
        creatine: {
            deps: ['createjs']
        },
        jqui: {
            deps: ['mobile_detect']
        },
        jqJSPanel: {
            deps: ['jqui']
        },
        ngJSPanel: {
            deps: ['jqJSPanel']
        },
        ng_tinymce: {
            deps: ['tinymce']
        },
        ng_highlight: {
            deps: ['highlight']
        },
        markermanager: {
            deps: ['gmaps']
        },
        pokemath: {
            deps: ['markermanager']
        },
        translate_cookies: {
            deps: ['translate']
        },
        translate_url: {
            deps: ['translate']
        },
        //These modules are loaded on bootstrap, all other modules are loaded by oclazyload on demand  //'angularanimate',
        appmin: {
            deps: ['uirouter', 'uibootstrap', 'oclazyload', 'ngcookies', 'ngsanitize', 'translate_cookies', 'translate_url', 'angulargrowl']
        },
        angular: {
            exports: 'angular'
        },
        uirouter: { deps: ['angular'] },
        uibootstrap: { deps: ['angular'] },
        oclazyload: { deps: ['angular'] },
        ngcookies: { deps: ['angular'] },
        ngsanitize: { deps: ['angular'] },
        angularanimate: { deps: ['angular'] },
        translate: { deps: ['angular'] },
        angulargrowl: { deps: ['angular'] },
        ng_idle: { deps: ['angular'] },
        angularSortable: { deps: ['angular'] },
        angular_locale1: { deps: ['angular'] },
        angular_locale2: { deps: ['angular'] },
        videojs: { deps: ['videojs_core'] },

        underscore: {
            exports: '_'
        },
        katexauto: {
            deps: ["katex"]
        },
        KAS: {
            deps: ['underscore']
        },
        mathpaint: {
            deps: ['canvaspaint']
        },
        mathquilleditor: {
            deps:  ['mathquill'],
            exports: 'MQ'
        },
        mathinput: {
            deps: ['mathquilleditor', 'mathpaint']
        },
        "activity-quizz": {
            deps: ["activity-bakejson", "mobile-dnd"]
        }
    },
    baseUrl: '',
    waitSeconds: 60
});

//Bootstrap application //'socketio',   'creatine', 'soundjs'

require(['socketio', 'appmin'], function (io) {
    window.io = io;

    if (window.pw.grave === 0) {
        window.pw.app.init();
    } else {
        console.log("PiWorld bootstrap cancelled due to grave errors: ", window.pw.grave);
    }
});
