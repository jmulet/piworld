

(function (app) {
    'use strict';
    
    var generateID = function(){
        return Math.random().toString(36);
    };
    
    
    var scrollToLastChat = function(){
                
            var scrollElem;
            var mobile = pw.bowser.mobile;
            if(mobile){
                scrollElem = "html";
            } else {
                scrollElem = "#chat-body";
            }
            //Get all chat panels
            jQuery('.chat-scroll').each(function () {

                var elem = jQuery(this).find(".chat-entry").last();
                 //Try to scroll
                if (elem && elem.offset()) {
                     if(mobile){
                            window.scrollTo(0, elem.offset().top);
                        } else {
                            jQuery(scrollElem).animate({scrollTop: elem.offset().top}, 1000);
                        }
                }

            }); 
                   
    };
    
    var scrollToFirstChat = function(){
        var scrollElem;
        var mobile = pw.bowser.mobile;
        if (mobile) {
            scrollElem = "html";
        } else {
            scrollElem = "#chat-body";
        }
        jQuery(scrollElem).animate({scrollTop: 0}, 500);              
    };
    
    
    
    /***
     *  HomeService is used in order to share state among several instances of the same component
     ***/
    var homeService = function(Session, $q, $timeout, USER_ROLES, growl, $rootScope, $http){
   
        var service = this;
        var Socket = Session.getSocket();
        var chats;

        service.destroy = function(){
            chats = null;
            service.onlineUsers = [];
        };



        service.initialize = function(){
            pw.DEBUG &&  console.log("Home service initialization...");
            
            var user = Session.getUser();
            chats = {};
            service.onlineUsers = [];
            
            //Singleton feature to listen to socket over all app
            //listen to socket for possible notifications
            Socket.on('notification', function (data) {
                growl.notify(data.msg, {title: data.title, ttl: -1}); // referenceId: 'home',                     
            });


             
            Socket.on("chat-recieved", function (data) {
                var idGroup = Session.getCurrentGroup().idGroup;
                service.getChat(idGroup).then(function(dates){
                    var when = new Date();
                    var key = ("0" + (when.getDate())).slice(-2) + '-' + ("0" + (when.getMonth() + 1)).slice(-2) + '-' + when.getFullYear();
                    var obj = null;
                    jQuery.each(dates, function (i, e) {
                        if (e.date === key) {
                            obj = e;
                            return true;
                        }
                    });
                    if (!obj) {
                        obj = {date: key, list: []};
                        dates.push(obj);
                    }
                    obj.list.push(data);
                    $timeout(scrollToLastChat, 500);
                    
                    if (Session.soundSupported && data.idUser !== user.id) {
                        pw.Sound.play("newchat");
                    }
             });

            });
            
            Socket.on("chat-refresh", function (data) {
                var idGroup = Session.getCurrentGroup().idGroup;
                service.getChat(idGroup, true);
            });
            
            Socket.on("group-change", function (data) {
                ////console.log("Socket recieved group-change");
                ////console.log(data);
                jQuery.each(Session.getUser().groups, function (i, e) {
                    if (e.idGroup === data.idGroup) {
                        Session.getUser().groups[i] = data;
                        if (Session.getCurrentGroup().idGroup === data.idGroup) {
                            Session.setCurrentGroup(data);
                        }
                        return false;
                    }
                });
            });
            
            //Keeps the list of onlineUsers updated even being out of the home-scope
            Socket.on("connectedUsers", function (data) {
                service.onlineUsers = data.users;
                
                //Allow to close session at a distance through socket
                if (data.logout && data.logout.id === user.id) {
                    Session.logout();
                    return;
                }

                //broadcast an event, in order to update the list in the HomeController
                $rootScope.$broadcast('connectedUsers', {onlineUsers: service.onlineUsers});
                
                
                //Only for teachers--------------------                                 
                if (user.idRole < USER_ROLES.student) {
                    if (data.login && data.login.id !== user.id && $rootScope.fromState) {
                        growl.info(data.login.fullname, {title: 'Ha iniciat sessió'});
                    }
                    else if (data.logout && data.logout.id !== user.id) {
                        growl.info(data.logout.fullname, {title: 'Ha sortit de la sessió'});
                    }
                }

            });
            
            Socket.emit('addUser', user);
    }; //end initialize
                
    service.getChat = function (idGroup, forceReload, all) {

        var defer = $q.defer();
        if (forceReload && chats[idGroup]) {
            chats[idGroup].clear();
        }
        var obj = chats[idGroup];
        if (!obj || forceReload) {
            if (!obj) {
                obj = [];
                chats[idGroup] = obj;
            }

            $http.post('/rest/chats/list', {idGroup: idGroup, all: all || false}).then(function (r) {
                jQuery.each(r.data, function (indx, e) {
                    obj.push(e);
                });
                defer.resolve(obj);
                
                 
                if(all){
                    $timeout(scrollToFirstChat, 500);            
                } else {
                    $timeout(scrollToLastChat, 500);   
                }
            });
           
            
        } else {
            defer.resolve(obj);
        }

        return defer.promise;

    }; //end getChat
          
        pw.DEBUG &&  console.log("Home Service has been instantiated, but not initialized. Call manually HomeService.initialize();!!");
        //service.initialize();       
    
        return this;
        
    }; // End homeService
    
    app.service("HomeService", ["Session", "$q", "$timeout", "USER_ROLES", "growl", "$rootScope", "$http", homeService]);
    
    /**
     * Controller for component Welcome to PiWorld
     * @returns {undefined}
     */
    var pwcWelcomeCtrl = function(USER_ROLES) {
        var ctrl = this;
        this.pwcID = generateID();
        
        
        ctrl.toggleCenterGroups = function(){
            var elem = jQuery("#pwc-group-enroll");
            if(elem && elem.hasClass("ng-hide")){
                elem.removeClass("ng-hide");
            } else {
                elem.toggle();
            }    
                    
        };
        
        ctrl.$onInit = function () {
            ctrl.pwcID = generateID();
            window.pw.DEBUG && console.log("pwcWelcomeCtrl-"+ctrl.pwcID+": $oninit");                        
            ctrl.collapsed = ctrl.mobile? false: ctrl.collapse!==null? ctrl.collapse : false;  
            ctrl.teacher = (ctrl.user.idRole <  USER_ROLES.student);
            ctrl.amParent = (ctrl.user.idRole ===  USER_ROLES.parents);
        };
    };
    
    
    /**
     * Controller for component Scores
     * @param {type} $http
     * @param {type} USER_ROLES
     * @param {type} $translate
     * @param {type} $rootScope
     * @param {type} $filter
     * @returns {undefined}
     */
    var pwcScoresCtrl = function($http, USER_ROLES, $translate, $rootScope, $filter){
                var ctrl = this;
                ctrl.tgs = {};
                ctrl.USER_ROLES = USER_ROLES;
                ctrl.score = {};
                this.pwcID = generateID();
                
                ctrl.updateScores = function(toggle){
                
                
                if(toggle){
                    ctrl.tgs.showInterval =!ctrl.tgs.showInterval; 
                }
                
                if( ctrl.score.pos > 0)
                {
                    var objs = {};
                    if(ctrl.tgs.showInterval){
                        objs.fromDate = ctrl.tgs.fromDate? ctrl.tgs.fromDate.toISOString().substring(0, 19).replace('T', ' ') : null;
                        objs.toDate =  ctrl.tgs.toDate? ctrl.tgs.toDate.toISOString().substring(0, 19).replace('T', ' ') : null;
                    }  
                    if( ctrl.score.pos===1) //Scores for a group within a school (never pass schoolId)
                    {
                        //objs.schoolId = ctrl.user.schoolId;
                        objs.groupId =  ctrl.score.idgroup || ( ctrl.group && ctrl.group.idGroup);
                    }
                    else if( ctrl.score.pos===2) //Scores for all groups in a school
                    {
                          objs.schoolId = ctrl.user.schoolId;
                    }
                    else if( ctrl.score.pos===3) //All scores for all schools
                    {
                          objs.all = true;
                          objs.schoolId = ctrl.user.schoolId;
                    }
                    
                    $http.post('/rest/students/scores', objs).then(function(r){
                         //Try to shorten names
                        jQuery.each(r.data, function(i, e){
                           var fn = e.fullname;
                           var p = fn.split(",");
                           if(p.length>1){
                               var q = p[0].replace(/  /gi,' ').split(" ");
                               var out = q[0];
                               if(q.length>1){
                                    out += " "+q[1].substring(0,1)+".";
                               }
                               out += ", "+p[1];
                               e.fullname = out;
                           }
                        });
                        ctrl.allScores = r.data;                   
                     });
                }
                else
                {
                   $http.post('/rest/students/categoryscores', {idUser: ctrl.user.id} ).then(function (r) {
                        var d = r.data;
                        d.rscore = 0;
                        jQuery.each(d.badges, function(i, e){
                            d.rscore += e.rscore;
                            var desc = $rootScope.badgeDescription(e.type);
                            var punts = $translate.instant("SCORE");                            
                            e.html = "<div><p>"+desc+"</p> <p>"+$filter("date")(e.day, "dd-MM-yyyy")+
                                    "<p><p>"+e.rscore+" "+punts+"</p></div>";
                        });
                        
                        d.badgesFiltered = $.grep(d.badges, function(e, i){
                            return e.type < 200;
                        });
                        
                        ctrl.myScores = d;
                    });
                }                
            };
            
            
            ctrl.showScore = function(idx, idgroup)
            {
                ctrl.score.pos = idx;
                ctrl.score.idgroup = idgroup;
                
                ctrl.updateScores();                
            };
                
            ctrl.$onChanges = function(changes){
                 if(changes.group  && ctrl.group){   
                     
                    ctrl.showGrades2Students = ctrl.group.gopts.showGrades2Students;
                    ctrl.score.idgroup = ctrl.group.idGroup;
                    if(ctrl.score.pos===1) {
                        ctrl.updateScores();
                    }  
                }
            }; 
                
            ctrl.$onInit = function(){
                     window.pw.DEBUG && console.log("pwcScoresCtrl-"+ctrl.pwcID+": $oninit");  
                     ctrl.collapsed = ctrl.mobile? false: ctrl.collapse!==null? ctrl.collapse : false;    
                     ctrl.mobile? ctrl.panelbodyStyle = {} : ctrl.panelbodyStyle = {'max-height': '350px', 'overflow-y' : 'scroll'} ;
                     ctrl.score.pos = ctrl.user.idRole<USER_ROLES.student? 2 : 0;
                     ctrl.updateScores();    
            }; 
        
    };
    

    /**
     * Controller for Component Users ONLINE
     * @param {type} $http
     * @param {type} $uibModal
     * @param {type} Modals
     * @param {type} growl
     * @param {type} Session
     * @returns {undefined}
     */
    var pwcOnlineCtrl = function($http, $uibModal, $rootScope, $filter, $state, Modals, growl, Session, USER_ROLES){
            var ctrl = this;
            this.pwcID = generateID();
            var Socket = Session.getSocket();
            ctrl.USER_ROLES = USER_ROLES;
            ctrl.tgs = {};
            ctrl.onlineusers = [];   
            ctrl.participants = [];
            ctrl.orderByParticipants = "-lastLogin";
            ctrl.swithOrderByParticipants = function(){
                ctrl.orderByParticipants === "-lastLogin"? ctrl.orderByParticipants="+fullname" : ctrl.orderByParticipants = "-lastLogin";
            };
            
            ctrl.orderByParticipantsFunc = function(a){
                if(ctrl.orderByParticipants === "-lastLogin"){
                    return -a.lastLogin || 1e19;
                } else {
                    return a.fullname;
                }
            };
            
            ctrl.myFilter = function(bean) {
                if(!ctrl.tgs.filterNames){
                    return true;
                }       
                return (bean.fullname || "").toLowerCase().indexOf(ctrl.tgs.filterNames.toLowerCase())>=0;
            };
            
            ctrl.myFilter2 = function(bean) {
                if(!ctrl.tgs.filterNames2){
                    return true;
                }       
                return (bean.fullname || "").toLowerCase().indexOf(ctrl.tgs.filterNames2.toLowerCase())>=0;
            };
            
            
            var updateParticipants = function(){
                 $http.post('/rest/students/participants', {idGroup: ctrl.group.idGroup}).then(function(r){
                         //Try to shorten names
                        jQuery.each(r.data, function(i, e){
                                e.fullname = $filter("nameShortener")(e.fullname);                           
                        });
                        ctrl.participants = r.data;      
                });
                updateParticipantsOnline();
            };

  
            //Update online property in participants
            var updateParticipantsOnline = function(){
                if(ctrl.onlineusers){
                         ctrl.participants.forEach(function(e){
                          var found = false;
                          for(var i=0, len= ctrl.onlineusers.length; i<len; i++){
                              if( ctrl.onlineusers[i].id===e.id){
                                  found = true;
                                  e.lastLogin = ctrl.onlineusers[i].lastLogin;
                                  break;
                              }
                          }
                          e.online = found;
                      });
                  }
            };
            
            


            ctrl.sendNotification = function (id, fullname) {

                var okcb = function (value) {
                    var sms = value.trim();
                    if (sms) {
                        Socket.emit("notification", {title: ctrl.user.fullname, msg: sms, idUsers: [id]});
                    }
                };
                Modals.inputdlg("Message", "Send notification to " + fullname, "", okcb, null, {type: 'textarea'});
            };



            ctrl.sendEmail = function (u) {

                    var sender = function (bean) {
                        bean.to = u.email;
                        if (ctrl.user.email && ctrl.user.email.substring() !== '??') {
                            bean.from = ctrl.user.email;
                            bean.fromName = ctrl.user.emailPassword? ctrl.user.fullname : "";
                            bean.emailPassword = ctrl.user.emailPassword;
                        }
                        
                        $http({
                            method: 'POST',
                            url: '/rest/gapis/email',
                            data: pw.encrypt(JSON.stringify(bean)),
                            headers: {
                                'Content-Type': 'text/plain;charset=UTF-8'
                            }
                            }).then(function (r) {
                            if (r.data.ok) {
                                growl.success("S'ha enviat el correu a " + u.email);
                            } else {
                                growl.error("No s'ha pogut enviar el correu a " + u.email);
                                //console.log(r.data.msg);
                            }
                        });
                    };

                    var modalInstance = $uibModal.open({
                        templateUrl: 'app/components/home/email-dlg.html',
                        controller: ['$scope', function (scope) {
                                scope.ok = function () {
                                    if (!scope.bean.subject.trim() || !scope.bean.html.trim()) {
                                        return;
                                    }
                                    modalInstance.close(scope.bean);
                                };
                                scope.cancel = function () {
                                    modalInstance.dismiss();
                                };
                                scope.username = u.fullname;
                                scope.bean = {subject: "", html: ""};
                                scope.email = u.email;
                            }],
                        size: 'md'
                    });

                modalInstance.result.then(function(bean) {
                        sender(bean);            
                });

            };


            ctrl.showStudentProgress = function(u){
                if(!ctrl.group)
                {
                    return;
                }                
                var opts = {id: ctrl.group.idGroup, idUser: u.id};             
                $state.go("home.progress", opts);
            };
            


            //No pertany aqui
            ctrl.manageBadges = function(u){
                    //Open a modal
                    var modalInstance = $uibModal.open({
                    templateUrl: 'app/components/home/badges-dlg.html',
                    controller: ['$scope', function (scope) {
                            scope.ok = function () {                                   
                                modalInstance.close();                                    
                            };
                            
                            var load = function(){
                                $http.post("/rest/badges/list", {idUser: u.id}).then(function(r){
                                    scope.badges = r.data || [];
                                });
                            };
                            
                            scope.addBadge = function(){
                                var bean = {idUser: u.id, type: 1, idCreator: ctrl.user.id, rscore: 100, edit: true};
                                (scope.badges || []).push(bean);
                            };
                            
                            scope.addBadge = function(){
                                var bean = {idUser: u.id, type: 1, idCreator: ctrl.user.id, rscore: 100};
                                (scope.badges || []).push(bean);
                                scope.editBadge(bean);
                            };
                            
                            scope.deleteBadge = function(b){
                                $http.post("/rest/badges/delete", {id: b.id}).then(function(r){
                                   load(); 
                                });
                            };
                            
                            scope.editBadge = function(b){
                                 b.edit = true;
                                 b._type = b.type;
                                 b._rscore = b.rscore;
                            };
                            
                            scope.cancelEdit = function(b){
                                b.edit = false;
                                b.type = b._type;
                                b.rscore = b._rscore;
                            };
                            
                            scope.saveEdit = function(b){
                                b.edit = false;
                                delete b.edit;
                                delete b._type;
                                delete b._rscore;
                                 $http.post("/rest/badges/save", b).then(function(r){
                                   load(); 
                                });                                
                            };
                            
                            scope.badgesList = [
                                {id: 1, label: "Comments"},
                                {id: 2, label: "Regularity"},
                                {id: 3, label: "Best of week"},
                                {id: 4, label: "Best of month"},
                                {id: 5, label: "Week challenge"},
                                {id:50, label: "Kahoot competition winner"},
                                {id:100, label: "Xmas special badge"},
                                {id:101, label: "Easter special badge"}
                                
                            ];
                             
                            scope.user = ctrl.user;
                            scope.student = u;
                            load();
                        }],
                    size: 'lg'
                });
                    
                
            };
            
            
       ctrl.$onInit = function () {
             window.pw.DEBUG && console.log("pwOnlineCtrl-"+ctrl.pwcID+": $oninit");  
             ctrl.collapsed = ctrl.mobile? false: ctrl.collapse!==null? ctrl.collapse : false; 
              
             if (ctrl.mobile) {
                var elem = jQuery(".navbar");
                var top = 50;
                if(elem){
                    top = elem.height() || 50;
                }
                ctrl.panelheadingStyle = {position: 'fixed', top: top+'px', width: '100%', left: '0px', 'z-index': 1000};
                ctrl.panelbodyStyle = {'padding-top':'80px','padding-bottom':'40px'};                
            } else {
                ctrl.panelheadingStyle = {};
                ctrl.panelbodyStyle = {'max-height': '300px', 'overflow-y': 'auto'};
                ctrl.panelfooterStyle = {};
            }
             
             if(!ctrl.group){
                return;
            }
            
        };
        
          
     $rootScope.$on('connectedUsers', function (evt, d) {
        ctrl.onlineusers = d.onlineUsers;
        updateParticipantsOnline();
    });      

            
        ctrl.$onChanges = function(changes){
             if(changes.group && ctrl.group){
                updateParticipants();
            }
        };    
                
    };
    
    /*
     * Controller for Component Chat 
     */
    var pwcChatCtrl = function($http, $rootScope, Modals, Session, USER_ROLES, HomeService){
    
            var ctrl = this;
            this.pwcID = generateID();
            var Socket = Session.getSocket();
            ctrl.chat = {input:"", all: false, dates:[]};
            var chatData = [];
            var history = [];
            var historyPos = 0;
        
            ctrl.handleKeyEvent = function($event){
                if($event.keyCode === 13){  //ENTER
                    ctrl.xat();
                }
                else if ($event.keyCode === 38){  //UP
                    if(historyPos>0){
                        historyPos -= 1;                        
                    } else {
                        historyPos = history.length-1;
                    }
                    ctrl.chat.input = history[historyPos];
                }
                else if ($event.keyCode === 40){  //DOWN
                     if(historyPos< history.length-1){
                        historyPos += 1;                        
                     } else {
                         historyPos = 0;
                     }
                     ctrl.chat.input = history[historyPos];
                } else if ($event.keyCode === 27){  //ESC
                    ctrl.chat.input = "";
                }
            };
        
        
            ctrl.xat = function(){
                 
                var txt = (ctrl.chat.input || '').trim();
                if (!txt){
                    return;
                }
                history.push(txt);
                historyPos = history.length - 1;
                
                //Check if agreement is signed
                var okcb = function(){
                        Socket.emit("chat-send", {idUser: ctrl.user.id, fullname: ctrl.user.fullname, msg: txt, idGroup: ctrl.group.idGroup});                        
                        //when destroying session, send an email to teacher with all written data in chat; this data is stored in chatData array
                        chatData.push(txt);                        
                    };
                    
                    var submitAgree = function(){
                        ctrl.user.uopts.chatAgree = true;
                        $http.post("/rest/students/updateuopts", {uopts: ctrl.user.uopts, id: ctrl.user.id});
                        Session.updateCookies();
                        okcb();                        
                    };
                    
                    if(ctrl.user.idRole>=USER_ROLES.student && !ctrl.user.uopts.chatAgree){
                        Modals.confirmdlg("Condicions d'utilització del chat", "<h2>IMPORTANT</h2><p>El xat és una eina de comunicació i se n'ha de fer un ús responsable.</p>"+
                                "<p>Un ús <b>inadequat</b> o l'enviament de missatges <b>ofensius</b> pot dur les següents conseqüències segons la gravetat dels fets:<p>"+
                                "<ul>"+
                                "<li>L'eliminació dels missatges per part de l'administrador / professor</li>"+
                                "<li>La substracció de punts o qualificació del curs</li>"+
                                "<li>La impossibilitat d'enviar missatges</li>"+
                                "<li>Altres mesures disciplinàries a nivell de centre</li>"+
                                "</ul>"+
                                "<p>Si acceptau les condicions pitjau D'Acord. Si les rebutjau, pitjau Cancel·la</p>" , submitAgree);
                    } else {
                        okcb();
                    }
                    
               
                ctrl.chat.input = "";
            };
            
            ctrl.loadPreviousChats = function(){
                ctrl.chat.all = true;
                HomeService.getChat(ctrl.group.idGroup, true, true).then(function(d){
                    ctrl.chat.dates = d;
                });
            };
            
            ctrl.removeChatEntry = function(x){
                var okcb = function(){
                        $http.post("/rest/chats/delete", {id: x.id}).then(function(){                    
                            Socket.emit("chat-refresh", {idGroup: ctrl.group.idGroup});
                    });
                };
                
                Modals.confirmdlgpwd('Confirm delete chat entry ' + x.id, 'Segur que voleu eliminar aquesta entrada del chat?', okcb);
            };
            
            ctrl.lightColor = function(id){        
                var r = (id * 9301 + 49297) % 233280;
                return "hsl("+(r%360)+", "+(80+id%10)+"%, 90%)";
            };
          
            

            ctrl.$onInit = function () {
                ctrl.pwcID = generateID();
                 window.pw.DEBUG && console.log("pwChatCtrl-"+ctrl.pwcID+": $oninit");  
                 ctrl.collapsed = ctrl.mobile? false: ctrl.collapse!==null? ctrl.collapse : false; 
                 
            if (ctrl.mobile) {
                var elem = jQuery(".navbar");
                var top = 50;
                if(elem){
                    top = elem.height() || 50;
                }
                ctrl.panelheadingStyle = {position: 'fixed', top: top+'px', width: '100%', left: '0px', 'z-index': 1000};
                ctrl.panelbodyStyle = {'padding-top':'40px','padding-bottom':'80px'};                
                ctrl.panelfooterStyle = {position: 'fixed', bottom: '30px', width: '100%', left: '0px', 'z-index': 1000};
            } else {
                ctrl.panelheadingStyle = {};
                ctrl.panelbodyStyle = {'max-height': '300px', 'overflow-y': 'scroll'};
                ctrl.panelfooterStyle = {};
            }
 
           
            };


            ctrl.$onChanges = function (changes) {
                window.pw.DEBUG && console.log("pwChatCtrl-"+ctrl.pwcID+": $onChanges");  
                if(!ctrl.user || !ctrl.group){
                    return;
                }
                ctrl.amStudent = (ctrl.user.idRole  === USER_ROLES.student);
                        
                var allowGroup =ctrl.group? ctrl.group.gopts.postchats!==false: false;
                var userDenied = ctrl.user.uopts.postchats===false;
                                
                ctrl.canSendChat = ctrl.user.idRole<USER_ROLES.student || (allowGroup && !userDenied) || ctrl.user.uopts.postchats===true;
                
                if (changes.group && ctrl.group) {
                     window.pw.DEBUG && console.log("pwChatCtrl-"+ctrl.pwcID+": reload chat dates");  
                     HomeService.getChat(ctrl.group.idGroup, true, false).then(function(d){
                         ctrl.chat.dates = d;
                     });    
                     window.pw.DEBUG && console.log(ctrl.chat.dates);
                }
            };    
            
            
            ctrl.$onDestroy = function(){
                if(chatData.length && ctrl.user.professorEmail){
                        var bean = {to: ctrl.user.professorEmail, subject: "New chat from "+ctrl.user.fullname, text: chatData.join("\n"), html: chatData.join("<br>")};
                        if(pw.DEBUG){
                            //console.log("Sending email is disabled in DEBUG mode:: Email data ", bean);
                        } else {
                            $http.post("/rest/gapis/email", bean); 
                        }
                }
            };            
    
    };
    
    
     /*
     * Controller for Component Challenges 
     */
    var pwcChallengesCtrl = function($http, $uibModal, $ocLazyLoad, $translate, $rootScope, growl, Modals, Session, USER_ROLES){
        
        var ctrl = this;
         this.pwcID = generateID();
        ctrl.USER_ROLES = USER_ROLES;
        
       //************************************** Teacher features
        ctrl.manageChallenges = function(){
         
         var modalInstance = $uibModal.open({
                templateUrl: 'app/shared/manageChallenges.html',
                controller: ['$scope',  '$ocLazyLoad', function (scope,  $ocLazyLoad) {


                        $ocLazyLoad.load('nzToggle').then(function(){
                               $http.post("/rest/challenge/list", {idGroup: ctrl.group.idGroup}).then(function(r){
                                   scope.list = r.data;
                               });
                        });

                       scope.show = function(c){
                           scope.selected = c;
                           $http.post("/rest/challenge/list", {id: c.id, idGroup: ctrl.group.idGroup}).then(function(r){
                                scope.detail = r.data;
                           }); 
                       };
                       scope.back = function(){
                           scope.selected = null;
                       };

                       scope.changeCorrect = function(g){
                            $http.post("/rest/challenge/correct", {id: g.cqid, valid: g.valid}).then(function(r){
                                if(!r.data.ok){
                                    growl.error("Can't update challange correction :-(");
                                }
                            });
                       };

                       scope.ok = function(){
                              modalInstance.dismiss();
                       };                           
                    }],
                size: 'lg',
                windowTopClass: 'modal-fullscreen'
            });               
        };
        
        //************************************** Student features
         ctrl.showChallenges = function(){
               var modalInstance = $uibModal.open({
                    templateUrl: 'app/shared/userChallenges.html',
                    controller: ['$scope', function (scope) {
                           $http.post("/rest/challenge/list", {idUser: ctrl.user.id}).then(function(r){
                              scope.list = r.data;
                              scope.ok = function(){
                                  modalInstance.dismiss();
                              };
                           });
                        }],
                    size: 'lg',
                    windowTopClass: 'modal-fullscreen'
                    
                });               
        };
    
        ctrl.sendChallenge = function(){
                var ans = ctrl.challenge.myanswer;
                if(!ans){
                    return;
                }
                var id;
                if(ctrl.challenge._userAnswer){
                    id = ctrl.challenge._userAnswer.id;
                }
                $http.post("/rest/challenge/register", {id: id, idChallenge: ctrl.challenge.id, idUser: ctrl.user.id, answer: ans}).then(function(r){
                    Modals.notificationdlg("Gràcies per participar!", "La teva resposta ha estat desada. Tindràs la resposta a principis de la setmana que vé.");
                    ctrl.challenge.userAnswer = r.data;
                });
                
        };

        ctrl.modifyChallenge = function(){
                ctrl.challenge._userAnswer = ctrl.challenge.userAnswer;
                ctrl.challenge.myAnswer = ctrl.challenge.userAnswer.answer;
                delete ctrl.challenge.userAnswer;
        };


        var update = function(){
          
            if(!ctrl.challenge && ctrl.group && ctrl.user){
               
                    var level = 0;
                    if(ctrl.group){
                        if(ctrl.group.groupStudies[0]==="B"){
                            level = 2;
                        } else {
                            if(ctrl.group.groupLevel>2){
                                level = 1;
                            }
                        }
                    }
                  
                    $http.post("/rest/oftheday/all", {idUser: ctrl.user.id, level: level, lang: $translate.use()}).then(function(r) {
                         //From now on; challenges can be of two types
                        // Old bean
                        // New json question -- compatible with activities                        
                        var problem = r.data.problem;
                       //console.log(problem);
                        if($.isArray(problem.userAnswer) && problem.userAnswer.length){
                            problem.userAnswer = problem.userAnswer[0];
                        }
                        //console.log(problem);
                        
                        if(problem.quizz){
                            ctrl.isChallenge = 1;
                            //console.log(window.pw);
                            require(['/activities/libs/activity-bakejson.js', '/activities/libs/activity-quizz.min.js'], function(){
                                   //console.log(window.pw);
                                   //console.log(window.pw.BakeJson, window.pw.QuestionPanel, window.pw.Script);
                                
                                        var baked = window.pw.BakeJson(JSON.parse(problem.quizz, {}, ctrl.user.id))[0];
                                        var container = $("#challengePanel");
                                        var qp = new window.pw.QuestionPanel(container, null, {});
                                        if(baked){
                                            qp.setQuestion(baked[0]);
                                        }
                                  
                            });
                        } else {                                
                            ctrl.isChallenge = problem? 2: 0;
                            ctrl.challenge = problem;
                        }
                        
                        
                        
                    });
                 }
        };

        ctrl.$onInit = function () {
            ctrl.pwcID = generateID();
            window.pw.DEBUG && console.log("pwcChallengeCtrl-"+ctrl.pwcID+": $oninit");  
            ctrl.collapsed = ctrl.mobile? false: ctrl.collapse!==null? ctrl.collapse : false; 
            update();
        };
        
        ctrl.$onChanges = function(changes){
             if(changes.group && ctrl.group){
                ctrl.challenge = null;
                update();
        }
        };    
    };
    
    
     /*
     * Controller for Component Famous Quote 
     */
    var pwcFamousQuoteCtrl = function($http, $translate){
        
        var ctrl = this;
        
        ctrl.update = function(){
               $http.post("/rest/oftheday/quote", {lang: $translate.use()}).then(function(r){
                    ctrl.quote = r.data;
               });
        };
        
        ctrl.$onInit = function () {
            ctrl.pwcID = generateID();
             window.pw.DEBUG && console.log("pwcFamousQuoteCtrl-"+ctrl.pwcID+": $oninit");  
             ctrl.collapsed = ctrl.mobile? false: ctrl.collapse!==null? ctrl.collapse : false; 
            if(!ctrl.quote){
                ctrl.update();
            }
        };
    };
    
    
     /*
     * Controller for Component Famous Equation 
     */
    var pwcFamousEquationCtrl = function($http, $translate){
        
        var ctrl = this;
        
        ctrl.update = function(){
            $http.post("/rest/oftheday/eqn", {lang: $translate.use()}).then(function(r){
                    ctrl.equation = r.data;
            });
        };
        
        ctrl.$onInit = function () {
            ctrl.pwcID = generateID();
            window.pw.DEBUG && console.log("pwcFamousEquationCtrl-"+ctrl.pwcID+": $oninit");  
            ctrl.collapsed = ctrl.mobile? false: ctrl.collapse!==null? ctrl.collapse : false; 
            if(!ctrl.equation){
                ctrl.update(); 
            }
        };
    };
    
    
     
    /*
     * Controller for Component Group Enroll
     * Allows user to enroll/unroll of the list of groups in its school
     */
    var pwcGroupEnrollCtrl = function($http,  Session, growl, $rootScope){
        
        var ctrl = this;
        
        ctrl.update = function(){
            $http.post("/rest/groups/listcenter", {schoolId: ctrl.user.schoolId, idUser: ctrl.user.id}).then(function(r) {
                    ctrl.groupsCenter = r.data;
            });
        };
        
         
        ctrl.unenroll = function (g) {
             //save un-enroll 
             
            ctrl.group =  Session.getCurrentGroup();
            
             
            
            $http.post("/rest/groups/unenroll", {idUser: ctrl.user.id, idGroup: g.idGroup}).then(function(r) {
                          
                 
                var index = -1;
                var ngroups = ctrl.user.groups.length;
                for (var i = 0; i < ngroups; i++) {
                    if (ctrl.user.groups[i].idGroup === g.idGroup) {
                        index = i;
                        break;
                    }
                }
                if (index >= 0) {
                    ctrl.user.groups.splice(index, 1);
                } 
 
                 
                ngroups = ctrl.user.groups.length;
                if(( ctrl.group && g.idGroup === ctrl.group.idGroup ) && ngroups>0 )
                { 
                    ctrl.group = ctrl.user.groups[ngroups - 1];
                    Session.setCurrentGroup(ctrl.group);
                     $rootScope.$broadcast("changeGrp", {group: ctrl.group});
                 } else if(ngroups===0){
                    Session.setCurrentGroup(null);
                    $rootScope.$broadcast("changeGrp", {group: null});
                }
                
                growl.warning("Us heu desapuntat del grup "+g.groupName);
                
                ctrl.update(); 
            });
        };

        ctrl.enroll = function (g)
        {
             if (g.edit) {
                g.edit = !g.edit;
                g.enrollPwd = "";
            } else {
                g.enrollPwd = "";
                //Check if enrollPassword is required
                if (g.enrollPassword) {
                    g.edit = true;
                    return;
                }
            }

            ctrl.group =  Session.getCurrentGroup();
            

            $http.post("/rest/groups/doenroll", {idUser: ctrl.user.id, idGroup: g.idGroup, enrollPassword: g.enrollPwd}).then(function (r) {
                g.enrollPwd = "";
                var d = r.data;
                if (d.ok)
                {
                    growl.success(d.msg+" "+g.groupName);
                    d.group = d.group || {};
                    //CHECK:: Before adding the new group check if is already in list
                    var found;
                    jQuery.each(ctrl.user.groups, function(indx, grp){
                        if(grp.idGroup===d.group.idGroup){
                            found=true;
                            return true;
                        }
                    });
                    
                    if(!found){
                        ctrl.user.groups.push(d.group);
                        ctrl.group = ctrl.user.groups[ctrl.user.groups.length - 1];
                        Session.setCurrentGroup(ctrl.group);
                        $rootScope.$broadcast("groupChange", ctrl.group);
                    }
                }
                else
                {
                    growl.error(d.msg+" "+g.groupName);
                }
                ctrl.update();
                
            });
        };


        ctrl.toggleMe = function(){
            var elem = jQuery("#pwc-group-enroll");
            if(elem && elem.hasClass("ng-hide")){
                elem.removeClass("ng-hide");
            } else {
                elem.toggle();
            }    
        };
        
        ctrl.$onInit = function () {
            ctrl.pwcID = generateID();
            window.pw.DEBUG && console.log("pwcGroupEnrollCtrl-"+ctrl.pwcID+": $oninit");  
            if(ctrl.user){
                ctrl.update();
            } 
            
            //console.log("\t\t ctrl.mobile:", ctrl.mobile);
        };
    };
    
    
       
    /*
     * Controller for Quick search
     * Allows user to enroll/unroll of the list of groups in its school
     */
    var pwcQuickSearchCtrl = function($document, $state, $timeout, Session, USER_ROLES){
        
        var touchzone;
        var ctrl = this;
        ctrl.search = "";

        ctrl.doSearch = function(){
               
                $(".quick-search").fadeOut();
                if(!ctrl.search){
                    return;
                }
                
                var str = ctrl.search.trim().toLowerCase();
                      
            
                var user = Session.getUser();
                       
                if(user.idRole < USER_ROLES.student){

                        if(str.indexOf("edit")>=0){
                            str = str.replace(/edit/g, "").trim();
                            if(!isNaN(str)){
                         
                                if(user.idRole < USER_ROLES.student){
                                    $state.go("home.ide", {idActivity: parseInt(str)});
                                }
                            }
                        }

                        if(str.indexOf("create")>=0){

                            if(str.indexOf("video")>=0){
                                $state.go("home.editactivityV", {idActivity: 0});
                            } else if(str.indexOf("quizz")>=0){
                                $state.go("home.editactivityQ", {idActivity: 0});
                            }  else if(str.indexOf("upload")>=0){
                                $state.go("home.editactivityU", {idActivity: 0});
                            } else {
                                $state.go("home.editactivityA", {idActivity: 0});
                            }
                            

                        }
                
                }
                
                if(!isNaN(ctrl.search)){
                    //Assume activity
                    var idAct = parseInt(ctrl.search);
                    //Try to identify if there is an assigned activity... need access from pwcUnitsCtrl, however
                    //This is accomplished via Session service
                    //Session.assignmentsCache is a map of the form {idGroup: [], idGroup: [], etc... }
                    //it gets populated by the controller pwcUnitsCtrl when a groupChange is triggered.
                    
                    var idAssignment = 0;
                    
                    $.each(Object.values(Session.assignmentsCache || {}), function (i, units) {

                    $.each(units || [], function (k, unit) {
                        $.each(unit.assignments || {}, function (j, assign) {
                             if (assign.idActivity == idAct) {
                                idAssignment = assign.id;
                                return true;
                            }
                            if (idAssignment) {
                                return true;
                            }
                        });
                    });
                        
                        
                       
                    });
                    
                    
                    $state.go("home.activity", {idActivity: ctrl.search.trim(), idAssignment: idAssignment});
                }
             
        };

        ctrl.onEnter = function (evt) {
            if (evt && evt.which === 13) {
                ctrl.doSearch();
            }
        };


        ctrl.$onInit = function () {
            ctrl.pwcID = generateID();
            window.pw.DEBUG && console.log("pwcQuickSearchCtrl-" + ctrl.pwcID + ": $oninit");
            if (ctrl.user) {
                ctrl.update();
            }
            
            if(pw.isMobile()){
                touchzone = $("#mobile-button-search");           
                touchzone.on("click", function(){
                     $timeout(function(){ctrl.search = "";});
                     $(".quick-search").toggle();
                     $(".quick-search input").focus();
                });                            
            } else {
                $document.on('keypress', function (e) {
                    if (e.ctrlKey && e.which === 6) {
                        $timeout(function(){ctrl.search = "";});
                        $(".quick-search").toggle();
                        $(".quick-search input").focus();
                    }
                });
            }
            
        };

        ctrl.$onDestroy = function () {
            $document.off('keypress');
            if(touchzone){
                touchzone.off();
            }
        };
    };
    
    
    /*
     * CREATE ANGULAR COMPONENTS
     */
        
    app.component('pwcWelcome', 
        {
            bindings: {
                user: "<",
                group: "<",
                collapse: "<",
                mobile: "<"
            },
            templateUrl: "app/components/home/pwc-welcome.html",
            controller: ["USER_ROLES", pwcWelcomeCtrl],
            controllerAs: "vm"
        }
    );
  
    
     app.component('pwcScores', 
        {
            bindings: {
                user: "<",
                collapse: "<",
                mobile: "<",
                group: "<"
            },
            templateUrl: "app/components/home/pwc-scores.html",
            controller: ["$http", "USER_ROLES", "$translate", "$rootScope", "$filter", pwcScoresCtrl],
            controllerAs: "vm"
        }
    );
    
            
    app.component('pwcOnline', 
        {
            bindings: {
                user: "<",
                group: "<",
                collapse: "<",
                mobile: "<"
            },
            templateUrl: "app/components/home/pwc-online.html",
            controller: ["$http", "$uibModal", "$rootScope", "$filter", "$state", "Modals", "growl", "Session", "USER_ROLES", pwcOnlineCtrl],
            controllerAs: "vm"
        }
    );
    
    
    app.component('pwcChat', 
        {
            bindings: {
                user: "<",
                group: "<",
                collapse: "<",
                mobile: "<"
            },
            templateUrl: "app/components/home/pwc-chat.html",
            controller: ["$http", "$rootScope", "Modals", "Session", "USER_ROLES", "HomeService", pwcChatCtrl],
            controllerAs: "vm"
        }
    );
 
    
     app.component('pwcChallenges', 
        {
            bindings: {
                user: "<",
                group: "<",
                collapse: "<",
                challenge: "<",
                mobile: "<"
            },
            templateUrl: "app/components/home/pwc-challenges.html",
            controller: ["$http", "$uibModal", "$ocLazyLoad", "$translate", "$rootScope", "growl", "Modals", "Session", "USER_ROLES", pwcChallengesCtrl],
            controllerAs: "vm"
        }
    );
    
    
    app.component('pwcFamousQuote', 
        {
            bindings: {
                user: "<",
                collapse: "<",
                mobile: "<"
            },
            templateUrl: "app/components/home/pwc-famous-quote.html",
            controller: ["$http", "$translate", pwcFamousQuoteCtrl],
            controllerAs: "vm"
        }
    );
    
    
     app.component('pwcFamousEquation', 
        {   
            bindings: {
                equation: "<",
                collapse: "<",
                mobile: "<"
            },      
            templateUrl: "app/components/home/pwc-famous-equation.html",
            controller: ["$http","$translate", pwcFamousEquationCtrl],
            controllerAs: "vm"
        }
    );
    
    app.component('pwcGroupEnroll', 
        {   
            bindings: {
                user: "<",
                mobile: "<"
            },      
            templateUrl: "app/components/home/pwc-group-enroll.html",
            controller: ["$http", "Session", "growl", "$rootScope", pwcGroupEnrollCtrl],
            controllerAs: "vm"
        }
    );
  
    app.component('pwcQuickSearch', 
        {   
            bindings: {
                user: "<",
                mobile: "<"
            },      
            template: '<div class="input-group"><input type="text" ng-model="vm.search" placeholder="Cerca a piWorld" ng-keyup="vm.onEnter($event)" class="form-control"/><span class="input-group-btn"><button class="btn btn-default glyphicon glyphicon-search" ng-click="vm.doSearch()"></button></span></div>',
            controller: [ "$document", "$state", "$timeout", "Session", "USER_ROLES", pwcQuickSearchCtrl],
            controllerAs: "vm"
        }
    );
})(window.pw.app.register);