define([], function(){
   
window.pw.app.register.service('ForumModals', [ '$uibModal', function($uibModal) {
	
        this.editForumDlg = function(title, msg, forumObj, okcb, cancelcb){
            
                var modalInstance = $uibModal.open({
                    templateUrl: 'app/shared/forum-dlg.html',
                    controller: ['$scope', 'USER_ROLES', function ($scope, USER_ROLES) {
                            $scope.USER_ROLES = USER_ROLES;
                            $scope.ok = function () {
                                modalInstance.close($scope.forum);
                            };
                            $scope.cancel = function () {
                                modalInstance.dismiss();
                            };
                            $scope.title = title;
                            $scope.msg = msg;
                            $scope.forum = forumObj;                            
                        }],
                    size: 'md'
                });

                modalInstance.result.then(function(value) {
                    okcb && okcb(value);
                }, function () {
                    cancelcb && cancelcb();
                });

                return modalInstance;
            };
            
            this.editThemeDlg = function(title, msg, forumObj, okcb, cancelcb){
            
                var modalInstance = $uibModal.open({
                    templateUrl: 'app/shared/forumtheme-dlg.html',
                    controller: ['$scope', 'USER_ROLES', function ($scope, USER_ROLES) {
                            $scope.USER_ROLES = USER_ROLES;
                            $scope.ok = function () {
                                modalInstance.close($scope.theme);
                            };
                            $scope.cancel = function () {
                                modalInstance.dismiss();
                            };
                            $scope.title = title;
                            $scope.msg = msg;
                            $scope.theme = forumObj;                            
                        }],
                    size: 'md'
                });

                modalInstance.result.then(function(value) {
                    okcb && okcb(value);
                }, function () {
                    cancelcb && cancelcb();
                });

                return modalInstance;
            };
}]);
      
window.pw.app.register.controller('ForumCtrl', ['$http', '$scope', '$filter', 
    '$transition$', '$uibModal', 'growl', '$translate', 'Session', 'PwTable', '$state',  'USER_ROLES', 'Modals', 'ForumModals', '$rootScope',
    function ($http, $scope, $filter, $transition$, $uibModal, growl, $translate,
                Session, PwTable, $state, USER_ROLES, Modals, ForumModals, $rootScope) {
         
         $scope.cForum = null;
         $scope.cTheme = null;
         $scope.user = Session.getUser();
         var grp = Session.getCurrentGroup();
         $scope.admin = $scope.user.idRole === USER_ROLES.admin || $scope.user.idRole === USER_ROLES.teacheradmin;
         $scope.teacher = $scope.user.idRole < USER_ROLES.student;
         $scope.tgs = {showAllForums: true};
         
         $scope.tinymceOpts= $rootScope.tinymceOpts($translate.use());
         
         //Load all forums
         
         $scope.forumsTable = new PwTable({
                page: 1, // show first page
                count: 10 // count per page
                },
                function ($defer, params) {
                    var obj ={schoolId: $scope.user.schoolId};
                    //console.log(grp);
                    if(!$scope.tgs.showAllForums){
                        if($scope.teacher){
                            obj.searchQuery = "f.idGroup='"+grp.id+"'";
                        } else {
                            obj.searchQuery = "f.idGroup='"+grp.idGroup+"'";   
                        }
                    }
                    $http.post('/rest/forums/list', obj).then(function (r) {                            
                        $defer.resolve(r.data);
                    });
                }
              );
         
         $scope.reloadForumList = function(){
             $scope.forumsTable.reload();
         };
         
        $scope.goForum = function(g){
           $scope.cForum = g;
           $scope.cForum.buttonEnabled = $scope.user.id===g.createdBy || $scope.user.idRole===USER_ROLES.admin || $scope.user.idRole === USER_ROLES.teacheradmin ||
                   g.canCreateThemes[$scope.user.idRole];
         
           $http.post('/rest/forums/visited', {id: g.id});
           
           //Load themes in this forum
           $scope.themesTable = new PwTable({
                page: 1, // show first page
                count: 10 // count per page
                }, 
                function ($defer, params) {
                    $http.post('/rest/forums/themes/list', {idForum: g.id}).then(function (r) {                               
                        $defer.resolve(r.data);
                    });
                }
            );            
        };
        
        
        var reloadEntries = function(){
            //Load entries for this theme
            $http.post('/rest/forums/entries/list', {idForumTheme: $scope.cTheme.id}).then(function (r) {                        
                  $scope.theme_entries = r.data;
            });  
        };
        
        $scope.goTheme = function(g){
            $scope.cTheme = g;
            $http.post('/rest/forums/themes/visited', {id: g.id});
            
            $scope.cTheme.buttonEnabled = $scope.user.id===g.createdBy || $scope.user.idRole===USER_ROLES.admin || $scope.user.idRole === USER_ROLES.teacheradmin ||
                   g.canCreateEntries[$scope.user.idRole];
            reloadEntries();
        };
        
        $scope.goBackForum = function(){
            $scope.cTheme = null;
            $scope.themesTable.reload();
        };
        
        $scope.goHome = function(){
            $scope.cForum = null;
            $scope.cTheme = null;            
            $scope.forumsTable.reload();
        };
        
        
        $scope.editForum = function(g){
            if(!g){ 
                var obj = {};
                obj[USER_ROLES.teacher] = true;
                obj[USER_ROLES.teacherNonEditing] = true;
                obj[USER_ROLES.student] = false;       
                g ={id: 0, forum: "", idGroup: grp.id, description: "", createdBy: $scope.user.id, canCreateThemes: obj};
            }
            
            var okcb = function(value){
                g = value;
                //Update value
                $http.post('/rest/forums/update', {id: g.id, forum: g.forum, idGroup: g.idGroup, description: g.description, createdBy: g.createdBy, canCreateThemes: g.canCreateThemes}).then(function () {                        
                  $scope.forumsTable.reload();
                });                
            };
            ForumModals.editForumDlg("","", angular.copy(g), okcb);
        };
          
        $scope.createEntry = function(parent){
             
            //Check if it can create entries
            //Check if agreement is signed
                    var okcb = function(){
                        var ato = 0;
                        if(parent){
                            ato = parent.id;
                        }
                        var g ={idForumTheme: $scope.cTheme.id, entry: "", createdBy: $scope.user.id, createdWhen: new Date(), fullname: $scope.user.fullname, uopts: $scope.user.uopts, answerTo: ato, nodes: []};
                        $http.post('/rest/forums/entries/update', g).then(function (r) {     
                            var data = r.data;
                            if(data.id){
                                g.id = data.id;
                                g.edit = true;
                                g.bck = g.entry;
                                if(parent){
                                    parent.nodes.push(g);
                                } else {
                                    $scope.theme_entries.push(g);
                                }                     
                            }                  
                        });
                    };
                    
                    var submitAgree = function(){
                        $scope.user.uopts.forumAgree = true;
                        okcb();
                        $http.post("/rest/students/updateuopts", $scope.user.uopts);
                    };
                    
                    if($scope.user.idRole>=USER_ROLES.student && !$scope.user.uopts.forumAgree){
                        Modals.confirmdlg("Condicions d'utilització del forum", "<h2>IMPORTANT</h2><p>El forum és una eina de comunicació i se n'ha de fer un ús responsable.</p>"+
                                "<p>Un ús <b>inadequat</b> o l'enviament de missatges <b>ofensius</b> pot dur les següents conseqüències segons la gravetat dels fets:<p>"+
                                "<ul>"+
                                "<li>L'eliminació dels missatges per part de l'administrador / professor</li>"+
                                "<li>La substracció de punts o qualificació del curs</li>"+
                                "<li>La impossibilitat d'enviar missatges</li>"+
                                "<li>Altres mesures disciplinàries a nivell de centre</li>"+
                                "</ul>"+
                                "<p>Si acceptau les condicions pitjau D'Acord. Si les rebutjau, pitjau Cancel·la</p>" , submitAgree);
                    } else {
                        okcb();
                    }
            
        };
        
        
        $scope.deleteForum = function(g){
            
            var accept = function(){
                $http.post('/rest/forums/delete', {id: g.id}).then(function () {                        
                  $scope.forumsTable.reload();
             });
            };
            
            Modals.confirmdlgpwd("Delete forum", "Segur que voleu eliminar el forum "+g.forum+"?", accept);
        };
        
        
        $scope.deleteTheme = function(g){
            
            var accept = function(){
                $http.post('/rest/forums/themes/delete', {id: g.id}).then(function () {                        
                  $scope.themesTable.reload();
             });
            };
            
            Modals.confirmdlgpwd("Delete forum", "Segur que voleu eliminar el forum "+g.forum+"?", accept);
        };
        
        $scope.editTheme = function(g){
            if(!g){ 
                var obj = {};
                obj[USER_ROLES.teacher] = true;
                obj[USER_ROLES.teacherNonEditing] = true;
                obj[USER_ROLES.student] = true;                
                g ={id: 0, idForum: $scope.cForum.id, theme: "", description: "", createdBy: $scope.user.id, canCreateEntries: obj};
            }
            
            var okcb = function(value){
                g = value;
                //Update value
                $http.post('/rest/forums/themes/update', {id: g.id, idForum: g.idForum, theme: g.theme, description: g.description, createdBy: g.createdBy, canCreateEntries: g.canCreateEntries}).then(function () {                        
                  $scope.themesTable.reload();
                });                
            };
            ForumModals.editThemeDlg("","", angular.copy(g), okcb);
        };
 
        $scope.editEntry = function(f){
            f.edit = true;
            f.bck = f.entry;
        }; 
 
        var recursiveLst = function(lst, f){
            jQuery.each(f.nodes, function(indx, e){
                   lst.push(e.id);
                   recursiveLst(lst, e);
            });
        };
 
        $scope.deleteEntry = function(f){
            var accept = function(){
                var lst = [f.id];
                //Now recursively add all ids for nodes in this item
                jQuery.each(f.nodes, function(indx, e){
                   lst.push(e.id);
                   recursiveLst(lst, e);
                });
                $http.post('/rest/forums/entries/delete', {ids: lst}).then(function () {                        
                  reloadEntries();
             });
            };
            
            Modals.confirmdlg("Delete entry", "Segur que voleu eliminar aquesta entrada del forum?", accept);
        }; 
        
        $scope.cancelEditEntry = function(f){
            f.edit = false;
            f.entry = f.bck;
            delete f.bck;
        };
        
        $scope.applyEditEntry = function(f){
             $http.post('/rest/forums/entries/update', f).then(function () {                        
                  f.edit = false;
                  delete f.bck;   
                });              
        };
        
        
        }]);

 
});