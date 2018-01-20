//
// Student home dash
//
define([], function () {
    'use strict';

    window.pw.app.register.controller('HomeController', ['$scope', '$rootScope', '$state', '$http', 'MyCacheService', '$translate', 'USER_ROLES', '$uibModal', '$window',
        '$timeout', 'Auth', 'Session', 'growl', 'Modals', 
        function ($scope, $rootScope, $state, $http, MyCacheService, $translate, USER_ROLES, $uibModal, $window, $timeout, Auth, Session, growl, Modals) {

            var HomeCache = MyCacheService.getCache("HomeCache", false); //non-expirable

            $scope.leftClass = "col-md-3";
            $scope.mainClass = "col-md-9";          
            $scope.data = {};
            $scope.participants = [];
            $scope.chat = {input: '', dates: [], all: false};
            $scope.dc = "";
            $scope.orderByParticipants = "lastLogin";
            $scope.swithOrderByParticipants = function () {
                $scope.orderByParticipants === "lastLogin" ? $scope.orderByParticipants = "fullname" : $scope.orderByParticipants = "lastLogin";
            };

            $scope.user = Session.getUser();
            
            $scope.myGroups = $scope.user.groups;
            $scope.USER_ROLES = USER_ROLES;

            var isLarge = $("body").width() > 749;

            $scope.tgs = {welcome: isLarge, score: isLarge, recent: true, assignments: true, famouseqn: isLarge, quote: isLarge, problem: isLarge,
                groups: $scope.user.idRole === USER_ROLES.student && $scope.myGroups.length === 0, users: isLarge, chat: true, kahootID: 1};

            $scope.score = {pos: 3};
            $scope.error = false;

            $scope.datepicker = {dt: new Date(), opened: false};

            $scope.units = [];


            $scope.randomizeEqn = function (forceUpdate) {
                HomeCache.httpCache('eqn', 'oftheday/eqn', forceUpdate).then(function (rnd) {

                    if (rnd.url)
                    {
                        $scope.randomEqn = "<center><katex>" + rnd.eqn + "</katex><br>  <em><a href='" + rnd.url + "' target='_blank'>" + rnd.title + "</a></em></center>";
                    }
                    else
                    {
                        $scope.randomEqn = "<center><katex>" + rnd.eqn + "</katex><br>  <em>" + rnd.title + "</em></center>";
                    }
                });
            };

            $scope.randomizeQuote = function (forceUpdate) {
                HomeCache.httpCache('quote', 'oftheday/quote', forceUpdate).then(function (rnd) {

                    $scope.randomQuote = "<blockquote><p>" + rnd.quote + "</p><footer>" + rnd.author +
                            "</footer></blockquote>";
                });
            };

            //when the form is submitted
            $scope.logout = function () {
                Session.logout();
            };
            
            $scope.changeLanguage = function (langKey) {
                $translate.use(langKey);
                //Session.setLang(langKey);
                $rootScope.$broadcast("changeLang", langKey);
                $timeout(function () {
                    $scope.randomizeQuote();
                    $scope.randomizeEqn();
                }, 500);

            };
            $scope.randomizeEqn();
            $scope.randomizeQuote();

            $scope.go = function (route) {
                $state.go(route);
                if (route === 'home.activitysearch') {
                    $scope.reload();
                }
            };
            
 
            $scope.toggleMain = function (open) {
                if(typeof(open)==="undefined"){
                    $scope.mainExpanded = !$scope.mainExpanded;
                } else {
                    $scope.mainExpanded = open;
                }
                
                if ($scope.mainExpanded) {
                    $scope.leftClass = "hidden";
                    $scope.mainClass = "col-md-12";
                } else {
                    $scope.leftClass = "col-md-3";
                    $scope.mainClass = "col-md-9";
                }
            };

            $scope.toggleLeft = function () {
                $scope.leftExpanded = !$scope.leftExpanded;
                if ($scope.leftExpanded) {
                    $scope.leftClass = "col-md-12";
                    $scope.mainClass = "hidden";
                } else {
                    $scope.leftClass = "col-md-3";
                    $scope.mainClass = "col-md-9";
                }
            };
            
            
            $scope.guestHome = function(){
              $scope.toggleMain(false);
              $state.go('home.activitysearch', {reload: true});  
            };

            //Register Static File Access into the database
            $scope.registerSFA = function (event) {
                event.preventDefault();
                var url = event.target.href;
                $window.open(url, '_blank'); 
            };

            $scope.showAllIn = function (u) {
                u.showAll = true;
            };
            
            //$state.go("home.activitysearch");
            $rootScope.adjustPadding();
        }]);

});