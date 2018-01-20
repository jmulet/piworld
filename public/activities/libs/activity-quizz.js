/*
 
 listOfquestions has the following structure
 
"formulation": "En l'arrel $\\sqrt[n]{a}$,  el nombre <i>n</i> s'anomena",
"subformulation": "We can define here blanks $?^2 = ?+4$",
"type": "multiple", 
"format": "kahoot",  //numeric  //sqrt, power

"scope": "",
"timeout": 60,
"repeat": 1,

"answer": "",
"options": [
        {
                "text": "exponent",
                "valid": false
        },
        {
                "text": "radicand",
                "valid": false
        },
        {
                "text": "índex",
                "valid": true
        },
        {
                "text": "base",
                "valid": false
        }
],
"hints": "",
"feedback": "",
"timeout": 60,
"scoreWeight": 2,
"extraLive": 1,
"maxAttempts": 2,
"forbiddenSymbols": ["\\cdot", "\\frac", "^"],
"check": "function(){}",
"checkOpts": {"simplified": true}       //Require that the expression is simplified
"validate": "function(){}"
  
 
 FIELDS 
       * type: input / multiple / blanks / mathinput
               * input: uses a simple textfield  -- It requires "answer"
               * multiple: Depending on "format": will display "options" like radio, checkbox, kahoot (default)  -- It requires "options"
               * blanks: It requires of "subformulation" where blanks are defined... It also requires a list of answers=["","",""]; one for each blank
               * mathinput: It requires answer as string "". It will compare against KAS.
               * mathquill: Simplified mathinput without touch panel
       
       * scope: Write normal js "a=Math.random()*10; b=Math.pow(a,3); c='Hello world'"
                This scope will be interpolated in every string; e.g. in formulation="${c} reads ${a-b}" will be interpolated as "Hello world reads -23.235235225325".

       * options: It is only required for type multiple. Key "valid" will be interpolated if is an string; remember to return a boolean.
 
       * scoreWeight: The factor by which the score must be accounted for
       
       * extraLive: If the question is answered right in the first place, it adds n lives 
 */

/*
 * Depending on question type / format this module will load a different question-renderer
 * The public interface of a question-renderer is
 * 
 *      constructor (question)
 *      render()
 *      check()
 *      
 */

(function(){

    var pw = window.pw || {};


    pw.QuestionPanel = function(container, TopBar, options){
            var that = this;
            this.container = container;
            this.rest = container.rest;
            this.data = container.data;
            this.attempt = container.data.attempt;
            this.TopBar = TopBar;
            this.options = options;
            this.id = Math.random().toString(36).substr(2);            
            
            var template = '<div><div class="container-fluid"><div id="questionContainer'+this.id+'" class="row"></div><center>';
            if(options.showCheckBtn){
                template += '<button class="btn btn-warning glyphicon glyphicon-question-blackboard" style="display:none"><span>'+pw.getI18n("HINTS")+'</span></button><button id="checkBtn'+this.id+'" class="btn btn-primary glyphicon glyphicon-question-mark"><span>'+pw.getI18n("CHECK")+'</span></button>';
            }
            template += '<div id="squizzFeedback'+this.id+'" style="display:none"></div></center></div></center></div>';
            
            this.questionPanel = $(template);
            
            this.container.append(this.questionPanel);
            
            this.questionTag = this.questionPanel.find("#questionContainer"+this.id);                      
             
            this.hintsButton = this.questionPanel.find(".btn.btn-warning");
            this.checkButton = this.questionPanel.find("#checkBtn"+this.id);   
            
            if(this.checkButton[0]){
                    this.checkButton.on("click", function(evt){
                        that.checkButton.prop("disabled", true);
                        that.check();
                    });
            }
            
            this.feedbackPanel = this.questionPanel.find("#squizzFeedback"+this.id);
                        
    };
    
    pw.QuestionPanel.prototype = {
        appendButton: function(btn){
            btn.insertBefore('#squizzFeedback'+this.id);
        },
    
        setQuestion: function(q){                  
            var that = this;
            this.question = q;       
            
            if(q.hint || q.hints){
                that.hintsButton.show();
                that.hintsButton.off();
                that.hintsButton.on("click", function(){                    
                    that.feedbackPanel.html(q.hint || q.hints);
                    that.feedbackPanel.show();
                    q.askHelp = true;
                }); 
            }
            
            this.createRenderer().then(function(r){
                that.renderQuestion(q);
            });
        },
    
        //Renders are lazy created because defer requirejs
        createRenderer: function(){
                var defer = new $.Deferred();
                var that = this;
                var q = this.question;
                if(!q){
                    console.log("Upps!! question is not defined");
                    defer.reject();
                    return defer.promise();
                }
                if(q.options && (this.options.shuffleOptions || q.shuffleOptions) ){
                  q.options.shuffle();
                } 
                
                var dependencies = [];
                
                if(q.type.trim().toLowerCase()==="multiple"){                    
                    dependencies.push("/activities/libs/quizzrenderer-"+ (q.format || "kahoot")+".js" );                     
                } else {
                    if(q.type.indexOf(".js")<0){
                        dependencies.push("/activities/libs/quizzrenderer-" + (q.type || "input") + ".js" );                     
                    } else {
                        dependencies.push(q.type);                     
                    }
                }
                if(q.deps){
                    dependencies = $.merge(dependencies, q.deps);
                }
            
                require(dependencies, function(RendererClazz){
                        if(that.renderer){
                            that.renderer.destroy();
                        }
                        that.renderer = new RendererClazz(q, that.questionTag, that.checkButton);
                        defer.resolve(that.renderer);
                }, function(Ex){
                    console.log("Unable to resolve dependencies ", dependencies, Ex);
                    defer.reject();
                });
            
                return defer.promise();
        },

        feedback: function(text, color){
             this.feedbackPanel.show();
             if(color){
                 
                 text = '<h4 style="color:'+color+';">'+text+"</h4>";
                  
             } else {

                    var q = this.question;
                    if(text){
                         if(!q.valid){
                            text ='<h4 style="color:red;">'+text+"</h4>";
                         } else {
                             text = '<h4 style="color:green;">'+text+"</h4>";
                         }
                    }
                    else {
                        if(!q.valid){
                            text = '<h4 style="color:red;">'+pw.getI18n("WRONG_ANSWER")+"</h4>";
                            var feedback = this.question.feedback;
                            if(feedback){
                                text += "<div>"+feedback+"</div>";                       
                            }
                            text += "<div>"+pw.getI18n("THE_ANSWER")+" "+this.renderer.getRightAnswer()+"</div>";
                        } else {
                            text = '<h4 style="color:green;">'+pw.getI18n("RIGHT_ANSWER")+"</h4>";
                        }                       
                    }
              }            
             this.feedbackPanel.html(text);
        },
        
        
        renderQuestion: function(q){
            pw.Sound.stop();
            var that = this;
            
            q = q || this.question;
            $(".side-widgets").remove();
            var vpos = 62;
            if(q.scoreWeight>1){
                var tmpl = '<div class="side-widgets blink" style="float:left; left: 10px; top: '+vpos+'px; width:100px;"><span class="picoin"></span> <span class="lcd"> x'+q.scoreWeight+'</span></div>';
                vpos += 45;
                this.questionPanel.append(tmpl);
            }
            if(q.extraLive>0){
                var tmpl = '<div class="side-widgets blink" style="float:left; left: 10px; top: '+vpos+'px; width:100px;"><img height="40px" src="/assets/img/avatar/'+(pw.getUser().uopts.avatar || 0)+'.png"/> <span class="lcd"> + '+q.extraLive+'</span></div>';
                vpos += 45;
                this.questionPanel.append(tmpl);
            }
            if(q.timeout){
                var tmpl = '<div class="side-widgets" style="float:left; left: 10px; top: '+vpos+'px; width:100px;"> <img src="/assets/img/hourglass.gif" height="40px"/> <span id="settimeout" class="lcd">'+q.timeout+'</div>';
                vpos += 45;
                this.questionPanel.append(tmpl);
            }
            
        
            if(typeof(q.idQuestion)==='undefined'){
                
                q.seconds = 0;
                q.attempts = 0;
                q.askHelp = false;
                q.askTheory = false;
                q.askAnswer = false;
              
                if(that.rest){             
                    that.rest.openQuestion(this.attempt.idAttempt, q.formulation +"<br>" + (q.subformulation || ""),
                        this.renderer.getRightAnswer(), q.category || that.data.activityInfo.category || "", q.level).then(function(data){
                        q.idQuestion = data.idQuestion;
                        
                        //At least render math in these two items.... Make sure to call it after rest insert.
                        q.formulation = pw.katexParser(q.formulation);
                        if(q.type!=="blanks"){
                            q.subformulation = pw.katexParser(q.subformulation); //Never pre-parse sub-formulation for blanks
                        }
                          
                        that.renderer.render();
                        that.checkButton && that.checkButton.prop("disabled", false);
                        pw.autoRender && pw.autoRender(that.questionPanel);
                        that.lastTime = new Date().getTime();
                        if(q.timeout){
                            that.timeoutInterval = setInterval(function(){
                                if(q.timeout > 0){
                                    q.timeout -= 1;
                                    $("span#settimeout.lcd").text(q.timeout); 
                                    if(q.timeout===10){
                                        $("span#settimeout.lcd").css({color: "red"});
                                        $("span#settimeout.lcd").addClass("blink");
                                    }
                                } else {                                    
                                    clearInterval(that.timeoutInterval);
                                    that.checkButton && that.checkButton.prop("disabled", "true");
                                    $(".side-widgets").remove();
                                    that.renderer.enable(false);
                                    //S'ha acabat el temps
                                     q.ownscore = 0;
                                     q.closed = true;
                                     that.feedback(pw.getI18n("TIME_OVER"));
                                     that.rest && that.rest.closeQuestion( q.idQuestion, q.seconds, q.ownscore, q.askTheory, q.askHelp, q.askAnswer);
                                     that.onWrongAttempt && that.onWrongAttempt();                      
                                }
                            }, 1000);
                        }
                    });       
                }
                else {
                     that.renderer.render();
                     that.checkButton && that.checkButton.prop("disabled", false);
                     pw.autoRender && pw.autoRender(that.questionPanel);
                }
            } else {
                   this.renderer.render();
                   this.checkButton && this.checkButton.prop("disabled", false);
                   pw.autoRender && pw.autoRender(that.questionPanel);
            }
           
        },
        getValue: function(){
            this.renderer.enable(false);
            return this.renderer.getValue();   
        },
        check: function(){
                //Before check; make sure the rederer validates the user answer
                var errMsg = this.renderer.validate();
                if(errMsg){
                    pw.GenericModal.show(pw.getI18n("INVALID_INPUT"), errMsg, 10000);                         
                    //Enable button
                    //that.renderer.enable(true);
                    this.checkButton && this.checkButton.prop("disabled", false);
                    return;
                }
            
                var that = this;
                var q = this.question;
                q.attempts += 1;
                var now = new Date().getTime();
                q.seconds += Math.floor((now - this.lastTime) / 1000.);
                this.lastTime = now;        
                
                this.renderer.enable(false);
                var userinput = this.renderer.getValue();      
             
                
                var revealAnswer = function(){
                    $(".side-widgets").remove();
                };
                        
                var doCheck= function(valid, msg){
                    
                        that.rest && that.rest.addAnswer(q.idQuestion, userinput, valid);

                        if (valid){
                                that.timeoutInterval && clearInterval(that.timeoutInterval);
                                q.valid = true;
                                that.renderer.revealAnswer();
                                //revealAnswer(true);
                                q.scoreWeight = q.scoreWeight || 1;
                                q.ownscore = Math.floor((q.score || that.options.rightScore)*q.scoreWeight);
                                if(q.attempts>1){
                                    q.ownscore = Math.floor(q.ownscore * that.options.wrongAttemptPenalty);
                                } else {
                                    if(q.extraLive>0){
                                        that.TopBar && that.TopBar.addLives(q.extraLive);
                                    }
                                }

                                q.closed = true;
                                that.feedback(pw.getI18n("RIGHT_ANSWER"));    
                                that.rest && that.rest.closeQuestion( q.idQuestion, q.seconds, q.ownscore, q.askTheory, q.askHelp, q.askAnswer);

                                that.onRightAnswer && that.onRightAnswer();
                        } 
                        else {

                                if (q.attempts >= (q.maxAttempts || that.options.maxAttempts)){
                                        that.timeoutInterval && clearInterval(that.timeoutInterval);
                                        q.ownscore = 0;
                                        q.closed = true;
                                        revealAnswer(that);
                                        that.feedback();
                                        that.rest && that.rest.closeQuestion( q.idQuestion, q.seconds, q.ownscore, q.askTheory, q.askHelp, q.askAnswer);
                                        that.onWrongAttempt && that.onWrongAttempt();                      
                                } 
                                else {
                                     that.feedback(pw.getI18n("WRONG_ANSWER")+"<br>"+pw.getI18n("TRY_AGAIN")+"<br><p>"+msg+"</p>");
                                     that.renderer.enable(true);
                                     that.checkButton && that.checkButton.prop("disabled", false);
                                     that.onWrongAnswer && that.onWrongAnswer();
                                }
                                pw.Sound.play("soundWrongAnswer"); 
                        }

                        pw.autoRender && pw.autoRender(that.questionPanel);
                };
                
                   
                //Now the function check can return a boolean or a promise   
                //This supports server-based checking
                var valid = this.renderer.check();
                
                if(typeof(valid)==="boolean"){
                    //Basic check
                    doCheck(valid, "");
                }
                else if(valid.then){
                    //Is a promise
                    valid.then(function(resolved){
                        doCheck(resolved.ok, resolved.msg);
                    });
                } else if(valid && typeof(valid)==="object") { 
                    //Assume object
                    doCheck(valid.ok, valid.msg || "");
                }               
                else {
                    valid = false;
                    doCheck(false, "No s'ha pogut comprovar la resposta");
                }
                              
                //Remember that valid can be a boolean, object or promise
                return valid;
        }            
 }; //End prototype



    
 pw.SimpleQuizz = function(deferEndGame, container, backedQuestions, options){

         container.empty();
         container.append('<div class="before"></div><div class="after"></div>');
         $(".background-panel").hide();
        
        
         var that = this;
         this.json = backedQuestions;
         this.container = container;
         this.rest = container.rest;
         this.resources = container.resources;
         this.data = container.data;
         this.attempt = container.data.attempt;
         this.deferEndGame = deferEndGame;
         this.lastTime = 0;
                        
        this.overall = 0;
        this.currentIndex = 0;
        this.overallIndex = 0;
        this.currentLevel = 0;
       
        this.options = $.extend({
            shuffleQuestions: false,
            shuffleOptions: false,
            maxAttempts: 1,
            rightScore: 20,
            wrongAttemptPenalty: 0.5,
            canSkipQuestions: false,
            canSkipWrongQuestions: false,
            maxLives: 4,
            game:  "classical"  //level or all
        }, options);
       
        
        //SHUFFLE AND TRIM QUESTIONS PER LEVEL
        $.each(this.json, function(i, level){
                  that.options.shuffleQuestions && level.shuffle();
                  if(that.options.maxQuestionsLevel && that.options.maxQuestionsLevel[i] && that.options.maxQuestionsLevel[i]<level.length){
                      level.splice(0, level.length-that.options.maxQuestionsLevel[i]);
                  }
                  that.overall += level.length;
        });      
        
        if(pw.urlVars.test){
            this.options.maxLives = 1000;
            this.options.maxAttempts = 1000;
        }
    
        var exitHandler = function(evt){
            that.attempt.done = false;
            that.updateAttempt();
            that.TopBar.hide();
            that.container.hide();
            pw.Sound.play("soundGameOver");
            that.deferEndGame.resolve();
        };
        
        this.TopBar = new pw.TopBar(exitHandler);
        this.TopBar.setLives(this.options.maxLives);
        
        this.nextButton = $('<button id="nextBtn" class="btn btn-primary glyphicon glyphicon-arrow-right" style="display:none"><span>'+pw.getI18n("NEXT")+'</span></button>');
         
        /// In the game all: It shows all levels and all questions at once....
        if(this.options.game === "all"){
                console.log("ALL GAME");
                this.options.showCheckBtn = false;
                var listPanels = [];
                $.each(this.json, function(i, level){
                     that.container.append('<h1 style="color:white; background-color:black;margin-top:50px;"><b>'+pw.getI18n("LEVEL")+' '+(i+1)+'</b></h1>');
                     $.each(level, function(j, q){
                          var questionPanel = new pw.QuestionPanel(that.container, that.TopBar, that.options);
                          questionPanel.setQuestion(q);
                          listPanels.push(questionPanel);
                          that.container.append("<hr>");
                     });                    
                });    

                var buttonContainer = $("<center><div></div></center>");
                var checkButton = $('<button id="checkBtn" class="btn btn-success glyphicon glyphicon-arrow-right"><span>'+pw.getI18n("CHECKS")+'</span></button>');
                buttonContainer.append(checkButton);
                this.container.append(buttonContainer);
                this.numAttempts = 0;
                checkButton.on("click", function(){
                     that.numAttempts += 1;
                     var numOK = 0;
                     var defers = [];
                     var invalidSyntax;
                     $.each(listPanels, function(i, questionPanel){
                            var valid = questionPanel.check();
                            if(typeof(valid)==="undefined"){
                                invalidSyntax = true;
                            }
                            if(valid.then){
                                defers.push(valid);
                            } 
                            else if(typeof(valid)==="object" && valid.ok){
                                numOK +=1;
                            }
                            else if(typeof(valid)==="boolean" && valid){
                                numOK +=1;
                            }
                     });
                     
                     if(invalidSyntax){
                         return;
                     }
                     
                     var doFinalCheck = function(){
                     
                            if(numOK < listPanels.length){                         
                                if(that.numAttempts < that.options.maxAttempts && that.TopBar.getLives()>0){
                                    that.updateAttempt();
                                    //Intenta-ho de nou (pels que falten)
                                    that.TopBar.addLives(-1);
                                    pw.GenericModal.show(pw.getI18n("CONGRATULATIONS")+"!", "Tens "+numOK+" de "+listPanels.length+" correctes. Intentau de nou. Et queden "+(that.options.maxAttempts-that.numAttempts)+" intents.", 4000);                         
                                } else {
                                    //S'han acabat els intents GAMEOVER
                                     that.attempt.done = false;
                                     that.updateAttempt();
                                     that.TopBar.hide();
                                     pw.GameOver.show();
                                     that.deferEndGame.resolve();
                                      $(".background-panel").show();
                                }
                            } else {
                                //Molt bé! has acabat el joc
                                that.attempt.done = true;
                                that.updateAttempt();
                                pw.Sound.play("soundRightAnswer"); 
                                that.TopBar.hide();                         
                                that.container.fireworks();
                                var onClose = function(){
                                   $(".background-panel").show();
                                   that.deferEndGame.resolve();                          
                                };

                                pw.GenericModal.show(pw.getI18n("CONGRATULATIONS")+"!", "Les has encertades totes amb "+that.numAttempts+" intents.", null, onClose);

                            }
                    
                     };
                     
                     if(defers.length){
                         $.when.apply($, defers).done(function(){
                                var args = Array.prototype.slice.call(arguments); 
                                $.each(args, function(i, valid){
                                        if(valid && typeof(valid)==="object" && valid.ok){
                                            numOK +=1;
                                        }
                                        else if(typeof(valid)==="boolean" && valid){
                                            numOK +=1;
                                        }
                                });
                                doFinalCheck();
                         });
                     } else {
                         doFinalCheck();
                     }
                    
                });
            
        //This game shows all questions by level... and next button changes level.   
        } else if(this.options.game==="level"){
            
             var renderLevelGame = function(){
                  
                  container.empty();
                  container.append('<div class="before"></div><div class="after"></div>');
                  that.listPanels = [];             
                  that.container.append('<h1 style="color:white; background-color:black;margin-top:50px;"><b>'+pw.getI18n("LEVEL")+' '+(that.currentLevel+1)+'</b></h1>');
                  $.each(that.json[that.currentLevel], function(j, q){
                          var questionPanel = new pw.QuestionPanel(that.container, that.TopBar, that.options);
                          questionPanel.setQuestion(q);
                          that.listPanels.push(questionPanel);
                          that.container.append("<hr>");
                 });         
             };
            
             console.log("LEVEL GAME");
             this.options.showCheckBtn = false;
             
                var buttonContainer = $("<center><div></div></center>");
                var checkButton = $('<button id="checkBtn" class="btn btn-success glyphicon glyphicon-arrow-right"><span>'+pw.getI18n("CHECKS")+'</span></button>');
                buttonContainer.append(checkButton);
                buttonContainer.append(nextButton);
                this.container.append(buttonContainer);
                this.numAttempts = 0;
                checkButton.on("click", function(){
                     that.numAttempts += 1;
                     var numOK = 0;
                     $.each(listPanels, function(i, questionPanel){
                            if(questionPanel.check()){
                                numOK +=1;
                            }
                     });
                     if(numOK < listPanels.length){                         
                         if(that.numAttempts < that.options.maxAttempts && that.TopBar.getLives()>0){
                             that.updateAttempt();
                             //Intenta-ho de nou (pels que falten)
                             that.TopBar.addLives(-1);
                             pw.GenericModal.show(pw.getI18n("CONGRATULATIONS")+"!", "Tens "+numOK+" de "+listPanels.length+" correctes. Intentau de nou. Et queden "+(that.options.maxAttempts-that.numAttempts)+" intents.", 4000);                         
                         } else {
                             //S'han acabat els intents GAMEOVER
                              that.attempt.done = false;
                              that.updateAttempt();
                              that.TopBar.hide();
                              pw.GameOver.show();
                              that.deferEndGame.resolve();
                               $(".background-panel").show();
                         }
                     } else {
                         //Molt bé! has acabat el joc
                         that.attempt.done = true;
                         that.updateAttempt();
                         pw.Sound.play("soundRightAnswer"); 
                         that.TopBar.hide();                         
                         that.container.fireworks();
                         var onClose = function(){
                            $(".background-panel").show();
                            that.deferEndGame.resolve();                          
                         };
                         
                         pw.GenericModal.show(pw.getI18n("CONGRATULATIONS")+"!", "Les has encertades totes amb "+that.numAttempts+" intents.", null, onClose);
                         
                     }
                });
        
        //This is the classical game, one question after the other...    
        } else {
                console.log("CLASSICAL GAME");
                
                this.options.showCheckBtn = true;
                this.questionPanel = new pw.QuestionPanel(this.container, this.TopBar, this.options);
                
                this.questionPanel.appendButton(this.nextButton);
                this.questionPanel.onRightAnswer = function(){            
                    that.nextButton.show();                        
                    pw.Sound.play("soundRightAnswer"); 
                    that.container.fireworks();
                };
                this.questionPanel.onWrongAnswer = function(){            
                    that.options.canSkipWrongQuestion &&  that.nextButton.show();
                };
                this.questionPanel.onWrongAttempt = function(){            
                    that.TopBar.addLives(-1);
                    if(that.TopBar.getLives()>0){                                    
                        that.nextButton.show();                                    
                    } else {
                        //GAME OVER
                        that.attempt.done = false;
                        that.TopBar.hide();
                        pw.GameOver.show();
                        $(".background-panel").show();
                        that.deferEndGame.resolve();
                    }          
                };
                
                //Now decide which level to display; according to the level reached by user as this.data.maxLevelUser
                this.currentLevel = this.data.maxLevelUser - 1;
                if(this.currentLevel > 0 && this.json.length > 1){
                    //Ask the student which level would like to play
                     pw.GenericModal.show(pw.getI18n("YOUR_LEVEL")+":", pw.getI18n("LEVEL")+" "+(that.currentLevel+1), 2000);
                }
                        
                this.questionPanel.setQuestion(this.json[this.currentLevel][this.currentIndex]);
           

                this.nextButton.on("click", function(){
                    that.updateAttempt();
                    that.questionPanel.feedbackPanel.hide();
                    that.nextButton.hide();
                    that.overallIndex += 1;
                    if(that.currentIndex < that.json[that.currentLevel].length - 1){
                        that.currentIndex += 1;
                        that.questionPanel.setQuestion(that.json[that.currentLevel][that.currentIndex]); 
                        var tpc = Math.floor( (that.overallIndex+1)*100/that.overall);
                        var prog = pw.getI18n("LEVEL")+" "+(that.currentLevel+1)+" : "+ (that.currentIndex+1)+" / "+ that.json[that.currentLevel].length;
                        that.TopBar.setProgress(tpc, prog);

                    } else {                    
                        if(that.currentLevel < that.json.length-1){

                             //Congratulations New LEVEL passed!                         
                             that.currentLevel += 1;
                             pw.GenericModal.show(pw.getI18n("CONGRATULATIONS")+"!", pw.getI18n("LEVEL")+" "+(that.currentLevel+1), 1500);

                             that.currentIndex = 0;
                             that.questionPanel.setQuestion(that.json[that.currentLevel][that.currentIndex]);
                             var tpc = Math.floor( (that.overallIndex+1)*100/that.overall);
                             var prog = pw.getI18n("LEVEL")+" "+(that.currentLevel+1)+" : "+ (that.currentIndex+1)+" / "+ that.json[that.currentLevel].length;
                             that.TopBar.setProgress(tpc, prog);
                        } else {
                            //Normal end game; set attempt to done true
                            that.attempt.done = true;
                            that.TopBar.hide();
                            pw.Sound.play("soundGameOver");
                            $(".background-panel").show();
                            that.deferEndGame.resolve();
                        }
                    }       
                });
        }    
    };
    
 
 pw.SimpleQuizz.prototype = {
             
        updateAttempt: function(){
             var score = 0;
             $.each(this.json, function(i, e){
                 $.each(e, function(j, x){
                    score += x.ownscore? x.ownscore : 0; 
                });
             });
             this.attempt.score = score;
             this.attempt.level = this.currentLevel + 1;
             this.rest.updateAttempt(this.attempt);
             this.TopBar.setScore(this.attempt.score);
         }
        
 };
   

})();