 //The activity must be assigned in order to play a kahoot, so idAssignment>0
 //Check to which students is assigned... and notify them with a kahoot-call, in order them to join to game
 //I need a real ID
 
 window.pw.app.register.controller("KahootItCtrl", ["$scope", "$state", "$transition$", "Session", "$http", "$interval", "Idle", "USER_ROLES", "Socket", "$timeout", 
     function($scope, $state, $transition$, Session, $http, $interval, Idle, USER_ROLES, Socket, $timeout){
     
    Session.getHomeService(); //just to initialize in case of page reload;
    
    $scope.states = {START: 'START', READY: 'READY', PLAYING: 'PLAYING', WAITING: 'WAITING', FINISH: 'FINISH', FEEDBACK: 'FEEDBACK'};
    var id = $transition$.params().kahootId? parseInt($transition$.params().kahootId) : "";
    $scope.kahoot = {id: id, connected: false, status: $scope.states.START, pgbar: 0};
    $scope.randomQuote = "";
    var timer, readyTimer, idleTimer, mustPLAY;
    
    var user = Session.getUser();
    $scope.rate = 5;
    
        
    $scope.join = function(){
        console.log("Emit kahoot-join "+ $scope.kahoot.id);
        
        var kahootAcknowl = function(d){
             console.log("Kahoot connection has been ....");
            console.log(d);
             $scope.teacher = d.teacher;
            $scope.idAttempt = d.idAttempt;
            $scope.idActivity = d.idActivity;
            if(d.accept){
                $scope.kahoot.connected = true;
                $scope.kahoot.status = $scope.states.START;
                $scope.err = null;           
            } else {
                $scope.err = d.msg || "Invalid kahoot";
            }
        
            if(d.accept){

                    var fn = function(){
                        $http.post('/rest/oftheday/quote').then(function(r){
                           $scope.randomQuote = r.data; 
                        });
                    };
                    timer = $interval(fn, 30000);
                    fn();

            }
        };
        
        Socket.emit("kahoot-join", {user: user, kahootID: $scope.kahoot.id}, kahootAcknowl);
    };
    
    //Socket.on("kahoot-accept", kahootAcknowl);
      
    Socket.on("kahoot-ready", function(d){
        console.log("Kahoot is about to start");
        console.log(d);
        if(timer){
            $interval.cancel(timer);
        }
        mustPLAY = false;
        
        $scope.kahoot.status = $scope.states.PLAYING;
        jQuery("#readyLoader").css("visibility", "visible");
        
        
        var fn = function(){
            $scope.kahoot.pgbar += $scope.kahoot.pgbar<100? 10: 0;
            if(mustPLAY && $scope.kahoot.pgbar===100){                
                $interval.cancel(readyTimer);
                jQuery("#readyLoader").css("visibility", "hidden");   
                $scope.kahoot.pgbar = 0;
                readyTimer = null;
            }
        };
        
        $scope.kahoot.pgbar = 0;
        readyTimer = $interval(fn, 200, 10);
    });
    
    Socket.on("kahoot-question", function(d){
        console.log("Kahoot has raised this question");
        console.log(d);
             
            $scope.qdef = d;
            $scope.userinput = d.userinput || "";
            $scope.options = d.options;  
            
            //This is a kahoot input 
            if(d.inputdiv.indexOf("im-kahoot-input")>0){
                $scope.userinput = function(pos){                                        
                    $scope.sendAnswer($scope.options[pos]);
                };
                $scope.sendButton = false;
            } else {
                $scope.sendButton = true;
            }
             
            $scope.defaultAnswer = angular.copy($scope.userinput);
            mustPLAY = true;        
            
    });
    
    Socket.on("kahoot-timeout", function(d){
        console.log("Kahoot question timeout");
        console.log(d);
             $scope.kahoot.status = $scope.states.FEEDBACK;
            $scope.feedback = {valid: false, feedback: "S'ha exhaurit el temps."};
       
    });
    
    Socket.on("kahoot-feedback", function(d){
        console.log("Kahoot has checked your answer");
        console.log(d);
              $scope.kahoot.status = $scope.states.FEEDBACK;
            $scope.feedback = d;
      
    });
    
    Socket.on("kahoot-goend", function(d){
        console.log("kahoot go end ", d);
             if(timer){
               $interval.cancel(timer);
            }
            if(idleTimer){
                $interval.cancel(idleTimer);
            }
            console.log("me treu del joc");
            $scope.kahoot.id = "";
            $scope.kahoot.err = null;
            $scope.kahoot.connected = false;
            $scope.kahoot.status = $scope.states.START;  
            
            $scope.err = null;            
            $scope.teacher = null;                   
        
    });
    
    Socket.on("kahoot-gosurvey", function(d){
             if(timer){
               $interval.cancel(timer);
            } 
            $scope.kahoot.status = $scope.states.FINISH;              
        
    });
   
   $scope.sendAnswer = function(value){
       console.log("sending answer");
       console.log($scope.userinput);
       Socket.emit("kahoot-setanswer", {idUser: user.id, kahootID: $scope.kahoot.id, answer: value || $scope.userinput, idAttempt: $scope.idAttempt, qdef: $scope.qdef});
       $scope.kahoot.status = $scope.states.WAITING;
   };
   
    
   $scope.modifyAnswer = function(){
       console.log("modifying the answer");
       $scope.kahoot.status = $scope.states.PLAYING;
       $scope.userinput = angular.copy($scope.defaultAnswer);
   };
   
   $scope.finish = function(){
       $state.go("home");
   };
   
   $scope.$on("$destroy", function(){
        console.log("destroyed", $scope.rate);
        Socket.emit("kahoot-leave", {user: user, kahootID: $scope.kahoot.id, idAttempt: $scope.idAttempt, idActivity: $scope.idActivity, rating: $scope.rate});
        if(timer){
           $interval.cancel(timer);
       }
       if(idleTimer){
           $interval.cancel(idleTimer);
       }
        $scope.kahoot.id = "";
        $scope.kahoot.connected = false;
        $scope.kahoot.status = $scope.states.START;  

        $scope.err = null;            
        $scope.teacher = null;        
   });       
    
      
   if($scope.kahoot.id){
       $scope.join();       
   }      
   
   
   //Evita timeouts durant una partida de kahoot
    if(user.idRole!==USER_ROLES.guest){
        var idleTimer = $interval(function(){
            Idle.watch();
        }, 180000);
    }
  
        
}]);

 