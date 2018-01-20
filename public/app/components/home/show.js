//
// Admin home dash
//
define([], function(){
    'use strict';
    window.pw.app.register.controller('HomeController', [ '$scope', '$rootScope', '$state', '$http', '$filter', '$translate', 'USER_ROLES', '$uibModal',
        '$timeout', 'Auth', 'Session', 'growl', 
    function($scope, $rootScope, $state, $http, $filter, $translate, USER_ROLES, $uibModal, $timeout, Auth, Session, growl) {
            
            $scope.user = Session.getUser();
            
            $scope.myGroups = $scope.user.groups;
            
            if($scope.user.idRole<USER_ROLES.student || $scope.user.groups.length===0)
            {
                $scope.user.groups = [];
                
                //Per a teacher: Mostra a mes com a grups - les matèries
                $http.post('/rest/subjects/list').then(function(r){    
                     
                    r.data.forEach(function(e){
                        $scope.user.groups.push({id:0, groupName:e.name, idSubject: e.id, gopts: {postcomments: true, allowenroll: false}});
                    });                    
                    
                    //Per a teacher: Inclou els grups que té al principi de la llista
                    $http.post('/rest/groups/list', {idUser: $scope.user.id}).then(function(r){
                       
                       $scope.myGroups = r.data;
                       jQuery.each(r.data, function(i, e){
                          $scope.user.groups.unshift(e); 
                       });
                       
                        $scope.selectedGroup = $scope.user.groups[0];  
                        $scope.onChangeGrp();
                    });
                                        
                   
                });
            }
           
            
            $scope.USER_ROLES = USER_ROLES;
            
            
            $scope.onChangeGrp = function(g){
                
                if(g)
                {
                    $scope.selectedGroup = g;
                }
                $rootScope.$broadcast("changeGrp", {group: $scope.selectedGroup});
                Session.setCurrentGroup($scope.selectedGroup);
                if($scope.selectedGroup.gopts.lang){
                        $translate.use($scope.selectedGroup.gopts.lang);
                        //Session.setLang($scope.selectedGroup.gopts.lang);                        
                } else{
                        $translate.use( $scope.user.language || navigatorLang());
                        //Session.setLang($scope.user.language || getLang());                        
                };
                
                 $scope.reload();
            };
            
            $scope.tgs = {welcome:true,score:true,recent:true,assignments:true,famouseqn:true,quote:true,problem:true, 
                          groups: $scope.user.idRole===USER_ROLES.student && $scope.myGroups.length===0};
                      
            $scope.score= {pos: 3};            
            $scope.error = false;
            
            $scope.datepicker = {dt: new Date(), opened: false};
            
            $scope.units = []; 
            
            $scope.reload = function()
            {
                if(!$scope.selectedGroup)
                {
                    return;
                }
                
                 //Load student or teacher assignments
                var obj = {};
                if($scope.datepicker.dt)
                {
                    obj = {year: $scope.datepicker.dt.getFullYear(), month: $scope.datepicker.dt.getMonth()+1};
                }
                
                if($scope.user.idRole>=USER_ROLES.student)
                {
                    $http.post('/rest/assignments/queryasgn',{idUser: $scope.user.id, dt: obj, idGroup: $scope.selectedGroup.idGroup}).then(function(r){
                        $scope.units = r.data; 
                    });
                    
                } else {
                  
                    $http.post('/rest/assignments/querycreated',{idUser: $scope.user.id, dt: obj, idGroup: $scope.selectedGroup.id}).then(function(r){
                        
                        $scope.units = r.data; 
                    });
                    
                }
            };
            
            
             
            if($scope.user.groups.length>0)
            {
                $scope.selectedGroup = $scope.user.groups[0];     
                Session.setCurrentGroup($scope.selectedGroup);
                $scope.onChangeGrp();
            }
            
            
            var loadCenterGroups = function(){
                 $http.post("/rest/groups/listcenter", {schoolId: $scope.user.schoolId, idUser: $scope.user.id}).then(function(r){
                    $scope.groupsCenter = r.data;
                });
            };
            
            if($scope.user.idRole>=USER_ROLES.student)
            {
               loadCenterGroups();
            }
          
            
         
            $scope.randomizeEqn = function(){              
                $http.post('/rest/oftheday/eqn').then(function(r){
                 $scope.randomEqn = r.data;  
            });
            };
        
            $scope.randomizeQuote = function(){              
                $http.post('/rest/oftheday/quote').then(function(r){
                    var d = r.data;
                    $scope.randomQuote = "<blockquote><p>"+d.quote+"</p><footer>"+d.author+
                            "</footer></blockquote>";                
                });
            };
            
            $scope.changeAvatar = function(){
                var user = $scope.user;
                
                var modalInstance = $uibModal.open({
                templateUrl: 'app/shared/avatar-dlg.html',
                controller: ['$scope', function($scope){
                     $scope.title= 'AVATARS';
                     
                     $scope.limits = [0, 500, 1000];
                     $scope.avatars = [{image: '0', c:0}, {image: '1', c:0}, {image: '2', c:0},
                                       {image: '3', c:1}, {image: '4', c:1},{image: '5', c:1},
                                       {image: '6', c:1}, {image: '7', c:2}];
                                     
                     $scope.selected = null;
                     $scope.score = 0;
                     $scope.score = 200000;
                    
                     for(var i in $scope.avatars)
                     {
                         if($scope.avatars[i].image=== user.uopts.avatar)
                         {
                             $scope.selected =$scope.avatars[i];
                             break;
                         }
                     }
                     $scope.onclick = function(s){
                            var reqScore = $scope.limits[s.c];
                            if($scope.score>=reqScore)
                            {
                                $scope.selected = s;
                            }
                      }; 
                     
                     $scope.ok = function(){
                           modalInstance.close($scope.selected);
                     };
                     
                     $scope.cancel = function(){
                         modalInstance.dismiss();
                     };
                }],
                size: 's' 
                });

                modalInstance.result.then(function (confirm) {
                    if(confirm)
                    {
                        $scope.user.uopts.avatar = confirm.image;
                        $http.post('/rest/students/updateuopts', {uopts: $scope.user.uopts, id: $scope.user.id});
                        Session.updateCookies();
                    }
                }, function () {
                    //window.pw.app.DEBUG && console.log('dismissed');
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
                    $scope.randomizeQuote();
                    $scope.randomizeEqn();
                }, 500);
                
            };
            
            $scope.goAsgn = function(a){
                $state.go("home.activity", {idActivity: a.idActivity, idAssignment: a.id});
            };
            
            $scope.randomizeEqn();
            $scope.randomizeQuote();
             
            
            $scope.showScore = function(idx, idgroup)
            {

                
            };
            
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
            
            $scope.removeAsgn = function(a){
                
                //Confirm delete
                 var modalInstance = $uibModal.open({
                    templateUrl: 'app/components/groups/create-tpl.html',
                    controller: ['$scope', '$modalInstance', 'Auth', function($scope, $modalInstance, Auth){
                        
                     $scope.title = 'Confirm delete assignment ' + a.id;
                     $scope.msg = 'Segur que voleu eliminar aquesta tasca assignada?',
                     $scope.invalidpwd = '';
                     
                     $scope.ok = function () {
                        Auth.checkPassword($scope.cpwd).then(function(d){
                        if (d.ok)
                        {
                            modalInstance.close('ok');
                        }
                        else
                        {
                            $scope.invalidpwd = 'Invalid password';
                        }
                        });
                        
                    };

                    $scope.cancel = function () {
                        $modalInstance.dismiss('cancel');
                    };
                }],
                    size: 'sm'
                });

                modalInstance.result.then(function (grp) {                    
                    $http.post("/rest/assignments/delete", {idAssignment: a.id}).then(function(){                    
                        $scope.reload();
                    });
                }, function () {
                    //window.pw.app.DEBUG && console.log('dismissed');
                });
                
            };
            
            $scope.editAsgn = function(a){
                $state.go("home.assignments", {idGroup: a.idGroup, idAssignment: a.id});
            };
              
            $scope.goAssignments = function(){
              $state.go("home.assignments", {idGroup: 0, idAssignment: 0});
            };
            
            $scope.editUnit = function(u){
                u.edit = true;
                u.unitbck = u.unit;
            };
 
            $scope.cancelEditUnit = function(u){                
                u.unit = u.unitbck;
                delete u.unitbck;
                u.edit = false;
            };
            
            $scope.saveEditUnit = function(u){
                $http.post("/rest/unit/save", u).then(function(){                    
                    delete u.unitbck;
                    u.edit = false;
                });
            };
          
            $scope.go = function(route){
                $state.go(route);
                if(route==='home'){
                    $scope.reload();
                }
            };
            
            $scope.showEquations = function(){
                $http.post("/rest/oftheday/eqns").then(function(){
                   $scope.eqns = d;
                });
            };
            
 
            $scope.showScore(1);
            $rootScope.adjustPadding();
    } ]);

});