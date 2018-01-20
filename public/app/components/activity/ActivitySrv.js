(function(app){
"use strict";
/**
 * Activity service allows to store the following data structure in db
 * for each of the activities/Attempts
 * 
 * for a given idActivity:
 * 
 * Attempt: idAttempt
 *        ---> Question: idQuestion
 *                    --->Step: idStep
 *                              ---> RegisteredAnswer: idAnswer
 */  
 app.factory('ActivitySrv', ['$state', '$http', '$interval', '$q', 'Session', 
      function($state, $http, $interval, $q, Session){
  
          var service = {idActivity: 0, idAttempt: 0, idGroup: 0, counter: null, score: 0, name: 'ONLINE'};
          
          
          service.Brain = service.Brain || {};
          
          service.Brain.suggestLevel = function(idSubject, category){
                var defer = $q.defer();
                $http.post('rest/activity/brain', {idSubject: idSubject, category: category, idUser: Session.getUser().id}).then(function(r){
                    defer.resolve(r.data);
                });                
                return defer.promise;
          };
          
          /*
           * Creates an attempt for a given idActivity
           * Returns as a promise the idAttempt generated or -1 in case of error
           * 
           * Before creating a new attempt, tries to close the existing one
           */
          service.createAttempt = function(idActivity, idAssignment, idGroup, level){
                    //window.pw.app.DEBUG && console.log("Creating attempt for idActivity "+idActivity);
                    var defer = $q.defer();
                    service.idActivity = idActivity;
                    if(service.idAttempt>0)
                    {
                        this.closeAttempt().then(function(){service.createAttempt(idActivity, idAssignment, idGroup, level).then(
                                function(value){defer.resolve(value);
                        });});
                    }
                    else
                    {
                         $http.post('rest/attempt/create', 
                         {idLogin: Session.getUser().idLogin, idActivity: idActivity, idAssignment: idAssignment, idGroup: idGroup, level: level}).then(function(r){
                              service.idAttempt = r.data.idAttempt;
                              defer.resolve(service.idAttempt);
                         }, function(err){
                             window.pw.app.DEBUG && console.log('Error creating attempt '+err);
                             defer.resolve(-1);
                         });
                    }  
                    return defer.promise;
            };
              
          /**
           * Close the current attempt and redirects to a state,
           * in case redirectState is defined.
           */
         service.closeAttempt = function(redirectState)
         {
              if(service.counter)
              {
                  $interval.cancel(service.counter);
                  delete service.counter;
              }
              
             //window.pw.app.DEBUG && console.log("Closing attempt for agttemptid "+service.idAttempt);
             var finished = false;
             if(typeof(redirectState)==='boolean'){
                 finished = redirectState;
                 redirectState = null;
             }
             
             
             var promise = $http.post('rest/attempt/close', 
                {idAttempt: service.idAttempt, score: service.score, finished: finished});
            
             
                promise.then( function(){
                      service.idAttempt = 0;  
                      if(redirectState)
                      {
                            $state.go(redirectState); 
                      };
                  });
             
             return promise;
                                 
          };
          
          /*
           * Updates the attempt with freshly new information
           * Score and automatically sets endTime in database.
           */
         service.updateAttempt = function()
         {
             return $http.post('rest/attempt/update', 
                {idAttempt: service.idAttempt, score: service.score});
                                 
          };
         
         /**
          * Use this method to update the score
          */
         service.setScore = function(score)
         {
             service.score = score;
             service.updateAttempt();
         };
         
         /**
          * Class to ease internationalization of activities.
          * i18nData is loaded by service.i18n
          */
         var I18nProvider = function(i18nData)
         {
             this.i18nData = i18nData;
             
             this.get = function(key)
             {
                 return this.i18nData.translations[key] || '?'+key+'?';
             };
             
             this.put = function(key, value)
             {
                 this.i18nData.translations[key] = value;
             };
             
             this.toString = function(){
                 return JSON.stringify(this.i18nData);
             };
             
             this.theoryPath = this.i18nData.theoryPath || '';
         };
         
        
         /**
          * Loads the internationalization information for an activity
          * if id is set, use as idActivity, if not, use service.idActivity.
          */ 
        service.i18n = function(id){
              var defer = $q.defer();
              window.pw.app.DEBUG && console.log("FETCHING i18n for id="+ (id || service.idActivity));
              $http.post('/rest/activity/i18n', {idActivity: id || service.idActivity}).then(
                function(r)
                {
                        var data = r.data; 
                        window.pw.app.DEBUG && console.log(JSON.stringify(data));
                        service.i18nInstance = new I18nProvider(data);
                        defer.resolve(service.i18nInstance);
                 },
                 function(err){
                        window.pw.app.DEBUG && console.log(err);
                        var i18nData = {};
                        service.i18nInstance = new I18nProvider(i18nData);
                        defer.resolve(service.i18nInstance);
                    });
             return defer.promise;
         };
          
          
          
      
        var StepService = function(parent){
              this.idQuestion = parent.idQuestion;
              this.idStep = 0; 
              this.idAnswer = 0;
              this.parent = parent;
           
              this.create = function(stepText, rightAnswer){
                var self = this;
                var defer = $q.defer();
                window.pw.app.DEBUG && console.log("***** i am in service create ");
                if(service.idAttempt>0 && this.idQuestion>0 && this.idStep<=0)
                {
                  
                  $http.post('rest/attempt/createStep', 
                  {idQuestion: this.idQuestion , step: stepText, rightAnswer: rightAnswer}).then( function(r){
                          var data = r.data;
                          self.idStep = data.idStep;  
                          window.pw.app.DEBUG && console.log('create step --> idStep='+data.idStep+" "+self.idStep);    
                          self.parent.stepCache[data.idStep] = self;   
                          defer.resolve(data.idStep);
                      });
                }
                else
                {
                    defer.resolve(0);
                }
                return defer.promise;
            };
          
              
            this.close = function(help, sol, theory, ms, idSubject, idUser, catg){
                if(typeof(help)==='undefined')
                {
                    help = false;
                }
                if(typeof(sol)==='undefined')
                {
                    sol = false;
                }
                var defer = $q.defer();
                if(service.idAttempt>0 && this.idQuestion>0 && this.idStep>0)
                {
                   var self = this;
                   var seconds = ms || 0;
                   seconds = Math.floor(ms*0.001);
                   $http.post('rest/attempt/closeStep', 
                   {idStep: this.idStep, askHelp: help?'S':'N', askSolution: sol?'S':'N',
                    askTheory: theory?'S':'N', seconds: seconds, idUser: idUser, category: catg, idSubject: idSubject}).then( function(r){
                            window.pw.app.DEBUG && console.log('close step -->'+JSON.stringify(r.data));
                            delete self.parent.stepCache[self.idStep];
                            self.idStep = 0; //reset
                            defer.resolve(1);
                   });
                }
                else
                {
                    defer.resolve(0);
                }
                return defer.promise;
            };
            
              
            this.registerAnswer = function(userText, isValid, idSubject, idUser, catg){
                var defer = $q.defer();
                if(service.idAttempt>0 && this.idQuestion>0 && this.idStep>0)
                {
                  var c = isValid?'S':'N';
                  $http.post('rest/attempt/registerAnswer', 
                  {idStep: this.idStep, answer: userText, isCorrect: c, idUser: idUser, idSubject: idSubject, category: catg}).then( 
                          function(r){
                            window.pw.app.DEBUG && console.log('register answer in step -->'+JSON.stringify(r.data));
                            defer.resolve(r.data.id);
                      });
                }
                else
                {
                    defer.resolve(0);
                }
                return defer.promise;
              };
          };
          
   
          var questionCache = {};
          var QuestionService = function(){
              this.idQuestion = 0; 
              this.idAnswer = 0;
                  
              this.stepCache = {};
                        
              this.create = function(question, category, level, index){
                var defer = $q.defer();
                this.category = category;
                this.level = level;
                
                if(service.idAttempt>0 && this.idQuestion<=0)
                {
                  var self = this;
                  $http.post('rest/attempt/createQuestion', 
                  {idAttempt: service.idAttempt, question: question, category: category, level: level}).then( function(r){
                          window.pw.app.DEBUG && console.log('create question -->'+JSON.stringify(r.data));
                          self.idQuestion = r.data.idQuestion;    
                          questionCache[self.idQuestion] = self;                  
                          defer.resolve(self.idQuestion);
                      });
                }
                else
                {
                    defer.resolve(0);
                }
                return defer.promise;
            };
          
              
            this.close = function(ms){
                
                var defer = $q.defer();
                if(service.idAttempt>0 && this.idQuestion>0)
                {
                  var self = this;
                  var seconds = ms || 0;
                  seconds = Math.floor(ms*0.001);
                  $http.post('rest/attempt/closeQuestion', 
                  {idQuestion: this.idQuestion, seconds: seconds}).then( function(r){
                            window.pw.app.DEBUG && console.log('close question -->'+JSON.stringify(r.data));
                            delete questionCache[self.idQuestion];
                            self.idQuestion = 0; //reset
                            defer.resolve(1);
                      });
                }
                else
                {
                    defer.resolve(0);
                }
                return defer.promise;
            };
              
            this.getStep = function(idStep)
            {
               if(typeof(idStep)!=='undefined' && this.stepCache[idStep])
               {
                  return this.stepCache[idStep];
               }
               else
               {
                  if(!this.idQuestion)
                  {
                      window.pw.app.DEBUG && console.log("!!! ERROR: QuestionService: Calling getStep without defining idQuestion");
                  }
                  return new StepService({idQuestion: this.idQuestion, stepCache: this.stepCache});
               }   
            };
            
          };
          
          
          service.getQuestion = function(idQuestion)
          {
              if(typeof(idQuestion)!=='undefined' && questionCache[idQuestion])
              {
                  return questionCache[idQuestion];
              }
              else
              {
                  return new QuestionService();
              }              
          };
        
          service.listAttempts = function(idActivity)
          {
              var data = {idActivity: idActivity, idUser: Session.getUser().id};
              return $http.post('rest/attempt/list', data);             
          };
             
          service.registerCounter = function(counter)
          {              
                service.counter = counter;
          };
          
          return service;
  }]);
 
 }(window.pw.app));