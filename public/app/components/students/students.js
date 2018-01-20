define([], function(){
   "use strict"; 
 
window.pw.app.register.controller('StudentsController', ['$http', '$scope', '$filter', 
    '$transition$', '$uibModal', 'growl', 'Modals', 'Session', 'PwTable', '$state', 'USER_ROLES', 'MyCacheService',
    function ($http, $scope, $filter, $transition$, $uibModal, growl, Modals,
                Session, PwTable, $state, USER_ROLES, MyCacheService) {
        
        var user = Session.getUser();
        $scope.user = user;
        $scope.USER_ROLES = USER_ROLES;
        $scope.teacheradmin = user.idRole===USER_ROLES.teacheradmin || user.idRole===USER_ROLES.admin;       
        $scope.grpBean = Session.getGroup(); 
        $scope.teacher = $scope.grpBean && ($scope.grpBean.eidRole === USER_ROLES.teacher || $scope.grpBean.eidRole === USER_ROLES.teacheradmin) || $scope.user.idRole === USER_ROLES.teacheradmin;

        $scope.grpID = $transition$.params().id;
        
        $scope.enrolled = [];
        $scope.studentsAvail = [];
        $scope.studentsFiltered = [];
        $scope.filter = {name: ""};
     
        var stdCache = MyCacheService.getCache('studentsCache');
        $scope.show = stdCache.get('show', {passwords: false, emails: false, main: true});
        
        $scope.onRowEnter = function(g){
            g.displaypassword = g.password;
            g.displaypasswordParents = g.passwordParents;
        };
        
         $scope.onRowLeave = function(g){
            if(g.password){
                g.displaypassword='******';
            } else {
                g.displaypassword='';
            }
            
            if(g.passwordParents){
                g.displaypasswordParents ='******';
            } else {
                g.displaypasswordParents ='';
            }
        };
        
        $scope.loadAllStudents = function(){
              
            //Carrega tots els alumnes del centre  
            $http.post("/rest/students/list", {filterQuery: "u.schoolId='"+Session.getUser().schoolId+"'"}).  //+"' AND u.idRole>="+USER_ROLES.student
                then(function(r){
                 
                var data = r.data;
                    
                $scope.studentsAvail = data;             
                var find = $scope.filter.name.replace(/  /g, '').trim();   
                if($scope.filter.name.trim())
                {   
                    var findArray = find.split(" "); 
                    $scope.studentsFiltered = data.filter(function(e){
                        var found = true;
                        jQuery.each(findArray, function(i, item){
                           found &= e.fullname.toLowerCase().indexOf(item.toLowerCase())>=0;
                        });
                        return found;
                    });                            
                     
                } else {
                     $scope.studentsFiltered = data;  
                }             
             });
             
             
              
            //Carrega tots els grups
                $http.post("/rest/groups/list",{idUser: Session.getUser().id, includeEnrolled: true}).then(function(r){
                    var data = r.data;
                    
                     var tmp = {};
                      
                    jQuery.each(data, function(i, a){
                         var obj = tmp[a.groupYear];
                        if(!obj){
                            obj = {year: a.groupYear, groups:[]};
                            tmp[a.groupYear] = obj;
                        }
                        obj.groups.push(a);
                    });
                    
                    $scope.years = Object.values(tmp).sort(function(a,b){return b.year-a.year;});
                     
                    if(!$scope.grpID && data.length>0){
                        $scope.grpID = data[0].idGroup;
                        if(stdCache.get('grpBean')){
                            $scope.grpBean = stdCache.get('grpBean');
                        } else{
                             if(data.length){
                                $scope.grpBean = data[0]; 
                                stdCache.put('grpBean',  data[0]);                                
                             }
                             else{                                  
                                 stdCache.put('grpBean', $scope.grpBean);                                                                 
                                 if($scope.grpBean)
                                 {
                                     $scope.grpID = $scope.grpBean.idGroup;
                                 }
                            }
                        }
                        $scope.tableParams.reload();
                        
                    }
                });
             
        };
       
        $scope.loadAllStudents();
        
        
        $scope.tableParams = new PwTable({
                count: 10, // count per page
                sorting: ["+fullname"]
                }, 
                function ($defer, params) {
                    if(!$scope.grpID){
                         $defer.resolve([]);
                         return;
                    }
                    $http.post('/rest/students/list',{idGroup: $scope.grpID, edit:1}).then(function (r) {
                        var data = r.data;
                        data.forEach(function(g){
                            g.displaypassword = g.password? "******" : "";
                            g.displaypasswordParents = g.passwordParents? "******" : "";                            
                        });
                        $scope.enrolled = data; 
                        $scope.enrolledOrig = angular.copy(data); //This list is changed by picklist while data keeps                        
                        $defer.resolve(data);
                    });
                }
            );

            //This is the massive enroll
            $scope.enroll= function()
            {
                var toEnroll = [];
                var toUnroll = [];
                
                $scope.enrolledOrig.forEach(function(e){
                    //Check if it is already enrolled
                    var contains = false;
                    for(var i in $scope.enrolled)
                    {
                        var o = $scope.enrolled[i];
                        if(e.id === o.id)
                        {
                            contains = true;
                            break;
                        }
                    }
                    if(!contains && $scope.user.id!==e.id)     //Never unenroll creator
                    {
                        toUnroll.push(e.id);
                    }
                });
                
                $scope.enrolled.forEach(function(e){
                    //Check if it is already enrolled
                    var contains = false;
                    for(var i in $scope.enrolledOrig)
                    {
                        var o = $scope.enrolledOrig[i];
                        if(e.id === o.id)
                        {
                            contains = true;
                            break;
                        }
                    }
                    if(!contains)      
                    {
                        toEnroll.push(e.id);
                    }
                });
                 
               
                $http.post("/rest/students/massiveenroll", {add: toEnroll, remove: toUnroll, idGroup: $scope.grpID}).then(
                        function(){
                            $scope.tableParams.reload();
                            $scope.show.main = true;
                        });
            };

            $scope.gestionaGrups = function(){
                $state.go("home.groups");
            };

            $scope.gotoGrup = function(g){
                 $scope.grpID = g.idGroup;
                 $scope.grpBean = g;
                 stdCache.put('grpBean', g);
                 Session.setGroup(g);
                 $scope.tableParams.reload();
                 $scope.statistics = {};
            };
            
            $scope.onClick = function(student)
            {
                $state.go("home.progress",{id:$scope.grpID, idUser:student.id});
            };
            
            $scope.confirmDeleteDlg = function (student) {
                $scope.selected = student;
                
                var okcb = function(){
                        $http.post("/rest/groups/unenroll", {idUser: $scope.selected.id, idGroup: $scope.grpBean.idGroup}).then(function(){                                               
                            $scope.tableParams.reload();                
                        });
                };
                
                Modals.confirmdlgpwd('Confirm unenroll user ' + student.fullname, 'Segur que voleu desmatricular aquest alumne/a?', okcb);                                
        };


         $scope.editDlg = function (student) {
                $scope.selected = student;

                var modalInstance = $uibModal.open({
                templateUrl: 'app/components/students/edit-dlg.html',
                controller: ['$scope', function(scope){
                            scope.title = 'Edit student ' + student.fullname;
                            scope.msg = '';
                            scope.model = student;
                            scope.availableRoles = [];  

                            $.each(Object.keys(USER_ROLES), function(i, key){
                                // El role de grup que pot donar un usuari mai podra superior a ell i
                                // tampoc al role base que te per defecte
                                var cRole = USER_ROLES[key];

                                if ( (cRole === USER_ROLES.admin &&  user.idRole > USER_ROLES.admin ) ||
                                     (cRole === USER_ROLES.teacheradmin &&  
                                     (user.idRole !== USER_ROLES.admin || user.idRole !== USER_ROLES.teacheradmin) || 
                                     student.eidRole > cRole
                                     )
                                 ){
                                    // Forbidden
                                     scope.availableRoles.push({name: key, id: cRole, disabled: true});
                                } else {
                                    scope.availableRoles.push({name: key, id: cRole, disabled: false});
                                }
                            });

                            scope.role = scope.availableRoles.filter(function(x){
                                return x.id === student.eidRole;
                            })[0] || scope.availableRoles[2];
 
                            scope.ok = function () { 
                                scope.model.eidRole = scope.role.id;   
                                modalInstance.close(scope.model);                                
                            };

                            scope.cancel = function () {
                                modalInstance.dismiss('cancel');
                            };
                            scope.mustChangePassword = function(){
                               $http.post("/rest/auth/forcepassword", {idUser: student.id}).then(function(r){
                                        if(r.data.ok){
                                            growl.success(r.data.msg);
                                        } else {
                                            growl.error(r.data.msg);
                                        }
                                    });  
                            };
                }],
                size: 's'                 
                
            });

            modalInstance.result.then(function(d) {

                $http.post("/rest/students/update", d).then(function(r){           
                    var data = r.data;
                    if(!data.ok)
                    {
                        growl.warning(data.msg);
                    }
                    $scope.tableParams.reload();
                });
            });
        };

 
        
        $scope.onEditRole = function(g){
            g.edit = true;
            g.bck = g.eidRole;
            
        };
        
        $scope.onEditRoleCancel = function(g){
            g.edit = false;
            g.eidRole = g.bck;
            delete g.bck;
        };
        
        $scope.onEditRoleAccept = function(g){
            g.edit = false;
            //Update DB enroll properties for this user/group
            $http.post("/rest/groups/doenroll", {idUser: g.id, idGroup: $scope.grpBean.idGroup, idRole: g.eidRole, id: g.idEnroll});
            delete g.bck;
        };


        $scope.tableParams.reload();

        }]);
    

});