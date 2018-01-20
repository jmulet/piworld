/**
 * Defines the controller for the state previous to the activity execution
 * 
 * Requires ActivityBase in order to define and load the activity
 *  which in turn requires ActivitySrv
 */


(function (app) {

    var activityPreCtrl =
            function ($scope, $rootScope, $filter, $state,  $transition$, USER_ROLES, $timeout,
                    $anchorScroll, $location, $http, Session, growl, $uibModal, $window, Modals, Upload, $translate, $templateCache, $translate) {

                $scope.idActivity = $transition$.params().idActivity || 0;
                $scope.idAssignment = $transition$.params().idAssignment || 0;
               
 
                var user = Session.getUser();
                //Session.getHomeService(); //just to initialize in case of page reload;
                $scope.user = user;
                if (!user) {
                    console.log("ActivityPreController error. User not defined");
                    return;
                }
                $scope.amParent = user.idRole === USER_ROLES.parents;     
                $scope.isGuest = (user.idRole === USER_ROLES.guest || $scope.amParent);                
                $scope.USER_ROLES = USER_ROLES;
                $scope.showTitleInfo = false;

                //var ActivitySrv = ActivitySrv1;

                var seconds = 1;  //Fes que sumi un segon per saber que ha entrat a la pàgina

                $scope.animate = "";
                $scope.hideAtmpPanel = false;
                $scope.count = 0;
                $scope.showWarning = false;
                $scope.empty = false;
                $scope.uploads = [];

                var st = 5;
                var sa = 5;
                $scope.theoryClass = "col-sm-5 notebook";
                


                //============================================related stuff
                $scope.related = [];
                var r = Session.getRelatedActivity();

                if (r) {  //Related from current unit
                    jQuery.each(r, function (i, e) {
                        if (e.idActivity && e.id && e.idActivity !== $scope.idActivity) {
                            if (!e.icon) {
                                e.icon = 'assets/img/quiz.png';
                            }
                            $scope.related.push(e);
                        }
                    });
                }


                $scope.goRelated = function (r) {
                    $state.go("home.activity", {idActivity: r.idActivity, idAssignment: r.idAssignment || 0});
                };

                //================================================

                var playersInPage = {};

                var selectedGroup = Session.getCurrentGroup() || $scope.$parent.selectedGroup;

                var allowGroup = selectedGroup ? (selectedGroup.gopts? (selectedGroup.gopts.postcomments !== false? true : false) : false ) : false;
                var userDenied = $scope.user.uopts.postcomments == false;
                var postcomments = !$scope.amParent && ($scope.user.idRole < USER_ROLES.student || (allowGroup && !userDenied) || $scope.user.uopts.postcomments == true);

                $scope.rest = {use: false, postcomments: postcomments, teacher: $scope.user.idRole < USER_ROLES.student};

                $scope.backPage = "home.activitysearch";
                $scope.backParams = {};

                $scope.openIde = function(){
                    $state.go("home.ide", {idActivity: $scope.idActivity});
                };


                /**
                 * Obtains data of the activity from database.
                 * this data needs to be internationalized according to current lang.
                 * It also retrieves information about visualization points
                 */

                var initialized;

                var update = function () {
                    $http.post("/rest/activity/get", {idActivity: $scope.idActivity, idAssignment: $scope.idAssignment, idUser: Session.getUser().id, idLogin: Session.getUser().idLogin, counter: 1}).then(
                            function (r) {
                                var data = r.data;
                                $scope.activity = data;
                                $scope.activity.idAssignment = $scope.idAssignment;
                                $scope.activity.onplay = "fullscreen";
                                $scope.canEdit = (data.createdBy === user.username);
                                
                                //Now you can insert theory with videos, ng-video-embed relies on $scope.activity object to be injected in
                                $scope.theoryData = data.theoryData || "";
                                $templateCache.put("activities/theory.html", $scope.theoryData);
                                
                                $scope.activity.vscorenow = 0;
                                $scope.containsVideo = $scope.activity.ytid ? true : false;

                                //Related from database
                                var course = selectedGroup.groupLevel + ' ' + selectedGroup.groupStudies;

                                var search_params = {text: data.category.replace(/,/g, ' '), simple: true, username: user.username,
                                    slevel: ($scope.user.idRole === USER_ROLES.guest ? 2 : 1),
                                    idSubject: selectedGroup ? selectedGroup.idSubject : 1,
                                    lang: $translate.use(),
                                    limit: 10
                                            //,course: selectedGroup.groupLevel + ' '+ selectedGroup.groupStudies
                                };


                                $http.post("rest/activity/searchActivities", search_params).then(function (r) {
                                    var d = r.data;
                                    var data = d.results;

                                    //sort data according to the current level
                                    data = data.sort(function (a, b) {
                                        var comp = 0;
                                        comp += a.levels.indexOf(course) >= 0 ? -1 : 0;
                                        comp += b.levels.indexOf(course) >= 0 ? 1 : 0;
                                        return comp;
                                    });

                                    jQuery.each(data, function (i, e) {
                                        if (e.id !== $scope.idActivity) {

                                            var contains = false;
                                            jQuery.each($scope.related, function (j, el) {
                                                if (e.id === el.idActivity) {
                                                    contains = true;
                                                    return true;
                                                }
                                            });

                                            if (!contains) {
                                                if (!e.icon) {
                                                    e.icon = 'assets/img/quiz.png';
                                                }
                                                e.idActivity = e.id;
                                                e.id = 0;
                                                $scope.related.push(e);
                                            }
                                        }
                                    });

                                    if (!$scope.related.length) {
                                        sa = 6;
                                        st = 6;
                                    }

                                  
                                });

                                //Determine whether this assignment is still open otherwise set idAssignment to ZERO (FREE MODE)
                                var idAssignment = $scope.idAssignment;
                                if (!data.assignment.open) {
                                    idAssignment = 0;
                                }

                                //If the activity a.levels does not contain user.groupLevel + ' ' + user.groupStudies then
                                //The activity must not be stored in database! A warning must be shown!
                                $scope.rest.use = true;

                                if (user.idRole !== USER_ROLES.student)
                                {
                                    $scope.rest.use = false;
                                }
                                else if (!$scope.idAssignment)
                                {
                                    window.pw.app.DEBUG && console.log(data.levels);
                                    window.pw.app.DEBUG && console.log(selectedGroup.groupLevel + ' ' + selectedGroup.groupStudies);
                                    if (user.idRole >= USER_ROLES.student && (data.levels || '').indexOf(selectedGroup.groupLevel + ' ' + selectedGroup.groupStudies) < 0)
                                    {
                                        $scope.rest.use = false;
                                        $scope.showWarning = true;
                                    }
                                }
                                $scope.idAssignment = idAssignment;
                                $scope.changeRest();

                                if ($scope.activity.activityType === 'U' && $scope.idAssignment > 0) {
                                    loadUploads();
                                }

                                initialized = true;
                            });
                };

                update();


                //The rest of parameters are via $transition$
                $scope.path = "activities/" + $transition$.params().idActivity + "/";

                $scope.goParams = {idActivity: $transition$.params().idActivity};



                $scope.back = function () {

                    if ($rootScope.previousState !== "home.activity.go")
                    {
                        $state.go($rootScope.previousState);
                    }
                    else
                    {

                        if (user.idRole === USER_ROLES.guest) {
                            $state.go("home.activitysearch");
                        } else {
                            $state.go("home");
                            $scope.$parent.reload();
                        }


                    }
                };

                $scope.goHome = function () {
                    if (user.idRole === USER_ROLES.guest) {
                        $scope.$parent.toggleMain(false);
                        $state.go("home.activitysearch");
                    } else {
                        $scope.$parent.reload();
                        $state.go("home");
                    }

                };


                //Video control - only allows one video playing at a time.
                $scope.$on('youtube.player.unstarted', function ($event, player) {
                    playersInPage[player.id] = player;
                    if (Object.keys(playersInPage).length === 1 && $transition$.params().autoplay == 1) {
                        $scope.playVideo();
                    }
                });
                $scope.$on('youtube.player.playing', function ($event, player) {
                    
                    $scope.vscorenow = 1; //This is just to say that the video has been pressed.
                    jQuery.each(Object.keys(playersInPage), function (indx, vid) {
                        //Stop all other active players in page
                        if (playersInPage[vid] !== player) {
                            playersInPage[vid].pause();
                        }
                    });
                    playersInPage[player.id] = player;
                });
                $scope.$on('youtube.player.paused', function ($event, player) {
                  
                    $scope.vscorenow = 1; //This is just to say that the video has been pressed.           
                });

//        $scope.createSheet= function(atmp){
//            if(user.idRole>=USER_ROLES.student && !doCheck())
//            {
//                growl.warning("Abans de començar la pràctica, heu de veure els videos");
//                return;
//            }
//            $state.go("home.sheet", {idActivities:""+$scope.idActivity});
//        };

                $scope.playVideo = function () {
                    var k = Object.keys(playersInPage);
                    if (k.length) {
                        playersInPage[k[0]].play();
                    }
                };


//     
//        //This is only for theachers - used to start a new kahoot - Generates a kahootID
//        $scope.startKahoot = function(){
//            //Move to a new state waiting students to join this kahoot
//            $state.go("home.activity.kahoot", {idActivity: $scope.idActivity, idAssignment: $scope.idAssignment, idGroup: Session.getCurrentGroup().idGroup});
//        };
//        
//        $scope.reportKahoot = function(){
//            //Move to a new state waiting students to join this kahoot
//            $state.go("home.activity.kahootreport", {idActivity: $scope.idActivity, idAssignment: $scope.idAssignment, idGroup: Session.getCurrentGroup().idGroup});
//        };
//        

//        $scope.startAttempt = function(){
//            if(!initialized){
//                return;
//            }
//            if(user.idRole>=USER_ROLES.student && !doCheck())
//            {
//                growl.warning("Abans de començar la pràctica, heu de veure els videos");
//                return;
//            }
//            
//            
//            var refreshInterval = 1000;
//            var delay = 500;


                //show Preparados, Listos, Ya animation...
//            var animateInstance = $uibModal.open(
//                    {templateUrl: 'app/shared/countdown.html',
//                    controller: ['$scope', '$uibModal', '$interval', function($scope, $uibModal, $interval){
//
//                            $scope.countdown = 3;
//                            $scope.img = "red";
//                            var interval = 900 ;
//
//                            var timer = $interval(function(){
//                                $scope.countdown -= 1;
//
//                                switch($scope.countdown)
//                                {
//                                    case 3: $scope.img = "red"; break;
//                                    case 2: $scope.img = "orange"; break;
//                                    case 1: $scope.img = "green"; break;
//                                    default: $scope.img = "green";
//                                }
//
//                                if($scope.countdown==0)
//                                {
//                                    $interval.cancel(timer);
//                                    animateInstance.dismiss();                    
//                                }
//
//                            }, interval);
//
//                                
//                            $scope.go = function(){
//                                   animateInstance.close(false);
//                            };
//
//                            $scope.$on("$destroy", function(){
//                                $interval.cancel(timer);
//                            });
//                    }],
//                    size: 'xs'
//            });



//        };


        //On destroy this state, update the visualization points
        $scope.$on('$destroy', function(){          
                Session.idActivity =  0;
                Session.idAssignment = 0;
        });


                $scope.updateRating = function () {
                    if($scope.activity.vrating){
                        $http.post('/rest/activity/updaterating', {idActivity: $scope.idActivity, idUser: Session.getUser().id, vrating: $scope.activity.vrating});
                    }
                };

                $scope.saveComment = function (c)
                {
                    if (c.id <= 0 && c.comment.trim().length <= 0) {
                        var idc = $scope.activity.comments.indexOf(c);
                        $scope.activity.comments.splice(idc, 1);
                        return;
                    }

                    delete c.bck;
                    c.edit = false;
                    $http.post('/rest/activity/updatecomment', c).then(function (r) {
                        var d = r.data;
                        if (c.id <= 0) {
                            c.id = d.id;
                        }
                        if (d.deleted) {
                            var idc = $scope.activity.comments.indexOf(c);
                            $scope.activity.comments.splice(idc, 1);
                        }
                    });
                };

                $scope.edita = function (c) {
                    if ($scope.rest.postcomments && (user.id == c.idUser || (c.schoolId == user.schoolId && user.idRole < USER_ROLES.student))) {
                        c.edit = !c.edit;
                        c.bck = c.comment;
                    }
                };

                $scope.deleteComment = function (c)
                {

                    var modalInstance = $uibModal.open({
                        templateUrl: 'app/shared/confirm-dlg.html',
                        controller: ['$scope', function ($scope) {
                                $scope.ok = function () {
                                    modalInstance.close();
                                };
                                $scope.cancel = function () {
                                    modalInstance.dismiss();
                                };

                                $scope.title = "Confirm delete";
                                $scope.msg = "<p>Segur que voleu eliminar el missatge de dia " + $filter("date")(c.when, "dd-MM-yyyy HH:mm") + " creat per " + c.fullname + "?</p>";
                            }],
                        size: 'xs'
                    });

                    modalInstance.result.then(function () {
                        $http.post('/rest/activity/delcomment', {id: c.id}).then(function (r) {
                            var idc = $scope.activity.comments.indexOf(c);
                            $scope.activity.comments.splice(idc, 1);
                        });
                    });

                };

                $scope.newcomment = function (c)
                {
                    var bean = {id: 0, idUser: $scope.user.id, idActivity: $scope.idActivity, when: new Date(), comment: "", schoolId: $scope.user.schoolId, avatar: $scope.user.uopts.avatar, edit: true,
                        fullname: $scope.user.fullname};
                    window.pw.app.DEBUG && console.log(bean);
                    $scope.activity.comments.push(bean);

                    //wait to dom to be updated
                    $timeout(function () {
                        var newHash = 'c' + ($scope.activity.comments.length - 1);
                        if ($location.hash() !== newHash) {
                            // set the $location.hash to `newHash` and
                            // $anchorScroll will automatically scroll to it
                            $location.hash(newHash);
                        } else {
                            // call $anchorScroll() explicitly,
                            // since $location.hash hasn't changed
                            $anchorScroll();
                        }
                    }, 200);

                }

                //Register Static File Access into the database
                $scope.registerSFA = function (event) {
                    event.preventDefault();
                    var url = event.target.href;
                    $window.open(url, '_blank');
                    if ($scope.user.idRole === USER_ROLES.student) {
                        var vscore = event.target.attributes['vscore'].value;
                        $http.post("/rest/video/vscore", {idActivity: 0, idLogin: $scope.user.idLogin, vscore: vscore || 1, vseconds: 0, resource: url});
                    }
                };

                $scope.assign = function () {
                    $state.go("home.assignments.assign", {idActivity: parseInt($scope.activity.id), idGroup: Session.getCurrentGroup().idGroup, idAssignment: 0});
                };

                $scope.clone = function () {
                    $http.post("/rest/activity/clone", {activity: $scope.activity, username: Session.getUser().username}).then(function (r) {
                        var d = r.data;
                        if (d.ok) {
                            growl.success("Cloned activity " + $scope.activity.id + " with new id=" + d.id);
                            $state.go("home.activity", {idActivity: parseInt(d.id), idAssignment: 0});
                        }
                    });
                };

                $scope.edit = function () {
                    var mode = $scope.activity.activityType || "A";
                    if (mode !== "A" && mode !== "Q" && mode !== "V" && mode !== "U") {
                        mode = "A";
                    }
                    $state.go("home.editactivity" + mode, {idActivity: parseInt($scope.activity.id)});
                };

                $scope.ide = function () {
                    $state.go("home.ide", {idActivity: parseInt($scope.activity.id)});
                };

                $scope.remove = function () {
                    var id = $scope.activity.id;
                    var okcb = function () {
                        $http.post("/rest/activity/delete", {id: id}).then(function (r) {
                            growl.success("S'ha eliminat l'activitat.");
                            $state.go($rootScope.previousState);
                        }, function () {
                            growl.error(":-( Unable to delete activity.");
                        });
                    };

                    Modals.confirmdlgpwd('Confirm delete activity ' + id, 'Segur que voleu eliminar aquesta activitat?', okcb);
                };


                function loadUploads() {
                    $scope.uploadsDB = [];
                    var p = {idAssignment: $scope.idAssignment};
                    if ($scope.user.idRole >= USER_ROLES.student) {
                        p.idUser = $scope.user.id;
                    }
                    $http.post('/rest/fs/uploads/list', p).then(function (r) {
                        $scope.uploadsDB = r.data;
                    });
                }
                ;

                $scope.deleteUploads = function (u) {
                    $http.post('/rest/fs/uploads/delete', {id: u.id, idUser: $scope.user.id, file: u.file}).then(function (r) {
                        var d = r.data;
                        if (!d.ok) {
                            growl.error(d.msg);
                        }
                        loadUploads();
                    });
                };

                $scope.updateUploadsScore = function (u) {
                    $http.post('/rest/fs/uploads/update', u).then(function (r) {
                        var d = r.data;
                        if (!d.ok) {
                            growl.error("Could not update score for " + u.fullname);
                        }
                    });
                };


                var updateImporting = function () {


                };


                $scope.uploadFiles = function (files) {
                    if (files === null) {
                        return;
                    }

                    var desc = "";
                    for (var i = 0; i < files.length; i++) {
                        desc += files[i].name + "; ";
                    }

                    var upBean = {description: desc, progress: "0 %", status: 0};

                    $scope.uploads.push(upBean);
                    Upload.upload({
                        url: '/rest/fs/upload',
                        fields: {username: user.username, path: "/.uploads/", idUser: user.id, idAssignment: $scope.idAssignment, type: 'U'},
                        file: files
                                //files: files
                    }).then(
                            function (res) {
                                $scope.importing = false;
                                if (res.data.log) {
                                    Modals.notificationdlg("Upload log", res.data.log);
                                }
                                upBean.status = 1;
                                upBean.progress = 'DONE';
                                updateImporting();
                                loadUploads();
                            },
                            function (res) {
                                $scope.importing = false;
                                $scope.uploadPercent = "ERROR!";
                                growl.error('Upload error. Status: ' + res.status);
                                $scope.selectNode = null;
                                upBean.status = -1;
                                upBean.progress = 'ERROR';
                                updateImporting();
                            },
                            function (evt) {
                                var progressPercentage = parseInt(100.0 * evt.loaded / evt.total);
                                upBean.progress = progressPercentage + '% ';
                              
                            }
                    );

                };

                $scope.closeWarning = function () {
                    $scope.showWarning = false;
                };

                $rootScope.adjustPadding(true);


                $rootScope.$on("changeLang", function (evt, lang) {
                    update();
                });

            };

    app.controller('ActivityPreCtrl', ['$scope', '$rootScope', '$filter', '$state', '$transition$', 'USER_ROLES',
        '$timeout', '$anchorScroll', '$location',
        '$http', 'Session', 'growl', '$uibModal', '$window', 'Modals', 'Upload', '$translate', '$templateCache', '$translate', activityPreCtrl]);




})(window.pw.app.register);