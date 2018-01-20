 define([], function(){
"use strict";   

window.pw.app.register.factory('AsgnSrv', function(){
    var Srv = {};
    Srv.gselected = null;   
    return Srv;
});

window.pw.app.register.controller('AssignmentsController', [ '$scope', '$rootScope', '$state', '$http', '$transition$', 'Modals', 'Session', 'growl', 'AsgnSrv', '$translate',
function($scope, $rootScope, $state, $http, $transition$, Modals, Session, growl, AsgnSrv, $translate) {
    
         var idGroup = $transition$.params().idGroup || Session.getCurrentGroup().idGroup;
         var idAssignment = $transition$.params().idAssignment;
    
         $scope.tinymceOpts= $rootScope.tinymceOpts($translate.use());
         $scope.filter = {name: ""};
            
         var days = 4;
         var user = Session.getUser();
         var now = new Date();
         var to =new Date(now.getFullYear(), now.getMonth(), now.getDate()+ days, 23, 59);
         $scope.asgn = null;
         $scope.detail = null;
         $scope.detailData = [];
	 $scope.cbm = {isLabel: false, all: true, isStartOpen: false, isEndOpen: true};
         $scope.myusers = [];
         $scope.uselected = [];
         $scope.units =[];
         $scope.filter = {student: "", group: "", fromDate: null};
         $scope.selunit ={id:0};
         AsgnSrv.gselected = Session.getCurrentGroup();
         
         $scope.reloadAsgn = function(){
              AsgnSrv.gselected = $scope.gselected;
              
              if(!$scope.gselected){
                  return;
              }
              var obj;
              if($scope.filter.fromDate)
              {
                    obj = {year: $scope.filter.fromDate.getFullYear(), month: $scope.filter.fromDate.getMonth()+1};
              }
              
               
              $http.post("/rest/assignments/querycreated", {idUser: user.id, filter: $scope.filter, dt: obj, idGroup: $scope.gselected.idGroup}).then(function(r){
                  var data = r.data; 
                  $scope.currentunits = data;
                   
                   if(idAssignment){
                       data.forEach(function(u){
                          u.assignments.forEach(function(e){
                          if(e.id === idAssignment){
                              $scope.selectedit(e);
                          } 
                       });
                    });
                   } else {
                        $scope.asgn = null;
                   }
                   idAssignment = 0;
                                  
            });
         }; 
         
         //load all units in the current group
         $scope.loadUnits = function(){
             $http.post("/rest/unit/list", {idGroup: $scope.gselected.idGroup}).then(function(r){
             var d = r.data;
             $scope.units = d;     
             window.pw.app.DEBUG && console.log($scope.asgn);
             if($scope.asgn)
             {
                $scope.selunit.id = $scope.asgn.idUnit;                
            }
            else if(d.length)
            {
                $scope.selunit.id = d[0].id;
            }
            window.pw.app.DEBUG && console.log($scope.selunit.id);
         });  
         };
     
       
        //Load all my groups
         $http.post('/rest/groups/list', {idUser: user.id, includeEnrolled: true}).then(function(r){
             var data = r.data;
             $scope.myGroups = data;   
             if(idGroup){
                 data.forEach(function(e){
                     if(e.idGroup===idGroup){
                         $scope.gselected = e;
                     }
                 });
             }
             else if(data.length)
             {
                 $scope.gselected = data[0];
                 
             } else{
                 $scope.gselected = null;
             }
             idGroup = 0;
             AsgnSrv.gselected = $scope.gselected;
             
             $scope.reloadAsgn();
         });
        
         
         var twodigit = function(i)
         {
             if(i>9)
             {
                 return ""+i;
             }
             return "0"+i;
         };
         
         var formatSQLDatetime = function(date)
         {
            if(!date)
            {
                return null;
            }
            
            if(typeof(date)==='string')
            {
                var s1 = date.replace("T"," ");
                var id0 = s1.lastIndexOf(":");
                
                return date.substring(0,id0-1);
                
            }
            else //assume date object
            {
                return date.getFullYear()+"-"+twodigit(date.getMonth()+1)+"-"+twodigit(date.getDate())+" "+twodigit(date.getHours())+":"+twodigit(date.getMinutes());            
            }
         };
         
         $scope.save = function()
         {
            
            var asgn_copy = angular.copy($scope.asgn);
            
            
            if($scope.cbm.isStartOpen)
            {
                asgn_copy.fromDate = null;
            }
            if($scope.cbm.isEndOpen)
            {
                asgn_copy.toDate = null;
            }
            if($scope.cbm.isLabel)
            {
                asgn_copy.idActivity = 0;
                asgn_copy.fromDate = null;
                asgn_copy.toDate = null;
                asgn_copy.maxAttempts = 0;
            }
            
            asgn_copy.postDate = formatSQLDatetime(asgn_copy.postDate);
            asgn_copy.fromDate = formatSQLDatetime(asgn_copy.fromDate);
            asgn_copy.toDate = formatSQLDatetime(asgn_copy.toDate);
          
            asgn_copy.idUnit = $scope.selunit.id; 
            
            
            asgn_copy.applyTo = [];
            $scope.uselected.forEach(function(e){
                asgn_copy.applyTo.push(e.id);
            });
            
            if(asgn_copy.applyTo.length ||  asgn_copy.applyToAll)
            {
                window.pw.app.DEBUG && console.log("enviant");
                window.pw.app.DEBUG && console.log(asgn_copy);
            
                $http.post("/rest/assignments/update", asgn_copy).then(function(r){
                    if(r.data)
                    {
                        growl.success("Assignment updated. Success");
                        $scope.$parent.reload(true);
                        $state.go('home');
                    }
                    else
                    {
                        growl.warning("Unable to update assignment. An error has occurred");
                    }
                    $scope.reloadAsgn();
                    $scope.asgn = null;
                    $scope.detail = null;
                });
            }
            else
            {
                //Must select some user
                //Not working
                growl.warning("You must pick some student in the list");
            }
            
            
         };
          
         
         $scope.delete = function(a)
         {
             
           var okcb = function(){           
                $http.post("/rest/assignments/delete", {idAssignment: a.id}).then(function(r){
                if(r.data)
                {
                    growl.success("Assignment "+a.id+" has been deleted.");
                    $scope.reloadAsgn();
                    $scope.aselected = null;
                    $scope.detail = null;
                }
                });
           };
            
            Modals.confirmdlgpwd("Confirm delete assignment "+a.id, "Segur que voleu eliminar la tasca asignada?", okcb);    
              
        };
             
            
         $scope.selectedit = function(a)
         {
             a.postDate = new Date(a.postDate);
             $scope.asgn = a;
             $scope.uselected = [];
            
             
             $scope.detail = null;
             $scope.cbm.isLabel = (a.idActivity === 0);
             $scope.cbm.isStartOpen = a.fromDate === null;
             $scope.cbm.isEndOpen = a.toDate === null;
             $scope.reloadAsgnPicklist();
             
         };
         
         $scope.select_detail = function(a)
         {
             $scope.asgn = null;
             $scope.detail = a;
             $http.post("/rest/attempt/query", {asgnBean: a}).then(function(r){
                 $scope.detailData = r.data;
             });
         };
         
         $scope.goActivitySearch = function()
         {
             $state.go("home.activitysearch");
         };
         
         
         $scope.assignlabel = function(){
             $state.go("home.assignments.assign", {idActivity: 0, idGroup: AsgnSrv.gselected.idGroup, idAssignment: 0});            
         };
         
         $scope.details = function(a)
         {
             window.pw.app.DEBUG && console.log(a);
             $state.go("home.activity.review", {idActivity: a.idActivity, idAssignment:0, idAttempt: a.id});
         };
         
          $scope.reloadAsgnPicklist = function(){
             
            if($scope.gselected)
            {
                //Load all students associated with a group
                $http.post('/rest/students/listmine', {idGroup: $scope.gselected.idGroup}).then(function(r){
                        var data = r.data;    
                        $scope.myusers_copy = angular.copy(data);
                        window.pw.app.DEBUG && console.log(data);
                        $scope.myusers = data;
                        
                        $scope.myusers = data.filter(function(e){
                            return $scope.filter.name? e.fullname.toLowerCase().indexOf($scope.filter.name.toLocaleLowerCase())>=0 : true;
                        });
                        
                        data.forEach(function (e) {
                            // if(e.id) is found in a.applyTo add to right if not to left
                            var found = false;
                            $scope.asgn.applyTo.forEach(function (ae) {
                                if (ae == e.id)
                                {
                                    found = true;
                                }
                            });
                            if (found)
                            {
                                $scope.uselected.push(e);
                            }
                        });                         
                        $scope.loadUnits();
                   
                });
             }
             else{
                 $scope.myusers = [];
             }             
         };
         
       

         $scope.onCancelEdit = function(){
             
           
              $scope.detailData.forEach(function(student){
                 student.attempts.forEach(function(a){
                     delete a.changed;
                 });
              });  
              $scope.detail.edit = false;
         };
         
         $scope.onAcceptEdit = function(){
                var modifications = [];
                $scope.detailData.forEach(function (student) {
                    student.attempts.forEach(function (a) {
                        if (a.changed) {
                            modifications.push({id: a.id, score: a.score, feedback: a.feedback});
                        }
                        delete a.changed;
                    });
                });
                if (modifications.length) {
                    $http.post("/rest/assignments/mark", modifications)(function() {
                        $scope.detail.edit = false;
                    });
                }
                else {
                    $scope.detail.edit = false;
                }
              
         };
         
            
         $rootScope.$on('changeGrp', function(evt, d){
             $scope.gselected = d.group;
             $scope.reloadAsgn();
         });

         $scope.onChangeUnit = function(){
             window.pw.app.DEBUG && console.log('changed-selunit:'+$scope.selunit.id);
         };
} ]);

});