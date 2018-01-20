//
// chat controller
//
define([], function(){
    'use strict';
    window.pw.app.register.controller('ChatController', [ '$scope',  'Modals', 'Session',  
    function($scope, Modals, Session ) {
            
        var user = Session.getUser();
         
        $scope.onlineusers = [];
        $scope.onlinerooms = [];
        
        var Socket = Session.getSocket();
        
        Socket.on("available", function(data){
                 $scope.onlineusers = data.users;
                $scope.onlinerooms = data.rooms;        
           
        });
        
        Socket.emit("requestAvailable", {schoolId: user.schoolId});
        
        $scope.createRoom = function(){
                var okcb = function(value){
                    Socket.emit("createRoom", {name: value, schoolId: user.schoolId});
                };
                Modals.inputdlg("Room name", "", "room", okcb);
        };
        
             

    } ]);

});