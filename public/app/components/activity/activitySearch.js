
    
(function(app, angular){
 
    "use strict";
    app.factory('ActivitySearchSrv', ['$http', '$q', 'Session', 'USER_ROLES', 'MyCacheService', function($http, $q, Session, USER_ROLES, MyCacheService){
            var service = {};
            var ActivitySearchCache = MyCacheService.getCache("ActivitySearch");
           
                                  
            service.list = function(searchOpts, forceUpdate)
            {                
                return ActivitySearchCache.httpCache('searchActivities', 'activity/searchActivities', searchOpts, forceUpdate);                
            };
            
            service.switchShare = function(a)
            {
                //Switch share from 0 -> 1 -> 2 ->  0 -> ...
                if(a.share<2){
                    a.share +=1;
                }
                else
                {
                    a.share = 0;
                }
                return $http.post("rest/activity/updateshare", {id: a.id, share: a.share});
            };
                        
            return service;
    }]);
   
    app.controller('ActivitySearchController', ['$scope', '$rootScope', '$http', '$state', '$filter', 'Session','ActivitySearchSrv', 'MyCacheService',
        'USER_ROLES', '$translate', 'growl', 'Modals', 'AVAILABLE',
        function($scope, $rootScope, $http, $state, $filter, Session, ActivitySearchSrv, MyCacheService, USER_ROLES, $translate, growl, Modals, AVAILABLE){
     
            //Use cache to hold state
            var ActivitySearchCache = MyCacheService.getCache('ActivitySearch');
            
            jQuery('#text').focus();
            
            var forceUpdate = false;
            
            $scope.groupsAvail = AVAILABLE.groupsStar; 
            $scope.user = Session.getUser();
            var isGuest = $scope.user.idRole === USER_ROLES.guest;
            $scope.student = $scope.user.idRole>=USER_ROLES.student && $scope.user.idRole < USER_ROLES.guest;
            $scope.teacher = $scope.user.idRole < USER_ROLES.student;
            $scope.USER_ROLES = USER_ROLES;
            $scope.searchResult = [];
                 
            
            
            $scope.search = ActivitySearchCache.get('search',
                    {
                        course: '*',
                        category: '',
                        title: '',
                        description: '',
                        author: '',
                        text: '',
                        hasVideo: false,
                        hasGGB: false,
                        hasAct: false,
                        hasSim: false,
                        simple: true,
                        username: $scope.user.username,
                        slevel: ($scope.user.idRole === USER_ROLES.guest ? 2 : 1)
                    });
             
            
            $scope.selected = ActivitySearchSrv.selected;
            
            $rootScope.$on("changeLang", function(event, d){
                 $scope.doSearch();
            });
            
             
            $rootScope.$on("changeGrp", function(event, d){
                var group = d.group;
                if(group){
                    $scope.search.course = group.groupLevel? (group.groupLevel + " " + group.groupStudies) : "*";                  
                    $scope.doSearch();
                }
            });
            
            $scope.table = {totalItems: 0, itemsPerPage: 10, currentPage: 1, maxSize: 5, offset: 0, data: [], chunck: [], initialized: false, isLoading: false};
            $scope.table.numPages = Math.floor($scope.table.totalItems / $scope.table.itemsPerPage) + 1;
            $scope.table.pageChanged = function(){
                //check if this page data is loaded, if not, load data up to this page
                if($scope.table.data.length < $scope.table.currentPage*$scope.table.itemsPerPage){
                    loadingFun();
                } else {
                    //Returns a chunck of data corresponding to this page
                    $scope.table.chunck = $scope.table.data.slice(($scope.table.currentPage-1)*$scope.table.itemsPerPage, ($scope.table.currentPage)*$scope.table.itemsPerPage);
                }
            };
        
            var loadingFun = function(){
                var limit = $scope.table.currentPage*$scope.table.itemsPerPage - $scope.table.offset;
                var selectedGroup = Session.getCurrentGroup();                    
                $scope.search.idSubject = selectedGroup? selectedGroup.idSubject : 1;
                $scope.search.lang = $translate.use();
                $scope.search.offset = $scope.table.offset;
                $scope.search.limit = limit;
                $scope.table.isLoading = true; 
                   
                $http.post("/rest/activity/searchActivities", $scope.search).then(function(r){
                    var data = r.data.results;
                    if(!$scope.table.initialized){
                        $scope.table.totalItems = r.data.totalItems;
                        $scope.table.numPages = Math.floor($scope.table.totalItems / $scope.table.itemsPerPage) + 1;
                    }
                    $scope.table.initialized = true;
                    
                    jQuery.each(data, function(i, e){
                          $scope.table.data.push(e);
                    });
                    //Try to find selection object
                    if ($scope.selected) {
                        var pointer = null;
                        jQuery.each(data, function (indx, e) {
                            e.$selected = false;
                            if (e.id === $scope.selected.id) {
                                pointer = e;
                            }
                        });
                        if (pointer) {
                            pointer.$selected = true;
                        }
                    }
                    else {
                        if (data.length)
                        {
                            $scope.selected = data[0];
                            $scope.selected.$selected = true;
                            ActivitySearchSrv.selected = data[0];
                        } else {
                            $scope.selected = null;
                            ActivitySearchSrv.selected = null;
                        }
                    }

                    $scope.table.isLoading = false;
                    
                    $scope.table.offset = $scope.table.data.length; //$scope.table.currentPage*$scope.table.itemsPerPage;
                    //Returns a chunck of data corresponding to this page
                    var a = ($scope.table.currentPage-1)*$scope.table.itemsPerPage;
                    var b =  ($scope.table.currentPage)*$scope.table.itemsPerPage;
                    $scope.table.chunck = $scope.table.data.slice(a, b);                 
                });
            };
            
            
  
            $scope.changeSelection = function(g){
                jQuery.each($scope.table.chunck, function(i, e){e.$selected = false;});
                g.$selected = true;
                $scope.selected = g;
                ActivitySearchSrv.selected = g;
            };

            //create a new activity mo
            $scope.create = function(mode)
            {
                //Create a new activity
                $state.go("home.editactivity"+mode, {idActivity: 0});
            };
            
            $scope.open = function(a){ 
                if(!$scope.selected || $scope.selected.id!==a.id){
                    return;
                }
                
                Session.setRelatedActivity([]);
                
                if($scope.user.idRole===USER_ROLES.guest){
                    $scope.$parent.toggleMain(true);
                } 
                
                $state.go("home.activity", {idActivity: parseInt(a.id), idAssignment: 0});
            };
                        
            $scope.assign = function(a){
                $state.go("home.assignments.assign", {idActivity: parseInt(a.id), idGroup: Session.getCurrentGroup().idGroup, idAssignment: 0});
            };
            
            $scope.clone = function(a){
                
                $http.post("/rest/activity/clone", {activity: a, username: Session.getUser().username}).then(function(r){
                    if(r.data.ok){
                        growl.success("Cloned activity "+a.id+" with new id="+r.data.idActivity);
                    }
                    $scope.doSearch();
                });
                
            };
            
            $scope.edit = function(a){
                var mode = a.activityType || "A";
                if(mode!=="A" && mode!=="Q" && mode!=="V" && mode!=="U"){
                    mode = "A";
                }
                $state.go("home.editactivity"+mode, {idActivity: parseInt(a.id)});
            };
            
            $scope.ide = function(a){
                $state.go("home.ide", {idActivity: parseInt(a.id)});
            };
            
            $scope.onChangeCourse = function(){
                $scope.doSearch();  
            };
            
            $scope.doSearch = function(){
                  $scope.table.totalItems = 10;
                  $scope.table.currentPage= 1;
                  $scope.table.offset= 0;
                  $scope.table.data= [];
                  $scope.table.chunck= [];
                  $scope.table.initialized= false;
                  $scope.table.numPages = Math.floor($scope.table.totalItems / $scope.table.itemsPerPage) + 1;
                  $scope.table.pageChanged();
            };
            
            $scope.doSearch();        
             
            if($scope.student)
            {
                var selectedGroup = Session.getCurrentGroup();
                $scope.search.course = selectedGroup.groupLevel + " " + selectedGroup.groupStudies;                
            }
           
            
            $scope.switchShare = function(a){
                
                ActivitySearchSrv.switchShare(a);
            };
            
           $scope.packAct = function(g){
                $http.post("/rest/activity/pack", {id: g.id}).then(function(r) {                    
                    var blob;
                    if(r.headers('content-type').indexOf("json")>=0){
                        blob = new Blob([JSON.stringify(r.data)], { type: r.headers('content-type') });
                    } else {     
                        blob = new Blob([r.data], { type: r.headers('content-type') });
                    }
                    var fileName = r.headers('content-disposition').replace(/"/g, '').replace(/ /g,'');
                    fileName = fileName.substring(fileName.indexOf("filename=")+9);
                    saveAs(blob, fileName);
                }, function () {
                    growl.error('Unable to pack file');
                });
    
           };
            
           $scope.remove = function(g){
               
            var okcb = function(){
                $http.post("/rest/activity/delete", {id: g.id}).then(function(){
                    growl.success("S'ha eliminat l'activitat.");
                    $scope.doSearch();
                 });
            };
            
            Modals.confirmdlgpwd('Confirm delete activity ' + g.id, 'Segur que voleu eliminar aquesta activitat?', okcb);             
        };
            
       
        
    }]);


}(window.pw.app.register, angular));

