/* 
 * This module requires the DB API defined in ActivitySrv.js
 * This API injects a Factory named ActivitySrv
 */

(function(app){
  
    "use strict";
    
    
    app.register.factory('client', ['$q', '$filter', '$ocLazyLoad', 'Session', function($q, $filter, $ocLazyLoad, Session){
     
        return {
                $q: $q,
                $filter: $filter,
                loadModule: function (module) {
                    return $ocLazyLoad.load(module);
                },
                addCss: function (css) {
                    Session.addCss(css);
                },
                removeCss: function (css) {
                    Session.removeCss(css);
                },
                selectLevel: function (self) {
                    var i = self.suggestedLevel;
                    var obj = self.ldps['L'+i];
                    while (i > 0 & !obj) {
                        i -= 1;
                        obj = self.ldps['L'+i];
                    }
                    if (!obj) {
                        obj = self.ldps.Ld;
                        i = 0;
                    }
                    if (obj) {
                        for (var key in obj) {
                            self[key] = obj[key];
                        }
                        self.level = i;
                    }
                    else {
                        self.level = 1;
                    }

                }
            };
    }]);
    
    
    /**
     * from activities. Note that this acts as a wrapper
     * around $http, in order to prevent end programmers
     * to do evil things with $http calls.
     */
    app.register.factory('server', ['$http', '$q', function($http, $q){

        var genericRunner = function(url)
        {
            var runner = function(data, useFile)
            {
                var params = {};
                if(typeof(data)==='string')
                {
                    params.script = data;
                }
                else
                {
                    params.lines = data;
                }
                params.useFile = useFile || false;
                
                return $http.postq(url, params);
            };

            return runner;
        };

        var maxima = {};    
        var sympy = {};
        var yacas = {};
        maxima.run = genericRunner('/rest/cas/maxima');
        sympy.run = genericRunner('/rest/cas/sympy');
        yacas.run = genericRunner('/rest/cas/yacas');
        
         
        var http = {
            getJSON: function(idActivity, filename){  
               var defer = $q.defer();
                $http.post("/rest/fs/get", {path: idActivity+"/"+filename, server: true}).then(function(r){   
                   var obj = [];
                   try{
                       obj = JSON.parse(r.data.src || "");
                   }catch(ex){
                       window.pw.app.DEBUG && console.log(ex);
                   }
                   defer.resolve(obj);
               });
               return defer.promise;
            }
        };

        var serverAPI = {http: http, cas:{maxima: maxima, sympy: sympy, yacas: yacas}};
        return serverAPI;
    }]);    
  
    /**
     * Main boilerplate used as a base for defining activities
     * It consists of two parts
     * One: ActivitySrv is used internally as a REST API for storing information
     *      in the database, such as, attempt, questions, steps, and user answers.
     *      
     * Two: Provides an API that allows end users to define their activities by
     * overriding some methods of the base.
     * 
     *      Every activity extends from ActivityBase
     *      Every activity must register at least one Question
     *      Every Question must register at least one Step
     *      
     *      Therefore, an activity, is organized in Questions, and Questions are
     *      in turn organized into steps.
     *      
     *      Note that only Steps are answered. Questions only pose some problem
     *      to the student.
     */
    
    app.register.factory('ActivityBase', ['$q', 'ActivitySrv', 'ActivitySrv0', '$http', function($q, ActivitySrv1, ActivitySrv0, $http){
            
            /*
             * These two functions allow to parse views entries in text code
             * {view:viewid}
             */
            function parseViewsHTML(str, views){
                 
                if(!str){
                    return "";
                }
                var parsed = str;
                jQuery.each( (parsed.match(/{view:(\w|\s|\S)*}/g) || []), function(indx, c){
                    var id = c.replace(/\s/g,'').replace('{view:','').replace('}','');
                    //try to find id
                    var view = views[id];
                    if(view){
                        if(view.type==='jsxgraph-png'){
                             var url = "rest/jsxgraph?";
                             var sep = "";
                             for(var key in view.cmds){
                                 url += key+"="+(view.cmds[key])+sep;
                                 sep = "&";
                             };
                             
                             parsed = parsed.replace(c,"<img alt='jsxgraph' src='"+url+"'>"); 
                        }
                        else if(view.type==='jsxgraph'){
                             
                             var id = Math.floor(Math.random()*1e6);
                             var replacement = "<div id='box_"+id+"' class='jxgbox' style='width:350px;height:250px;' "+
                                               "jxg-board=\""+(view.cmds.jsxBoard || '')+"\""+ 
                                               "jxg-create=\""+(view.cmds.jsxCreate || '')+"\"></div>";
                             
                             parsed = parsed.replace(c, replacement); 
                        }
                        else
                        {
                            parsed = parsed.replace(c,'<!--'+c+"-->"); //unknown view type
                        }
                    }
                    else{
                        parsed = parsed.replace(c,'<!--'+c+"-->"); //not found view (comment)
                    }
                    
                });
              
                return parsed;
            }
            
        function parseViewsLaTeX(idQuestion, str, views){
                
                if(!str){
                    return "";
                }
                window.pw.app.DEBUG && console.log("input "+str);
                var parsed = str;
                 jQuery.each( (parsed.match(/{view:(\w|\s|\S)*}/g) || []), function(indx, c){
                    var id = c.replace(/\s/g,'').replace('{view:','').replace('}','');
                    //try to find id
                    var view = views[id];
                    if(view){
                        parsed = parsed.replace(c,"\\includegraphics{"+id+"_"+idQuestion+".png}");                         
                    }
                    else{
                        parsed = parsed.replace(c,''); //not found view (comment)
                    }
                    
                });
                window.pw.app.DEBUG && console.log("output "+parsed);
                return parsed;
            }
            
            
            
            var QuestionClass = Object.extend({
                
                init: function(scope, headingHTML, headingTeX, repeat){
                    this.scope = scope;
                    this.allowerrors = null;    //Setting this parameter only allows for a max number of errors for this question
                    this.errorcount = 0;
                    
                    this.headingHTML = headingHTML || '';
                    this.headingLaTeX= headingTeX || this.headingHTML;  
                    this.category = null;
                    this.level = 0;          //Current level generated this question 0..4
                    this.suggestedLevel = 0; //Level which is suggested by the brain for this question 0..4
                      
                    //Store in this array instances of this.StepClass
                    this._registeredSteps = [];
                    this._currentStepIndx = -1;
                    
                    this.id = 0;
                    QuestionClass.repeat = repeat>0 ? repeat : 1;     //How many times this question is repeated
                    this.shownTimes = 0; //How many times has been shown
                    this.isDone = false;
                    this.lapsed = 0;
                    
                    this.clone = function(){
                        return $.extend(true, {}, this);
                    };
                    
                    //This is an all-purpose empty step
                    this.createStep = function(protoImpl, staticImpl){
                        this.scope = scope;
                        //window.pw.app.DEBUG && console.log('i am in createstep '+this+" "+scope);
                        var StepKlass = StepClass.extend(protoImpl || {}, staticImpl || {});                      
                        var step = new StepKlass(this);
                        this._registeredSteps.push(step);
                        return step;
                    };
                    
                    
                    this.hasNextStep = function(){
                        return this._currentStepIndx < this._registeredSteps.length - 1;
                    };
                    
                    this.getNextStep = function(){
                        this._currentStepIndx += 1;
                        return this._registeredSteps[this._currentStepIndx];
                    };
                    
                    this.getCurrentStep = function(){
                         return this._registeredSteps[this._currentStepIndx];
                    };
                    
                    //Displays only old steps, do not include the current one
                    this.getStepHistory = function(){
                        
                        if(this._currentStepIndx>=1)
                        { 
                            //Return a copy of the _registeredSteps array except last item.
                            var list = [];
                            for(var i=0; i<this._currentStepIndx; i++)
                            {
                                 list.push(this._registeredSteps[i]);
                            }
                            return list;
                             
                        }
                        return [];
                    };
                    
                    },
                   //To be overrriden
                   update : function(){
                       
                   }
               },
               //static members
               {repeat: 1});
                        
                
                
                
            var StepClass = Object.extend({
                init : function (parentQuestion) {
                    this.formulationHTML = '';
                    this.formulationLaTeX = '';
                    this.views = {}; //holds graphics by vewid key
                    //Template
                    this.inputdiv = "<input type='text' ng-model='userinput' ng-disabled='done' ng-keypress='$event.which==13 && check()'/>"; //default input div
                    this.answer = '';
                    this.answerHTML = '';
                    this.answerLaTeX = '';
                    this.hint = '';
                    this.addScore = 1;
                    this.parentQuestion = parentQuestion;
                    this.scope = parentQuestion.scope;
                    this.askHelp = false;
                    this.askSolution = false;
                    this.askTheory = false;
                    this.id = 0;
                    this.lapsed = 0;
                },
                resolveCreate : function (defer)
                {
                    //Override
                    defer.reject();
                },
                resolveCheck : function (defer, userinput)
                {
                    //Override
                    defer.reject();
                },
                getUserinputHTML : function (userinput) {
                    //Override
                    return userinput || this.parentQuestion.scope.userinput + "";
                },
                generateDetailedAnswer: function(){
                    //Need the type of question
                     var catg = this.parentQuestion.category || 'g';
                     return $http.post('/rest/misc/mathtutor', {category: catg, html: this.formulationHTML});
                }
            });
            
            
            
            var Base = Object.extend({
                init : function(){
                this.ActivitySrv = ActivitySrv1;
                this.i18n = ActivitySrv1.i18nInstance;
           
                this.config = {
                    totalQ: -1,             //must be computed from array, use function getTotalQ instead
                    timeout: 0,
                    canCheck: true,
                    canAskHelp: true,
                    canAskTheory: true,
                    canAskSolution: true,
                    canSkipQuestions: false,
                    canGenerateSheet: true,
                    randomOrder: false,      //Questions are shown in random order or sequentially
                    shuffleAnswers: false,
                    browsable: false,        //When true, the user can navigate among questions
                    level: 0,               //Current level for this activity 0..4
                    category: 'g'
                };
                this.counters = {
                    pscore: 0,
                    correctQ: 0,
                    doneQ: 0,
                    doneS: 0,
                    errors: 0,
                    askHelpTimes: 0,
                    askSolutionTimes: 0,
                    askTheoryTimes: 0
                };
                 
                
                //this array stores instances of QuestionClass
                this._registeredQuestions = [];  
                this._generatedQuestions = [];
                this._currentQuestion = null;
                
                this.getTotalQ = function(){                  
                    var tq = 0;
                    jQuery.each(this._registeredQuestions, function(indx, q){
                       tq += q.repeat; 
                    });
                    return tq;                    
                };
                
                this.hasNext = function(){
                    var has = false;
                    var tq = 0;
                    jQuery.each(this._generatedQuestions, function(indx, q){
                       tq += q.isDone? 1:0; 
                    });
                    has = tq < this.config.totalQ;
                    if(!has && this._currentQuestion)
                    {
                        //Check if the current question has more steps
                        has = this._currentQuestion.hasNextStep();
                    }
                    return has;
                };
                
                this.createQuestion = function(protoImpl, staticImpl){
                    
                    var Qklass = QuestionClass.extend(protoImpl, staticImpl || {});  
                    //window.pw.app.DEBUG && console.log(Qklass.allowerrors); //Assume static value
                    
                    //window.pw.app.DEBUG && console.log("I am in createQuestion and scope is "+this.scope);
                    var instances = [];
                    for(var i=0; i<Qklass.repeat; i++)
                    {
                        var questionInstance = new Qklass(this.scope);
                        //questionInstance.update();
                        questionInstance.headingLaTeX = questionInstance.headingLaTeX? questionInstance.headingLaTeX: questionInstance.headingHTML;
                        questionInstance.repeat = 1;
                        questionInstance.category = questionInstance.category || this.config.category || 'g';
                        this._registeredQuestions.push(questionInstance);
                        instances.push(questionInstance);
                    }
                    return instances;                    
                };
                  
               
                this.idActivity = 0;
                this.idAssignment = 0;
                this.idGroup = 0;
                this.idSubject = 0;
                this.scope = {};
   
            },
            
            define: function()
            {
                //Override with activity definition.
            },
            
            setScope: function(scope)
            {
                var defer = $q.defer();
                this.scope = scope;
                var self = this;
                //Never call define before defining the scope
                var result = this.define();
                  
                //hold an array with the generated questions
                var maxQ = this.getTotalQ();
                if(this.config.totalQ <= 0 || this.config.totalQ > maxQ){
                    this.config.totalQ = maxQ;
                }
                if(this.config.shuffleQuestions || this.config.randomOrder)
                {
                   this._generatedQuestions = this._registeredQuestions.shuffle();
                }
                else
                {
                    this._generatedQuestions = this._registeredQuestions;
                }
                 
                //Nothing to resolve
                if(!result){
                   // console.log("Nothing to resolve");
                    defer.resolve();
                }
                else{
                    //result is an object with keys and promises
                    //These key names will hold the resolved values of the promises
                     
                        $q.all(result).then(function (datamap) {
                            //Keep an object of the resolve in self
                            for (var key in datamap) {
                                self[key] = datamap[key];
                            }
                            //Now everything is resolved so, we can updateQuestion
                            defer.resolve();
                             
                        }, function () {
                            defer.reject();
                        });                                             
                }
                
                return defer.promise;                
            },
            
            setIds: function(idActivity, idAssignment, idGroup, idSubject, idUser)
            {
                this.idActivity = idActivity;
                this.idAssignment = idAssignment || 0;             
                this.idGroup = idGroup || 0;
                this.idSubject = idSubject || 0;
                this.idUser = idUser || -1;
            },
            
            setRest: function(rest)
            {
                if(rest)
                {
                    this.ActivitySrv = ActivitySrv1;
                    console.log("using rest to register activity");
                }
                else
                {
                    this.ActivitySrv = ActivitySrv0;
                    console.log("Activity registry is off");
                }
                window.pw.app.DEBUG && console.log("NOW IN ACTIVITYBASE SET REST IS "+this.ActivitySrv.name);
            },
             
            onDestroy: function(){
                    //override it!
            },
              
            //Destroys all registered questions and answers
            destroy: function(){
                this._registeredQuestions.clear();
                this._generatedQuestions.clear();
                this._currentQuestion = null;
                this.onDestroy();
            },
            
            registerAskHelp: function()
            {
               var _currentStep = this._currentQuestion.getCurrentStep();
               _currentStep.askHelp = true;
                this.counters.askHelpTimes += 1;
            },
            
            registerAskTheory: function()
            {
                var _currentStep = this._currentQuestion.getCurrentStep();
                _currentStep.askTheory = true;
                this.counters.askTheoryTimes += 1;
            },
            
            registerAskSolution: function()
            {
                var _currentStep = this._currentQuestion.getCurrentStep();
                _currentStep.askSolution = true;
                this.counters.askSolutionTimes += 1;
            },
            
            createAttempt: function()
            {
                var promise = this.ActivitySrv.createAttempt(this.idActivity, this.idAssignment, this.idGroup, this.config.level);
                   var self = this;
                   promise.then(function(idAttempt){ 
                       self.attemptRest = idAttempt>0;       
                       window.pw.app.DEBUG && console.log("Created attempt id: "+idAttempt + " for activity "+self.idActivity);
                });
                                   
                return promise;             
            },
            
            closeAttempt: function(){
                //check if the last question has been correctly closed
                this.closeQuestion();                
                return this.ActivitySrv.closeAttempt();
            },
            
            updateAttempt: function(){
                return this.ActivitySrv.updateAttempt();
            },

            closeQuestion: function(done){
                
                var qrest = this.ActivitySrv.getQuestion(this._currentQuestion.id || 0);
                if(qrest)
                {
                    this._currentQuestion.lapsed += new Date().getTime() - this._currentQuestion.iniTime;
                    //this._currentQuestion.isDone = done || false;
                    return qrest.close(this._currentQuestion.lapsed);
                } 
                //this._currentQuestion.isDone = done || false;
                var d = $q.defer();
                d.reject();
                return d.promise;
            },
            
            //1st pick a random this._registeredQuestions 
            //2nd pick all _registeredSteps in order
            //goto 1st
            //Returns a plain this.question object.
            create: function(index){
                var defer = $q.defer();
                var self = this;
                
                //Check if a new question must be created
               
                if(!this._currentQuestion || !this._currentQuestion.hasNextStep() || typeof(index)!=='undefined' )
                {
                    //before opening a new question must close last question first, it wont work for non sequential
                    if (index==null && this._currentQuestion && !this._currentQuestion.hasNextStep())
                    {
                        this.closeQuestion(true);         //Close and done!
                    }
                    else if (this._currentQuestion)
                    {
                        this.closeQuestion(false);        //Simply close
                    }
   
                    if(typeof(index)==='undefined')
                    { 
                        if (this._currentQuestion === null)
                        {
                            index = 0;                                               
                        }
                        else
                        {
                            index = this._generatedQuestions.indexOf(this._currentQuestion) + 1;                        
                        }
                    }
                    
                    if(index>=this._generatedQuestions.length)  //Nothing else to generate!
                    {
                        index = 0;
                        defer.reject();
                        return defer.promise;
                    }
                    this._currentQuestion = this._generatedQuestions[index];
                    
                    if(!this._currentQuestion)
                    {
                        window.pw.app.DEBUG && console.log("Error, current question is undefined");
                        window.pw.app.DEBUG && console.log(this._generatedQuestions);
                    }
                    
                    this._currentQuestion.iniTime = new Date().getTime();
                    this._currentQuestion.shownTimes += 1;
                    
                    if(this._currentQuestion.id <= 0)  //This is the first time that is invoked
                    {
                        this._currentQuestion._currentStepIndx = -1;
                        
                        //before calling update we must resolve the coorect question.level through brain (async)                        
                        var catg = this._currentQuestion.category || this.config.category || 'g';
                        this.ActivitySrv.Brain.suggestLevel(this.idSubject, catg).then(function(d){
                                self._currentQuestion.suggestedLevel = d.suggestedLevel;
                                //console.log("BRAIN HAS RESOLVED A LEVEL OF "+d.suggestedLevel+" FOR CATEGORY "+ catg);
                                //once level is resolved then, step can be resoved
                                //console.log("ABOUT TO CALL UPDATE!!!!");
                                self._currentQuestion.update();
                                //register this question in database and retrieve an idQuestion if this is the first time            
                                var qrest = self.ActivitySrv.getQuestion();
                                qrest.create(self._currentQuestion.headingHTML, self._currentQuestion.category || self.config.category, d.level, index).then(function (idQuestion) {
                                    self._currentQuestion.id = idQuestion;
                                    window.pw.app.DEBUG && console.log("Set idquestion to " + idQuestion);
                                    return self.createStep(defer);
                                });
                            });
                    }
                    else
                    {
                         this._currentQuestion._currentStepIndx -= 1;
                         return this.createStep(defer);
                    }
                    
                }
                //simply create an step
                else
                {
                    return this.createStep(defer);
                }
                
                return defer.promise;
            },
            
            //Once idQuestion is resolved then create a new step
            createStep: function(defer)
            {
                this.counters.doneS += 1;                
                var _currentStep = this._currentQuestion.getNextStep();
               
                var defer2 = $q.defer();
                _currentStep.resolveCreate(defer2);
                _currentStep.iniTime = new Date().getTime();
                 
                var promise = defer2.promise;
                
                //Una vegada s'hagi resolt step, s'ha de parsejar la creació de views
                //check step.views array and parse any {view:id} string in inputdiv, formulationLaTex, formulationHTML, hint, answerHTML, answerLaTeX
                var idQuestion = this._currentQuestion.id;
                promise.then(function(step){
                    step.inputdiv = parseViewsHTML(step.inputdiv, step.views);
                    step.formulationHTML = parseViewsHTML(step.formulationHTML, step.views);
                    step.hint = parseViewsHTML(step.hint, step.views);
                    step.answerHTML = parseViewsHTML(step.answerHTML, step.views);

                    step.formulationLaTeX = parseViewsLaTeX(idQuestion, step.formulationLaTeX, step.views);
                    step.answerLaTeX = parseViewsLaTeX(idQuestion, step.answerLaTeX, step.views);
                    defer.resolve(step);                     
                });
             
                if(_currentStep.id <= 0)
                {
                    //Stores in the database the newly created step and its right answer
                    var self = this;
                    promise.then(function(step){
                        
                        var qrest = self.ActivitySrv.getQuestion(self._currentQuestion.id);
                        var srest = qrest.getStep();
                        
                        if(typeof(step.answerHTML)==='undefined')
                        {
                            step.answerHTML = step.answer+"";
                        }
                        srest.create(step.formulationHTML, step.answerHTML).then(function(idStep){
                            _currentStep.askHelp = false;
                            _currentStep.askTheory = false;
                            _currentStep.askSolution = false;
                            _currentStep.id = idStep;
                            window.pw.app.DEBUG && console.log("Set idStep to "+ idStep );
                        });
                    });
                }
                
                return promise;
            },
            
            closeStep: function(){
                    var defer = $q.defer();
                    var catg = this._currentQuestion.category || this.config.category || 'g';
                    var _currentStep = this._currentQuestion.getCurrentStep();
                    _currentStep.lapsed += new Date().getTime() - _currentStep.iniTime;
                    var qrest = this.ActivitySrv.getQuestion(this._currentQuestion.id);
                    if (qrest) {
                        var srest = qrest.getStep(_currentStep.id);
                        if (srest) {
                            srest.close(_currentStep.askHelp, _currentStep.askSolution, _currentStep.askTheory, _currentStep.lapsed, this.idSubject, this.idUser, catg).then(function(d) {                               
                                defer.resolve(d);
                            });
                        }
                    }
                    return defer.promise;
                },
                        
            check: function(userinput){
                
                console.log("in check !!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
                console.log(userinput);
                
                var defer = $q.defer();
                var deferDB = $q.defer();
                
                var _currentStep = this._currentQuestion.getCurrentStep();
                
                var userinputText = _currentStep.getUserinputHTML(userinput);
                
                _currentStep.resolveCheck(defer, userinput);           
                
                    var self = this;
                    var qrest = self.ActivitySrv.getQuestion(this._currentQuestion.id);
                    if(qrest!==null)
                    {              
                        var _currentStep = this._currentQuestion.getCurrentStep();
                        var srest = qrest.getStep(_currentStep.id);
                        
                        defer.promise.then(function(deferResult){

                            var valid = false;
                            var feedback = "";
                            if(typeof(deferResult)==='object')
                            {
                                valid = deferResult.valid;
                                feedback = deferResult.feedback || "";
                            }
                            else
                            {
                                valid = deferResult;
                            }

                            var catg = self._currentQuestion.category || self.config.category || 'g';
                            
                            if(valid===true)  //Registers a right answer
                            {
                                self.counters.doneQ += 1; 
                                self._currentQuestion.isDone = true;
                             
                                srest.registerAnswer(userinputText, true, self.idSubject, self.idUser, catg).then(function(){
                                    _currentStep.lapsed += new Date().getTime() - _currentStep.iniTime;
                                    
                                    srest.close(_currentStep.askHelp, _currentStep.askSolution, _currentStep.askTheory, _currentStep.lapsed, self.idSubject, self.idUser, catg).then(function(){;
                                          deferDB.resolve(deferResult);});
                                });
                                self.counters.correctQ += 1;
                                self.counters.pscore += _currentStep.addScore; 
                                var sc = self.updateScore(self.counters, self.config.totalQ);
                                self.ActivitySrv.setScore( sc );               
                            }
                            else if(valid===false) //Registers a wrong answer
                            {
                                srest.registerAnswer(userinputText, false, self.idSubject, self.idUser, catg).then(function(data){
                                       window.pw.app.DEBUG && console.log("registered incorrect response "+data);
                                       deferDB.resolve(deferResult);
                                });
                                self.counters.errors += 1;
                                var sc = self.updateScore(self.counters, self.config.totalQ);
                                self.ActivitySrv.setScore( sc );
               
                            }
                            else {  //This is an error which is not either right nor wrong (no register in database!)
                                deferDB.resolve(deferResult);
                            }
                        });                    
                }
                else
                {
                    deferDB = defer;
                }
                return deferDB.promise;  
            },
            
           
            updateScore : function(counters, totalQ){
                //override in QuestionProvider. Provide a custom function that
                //obtains score from numberof questions, errors, time, etc.
                var sc = (counters.pscore - 0.35*counters.errors)/(1.0*totalQ);
                window.pw.app.DEBUG && console.log(JSON.stringify(counters)+ " "+totalQ);
                if(sc<0)
                {
                    sc = 0;
                }
                else if(sc>1)
                {
                    sc = 1;
                }
                
                return Math.floor(sc*100);  
            },
            
            getScore : function(){ 
                return this.ActivitySrv.score;  
            }
            
            });
            
            return Base;
}]);
  
  

}(window.pw.app));

