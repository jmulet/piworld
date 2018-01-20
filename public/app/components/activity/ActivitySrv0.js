(function(app){
"use strict";
/**
 * Activity service allows to store the following data structure in db
 * for each of the activities/Attempts
 * 
 * for a given idActivity:
 * 
 * THIS IS AN OFFLINE SERVICE -> NO DATABASE INFO IS STORED!!!
 * IT RETURNS RAMDONLY GENERATED KEYS FOR ALL IDS!
 * 
 * Attempt: idAttempt
 *        ---> Question: idQuestion
 *                    --->Step: idStep
 *                              ---> RegisteredAnswer: idAnswer
 */  
   app.register.factory('ActivitySrv0', ['$state', '$http', '$interval', '$q', 'Session', 
      function($state, $http, $interval, $q, Session){
          
        var MAXLEVEL = 4;
        var MEMORY_CYCLES = 4;


        var randomId = function(){
                return Math.floor(Math.random()*1e10);
                
        };
          
        var service = {idActivity: 0, idAttempt: 0, counter: null, score: 0, name:'OFFLINE'};
          
         //Implements an offline version of the brain


            //Count [correct and incorrect instance for the current node and all their subchildren]
            var counter = function (node, c) {
                c = c || {Y: 0, N: 0};
                c.Y += node.Y;
                c.N += node.N;

                for (var key in node.children) {
                    var subnode = node.children[key];
                    counter(subnode, c);
                }
                return c;
            };


            var DataBrain = function () {
                this.data = {};     //Holds the structure category - performance

                //here simpleCategory cannot contain .
                var _getChild = function (parent, simpleCategory) {
                    var child = parent[simpleCategory];
                    if (!child) {
                        child = {CATG: simpleCategory, Y: 0, N: 0, LL: [], children: {}};
                        parent[simpleCategory] = child;
                    }
                    return child;
                };

                //Real complex category X.Y.Z, returns the innermost node and checks if all their subchilds are created
                this.getInnerChild = function (category) {
                    var list = category.split(".");
                    var mainCategory = list[0];
                    var mainChild = _getChild(this.data, mainCategory);
                    var current = mainChild;
                    for (var i = 1; i < list.length; i++) {
                        current = _getChild(current.children, list[i]);
                    }
                    return current;
                };

                var _toString = function (key, node, t) {
                    var str = "";
                    for (var i = 0; i < t; i++) {
                        str += "\t";
                    }
                    str += key + "[Y:" + node.Y + ", N:" + node.N + ", LL:" + node.LL + "]\n";

                    for (var ky in node.children) {
                        var nod = node.children[ky];
                        str += _toString(ky, nod, t + 1);
                    }
                    return str;
                };

                this.toString = function () {
                    var str = "";
                    var t = 0;
                    for (var key in this.data) {
                        var node = this.data[key];
                        str += _toString(key, node, t);
                    }

                    return str;
                };
            };




            var Brain = function ()
            {
                this.defaultLevel = 1;  //Used by untrained or undefined tags
                this.data = new DataBrain();     //Holds the structure category - performance

                this.register = function (idSubject, category, isCorrect) {
                    var fullcategory = idSubject + "." + (category || 'g').toUpperCase().trim();
                    //Modify this.data according to this new user input;

                    var obj = this.data.getInnerChild(fullcategory);
                    //console.log(isCorrect);
                    //console.log(obj);
                    if(isCorrect){
                        obj.Y += 1;
                    }else{
                        obj.N += 1;
                    }
                    //console.log(obj);
                };


                this.getLevelSimple = function (idSubject, category) {

                    var fullcategory = idSubject + "." + (category || 'g').toUpperCase().trim();

                    var innerChild = this.data.getInnerChild(fullcategory);
                    
                    //console.log(innerChild);

                    var counts = counter(innerChild);

                    var total = 1.0 * (counts.Y + counts.N);    //correct / incorrect
                    var sum = counts.Y;

                    var level = this.defaultLevel;

                    if (total)
                    {
                        level = MAXLEVEL * sum / (1.0 * total);
                        
                        //console.log("UNAVEGAGE LEVEL "+level);
                        
                        //Average this over the last Levels "LL" array
                        var num = 0;
                        var den = 0;
                        for (var i = 0; i < innerChild.LL.length; i++) {
                            num += i*i* innerChild.LL[i];
                            den += i*i;
                        }
                        var i = innerChild.LL.length + 1;
                        num += i*i * level;
                        den += i*i;

                        //Averaged level is
                        level = Math.round(num / (1.0 * den));
                       
                        //console.log("AVEGAGED LEVEL "+level);
                    }

                    //Register this level in the innerChild!
                    innerChild.LL.push(level);
                    if (innerChild.LL.length > MEMORY_CYCLES) {
                        innerChild.LL.splice(0, 1);
                    }

                    return level;
                };

                this.getLevel = function (idSubject, category)
                {

                    //From the trained brain we interpolate the performance for the required
                    //tags. Level is an scaled performance ranging from 0 - 4, i.e.
                    //From simple to harder levels.
                    category = category || "";
                    if (("" + category).indexOf(',') >= 0)
                    {
                        var self = this;
                        var sum = 0;
                        var count = 0;
                        jQuery.each( category.split(","), function(indx, c) {   //Take the mean of all these categories
                            if (c.trim()) {
                                sum += self.getLevelSimple(idSubject, c.trim());
                                count += 1;
                            }
                        });

                        return count > 0 ? Math.round(sum / (1.0 * count)) : this.defaultLevel;
                    }
                    else {
                        return this.getLevelSimple(idSubject, category);
                    }
                };


            };

            service.Brain = service.Brain || new Brain();

            service.Brain.suggestLevel = function (idSubject, category) {
                var defer = $q.defer();
                var l = service.Brain.getLevel(idSubject, category);
                defer.resolve({suggestedLevel: l});
                //console.log("Suggested level is "+l +" for "+idSubject+" "+category);
                return defer.promise;
            };

            
          
          /*
           * Creates an attempt for a given idActivity
           * Returns as a promise the idAttempt generated or -1 in case of error
           * 
           * Before creating a new attempt, tries to close the existing one
           */
          service.createAttempt = function(idActivity, idAssignment, level){
                    //window.pw.app.DEBUG && console.log("Creating attempt for idActivity "+idActivity);
                    var defer = $q.defer();
                    service.idActivity = idActivity;
                    if(service.idAttempt>0)
                    {
                        this.closeAttempt().then(function(){service.createAttempt(idActivity, idAssignment, level).then(
                                function(value){defer.resolve(value);
                        });});
                    }
                    else
                    {
                        
                        service.idAttempt = randomId();
                        defer.resolve(service.idAttempt);
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
             
                service.idAttempt = 0;
                if (redirectState)
                {
                    $state.go(redirectState);
                }
                
                var defer = $q.defer();
                defer.resolve(0);
             
                return defer.promise;
                                 
          };
          
          /*
           * Updates the attempt with freshly new information
           * Score and automatically sets endTime in database.
           */
         service.updateAttempt = function()
         {
                var defer = $q.defer();
                defer.resolve(1);             
                return defer.promise;
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
                 return this.i18nData.translations[key] || key || '';
             };
             
             this.put = function(key, value)
             {
                 this.i18nData.translations[key] = value;
             };
             
             this.theoryPath = this.i18nData.theoryPath || '';
         };
         
        
         /**
          * Loads the internationalization information for an activity
          * if id is set, use as idActivity, if not, use service.idActivity.
          */ 
        service.i18n = function(id){
              var defer = $q.defer();
              
                $http.post('/rest/activity/i18n', {idActivity: id || service.idActivity}).then(
                        function (r)
                        {

                            service.i18nInstance = new I18nProvider(r.data);
                            defer.resolve(service.i18nInstance);
                        }, function (err) {

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
                if(this.idQuestion>0 && this.idStep<=0)
                {                  
                          this.idStep = randomId();  
                          self.parent.stepCache[this.idStep] = self;   
                          defer.resolve(this.idStep);                 
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
                if(typeof(theory)==='undefined')
                {
                    theory = false;
                }
                  
                if(sol){
                      service.Brain.register(idSubject, catg, false);
                }
                var defer = $q.defer();
                if(this.idQuestion>0 && this.idStep>0)
                {
                   var seconds = ms || 0;
                   seconds = Math.floor(ms*0.001);
                   delete this.parent.stepCache[this.idStep];
                   this.idStep = 0; //reset
                   defer.resolve(1);
                  
                }
                else
                {
                    defer.resolve(0);
                }
                return defer.promise;
            };
            
              
            this.registerAnswer = function(userText, isValid, idSubject, idUser, catg){
                var defer = $q.defer();
                if(this.idQuestion>0 && this.idStep>0)
                {
                    var idAnswer = randomId();
                    defer.resolve(idAnswer);
                }
                else
                {
                    defer.resolve(0);
                }
                //Use the offline brain to store this answer
                service.Brain.register(idSubject, catg, isValid);
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
                if(this.idQuestion<=0)
                {                   
                    this.idQuestion = randomId();    
                    questionCache[this.idQuestion] = this;                  
                    defer.resolve(this.idQuestion);
                     
                }
                else
                {
                    defer.resolve(0);
                }
                return defer.promise;
            };
          
              
            this.close = function(ms){
                
                var defer = $q.defer();
                if(this.idQuestion>0)
                {
                  var seconds = ms || 0;
                  seconds = Math.floor(ms*0.001);
                  delete questionCache[this.idQuestion];
                  this.idQuestion = 0; //reset
                  defer.resolve(1);                 
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