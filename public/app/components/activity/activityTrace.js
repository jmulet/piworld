window.pw.app.register.controller("ActivityTraceController", ["$scope", "$transition$", "$http", "Session", function($scope, $transition$, $http, Session){
        
        $scope.expanded = true;
        $scope.vmode = 0;
        $scope.allgroups = false;
        $scope.switchMode = function(){
            if(!$scope.homogeneous){
                $scope.vmode = 0;
            }
            $scope.vmode = ($scope.vmode + 1) % 2;
        };
        
        var user = Session.getUser();
        var allgroupsIds = "'"+$transition$.params().idGroup+"'";
        user.groups.forEach(function(e){
           if(e.idGroup){
               allgroupsIds += ", '"+e.idGroup+"'";
           }
        });
        
       $scope.reload = function(){
            $scope.loading = true;
            var bean = angular.copy($transition$.params());
            if($scope.allgroups){
               bean.allgroups = allgroupsIds;
           };

           $http.post("/rest/activity/trace", bean).then(function(r){
           var d  = r.data;
           $scope.trace = d.data;
           $scope.info = d.info;
           
           $scope.matrix = [];
           
           
           //check if it is an homogeneous set and construct matrix form
           $scope.homogeneous = true;
           
           
           //This matrix sets questions in rows and students in columns
           /*
           $scope.titles = ["Formulation", "Right Answer"];
           d.forEach(function(e){
               var i = 0;
               $scope.titles.push(e.fullname);       
               
               e.quizz.forEach(function(q){
                   
                   var row = $scope.matrix[i];
                   if(!row){
                       row = [];
                       $scope.matrix[i] = row;
                       row.push({text: q.formulation, clazz: ''});                 
                       row.push({text: q.rightAnswer, clazz: ''});                   
                   }
                   i +=1;
                   row.push({text: q.answer, clazz: q.isValid? 'success': 'danger'});
               });           
           });
           */
           
           //This matrix sets students in rows and questions in columns
           $scope.titles = [""];
           var first = [ {text: 'Q', clazz: ''} ];
           var second = [ {text: 'A', clazz: ''} ];
           $scope.matrix.push(first);
           $scope.matrix.push(second);

           var hasQ = false; 
            //first step, determine which is the whole set of questions
            var auxmap = {};
            d.data.forEach(function(e){
                var i = 0;            
                e.quizz.forEach(function(q){   
                    hasQ = true;
                   //Try to find q.formulation in first array, if not append it
                   var pos = -1;
                   jQuery.each(first, function(indx, x){
                       if(x.text === q.formulation){
                           pos = indx;
                           return true;
                       }
                   });
                   if(pos<0){
                       $scope.titles.push("Question "+(i+1));
                       first.push({text: q.formulation, clazz: ''});                 
                       second.push({text: q.rightAnswer, clazz: ''});                   
                       auxmap[q.formulation] = i;
                       i +=1;   
                   }                                                    
               });
            });
            
            
           //Now formulations from all users have been set, then fill it with user data
            var w = first.length;
            d.data.forEach(function(e){
               var i = 0;
               var row = new Array(w);
               row[0] = {text: e.fullname, clazz:''};
               $scope.matrix.push(row);
           
                
                   e.quizz.forEach(function(q){                  
                   var pos = auxmap[q.formulation] + 1;                   
                   row[pos] = {text: q.answer, clazz: q.isValid? 'success': 'danger'};
               });               
           });
          
          
           $scope.vmode = hasQ>0? ($scope.homogeneous? 1: 0) : 0;
           $scope.loading = false;
        });
        
        
    };
    
    $scope.filter = function(){
       $scope.reload();       
    };
    
    $scope.myFilter = function(bean) {
        if(!$scope.filterNames){
            return true;
        }       
        return (bean.fullname || "").toLowerCase().indexOf($scope.filterNames.toLowerCase())>=0;
    };
    
    $scope.myFilter2 = function(bean) {
        if(!$scope.filterNames){
            return true;
        }       
        return bean.text==="A" || bean.text==="Q" || (bean.text || "").toLowerCase().indexOf($scope.filterNames.toLowerCase())>=0;
    };
    
    $scope.reload();
        
}]);