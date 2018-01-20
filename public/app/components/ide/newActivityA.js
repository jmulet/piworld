
define([], function(){
  "use strict";
    window.pw.app.register.controller('newActivityACtrl', ['$scope', '$rootScope', '$http', '$state', '$transition$', 'Session', 'growl',  'Upload', 'AVAILABLE', '$translate', '$sce',
        function($scope, $rootScope, $http, $state, $transition$, Session, growl, Upload, AVAILABLE, $translate, $sce){
        
        var user = Session.getUser();
        $scope.langs = AVAILABLE.langs;
        $scope.uploadPercent = ""; 
        $scope.upload = function (file) {
            if(file===null){
                return;
            }
           
            Upload.upload({
                url: '/rest/activity/importzip',
                fields: {username: user.username},
                file: file
            }).then(
              function(res){
                 $scope.uploadPercent = "";
                 if(res.data.a.id===0)
                 {
                    $scope.a = res.data.a;
                    $scope.a.tmpDirNode = res.data.tmpDirNode;
                 }
                 else
                 {
                     growl.warning("The imported zip file appears to be invalid.");
                 }
              },
              function(res){
                   $scope.uploadPercent = "";
                   console.log('error status: ' + res.status);
              },
              function(evt){
                var progressPercentage = parseInt(100.0 * evt.loaded / evt.total);
                //console.log('progress: ' + progressPercentage + '% ' + evt.config.file.name);
                $scope.uploadPercent = progressPercentage + '% ';
              }
                    
            );
                                        
         };


        $scope.groupsAvail = AVAILABLE.groupsStar; 
        $scope.categoriesAvail = AVAILABLE.categories;
        $scope.activityTypes = AVAILABLE.activityTypes; 
        $scope.tinymceOpts = $rootScope.tinymceOpts($translate.use());
          
            
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
            icon: null,
            hasAct: 0,
            createjs: 0,
            type: 'A',
            author: user.username,
            share: 2,
            id: 0
        };
        
        var id = $transition$.params().idActivity || 0;
        $scope.id = id;
        
        if(id>0)
        {
            $scope.title = "Edit activity "+id+": ADVANCED EDITION";
            $scope.a.id = id;
            $http.post("/rest/activity/load",{id:id}).then(function(r){
                var data = r.data;
                window.pw.app.DEBUG && console.log(data);
                $scope.a = data;
                $scope.a.id = id;                   
            });
        }
        else
        {
            $scope.title = "New activity: ADVANCED EDITION";      
        }
        
       
            
        $scope.$on("changeGrp", function(evt, args){
            $scope.reloadCategories();
        });
        
        $scope.cancel = function()
        {
            $state.go($rootScope.previousState || 'home.activitysearch');
        };

        $scope.$on('$destroy', function(){
            if($scope.a.tmpDirNode){
                $http.post('/rest/fs/delete', {node: $scope.a.tmpDirNode});
            } 
        });

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
                        $state.go('home.ide', {idActivity:data.idActivity});
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
                        $state.go($rootScope.previousState || "home.activitysearch");
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
        
        //Loads serverData 
        if(id>0){
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
        
        $scope.goIDE = function(){
            $state.go("home.ide", {idActivity: id});
        };
        
        
        $scope.reloadCategories();
        
    }]);

});

 