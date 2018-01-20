define([], function(){
"use strict"; 

window.pw.app.register.filter('statusname', function(){
    return function(value)
    {
        var out = value || "";
        if(value==1)
        {
            out = "ENABLED";
        }
        else if(value==0)
        {
            out = "DISABLED";
        }
        else if(value==-1)
        {
            out = "PENDING";
        }
        return out;
    }; 
});

window.pw.app.register.controller('CentersCtrl', [ '$scope', '$rootScope', '$state', '$http', 'USER_ROLES', '$translate', 'Session', 'growl', 'PwTable', '$filter', 'Modals', 
function($scope, $rootScope, $state, $http, USER_ROLES, $translate, Session, growl, PwTable, $filter, Modals) {

    $scope.user = Session.getUser();
    $scope.USER_ROLES = USER_ROLES;
 
      
      
    $scope.tableParams0 = new PwTable({
        page: 1,            // show first page
        count: 10,           // count per page
        sorting: ["+fullname"]
        }, function($defer, params) {
            $http.post('/rest/center/list', {}).then(function(r){            
                if(r.data.length){
                    $scope.selection = r.data[0];
                    $scope.tableParams.reload();
                }
                $defer.resolve(r.data);
            });
             
        }
     );
    
    $scope.tableParams = new PwTable({
        page: 1,            // show first page
        count: 10,           // count per page
        sorting: ["+fullname"]
        }, function($defer, params) {
            if($scope.selection){
                    var fq = " u.schoolId='"+$scope.selection.id+"' ";
                    if(!$scope.selection.showStudents)
                    {
                        fq += " AND u.idRole<"+USER_ROLES.student;
                    }
                    $http.post('/rest/students/list', {edit:1, filterQuery: fq}).then(function(r){                             
                        $defer.resolve(r.data);
                    });
            } else {
                $defer.resolve([]);
            }
                    
    });

    $scope.toggle= function()
    {
        $scope.tableParams.reload();
    };

    $scope.changeSelection = function(u){
        $scope.selection = u;
        $scope.tableParams.reload();
    };
     
    
    $scope.newCenter = function(){
        //$scope.tableParams.reload();
        var u ={id:0, schoolName:"", professorName:"", professorEmail:"", language:"ca", edit: true, enrollpassword: Math.random().toString(36).substring(4), canEnroll: 1, canPublish: 1};
        $scope.tableParams0.$data.push(u);
        $scope.edit0(u);
    };  
      
     
    $scope.newTeacher = function(){
        //$scope.tableParams.reload();
        var u ={id:0, fullname:"", username:"", password:"", email:"", idRole:100, schoolId: $scope.selection.id, edit: true};
        $scope.tableParams.$data.push(u);
        $scope.edit(u);
    };  
    
    $scope.edit = function(u){
        u.backup = angular.copy(u);
    };  
    
    $scope.edit0 = function(u){
         u.backup = angular.copy(u);
         $scope.selection = null;
    };
    
    $scope.save = function(u){
        u.id = parseInt(u.id);
        delete u.backup;
        if(u.id>0)
        {
            $http.post("/rest/students/update", u).then(function(r){
                    if(!r.data.ok)
                    {
                        growl.warning("No s'ha pogut desar l'usuari :-(");
                    }
            });
        }
        else
        {
            $http.post("/rest/students/create", u).then(function(r){
                    if(!r.data.ok)
                    {
                        growl.warning("No s'ha pogut crear l'usuari :-(");
                    }
                    $scope.tableParams.reload();
            });
        }
    };  
    
    $scope.save0 = function(u){
        u.id = parseInt(u.id);
        delete u.backup;

        $http.post("/rest/center/update", u).then(function (r) {
            if (!r.data.ok)
            {
                growl.warning("No s'ha pogut desar el centre :-(");
            }
        });
        $scope.tableParams0.reload();
        $scope.selection = null;

    };  
    
    $scope.cancel = function(u){
        for(var key in u.backup)
        {
            u[key] = u.backup[key];
        }
        delete u.backup;
        if(u.id===0)
        {
            $scope.tableParams.reload();
        }
    };  
    
     $scope.cancel0 = function(u){
        for(var key in u.backup)
        {
            u[key] = u.backup[key];
        }
        delete u.backup;
        if(u.id===0)
        {
            $scope.tableParams0.reload();
        }
        $scope.selection = null;
    };  
    
    $scope.confirmDlg = function (u) {
        
        var okcb = function(){
                $http.post("/rest/students/delete",{idAlumne: u.id, idRole: u.idRole}).then(function(r){                                        
                    $scope.tableParams.reload();
                    if(!r.data.ok)
                    {
                        growl.warning("Unable to delete user "+u.fullname);
                    }
                });
            };
            
        Modals.confirmdlgpwd("Confirm delete user "+u.fullname, 'Segur que voleu eliminar aquest usuari?', okcb);        
           
    };
        
    $scope.confirmDlg0 = function (u) {
                        
             var okcb = function(){
                $http.post("/rest/center/delete",{id: u.id}).then(function(r){                                        
                    $scope.tableParams0.reload();
                    $scope.selection = null;
                    if(!r.data.ok)
                    {
                        growl.warning("Unable to delete center "+u.schoolName);
                    }
                });
            };
            
            Modals.confirmdlgpwd("Confirm delete center "+u.schoolName, 'Segur que voleu eliminar aquest centre?', okcb);   
        
    };
    
           
}]);

});