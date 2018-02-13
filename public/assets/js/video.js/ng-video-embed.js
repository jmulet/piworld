

window.pw.app.register.service('videoEmbedUtils', ['$http', '$q', function ($http, $q) {
        var Service = {};
        //b: {idActivity: idActivity, resource: resource}
        Service.videoInfo = function (b) {
            //Given ID: Simply updates score and time

            var q = $q.defer();
            //Idle.watch();
            $http.post('/rest/video/vinfo', b).then(function (d) {
                q.resolve(d.data);
            });
            return q.promise;
        };

        //b: {idActivity: idActivity, resource: resource, idLogin: idLogin,  vscore: scoreAdded, vseconds: secondsAdded}
        Service.updateVisualization = function (b) {
            //Given ID: Simply updates score and time
            var q = $q.defer();
            //Idle.watch();
            $http.post('/rest/video/vscore', b).then(function (d) {
                q.resolve(d.data);
            });
            return q.promise;
        };

        //b: {id: id, idLogin: idLogin, formulation: formulation, answer: answer, rightAnswer: rightAnswer, isValid: isValid}
        Service.registerVisualizationQuizz = function (b) {
            var q = $q.defer();
            //Idle.watch();
            $http.post('/rest/video/vquizz', b).then(function (d) {
                q.resolve(d.data);
            });
            //Returns visualization_quizz table ID
            return q.promise;
        };

        Service.setRating = function (idActivity, idUser, rate) {
            $http.post('/rest/activity/updaterating', {idActivity: idActivity, idUser: idUser, vrating: rate});
        };

        return Service;
    }]);





window.pw.app.register.directive('videoEmbed', ['videoEmbedUtils', '$compile', 'Session', 'USER_ROLES', '$templateCache', '$timeout', 'Modals', '$window',
    function (videoEmbedUtils, $compile, Session, USER_ROLES, $templateCache, $timeout, Modals, $window) {

        var uniqId = 1;

        // from YT.PlayerState
        var stateNames = {
            '-1': 'unstarted',
            0: 'ended',
            1: 'playing',
            2: 'paused',
            3: 'buffering',
            5: 'queued'
        };

        var eventPrefix = 'youtube.player.';

        function RecurringTimer(callback, delay) {
            var timerId, start, remaining = delay;
            this.pause = function () {
                window.clearTimeout(timerId);
                remaining -= new Date() - start;
                timerId = null;
            };
            this.paused = function () {
                return timerId === null;
            };
            var resume = function () {
                start = new Date();
                timerId = window.setTimeout(function () {
                    remaining = delay;
                    resume();
                    callback();
                }, remaining);
            };
            this.resume = resume;
            this.resume();
        }

//
//    function formatTime(sec){
//        var seconds = Math.floor(sec),
//        hours = Math.floor(seconds / 3600);
//        seconds -= hours*3600;
//        var minutes = Math.floor(seconds / 60);
//        seconds -= minutes*60;
//
//        if (hours   < 10) {hours   = "0"+hours;}
//        if (minutes < 10) {minutes = "0"+minutes;}
//        if (seconds < 10) {seconds = "0"+seconds;}
//        return hours==="00"? minutes+':'+seconds : hours+':'+minutes+':'+seconds;
//    };
//    
        function convertTime(time) {
            if (typeof (time) === 'string') {
                var hms = time.split(":").reverse();
                try {
                    var t = 0;
                    var v = 1;
                    hms.forEach(function (s) {
                        t += parseInt(s) * v;
                        v *= 60;
                    });
                    time = t;
                } catch (ex) {
                    //console.log(ex);
                }
            }
            return time;
        }

        function irandom(a, b) {
            return Math.floor((b - a) * Math.random()) + a
        }

        return {
            restrict: 'EA',
            scope: {
                videoId: '=?',
                videoUrl: '=?',
                player: '=?',
                playerVars: '=?',
                playerHeight: '=?',
                playerWidth: '=?',
                questions: '=?',
                notes: '=?',
                crop: '=?',
                activity: '<', //Bean containg info of activity {id:234, idAssignment: 2234, etc...}
                offset: '=?',
                poster: '=?'
            },
            replace: true,
            templateUrl: 'assets/js/video.js/pw-video.html',
            link: function (scope, element, attrs) {

                Session.addCss("/assets/js/video.js/5.14/video-js.min.css");
                Session.addCss("/assets/js/video.js/5.14/videojs-markers.min.css");

                element.css({'max-width': '80%', margin: 'auto'});

                var playerId = Math.random().toString(36).slice(2);
                scope.playerId = playerId;

                scope.isMobile = window.pw.isMobile();

                scope.videoUrl = scope.videoUrl || "https://www.youtube.com/watch?v=" + scope.videoId;

                var CICLE_SEC = 10;
                var POINTS_PER_CICLE_SEC = 1;
                var MAX_VSCORE = 100;
                var SCORE_PENALTY = 5;
                var deadManTime = 150000;
                var seconds = 1;
                var t0 = 0;
                var accomplishedScore = 0;
                var accomplishedTime = 0;

                var user = Session.getUser();
                var amParent = (user.idRole === USER_ROLES.parents);
                var isGuest = (user.idRole === USER_ROLES.guest || amParent);
                var student = (user.idRole === USER_ROLES.student);
                var idLogin = user.idLogin;
                var idV = 0;
                var player, videoWrapper, questionsDiv, ratingDiv, timer;


                scope.soundSupported = false; //true;

                //Initialize sound only if required and supported by browser
                if (scope.questions && scope.soundSupported) {

                    var sounds = {'theme1': '/assets/sounds/theme.ogg',
                        'theme2': '/assets/sounds/answer_20sec.ogg',
                        'theme3': '/assets/sounds/answer_30sec.ogg',
                        'ok': '/assets/sounds/0236.ogg',
                        'wrong': '/assets/sounds/0899.ogg'};

                    pw.Sound.register(sounds);

                    scope.soundEnabled = false; //(user.uopts.vqsound!=0);
                    var soundThemeInstance = null;
                    scope.toggleSound = function () {
                        scope.soundEnabled = !scope.soundEnabled;
                        user.uopts.vqsound = scope.soundEnabled ? 1 : 0;
                        //persist changes over sessions
                        Session.updateUopts();
                        if (scope.soundEnabled) {
                            var t = Math.round(Math.random() * 2) + 1;
                            soundThemeInstance = "theme" + t;
                            pw.Sound.play("theme" + t, 2, 0.3);

                        } else {
                            pw.Sound.stop();
                        }
                    };
                }

                var activity = scope.activity || {};
                scope.idActivity = activity.id || 0;
                scope.idAssignment = activity.idAssignment || 0;


                //scope.questions can either be an object from controller or a string in json format
                if (typeof (scope.questions) === "string") {
                    try {
                        scope.questions = JSON.parse(scope.questions);
                    } catch (ex) {
                        //console.log("Error parsing JSON: "+ scope.questions);
                    }
                }

                if (scope.questions && scope.questions.length) {
                    scope.hasQuestions = true;
                    jQuery.each(scope.questions, function (indx, q) {
                        q.time = convertTime(q.time);
                        q.check = 0;
                    });
                } else {
                    //setup a fake question for deadManListener
                    //Choose a random time
                    deadManTime = 30000;
                    scope.hasQuestions = false;
                    scope.questions = [
                        {time: irandom(120, 700), check: 0, formulation: "Segueixes l'explicació?", type: "multiple",
                            options: []}
                    ];
                }

                if (scope.notes) {
                    jQuery.each(scope.notes, function (indx, q) {
                        q.time = convertTime(q.time);
                    });
                }

                //Convert time to seconds if given as string hh:min:sec
                function rebuildMarkers() {
                    scope.markers = [];

                    if (scope.hasQuestions) {

                        jQuery.each(scope.questions, function (indx, q) {
                            scope.markers.push({time: q.time, text: "Pregunta " + (indx + 1)});
                        });

                    }

                    if (scope.notes) {
                        jQuery.each(scope.notes, function (i, n) {
                            scope.markers.push({time: n.time, overlayText: n.text, markerStyle: {'width': '2px', 'background-color': 'Orange'}});
                        });
                    }
                }
                rebuildMarkers();

                scope.pg = {isPlaying: false, tgsQuestion: true, total: '00:00', ellapsed: "00:00", remaining: "00:00", max: 100, value: 0};
                scope.priv = false;
                scope.activity = {vscore: 0, vscorenow: 0};

                //scope.utils = videoEmbedUtils;            
                //scope.state = {fs: false, cclass:'row', showQuestions: false, qclass: 'col-xs-12 col-md-4', mclass: 'col-xs-12 col-md-8 col-md-offset-2', played: false};
                scope.state = {fs: false, cclass: 'row', showQuestions: false, qclass: 'col-xs-12 col-md-4', mclass: 'col-md-12', played: false};



                scope.play_pause = function () {

                    if (player) {
                        if (scope.pg.isPlaying) {
                            player.pause();
                        } else {
                            if (scope.deadManListener) {
                                $timeout.cancel(scope.deadManListener);
                            }
                            player.play();
                        }
                        scope.pg.isPlaying = !scope.pg.isPlaying;
                    }
                };

                scope.toggleOpt = function (opt) {
                    if (scope.question.check === 0) {
                        opt.selected = !opt.selected;
                    }
                };

                scope.toggleQuestion = function () {
                    scope.pg.tgsQuestion = !scope.pg.tgsQuestion;
                    questionsDiv.find(".vjs-questions-container").css("height", scope.pg.tgsQuestion ? "90%" : "40px");
                };

                scope.closeQuestions = function () {
                    if (scope.deadManListener) {
                        $timeout.cancel(scope.deadManListener);
                    }
                    questionsDiv.addClass("vjs-hidden");
                    player.controlBar.show();
                    scope.state.showQuestions = false;
                    scope.state.qclass = 'col-xs-12 col-md-4';
                    scope.state.mclass = 'col-md-12';
                    t0 += 1;
                    player.currentTime(player.currentTime() + 0.5);

                    player.play();
                    if (soundThemeInstance) {
                        pw.Sound.stop(soundThemeInstance);
                        soundThemeInstance = "";
                    }

                };


//            scope.toggleSelection = function(opt){
//                scope.question.check===0 && (opt.selected=!opt.selected);
//            };
//            
                /// CHECK THE VALIDITY OF A QUESTION
                scope.doCheck = function () {
                    if (scope.question.check) {
                        scope.closeQuestions();
                        return;
                    }

                    var sc_p = SCORE_PENALTY;

                    if (scope.question.type === 'input') {
                        if (scope.question.input == scope.question.answer) {
                            scope.question.check = 1;
                        } else {
                            scope.question.check = -1;
                        }
                    } else if (scope.question.type === 'multiple') {
                        scope.question.input = "";
                        scope.question.answer = "";
                        scope.question.check = 1;

                        var tpc = 1;

                        jQuery.each(scope.question.options, function (idx, opt) {
                            if (opt.selected) {
                                scope.question.input += opt.title + "; ";
                            }
                            if (opt.valid) {
                                scope.question.answer += opt.title + "; ";
                            }
                            if (opt.valid && opt.selected) {
                                opt.check = 1;
                            } else if (!opt.valid && !opt.selected) {
                                opt.check = 0;
                            } else {
                                opt.check = -1;
                                scope.question.check = -1;
                            }
                        });

                        sc_p = Math.floor(tpc * SCORE_PENALTY);

                    }

                    if (scope.soundEnabled) {
                        if (soundThemeInstance) {
                            pw.Sound.stop(soundThemeInstance);
                            soundThemeInstance = "";
                        }
                        // pw.Sound.play( scope.question.check>0? "ok": "wrong", 1, 0.5);                    
                    }

                    //Register question
                    if (!isGuest && idV > 0 && scope.hasQuestions) {
                        scope.activity.vscorenow = scope.activity.vscorenow + scope.question.check * sc_p;

                        videoEmbedUtils.registerVisualizationQuizz(
                                {idV: idV, formulation: scope.question.formulation,
                                    answer: scope.question.input, rightAnswer: scope.question.answer,
                                    isValid: scope.question.check > 0, penalty: sc_p});
                    }
                    if (scope.deadManListener) {
                        $timeout.cancel(scope.deadManListener);
                    }
                };


                function playing(event) {

                    applyBroadcast(eventPrefix + 'playing', player, event);
                    //Make sure to hide the Poster for vimeo
                    var videoWrapper = jQuery(player.el());
                    var find = videoWrapper.find(".vjs-poster");
                    if (find) {
                        find.addClass("vjs-hidden");
                    }


                    scope.state.played = true;
                    scope.pg.isPlaying = true;


                    //One CSS is loaded, must get rid of youtube linkv
                    //var iframe = $("#_media");
                    ////console.log(iframe);
                    // iframe.contents().find(".ytp-watermark.yt-uix-sessionlink" ).css( "visibility", "hidden" );


                    if (!timer)
                    {

                        timer = new RecurringTimer(function () {
                            if (player.paused()) {
                                return;
                            }


                            var addPts = 0;
                            //console.log(scope.activity.vscorenow + scope.activity.vscore, MAX_VSCORE, seconds, scope.duration);
                            if ((scope.activity.vscorenow + scope.activity.vscore) < MAX_VSCORE) //&& seconds <= scope.duration
                            {
                                scope.activity.vscorenow += POINTS_PER_CICLE_SEC;
                                addPts = POINTS_PER_CICLE_SEC;
                            }
                            seconds += CICLE_SEC;
                            if (!isGuest && seconds > 0 && scope.idActivity && !scope.isSessionDead)
                            {
                                accomplishedScore += addPts;
                                accomplishedTime += CICLE_SEC;

                                var bean = {id: idV, idActivity: scope.idActivity, idAssignment: scope.idAssignment, resource: attrs.videoUrl || playerId,
                                    idLogin: idLogin, vscore: addPts, vseconds: CICLE_SEC};
                                //console.log("Afegint puntuacio a rest", bean);
                                videoEmbedUtils.updateVisualization(bean).then(function (d) {
                                    if (!idV && d.ok) {
                                        idV = d.id;
                                    }
                                });
                            }


                        },
                                1000 * CICLE_SEC);
                    } else
                    {
                        timer.paused() && timer.resume();
                    }

                    //Prevent playing when showQuestions is on
                    if (scope.state.showQuestions) {
                        player.pause();
                    }


                }


                // Attach to element
                scope.playerHeight = scope.playerHeight || 390;
                scope.playerWidth = scope.playerWidth || 640;
                scope.playerVars = scope.playerVars || {};

                // YT calls callbacks outside of digest cycle
                function applyBroadcast() {
                    var args = Array.prototype.slice.call(arguments);
                    $timeout(function () {
                        scope.$emit.apply(scope, args);
                    });
                }


                function onPlayerReady(event) {

                    if (!player) {
                        return;
                    }

                    if (!isGuest && scope.idActivity)
                    {

                        videoEmbedUtils.videoInfo(
                                {idActivity: scope.idActivity, idAssignment: scope.idAssignment, resource: attrs.videoUrl || playerId, idUser: user.id}).then(function (d) {

                            //Adjust parameters according to the type of visualization
                            //Free or Assigned:
                            if (!scope.idAssignment) {
                                CICLE_SEC += 30;
                            }
                            if (d.closed) {
                                CICLE_SEC += 15;
                            }
                            //Open or closed  :
                            scope.activity.vscore = d.vscore || 0;
                            seconds = d.seconds || 0;
                            if (d.idLogins === idLogin) {
                                idV = d.id;

                            }
                        });
                    }

                    applyBroadcast(eventPrefix + 'ready', player, event);
                }

                function onPlayerError(event) {
                    //console.log('ERROR', event);
                    applyBroadcast(eventPrefix + 'error', player, event);
                }

                function onPlayerPause(event) {
                    //console.log("Pause event");
                    if (timer) {
                        timer.pause();
                    }
                    scope.pg.isPlaying = false;

                }

                function onTimeUpdate(event) {
                    var t1 = player.currentTime();
//                if(!player.paused() && !seeking){
//                    
//                    if (t1 > maxsec) {
//                        maxsec = t1;
//                    }
//                }

                    var found = null;
                    if (scope.questions) {
                        for (var i = 0; i < scope.questions.length; i++) {
                            if (t0 <= scope.questions[i].time && scope.questions[i].time <= t1) {
                                found = scope.questions[i];
                                break;
                            }
                        }
                    }

                    /// QUESTION FOUND                
                    if (found && !player.paused() && !scope.state.showQuestions) {
                        player.pause();
                        player.userActive(false);
                        player.controlBar.hide();
                        if (timer) {
                            timer.pause();
                        }
                        $timeout(function () {
                            scope.pg.isPlaying = false;
                            found.title = found.title || "Qüestió";

                            if (scope.playerVars.preview) {
                                found.input = "";
                                found.check = 0;
                                if (found.options) {
                                    jQuery.each(found.options, function (indx, opt) {
                                        opt.check = 0;
                                        opt.selected = false;
                                    });
                                }
                            }
                            scope.question = found;
                            scope.state.showQuestions = true;
                            questionsDiv.removeClass("vjs-hidden");
                            scope.state.qclass = 'col-xs-12 col-md-4';
                            scope.state.mclass = 'col-xs-12 col-md-8 grayscale';
                        });

                        // console.log("showing questions");
                        // Now you have a deadManTime to answer otherwise rollback()
                        if (!scope.isSessionDead) {
                            //console.log("Setting up deadManListener");
                            scope.deadManListener = $timeout(function () {
                                console.log("Visualization time is dead");
                                scope.isSessionDead = true;
                                //rollback scores in this session and no more points will be added
                                var bean = {id: idV, idActivity: scope.idActivity, idAssignment: scope.idAssignment,
                                    resource: attrs.videoUrl || playerId,
                                    idLogin: idLogin, vscore: -accomplishedScore, vseconds: -accomplishedTime};
                                //console.log("Afegint puntuacio a rest", bean);
                                videoEmbedUtils.updateVisualization(bean).then(function (d) {
                                    if (!idV && d.ok) {
                                        idV = d.id;
                                    }
                                });
                                scope.activity.vscorenow -= accomplishedScore;
                                scope.closeQuestions();
                                player.currentTime(0);
                                player.pause();
                                scope.questions = [
                                    {time: irandom(120, 600), check: 0, formulation: "Segueixes l'explicació?", type: "multiple",
                                        options: []}
                                ];
                            }, deadManTime);
                        }

                        if (scope.soundEnabled && found.check === 0) {
                            var t = Math.round(Math.random() * 2) + 1;
                            soundThemeInstance = "theme" + t;
                            pw.Sound.play("theme" + t, 2, 0.3);

                        }

                    }

                    t0 = t1;


                }

                scope.onRateVideo = function () {
                    videoEmbedUtils.setRating(scope.idActivity, user.id, scope.videoRating);
                    //Remove poster
                    ratingDiv.addClass("vjs-hidden");
//                //Reset player
//                player.posterImage.show();  
//                player.currentTime(0);  
//                player.controlBar.hide();  
//                player.bigPlayButton.show();  
//                player.cancelFullScreen();  
                };


                function createPlayer() {

                    var el = jQuery('#' + scope.playerId);
                    if (!el[0]) {
                        //console.log("scope.playerId not found"+ scope.playerId);
                        return;
                    }
                    el.empty();
                    //Create a video element
                    var html = "<video id=\"" + scope.playerId + "video\" class=\"video-js vjs-big-play-centered vjs-default-skin embed-responsive-item\" controls preload=\"auto\">\n" +
                            "<p class=\"vjs-no-js\">\n" +
                            "     To view this video please enable JavaScript, and consider upgrading to a web browser that \n" +
                            "     <a href=\"http://videojs.com/html5-video-support/\" target=\"_blank\">supports HTML5 video</a>\n" +
                            "</p>\n" +
                            "</video>";

                    var video = jQuery(html);
                    el.append(video);

                    var options = {techOrder: [], sources: []};
                    if (scope.poster) {
                        options.poster = scope.poster;
                    }
                    //Must detect tech
                    if (scope.videoUrl.toLowerCase().indexOf(".mp4") >= 0) {
                        options.techOrder.push("html5");
                        options.sources.push({type: "video/mp4", src: scope.videoUrl});
                        if (scope.idActivity) {
                            options.poster = "activities/" + scope.idActivity + "/icon_large.jpg";
                        }
                    } else if (scope.videoUrl.toLowerCase().indexOf("vimeo") >= 0) {
                        options.techOrder.push("vimeo");
                        options.sources.push({type: "video/vimeo", src: scope.videoUrl + "?bust=" + new Date().getTime()});
                        options.vimeo = {iv_load_policy: 1, ytControls: 0};
                        options.poster = "activities/" + scope.idActivity + "/icon_large.jpg";
                    } else {
                        options.techOrder.push("youtube");
                        scope.videoUrl = scope.videoUrl.replace(/http:/gi, "https:");
                        options.sources.push({type: "video/youtube", src: scope.videoUrl + "?bust=" + new Date().getTime()});
                        options.youtube = {ytControls: 0, cc_load_policy: 1, modestbranding: 1, forceSSL: true, autoplay: 0, rel: 0, playsinline: 1, enablejsapi: 1, origin: "https://pw.es"};
                    }

                    if (scope.offset) {
                        options.offset = scope.offset;
                        // {start: 10, //Start offset in seconds end: 40,    //End offset in seconds restart_beginning: false //Should the video go to the beginning when it ends}
                    }

                    player = videojs(video[0], options);   //scope.playerId+'video'
                    player.piWorld = player.piWorld || {};
                    player.markers({markerStyle: {'width': '4px', 'background-color': 'Lime'}, markers: scope.markers, breakOverlay: {display: true, displayTime: 4}});
                    //console.log("Markers", scope.markers);

                    videoWrapper = jQuery(player.el());
                    if (options.techOrder[0] === 'youtube') {
                        videoWrapper.find(".vjs-control-bar").before("<div class='transparent'></div>");
                    }

                    //Add question div
                    if (scope.questions) {
                        var html = $templateCache.get("/assets/libs/video.js/pw-questions.html");
                        questionsDiv = jQuery("<div class='vjs-questions vjs-hidden'></div>");
                        questionsDiv.append(html);
                        $compile(questionsDiv.contents())(scope);
                        videoWrapper.append(questionsDiv);
                    }

                    //Add picoin div
                    if (!isGuest && scope.idActivity > 0 && !scope.playerVars.preview) {
                        var html = $templateCache.get("/assets/libs/video.js/pw-picoin.html");
                        var picoinDiv = jQuery(html);
                        $compile(picoinDiv.contents())(scope);
                        videoWrapper.append(picoinDiv);
                    } else {
                        console.log("Not showing picoin because:: ");
                        console.log("isGuest: ", isGuest);
                        console.log("idActivity: ", scope.idActivity);
                        console.log("playerVars.preview: ", scope.playerVars.preview);
                    }

                    scope.questions && player.userActive(false);

                    player.ready(function () {
                        applyBroadcast(eventPrefix + 'unstarted', this);


                        //Handle fullscreen in iOS devices
                        if (pw.isMobile() && pw.bowser.Safari) {
                            var btn = el.find("button.vjs-fullscreen-control.vjs-control.vjs-button");
                            btn.unbind().off();
                            btn.on("click", function (evt) {
                                window.pw.FScreen.toggleFullscreen(el, btn);
                            });

                            window.pw.FScreen.setOnfullscreenchange(function (evt) {
                                if (!window.pw.FScreen.fullscreenElement()) {
                                    window.pw.FScreen.exitFullscreen();
                                }
                            });
                        }



                        this.on("loadedmetadata", onPlayerReady);
                        this.on("playing", playing);
                        this.on("error", onPlayerError);
                        this.on("pause", onPlayerPause);
                        this.on("timeupdate", onTimeUpdate);
                        this.on("durationchange", function () {
                            //Sometimes, player.getDuration() returns zero!
                            scope.duration = player.duration();
                            if (scope.duration) {
                                if (seconds > 2 * scope.duration) {
                                    console.log("Maximum visualization time detected for video " + scope.idActivity + ". No further points will be added.");
                                    POINTS_PER_CICLE_SEC = 0;
                                }
                            }
                        });
                        this.on('ended', function ()
                        {
                            if (scope.idActivity > 0 && !scope.playerVars.preview && !scope.videoRating) {

                                if (!ratingDiv) {
                                    var html = $templateCache.get("/assets/libs/video.js/pw-endposter.html");
                                    ratingDiv = jQuery(html);
                                    $compile(ratingDiv.contents())(scope);
                                    videoWrapper.append(ratingDiv);
                                } else {
                                    ratingDiv.removeClass("vjs-hidden");
                                }
                            }
                        });
                    });

                    player.id = playerId;

                    return player;
                }

                function loadPlayer() {
                    if (scope.videoId || scope.playerVars.list) {
                        if (player && typeof player.dispose === 'function') {
                            player.dispose();
                        }

                        //Lazy load videojs....
                        require(["videojs"], function (videojs) {
                            window.videojs = window.videojs || videojs;
                            player = createPlayer();
                        });

                    }
                }
                ;

                var stopWatchingMarkers1 = scope.$watchCollection('questions', function (newQ, oldQ) {
                    if (!player) {
                        return;
                    }
                    jQuery.each(scope.questions, function (indx, q) {
                        q.time = convertTime(q.time);
                    });
                    rebuildMarkers();
                    player.markers.reset(scope.markers);
                });

                var stopWatchingMarkers2 = scope.$watchCollection('notes', function (newN, oldN) {
                    if (!player) {
                        return;
                    }
                    jQuery.each(scope.notes, function (indx, q) {
                        q.time = convertTime(q.time);
                    });
                    rebuildMarkers();
                    player.markers.reset(scope.markers);
                });

//            var stopWatchingReady = scope.$watch(
//                function () {
//                    return scope.utils.ready
//                        // Wait until one of them is defined...
//                        && (typeof scope.videoUrl !== 'undefined'
//                        ||  typeof scope.videoId !== 'undefined'
//                        ||  typeof scope.playerVars.list !== 'undefined');
//                },
//                function (ready) {
//                    if (ready) {
//                        stopWatchingReady();
//
//                        // URL takes first priority
//                        if (typeof scope.videoUrl !== 'undefined') {
//                            scope.$watch('videoUrl', function (url) {
//                                scope.videoId = scope.utils.getIdFromURL(url);
//                                scope.urlStartTime = scope.utils.getTimeFromURL(url);
//
//                                //loadPlayer();
//                            });
//
//                        // then, a video ID
//                        } else if (typeof scope.videoId !== 'undefined') {
//                            scope.$watch('videoId', function () {
//                                scope.urlStartTime = null;
//                                //loadPlayer();
//                            });
//
//                        // finally, a list
//                        } else {
//                            scope.$watch('playerVars.list', function () {
//                                scope.urlStartTime = null;
//                                //loadPlayer();
//                            });
//                        }
//                    }
//            });

                scope.$watchCollection(['playerHeight', 'playerWidth'], function () {
                    if (player && scope.playerWidth && scope.playerHeight) {
                        player.setSize(scope.playerWidth, scope.playerHeight);
                    }
                });


                $timeout(loadPlayer);


                scope.gotoSource = function () {

                    var okcb = function () {
                        $window.open(scope.videoUrl, '_blank');
                    };
                    Modals.confirmdlg("Enllaç extern", "<p><b>ATENCIÓ!</b> Estau apunt de sortir de pw. No es comptaran punts de visualització.</p><p><b>SUGGERIMENT: </b>Deixau un comentari al canal youtube perquè el professor pugui saber que heu accedit al vídeo.</p><p>Voleu anar a youtube?</p>", okcb);

                };

                scope.$on('$destroy', function () {
                    stopWatchingMarkers1();
                    stopWatchingMarkers2();
                    if (scope.deadManListener) {
                        $timeout.cancel(scope.deadManListener);
                    }
                    var iframe = element.find("iframe");
                    if (iframe[0]) {
                        iframe[0].src = "about:blank";
                    }
                    if (player) {
                        player.dispose();
                        //Remove all children
                        jQuery('#' + scope.playerId).empty();
                    }
                    pw.Sound.stop();
                    $("button.vjs-fullscreen-control.vjs-control.vjs-button").off();
                    window.pw.FScreen.setOnfullscreenchange(null);
                });



            }
        };



    }]);
 