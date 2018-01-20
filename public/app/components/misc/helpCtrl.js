define([], function(){
   
      
window.pw.app.register.controller('HelpCtrl', ['$http', '$scope', '$filter', 
    '$transition$', '$uibModal', 'growl', '$translate', 'Session', 'PwTable', '$location',  '$anchorScroll', 'USER_ROLES',
    function ($http, $scope, $filter, $transition$, $uibModal, growl, $translate,
                Session, PwTable, $location, $anchorScroll, USER_ROLES) {
         
        $scope.contentURL = "app/components/misc/help/home.html";
        Session.addCss("assets/libs/angular-highlight/styles/default.css");
         
        $scope.user = Session.getUser();
        $scope.USER_ROLES = USER_ROLES;
         
        $scope.scrollTo = function(id) {
            $location.hash(id);
            $anchorScroll();
        };
  
    }]);

});