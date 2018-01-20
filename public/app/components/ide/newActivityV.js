
define([], function(){
  "use strict";
    window.pw.app.register.controller('newActivityVCtrl', ['$scope', '$rootScope', '$http', '$state', '$transition$', 'Session', 'growl',  'Upload', 'AVAILABLE', '$translate', '$filter', 
        function($scope, $rootScope, $http, $state, $transition$, Session, growl, Upload, AVAILABLE, $translate, $filter){
        
        var playerInPage;
        var user = Session.getUser();
        var globalIndex = 0;
        $scope.langs = AVAILABLE.langs;
        $scope.yt = {search: "", list: [], notelist: [], username: 'piworld', ytid: "", tech: "YT", url: ""};
        $scope.playerVars = {preview: true};
         
        $scope.$on('youtube.player.ready', function ($event, player) {     
             playerInPage = player;
        });
        
        function parseIdFromYT(url){
             var tmp = url.trim();
                if($scope.yt.ytid.indexOf("http")>=0){
                    var i = $scope.yt.ytid.lastIndexOf("/");
                    var tmp = $scope.yt.ytid.substring(i+1).trim();
                    if(tmp.indexOf("playlist")>=0){
                        i = $scope.yt.ytid.indexOf("?");
                        tmp = tmp.substring(0, i);
                    }
                }
            return tmp;
        };
        
        $scope.loadPreview = function(){
            
             
            if($scope.a.tech==="YT"){
            
                var tmp = parseIdFromYT($scope.yt.ytid);
                $scope.a.ytid = tmp;
                $scope.yt.url = "https://youtu.be/"+tmp;
                 
                if($scope.a.id<=0){
                    $scope.yt.loading = true;
          
                    $http.post('/rest/gapis/ytvideo', {id: tmp}).then(function(r){
                        var d = r.data;
                        $scope.yt.loading = false;
                        if(d.publishedAt) {
                            var l = 'ca';
                            if(!$scope.a.title[l]){
                                $scope.a.title[l] = d.title;
                                $scope.onTitleBlur(l); 
                            }
                            if(!$scope.a.description[l]){
                                $scope.a.description[l] = d.description;
                                $scope.onDescBlur(l);
                            }

                        } else {
                            growl.warning("Can't find Youtube "+tmp);
                        }                   
                    });
                } 
                
            } else if($scope.a.tech==="VM"){
                var tmp = $scope.yt.ytid.trim();
                if($scope.yt.ytid.indexOf("http")>=0){
                    var i = $scope.yt.ytid.lastIndexOf("/");
                    var tmp = $scope.yt.ytid.substring(i+1).trim();                
                }
                
                
                $http.get('http://vimeo.com/api/v2/video/'+tmp+'.json').then(function(d){
                    
                    
                if(d[0]) {                        
                        var l = 'ca';
                        if(!$scope.a.title[l]){
                            $scope.a.title[l] = d[0].title;
                            $scope.onTitleBlur(l); 
                        }       
                        if(!$scope.a.description[l]){
                            $scope.a.description[l] = d[0].description;
                            $scope.onDescBlur(l);
                        }
                        
                $scope.yt.poster = d[0].thumbnail_large  || d[0].thumbnail_medium;       
                        
               //Get information of direct mp4 links for vimeo
                $http.post("/rest/video/vimeoconfig", {vimeoId: tmp}).then(function(r){
                    var d = r.data;
                    var links = d.request.files.progressive;
                    if(links){
                        //Search quality 720p
                        var url;
                        jQuery.each(links, function(i, e){
                            if(e.quality==="720p"){
                                url = e.url;
                                return true;
                            }
                        });
                        if(!url){
                            url = links[0];
                        }
                        if(url){
                            //Switch to file type
                            $scope.yt.tech = "FI"; 
                            $scope.a.tech = "FI"; 
                            $scope.yt.url = url;                            
                            $scope.yt.ytid = url;
                            $scope.a.ytid = url;
                        } else {
                             $scope.yt.url = "http://vimeo.com/"+tmp;
                        }
                        $scope.a.ytid = tmp;
                        
                        $scope.yt.loading = false;
                    }
                });
                
                        
                    } else {
                        $scope.yt.ytid = "";
                        growl.warning("Can't find Vimeo "+tmp);
                    }
                   
                }).error(function(err){
                    $scope.yt.loading = false;
                    console.log(err);
                });
                
             
            } else if($scope.a.tech==="FI"){
                 $scope.yt.loading = false;
                 $scope.yt.url = $scope.yt.ytid.trim();
                 $scope.a.ytid = $scope.yt.url;
            }
        
        };    
            
        $scope.addQuestionMultipleQuizz = function(){
            var now = "00:00";
            if(playerInPage){
                now = $filter('timeHMS')(playerInPage.currentTime());
            }
            $scope.yt.list.push({formulation: '', time: now, type: 'multiple', hints: "", scope: "", format: "radio", options: [{text: "", valid: false}, {text: "", valid: false}]});
        };
        
        $scope.addQuestionInputQuizz = function(){
            var now = "00:00";
            if(playerInPage){
                now = $filter('timeHMS')(playerInPage.currentTime());
            }
            $scope.yt.list.push({formulation: '', time: now, type: 'input', hints: "", answer: "", scope: ""});
        };
        
        $scope.removeQuestionQuizz = function(q){
            var i = $scope.yt.list.indexOf(q);
            if(i>=0){
                $scope.yt.list.splice(i, 1);
            }
        };
        
        $scope.addOptionQuizz = function(q){
            q.options.push({text: "", valid: false});
        };
        
        $scope.removeOptionQuizz = function(q, o){
            var i = q.options.indexOf(o);
            if(i>=0){
                q.options.splice(i, 1);
            }
        };
        
        
        $scope.uploadPercent = ""; 
        

        $scope.groupsAvail = AVAILABLE.groupsStar; 
        
        $scope.categoriesAvail = AVAILABLE.categories;
        
        $scope.activityTypes = AVAILABLE.activityTypes; 
             
        $scope.tinymceOpts = $rootScope.tinymceOpts($translate.use());
       
      
        
        var id = $transition$.params().idActivity || 0;
        $scope.id = id;
        
        if(id>0)
        {
            $scope.title = "Edit activity "+id+": VIDEO MODE";
    
            $http.post("/rest/activity/load",{id:id}).then(function(r){
                var data = r.data;
                window.pw.app.DEBUG && console.log(data);
                $scope.a = data;
                $scope.a.id = id;   
                $scope.yt.ytid = data.ytid;
                //Separar ytid the la tech
                if(data.ytid.indexOf(":")===2){
                    $scope.a.tech = data.ytid.substr(0,2);
                    $scope.yt.ytid = data.ytid.substr(3);
                }
               
                $scope.loadPreview();
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
                 icon: null,
                 hasAct: 0,
                 createjs: 0,
                 type: 'V',
                 author: user.username,
                 share: 2,
                 theory: "",
                 id: 0,
                 tech: "YT",
                 interval: {start: 0, end: null}
             };
        
            $scope.title = "New activity: VIDEO MODE";              
        }
        
       
       $scope.techChanged = function(){
            $scope.a.ytid = "";
            $scope.yt.ytid = "";            
       };
            
        $scope.$on("changeGrp", function(evt, args){
            $scope.reloadCategories();
        });
        
        $scope.cancel = function()
        {
            $state.go('home.activitysearch');
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
            if(!$scope.a.ytid){
                    growl.warning("Must provide a valid youtube id");
                    return;
            }
            $scope.a.ytqu = $scope.yt.list.length>0? 1: 0;
           
            if($scope.a.title.ca.trim()==='' || $scope.a.title.en.trim()==='' || $scope.a.title.es.trim()===''){
                    growl.warning("Must provide a title for this activity in every language");
                    return;
            }
           
            $scope.a.idSubject = $scope.$parent.selectedGroup? $scope.$parent.selectedGroup.idSubject : 1;
            $scope.block = true; 
            
            $scope.a.questions = $scope.yt.list; 
            
            jQuery.each($scope.a.questions, function(indx, e){
                    delete e.edit;
                    delete e.answer_edit;
                    delete e.formulation_eval;
                    delete e.hints_eval;
                    delete e.answer_eval;
                    delete e.$index;
                    if(Array.isArray(e.options)){
                        jQuery.each(e.options, function(kk, op){
                           delete op.edit;
                           delete op.title_eval;
                        });
                    }
            });
            
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
                var pms = {text: $scope.a.title[lang], source: lang, target: list};
               
                $http.post('/rest/activity/translate', pms).then(function(r){
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
        
        if(id>0){
            
            $http.post('/rest/fs/get', {path: id+"/theory.html", parse: true, idActivity: id}).then(function(r){
                 var d = r.data; 
                 $scope.a.theory = d.src || "";
                 $scope.a.scripts = d.scripts || "";     
               
                  //Normalize old format to standard one
                 jQuery.each(d.questions, function(i, e){ 
                    e.$index = globalIndex;
                    globalIndex += 1;
                    e.type = e.type || 'multiple';
                    if(e.type==='multiple' && e.answer){
                        e.opts = angular.copy(e.options);
                        e.options = [];
                        if(typeof(e.answer)==='string'){
                            e.answer = [e.answer];
                        }
                        jQuery.each(e.opts, function(j, o){
                            e.options.push({text: o, valid: e.answer.indexOf(o)>=0});
                        });
                        delete e.answer;
                        delete e.opts;
                    }
                    e.timeout = e.timeout || 60;
                    $scope.evaluateScope(e);
                });
                 
                 
                 $scope.yt.list = d.questions;
                 $scope.a.interval = $scope.a.interval || {start: 0, end: null};
            });
            
            //Loads qprovider.json
            $http.post('/rest/fs/get', {path: id+"/qprovider.json", server: true}).then(function(r){
                var d = r.data; 
                try {
                    d = JSON.parse(d.src || {});               
                    $scope.a.qprovider = d;
                } catch(ex){
                    //
                }
            });
        }
        
        $scope.setIntervalStart = function(){
            if(!playerInPage){
                return;
            }
            $scope.a.interval.start = Math.round(playerInPage.currentTime());
        };
                
        
        $scope.setIntervalEnd = function(){
             if(!playerInPage){
                return;
            }
            $scope.a.interval.end = Math.round(playerInPage.currentTime());
        };
        
        $scope.resetInterval = function(which){
            if(which===0){
                $scope.a.interval.start = 0;
            } else {
                 $scope.a.interval.end = null;
            }
        };
        
        $scope.addNote = function(){
            var now = "00:00";
            if(playerInPage){
                now = $filter('timeHMS')(playerInPage.currentTime());
            }
            $scope.yt.notelist.push({time: now, text: ""});
        };
        
        $scope.removeQuestionNote = function(q){
             
            var i = $scope.yt.notelist.indexOf(q);
            if(i>=0){
                $scope.yt.notelist.splice(i, 1);
            }
        };
        
                
        $scope.evaluateScope = function(expr){         
            
            //replace $ by <katex></katex>
             expr.formulation =  (expr.formulation || "").replace(/\$\$((\s|\S)[^(\$})]+(\s|\S))\$\$/g, "<katex>$1</katex>");
             
            //Check if scope must be evaluated-------------
            if(expr.scope){
               var context = window.evaluator.parse(expr.scope);
               expr.formulation_eval = window.evaluator.parse(expr.formulation, context);
               if(expr.hints){ expr.hints_eval = window.evaluator.parse(expr.hints, context); }
               if(expr.answer){ expr.answer_eval = window.evaluator.parse(expr.answer, context); }
               if(expr.options){
                  for(var i=0; i<expr.options.length; i++){
                         var t = (expr.options[i].title || expr.options[i].text || "");
                         expr.options[i].title =  t.replace(/\$\$((\s|\S)[^(\$})]+(\s|\S))\$\$/g, "<katex>$1</katex>");
                         expr.options[i].title_eval = window.evaluator.parse(expr.options[i].title, context);
                  }
               }
            } else {
                expr.formulation_eval = expr.formulation;
                expr.hints_eval = expr.hints;
                if(expr.answer){
                    expr.answer_eval = expr.answer;
                }
                if(expr.options){
                  for(var i=0; i<expr.options.length; i++){
                        var t = (expr.options[i].title || expr.options[i].text || "");
                        expr.options[i].title = t.replace(/\$\$((\s|\S)[^(\$})]+(\s|\S))\$\$/g, "<katex>$1</katex>");
                        expr.options[i].title_eval = expr.options[i].title;
                  }
               }
            }           
        };
        
        
        $scope.goIDE = function(){
            $state.go("home.ide", {idActivity: id});
        };
        
        $scope.reloadCategories();
        
    }]);

});

 