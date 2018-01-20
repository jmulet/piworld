/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
(function(app, angular){
'use strict';

/**
 * CAUTION!!!! NEVER INJECT $http or $q in the config state; They are not ready!
 */

  app.config(['$stateProvider','$urlRouterProvider', 'USER_ROLES',   
        function ($stateProvider, $urlRouterProvider, USER_ROLES) {

  $urlRouterProvider.otherwise('/login');
 
   var useMin = window.pw.DEBUG? ".js" : ".min.js";
 
    /*
     * Before loading controllerName; resolve deps if defined     
     * args:: files and deps can be string or array
     */
    var lazyLoader = function($q, files, deps, forceUndef) {    
          pw.DEBUG && console.log("lazyLoader:: files="+files, "; deps=",deps);
          
          if(typeof(files)==='string'){
              files = [files];
          }
          if(deps && typeof(deps)==='string'){
              deps = [deps];
          }
          
          if(forceUndef){
            var nn = files.length;
            for(var i=0; i<nn; i++){
               require.undef(files[i]);
            }
         }
          var deferred = $q.defer();
          
          if(deps){
              lazyLoader($q, deps, forceUndef).then(function(){
                    lazyLoader($q, files, forceUndef).then(function(){
                        deferred.resolve();
                    });
              });
          } else {          
                require(files, function() {
                    window.pw.DEBUG && console.log("lazyLoader:: RESOLVED files="+files);
                    deferred.resolve(); 
                }, function(err){
                    console.log("lazyLoader:: ERROR! files ",files," cannot be resolved; ",err);
                    deferred.resolve(); 
                });
          }
          return deferred.promise;            
    };    
    
    //This hack is because we cannot inject $q directly in app.config!
    var lazyResolver = function(files, deps, forceUndef){
        return ["$q", function($q){
            return lazyLoader($q, files, deps, forceUndef);
        }];
    };

//    var emptyQP  = function(client, server){       
//            return {   
//                isEmpty: true,
//                init : function(){
//                    this._super();                       
//                },                
//                define : function(){}
//            };
//            
//        }; 
////
//    //Loads and Resolves an activity controller
//    //First tries to load .js if not, loads .json
//    var loadQuestionProvider = function() {
//      return ["$transition$", "$q", "$templateCache", function($transition$, $q, $templateCache) {
//          var deferred = $q.defer();
//          var id = $transition$.params().idActivity;
//          var f = "activities/"+id+"/QProvider.min.js";
//          //Remove from angular cache theory for this activity
//          $templateCache.remove("activities/"+id+"/theory.html");
//          $templateCache.remove("activities/"+id+"/theory_ca.html");
//          $templateCache.remove("activities/"+id+"/theory_es.html");
//            
//          //force reload
//          require.undef(f);
//          require([f], function(obj) {
//              deferred.resolve(obj); 
//          }, function(err){
//              console.log("Returning an empty questionProvider");              
//              deferred.resolve(emptyQP); //In case of 404 - Resolve an empty questionProvider
//          });
//          return deferred.promise;
//      }];
//    };
//    
//    //Loads and Resolves i18n Provider for the activity
//   var loadQuestioni18nProvider = function() {
//      return ["ActivitySrv","$transition$", function(ActivitySrv, $transition$) {
//           var promise = ActivitySrv.i18n($transition$.params().idActivity);
//           return promise;
//      }];
//   };

  $stateProvider.state('login', {
      
      url: '/login',
      templateUrl: 'app/components/login/login.html',
      controller: 'LoginController',
      data: {
        authorizeRoles: [
            USER_ROLES.admin,
            USER_ROLES.teacher,
            USER_ROLES.teacherNonEditing,
            USER_ROLES.teacheradmin,
            USER_ROLES.student,
            USER_ROLES.guest,
            USER_ROLES.undefined]
      }
  })    
  .state('pw', {
      url: '/pw',
     template: '<div id="pwroot" ui-view></div>',
      "abstract": true,
      resolve: {
          isAuth: ['Auth', '$state', function(Auth, $state){ 
                         var promise = Auth.isAuthenticated();
                         promise.then(function(isA){
                             if(!isA){
                                  //I want to access app and not authorized....
                                 console.log("Not authenticated. Going to login ...");
                                 //localStorage.setItem("cachedRouteTo", $state.getCurrentPath());
                                 $state.go("login");
                             }
                         });
                         return promise;
                 }]
      }    
  })
//  .state('login.search', {
//      url: '^/login/search',
//      templateUrl: 'app/components/activity/activitySearch.html',
//      controller: 'ActivitySearchController',
//      resolve:{
//        lazyModules_table: ['$ocLazyLoad', function($ocLazyLoad) {
//            return $ocLazyLoad.load('ngTable');
//        }]
//      },
//      data:{
//        authorizeRoles: [USER_ROLES.guest]
//      }
//  })
//  .state('login.activity', {
//      url: '^/login/activity/{idActivity:int}/{idAssignment:int}', 
//      templateUrl: 'app/components/activity/activitySimple.html',
//      controller: 'ActivityPreController',
//      resolve: {      
//          getImplementation: loadQuestionProvider(),
//          geti18nProvider: loadQuestioni18nProvider(),
//          lazyModules_youtube: ['$ocLazyLoad', function($ocLazyLoad) {
//                return $ocLazyLoad.load('youtube-embed');
//           }],
//          lazyModules_table: ['$ocLazyLoad', function($ocLazyLoad) {
//                return $ocLazyLoad.load('ngTable');
//           }]
////          lazyModules_md: ['$ocLazyLoad', function($ocLazyLoad) {
////                return $ocLazyLoad.load('markdown');
////           }]
//      },
//      data:{
//        authorizeRoles: [USER_ROLES.guest]
//      }
//      
//  })
//  .state('login.activity.go', {
//        url: '^/login/activity/{idActivity:int}/{idAssignment:int}/go',
//        templateUrl: function (){
//                return "app/components/activity/activity.html";
//        },
//        controller: 'ActivitySimpleCtrl',
//        resolve: {            
//            loadCtrl: lazyLoader($q, 'activitySimpleCtrl'),
//    lazyModules_ngprint: ['$ocLazyLoad', function($ocLazyLoad) {
//                return $ocLazyLoad.load('AngularPrint');
//           }]
//        },
//      data:{
//        authorizeRoles: [USER_ROLES.guest]
//      }
//    })
  .state('home', {
      parent: 'pw',
      url: '^/home', 
      //Home state is lazy loaded per role
      templateProvider: ['$http', '$q', 'Session', function($http, $q, Session){
            var user = Session.getUser();
            var idRole = user? user.idRole : USER_ROLES.student;
            var group = Session.getCurrentGroup();
            if(group){
                idRole = group.idRole || idRole;
            }
            var url;
            var defer = $q.defer();
            
            if(idRole===USER_ROLES.admin){
                url = '/app/components/home/home_admin';
            } else if(idRole<USER_ROLES.student){
                url = '/app/components/home/home_teacher';
            } else if(idRole===USER_ROLES.guest){
                url = '/app/components/home/home_guest';
            } 
            else if(idRole===USER_ROLES.parents){
                url = '/app/components/home/home';
            }
            else 
            {
                url = '/app/components/home/home';              
            }
           
          if(pw.bowser.mobile){
              url += "_mobile";
          }    
              
          $http.get(url+'.html').then(
               function (response) {              
               defer.resolve(response.data);
          });
          return defer.promise;      
      }],
      controller: 'HomeController',
      resolve: { 
         
        loadCtrl: ['$q', 'Session', function($q, Session){
            var user = Session.getUser();
            
            var idRole = user? user.idRole : USER_ROLES.guest;
            var group = Session.getCurrentGroup();
            if(group){
                idRole = group.idRole || idRole;
            }
            var url;
            if(idRole===USER_ROLES.admin){
                url = '/app/components/home/home_admin'+useMin;
            } else if(idRole<USER_ROLES.student){
                url = '/app/components/home/home_teacher'+useMin;
            }
            else if(idRole===USER_ROLES.guest){
                url = '/app/components/home/home_guest'+useMin;
            } else if(idRole===USER_ROLES.parents){
                url = '/app/components/home/home'+useMin;
            }
            else {
                url = '/app/components/home/home'+useMin;
            }
            
           return lazyLoader($q, url, ["app/app.components.min.js"]);  
        }],        
        lazyModules_tinymce: ['$ocLazyLoad', 'Session', function($ocLazyLoad, Session) {  //ONLY teachers
                var user = Session.getUser();
                if(user.idRole < USER_ROLES.student){
                    return $ocLazyLoad.load('ui.tinymce');
                }
                return true;
            }],
         lazyModules_sortableview: ['$ocLazyLoad', 'Session', function($ocLazyLoad, Session) {
                var user = Session.getUser();
                if(user.idRole < USER_ROLES.student){
                    return $ocLazyLoad.load('angular-sortable-view');
                }
                return true; 
           }],   
        lazyModules_ngFileUpload: ['$ocLazyLoad', function($ocLazyLoad) {
                return $ocLazyLoad.load('ngFileUpload');
            }],
//        ngVideoEmbed:['$ocLazyLoad', function($ocLazyLoad) {
//            return $ocLazyLoad.load('ngVideoEmbed');
//        }],
        ngVideoEmbed: lazyResolver('video_embed'),
 
        translate_resolve: ['Session', '$translate', function(Session, $translate){
                var user = Session.getUser();
                var lang = navigatorLang();
                if(user && user.language){
                    lang = user.language;
                }
                if(user && user.groups && user.groups.length){
                    var g = user.groups[0];
                    if(g.gopts.lang){
                        lang = g.gopts.lang;
                    }
                }
                return $translate.use(lang);
            }],
        lazyModules_datetime: ['$ocLazyLoad', function($ocLazyLoad) {
                return $ocLazyLoad.load('ui.bootstrap.datetimepicker');
        }] 
      }   
  })
  .state('home.parents', {
      url: '/parents',  
      templateProvider: ['$http', '$q', function($http, $q){            
          var url ='/app/components/parents/progress_parents';
          var defer = $q.defer();
            
          if(pw.bowser.mobile){
              url += "_mobile";
          }    
              
          $http.get(url+'.html').then(
               function (response) {              
               defer.resolve(response.data);
          });
          return defer.promise;      
      }],
      controller: 'ParentsProgressController',
      resolve: {
        loadCtrl: lazyResolver( 'app/components/parents/progress_parents.min.js')
      },
      data: {
        authorizeRoles: [USER_ROLES.parents]
      }
   })
   .state('home.grades', {
      url: '/grades',  
      templateUrl: '/app/components/parents/progress_students.html',
      controller: 'StudentsProgressController',
      resolve: {
        loadCtrl: lazyResolver( 'app/components/parents/progress_students.min.js')
      },
      data: {
        authorizeRoles: [USER_ROLES.student]
      }
  })
  .state('home.pwprogress', {
      url: '/pwprogress',  
      templateProvider: ['$http', '$q', function($http, $q){            
          var url ='/app/components/parents/pwprogress';
          var defer = $q.defer();
            
          if(pw.bowser.mobile){
              url += "_mobile";
          }    
              
          $http.get(url+'.html').then(
               function (response) {              
               defer.resolve(response.data);
          });
          return defer.promise;      
      }],
      controller: 'PwProgressController',
      resolve: {
        loadCtrl: lazyResolver( 'app/components/parents/pwprogress.min.js')
      },
      data: {
        authorizeRoles: [USER_ROLES.parents]
      }
  })
  .state('home.groups', {
      url: '/groups', 
      templateUrl: 'app/components/groups/groups.html',
      controller: 'GroupsController',
      resolve: {
        loadCtrl: lazyResolver( 'groupsCtrl')
      },
      lazyModules_sortableview: ['$ocLazyLoad', function($ocLazyLoad) {
                return $ocLazyLoad.load('angular-sortable-view');
        }],       
      data:{
        authorizeRoles: [USER_ROLES.admin, USER_ROLES.teacher, USER_ROLES.teacherNonEditing, USER_ROLES.teacheradmin]
      }
  })
  .state('home.files', {
      url: '/files', 
      templateUrl: 'app/components/groups/files.html',
      controller: 'FilesCtrl',
      resolve: {
        loadCtrl: lazyResolver('app/components/groups/filesCtrl.js'),
        lazyModules_tree: ['$ocLazyLoad', function($ocLazyLoad) {
                return $ocLazyLoad.load('ui.tree');
            }],
        lazyModules_ngFileUpload: ['$ocLazyLoad', function($ocLazyLoad) {
                return $ocLazyLoad.load('ngFileUpload');
            }],
        lazyModules_ace: ['$ocLazyLoad', function($ocLazyLoad) {
                return $ocLazyLoad.load('ui.ace');
            }]        
      },
      data:{
        authorizeRoles: [USER_ROLES.admin, USER_ROLES.teacher, USER_ROLES.teacherNonEditing, USER_ROLES.teacheradmin]
      }
  })
  .state('home.students', {
      url: '^/home/students/:id',
      params: {
        id: ""
      },
      templateUrl: 'app/components/students/students.html',
      controller: 'StudentsController',
      resolve: {
        loadCtrl: lazyResolver('studentsCtrl'),
         lazyModules_picklist: ['$ocLazyLoad', function($ocLazyLoad) {
                return $ocLazyLoad.load('fxpicklist');
            }],
        lazyModules_toggle: ['$ocLazyLoad', function($ocLazyLoad) {
                return $ocLazyLoad.load('nzToggle');
            }] 
       
      },
      data:{
        authorizeRoles: [USER_ROLES.admin, USER_ROLES.teacher, USER_ROLES.teacherNonEditing, USER_ROLES.teacheradmin],
        authStateParams: true
      }
  })
  .state('home.progress', {
      url: '^/home/progress/:id/:idUser',
      params: {
        id: "",
        idUser: ""
      },
      templateUrl: 'app/components/students/progress.html',
      controller: 'ProgressController',
      resolve: {
        loadCtrl: lazyResolver( 'progressController', 'jsxgraphcore')      
      }, 
      data:{
        authorizeRoles: [USER_ROLES.admin, USER_ROLES.teacher, USER_ROLES.teacherNonEditing, USER_ROLES.teacheradmin],
        authStateParams: true
      }
  })
  .state('home.editactivityA', {
      url: '^/home/editactivity/a/{idActivity:int}', 
      templateUrl: 'app/components/ide/newActivityA.html',
      controller: 'newActivityACtrl',
      resolve: {
        loadCtrl: lazyResolver('app/components/ide/newActivityA.js'),
        lazyModules_toggle: ['$ocLazyLoad', function($ocLazyLoad) {
                return $ocLazyLoad.load('nzToggle');
            }],       
        lazyModules_picklist: ['$ocLazyLoad', function($ocLazyLoad) {
                return $ocLazyLoad.load('multipleSelect');
      }]},
      data:{
        authorizeRoles: [USER_ROLES.admin, USER_ROLES.teacher, USER_ROLES.teacheradmin]
      }
  }) 
  .state('home.editactivityQ', {
      url: '^/home/editactivity/q/{idActivity:int}', 
      templateUrl: 'app/components/ide/newActivityQ.html',
      controller: 'newActivityQCtrl',
      resolve: {
        loadCtrl: lazyResolver('app/components/ide/newActivityQ.js'),
        lazyModules_toggle: ['$ocLazyLoad', function($ocLazyLoad) {
                return $ocLazyLoad.load('nzToggle');
            }],       
        lazyModules_picklist: ['$ocLazyLoad', function($ocLazyLoad) {
                return $ocLazyLoad.load('multipleSelect');
      }]},
      data:{
        authorizeRoles: [USER_ROLES.admin, USER_ROLES.teacher, USER_ROLES.teacheradmin]
      }
  }) 
  .state('home.editactivityV', {
      url: '^/home/editactivity/v/{idActivity:int}', 
      templateUrl: 'app/components/ide/newActivityV.html',
      controller: 'newActivityVCtrl',
      resolve: {
        loadCtrl: lazyResolver('app/components/ide/newActivityV.js'),
        lazyModules_toggle: ['$ocLazyLoad', function($ocLazyLoad) {
                return $ocLazyLoad.load('nzToggle');
            }],       
        lazyModules_picklist: ['$ocLazyLoad', function($ocLazyLoad) {
                return $ocLazyLoad.load('multipleSelect');
      }]},
      data:{
        authorizeRoles: [USER_ROLES.admin, USER_ROLES.teacher, USER_ROLES.teacheradmin]
      }
  }) 
  .state('home.editactivityU', {
      url: '^/home/editactivity/u/{idActivity:int}', 
      templateUrl: 'app/components/ide/newActivityU.html',
      controller: 'newActivityUCtrl',
      resolve: {
        loadCtrl: lazyResolver( 'app/components/ide/newActivityU.js'),
        lazyModules_toggle: ['$ocLazyLoad', function($ocLazyLoad) {
                return $ocLazyLoad.load('nzToggle');
            }],       
        lazyModules_picklist: ['$ocLazyLoad', function($ocLazyLoad) {
                return $ocLazyLoad.load('multipleSelect');
      }]},
      data:{
        authorizeRoles: [USER_ROLES.admin, USER_ROLES.teacher, USER_ROLES.teacheradmin]
      }
  }) 
  .state('home.assignments', {
      url: '^/home/assignments/{idGroup:int}/{idAssignment:int}', 
      templateUrl: 'app/components/assign/assignments.html',
      controller: 'AssignmentsController',
      resolve: {
        loadCtrl: lazyResolver( 'assignmentsCtrl'),
        lazyModules_datetime: ['$ocLazyLoad', function($ocLazyLoad) {
                return $ocLazyLoad.load('ui.bootstrap.datetimepicker');
        }],
        
        lazyModules_picklist: ['$ocLazyLoad', function($ocLazyLoad) {
                return $ocLazyLoad.load('fxpicklist');
        }]
      }, 
      data:{
        authorizeRoles: [USER_ROLES.admin, USER_ROLES.teacher, USER_ROLES.teacheradmin]
      }
  })
  .state('home.assignments.assign', {
      url: '^/home/assignments/{idGroup:int}/{idAssignment:int}/assign/{idActivity:int}', 
      templateUrl: 'app/components/assign/assign.html',
      controller: 'AssignController',
      resolve: {
            loadCtrl: lazyResolver('assignCtrl'),
        
            lazyModules_datetime: ['$ocLazyLoad', function($ocLazyLoad) {
                return $ocLazyLoad.load('ui.bootstrap.datetimepicker');
            }],
        
            lazyModules_picklist: ['$ocLazyLoad', function($ocLazyLoad) {
                return $ocLazyLoad.load('fxpicklist');
            }]       
      }, 
      data:{
        authorizeRoles: [USER_ROLES.admin, USER_ROLES.teacher, USER_ROLES.teacheradmin]
      }
  })
  .state('home.activitytrace', {
      url: '^/home/activitytrace/{idActivity:int}/{idAssignment:int}/{idGroup:int}', 
      templateUrl: 'app/components/activity/activityTrace.html',
      controller: 'ActivityTraceController',
      resolve: {    
          loadCtrl: lazyResolver('app/components/activity/activityTrace.js')
          //getImplementation: loadQuestionProvider(),
          //geti18nProvider: loadQuestioni18nProvider()
          //lazyModules_table: ['$ocLazyLoad', function($ocLazyLoad) {
          //     return $ocLazyLoad.load('ngTable');
          // }]         
      }
  })
  
   .state('home.unittrace', {
      url: '^/home/unittrace/{idUnit:int}', 
      templateUrl: 'app/components/activity/unitTrace.html',
      controller: 'UnitTraceController',
      resolve: {    
          loadCtrl: lazyResolver( 'app/components/activity/unitTrace.js'),
          //getImplementation: loadQuestionProvider(),
          //geti18nProvider: loadQuestioni18nProvider(),
          lazyModules_ngprint: ['$ocLazyLoad', function($ocLazyLoad) {
                return $ocLazyLoad.load('AngularPrint');
           }],
          AutoRenderer: ['$q', 'Session', function($q, Session){
                  var defer = $q.defer();
                  require(['katexauto', '/activities/libs/activity-autorender.js'], function(katexauto){
                     Session.addCss(pw.KATEXCSS);
                     window.renderMathInElement = window.renderMathInElement || katexauto; 
                     defer.resolve(); 
                  });
                  return defer.promise;
          }]
      }
  })
    .state('home.sheet', {
        url: '^/home/sheet/{idActivities}',
        templateUrl: 'app/components/activity/activitySheet.html',        
        controller: 'ActivitySheetCtrl',
        resolve: {            
            loadCtrl: lazyResolver( 'activitySheetCtrl'),
            lazyModules_ngprint: ['$ocLazyLoad', function($ocLazyLoad) {
                return $ocLazyLoad.load('AngularPrint');
           }]
        }
    })
    .state('home.ide', {
        url: '^/home/ide/{idActivity}',
        templateUrl: 'app/components/ide/activityIde.html',        
        controller: 'ActivityIdeCtrl',
        resolve: {            
            //loadTossals: lazyResolver('/piworld-tossals.min.js'),
            loadCtrl: lazyResolver('activityIdeCtrl'),
         
            lazyModules_ace: ['$ocLazyLoad', function($ocLazyLoad) {
                return $ocLazyLoad.load('ui.ace');
            }],
        
            lazyModules_tree: ['$ocLazyLoad', function($ocLazyLoad) {
                return $ocLazyLoad.load('ui.tree');
            }] 
        },
        data:{
             authorizeRoles: [USER_ROLES.admin, USER_ROLES.teacher, USER_ROLES.teacheradmin],
             authStateParams: true
        }
    })
    .state('home.ide.run', {
        url: '^/home/ide/{idActivity}/run',
        templateUrl: 'app/components/activity/activity.html',        
        controller: 'ActivitySimpleCtrl',
        resolve: {            
            loadCtrl: lazyResolver('activitySimpleCtrl') 
        },
        data:{
             authorizeRoles: [USER_ROLES.admin, USER_ROLES.teacher, USER_ROLES.teacheradmin],
             authStateParams: false
        }
    }) 
    .state('home.unauthorized', {
        url: '^/home/unauthorized',
        templateUrl: 'app/shared/unauthorized-tpl.html',        
        controller: ['$scope', '$interval', '$state', function($scope, $interval, $state){                                 
                $scope.count = 5;
                var interval;
                var func = function(){
                    $scope.count -= 1;
                    if($scope.count === 0)
                    {
                        $interval.cancel(interval);
                        $scope.goHome();
                    }
                };
                interval = $interval(func, 1000);
                $scope.goHome = function(){
                    //window.history.back();
                    $state.go("home");
                };
        }] 
    })
    .state('home.center', {
        url: '^/home/center',
        templateUrl: 'app/components/admin/center.html',        
        controller: 'CenterCtrl',
        data:{
            authorizeRoles: [USER_ROLES.teacheradmin]
        },
        resolve:{
            loadCtrl: lazyResolver('/app/components/admin/centerCtrl.js'),
            lazyModules_toggle: ['$ocLazyLoad', function($ocLazyLoad) {
                return $ocLazyLoad.load('nzToggle');
            }]   
        }
    })
    .state('home.bookmgr', {
        url: '^/home/bookmgr',
        templateUrl: 'app/components/admin/bookmgr.html',        
        controller: 'BookMgrCtrl',
        data:{
            authorizeRoles: [USER_ROLES.teacheradmin]
        },
        resolve:{
            loadCtrl: lazyResolver('/app/components/admin/bookmgrCtrl.js'),
            lazyModules_toggle: ['$ocLazyLoad', function($ocLazyLoad) {
                return $ocLazyLoad.load('nzToggle');
            }],
          lazyModules_datetime: ['$ocLazyLoad', function($ocLazyLoad) {
                return $ocLazyLoad.load('ui.bootstrap.datetimepicker');
            }]
        }
    })
    .state('home.centers', {
        url: '^/home/centers',
        templateUrl: 'app/components/admin/centers.html',        
        controller: 'CentersCtrl',
        data:{
            authorizeRoles: [USER_ROLES.admin]
        },
        resolve:{
            loadCtrl: lazyResolver('/app/components/admin/centersCtrl.js'),
            lazyModules_toggle: ['$ocLazyLoad', function($ocLazyLoad) {
                return $ocLazyLoad.load('nzToggle');
            }]            
        }
    })
    .state('home.news', {
        url: '^/home/news',
        templateUrl: 'app/components/admin/news.html',        
        controller: 'newsCtrl',
        data:{
            authorizeRoles: [USER_ROLES.admin]
        },
        resolve:{
            loadCtrl: lazyResolver('/app/components/admin/newsCtrl.js'),
            lazyModules_datetime: ['$ocLazyLoad', function($ocLazyLoad) {
                return $ocLazyLoad.load('ui.bootstrap.datetimepicker');
            }]
        } 
    })
    .state('home.challenges', {
        url: '^/home/challenges',
        templateUrl: 'app/components/admin/challenges.html',        
        controller: 'ChallengesCtrl',
        data:{
            authorizeRoles: [USER_ROLES.admin, USER_ROLES.teacheradmin]
        },
        resolve:{
            loadCtrl: lazyResolver('/app/components/admin/challengesCtrl.js'),
            lazyModules_datetime: ['$ocLazyLoad', function($ocLazyLoad) {
                return $ocLazyLoad.load('ui.bootstrap.datetimepicker');
            }],
          lazyModules_toggle: ['$ocLazyLoad', function($ocLazyLoad) {
                return $ocLazyLoad.load('nzToggle');
            }] 
       
        } 
    })
    .state('home.tools', {
        url: '^/home/tools',
        templateUrl: 'app/components/misc/tools.html',        
        controller: 'ToolsCtrl',
        resolve:{
            loadCtrl: lazyResolver('/app/components/misc/toolsCtrl.js')         
        }
    })
    .state('home.help', {
        url: '^/home/help',
        templateUrl: 'app/components/misc/help.html',        
        controller: 'HelpCtrl',
        resolve:{
            loadCtrl: lazyResolver('/app/components/misc/helpCtrl.js'),
            lazyModules_hljs: ['$ocLazyLoad', function($ocLazyLoad) {
                return $ocLazyLoad.load('hljs');
           }]
        }         
    })
    .state('home.forum', {
        url: '^/home/forum',
        templateUrl: 'app/components/misc/forum.html',        
        controller: 'ForumCtrl',
        resolve:{
            loadCtrl: lazyResolver('/app/components/misc/forumCtrl.js'),
            lazyModules_tinymce: ['$ocLazyLoad', function($ocLazyLoad) {
                return $ocLazyLoad.load('ui.tinymce');
            }]                        
        } 
    }).state('home.notebook', {
        url: '^/home/notebook',
        templateUrl: 'app/components/misc/notebook.html',        
        controller: 'NotebookCtrl',
        resolve:{
            loadCtrl: lazyResolver('/app/components/misc/notebookCtrl.js'),
            
            lazyModules_ace: ['$ocLazyLoad', function($ocLazyLoad) {
                return $ocLazyLoad.load('ui.ace');
            }],        
            lazyModules_ngFileUpload: ['$ocLazyLoad', function($ocLazyLoad) {
                return $ocLazyLoad.load('ngFileUpload');
            }]  
        },
        data:{
             authorizeRoles: [USER_ROLES.admin, USER_ROLES.teacher, USER_ROLES.teacheradmin]
        }        
    })  
   .state('home.activitysearch', {
      url: '^/home/activitysearch', 
      templateUrl: 'app/components/activity/activitySearch.html',
      controller: 'ActivitySearchController',
      
       resolve:{
           ctrl: lazyResolver("app/components/activity/activitySearch.js")  
      }
      
  })
  .state('home.activity', {
      url: '^/home/activity/{idActivity:int}/{idAssignment:int}?autoplay', 
      templateUrl: 'app/components/activity/ActivityPre.html',
      controller: 'ActivityPreCtrl',
      resolve: {      
          ctrl: lazyResolver("app/components/activity/ActivityPreCtrl.js"),  //removedTossals.min
           //geti18nProvider: loadQuestioni18nProvider(),
          //getImplementation: loadQuestionProvider(),          
        
         lazyModules_ngFileUpload: ['$ocLazyLoad', function($ocLazyLoad) {
                return $ocLazyLoad.load('ngFileUpload');
          }]
          //,creatine: lazyResolver('creatine')          
      }
  })
//  .state('home.activity.kahoot', {
//        url: '^/home/activity/kahoot/{idActivity:int}/{idAssignment:int}/{idGroup:int}',
//        templateUrl: function (){
//                return "app/components/kahoot/kahoot.html";
//        },
//        controller: 'KahootCtrl',
//        resolve: {            
//            loadCtrl: lazyResolver('app/components/kahoot/kahootCtrl.js'),
//  lazyModules_toggle: ['$ocLazyLoad', function($ocLazyLoad) {
//                return $ocLazyLoad.load('nzToggle');
//            }]
//        },                 
//      data:{
//        authorize: [USER_ROLES.admin, USER_ROLES.teacher, USER_ROLES.teacheradmin]
//      }
//    })
//.state('home.activity.kahootreport', {
//        url: '^/home/activity/kahootreport/{idActivity:int}/{idAssignment:int}/{idGroup:int}',
//        templateUrl: function (){
//                return "app/components/kahoot/kahootReport.html";
//        },
//        controller: 'KahootReportCtrl',
//        resolve: {            
//            loadCtrl: lazyResolver('app/components/kahoot/kahootReport.js')  
//        },                 
//      data:{
//        authorize: [USER_ROLES.admin, USER_ROLES.teacher, USER_ROLES.teacheradmin]
//      }
//    })
//  .state('home.kahootit', {
//        url: '^/home/kahootit/{kahootId:int}/',
//        templateUrl: function (){
//                return "app/components/kahoot/kahootIt.html";
//        },
//        controller: 'KahootItCtrl',
//        resolve: {            
//            loadCtrl: lazyResolver('app/components/kahoot/kahootItCtrl.js', "activities/libs/imDirectives.min.js")
//        }
//    })
//  .state('home.pokemath', {
//        url: '^/home/pokemath/',
//        templateUrl: function (){
//                return "app/components/pokemath/pokemath.html";
//        },
//        controller: 'PokeMathCtrl',
//        resolve: {            
//            loadCtrl: lazyResolver('pokemath')         
//        }
//    })
//  .state('home.activity.go', {
//        url: '^/home/activity/{idActivity:int}/{idAssignment:int}/go',
//        templateUrl: function (){
//                return "app/components/activity/activity.html";
//        },
//        controller: 'ActivitySimpleCtrl',
//        resolve: {            
//            loadCtrl: lazyResolver('activitySimpleCtrl'),
//    lazyModules_ngprint: ['$ocLazyLoad', function($ocLazyLoad) {
//                return $ocLazyLoad.load('AngularPrint');
//           }]
//        }
//    })
   .state('home.activity.review', {
        url: '^/home/activity/{idActivity:int}/{idAssignment:int}/review/{idAttempt}',
        templateUrl: 'app/components/activity/activityReview.html',        
        controller: 'ActivityReviewCtrl',
        resolve: {            
            loadCtrl: lazyResolver('activityReviewCtrl')
        }
    });

}]);

}(window.pw.app, angular));