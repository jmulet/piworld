 //The activity must be assigned in order to play a kahoot, so idAssignment>0
 //Check to which students is assigned... and notify them with a kahoot-call, in order them to join to game
 //I need a real ID

 window.pw.app.register.controller("KahootCtrl", ["$scope", "$state", "$transition$", "Session", "$http", "$q", "$interval", "$timeout", "$filter", "Idle",
     function($scope, $state, $transition$, Session, $http, $q, $interval, $timeout, $filter, Idle){
     
    var Socket = Session.getSocket(); 
     
    $scope.joined = [];
    $scope.cjoined = [];
    $scope.bg = "kahoot-wait";
    $scope.rate = 0;
    var QP = $scope.$parent.QP;    
    QP.config.kahootPlayMusic = 0;
    QP.config.canAskTheory = false;
    $scope.config = QP.config;
    $scope.QP = QP;
    $scope.firstButtonDisabled = true;
    $scope.kahoot = {pgbar:0};
    
    var QUESTION_SCORE = 10;
    
    //Try to initialize QuestionProvider here!
        var success0 = function(){    
            
             $scope.ldatabase = [];
                if(QP.database){
                    jQuery.each(QP.database, function(kk, e){
                        $scope.ldatabase.push($scope.evaluateScope(e));
                    });
                }
       
       
            //console.log("SETSCOPE IS RESOLVED AND CALLED SUCCESS FUNC");
            if(QP._generatedQuestions.length===0)
            {
                    $scope.question = "Upps! This activity does not contain any questions :-(";
                    $scope.done = true;
                    return;
            }
            $scope.firstButtonDisabled = false;
            console.log("Resolved activity ", QP);
        };

        var error0 = function(){
             $scope.question = "Upps! There is a problem resolving this activity :-(";
             $scope.done = true;
        };

        QP.setIds($scope.idActivity, $transition$.params().idAssignment, Session.getCurrentGroup().idGroup, Session.getCurrentGroup().idSubject, Session.getUser().id);
        QP.setScope($scope).then(success0, error0);
    
    
    
    var nvaloracions = 0;
    var totalStars = 0;
    
    //Evita timeouts durant una partida de kahoot
    var timer = $interval(function(){
        Idle.watch();
    }, 180000);

    $scope.vars = {loading: true};
    var sounds = [{id:"music1", src:"lobby-classic-game.ogg"},
         {id:"answer30", src:"answer_30sec.ogg"},
         {id:"answer20", src:"answer_20sec.ogg"},
         {id:"answered", src:"player_answered_2.ogg"}];
     
    var loaded = 0;
          
    function handleFileLoad(event) {
       loaded += 1;
       $timeout(function(){
           $scope.vars.loading = (loaded < sounds.length);
           if(!$scope.vars.loading){
                createjs.Sound.play("music1", {loop: -1});
           }
           console.log("Loading "+$scope.vars.loading);
       });       
    };
    createjs.Sound.addEventListener("fileload", handleFileLoad);
    
    var timer, readyTimer;
    
    $scope.state = {WAITING: 'WAITING', PLAYING: 'PLAYING', STATISTICS: 'STATISTICS', END: 'END', CONFIG: 'CONFIG'};
    $scope.status = $scope.state.CONFIG;
    
    //Treu el jugador a del joc
    $scope.reject = function(a){
        var pos = $scope.joined.indexOf(a);
        if(pos>=0){
            $scope.joined.splice(pos, 1);
            Socket.emit("kahoot-setend", a);
        }
    };
    
    $scope.waiting = function(){        
        //Initialize kahoot here!
        if(QP.config.kahootPlayMusic){
            createjs.Sound.registerSounds(sounds, "assets/sounds/");
        } else {
            $scope.vars.loading = false;
        }
    
        $http.post("/rest/kahoot/ini", {idActivity: $transition$.params().idActivity, idAssignment: $transition$.params().idAssignment, teacher: Session.getUser().id, idGroup: $transition$.params().idGroup}).then(function(r){       
        $scope.kahootID = r.data.kahootID;
        console.log( $scope.kahootID);
        if($scope.kahootID>0){
            console.log("Emitting ini");
            Socket.emit("kahoot-ini", {kahootID: $scope.kahootID, idActivity: $transition$.params().idActivity, idAssignment: $transition$.params().idAssignment, teacher: Session.getUser().id});                        
        }
    });
        
        $scope.status=$scope.state.WAITING;       
    };
          
    $scope.start = function(){
        createjs.Sound.stop();
        $scope.bg = "";
        if($scope.kahootID<=0 || $scope.joined.length<1){
            return;
        }
        console.log("start");
         
        //console.log("SETSCOPE IS RESOLVED AND CALLED SUCCESS FUNC");
        if(QP._generatedQuestions.length===0)
        {
            $scope.question = "Upps! This activity does not contain any questions :-(";
            $scope.done = true;
            return;
        }

        Socket.emit("kahoot-setready", {kahootID: $scope.kahootID});
        $scope.feedback = "";
        $scope.plotdiv = "";
        $scope.done = false;


        QP.createAttempt().then(function() {
            $scope.next();
        });
           
    
    };
    
    var activityFinished = function(){
        $scope.status = $scope.state.END;
        Socket.emit("kahoot-setsurvey", {kahootID: $scope.kahootID});
        $scope.cjoined = angular.copy($scope.joined);
        createjs.Sound.stop();
    };
 
    $scope.next = function (idx) {
            $scope.answers = [];
            $scope.status = $scope.state.PLAYING;
            $scope.helpVisible = false;
            $scope.theoryVisible = false;

            if ( (idx == null && !QP.hasNext()) || QP.counters.doneQ > $scope.config.totalQ)
            {
                activityFinished();
                return;
            }
            $scope.kahoot.pgbar = 0;
            jQuery("#readyLoader").css("visibility", "visible");
            
            Socket.emit("kahoot-setready", {kahootID: $scope.kahootID, teacher: Session.getUser().id});
    
            QP.create(idx).then(
                    function (qdef) {
                        console.log("CREATE HAS BEEN RESOLVED");
                        console.log(qdef);
                        //$scope.userinput = qdef.userinput;
                        $scope.questionof = QP.counters.doneQ + " / " + $scope.config.totalQ;
                        $scope.question = qdef.parentQuestion.headingHTML;
                        $scope.subquestion = qdef.formulationHTML;
                        $scope.views = qdef.views;
                        $scope.inputdiv = qdef.inputdiv;
                        $scope.stepHistory = qdef.parentQuestion.getStepHistory();
                        $scope.isMultiStep = qdef.parentQuestion._registeredSteps.length > 1;
                        $scope.done = true; //QP._currentQuestion.isDone;                        //Problem, never set QP.question.done until checked!!!
                        QP.config.level = qdef.parentQuestion.level;
                        $scope.$parent.questionWeight = qdef.addScore;
                        
                        //Must send a summary of this question to the rest of clients
                        var summary = {question: $scope.question, subquestion: $scope.subquestion, inputdiv: $scope.inputdiv, userinput: $scope.userinput};
                        if($scope.options){
                            summary.options = $scope.options;                            
                        }
                        console.log("emitting kahoot-setquestion");
                        console.log(summary);
                        Socket.emit("kahoot-setquestion", {question: summary, kahootID: $scope.kahootID});
                        
                        if(QP.config.kahootPlayMusic){
                            createjs.Sound.play("answer30", {loop: -1});
                        }
                        
                        $scope.answerOptions = angular.copy(qdef.parentQuestion.expr.options);
                        jQuery.each($scope.answerOptions, function(kk, ao){
                           ao.count = 0; 
                        });
                        
                        $scope.remains = qdef.parentQuestion.expr.timeout || QP.config.timeout || 60;
                        
                        
                        var fn = function(){
                            $scope.kahoot.pgbar += 10;
                            
                            if($scope.kahoot.pgbar>100){
                                $interval.cancel(readyTimer);
                                jQuery("#readyLoader").css("visibility", "hidden");
                                $scope.kahoot.pgbar = 0;
                            
                                timer = $interval(function(){
                                    $scope.remains -= 1;
                                    if($scope.remains <= 0){
                                        //S'ha exhaurit els temps
                                        $interval.cancel(timer);
                                        timer = null;
                                        Socket.emit("kahoot-settimeout", {kahootID: $scope.kahootID});
                                        $scope.check();
                                    }
                                }, 1000);
                            }

                        };
     
                        readyTimer = $interval(fn, 200);
    
                        window.pw.app.DEBUG && console.log("Step history is " + $scope.stepHistory.length);
                    },
                    function () {
                        //Done! it has been rejected
                        activityFinished();
                    });
    };

    $scope.check = function () {
            $scope.done = true;
            createjs.Sound.stop();
            if(QP.config.kahootPlayMusic){
                createjs.Sound.play("answered");
            }

            if(timer){
                $interval.cancel(timer);
                timer = null;
            }
            //Must check all $scope.answers
            var ps = [];  //hold all promise tasks which are processed in series
            
            
            jQuery.each($scope.answers, function(i, e){
                 
                console.log("e.answer", e.answer);
                    
                jQuery.each($scope.answerOptions, function(kk, ao){
                       console.log("ao.text", ao.text);
                       if(ao.text===e.answer){
                           ao.count += 1;
                           return true;
                       } 
                });
                
               var task = function(){
                    var q = $q.defer();
                    QP.check(e.answer).then(function(valid) {
                            
                    console.log("HE corregit");
                    console.log(e.answer);
                    console.log("i he trobat ");
                    console.log(valid);
                    $scope.done = true;
                    e.valid = valid;
                    e.valid.score = valid.valid? Math.floor(QUESTION_SCORE*Math.sqrt(Math.abs(e.rtime))) : 0;     
                    e.rightAnswer = QP._currentQuestion.getCurrentStep().answerHTML;
                    e.category = QP._currentQuestion.category || 'g';
                    e.userAnswer = QP._currentQuestion.getCurrentStep().getUserinputHTML(e.answer);
                    q.resolve(valid);
                    }, function () {
                        $scope.done = true;
                        q.reject();
                    });                
                    return q.promise;
               };
               
                
                ps.push(task);
            });
          
          console.log("answeroptions", $scope.answerOptions);
          
          //Emit all answers corrected to the players
           $q.serial(ps).then(function(){
              console.log($scope.answers);
                $scope.status = $scope.state.STATISTICS;
                $scope.title = $filter('translate')('RIGHTANSWER');
                $scope.msg = QP._currentQuestion.getCurrentStep().answerHTML;
                $scope.msg += "<br> "+$scope.answers.length+" respostes <br>";
                var count = 0;
                jQuery.each($scope.answers, function(i,e){
                if(e.valid.valid){
                    count += 1;
                    } 
                });
                if($scope.answers.length){
                    $scope.msg += "<br> "+parseFloat(count*100/$scope.answers.length).toFixed(1)+"% correctes <br>";
                }
                
                //compute total score to the joined students
                jQuery.each($scope.joined, function(i, e){
                    jQuery.each($scope.answers, function(j, a){
                        if(e.id === a.idUser){
                            e.score += a.valid.score;
                            e.valid = a.valid.valid;
                            return true;
                        }
                    });                    
                });
                
                //Sort joined students by score from top to bottom
                $scope.joined.sort(function(a, b){
                    return b.score - a.score;
                });
                
                //Tell every answer which position is she
                jQuery.each($scope.answers, function (j, a) {
                    jQuery.each($scope.joined, function (i, e) { 
                        if (e.id === a.idUser) {
                            a.valid.position = i+1;  
                            e.userAnswer = a.userAnswer || "";                            
                        }                        
                    });
                });                    
                
                console.log($scope.joined);
                Socket.emit("kahoot-corrections", $scope.answers);
          });
    };
 
    $scope.continue = function(){
          createjs.Sound.stop();
          QP.closeStep().then(function () {
                    QP.counters.doneQ += 1;
                    $scope.done = true;
                    $scope.next();  
           });
    };
 
    
    $scope.skip = function(){  
            $scope.done = true;
            createjs.Sound.stop();
            if(QP.config.kahootPlayMusic){
                createjs.Sound.play("answered");
            }

            if(timer){
                $interval.cancel(timer);
                timer = null;
            }        
         $scope.next();
    };
  
            
    Socket.on("kahoot-joined", function(d){
        console.log("JOINED");
        console.log(d);
        
            //check if already there, then remove it and add it 
             jQuery.each($scope.joined, function(i, e){
                 console.log(e);
                if(e.id === d.user.id){
                    $scope.joined.splice(i, 1);
                    return true;
                }
            });
            d.user.score = 0;
            d.user.fullname = $scope.shortenName(d.user.fullname);
            $scope.joined.push(d.user);
       
    });
    
    
    Socket.on("kahoot-answer", function(d){
        console.log("Master has recieved one answer of a user ");        
        console.log(d);        
             //Check if this user already submitted an answer
            jQuery.each($scope.answers, function(i, e){
                if(e.idUser===d.idUser){
                    $scope.answers.splice(i, 1);
                    return true;
                }
            });
            //Add relative timestamp to the answer as recieved
            var total = QP.config.timeout || 60;
            d.rtime = $scope.remains/total;
            d.seconds = total - $scope.remains;          
            $scope.answers.push(d);        
            if($scope.answers.length >= $scope.joined.length){                
                //Everybody has answered
                $scope.check();
            }
             
    });
    
    Socket.on("kahoot-left", function(d){
        console.log("Somebody left kahoot");
        console.log(d);
        
        if(d.rating){
            nvaloracions += 1;
            totalStars += d.rating;
            $scope.meanRating = totalStars / nvaloracions;
        }
        
             jQuery.each($scope.joined, function(i, e){
                if(e.id === d.user.id){
                    $scope.joined.splice(i, 1);
                    return true;
                }
            });
           
    });
    
    $scope.home = function(){
        $state.go('home');
    };
    
    $scope.review = function(){
        $state.go('home.activity.kahootreport', {idActivity: $transition$.params().idActivity, idAssignment: $transition$.params().idAssignment, idGroup: $transition$.params().idGroup});
    };
    
    $scope.setTimeout = function(){
        if(timer){
            $interval.cancel(timer);
            timer = null;      
            Socket.emit("kahoot-settimeout", {kahootID: $scope.kahootID});
        }
        $scope.check();
        
    };
    
     $scope.evaluateScope = function(expr){       
         var expr_eval = angular.copy(expr);
            //Check if scope must be evaluated-------------
            if(expr.scope){
               var context = window.evaluator.parse(expr.scope);
               expr_eval.formulation = window.evaluator.parse(expr.formulation, context);
               if(expr.hints){ expr_eval.hints = window.evaluator.parse(expr.hints, context); }
               if(expr.answer){ expr_eval.answer= window.evaluator.parse(expr.answer, context); }
               if(expr.options){
                  for(var i=0; i<expr.options.length; i++){
                         expr_eval.options[i].text = window.evaluator.parse(expr.options[i].text, context);
                  }
               }
            }  
            return expr_eval;
        };
    
    
    $scope.shortenName = function(name){
        var n = name;
        if(name.indexOf(","));
        {
            var list = name.split(",");
            if(list.length === 2){
                n = list[1].trim();
                var ipp = n.indexOf("(");
                if(ipp>=0){
                    n = n.substring(0, ipp);
                }
                n = n + " ";
                
                var nf = list[0].indexOf(" ");
                if(nf<=0){
                    nf=list[0].length;
                }
                n+= list[0].substring(0, nf);
            }
        }
        return n;
    };
    
   //Close kahoot - does not work on page reload
   $scope.$on("$destroy", function(){
       createjs.Sound.removeEventListener("fileload", handleFileLoad);
       createjs.Sound.stop();
       if(timer){
           $interval.cancel(timer);
       }
       
       //Treu tots els jugadors d'aquest kahoot
       Socket.emit("kahoot-setend", {kahootID: $scope.kahootID, teacher: Session.getUser().id});
       
       console.log("Destroying and closing kahoot");
       $http.post("/rest/kahoot/close", {kahootID: $scope.kahootID}).then(
               function(r){
                  console.log(r.data);
       });
   });       
        
}]);