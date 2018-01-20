    require.config({
        baseUrl: '/',
        waitSeconds : 30,
        paths : {
            underscore: 'https://cdnjs.cloudflare.com/ajax/libs/underscore.js/1.4.4/underscore-min',
            text: 'assets/libs/requirejs/require-text',
            css: 'assets/libs/requirejs/require-css',
            async: 'assets/libs/requirejs/require-async',
            font: 'assets/libs/requirejs/require-font',
            image: 'assets/libs/requirejs/require-image',
            json: 'assets/libs/requirejs/require-json',
            noext: 'assets/libs/requirejs/require-noext',
            mathjs: 'activities/libs/math/mathjs',
            fraction: 'activities/libs/math/fraction',
            KAS: 'activities/libs/math/KAS',
            canvaspaint: 'activities/libs/math/mathinput/canvas-painter',
            mathquill: 'activities/libs/math/mathinput/mathquill/mathquill.min',
            mathquilleditor: 'activities/libs/math/mathinput/mathquill-editor',
            mathpaint: 'activities/libs/math/mathinput/mathpaint',
            mathinput: 'activities/libs/math/mathinput/mathinput',
            mathblanks: 'activities/libs/math/mathinput/mathblanks',
            
            'activity-quizz': 'activities/libs/activity-quizz',
            'activity-bakejson': 'activities/libs/activity-bakejson',
            'quizzrenderer-input': 'activities/libs/quizzrenderer-input',
            'quizzrenderer-blanks': 'activities/libs/quizzrenderer-blanks',
            'quizzrenderer-checkbox': 'activities/libs/quizzrenderer-checkbox',
            'quizzrenderer-kahoot': 'activities/libs/quizzrenderer-kahoot',
            'quizzrenderer-mathinput': 'activities/libs/quizzrenderer-mathinput',
            'quizzrenderer-radio': 'activities/libs/quizzrenderer-radio',
            'quizzrenderer-roots': 'activities/libs/quizzrenderer-roots',
            
            mqEdtPalette: 'activities/libs/math/mathinput/mathquill-editor-palette.html',
            mqEdtCss: 'activities/libs/math/mathinput/mathquill-editor',
            'jquery-draggable': "assets/libs/jquery/jquery-draggable",
            'mobile-dnd': "assets/libs/DragDropTouch",
            rateyo: 'assets/libs/jquery/jquery.rateyo.min',
            katex: "https://cdnjs.cloudflare.com/ajax/libs/KaTeX/0.8.2/katex.min",
            katexauto: "https://cdnjs.cloudflare.com/ajax/libs/KaTeX/0.8.2/contrib/auto-render.min",
            jsxgraph: "https://cdnjs.cloudflare.com/ajax/libs/jsxgraph/0.99.6/jsxgraphcore"
        },
        shim:{ 
            underscore: {
                exports: '_'
            }, 
            katexauto: {
                deps: ["katex"]
            },
            KAS: {
                deps: ['underscore']                  
            },
            jsxgraph: {
                deps: ['css!https://cdnjs.cloudflare.com/ajax/libs/jsxgraph/0.99.6/jsxgraph.css']
            },
            mathpaint:{
                deps: ['canvaspaint']
            }, 
            mathquilleditor: {
                deps: ['mathquill'],
                exports: 'MQ'
            },
            mathquill: {
              deps: ['css!/activities/libs/math/mathinput/mathquill/mathquill.css']  
            },
            mathinput: {
                deps: ['mathquilleditor', 'mathpaint']
            },
            "activity-quizz":{
                deps: ["activity-bakejson", "mobile-dnd"]
            }
        }
    });
 
 
(function(){

    //--------------------------------------------CONSTANTS
    var SUPPORTED_LANGS = ["ca","es","en"];
    var FALLBACK_LANG = "en";
     
    //--------------------------------------------PRIVATE VARS
    var user, selectedgroup, lang, css, student, related;    
    var pw = window.pw || {data:{}};
  
          
    //-------------------------------------------- A very basic router
    pw.Router = function(){
        
    };
    
    pw.Router.prototype = {
        go: function(route){
            pw.log("Route transition; from=", this.route, " to=", route);
            if(route!==this.route && this.routes){
                  this.routes["LoadingPanel"].hide();
                  var that= this;
                  $.each(Object.keys(this.routes), function(i, ro){
                     var screen = that.routes[ro];
                     if(ro===route && screen.show){
                         screen.show();
                        
                     } else if(ro!==route && screen.hide){
                         screen.hide();
                          
                     }
                  });
            }
            this.route = route;
        },
        setRoutes: function(routes){
            this.routes = routes;
        }        
    };
    
   
      
    var ua = window.navigator.userAgent;
    pw.bowser = {MSIE: false, Firefox: false, Chrome: false, Safari: false, version: 0, mobile: /iPhone|iPad|iPod|Android/i.test(ua)};

    var browserNames = ["Firefox", "Chrome", "Safari", "MSIE", "EDGE"];
    for (var i = 0; i < 5; i++) {
        var reg = new RegExp(browserNames[i] + "\/(.*)$", "i");
        var uMatch = ua.match(reg);
        if (uMatch && uMatch.length > 1) {
             pw.bowser[browserNames[i]] = true;
            var matches = ua.match(/Version\/(.*)$/);
            var v = uMatch[1];
            if (matches && matches.length > 1) {
                v = matches[1];
            }
            try {
                 pw.bowser.version = parseInt(v.split(".")[0]);
            } catch (Ex) {
            }
            break;
        }
    } 
            
    pw.i18n = {
        ca: {
            USER: 'Usuari',
            PLAY: 'Jugar',
            PLAY_AGAIN: 'Jugar de nou',
            EXIT: 'Sortir',
            YOUR_SCORE: 'La teva puntuacio',
            HOME: 'Inici',
            NEXT: 'Següent',
            RIGHT_ANSWER: 'Molt bé! Resposta correcta',
            THE_ANSWER: 'La resposta era ',
            WRONG_ANSWER: 'Resposta incorrecta',
            TRY_AGAIN: "Intenta de nou",
            CHECK: "Comprova la resposta",
            CHECKS: "Comprova les respostes",
            RATE: "Valora i comenta",
            SHARE: "Comparteix amb un amic",
            LOADING: "Carregant",
            LOGIN: "LOGIN",
            USERNAME: "Usuari",
            PASSWORD: "Contrasenya",
            CANCEL: "Cancel·la",
            CLOSE: "Tancar",
            ACCEPT: "Accepta",
            RANKING: "Posició",
            PLAYER: "Jugador",
            SCORE: "Punts",
            NO_LIFES: ":-( No et queden més vides", 
            GAME_OVER: "Game Over", 
            CONGRATULATIONS: "Enhorabona!", 
            LEVEL: "Nivell",  
            CLICK_TO_EDIT: "Clica per editar la resposta",
            INVALID_INPUT: "Entrada invalida",
            HINTS: "Ajuda",
            TIME_OVER: "S'ha acabat el temps",
            YOUR_LEVEL: "El teu nivell"
        },
        es: {
            USER: 'Usuario',
            PLAY: 'Jugar',
            PLAY_AGAIN: 'Jugar de nuevo',
            EXIT: 'Salir',
            YOUR_SCORE: 'Tu puntuacion',
            HOME: 'Inicio',
            NEXT: 'Siguiente',
            RIGHT_ANSWER: 'Muy bien! Respuesta correcta',
            THE_ANSWER: 'La respuesta era ',
            WRONG_ANSWER: 'Respuesta incorrecta',
            TRY_AGAIN: "Intenta otra vez",
            CHECK: "Comprueba la respuesta",
            CHECKS: "Comprueba las respuestas",
            RATE: "Valora la actividad",
            SHARE: "Comparte con un amigo",
            LOADING: "Cargando",
            LOGIN: "LOGIN",
            USERNAME: "Usuario",
            PASSWORD: "Contraseña",
            CANCEL: "Cancela",
            CLOSE: "Cerrar",
            ACCEPT: "Aceptar",
            RANKING: "Posición",
            PLAYER: "Jugador",
            SCORE: "Puntos",
            NO_LIFES: ":-( No te quedan mas vidas", 
            GAME_OVER: "Game Over", 
            CONGRATULATIONS: "Enhorabuena!", 
            LEVEL: "Nivel",
            CLICK_TO_EDIT: "Clic para editar la respuesta",
            INVALID_INPUT: "Entrada invalida",
            HINTS: "Ayuda",
            TIME_OVER: "Se ha terminado el tiempo",
            YOUR_LEVEL: "Tu nivel"
          
        },
        en:{
           USER: 'User',
           PLAY: 'Play',
           PLAY_AGAIN: 'Play again',
           EXIT: 'Exit',
           YOUR_SCORE: 'Your score',
            HOME: 'Home',
            NEXT: 'Next',
            RIGHT_ANSWER: 'Well done! Right answer',
            THE_ANSWER: 'The answer was ',
            WRONG_ANSWER: 'Wrong answer',
            TRY_AGAIN: "Try again",
            CHECK: "Check answer",
            CHECKS: "Check answers",
            RATE: "Rate the activity",
            SHARE: "Share with a friend",
            LOADING: "Loading",
            LOGIN: "LOGIN",
             USERNAME: "Username",
            PASSWORD: "Password",
            CANCEL: "Cancel",
            CLOSE: "Close",
            ACCEPT: "Accept",
            RANKING: "Ranking",
            PLAYER: "Player",
            SCORE: "Score",
            NO_LIFES: ":-( No more lives left", 
            GAME_OVER: "Game Over", 
            CONGRATULATIONS: "Congratulations", 
            LEVEL: "Level",
            CLICK_TO_EDIT: "Clic to edit the answer",
            INVALID_INPUT: "Invalid input",
            HINTS: "Hints",
            TIME_OVER: "Time over",
            YOUR_LEVEL: "Your level"
        }
    };
    
    //--------------------------------------------PRIVATE METHODS
  
     // Read a page's GET URL variables and return them as an associative array.
    function getUrlVars()
    {
        var vars = [], hash;
        var hashes = window.location.href.slice(window.location.href.indexOf('?') + 1).split('&');
        for(var i = 0; i < hashes.length; i++)
        {
            hash = hashes[i].split('=');
            vars.push(hash[0]);
            vars[hash[0]] = hash[1];
        }
        return vars;
    }

    pw.urlVars = getUrlVars();

    if(pw.urlVars.debug){         
        pw.DEBUG = true;
    }
    
   
    function getCookie(key) {
        var keyValue = document.cookie.match('(^|;) ?' + key + '=([^;]*)(;|$)');
        return keyValue ? keyValue[2] : null;
    }
 
    /** Trick to skip database defers with no valid user is logged in **/
    function immediateResolve(obj){
        var defer = new $.Deferred();
        defer.resolve(obj);
        return defer.promise();
    };

    //--------------------------------------------PUBLIC API
    pw.log = function(){
        pw.DEBUG && console.log.apply(console, arguments);
    };
    
    pw.getI18n = function(key){
        return " "+(pw.i18n[pw.getLang()] || pw.i18n[FALLBACK_LANG] )[key] || " "+key;
    };

    
    pw.getLang = function(){
        if(lang){
            return lang;
        }
         var cookie = getCookie("NG_TRANSLATE_LANG_KEY");
        if(cookie){
            lang = cookie.replace(/"/g,"").replace(/%22/g,"");
        } else {

            var group = pw.getGroup();
            if(group && group.gopts && group.gopts.lang){

                    lang = group.gopts.lang;

            } else {

                    var user = pw.getUser();
                    if(user && user.uopts && user.uopts.lang){
                         lang = user.uopts.lang;
                    } else {
                        //navigator lang
                        if(navigator.languages != undefined)
                        {
                            lang = navigator.languages[0];
                        }
                        else
                        {
                            lang = navigator.language;
                        }  
                        if(lang.indexOf("-")>0){
                                lang = lang.split("-")[0];
                        }
                    }

            }
        }

        lang = (lang || "").toLowerCase();
        if(SUPPORTED_LANGS.indexOf(lang)<0){
            lang = FALLBACK_LANG;
        }

        return lang;
    };

    pw.LoadingSpinner = {
        init: function(){
            this.spinner = $('<div class="pw-loader">'+
                '<div class="pw-loader-bounce">'+
                '<div class="bounce1"></div>'+
                '<div class="bounce2"></div>'+
                '<div class="bounce3"></div>'+
                '</div></div>');
            $("body").append(this.spinner);
        },
        show: function(){
            if(!this.spinner){
                pw.LoadingSpinner.init();
            }
            this.spinner.show();
        },
        hide: function(){
            if(!this.spinner){
                pw.LoadingSpinner.init();
            }
            this.spinner.fadeOut(300);
        }
    };
    
    
    //Loading panel class;
    pw.LoadingPanel = function(){     
            this.mainPanel = $('<div class="loading-panel"></div>');
            this.message = $('<div class="loading-message">'+pw.getI18n("LOADING")+' ...</div>');            
            this.warningMessage = $('<div class="loading-message loading-warning"></div>');   
            this.dangerMessage = $('<div class="loading-message loading-danger"></div>');     
           
            this.mainPanel.append(this.message);
            this.mainPanel.append(this.warningMessage);
            this.mainPanel.append(this.dangerMessage);
            
            $('body').append(this.mainPanel);
    };
    
    pw.LoadingPanel.prototype = {
              
        destroy: function(){            
            $('body').remove(this.mainPanel);
            this.mainPanel = null;
        },          
        show: function(msg, warningMessage, dangerMessage){

            if(typeof(msg) !== 'undefined'){
                this.mainPanel.html(msg);
            }
            if(typeof(warningMessage) !== 'undefined'){
                this.warningMessage.html(warningMessage);
            }
            if(typeof(dangerMessage) !== 'undefined'){
                this.dangerMessage.html(dangerMessage);
            }

            if(!this.mainPanel){
                this.create();
            }
            this.mainPanel.show();     
            pw.LoadingSpinner.show();
        },      
        danger: function(text){
            this.message.hide();
            this.dangerMessage.append("<p>"+text+"</p>");
            this.dangerMessage.show();
        },
        warning: function(text){
            this.warningMessage.append("<p>"+text+"</p>");
            this.warningMessage.show();
        },
        hide: function(){            
            if(!this.mainPanel){
                return;
            }
            this.mainPanel.fadeOut(250);     
            pw.LoadingSpinner.hide();
        }          
    };


    pw.LoginModal = {
        init : function(){
            var template = '<div id="loginmodal" class="modal fade" tabindex="-1" role="dialog">'+
                '<div class="modal-dialog" role="document">'+
                  '<div class="modal-content">'+
                   '<div class="modal-header">'+
                      '<button type="button" class="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button>'+
                      '<h4 class="modal-title">Login to piWorld.es</h4>'+
                    '</div>'+
                    '<div class="modal-body">'+
                        '<label for="uname">'+pw.getI18n("USERNAME")+'</label>'+
                        '<input id="uname" type="text" class="form-control" autocorrect="off" autocapitalize="none" autocomplete="off"/><br>'+
                        '<label for="upwd" class="text-capitalize">'+pw.getI18n("PASSWORD")+'</label>'+
                        '<input id="upwd" type="password" class="form-control" /><br>'+
                        '<div class="alert alert-danger" style="display:none"></div>'+
                    '</div>'+
                    '<div class="modal-footer">'+
                     ' <button type="button" class="btn btn-danger" data-dismiss="modal">'+pw.getI18n("CANCEL")+'</button>'+ 
                     ' <button id="authBtn" type="button" class="btn btn-success">'+pw.getI18n("ACCEPT")+'</button>'+ 
                    '</div>'+
                  '</div>'+
                '</div>'+
              '</div>';
            var that = this;
            this.modal = $(template);
            $("body").append(this.modal);
            this.uname = this.modal.find("#uname");
            
            this.upwd = this.modal.find("#upwd");
            this.msg = this.modal.find(".alert");
            this.authBtn = this.modal.find("#authBtn");
            
            var doLogin = function(){
                that.authBtn.prop("disabled", true);
                var b = {username: that.uname.val(), password: that.upwd.val()};
                $.ajax({type: "POST",
                        url: "/rest/users/login",
                        data: pw.encrypt(JSON.stringify(b)),
                        contentType: "text/plain;charset=UTF-8"
                     }).then(function(d){
                      that.authBtn.prop("disabled", false);
                      if(d.ok){
                          //Set a cookie
                          user = JSON.parse(pw.decrypt(d.user_info));
                          var session = {
                              user: user 
                          };
                          localStorage.setItem("pwSession", pw.encrypt(JSON.stringify(session)));
                          if(user.groups.length > 0){
                            selectedgroup = user.groups[0];
                          }
                          lang = null;
                          pw.getLang();
                          that.modal.modal("hide");
                      } else {
                          that.msg.show();
                          that.msg.html(d.msg);
                      }
                });
            };
            
            this.authBtn.on("click", doLogin);
            this.upwd.keyup(function(evt){
                if(evt.which===13){
                    doLogin();
                }
            });
            
       },
       show: function(){
           if(!this.modal){
               this.init();
           }        
           this.msg.hide();
           this.modal.modal();
           this.uname.focus();
        },
        onClose: function(handler){
            this.modal.on('hidden.bs.modal', handler);
        }
        
    };

    pw.WelcomeScreen = function(router, playHandler, rest, data){       
            this.router = router;
            this.data = data;
            var aboutToStart;
            var template = '<div class="welcome">'+
                           '<a href="https://pw.es"><img class="piworld" src="/assets/img/logo.png"/></a>'+
                           '<div id="welcomeUsername" class="lcd"></div>'+
                                                      '<center>'+
                           '<div id="atitle" style="margin-top:-50px"></div>'+
                           '<div class="panel panel-default" style="background: rgba(255,255,255,0.9)";><div class="panel-header" style="padding:5px"><center><h3 style="margin:0px"><b class="lcd">Top 10</b></h3></center></div><div class="panel-body" style="height:300px; overflow-y:auto"><table class="table table-responsive table-stripped table-hover">'+
                           '<thead><tr><th>'+pw.getI18n("RANKING")+'</th><th>'+pw.getI18n("USER")+'</th><th>'+pw.getI18n("SCORE")+'</th><th>'+pw.getI18n("LEVEL")+'</th></tr></thead><tbody id="tbody"></tbody></table></div></div>'+
                           '<div id="playBtnDiv">'+                           
                           '<button id="loginBtn" class="btn btn-xl btn-info glyphicon glyphicon-user" style="display:none">'+pw.getI18n("LOGIN")+'</button>'+
                           '<button id="playBtn" class="btn btn-xl btn-success glyphicon glyphicon-play-circle" disabled="true">'+pw.getI18n("PLAY")+'</button></div>'+
                           '</center></div>';

            this.mainPanel = $(template);
                
            this.goButton = this.mainPanel.find("#playBtn");
            this.loginButton = this.mainPanel.find("#loginBtn");
            this.username = this.mainPanel.find("#welcomeUsername");
            this.goButton.on("click", function(evt){
                playHandler && playHandler();
            });     
            this.rest = rest;
            $('body').append(this.mainPanel);
            
            this.tBody = this.mainPanel.find("#tbody");
            this.title = this.mainPanel.find("#atitle");
    };
        
        
    pw.WelcomeScreen.prototype = {    
        destroy: function(){            
            $('body').remove(this.mainPanel);
            this.goButton.off();
            this.mainPanel = null;
        },          
        show: function(){
            if(!this.mainPanel){
                this.create();
            }
            var that =this;
            var family = "";
            if(pw.getUser().idRole === 500){
                family = " - Familia";
            }
            that.username.text(pw.getUser().username + family);
            if(!pw.getUser().id){
                this.loginButton.show();
                this.loginButton.on("click", function(evt){
                    pw.LoginModal.show();
                    pw.LoginModal.onClose(function(){
                        if(pw.getUser().id){
                            that.loginButton.hide();
                            that.username.text(pw.getUser().username || "");
                         }
                    });
                });
            }
            
            if(pw.data.numPlays === 1){
                this.goButton.text(pw.getI18n("PLAY_AGAIN"));
            }
            
            var that = this;
            
            //On show update top10
            
            this.rest.top10().then(function(data){
                    
                    var html = "";
                    $.each(data.top, function(i,e){
                       var uopts = {};
                       try{
                           uopts = JSON.parse(e.uopts);
                       } catch(Ex){}
                       
                       var avatar = '<img src="/assets/img/avatar/'+ (uopts.avatar || 0) + '.png" class="avatar"/> ';
                       
                       html += "<tr><td>"+(i+1)+"</td><td> "+avatar + "<span> " + e.fullname+"</span> </td><td>"+e.score+"</td><td>"+(e.level || 1)+"</td></tr>";
                    });
                    
                    that.tBody.html(html);
                    
                    //Analize the attempts done by this user;
                    var maxLevelUser = 1;
                    $.each(data.attempts, function(i, att){
                        if(att.level > maxLevelUser){
                            maxLevelUser = att.level;
                        }
                    });
                    that.data.maxLevelUser = maxLevelUser;
            });
            
            if(pw.urlVars.autoplay && !pw.data.numPlays){
                var auto = 0;
                try{
                    auto = parseInt(pw.urlVars.autoplay);
                } catch(Ex){}
                if(auto){
                    if(pw.urlVars.test){
                         that.goButton.trigger("click");
                    } 
                    else {
                        this.aboutToStart = window.setTimeout(function(){
                            window.clearTimeout(this.aboutToStart);  
                            that.goButton.trigger("click");
                        }, 3000);
                    }
                }
            }
            this.mainPanel.show();        
        },  
        enable: function(enable){
            this.goButton.prop("disabled", !enable);
        },  
        hide: function(){            
            if(!this.mainPanel){
                return;
            }
            this.mainPanel.fadeOut(250);        
        },
        setTitle: function(title){
            this.title.html(title);
        }
    };


    pw.TopBar = function(clickHandler){
            this.numLives = 0;
            
            var template = '<div id="topBar" class="topbar">'+
                           '<img id="avatar" class="avatar"/><span id="avatarLifes"></span>'+
                           '<div class="progress"><div class="progress-bar progress-bar-info" role="progressbar" aria-valuenow="0" aria-valuemin="0" aria-valuemax="100">'+
                           '</div><center id="progressTpc"> 0% </center> </div>'+
                           '<div class="topbar-left"><span class="picoin"></span> <span id="picoin-score" class="lcd">0</span>'+
                           '<button class="btn btn-danger btn-sm glyphicon glyphicon-home"> <span class="hidden-xs">'+pw.getI18n("EXIT")+'</span>'+
                           ' </button></div>'+
                           '</div>';

            this.mainPanel = $(template);
            
            this.mainPanel.find("#avatar").attr("src", pw.getUser().uopts.avatar ? "/assets/img/avatar/"+pw.getUser().uopts.avatar+".png" :  "/assets/img/avatar/0.png");
            this.mainPanel.prepend(this.icon);
                
            this.exitButton = this.mainPanel.find("button");
            this.exitButton.on("click", function(evt){
                clickHandler && clickHandler();
            });     
            
            this.score = this.mainPanel.find("#picoin-score");
            this.progressBar = this.mainPanel.find(".progress-bar");
            this.progressBarTpc = this.mainPanel.find("#progressTpc");
            this.lifes = this.mainPanel.find("#avatarLifes");
            
            $('body').append(this.mainPanel);

        
    };
    
    
    pw.TopBar.prototype = {
        show: function(){
            if(!this.mainPanel){
                this.create();
            }
            this.setScore(0);
            this.setProgress(0);
            this.mainPanel.show();        
        },  
        hide: function(){            
            if(!this.mainPanel){
                return;
            }
            this.mainPanel.fadeOut(250);        
        },
        enableExit: function(enabled){
            this.exitButton.prop("disabled", !enabled);
        },
        setScore: function(value){
           this.score.text(value);            
        },
        setLives: function(value){
            this.numLives = value;
            this.lifes.text("x"+value);            
        },
        addLives: function(value){
            this.numLives = this.numLives + value;
            var color;
            switch(this.numLives){
                case 2: color = "orange"; break;
                case 1: color = "red"; break;
                default: color = "black";
            }
            this.lifes.css("color", color);                        
            this.lifes.text("x"+this.numLives);
            this.lifes.fadeOut(500).fadeIn(500); 
        },
        getLives: function(){
            return this.numLives;            
        },
        setProgress: function(value, text){
            value = value || 0;
            text = text || value +"%";
            this.progressBar.prop("aria-valuenow", value+"");
            this.progressBar.css("width", value+"%");
            this.progressBarTpc.html("<center>"+text+"</center>");                           
        }
    };


    pw.GameOver = {
        init : function(){
            var template = '<div id="gameover" class="modal fade" tabindex="-1" role="dialog">'+
                '<div class="modal-dialog" role="document">'+
                  '<div class="modal-content">'+
                   '<div class="modal-header">'+
                      '<button type="button" class="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button>'+
                      '<h4 class="modal-title">'+pw.getI18n("NO_LIFES")+'</h4>'+
                    '</div>'+
                    '<div class="modal-body">'+
                      '<center class="lcd"><h2>'+pw.getI18n("GAME_OVER")+'</h2></center>'+
                    '</div>'+
                    '<div class="modal-footer">'+
                     ' <button type="button" class="btn btn-default" data-dismiss="modal">'+pw.getI18n("CLOSE")+'</button>'+                     
                    '</div>'+
                  '</div>'+
                '</div>'+
              '</div>';
      
            this.modal = $(template);
            $("body").append(this.modal);
       },
       show: function(){
           if(!this.modal){
               this.init();
           }
           this.modal.modal();
        }
        
    };
    
    
    pw.GenericModal = {
        init : function(){
            var template = '<div id="gameover" class="modal fade" tabindex="-1" role="dialog">'+
                '<div class="modal-dialog" role="document">'+
                  '<div class="modal-content">'+
                   '<div class="modal-header">'+
                      '<button type="button" class="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button>'+
                      '<h4 class="modal-title"></h4>'+
                    '</div>'+
                    '<div class="modal-body">'+
                      '<center class="lcd"><h2></h2></center>'+
                    '</div>'+
                    '<div class="modal-footer">'+
                     ' <button type="button" class="btn btn-default" data-dismiss="modal">'+pw.getI18n("CLOSE")+'</button>'+                     
                    '</div>'+
                  '</div>'+
                '</div>'+
              '</div>';
      
            this.modal = $(template);
            $("body").append(this.modal);
       },
       show: function(title, body, autoClose, onClose){
           if(!this.modal){
               this.init();
           }
           this.modal.find(".modal-title").html(title);
           this.modal.find(".modal-body h2").html(body);
           this.modal.modal();
           var that = this;
           if(autoClose){
                setTimeout(function(){
                    that.modal.modal("hide");
                }, autoClose);
           }
           
           if(onClose){
               this.modal.on('hidden.bs.modal', onClose);
           } else {
               this.modal.off('hidden.bs.modal');
           }
        }
        
    };

    pw.GameScreen = function(router, rest, resources){
        this.router = router;
        this.rest = rest;
        this.resources = resources;
        this.gameScreen = $("div#gameScreen");
        if(!this.gameScreen[0]){
                this.gameScreen = $('<div id="gameScreen" style="display:none"><div class="before"></div><div class="after"></div></div>');
                $("body").append(this.gameScreen);
                
        } else {
            this.gameScreen.css("display", "none");
            this.gameScreen.append('"<div class="before"></div><div class="after"></div>');
        }
    };


    pw.GameScreen.prototype = {
        destroy: function(){            
            $('body').remove(this.gameScreen);
            this.gameScreen = null;
        },          
        show: function(){
            
            if(this.gameScreen){
               this.gameScreen.css("display", ""); 
               this.gameScreen.show();
            }        
        },  
        
        hide: function(){            
            this.gameScreen && this.gameScreen.fadeOut(250);        
        },
        html: function(html){
             this.gameScreen && this.gameScreen.html(html);    
        },
        find: function(str){
            return this.gameScreen.find(str);
        },
        append: function(str){
            return this.gameScreen.append(str);
        },
        empty: function(){
            this.gameScreen.empty();
        },
        fireworks: function(){
            var that = this;
            this.gameScreen.addClass("pyro");
            $("body").css("overflow", "hidden");
            window.setTimeout(function(){that.gameScreen.removeClass("pyro");$("body").css("overflow", "");}, 2000);
        }
    };


    pw.EndScreen = function(router, rest){
        
            var template = '<div id="endScreen" style="display:none"><center><div class="panel panel-default theend">'+
                           '<div class="lcd"><h3>'+pw.getI18n("YOUR_SCORE")+'</h3> <h2> <span id="endScreenScore"></span>  <span class="picoin"></span> </h2></div>'+
                           '<button id="homeBtn" class="btn btn-success btn-xl glyphicon glyphicon-home">'+pw.getI18n("HOME")+'</button>'+
                           '<br><div class"theend-ratepanel"><h2 class="lcd">'+pw.getI18n("RATE")+'</h2><div id="theend-ratewidget"></div></div></center></div> </div>';

            this.mainPanel = $(template);            
            $('body').append(this.mainPanel);

                
            this.goButton = this.mainPanel.find("#homeBtn");
            this.goButton.on("click", function(evt){
                    pw.iframeAPI.send("onHome", "");
                    router.go("WelcomeScreen");
            });     
            
            this.rateWidget = $("#theend-ratewidget");
            this.rateWidget.rateYo({
                    numStars: 5,
                    starWidth: pw.bowser.mobile?"20px":"40px",
                    rating: 0,
                    precision: 0
             });
             
             this.rateWidget.on("rateyo.set", function (e, data) {
                var rating = data.rating;
                rest.updateRating(rating);
              });
            
         
        };
        
    pw.EndScreen.prototype = {
        
        destroy: function(){            
            $('body').remove(this.mainPanel);
            this.goButton.off();
            this.mainPanel = null;
        },          
        show: function(){
            if(this.mainPanel){
                this.mainPanel.find("#endScreenScore").text();
                this.mainPanel.show();    
            }
        },  
        enable: function(enable){
            this.goButton.prop("disabled", !enable);
        },  
        hide: function(){            
             this.mainPanel.fadeOut(250);        
        },
        setRating: function(rating){
            this.rateWidget.rateYo("option", "rating", rating);
        },
        setScore: function(score){
              this.mainPanel.find("#endScreenScore").text(score);
        }
    };
    
    
    pw.recoverStorage = function(){
        var stor = localStorage.getItem("pwSession");
        if(stor && !pw.urlVars.guest){
            try {
                var decrypted = pw.decrypt(stor);
                var obj = JSON.parse(decrypted);
                user = obj.user || {uopts:{}};
                user.isStore = true;
                css = obj.css || [];
                selectedgroup = obj.selectedGroup || {};
                grp = obj.grp || {};
                student = obj.student || {};
                related = obj.related || [];
            } catch (Ex) {
                 user =  {uopts:{}};
                css = [];
                selectedgroup = {};
            }
        } else {
            user = {uopts:{}};
            css = [];
            selectedgroup = {};
        }
    };
    
     
    pw.getUser = function(){
         if(!user){
             pw.recoverStorage();
         }
         return user;
    };


    pw.getGroup = function(){
         if(!selectedgroup){
             pw.recoverStorage();
         }
        return selectedgroup;
    };



    /**
     * Preloads an object deps of dependencies and it resolves in the callback cb(resolved)
     * The object deps has the form: {"img1": "urlofimg1.png", "json1": "source.json", etc...}
     * Also supports latex rendered server-side: "latex1": "latexhtml!x^2-3x+\\frac{1}{2}", "latex2": "latexsvg!x^2-3x+\\frac{1}{2}"
    **/
    pw.preloader = {};

    // Define a "worker" function that should eventually resolve or reject the deferred object.
    pw.preloader.imageLoader = function(url, id, isSound) {
        var deferred = new $.Deferred();
        var image;
        if(isSound){
            var pos = url.lastIndexOf(".");
            var base = url.substring(0, pos);
            var ext = url.substring(pos+1, url.length).toLowerCase().trim();            
            image = document.createElement("AUDIO"); 
            if(!image.canPlayType("audio/"+ext)){
                console.log("audio/"+ext+" is not supported");
                for(var i=0; i<pw.Sound.fallback.length; i++){
                    var type = pw.Sound.fallback[i]; 
                    if(type!==ext){
                         if(image.canPlayType("audio/"+type)){
                             console.log("Use fallback audio/"+type+" instead");
                             url = base+"."+type;
                             break;
                         }
                    }
                };
            }
        } else {
            image = document.createElement("IMG"); 
        }
          
        // Set up event handlers to know when the image has loaded
        // or fails to load due to an error or abort.
        if(isSound){
            image.preload = "auto";
            //image.oncanplaythrough=loaded; 
            //image.oncanplay=loaded; 
            //image.onloadeddata=loaded; 
            pw.log("sound "+url+" resolved");
            deferred.resolve(image);
        } else {
            image.onload = loaded;         
            image.onerror = errored; // URL returns 404, etc
            image.onabort = errored; // IE may call this if user clicks "Stop"
        }
        
        // Setting the src property begins loading the image.
        image.src = url;
        image.id = id || "img-"+Math.floor(Math.random()*1e6);
         
        
        function loaded() {
          unbindEvents();
          // Calling resolve means the image loaded sucessfully and is ready to use.
          pw.log("image "+url+" resolved");
          deferred.resolve(image);
          //console.log(document.getElementById("loadedImgHolder"));
          //console.log(document.getElementById(id));
        }
        function errored() {
          unbindEvents();
          // Calling reject means we failed to load the image (e.g. 404, server offline, etc).
          pw.log("image "+url+" rejected");
          deferred.resolve(null);
        }
        function unbindEvents() {
          // Ensures the event callbacks only get called once.
            if (isSound) {
                image.oncanplaythrough = null;
            } else {
                image.onload = null;              
            }
            image.onerror = null;
            image.onabort = null;
        }
        
        if(image.readyState>3){
            unbindEvents();
            defer.resolve(image);            
        }
        
        return deferred.promise();
  };
 
   pw.preloader.resolverJS = function(resolveMap){
        var deferred1 = new $.Deferred();
        var keys1 = Object.keys(resolveMap);
        if(keys1.length===0){
            deferred1.resolve({});
            return deferred1.promise();
        }
        require(Object.values(resolveMap), function(){
             var args = Array.prototype.slice.call(arguments); 
             var n0 = 0;
             var n1 = 0;                     
             var resolved1 = {};
             for(var i=0; i<args.length; i++){
                resolved1[keys1[i]] = args[i];
             }
       
             deferred1.resolve(resolved1);
        });
        return deferred1.promise();
  };
  
   //Server files are always relative to activities directory
   pw.preloader.resolverServer = function(map){
        var deferred2 = new $.Deferred();
        var keys2 = Object.keys(map);
        var values2 = Object.values(map);
        if(keys2.length===0){
            deferred2.resolve({});
            return deferred2.promise();
        }
        var listPromises = [];
        $.each(values2, function(i, e){
            var def = new $.Deferred();
            $.ajax({type: "POST",
                     url: "/rest/fs/get",
                     data: JSON.stringify({path: e, encrypt: true, server: true, lang: pw.getLang()}),
                     contentType: "application/json"}).then(function(obj){                 
                
                    //Check if any json needs to be decrypted
                     var text = obj.src;
                     
                     try{
                        text = pw.decrypt(text);
                     } catch(Ex){
                        console.log("Invalid encryption for ", e);
                     }
                     
                    if(e.toLowerCase().endsWith(".json")){
                        try {
                           text = JSON.parse(text);
                            
                       } catch(Ex){
                           console.log("INVALID JSON: ",Ex);
                           console.log("Text: ", text);
                       }
                     }
                     def.resolve(text);
            });
            listPromises.push(def.promise());
        });
           
        $.when.apply($, listPromises).done(function(){
            var resolved2 = {};   
          
                $.each(arguments, function(indx, text){                                     
                    resolved2[keys2[indx]] =text;                   
                });
            
                deferred2.resolve(resolved2);
            
            });
            
      return deferred2.promise();      
   };

   pw.preloader.resolverEqn = function(eqnsMap, options){
        var deferred2 = new $.Deferred();
        var keys2 = Object.keys(eqnsMap);
        if(keys2.length===0){
            deferred2.resolve({});
            return deferred2.promise();
        }
        options.html = Object.values(eqnsMap);
      
        $.ajax({type: "POST",
                url:  "/rest/misc/latex2", 
                data: JSON.stringify(options),
                contentType: "application/json"}).then(function(data){
             var resolved2 = {};  
             if(options.type && options.type==='svg'){
                    //Must convert svg base64 to image objects
                    var listPromises = [];
                    $.each(data, function(indx, svg){
                        listPromises.push(pw.preloader.imageLoader("data:image/svg+xml;base64,"+svg));
                    });
                    pw.log(listPromises);
                    $.when.apply($, listPromises).done(function(){
                        $.each(arguments, function(indx, img){
                            resolved2[keys2[indx]] = img;
                        });
                       deferred2.resolve(resolved2);
                    });
                    
             } else {
                $.each(data, function(indx, eqn){
                    resolved2[keys2[indx]] = eqn;
                });
   
                deferred2.resolve(resolved2);
            }
        
        });
        return deferred2.promise();
   };
   
   pw.preloader.resolverImages = function(imageFiles){
        var deferred2 = new $.Deferred();
        var keys2 = Object.keys(imageFiles);
        if(keys2.length===0){
            deferred2.resolve({});
            return deferred2.promise();
        }
        
        var listPromises = [];
        $.each(keys2, function (indx, key) {
            var url = imageFiles[key];
            var url2 = url.toLowerCase();
            var isSound = url2.endsWith(".mp3") || url2.endsWith(".mp4") || url2.endsWith(".ogg") || url2.endsWith(".wav");                 
            listPromises.push(pw.preloader.imageLoader( url, key, isSound) );
        }); 
        $.when.apply($, listPromises).done(function () {
            var resolved2 = {};
            var soundMap = {};
            $.each(arguments, function (indx, img) {
                resolved2[keys2[indx]] = img;
                var url = imageFiles[keys2[indx]];
                var url2 = url.toLowerCase();
                var isSound = url2.endsWith(".mp3") || url2.endsWith(".mp4") || url2.endsWith(".ogg") || url2.endsWith(".wav");  
                isSound && (soundMap[keys2[indx]] = img);                
            });
            pw.Sound.register(soundMap);
            deferred2.resolve(resolved2);
        });
          
        
        return deferred2.promise();
   };

  pw.preloader.load = function(deps){
            var keys = Object.keys(deps);
            var values = Object.values(deps);

            var deferred = new $.Deferred();

            var toLoadWithRequirejs = {};
            var equationsHtml = {};
            var equationsSVG = {};
            var serverFiles = {};
            var imageFiles = {};
    
            $.each(values, function(i, e){
                var e2 = e.toLowerCase().trim();
                
                if(e2.startsWith("latexhtml!")){
                    values[i]= e.substring(10);
                    equationsHtml[keys[i]] = values[i];
                } else if(e2.startsWith("latexsvg!")){
                    values[i]= e.substring(9);
                    equationsSVG[keys[i]] = values[i];
                } 
                else if(e2.startsWith("server!")){
                    values[i]= e.substring(7);
                    serverFiles[keys[i]] = values[i];
                }
                else if(e2.endsWith(".jpg") || e2.endsWith(".jpeg") || e2.endsWith(".png") || e2.endsWith(".gif") || e2.endsWith(".jpg") ||
                        e2.endsWith(".svg") || e2.endsWith(".tiff") || e2.endsWith(".mp3") || e2.endsWith(".mp4") || e2.endsWith(".ogg") || e2.endsWith(".wav") ){
                        if(e2.startsWith("image!")){
                           values[i]= values[i].substring(6);                           
                        }
                        imageFiles[keys[i]] = values[i];
                } 
                else {
                    if(e2.endsWith(".json")){
                        if(!e2.startsWith("json!")){
                            e = "json!"+e; 
                            values[i]=e;
                        }
                    }
                    else if(e2.endsWith(".css")){
                        if(!e2.startsWith("css!")){
                            e = "css!"+e; 
                            values[i]=e;
                        }
                    }
                    toLoadWithRequirejs[keys[i]] = values[i];
                    
                } 
            });               

            $.when(pw.preloader.resolverJS(toLoadWithRequirejs), 
                   pw.preloader.resolverEqn(equationsHtml, {alone:true}), 
                   pw.preloader.resolverEqn(equationsSVG, {alone:true, type:"svg"}),
                   pw.preloader.resolverServer(serverFiles)
                   ,pw.preloader.resolverImages(imageFiles))
            .done( function(resolve1, resolve2, resolve3, resolve4, resolve5) { 
                  
                //Initialize singletons as soon as possible
                 pw.recoverStorage();
                   
                var resolved = $.extend(resolve1, resolve2, resolve3, resolve4, resolve5);
                deferred.resolve(resolved);    
            });

        return deferred.promise();
    };
 
   /**
    *   Database rest logic
    *   if not valid user is logged in, return an immediateResolve object and skips database manipulation.
    **/
    pw.Rest = function(idActivity, idAssignment){
            this.idActivity = idActivity;
            this.idAssignment = idAssignment;
    };
    
    pw.Rest.prototype = {
        getActivityInfo: function(){       
            this.idUser = pw.getUser().id || 0;
            this.idRole = pw.getUser().idRole;
            var obj = {idActivity: this.idActivity, idAssignment: this.idAssignment, idUser: this.idUser || 0, lang: pw.getLang() };
            return $.ajax({
                type: "POST",
                url: "/rest/activity/get",
                data: JSON.stringify(obj),
                contentType: "application/json"});             
        },
        createAttempt: function(){
             this.idUser = pw.getUser().id || 0;
             this.idRole = pw.getUser().idRole;
             if(!this.idUser || this.idRole===500){
                return immediateResolve({idAttempt: 0, msg: "offline"});
            }
            var obj = {idActivity: this.idActivity, idAssignment: this.idAssignment, idLogin: pw.getUser().idLogin, 
                idGroup: pw.getGroup().idGroup || 0, level: 0};
            return $.ajax({
                type: "POST",
                url: "/rest/attempt/create",
                data: JSON.stringify(obj),
                contentType: "application/json"});        
        },
        updateAttempt: function(attempt){
            this.idUser = pw.getUser().id || 0;
            this.idRole = pw.getUser().idRole;
            if(!this.idUser || this.idRole===500){
                return immediateResolve({msg: "offline"});    
            }            
           return $.ajax({
                type: "POST",
                url: "/rest/attempt/update",
                data: JSON.stringify(attempt),
                contentType: "application/json"});             
        },
        closeAttempt: function(attempt){
            this.idUser = pw.getUser().id || 0;
            this.idRole = pw.getUser().idRole;
             if(!this.idUser || this.idRole===500){
                return immediateResolve({msg: "offline"});    
            }
           return $.ajax({
                type: "POST",
                url: "/rest/attempt/close",
                data: JSON.stringify(attempt),
                contentType: "application/json"});
        },
        openQuestion: function(idAttempt, question, rightAnswer, category, level){
            this.idUser = pw.getUser().id || 0;
            this.idRole = pw.getUser().idRole;
            if(!this.idUser || this.idRole===500){
                return immediateResolve({idQuestion: 0, msg: "offline"});    
            }
            var obj ={idAttempt: idAttempt, question: question, rightAnswer: rightAnswer,
             category: category, level: level || 1};
         
            return $.ajax({
                type: "POST",
                url: "/rest/attempt/createQuestion",
                data: JSON.stringify(obj),
                contentType: "application/json"});
        },
        closeQuestion: function(idQuestion, seconds, score, askTheory, askHelp, askAnswer){
            this.idUser = pw.getUser().id || 0;
            this.idRole = pw.getUser().idRole;
            if(!this.idUser || this.idRole===500){
                return immediateResolve({msg: "offline"});    
            }
            var obj = {idQuestion: idQuestion, seconds: seconds, score: score, 
                askTheory: askTheory?1:0, askHelp: askHelp?1:0, askAnswer: askAnswer?1:0};
            
            return $.ajax({
                type: "POST",
                url: "/rest/attempt/closeQuestion",
                data: JSON.stringify(obj),
                contentType: "application/json"});
        },
        addAnswer: function(idQuestion, answer, valid){
            this.idUser = pw.getUser().id || 0;
            this.idRole = pw.getUser().idRole;
             if(!this.idUser || this.idRole===500){
                return immediateResolve({idAnswer: 0, msg: "offline"});    
            }            
            var obj = {"idQuestion": idQuestion, "answer": answer, "isCorrect": valid? 1:0};
            return $.ajax({
                type: "POST",
                url: "/rest/attempt/registerAnswer",
                data: JSON.stringify(obj),
                contentType: "application/json"});
        },
        updateRating: function(rating){
            this.idUser = pw.getUser().id || 0;
            this.idRole = pw.getUser().idRole;
            if(!this.idUser || this.idRole===500){
                return immediateResolve({idAnswer: 0, msg: "offline"});    
            }     
            var obj = {idActivity: this.idActivity, idUser: this.idUser, rating: rating || 0};
            return $.ajax({
                type: "POST",
                url: "/rest/activity/updaterating",
                data: JSON.stringify(obj),
                contentType: "application/json"});
        },
        top10:  function(){
            this.idUser = pw.getUser().id || 0;            
            var obj = {idActivity: this.idActivity, idUser: this.idUser, idAssignment: this.idAssignment};
            return $.ajax({
                type: "POST",
                url: "/rest/attempt/top10",
                data: JSON.stringify(obj),
                contentType: "application/json"});
        }
    };


    //--------------------------------------------Classes
    //-- Instantiable application class returned by pw.bootstrap function.
    pw.Application = function(idActivity, preload){
        var that = this;
        
        this.data = {};
        this.idActivity = idActivity;
        this.preload = preload;
             
        var idAssignment = pw.urlVars.idAssignment || 0;

        this.rest = new pw.Rest(idActivity, idAssignment);
        
        this.router = new pw.Router();
        this.LoadingPanel = new pw.LoadingPanel();
        this.backgroundPanel = $('<div class="background-panel"></div>');
        $("body").append(this.backgroundPanel);
        //this.loadedImgHolder = $('<div id="loadedImgHolder"></div>');
        //$("body").append(this.loadedImgHolder);
        
        
        
        if(pw.FScreen.fullscreenEnabled() && !pw.iframeAPI.isIframe){
                var btn = $('<button class="btn btn-default glyphicon glyphicon-resize-full"></button>');
                var btnCont = $('<div class="btn-fullscreen"></div>');
                btnCont.append(btn);
                var body = $("body");
                body.append(btnCont);
                btn.on("click", function(evt){
                    pw.FScreen.toggleFullscreen(body, btn);
                });
                pw.FScreen.setOnfullscreenchange(function(evt){
                   if(!pw.FScreen.fullscreenElement()){
                       pw.FScreen.exitFullscreen();
                   }
                });
        }
    };
        
       
    
    pw.Application.prototype = {
 
        postBootstrap: function(){
            var that = this;
                   
            window.renderMathInElement = window.renderMathInElement || this.data.bootstrap.katexauto;
                
                        
            var goHandler = function(evt){
                  pw.iframeAPI.send("onPlay", "");
                  that.WelcomeScreen.aboutToStart && window.clearInterval(that.WelcomeScreen.aboutToStart);
                  //Create a new attempt
                  that.rest.createAttempt().then(function(attempt){
                           //Now idAttempt is available
                           that.data.attempt = attempt;
                           pw.data.numPlays += 1;
                           that.router.go("GameScreen");
                           var defer = new $.Deferred();
                           that.GameScreen.data = that.data;
                           that.stages.play(defer, that.GameScreen);
                           defer.promise().then(function(){
                               //Game ended
                               pw.iframeAPI.send("onEnd", "");
                               //Update rating and score
                               that.rest.closeAttempt(attempt);

                               that.router.go("EndScreen");

                               that.EndScreen.setRating(that.data.activityInfo.rating);
                               that.EndScreen.setScore(attempt.score);
                               pw.data.attempt = null;

                               var defer4 = new $.Deferred();
                               that.stages.afterEndscreen(defer4);                                                        
                           });
                   });
               };


           this.WelcomeScreen = new pw.WelcomeScreen(this.router, goHandler, this.rest, this.data);  
           this.GameScreen = new pw.GameScreen(this.router, this.rest, this.data.bootstrap);
           this.EndScreen = new pw.EndScreen(this.router, this.rest);

           this.router.setRoutes({
               "LoadingPanel": this.LoadingPanel,
               "WelcomeScreen": this.WelcomeScreen,
               "EndScreen": this.EndScreen,
               "GameScreen": this.GameScreen
           });

        },
        
        bootstrap: function(){
            pw.log("Called bootstrap");
            var deferred = new $.Deferred();
 
            this.LoadingPanel.show();

            if(!pw.getUser().id){
                this.LoadingPanel.danger("Usuari no identificat");
            } 
            
            //Preloads css, javascript, image, json, equations, etc ...
           
            var promise1 = pw.preloader.load(this.preload); 
            var promise2 = this.rest.getActivityInfo();

            var that = this;
            $.when(promise1, promise2).done(function(d1, d2){    
                pw.log("Preload and activityInfo resolved");
                that.data.activityInfo = d2[0];
                that.data.bootstrap = d1;
                                
                var quizz = that.data.bootstrap.quizz;                
                //If quizz is string --> brewJS( It always returns a promise )
                if(typeof(quizz)==="string"){
                    pw.BrewJS(quizz).then(function(data){
                        pw.log("BrewJS resolved");
                        that.data.bootstrap.quizz = data;
                        deferred.resolve(that.data);  
                        that.afterBootstrap();
                });                    
                    
                } else if($.isArray(quizz)) {                    
                       
                        deferred.resolve(that.data);  
                        that.afterBootstrap(); 
                       
                } else if(quizz && quizz.deps) {
                       //Resolve dependencies specified in the quizz
                        pw.preloader.resolverJS(quizz.deps|| {}).then( function(map){
                            pw.log("Quizz Dependencies Resolved: ", map);
                            that.data.quizzDeps = map;
                            that.data.bootstrap.quizz = that.data.bootstrap.quizz.questions;
                            deferred.resolve(that.data);                           
                            that.afterBootstrap();                        
                        });                                               
                } else {
                    console.log("bootstrap:: quizz Cannot be resolved");
                }
                
               
                if(that.data.bootstrap.background){
                     var bg_img = $(that.data.bootstrap.background);
                     bg_img.addClass("img img-responsive background-image");                     
                     that.backgroundPanel.append(bg_img);  
                     window.setTimeout(function(){
                        that.backgroundPanel.css({"z-index": -1, "opacity": 0.5});
                     }, 1500);
                }
                
                
              
                
                //that.afterBootstrap();
                
            });
          
            
           return deferred.promise();
        },
        
        afterBootstrap: function(){
                pw.log("Called afterBootstrap");
                this.postBootstrap();
                var that = this;
                var deferred1 = new $.Deferred();
                this.stages.afterBootstrap(deferred1);
             
                deferred1.promise().then(function(){
                    pw.log("stages.afterBootstrap resolved");
                    var deferred2 = new $.Deferred();
                    that.stages.afterWelcomescreen(deferred2);

                    deferred2.promise().then(function(){
                    pw.log("stages.afterWelcomeScreen resolved");
                    //Now the user can start the activity, so unlock button     
                         that.router.go("WelcomeScreen");
                        that.WelcomeScreen.setTitle("<h4 class='activityTitle'>"+that.data.activityInfo.activity+"</h4>");
                        that.WelcomeScreen.enable(true);
                    });
            });
        },
        
        /**
         *   Different stages of the application, to be overriden by developer
         */
        stages: {
            afterBootstrap: function (defer) {
                defer.resolve();
            },
            afterWelcomescreen: function (defer) {
                defer.resolve();
            },
            play: function (defer, container) {
                //Resolve when game is over; it will trigger EndScreen
                defer.resolve();
            },
            afterEndscreen: function (defer) {
                defer.resolve();
            }
        }
    };
    
    
    //To be extended by any Game
    pw.GameInterface = function(){
        
    };
    
    pw.GameInterface.prototype = {
        createQuestion: function(defer){
            defer.resolve();
        },
        check: function(defer){
            defer.resolve();
        },
        next: function(){
            
        },
        exit: function(){
            
        },
        destroy: function(){
            
        }        
    };
    
    
    
    pw.fixKAS = function(latex){
        return (latex || "").replace(/\\sqrt\{/g, "\\sqrt[2]{").replace(/\\, /g,'').replace(/\\,/g,'').replace(/\(\s*\)/g,'').replace(/\\left\(\s*\\right\)/g,'');
    };
    
    //Initialize singletons before localStorage could eventually change data
    window.pw = pw;
    
})();
    