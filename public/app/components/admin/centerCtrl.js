define(["filesaver"], function(){
"use strict";

window.pw.app.register.controller('CenterCtrl', [ '$scope', '$http', 'USER_ROLES', 'Session', 'growl', 'PwTable', '$filter', 'Modals', '$uibModal',
function($scope, $http, USER_ROLES, Session, growl, PwTable, $filter, Modals, $uibModal) {

    $scope.user = Session.getUser();
    $scope.USER_ROLES = USER_ROLES;
    $scope.disable = !($scope.user.idRole===USER_ROLES.admin || ($scope.user.idRole===USER_ROLES.teacheradmin));   
    $scope.selection = {showStudents: false};
     
    $scope.mask = true;

    $scope.tableParams = new PwTable({
            count: 10,          
            counts: [10, 20, 30],
            sorting: ["+fullname"]
        }, 
         function(defer, params) {
            var fq = " u.schoolId='"+$scope.user.schoolId+"' ";
            if(!$scope.selection.showStudents)
            {
                fq += " AND u.idRole<"+USER_ROLES.student;
            }
             $http.post('/rest/students/list', {edit:1, filterQuery: fq}).then(function(r){                                             
                defer.resolve(r.data);            
            });
             
        }
     );

     
    
    
     
    $scope.changeInfo = function(){
        $http.post("/rest/center/update", $scope.user).then(function(r){
            if(!r.data.ok)
            {
                growl.error("Unable to update center information :-(");
            }
        });
    };
     
    $scope.newTeacher = function(){
        window.pw.app.DEBUG && console.log($scope.tableParams);
        //$scope.tableParams.reload();
        var u ={id:0, fullname:"", username:"", password:"", email:"", idRole:100, schoolId: $scope.user.schoolId, edit: true};
        $scope.tableParams.allData.push(u);
        $scope.tableParams.paginate();
        $scope.edit(u);
    };  
    
    
    //Inline edition replaced by dlg edit
    
    $scope.editDlg = function(user){
        var ubck = angular.copy(user);
        var modalInstance = $uibModal.open({
                templateUrl: 'app/components/admin/edit-dlg.html',
                controller: ['$scope', function(scope){
                            scope.title = "Edit "+ubck.fullname;
                            scope.model = ubck;
                            scope.user = $scope.user;
                            scope.availableRoles = [];
                            $.each(Object.keys(USER_ROLES), function(i, key){
                                scope.availableRoles.push({name: key, id: USER_ROLES[key]});
                            });
                            
                            scope.role = scope.availableRoles.filter(function(x){
                                return x.id === user.idRole;
                            })[0] || scope.availableRoles[2];
                            
                            scope.ok = function () { 
                                scope.model.idRole = scope.role.id;                           
                                modalInstance.close(scope.model);                                
                            };

                            scope.cancel = function () {
                                modalInstance.dismiss('cancel');
                            }; 
                }],
                size: 's'                                
            });

        modalInstance.result.then(function(u) {
                u.id = parseInt(u.id);

                if(u.id>0)
                {
                    $http.post("/rest/students/update", u).then(function(r){
                            if(!r.data.ok)
                            {
                                growl.warning("No s'ha pogut desar l'usuari :-(");
                            }
                            $scope.tableParams.reload();
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
        });     
                
    };
    
    
    $scope.edit = function(u){
        u.backup = angular.copy(u);
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
           
           
           
        
    $scope.importDlg = function () {
        var modalInstance = $uibModal.open({
            templateUrl: 'app/components/admin/import-dlg.html',
            controller: ['$scope', 'modalParams', function (scope, modalParams) {
                    scope.title = modalParams.title;
                    scope.msg = modalParams.msg;
                    scope.schoolId = $scope.user.schoolId;
                    scope.model = {text: "", updateIfExists: false};
                    
                    scope.ok = function () {
                        modalInstance.close(scope.model);
                    };

                    scope.cancel = function () {
                        modalInstance.dismiss('cancel');
                    };
                }],
            size: 's',
            resolve: {
                modalParams: function () {
                    return {
                        title: "Importació massiva d'alumnes",
                        msg: "Aferrau el llistat amb aquest format<br>"
                                + "<i><b>username</b></i> : <i><b>fullname</b></i> : <i><b>password</b></i> : <i>email</i> : <i>Recovery key</i>"
                    };
                }
            }
        });

        modalInstance.result.then(function (model) {
            $http.post("/rest/students/import", {text: model.text, schoolId: $scope.user.schoolId, updateIfExists: model.updateIfExists, idRole: USER_ROLES.student}).then(function (r) {  //idGroup: $scope.grpBean.id, 
                Modals.notificationdlg("Import result", r.data.msg);
                $scope.loadAllStudents();
                $scope.tableParams.reload();
            });
        });
    };
    
    $scope.sqlite = function(){
        $scope.downloadingSqlite = true;
        var req = {url: "/rest/misc/createsqlite",
                    data: {idSchool: $scope.user.schoolId},
                    method: 'POST',
                    responseType: 'arraybuffer'
                }; 
      $http(req).then(function(data){
          $scope.downloadingSqlite = false;
          var blob = new Blob([data], {type: "application/x-sqlite3"});
          saveAs(blob, "imaths-"+$scope.user.schoolId+"-"+Math.random().toString(32).slice(2)+".sqlite");
          growl.success("An sqlite representation of the database for your school has been generated. Enjoy it :-)");
      });  
    };
}]);

});