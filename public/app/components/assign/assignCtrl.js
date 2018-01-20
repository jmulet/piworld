 define([], function(){
"use strict";
 
window.pw.app.register.controller('AssignController', [ '$scope', '$rootScope', '$state', '$http', '$transition$', '$translate', 'Session', 'growl', 'AsgnSrv', 
function($scope, $rootScope, $state, $http, $transition$, $translate, Session, growl, AsgnSrv) {
    
         var days = 4;
         var user = Session.getUser();
         var now = new Date();
         var to =new Date(now.getFullYear(), now.getMonth(), now.getDate()+ days, 23, 59);
      
      
         $scope.tinymceOpts= $rootScope.tinymceOpts($translate.use());
         $scope.filter = {name: ""};
            
         $http.post("/rest/activity/get", {idActivity: $transition$.params().idActivity}).then(function(r){
             var d = r.data;
             $scope.activity = d;  
             $scope.asgn.instructions = d.description;
         });      
      
         $scope.asgn = {idActivity: $transition$.params().idActivity, idUser: user.id, instructions: "", postDate: now, fromDate: now, toDate: to, maxAttempts: 0, applyToAll: 1, params: '{}', visible:1};
	 $scope.cbm = {isLabel: $scope.asgn.idActivity===0, isStartOpen: true, isEndOpen: true};
         $scope.myusers = [];
         $scope.uselected = [];
    
        //load all units in the current group
         $scope.loadUnits = function(){
             $http.post("/rest/unit/list", {idGroup: $scope.selgroup.idGroup}).then(function(r){
             
                 var d = r.data;
                 $scope.units = d;     
              
                $scope.selunit = null;
                if(d.length){
                    var p = d[0];
                    //Try to find the active unit in the group
                    jQuery.each(d, function(i, e){
                       if($scope.selgroup.currentUnit === e.id){
                           p = e;
                           e.unit = "* "+e.unit;
                           return true;
                       } 
                    });
                    $scope.selunit = p;
                }
              
         });  
         };
    
         $scope.selgroup = AsgnSrv.gselected || Session.getCurrentGroup();
         
         
       
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
            return date.getFullYear()+"-"+twodigit(date.getMonth()+1)+"-"+twodigit(date.getDate())+" "+twodigit(date.getHours())+":"+twodigit(date.getMinutes());            
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
            
            asgn_copy.applyTo = [];
            if(!asgn_copy.applyToAll)
            {
                    $scope.uselected.forEach(function(e){
                        asgn_copy.applyTo.push(e.id);
                    });
            }
            
            if(asgn_copy.applyTo.length>0 || asgn_copy.applyToAll)
            {            
                asgn_copy.idGroup = $scope.selgroup.idGroup;
                asgn_copy.idUnit = $scope.selunit? $scope.selunit.id : 0;
                
                 if(asgn_copy.idUnit){
                    
                    $scope.block = true;
                    
                    //Try to place assignment order to the end
                    
                    
                    asgn_copy.order = 0; //$scope.$parent.$parent.getOrder(asgn_copy.idUnit) || 0;
                    
                    $http.post("/rest/assignments/create", asgn_copy).then(function(r){
                        $scope.block = false;  
                        // This method no longer exists, now it is handled by list component                     
                        // $scope.$parent.$parent.reload(true);
                        // This is to force a change in group object which in turn triggers a
                        // a change in list component.
                        var $scopeHome = $scope.$parent.$parent;
                        $scopeHome.selectedGroup.externalChanges = new Date().getTime();
                        
                        if(r.data.ok)
                        {
                            growl.success("Assignment created. Success");
                        }
                        else
                        {
                            growl.warning("Unable to register assignment. An error has occurred");
                        }
                        
                        $state.go("home");
                    });
                
                } else{
                    growl.warning("You must create or pick one unit in the group choosen");
                }
            }
            else
            {
                //Must select some user
                //Not working
                growl.warning("You must pick some student in the list or assign to everybody");
            }
            
            
         };
         
         $scope.cancel = function(){
             $state.go("home");
         };
         
         $scope.reloadPicklist = function(){
            if($scope.selgroup)
            {
                //Load all students associated with a group
                $http.post('/rest/students/listmine', {idGroup: $scope.selgroup.idGroup}).then(function(r){
                    //Apply filter
                    
                    $scope.myusers = r.data.filter(function(e){
                        return $scope.filter.name? e.fullname.toLowerCase().indexOf($scope.filter.name.toLocaleLowerCase())>=0 : true;
                    });
                    $scope.loadUnits();
                });
             }
             else{
                 $scope.myusers = [];
             }
             
         };
        
          
         if($scope.selgroup)
         {
            $scope.reloadPicklist();
         }
         
         $scope.changeGroup = function(g){
             $scope.selgroup = g;
             $scope.reloadPicklist();
         };
         
         $rootScope.$on('changeGrp', function(evt, d){
             $scope.selgroup = d.group;
             $scope.reloadPicklist();
         });

} ]);

});