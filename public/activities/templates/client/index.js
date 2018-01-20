    /*
     *  SET HERE THE RESOURCES TO BE PRELOADED
     *  It can preload images, text, json, js and css
     */
    
    (function(){
        pw.DEBUG = true;
        var idActivity = 180;   //VERY IMPORTANT; pass it to the bootstrap
        var app;                //this holds the app instance

        var preload = {
            quizz: "server!180/server-data.json",
            background: "/activities/162/background.jpg",
            soundRightAnswer: "/assets/sounds/0236.mp3",
            soundWrongAnswer: "/assets/sounds/0899.mp3",
            soundTimeout: "/assets/sounds/chat.mp3",
            soundGameOver: "/assets/sounds/alt02-answer_020sec.ogg",
            rateyo: "rateyo",
            rateyoCss: "css!/assets/libs/jquery/jquery.rateyo.min.css",
            jqd: "jquery-draggable",            
            baker: "/activities/libs/activity-bakejson.min.js",
            quizzDriver: "/activities/libs/activity-quizz.min.js",
            quizzDriverCss: "css!/activities/libs/activity-quizz.min.css",
            katexCss: "css!https://cdnjs.cloudflare.com/ajax/libs/KaTeX/0.8.2/katex.min.css",
            katexauto: "https://cdnjs.cloudflare.com/ajax/libs/KaTeX/0.8.2/contrib/auto-render.min.js"            
       };

        //Override these functions if you need
        var Application = pw.Application.prototype;
 

        Application.stages.play = function(defer, container){
            //The object pw.data.attempt and pw.data.attempt.idAttempt value are available here.
            //Please provide the values pw.data.attempt.finished=boolean; pw.data.attempt.score=integer and pw.data.attempt.level=integer
             
            var options = {
                shuffleOptions: true,
                maxAttempts: 2,
                rightScore: 20,
                canSkipWrongQuestions: true
            };
            pw.log(pw.urlVars);
            
            if(pw.urlVars.test){
                console.log("Setting to test game mode");
                options.game = "all";
            }
            
            var rawQuizz = app.data.bootstrap.quizz;
            pw.log("RAW:",rawQuizz);
            
            //Pre-process questions
            var backedJSON = [];
            try {
               backedJSON = pw.BakeJson(rawQuizz, app.data.quizzDeps, pw.getUser().id);
            } catch(Ex){
               console.log(Ex);
            }
            pw.log("BACKED:",backedJSON);
            
            new pw.SimpleQuizz(defer, container, backedJSON, options);
            
        };

        $(document).ready(function(){
            pw.log("Document ready");
            app = new pw.Application(idActivity, preload);
            pw.log("Application", app);
            app.bootstrap();
        });
    

    }());