window.pw = window.pw || {};
/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

/*
 * Modules which will be lazyloaded
 * 'angular-split-pane','ngtable''assets/libs/angular-markdown/markdown','datetimepicker','multiple-select', 'angular_tree', 'nztoggle'
 *  //,'uiace'
 */

(function (angular, window) {
    'use strict';

    angular.module('angular-clipboard', [])
            .factory('clipboard', ['$document', function ($document) {
                    function createNode(text, context) {
                        var node = $document[0].createElement('textarea');
                        node.style.position = 'absolute';
                        node.textContent = text;
                        node.style.left = '-10000px';
                        if (context instanceof HTMLElement) {
                            node.style.top = context.getBoundingClientRect().top + 'px';
                        }
                        return node;
                    }

                    function copyNode(node) {
                        try {
                            // Set inline style to override css styles
                            $document[0].body.style.webkitUserSelect = 'initial';
                            var selection = $document[0].getSelection();
                            selection.removeAllRanges();
                            node.select();
                            if (!$document[0].execCommand('copy')) {
                                throw('failure copy');
                            }
                            selection.removeAllRanges();
                        } finally {
                            // Reset inline style
                            $document[0].body.style.webkitUserSelect = '';
                        }
                    }

                    function copyText(text, context) {
                        var node = createNode(text, context);
                        $document[0].body.appendChild(node);
                        copyNode(node);
                        $document[0].body.removeChild(node);
                    }

                    return {
                        copyText: copyText,
                        supported: 'queryCommandSupported' in document && document.queryCommandSupported('copy')
                    };
                }])
            .directive('clipboard', ['clipboard', function (clipboard) {
                    return {
                        restrict: 'A',
                        scope: {
                            onCopied: '&',
                            onError: '&',
                            text: '=',
                            supported: '=?'
                        },
                        link: function (scope, element) {
                            scope.supported = clipboard.supported;
                            element.on('click', function (event) {
                                try {
                                    clipboard.copyText(scope.text, element[0]);
                                    if (angular.isFunction(scope.onCopied)) {
                                        scope.$evalAsync(scope.onCopied());
                                    }
                                } catch (err) {
                                    if (angular.isFunction(scope.onError)) {
                                        scope.$evalAsync(scope.onError({err: err}));
                                    }
                                }
                            });
                        }
                    };
                }]);


    // 'ngAnimate': 'angularSortable' 'angular-sortable-view',  load lazily if required
    var app = angular.module('piWorld', ['ngSanitize', 'ngCookies', 'ui.router', 'ui.bootstrap', 'angular-growl',
        'pascalprecht.translate', 'angular-clipboard', 'oc.lazyLoad'])
            .constant('CONFIG', {
                restURL: '',
                NODE_PORT: 3000,
                SERVERIP: window.pw.DEBUG ? "192.168.1.44:3000" : "https://piworld.es"
            })
            .constant('USER_ROLES', {
                admin: 0,
                teacher: 100,
                teacherNonEditing: 105,
                teacheradmin: 110,
                student: 200,
                guest: 300,
                undefined: 400,
                parents: 500
            }).constant('AVAILABLE', {
        groups: ['1 ESO', '2 ESO', '3 ESO', '4 ESO', '1 BAT', '1 BATCS', '2 BAT', '2 BATCS'],

        groupsStar: ['*', '1 ESO', '2 ESO', '3 ESO', '4 ESO', '1 BAT', '1 BATCS', '2 BAT', '2 BATCS'],

        categories: {1: ['ALG', 'ALG.BINOM', 'ALG.DET', 'ALG.EQ.1ST', 'ALG.EQ.2ND', 'ALG.EQ.BIQUAD', 'ALG.EQ.FRAC', 'ALG.EQ.POLY', 'ALG.EQ.SQRT', 'ALG.EQ.SYS', 'ALG.EQ.SYS.DISCUSS', 'ALG.EQ.SYS.GAUSS', 'ALG.EQ.SYS.NOLIN', 'ALG.EQ.TRIG', 'ALG.FRAC', 'ALG.FRAC.OP', 'ALG.FRAC.SIMP', 'ALG.IDENT', 'ALG.INEQ', 'ALG.INEQ.1ST', 'ALG.INEQ.2ND', 'ALG.INEQ.SYS', 'ALG.MATRIX', 'ALG.MATRIX.OP', 'ALG.MONOMIAL', 'ALG.POLY', 'ALG.POLY.BIQUAD', 'ALG.POLY.DIV', 'ALG.POLY.DIV.RUFINI', 'ALG.POLY.FACTOR', 'ALG.POLY.OP', 'ALG.POLY.ROOTS', 'ARI', 'ARI.CONVERSIONS', 'ARI.PERCENT', 'ARI.PERCENT.CHAIN', 'ARI.PERCENT.CHAIN.PB', 'ARI.PERCENT.PB', 'ARI.PROPORTIONS', 'ARI.PROPORTIONS.COMPOUND', 'ARI.PROPORTIONS.COMPOUND.PB', 'ARI.PROPORTIONS.PB', 'ARI.SUCCESSION', 'EST', 'EST.1D', 'EST.1D.QUARTILS', 'EST.2D', 'EST.2D.REGRESSION', 'FUN', 'FUN.ASIMP', 'FUN.COMPO', 'FUN.CONT', 'FUN.CURV', 'FUN.DERIV', 'FUN.DOM', 'FUN.ELEMENTAL', 'FUN.EXTREMA', 'FUN.INFLEX', 'FUN.INTG', 'FUN.INTG.AREA', 'FUN.INTG.VOLUM', 'FUN.INVERSE', 'FUN.LIM', 'FUN.LIM.HOPITAL', 'FUN.LIM.LATERAL', 'FUN.MONOTONY', 'FUN.PERIODIC', 'FUN.REPR', 'GEO', 'GEO.ANA', 'GEO.ANA.LINES', 'GEO.ANA.MESURE', 'GEO.ANA.PLANES', 'GEO.ANA.POSITION', 'GEO.AREA', 'GEO.PERIMETER', 'GEO.POLYHEDRA', 'GEO.PYTHAGORAS', 'GEO.THALES', 'GEO.VEC', 'GEO.VOLUM', 'MISC', 'NUM', 'NUM.APROX', 'NUM.CIENTIFIC', 'NUM.COMPLEX', 'NUM.COMPLEX.OP', 'NUM.DEC', 'NUM.DEC.OP', 'NUM.DEC.PB', 'NUM.DIV', 'NUM.ERR', 'NUM.FRAC', 'NUM.FRAC.OP', 'NUM.FRAC.PB', 'NUM.FRAC.SIMP', 'NUM.GCD', 'NUM.INT', 'NUM.INT.OP', 'NUM.INT.PB', 'NUM.INTERVAL', 'NUM.LCM', 'NUM.LOG', 'NUM.LOG.OP', 'NUM.LOG.PROP', 'NUM.MULT', 'NUM.POW', 'NUM.POW.OP', 'NUM.POW.PROP', 'NUM.PRIME', 'NUM.REAL', 'NUM.REAL.OP', 'NUM.REAL.PB', 'NUM.SQRT', 'NUM.SQRT.OP', 'NUM.SQRT.PROP', 'NUM.WHOLE', 'NUM.WHOLE.OP', 'NUM.WHOLE.PB', 'NUN.SEG', 'NUN.SEG.OP', 'NUN.SEG.PB', 'PROB', 'PROB.BAYES', 'PROB.BINOMIAL', 'PROB.LAPLACE', 'PROB.NORMAL', 'PROB.TREE', 'TRI', 'TRI.COSTHEO', 'TRI.FORMULA', 'TRI.IDENTITIES', 'TRI.RATIOS', 'TRI.SINTHEO', 'TRI.TRIANGLE'],
            2: ['MECANICA', 'OPTICA', 'ENERGIA', 'CINEMATICA', 'MAGNETISME', 'ELECTRICITAT', 'GRAVITACIÓ'],
            3: []
        },
        activityTypes: ['A', 'V', 'Q', 'U'],

        letters: ['', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'A/B', 'B/C', 'C/D'],

        langs: ['ca', 'es', 'en']

    })
            .constant('AUTH_EVENTS', {
                loginSuccess: 'auth-login-success',
                loginFailed: 'auth-login-failed',
                logoutSuccess: 'auth-logout-success',
                sessionTimeout: 'auth-session-timeout',
                notAuthenticated: 'auth-not-authenticated',
                notAuthorized: 'auth-not-authorized'

            }).constant('uiDatetimePickerConfig', {
        dateFormat: 'dd-MM-yyyy HH:mm',
        defaultTime: '12:00:00',
        html5Types: {
            date: 'dd-MM-yyyy',
            'datetime-local': 'dd-MM-yyyy HH:mm:ss',
            'month': 'MM-yyyy'
        },
        initialPicker: 'date',
        reOpenDefault: false,
        enableDate: true,
        enableTime: true,
        buttonBar: {
            show: true,
            now: {
                show: true,
                text: 'Ara'
            },
            today: {
                show: true,
                text: 'Avui'
            },
            clear: {
                show: true,
                text: 'Esborra'
            },
            date: {
                show: true,
                text: 'Data'
            },
            time: {
                show: true,
                text: 'Temps'
            },
            close: {
                show: true,
                text: 'Tanca'
            }
        },
        closeOnDateSelection: true,
        closeOnTimeNow: true,
        appendToBody: false,
        altInputFormats: [],
        ngModelOptions: {},
        saveAs: false,
        readAs: false
    });



    app.config(['$ocLazyLoadProvider', '$qProvider', 'growlProvider', 'growl', '$stateProvider',
        '$controllerProvider', '$compileProvider', '$filterProvider', '$provide', '$httpProvider',
        function ($ocLazyLoadProvider, $qProvider, growlProvider, growl, $stateProvider, $controllerProvider,
                $compileProvider, $filterProvider, $provide, $httpProvider) {


            //For production
            $compileProvider.debugInfoEnabled(false);
            $compileProvider.commentDirectivesEnabled(false);
            $compileProvider.cssClassDirectivesEnabled(false);

            $qProvider.errorOnUnhandledRejections(false);


            $provide.decorator("$q", ['$delegate', function ($delegate) {
                    //Helper method copied from q.js.
                    var isPromiseLike = function (obj) {
                        return obj && angular.isFunction(obj.then);
                    };

                    /*
                     * @description Execute a collection of tasks serially. A task is a function that returns a promise
                     *
                     * @param {Array.|Object.} tasks An array or hash of tasks. A tasks is a function
                     * that returns a promise. You can also provide a collection of objects with a success tasks, failure task, and/or notify function
                     * @returns {Promise} Returns a single promise that will be resolved or rejected when the last task
                     * has been resolved or rejected.
                     */
                    function serial(tasks) {
                        //Fake a "previous task" for our initial iteration
                        var prevPromise;
                        var error = new Error();
                        var results = [];

                        var lastTask = function () {
                            var endPromise = $delegate.defer();
                            endPromise.resolve(results);
                            return endPromise.promise;
                        }
                        tasks = tasks.concat(lastTask);

                        angular.forEach(tasks, function (task, key) {
                            var success = task.success || task;
                            var fail = task.fail;
                            var notify = task.notify;
                            var nextPromise;

                            //First task
                            if (!prevPromise) {
                                nextPromise = success();
                                if (!isPromiseLike(nextPromise)) {
                                    error.message = "Task " + key + " did not return a promise.";
                                    throw error;
                                }
                            } else {
                                //Wait until the previous promise has resolved or rejected to execute the next task
                                nextPromise = prevPromise.then(
                                        /*success*/function (result) {
                                            results.push(result);
                                            if (!success)
                                                return results;

                                            var ret = success(result);
                                            if (!isPromiseLike(ret)) {
                                                error.message = "Task " + key + " did not return a promise.";
                                                throw error;
                                            }
                                            return ret;
                                        },
                                        function (reason) {
                                            if (!fail) {
                                                return $delegate.reject(reason);
                                            }
                                            var ret = fail(reason);
                                            if (!isPromiseLike(ret)) {
                                                error.message = "Fail for task " + key + " did not return a promise.";
                                                throw error;
                                            }
                                            return ret;
                                        },
                                        notify);
                            }
                            prevPromise = nextPromise;
                        });

                        return prevPromise || $delegate.when();
                    }

                    $delegate.serial = serial;
                    return $delegate;
                }]);

            //Createjs stuff
            //createjs && (createjs.Sound.alternateExtensions = ["mp3"]);

            //All these modules are lazy loaded by route resolution.
            $ocLazyLoadProvider.config({
                jsLoader: requirejs,
                events: true,
                debug: false,
                modules: [
                    {name: 'ui.ace', files: ['uiace']},
                    {name: 'ui.tree', files: ['angular_tree']},
                    {name: 'nzToggle', files: ['nztoggle']},
                    {name: 'ui.bootstrap.datetimepicker', files: ['datetimepicker']},
                    {name: 'multipleSelect', files: ['multiple_select']},
                    {name: 'fxpicklist', files: ['fxpicklist']},
                    {name: 'markdown', files: ['showdown', 'markdown']},
                    {name: 'jsxGraph', files: ['jsxgraph']},
                    {name: 'ngFileUpload', files: ['fileupload']},
                    {name: 'AngularPrint', files: ['angular-print']},
                    {name: 'ngJSPanel', files: ['ngJSPanel']},
                    {name: 'ui.tinymce', files: ['ng_tinymce']},
                    {name: 'hljs', files: ['ng_highlight']},
                    {name: 'ngIdle', files: ['ng_idle']},
                    {name: 'angular-sortable-view', files: ['angularSortable']}
                ]
            });

            // Keep a copy of the most common providers in order to be accessed after bootstrap
            // Register new states with the $stateProvider
            // and register new controllers with controllerProvider.
            app.register = {
                controller: $controllerProvider.register,
                directive: $compileProvider.directive,
                component: $compileProvider.component,
                stateProvider: $stateProvider,
                factory: $provide.factory,
                service: $provide.service,
                filter: $filterProvider.register
            };

            growlProvider.globalTimeToLive(5000);
            growlProvider.globalDisableCountDown(true);
            growlProvider.onlyUniqueMessages(false);


            function templateFactoryDecorator($delegate) {
                var fromUrl = angular.bind($delegate, $delegate.fromUrl);
                $delegate.fromUrl = function (url, params) {
                    if (url !== null && angular.isDefined(url) && angular.isString(url)) {
                        url += (url.indexOf("?") === -1 ? "?" : "&");
                        url += "bust=" + window.pw.PW_VERSION;
                    }
                    return fromUrl(url, params);
                };
                return $delegate;
            }

            $provide.decorator('$templateFactory', ['$delegate', templateFactoryDecorator]);

            /*
             var logsOutUserOn401 = ['$q', '$location', function($q, $location) {
             
             var success = function (response) {
             //console.log(response);
             return response;
             };
             
             var error = function (response) {
             //console.log(response);
             if (response.status === 401) {
             //redirect them back to login page
             $location.path('/login');
             return $q.reject(response);
             }
             else {
             return $q.reject(response);
             }
             };
             
             return function (promise) {
             return promise.then(success, error);
             };
             
             }];
             */

            // Http interceptors for handling different errors

            var errorInterceptor = ['$q', '$state', function ($q, $state) {
                    return {
                        'responseError': function (res) {
                            if (res.status === 401) {
                                //console.log("Intercepted", res);
                                // Server assumes unathenticated user, then must logout
                                // Remove localstore and redirect to login
                                growl.warning("Session expired!");
                                localStorage.removeItem("pwSession");
                                window.location.href="/";
                            } else if (res.status === 403) {
                                //console.log("Intercepted", res);
                                $state.go("home.unauthorized");
                            }
                            return $q.reject(res);
                        }
                    };
                }];

            $httpProvider.interceptors.push(errorInterceptor);


        }]);


    app.run(['$rootScope', '$location', '$state', '$transitions', 'Auth', '$timeout', '$anchorScroll', '$http', '$q', '$translate', 'USER_ROLES',
        function ($rootScope, $location, $state, $transitions, Auth, $timeout, $anchorScroll, $http, $q, $translate, USER_ROLES) {

            var viewLoader = jQuery("#viewloader");

            //RETAIN SCROLL POSITIONS AMONG VISITED VIEWS
            $rootScope.scrollPos = {}; // scroll position of each view

            $rootScope.adjustPadding = function (activity) {
                var elem = jQuery(activity ? "#navtop" : ".navbar-fixed-top");
                if (elem) {
                    elem.ready(function () {
                        var pt = elem.height() + 1;
                        jQuery("body").css("padding-top", pt);
                    });
                }
            };


            $http.postq = function (url, params) {

                var q = $q.defer();
                $http.post(url, params).then(function (response) {
                    q.resolve(response.data);
                });
                return q.promise;

            };

            $rootScope.tinymceOpts = function (lang) {
                return {
                    inline: false,
                    valid_elements: '*[*]',
                    cleanup: false,
                    verify_html: false,
                    language: lang,
                    plugins: 'eqneditor autolink lists link image charmap print preview anchor code textcolor fullscreen',
                    toolbar: 'undo redo | eqneditor link image | styleselect forecolor backcolor | bold italic underline | bullist numlist outdent indent | charmap code | fullscreen',
                    skin: 'lightgray',
                    theme: 'modern',
                    extended_valid_elements: "script[charset|defer|language|src|type]"
                };
            };

            var i18n_badges = {
                ca: {
                    1: "Comentaris",
                    2: "Regularitat",
                    3: "Millor de la setmana",
                    4: "Millor del mes",
                    5: "Repte de la setmana",
                    50: "Guanyador d'un Kahoot",
                    100: "Especial de Nadal",
                    101: "Especial de Pasqua",
                    200: "Deures fets",
                    201: "Deures fets parcialment",
                    202: "Treballa i participa a classe",
                    203: "Participa a classe",
                    300: "No ha fet els deures",
                    301: "Xerra i/o molesta",
                    302: "Ús indegut d'aparells electrònics",
                    303: "No obeix al professor",
                    304: "No treballa a classe"
                },
                es: {
                    1: "Comentarios",
                    2: "Regularidad",
                    3: "Mejor de la semana",
                    4: "Mejor del mes",
                    5: "Reto de la setmana",
                    50: "Ganador de un Kahoot",
                    100: "Especial de Navidad",
                    101: "Especial de Pascua",
                    200: "Deberes hechos",
                    201: "Deberes parcialmente hechos",
                    202: "Trabaja y participa en clase",
                    203: "Participa en clase",
                    300: "No ha hecho los deberes",
                    301: "Habla y/o molesta",
                    302: "Uso inadecuado de aparatos electrónicos",
                    303: "No obedece al profesor",
                    304: "No trabaja en clase"
                },
                en: {
                    1: "Comments",
                    2: "Regularity",
                    3: "Best of the week",
                    4: "Best of the month",
                    5: "Week challenge",
                    50: "Kahoot winner",
                    100: "Xmas special badge",
                    101: "Easter special badge",
                    200: "Homework done",
                    201: "Homework partially done",
                    202: "Work and participate in class",
                    203: "Participate in class",
                    300: "Homework not done",
                    301: "Speaks and / or annoys",
                    302: "Improper use of electronic devices",
                    303: "Does not obey the teacher",
                    304: "Does not work in class"
                }
            };

            $rootScope.badgeDescription = function (type) {
                var lang = $translate.use();
                var desc = "Badge";
                return (i18n_badges[lang] || {})[type] || desc;
            };

            // window.onbeforeunload = function () {
            //     return "Tanqueu l'aplicació des del menú. Cliqueu sobre el vostre avatar i seleccioneu sortir.";
            // };

            $anchorScroll.yOffset = 50;   // always scroll by 50 extra pixels

            // enumerate routes that don't need authentication
            var routesThatDontRequireAuth = ['/login'];

            // check if current location matches route  
            /* var routeClean = function (route) {
             return _.find(routesThatDontRequireAuth,
             function (noAuthRoute) {
             return _.str.startsWith(route, noAuthRoute);
             });
             };*/

            var routeClean = function (route) {
                return routesThatDontRequireAuth.filter(
                        function (noAuthRoute) {
                            return route.startsWith(noAuthRoute);
                        });
            };

            $rootScope.bypass = false;

            //Save exit time when rootScope destroys
            $rootScope.$on("$destroy", function () {
                //console.log("Destroyed rootScope - setting logout time");
                $http({
                    url: '/rest/auth/logout',
                    method: 'POST',
                    async: false,
                    data: {idLogin: Auth.Session.getUser().idLogin}
                    //headers: {'Content-Type': 'application/x-www-form-urlencoded'}
                });
            });


            jQuery(window).on('scroll', function () {
                if ($rootScope.okSaveScroll) {
                    // false between $routeChangeStart and $routeChangeSuccess
                    $rootScope.scrollPos[$location.path()] = jQuery(window).scrollTop();
                }
            });


            $transitions.onSuccess({}, function (trans) {
                viewLoader.fadeOut(250);

                $timeout(function () {
                    // wait for DOM, then restore scroll position
                    $rootScope.okSaveScroll = true;
                    var st = $rootScope.scrollPos[$location.path()];
                    jQuery(window).scrollTop(st ? st : 0);
                    if (trans.$to().name === "home") {
                        jQuery("#homeDashboard").fadeIn(100);
                    } else {
                        jQuery("#homeDashboard").fadeOut(250);
                    }
                });
            });

            $transitions.onError({}, function (trans) {
                viewLoader.fadeOut(250);
                //if(trans._error.type===3){
                //On cancelled transtion go to home
                //trans.router.stateService.target("home");
                //}
            });

            $transitions.onBefore({to: "home.**"}, function (trans) {
                var promise = true;
                var to = trans.to();

                if (trans.from().name === "login" && to.name === "home.activity") {
                    localStorage.setItem("cachedRouteTo", JSON.stringify({name: to.name, params: trans.params()}));
                }


                //Authorization based on roles
                if (to && to.data && to.data.authorizeRoles && !Auth.isAuthorized(to.data.authorizeRoles))
                {
                    console.log("Upps! Not authorized?", to.name);
                    promise = false;
                }

                //Now use authentication based on stateParams if not admin
                if (to && to.data && to.data.authStateParams) {
                    var defer = $q.defer();
                    promise = defer.promise;

                    Auth.authStateParams(to.name, trans.params()).then(function (isAuth) {
                        if (isAuth) {
                            defer.resolve(true);
                        } else {
                            console.log("Not authorized");
                            defer.resolve(false);

                        }
                    });
                }

                return promise;
            });


            $transitions.onStart({to: "login"}, function (trans) {


                var promise = Auth.isAuthenticated();
                var defer = $q.defer();
                promise.then(function (isA) {
                    if (isA) {
                        if (Auth.Session.getUser().idRole === USER_ROLES.parents) {
                            $state.go("home.parents");
                        } else {
                            $state.go("home");
                        }
                    }
                    defer.resolve();
                });

                return defer.promise;

            });




//        //Intercept state changes
//         $rootScope.$on('$stateChangeSuccess', function (ev, to, toParams, from, fromParams) {
//             viewLoader.fadeOut(250); 
//            
//             $timeout(function() { 
//                // wait for DOM, then restore scroll position
//                $rootScope.okSaveScroll = true;
//                var st = $rootScope.scrollPos[$location.path()];
//                jQuery(window).scrollTop(st? st : 0);    
//                if(to.name==="home"){
//                    jQuery("#homeDashboard").fadeIn(100);
//                } else{
//                    jQuery("#homeDashboard").fadeOut(250);
//                }
//             });
//
//         });
//        $rootScope.$on('$stateChangeError', function (ev, to, toParams, from, fromParams) {
//             viewLoader.fadeOut(250); 
//         });
//      
//        
//        var lastTransition;
//        $rootScope.$on('$stateChangeStart', function (ev, to, toParams, from, fromParams) {
//            console.log("$stateChangeStart", ev, to, from);
//            if(lastTransition===to.name){
//                console.log("second time we come here, returning");                
//                return;
//            }
//            lastTransition = to.name;
//            
//            $rootScope.okSaveScroll = false;
//            viewLoader.fadeIn(500); 
//           
//            if($rootScope.bypass){
//                $rootScope.bypass = false;
//                return;
//            }
//            
//            $rootScope.fromState = from;  
//            $rootScope.previousState = from.name || 'login';
//            $rootScope.currentState = to.name;


//            // if route requires auth and user is not logged in: now returns a promise since we implement ids5 checks 
//            Auth.isAuthenticated().then(function(isA){
//                    console.log("NOW AUTH IS RESOLVED TO ", isA);            
//                    if(isA)
//                    {
//                        
////                         //Authorization based on roles
////                        if(to && to.data && to.data.authorizeRoles && !Auth.isAuthorized(to.data.authorizeRoles))
////                        {
////                            console.log("Upps! Not authorized?", to, Auth.isAuthorized(to.data.authorizeRoles));
////                            $location.path('/home/unauthorized/'+from.name+"/"+to.name);
////                        }
////
////                        //Now use authentication based on stateParams if not admin
////                        if(to && to.data && to.data.authStateParams){
////
////                            ev.preventDefault();    
////                            ev.stopPropagation();
////
////                            Auth.authStateParams(to.name, toParams).then(function(isAuth){
////                                if(!isAuth){
////                                    $location.path('/home/unauthorized/'+from.name+"/"+to.name);
////                                } else{
////                                    $rootScope.bypass = true;
////                                    $state.go(to, toParams);
////                                }
////                            });
////                            return;
////
////                        }
// 
//                        if($location.url() === "/login" && !localStorage.getItem("cachedRouteTo")){ 
//                            if(Auth.Session.getUser().idRole === USER_ROLES.guest){                                
//                                $state.go('home.activitysearch');
//                            } else{
//                                $state.go('home');
//                            }
//                        } else {
//                            $state.go(to.name, toParams);
//                        }         
//           
//                    } 
//                    else 
//                    {
            //If trying to access a route like https://localhost:3000/#!/pw/home/activity/145/0
            //and not authenticated, login as guest and then move to the route

//                         if(to.name!=="login"){
//                             var cachedRouteTo = {name: to.name};
//                             cachedRouteTo.params = angular.copy(toParams);
//                             localStorage.setItem("cachedRouteTo", JSON.stringify(cachedRouteTo));
//                             //console.log("Not login. Trying to access route ", to);
//                             //Require login first and, then, move to the correct route
//                             console.log("Credentials needed to access ",to.name,". Redirecting to login page.");
//                             console.log("Prevent from ", from, " to ", to);
//                             viewLoader.fadeOut(250); 
//                             ev.preventDefault();
//                             $state.go("login");
//                         } else {
//                            $rootScope.scrollPos = {};
//                            //redirect back to login     
//                            $rootScope.cachedRouteTo = null;      
//                            ev.preventDefault();
//                            $state.go("login");
//                        }
//                        console.log("Credentials needed. Redirecting to login page.");
//                   } 
//                
//            });



//        });
        }]);


    window.pw.app = app;
    window.app = app;   //keep a copy but deprecated

    window.pw.app.init = function () {

        if (!window.pw.errors) {
            angular.element(function () {
                angular.bootstrap(document, ['piWorld']);
                jQuery("#loader").remove();
                window.clearTimeout(window.pw.hangTimeout);
                window.onerror = null;
                console.error = window.pw.olderr;
            });
        } else {
            console.log("Piworld bootstrap cancelled due to errors");
            console.error("Piworld bootstrap cancelled due to errors");
        }
        //angular.bootstrap(document, ['piWorld']);
    };

}(angular, window));