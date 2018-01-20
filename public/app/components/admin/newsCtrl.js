define([], function(){
"use strict";

window.pw.app.register.controller('newsCtrl', [ '$scope', '$rootScope', '$state', '$http', 'USER_ROLES', '$translate', 'Session', 'growl', 'PwTable', '$filter', 'Modals', 
function($scope, $rootScope, $state, $http, USER_ROLES, $translate, Session, growl, PwTable, $filter, Modals) {

    $scope.news = [];
    $scope.noWrapSlides = false;
 
    var update = function(){
        $http.post("/rest/news/list").then(function(r){
            
            r.data.forEach(function(e){
                if(e.expires){
                    e.expires = new Date(e.expires); 
                }
            });
            
            $scope.news = r.data;
        });
    };
    
    $scope.newsdelete = function(n){
        var okcb = function(){
            $http.post("/rest/news/del", {id: n.id}).then(function(d){
                update();
            });
        };
        Modals.confirmdlg("Confirm delete", "Voleu eliminar l'anunci  "+n.id+"?", okcb);        
    };
    
    $scope.newsEdit = function(n){
        n.edit = true;
        n.bck = {html: n.html, title: n.title};
    };
    
    $scope.newsCancelEdit = function(n){
        n.edit = false;
        n.html = n.bck.html;
        n.title = n.bck.title;
        delete n.bck;
    };
    
    $scope.newsUpdate = function(n){
        delete n.edit;
        delete n.bck; 
        
        $http.post("/rest/news/update", n).then(function(d){
            update();
        });
    };
    
    $scope.newscreate = function(){
        var n = {id:-1, html: "", title: ""};
        $http.post("/rest/news/update", n).then(function(d){
            update();
        });
    };
    
     $scope.onSort = function($item, $partFrom, $partTo, $indexFrom, $indexTo){
          if($scope.news.length<1){
              return;
          }
          var order = [];
          jQuery.each($scope.news, function(i, e){
              order.push({id: e.id, pos: i});              
          });
          
          $http.post("/rest/news/reorder", {order: order}).then(function(){
                update();
          });
          
        };

    
    update();
}]);

});