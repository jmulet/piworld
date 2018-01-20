
define([], function(){
  "use strict";
    window.pw.app.register.controller('newActivityUCtrl', ['$scope', '$rootScope', '$http', '$state', '$transition$', 'Session', 'growl',  'Upload', 'AVAILABLE', '$translate', '$sce', 
        function($scope, $rootScope, $http, $state, $transition$, Session, growl, Upload, AVAILABLE, $translate, $sce){
        
        var user = Session.getUser();
        $scope.langs = AVAILABLE.langs;  
        $scope.groupsAvail = AVAILABLE.groupsStar;         
        $scope.categoriesAvail = AVAILABLE.categories;        
        $scope.activityTypes = AVAILABLE.activityTypes; 
             
        $scope.tinymceOpts = $rootScope.tinymceOpts($translate.use());
       
        var id = $transition$.params().idActivity || 0;
        $scope.id = id;
        
        if(id>0)
        {
            $scope.title = "Edit activity "+id+": ";
            
            $http.post("/rest/activity/load",{id:id}).then(function(r){
                var data = r.data; 
                window.pw.app.DEBUG && console.log(data);
                $scope.a = data;
                $scope.a.id = id;                
                $scope.title += "UPLOAD TYPE";
                if($scope.a.type!=='U'){
                    //try to find an appropiate editor for this activity
                    $state.go("home.editActivityA", {idActivity: id});
                }
              
            });
        }
        else
        {
            var title = {};
            var description = {};
            jQuery.each($scope.langs, function(i, key){
                title[key] = '';
                description[key] = '';
            });     

            $scope.a = {
                 title: title,
                 description: description,
                 categories: [],
                 levels: [],
                 ytid: null,
                 ytqu: 0,
                 ggbid: null,
                 icon: 'assets/img/upload.png',
                 hasAct: 0,
                 createjs: 0,
                 type: 'U',
                 author: user.username,
                 share: 0,          //By default upload activities are not sharable
                 theory: '',
                 id: 0
             };
        
            $scope.title = "New activity: UPLOAD TYPE";            
        }
    
        /**
         * Aquest és l'únic metode per crear l'activitat o per fer-ne l'update segons la a.id
         * @returns {undefined}
         */
        $scope.accept = function()
        { 
            if($scope.a.title.ca.trim()==='' || $scope.a.title.en.trim()==='' || $scope.a.title.es.trim()===''){
                    growl.warning("Must provide a title for this activity in every language");
                    return;
            }
           
            $scope.a.idSubject = $scope.$parent.selectedGroup? $scope.$parent.selectedGroup.idSubject : 1;
            $scope.block = true; 
            
             //Remove CDATA in theory
            $scope.a.theory = ($scope.a.theory || "").replace(/\/\/ <!\[CDATA\[/gi,"").replace(/\/\/ \]\]>/gi,""); 
            
            if($scope.a.id<=0)
            {
                $http.post("/rest/activity/create", $scope.a).then(function(r){
                    var data = r.data; 
                    if(data.ok)
                    {
                        growl.success("L'activitat s'ha desat :-)");
                        $scope.a.id = data.idActivity;
                        $state.go("home.activity", {idActivity:data.idActivity, idAssignment: 0});                        
                    }
                    else
                    {
                        growl.warning("No s'ha pogut crear l'activitat :-(");
                    }
                });
            }
            else
            {           
                
                   //Update provider with new data     
                  if($scope.a.qprovider)
                  {
                        for(var i=0; i<AVAILABLE.langs.length; i++){
                            var lang = AVAILABLE.langs[i];
                            $scope.a.qprovider.activity.title[lang] = $scope.a.title[lang];
                            $scope.a.qprovider.activity.description[lang] = $scope.a.description[lang];
                        }
                        $scope.a.qprovider.activity.categories = $scope.a.categories.join(",");
                        $scope.a.qprovider.activity.levels = $scope.a.levels.join(",");
                   }  
                  //Simply update and go back
                  $http.post("/rest/activity/update", $scope.a).then(function(r){
                    var data = r.data; 
                    if(data.ok)
                    {                        
                        growl.success("L'activitat s'ha desat :-)");
                        $state.go("home.activity", {idActivity: $scope.a.id, idAssignment: 0});
                    }
                    else
                    {
                        growl.warning("No s'ha pogut actualitzar l'activitat :-(");
                    }
                });
            }
        };
        
        $scope.onTitleBlur = function(lang){            
            
            var list = [];
            jQuery.each(AVAILABLE.langs, function(i, e){
                if(e!==lang && !$scope.a.title[e] && $scope.a.title[lang]){
                    list.push(e);
                }
            });
            
            if(list.length){
                $http.post('/rest/activity/translate', {text: $scope.a.title[lang], source: lang, target: list}).then(function(r){
                     var d = r.data; 
                     jQuery.each(Object.keys(d), function(i, k){
                            $scope.a.title[k] = d[k];
                     });
                });
            }
        };
              
        $scope.onDescBlur = function(lang){
           
            var list = [];
            jQuery.each(AVAILABLE.langs, function(i, e){
                if(e!==lang && !$scope.a.description[e] && $scope.a.description[lang]){
                    list.push(e);
                }
            });
            
            if(list.length){
                $http.post('/rest/activity/translate', {text: $scope.a.description[lang], source: lang, target: list}).then(function(r){
                    var d = r.data;  
                    jQuery.each(Object.keys(d), function(i, k){
                            $scope.a.description[k] = d[k];
                     });
                });
            }
            
        };
        
        $scope.reloadCategories = function(){
            var idx = $scope.$parent.selectedGroup? $scope.$parent.selectedGroup.idSubject : 1;
            $scope.categories = $scope.categoriesAvail[idx];
        };
        
        //In editing mode
        if(id>0){
            //Load theory
            $http.post('/rest/fs/get', {path: id+"/theory.html"}).then(function(r){
                 var d = r.data;
                $scope.a.theory = d.src || "";
            });

            //Loads qprovider.json
            $http.post('/rest/fs/get', {path: id+"/qprovider.json", server: true}).then(function(r){
                    var d = r.data;
                    try{
                        d = JSON.parse(d.src || {});
                        $scope.a.qprovider = d;
                    } catch(ex){
                        //
                    }
            });
        }
        
        $scope.reloadCategories();

                           
        $scope.$on("changeGrp", function(evt, args){
            $scope.reloadCategories();
        });
        
        $scope.cancel = function()
        {
            $state.go($rootScope.previousState || "home.search");
        };

        $scope.goIDE = function(){
            $state.go("home.ide", {idActivity: id});
        };
        
            
        $scope.$on('$destroy', function(){
            if($scope.a.tmpDirNode){
                $http.post('/rest/fs/delete', {node: $scope.a.tmpDirNode});
            } 
        });



    }]);


});
