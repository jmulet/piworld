
define([], function(){
  "use strict";
    window.pw.app.register.controller('newActivityQCtrl', ['$scope', '$rootScope', '$http', '$state', '$transition$', 'Session', 'growl',  'Upload', 'AVAILABLE', '$translate', '$sce',
        function($scope, $rootScope, $http, $state, $transition$, Session, growl, Upload, AVAILABLE, $translate, $sce){
        var globalIndex = 0;
        var user = Session.getUser();
        $scope.langs = AVAILABLE.langs;
        $scope.quizz = {shuffleQ: true, shuffleO: true, list: []};
           
        $scope.addQuestionMultipleQuizz = function(){
            $scope.quizz.list.push({$index: globalIndex, formulation: '', type: 'multiple', hints: "", scope: "", format: "kahoot", timeout: 60, options: [{text: "", valid: false}, {text: "", valid: false}]});
            globalIndex += 1;
        };
        
        $scope.addQuestionInputQuizz = function(){
            $scope.quizz.list.push({$index: globalIndex, formulation: '', type: 'input', hints: "", answer: "", scope: "", timeout: 60});
            globalIndex += 1;
        };
        
        $scope.removeQuestionQuizz = function(q){
            var i = $scope.quizz.list.indexOf(q);
              
            if(i>=0){
                $scope.quizz.list.splice(i, 1);
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
        
        $scope.groupsAvail = AVAILABLE.groupsStar; 
        $scope.categoriesAvail = AVAILABLE.categories;
        $scope.activityTypes = AVAILABLE.activityTypes; 
        $scope.tinymceOpts = $rootScope.tinymceOpts($translate.use());
      
        
        var id = $transition$.params().idActivity || 0;
        $scope.id = id;
        
        if(id>0)
        {
            $scope.title = "Edit activity "+id+": QUIZZ MODE";
           
            $http.post("/rest/activity/load",{id:id}).then(function(r){
                var data = r.data;
                window.pw.app.DEBUG && console.log(data);
                $scope.a = data;
                $scope.a.id = id;                                                
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
                 type: 'Q',
                 author: user.username,
                 share: 2,
                 theory: '',
                 id: 0
             };
        
            $scope.title = "New activity: QUIZZ MODE";
        }
        
       
            
        $scope.$on("changeGrp", function(evt, args){
            $scope.reloadCategories();
        });
        
        $scope.cancel = function()
        {
            $state.go($rootScope.previousState || 'home.activitysearch');
        };

       
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
                
                 //Remove CDATA in theory
                $scope.a.theory = ($scope.a.theory || "").replace(/\/\/ <!\[CDATA\[/gi,"").replace(/\/\/ \]\]>/gi,""); 
           
                $scope.a.idSubject = $scope.$parent.selectedGroup? $scope.$parent.selectedGroup.idSubject : 1;
           
                if($scope.quizz.list.length<=0){
                    growl.warning("This quizz contains no questions");
                    return;
                }
                
                //Remove control fields in quizz.list
                var quizzlist = angular.copy($scope.quizz.list);
                
                //Passar les preguntes com a server data
                $scope.a.serverdata = quizzlist;
                //Valida les preguntes
                var err;
                jQuery.each(quizzlist, function(i, e){
                    if(e.scope){
                        try{
                            JSON.parse(e.scope);
                        } catch(ex){
                            err = "Invalid JSON in scope of question "+(i+1)+": "+ex;
                            return true;
                        }
                    }
                    
                    if(e.type==='multiple'){
                        if(e.options.filter(function(o){return o.valid;}).length<=0){
                            err = "At least one valid option is required in question "+(i+1);
                            return true;
                        }
                    } else {
                        if(!e.answer){
                            err = "An answer is required in question "+(i+1);
                            return true;
                        }
                    }
                    
                    delete e.edit;
                    delete e.answer_edit;
                    delete e.formulation_eval;
                    delete e.hints_eval;
                    delete e.answer_eval;
                    delete e.$index;
                    if(Array.isArray(e.options)){
                        jQuery.each(e.options, function(kk, op){
                           delete op.edit;
                           delete op.text_eval;
                        });
                    }
                });
                
                if(err){
                    growl.error(err);
                    return;
                }
                
            
            
            $scope.block = true; 
            
            if($scope.a.id<=0)
            {
                
                    //Crear un provider amb un tipus de questió free.multiple
                    $scope.a.qprovider = {};
                    $scope.a.qprovider.questions = [{
			title: "Tria l'opció correcta",
			serverData: [
				{
					var: "database",
					file: "server-data.json"
				}
			],
			repeat: $scope.quizz.list.length,
			type: "free.multiplechoice",
			tips: ""
                    }];
                    $scope.a.qprovider.config = {
                        shuffleQuestions: $scope.quizz.shuffleQ,
                        shuffleOptions: $scope.quizz.shuffleO
                    };
                  
                    $http.post("/rest/activity/create", $scope.a).then(function(r){
                    var data = r.data;
                    if(data.ok)
                    {
                        growl.success("L'activitat s'ha desat :-)");
                        $scope.a.id = data.idActivity;
                        $state.go('home.activity', {idActivity:data.idActivity, idAssignment: 0});
                       
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
                    if ($scope.a.qprovider)
                    {
                        for (var i = 0; i < AVAILABLE.langs.length; i++) {
                            var lang = AVAILABLE.langs[i];
                            $scope.a.qprovider.activity.title[lang] = $scope.a.title[lang];
                            $scope.a.qprovider.activity.description[lang] = $scope.a.description[lang];
                        }
                        $scope.a.qprovider.activity.categories = $scope.a.categories.join(",");
                        $scope.a.qprovider.activity.levels = $scope.a.levels.join(",");

                        $scope.a.qprovider.config = {
                            shuffleQuestions: $scope.quizz.shuffleQ,
                            shuffleOptions: $scope.quizz.shuffleO
                        };

                       }
                }
                
                  //Simply update and go back
                  $http.post("/rest/activity/update", $scope.a).then(function(r){
                    var data = r.data;
                    if(data.ok)
                    {                        
                        growl.success("L'activitat s'ha desat :-)");
                        $state.go('home.activity', {idActivity: $scope.a.id, idAssignment: 0});
                      
                    }
                    else
                    {
                        growl.warning("No s'ha pogut actualitzar l'activitat :-(");
                    }
                });
             
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
        
        
        
        if(id>0){            
            //Load theory
            $http.post('/rest/fs/get', {path: id+"/theory.html"}).then(function(r){
                 $scope.a.theory = r.data.src || "";
            });
            
            //Load serverData 
            $http.post('/rest/fs/get', {path: id+"/server-data.json", server: true}).then(function(r){
                 var d = r.data;
                 //Normalize old format to standard one
                 d = JSON.parse(d.src || []);
                 jQuery.each(d, function(i, e){ 
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
                 $scope.quizz.list = d;
                 
            });
            
            //Loads qprovider.json
            $http.post('/rest/fs/get', {path: id+"/qprovider.json", server: true}).then(function(r){
                var d = r.data;
                try {
                  d = JSON.parse(d.src || {});
                  $scope.a.qprovider = d;
                  $scope.quizz.shuffleQ = d.config.shuffleQuestions? true: false;
                  $scope.quizz.shuffleO = d.config.shuffleOptions? true: false;
              } catch(ex){
                  //
              }
            });
        }
        
        
        $scope.evaluateScope = function(expr){         
            
            //replace $ by <katex></katex>
             expr.formulation =  expr.formulation.replace(/\$\$((\s|\S)[^(\$})]+(\s|\S))\$\$/g, "<katex>$1</katex>");
             
            //Check if scope must be evaluated-------------
            if(expr.scope){
               var context = window.evaluator.parse(expr.scope);
               expr.formulation_eval = window.evaluator.parse(expr.formulation, context);
               if(expr.hints){ expr.hints_eval = window.evaluator.parse(expr.hints, context); }
               if(expr.answer){ expr.answer_eval = window.evaluator.parse(expr.answer, context); }
               if(expr.options){
                  for(var i=0; i<expr.options.length; i++){
                         expr.options[i].text =  expr.options[i].text.replace(/\$\$((\s|\S)[^(\$})]+(\s|\S))\$\$/g, "<katex>$1</katex>");
                         expr.options[i].text_eval = window.evaluator.parse(expr.options[i].text, context);
                  }
               }
            } else {
                expr.formulation_eval = expr.formulation;
                expr.hints_eval = expr.hints;
                expr.answer_eval = expr.answer;
                if(expr.options){
                  for(var i=0; i<expr.options.length; i++){
                        expr.options[i].text =  expr.options[i].text.replace(/\$\$((\s|\S)[^(\$})]+(\s|\S))\$\$/g, "<katex>$1</katex>");
                         expr.options[i].text_eval = expr.options[i].text;
                  }
               }
            }           
        };
        
        $scope.goIDE = function(){
            $state.go("home.ide", {idActivity: id});
        };
        
        
        $scope.reloadCategories();
       
        $scope.$on('$destroy', function(){
            if($scope.a.tmpDirNode){
                $http.post('/rest/fs/delete', {node: $scope.a.tmpDirNode});
            } 
        });

    }]);

});

 