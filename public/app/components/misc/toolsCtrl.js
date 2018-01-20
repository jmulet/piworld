define([], function(){
   
    window.pw.app.register.controller('ToolsCtrl', ['$scope', function($scope){
            
           var elem  =  jQuery("#ggb5app");
           if(elem){
                elem.ready(function(){

                    elem.css("position", "absolute");
                    elem.css("top", "110px");
                    
                 });
            }
             
           $scope.$on("$destroy", function(){
               jQuery("#ggb5app").remove();
               jQuery("body").css("overflow", "auto");
           });
    }]);
    
});