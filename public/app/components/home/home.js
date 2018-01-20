//
// Student home dash
//

   var pwcUnitsCtrl = function($rootScope, $state, $http, $translate, $timeout, USER_ROLES, Modals, Session, growl) {
        var ctrl = this;
         ctrl.tgs = {edition: false};
        ctrl.USER_ROLES = USER_ROLES;
          
         
        ctrl.currentYear = pw.currentYear;
         
        
        ctrl.showAllIn = function (u) {
                u.showAll = true;
            };
  
      
        ctrl.noGhostFilter = function(value){            
            return !value.gopts.isGhost;
        };
            
        
        ctrl.reload = function(forceUpdate)
        {
                
                if(!ctrl.pwcID){
                    return;
                }
                //console.log("reload", ctrl.group);
                
                if(!ctrl.group)
                {                    
                    if(ctrl.user.groups.length){
                        ctrl.group = ctrl.user.groups[0];
                        ctrl.onChangeGrp(true);
                    } else {
                        //console.log("pwc-units: Cannot reload since group is not selected");
                        ctrl.units = [];
                        return;
                    }
                    return;
                }
                var idGroup = ctrl.group.idGroup;
                  
                $http.post('/rest/assignments/queryasgn', {idGroup: idGroup, idUser: ctrl.user.id}, true).then(function(r){       
                        
                           r.data.forEach(function(u){
                            //Types of unit visible when page loaded: 
                            //0 --> Hidden for students & Collapsed for teachers
                            //1 --> Always collapsed 
                            //2 --> Auto  (shows all assignments in active units and the 1st one in inactive ones)
                            //3 --> Shows all assignments in any units
                            
                            //Decide if collapse
                            switch(u.visible){
                                case 0: u.collapsed = true; break;
                                case 1: u.collapsed = true; u.showAll=false; break;
                                case 2: u.collapsed =false; u.showAll=(ctrl.group.currentUnit===u.id); break;
                                default: u.collapsed = false; u.showAll=true;
                            } 
                            u.assignments.forEach(function(a){
                                if(a.fromDate){
                                    a.fromDate = new Date(a.fromDate); 
                                }
                                if(a.toDate){
                                    a.toDate = new Date(a.toDate); 
                                }                             
                            });
                        });
                        
                       ctrl.units = r.data;
                       
                     
                       ctrl.units_collapse_ini = r.data.map(function(u){
                            return {collapsed: u.collapsed, showAll: u.showAll};
                       });
                       
                       Session.assignmentsCache[ctrl.group.idGroup] = r.data;
                       
                     
                });
                    
        };
        
         
        ctrl.toggleGlobalCollapse=function(){
                if(!ctrl.units_collapse_ini){
                    return;
                }
                if(ctrl.tgs.globalCollapse){
                    //Restore the collapse state with initial values
                    jQuery.each(ctrl.units, function(i, e){
                        e.collapsed = ctrl.units_collapse_ini[i].collapsed;
                        e.showAll = ctrl.units_collapse_ini[i].showAll;
                    });
                } else {
                    //Collapse all units
                    jQuery.each(ctrl.units, function(i, e){
                        e.collapsed = true;
                    });
                }
                ctrl.tgs.globalCollapse = !ctrl.tgs.globalCollapse;
            };
            
          
        ctrl.onChangeGrp = function(forceUpdate){
           
           if(!ctrl.group){
               return;
           }
           
           $rootScope.$broadcast("changeGrp", {group: ctrl.group});
           Session.setCurrentGroup(ctrl.group);
           
           if(ctrl.user.idRole===USER_ROLES.student){
                if(ctrl.group.gopts.lang){                   
                    $translate.use(ctrl.group.gopts.lang);                                      
                } else {
                    $translate.use( ctrl.user.language || navigatorLang());                     
                };
            }  
 
            ctrl.reload(forceUpdate);
        };
       
       
        
        ctrl.authAndGo = function(route){

                Modals.sudlg(function(){
                    $state.go(route);
                });

        };
        
        
        ctrl.goAsgn = function(a, list){
            Session.setRelatedActivity(list);
            $state.go("home.activity", {idActivity: a.idActivity, idAssignment: a.id});
        };
 
      
       ctrl.$onInit = function(){
            ctrl.pwcID = Math.random().toString(36);
            window.pw.DEBUG && console.log("pwc-units",ctrl.pwcID, ": $onInit " );
            
            var elem = jQuery(".navbar");
            var top = 50;
            if(elem){
                top = elem.height() || 50;
            }
            ctrl.mobile? ctrl.headingStyle={position: 'fixed', 'z-index': '1000', width: "100%", 'top': top+'px', left:'0px', height: '40px'} : ctrl.headingStyle = {};    
      
            if(!ctrl.user){
                //console.log("user must be passed");
                return;                
            }
            
            var g = Session.getCurrentGroup();
            if (g) {
                jQuery.each(ctrl.user.groups, function (i, e) {
                    if (e.idGroup === g.idGroup) {
                        ctrl.group = e;
                        return true;
                    }
                });
                
                if(ctrl.group){
                    ctrl.onChangeGrp(true);
                    return;
                }
            }

            if(ctrl.user.groups.length>0)
            {
                ctrl.group = ctrl.user.groups[0];
                Session.setCurrentGroup(ctrl.group);                
                ctrl.onChangeGrp(true);
            }

            
 
        };
 


        ctrl.$onChanges = function(changes){
           if(ctrl.pwcID && changes.group){
               ctrl.reload(true);
           }
        };
    };
    
/************************************************************************************************************
 *  UNITS COMPONENT
 ************************************************************************************************************/    
    
    
   window.pw.app.register.component('pwcUnits', 
        {
            bindings: {
                user: "<",
                group: "<",
                collapse: "<",
                mobile: "@"                       
            },
            templateUrl: "app/components/home/pwc-units.html",
            controller: [  "$rootScope", "$state", "$http", "$translate", "$timeout", "USER_ROLES", "Modals", "Session", "growl",
                pwcUnitsCtrl],
            controllerAs: "vm"
        }
    );

/************************************************************************************************************
 *  HOME CONTROLLER
 ************************************************************************************************************/    

window.pw.app.register.controller('HomeController', ['HomeService', '$scope', '$rootScope', '$state', '$http', 'MyCacheService', '$translate', 'USER_ROLES', '$uibModal', '$window',
        '$timeout', 'Auth', 'Session', 'growl', 'Modals', '$compile',  
        function (HomeService, $scope, $rootScope, $state, $http, MyCacheService, $translate, USER_ROLES, $uibModal, $window, $timeout, Auth, Session, growl, Modals, $compile) {

            HomeService.initialize();
            
            $scope.user = Session.getUser();
            
            if(!$scope.user){
                //console.log("home.js: user not defined");
                return;
            }
            $scope.amStudent = ($scope.user.idRole===USER_ROLES.student);
           
            if(!$scope.amStudent || $scope.user.idRole!==USER_ROLES.parents){
                //Guest user found
                $state.go('login');
            }
            
            $scope.$on("changeGrp", function(evt, d){
                $scope.selectedGroup = d.group;
                randomizeOfTheDay(true);
            });
            
            
            
            var d = new Date();
            d.setDate(d.getDate() - 180);
            $scope.currentYear = d.getFullYear()-2000;
            
            var HomeCache = MyCacheService.getCache("HomeCache", false); //non-expirable
            var units_collapse_ini;
            
            
            function randomizeOfTheDay (forceUpdate){
                 var level = 0;
                 var g = $scope.selectedGroup;
                 if(g){
                     if(g.groupStudies[0]==="B"){
                         level = 2;
                     } else {
                         if(g.groupLevel>2){
                             level = 1;
                         }
                     }
                 
                     HomeCache.httpCache('all', 'oftheday/all', {idUser: $scope.user.id, level: level, lang: $translate.use(), idGroup: g.idGroup}, forceUpdate).then(function(d) {

                     $scope.randomEqn = d.eqn;
                     $scope.randomQuote = d.quote;
                     $scope.challenge = d.problem;
                   
                });
                
               }
            };

            $scope.leftClass = "col-md-3 col-lg-3";
            $scope.mainClass = "col-md-9 col-lg-7";
            $scope.rightClass = "col-md-12 col-lg-2";
           

            $scope.USER_ROLES = USER_ROLES;

 

            var isLarge = $("body").width() > 749;

            $scope.tgs = {mobileShow: 1, welcome: true, score: isLarge, recent: true, assignments: true, famouseqn: isLarge, quote: isLarge, problem: isLarge,
                groups: $scope.user.groups.length === 0, users: isLarge, chat: true, kahootID: 1};
 
      
  
            $scope.changeAvatar = function () {
                var user = $scope.user;

                var modalInstance = $uibModal.open({
                    templateUrl: 'app/shared/avatar-dlg.html',
                    controller: ['$scope', 'Upload', function ($scope, Upload) {
                            $scope.title = 'AVATARS';
                            $scope.user = user;
                            $scope.limits = [0, 2000, 5000];
                            $scope.avatars = [];
                            for (var i = 0; i < 63; i++) {
                                $scope.avatars.push({image: '' + i, c: 0});
                            }
                            var setLimit = function (list, lim) {
                                jQuery.each(list, function (idx, el) {
                                    $scope.avatars[idx].c = lim;
                                });
                            };
                            setLimit([0, 1, 2, 11, 16, 21, 28, 29, 31, 30, 31, 32, 33, 34, 35, 51, 52, 53, 54], 0);
                            setLimit([3, 4, 5, 8, 9, 10, 12, 13, 14, 19, 20, 36, 37, 38, 39, 40, 41, 42, 43, 55, 56, 57, 58, 59, 60], 1);
                            setLimit([6, 7, 15, 17, 18, 22, 23, 24, 25, 27, 44, 45, 46, 47, 48, 49, 50, 61, 62], 2);

                            $scope.custom = {image: 'custom/' + user.id, c: 2};
                            $scope.dc = "";
                            $scope.uploadPercent = "";

                            $scope.selected = null;
                            $scope.score = 0;
                            if (user.idRole >= USER_ROLES.student) {
                                //Query to obtain the current score!
                                $http.post('/rest/students/categoryscores', {idUser: user.id}).then(function (r) {
                                    var d = r.data;
                                    var totalBadges = 0;
                                    jQuery.each(d.badges, function(i, e){
                                        totalBadges += e.rscore;
                                    });
                                    $scope.score = d.score + d.vscore + d.uscore + totalBadges;
                                });

                            }
                            else
                            {
                                $scope.score = 200000;
                            }

                            for (var i in $scope.avatars)
                            {
                                if ($scope.avatars[i].image === user.uopts.avatar)
                                {
                                    $scope.selected = $scope.avatars[i];
                                    break;
                                }
                            }
                            $scope.onclick = function (s) {
                                if (!s) {
                                    s = $scope.custom;
                                }

                                var reqScore = $scope.limits[s.c];

                                if ($scope.score >= reqScore)
                                {
                                    $scope.selected = s;
                                }
                            };

                            $scope.ok = function () {
                                modalInstance.close($scope.selected);
                                $scope.dc = Math.random();
                            };

                            $scope.cancel = function () {
                                modalInstance.dismiss();
                            };
                            $scope.upload = function (files) {
                                if (!files || files.length !== 1) {
                                    return;
                                }
                                //console.log(files[0]);
                                if (files[0].type !== "image/png") {
                                    growl.warning("Image must be a png file");
                                    return;
                                }
                                Upload.upload({
                                    url: '/rest/fs/upload',
                                    file: files[0],
                                    fields: {'idUser': user.id, 'type': 'avatar'}
                                }).then(function (resp) {
                                    //console.log('Success');
                                    //Reload image
                                    $scope.dc = Math.random();
                                    $scope.selected = $scope.custom;
                                }, function (resp) {
                                    //console.log('Error status: ' + resp.status);
                                }, function (evt) {
                                    var progressPercentage = parseInt(100.0 * evt.loaded / evt.total);
                                    $scope.uploadPercent = progressPercentage + '% ';
                                });
                            };
                        }]
                });

                modalInstance.result.then(function (confirm) {
                    if (confirm)
                    {
                        $scope.user.uopts.avatar = confirm.image;
                        $http.post('/rest/students/updateuopts', {uopts: $scope.user.uopts, id: $scope.user.id});
                        Session.updateCookies();
                    }
                }, function () {
                    //window.pw.app.DEBUG && //console.log('dismissed');
                });
            };


            //when the form is submitted
            $scope.logout = function () {
                Session.logout();
            };
            $scope.changeLanguage = function (langKey) {
                $translate.use(langKey);
                $rootScope.$broadcast("changeLang", langKey);
                $timeout(function () {
                    randomizeOfTheDay(true);                    
                }, 500);
            };
            
            
            $scope.goAsgn = function (a, list) {
                Session.setRelatedActivity(list);
                $state.go("home.activity", {idActivity: a.idActivity, idAssignment: a.id});
            };
 
           
            $scope.go = function (route) {
                $state.go(route); 
            };

            $scope.goAssignments = function () {
                $state.go("home.assignments", {idGroup: 0, idAssignment: 0});
            };


            $scope.toggleMain = function(open) {
                if( typeof(open) === "undefined"){
                    $scope.mainExpanded = !$scope.mainExpanded;
                } else {
                    $scope.mainExpanded = open;
                }
                if ($scope.mainExpanded) {
                    $scope.leftClass = "hidden";
                    $scope.mainClass = "col-md-12";
                    $scope.rightClass = "hidden";
                } else {
                    $scope.leftClass = "col-md-3";
                    $scope.mainClass = "col-md-9";
                    $scope.rightClass = "col-lg-2";
                }
            };

            $scope.toggleLeft = function () {
                $scope.leftExpanded = !$scope.leftExpanded;
                if ($scope.leftExpanded) {
                    $scope.leftClass = "col-md-12";
                    $scope.mainClass = "hidden";
                    $scope.rightClass = "hidden";
                } else {
                    $scope.leftClass = "col-md-3 col-lg-3";
                    $scope.mainClass = "col-md-9 col-lg-7";
                    $scope.rightClass = "col-md-2 col-lg-2";
                }
            };

            $scope.toggleRight = function () {
                $scope.rightExpanded = !$scope.rightExpanded;
                if ($scope.rightExpanded) {
                    $scope.leftClass = "hidden";
                    $scope.mainClass = "hidden";
                    $scope.rightClass = "col-md-12";
                } else {
                    $scope.leftClass = "col-md-3 col-lg-3";
                    $scope.mainClass = "col-md-9 col-lg-7";
                    $scope.rightClass = "col-md-2 col-lg-2";
                }
            };

            //Register Static File Access into the database
            $scope.registerSFA = function (event) {
                event.preventDefault();
                if($scope.amStudent){
                    var url = event.target.href;
                    $window.open(url, '_blank');
                    var vscore = event.target.attributes['vscore'].value;                
                    $http.post("/rest/video/vscore", {idActivity: 0, idLogin: $scope.user.idLogin, vscore: vscore || 1, vseconds: 0, resource: url});               
                }
            };

 
           $scope.scrollToLastChat = function(){

                $timeout(function(){    
                //Get all chat panels
                jQuery('.chat-scroll').each(function () {

                    var elem = jQuery(this).find(".chat-entry").last();
                     //Try to scroll
                    if (elem && elem.offset()) {
                       
                        if(pw.bowser.mobile){
                            window.scrollTo(0, elem.offset().top);
                        } else {
                            jQuery("html").animate({scrollTop: elem.offset().top}, 1000);
                        }
                    }

                });
                },

                600);

            };
           
           
           $scope.scrollToTop = function(){
                $timeout(function(){ 
                        jQuery("html").scrollTop(0);
                    },
                500);
           };
            

            $scope.changePwd = function(){
                 var amParent = ($scope.user.idRole === USER_ROLES.parents);
                 var modalInstance = $uibModal.open({
                    templateUrl: 'app/components/home/changepwd-dlg.html',
                    controller: ['$scope', function (scope) {
                            scope.oldpwd = "";
                            scope.newpwd = "";
                            scope.newpwd2 = "";
                            scope.username = (amParent?"Familia de ":"")+$scope.user.username;
                            
                            scope.ok = function () {
                                 Auth.checkPassword(scope.oldpwd || "").then(function(d) {                                        
                                        if (!d.ok)
                                        {
                                            growl.warning('Contrasenya antiga invàlida');
                                            return;
                                        }
                                    
                                        if (scope.newpwd.trim().length < 6)
                                        {
                                            growl.error("La longitud mínima de la contrasenya són 6 caràcters.");
                                            return;
                                        }
                                        else
                                        {
                                            if (scope.newpwd.trim() === $scope.user.email.trim()) {
                                                growl.error("La constrasenya ha d'esser diferent que el correu electrònic");
                                                return;
                                            }
                                            var re = /[0-9]/;
                                            if (!re.test(scope.newpwd)) {
                                                growl.error("La constrasenya ha de contenir almenys un nombre (0-9)!");
                                                return;
                                            }
                                            re = /[a-z]/;
                                            if (!re.test(scope.newpwd)) {
                                                growl.error("La contrasenya ha de contenir almenys una lletra minúscula (a-z)!");
                                                return;
                                            }
                                        }
                                        if (scope.newpwd !== scope.newpwd2)
                                        {
                                            growl.error("Les contrasenyes no coincideixen.");
                                            return;
                                        }

                                        modalInstance.close(scope.newpwd);
                                });
                                    
                            };
                            scope.cancel = function () {
                                modalInstance.dismiss();
                            };
                         
                        }],
                    size: 'md'
                });

                modalInstance.result.then(function(password) {
                     
                    var obj = {idUser: $scope.user.id};
                    if(amParent){
                        obj.passwordParents = password;
                    } else {
                        obj.password = password;
                    }
                    
                    $http({
                      method: "post",
                      url: "/rest/auth/changepwd",
                      data: pw.encrypt(JSON.stringify(obj)),
                      headers: {
                        'Content-Type': 'text/plain;charset=UTF-8'
                      }
                    }).then(function (r) {
                        if (r.data.ok) {
                            Modals.notificationdlg("Nova contrasenya", "S'ha canviat satisfactòriament la contrasenya"+(amParent?" d'accés família.":"."));
                        } else {
                            growl.warning("Ho sentim però, no s'ha pogut canviar la contrasenya.");
                        }
                    });
                                    
                });
            };


            //Request email
            function validateEmail(email) {
                  var re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
                  return re.test(email);
            }

            if(!validateEmail($scope.user.email)){                
                
            }
            
           
            $scope.collapse = function(u){
                u.collapsed = !u.collapsed;
                if(u.collapsed){
                    u.showAll = false;
                }
            };

            $scope.toggleGlobalCollapse=function(){
                if(!units_collapse_ini){
                    return;
                }
                if($scope.tgs.globalCollapse){
                    //Restore the collapse state with initial values
                    jQuery.each($scope.units, function(i, e){
                        e.collapsed = units_collapse_ini[i].collapsed;
                        e.showAll = units_collapse_ini[i].showAll;
                    });
                } else {
                    //Collapse all units
                    jQuery.each($scope.units, function(i, e){
                        e.collapsed = true;
                    });
                }
                $scope.tgs.globalCollapse = !$scope.tgs.globalCollapse;
            };
   
    
   
            $scope.tabMobile = function(pos){
                //console.log("TABMOBILE CALLED ", pos);
                if(pos===4){
                     $scope.scrollToLastChat();
                     $scope.tgs.chatWarning = false;
                } else {
                     $scope.scrollToTop();
                }
                $scope.tgs["tab"+pos] = true; 
                $scope.tgs.mobileShow = pos;
                
            };
            
            
            Session.getSocket().on("chat-recieved", function (data) {
               if (data.idUser !== $scope.user.id) {
                  if($scope.tgs.mobileShow!==4){
                      $scope.tgs.chatWarning = true;
                  } 
               }
             });
            
      
    ///Configuration for parents only        
    $scope.configDlg = function(){
        var lang = $translate.use() || "ca";     
        var modalInstance = $uibModal.open({
            templateUrl: 'app/components/home/home_parents-configdlg.html',
            controller: ['$scope', function (scope) {
                                              
                    if(lang==="es"){
                         scope.i18n = {
                            CONFIGFAMILIES: "Configuración familias",
                            EMAILS: "Emails (para más de uno, separadlos con comas)",
                            FREQTEXT: "Deseo recibir un resumen del seguimiento al correo anterior con la siguiente frecuencia",
                            PREFERREDLANG: "Idioma preferido",
                            NEVER: "Nunca",
                            WEEKLY: "Semanalmente",
                            EVERY2: "Cada 2 semanas",
                            EVERY3: "Cada 3 semanas",
                            MONTHLY: "Mensualmente"
                        };
                    } 
                    else if(lang==="en"){
                         scope.i18n = {
                            CONFIGFAMILIES: "Families configuration",
                            EMAILS: "Emails (for more than one, separate by commas)",
                            FREQTEXT: "I would like to recieve a progress summary to the previous email with the following frequency",
                            PREFERREDLANG: "Preferred language",
                            NEVER: "Never",
                            WEEKLY: "Weekly",
                            EVERY2: "Every 2 weeks",
                            EVERY3: "Every 3 weeks",
                            MONTHLY: "Monthly"
                        };
                    } else {
                        scope.i18n = {
                            CONFIGFAMILIES: "Configuració famílies",
                            EMAILS: "Emails (per més d'un, separau-los amb comes)",
                            FREQTEXT: "Vull rebre el resum del seguiment al correu anterior amb la següent freqüència",
                            PREFERREDLANG: "Idioma preferit",
                            NEVER: "Mai",
                            WEEKLY: "Setmanalment",
                            EVERY2: "Cada 2 setmanes",
                            EVERY3: "Cada 3 setmanes",
                            MONTHLY: "Mensualment"
                        };
                    }
                                              
                    scope.freqOptions = [
                        {label: scope.i18n.NEVER, value: 0},
                        {label: scope.i18n.WEEKLY, value: 1},
                        {label: scope.i18n.EVERY2, value: 2},
                        {label: scope.i18n.EVERY3, value: 3},
                        {label: scope.i18n.MONTHLY, value: 4}
                    ];

                    scope.langOptions = [
                        {label: "Català", value: "ca"},
                        {label: "Español", value: "es"},
                        {label: "English", value: "en"}
                    ];
                    
                    scope.config = {email: $scope.user.emailParents || ""};
                    scope.config.freq = scope.freqOptions.filter(function(x){return x.value ===  $scope.user.uopts.parentsMailFreq;})[0] || scope.freqOptions[1];
                    scope.config.lang = scope.langOptions.filter(function(x){return x.value ===  $scope.user.uopts.parentsMailLang;})[0] || scope.langOptions[0];
        
                    scope.ok = function () {
                        
                        //Check the validity of the email field
                        var emails = scope.config.email.split(",");
                        
                        for(var i=0; i<emails.length; i++){
                            if(!validateEmail(emails[i])){
                                growl.error($scope.i18n.CHECKEMAIL);
                                return;
                            }
                        }
                        
                        modalInstance.close(scope.config);
                    };
                    scope.cancel = function () {
                        modalInstance.dismiss();
                    };
                 }]
            });

            modalInstance.result.then(function(bean) {
               
                $scope.user.emailParents = bean.email;
                 
                $scope.user.uopts.parentsMailFreq = bean.freq.value || 1;
                $scope.user.uopts.parentsMailLang = bean.lang.value || "ca";
                Session.updateStore();
                $http.post("/rest/students/update", {id: $scope.user.id, emailParents: $scope.user.emailParents, uopts: $scope.user.uopts}).then(function(r){
                    if(r.data.ok){
                        growl.success($scope.i18n.CONFIGUPDATED);
                    }
                    else {
                        growl.error($scope.i18n.CONFIGERROR);                    
                    }
                });
            }, function () {
                //window.pw.app.DEBUG && //console.log('dismissed');
            });
    };

            $rootScope.adjustPadding();
        }]);

