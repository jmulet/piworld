
window.pw.app.register.controller("KahootReportCtrl", ["$scope", "$transition$", "$http", "growl", "Modals", function($scope, $transition$, $http, growl, Modals){
    
    $scope.idAssigment = $transition$.params().idAssigment;
    
    var reloadList = function(){
        $http.post("/rest/kahoot/list", {idAssigment: $scope.idAssignment}).then(function(r){        
            $scope.kahootList = r.data;        
        });
    };
    
    reloadList();
    
    
    $scope.onSelect = function(k){
        $scope.selectedKahoot = k;
        
        $http.post("/rest/kahoot/load", {kahootID: k.id}).then(function(r){
        
            var d = r.data;
            $scope.kahootReport = d;
            
            jQuery.each(d, function(i, r){
                r.fullname = shortenName(r.fullname);
                
                //Get rid of ghost empty entries
                if(i>0){
                    var nn = r.questionList.filter(function(e){
                        return Object.keys(e).length>0;
                    }).length;

                    if(!nn){
                        var index = d.indexOf(r);
                        d.splice(index, 1);
                    }
                }
            });
            
        });
    
    };
    
    
    $scope.delKahoot = function(k){
        
        var ok = function(){
            

            $http.post("/rest/kahoot/delete", {kahootID: k.id}).then(function(r){
               growl.success("Deleted "+r.data.affected+" database rows."); 
               reloadList();
               $scope.selectedKahoot = null;
               $scope.kahootReport = null;
            });
        
        };
        
        Modals.confirmdlgpwd("Confirm delete", "Segur que voleu eliminar el kahoot ID "+k.id+"?", ok);
        
    };
    
    var shortenName = function(name){
        var n = name;
        if(name.indexOf(","));
        {
            var list = name.split(",");
            if(list.length === 2){
                n = list[1].trim();
                var ipp = n.indexOf("(");
                if(ipp>=0){
                    n = n.substring(0, ipp);
                }
                n = n + " ";
                
                var nf = list[0].indexOf(" ");
                if(nf<=0){
                    nf=list[0].length;
                }
                n+= list[0].substring(0, nf);
            }
        }
        return n;
    };
}]);