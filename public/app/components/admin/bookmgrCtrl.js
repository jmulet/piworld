 window.pw.app.register.controller('BookMgrCtrl', [ '$scope', '$http', 'USER_ROLES', 'Session', 'growl', 'PwTable', '$timeout', 'Modals', '$uibModal',
     function($scope, $http, USER_ROLES, Session, growl, PwTable, $timeout, Modals, $uibModal) {

     var user = Session.getUser();
     $scope.bools = {};
     var currentbook_bck;

     function initialize(){

            $http.post("/rest/auth/bookmgr", {method: "books/list"}).then(function(r){
               $scope.books = r.data; 
            });

            $http.post("/rest/groups/listcenter", {idUser: user.idUser, schoolId: user.schoolId}).then(function(r){
               $scope.groups = r.data;
              
            }); 
     }

     initialize();


  
        $scope.tableParams = new PwTable({
                count: 10, // count per page
                sorting: ["+fullname"]
                }, 
                function ($defer, params) {
                    $http.post('/rest/students/list',{filterQuery: "u.schoolId='"+user.schoolId+"'"}).then(function (r) {
                          $defer.resolve(r.data);
                    });
                }
            );


     $scope.manageBook = function(b){
         $scope.currentbook = b;
         
         $http.post("/rest/auth/bookmgr", {method: "books_user/list", idbook: b.id}).then(function(r){
             
             //Apply to groups list
             jQuery.each($scope.groups, function(i, g){
                      g.selected = false;
                      g.expires = null;
                     jQuery.each(r.data, function(j, d){
                            if(d.idGroup===g.idGroup){
                                g.selected = true;
                                g.expires = d.expires;
                                return true;
                            }
                     });
             });
             
             
             //Apply to students list 
              jQuery.each($scope.tableParams.allData, function(i, g){
                     g.selected = false;
                     g.expires = null;
                     jQuery.each(r.data, function(j, d){
                            if(d.idUser===g.idUser){
                                g.selected = true;
                                g.expires = d.expires;
                                return true;
                            }
                     });
             });
             
             
         });

     };
     
     $scope.onStudentChange = function(s){
        jQuery.each($scope.tableParams.allData, function(i, e){
             if(s.id===e.id){
               e.selected = s.selected;
               return true;
             }
         });
         
     };
     
     $scope.editIt = function(){
         currentbook_bck = angular.copy($scope.currentbook);
         $scope.currentbook.edit = true;
     };
     
     $scope.cancelIt = function(){
         $timeout(function(){$scope.manageBook(currentbook_bck)});
     };
     
     $scope.saveIt = function(){
         if(!$scope.currentbook){
             return;
         }
         var idbook = $scope.currentbook.id;
         
         $scope.currentbook.edit=false;
         
         $http.post("/rest/auth/bookmgr", {method: "books/update", book: $scope.currentbook}).then(function(r){
               if(!r.data.ok){
                   growl.error("An error occurred while updating the book entry");
               }
         });
         
         var list = [];
         jQuery.each($scope.groups, function(i, g){
               if(g.selected){
                   list.push({idbook: idbook, idGroup: g.idGroup, expires: g.expires});
               }
         });
         
         //Do the same for all selected users
         jQuery.each($scope.tableParams.allData, function(i, g){
               if(g.selected){
                   list.push({idbook: idbook, idUser: g.id, expires: g.expires});
               }
         });
         
         $http.post("/rest/auth/bookmgr", {method: "books_user/update", idbook: idbook, list: list}).then(function(r){
               if(!r.data.ok){
                   growl.error("An error occurred while updating the book entry");
               }
         });

     };
}]
);

