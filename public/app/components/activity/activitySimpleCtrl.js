/*
 * Generic controller for all activities in the category Simple
 * 
 */
define([], function () {
    "use strict";
    window.pw.app.register.controller('ActivitySimpleCtrl',
            ['$scope', '$state', '$uibModal', '$http', '$filter', '$timeout', '$transition$', 'Session', 'USER_ROLES', 'growl',
                function ($scope, $state, $uibModal, $http, $filter, $timeout, $transition$, Session, USER_ROLES, growl) {

                        var canCheck = true;
                        var finished = false;   
                        var user = Session.getUser();
                        var idUser = user.id;

                        if(!$scope.$parent.showTitleInfo)
                        {
                            //This is an error, you can't access this page!!!!
                            $state.go("home.activity", $transition$);
                            return;
                        }
                        
                        var QP = $scope.$parent.QP;
                        
                        
                        var success = function(){    
                            canCheck =  QP.config.canCheck;
                            
                            //console.log("SETSCOPE IS RESOLVED AND CALLED SUCCESS FUNC");
                            if(QP._generatedQuestions.length===0)
                            {
                                $scope.question = "Upps! This activity does not contain any questions :-(";
                                $scope.done = true;
                                return;
                            }

                            $scope.theoryPath = QP.i18n.theoryPath;
                            if(!$scope.theoryPath)
                            {
                                QP.config.canAskTheory = false;
                            }

                            $scope.config = QP.config;
                            $scope.QP = QP;
                            $scope.feedback = "";
                            $scope.plotdiv = "";
                            $scope.done = false;
                            $scope.helpVisible = false;
                            $scope.theoryVisible = false;
                            $scope.mainDiv = "col-sm-11";
                            $scope.helpDiv = "col-sm-1 notebook";

                            QP.createAttempt().then(function () {
                               // console.log("CREATE ATEMPT IS RESOLVED AND CALLED NEXT()");
                                $scope.next();
                            });
                        };
                        
                        var error = function(){
                             $scope.question = "Upps! There has been a problem loading this activity :-(";
                             $scope.done = true;
                                
                        };
                        
                        if(QP){
                            QP.setScope($scope).then(success, error);
                        } else{
                            error();
                            return;
                        }
                        
                        $scope.skip = function () {
                            QP._currentQuestion.isDone = true;
                            var cb = function() {
                                //Make sure we get rid of multistep
                                //QP._currentQuestion = null;                   //Dóna problemes si no es multistep....
                                $scope.next();
                            };
                            QP.closeQuestion().then(cb, cb);
                        };
                        
                        var activityFinished = function(){
                                $scope.done = true;
                                
                                if(!finished){
                                    QP.closeAttempt(true);
                                }
                                finished = true;
                                
                                var rating = $scope.activity? $scope.activity.rating : 0;
                               
                                var modalInstance = $uibModal.open({
                                templateUrl: 'app/shared/activity-dlg.html',
                                controller: ['$scope', function ($scope) {
                                    $scope.isGuest = idUser<0;
                                    $scope.ok = function () {
                                        modalInstance.close($scope.activity.rating);
                                    };
                                    $scope.activity = {rating: rating};
                                      
                                    $scope.updateRating = function(){
                                        if(!$scope.activity){
                                            return;
                                        }
                                        $http.post('/rest/activity/updaterating', {idActivity: QP.idActivity, idUser: idUser, rating: $scope.activity.rating});
                                    };
                                    $scope.title = $filter('translate')('ACTIVITY_END');
                                    $scope.msg = "<span style='color:00ff00'>"+$filter('translate')('YOU_WIN')+" <span class='picoin'>" + QP.getScore() + "</span></span>";
                                }],
                                size: 'xs'
                                });
                                
                                modalInstance.result.then(function(r){
                                    if($scope.$parent.activity){
                                        $scope.$parent.activity.rating = r;
                                    }
                                    else{
                                        return;
                                    }
                                    
                                    $state.go('home.activity', $scope.$parent.goParams);
                                    
                                });
                        };
                        
                        $scope.next = function (idx) {
                       
                            $scope.helpVisible = false;
                            $scope.theoryVisible = false;
                            
                            if ( (idx==null && !QP.hasNext()) || QP.counters.doneQ >= $scope.config.totalQ)
                            {
                                activityFinished();
                                return;
                            };
                              
                             
                            QP.create(idx).then(
                                function (qdef) {
                                console.log("CREATE HAS BEEN RESOLVED");
                                console.log(qdef);
                                
                                var kahoot = false;
                                if(qdef.parentQuestion.expr && qdef.parentQuestion.expr.format === "kahoot"){
                                    kahoot = true;
                                }
                                $scope.QP.config.canCheck = kahoot? false : canCheck;
                                $scope.$parent.questionof = (QP.counters.doneQ+1) + " / " + $scope.config.totalQ;
                                $scope.question = qdef.parentQuestion.headingHTML;
                                $scope.subquestion = qdef.formulationHTML;
                                $scope.views = qdef.views;
                                $scope.inputdiv = qdef.inputdiv;                             
                                $scope.stepHistory = qdef.parentQuestion.getStepHistory();
                                $scope.isMultiStep = qdef.parentQuestion._registeredSteps.length>1;
                                $scope.done = QP._currentQuestion.isDone;                        //Problem, never set QP.question.done until checked!!!
                                QP.config.level = qdef.parentQuestion.level;
                                $scope.$parent.questionWeight = qdef.addScore;
                                
                                
                                window.pw.app.DEBUG && console.log("Step history is "+$scope.stepHistory.length);
                            }, 
                            function(){
                                console.log("Activity has been rejected. Done!");
                                //Done! it has been rejected
                                activityFinished();
                            });
                        };
                        
                        $scope.check = function(value) {
                            $scope.done = true;
                            
                            QP.check(value).then(function (checkResult) {
                                
                                $scope.done = false;  
                                 
                                $scope.$parent.score = QP.getScore();
                                var validity = checkResult;
                                var checkFeedback = '';
                                if(typeof(validity)==='object')
                                {
                                    validity = checkResult.valid;
                                    checkFeedback = checkResult.feedback || '';
                                }
                                if (validity)
                                {
                                    $scope.feedback = "<span class='correct'>"+ $filter('translate')('POSITIVE_FEEDBACK') + " "+checkFeedback+"</span>";
                                    $timeout(function () {
                                        $scope.feedback = "";
                                        QP._currentQuestion.isDone = true;
                                        $scope.next();
                                    }, 1500);
                                }
                                else
                                {
                                    QP._currentQuestion.errorcount += 1;
                                    window.pw.app.DEBUG && console.log(QP._currentQuestion);
                                    $scope.useranswer = "";
                                    $scope.feedback = "<span class='incorrect'>"+ $filter('translate')('NEGATIVE_FEEDBACK') + " "+checkFeedback+"</span>";
                                    $timeout(function () {
                                        $scope.feedback = "";
                                        if(QP._currentQuestion.allowerrors!==null && QP._currentQuestion.errorcount>=QP._currentQuestion.allowerrors)
                                        {
                                            $scope.showSolutionDlg();
                                        }
                                    }, 1500);
                                }
                            }, function(){
                                $scope.done = false;                                
                            });
                        };
                        
                        $scope.showHelp = function () {
                            QP.registerAskHelp();
                            $scope.help = QP._currentQuestion.getCurrentStep().hint; //$sce.trustAsHtml(actdef.hint);
                            $scope.helpVisible = !$scope.helpVisible;
                            $scope.mainDiv = "col-sm-6";
                            $scope.helpDiv = "col-sm-6 notebook";
                        };
                        
                        $scope.showTheory = function () {
                            QP.registerAskTheory();
                            $scope.theoryVisible = !$scope.theoryVisible;
                        };
                        
                        $scope.showSolutionDlg = function () {
                            $scope.done = true;
                            QP._currentQuestion.isDone = true;
                            QP.registerAskSolution();
                            var fdb = QP._currentQuestion.getCurrentStep().feedback;
                            
                            var modalInstance = $uibModal.open({
                                templateUrl: 'app/shared/solution-dlg.html',
                                controller: ['$scope', function ($scope) {
                                    $scope.ok = function () {
                                        modalInstance.close();
                                    };
                                    var generated = false; 
                                    $scope.detailedAnswer = "";
                                    $scope.title = $filter('translate')('RIGHTANSWER');
                                    $scope.msg = QP._currentQuestion.getCurrentStep().answerHTML;
                                    //If feedback is present, then show it
                                    $scope.feedback = fdb;
                                    $scope.detail = function(){
                                        if(generated){
                                            return;
                                        }
                                        QP._currentQuestion.getCurrentStep().generateDetailedAnswer().then(
                                            function(r){
                                                 $scope.detailedAnswer = r.data.html;
                                                 generated = true;
                                            }
                                        );
                                    };
                                     
                                }],
                                size: fdb?'lg':'sm'
                            });
                            var callback = function () {
                                //Must close step as well and register to the brain as wrong answer
                                //TODO: CHECK before QP.closeQuestion(true)
                                QP.closeStep().then(function () {
                                    QP.counters.doneQ +=1;
                                    $scope.done = false;
                                    $scope.next();
                                });
                            };
                            modalInstance.result.then(callback, callback);
                        };
                        
                        
                        $scope.$on('$destroy', function () {
                            //Must determine whether the activity has finished or not
                            if(!finished)
                            {
                                QP.closeAttempt(false);
                            }
                           
                            $scope.$parent.showTitleInfo = false;                            
                            //Make sure we reset completely the question provider if new attempt is to be made
                            $scope.$parent.QP.destroy();
                        });
                  
                
                }]);
 
});