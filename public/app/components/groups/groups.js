/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
define(['filesaver'], function(){
"use strict";
window.pw.app.register.factory('GroupsSrv', ['$http', '$translate', 'Session', function($http, $translate, Session){
        var srvAPI = {};
        
        //Llista tots els grups creats per l'usuari idUser o alla on idUser estigui enrollat com a role=100
        srvAPI.list = function(idUser){
           var lang = $translate.use();  
           return $http.post('/rest/groups/list', {'idUser': idUser, 'lang': lang, includeEnrolled: true});
        };
        
        srvAPI.delete = function(idGroup){
            var lang = $translate.use();
            return $http.post('/rest/groups/delete', {'idGroup': idGroup, 'lang': lang});
        };
        
        srvAPI.create = function(grp){
           grp['lang'] = $translate.use();
           if(grp.idGroup)
           {
                //Notify other users in group that configuration has been changed!
                Session.getSocket().emit('group-update', grp);
                return $http.post('/rest/groups/update', grp);
           }
           else
           {
                return $http.post('/rest/groups/create', grp);
           } 
        };
        
        return srvAPI;
}]);


window.pw.app.register.filter('visibilityName', function(){
    return function(type){
        switch(type){
            case 0: return "Hidden";
            case 1: return "Collapsed";
            case 2: return "Auto";
            case 3: return "Expanded";
            default: return "Unknown";
                
        }
    };
});

window.pw.app.register.controller('GroupsController', ['$http', '$scope', 'GroupsSrv', '$state', '$filter', '$uibModal', '$translate', 'Session', 'PwTable', 'growl', 'USER_ROLES', 'Modals', 'Upload', 
    'AVAILABLE',
    function ($http, $scope, GroupsSrv, $state, $filter, $uibModal, $translate, Session, PwTable, growl, USER_ROLES, Modals, Upload, AVAILABLE) {

    
    $scope.currentYear = pw.currentYear;


    $scope.mask = true;
    $scope.groupSelection = null;
    $scope.user = Session.getUser();
    $scope.USER_ROLES = USER_ROLES;
    $scope.teacher = $scope.group && ($scope.group.eidRole === USER_ROLES.teacher || $scope.group.eidRole === USER_ROLES.teacheradmin) || $scope.user.idRole === USER_ROLES.teacheradmin;


     $scope.tableParams = new PwTable({
            count: 10,          
            counts: [10, 20, 30],
            sorting: ["-idGroup"]
        }, 
         function(defer, params) {
            GroupsSrv.list(Session.getUser().id).then(function(r){
                var data = r.data;               
                if(data.length)
                {
                    $scope.groupSelection = data[0];
                    $scope.loadUnits();
                }
                jQuery.each(data, function(i, e){
                   e.displaypassword = e.enrollPassword? "******": "" ;
                });
                defer.resolve(data);
            });
             
        }
     );
 
    
    $scope.loadUnits = function(){
            if($scope.groupSelection)
            {
                $http.post("/rest/unit/list",{idGroup: $scope.groupSelection.idGroup}).then(function(r){
                    $scope.units = r.data;
                });
            }
            else{
                $scope.units = [];
            }
    };
   

        //Update here translation stuff from table
//        $rootScope.$on('$translateChangeSuccess', function () {
//            colDefs[1].name = $translate.instant('GROUPS');
//            $scope.reloadGrid();
//        });

        $scope.selectGroup = function(g){
            if(g.gopts.isGhost){
                $scope.groupSelection = null;
                return;
            }
            $scope.groupSelection = g;
            $scope.loadUnits();
        };

        $scope.onClick = function (grp) {            
            Session.setGroup(grp);
            $state.go("home.students", {id:grp.idGroup} );
        };

         
        $scope.createGroupDlg = function() {
            //Default values
            var grp = {};
            grp['idGroup'] = 0;
            grp['groupLevel'] = '1';
            grp['groupStudies'] = 'BAT'; 
            grp['groupLetter'] = 'A';
            grp['enrollPassword'] = '';
            grp['idSubject'] = 1;
            grp.gopts = {lang: Session.getUser().language || 'ca', showtools: true, requirevideos: true, postcomments: true, postchats: true};
            $scope.openDlg(grp);
        };
        
        
        $scope.openDlg = function(grp0) {
            var modalInstance = $uibModal.open({
                templateUrl: 'app/components/groups/create-tpl.html',
                size: 'md',
                controller: ['$scope', function(scope){
                        var group = angular.copy(grp0);
                        console.log(grp0);
                        scope.title = group.idGroup? 'Edit group id='+group.idGroup: 'Create new group';
                        scope.group = group.groupLevel+' '+group.groupStudies;
                        scope.letter = group.groupLetter;
                        scope.year = group.groupYear+2000;
                        scope.letterCombo = "";
                        scope.enrollpwd = group.enrollPassword;
                        scope.gopts = group.gopts;

                        scope.groupsAvail = AVAILABLE.groups;
                        scope.langsAvail = AVAILABLE.langs;
                        scope.lettersAvail = AVAILABLE.letters;

                        $http.post("/rest/subjects/list").then(function(r){
                            var d = r.data;
                            scope.subjectsAvail = d;

                            d.forEach(function(e){
                                if(e.id===group.idSubject)
                                {
                                    scope.subject = e;
                                }
                            });

                        });

                        scope.ok = function () {
                            var split = scope.group.split(' ');
                            var grp = {'idGroup': group.idGroup, 'groupLevel': split[0], 'groupStudies': split[1], 
                                       'groupLetter': scope.letter,
                                       'enrollPassword': scope.enrollpwd, idSubject: scope.subject.id, 'gopts': scope.gopts};
                            modalInstance.close(grp);
                        };

                        scope.cancel = function () {
                            modalInstance.dismiss();
                        };
                }]

            });

            modalInstance.result.then(function (grp) {
                  $scope.createGroup(grp);
            }, function () {
                //window.pw.app.DEBUG && console.log('dismissed');
            });
        };
        
        
        $scope.createGroup = function(grp) {
            grp['idUser'] = Session.user.id;
            grp['idSchool'] = Session.user.schoolId;
            GroupsSrv.create(grp).then(
                    function (r) {
                        var data = r.data;
                        if(data.ok)
                        {
                           growl.success(data.msg);
                           $scope.reloadGrid();
                        }
                        else
                        {
                            growl.warning(data.msg);
                        }
                    }
                  );
            
        };
        

        $scope.reloadGrid = function () {
            $scope.tableParams.reload();
        };

        $scope.confirmDlg = function (group) {
            
            var okcb = function(confirm){
                $scope.selected = confirm;
                GroupsSrv.delete(group.idGroup).then(function(r){                    
                    growl.info(r.data.msg);
                    $scope.groupSelection = null;
                    $scope.reloadGrid();
                });
            };
            
            Modals.confirmdlgpwd('Confirm delete group ' + group.groupName, 'Segur que voleu eliminar aquest grup?', okcb);                         
        };
        
         $scope.confirmDlg2 = function (unit) {
             
            
            var okcb = function(){
                 $http.post("/rest/unit/delete", {id: unit.id}).then(function(){
                    $scope.loadUnits();
                 }); 
            };
             
            Modals.confirmdlgpwd('Confirm delete unit ' + unit.unit, 'Segur que voleu eliminar aquesta unitat?', okcb);                                       
        };


        $scope.createUnit = function(){
            $http.post("/rest/unit/save", {idGroup: $scope.groupSelection.idGroup, unit:'', order: $scope.units.length, visible: 2}).then(function(){
                $scope.loadUnits();
            });            
        };
        
        $scope.saveUnit = function(g){
            $http.post("/rest/unit/save", g).then(function(){
                delete g.back;
                g.edit = false;
                $scope.loadUnits();                          
            });                     
        };
        
        $scope.startEdit = function(g){
            g.back= {unit: g.unit, order: g.order}; 
            g.edit=true;
        };
        
        
        $scope.cancelEdit = function(g){
            g.order = g.back.order;
            g.unit = g.back.unit;
            delete g.back;
            g.edit = false;
        };
        
        //ON DESTROY - UPDATE THE NUMBER OF GROUPS
        $scope.$on('$destroy', function(){           
           var cgID = -1;
           if(Session.getCurrentGroup()){
                   cgID = Session.getCurrentGroup().idGroup;
           }
           Session.getUser().groups = $scope.tableParams.allData;
           var pointer = null;
           jQuery.each($scope.tableParams.allData, function(i, e){
              if(e.idGroup === cgID){
                  pointer = e;
                  return true;
              } 
           });
            if(pointer){
                Session.setCurrentGroup(pointer);
            } else if($scope.tableParams.allData.length){
                Session.setCurrentGroup($scope.tableParams.allData[0]);
            } 
        });


        $scope.exportGroup = function(g){
            $http.post("/rest/assignments/querycreated", {idGroup: g.idGroup}).then(function(r){
               var txt = JSON.stringify(r.data);
               var blob = new Blob([txt], {type: 'application/json'});
               saveAs(blob, "imaths-sheet-act" + "piworld-group-id-"+g.idGroup+ ".json");
               growl.success("Group units have been exported to file");
            });            
        };

        $scope.importGroup = function($file, g){
             if(!$file){
                 return;
             }
             
             var okcb = function(){
                 
             //send this file to server
             Upload.upload({
                    url: '/rest/assignments/importcreated',
                    fields: {idGroup: g.idGroup, idUser: Session.getUser().id, type: "application/json"},
                    file: $file
                }).then(
                  function(res){
                      if(res.data.ok){
                         growl.success("File data has been appended to the current group");
                         $scope.loadUnits();
                     } else {
                         growl.error("An error occurred while importing group data");
                     }
                     $scope.uploadPercent = "DONE!";
                     $scope.reload($scope.selectNode);
                     $scope.importing = false;
                  },
                  function(res){
                    $scope.importing = false;
                    $scope.uploadPercent = "ERROR!";
                    growl.error('Upload error. Status: ' + res.status);
                    $scope.selectNode = null;
                  },
                  function(evt){
                    var progressPercentage = parseInt(100.0 * evt.loaded / evt.total);
                    $scope.uploadPercent = progressPercentage + '% ';
                  }                        
                );
            };
            
             //Ask confirmation
             Modals.confirmdlg("Confirm import", "Voleu que la informació de les unitats en el fitxer siguin afegides al grup "+g.groupName+"?", okcb);
              
             
        };
        
        $scope.forcePassword = function(g){
            $http.post("/rest/auth/forcepassword", g).then(function(r){
                if(r.data.ok){
                    growl.success(r.data.msg);
                } else {
                    growl.error(r.data.msg);
                }
            });
        };
        
        $scope.onSort = function($item, $partFrom, $partTo, $indexFrom, $indexTo){
          if($scope.units.length<1){
              return;
          }
          var order = [];
          jQuery.each($scope.units, function(i, e){
              order.push({id: e.id, pos: i});              
          });
          
          $http.post("/rest/unit/reorder", {order: order}).then(function(){
                $scope.loadUnits();
          });
          
        };


        $scope.toggleVisibility = function(u, type){
            u.visible = type;
            $http.post('/rest/unit/save', u).then(function(r){
                        if(!r.data.ok){
                            growl.error("Failed to update unit");
                        }
            });
        };

        $scope.reloadGrid();
    }]);
 
 

});