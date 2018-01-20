//
// Teacher home dash


    'use strict';
    
   var pwcUnitsTeacherCtrl = function($rootScope, $state, $http, $translate, $timeout, USER_ROLES, Modals, Session, growl) {
        var ctrl = this;
        ctrl.tgs = {edition: false};
        ctrl.USER_ROLES = USER_ROLES;
        
                
        ctrl.currentYear = pw.currentYear; 
            
         
        ctrl.tinymceOpts= $rootScope.tinymceOpts($translate.use());
        
        
        ctrl.noGhostFilter = function(value){            
            return !value.gopts.isGhost;
        };
            
            
        ctrl.reportUnit = function(u){
                $state.go("home.unittrace", {idUnit: u.id});
        };
           
        
        ctrl.reload = function(forceUpdate)
        {
                
                if(!ctrl.pwcID){
                    return;
                }
                ////console.log("pwc-units-teacher:: reload", ctrl.group);
                
                if(!ctrl.group)
                {                    
                    if(ctrl.user.groups.length){
                        ctrl.group = ctrl.user.groups[0];
                        ctrl.onChangeGrp(true);
                    } else {
                        ////console.log("pwc-units: Cannot reload since group is not selected");
                        ctrl.units = [];
                        return;
                    }
                }
                var idGroup = ctrl.group.idGroup;
                  
                $http.post('/rest/assignments/querycreated', {idGroup: idGroup}, true).then(function(r){       
                        
                           if(ctrl.group.thmcss){
                                Session.addCss(ctrl.group.thmcss);
                           }
                        
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
                       
                       $timeout(function(){
                            var fn = function(e){
                                   jQuery(this).next('ul').toggle();
                                   e.stopPropagation();
                                   e.preventDefault();
                                }; 
                            jQuery('.dropdown-submenu a.test').off().on("click", fn);
                        }, 1500);
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
           
            if(ctrl.group.gopts.lang){                   
                $translate.use(ctrl.group.gopts.lang);                                      
            } else {
                $translate.use( ctrl.user.language || navigatorLang());                     
            };                        
 
            ctrl.reload(forceUpdate);
        };
       
       
            
        ctrl.onSort = function($item, $partFrom, $partTo, $indexFrom, $indexTo){

                //Primer adivinar a quina unitat estic movent l'item
                var fromUnit = $item.idUnit;
                var toUnit;
                jQuery.each(ctrl.units, function(i, e){
                    if(e.assignments===$partTo){
                        toUnit = e.id;
                        return true;
                    }
                });
                var order = [];
                if(toUnit !== fromUnit){
                    $item.idUnit = toUnit;                
                    jQuery.each($partTo, function(i, e){
                        order.push({id: e.id, idUnit: e.idUnit, pos: i});              
                    });
                } else {
                    jQuery.each($partFrom, function(i, e){
                        order.push({id: e.id, idUnit: e.idUnit, pos: i});              
                    });
                }
                $http.post("/rest/assignments/reorder", {order: order});

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

        /**
         * Returns the last index of the assignment in the unit
         * @param {type} idUnit
         * @returns {undefined}
         */
        ctrl.getOrder = function(idUnit){
            var index = 0;
            jQuery.each(ctrl.units, function(i, e){
                if(e.id === idUnit){
                    index = e.assignments.length;
                    return true;
                }
            });
            return index;
        };
       
        ctrl.setCurrentUnit = function(u){
            if(ctrl.group){
                ctrl.group.currentUnit = u.id;
                //update this group in database
                $http.post('/rest/groups/update', ctrl.group).then(function(r){
                    if(!r.data.ok){
                        growl.error("Failed to update group");
                    }
                });
            }
        };
 
        ctrl.toggleVisibility = function(u, type){
            u.visible = type;
            $http.post('/rest/unit/save', u).then(function(r){
                    if(!r.data.ok){
                        growl.error("Failed to update unit");
                    }
            });
        };
     
        ctrl.onToggleEdition = function(){
            var tmp =!ctrl.tgs.edition;
            if(tmp){

                var okcb = function(){
                    ctrl.tgs.edition = true;
                    ////console.log(ctrl.tgs.edition);
                };

                Modals.confirmdlgpwd("Authenticate", "Voleu activar el mode edició?", okcb);
            } else {
                ctrl.tgs.edition = tmp;
            }
            
            ////console.log(ctrl.tgs.edition);
        };

        ctrl.asgnVisibility = function(a){
            a.visible = (a.visible+1) % 2;
            $http.post('/rest/assignments/updatevisibility', {visible: a.visible, id: a.id}).then(function(r){
                    if(!r.data.ok){
                        growl.error("Failed to update assignment");
                    }
            });
        }; 


        ctrl.grades4activity = function(asgn){
            $state.go("home.activitytrace", {idActivity: asgn.idActivity, idAssignment: asgn.id, idGroup: ctrl.group.idGroup});
        };
        
           
        ctrl.removeAsgn = function(a){

            var okcb = function(){
                    $http.post("/rest/assignments/delete", {idAssignment: a.id}).then(function(){                    
                        ctrl.reload();
                    }, function(){
                        growl.error(":-( Unable to delete assignment.");
                    });
            };

            Modals.confirmdlgpwd('Confirm delete assignment ' + a.id, 'Segur que voleu eliminar aquesta tasca assignada?', okcb);

        };

        ctrl.editAsgn = function(a){
            $state.go("home.assignments", {idGroup: a.idGroup, idAssignment: a.id});
        };

        ctrl.editUnit = function(u){
            u.edit = true;
            u.unitbck = u.unit;
        };

        ctrl.cancelEditUnit = function(u){                
            u.unit = u.unitbck;
            delete u.unitbck;
            u.edit = false;
        };

        ctrl.saveEditUnit = function(u){
            $http.post("/rest/unit/save", u).then(function(){                    
                delete u.unitbck;
                u.edit = false;
            });
        };

        //It will be added to all students in the current group                                         
        ctrl.addLabelInUnit = function(u){
            var a = {id:0, idActivity: 0, open: true, doneAttempts: 0, assigned:0, instructions: "", idUnit: u.id, applyTo: null, applyToAll: 1, visible: 1}; 
            var obj = {idActivity: 0 || 0, idUser: ctrl.user.id, idUnit: u.id || 0, postDate: new Date(), maxAttempts: 0, instructions: "<p></p>", 
                applyTo: null, applyToAll: 1, visible: 1};

            $http.post("/rest/assignments/create", obj).then(function(r){
                //Pass the correct id to the "object a"
                a.id = r.data.id;
                u.assignments.push(a);
            });
        };

        ctrl.onEditLabel = function(a){
            a.bck = a.instructions;
            a.edit = true;
        };


        ctrl.onCancelEditLabel = function(a){
            a.instructions = a.bck;
            delete a.bck;
            a.edit = false;
        };


        ctrl.onAcceptEditLabel = function(a){
            a.idUser = ctrl.user.id;
            var url = a.id>0? "/rest/assignments/tinyupdate": "/rest/assignments/create";
            $http.post(url, a).then(function(d){
                delete a.bck;
                a.edit = false;
            });
        }; 

        ctrl.onRemoveLabel = function(a){

            var okcb = function(){
                $http.post("/rest/assignments/delete", {idAssignment: a.id}).then(function(d){
                    ctrl.reload();
                });                  
            };
            Modals.confirmdlg('Confirm delete label ' + a.id, 'Segur que voleu eliminar aquesta etiqueta?', okcb);
        };
         

     
        ctrl.$onInit = function(){
            
            ctrl.mobile? ctrl.headingStyle={position: 'fixed', 'z-index': '1000', width: "100%", 'top': '55px', left:'0px', height: '40px'} : ctrl.headingStyle = {};    
      
            if(!ctrl.user){
                ////console.log("user must be passed");
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

            }

            if(ctrl.user.groups.length>0)
            {
                if (!g) {
                   ctrl.group = ctrl.user.groups[0];
                    Session.setCurrentGroup(ctrl.group);
                }
                ctrl.onChangeGrp();
            }

            ctrl.pwcID = Math.random().toString(36);
            window.pw.DEBUG && console.log("pwc-units-teacher ",ctrl.pwcID, ": $onInit " );
            ctrl.reload(true);
        };
 


        ctrl.$onChanges = function(changes){
            window.pw.DEBUG && console.log("pwc-units-teacher ",ctrl.pwcID, changes, ": $onChanges " );
           if(ctrl.pwcID && changes.group){
               ctrl.$watch("changes.group.externalChanges", function() {
                    ctrl.reload(true);
               });
               ctrl.reload(true);
           }
        };
    };
    
/************************************************************************************************************
 *  UNITS COMPONENT
 ************************************************************************************************************/    
    
    
   window.pw.app.register.component('pwcUnitsTeacher', 
        {
            bindings: {
                user: "<",
                group: "<",
                collapse: "<",
                mobile: "@"                       
            },
            templateUrl: "app/components/home/pwc-units-teacher.html",
            controller: [  "$rootScope", "$state", "$http", "$translate", "$timeout", "USER_ROLES", "Modals", "Session", "growl",
                pwcUnitsTeacherCtrl],
            controllerAs: "vm"
        }
    );

/************************************************************************************************************
 *  HOME CONTROLLER
 ************************************************************************************************************/    
    
 
window.pw.app.register.controller('HomeController', ['HomeService', '$scope', '$rootScope', '$state', '$http',  '$translate', 'USER_ROLES', '$uibModal', 'Modals', '$window',
        '$timeout', 'Auth', 'Session', 'growl', 'MyCacheService', '$ocLazyLoad', 
    function(HomeService, $scope, $rootScope, $state, $http,  $translate, USER_ROLES, $uibModal, Modals, $window, $timeout, Auth, Session, growl, MyCacheService, $ocLazyLoad) {
           
            $scope.USER_ROLES = USER_ROLES;
            
            HomeService.initialize();
            
            var modalInstance;
            $ocLazyLoad.load('ngIdle').then(['Idle', 'IdleProvider', function(Idle, IdleProvider){

                   // configure Idle settings
                   IdleProvider.idle(window.pw.isMobile()? 86400 : 600); // in seconds; in mobile one day
                   IdleProvider.timeout(30);        // in seconds
                   //KeepaliveProvider.interval(2); // in seconds
 
 
                    Idle.watch();

                    $rootScope.$on('IdleStart', function() {

                        modalInstance = $uibModal.open({
                            templateUrl: 'app/shared/alert-dlg.html',
                            controller: ['$scope', function ($scope) {
                                    $scope.count = 30;
                                    $scope.ok = function () {
                                        modalInstance.close(true);
                                    };
                                    $scope.title = "Temps d'inactivitat";
                                    $scope.msg = "Es tancarà la sessió en {{count}} segons.";
                                }]
                        });

                        modalInstance.result.then(function (r) {
                            if (r) {
                                Idle.watch();
                            }
                            ;
                        }, function () {
                            Idle.watch();
                        });


                    });

                    $rootScope.$on('IdleTimeout', function () {
                        if (modalInstance) {
                            modalInstance.close();
                        }
                        Session.logout();
                    });

                    $rootScope.$on('IdleEnd', function () {
                        modalInstance.close(true);
                    });
       }]);

     
          
             
            $scope.user = Session.getUser();
            $scope.$on("changeGrp", function(evt, d){
                $scope.selectedGroup = d.group;
                randomizeOfTheDay(true);
            });
            
            if(!$scope.user || $scope.user.idRole===USER_ROLES.guest){
                //Guest user found
                $state.go('login');
            }
            
            
            // Optionally Add user thumbnails to override avatars -->
            var HomeCache = MyCacheService.getCache("HomeCache", false);
             
        
            var randomizeOfTheDay = function(forceUpdate){
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
            $scope.dc = "";
          
            
            var isLarge = jQuery("body").width()>749;
            
            $scope.tgs = {mobileShow:1, welcome:isLarge, score:isLarge,recent:true,assignments:true,famouseqn:isLarge,quote:isLarge,problem:isLarge, 
                          groups: $scope.user.groups.length===0, users: isLarge, chat: true};
                      
            $scope.error = false;
           
            
            /**
            var loadCenterGroups = function(){
                 $http.post("/rest/groups/listcenter", {schoolId: $scope.user.schoolId, idUser: $scope.user.id}).then(function(r){
                    $scope.groupsCenter = r.data;
                });
            };
            
            if($scope.user.idRole>=USER_ROLES.student)
            {
               loadCenterGroups();
            }
            **/
          
           /**
            $scope.randomizeEqn = function(forceUpdate){                 
                HomeCache.httpCache('eqn', 'oftheday/eqn', forceUpdate).then(function (rnd) {
                    $scope.randomEqn = rnd;                    
                 });
            };
        
            $scope.randomizeQuote = function(forceUpdate){              
                 HomeCache.httpCache('quote', 'oftheday/quote', forceUpdate).then(function(rnd){
                
                    $scope.randomQuote = "<blockquote><p>"+rnd.quote+"</p><footer>"+rnd.author+
                            "</footer></blockquote>";                
                });
            };
            **/
           
           $scope.authAndGo = function(route){

                Modals.sudlg(function(){
                    $state.go(route);
                });

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
                        jQuery("#mainview,html,body").scrollTop(0);
                    },
                500);
           };
           
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
                                list.forEach(function (idx) {
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
                            $scope.score = 200000;
                            

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
                                ////console.log(files[0]);
                                if (files[0].type !== "image/png") {
                                    growl.warning("Image must be a png file");
                                    return;
                                }
                                Upload.upload({
                                    url: '/rest/fs/upload',
                                    file: files[0],
                                    fields: {'idUser': user.id, 'type': 'avatar'}
                                }).then(function (resp) {
                                    ////console.log('Success');
                                    //Reload image
                                    $scope.dc = Math.random();
                                    $scope.selected = $scope.custom;
                                }, function (resp) {
                                    ////console.log('Error status: ' + resp.status);
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
                    //window.pw.app.DEBUG && ////console.log('dismissed');
                });
            };
              
            //when the form is submitted
            $scope.logout = function() {
                Session.logout();            
            };
            $scope.changeLanguage = function (langKey) {
                $translate.use(langKey);
                //Session.setLang(langKey);
                $rootScope.$broadcast("changeLang", langKey);
                $timeout(function(){
                    randomizeOfTheDay(true);
                }, 500);
                
            };
            
           
            
            /**
            $scope.enroll = function(g)
            {
                    $http.post("/rest/groups/doenroll", {idUser: $scope.user.id, idGroup: g.id, enrollPassword: g.enrollPwd}).then(function(r){
                        g.enrollPwd = "";
                        var d = r.data;
                        if(d.ok)
                        {
                            growl.success(d.msg);
                            $scope.reload();
                            loadCenterGroups();
                            
                            //TODO:Ha d'eliminar els grups temporals que hem creat sense id
                            $scope.user.groups = $scope.user.groups.filter(function(item, idx){
                                return item.id!==null && item.id>0;                                
                            });
                            
                            $scope.user.groups.push(d.group || {});
                            $scope.myGroups = $scope.user.groups;
                            $scope.selectedGroup = $scope.myGroups[$scope.myGroups.length-1];
                            Session.setCurrentGroup($scope.selectedGroup);
                            Session.updateCookies();
                        }
                        else
                        {
                            growl.error(d.msg);
                        }
                    });
            };
         **/
        
            $scope.go = function(route){
                $state.go(route);  
            };
             
        
            $scope.toggleMain = function(){
                $scope.mainExpanded = !$scope.mainExpanded;
                if($scope.mainExpanded){
                    $scope.leftClass = "hidden";
                    $scope.mainClass = "col-md-12";
                    $scope.rightClass = "hidden";
                } else {
                    $scope.leftClass = "col-md-3 col-lg-3";
                    $scope.mainClass = "col-md-9 col-lg-7";
                    $scope.rightClass = "col-lg-2";
                }                
            };
            
            $scope.toggleLeft = function(){
                $scope.leftExpanded = !$scope.leftExpanded;
                if($scope.leftExpanded){
                    $scope.leftClass = "col-md-12";
                    $scope.mainClass = "hidden";
                    $scope.rightClass = "hidden";
                } else {
                    $scope.leftClass = "col-md-3 col-lg-3";
                    $scope.mainClass = "col-md-9 col-lg-7";
                    $scope.rightClass = "col-md-2 col-lg-2";
                }                
            };
            
            $scope.toggleRight = function(){
                $scope.rightExpanded = !$scope.rightExpanded;
                if($scope.rightExpanded){
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
            $scope.registerSFA = function(event){
                event.preventDefault();
                var url = event.target.href;
                $window.open(url, '_blank');
                if($scope.user.idRole === USER_ROLES.student){
                   var vscore = event.target.attributes['vscore'].value;
                   $http.post("/rest/video/vscore", {idActivity: 0, idLogin: $scope.user.idLogin, vscore: vscore || 1, vseconds: 0, resource: url});    
                }
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

       
       
       
            $scope.tabMobile = function(pos){
                ////console.log("TABMOBILE CALLED ", pos);
                if(pos===4){
                     $scope.scrollToLastChat();
                     $scope.tgs.chatWarning = false;
                }
                $scope.tgs["tab"+pos] = true; 
                $scope.tgs.mobileShow = pos;
                $scope.scrollToTop();
            };
            
         
          
            Session.getSocket().on("chat-recieved", function (data) {
               if (data.idUser !== $scope.user.id) {
                  if($scope.tgs.mobileShow!==4){
                      $scope.tgs.chatWarning = true;
                  } 
               }
             });
            

       
            //$scope.showScore(1);
            $rootScope.adjustPadding();
            
          
            
            } ]);
 
