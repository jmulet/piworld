/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

define([], function(){
   "use strict";
    window.pw.app.register.controller('ActivityReviewCtrl', ['$scope', '$http', '$state', '$transition$', 'Session',
        function($scope, $http, $state, $transition$, Session){
    
        $scope.review = [];
        $scope.attempt = {};
       
        var fetchReview = function(idAttempt){
            //Fetch attempt info
            $http.post('rest/activity/fetchreview', {idAttempt: idAttempt}).then(
                function(r){
                    var data = r.data;
                    $scope.review = data.activity;
                    $scope.attempt = data.attempt;
                }
            );
        };
    
    
        var idAttempt = $transition$.params().idAttempt;
        if(idAttempt<=0){
            //Fetch all attempts for the given assignment
            var bean = {idActivity: $transition$.params().idActivity, idAssignment: $transition$.params().idAssignment, idUser: Math.abs($transition$.params().idAttempt)};
            $http.post('rest/attempt/list', bean).then(function(r){
                 $scope.attempts = r.data;
                if(r.data.length){
                    fetchReview(r.data[0].id);
                }
            });             
        }
        else {        
            fetchReview(idAttempt);
        }

        $scope.close = function(){
                $state.go("home.activity", $scope.$parent.goParams);
        };
        
    }]);
});
